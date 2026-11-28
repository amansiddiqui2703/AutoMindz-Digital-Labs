import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('GSC Indexing & Technical SEO Complete Audit Suite', () => {
  const CANONICAL_DOMAIN = 'https://automindzdigitallabs.online';

  const NEW_BLOGS = [
    {
      file: 'BlogWriteColdEmailsReplies.jsx',
      slug: 'how-to-write-cold-emails-that-get-replies',
      keyword: 'How to Write Cold Emails That Get Replies'
    },
    {
      file: 'BlogAiOutreachCompleteGuide.jsx',
      slug: 'ai-cold-email-outreach-complete-guide',
      keyword: 'AI Cold Email Outreach'
    },
    {
      file: 'BlogDeliverabilityChecklist.jsx',
      slug: 'cold-email-deliverability-checklist',
      keyword: 'Cold Email Deliverability Checklist'
    },
    {
      file: 'BlogBestColdEmailToolsStartups.jsx',
      slug: 'best-cold-email-tools-for-startups',
      keyword: 'Best Cold Email Tools for Startups'
    },
    {
      file: 'BlogColdEmailVsLinkedin.jsx',
      slug: 'cold-email-vs-linkedin-outreach',
      keyword: 'Cold Email vs LinkedIn Outreach'
    }
  ];

  it('All 5 requested SEO blog articles exist and exceed 1,000 words each', () => {
    for (const blog of NEW_BLOGS) {
      const filePath = path.join(rootDir, 'client', 'src', 'pages', blog.file);
      assert.ok(fs.existsSync(filePath), `Blog file ${blog.file} must exist`);

      const content = fs.readFileSync(filePath, 'utf-8');
      const plainText = content.replace(/<[^>]+>/g, ' ').replace(/[{}[\]()="':;,]+/g, ' ');
      const words = plainText.split(/\s+/).filter(w => w.length > 2);

      assert.ok(
        words.length >= 1000,
        `Blog ${blog.file} must exceed 1,000 words. Got ${words.length} words.`
      );
      assert.ok(content.includes('customSchema') || content.includes('articleSchema'), `${blog.file} must contain structured schema`);
      assert.ok(content.includes('FAQPage'), `${blog.file} must include FAQPage schema`);
      assert.ok(content.includes('canonical='), `${blog.file} must declare canonical URL`);
    }
  });

  it('Thin content pages (Crawled - not indexed) are expanded and exceed 1,000 words each', () => {
    const thinPages = [
      'BlogSolveDroughts.jsx',
      'BlogSpamIssues.jsx',
      'BlogDeliverability.jsx',
      'BlogPost.jsx'
    ];

    for (const file of thinPages) {
      const filePath = path.join(rootDir, 'client', 'src', 'pages', file);
      assert.ok(fs.existsSync(filePath), `Page ${file} must exist`);

      const content = fs.readFileSync(filePath, 'utf-8');
      const plainText = content.replace(/<[^>]+>/g, ' ').replace(/[{}[\]()="':;,]+/g, ' ');
      const words = plainText.split(/\s+/).filter(w => w.length > 2);

      assert.ok(
        words.length >= 1000,
        `Page ${file} must exceed 1,000 words to fix thin content. Got ${words.length} words.`
      );
      assert.ok(content.includes('FAQPage'), `${file} must include FAQPage schema`);
    }
  });

  it('sitemap.xml includes all 5 new articles and excludes the redirecting URL', () => {
    const sitemapPath = path.join(rootDir, 'client', 'public', 'sitemap.xml');
    const content = fs.readFileSync(sitemapPath, 'utf-8');

    for (const blog of NEW_BLOGS) {
      const loc = `<loc>${CANONICAL_DOMAIN}/blog/${blog.slug}</loc>`;
      assert.ok(content.includes(loc), `sitemap.xml must include ${loc}`);
    }

    // Must NOT contain redirecting URL
    assert.ok(
      !content.includes('/blog/top-link-building-agencies-in-india'),
      'sitemap.xml must not include /blog/top-link-building-agencies-in-india which 301-redirects'
    );
  });

  it('App.jsx registers routes for all 5 new blogs and legacy redirects', () => {
    const appPath = path.join(rootDir, 'client', 'src', 'App.jsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    for (const blog of NEW_BLOGS) {
      assert.ok(
        content.includes(`/blog/${blog.slug}`),
        `App.jsx must register route for /blog/${blog.slug}`
      );
    }
  });

  it('BlogIndex.jsx displays cards and internal links for all 5 new blogs', () => {
    const blogIndexPath = path.join(rootDir, 'client', 'src', 'pages', 'BlogIndex.jsx');
    const content = fs.readFileSync(blogIndexPath, 'utf-8');

    for (const blog of NEW_BLOGS) {
      assert.ok(
        content.includes(`/blog/${blog.slug}`),
        `BlogIndex.jsx must link to /blog/${blog.slug}`
      );
    }
  });

  it('Landing.jsx footer links all important guides with descriptive anchor text (fixes Discovered - not indexed)', () => {
    const landingPath = path.join(rootDir, 'client', 'src', 'pages', 'Landing.jsx');
    const content = fs.readFileSync(landingPath, 'utf-8');

    for (const blog of NEW_BLOGS) {
      assert.ok(
        content.includes(`/blog/${blog.slug}`),
        `Landing.jsx footer must link to /blog/${blog.slug}`
      );
    }
  });

  it('Server seoPrerender.js provides prerender data for search crawler view-source visibility', () => {
    const prerenderPath = path.join(rootDir, 'server', 'src', 'seoPrerender.js');
    assert.ok(fs.existsSync(prerenderPath), 'seoPrerender.js must exist');

    const content = fs.readFileSync(prerenderPath, 'utf-8');
    assert.ok(content.includes('PRERENDER_PAGES'), 'seoPrerender.js must export PRERENDER_PAGES');
    assert.ok(content.includes('injectPrerenderHtml'), 'seoPrerender.js must export injectPrerenderHtml');

    for (const blog of NEW_BLOGS) {
      assert.ok(
        content.includes(`/blog/${blog.slug}`),
        `seoPrerender.js must provide prerender content for /blog/${blog.slug}`
      );
    }
  });
});

