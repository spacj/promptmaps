'use client';

import { Crown, LogOut } from 'lucide-react';
import { signOut } from '@/lib/firebase';

interface HeaderProps {
  credits: number;
  isPremium: boolean;
  userEmail: string | null;
  onUpgradeClick: () => void;
  onSignOut: () => void;
}

export default function Header({ credits, isPremium, userEmail, onUpgradeClick, onSignOut }: HeaderProps) {
  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mind Map AI Generator</h1>
          <p className="text-xs text-slate-400 mt-1">
            {userEmail && `Signed in as ${userEmail}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isPremium ? (
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 rounded-lg flex items-center gap-2">
              <Crown size={18} />
              <span className="text-sm font-semibold">Premium - Unlimited</span>
            </div>
          ) : (
            <>
              <div className="bg-slate-700 px-4 py-2 rounded-lg">
                <span className="text-sm">Daily Credits: {credits}/3</span>
                <p className="text-xs text-slate-400 mt-1">Resets daily</p>
              </div>
              <button
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all"
              >
                <Crown size={18} />
                Upgrade to Premium
              </button>
            </>
          )}
          {userEmail && (
            <button
              onClick={handleSignOut}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
