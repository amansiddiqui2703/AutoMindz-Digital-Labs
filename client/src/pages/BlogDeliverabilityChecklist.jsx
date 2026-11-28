import React, { useState } from 'react';
import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle2, Shield, AlertTriangle,
    Zap, Server, ChevronDown, ChevronUp, Check, Layers, Sliders
} from 'lucide-react';

const FAQS = [
    {
        q: 'What are the 2027 Google and Yahoo bulk sender requirements?',
        a: 'Google and Yahoo require strict SPF and DKIM authentication, a valid DMARC policy (p=none or p=quarantine), clear one-click unsubscribe links, and maintaining a reported spam rate strictly below 0.3% (with 0.1% recommended for optimal inboxing).'
    },
    {
        q: 'How long should you warm up a new cold email domain before launching campaigns?',
        a: 'A new domain should be warmed up for at least 14 to 21 days before sending cold outreach. Start with 5 to 10 automated peer-to-peer emails per day and gradually ramp up by 2 to 4 emails daily until reaching 35 to 40 emails per inbox.'
    },
    {
        q: 'Why should I never send cold emails from my primary business domain?',
        a: 'If your primary business domain (e.g., yourcompany.com) gets flagged or blacklisted by spam filters, your regular corporate communication, investor emails, and client invoices will also land in spam. Always use dedicated secondary outreach domains (e.g., yourcompanyoutreach.com).'
    },
    {
        q: 'What is a Custom Tracking Domain and why does it improve deliverability?',
        a: 'Email platforms track opens and clicks using redirect URLs. If you use a shared tracking domain with hundreds of other senders, you inherit their spam reputation. A Custom Tracking Domain (CNAME pointing to your own domain) isolates your tracking footprint and boosts inbox rates by up to 18%.'
    }
];

