import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const BAD_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.pdf']);
const BAD_DOMAINS = new Set(['example.com', 'email.com', 'domain.com', 'yourdomain.com', 'sentry.io', 'wixpress.com']);

const isValidEmail = (email) => {
    if (!email || email.length < 5 || email.length > 254) return false;
    if (email.startsWith('noreply@') || email.startsWith('donotreply@')) return false;
    for (const ext of BAD_EXTENSIONS) {
        if (email.endsWith(ext)) return false;
    }
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain || domain.length < 3 || !domain.includes('.')) return false;
    if (/^\d+\.\d+/.test(local)) return false;
    if (BAD_DOMAINS.has(domain)) return false;
    return true;
};

export const crawlDomainStealth = async (domainObj) => {
    const rawDomain = typeof domainObj === 'string' ? domainObj : domainObj.domain;
    let baseUrl = rawDomain.trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

    const payload = {
        url: baseUrl,
        domain: rawDomain,
        status: 'scanning',
        all_emails_flat: [],
        notes: '',
        source: 'stealth_crawler'
    };

    let browser;
    try {
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();
        
        // Set a standard viewport
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to URL and wait until network is mostly idle (helps bypass Cloudflare JS challenges)
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract raw text from the page
        const text = await page.evaluate(() => document.body.innerText || '');
        const html = await page.evaluate(() => document.documentElement.outerHTML || '');
        
        // Match emails from text
        const emails = new Set();
        const matches = text.match(EMAIL_REGEX) || [];
        for (const e of matches) emails.add(e.toLowerCase());

        // Match mailto links from HTML
        const mailtoMatches = html.match(/mailto:([^\s"'\?]+)/gi) || [];
        for (const m of mailtoMatches) {
            const e = m.replace(/mailto:/i, '').toLowerCase();
            emails.add(e);
        }

        // Filter valid emails
        const validEmails = [];
        for (const email of emails) {
            if (isValidEmail(email)) {
                validEmails.push(email);
            }
        }

        payload.all_emails_flat = validEmails;
        if (validEmails.length > 0) {
            payload.status = 'found';
            payload.notes = `Stealth scan completed. Found ${validEmails.length} emails.`;
        } else {
            payload.status = 'not_found';
            payload.notes = 'Stealth scan completed. No emails found on homepage.';
        }
    } catch (err) {
        payload.status = 'error';
        payload.notes = err.message;
    } finally {
        if (browser) await browser.close();
    }

    return payload;
};
