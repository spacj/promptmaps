'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function CanceledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 text-center">
        <div className="inline-block bg-red-500/20 p-4 rounded-full mb-6">
          <XCircle size={48} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Payment Canceled</h1>
        
        <p className="text-slate-300 mb-6">
          Your payment was canceled. No charges were made to your account.
        </p>

        <p className="text-slate-400 text-sm mb-6">
          You can still use your daily free credits or upgrade to premium anytime.
        </p>

        <button
          onClick={() => router.push('/')}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-6 py-3 rounded-lg font-semibold transition-all"
        >
          Back to Homepage
        </button>
      </div>
    </div>
  );
}