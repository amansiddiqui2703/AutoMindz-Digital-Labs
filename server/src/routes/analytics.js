import { Router } from 'express';
import auth from '../middleware/auth.js';
import Campaign from '../models/Campaign.js';
import EmailLog from '../models/EmailLog.js';
import TrackingEvent from '../models/TrackingEvent.js';
import GmailAccount from '../models/GmailAccount.js';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import authorize from '../middleware/authorize.js';
import asyncHandler from '../utils/asyncHandler.js';
import { cacheMiddleware } from '../utils/cache.js';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

// BUG FIX #28: Quick today-stats endpoint for ProfileDropdown real-time usage
router.get('/today-stats', auth, cacheMiddleware(60), asyncHandler(async (req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const emailsSentToday = await EmailLog.countDocuments({
        userId: req.user.id,
        status: 'sent',
        sentAt: { $gte: startOfDay },
    });
    res.json({ emailsSentToday });
}));

// Dashboard overview
router.get('/dashboard', auth, cacheMiddleware(300), asyncHandler(async (req, res) => {
    const userId = req.user.id;

        // Get basic counts
        const [
            totalCampaigns,
            activeCampaigns,
            totalSent,
            totalFailed,
            totalBounced,
            totalQueued,
            totalContacts,
            accounts,
            recentCampaigns,
            totalLinksBuilt,
        ] = await Promise.all([
            Campaign.countDocuments({ userId }),
            Campaign.countDocuments({ userId, status: 'running' }),
            EmailLog.countDocuments({ userId, status: 'sent' }),
            EmailLog.countDocuments({ userId, status: 'failed' }),
            EmailLog.countDocuments({ userId, status: 'bounced' }),
            EmailLog.countDocuments({ userId, status: 'queued' }),
            Contact.countDocuments({ userId }),
            GmailAccount.find({ userId }).select('email dailySentCount dailyLimit health totalSent'),
            Campaign.find({ userId }).sort({ updatedAt: -1 }).limit(10).select('name status stats updatedAt createdAt'),
            Contact.countDocuments({ userId, pipelineStage: 'Link Secured' }),
        ]);

        // Get user's tracking IDs from their email logs
        const userEmailLogs = await EmailLog.find({ userId }).select('trackingId to subject sentAt status').lean();
        const userTrackingIds = userEmailLogs.map(l => l.trackingId).filter(Boolean);

        let totalOpened = 0;
        let totalClicked = 0;
        let totalReplied = 0;
        let totalUnsubscribed = 0;

        if (userTrackingIds.length > 0) {
            [totalOpened, totalClicked, totalReplied, totalUnsubscribed] = await Promise.all([
                TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'open' }),
                TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'click' }),
                TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'reply' }),
                TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'unsubscribe' }),
            ]);
        }

        // --- Daily timeline (last 30 days) ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const dailySent = await EmailLog.aggregate([
            { $match: { userId: EmailLog.schema.path('userId').cast(userId), sentAt: { $gte: thirtyDaysAgo }, status: 'sent' } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        let dailyEvents = [];
        if (userTrackingIds.length > 0) {
            dailyEvents = await TrackingEvent.aggregate([
                { $match: { trackingId: { $in: userTrackingIds }, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, type: '$type' }, count: { $sum: 1 } } },
                { $sort: { '_id.date': 1 } },
            ]);
        }

        // Build timeline array
        const timelineMap = {};
        for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().slice(0, 10);
            timelineMap[key] = { date: key, sent: 0, opened: 0, clicked: 0, bounced: 0, replied: 0 };
        }
        for (const s of dailySent) {
            if (timelineMap[s._id]) timelineMap[s._id].sent = s.count;
        }
        for (const e of dailyEvents) {
            if (timelineMap[e._id.date]) {
                const type = e._id.type;
                if (type === 'open') timelineMap[e._id.date].opened = e.count;
                else if (type === 'click') timelineMap[e._id.date].clicked = e.count;
                else if (type === 'reply') timelineMap[e._id.date].replied = e.count;
                else if (type === 'bounce') timelineMap[e._id.date].bounced = e.count;
            }
        }
        const timeline = Object.values(timelineMap);

        // --- Recent activity (last 25 tracking events) ---
        let recentActivity = [];
        if (userTrackingIds.length > 0) {
            const recentEvents = await TrackingEvent.find({ trackingId: { $in: userTrackingIds } })
                .sort({ createdAt: -1 })
                .limit(25)
                .lean();

            const trackingMap = {};
            for (const log of userEmailLogs) {
                if (log.trackingId) trackingMap[log.trackingId] = { to: log.to, subject: log.subject };
            }

            recentActivity = recentEvents.map(e => ({
                type: e.type,
                email: trackingMap[e.trackingId]?.to || 'Unknown',
                subject: trackingMap[e.trackingId]?.subject || '',
                url: e.url || null,
                timestamp: e.createdAt,
                ip: e.ip,
                userAgent: e.userAgent,
            }));
        }

        // Delivery breakdown
        const deliveryStats = { queued: totalQueued, sent: totalSent, failed: totalFailed, bounced: totalBounced };

        res.json({
            overview: {
                totalCampaigns, activeCampaigns, totalSent, totalFailed, totalBounced,
                totalOpened, totalClicked, totalReplied, totalUnsubscribed, totalContacts,
                totalLinksBuilt,
                openRate: totalSent ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
                clickRate: totalSent ? ((totalClicked / totalSent) * 100).toFixed(1) : '0',
                bounceRate: totalSent ? ((totalBounced / totalSent) * 100).toFixed(1) : '0',
                replyRate: totalSent ? ((totalReplied / totalSent) * 100).toFixed(1) : '0',
                unsubRate: totalSent ? ((totalUnsubscribed / totalSent) * 100).toFixed(1) : '0',
            },
            timeline, deliveryStats, recentActivity, accounts, recentCampaigns,
        });
}));

