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

        // Retry logic: Try up to 3 times with delays
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;

        while (attempts < maxAttempts) {
          attempts++;
          console.log(`📡 Verification attempt ${attempts}/${maxAttempts}...`);

          try {
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

            // Success!
            if (response.ok && data.success) {
              console.log('✅ Payment verified successfully!');
              setStatus('success');
              setMessage('Payment successful! You are now a premium member. 🎉');
              
              // Wait a moment then redirect
              setTimeout(() => {
                router.push('/');
                router.refresh();
              }, 2000);
              return; // Exit the function, verification succeeded
            }

            // If we got a response but it wasn't successful
            if (!response.ok) {
              lastError = data.error || data.message || `Server returned ${response.status}`;
              console.warn(`⚠️ Attempt ${attempts} failed:`, lastError);
              
              // Don't retry on certain errors
              if (response.status === 404 || response.status === 401) {
                throw new Error(lastError);
              }
              
              // Wait before retrying (exponential backoff)
              if (attempts < maxAttempts) {
                const delay = 2000 * attempts; // 2s, 4s, 6s
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                setMessage(`Verifying payment... (attempt ${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          } catch (fetchError: any) {
            lastError = fetchError.message;
            console.error(`❌ Fetch error on attempt ${attempts}:`, fetchError);
            
            // Wait before retrying network errors
            if (attempts < maxAttempts) {
              const delay = 2000 * attempts;
              console.log(`⏳ Waiting ${delay}ms before retry...`);
              setMessage(`Connection error, retrying... (${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        // All attempts failed
        console.error('❌ All verification attempts failed');
        setStatus('error');
        setMessage(lastError || 'Payment verification failed after multiple attempts');
        
        // Still redirect, user can contact support
        setTimeout(() => router.push('/'), 5000);

      } catch (error: any) {
        console.error('❌ Critical error verifying payment:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred. Please contact support if you were charged.');
        setTimeout(() => router.push('/'), 5000);
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
            <p className="text-xs text-slate-500 mt-4">This usually takes a few seconds...</p>
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
            <p className="text-slate-400 mb-4">{message}</p>
            <p className="text-xs text-slate-500">
              If you were charged, please contact support with your payment details.
            </p>
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