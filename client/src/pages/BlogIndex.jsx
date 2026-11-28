import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <SEO
        title="Cold Email Outreach & B2B Lead Generation Blog | AutoMindz"
        description="Actionable strategies on B2B cold email outreach, best link building agency evaluations, BuzzStream & Brevo alternatives, multi-inbox deliverability, and sales automation."
        url="https://automindzdigitallabs.online/blog"
        customSchema={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "AutoMindz Blog",
            "url": "https://automindzdigitallabs.online/blog",
            "description": "Actionable strategies on B2B cold email outreach, best link building agency evaluations, BuzzStream & Brevo alternatives, multi-inbox deliverability, and sales automation."
        }}
      />

      {/* Clean Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold text-slate-950 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Zap className="w-4 h-4 fill-white" />
                </div>
                AutoMindz <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Blog</span>
            </Link>
            <div className="flex items-center gap-4">
                <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Home</Link>
                <Link to="/register" className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
                    Start Free
                </Link>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* Header */}
        <header className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-4 shadow-2xs">
                Resource Library & Guides
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4">
                Cold Email & Outreach <span className="text-blue-600">Growth Guides</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
                Actionable blueprints on deliverability, finding the best link building agency, BuzzStream & Brevo alternatives, AI personalization, and B2B sales automation.
            </p>
        </header>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">

            {/* Featured Post: Top 10 Link Building Agencies */}
            <Link to="/blog/top-link-building-agencies" className="group flex flex-col bg-white border border-blue-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/top-link-building-agencies-india.svg"
                        alt="Top 10 Link Building Agencies in 2027 - Best Link Building Agency Review"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        2027 Audit Listicle
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Editorial Team</span>
                            <span>•</span>
                            <span>14 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            Top 10 Link Building Agencies (2027 Review & Pricing): Best Link Building Agency
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Detailed review of the top 10 white-hat link building companies, digital PR services, backlink pricing models, and how to automate outreach in-house.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Agency Guide <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Featured Post 2: Top Guest Posting & Content Writing Firms */}
            <Link to="/blog/guest-posting-and-content-writing-firms" className="group flex flex-col bg-white border border-blue-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/guest-posting-content-writing-firms.svg"
                        alt="Top 8 Firms Combining Guest Posting and Content Writing Excellence (2027 Review)"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Editorial Review
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Editorial Team</span>
                            <span>•</span>
                            <span>14 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            Top 8 Firms Combining Guest Posting & Content Writing Excellence
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            In-depth comparison of top guest posting firms combining high-DA outreach, human editorial writing, zero-PBN standards, and automated workflows.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 1: BuzzStream Alternative */}
            <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/buzzstream-alternative-guide.svg"
                        alt="Best BuzzStream Alternative for Link Building Outreach"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Tool Benchmark
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Aman Siddiqui</span>
                            <span>•</span>
                            <span>8 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            Best BuzzStream Alternative in 2026: Link Building & Outreach CRM
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Compare features, multi-inbox sender rotation, AI personalization, and pricing between BuzzStream and modern outreach platforms.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Comparison <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 2: Brevo Alternative */}
            <Link to="/blog/brevo-alternative-cold-email-outreach" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/brevo-alternative-cold-outreach.svg"
                        alt="Brevo Alternative for Cold Email Outreach"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Deliverability
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Aman Siddiqui</span>
                            <span>•</span>
                            <span>7 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            Why AutoMindz is the Leading Brevo Alternative for B2B Cold Outreach
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Why newsletter platforms like Brevo prohibit cold lists, and why dedicated multi-inbox infrastructure delivers higher open rates.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Comparison <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 3: B2B Email Finder */}
            <Link to="/blog/how-to-find-business-emails-from-website" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/b2b-email-finder-guide.jpg"
                        alt="How to Find Business Emails From Any Website for Free"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Lead Generation
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Aman Siddiqui</span>
                            <span>•</span>
                            <span>9 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            How to Find Business Emails From Any Website for Free (2026 Guide)
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Step-by-step blueprint to find direct decision-maker emails without paying for expensive contact databases.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 4: AI Cold Email Outreach */}
            <Link to="/blog/ai-cold-email-outreach-strategy" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/ai-cold-email-outreach.jpg"
                        alt="AI Cold Email Outreach Strategy for B2B Sales"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        AI Outreach
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Aman Siddiqui</span>
                            <span>•</span>
                            <span>10 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            AI Cold Email Outreach: How to 5x Your B2B Reply Rates in 2026
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Learn how revenue teams deploy Gemini AI to compose hyper-personalized emails that convert at 20%+ rates.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 5: Multi-Inbox Rotation */}
            <Link to="/blog/multi-inbox-cold-email-rotation" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/multi-inbox-rotation-guide.jpg"
                        alt="Multi-Inbox Cold Email Rotation Deliverability"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Deliverability
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Aman Siddiqui</span>
                            <span>•</span>
                            <span>8 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            Multi-Inbox Cold Email Rotation: Scale Without Spam Filters
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            How to horizontally scale outreach across multiple accounts, configure DNS, and protect your primary domain reputation.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 6: Best Free Cold Email Software */}
            <Link to="/blog/best-free-cold-email-software" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/free-cold-email-tools.jpg"
                        alt="Best Free Cold Email Software Comparison"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Free Tools
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Editorial Team</span>
                            <span>•</span>
                            <span>6 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            Best Free Cold Email Software: Top Outbound Tools Without Credit Card
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Compare sending limits, deliverability features, and multi-inbox support across top free cold email software platforms.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 7: Deliverability Hacks */}
            <Link to="/blog/deliverability-hacks" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/deliverability-hacks.jpg"
                        alt="Cold Email Deliverability Hacks"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Deliverability
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Editorial Team</span>
                            <span>•</span>
                            <span>7 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            7 Cold Email Deliverability Hacks to Land in the Primary Inbox
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Master SPF, DKIM, DMARC, custom tracking domains, and warmup schedules to achieve 98%+ deliverability rates.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 8: Solve B2B Sales Droughts */}
            <Link to="/blog/solve-b2b-sales-droughts" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/sales-droughts.jpg"
                        alt="Solve B2B Sales Droughts"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Growth Strategy
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Editorial Team</span>
                            <span>•</span>
                            <span>8 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            How to End B2B Sales Droughts with High-Converting Cold Outbound
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            A proven outbound framework for agency owners and SaaS founders to generate qualified sales calls predictably.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

            {/* Post 9: Escaping Spam Folder */}
            <Link to="/blog/escaping-spam-folder" className="group flex flex-col bg-white border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all">
                <div className="h-48 overflow-hidden relative border-b border-slate-100">
                    <img
                        src="/blog/spam-folder-recovery.jpg"
                        alt="Escaping the Spam Folder"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                        Troubleshooting
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-semibold text-blue-600">Editorial Team</span>
                            <span>•</span>
                            <span>9 min read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-950 mb-2.5 group-hover:text-blue-600 transition-colors leading-snug">
                            How to Escape the Spam Folder & Restore Your Sender Reputation
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            Step-by-step diagnostic to fix spam filter penalties, remove blacklists, and rebuild trust with Google and Outlook.
                        </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold text-xs group-hover:gap-1.5 transition-all pt-3 border-t border-slate-100">
                        Read Article <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                </div>
            </Link>

        </div>
      </main>

      {/* Bottom CTA */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-950 mb-3">Ready to put these strategies into action?</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-lg mx-auto">
                Join 2,500+ SDRs and link builders who generate qualified pipeline with AutoMindz.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-7 py-3.5 rounded-lg shadow-sm transition-colors">
                Start Free — 50 Emails/Day Forever <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="font-bold text-slate-900">AutoMindz Digital Labs</span>
            </div>
            <p>&copy; {new Date().getFullYear()} AutoMindz Digital Labs. All rights reserved.</p>
            <div className="flex items-center gap-4">
                <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                <Link to="/blog/top-link-building-agencies" className="hover:text-blue-600 transition-colors">Top Link Agencies</Link>
                <Link to="/blog/buzzstream-alternative-cold-outreach-link-building" className="hover:text-blue-600 transition-colors">BuzzStream Alternative</Link>
                <Link to="/blog/brevo-alternative-cold-email-outreach" className="hover:text-blue-600 transition-colors">Brevo Alternative</Link>
                <Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
