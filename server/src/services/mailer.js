import { Resend } from 'resend';
import env from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY || 're_mock');

const SUPPORT_FROM = env.EMAIL_FROM_SUPPORT || `"AutoMindz Support" <support@automindz.com>`;
const ONBOARDING_FROM = env.EMAIL_FROM_ONBOARDING || `"AutoMindz Team" <onboarding@automindz.com>`;

const escapeHtml = (input = '') => {
    return String(input)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
};

const renderEmailLayout = ({ heading, preheader, bodyHtml, ctaText, ctaUrl }) => {
    const safeHeading = escapeHtml(heading);
    const safePreheader = escapeHtml(preheader || '');
    const ctaButton = ctaText && ctaUrl
        ? `<div style="margin: 24px 0;">
                <a href="${ctaUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;font-weight:700;">
                    ${escapeHtml(ctaText)}
                </a>
            </div>`
        : '';

    return `
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
            ${safePreheader}
        </div>
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f8fafc;padding:24px 12px;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                <div style="padding:18px 22px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;">
                    <div style="font-size:18px;font-weight:800;letter-spacing:0.2px;">AutoMindz</div>
                </div>
                <div style="padding:22px;">
                    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.2;color:#0f172a;">${safeHeading}</h1>
                    <div style="font-size:14px;line-height:1.6;color:#334155;">
                        ${bodyHtml}
                        ${ctaButton}
                        <p style="margin:22px 0 0;color:#64748b;font-size:12px;">
                            If you did not request this, you can safely ignore this email.
                        </p>
                    </div>
                </div>
                <div style="padding:14px 22px;background:#f1f5f9;color:#64748b;font-size:12px;">
                    <div>AutoMindz Support</div>
                </div>
            </div>
        </div>
    `;
};

const sendEmail = async ({ from, to, subject, html }) => {
    try {
        if (env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_mock') {
            const info = await resend.emails.send({ from, to, subject, html });
            console.log('Message sent: %s', info?.data?.id);
            return true;
        }

        // Dev fallback: print the email to the console so you can copy the verify/reset links.
        {
            console.log('\n=============================================');
            console.log('[DEVELOPMENT MODE - EMAILS LOGGED TO CONSOLE]');
            console.log(`From: ${from}`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html}`);
            console.log('=============================================\n');
            return true;
        }
    } catch (err) {
        console.error('Failed to send email:', err);
        return false;
    }
};

export const sendAuthEmail = async (to, subject, html) => {
    return sendEmail({ from: SUPPORT_FROM, to, subject, html });
};

export const sendVerificationEmail = async (to, name, verifyUrl) => {
    const subject = 'Welcome to AutoMindz - verify your email';
    const html = renderEmailLayout({
        heading: 'Verify your email to get started',
        preheader: 'Confirm your email to activate your AutoMindz account.',
        bodyHtml: `
            <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 12px;">
                Thanks for signing up for AutoMindz. Please verify your email address to activate your account.
            </p>
        `,
        ctaText: 'Verify email',
        ctaUrl: verifyUrl,
    });

    return sendAuthEmail(to, subject, html);
};

export const sendPasswordResetEmail = async (to, name, resetUrl) => {
    const subject = 'Reset your AutoMindz password';
    const html = renderEmailLayout({
        heading: 'Reset your password',
        preheader: 'Use the link below to reset your AutoMindz password.',
        bodyHtml: `
            <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 12px;">
                We received a request to reset your password. Click the button below to set a new password.
            </p>
            <p style="margin:0 0 12px;">
                For security, this link expires in 1 hour.
            </p>
        `,
        ctaText: 'Reset password',
        ctaUrl: resetUrl,
    });

    return sendAuthEmail(to, subject, html);
};

export const sendWelcomeEmail = async (to, name) => {
    const subject = `Welcome to AutoMindz, ${name}!`;
    const appUrl = env.APP_URL || 'http://localhost:5173';
    const html = renderEmailLayout({
        heading: 'Welcome to AutoMindz!',
        preheader: 'Your AutoMindz account is ready.',
        bodyHtml: `
            <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 12px;">
                Your account has been created successfully. You can now log in and start setting up your outreach.
            </p>
            <ul style="margin:0 0 12px;padding-left:18px;">
                <li>Connect your first Gmail account</li>
                <li>Create your first campaign</li>
                <li>Track opens and clicks in Analytics</li>
            </ul>
        `,
        ctaText: 'Open AutoMindz',
        ctaUrl: appUrl,
    });

    return sendEmail({ from: ONBOARDING_FROM, to, subject, html });
};
