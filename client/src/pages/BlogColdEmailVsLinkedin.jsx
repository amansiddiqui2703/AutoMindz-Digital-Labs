import React, { useState } from 'react';
import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle2, Zap, Star, Shield,
    DollarSign, Users, Mail, Linkedin, TrendingUp, AlertTriangle,
    ChevronDown, ChevronUp, Layers, Compass
} from 'lucide-react';

const COMPARISON_DATA = [
    {
        metric: 'Weekly Volume Capacity',
        coldEmail: '500 - 2,500+ contacts (across secondary inboxes)',
        linkedin: '100 - 200 connection requests / week (strict limit)',
        advantage: 'Cold Email'
    },
    {
        metric: 'Average Open / View Rate',
        coldEmail: '40% - 65% (with verified SPF/DKIM/DMARC)',
        linkedin: '70% - 85% (in-app notifications)',
        advantage: 'LinkedIn'
    },
    {
        metric: 'Average Positive Reply Rate',
        coldEmail: '3% - 9% (hyper-personalized copy)',
        linkedin: '8% - 18% (warm connection acceptance)',
        advantage: 'LinkedIn'
    },
    {
        metric: 'Monthly Platform Cost',
        coldEmail: '$37 - $74 / mo (unlimited multi-inbox on AutoMindz)',
        linkedin: '$99 - $149 / mo per user (Sales Navigator + InMail)',
        advantage: 'Cold Email'
    },
    {
        metric: 'Risk of Permanent Account Ban',
        coldEmail: 'Low (protect primary domain via secondary domains)',
        linkedin: 'High (bot detection can restrict personal profile)',
        advantage: 'Cold Email'
    },
    {
        metric: 'Time to First Touchpoint',
        coldEmail: 'Instant (automated sequence dispatch)',
        linkedin: 'Delayed (depends on prospect connection acceptance)',
        advantage: 'Cold Email'
    },
    {
        metric: 'Prospect Trust & Social Proof',
        coldEmail: 'Moderate (requires proof points in copy)',
        linkedin: 'High (prospect can instantly verify profile & posts)',
        advantage: 'LinkedIn'
    },
    {
        metric: 'Data Enrichment & Discovery',
        coldEmail: 'Website crawler, Apollo, Hunter, AutoMindz Scraper',
        linkedin: 'Sales Navigator filters, company team directories',
        advantage: 'Tie'
    }
];

