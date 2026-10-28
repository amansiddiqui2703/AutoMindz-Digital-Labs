import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, Send, Users, BarChart3, Bot, Timer, Shield, ArrowRight, Check,
    Search, Star, ChevronDown, ChevronUp, Layers, CheckCircle2,
    Activity, Server, Sparkles, Building2, ExternalLink
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
        <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-primary-500/30 selection:text-white">
            <SEO 
                title="AutoMindz — Enterprise AI Cold Email Outreach & Deliverability Platform"
                description="Scale your B2B sales pipeline with AutoMindz. Multi-inbox Gmail rotation, Gemini AI personalization, automated follow-up sequences, and deep website email scraping."
                url="https://automindzdigitallabs.online"
                keywords="cold email outreach, B2B cold email software, multi-inbox rotation, BuzzStream alternative, Brevo alternative, link building outreach, automated follow-ups, B2B email finder"
                customSchema={structuredData}
            />

            {/* Subtle Engineering Grid Background */}
            <div className="fixed inset-0 pointer-events-none glass-grid-bg opacity-35 z-0" />
            
            {/* Ambient Radial Backlights */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-primary-600/15 via-accent-500/5 to-transparent blur-[120px] pointer-events-none z-0" />

            {/* Floating Glass Navigation */}
            <div className="relative z-50 pt-4 px-4 sm:px-6">
                <nav className="max-w-7xl mx-auto rounded-2xl backdrop-blur-2xl bg-slate-900/75 border border-white/10 px-6 py-3.5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                                AutoMindz
                                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                    Labs
                                </span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium hidden sm:block">Outreach & Deliverability</span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
                        <a href="#cockpit" className="hover:text-white transition-colors">Cockpit</a>
                        <a href="#comparison" className="hover:text-white transition-colors">Benchmarks</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <Link to="/blog/top-link-building-agencies-in-india" className="text-amber-400 hover:text-amber-300 flex items-center gap-1">
                            Top Agencies 2026
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors">
                            Sign In
                        </Link>
                        <Link 
                            to="/register" 
                            className="text-sm font-semibold text-white bg-gradient-to-r from-primary-500 via-primary-600 to-accent-600 hover:from-primary-400 hover:to-accent-500 px-4 py-2 rounded-xl shadow-lg shadow-primary-500/25 border border-white/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
                        >
                            Start Free <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Hero Section */}
            <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    
                    {/* Live Indicator Pill */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill border border-emerald-500/25 text-xs font-semibold text-emerald-400 mb-8 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>AutoMindz 2.0 Engine Live: Multi-Inbox Rotation & Gemini AI Active</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
                        High-Deliverability Cold Email.
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                            Engineered for Predictable Revenue.
                        </span>
                    </h1>

                    {/* Subhead */}
                    <p className="mt-7 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
                        Rotate multiple Google Workspace & Gmail inboxes automatically. Scrape verified B2B decision-maker emails, personalize at scale with Gemini AI, and pause sequences the instant a prospect responds.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                        <Link 
                            to="/register" 
                            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-primary-500 via-primary-600 to-accent-600 hover:from-primary-400 hover:to-accent-500 shadow-xl shadow-primary-500/30 border border-white/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            Start Free — 50 Emails/Day Forever
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a 
                            href="#cockpit" 
                            className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-sm text-slate-200 glass-panel hover:bg-slate-800/80 border border-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            Explore Live Cockpit Preview
                        </a>
                    </div>

                    {/* Trust Signals */}
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-10 text-xs sm:text-sm text-slate-400 font-medium">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Forever Tier
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Credit Card Required
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1-Click Google OAuth2 Setup
                        </span>
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Primary Inbox Focus
                        </span>
                    </div>

                    {/* Glassmorphic Live Cockpit Mockup */}
                    <div id="cockpit" className="mt-16 md:mt-24 text-left">
                        <div className="glass-panel-elevated p-4 sm:p-7 max-w-5xl mx-auto border border-white/15 relative overflow-hidden">
                            {/* Window Top Bar */}
                            <div className="flex items-center justify-between pb-5 border-b border-white/10 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/40" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
                                    <span className="ml-3 font-mono text-slate-400 hidden sm:inline">
                                        AutoMindz Cluster Orchestrator — v2.4 (Active)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                                    <span className="font-mono text-emerald-400 font-medium">CLUSTER HEALTH: 99.8%</span>
                                </div>
                            </div>

                            {/* Cockpit 3-Column Glass Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
                                
                                {/* Col 1: Connected Mailboxes Fleet (4 cols) */}
                                <div className="lg:col-span-4 rounded-xl bg-slate-950/60 border border-white/5 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                <Server className="w-3.5 h-3.5 text-primary-400" />
                                                Sender Fleet (Rotation)
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-500/20 text-primary-300">
                                                3 Connected
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-white">alex@outreach-hq.com</div>
                                                    <div className="text-[10px] text-slate-400">Google Workspace • 42/50 sent</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-400">100%</span>
                                                    <div className="text-[9px] text-slate-500">Pristine</div>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-white">growth@sales-pipeline.io</div>
                                                    <div className="text-[10px] text-slate-400">Google Workspace • 38/50 sent</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-400">99.4%</span>
                                                    <div className="text-[9px] text-slate-500">Pristine</div>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-semibold text-white">partnership@founderlab.online</div>
                                                    <div className="text-[10px] text-slate-400">Google Workspace • 45/50 sent</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-400">99.8%</span>
                                                    <div className="text-[9px] text-slate-500">Pristine</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                                        <span>Round-Robin Jitter:</span>
                                        <span className="font-mono text-slate-200">90s – 180s Random</span>
                                    </div>
                                </div>

                                {/* Col 2: Active AI Sequence Flow (5 cols) */}
                                <div className="lg:col-span-5 rounded-xl bg-slate-950/60 border border-white/5 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                                Active Sequence Tree
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                                Gemini 2.5 Active
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                                <div className="flex items-center justify-between text-xs font-semibold text-white">
                                                    <span>Step 1: AI Personalized Icebreaker</span>
                                                    <span className="text-emerald-400 text-[10px]">Active</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                                    {`"Saw your recent expansion into {{market}} — thought you'd find this relevant..."`}
                                                </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                                                <div className="flex items-center justify-between text-xs font-semibold text-white">
                                                    <span>Step 2: Case Study & Proof</span>
                                                    <span className="text-slate-400 text-[10px] font-mono">+3 Days</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                                    {`"Quick 30-sec breakdown of how {{competitor}} scaled their pipeline..."`}
                                                </p>
                                            </div>

                                            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="w-3 h-3 text-emerald-400" />
                                                        Sequence Safety Guard
                                                    </span>
                                                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                                        Enabled
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-emerald-200/80 mt-1">
                                                    Instantly pauses follow-ups for recipient the exact second a reply is detected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                                        <span>Target Decision-Makers:</span>
                                        <span className="font-mono text-slate-200">Verified via Domain Crawler</span>
                                    </div>
                                </div>

                                {/* Col 3: Live Conversion Metrics (3 cols) */}
                                <div className="lg:col-span-3 rounded-xl bg-slate-950/60 border border-white/5 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5 text-blue-400" />
                                            Real-Time Telemetry
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-[11px] text-slate-400">Open Rate (Tracking Pixel)</div>
                                                <div className="text-2xl font-extrabold text-white">74.2%</div>
                                                <div className="text-[10px] text-emerald-400 font-medium">↑ 3.2x industry standard</div>
                                            </div>

                                            <div className="pt-2 border-t border-white/5">
                                                <div className="text-[11px] text-slate-400">Positive Reply Rate</div>
                                                <div className="text-2xl font-extrabold text-white">26.8%</div>
                                                <div className="text-[10px] text-emerald-400 font-medium">↑ 4.8x newsletter CTR</div>
                                            </div>

                                            <div className="pt-2 border-t border-white/5">
                                                <div className="text-[11px] text-slate-400">Spam Complaints</div>
                                                <div className="text-xl font-extrabold text-emerald-400">0.00%</div>
                                                <div className="text-[10px] text-slate-400">Zero domain flags</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5">
                                        <span className="text-[10px] text-slate-500 font-mono">Synced with Google API</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Live Stats Strip */}
            <section className="relative z-10 border-y border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">10M+</div>
                        <div className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Outbound Emails Sent</div>
                    </div>
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-emerald-400 tracking-tight">99.4%</div>
                        <div className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Primary Inbox Delivery</div>
                    </div>
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-indigo-400 tracking-tight">18x</div>
                        <div className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Average Campaign ROI</div>
                    </div>
                    <div>
                        <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">2,500+</div>
                        <div className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">Active SDRs & Agency Teams</div>
                    </div>
                </div>
            </section>

            {/* How It Works (Architecture Workflow) */}
            <section id="workflow" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-primary-500/20 text-xs font-semibold text-primary-400 uppercase tracking-wider mb-4">
                        Outreach Architecture
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                        How AutoMindz Works in <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">3 Clean Steps</span>
                    </h2>
                    <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base">
                        Engineered to eliminate manual data entry, prevent domain burn, and close qualified deals automatically.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-panel p-8 relative group hover:border-primary-500/40 transition-all duration-300">
                        <div className="text-5xl font-black text-white/10 mb-4 font-mono">01</div>
                        <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-5">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2.5">Connect Inboxes via OAuth2</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Authenticate your Google Workspace or Gmail mailboxes in one click. No insecure SMTP passwords or app password management required.
                        </p>
                    </div>

                    <div className="glass-panel p-8 relative group hover:border-purple-500/40 transition-all duration-300">
                        <div className="text-5xl font-black text-white/10 mb-4 font-mono">02</div>
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2.5">Scrape & Verify Decision-Makers</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Input target company websites. Our built-in domain crawler extracts executive contacts and performs real-time MX deliverability verification.
                        </p>
                    </div>

                    <div className="glass-panel p-8 relative group hover:border-emerald-500/40 transition-all duration-300">
                        <div className="text-5xl font-black text-white/10 mb-4 font-mono">03</div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2.5">Launch with Multi-Inbox Rotation</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            AutoMindz personalizes every email with Gemini AI, distributes volume across all connected inboxes, and pauses follow-ups the moment a prospect replies.
                        </p>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-white/10 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                        Everything You Need
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                        Engineered for High-Converting <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Outbound Sales</span>
                    </h2>
                    <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base">
                        Stop juggling multiple disconnected tools. AutoMindz integrates the entire outbound lifecycle under one glass interface.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div key={i} className="glass-panel p-6 hover:border-primary-500/30 transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                                            {f.badge}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Featured Listicle Callout: Top 10 Link Building Agencies in India */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="glass-panel-elevated p-8 md:p-10 border border-amber-500/20 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-amber-950/20">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 uppercase tracking-wider mb-4">
                                <Building2 className="w-3.5 h-3.5" /> Featured 2026/2027 Industry Report
                            </div>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                Top 10 Link Building Agencies in India (and How to Scale In-House)
                            </h3>
                            <p className="text-sm md:text-base text-slate-300 mt-3 leading-relaxed">
                                Evaluating link building vendors or planning to bring blogger outreach in-house? Read our comprehensive review comparing India's top 10 link building agencies, pricing models, and how to save $3,000+/month using automated cold outreach.
                            </p>
                        </div>
                        <div className="flex-shrink-0 w-full lg:w-auto">
                            <Link 
                                to="/blog/top-link-building-agencies-in-india" 
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-xl shadow-amber-500/15 w-full lg:w-auto"
                            >
                                Read Top 10 Agencies Review <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Matrix (AutoMindz vs BuzzStream vs Brevo) */}
            <section id="comparison" className="relative z-10 py-20 border-y border-white/10 bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-primary-500/20 text-xs font-semibold text-primary-400 uppercase tracking-wider mb-4">
                            Competitive Intelligence
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                            Why Modern Outbound Teams Choose <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">AutoMindz</span>
                        </h2>
                        <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base">
                            See how dedicated cold outreach architecture compares against legacy link tools and newsletter software.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm glass-panel border border-white/10 rounded-2xl overflow-hidden">
                            <thead>
                                <tr className="bg-slate-900/90 text-white border-b border-white/10">
                                    <th className="p-5 font-bold">Key Capability</th>
                                    <th className="p-5 font-bold text-primary-400">AutoMindz Labs</th>
                                    <th className="p-5 font-bold text-slate-400">BuzzStream</th>
                                    <th className="p-5 font-bold text-slate-400">Brevo (Sendinblue)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr>
                                    <td className="p-5 font-semibold text-white">Outbound Cold Email Compliance</td>
                                    <td className="p-5 text-emerald-400 font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> 100% Dedicated Outbound
                                    </td>
                                    <td className="p-5 text-slate-400">Manual PR CRM</td>
                                    <td className="p-5 text-rose-400 font-medium">Banned (Opt-in only)</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-white">Horizontal Multi-Inbox Rotation</td>
                                    <td className="p-5 text-emerald-400 font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Built-in Fleet Balancing
                                    </td>
                                    <td className="p-5 text-slate-400">Requires expensive per-seat plans</td>
                                    <td className="p-5 text-rose-400 font-medium">No (Shared SMTP server)</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-white">Integrated B2B Email Scraper</td>
                                    <td className="p-5 text-emerald-400 font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Direct Domain Crawler</td>
                                    <td className="p-5 text-slate-400">Manual browser extension</td>
                                    <td className="p-5 text-slate-500">Not supported</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-white">AI Personalization (Gemini AI)</td>
                                    <td className="p-5 text-emerald-400 font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Context-Aware LLM Studio</td>
                                    <td className="p-5 text-slate-400">Static templates only</td>
                                    <td className="p-5 text-slate-400">Basic newsletter copy</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-white">Auto-Stop Follow-ups on Reply</td>
                                    <td className="p-5 text-emerald-400 font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Instant Inbound Sync</td>
                                    <td className="p-5 text-emerald-400 flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Supported</td>
                                    <td className="p-5 text-slate-500">Requires custom webhooks</td>
                                </tr>
                                <tr>
                                    <td className="p-5 font-semibold text-white">Free Forever Outbound Plan</td>
                                    <td className="p-5 text-emerald-400 font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Yes (50/day forever)</td>
                                    <td className="p-5 text-rose-400 font-medium">No (Starts at $24/mo)</td>
                                    <td className="p-5 text-slate-400">Free for newsletters only</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm">
                        <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5">
                            Read the complete BuzzStream comparison guide <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-slate-600 hidden sm:inline">•</span>
                        <Link to="/blog/brevo-alternative-cold-email-outreach" className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1.5">
                            Read why cold outreach beats Brevo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-white/10 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                            Transparent Pricing
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                            Predictable Plans for <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Every Scale</span>
                        </h2>
                        <p className="text-slate-400 mt-4 max-w-xl mx-auto text-base">
                            Start free today. Scale your mailbox cluster as your outreach campaign volume grows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {PLANS.map((plan) => (
                            <div 
                                key={plan.id} 
                                className={`glass-panel p-7 flex flex-col justify-between relative transition-all duration-300 hover:border-white/25 ${
                                    plan.badge === 'Most Popular' ? 'ring-2 ring-primary-500 shadow-2xl shadow-primary-500/20 bg-slate-900/90' : ''
                                }`}
                            >
                                <div>
                                    {plan.badge && (
                                        <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                                            {plan.badge}
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 mb-5">{plan.desc}</p>
                                    
                                    <div className="mb-6 flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">${plan.price}</span>
                                        {plan.price > 0 && <span className="text-xs text-slate-400">/month</span>}
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                                                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Link 
                                    to="/register" 
                                    className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all ${
                                        plan.price === 0
                                            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                                            : 'bg-gradient-to-r from-primary-500 to-accent-600 hover:from-primary-400 hover:to-accent-500 text-white shadow-lg shadow-primary-500/25 border border-white/20'
                                    }`}
                                >
                                    {plan.price === 0 ? 'Start Free Forever' : 'Get Started Now'}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                        Trusted by High-Growth <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Outbound Operators</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="glass-panel p-7 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed mb-6 italic">
                                    "{t.text}"
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-white">{t.name}</div>
                                    <div className="text-xs text-slate-400">{t.role}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {t.metric}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section (AEO & GEO Optimization) */}
            <section id="faq" className="relative z-10 py-24 border-t border-white/10 bg-slate-950/40">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-primary-500/20 text-xs font-semibold text-primary-400 uppercase tracking-wider mb-4">
                            Answers & Documentation
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                            Frequently Asked <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Questions</span>
                        </h2>
                        <p className="text-slate-400 mt-4 text-base">
                            Direct answers regarding mailbox deliverability, automated rotation, and safety protocols.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={index} className="glass-panel overflow-hidden border border-white/10 transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={isOpen}
                                        className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-primary-400 transition-colors"
                                    >
                                        <span className="text-base sm:text-lg">{faq.q}</span>
                                        {isOpen ? (
                                            <ChevronUp className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        )}
                                    </button>
                                    {isOpen && (
                                        <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Bottom High-Converting CTA */}
            <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-primary-950/30 to-slate-950">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/30">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                        Scale Your Outbound Sales Pipeline Today
                    </h2>
                    <p className="text-slate-300 text-base md:text-lg mt-4 mb-8 max-w-2xl mx-auto">
                        Join 2,500+ modern founders, agency operators, and sales teams who land in the primary inbox with AutoMindz.
                    </p>
                    <Link 
                        to="/register" 
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-primary-500 via-primary-600 to-accent-600 hover:from-primary-400 hover:to-accent-500 shadow-2xl shadow-primary-500/40 border border-white/20 transition-all hover:scale-105"
                    >
                        Start Free — 50 Emails/Day Forever <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Glass Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-slate-950/90 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white text-base">AutoMindz Digital Labs</span>
                    </div>

                    <p className="text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} AutoMindz Digital Labs. Built for enterprise cold email & deliverability.
                    </p>

                    <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 font-medium">
                        <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <Link to="/blog/top-link-building-agencies-in-india" className="text-amber-400 hover:text-amber-300 transition-colors">Top Link Building Agencies India</Link>
                        <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="hover:text-white transition-colors">BuzzStream Alternative</Link>
                        <Link to="/blog/brevo-alternative-cold-email-outreach" className="hover:text-white transition-colors">Brevo Alternative</Link>
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <a href="mailto:support@automindzdigitallabs.online" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
