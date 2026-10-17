import React from 'react';
import {
  Home,
  Compass,
  Folder,
  Layout,
  Star,
  Clock,
  Archive,
  Settings,
  Plus,
  BookOpen,
  Bookmark,
  Film,
  Sparkles,
  Code,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, Collection, Workspace } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  collections: Collection[];
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onOpenCreateCollection: () => void;
  onOpenCreateWorkspace: () => void;
  favoritesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collections,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  activeCollectionId,
  onSelectCollection,
  onOpenCreateCollection,
  onOpenCreateWorkspace,
  favoritesCount,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Bookmark':
        return <Bookmark className="w-3.5 h-3.5" />;
      case 'Film':
        return <Film className="w-3.5 h-3.5" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Code':
        return <Code className="w-3.5 h-3.5" />;
      case 'FileText':
        return <FileText className="w-3.5 h-3.5" />;
      default:
        return <Folder className="w-3.5 h-3.5" />;
    }
  };

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'all', label: 'All Resources', icon: Compass },
    { id: 'workspaces', label: 'Workspaces', icon: Layout },
    { id: 'collections', label: 'Collections', icon: Folder },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: favoritesCount },
    { id: 'recent', label: 'Recently Opened', icon: Clock },
    { id: 'archive', label: 'Archive', icon: Archive },
  ];

  return (
    <aside className="w-64 bg-[#0B0D13] border-r border-[#1E2230] flex flex-col h-[calc(100vh-4rem)] select-none shrink-0 overflow-y-auto">
      {/* Primary Navigation */}
      <div className="p-3 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !activeWorkspaceId && !activeCollectionId;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectWorkspace(null);
                onSelectCollection(null);
                onSelectTab(item.id as ActiveTab);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-violet-950/50 text-violet-300 border border-violet-800/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151E]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-2 border-t border-[#1E2230]" />

      {/* Workspaces Section */}
      <div className="px-3 py-1 flex-1">
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          <span>Workspaces</span>
          <button
            onClick={onOpenCreateWorkspace}
            className="p-0.5 text-slate-500 hover:text-violet-400 rounded transition-colors cursor-pointer"
            title="Create Workspace"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1 space-y-0.5">
          {workspaces.map((ws) => {
            const isActive = activeWorkspaceId === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => {
                  onSelectCollection(null);
                  onSelectWorkspace(ws.id);
                  onSelectTab('workspaces');
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer truncate ${
                  isActive
                    ? 'bg-violet-950/60 text-violet-200 border border-violet-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151E]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ws.color || '#6366F1' }}
                  />
                  <span className="truncate">{ws.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Collections Section */}
        <div className="mt-6 flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          <span>Collections</span>
          <button
            onClick={onOpenCreateCollection}
            className="p-0.5 text-slate-500 hover:text-violet-400 rounded transition-colors cursor-pointer"
            title="Create Collection"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1 space-y-0.5">
          {collections.map((col) => {
            const isActive = activeCollectionId === col.id;
            return (
              <button
                key={col.id}
                onClick={() => {
                  onSelectWorkspace(null);
                  onSelectCollection(col.id);
                  onSelectTab('collections');
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer truncate ${
                  isActive
                    ? 'bg-violet-950/60 text-violet-200 border border-violet-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151E]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span style={{ color: col.color || '#8B5CF6' }}>{getIcon(col.icon)}</span>
                  <span className="truncate">{col.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer settings & storage status */}
      <div className="p-3 border-t border-[#1E2230] space-y-1">
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-violet-950/50 text-violet-300'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151E]'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Settings & Data</span>
        </button>
      </div>
    </aside>
  );
};
