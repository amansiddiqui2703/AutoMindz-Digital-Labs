import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import ChatBot from '../ChatBot';
import ProfileDropdown from './ProfileDropdown';

export default function AppLayout() {
    const { isAuthenticated, loading } = useAuth();

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
