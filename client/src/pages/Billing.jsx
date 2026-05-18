import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    CreditCard, Check, Zap, ArrowRight, Mail, Users, Bot, Timer,
    Crown, Rocket, Building, Loader2, XCircle
} from 'lucide-react';
import RazorpayCheckout from '../components/RazorpayCheckout';

const PLAN_DETAILS = [
    {
        id: 'free', name: 'Free', price: 0, color: 'from-surface-400 to-surface-500',
        icon: Zap, badge: 'Current Default',
        features: ['50 emails/day', '200 contacts', '1 Gmail account', 'Basic CRM', 'Email tracking'],
    },
    {
        id: 'starter', name: 'Starter', price: 37, color: 'from-blue-500 to-blue-600',
        icon: Rocket, badge: 'Most Popular',
        features: ['200 emails/day', '2,000 contacts', '2 Gmail accounts', 'Basic AI writing', '2-step follow-ups', 'Full CRM', 'Priority email support'],
    },
    {
        id: 'growth', name: 'Growth', price: 74, color: 'from-purple-500 to-purple-600',
        icon: Crown, badge: 'Best Value',
        features: ['1,000 emails/day', '10,000 contacts', '5 Gmail accounts', 'Full AI suite', '5-step follow-ups', 'Advanced analytics', 'Bulk operations', 'API access'],
    },
    {
        id: 'pro', name: 'Pro', price: 124, color: 'from-amber-500 to-orange-600',
        icon: Building, badge: 'Enterprise',
        features: ['5,000 emails/day', '50,000 contacts', '15 Gmail accounts', 'AI + Personalization', 'Unlimited follow-ups', 'Team features', 'White-label ready', 'Dedicated support'],
    },
];

