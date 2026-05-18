import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { CreditCard, Loader2 } from 'lucide-react';

export default function RazorpayCheckout({ amount, buttonText = "Pay with Razorpay", onSuccess }) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load Razorpay Script if not already loaded
        if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            
            return () => {
                document.body.removeChild(script);
            };
        }
    }, []);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // STEP 1: Create Order
            const orderRes = await api.post('/billing/create-order', { 
                amount: amount, // Amount in paise
                currency: 'INR' 
            });
            
            const { order_id, amount: orderAmount, currency } = orderRes.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
                amount: orderAmount, 
                currency: currency,
                name: 'AutoMindz',
                description: 'Payment',
                order_id: order_id, // This is the order_id created in the backend
                handler: async function (response) {
                    try {
                        // STEP 3: Verify Signature
                        await api.post('/billing/verify-order-payment', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        toast.success('Payment successful!');
                        if (onSuccess) onSuccess();
                    } catch (err) {
                        toast.error(err.response?.data?.error || 'Payment verification failed');
                    }
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
            toast.error(err.response?.data?.error || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {buttonText}
        </button>
    );
}
