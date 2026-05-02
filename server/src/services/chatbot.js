import mongoose from 'mongoose';
import env from '../config/env.js';
import EmailLog from '../models/EmailLog.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import TrackingEvent from '../models/TrackingEvent.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Gather live stats for the authenticated user.
 */
const gatherUserData = async (userId) => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Core email counts ---
    const [totalSent, sentToday, sentThisWeek, sentThisMonth, totalFailed] = await Promise.all([
        EmailLog.countDocuments({ userId, status: 'sent' }),
        EmailLog.countDocuments({ userId, status: 'sent', sentAt: { $gte: todayStart } }),
        EmailLog.countDocuments({ userId, status: 'sent', sentAt: { $gte: weekStart } }),
        EmailLog.countDocuments({ userId, status: 'sent', sentAt: { $gte: monthStart } }),
        EmailLog.countDocuments({ userId, status: 'failed' }),
    ]);

    // --- Tracking events (opens, clicks, replies) ---
    // BUG FIX [BUG-1]: Use aggregation to avoid OOM when mapping thousands of tracking IDs
    const trackingAgg = await TrackingEvent.aggregate([
        {
            $lookup: {
                from: 'emaillogs',
                localField: 'trackingId',
                foreignField: 'trackingId',
                as: 'emailLog'
            }
        },
        { $unwind: '$emailLog' },
        { $match: { 'emailLog.userId': new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    const trackingCounts = trackingAgg.reduce((acc, curr) => {
        if (curr._id === 'open') acc.totalOpened = curr.count;
        if (curr._id === 'click') acc.totalClicked = curr.count;
        if (curr._id === 'reply') acc.totalReplied = curr.count;
        return acc;
    }, { totalOpened: 0, totalClicked: 0, totalReplied: 0 });

    const { totalOpened, totalClicked, totalReplied } = trackingCounts;

    // --- Campaigns ---
    const [totalCampaigns, activeCampaigns] = await Promise.all([
        Campaign.countDocuments({ userId }),
        Campaign.countDocuments({ userId, status: { $in: ['running', 'scheduled'] } }),
    ]);

    // --- Contacts ---
    const totalContacts = await Contact.countDocuments({ userId });

    // --- Follow-up sequence stats (from Campaign recipients) ---
    const campaignsWithSequences = await Campaign.find({ userId, 'followUps.0': { $exists: true } }).lean();
    let activeSequences = 0, completedSequences = 0, replyStoppedSequences = 0;
    for (const c of campaignsWithSequences) {
        for (const r of c.recipients || []) {
            if (r.sequenceStatus === 'active') activeSequences++;
            else if (r.sequenceStatus === 'completed') completedSequences++;
            else if (r.sequenceStatus === 'stopped_reply') replyStoppedSequences++;
        }
    }

    // --- Recent replies (last 5) ---
    // BUG FIX [BUG-1]: Use aggregation for recent replies
    const recentReplies = await TrackingEvent.aggregate([
        { $match: { type: 'reply' } },
        {
            $lookup: {
                from: 'emaillogs',
                localField: 'trackingId',
                foreignField: 'trackingId',
                as: 'emailLog'
            }
        },
        { $unwind: '$emailLog' },
        { $match: { 'emailLog.userId': new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
            $project: {
                email: '$emailLog.to',
                subject: '$emailLog.subject',
                date: '$createdAt',
                _id: 0
            }
        }
    ]);

    // --- Rates ---
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0';

    return {
        emails: { totalSent, sentToday, sentThisWeek, sentThisMonth, totalFailed },
        tracking: { totalOpened, totalClicked, totalReplied, openRate, clickRate, replyRate },
        campaigns: { total: totalCampaigns, active: activeCampaigns },
        contacts: { total: totalContacts },
        followUps: { active: activeSequences, completed: completedSequences, stoppedByReply: replyStoppedSequences },
        recentReplies,
    };
};

/**
 * Ask the chatbot a question, powered by Gemini + live user data.
 */
export const askChatbot = async (userId, question) => {
    if (!env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to your .env file.');
    }

    // 1. Gather live data
    const data = await gatherUserData(userId);

    // 2. Build prompt with system context + data + user question
    const prompt = `You are **AutoMindz Assistant**, a friendly and expert AI assistant built into the AutoMindz email outreach platform. You help users understand their outreach performance and guide them on using the system.

## Your Capabilities
- Answer questions about the user's email outreach stats (sent, opens, clicks, replies, bounces)
- Provide insights on campaign performance
- Explain how to use features (Compose, Campaigns, Follow-Ups, Email Finder, Analytics, Contacts)
- Give email marketing best practices and tips
- Help troubleshoot issues

## User's Live Data (as of right now)
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## Rules
- Always use the live data above when answering questions about stats or performance
- Be concise but helpful — use bullet points and bold numbers
- If the user asks about a feature, give step-by-step instructions
- If you don't know something specific to the system, say so honestly
- Keep responses under 300 words
- Use emoji sparingly for friendliness

## User's Question
${String(question).replace(/[\r\n]+/g, ' ').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 2000)}`;

    // 3. Call Gemini
    // SECURITY FIX [MEDIUM-4]: Move API key to headers
    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI service error: ${err}`);
    }

    const result = await response.json();
    const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response. Please try again.';

    return { answer, data };
};