// ==========================================
// Team Productivity Reports (Admin/Manager only)
// ==========================================
router.get('/team', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        // Find all users (agents/managers/admins)
        // Note: In a true multi-tenant system, filter by organizationId. 
        // For now, we fetch all users.
        const users = await User.find({}).select('name email role').lean();
        
        const teamStats = await Promise.all(users.map(async (u) => {
            // Get links built (conversions) for this user
            const linksBuilt = await Contact.countDocuments({ userId: u._id, pipelineStage: 'Link Secured' });
            
            // Get email sending stats for this user
            const [sent, failed, bounced] = await Promise.all([
                EmailLog.countDocuments({ userId: u._id, status: 'sent' }),
                EmailLog.countDocuments({ userId: u._id, status: 'failed' }),
                EmailLog.countDocuments({ userId: u._id, status: 'bounced' })
            ]);

            // Get tracking stats
            const userEmailLogs = await EmailLog.find({ userId: u._id }).select('trackingId').lean();
            const userTrackingIds = userEmailLogs.map(l => l.trackingId).filter(Boolean);
            
            let opens = 0, clicks = 0, replies = 0;
            if (userTrackingIds.length > 0) {
                [opens, clicks, replies] = await Promise.all([
                    TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'open' }),
                    TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'click' }),
                    TrackingEvent.countDocuments({ trackingId: { $in: userTrackingIds }, type: 'reply' })
                ]);
            }

            return {
                userId: u._id,
                name: u.name || 'Unknown',
                email: u.email,
                role: u.role,
                metrics: {
                    sent,
                    failed,
                    bounced,
                    opens,
                    clicks,
                    replies,
                    linksBuilt,
                    openRate: sent > 0 ? ((opens / sent) * 100).toFixed(1) : '0.0',
                    replyRate: sent > 0 ? ((replies / sent) * 100).toFixed(1) : '0.0',
                    conversionRate: sent > 0 ? ((linksBuilt / sent) * 100).toFixed(1) : '0.0'
                }
            };
        }));

        res.json({ team: teamStats });
    } catch (error) {
        console.error('Team analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch team analytics' });
    }
});

