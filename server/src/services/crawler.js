import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

// ─── Configuration ────────────────────────────────────────────────────────
const REQUEST_TIMEOUT = 12000;
const DELAY_BETWEEN_PAGES = 150;
const BATCH_SIZE = 15; // Parallel domain processing limit

// Modern Desktop Browser Headers
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
};

// Googlebot Fallback Headers (bypasses Cloudflare / WAF challenges for search indexing)
const GOOGLEBOT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'From': 'googlebot(at)googlebot.com'
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

const CATEGORY_MAP = {
    contact: ['contact', 'info', 'hello', 'hi', 'general', 'enquiry', 'enquiries', 'office'],
    editorial: ['editorial', 'editor', 'write', 'writeforus', 'guest', 'contribute', 'pitch', 'blog', 'content', 'submit', 'articles'],
    advertising: ['advertising', 'ads', 'media', 'press', 'pr', 'marketing', 'partnership', 'sponsor', 'collaborate', 'brand'],
    support: ['support', 'help', 'team', 'admin', 'service'],
    other: ['business', 'sales', 'news', 'connect', 'work']
};

const BAD_DOMAINS = new Set(['example.com', 'email.com', 'domain.com', 'yourdomain.com', 'sentry.io', 'wixpress.com']);
const BAD_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.pdf', '.woff', '.woff2']);

// Cloudflare Email Protection XOR Decryption
export const decodeCfEmail = (cfemail) => {
    if (!cfemail || cfemail.length < 4) return '';
    try {
        const k = parseInt(cfemail.substring(0, 2), 16);
        let email = '';
        for (let n = 2; n < cfemail.length; n += 2) {
            email += String.fromCharCode(parseInt(cfemail.substring(n, n + 2), 16) ^ k);
        }
        return email;
    } catch {
        return '';
    }
};

const isValidEmail = (email, rootDomain) => {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    if (clean.length < 5 || clean.length > 254) return false;

    // Reject automated noreply addresses
    if (clean.startsWith('noreply@') || clean.startsWith('donotreply@') || clean.startsWith('no-reply@')) return false;

    // Bad file extensions
    for (const ext of BAD_EXTENSIONS) {
        if (clean.endsWith(ext)) return false;
    }

    const parts = clean.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain || domain.length < 3 || !domain.includes('.')) return false;
    if (/^\d+\.\d+/.test(local)) return false;
    if (BAD_DOMAINS.has(domain)) return false;

    return true;
};

