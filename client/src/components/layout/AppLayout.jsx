import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import ChatBot from '../ChatBot';
import ProfileDropdown from './ProfileDropdown';
import { Bell, MailOpen, MousePointerClick, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AppLayout() {
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const url = import.meta.env.DEV ? `http://localhost:5000/api/events?token=${token}` : `/api/events?token=${token}`;
        const source = new EventSource(url);

        source.addEventListener('notification', (e) => {
            try {
                const data = JSON.parse(e.data);
                toast((t) => (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {data.icon === 'MailOpen' && <MailOpen className="w-4 h-4 text-primary-500" />}
                            {data.icon === 'MousePointerClick' && <MousePointerClick className="w-4 h-4 text-primary-500" />}
                            {data.icon === 'MessageSquare' && <MessageSquare className="w-4 h-4 text-primary-500" />}
                            {!data.icon && <Bell className="w-4 h-4 text-primary-500" />}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{data.title}</p>
                            <p className="text-xs text-surface-500 mt-0.5">{data.message}</p>
                        </div>
                    </div>
                ));
            } catch (err) {
                console.error('SSE Error:', err);
            }
        });

        return () => source.close();
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
            <Sidebar />
            <main className="ml-64 relative flex flex-col min-h-screen">
                {/* Header for Profile Dropdown */}
                <header className="sticky top-0 z-20 w-full bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 px-8 py-3 flex justify-end items-center transition-colors duration-300">
                    <ProfileDropdown />
                </header>
                
                <div className="flex-1 p-8 animate-in">
                    <Outlet />
                </div>
            </main>
            <ChatBot />
        </div>
    );
}