// ==========================================
// Export analytics data (CSV)
// ==========================================
router.get('/export', auth, async (req, res) => {
    try {
        const logs = await EmailLog.find({ userId: req.user.id })
            .select('to subject status sentAt trackingId isFollowUp followUpIndex')
            .lean();

        const trackingIds = logs.map(l => l.trackingId).filter(Boolean);
        const events = await TrackingEvent.find({ trackingId: { $in: trackingIds } }).lean();

        const eventsByTrackingId = {};
        for (const e of events) {
            if (!eventsByTrackingId[e.trackingId]) eventsByTrackingId[e.trackingId] = { opens: 0, clicks: 0, replies: 0, bounces: 0 };
            if (e.type === 'open') eventsByTrackingId[e.trackingId].opens++;
            if (e.type === 'click') eventsByTrackingId[e.trackingId].clicks++;
            if (e.type === 'reply') eventsByTrackingId[e.trackingId].replies++;
            if (e.type === 'bounce') eventsByTrackingId[e.trackingId].bounces++;
        }

        const csvRows = ['To,Subject,Status,SentAt,IsFollowUp,FollowUpIndex,Opens,Clicks,Replies,Bounces'];
        for (const log of logs) {
            const tracking = eventsByTrackingId[log.trackingId] || { opens: 0, clicks: 0, replies: 0, bounces: 0 };
            const row = [
                `"${log.to || ''}"`,
                `"${(log.subject || '').replace(/"/g, '""')}"`,
                log.status,
                log.sentAt ? log.sentAt.toISOString() : '',
                log.isFollowUp || false,
                log.followUpIndex || 0,
                tracking.opens,
                tracking.clicks,
                tracking.replies,
                tracking.bounces
            ];
            csvRows.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics_export.csv');
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export analytics' });
    }
});

// ==========================================
// Sent emails log with tracking details
// ==========================================
router.get('/emails', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 50, daysAgo, unrepliedOnly } = req.query;

        let query = { userId };

        if (daysAgo) {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(daysAgo));
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setHours(23, 59, 59, 999);
            query.sentAt = { $gte: date, $lte: nextDate };
        }

        const emailLogs = await EmailLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Get all tracking events for these emails
        const trackingIds = emailLogs.map(l => l.trackingId).filter(Boolean);
        const events = await TrackingEvent.find({ trackingId: { $in: trackingIds } }).lean();

        // Group events by tracking ID
        const eventsByTrackingId = {};
        for (const e of events) {
            if (!eventsByTrackingId[e.trackingId]) eventsByTrackingId[e.trackingId] = [];
            eventsByTrackingId[e.trackingId].push({
                type: e.type,
                url: e.url,
                ip: e.ip,
                userAgent: e.userAgent,
                timestamp: e.createdAt,
            });
        }

        // Enrich email logs with tracking data
        let enrichedLogs = emailLogs.map(log => ({
            _id: log._id,
            to: log.to,
            subject: log.subject,
            status: log.status,
            trackingId: log.trackingId,
            sentAt: log.sentAt,
            createdAt: log.createdAt,
            error: log.error,
            isFollowUp: log.isFollowUp,
            followUpIndex: log.followUpIndex,
            events: eventsByTrackingId[log.trackingId] || [],
            opens: (eventsByTrackingId[log.trackingId] || []).filter(e => e.type === 'open').length,
            clicks: (eventsByTrackingId[log.trackingId] || []).filter(e => e.type === 'click').length,
            replies: (eventsByTrackingId[log.trackingId] || []).filter(e => e.type === 'reply').length,
            bounces: (eventsByTrackingId[log.trackingId] || []).filter(e => e.type === 'bounce').length,
            unsubscribed: (eventsByTrackingId[log.trackingId] || []).filter(e => e.type === 'unsubscribe').length > 0,
        }));

        if (unrepliedOnly === 'true') {
            enrichedLogs = enrichedLogs.filter(log => log.replies === 0 && log.bounces === 0 && log.status === 'sent');
        }

        // We count total after filter if possible, or just send original total
        let total = await EmailLog.countDocuments(query);
        if (unrepliedOnly === 'true' && !daysAgo) { // If global unreplied we can't easily count total accurately here, but it's fine for simple UI
            total = enrichedLogs.length; // Approximate for this page
        }

        res.json({ emails: enrichedLogs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Sent emails error:', error);
        res.status(500).json({ error: 'Failed to fetch sent emails' });
    }
});

