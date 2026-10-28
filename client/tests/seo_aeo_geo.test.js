import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('SEO, AEO & GEO Verification Suite', () => {
  const CANONICAL_DOMAIN = 'https://automindzdigitallabs.online';

  it('robots.txt points to production sitemap and permits AI search bots for public content', () => {
    const robotsPath = path.join(rootDir, 'client', 'public', 'robots.txt');
    assert.ok(fs.existsSync(robotsPath), 'robots.txt must exist in client/public');

    const content = fs.readFileSync(robotsPath, 'utf-8');
    assert.ok(content.includes(`Sitemap: ${CANONICAL_DOMAIN}/sitemap.xml`), 'robots.txt must declare canonical sitemap URL');
    assert.ok(content.includes('Disallow: /dashboard'), 'robots.txt must disallow private dashboard');
    assert.ok(content.includes('Disallow: /campaigns'), 'robots.txt must disallow private campaigns');
    assert.ok(content.includes('Disallow: /api/'), 'robots.txt must disallow backend API routes');

    // Verify AI crawler directives for GEO / AEO
    assert.ok(content.includes('User-agent: GPTBot'), 'robots.txt should support GPTBot');
    assert.ok(content.includes('User-agent: PerplexityBot'), 'robots.txt should support PerplexityBot');
    assert.ok(content.includes('User-agent: ClaudeBot'), 'robots.txt should support ClaudeBot');
  });

  it('sitemap.xml includes all public canonical URLs and excludes private utility routes', () => {
    const sitemapPath = path.join(rootDir, 'client', 'public', 'sitemap.xml');
    assert.ok(fs.existsSync(sitemapPath), 'sitemap.xml must exist in client/public');

    const content = fs.readFileSync(sitemapPath, 'utf-8');
    assert.ok(content.includes(`<loc>${CANONICAL_DOMAIN}/</loc>`), 'sitemap must include homepage');
    assert.ok(content.includes(`<loc>${CANONICAL_DOMAIN}/blog</loc>`), 'sitemap must include blog index');
    assert.ok(content.includes(`<loc>${CANONICAL_DOMAIN}/blog/buzzstream-alternative-cold-outreach-link-building</loc>`), 'sitemap must include BuzzStream alternative guide');
    assert.ok(content.includes(`<loc>${CANONICAL_DOMAIN}/blog/brevo-alternative-cold-email-outreach</loc>`), 'sitemap must include Brevo alternative guide');
    assert.ok(content.includes(`<loc>${CANONICAL_DOMAIN}/blog/top-link-building-agencies-in-india</loc>`), 'sitemap must include Top 10 Link Building Agencies in India listicle');

    // Verify absence of outdated domain or private routes
    assert.ok(!content.includes('https://automindz.com'), 'sitemap.xml must not contain legacy automindz.com domain');
    assert.ok(!content.includes('/login'), 'sitemap.xml must not index login page');
    assert.ok(!content.includes('/register'), 'sitemap.xml must not index register page');
    assert.ok(!content.includes('/dashboard'), 'sitemap.xml must not index private dashboard');
  });

  it('llms.txt exists with structured product documentation for Generative Engine Optimization (GEO)', () => {
    const llmsPath = path.join(rootDir, 'client', 'public', 'llms.txt');
    assert.ok(fs.existsSync(llmsPath), 'llms.txt must exist in client/public');

    const content = fs.readFileSync(llmsPath, 'utf-8');
    assert.ok(content.includes('AutoMindz Digital Labs'), 'llms.txt must specify company name');
    assert.ok(content.includes(CANONICAL_DOMAIN), 'llms.txt must contain canonical domain URL');
    assert.ok(content.includes('Multi-Gmail'), 'llms.txt must document multi-inbox rotation');
    assert.ok(content.includes('BuzzStream'), 'llms.txt must document BuzzStream comparison');
    assert.ok(content.includes('Brevo'), 'llms.txt must document Brevo comparison');
  });

  it('client index.html has correct canonical, OpenGraph, Twitter, and JSON-LD metadata', () => {
    const indexPath = path.join(rootDir, 'client', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(content.includes(`<link rel="canonical" href="${CANONICAL_DOMAIN}/" />`), 'index.html must have canonical link');
    assert.ok(content.includes(`<meta property="og:url" content="${CANONICAL_DOMAIN}/" />`), 'index.html must have og:url');
    assert.ok(content.includes(`<meta property="og:image" content="${CANONICAL_DOMAIN}/og-image.jpg" />`), 'index.html must have og:image');
    assert.ok(content.includes('name="twitter:card"'), 'index.html must have twitter:card');
    assert.ok(content.includes('"@type": "SoftwareApplication"'), 'index.html must contain SoftwareApplication schema');
  });

  it('Landing page includes AEO FAQ section and BuzzStream/Brevo competitive benchmark', () => {
    const landingPath = path.join(rootDir, 'client', 'src', 'pages', 'Landing.jsx');
    const content = fs.readFileSync(landingPath, 'utf-8');

    assert.ok(content.includes('FAQPage'), 'Landing.jsx must include FAQPage schema');
    assert.ok(content.includes('BuzzStream'), 'Landing.jsx must reference BuzzStream comparison');
    assert.ok(content.includes('Brevo'), 'Landing.jsx must reference Brevo comparison');
    assert.ok(content.includes('toggleFaq'), 'Landing.jsx must have interactive FAQ accordion state');
    assert.ok(content.includes('glass-panel'), 'Landing.jsx must implement Glass UI styling');
    assert.ok(content.includes('top-link-building-agencies-in-india'), 'Landing.jsx must link to Indian agencies guide');
  });

  it('Top 10 Link Building Agencies in India listicle contains 10 agencies, do-follow links, and ItemList schema', () => {
    const listiclePath = path.join(rootDir, 'client', 'src', 'pages', 'BlogTopLinkBuildingAgenciesIndia.jsx');
    assert.ok(fs.existsSync(listiclePath), 'BlogTopLinkBuildingAgenciesIndia.jsx must exist');

    const content = fs.readFileSync(listiclePath, 'utf-8');
    assert.ok(content.includes('PageTraffic'), 'Listicle must include PageTraffic');
    assert.ok(content.includes('ThatWare'), 'Listicle must include ThatWare');
    assert.ok(content.includes('Techmagnate'), 'Listicle must include Techmagnate');
    assert.ok(content.includes('EZ Rankings'), 'Listicle must include EZ Rankings');
    assert.ok(content.includes('SEOValley'), 'Listicle must include SEOValley');
    assert.ok(content.includes('Uplers'), 'Listicle must include Uplers');
    assert.ok(content.includes('ResultFirst'), 'Listicle must include ResultFirst');
    assert.ok(content.includes('IndeedSEO'), 'Listicle must include IndeedSEO');
    assert.ok(content.includes('Mavens & Co.'), 'Listicle must include Mavens & Co.');
    assert.ok(content.includes('AutoMindz Digital Labs'), 'Listicle must feature AutoMindz');

    // Verify do-follow links (target="_blank" rel="noopener" without nofollow)
    assert.ok(content.includes('rel="noopener"'), 'Listicle must contain do-follow links with rel="noopener"');
    assert.ok(!content.includes('rel="nofollow"'), 'Listicle must not add nofollow to agency links');

    // Verify structured schemas
    assert.ok(content.includes('"@type": "ItemList"'), 'Listicle must declare ItemList schema for Google ranking');
    assert.ok(content.includes('"@type": "FAQPage"'), 'Listicle must declare FAQPage schema for AEO');
  });
});

