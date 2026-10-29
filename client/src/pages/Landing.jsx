import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Send, Users, BarChart3, Bot, Timer, Shield, ArrowRight, Check,
    Search, Star, ChevronDown, ChevronUp, Layers, CheckCircle2,
    Activity, Server, Sparkles, Building2
} from 'lucide-react';
import SEO from '../components/SEO.jsx';

const FEATURES = [
    {
        icon: Layers,
        title: 'Multi-Inbox Rotation',
        desc: 'Distribute send volume evenly across multiple Google Workspace and Gmail inboxes to protect domain reputation and maximize deliverability.',
        badge: 'Core Engine'
    },
    {
        icon: Bot,
        title: 'Gemini AI Personalization',
        desc: 'Generate high-converting personalized pitches, context-aware icebreakers, and subject lines tailored to each prospect company and role.',
        badge: 'AI Powered'
    },
    {
        icon: Timer,
        title: 'Smart Sequence Auto-Stop',
        desc: 'Automate multi-step follow-ups that instantly and automatically cease the exact millisecond a prospect replies to any thread.',
        badge: 'Automated'
    },
    {
        icon: Search,
        title: 'B2B Website Email Finder',
        desc: 'Crawl target corporate domains to discover direct decision-maker email addresses with integrated MX/SMTP validity checking.',
        badge: 'Lead Scraping'
    },
    {
        icon: Shield,
        title: 'Inbox Deliverability Suite',
        desc: 'Comprehensive SPF, DKIM, and DMARC alignment monitoring with real-time spam trigger detection and human-like sending jitter.',
        badge: 'Protection'
    },
    {
        icon: BarChart3,
        title: 'Real-Time Telemetry',
        desc: 'Track live opens, link clicks, direct replies, and delivery status with granular campaign analytics and conversion attribution.',
        badge: 'Analytics'
    },
    {
        icon: Users,
        title: 'Integrated Outreach CRM',
        desc: 'Manage prospect pipelines, log communication history, organize team accounts, and prevent duplicate prospecting across campaigns.',
        badge: 'CRM Built-in'
    },
    {
        icon: Send,
        title: 'Bulk Outreach Orchestration',
        desc: 'Scale high-volume campaigns safely with automated daily send caps, staggered dispatch windows, and custom tracking domains.',
        badge: 'High Velocity'
    },
];

const PLANS = [
    {
        id: 'free',
        name: 'Free Forever',
        price: 0,
        desc: 'Perfect for solo founders, freelancers, and testing outbound campaigns.',
        features: [
            '50 emails / day',
            '200 active contacts',
            '1 connected Gmail / Workspace inbox',
            'Built-in outreach CRM',
            'Real-time spam score analysis',
            'Standard email tracking'
        ],
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 37,
        badge: 'Growing Teams',
        desc: 'For early-stage sales teams needing AI writing and follow-up sequences.',
        features: [
            '200 emails / day',
            '2,000 active contacts',
            '2 connected Gmail inboxes',
            'Gemini AI personalization engine',
            '2-step automated follow-up sequences',
            'CSV bulk contact imports',
            'Priority deliverability support'
        ],
    },
    {
        id: 'growth',
        name: 'Growth',
        price: 74,
        badge: 'Most Popular',
        desc: 'For scaling agencies and B2B SaaS teams requiring multi-inbox rotation.',
        features: [
            '1,000 emails / day',
            '10,000 active contacts',
            '5 connected Gmail inboxes',
            'Horizontal multi-inbox sender rotation',
            '5-step smart follow-up sequences',
            'Full Gemini AI prompt studio',
            'Deep B2B website email finder',
            'Custom tracking domain support'
        ],
    },
    {
        id: 'pro',
        name: 'Scale Pro',
        price: 124,
        desc: 'High-volume outbound infrastructure for enterprises and outbound agencies.',
        features: [
            '5,000 emails / day',
            '50,000 active contacts',
            '15 connected Gmail inboxes',
            'Advanced multi-domain mailbox pooling',
            'Unlimited sequence steps',
            'Automated sending jitter & warmup guidance',
            'Dedicated account manager',
            '99.9% uptime SLA'
        ],
    },
];

