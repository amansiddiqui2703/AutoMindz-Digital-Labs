import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

// ─── Config ─────────────────────────────────────────────────────────────
const REQUEST_TIMEOUT = 10000;
const DELAY_BETWEEN_PAGES = 300;
const BATCH_SIZE = 15; // Process 10-20 websites parallelly

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const CATEGORY_MAP = {
    contact: ['contact', 'info', 'hello', 'hi', 'general', 'enquiry', 'enquiries', 'office'],
    editorial: ['editorial', 'editor', 'write', 'writeforus', 'guest', 'contribute', 'pitch', 'blog', 'content', 'submit', 'articles'],
    advertising: ['advertising', 'ads', 'media', 'press', 'pr', 'marketing', 'partnership', 'sponsor', 'collaborate', 'brand'],
    support: ['support', 'help', 'team', 'admin', 'service'],
    other: ['business', 'sales', 'news', 'connect', 'work']
};

const BAD_DOMAINS = new Set(['example.com', 'email.com', 'domain.com', 'yourdomain.com', 'sentry.io', 'wixpress.com']);
const BAD_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.pdf']);

// Priorities
const getPhases = () => [
    {
        name: 'homepage',
        source: 'homepage',
        paths: ['/']
    },
    {
        name: 'contact',
        source: 'contact_page',
        paths: ['/contact', '/contact-us', '/about', '/about-us', '/reach-us', '/get-in-touch', '/connect', '/support', '/team']
    },
    {
        name: 'editorial',
        source: 'editorial_page',
        paths: ['/write-for-us', '/guest-post', '/contribute', '/submit', '/advertise', '/work-with-us', '/partnership']
    },
    {
        name: 'privacy',
        source: 'privacy_page',
        paths: ['/privacy-policy', '/privacy', '/terms', '/terms-of-service', '/legal']
    }
];

const isValidEmail = (email, rootDomain) => {
    if (!email || email.length < 5 || email.length > 254) return false;

    // Exact exclude match
    if (email.startsWith('noreply@') || email.startsWith('donotreply@')) return false;

    // Bad extensions
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

const extractEmailsFromText = (text) => {
    const emails = new Set();
    const matches = text.match(EMAIL_REGEX) || [];
    for (const email of matches) {
        emails.add(email.toLowerCase());
    }
    return emails;
};

const categorizeEmails = (emailsSet, rootDomain) => {
    const result = {
        contact: [],
        editorial: [],
        advertising: [],
        support: [],
        other: []
    };

    const flat = [];
    const seen = new Set();

    for (const email of emailsSet) {
        if (!isValidEmail(email, rootDomain)) continue;
        if (seen.has(email)) continue;

        seen.add(email);
        flat.push(email);

        const prefix = email.split('@')[0].toLowerCase();

        let categorized = false;
        for (const [cat, prefixes] of Object.entries(CATEGORY_MAP)) {
            if (prefixes.some(p => prefix === p || prefix.startsWith(`${p}.`) || prefix.startsWith(`${p}-`))) {
                result[cat].push(email);
                categorized = true;
                break;
            }
        }

        if (!categorized) {
            result.other.push(email);
        }
    }

    return { emails: result, flat };
};

const fetchPage = async (url) => {
    // SECURITY FIX [CRITICAL-3]: Block SSRF by preventing internal IP access
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const privateIpRegex = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|::1|0\.0\.0\.0)/i;
        
        if (privateIpRegex.test(hostname)) {
            console.warn(`SSRF Blocked: ${hostname}`);
            return { error: 'Invalid domain', status: 400 };
        }
    } catch {
        return { error: 'Invalid URL', status: 400 };
    }

    try {
        const response = await axios.get(url, {
            timeout: REQUEST_TIMEOUT,
            headers: HEADERS,
            maxRedirects: 3,
            validateStatus: (status) => status < 400 || status === 403 || status === 404 || status === 500,
        });
        return { data: typeof response.data === 'string' ? response.data : '', status: response.status };
    } catch (err) {
        // Fallback to HTTP on SSL error (Note: rejectUnauthorized: false REMOVED for security)
        if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'CERT_HAS_EXPIRED' || err.message.includes('SSL')) {
            if (url.startsWith('https://')) {
                const httpUrl = url.replace('https://', 'http://');
                try {
                    const fallbackRes = await axios.get(httpUrl, {
                        timeout: REQUEST_TIMEOUT,
                        headers: HEADERS,
                        maxRedirects: 3,
                        validateStatus: (status) => status < 400 || status === 403 || status === 404 || status === 500,
                    });
                    return { data: typeof fallbackRes.data === 'string' ? fallbackRes.data : '', status: fallbackRes.status };
                } catch {
                    // ignore error
                }
            }
        }
        return { error: err.message, status: err.response?.status || 0 };
    }
};

const hasContactForm = ($) => {
    let hasForm = false;
    $('form').each((_, el) => {
        const formHtml = $(el).html() || '';
        const lower = formHtml.toLowerCase();
        if (lower.includes('contact') || lower.includes('message') || lower.includes('inquiry') || $(el).find('textarea').length > 0) {
            hasForm = true;
        }
    });
    return hasForm;
};