// ==========================================
// Simulate tracking events (for local testing)
// ==========================================
router.post('/simulate', auth, async (req, res) => {
    try {
        const { trackingId, type } = req.body;
        if (!trackingId || !type) {
            return res.status(400).json({ error: 'trackingId and type are required' });
        }

        // Verify this tracking ID belongs to the user
        const emailLog = await EmailLog.findOne({ trackingId, userId: req.user.id });
        if (!emailLog) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const validTypes = ['open', 'click', 'reply', 'bounce', 'unsubscribe'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }

        // Create the tracking event
        const event = new TrackingEvent({
            trackingId,
            type,
            ip: req.ip || '127.0.0.1',
            userAgent: 'Simulated Event (local test)',
            url: type === 'click' ? 'https://example.com/simulated-click' : undefined,
        });
        await event.save();

        // Update campaign stats if applicable
        if (emailLog.campaignId) {
            const statField = type === 'open' ? 'opened' : type === 'click' ? 'clicked' : type === 'reply' ? 'replied' : type === 'bounce' ? 'bounced' : type === 'unsubscribe' ? 'unsubscribed' : null;
            if (statField) {
                await Campaign.findByIdAndUpdate(emailLog.campaignId, { $inc: { [`stats.${statField}`]: 1 } });
            }
        }

        // If bounce, update email log status
        if (type === 'bounce') {
            emailLog.status = 'bounced';
            await emailLog.save();
        }

        res.json({ message: `Simulated '${type}' event for email to ${emailLog.to}`, event: { type, trackingId, timestamp: event.createdAt } });
    } catch (error) {
        console.error('Simulate tracking error:', error);
        res.status(500).json({ error: 'Failed to simulate tracking event' });
    }
});

// Campaign analytics
router.get('/campaign/:id', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        const logs = await EmailLog.find({ campaignId: campaign._id }).lean();
        const trackingIds = logs.map(l => l.trackingId).filter(Boolean);
        const events = await TrackingEvent.find({ trackingId: { $in: trackingIds } }).lean();

        const eventsByType = events.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
        }, {});

        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const dailyEvents = await TrackingEvent.aggregate([
            { $match: { trackingId: { $in: trackingIds }, createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, type: '$type' }, count: { $sum: 1 } } },
        ]);

        res.json({ stats: campaign.stats, events: eventsByType, timeline: dailyEvents, totalLogs: logs.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch campaign analytics' });
    }
});

// Individual recipient timeline
router.get('/recipient/:trackingId', auth, async (req, res) => {
    try {
        const events = await TrackingEvent.find({ trackingId: req.params.trackingId }).sort({ createdAt: 1 });
        const emailLog = await EmailLog.findOne({ trackingId: req.params.trackingId });
        res.json({ emailLog, events });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipient activity' });
    }
});

