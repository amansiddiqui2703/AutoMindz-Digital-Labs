import { useState, useEffect, useRef } from 'react';
import { Bell, Eye, MousePointerClick, TrendingUp, AlertTriangle, UserMinus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EVENT_CONFIG = {
    open: { icon: Eye, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    click: { icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    reply: { icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
    bounce: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    unsubscribe: { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
    default: { icon: Activity, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' }
};

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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

    // Listen to SSE events dispatched globally by AppLayout
    useEffect(() => {
        const handleAnalyticsUpdate = (e) => {
            const eventData = e.detail;
            if (eventData && eventData.type) {
                const newNotif = {
                    id: Date.now().toString(),
                    type: eventData.type,
                    email: eventData.email || 'Someone',
                    timestamp: new Date()
                };
                setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                if (!isOpen) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        };

        window.addEventListener('analytics_update_notif', handleAnalyticsUpdate);
        return () => window.removeEventListener('analytics_update_notif', handleAnalyticsUpdate);
    }, [isOpen]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
        }
    };

    const handleNotificationClick = () => {
        setIsOpen(false);
        navigate('/analytics');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="relative p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl z-50 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/30">
                        <h3 className="font-bold text-surface-900 dark:text-white">Notifications</h3>
                        <span className="text-xs text-primary-500 font-medium cursor-pointer hover:underline" onClick={() => setNotifications([])}>Clear All</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                                    <Bell className="w-5 h-5 text-surface-300" />
                                </div>
                                <p className="text-sm font-medium text-surface-600 dark:text-surface-300">All caught up!</p>
                                <p className="text-xs text-surface-400 mt-1">New activity will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-surface-100 dark:divide-surface-800">
                                {notifications.map((notif) => {
                                    const config = EVENT_CONFIG[notif.type] || EVENT_CONFIG.default;
                                    const Icon = config.icon;
                                    
                                    let text = '';
                                    if (notif.type === 'open') text = 'opened your email';
                                    else if (notif.type === 'click') text = 'clicked a link';
                                    else if (notif.type === 'reply') text = 'replied to you';
                                    else if (notif.type === 'bounce') text = 'email bounced';
                                    else if (notif.type === 'unsubscribe') text = 'unsubscribed';
                                    
                                    return (
                                        <div 
                                            key={notif.id} 
                                            className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer flex gap-3"
                                            onClick={handleNotificationClick}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                                                <Icon className={`w-4 h-4 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-surface-800 dark:text-surface-200 leading-snug">
                                                    <span className="font-semibold text-surface-900 dark:text-white">{notif.email}</span> {text}
                                                </p>
                                                <p className="text-xs text-surface-400 mt-1">Just now</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 border-t border-surface-200 dark:border-surface-700 text-center bg-surface-50 dark:bg-surface-800/50">
                        <button onClick={handleNotificationClick} className="text-sm text-primary-500 font-medium hover:text-primary-600">
                            View All Activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
