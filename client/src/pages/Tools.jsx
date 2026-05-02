import { Link } from 'react-router-dom';
import { Globe, Activity, CheckSquare, ListFilter, Link as LinkIcon, MessageSquare } from 'lucide-react';

const tools = [
    { name: 'SEO Tools', path: '/seo', icon: Globe, desc: 'Analyze domain authority and backlinks' },
    { name: 'Smart Lists', path: '/smart-lists', icon: ListFilter, desc: 'Dynamic contact segments' },
    { name: 'Links', path: '/links', icon: LinkIcon, desc: 'Track your acquired backlinks' },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, desc: 'Manage your daily to-dos' },
    { name: 'Activity', path: '/activity', icon: Activity, desc: 'View global team activity' },
];

export default function Tools() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Tools</h1>
                <p className="text-surface-500 mt-1">Extra utilities and integrations for your workspace</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map(tool => (
                    <Link key={tool.path} to={tool.path} className="glass-card p-6 flex items-start gap-4 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform">
                            <tool.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-surface-900 dark:text-white group-hover:text-primary-500 transition-colors">
                                {tool.name}
                            </h3>
                            <p className="text-sm text-surface-500 mt-1">{tool.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