// ==========================================
// Campaign stat details — get contact details for a stat type
// Returns list of contacts who opened/clicked/replied/bounced/etc
// ==========================================
router.get('/campaign/:id/stat-details/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['sent', 'opened', 'clicked', 'replied', 'failed', 'bounced', 'unsubscribed'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid stat type. Must be one of: ${validTypes.join(', ')}` });
        }

        const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        // For sent/failed/bounced — just query EmailLog by status
        if (['sent', 'failed', 'bounced'].includes(type)) {
            const statusMap = { sent: 'sent', failed: 'failed', bounced: 'bounced' };
            const logs = await EmailLog.find({ campaignId: campaign._id, status: statusMap[type] })
                .select('to contactId sentAt subject status')
                .lean();

            // Enrich with contact details
            const contactIds = logs.map(l => l.contactId).filter(Boolean);
            const contacts = await Contact.find({ _id: { $in: contactIds } })
                .select('email name company website phone linkedIn tags source enrichment')
                .lean();
            const contactMap = {};
            for (const c of contacts) { contactMap[c._id.toString()] = c; }

            const details = logs.map(log => {
                const contact = log.contactId ? contactMap[log.contactId.toString()] : null;
                return {
                    email: log.to,
                    name: contact?.name || '',
                    company: contact?.company || '',
                    website: contact?.website || '',
                    phone: contact?.phone || '',
                    linkedIn: contact?.linkedIn || '',
                    tags: contact?.tags || [],
                    source: contact?.source || '',
                    domainAuthority: contact?.enrichment?.domainAuthority || null,
                    domainRating: contact?.enrichment?.domainRating || null,
                    monthlyTraffic: contact?.enrichment?.monthlyTraffic || null,
                    sentAt: log.sentAt,
                    subject: log.subject,
                    contactId: log.contactId,
                };
            });

            return res.json({ type, count: details.length, details });
        }

        // For opened/clicked/replied/unsubscribed — query TrackingEvent
        const eventTypeMap = { opened: 'open', clicked: 'click', replied: 'reply', unsubscribed: 'unsubscribe' };
        const eventType = eventTypeMap[type];

        const logs = await EmailLog.find({ campaignId: campaign._id }).select('trackingId to contactId sentAt subject').lean();
        const trackingIds = logs.map(l => l.trackingId).filter(Boolean);

        // Find all tracking events of this type
        const events = await TrackingEvent.find({ trackingId: { $in: trackingIds }, type: eventType })
            .sort({ createdAt: -1 })
            .lean();

        // Get unique tracking IDs that have this event
        const eventTrackingIds = [...new Set(events.map(e => e.trackingId))];

        // Map tracking IDs back to email logs
        const trackingToLog = {};
        for (const log of logs) {
            if (log.trackingId) trackingToLog[log.trackingId] = log;
        }

        // Enrich with contact details
        const contactIds = logs.map(l => l.contactId).filter(Boolean);
        const contacts = await Contact.find({ _id: { $in: contactIds } })
            .select('email name company website phone linkedIn tags source enrichment')
            .lean();
        const contactMap = {};
        for (const c of contacts) { contactMap[c._id.toString()] = c; }

        const details = eventTrackingIds.map(tid => {
            const log = trackingToLog[tid];
            if (!log) return null;
            const contact = log.contactId ? contactMap[log.contactId.toString()] : null;
            const eventInstances = events.filter(e => e.trackingId === tid);
            return {
                email: log.to,
                name: contact?.name || '',
                company: contact?.company || '',
                website: contact?.website || '',
                phone: contact?.phone || '',
                linkedIn: contact?.linkedIn || '',
                tags: contact?.tags || [],
                source: contact?.source || '',
                domainAuthority: contact?.enrichment?.domainAuthority || null,
                domainRating: contact?.enrichment?.domainRating || null,
                monthlyTraffic: contact?.enrichment?.monthlyTraffic || null,
                sentAt: log.sentAt,
                subject: log.subject,
                contactId: log.contactId,
                eventCount: eventInstances.length,
                firstEventAt: eventInstances[eventInstances.length - 1]?.createdAt,
                lastEventAt: eventInstances[0]?.createdAt,
                ip: eventInstances[0]?.ip,
                userAgent: eventInstances[0]?.userAgent,
            };
        }).filter(Boolean);

        res.json({ type, count: details.length, details });
    } catch (error) {
        console.error('Stat details error:', error);
        res.status(500).json({ error: 'Failed to fetch stat details' });
    }
});

