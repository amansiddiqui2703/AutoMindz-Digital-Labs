import { Resend } from 'resend';
import env from '../config/env.js';

// Setup basic transporter. If SMTP credentials aren't provided, it logs the email to console (good for dev).
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');

export const sendAuthEmail = async (to, subject, html) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.log('\n=============================================');
            console.log(`[DEVELOPMENT MODE - NO RESEND API KEY CONFIGURED]`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html}`);
            console.log('=============================================\n');
            return true; // Pretend it sent for dev
        }

        const info = await resend.emails.send({
            from: `"AutoMindz Support" <support@automindz.com>`,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info?.data?.id);
        return true;
    } catch (err) {
        console.error('Failed to send auth email:', err);
        return false;
    }
};

export const sendWelcomeEmail = async (to, name) => {
    const subject = `Welcome to AutoMindz, ${name}! 🚀`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Welcome to AutoMindz!</h2>
            <p>Hi ${name},</p>
            <p>We are thrilled to have you on board. AutoMindz is your central hub for unified outreach, combining powerful AI analytics with seamless email handling.</p>
            <br/>
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Connect your first email account from the settings.</li>
                <li>Launch your first automated AI campaign.</li>
            </ul>
            <p>If you need any help, feel free to reply directly to this email.</p>
            <br/>
            <p>Cheers,<br>The AutoMindz Team</p>
        </div>
    `;
    
    try {
        if (!process.env.RESEND_API_KEY) {
            console.log('\n[DEVELOPMENT MODE - NEW USER WELCOME EMAIL SIMULATED TO: ' + to + ']\n');
            return true;
        }

        const info = await resend.emails.send({
            from: `"AutoMindz Team" <onboarding@automindz.com>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (err) {
        console.error('Failed to send welcome email:', err);
        return false;
    }
};