// Advanced text normalization to unmask obfuscated email patterns
const extractEmailsFromText = (text) => {
    if (!text || typeof text !== 'string') return new Set();
    const emails = new Set();

    let cleaned = text
        .replace(/&#64;/gi, '@')
        .replace(/&#x40;/gi, '@')
        .replace(/&commat;/gi, '@')
        .replace(/&#46;/gi, '.')
        .replace(/&#x2e;/gi, '.')
        .replace(/\s*\[\s*at\s*\]\s*/gi, '@')
        .replace(/\s*\(\s*at\s*\)\s*/gi, '@')
        .replace(/\s*\{\s*at\s*\}\s*/gi, '@')
        .replace(/\s+at\s+/gi, '@')
        .replace(/\s*\[\s*dot\s*\]\s*/gi, '.')
        .replace(/\s*\(\s*dot\s*\)\s*/gi, '.')
        .replace(/\s*\{\s*dot\s*\}\s*/gi, '.')
        .replace(/\s+dot\s+/gi, '.');

    try {
        cleaned = decodeURIComponent(cleaned);
    } catch {}

    const matches = cleaned.match(EMAIL_REGEX) || [];
    for (const email of matches) {
        emails.add(email.toLowerCase());
    }
    return emails;
};

const extractPhonesFromText = (text) => {
    if (!text || typeof text !== 'string') return [];
    const phones = new Set();
    const matches = text.match(PHONE_REGEX) || [];
    for (const p of matches) {
        const digits = p.replace(/[^\d]/g, '');
        if (digits.length >= 10 && digits.length <= 15) phones.add(p.trim());
    }
    return Array.from(phones).slice(0, 3);
};

const extractSocials = ($) => {
    const socials = { linkedin: '', twitter: '', facebook: '', instagram: '' };
    $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const lower = href.toLowerCase();
        if (!socials.linkedin && lower.includes('linkedin.com/company/')) socials.linkedin = href;
        if (!socials.twitter && (lower.includes('twitter.com/') || lower.includes('x.com/')) && !lower.includes('/intent/')) socials.twitter = href;
        if (!socials.facebook && lower.includes('facebook.com/') && !lower.includes('/sharer')) socials.facebook = href;
        if (!socials.instagram && lower.includes('instagram.com/') && !lower.includes('/p/')) socials.instagram = href;
    });
    return socials;
};

const extractMeta = ($) => {
    const title = $('title').text().trim().substring(0, 100);
    const description = ($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '').trim().substring(0, 250);
    return { title, description };
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

// Helper: Check if page response indicates a WAF/CAPTCHA challenge
const isChallengePage = (html, status) => {
    if (status === 403 || status === 503) return true;
    if (!html || typeof html !== 'string') return false;
    const lower = html.toLowerCase();
    return (
        lower.includes('just a moment...') ||
        lower.includes('cf-browser-verification') ||
        lower.includes('challenge-running') ||
        lower.includes('cloudflare ray id') ||
        lower.includes('turnstile') ||
        lower.includes('hcaptcha') ||
        (lower.includes('recaptcha') && lower.includes('verify you are human'))
    );
};

// Resilient page fetcher with automatic Googlebot & HTTP fallback
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

    const buildConfig = (headers) => {
        const cfg = {
            timeout: REQUEST_TIMEOUT,
            headers: headers || BROWSER_HEADERS,
            maxRedirects: 5,
            validateStatus: (status) => status < 400 || status === 403 || status === 404 || status === 503,
        };

        if (process.env.PROXY_URL) {
            try {
                const proxyUrl = new URL(process.env.PROXY_URL);
                cfg.proxy = {
                    protocol: proxyUrl.protocol.replace(':', ''),
                    host: proxyUrl.hostname,
                    port: parseInt(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80),
                    auth: proxyUrl.username ? {
                        username: proxyUrl.username,
                        password: proxyUrl.password
                    } : undefined
                };
            } catch (proxyErr) {
                console.warn('Invalid PROXY_URL provided');
            }
        }
        return cfg;
    };

    try {
        // Attempt 1: Standard modern browser headers
        let response = await axios.get(url, buildConfig(BROWSER_HEADERS));
        let html = typeof response.data === 'string' ? response.data : '';

        // Attempt 2: If blocked by 403/503 or CAPTCHA/Cloudflare Challenge, retry as Googlebot
        if (isChallengePage(html, response.status)) {
            try {
                const botRes = await axios.get(url, buildConfig(GOOGLEBOT_HEADERS));
                const botHtml = typeof botRes.data === 'string' ? botRes.data : '';
                if (botHtml && !isChallengePage(botHtml, botRes.status)) {
                    response = botRes;
                    html = botHtml;
                }
            } catch {
                // Keep original response if bot fallback fails
            }
        }

        return { data: html, status: response.status, effectiveUrl: response.request?.res?.responseUrl || url };
    } catch (err) {
        // Fallback to HTTP on SSL verification or certificate expiration errors
        if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || err.code === 'CERT_HAS_EXPIRED' || (err.message && err.message.includes('SSL'))) {
            if (url.startsWith('https://')) {
                const httpUrl = url.replace('https://', 'http://');
                try {
                    const fallbackRes = await axios.get(httpUrl, buildConfig(BROWSER_HEADERS));
                    return {
                        data: typeof fallbackRes.data === 'string' ? fallbackRes.data : '',
                        status: fallbackRes.status,
                        effectiveUrl: fallbackRes.request?.res?.responseUrl || httpUrl
                    };
                } catch {
                    // ignore secondary error
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
    const rawInput = typeof domainObj === 'string' ? domainObj : (domainObj.domain || domainObj.url || '');
    let cleanInput = rawInput.trim().replace(/^['"\(\[]+|['"\)\]]+$/g, '');
    if (!cleanInput.startsWith('http://') && !cleanInput.startsWith('https://')) {
        cleanInput = `https://${cleanInput}`;
    }

    let urlObj;
    let rootDomain;
    let originUrl;
    let initialPath = '/';

    try {
        urlObj = new URL(cleanInput);
        rootDomain = urlObj.hostname.replace(/^www\./i, '').toLowerCase();
        originUrl = `${urlObj.protocol}//${urlObj.host}`;
        if (urlObj.pathname && urlObj.pathname !== '/') {
            initialPath = urlObj.pathname;
        }
    } catch {
        return { url: cleanInput, domain: cleanInput, status: 'error', error: 'Invalid domain' };
    }

    const payload = {
        url: originUrl,
        domain: rootDomain,
        status: 'scanning',
        emails: { contact: [], editorial: [], advertising: [], support: [], other: [] },
        all_emails_flat: [],
        contact_form_url: null,
        pages_checked: [],
        source: null,
        confidence: null,
        notes: '',
        phones: [],
        socials: { linkedin: '', twitter: '', facebook: '', instagram: '' },
        title: '',
        description: ''
    };

    let allFoundEmails = new Set();
    let contactFormOnlyUrl = null;
    let blocked = false;
    let timeout = false;

    // Structured crawl queue: prioritized by likelihood of finding contact info
    const priorityPaths = new Set();
    if (initialPath !== '/') priorityPaths.add(initialPath);
    priorityPaths.add('/');
    priorityPaths.add('/contact');
    priorityPaths.add('/contact-us');
    priorityPaths.add('/about');
    priorityPaths.add('/about-us');
    priorityPaths.add('/our-team');
    priorityPaths.add('/team');
    priorityPaths.add('/get-in-touch');
    priorityPaths.add('/reach-us');
    priorityPaths.add('/impressum');
    priorityPaths.add('/write-for-us');
    priorityPaths.add('/editorial');

    const discoveredPaths = new Set();
    const queue = Array.from(priorityPaths);

    while (queue.length > 0 && payload.pages_checked.length < 8 && allFoundEmails.size < 12) {
        const nextBatch = queue.splice(0, 3).filter(p => !payload.pages_checked.includes(p));
        if (nextBatch.length === 0) break;

        payload.pages_checked.push(...nextBatch);

        const fetchPromises = nextBatch.map(async (path) => {
            const pageUrl = path.startsWith('http') ? path : `${originUrl}${path.startsWith('/') ? '' : '/'}${path}`;
            const { data, status, error } = await fetchPage(pageUrl);
            return { path, pageUrl, data, status, error };
        });

        const batchResults = await Promise.all(fetchPromises);

        for (const res of batchResults) {
            const { path, pageUrl, data, status, error } = res;

            if (error && (error.includes('timeout') || error.includes('TIMEDOUT') || error.includes('ECONNABORTED'))) {
                timeout = true;
                continue;
            }
            if (status === 403 || status === 503) {
                blocked = true;
            }
            if (!data) continue;

            const $ = cheerio.load(data);
            const extracted = new Set();

            // 1. First Page Metadata & Social Links
            if (path === '/' || path === initialPath) {
                const meta = extractMeta($);
                if (!payload.title && meta.title) payload.title = meta.title;
                if (!payload.description && meta.description) payload.description = meta.description;

                const extractedSocials = extractSocials($);
                if (extractedSocials.linkedin) payload.socials.linkedin = extractedSocials.linkedin;
                if (extractedSocials.twitter) payload.socials.twitter = extractedSocials.twitter;
                if (extractedSocials.facebook) payload.socials.facebook = extractedSocials.facebook;
                if (extractedSocials.instagram) payload.socials.instagram = extractedSocials.instagram;
            }

            // 2. Discover high-intent internal contact links from navigation/footer
            $('a').each((_, el) => {
                const href = $(el).attr('href');
                if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('tel:')) return;

                const linkText = $(el).text().trim().toLowerCase();
                const linkTitle = ($(el).attr('title') || '').toLowerCase();
                const ariaLabel = ($(el).attr('aria-label') || '').toLowerCase();
                const combined = `${href.toLowerCase()} ${linkText} ${linkTitle} ${ariaLabel}`;

                try {
                    const resolved = new URL(href, pageUrl);
                    if (resolved.hostname === rootDomain || resolved.hostname.endsWith('.' + rootDomain)) {
                        const newPath = resolved.pathname;
                        if (
                            combined.includes('contact') ||
                            combined.includes('about') ||
                            combined.includes('team') ||
                            combined.includes('reach') ||
                            combined.includes('touch') ||
                            combined.includes('impressum') ||
                            combined.includes('write') ||
                            combined.includes('contribute') ||
                            combined.includes('editorial')
                        ) {
                            if (!payload.pages_checked.includes(newPath) && !discoveredPaths.has(newPath)) {
                                discoveredPaths.add(newPath);
                                if (queue.length < 10) queue.push(newPath);
                            }
                        }
                    }
                } catch {}
            });

            // 3. Extract Cloudflare Protected Emails (data-cfemail & /cdn-cgi/l/email-protection#)
            $('[data-cfemail]').each((_, el) => {
                const hash = $(el).attr('data-cfemail');
                const decoded = decodeCfEmail(hash);
                if (decoded && isValidEmail(decoded, rootDomain)) {
                    extracted.add(decoded.toLowerCase());
                }
            });

            $('a[href*="/cdn-cgi/l/email-protection#"]').each((_, el) => {
                const href = $(el).attr('href') || '';
                const hash = href.split('#')[1];
                if (hash) {
                    const decoded = decodeCfEmail(hash);
                    if (decoded && isValidEmail(decoded, rootDomain)) {
                        extracted.add(decoded.toLowerCase());
                    }
                }
            });

            // Scan raw HTML for any regex matches of cfemail
            const rawCfMatches = data.match(/data-cfemail=["']([a-f0-9]{4,})["']/gi) || [];
            for (const cfMatch of rawCfMatches) {
                const m = cfMatch.match(/data-cfemail=["']([a-f0-9]{4,})["']/i);
                if (m && m[1]) {
                    const decoded = decodeCfEmail(m[1]);
                    if (decoded && isValidEmail(decoded, rootDomain)) {
                        extracted.add(decoded.toLowerCase());
                    }
                }
            }

            // 4. Extract standard mailto: links (with URI decoding)
            $('a[href^="mailto:"]').each((_, el) => {
                let href = $(el).attr('href') || '';
                href = href.replace(/^mailto:/i, '').split('?')[0].trim();
                try { href = decodeURIComponent(href); } catch {}

                const subMatches = href.match(EMAIL_REGEX) || [];
                for (const em of subMatches) {
                    if (isValidEmail(em, rootDomain)) {
                        extracted.add(em.toLowerCase());
                    }
                }
            });

            // 5. Extract JSON-LD & Schema.org structured data
            $('script[type="application/ld+json"]').each((_, el) => {
                try {
                    const jsonText = $(el).html();
                    if (jsonText) {
                        const matches = jsonText.match(EMAIL_REGEX) || [];
                        for (const em of matches) {
                            if (isValidEmail(em, rootDomain)) extracted.add(em.toLowerCase());
                        }
                    }
                } catch {}
            });

            // 6. Extract data-email, data-mail attributes
            $('[data-email], [data-mail], [data-mailto], [data-contact]').each((_, el) => {
                const val = $(el).attr('data-email') || $(el).attr('data-mail') || $(el).attr('data-mailto') || $(el).attr('data-contact');
                if (val && typeof val === 'string') {
                    const matches = val.match(EMAIL_REGEX) || [];
                    for (const em of matches) {
                        if (isValidEmail(em, rootDomain)) extracted.add(em.toLowerCase());
                    }
                }
            });

            // 7. Extract Visible Text & Obfuscated Patterns
            const pageText = $('body').text() || '';
            const textEmails = extractEmailsFromText(pageText);
            for (const em of textEmails) {
                if (isValidEmail(em, rootDomain)) extracted.add(em);
            }

            // Also check full HTML for comment/footer/script patterns
            const htmlEmails = extractEmailsFromText(data);
            for (const em of htmlEmails) {
                if (isValidEmail(em, rootDomain)) extracted.add(em);
            }

            // 8. Extract Phone Numbers
            const extractedPhones = extractPhonesFromText(data);
            extractedPhones.forEach(p => {
                if (!payload.phones.includes(p)) payload.phones.push(p);
            });

            // 9. Contact form fallback
            if (!contactFormOnlyUrl && (path.includes('contact') || path === '/' || path === initialPath)) {
                if (hasContactForm($)) {
                    contactFormOnlyUrl = pageUrl;
                }
            }

            // Add newly extracted emails
            for (const email of extracted) {
                allFoundEmails.add(email);
                if (!payload.source) {
                    payload.source = path === '/' ? 'homepage' : (path.includes('contact') ? 'contact_page' : 'editorial_page');
                    payload.confidence = 'high';
                }
            }
        }

        await new Promise(r => setTimeout(r, DELAY_BETWEEN_PAGES));
    }

    const { emails, flat } = categorizeEmails(allFoundEmails, rootDomain);
    payload.emails = emails;
    payload.all_emails_flat = flat;

    if (flat.length > 0) {
        payload.status = 'found';
        payload.notes = `Found ${flat.length} verified emails across ${payload.pages_checked.length} pages. Primary source: ${payload.source || 'website'}.`;
    } else if (contactFormOnlyUrl) {
        payload.status = 'contact_form_only';
        payload.contact_form_url = contactFormOnlyUrl;
        payload.notes = 'No public emails found, but an active contact form was detected.';
    } else if (timeout) {
        payload.status = 'timeout';
        payload.notes = 'Connection to target domain timed out.';
    } else if (blocked) {
        payload.status = 'blocked';
        payload.notes = 'Target website is protected by strict WAF/Cloudflare bot challenge.';
    } else {
        payload.status = 'not_found';
        payload.notes = 'No emails or contact forms discovered on public pages.';
    }

    return payload;
};

export const crawlDomains = async (domains, onProgress) => {
    const results = [];

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
