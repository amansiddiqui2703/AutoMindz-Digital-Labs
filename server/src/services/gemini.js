import env from '../config/env.js';

const getGeminiUrl = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

const MAX_PROMPT_INPUT_LENGTH = 5000;

/**
 * Sanitize user-supplied prompt input: strip newlines/control chars, limit length.
 */
const sanitizePromptInput = (input, maxLen = MAX_PROMPT_INPUT_LENGTH) => {
    if (!input) return '';
    return String(input)
        .replace(/[^\r\n\x20-\x7e]/g, '') // Keep space, printable ASCII, and newlines only
        .trim()
        .slice(0, maxLen);
};

const callGemini = async (prompt, maxRetries = 3) => {
    if (!env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await fetch(getGeminiUrl(), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
            });

            if (!response.ok) {
                // If Rate Limit or Service Unavailable, throw specifically to trigger retry
                if (response.status === 429 || response.status === 503) {
                    const errObj = new Error(`Retryable API Error: ${response.status}`);
                    errObj.status = response.status;
                    errObj.response = response;
                    throw errObj;
                }

                let errMessage = `Gemini API error (${response.status})`;
                try {
                    const errData = await response.json();
                    if (errData.error?.message) {
                        errMessage = errData.error.message;
                    }
                } catch { /* Fallback */ }
                // Non-retryable error
                throw new Error(errMessage);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries || (error.status !== 429 && error.status !== 503)) {
                if (error.status === 429) {
                    throw new Error(`AI Rate Limit Exceeded: Your Google Gemini API free tier quota is full. Please check your Google AI Studio billing/plan or wait a few minutes before trying again.`);
                }
                throw error;
            }
            
            // Exponential backoff: 1s, 2s, 4s...
            const delay = Math.pow(2, attempt - 1) * 1000 + (Math.random() * 500);
            console.warn(`[AI Service] API overloaded (${error.status}). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
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
