import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings, LogOut, Moon, Sun, Mail, CreditCard, ChevronDown, User, Zap, AlertTriangle } from 'lucide-react';
import api from '../../api/client';

export default function ProfileDropdown() {
    const { user, logout } = useAuth();
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    // BUG FIX #28: Track real email usage and account health
    const [emailsToday, setEmailsToday] = useState(0);
    const [criticalAccounts, setCriticalAccounts] = useState(0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // BUG FIX #28: Fetch real today's send count and account health when dropdown opens
    useEffect(() => {
        if (!isOpen) return;
        api.get('/analytics/today-stats').then(res => {
            setEmailsToday(res.data?.emailsSentToday || 0);
        }).catch(() => { /* non-critical */ });
        api.get('/accounts').then(res => {
            const accounts = res.data?.accounts || [];
            setCriticalAccounts(accounts.filter(a => a.health === 'critical').length);
        }).catch(() => { /* non-critical */ });
    }, [isOpen]);

    // Helper for navigation to close dropdown
    const LinkItem = ({ to, icon: Icon, label, className = '' }) => (
        <NavLink
            to={to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full
                ${isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                } ${className}`
            }
        >
            <Icon className="w-4 h-4" />
            {label}
        </NavLink>
    );

    // BUG FIX #28: Calculate daily usage % from real data
    const dailyLimit = user?.settings?.defaultDailyLimit || 200;
    const usagePercent = Math.min(100, Math.round((emailsToday / dailyLimit) * 100));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-full hover:bg-surface-50 dark:hover:bg-surface-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-sm">
                    {user?.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <div className="hidden md:block text-left text-xs max-w-[120px]">
                    <p className="font-semibold text-surface-900 dark:text-white truncate">
                        {user?.name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-surface-500 truncate font-medium capitalize">{user?.role || 'User'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-surface-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                {/* BUG FIX #2: Badge for critical accounts */}
                {criticalAccounts > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {criticalAccounts}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xl py-2 z-50 slide-in-from-top-2">
                    {/* BUG FIX #2: Critical account health warning */}
                    {criticalAccounts > 0 && (
                        <div className="mx-3 mb-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Account Disconnected</p>
                                <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
                                    {criticalAccounts} account{criticalAccounts > 1 ? 's' : ''} need{criticalAccounts === 1 ? 's' : ''} reconnecting.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">{user?.email}</p>
                        
                        {/* BUG FIX #28: Dynamic Plan / Daily Limit Widget */}
                        <div className="mt-3 bg-gradient-to-r from-primary-50 dark:from-primary-500/10 to-accent-50 dark:to-accent-500/10 rounded-lg p-3 border border-primary-100 dark:border-primary-500/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Zap className="w-3.5 h-3.5 text-primary-500" />
                                <span className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">
                                    {user?.plan || 'Free'} Plan
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-surface-600 dark:text-surface-400 font-medium">
                                    {user?.plan === 'unlimited' ? `${emailsToday} / Unlimited sent today` : `${emailsToday} / ${dailyLimit.toLocaleString()} sent today`}
                                </span>
                                <span className="text-xs font-bold text-surface-900 dark:text-white">
                                    {user?.plan === 'unlimited' ? '∞' : `${usagePercent}%`}
                                </span>
                            </div>
                            <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        usagePercent >= 90
                                            ? 'bg-red-500'
                                            : usagePercent >= 70
                                            ? 'bg-amber-500'
                                            : 'bg-gradient-to-r from-primary-500 to-accent-500'
                                    }`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="py-1">
                        <LinkItem to="/accounts" icon={Mail} label="Accounts" />
                        <LinkItem to="/billing" icon={CreditCard} label="Billing" />
                        <LinkItem to="/settings" icon={Settings} label="Settings" />
                    </div>

                    <div className="border-t border-surface-100 dark:border-surface-800 my-1 py-1">
                        <button
                            onClick={() => { toggle(); setIsOpen(false); }}
                            className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                        >
                            <span className="flex items-center gap-3">
                                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                {dark ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        </button>
                    </div>

                    <div className="border-t border-surface-100 dark:border-surface-800 my-1 py-1">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