export default function Billing() {
    const [searchParams] = useSearchParams();
    const [billing, setBilling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(null);

    useEffect(() => {
        fetchBilling();
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const fetchBilling = async () => {
        setLoading(true);
        try {
            const res = await api.get('/billing/status');
            setBilling(res.data);
        } catch {
            toast.error('Failed to load billing info');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId) => {
        setUpgrading(planId);
        try {
            const res = await api.post('/billing/create-subscription', { plan: planId });
            
            const options = {
                key: res.data.keyId,
                subscription_id: res.data.subscriptionId,
                name: 'AutoMindz',
                description: `Upgrade to ${planId.toUpperCase()} Plan`,
                handler: async function (response) {
                    try {
                        await api.post('/billing/verify-payment', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        toast.success(`Successfully upgraded to ${planId} plan! 🎉`);
                        fetchBilling(); // refresh usage/limits
                    } catch (err) {
                        toast.error(err.response?.data?.error || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: res.data.name,
                    email: res.data.email,
                    contact: res.data.contact
                },
                theme: {
                    color: '#3b82f6'
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                toast.error(response.error.description || 'Payment failed');
            });
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to start checkout');
        } finally {
            setUpgrading(null);
        }
    };

    const handleManage = async () => {
        if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features immediately.')) return;
        try {
            await api.post('/billing/cancel-subscription');
            toast.success('Subscription cancelled successfully');
            fetchBilling();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to cancel subscription');
        }
    };

    const currentPlan = billing?.plan || 'free';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Billing & Plans</h1>
                    <p className="text-surface-500 mt-1">Manage your subscription and usage</p>
                </div>
                {billing?.hasSubscription && (
                    <button onClick={handleManage} className="btn-danger">
                        <XCircle className="w-4 h-4" /> Cancel Subscription
                    </button>
                )}
            </div>

            {/* Current Usage */}
            {billing && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary-500" /> Current Usage
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                label: 'Emails Today',
                                icon: Mail,
                                used: billing.usage?.emailsSentToday || 0,
                                limit: billing.limits?.emailsPerDay || 50,
                                color: 'primary',
                            },
                            {
                                label: 'Contacts',
                                icon: Users,
                                used: billing.usage?.totalContacts || 0,
                                limit: billing.limits?.contacts || 200,
                                color: 'purple',
                            },
                            {
                                label: 'Gmail Accounts',
                                icon: Mail,
                                used: billing.usage?.totalAccounts || 0,
                                limit: billing.limits?.accounts || 1,
                                color: 'green',
                            },
                        ].map((meter, i) => {
                            const pct = Math.min((meter.used / meter.limit) * 100, 100);
                            const isWarn = pct > 80;
                            return (
                                <div key={i} className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-2">
                                            <meter.icon className="w-4 h-4 text-surface-400" /> {meter.label}
                                        </span>
                                        <span className={`text-sm font-bold ${isWarn ? 'text-red-500' : 'text-surface-900 dark:text-white'}`}>
                                            {meter.used.toLocaleString()} / {meter.limit.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all ${isWarn ? 'bg-red-500' : `bg-${meter.color}-500`}`}
                                            style={{ width: `${pct}%`, background: isWarn ? undefined : '' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {billing.limits?.ai === false && (
                        <div className="mt-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <Bot className="w-4 h-4" /> AI features are not available on the Free plan. Upgrade to unlock AI email writing.
                        </div>
                    )}
                </div>
            )}

            {/* Standard Checkout / Top Up */}
            <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">One-Time Top Up</h3>
                    <p className="text-surface-500 text-sm mt-1">Need a quick boost? Buy 10,000 extra email credits for ₹999.</p>
                </div>
                <div>
                    <RazorpayCheckout amount={99900} buttonText="Buy Credits (₹999)" onSuccess={() => { fetchBilling(); toast.success("Credits added!"); }} />
                </div>
            </div>

            {/* Plan Cards */}
            <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6 text-center">Choose Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {PLAN_DETAILS.map((plan) => {
                        const isCurrent = currentPlan === plan.id;
                        const isUpgrade = PLAN_DETAILS.findIndex(p => p.id === currentPlan) < PLAN_DETAILS.findIndex(p => p.id === plan.id);
                        const Icon = plan.icon;

                        return (
                            <div
                                key={plan.id}
                                className={`glass-card p-6 relative overflow-hidden transition-all hover:shadow-xl ${isCurrent ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/10' : ''}`}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isCurrent
                                        ? 'bg-primary-500 text-white'
                                        : plan.id === 'starter' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                            : plan.id === 'growth' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                                : plan.id === 'pro' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                    : 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                                        }`}>
                                        {isCurrent ? '✓ Current' : plan.badge}
                                    </div>
                                )}

                                {/* Icon + Name */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-surface-900 dark:text-white">{plan.name}</h4>

                                {/* Price */}
                                <div className="mt-3 mb-6">
                                    <span className="text-4xl font-extrabold text-surface-900 dark:text-white">${plan.price}</span>
                                    {plan.price > 0 && <span className="text-surface-500 text-sm">/month</span>}
                                </div>

                                {/* Features */}
                                <ul className="space-y-2.5 mb-8">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isCurrent ? (
                                    <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-800 text-surface-500 cursor-not-allowed">
                                        Current Plan
                                    </button>
                                ) : plan.id === 'free' ? (
                                    <div />
                                ) : isUpgrade ? (
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        disabled={upgrading === plan.id}
                                        className={`w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${plan.color} hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg`}
                                    >
                                        {upgrading === plan.id
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
                                            : <><ArrowRight className="w-4 h-4" /> Upgrade to {plan.name}</>
                                        }
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        className="w-full py-3 rounded-xl text-sm font-semibold border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all"
                                    >
                                        Downgrade Plan
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FAQ */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4 text-sm">
                    {[
                        { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your subscription at any time from the Cancel Subscription button. Your plan will remain active until the end of the billing period.' },
                        { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, UPI, Wallets, and Netbanking through Razorpay.' },
                        { q: 'What happens if I exceed my limits?', a: 'You\'ll be notified when approaching limits. Once a limit is reached, that feature will be paused until the next billing cycle or until you upgrade.' },
                        { q: 'Can I switch plans?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately.' },
                    ].map((faq, i) => (
                        <div key={i} className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl">
                            <p className="font-semibold text-surface-900 dark:text-white">{faq.q}</p>
                            <p className="text-surface-500 mt-1">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

