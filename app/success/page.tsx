'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      console.warn('⚠️ No session ID found');
      router.push('/');
      return;
    }

    console.log('✅ Payment completed for session:', sessionId);

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/');
          router.refresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 text-center">
        <div className="text-green-500 text-6xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-4 text-green-500">Payment Successful!</h1>
        
        <div className="space-y-4 text-slate-300">
          <p className="text-lg">
            Thank you for upgrading to Premium! 🎉
          </p>
          
          <p className="text-sm">
            Your account is being activated right now.
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-4 mt-6">
            <p className="text-sm text-slate-400">
              You'll see your premium features when you return to the home page.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
            <span className="text-2xl font-bold text-purple-400">{countdown}</span>
          </div>
          <p className="text-sm text-slate-500">
            Redirecting to home in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        </div>

        <button
          onClick={() => {
            router.push('/');
            router.refresh();
          }}
          className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go to Home Now
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}