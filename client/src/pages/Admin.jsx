import { useState, useEffect } from 'react';
import api from '../api/client';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle2, Crown, Loader2, ShieldCheck } from 'lucide-react';

export default function Admin() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role !== 'admin') return;

        const fetchAdminData = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users')
                ]);
                setStats(statsRes.data);
                setUsersList(usersRes.data.users);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch admin data');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [user]);

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-surface-900 dark:text-white">
                    <ShieldCheck className="w-8 h-8 text-primary-500" />
                    Admin Dashboard
                </h1>
                <p className="text-surface-500 mt-1">Platform overview and user management</p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-surface-500">Total Users</div>
                            <div className="text-2xl font-bold text-surface-900 dark:text-white">{stats.totalUsers}</div>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-surface-500">Verified Users</div>
                            <div className="text-2xl font-bold text-surface-900 dark:text-white">{stats.verifiedUsers}</div>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-surface-500">Pro Subscribers</div>
                            <div className="text-2xl font-bold text-surface-900 dark:text-white">{stats.proUsers}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Users Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                    <h2 className="text-lg font-bold text-surface-900 dark:text-white">Recent Users (Max 50)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-600 dark:text-surface-400">
                        <thead className="text-xs uppercase bg-surface-50 dark:bg-surface-800/50 text-surface-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Password Hash</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Plan</th>
                                <th className="px-6 py-4 font-semibold">Emails Sent</th>
                                <th className="px-6 py-4 font-semibold">Verified</th>
                                <th className="px-6 py-4 font-semibold">Joined At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                            {usersList.map(u => (
                                <tr key={u._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-surface-900 dark:text-white">{u.name}</td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4 text-xs font-mono truncate max-w-[150px]" title={u.password}>{u.password || 'N/A (Google)'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400' : 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 uppercase text-xs font-bold">{u.plan}</td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-surface-900 dark:text-white font-medium">Sent: {u.stats?.totalSent || 0}</span>
                                            <span className="text-green-600 dark:text-green-400">Delivered: {u.stats?.totalDelivered || 0}</span>
                                            <span className="text-red-600 dark:text-red-400">Failed: {(u.stats?.totalFailed || 0) + (u.stats?.totalBounced || 0)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.isVerified
                                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            : <span className="text-xs text-surface-400 font-medium">No</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
