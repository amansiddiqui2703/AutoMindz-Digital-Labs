import React from 'react';
import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ArrowLeft } from 'lucide-react';

export default function BlogIndex() {
  return (
    <>
      <SEO 
        title="Cold Email Outreach & B2B Lead Generation Blog | AutoMindz"
        description="Actionable strategies on B2B cold email outreach, multi-inbox deliverability, link building tools, and sales automation from the AutoMindz team."
        url="https://automindzdigitallabs.online/blog"
        customSchema={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "AutoMindz Blog",
            "url": "https://automindzdigitallabs.online/blog",
            "description": "Actionable strategies on B2B cold email outreach, multi-inbox deliverability, link building tools, and sales automation from the AutoMindz team."
        }}
      />

      {/* Basic Public Navigation */}
      <nav className="border-b border-surface-200 dark:border-surface-800 bg-white/50 dark:bg-surface-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary-500" /> AutoMindz
            </Link>
            <div className="flex items-center gap-4">
                <Link to="/" className="text-sm font-medium text-surface-500 hover:text-primary-600 transition-colors">Home</Link>
                <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">
                    Start Free
                </Link>
            </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <header className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 dark:text-white leading-tight mb-6">
                Cold Email & Outreach <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Growth Strategies</span>
            </h1>
            <p className="text-xl text-surface-500 max-w-2xl mx-auto">
                Actionable guides on deliverability, AI personalization, BuzzStream alternatives, and B2B sales automation.
            </p>
        </header>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Featured Post: Top 10 Link Building Agencies in India */}
            <Link to="/blog/top-link-building-agencies-in-india" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent">
                <div className="h-48 bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-amber-500/60 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                        2026 Review Listicle
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span className="font-semibold text-amber-500">Aman Siddiqui</span>
                        <span>•</span>
                        <span>12 min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-amber-500 transition-colors">
                        Top 10 Link Building Agencies in India (2026 In-Depth Review & Pricing)
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        Compare India's premier link building companies, digital PR services, editorial standards, and how to save $3,000+/mo automating outreach in-house.
                    </p>
                    <div className="flex items-center text-amber-500 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Agency Guide <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 1: BuzzStream Alternative */}
            <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-primary-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-primary-600 shadow-sm">
                        Outreach Software
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span className="font-semibold text-primary-600">Aman Siddiqui</span>
                        <span>•</span>
                        <span>8 min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        Best BuzzStream Alternative in 2026: Link Building & Outreach CRM
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        Compare features, multi-inbox sender rotation, AI personalization, and pricing between BuzzStream and modern outreach platforms.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Comparison <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 2: Brevo Alternative */}
            <Link to="/blog/brevo-alternative-cold-email-outreach" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-purple-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-purple-600 shadow-sm">
                        Deliverability Guide
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span className="font-semibold text-purple-600">Aman Siddiqui</span>
                        <span>•</span>
                        <span>7 min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        Why AutoMindz is the Leading Brevo Alternative for B2B Cold Outreach
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        Why newsletter platforms like Brevo prohibit cold lists, and why dedicated multi-inbox infrastructure delivers higher open rates.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Comparison <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 3: B2B Email Finder */}
            <Link to="/blog/how-to-find-business-emails-from-website" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 overflow-hidden relative">
                    <img 
                        src="/blog/b2b-email-finder-guide.jpg" 
                        alt="How to Find Business Emails From Any Website for Free" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-primary-600 shadow-sm">
                        Lead Generation
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span className="font-semibold text-primary-600">Aman Siddiqui</span>
                        <span>•</span>
                        <span>9 min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        How to Find Business Emails From Any Website for Free (2026 Guide)
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        Step-by-step blueprint to find direct decision-maker emails without paying for expensive contact databases.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 4: AI Cold Email Outreach */}
            <Link to="/blog/ai-cold-email-outreach-strategy" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 overflow-hidden relative">
                    <img 
                        src="/blog/ai-cold-email-outreach.jpg" 
                        alt="AI Cold Email Outreach Strategy for B2B Sales" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-purple-600 shadow-sm">
                        AI Outreach
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span className="font-semibold text-primary-600">Aman Siddiqui</span>
                        <span>•</span>
                        <span>10 min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        AI Cold Email Outreach: How to 5x Your B2B Reply Rates in 2026
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        Learn how revenue teams deploy Gemini AI to compose hyper-personalized emails that convert at 20%+ rates.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 5: Multi-Inbox Rotation */}
            <Link to="/blog/multi-inbox-cold-email-rotation" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 overflow-hidden relative">
                    <img 
                        src="/blog/multi-inbox-rotation-guide.jpg" 
                        alt="Multi-Inbox Cold Email Rotation Deliverability" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-green-600 shadow-sm">
                        Deliverability
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span className="font-semibold text-primary-600">Aman Siddiqui</span>
                        <span>•</span>
                        <span>8 min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        Multi-Inbox Cold Email Rotation: Scale Without Spam Filters
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        How to horizontally scale outreach across multiple accounts, configure DNS, and protect your primary domain reputation.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 6 */}
            <Link to="/blog/best-free-cold-email-software" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-primary-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-primary-600 shadow-sm">
                        Tool Reviews
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span>8 min read</span>
                        <span>•</span>
                        <span>Updated 2026</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        Best Free Cold Email Software in 2026: Why Agencies Are Switching to AutoMindz
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        Most cold email software charges $50–$200/month per seat before you even send your first campaign. We compare the top alternatives...
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 7 */}
            <Link to="/blog/deliverability-hacks" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-amber-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-amber-600 shadow-sm">
                        Deliverability
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span>6 min read</span>
                        <span>•</span>
                        <span>Updated 2026</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        12 Deliverability Hacks to Bypass Gmail's Spam Filters
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        If your emails are landing in spam, your copy doesn't matter. Here are 12 technical and strategic hacks to get your cold emails into the primary inbox.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 8: Solve Droughts */}
            <Link to="/blog/solve-b2b-sales-droughts" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-green-500/10 to-teal-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-green-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-green-600 shadow-sm">
                        Sales Strategy
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span>5 min read</span>
                        <span>•</span>
                        <span>Updated 2026</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        How to Solve B2B Sales Droughts with Automated Cold Outreach
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        If your pipeline dries up at the end of the quarter, you are relying too much on referrals. Here is the public's guide to fixing the problem...
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 9: Spam Issues */}
            <Link to="/blog/escaping-spam-folder" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-red-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-red-600 shadow-sm">
                        Email Reputation
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                        <span>6 min read</span>
                        <span>•</span>
                        <span>Updated 2026</span>
                    </div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3 group-hover:text-primary-500 transition-colors">
                        Escaping the Spam Folder: A Public Guide to Email Reputation
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1 line-clamp-3">
                        One of the most frustrating problems companies face is sending important emails that no one ever sees. Here is how you solve the spam problem once and for all.
                    </p>
                    <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </Link>

        </div>

      </main>
      
      {/* Footer CTA */}
      <section className="bg-surface-50 dark:bg-surface-900 py-16 border-t border-surface-200 dark:border-surface-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">Ready to put these strategies into action?</h2>
            <Link to="/register" className="btn-primary py-3 px-8 shadow-xl">
                Start your free AutoMindz account
            </Link>
        </div>
      </section>
    </>
  );
}
