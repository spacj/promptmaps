'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/firebase';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const user = auth.currentUser;

        if (!sessionId) {
          setStatus('error');
          setMessage('No session ID found');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (!user) {
          setStatus('error');
          setMessage('Please sign in again');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        console.log('🔍 Verifying payment for session:', sessionId);

        // Call the verify payment endpoint
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: user.uid,
          }),
        });

        const data = await response.json();
        console.log('📊 Verification response:', data);

        // FIX: Check response.ok first, not just data.success
        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Payment successful! You are now a premium member.');
          
          // CRITICAL: Wait for Firebase to propagate the update
          // Try to fetch updated user data to confirm
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify the user is actually premium now
          const userData = await getUserData(user.uid);
          console.log('📊 User data after payment:', userData);
          
          if (userData?.isPremium) {
            console.log('✅ Premium status confirmed in Firestore');
          } else {
            console.warn('⚠️ Premium status not yet reflected in Firestore');
          }
         
          // Redirect to home with a flag to trigger refresh
          setTimeout(() => {
            router.push('/?from_success=true');
            router.refresh(); // Force refresh to get new user data
          }, 2000);
        } else {
          // Payment verification failed
          setStatus('error');
          setMessage(data.error || data.message || 'Payment verification failed');
          console.error('❌ Verification failed:', data);
          setTimeout(() => router.push('/'), 5000);
        }
      } catch (error: any) {
        console.error('❌ Error verifying payment:', error);
        setStatus('error');
        setMessage('An error occurred. Please contact support.');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
            <p className="text-slate-400">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-2 text-green-500">Success!</h1>
            <p className="text-slate-400">{message}</p>
            <p className="text-sm text-slate-500 mt-4">Redirecting to home...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-2 text-red-500">Error</h1>
            <p className="text-slate-400">{message}</p>
            <p className="text-sm text-slate-500 mt-4">Redirecting to home...</p>
          </>
        )}
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