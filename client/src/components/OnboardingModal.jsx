import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Users, ArrowRight, X } from 'lucide-react';
import api from '../api/client';

export default function OnboardingModal() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only show if user has no accounts configured
        api.get('/accounts').then(res => {
            if (res.data.length === 0) {
                // To avoid flashing it repeatedly if they close it this session
                const hasSkipped = sessionStorage.getItem('onboarding_skipped');
                if (!hasSkipped) setIsVisible(true);
            }
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    if (loading || !isVisible) return null;

    const skip = () => {
        sessionStorage.setItem('onboarding_skipped', 'true');
        setIsVisible(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-hidden animate-in zoom-in-95">
                <button onClick={skip} className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6 shadow-lg rotate-12">
                        <Zap className="w-8 h-8 text-white -rotate-12" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-surface-900 dark:text-white mb-4">
                        Welcome to AutoMindz! 🚀
                    </h2>
                    <p className="text-lg text-surface-500 mb-10 max-w-lg mx-auto leading-relaxed">
                        You're just two steps away from sending your first automated AI-powered email campaign.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-10">
                        <div className="relative p-6 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm shadow-lg">1</div>
                            <Mail className="w-6 h-6 text-primary-500 mb-3" />
                            <h3 className="font-bold text-surface-900 dark:text-white mb-1">Connect Gmail</h3>
                            <p className="text-sm text-surface-500">Link your sender account using our secure Google integration.</p>
                        </div>
                        <div className="relative p-6 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-300 flex items-center justify-center font-bold text-sm shadow-lg">2</div>
                            <Users className="w-6 h-6 text-accent-500 mb-3" />
                            <h3 className="font-bold text-surface-900 dark:text-white mb-1">Add Contacts</h3>
                            <p className="text-sm text-surface-500">Upload a CSV or use the built-in email finder to get leads.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => { skip(); navigate('/accounts'); }}
                            className="btn-primary w-full sm:w-auto !px-8 !py-3.5 text-base justify-center shadow-xl shadow-primary-500/25"
                        >
                            Connect Gmail Now <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                        <button onClick={skip} className="btn-secondary w-full sm:w-auto !py-3.5 text-base justify-center">
                            I'll do it later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
