'use client';

import { Crown, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { auth } from '@/lib/firebase';

interface PaywallModalProps {
  credits: number;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

export default function PaywallModal({
  credits,
  onClose,
  onUpgradeSuccess,
}: PaywallModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // Get the current user
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in to upgrade');
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full border-2 border-yellow-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-full mb-4">
            <Crown size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-slate-300">
            {credits === 0
              ? "You've used all your daily credits!"
              : 'Unlock unlimited AI prompt generations'}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-baseline justify-center mb-4">
            <span className="text-5xl font-bold text-yellow-500">$3.99</span>
            <span className="text-slate-400 ml-2">/month</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500 flex-shrink-0" size={20} />
              <span>Unlimited AI prompt generations</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500 flex-shrink-0" size={20} />
              <span>No daily credit limits</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500 flex-shrink-0" size={20} />
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500 flex-shrink-0" size={20} />
              <span>Save unlimited mind maps</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500 flex-shrink-0" size={20} />
              <span>Advanced AI optimization</span>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? 'Processing...' : 'Subscribe with Stripe'}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            {credits > 0
              ? 'Maybe later'
              : 'Come back tomorrow for 3 free credits'}
          </button>
        </div>
      </div>
    </div>
  );
}