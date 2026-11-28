import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { existsSync } from 'fs';
import { crawlDomain, decodeCfEmail } from './crawler.js';

puppeteer.use(StealthPlugin());

// Detect system Chrome (Render/Linux uses Puppeteer buildpack or apt-installed Chrome)
const CHROME_PATHS = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
];
const getSystemChromePath = () => CHROME_PATHS.find(p => existsSync(p)) || undefined;

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
    const rawDomain = typeof domainObj === 'string' ? domainObj : (domainObj.domain || domainObj.url || '');
    let cleanInput = rawDomain.trim().replace(/^['"\(\[]+|['"\)\]]+$/g, '');
    if (!cleanInput.startsWith('http://') && !cleanInput.startsWith('https://')) {
        cleanInput = `https://${cleanInput}`;
    }

    let baseUrl = cleanInput;
    let rootDomain;
    try {
        const u = new URL(baseUrl);
        rootDomain = u.hostname.replace(/^www\./i, '');
        baseUrl = `${u.protocol}//${u.host}`;
    } catch {
        return { url: cleanInput, domain: rawDomain, status: 'error', error: 'Invalid domain' };
    }

    const payload = {
        url: baseUrl,
        domain: rootDomain,
        status: 'scanning',
        all_emails_flat: [],
        notes: '',
        source: 'stealth_crawler'
    };

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            executablePath: getSystemChromePath(),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

        // Navigate to homepage
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 25000 });

        const emails = new Set();

        const extractFromCurrentPage = async () => {
            const text = await page.evaluate(() => document.body.innerText || '');
            const html = await page.evaluate(() => document.documentElement.outerHTML || '');

            // 1. Regex on text
            const matches = text.match(EMAIL_REGEX) || [];
            for (const e of matches) emails.add(e.toLowerCase());

            // 2. Mailto links
            const mailtoMatches = html.match(/mailto:([^\s"'\?]+)/gi) || [];
            for (const m of mailtoMatches) {
                const e = m.replace(/mailto:/i, '').toLowerCase();
                emails.add(e);
            }

            // 3. Cloudflare data-cfemail
            const cfMatches = await page.evaluate(() => {
                const nodes = Array.from(document.querySelectorAll('[data-cfemail]'));
                return nodes.map(n => n.getAttribute('data-cfemail')).filter(Boolean);
            });
            for (const hash of cfMatches) {
                const dec = decodeCfEmail(hash);
                if (dec) emails.add(dec.toLowerCase());
            }
        };

        await extractFromCurrentPage();

        // If no emails found on homepage, try to find and click/navigate to Contact or About page
        if (emails.size === 0) {
            const contactHref = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const contactLink = links.find(l => {
                    const t = (l.innerText || '').toLowerCase();
                    const h = (l.getAttribute('href') || '').toLowerCase();
                    return t.includes('contact') || t.includes('about') || h.includes('contact') || h.includes('about');
                });
                return contactLink ? contactLink.href : null;
            });

            if (contactHref && contactHref.startsWith('http')) {
                try {
                    await page.goto(contactHref, { waitUntil: 'networkidle2', timeout: 15000 });
                    await extractFromCurrentPage();
                } catch {}
            }
        }

        const validEmails = [];
        for (const email of emails) {
            if (isValidEmail(email)) validEmails.push(email);
        }

        payload.all_emails_flat = validEmails;
        if (validEmails.length > 0) {
            payload.status = 'found';
            payload.notes = `Stealth scan completed. Found ${validEmails.length} emails.`;
        } else {
            // Fall back to robust HTTP multi-page crawler
            const standardResult = await crawlDomain(domainObj);
            return standardResult;
        }
    } catch (err) {
        // Fallback: If Puppeteer headless browser fails (e.g. Chrome not installed on host), seamlessly fall back to HTTP crawler
        try {
            const fallbackResult = await crawlDomain(domainObj);
            return fallbackResult;
        } catch {
            payload.status = 'error';
            payload.notes = err.message;
        }
    } finally {
        if (browser) {
            try { await browser.close(); } catch {}
        }
    }

    return payload;
};