export const crawlDomain = async (domainObj) => {
    const rawDomain = typeof domainObj === 'string' ? domainObj : domainObj.domain;
    let baseUrl = rawDomain.trim().replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

    let rootDomain;
    try {
        rootDomain = new URL(baseUrl).hostname.replace(/^www\./, '');
    } catch {
        return { url: baseUrl, domain: rawDomain, status: 'error', error: 'Invalid domain' };
    }

    const payload = {
        url: baseUrl,
        domain: rootDomain,
        status: 'scanning',
        emails: { contact: [], editorial: [], advertising: [], support: [], other: [] },
        all_emails_flat: [],
        contact_form_url: null,
        pages_checked: [],
        source: null,
        confidence: null,
        notes: ''
    };

    let allFoundEmails = new Set();
    let contactFormOnlyUrl = null;
    let blocked = false;
    let timeout = false;

    const localPhases = getPhases();

    // Loop through phases
    for (const phase of localPhases) {
        let foundInPhase = false;

        for (const path of phase.paths) {
            if (payload.pages_checked.includes(path)) continue;

            const pageUrl = `${baseUrl}${path}`;
            payload.pages_checked.push(path);

            const { data, status, error } = await fetchPage(pageUrl);

            if (error && (error.includes('timeout') || error.includes('TIMEDOUT') || error.includes('ECONNABORTED'))) {
                timeout = true;
                continue;
            }
            if (status === 403 || status === 503 || status === 404 || status === 500) {
                blocked = true;
            }
            if (!data) continue;

            const $ = cheerio.load(data);

            // Dynamic Link Discovery on Homepage
            if (phase.name === 'homepage') {
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (!href || href.startsWith('javascript:')) return;
                    try {
                        const urlObj = new URL(href, pageUrl);
                        if (urlObj.hostname !== rootDomain && !urlObj.hostname.endsWith('.' + rootDomain)) return;

                        const newPath = urlObj.pathname;
                        const lowerPath = newPath.toLowerCase();

                        if (lowerPath.includes('contact') || lowerPath.includes('about') || lowerPath.includes('reach') || lowerPath.includes('team')) {
                            if (!localPhases[1].paths.includes(newPath) && localPhases[1].paths.length < 15) localPhases[1].paths.push(newPath);
                        } else if (lowerPath.includes('write') || lowerPath.includes('guest') || lowerPath.includes('contribute') || lowerPath.includes('submit')) {
                            if (!localPhases[2].paths.includes(newPath) && localPhases[2].paths.length < 15) localPhases[2].paths.push(newPath);
                        }
                    } catch { /* ignore invalid URLs */ }
                });
            }

            const extracted = extractEmailsFromText(data);
            $('a[href^="mailto:"]').each((_, el) => {
                const href = $(el).attr('href') || '';
                const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
                extracted.add(email);
            });

            for (const email of extracted) {
                if (isValidEmail(email, rootDomain)) {
                    allFoundEmails.add(email);
                    foundInPhase = true;
                }
            }

            if (!contactFormOnlyUrl && (path.includes('contact') || path === '/')) {
                if (hasContactForm($)) {
                    contactFormOnlyUrl = pageUrl;
                }
            }

            await new Promise(r => setTimeout(r, DELAY_BETWEEN_PAGES));

            // Early exit if we have found plenty of emails or crawled too many pages
            if (allFoundEmails.size >= 10 || payload.pages_checked.length >= 8) break;
        }

        if (foundInPhase && !payload.source) {
            payload.source = phase.source;
            if (phase.name === 'homepage' || phase.name === 'contact') payload.confidence = 'high';
            else if (phase.name === 'editorial') payload.confidence = 'medium';
            else payload.confidence = 'low';
        }

        if (allFoundEmails.size >= 10 || payload.pages_checked.length >= 8) {
            if (!payload.source) payload.source = phase.source;
            break;
        }
    }

    const { emails, flat } = categorizeEmails(allFoundEmails, rootDomain);
    payload.emails = emails;
    payload.all_emails_flat = flat;

    if (flat.length > 0) {
        payload.status = 'found';
        payload.notes = `Found ${flat.length} emails. Primary source: ${payload.source}.`;
    } else if (contactFormOnlyUrl) {
        payload.status = 'contact_form_only';
        payload.contact_form_url = contactFormOnlyUrl;
        payload.notes = 'No emails found, but a contact form is available.';
    } else if (timeout) {
        payload.status = 'timeout';
        payload.notes = 'Connection timed out.';
    } else if (blocked) {
        payload.status = 'blocked';
        payload.notes = 'Access was blocked (403/503/404) or CAPTCHA.';
    } else {
        payload.status = 'not_found';
        payload.notes = 'No emails or contact forms found.';
    }

    return payload;
};

export const crawlDomains = async (domains, onProgress) => {
    const results = [];

    // Parallel processing with batch limit
    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
        const batch = domains.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(domain => crawlDomain(domain));

        const batchResults = await Promise.allSettled(batchPromises);

        for (let j = 0; j < batchResults.length; j++) {
            const res = batchResults[j];
            const domainResult = res.status === 'fulfilled' ? res.value : {
                url: batch[j], domain: batch[j], status: 'error', error: res.reason?.message
            };
            results.push(domainResult);

            if (onProgress) {
                onProgress({ current: results.length, total: domains.length, domain: batch[j], result: domainResult });
            }
        }
    }

    return results;
};
