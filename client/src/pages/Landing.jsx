import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Send, Users, BarChart3, Bot, Timer, Shield, ArrowRight, Check,
    Search, MousePointerClick, Star, ChevronDown, ChevronUp, Layers, HelpCircle
} from 'lucide-react';
import SEO from '../components/SEO.jsx';

const FEATURES = [
    { icon: Send, title: 'Bulk Email Campaigns', desc: 'Send personalized emails to thousands of verified contacts with smart delays, jitter, and automated warmup.' },
    { icon: Bot, title: 'AI-Powered Writing', desc: 'Generate high-converting cold email pitches, subject lines, and multi-step follow-ups with Gemini AI.' },
    { icon: Timer, title: 'Auto Follow-Ups', desc: 'Set up intelligent follow-up sequences that automatically cease sending the second a lead replies.' },
    { icon: Layers, title: 'Multi-Inbox Rotation', desc: 'Distribute send volume evenly across multiple Google Workspace and Gmail accounts to protect domain health.' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track opens, link clicks, replies, and deliverability with live conversion dashboards.' },
    { icon: Users, title: 'Built-in Outreach CRM', desc: 'Manage prospect relationships, track conversation status, and organize your sales pipeline.' },
    { icon: Search, title: 'B2B Email Finder', desc: 'Crawl target business websites to discover direct, verified decision-maker email addresses for free.' },
    { icon: Shield, title: 'Deliverability Suite', desc: 'SPF, DKIM, and DMARC guidance with spam score checkers to land directly in the primary inbox.' },
];

const PLANS = [
    {
        id: 'free', name: 'Free', price: 0, color: 'from-surface-400 to-surface-500',
        features: ['50 emails/day', '200 contacts', '1 Gmail account', 'Basic CRM', 'Spam score checking'],
    },
    {
        id: 'starter', name: 'Starter', price: 37, color: 'from-blue-500 to-blue-600',
        badge: 'Popular',
        features: ['200 emails/day', '2,000 contacts', '2 Gmail accounts', 'AI writing suite', '2-step follow-ups'],
    },
    {
        id: 'growth', name: 'Growth', price: 74, color: 'from-purple-500 to-purple-600',
        badge: 'Best Value',
        features: ['1,000 emails/day', '10,000 contacts', '5 Gmail accounts', 'Full AI suite', '5-step follow-ups', 'Multi-inbox rotation'],
    },
    {
        id: 'pro', name: 'Pro', price: 124, color: 'from-amber-500 to-orange-600',
        features: ['5,000 emails/day', '50,000 contacts', '15 Gmail accounts', 'Advanced personalization', 'Unlimited follow-ups', 'Priority deliverability'],
    },
];

const TESTIMONIALS = [
    { name: 'Priya S.', role: 'Founder, GrowthLabs', text: "AutoMindz 10x'd our outreach. We went from 20 emails/day to 800 across 5 inboxes with zero deliverability issues." },
    { name: 'James K.', role: 'Sales Lead, TechCorp', text: 'The AI personalization is incredible. Our reply rate jumped from 3% to 18% within the very first week of switching.' },
    { name: 'Ananya R.', role: 'Agency Owner', text: "Finally an outreach platform that doesn't charge $200/month per seat. AutoMindz gives us everything we need at a fraction of the cost." },
];

const FAQS = [
    {
        q: 'What is AutoMindz and how does cold email outreach work?',
        a: 'AutoMindz is an all-in-one B2B cold email outreach platform. It connects directly to your Google Workspace or Gmail accounts via secure OAuth2, allowing you to send personalized cold email campaigns, automate follow-up sequences, and find verified business emails from target websites.'
    },
    {
        q: 'How does AutoMindz compare to BuzzStream for link building and blogger outreach?',
        a: 'While BuzzStream focuses primarily on manual PR and link management with legacy per-user pricing, AutoMindz provides native multi-inbox sender rotation, automated B2B website email scraping, and Gemini AI personalization. This enables SEO and link building agencies to scale prospect pitches faster and at lower costs.'
    },
    {
        q: 'Can I use Brevo or Mailchimp for B2B cold email outreach?',
        a: 'No. Platforms like Brevo and Mailchimp are designed exclusively for opt-in newsletters. Uploading cold prospecting lists to Brevo violates their Terms of Service and leads to instant account suspensions. AutoMindz is purpose-built for outbound cold outreach, sending individual emails through authenticated mailboxes to ensure primary inbox delivery.'
    },
    {
        q: 'How does multi-inbox sender rotation protect domain deliverability?',
        a: 'Instead of sending hundreds of emails from a single address, AutoMindz automatically distributes your campaign volume across multiple connected Gmail and Google Workspace accounts. Keeping daily volume below 40–50 sends per inbox ensures your sender reputation remains pristine.'
    },
    {
        q: 'Does AutoMindz automatically stop sending follow-ups when someone replies?',
        a: 'Yes. AutoMindz continuously synchronizes with your Gmail inbox. The moment an incoming reply is detected from a recipient, all subsequent scheduled follow-up steps for that contact are instantly paused.'
    },
    {
        q: 'Is there really a free forever plan?',
        a: 'Yes! The Free plan gives you 50 emails/day, 200 contacts, and 1 connected Gmail account with zero time limits and no credit card required. You can upgrade anytime as your outreach needs scale.'
    }
];

export default function Landing() {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (idx) => {
        setOpenFaq(openFaq === idx ? null : idx);
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "name": "AutoMindz Digital Labs",
                "url": "https://automindzdigitallabs.online",
                "description": "AI-powered cold email outreach, B2B contact finder, and automated follow-ups."
            },
            {
                "@type": "SoftwareApplication",
                "name": "AutoMindz",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "url": "https://automindzdigitallabs.online",
                "offers": {
                    "@type": "Offer",
                    "price": "0.00",
                    "priceCurrency": "USD",
                    "category": "Freemium"
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": FAQS.map(f => ({
                    "@type": "Question",
                    "name": f.q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": f.a
                    }
                }))
            }
        ]
    };

    return (
        <div className="min-h-screen bg-white dark:bg-surface-950">
            <SEO 
                title="AutoMindz — AI Cold Email Outreach & Lead Generation Platform"
                description="Scale your B2B sales outreach with AutoMindz. Multi-inbox Gmail rotation, AI personalization, automated follow-up sequences, and built-in website email finder."
                url="https://automindzdigitallabs.online"
                keywords="cold email outreach, B2B outreach software, BuzzStream alternative, Brevo alternative, link building outreach, automated follow-ups, email finder, multi-inbox rotation"
                customSchema={structuredData}
            />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">AutoMindz</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-surface-600 dark:text-surface-400">
                        <a href="#features" className="hover:text-primary-500 transition-colors">Features</a>
                        <a href="#comparison" className="hover:text-primary-500 transition-colors">Compare</a>
                        <a href="#pricing" className="hover:text-primary-500 transition-colors">Pricing</a>
                        <a href="#faq" className="hover:text-primary-500 transition-colors">FAQ</a>
                        <Link to="/blog" className="hover:text-primary-500 transition-colors">Blog</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-semibold text-surface-700 dark:text-surface-300 hover:text-primary-500 transition-colors">Log In</Link>
                        <Link to="/register" className="btn-primary text-sm !py-2 !px-5">Start Free <ArrowRight className="w-4 h-4" /></Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5" />
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-[100px]" />
                <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/10 blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        <Zap className="w-4 h-4" /> AI-Powered Cold Email Outreach & Lead Generation
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-surface-900 dark:text-white leading-tight max-w-4xl mx-auto">
                        Scale Your Outreach.
                        <br />
                        <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Land In The Inbox.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-surface-600 dark:text-surface-400 mt-6 max-w-2xl mx-auto leading-relaxed">
                        Send AI-personalized emails at scale with multi-inbox rotation, automatically stop follow-ups on reply, find decision-maker emails, and scale deals effortlessly.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
                        <Link to="/register" className="btn-primary text-base !py-3.5 !px-8 shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 transition-all">
                            Start Free — No CC Required <ArrowRight className="w-5 h-5 ml-1" />
                        </Link>
                        <a href="#comparison" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-surface-300 dark:border-surface-700 font-semibold text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                            Compare with BuzzStream & Brevo
                        </a>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-surface-500">
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Free forever tier</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> No credit card required</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> 2-minute setup</span>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="border-y border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { n: '10M+', l: 'Emails Sent' },
                        { n: '99.2%', l: 'Delivery Rate' },
                        { n: '15x', l: 'ROI Average' },
                        { n: '2,500+', l: 'Active Outreach Teams' },
                    ].map((s, i) => (
                        <div key={i}>
                            <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{s.n}</div>
                            <div className="text-surface-500 text-sm mt-1 font-medium">{s.l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">Everything You Need to <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Close More Deals</span></h2>
                    <p className="text-surface-500 mt-4 max-w-2xl mx-auto">A comprehensive outreach platform engineered for modern B2B sales and link building teams.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div key={i} className="group glass-card p-6 hover:shadow-xl transition-all cursor-default">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Icon className="w-6 h-6 text-primary-500" />
                                </div>
                                <h3 className="font-bold text-surface-900 dark:text-white mb-2">{f.title}</h3>
                                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Comparison Section (BuzzStream & Brevo Keyword Strategy) */}
            <section id="comparison" className="bg-surface-50 dark:bg-surface-900 py-24 border-y border-surface-200 dark:border-surface-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                            Competitive Benchmark
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
                            Why Modern Teams Choose <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">AutoMindz</span>
                        </h2>
                        <p className="text-surface-600 dark:text-surface-400 mt-4 max-w-2xl mx-auto">
                            See how dedicated cold outreach architecture compares to legacy link outreach tools and newsletter platforms.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm bg-white dark:bg-surface-950 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-sm">
                            <thead>
                                <tr className="bg-surface-100 dark:bg-surface-900/80 text-surface-900 dark:text-white border-b border-surface-200 dark:border-surface-800">
                                    <th className="p-5 font-bold">Key Capability</th>
                                    <th className="p-5 font-bold text-primary-600">AutoMindz</th>
                                    <th className="p-5 font-bold text-surface-600 dark:text-surface-400">BuzzStream</th>
                                    <th className="p-5 font-bold text-surface-600 dark:text-surface-400">Brevo (Sendinblue)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                                <tr>
                                    <td className="p-5 font-semibold text-surface-900 dark:text-white">B2B Cold Outreach Compliance</td>
                                    <td className="p-5 text-green-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> 100% Dedicated Outbound</td>
                                    <td className="p-5 text-surface-600">PR & Blogger focus</td>
                                    <td className="p-5 text-red-500 font-medium">Banned (Opt-in only)</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-surface-900 dark:text-white">Multi-Gmail Sender Rotation</td>
                                    <td className="p-5 text-green-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Built-in Horizontal Rotation</td>
                                    <td className="p-5 text-surface-500">Requires multi-seat pricing</td>
                                    <td className="p-5 text-red-500 font-medium">No (Shared SMTP IP)</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-surface-900 dark:text-white">Website Decision-Maker Email Finder</td>
                                    <td className="p-5 text-green-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Integrated Domain Crawler</td>
                                    <td className="p-5 text-surface-500">Manual Chrome extension</td>
                                    <td className="p-5 text-surface-500">Not supported</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-surface-900 dark:text-white">AI Personalization (Gemini AI)</td>
                                    <td className="p-5 text-green-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Native Prompt Engine</td>
                                    <td className="p-5 text-surface-500">Static templates</td>
                                    <td className="p-5 text-surface-500">Newsletter copywriter</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-surface-900 dark:text-white">Auto-Stop Follow-ups on Reply</td>
                                    <td className="p-5 text-green-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Instant Inbound Sync</td>
                                    <td className="p-5 text-green-600 flex items-center gap-1.5"><Check className="w-4 h-4" /> Yes</td>
                                    <td className="p-5 text-surface-500">Complex webhook setup</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-surface-900 dark:text-white">Free Forever Plan Available</td>
                                    <td className="p-5 text-green-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Yes (50/day forever)</td>
                                    <td className="p-5 text-red-500 font-medium">No (Starts at $24/mo)</td>
                                    <td className="p-5 text-surface-500">Free for opt-in only</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
                        <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="text-primary-600 hover:underline font-semibold flex items-center gap-1">
                            Read the complete BuzzStream comparison guide <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-surface-300 dark:text-surface-700">•</span>
                        <Link to="/blog/brevo-alternative-cold-email-outreach" className="text-primary-600 hover:underline font-semibold flex items-center gap-1">
                            Read why cold outreach beats Brevo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">Simple, Transparent <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Pricing</span></h2>
                        <p className="text-surface-500 mt-4">Start free. Upgrade as your outreach needs scale.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {PLANS.map((plan) => (
                            <div key={plan.id} className={`glass-card p-6 relative flex flex-col justify-between ${plan.badge === 'Best Value' ? 'ring-2 ring-purple-500 shadow-xl shadow-purple-500/10' : ''}`}>
                                <div>
                                    {plan.badge && (
                                        <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                                            {plan.badge}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">{plan.name}</h3>
                                    <div className="mt-3 mb-6">
                                        <span className="text-4xl font-extrabold text-surface-900 dark:text-white">${plan.price}</span>
                                        {plan.price > 0 && <span className="text-surface-500 text-sm">/mo</span>}
                                    </div>
                                    <ul className="space-y-2.5 mb-8">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <Link to="/register" className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${plan.price === 0
                                    ? 'bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300'
                                    : `text-white bg-gradient-to-r ${plan.color} hover:opacity-90 shadow-lg`
                                    }`}>
                                    {plan.price === 0 ? 'Start Free' : 'Get Started'}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20 border-t border-surface-200 dark:border-surface-800">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">Trusted by Top <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Growth Leaders</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="glass-card p-6">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                            </div>
                            <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold text-surface-900 dark:text-white text-sm">{t.name}</div>
                                    <div className="text-xs text-surface-500">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section (AEO & GEO Optimization) */}
            <section id="faq" className="bg-surface-50 dark:bg-surface-900 py-24 border-t border-surface-200 dark:border-surface-800">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                            Frequently Asked Questions
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
                            Answers to Common <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Questions</span>
                        </h2>
                        <p className="text-surface-500 mt-4">Everything you need to know about AutoMindz deliverability, automation, and pricing.</p>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={index} className="glass-card overflow-hidden border border-surface-200 dark:border-surface-800 transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={isOpen}
                                        className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-surface-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    >
                                        <span className="text-base md:text-lg">{faq.q}</span>
                                        {isOpen ? (
                                            <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-surface-400 flex-shrink-0" />
                                        )}
                                    </button>
                                    {isOpen && (
                                        <div className="px-6 pb-6 text-sm md:text-base text-surface-600 dark:text-surface-400 leading-relaxed border-t border-surface-100 dark:border-surface-800/50 pt-4">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Scale Your B2B Outreach?</h2>
                    <p className="text-primary-100 text-lg mb-8">Join 2,500+ sales and outreach professionals already using AutoMindz.</p>
                    <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold py-3.5 px-8 rounded-xl text-base hover:bg-primary-50 transition-all shadow-xl">
                        Get Started Free <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-surface-900 dark:text-white">AutoMindz</span>
                    </div>
                    <p className="text-sm text-surface-500">&copy; {new Date().getFullYear()} AutoMindz Digital Labs. All rights reserved.</p>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-surface-500">
                        <Link to="/blog" className="hover:text-primary-500 transition-colors">Blog</Link>
                        <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="hover:text-primary-500 transition-colors">BuzzStream Alternative</Link>
                        <Link to="/blog/brevo-alternative-cold-email-outreach" className="hover:text-primary-500 transition-colors">Brevo Alternative</Link>
                        <Link to="/privacy-policy" className="hover:text-primary-500 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms</Link>
                        <a href="mailto:support@automindzdigitallabs.online" className="hover:text-primary-500 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
