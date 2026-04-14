import env from '../config/env.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const MAX_PROMPT_INPUT_LENGTH = 5000;

/**
 * Sanitize user-supplied prompt input: strip newlines/control chars, limit length.
 */
const sanitizePromptInput = (input, maxLen = MAX_PROMPT_INPUT_LENGTH) => {
    if (!input) return '';
    return String(input)
        .replace(/[\r\n]+/g, ' ')
        .replace(/[\x00-\x1f\x7f]/g, '')
        .trim()
        .slice(0, maxLen);
};

const callGemini = async (prompt) => {
    if (!env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export const generateColdEmail = async ({ purpose, recipientInfo, tone, senderInfo }) => {
    const prompt = `Write a professional cold outreach email.
Purpose: ${sanitizePromptInput(purpose)}
Recipient info: ${sanitizePromptInput(recipientInfo) || 'Unknown'}
Tone: ${sanitizePromptInput(tone) || 'professional'}
Sender info: ${sanitizePromptInput(senderInfo) || 'Not provided'}

Write ONLY the email body (no subject line). Use a compelling opening, clear value proposition, and a call to action. Keep it concise (under 200 words).`;
    return callGemini(prompt);
};

export const rewriteEmail = async ({ content, instructions }) => {
    const prompt = `Rewrite the following email. ${sanitizePromptInput(instructions) || 'Improve clarity and impact.'}

Original email:
${sanitizePromptInput(content)}

Provide ONLY the rewritten email body.`;
    return callGemini(prompt);
};

export const improveTone = async ({ content, tone }) => {
    const prompt = `Rewrite this email in a ${sanitizePromptInput(tone)} tone. Keep the same message but adjust the writing style.

Original:
${sanitizePromptInput(content)}

Provide ONLY the rewritten email.`;
    return callGemini(prompt);
};

export const generateSubjectLines = async ({ content, count }) => {
    const prompt = `Generate ${parseInt(count) || 5} compelling email subject lines for this email. The subject lines should maximize open rates while being honest and not spam-like.

Email content:
${sanitizePromptInput(content)}

Return ONLY a numbered list of subject lines.`;
    return callGemini(prompt);
};

export const personalizeEmail = async ({ template, recipientData }) => {
    const prompt = `Personalize this email template for the specific recipient. Add natural personalization touchpoints based on the recipient data.

Template:
${sanitizePromptInput(template)}

Recipient data:
${sanitizePromptInput(JSON.stringify(recipientData))}

Provide ONLY the personalized email body.`;
    return callGemini(prompt);
};

export const generateFollowUp = async ({ originalEmail, followUpNumber, context }) => {
    const prompt = `Write follow-up email #${parseInt(followUpNumber) || 1} for the email below. ${sanitizePromptInput(context) || ''}

The follow-up should:
- Reference the original email naturally
- Add new value or angle
- Be shorter than the original
- Have a clear CTA

Original email:
${sanitizePromptInput(originalEmail)}

Provide ONLY the follow-up email body.`;
    return callGemini(prompt);
};

export const spamScoreCheck = async ({ subject, content }) => {
    const prompt = `Analyze this email for spam risk. Score from 0-10 (0 = safe, 10 = definitely spam). List specific issues and suggestions.

Subject: ${sanitizePromptInput(subject)}
Body:
${sanitizePromptInput(content)}

Format your response as:
SCORE: [number]
ISSUES:
- [issue 1]
- [issue 2]
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]`;
    return callGemini(prompt);
};
