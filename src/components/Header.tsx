import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, User as UserIcon, LogOut, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '../types';

interface HeaderProps {
  profile: UserProfile | null;
  resourceCount: number;
  workspaceCount: number;
  onOpenAddModal: () => void;
  onOpenCommandPalette: () => void;
  onSignOut: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onSelectTab: (tab: any) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  resourceCount,
  workspaceCount,
  onOpenAddModal,
  onOpenCommandPalette,
  onSignOut,
  onOpenImport,
  onOpenExport,
  onSelectTab,
  activeTab,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0D13]/90 backdrop-blur-md border-b border-[#1E2230] px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Brand & Current Area */}
      <div className="flex items-center gap-6 shrink-0">
        <button
          onClick={() => onSelectTab('home')}
          className="cursor-pointer text-left focus:outline-none"
        >
          <Logo size="md" />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono tabular-nums text-violet-400 font-semibold">{resourceCount}</span>
          <span>resources</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono tabular-nums text-slate-300 font-semibold">{workspaceCount}</span>
          <span>workspaces</span>
        </div>
      </div>

      {/* Zone 2: Universal Search & Command Palette Trigger */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs text-slate-400 bg-[#12151E] border border-[#1E2230] rounded-lg hover:border-violet-600/50 hover:text-slate-200 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-400 transition-colors shrink-0" />
            <span className="truncate">Search resources, tags, GitHub repos, workspaces...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-[#1A1E2C] border border-[#272C3E] rounded">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions & Account */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <PWAInstallButton />

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Resource</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* User Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 text-slate-300 hover:text-white rounded-lg hover:bg-[#1A1E2C] transition-colors cursor-pointer"
            title={profile?.displayName || 'Account'}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-700 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold uppercase">
              {profile?.displayName?.[0] || 'U'}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#12151E] border border-[#1E2230] shadow-2xl py-1 text-xs text-slate-300 z-50">
              <div className="px-3.5 py-2.5 border-b border-[#1E2230]">
                <div className="font-semibold text-white truncate">{profile?.displayName}</div>
                <div className="text-[11px] text-slate-400 truncate">{profile?.email}</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Firestore Cloud Synced</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenImport();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                >
                  Import Bookmarks HTML
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenExport();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                >
                  Export Library (JSON / CSV)
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSelectTab('settings');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                >
                  Account Settings
                </button>
              </div>

              <div className="border-t border-[#1E2230] pt-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
