import React from 'react';
import SEO from '../components/SEO.jsx';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ArrowLeft } from 'lucide-react';

export default function BlogIndex() {
  return (
    <>
      <SEO 
        title="Blog — AutoMindz Cold Email & SEO Strategies"
        description="Learn the latest strategies for cold email outreach, B2B lead generation, and deliverability from the AutoMindz team."
        url="https://automindz.com/blog"
        customSchema={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "AutoMindz Blog",
            "description": "Learn the latest strategies for cold email outreach, B2B lead generation, and deliverability from the AutoMindz team."
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
                Cold Email <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Growth Strategies</span>
            </h1>
            <p className="text-xl text-surface-500 max-w-2xl mx-auto">
                Actionable guides on deliverability, AI personalization, and B2B sales automation.
            </p>
        </header>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Post 1 */}
            <Link to="/blog/best-free-cold-email-software" className="group glass-card flex flex-col overflow-hidden hover:shadow-xl transition-all border border-surface-200 dark:border-surface-800">
                <div className="h-48 bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center p-6 relative overflow-hidden">
                    <Zap className="w-16 h-16 text-primary-500/50 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-800 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md text-primary-600 shadow-sm">
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

            {/* Placeholder Post 2 */}
            <div className="group glass-card flex flex-col overflow-hidden border border-surface-200 dark:border-surface-800 opacity-60">
                <div className="h-48 bg-surface-100 dark:bg-surface-800 flex items-center justify-center p-6 relative">
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-700 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md text-surface-600 shadow-sm">
                        Deliverability
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3">
                        12 Deliverability Hacks to Bypass Gmail's Spam Filters
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1">Coming soon...</p>
                </div>
            </div>

            {/* Placeholder Post 3 */}
            <div className="group glass-card flex flex-col overflow-hidden border border-surface-200 dark:border-surface-800 opacity-60">
                <div className="h-48 bg-surface-100 dark:bg-surface-800 flex items-center justify-center p-6 relative">
                    <div className="absolute top-4 left-4 bg-white dark:bg-surface-700 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md text-surface-600 shadow-sm">
                        Templates
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3">
                        25 B2B Cold Email Templates for SaaS Sales
                    </h3>
                    <p className="text-sm text-surface-500 mb-6 flex-1">Coming soon...</p>
                </div>
            </div>

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