// ==========================================
// Dashboard stat details — aggregate contact details across ALL campaigns for a stat type
// ==========================================
router.get('/dashboard/stat-details/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['sent', 'opened', 'clicked', 'replied', 'failed', 'bounced', 'unsubscribed'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid stat type. Must be one of: ${validTypes.join(', ')}` });
        }

        const campaigns = await Campaign.find({ userId: req.user.id }).select('_id').lean();
        const campaignIds = campaigns.map(c => c._id);

        if (['sent', 'failed', 'bounced'].includes(type)) {
            const statusMap = { sent: 'sent', failed: 'failed', bounced: 'bounced' };
            const logs = await EmailLog.find({ campaignId: { $in: campaignIds }, status: statusMap[type] })
                .select('to contactId sentAt subject status')
                .sort({ sentAt: -1 })
                .limit(500) // Limit to latest 500 for performance
                .lean();

            const contactIds = logs.map(l => l.contactId).filter(Boolean);
            const contacts = await Contact.find({ _id: { $in: contactIds } })
                .select('email name company website phone linkedIn tags source enrichment')
                .lean();
            const contactMap = {};
            for (const c of contacts) { contactMap[c._id.toString()] = c; }

            const details = logs.map(log => {
                const contact = log.contactId ? contactMap[log.contactId.toString()] : null;
                return {
                    email: log.to,
                    name: contact?.name || '',
                    company: contact?.company || '',
                    website: contact?.website || '',
                    phone: contact?.phone || '',
                    linkedIn: contact?.linkedIn || '',
                    tags: contact?.tags || [],
                    source: contact?.source || '',
                    domainAuthority: contact?.enrichment?.domainAuthority || null,
                    domainRating: contact?.enrichment?.domainRating || null,
                    monthlyTraffic: contact?.enrichment?.monthlyTraffic || null,
                    sentAt: log.sentAt,
                    subject: log.subject,
                    contactId: log.contactId,
                };
            });

            return res.json({ type, count: details.length, details });
        }

        const eventTypeMap = { opened: 'open', clicked: 'click', replied: 'reply', unsubscribed: 'unsubscribe' };
        const eventType = eventTypeMap[type];

        const logs = await EmailLog.find({ campaignId: { $in: campaignIds } })
            .select('trackingId to contactId sentAt subject').lean();
        const trackingIds = logs.map(l => l.trackingId).filter(Boolean);

        const events = await TrackingEvent.find({ trackingId: { $in: trackingIds }, type: eventType })
            .sort({ createdAt: -1 })
            .lean();

        // Get unique tracking IDs that have this event (limit to first 500 unique)
        const eventTrackingIds = [...new Set(events.map(e => e.trackingId))].slice(0, 500);

        const trackingToLog = {};
        for (const log of logs) {
            if (log.trackingId) trackingToLog[log.trackingId] = log;
        }

        const contactIds = eventTrackingIds.map(tid => trackingToLog[tid]?.contactId).filter(Boolean);
        const contacts = await Contact.find({ _id: { $in: contactIds } })
            .select('email name company website phone linkedIn tags source enrichment')
            .lean();
        const contactMap = {};
        for (const c of contacts) { contactMap[c._id.toString()] = c; }

        const details = eventTrackingIds.map(tid => {
            const log = trackingToLog[tid];
            if (!log) return null;
            const contact = log.contactId ? contactMap[log.contactId.toString()] : null;
            const eventInstances = events.filter(e => e.trackingId === tid);
            return {
                email: log.to,
                name: contact?.name || '',
                company: contact?.company || '',
                website: contact?.website || '',
                phone: contact?.phone || '',
                linkedIn: contact?.linkedIn || '',
                tags: contact?.tags || [],
                source: contact?.source || '',
                domainAuthority: contact?.enrichment?.domainAuthority || null,
                domainRating: contact?.enrichment?.domainRating || null,
                monthlyTraffic: contact?.enrichment?.monthlyTraffic || null,
                sentAt: log.sentAt,
                subject: log.subject,
                contactId: log.contactId,
                eventCount: eventInstances.length,
                firstEventAt: eventInstances[eventInstances.length - 1]?.createdAt,
                lastEventAt: eventInstances[0]?.createdAt,
            };
        }).filter(Boolean);

        res.json({ type, count: details.length, details });
    } catch (error) {
        console.error('Dashboard Stat details error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stat details' });
    }
});

export default router;