const TESTIMONIALS = [
    {
        name: 'Priya Sharma',
        role: 'Founder, GrowthLabs India',
        text: 'AutoMindz completely transformed our outbound agency. We rotated 6 mailboxes sending 1,200 cold emails daily with a 99.4% inbox placement rate. No other tool offers this value.',
        metric: '340% Pipeline Increase'
    },
    {
        name: 'James Keller',
        role: 'VP of Sales, CloudSaaS',
        text: 'The Gemini AI personalization combined with instant reply auto-stopping boosted our response rate from 3.2% to 19.4%. It saves our SDRs 15 hours every single week.',
        metric: '19.4% Reply Rate'
    },
    {
        name: 'Ananya Roy',
        role: 'SEO & Link Building Director, WebReach',
        text: 'We replaced our $400/month BuzzStream and Hunter subscriptions with AutoMindz. We now scrape prospects and run high-DA blogger outreach all in one seamless dashboard.',
        metric: '$4,200 Saved Annually'
    },
];

const FAQS = [
    {
        q: 'What is AutoMindz and how does it guarantee high deliverability?',
        a: 'AutoMindz is an enterprise-grade cold email outreach and B2B lead generation platform. Unlike newsletter tools that send emails via shared, untrusted IPs, AutoMindz connects directly to your authorized Google Workspace or Gmail inboxes via OAuth2. It rotates your email volume across multiple connected mailboxes and applies randomized sending delays (jitter), ensuring each mailbox stays within safe daily limits so your emails land straight into the primary inbox.'
    },
    {
        q: 'How does AutoMindz compare to BuzzStream for link building outreach?',
        a: 'BuzzStream was built over a decade ago as a manual PR database with restrictive per-seat pricing. AutoMindz is a modern outreach platform featuring automated multi-inbox sender rotation, integrated B2B website email scraping, and Gemini AI personalization. You can scale high-DA link outreach and blogger pitching without paying hundreds of dollars per user seat.'
    },
    {
        q: 'Can I use Brevo (Sendinblue) or Mailchimp for B2B cold email?',
        a: 'No. Sending cold, unverified B2B lists on Brevo, Mailchimp, or Klaviyo directly violates their Anti-Spam Terms of Service and results in immediate account termination. Those platforms are built exclusively for opt-in newsletters using shared server IPs. AutoMindz is built specifically for cold outbound outreach with dedicated mailbox rotation.'
    },
    {
        q: 'What is horizontal multi-inbox rotation and why is it necessary?',
        a: 'Sending more than 40–50 cold emails per day from a single address triggers spam algorithms on Google and Outlook. AutoMindz solves this by letting you connect multiple sender addresses (e.g., alex@yourdomain.com, outreach@yourdomain.com, growth@yourdomain.com). The system distributes your campaign queue evenly across them, allowing you to send 500 to 5,000+ emails daily while keeping each individual inbox safe.'
    },
    {
        q: 'Does AutoMindz automatically stop sending follow-ups when someone replies?',
        a: 'Yes, 100%. AutoMindz continuously monitors your connected Gmail inboxes via webhooks and OAuth2. The exact second an incoming reply is detected from any recipient, all pending scheduled follow-ups for that contact are instantly and permanently paused.'
    },
    {
        q: 'Is there really a free forever plan available?',
        a: 'Yes. Our Free tier includes 50 emails/day, 200 active contacts, 1 connected Gmail account, spam score checking, and full access to our outreach CRM. There is no time trial, no credit card required, and no hidden catches.'
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
                "description": "Enterprise AI-powered cold email outreach, B2B email finder, and multi-inbox sender rotation."
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
        <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <SEO
                title="AutoMindz — Enterprise AI Cold Email Outreach & Deliverability Platform"
                description="Scale your B2B sales pipeline with AutoMindz. Multi-inbox Gmail rotation, Gemini AI personalization, automated follow-up sequences, and deep website email scraping."
                url="https://automindzdigitallabs.online"
                keywords="cold email outreach, B2B cold email software, multi-inbox rotation, BuzzStream alternative, Brevo alternative, link building outreach, automated follow-ups, B2B email finder"
                customSchema={structuredData}
            />

            {/* Crisp Top Navigation Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                            <Zap className="w-5 h-5 fill-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-slate-950 flex items-center gap-1.5">
                                AutoMindz
                                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                    Labs
                                </span>
                            </span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                        <a href="#workflow" className="hover:text-blue-600 transition-colors">How It Works</a>
                        <a href="#cockpit" className="hover:text-blue-600 transition-colors">Cockpit</a>
                        <a href="#comparison" className="hover:text-blue-600 transition-colors">Benchmarks</a>
                        <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                        <Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
                        <Link to="/blog/top-link-building-agencies-in-india" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                            Top Agencies 2026
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 transition-colors">
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                            Start Free <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Clean Enterprise Hero Section */}
            <section className="relative pt-14 pb-20 md:pt-20 md:pb-24 bg-gradient-to-b from-blue-50/40 via-white to-slate-50/50 overflow-hidden border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 text-center">

                    {/* Status Pill */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 mb-6 shadow-2xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                        </span>
                        <span>AutoMindz 2.0 Engine: Multi-Inbox Rotation & Gemini AI Active</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.14]">
                        High-Deliverability Cold Email.
                        <br />
                        <span className="text-blue-600">
                            Engineered for Predictable Revenue.
                        </span>
                    </h1>

                    {/* Subhead */}
                    <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                        Rotate multiple Google Workspace & Gmail inboxes automatically. Scrape verified B2B decision-maker emails, personalize at scale with Gemini AI, and pause sequences the instant a prospect responds.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-9">
                        <Link
                            to="/register"
                            className="w-full sm:w-auto px-8 py-3.5 rounded-lg font-bold text-base text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                            Start Free — 50 Emails/Day Forever
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="#cockpit"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-lg font-semibold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-colors flex items-center justify-center gap-2"
                        >
                            Explore Live Cockpit Preview
                        </a>
                    </div>

                    {/* Trust Signals */}
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-9 text-xs sm:text-sm text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free Forever Tier
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No Credit Card Required
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1-Click Google OAuth2 Setup
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Primary Inbox Focus
                        </span>
                    </div>

                    {/* Cockpit Mockup */}
                    <div id="cockpit" className="mt-14 md:mt-20 text-left">
                        <div className="glass-panel-elevated p-5 sm:p-7 max-w-5xl mx-auto border border-slate-300 relative bg-white shadow-xl">

                            {/* Window Top Bar */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                    <span className="ml-3 font-mono text-slate-500 hidden sm:inline">
                                        AutoMindz Cluster Orchestrator — v2.4 (Active)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-semibold">
                                        CLUSTER HEALTH: 99.8%
                                    </span>
                                </div>
                            </div>

                            {/* Cockpit 3-Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">

                                {/* Col 1: Connected Mailboxes Fleet (4 cols) */}
                                <div className="lg:col-span-4 rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                <Server className="w-3.5 h-3.5 text-blue-600" />
                                                Sender Fleet (Rotation)
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                                                3 Connected
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900">alex@outreach-hq.com</div>
                                                    <div className="text-[10px] text-slate-500">Google Workspace • 42/50 sent</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-600">100%</span>
                                                    <div className="text-[9px] text-slate-400">Pristine</div>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900">growth@sales-pipeline.io</div>
                                                    <div className="text-[10px] text-slate-500">Google Workspace • 38/50 sent</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-600">99.4%</span>
                                                    <div className="text-[9px] text-slate-400">Pristine</div>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900">partnership@founderlab.online</div>
                                                    <div className="text-[10px] text-slate-500">Google Workspace • 45/50 sent</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-600">99.8%</span>
                                                    <div className="text-[9px] text-slate-400">Pristine</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                                        <span>Round-Robin Jitter:</span>
                                        <span className="font-mono text-slate-700 font-medium">90s – 180s Random</span>
                                    </div>
                                </div>

                                {/* Col 2: Active AI Sequence Flow (5 cols) */}
                                <div className="lg:col-span-5 rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                Active Sequence Tree
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                                                Gemini AI Active
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                                                    <span>Step 1: AI Personalized Icebreaker</span>
                                                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] font-semibold border border-emerald-200">Active</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                                                    {`"Saw your recent expansion into {{market}} — thought you'd find this relevant..."`}
                                                </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                                                    <span>Step 2: Case Study & Proof</span>
                                                    <span className="text-slate-500 text-[10px] font-mono">+3 Days</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                                                    {`"Quick 30-sec breakdown of how {{competitor}} scaled their pipeline..."`}
                                                </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                                        Sequence Safety Guard
                                                    </span>
                                                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-bold">
                                                        Enabled
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-emerald-800 mt-1">
                                                    Instantly pauses follow-ups for recipient the exact second a reply is detected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                                        <span>Target Decision-Makers:</span>
                                        <span className="font-mono text-slate-700 font-medium">Verified via Domain Crawler</span>
                                    </div>
                                </div>

                                {/* Col 3: Live Conversion Metrics (3 cols) */}
                                <div className="lg:col-span-3 rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5 text-blue-600" />
                                            Real-Time Telemetry
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-[11px] text-slate-500 font-medium">Open Rate (Tracking Pixel)</div>
                                                <div className="text-2xl font-extrabold text-blue-700">74.2%</div>
                                                <div className="text-[10px] text-emerald-700 font-semibold">↑ 3.2x industry standard</div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-200">
                                                <div className="text-[11px] text-slate-500 font-medium">Positive Reply Rate</div>
                                                <div className="text-2xl font-extrabold text-slate-900">26.8%</div>
                                                <div className="text-[10px] text-emerald-700 font-semibold">↑ 4.8x newsletter CTR</div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-200">
                                                <div className="text-[11px] text-slate-500 font-medium">Spam Complaints</div>
                                                <div className="text-xl font-extrabold text-emerald-600">0.00%</div>
                                                <div className="text-[10px] text-slate-500">Zero domain flags</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200">
                                        <span className="text-[10px] text-slate-500 font-mono">Synced with Google API</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Live Stats Strip */}
            <section className="border-b border-slate-200 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">10M+</div>
                        <div className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Outbound Emails Sent</div>
                    </div>
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-tight">99.4%</div>
                        <div className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Primary Inbox Delivery</div>
                    </div>
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 tracking-tight">18x</div>
                        <div className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Average Campaign ROI</div>
                    </div>
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">2,500+</div>
                        <div className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">Active SDRs & Agency Teams</div>
                    </div>
                </div>
            </section>

            {/* How It Works (Workflow) */}
            <section id="workflow" className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">
                        Outreach Architecture
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                        How AutoMindz Works in <span className="text-blue-600">3 Clean Steps</span>
                    </h2>
                    <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-base">
                        Engineered to eliminate manual data entry, prevent domain burn, and close qualified deals automatically.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-300">
                        <div className="text-5xl font-black text-slate-200 mb-4 font-mono">01</div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2.5">Connect Inboxes via OAuth2</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Authenticate your Google Workspace or Gmail mailboxes in one click. No insecure SMTP passwords or app password management required.
                        </p>
                    </div>

                    <div className="glass-panel p-8 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-300">
                        <div className="text-5xl font-black text-slate-200 mb-4 font-mono">02</div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2.5">Scrape & Verify Decision-Makers</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Input target company websites. Our built-in domain crawler extracts executive contacts and performs real-time MX deliverability verification.
                        </p>
                    </div>

                    <div className="glass-panel p-8 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-300">
                        <div className="text-5xl font-black text-slate-200 mb-4 font-mono">03</div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2.5">Launch with Multi-Inbox Rotation</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            AutoMindz personalizes every email with Gemini AI, distributes volume across all connected inboxes, and pauses follow-ups the moment a prospect replies.
                        </p>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section id="features" className="py-20 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">
                            Platform Features
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                            Engineered for High-Converting <span className="text-blue-600">Outbound Sales</span>
                        </h2>
                        <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-base">
                            Stop juggling multiple disconnected tools. AutoMindz integrates the entire outbound lifecycle under one clean interface.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {FEATURES.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <div key={i} className="glass-panel p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                {f.badge}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-base mb-2">{f.title}</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Listicle Callout: Top 10 Link Building Agencies in India */}
            <section className="max-w-7xl mx-auto px-6 py-12">
                <div className="glass-panel-elevated p-8 md:p-10 border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 rounded-2xl shadow-xs">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                                <Building2 className="w-3.5 h-3.5" /> Featured 2026 Industry Report
                            </div>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
                                Top 10 Link Building Agencies in India (and How to Scale In-House)
                            </h3>
                            <p className="text-sm md:text-base text-slate-600 mt-2.5 leading-relaxed">
                                Evaluating link building vendors or planning to bring blogger outreach in-house? Read our comprehensive review comparing India's top 10 link building agencies, pricing models, and how to save $3,000+/month using automated cold outreach.
                            </p>
                        </div>
                        <div className="flex-shrink-0 w-full lg:w-auto">
                            <Link
                                to="/blog/top-link-building-agencies-in-india"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm w-full lg:w-auto"
                            >
                                Read Top 10 Agencies Review <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Matrix (AutoMindz vs BuzzStream vs Brevo) */}
            <section id="comparison" className="py-20 border-y border-slate-200 bg-slate-50/70">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">
                            Competitive Intelligence
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                            Why Modern Outbound Teams Choose <span className="text-blue-600">AutoMindz</span>
                        </h2>
                        <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-base">
                            See how dedicated cold outreach architecture compares against legacy link tools and newsletter software.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900 border-b border-slate-200">
                                    <th className="p-4 font-bold">Key Capability</th>
                                    <th className="p-4 font-bold text-blue-700">AutoMindz Labs</th>
                                    <th className="p-4 font-bold text-slate-600">BuzzStream</th>
                                    <th className="p-4 font-bold text-slate-600">Brevo (Sendinblue)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-4 font-semibold text-slate-900">Outbound Cold Email Compliance</td>
                                    <td className="p-4 text-emerald-700 font-bold flex items-center gap-2 bg-blue-50/30">
                                        <Check className="w-4 h-4 text-emerald-600" /> 100% Dedicated Outbound
                                    </td>
                                    <td className="p-4 text-slate-600">Manual PR CRM</td>
                                    <td className="p-4 text-rose-600 font-medium">Banned (Opt-in only)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-slate-900">Horizontal Multi-Inbox Rotation</td>
                                    <td className="p-4 text-emerald-700 font-bold flex items-center gap-2 bg-blue-50/30">
                                        <Check className="w-4 h-4 text-emerald-600" /> Built-in Fleet Balancing
                                    </td>
                                    <td className="p-4 text-slate-600">Requires expensive per-seat plans</td>
                                    <td className="p-4 text-rose-600 font-medium">No (Shared SMTP server)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-slate-900">Integrated B2B Email Scraper</td>
                                    <td className="p-4 text-emerald-700 font-bold flex items-center gap-2 bg-blue-50/30">
                                        <Check className="w-4 h-4 text-emerald-600" /> Direct Domain Crawler</td>
                                    <td className="p-4 text-slate-600">Manual browser extension</td>
                                    <td className="p-4 text-slate-400">Not supported</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-slate-900">AI Personalization (Gemini AI)</td>
                                    <td className="p-4 text-emerald-700 font-bold flex items-center gap-2 bg-blue-50/30">
                                        <Check className="w-4 h-4 text-emerald-600" /> Context-Aware LLM Studio</td>
                                    <td className="p-4 text-slate-600">Static templates only</td>
                                    <td className="p-4 text-slate-600">Basic newsletter copy</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-slate-900">Auto-Stop Follow-ups on Reply</td>
                                    <td className="p-4 text-emerald-700 font-bold flex items-center gap-2 bg-blue-50/30">
                                        <Check className="w-4 h-4 text-emerald-600" /> Instant Inbound Sync</td>
                                    <td className="p-4 text-emerald-700 flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-600" /> Supported</td>
                                    <td className="p-4 text-slate-400">Requires custom webhooks</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-slate-900">Free Forever Outbound Plan</td>
                                    <td className="p-4 text-emerald-700 font-bold flex items-center gap-2 bg-blue-50/30">
                                        <Check className="w-4 h-4 text-emerald-600" /> Yes (50/day forever)</td>
                                    <td className="p-4 text-rose-600 font-medium">No (Starts at $24/mo)</td>
                                    <td className="p-4 text-slate-600">Free for newsletters only</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
                        <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5">
                            Read the complete BuzzStream comparison guide <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <Link to="/blog/brevo-alternative-cold-email-outreach" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5">
                            Read why cold outreach beats Brevo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">
                        Transparent Pricing
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                        Predictable Plans for <span className="text-blue-600">Every Scale</span>
                    </h2>
                    <p className="text-slate-600 mt-3 max-w-xl mx-auto text-base">
                        Start free today. Scale your mailbox cluster as your outreach campaign volume grows.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`glass-panel p-6 flex flex-col justify-between relative bg-white border transition-all duration-200 ${
                                plan.badge === 'Most Popular'
                                    ? 'ring-2 ring-blue-600 border-blue-600 shadow-md bg-blue-50/20'
                                    : 'border-slate-200 shadow-xs hover:shadow-md'
                            }`}
                        >
                            <div>
                                {plan.badge && (
                                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                        {plan.badge}
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 mb-5">{plan.desc}</p>

                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-950">${plan.price}</span>
                                    {plan.price > 0 && <span className="text-xs text-slate-500">/month</span>}
                                </div>

                                <ul className="space-y-2.5 mb-7">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                to="/register"
                                className={`w-full py-2.5 rounded-lg text-xs font-bold text-center transition-colors ${
                                    plan.price === 0
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                }`}
                            >
                                {plan.price === 0 ? 'Start Free Forever' : 'Get Started Now'}
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 border-t border-slate-200 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
                            Trusted by High-Growth <span className="text-blue-600">Outbound Operators</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className="glass-panel p-6 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
                                <div>
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, j) => (
                                            <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed mb-6 italic">
                                        "{t.text}"
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-950">{t.name}</div>
                                        <div className="text-xs text-slate-500">{t.role}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {t.metric}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section (AEO & GEO Optimization) */}
            <section id="faq" className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">
                        Documentation & Answers
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                        Frequently Asked <span className="text-blue-600">Questions</span>
                    </h2>
                    <p className="text-slate-600 mt-3 text-base">
                        Direct answers regarding mailbox deliverability, automated rotation, and safety protocols.
                    </p>
                </div>

                <div className="space-y-3.5">
                    {FAQS.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div key={index} className="glass-panel overflow-hidden border border-slate-200 bg-white shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    aria-expanded={isOpen}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                >
                                    <span className="text-base sm:text-lg">{faq.q}</span>
                                    {isOpen ? (
                                        <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    )}
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Bottom High-Converting CTA Banner */}
            <section className="max-w-6xl mx-auto px-6 mb-16">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 px-8 rounded-2xl shadow-lg text-center">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-5">
                        <Zap className="w-7 h-7 text-white fill-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                        Scale Your Outbound Sales Pipeline Today
                    </h2>
                    <p className="text-blue-100 text-base md:text-lg mt-3 mb-7 max-w-2xl mx-auto">
                        Join 2,500+ modern founders, agency operators, and sales teams who land in the primary inbox with AutoMindz.
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-bold text-base text-blue-700 bg-white hover:bg-blue-50 shadow-md transition-colors"
                    >
                        Start Free — 50 Emails/Day Forever <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Clean Enterprise Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Zap className="w-4 h-4 fill-white" />
                        </div>
                        <span className="font-bold text-slate-900 text-base">AutoMindz Digital Labs</span>
                    </div>

                    <p className="text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} AutoMindz Digital Labs. Built for enterprise cold email & deliverability.
                    </p>

                    <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 font-medium">
                        <Link to="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
                        <Link to="/blog/top-link-building-agencies-in-india" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Top Link Building Agencies India</Link>
                        <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="hover:text-blue-600 transition-colors">BuzzStream Alternative</Link>
                        <Link to="/blog/brevo-alternative-cold-email-outreach" className="hover:text-blue-600 transition-colors">Brevo Alternative</Link>
                        <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
                        <a href="mailto:support@automindzdigitallabs.online" className="hover:text-blue-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

