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
    <div className={`backdrop-blur-sm border-b px-4 sm:px-6 py-3 sm:py-4 ${
      isPremium 
        ? 'bg-gradient-to-r from-yellow-900/30 via-slate-800/50 to-yellow-900/30 border-yellow-700/50' 
        : 'bg-slate-800/50 border-slate-700'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Mind Map AI Generator</h1>
          {userEmail && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {userEmail}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {isPremium ? (
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-yellow-900/30 flex-1 sm:flex-initial justify-center">
              <Crown size={18} className="flex-shrink-0" />
              <span className="text-sm font-semibold whitespace-nowrap">Premium - Unlimited</span>
            </div>
          ) : (
            <>
              <div className="bg-slate-700/80 px-3 sm:px-4 py-2 rounded-lg flex-1 sm:flex-initial min-w-0">
                <span className="text-sm block truncate">Credits: {credits}/3</span>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Resets daily</p>
              </div>
              <button
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg flex-shrink-0"
              >
                <Crown size={18} className="hidden sm:inline" />
                <span className="text-sm whitespace-nowrap">Upgrade</span>
              </button>
            </>
          )}
          {userEmail && (
            <button
              onClick={handleSignOut}
              className="bg-slate-700 hover:bg-slate-600 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span className="text-sm hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}