'use client';

import { useState, useEffect } from 'react';
import { MindMapNode, PromptType } from '@/types';
import { onAuthStateChange, checkAndResetCredits, consumeCredit } from '@/lib/firebase';
import { User } from 'firebase/auth';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import MindMapCanvas from './components/MindMapCanvas';
import PromptGenerator from './components/PromptGenerator';
import PaywallModal from './components/PaywallModal';
import AuthModal from './components/AuthModal';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';

export default function Home() {
  const [boxes, setBoxes] = useState<MindMapNode[]>([]);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingPromptType, setPendingPromptType] = useState<PromptType | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Initialize centered root node after component mounts
  useEffect(() => {
    if (!canvasInitialized) {
      // Calculate center position based on typical canvas size
      const isMobileView = window.innerWidth < 768;
      const canvasWidth = isMobileView ? window.innerWidth - 24 : 1200;
      const canvasHeight = isMobileView ? 500 : 650;
      
      const centerX = (canvasWidth / 2) - (isMobileView ? 65 : 80);
      const centerY = (canvasHeight / 2) - 25;
      
      setBoxes([
        {
          id: '1',
          text: 'Root Idea',
          x: centerX,
          y: centerY,
          level: 0,
          parentId: null,
          style: { bg: 'bg-blue-500', text: 'text-white' },
        },
      ]);
      setSelectedBox('1');
      setCanvasInitialized(true);
      
      // Check if user has seen the welcome screen
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [canvasInitialized]);

  const refreshUserData = async (firebaseUser: User) => {
    try {
      const { credits: userCredits, isPremium: premium } = await checkAndResetCredits(firebaseUser.uid);
      setCredits(userCredits);
      setIsPremium(premium);
      return { credits: userCredits, isPremium: premium };
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await refreshUserData(firebaseUser);
      } else {
        setCredits(0);
        setIsPremium(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkPaymentReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fromSuccess = urlParams.get('from_success');
      
      if (fromSuccess === 'true' && user) {
        setTimeout(async () => {
          const result = await refreshUserData(user);
          
          if (result?.isPremium) {
            alert('🎉 Welcome to Premium! You now have unlimited AI prompt generations.');
          } else {
            setTimeout(async () => {
              const secondResult = await refreshUserData(user);
              if (secondResult?.isPremium) {
                alert('🎉 Welcome to Premium! You now have unlimited AI prompt generations.');
              }
            }, 2000);
          }
          
          window.history.replaceState({}, '', '/');
        }, 1000);
      }
    };

    if (user) {
      checkPaymentReturn();
    }
  }, [user]);

  const handleGenerate = async (promptType: PromptType) => {
    if (!user) {
      setPendingPromptType(promptType);
      setShowAuthModal(true);
      return;
    }

    if (!isPremium && credits <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);

    try {
      const creditUsed = await consumeCredit(user.uid);
      
      if (!creditUsed && !isPremium) {
        setShowPaywall(true);
        setIsGenerating(false);
        return;
      }

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
    if (user) {
      const result = await refreshUserData(user);
      
      if (result?.isPremium) {
        setShowPaywall(false);
        alert('🎉 Welcome to Premium! You now have unlimited AI prompt generations.');
      }
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col">
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

      <div className="flex-1">
        {canvasInitialized && (
          <MindMapCanvas
            boxes={boxes}
            setBoxes={setBoxes}
            selectedBox={selectedBox}
            setSelectedBox={setSelectedBox}
          />
        )}

        {generatedPrompt && <PromptGenerator prompt={generatedPrompt} />}
      </div>

      <Footer />

      <CookieConsent />

      {showWelcome && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 relative overflow-hidden max-h-[85vh] md:max-h-[80vh] flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            
            <button
              onClick={handleCloseWelcome}
              className="absolute top-4 right-4 w-10 h-10 bg-slate-700/80 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="overflow-y-auto flex-1 pr-2 -mr-2">
              <div className="text-center mb-6">
                <div className="inline-block mb-4">
                  <div className="text-5xl md:text-6xl animate-bounce">🧠</div>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Welcome to AI Mind Map Prompts!
                </h2>
                <p className="text-slate-300 text-base md:text-lg">
                  Transform your ideas into powerful AI prompts
                </p>
              </div>

              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="flex items-start gap-3 md:gap-4 bg-slate-800/50 rounded-xl p-3 md:p-4 border border-slate-700/50">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-base md:text-lg">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Create Your Mind Map</h3>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Start with the root idea, then add sibling and child nodes to organize your thoughts visually
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4 bg-slate-800/50 rounded-xl p-3 md:p-4 border border-slate-700/50">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-base md:text-lg">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Organize & Style</h3>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Drag nodes to arrange them, customize colors, and structure your ideas hierarchically
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4 bg-slate-800/50 rounded-xl p-3 md:p-4 border border-slate-700/50">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center font-bold text-base md:text-lg">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-base md:text-lg mb-1">Generate AI Prompt</h3>
                    <p className="text-slate-400 text-xs md:text-sm">
                      Click &quot;Generate AI Prompt&quot; and choose your use case. Our AI will transform your mind map into an optimized prompt!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-3 md:p-4 mb-6 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl md:text-2xl">✨</span>
                  <h4 className="font-semibold text-sm md:text-base">AI-Powered Optimization</h4>
                </div>
                <p className="text-slate-300 text-xs md:text-sm">
                  Our AI doesn&apos;t just convert your map—it enhances it! Get professionally structured prompts optimized for code, research, creativity, and more.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50 mt-2">
              <button
                onClick={handleCloseWelcome}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white font-bold py-3 md:py-4 rounded-xl transition-all transform active:scale-95 md:hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                Let&apos;s Get Started! 🚀
              </button>

              <p className="text-center text-slate-500 text-xs mt-3 md:mt-4">
                This message won&apos;t show again
              </p>
            </div>
          </div>
        </div>
      )}

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