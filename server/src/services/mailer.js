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
