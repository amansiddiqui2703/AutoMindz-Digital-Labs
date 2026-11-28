/**
 * SEO Prerender Data & Server-Side Metadata Injector
 * Provides semantic HTML and meta tags for search engines (Googlebot, Bingbot, etc.)
 * Ensures that view-source shows full content even before client-side JS hydrates.
 */

export const PRERENDER_PAGES = {
  '/': {
    title: 'AutoMindz — AI Cold Email Outreach & Lead Generation Platform',
    description: 'AutoMindz is an AI cold email outreach platform with multi-inbox sender rotation, Google Gemini personalization, and automated follow-up sequences.',
    canonical: 'https://automindzdigitallabs.online/',
    prerenderHtml: `
      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>AI-Powered Cold Email Outreach & Multi-Inbox Deliverability</h1>
          <p>Scale B2B customer acquisition without landing in spam. Rotate unlimited Google Workspace inboxes, scrape verified company emails, and personalize cold campaigns with Google Gemini AI.</p>
        </header>
        <section>
          <h2>Core Outbound Infrastructure Capabilities</h2>
          <ul>
            <li><strong>Horizontal Multi-Inbox Rotation:</strong> Distribute outbound volume across multiple secondary inboxes to protect domain reputation.</li>
            <li><strong>Google Gemini AI Personalization:</strong> Generate tailored icebreakers and value propositions for every decision-maker.</li>
            <li><strong>Automated Reply-Stopping Sequences:</strong> Follow-up sequences that automatically halt when a prospect replies.</li>
            <li><strong>Built-In B2B Email Scraper:</strong> Crawl target company websites and extract verified decision-maker emails.</li>
          </ul>
        </section>
        <section>
          <h2>Outbound Engineering Playbooks & Guides</h2>
          <ul>
            <li><a href="/blog/how-to-write-cold-emails-that-get-replies">How to Write Cold Emails That Get Replies (5 Frameworks)</a></li>
            <li><a href="/blog/ai-cold-email-outreach-complete-guide">AI Cold Email Outreach: The Complete 2027 Playbook</a></li>
            <li><a href="/blog/cold-email-deliverability-checklist">Cold Email Deliverability Checklist: 15-Point Audit</a></li>
            <li><a href="/blog/best-cold-email-tools-for-startups">Best Cold Email Tools for Startups (Comparison & Pricing)</a></li>
            <li><a href="/blog/cold-email-vs-linkedin-outreach">Cold Email vs LinkedIn Outreach: Which Wins in 2027?</a></li>
            <li><a href="/blog/top-link-building-agencies">Top 10 Link Building Agencies (2027 Audit)</a></li>
          </ul>
        </section>
      </main>
    `
  },
  '/blog': {
    title: 'Cold Email Outreach & B2B Lead Generation Blog | AutoMindz',
    description: 'Actionable strategies on B2B cold email outreach, deliverability checklists, AI copy frameworks, tool comparisons, and sales pipeline automation.',
    canonical: 'https://automindzdigitallabs.online/blog',
    prerenderHtml: `
      <main style="max-width: 1100px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>Cold Email & B2B Outreach Knowledge Base</h1>
          <p>Actionable blueprints on deliverability, AI cold email personalization, software comparisons, and sales pipeline automation.</p>
        </header>
        <section>
          <h2>Featured Outbound Guides</h2>
          <article>
            <h3><a href="/blog/how-to-write-cold-emails-that-get-replies">How to Write Cold Emails That Get Replies: 5 Proven Frameworks</a></h3>
            <p>Master 5 psychological frameworks, subject line formulas, and word-for-word templates that double B2B response rates.</p>
          </article>
          <article>
            <h3><a href="/blog/ai-cold-email-outreach-complete-guide">AI Cold Email Outreach: The Complete 2027 Playbook</a></h3>
            <p>How artificial intelligence conducts prospect research, crafts dynamic icebreakers, and scales multi-inbox campaigns safely.</p>
          </article>
          <article>
            <h3><a href="/blog/cold-email-deliverability-checklist">Cold Email Deliverability Checklist: 15-Point Primary Inbox Audit</a></h3>
            <p>Configure SPF, DKIM, DMARC, secondary domain isolation, and automated warmup for 99% inbox placement.</p>
          </article>
          <article>
            <h3><a href="/blog/best-cold-email-tools-for-startups">Best Cold Email Tools for Startups: Features, Limits & True Pricing</a></h3>
            <p>Unfiltered comparison of AutoMindz, Instantly, Smartlead, Lemlist, and Apollo for seed-stage startups and marketing agencies.</p>
          </article>
          <article>
            <h3><a href="/blog/cold-email-vs-linkedin-outreach">Cold Email vs LinkedIn Outreach: Which Wins in 2027?</a></h3>
            <p>Compare reply rates, costs, weekly limits, and ban risks. Discover the 4-step hybrid omnichannel sequence that outperforms single channels.</p>
          </article>
          <article>
            <h3><a href="/blog/top-link-building-agencies">Top 10 Link Building Agencies (2027 Review & Pricing)</a></h3>
            <p>Detailed review of white-hat link building companies, digital PR services, backlink pricing models, and how to automate outreach in-house.</p>
          </article>
        </section>
      </main>
    `
  },
  '/blog/how-to-write-cold-emails-that-get-replies': {
    title: 'How to Write Cold Emails That Get Replies: 5 Frameworks',
    description: 'Learn how to write cold emails that get replies in 2027. Discover 5 psychological frameworks, high-converting subject line formulas, and templates.',
    canonical: 'https://automindzdigitallabs.online/blog/how-to-write-cold-emails-that-get-replies',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>How to Write Cold Emails That Get Replies: 5 Proven Frameworks</h1>
          <p>Master 5 psychological frameworks, high-converting subject line formulas, and word-for-word templates that double B2B response rates.</p>
        </header>
        <section>
          <h2>The 5 High-Converting Cold Email Frameworks</h2>
          <h3>1. Problem-Agitate-Solve (PAS)</h3>
          <p>The PAS framework identifies an acute workflow bottleneck, highlights the cost of inaction, and offers a low-friction solution.</p>
          <h3>2. Before-After-Bridge (BAB)</h3>
          <p>Describes the prospect's current friction, paints a vision of their desired outcome, and positions your solution as the bridge.</p>
          <h3>3. Attention-Interest-Desire-Action (AIDA)</h3>
          <p>A classic direct-response formula adapted for concise 75-word B2B sales touchpoints.</p>
          <h3>4. Star-Story-Solution</h3>
          <p>Highlights a relatable peer company facing the exact same challenge and reveals the specific outcome achieved.</p>
          <h3>5. The Permissionless Audit</h3>
          <p>Provides upfront actionable value—such as a 2-minute Loom video audit or benchmark review—before asking for a sales call.</p>
        </section>
        <section>
          <h2>Subject Line Principles for 60%+ Open Rates</h2>
          <p>Use lower-case phrasing, 2 to 4 words, and peer-to-peer syntax such as 'quick question re: {{topic}}' or 'idea for {{company}} pipeline'.</p>
        </section>
      </article>
    `
  },
  '/blog/ai-cold-email-outreach-complete-guide': {
    title: 'AI Cold Email Outreach: Complete Guide (2027 Playbook)',
    description: 'Master AI cold email outreach in 2027. Learn how LLMs research prospects, craft personalized icebreakers, and scale campaigns safely.',
    canonical: 'https://automindzdigitallabs.online/blog/ai-cold-email-outreach-complete-guide',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>AI Cold Email Outreach: The Complete 2027 Playbook</h1>
          <p>How artificial intelligence conducts prospect research, crafts dynamic icebreakers, and scales multi-inbox campaigns safely without landing in spam.</p>
        </header>
        <section>
          <h2>The Evolution of Cold Outbound: From Spam to Contextual Intelligence</h2>
          <p>Traditional mass mail-merge replaces basic tags like first_name. Modern AI outreach analyzes target company websites, recent press releases, and LinkedIn milestones to craft unique, contextual observations.</p>
          <h2>The 4-Pillar AI Outbound Architecture</h2>
          <ol>
            <li>Data Ingestion & Website Scraping</li>
            <li>Contextual Prompt Engineering via Google Gemini</li>
            <li>Dynamic Spintax & Variation Clustering</li>
            <li>Multi-Inbox Dispatch with Randomized Jitter Delays</li>
          </ol>
        </section>
      </article>
    `
  },
  '/blog/cold-email-deliverability-checklist': {
    title: 'Cold Email Deliverability Checklist: 15-Point Audit',
    description: 'Ensure 99% primary inbox placement with our 15-point cold email deliverability checklist. Fix SPF, DKIM, DMARC, DNS alignment, and warmup.',
    canonical: 'https://automindzdigitallabs.online/blog/cold-email-deliverability-checklist',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>Cold Email Deliverability Checklist: 15-Point Primary Inbox Audit</h1>
          <p>Step-by-step checklist to configure SPF, DKIM, DMARC, secondary domain isolation, and automated warmup for 99% primary inbox placement.</p>
        </header>
        <section>
          <h2>Phase 1: Domain & DNS Authentication Architecture</h2>
          <ul>
            <li>SPF Record under 10 DNS lookups</li>
            <li>DKIM with 2048-bit cryptographic signature</li>
            <li>DMARC policy enforcement (p=quarantine or p=reject)</li>
            <li>Custom Tracking Domain (CNAME isolation)</li>
          </ul>
          <h2>Phase 2: Mailbox Preparation & Progressive Warmup</h2>
          <p>Execute a 21-day gradual warmup schedule starting at 5 emails/day and capping daily volume at 35-45 emails per mailbox.</p>
        </section>
      </article>
    `
  },
  '/blog/best-cold-email-tools-for-startups': {
    title: 'Best Cold Email Tools for Startups: 2027 Comparison',
    description: 'Compare the best cold email tools for startups in 2027. Review AutoMindz, Instantly, Smartlead, Lemlist, and Apollo pricing and features.',
    canonical: 'https://automindzdigitallabs.online/blog/best-cold-email-tools-for-startups',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>Best Cold Email Tools for Startups: Features, Limits & True Pricing</h1>
          <p>Unfiltered comparison of AutoMindz, Instantly, Smartlead, Lemlist, and Apollo for seed-stage startups, lean marketing teams, and growth agencies.</p>
        </header>
        <section>
          <h2>Top Outbound Tools Evaluated</h2>
          <ol>
            <li><strong>AutoMindz Digital Labs:</strong> Free tier (50 sends/day), multi-inbox rotation, Gemini AI writing, and built-in B2B website email scraper.</li>
            <li><strong>Instantly.ai:</strong> Unlimited warmup, high-volume campaign management, paid lead database credits.</li>
            <li><strong>Smartlead.ai:</strong> Multi-client agency portal, master inbox, API-first architecture.</li>
            <li><strong>Lemlist:</strong> Multichannel LinkedIn and email workflows, dynamic image personalization.</li>
            <li><strong>Apollo.io:</strong> Large B2B contact directory and native dialer.</li>
          </ol>
        </section>
      </article>
    `
  },
  '/blog/cold-email-vs-linkedin-outreach': {
    title: 'Cold Email vs LinkedIn Outreach: Which Wins in 2027?',
    description: 'Compare Cold Email vs LinkedIn Outreach for B2B pipeline growth in 2027. Discover response rates, costs, weekly limits, and omnichannel workflows.',
    canonical: 'https://automindzdigitallabs.online/blog/cold-email-vs-linkedin-outreach',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>Cold Email vs LinkedIn Outreach: Which Wins in 2027?</h1>
          <p>An unfiltered comparison of reply rates, acquisition costs, account risks, and the omnichannel playbook that beats both channels.</p>
        </header>
        <section>
          <h2>Channel Comparison Breakdown</h2>
          <p>Cold Email provides superior scalability and cost efficiency ($37-$74/mo for thousands of contacts), while LinkedIn provides higher social proof and trust at lower volume (capped at 100-200 connection requests per week).</p>
          <h2>The 4-Step Omnichannel Playbook</h2>
          <p>Day 1: LinkedIn profile view and connection request. Day 3: Hyper-personalized cold email referencing the connection. Day 7: LinkedIn voice note. Day 10: Value-first follow-up email.</p>
        </section>
      </article>
    `
  },
  '/blog/solve-b2b-sales-droughts': {
    title: 'How to Solve B2B Sales Droughts with Cold Outreach',
    description: 'Struggling with an empty pipeline? Learn how to solve B2B sales droughts by implementing an automated, high-volume cold email outreach system.',
    canonical: 'https://automindzdigitallabs.online/blog/solve-b2b-sales-droughts',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>How to Solve B2B Sales Droughts with Automated Cold Outreach</h1>
          <p>If your pipeline dries up at the end of the quarter, you are relying too much on unpredictable referrals. Here is the engineering guide to a predictable outbound engine.</p>
        </header>
        <section>
          <h2>The 4-Step Outbound Architecture to Eradicate Pipeline Dry Spells</h2>
          <p>1. Laser-Focused TAM Extraction. 2. Problem-Agitate-Solve Copywriting. 3. Multi-Inbox Domain Rotation. 4. Automated Threaded Follow-Up Sequences.</p>
        </section>
      </article>
    `
  },
  '/blog/escaping-spam-folder': {
    title: 'Escaping the Spam Folder: Domain Reputation Guide',
    description: 'Is your company\'s email landing in the spam folder? Learn how to diagnose ISP spam penalties, fix DNS authentication, and restore sender reputation.',
    canonical: 'https://automindzdigitallabs.online/blog/escaping-spam-folder',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>Escaping the Spam Folder: The Technical Guide to Domain Reputation</h1>
          <p>Here is the exact diagnostic roadmap to identify ISP blacklists, repair DNS authentication, and permanently re-enter the primary inbox.</p>
        </header>
        <section>
          <h2>The 14-Day Emergency Quarantine Protocol</h2>
          <p>Phase 1: Complete Outreach Freeze (Days 1-3). Phase 2: DNS Hardening & Alignment (Days 4-5). Phase 3: Peer-to-Peer Warmup Rehabilitation (Days 6-14).</p>
        </section>
      </article>
    `
  },
  '/blog/deliverability-hacks': {
    title: '12 Deliverability Hacks to Bypass Gmail Spam Filters',
    description: 'Stop landing in the spam folder. Learn the 12 proven deliverability hacks that experts use to reach the primary inbox in 2026.',
    canonical: 'https://automindzdigitallabs.online/blog/deliverability-hacks',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>12 Deliverability Hacks to Bypass Gmail\'s Spam Filters in 2026</h1>
          <p>If your cold emails are landing in spam, your copy doesn\'t matter. Here are 12 technical and strategic hacks to get into the primary inbox.</p>
        </header>
        <section>
          <h2>Key Deliverability Rules</h2>
          <p>Setup SPF, DKIM, and DMARC correctly. Warm up domains for 21 days. Cap daily volume at 35-45 emails per inbox. Avoid spam trigger words and tracking pixels on cold touchpoints.</p>
        </section>
      </article>
    `
  },
  '/blog/best-free-cold-email-software': {
    title: 'Best Free Cold Email Software in 2026 — AutoMindz vs Instantly',
    description: 'Looking for free cold email software? AutoMindz offers AI personalization, follow-up automation & 50 free emails/day. The affordable Instantly alternative.',
    canonical: 'https://automindzdigitallabs.online/blog/best-free-cold-email-software',
    prerenderHtml: `
      <article style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
        <header>
          <h1>Best Free Cold Email Software in 2026: Why Agencies Are Switching to AutoMindz</h1>
          <p>This guide breaks down what to look for in free cold email tools, compares leading platforms, and explains why outreach teams are switching to AutoMindz.</p>
        </header>
        <section>
          <h2>What Makes Good Cold Email Software?</h2>
          <p>AI-powered personalization, native follow-up threading, built-in email scraping, and multi-inbox rotation without steep per-seat licenses.</p>
        </section>
      </article>
    `
  }
};

/**
 * Injects prerendered title, meta description, canonical, and HTML into index.html
 */
export function injectPrerenderHtml(htmlContent, routePath) {
  const pageMeta = PRERENDER_PAGES[routePath];
  if (!pageMeta) {
    return htmlContent;
  }

  let injected = htmlContent;

  // Replace <title>
  if (pageMeta.title) {
    injected = injected.replace(/<title>.*?<\/title>/i, `<title>${pageMeta.title}</title>`);
  }

  // Replace meta description
  if (pageMeta.description) {
    injected = injected.replace(
      /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="description" content="${pageMeta.description}" />`
    );
  }

  // Replace canonical link
  if (pageMeta.canonical) {
    injected = injected.replace(
      /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
      `<link rel="canonical" href="${pageMeta.canonical}" />`
    );
  }

  // Inject semantic HTML content inside <div id="root"></div>
  if (pageMeta.prerenderHtml) {
    injected = injected.replace(
      /<div\s+id=["']root["']>\s*<\/div>/i,
      `<div id="root">${pageMeta.prerenderHtml}</div>`
    );
  }

  return injected;
}

