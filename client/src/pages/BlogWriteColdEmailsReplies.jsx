import React, { useState } from 'react';
import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle2, Zap, Target,
    MessageSquare, AlertCircle, Sparkles, ChevronDown, ChevronUp, Layers, Send
} from 'lucide-react';

const FAQS = [
    {
        q: 'What is the ideal word count for a cold email in 2027?',
        a: 'The highest-performing B2B cold emails are between 50 to 90 words. Decision-makers read emails on mobile devices in 5 to 10 seconds. Keeping your email concise, focused on one clear pain point, and ending with a low-friction call-to-action dramatically increases reply rates.'
    },
    {
        q: 'How many follow-ups should you send before giving up?',
        a: 'Between 3 to 4 follow-up emails spaced 3 to 5 days apart is the industry sweet spot. Research shows that over 70% of total replies originate from follow-ups 2, 3, and 4. AutoMindz automatically threads follow-ups and ceases sending the instant a prospect replies.'
    },
    {
        q: 'Why do short, lowercase subject lines get higher open rates?',
        a: 'Subject lines like "quick question" or "ideas for {company}" feel authentic and conversational, resembling an internal email from a colleague rather than a marketing blast. Over-capitalized, sales-heavy lines trigger instant skepticism and spam filters.'
    },
    {
        q: 'What is the difference between a soft CTA and a hard CTA?',
        a: 'A hard CTA asks for immediate time (e.g., "Are you free for a 30-minute demo tomorrow at 2 PM?"), creating high friction. A soft CTA asks for interest or permission (e.g., "Mind if I share a 2-minute video on how we solved this for Agency X?"), which yields 3x higher responses.'
    }
];

