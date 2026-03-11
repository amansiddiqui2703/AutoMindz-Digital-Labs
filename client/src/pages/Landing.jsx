import { Link } from 'react-router-dom';
import {
    Zap, Send, Users, BarChart3, Bot, Timer, Shield, ArrowRight, Check,
    Mail, Search, MousePointerClick, Rocket, Crown, Building, Star
} from 'lucide-react';

const FEATURES = [
    { icon: Send, title: 'Bulk Email Campaigns', desc: 'Send personalized emails to thousands of contacts with smart delays and warmup.' },
    { icon: Bot, title: 'AI-Powered Writing', desc: 'Generate cold emails, subject lines, and follow-ups with Gemini AI.' },
    { icon: Timer, title: 'Auto Follow-Ups', desc: 'Set up automated follow-up sequences that stop when recipients reply.' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track opens, clicks, replies, and bounces with detailed dashboards.' },
    { icon: Users, title: 'Built-in CRM', desc: 'Manage contacts, view full interaction timelines, and organize leads.' },
    { icon: Search, title: 'Email Finder', desc: 'Find email addresses for prospects by crawling company websites.' },
    { icon: Shield, title: 'Deliverability Suite', desc: 'SPF, DKIM, DMARC guidance and spam score checking built in.' },
    { icon: MousePointerClick, title: 'Click Tracking', desc: 'Track every link click with automatic URL wrapping.' },
];

const PLANS = [
    {
        id: 'free', name: 'Free', price: 0, color: 'from-surface-400 to-surface-500',
        features: ['50 emails/day', '200 contacts', '1 Gmail account', 'Basic CRM'],
    },
    {
        id: 'starter', name: 'Starter', price: 37, color: 'from-blue-500 to-blue-600',
        badge: 'Popular',
        features: ['200 emails/day', '2,000 contacts', '2 Gmail accounts', 'AI writing', '2-step follow-ups'],
    },
    {
        id: 'growth', name: 'Growth', price: 74, color: 'from-purple-500 to-purple-600',
        badge: 'Best Value',
        features: ['1,000 emails/day', '10,000 contacts', '5 Gmail accounts', 'Full AI suite', '5-step follow-ups'],
    },
    {
        id: 'pro', name: 'Pro', price: 124, color: 'from-amber-500 to-orange-600',
        features: ['5,000 emails/day', '50,000 contacts', '15 Gmail accounts', 'AI + personalization', 'Unlimited follow-ups'],
    },
];

const TESTIMONIALS = [
    { name: 'Priya S.', role: 'Founder, GrowthLabs', text: 'AutoMindz 10x\'d our outreach. We went from 20 emails/day to 800 with zero deliverability issues.' },
    { name: 'James K.', role: 'Sales Lead, TechCorp', text: 'The AI personalization is insane. Our reply rate jumped from 3% to 18% in the first week.' },
    { name: 'Ananya R.', role: 'Agency Owner', text: 'Finally a tool that doesn\'t cost $200/mo. AutoMindz gives us everything we need at a fraction of the price.' },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-white dark:bg-surface-950">
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
                        <a href="#pricing" className="hover:text-primary-500 transition-colors">Pricing</a>
                        <a href="#testimonials" className="hover:text-primary-500 transition-colors">Reviews</a>
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

                <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-36 text-center">
                    <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        <Zap className="w-4 h-4" /> AI-Powered Cold Email Outreach
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 dark:text-white leading-tight max-w-4xl mx-auto">
                        Scale Your Outreach.
                        <br />
                        <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Close More Deals.</span>
                    </h1>
                    <p className="text-xl text-surface-500 mt-6 max-w-2xl mx-auto leading-relaxed">
                        Send AI-personalized emails at scale, track every open and click, automate follow-ups,
                        and manage your pipeline — all from one powerful platform.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-10">
                        <Link to="/register" className="btn-primary text-base !py-3.5 !px-8 shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 transition-all">
                            Start Free — No CC Required <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-8 text-sm text-surface-500">
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Free forever plan</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> No credit card required</span>
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Setup in 2 minutes</span>
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
                        { n: '2,500+', l: 'Active Users' },
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
                    <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">Everything You Need to <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Win Deals</span></h2>
                    <p className="text-surface-500 mt-4 max-w-2xl mx-auto">A complete email outreach platform with built-in CRM, AI, and automation.</p>
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

            {/* Pricing */}
            <section id="pricing" className="bg-surface-50 dark:bg-surface-900 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">Simple, Transparent <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Pricing</span></h2>
                        <p className="text-surface-500 mt-4">Start free. Upgrade when you need more power.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {PLANS.map((plan) => (
                            <div key={plan.id} className={`glass-card p-6 relative ${plan.badge === 'Best Value' ? 'ring-2 ring-purple-500 shadow-xl shadow-purple-500/10' : ''}`}>
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
            <section id="testimonials" className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">Loved by <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Sales Teams</span></h2>
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

            {/* CTA */}
            <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Scale Your Outreach?</h2>
                    <p className="text-primary-100 text-lg mb-8">Join 2,500+ sales professionals already using AutoMindz.</p>
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
                    <p className="text-sm text-surface-500">&copy; {new Date().getFullYear()} AutoMindz. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-sm text-surface-500">
                        <Link to="/privacy-policy" className="hover:text-primary-500 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms</Link>
                        <a href="mailto:support@automindz.com" className="hover:text-primary-500 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