export default function BlogColdEmailVsLinkedin() {
    const [faqOpen, setFaqOpen] = useState({});

    const toggleFaq = (index) => {
        setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const faqItems = [
        {
            q: 'Is cold email or LinkedIn outreach better for early-stage B2B startups?',
            a: 'For seed and bootstrap startups with tight budgets seeking rapid customer feedback, cold email offers higher scalability and lower cost ($37-$74/mo vs $99+/seat for Sales Navigator). However, the highest-converting B2B teams use an omnichannel combination: connecting on LinkedIn first to establish brand familiarity, then following up via automated cold email.'
        },
        {
            q: 'Can my personal LinkedIn account get banned for sending automated messages?',
            a: 'Yes. LinkedIn strictly enforces commercial usage limits and actively detects automated browser extensions, headless bots, and high-frequency connection spams. Exceeding 100-200 connection requests per week or using unapproved scrapers frequently results in permanent LinkedIn profile restrictions. In contrast, cold email protects your core business brand by using isolated secondary domains.'
        },
        {
            q: 'How many cold emails vs LinkedIn messages should I send per day?',
            a: 'On LinkedIn, keep outbound connection requests under 20-30 per day to protect your account. For cold email, distribute 30-40 emails per inbox per day across 3-5 secondary domain mailboxes, allowing you to comfortably reach 120-200 prospects daily without triggering spam flags.'
        },
        {
            q: 'How does an omnichannel B2B outreach strategy work?',
            a: 'An omnichannel playbook synchronizes touchpoints across both channels. Day 1: View the prospect\'s LinkedIn profile and send a light connection request. Day 3: Send a hyper-personalized cold email referencing an industry observation or mutual connection. Day 7: Send a contextual follow-up message on LinkedIn. Day 10: Deliver a value asset (case study or checklist) via email. This increases overall conversion rates by 2.8x compared to single-channel campaigns.'
        },
        {
            q: 'Do I need LinkedIn Sales Navigator if I use cold email?',
            a: 'Sales Navigator is valuable for identifying precise enterprise buyer personas and job changes, but you do not necessarily need to pay for LinkedIn InMails. You can use free B2B scrapers or AutoMindz Digital Labs\' integrated lead extractor to obtain verified corporate emails from company websites and prospect profiles, saving hundreds of dollars monthly in seat licenses.'
        }
    ];

    const CANONICAL_URL = 'https://automindzdigitallabs.online/blog/cold-email-vs-linkedin-outreach';

    const articleSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${CANONICAL_URL}#article`,
                'isPartOf': {
                    '@type': 'WebPage',
                    '@id': CANONICAL_URL
                },
                'headline': 'Cold Email vs LinkedIn Outreach: Which Wins in 2027?',
                'description': 'Compare Cold Email vs LinkedIn Outreach for B2B pipeline growth in 2027. Discover response rates, costs, weekly limits, and omnichannel workflows.',
                'image': 'https://automindzdigitallabs.online/blog/cold-email-vs-linkedin-outreach.svg',
                'author': {
                    '@type': 'Organization',
                    'name': 'AutoMindz Digital Labs',
                    'url': 'https://automindzdigitallabs.online'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': 'AutoMindz Digital Labs',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': 'https://automindzdigitallabs.online/logo192.png'
                    }
                },
                'datePublished': '2026-11-28T00:00:00+00:00',
                'dateModified': '2026-11-28T00:00:00+00:00',
                'mainEntityOfPage': CANONICAL_URL,
                'wordCount': 1420
            },
            {
                '@type': 'FAQPage',
                '@id': `${CANONICAL_URL}#faq`,
                'mainEntity': faqItems.map((item) => ({
                    '@type': 'Question',
                    'name': item.q,
                    'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': item.a
                    }
                }))
            }
        ]
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
            <SEO
                title="Cold Email vs LinkedIn Outreach: Which Wins in 2027?"
                description="Compare Cold Email vs LinkedIn Outreach for B2B pipeline growth in 2027. Discover response rates, costs, weekly limits, and omnichannel workflows."
                url={CANONICAL_URL}
                canonical={CANONICAL_URL}
                image="https://automindzdigitallabs.online/blog/cold-email-vs-linkedin-outreach.svg"
                schema={articleSchema}
            />

            {/* Crisp Top Navigation Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
                <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Blog
                    </Link>
                    <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-950 group">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Zap className="w-4 h-4 fill-white" />
                        </div>
                        AutoMindz
                    </Link>
                    <Link to="/register" className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
                        Try Free
                    </Link>
                </nav>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 shadow-2xs">
                        <Layers className="w-3.5 h-3.5" /> B2B Acquisition Strategy
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.18] mb-5">
                        Cold Email vs LinkedIn Outreach: Which Wins in 2027?
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Should your B2B sales team double down on automated multi-inbox cold email or invest in LinkedIn Sales Navigator and social selling? Here is an unfiltered, data-backed comparison of reply rates, acquisition costs, account risks, and the omnichannel playbook that beats both.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 mt-6 font-medium">
                        <span>Updated November 28, 2026</span>
                        <span>•</span>
                        <span>9 min read</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">Editorial Team</span>
                    </div>
                </header>

                <div className="mb-12 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-md">
                    <img
                        src="/blog/cold-email-vs-linkedin-outreach.svg"
                        alt="Cold Email vs LinkedIn Outreach comparison infographic for B2B sales"
                        className="w-full h-auto object-cover"
                        loading="eager"
                        width="1200"
                        height="630"
                    />
                </div>

                <div className="space-y-12 text-slate-700 text-base sm:text-lg leading-relaxed">
                    {/* Executive Summary */}
                    <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
                        <h2 className="text-2xl font-bold text-slate-950 mb-4 flex items-center gap-2">
                            <Compass className="w-6 h-6 text-blue-600" />
                            Executive Summary: The Modern Outbound Verdict
                        </h2>
                        <p className="mb-4">
                            The debate between <strong>cold email outreach</strong> and <strong>LinkedIn messaging</strong> is often framed as a zero-sum contest. In reality, both channels serve distinct stages of the outbound sales funnel.
                        </p>
                        <p className="mb-4">
                            <strong>Cold Email is the undisputed king of predictable, cost-effective scalability.</strong> By distributing campaigns across secondary domains with Google Workspace or Microsoft 365 inboxes, you can contact thousands of decision-makers every week for under $100 per month without risking your primary corporate domain.
                        </p>
                        <p>
                            <strong>LinkedIn is the supreme channel for high-ticket account trust and social proof.</strong> When a prospect receives your message on LinkedIn, they can instantly view your mutual connections, past endorsements, published case studies, and career track record. However, strict weekly limits (100–200 invites/week) and high monthly software costs ($99–$150/user) make it difficult to scale single-handedly.
                        </p>
                    </section>

                    {/* Direct Comparison Matrix */}
                    <section>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 mb-6">
                            Side-by-Side Comparison: Cold Email vs LinkedIn Outreach
                        </h2>
                        <p className="mb-6 text-slate-600">
                            Before choosing your primary acquisition pipeline, review how both channels compare across the metrics that determine customer acquisition cost (CAC) and sales velocity:
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                            <table className="w-full text-left text-sm sm:text-base border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-900">
                                        <th className="p-4 font-semibold">Evaluation Metric</th>
                                        <th className="p-4 font-semibold text-blue-700">Cold Email Outreach</th>
                                        <th className="p-4 font-semibold text-indigo-700">LinkedIn Outreach</th>
                                        <th className="p-4 font-semibold text-emerald-700">Channel Winner</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {COMPARISON_DATA.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4 font-medium text-slate-900">{row.metric}</td>
                                            <td className="p-4 text-slate-600">{row.coldEmail}</td>
                                            <td className="p-4 text-slate-600">{row.linkedin}</td>
                                            <td className="p-4 font-semibold text-blue-600">{row.advantage}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Channel Deep Dive 1: Cold Email */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="w-8 h-8 text-blue-600" />
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">
                                Cold Email Outreach: Strengths, Weaknesses & Economics
                            </h2>
                        </div>
                        <p>
                            Modern cold email has evolved far beyond raw spam blasts. With the implementation of Google and Yahoo's sender policies, success requires automated multi-inbox rotation, calibrated warmups, and deep contextual personalization.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    Why Cold Email Scales
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>• <strong>Horizontal Scale:</strong> Connect 10+ mailboxes across 3 domains to reach 300+ prospects daily safely.</li>
                                    <li>• <strong>Lower Overhead:</strong> No costly per-seat enterprise licenses; platforms like AutoMindz offer full features starting at $37/mo.</li>
                                    <li>• <strong>Rich Media & Attachments:</strong> Share calendar links, Loom videos, and formatted briefs directly.</li>
                                    <li>• <strong>Zero Risk to Personal Brand:</strong> Work done via secondary domains shields your personal profile from bans.</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    The Drawbacks of Cold Email
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>• <strong>DNS Rigor:</strong> Requires correct SPF, DKIM, and DMARC configuration before sending.</li>
                                    <li>• <strong>Data Cleanliness:</strong> Outdated email lists cause hard bounces, degrading domain reputation.</li>
                                    <li>• <strong>Anonymity:</strong> Prospects cannot immediately verify who you are without clicking your links.</li>
                                </ul>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500">
                            Looking to audit your inbox setup? Review our step-by-step{' '}
                            <Link to="/blog/cold-email-deliverability-checklist" className="text-blue-600 font-semibold underline hover:text-blue-700">
                                Cold Email Deliverability Checklist
                            </Link>{' '}
                            to secure 99% primary inbox placement.
                        </p>
                    </section>

                    {/* Channel Deep Dive 2: LinkedIn Outreach */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Linkedin className="w-8 h-8 text-indigo-600" />
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">
                                LinkedIn Outreach: High Trust at Low Volume
                            </h2>
                        </div>
                        <p>
                            LinkedIn remains the premier B2B professional network with over 1 billion registered members. Reaching decision-makers directly through connection requests, voice notes, and InMails produces outstanding trust when executed thoughtfully.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                    Why LinkedIn Converts
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>• <strong>Instant Credibility:</strong> Prospects see your work history, shared mutual connections, and content.</li>
                                    <li>• <strong>High In-App Engagement:</strong> Push notifications on mobile yield open rates upwards of 75%.</li>
                                    <li>• <strong>Relationship Longevity:</strong> Once connected, you can nurture leads continuously through organic post feeds.</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    The Drawbacks of LinkedIn
                                </h3>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li>• <strong>Severe Volume Bottlenecks:</strong> Capped at 100–200 invites weekly per personal account.</li>
                                    <li>• <strong>Aggressive Bot Bans:</strong> Third-party Chrome scrapers risk permanent profile bans.</li>
                                    <li>• <strong>Expensive Subscriptions:</strong> Sales Navigator costs $99–$149/mo per representative.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* The Omnichannel Playbook */}
                    <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            The 4-Step Omnichannel Playbook: Why Combining Both Wins
                        </h2>
                        <p className="mb-6 text-slate-600">
                            Rather than choosing between cold email or LinkedIn, elite sales development reps (SDRs) run an integrated 10-day touchpoint sequence. Prospect familiarity across multiple channels drives an average <strong>280% increase in closed-won opportunities</strong>:
                        </p>

                        <div className="space-y-4">
                            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex gap-4">
                                <div className="text-blue-600 font-extrabold text-xl shrink-0">Day 1</div>
                                <div>
                                    <h4 className="font-bold text-slate-950 text-base">LinkedIn Soft Touch</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        View the prospect's profile. Like or comment on a recent article or milestone. Send a blank or low-pressure connection request ("Noticed your work scaling the engineering team at [Company]—would love to connect").
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex gap-4">
                                <div className="text-blue-600 font-extrabold text-xl shrink-0">Day 3</div>
                                <div>
                                    <h4 className="font-bold text-slate-950 text-base">Hyper-Personalized Cold Email</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Dispatch a 75-word email using the Problem-Agitate-Solve framework. Mention your LinkedIn visit ("Sent a quick connection request on LinkedIn earlier this week...").
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex gap-4">
                                <div className="text-blue-600 font-extrabold text-xl shrink-0">Day 7</div>
                                <div>
                                    <h4 className="font-bold text-slate-950 text-base">LinkedIn Direct Voice Note or Message</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        If connected, drop a 20-second voice note or brief DM: "Hey [First Name], shared a quick idea regarding your outreach pipeline via email earlier this week—did that hit your radar?"
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex gap-4">
                                <div className="text-blue-600 font-extrabold text-xl shrink-0">Day 10</div>
                                <div>
                                    <h4 className="font-bold text-slate-950 text-base">Value-Add Email Resource</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Follow up by delivering an actionable resource (checklist, template, or case study) without asking for a 30-minute sales pitch.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* How AutoMindz Accelerates Outbound */}
                    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 sm:p-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 mb-4">
                            How AutoMindz Digital Labs Solves the Scaling Challenge
                        </h2>
                        <p className="mb-4 text-slate-700">
                            Most founders spend hundreds of dollars per month juggling Apollo for leads, Lemlist for emails, and Sales Navigator for LinkedIn prospecting.
                        </p>
                        <p className="mb-6 text-slate-700">
                            <strong>AutoMindz Digital Labs</strong> eliminates SaaS subscription fragmentation by uniting multi-inbox cold email dispatch, Google Gemini AI personalization, and a live B2B website email scraper into one streamlined dashboard starting completely free.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                Start Outreach For Free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/blog/best-cold-email-tools-for-startups"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Compare Top Outreach Tools
                            </Link>
                        </div>
                    </section>

                    {/* Frequently Asked Questions */}
                    <section>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 mb-6">
                            Frequently Asked Questions: Cold Email vs LinkedIn
                        </h2>
                        <div className="space-y-3">
                            {faqItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full text-left p-5 font-bold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors"
                                    >
                                        <span className="pr-4">{item.q}</span>
                                        {faqOpen[idx] ? (
                                            <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                                        )}
                                    </button>
                                    {faqOpen[idx] && (
                                        <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100 mt-2 bg-slate-50/50">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Related Resources */}
                    <section className="pt-6 border-t border-slate-200">
                        <h3 className="text-xl font-bold text-slate-950 mb-4">Explore More Outbound Engineering Guides</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link
                                to="/blog/how-to-write-cold-emails-that-get-replies"
                                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 shadow-2xs transition-colors group"
                            >
                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 mb-1 transition-colors">
                                    How to Write Cold Emails That Get Replies →
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Master 5 psychological frameworks and subject line structures that convert B2B prospects.
                                </p>
                            </Link>
                            <Link
                                to="/blog/ai-cold-email-outreach-complete-guide"
                                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 shadow-2xs transition-colors group"
                            >
                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 mb-1 transition-colors">
                                    AI Cold Email Outreach: The Complete Guide →
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Discover how AI models research prospects and compose high-converting icebreakers at scale.
                                </p>
                            </Link>
                        </div>
                    </section>
                </div>

                {/* Bottom High-Converting CTA Banner */}
                <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-center text-white relative overflow-hidden border border-slate-800 shadow-xl my-14">
                    <div className="max-w-xl mx-auto">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Scale Your Outbound Sales Pipeline</h3>
                        <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
                            Join thousands of B2B leaders using AutoMindz to land in the primary inbox, automate follow-ups, and book qualified meetings on autopilot.
                        </p>
                        <Link
                            to="/register"
                            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            Start Free — 50 Emails/Day <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-10 text-xs text-slate-500">
                <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
                            <Zap className="w-3.5 h-3.5 fill-white" />
                        </div>
                        <span className="font-bold text-slate-900">AutoMindz Digital Labs</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} AutoMindz Digital Labs. All rights reserved.</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                        <Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
                        <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
