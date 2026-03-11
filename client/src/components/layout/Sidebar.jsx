import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard, Send, Users, Search, Mail, BarChart3,
    Settings, LogOut, Moon, Sun, Zap, CreditCard, FileText, ShieldCheck,
    FolderKanban, ListFilter, Link as LinkIcon, UsersRound, CheckSquare, Activity,
    Inbox, Globe
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/campaigns', icon: Send, label: 'Campaigns' },
    { to: '/contacts', icon: Users, label: 'Contacts' },
    { to: '/compose', icon: Mail, label: 'Compose' },
    { to: '/finder', icon: Search, label: 'Email Finder' },
    { to: '/templates', icon: FileText, label: 'Templates' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/smart-lists', icon: ListFilter, label: 'Smart Lists' },
    { to: '/links', icon: LinkIcon, label: 'Links' },
    { to: '/inbox', icon: Inbox, label: 'Inbox' },
    { to: '/seo', icon: Globe, label: 'SEO Tools' },
    { divider: true },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/team', icon: UsersRound, label: 'Team' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { divider: true },
    { to: '/accounts', icon: Mail, label: 'Accounts' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const { logout, user } = useAuth();
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 z-30 transition-colors duration-300">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-surface-200 dark:border-surface-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center pulse-glow">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">AutoMindz</h1>
                    <p className="text-[10px] text-surface-500 font-medium tracking-wider uppercase">Email Outreach</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item, idx) => {
                    if (item.divider) {
                        return <div key={`div-${idx}`} className="my-2 mx-4 h-px bg-surface-200 dark:bg-surface-700" />;
                    }
                    const { to, icon: Icon, label } = item;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                                    ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-600 dark:text-primary-400'
                                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                                }`
                            }
                        >
                            <Icon className="w-[18px] h-[18px] transition-transform group-hover:scale-110" />
                            {label}
                        </NavLink>
                    );
                })}

                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group mt-4 border-t border-surface-200 dark:border-surface-800 pt-4
              ${isActive
                                ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 text-primary-600 dark:text-primary-400'
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                            }`
                        }
                    >
                        <ShieldCheck className="w-[18px] h-[18px] text-primary-500 transition-transform group-hover:scale-110" />
                        Admin Panel
                    </NavLink>
                )}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-surface-200 dark:border-surface-800 space-y-2">
                <button onClick={toggle}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
                    {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                    {dark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <LogOut className="w-[18px] h-[18px]" />
                    Logout
                </button>
                {user && (
                    <div className="px-4 py-2 text-xs text-surface-400 truncate">{user.email}</div>
                )}
            </div>
        </aside>
    );
}