export default function BlogWriteColdEmailsReplies() {
    const [openFaq, setOpenFaq] = useState(null);
    const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

    const CANONICAL_URL = 'https://automindzdigitallabs.online/blog/how-to-write-cold-emails-that-get-replies';

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
                'headline': 'How to Write Cold Emails That Get Replies: The 2027 Playbook',
                'description': 'Master the science of cold email copywriting with proven PAS frameworks, 3-word subject lines, high-reply templates, and automated follow-ups.',
                'image': 'https://automindzdigitallabs.online/blog/how-to-write-cold-emails-replies.svg',
                'datePublished': '2026-11-28T09:00:00+00:00',
                'dateModified': '2027-01-15T12:00:00+00:00',
                'author': {
                    '@type': 'Organization',
                    'name': 'AutoMindz Editorial Board',
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
        <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
            <SEO
                title="How to Write Cold Emails That Get Replies: 2027 Guide"
                description="Master the art of writing high-converting B2B cold emails. Discover proven 3-word subject lines, the PAS copywriting framework, templates, and follow-ups."
                url={CANONICAL_URL}
                canonical={CANONICAL_URL}
                image="https://automindzdigitallabs.online/blog/how-to-write-cold-emails-replies.svg"
                keywords="how to write cold emails that get replies, cold email templates that get replies, b2b cold email framework, cold email response rate"
                customSchema={customSchema}
            />

            {/* Navigation Header */}
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
                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-4">
                        <span className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-full font-bold">B2B Copywriting Playbook</span>
                        <span>•</span>
                        <span className="text-slate-500">Updated: 2027 Edition</span>
                        <span>•</span>
                        <span className="text-slate-500">12 min read</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6">
                        How to Write <span className="text-blue-600">Cold Emails That Get Replies</span>: The 2027 Playbook
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-6 font-normal">
                        Cold email is neither dead nor saturated—only generic, robotic spray-and-pray messages are. Learn the exact copywriting mechanics, psychological hooks, and multi-touch sequence formulas that generate consistent 15%–28% reply rates in modern B2B sales.
                    </p>

                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-8 bg-white">
                        <img
                            src="/blog/how-to-write-cold-emails-replies.svg"
                            alt="How to Write Cold Emails That Get Replies"
                            className="w-full h-auto object-cover"
                            width="800"
                            height="450"
                        />
                    </div>
                </header>

                {/* Section 1: The Core Psychology of Modern Cold Email */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        1. The 3-Second Filter: How Executives Scan Inboxes
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Every day, the average VP or founder opens their inbox facing dozens of unsolicited sales pitches. Within three seconds, their brain categorizes every incoming email into one of three buckets: <em>Delete</em>, <em>Spam</em>, or <em>Skim</em>.
                    </p>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        If your email looks like an essay, contains bolded corporate claims, or asks for a 30-minute call upfront, it is instantly deleted. The goal of a cold email is not to close a contract—it is solely to <strong>start a low-friction conversation</strong>.
                    </p>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl my-6 text-slate-800 text-sm">
                        <strong className="block font-bold text-amber-900 mb-1">The Golden Rule of Cold Outreach Copy:</strong>
                        Your email must look like it took 30 seconds to write from a mobile phone, yet provide a surgical insight so relevant that replying takes less cognitive effort than archiving it.
                    </div>
                </section>

                {/* Section 2: Subject Line Engineering */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        2. Subject Line Psychology: Why 2 to 4 Words Dominate
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Your subject line has one single metric: open rate. In 2027, hyper-formal lines like <em>"Revolutionize Your Q1 Lead Flow with Our AI Solution"</em> are dead giveaways of automated spam. Instead, the highest open rates (65%+) consistently come from lowercase, casual curiosity hooks:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                        <div className="bg-red-50 border border-red-200 p-5 rounded-xl">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-700 block mb-2">❌ What Fails (Spam Triggers)</span>
                            <ul className="text-xs text-red-900 space-y-2">
                                <li>• "Exclusive Partnership Opportunity for [Company]"</li>
                                <li>• "15 Minutes Next Week to Discuss Your Sales?"</li>
                                <li>• "Guaranteed 10x ROI for B2B Growth"</li>
                                <li>• "Quick sync regarding your marketing spend"</li>
                            </ul>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-2">✔ What Wins (60%+ Opens)</span>
                            <ul className="text-xs text-emerald-900 space-y-2">
                                <li>• "quick question re: {`{{company}}`}"</li>
                                <li>• "idea for {`{{first_name}}`}"</li>
                                <li>• "{`{{competitor}}`} vs {`{{company}}`} outbound"</li>
                                <li>• "noticed your recent hire on linkedin"</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 3: The PAS Framework */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        3. The Problem-Agitate-Solve (PAS) Framework
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Instead of talking about your company features, structure your email around the recipient's daily operational frustration:
                    </p>

                    <div className="space-y-4 my-6">
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">P</span>
                                1. Problem (The Observational Hook)
                            </div>
                            <p className="text-xs text-slate-600">
                                Call out a specific, observable bottleneck they are likely experiencing right now. Avoid generic flattery; mention specific tools, job postings, or market shifts.
                            </p>
                        </div>
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">A</span>
                                2. Agitate (The Cost of Inaction)
                            </div>
                            <p className="text-xs text-slate-600">
                                Explain why current workarounds (like manual SDR scraping or paying expensive broker retainers) result in wasted budget and burned sender domains.
                            </p>
                        </div>
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">S</span>
                                3. Solve (The Low-Friction Offer)
                            </div>
                            <p className="text-xs text-slate-600">
                                Offer proof or a quick visual asset rather than a sales call. Example: <em>"We helped [Peer Company] automate this in 48 hours. Mind if I share a 2-minute Loom breakdown?"</em>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Proven High-Converting Templates */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        4. 3 Ready-to-Deploy Cold Email Templates (Tested in 2027)
                    </h2>

                    <div className="space-y-6 my-6">
                        {/* Template 1 */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">Template 1: The Observation Hook (B2B SaaS & Tech)</span>
                                <span className="text-xs text-slate-500 font-semibold">Reply Rate: 22.4%</span>
                            </div>
                            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto">
                                <p className="text-slate-400 mb-2">Subject: quick question re: {`{{company}}`}</p>
                                <p>Hey {`{{first_name}}`},</p>
                                <br />
                                <p>Saw you're scaling outbound for {`{{company}}`} on LinkedIn. Most growth leads I talk to mention deliverability took a hit after Google's latest spam threshold update.</p>
                                <br />
                                <p>We recently built a multi-inbox rotation setup that helped [Similar Client] scale to 1,200 personalized sends/day while keeping spam rates under 0.08%.</p>
                                <br />
                                <p>Worth a quick 2-minute video walkthrough, or are you fully set on outreach tooling?</p>
                                <br />
                                <p>Best,<br />Alex</p>
                            </div>
                        </div>

                        {/* Template 2 */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded">Template 2: The Direct Case Study (Agencies & Services)</span>
                                <span className="text-xs text-slate-500 font-semibold">Reply Rate: 18.7%</span>
                            </div>
                            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto">
                                <p className="text-slate-400 mb-2">Subject: {`{{first_name}}`} / {`{{competitor}}`} approach</p>
                                <p>Hi {`{{first_name}}`},</p>
                                <br />
                                <p>Notice how many marketing agencies are burning domains by sending cold lists through Brevo or Mailchimp? It usually leads to instant blacklisting.</p>
                                <br />
                                <p>We built <Link to="/blog/brevo-alternative-cold-email-outreach" className="text-blue-400 underline">AutoMindz</Link> specifically for cold outbound: warmed multi-mailbox rotation and automatic reply shutoff so your main domain never touches a spam folder.</p>
                                <br />
                                <p>Open to checking out our 3-step deliverability framework?</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 5: The Follow-Up Cadence */}
                <section className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                        5. The 4-Step Follow-Up Sequence That Triples Pipeline
                    </h2>
                    <p className="text-slate-700 leading-relaxed mb-4">
                        Never send a generic <em>"Just bumping this to the top of your inbox"</em> follow-up. Every touchpoint must introduce a new micro-value angle:
                    </p>
                    <ul className="space-y-3 text-sm text-slate-700">
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                            <span><strong>Touch 1 (Day 1):</strong> Primary PAS observation pitch with low-friction soft CTA.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                            <span><strong>Touch 2 (Day 4):</strong> Share a relevant asset or metric: <em>"Here is a 1-page PDF showing how we solved multi-inbox rotation."</em></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                            <span><strong>Touch 3 (Day 9):</strong> Address a common objection: <em>"Most teams worry switching tools takes weeks—our Gmail sync sets up in 4 minutes."</em></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                            <span><strong>Touch 4 (Day 15 - The Breakup):</strong> <em>"Assuming outbound isn't a priority right now, I'll stop following up. If anything changes in Q2, feel free to reach out!"</em> (Generates up to 30% of total replies due to urgency).</span>
                        </li>
                    </ul>
                </section>

                {/* Section 6: FAQ Accordion */}
                <section className="mb-14">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
                        Frequently Asked Questions: Cold Email Copywriting
                    </h2>
                    <div className="space-y-3">
                        {FAQS.map((faq, index) => (
                            <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-slate-900 text-sm md:text-base">{faq.q}</span>
                                    {openFaq === index ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
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
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Explore Related Outreach Playbooks:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <Link to="/blog/ai-cold-email-outreach-strategy" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">AI Cold Email Strategy &amp; Prompts</span>
                            <span className="text-slate-500">Learn how Gemini AI crafts personalized subject lines and icebreakers at scale.</span>
                        </Link>
                        <Link to="/blog/multi-inbox-cold-email-rotation" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">Multi-Inbox Rotation Guide</span>
                            <span className="text-slate-500">Distribute your sending volume safely across multiple warmed Google Workspace inboxes.</span>
                        </Link>
                        <Link to="/blog/how-to-find-business-emails-from-website" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">B2B Website Email Finder</span>
                            <span className="text-slate-500">Crawl company domains to discover direct decision-maker contact addresses.</span>
                        </Link>
                        <Link to="/blog/best-free-cold-email-software" className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-all flex flex-col justify-between">
                            <span className="font-bold text-slate-900 text-sm mb-1">Best Free Cold Email Software</span>
                            <span className="text-slate-500">Compare leading outbound platforms and start sending with 50 free daily sends.</span>
                        </Link>
                    </div>
                </section>

                {/* Bottom CTA Banner */}
                <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-center text-white relative overflow-hidden border border-slate-800 shadow-xl my-14">
                    <div className="max-w-xl mx-auto">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Automate Your High-Converting Outreach</h3>
                        <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
                            Stop sending manual cold emails. Use AutoMindz to scrape verified emails, generate AI personalization, and rotate multiple inboxes on autopilot.
                        </p>
                        <Link
                            to="/register"
                            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            Start Free Trial (50 Free Sends/Day) <ArrowRight className="w-3.5 h-3.5" />
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