export default function BlogDeliverabilityChecklist() {
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

    const CANONICAL_URL = 'https://automindzdigitallabs.online/blog/cold-email-deliverability-checklist';

    const customSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${CANONICAL_URL}#article`,
                'isPartOf': {
                    '@type': 'WebSite',
                    '@id': 'https://automindzdigitallabs.online/#website',
                    'name': 'AutoMindz Digital Labs',
                    'url': 'https://automindzdigitallabs.online'
                },
                'headline': 'Cold Email Deliverability Checklist: Escape the Spam Folder in 2027',
                'description': 'The definitive technical checklist for maximizing cold email deliverability. Covers SPF, DKIM, DMARC, inbox warmup, and sender reputation.',
                'image': 'https://automindzdigitallabs.online/blog/cold-email-deliverability-checklist.svg',
                'datePublished': '2026-11-28T09:00:00+00:00',
                'dateModified': '2027-01-15T12:00:00+00:00',
                'author': {
                    '@type': 'Organization',
                    'name': 'AutoMindz Technical Deliverability Board',
                    'url': 'https://automindzdigitallabs.online'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': 'AutoMindz Digital Labs',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': 'https://automindzdigitallabs.online/logo.png'
                    }
                },
                'mainEntityOfPage': CANONICAL_URL
            },
            {
                '@type': 'FAQPage',
                '@id': `${CANONICAL_URL}#faq`,
                'mainEntity': FAQS.map((faq) => ({
                    '@type': 'Question',
                    'name': faq.q,
                    'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': faq.a
                    }
                }))
            }
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
            <SEO
                title="Cold Email Deliverability Checklist: Escape Spam in 2027"
                description="The ultimate 2027 cold email deliverability checklist. Configure SPF, DKIM, DMARC, warm up Google Workspace inboxes, and keep spam rates below 0.1%."
                url={CANONICAL_URL}
                canonical={CANONICAL_URL}
                image="https://automindzdigitallabs.online/blog/cold-email-deliverability-checklist.svg"
                keywords="cold email deliverability checklist, escape spam folder cold email, spf dkim dmarc setup cold email, google workspace cold email limits"
                customSchema={customSchema}
            />

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/blog" className="text-slate-600 hover:text-blue-600 flex items-center gap-2 text-sm font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                            Home
                        </Link>
                        <Link to="/register" className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-4">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md">Technical Deliverability</span>
                        <span>•</span>
                        <span className="text-slate-500">Updated: 2027 Edition</span>
                        <span>•</span>
                        <span className="text-slate-500">13 min read</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6">
                        Cold Email Deliverability Checklist: <span className="text-emerald-600">Escape Spam in 2027</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-6 font-normal">
                        Landing in the primary inbox is no longer about luck—it is a game of strict DNS authentication, domain reputation hygiene, and multi-inbox volume distribution. Follow this battle-tested step-by-step checklist to achieve 98%+ primary inbox placement.
                    </p>

                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-8 bg-white">
                        <img
                            src="/blog/cold-email-deliverability-checklist.svg"
                            alt="Cold Email Deliverability Checklist"
                            className="w-full h-auto object-cover"
                            width="800"
                            height="450"
                        />
                    </div>
                </header>

                {/* Section 1: The Deliverability Foundation */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        Phase 1: Domain Architecture &amp; Secondary Infrastructure
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        The single most expensive mistake B2B founders and sales teams make is sending cold outreach from their primary corporate domain (e.g., <code>yourcompany.com</code>). If spam complaints exceed 0.2%, your entire corporate domain can be blacklisted by Spamhaus or Google Postmaster, causing internal emails and customer support tickets to bounce.
                    </p>

                    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs my-6 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            Best Practices for Outreach Domains:
                        </h3>
                        <ul className="space-y-2 text-xs md:text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span><strong>Purchase 2 to 4 lookalike domains:</strong> If your company is <code>scaleup.com</code>, acquire <code>getscaleup.com</code>, <code>scaleuphq.com</code>, or <code>tryscaleup.com</code>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span><strong>Setup 301 redirects to your main website:</strong> When prospects visit your secondary domains in their browser, automatically redirect them to your primary homepage.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span><strong>Create maximum 2 to 3 mailboxes per domain:</strong> Never exceed 3 sending mailboxes on a single domain to avoid domain-wide algorithmic flags.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Section 2: Technical DNS Configuration */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        Phase 2: The Mandatory DNS Authentication Trifecta
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Every single outreach domain must have flawless SPF, DKIM, and DMARC records configured in your DNS provider (Cloudflare, Namecheap, Google Domains):
                    </p>

                    <div className="space-y-4 my-6">
                        {/* SPF */}
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <strong className="text-sm text-slate-900 font-bold">1. SPF (Sender Policy Framework)</strong>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">TXT Record</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">
                                Tells receiving servers which mail servers are authorized to send emails on behalf of your domain.
                            </p>
                            <code className="block bg-slate-900 text-emerald-400 p-3 rounded font-mono text-xs overflow-x-auto">
                                v=spf1 include:_spf.google.com ~all
                            </code>
                        </div>

                        {/* DKIM */}
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <strong className="text-sm text-slate-900 font-bold">2. DKIM (DomainKeys Identified Mail)</strong>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">TXT Record (2048-bit)</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">
                                Adds a cryptographic digital signature to your email headers, verifying the message wasn't intercepted or modified in transit. Generate this directly inside your Google Workspace Admin Console under Apps &gt; Google Workspace &gt; Gmail &gt; Authenticate Email.
                            </p>
                            <code className="block bg-slate-900 text-emerald-400 p-3 rounded font-mono text-xs overflow-x-auto">
                                google._domainkey.yourdomain.com TXT v=DKIM1; k=rsa; p=MIIBIjANBgkqhki...
                            </code>
                        </div>

                        {/* DMARC */}
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <strong className="text-sm text-slate-900 font-bold">3. DMARC (Domain-based Message Authentication)</strong>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">TXT Record</span>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">
                                Dictates how receiving email servers handle emails that fail SPF or DKIM. Mandatory for all bulk senders since February 2024.
                            </p>
                            <code className="block bg-slate-900 text-emerald-400 p-3 rounded font-mono text-xs overflow-x-auto">
                                _dmarc.yourdomain.com TXT v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; pct=100;
                            </code>
                        </div>
                    </div>
                </section>

                {/* Section 3: The 21-Day Warmup Protocol */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        Phase 3: The 21-Day Inbox Ramp-Up Schedule
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Never blast 50 cold emails from a day-one mailbox. Mailbox reputation is earned through gradual, bidirectional communication with high engagement:
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs my-6">
                        <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100 font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-4">Timeline</th>
                                    <th className="py-3 px-4">Warmup Volume</th>
                                    <th className="py-3 px-4">Live Cold Sends</th>
                                    <th className="py-3 px-4">Key Milestone</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-3 px-4 font-bold text-slate-950">Days 1 – 7</td>
                                    <td className="py-3 px-4">5 – 10 / day</td>
                                    <td className="py-3 px-4 text-slate-400 font-semibold">0 (Zero)</td>
                                    <td className="py-3 px-4">Establish initial sending history; zero cold outreach.</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-bold text-slate-950">Days 8 – 14</td>
                                    <td className="py-3 px-4">15 – 25 / day</td>
                                    <td className="py-3 px-4 text-slate-400 font-semibold">0 (Zero)</td>
                                    <td className="py-3 px-4">Verify SPF/DKIM passes with 100% positive peer replies.</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-bold text-slate-950">Days 15 – 21</td>
                                    <td className="py-3 px-4">25 – 35 / day</td>
                                    <td className="py-3 px-4 text-blue-600 font-bold">5 – 10 / day</td>
                                    <td className="py-3 px-4">Begin soft outbound campaigns with verified B2B lists.</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 font-bold text-slate-950">Day 22+ (Full Scale)</td>
                                    <td className="py-3 px-4">Keep active in background</td>
                                    <td className="py-3 px-4 text-emerald-600 font-bold">30 – 40 / day max</td>
                                    <td className="py-3 px-4">Cruise control using multi-inbox rotation.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 4: Multi-Inbox Math */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        Phase 4: Multi-Inbox Horizontal Scaling
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        To send 500 emails per day safely, do <strong>NOT</strong> attempt to send 500 emails from a single Google Workspace account. Instead, distribute the volume horizontally:
                    </p>
                    <div className="bg-slate-900 text-white rounded-xl p-6 font-mono text-xs my-6">
                        <p className="text-emerald-400 font-bold mb-2">// The AutoMindz Deliverability Formula</p>
                        <p className="text-slate-300">Target Send Volume: 450 emails / day</p>
                        <p className="text-slate-300">Max Safe Sends per Inbox: 30 emails / day</p>
                        <p className="text-blue-400 font-bold mt-2">Required Inboxes = 450 / 30 = 15 connected mailboxes</p>
                        <p className="text-slate-400 mt-2">Distribute across 5 secondary domains (3 mailboxes each).</p>
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        With <Link to="/blog/multi-inbox-cold-email-rotation" className="text-blue-600 hover:underline">AutoMindz's multi-inbox sender rotation</Link>, campaigns rotate dynamically across all 15 mailboxes with randomized jitter intervals (45–120 seconds between sends), ensuring zero algorithmic spam flags.
                    </p>
                </section>

                {/* Section 4b: Real-Time Blacklist & Health Monitoring */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        Phase 4b: Continuous Deliverability Telemetry & Blacklist Defense
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Securing high inbox deliverability is not a one-time configuration; it requires continuous real-time monitoring of ISP health metrics. Elite outbound engineering teams monitor three primary diagnostic dashboards daily:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-emerald-600" /> Google Postmaster Tools
                            </h4>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Monitor your domain reputation score (High, Medium, Low, Bad), spam complaint percentages, and SPF/DKIM authentication pass rates directly reported by Gmail servers.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-blue-600" /> Microsoft SNDS
                            </h4>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Tracks IP health across Outlook, Hotmail, and Office 365 enterprise tenants. Identifies spam trap hits and anomalous outbound spikes before blacklisting occurs.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-amber-600" /> Blacklist Aggregators
                            </h4>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Continuous polling of over 100 Real-Time Blackhole Lists (RBLs) including Spamhaus ZEN, Barracuda, Invaluement, and SORBS to detect unauthorized listings.
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                        If a secondary domain drops from "High" to "Medium" reputation, AutoMindz's automated circuit breaker immediately throttles commercial sends and increases peer warmup volume until reputation normalizes, protecting your campaigns from catastrophic downtime.
                    </p>
                </section>

                {/* Section 5: FAQs */}
                <section className="mb-14">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
                        Deliverability Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {FAQS.map((faq, index) => (
                            <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-slate-900 text-sm md:text-base">{faq.q}</span>
                                    {openFaq === index ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                                </button>
                                {openFaq === index && (
                                    <div className="px-5 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Related Internal Guides Mesh */}
                <section className="mb-12 border-t border-slate-200 pt-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Related Deliverability &amp; Outbound Guides:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <Link to="/blog/escaping-spam-folder" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">Escaping the Spam Folder</span>
                            <span className="text-slate-500">The 14-day domain quarantine protocol to restore burned sender reputation.</span>
                        </Link>
                        <Link to="/blog/multi-inbox-cold-email-rotation" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">Multi-Inbox Rotation Guide</span>
                            <span className="text-slate-500">How horizontal mailbox rotation protects domain health at scale.</span>
                        </Link>
                        <Link to="/blog/deliverability-hacks" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">7 Advanced Deliverability Hacks</span>
                            <span className="text-slate-500">Custom tracking domains, plain-text formatting, and MX record verification.</span>
                        </Link>
                        <Link to="/blog/how-to-write-cold-emails-that-get-replies" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">How to Write Cold Emails That Get Replies</span>
                            <span className="text-slate-500">Crafting high-engagement copy that boosts positive sender reputation signals.</span>
                        </Link>
                    </div>
                </section>

                {/* Bottom CTA Banner */}
                <div className="bg-slate-900 rounded-2xl p-8 text-center text-white relative overflow-hidden border border-slate-800">
                    <div className="max-w-xl mx-auto">
                        <h3 className="text-2xl font-bold mb-3">Protect Your Domain Deliverability Automatically</h3>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                            AutoMindz features built-in multi-inbox rotation, automated bounce protection, and real-time deliverability telemetry.
                        </p>
                        <Link
                            to="/register"
                            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            Start Outreach With AutoMindz <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
