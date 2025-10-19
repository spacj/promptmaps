'use client';

import { useState, useEffect } from 'react';
import { MindMapNode, PromptType } from '@/types';
import { onAuthStateChange, checkAndResetCredits, useCredit, getUserData } from '@/lib/firebase';
import { User } from 'firebase/auth';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas';
import PromptGenerator from './components/PromptGenerator';
import PaywallModal from './components/PaywallModal';
import AuthModal from './components/AuthModal';

export default function Home() {
  const [boxes, setBoxes] = useState<MindMapNode[]>([
    {
      id: '1',
      text: 'Root Idea',
      x: 400,
      y: 50,
      level: 0,
      parentId: null,
      style: { bg: 'bg-blue-500', text: 'text-white' },
    },
  ]);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingPromptType, setPendingPromptType] = useState<PromptType | null>(null);

  // Function to refresh user data from Firestore
  const refreshUserData = async (firebaseUser: User) => {
    try {
      console.log('🔄 Refreshing user data for:', firebaseUser.uid);
      const { credits: userCredits, isPremium: premium } = await checkAndResetCredits(firebaseUser.uid);
      setCredits(userCredits);
      setIsPremium(premium);
      console.log('✅ User data refreshed - Credits:', userCredits, 'Premium:', premium);
      return { credits: userCredits, isPremium: premium };
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, fetch their credits
        await refreshUserData(firebaseUser);
      } else {
        // User is signed out
        setCredits(0);
        setIsPremium(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check URL for returning from Stripe checkout
  useEffect(() => {
    const checkPaymentReturn = async () => {
      // Check if we're returning from Stripe
      const urlParams = new URLSearchParams(window.location.search);
      const fromSuccess = urlParams.get('from_success');
      
      if (fromSuccess === 'true' && user) {
        console.log('🎉 Returned from successful payment, refreshing user data...');
        
        // Wait a moment for Firebase to sync, then refresh
        setTimeout(async () => {
          const result = await refreshUserData(user);
          
          if (result?.isPremium) {
            alert('🎉 Welcome to Premium! You now have unlimited AI prompt generations.');
          } else {
            // If still not premium after refresh, try one more time
            setTimeout(async () => {
              const secondResult = await refreshUserData(user);
              if (secondResult?.isPremium) {
                alert('🎉 Welcome to Premium! You now have unlimited AI prompt generations.');
              }
            }, 2000);
          }
          
          // Clean up URL
          window.history.replaceState({}, '', '/');
        }, 1000);
      }
    };

    if (user) {
      checkPaymentReturn();
    }
  }, [user]);

  const handleGenerate = async (promptType: PromptType) => {
    // Check if user is authenticated
    if (!user) {
      setPendingPromptType(promptType);
      setShowAuthModal(true);
      return;
    }

    // Check if user has credits (unless premium)
    if (!isPremium && credits <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);

    try {
      // Use a credit (returns false if no credits available)
      const creditUsed = await useCredit(user.uid);
      
      if (!creditUsed && !isPremium) {
        setShowPaywall(true);
        setIsGenerating(false);
        return;
      }

      // Generate the prompt
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxes,
          promptType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedPrompt(data.optimizedPrompt);
        
        // Update local credits count
        if (!isPremium) {
          const { credits: updatedCredits } = await checkAndResetCredits(user.uid);
          setCredits(updatedCredits);
        }
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Failed to generate prompt. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    
    // If there was a pending prompt type, generate it now
    if (pendingPromptType && user) {
      await handleGenerate(pendingPromptType);
      setPendingPromptType(null);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setCredits(0);
    setIsPremium(false);
    setGeneratedPrompt('');
  };

  const handleUpgradeSuccess = async () => {
    console.log('💳 Payment completed, refreshing user data...');
    
    if (user) {
      // Refresh user data from Firestore
      const result = await refreshUserData(user);
      
      if (result?.isPremium) {
        setShowPaywall(false);
        alert('🎉 Welcome to Premium! You now have unlimited AI prompt generations.');
      } else {
        console.warn('⚠️ Premium status not yet updated, will refresh on page reload');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <Header
        credits={credits}
        isPremium={isPremium}
        userEmail={user?.email || null}
        onUpgradeClick={() => setShowPaywall(true)}
        onSignOut={handleSignOut}
      />

      <Toolbar
        selectedBox={selectedBox}
        boxes={boxes}
        setBoxes={setBoxes}
        setSelectedBox={setSelectedBox}
        onGenerate={handleGenerate}
        isPremium={isPremium}
        isGenerating={isGenerating}
      />

      <MindMapCanvas
        boxes={boxes}
        setBoxes={setBoxes}
        selectedBox={selectedBox}
        setSelectedBox={setSelectedBox}
      />

      {generatedPrompt && <PromptGenerator prompt={generatedPrompt} />}

      {showPaywall && (
        <PaywallModal
          credits={credits}
          onClose={() => setShowPaywall(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => {
            setShowAuthModal(false);
            setPendingPromptType(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}