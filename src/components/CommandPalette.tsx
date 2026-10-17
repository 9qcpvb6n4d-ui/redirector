import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ExternalLink,
  Plus,
  Folder,
  Layout,
  Upload,
  Download,
  Star,
  FileCode,
  Sparkles,
  Globe,
} from 'lucide-react';
import { Resource, Collection, Workspace } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  collections: Collection[];
  workspaces: Workspace[];
  onOpenResource: (id: string, url: string) => void;
  onSelectWorkspace: (id: string) => void;
  onSelectCollection: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenCreateCollection: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  resources,
  collections,
  workspaces,
  onOpenResource,
  onSelectWorkspace,
  onSelectCollection,
  onOpenAddModal,
  onOpenCreateCollection,
  onOpenImport,
  onOpenExport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items
  const cleanQuery = query.trim().toLowerCase();

  const matchingResources = resources
    .filter((r) => {
      if (!cleanQuery) return true;
      return (
        r.title.toLowerCase().includes(cleanQuery) ||
        r.domain.toLowerCase().includes(cleanQuery) ||
        r.description.toLowerCase().includes(cleanQuery) ||
        r.notes.toLowerCase().includes(cleanQuery) ||
        r.tags.some((t) => t.toLowerCase().includes(cleanQuery))
      );
    })
    .slice(0, 8);

  const matchingCollections = collections
    .filter((c) => {
      if (!cleanQuery) return true;
      return c.name.toLowerCase().includes(cleanQuery) || c.description.toLowerCase().includes(cleanQuery);
    })
    .slice(0, 3);

  const matchingWorkspaces = workspaces
    .filter((w) => {
      if (!cleanQuery) return true;
      return w.name.toLowerCase().includes(cleanQuery) || w.description.toLowerCase().includes(cleanQuery);
    })
    .slice(0, 3);

  const staticActions = [
    {
      id: 'act_add',
      title: 'Add New Resource',
      desc: 'Save a URL, GitHub repo, or documentation link',
      icon: Plus,
      run: onOpenAddModal,
    },
    {
      id: 'act_col',
      title: 'Create Collection',
      desc: 'Organize resources into a visual group',
      icon: Folder,
      run: onOpenCreateCollection,
    },
    {
      id: 'act_import',
      title: 'Import Bookmarks',
      desc: 'Upload Chrome or Firefox HTML bookmark export',
      icon: Upload,
      run: onOpenImport,
    },
    {
      id: 'act_export',
      title: 'Export Library',
      desc: 'Download your personal internet in JSON or CSV',
      icon: Download,
      run: onOpenExport,
    },
  ].filter((a) => !cleanQuery || a.title.toLowerCase().includes(cleanQuery) || a.desc.toLowerCase().includes(cleanQuery));

  // Flatten for keyboard navigation
  const flatItems: Array<{ type: 'action' | 'resource' | 'collection' | 'workspace'; id: string; run: () => void }> = [
    ...staticActions.map((a) => ({ type: 'action' as const, id: a.id, run: a.run })),
    ...matchingWorkspaces.map((w) => ({
      type: 'workspace' as const,
      id: w.id,
      run: () => onSelectWorkspace(w.id),
    })),
    ...matchingCollections.map((c) => ({
      type: 'collection' as const,
      id: c.id,
      run: () => onSelectCollection(c.id),
    })),
    ...matchingResources.map((r) => ({
      type: 'resource' as const,
      id: r.id,
      run: () => onOpenResource(r.id, r.url),
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].run();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#12151E] border border-[#1E2230] shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1E2230]">
          <Search className="w-4 h-4 text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, saved resources, collections, workspaces..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#1A1E2C] border border-[#272C3E] rounded">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Quick Actions */}
          {staticActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="mt-1 space-y-0.5">
                {staticActions.map((act) => {
                  const itemIndex = flatItems.findIndex((it) => it.id === act.id);
                  const isSelected = selectedIndex === itemIndex;
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        act.run();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-violet-950/60 text-white' : 'text-slate-300 hover:bg-[#1A1E2C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 text-violet-400" />
                        <div>
                          <div className="font-medium">{act.title}</div>
                          <div className="text-[11px] text-slate-500">{act.desc}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">Action</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workspaces */}
          {matchingWorkspaces.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Workspaces
              </div>
              <div className="mt-1 space-y-0.5">
                {matchingWorkspaces.map((ws) => {
                  const itemIndex = flatItems.findIndex((it) => it.id === ws.id);
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <div
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-violet-950/60 text-white' : 'text-slate-300 hover:bg-[#1A1E2C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layout className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-medium">{ws.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Workspace</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collections */}
          {matchingCollections.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Collections
              </div>
              <div className="mt-1 space-y-0.5">
                {matchingCollections.map((col) => {
                  const itemIndex = flatItems.findIndex((it) => it.id === col.id);
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <div
                      key={col.id}
                      onClick={() => {
                        onSelectCollection(col.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-violet-950/60 text-white' : 'text-slate-300 hover:bg-[#1A1E2C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder className="w-3.5 h-3.5 text-violet-400" />
                        <span className="font-medium">{col.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Collection</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resources */}
          {matchingResources.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Saved Resources
              </div>
              <div className="mt-1 space-y-0.5">
                {matchingResources.map((res) => {
                  const itemIndex = flatItems.findIndex((it) => it.id === res.id);
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <div
                      key={res.id}
                      onClick={() => {
                        onOpenResource(res.id, res.url);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-violet-950/60 text-white' : 'text-slate-300 hover:bg-[#1A1E2C]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                        <img
                          src={res.faviconUrl || `https://www.google.com/s2/favicons?domain=${res.domain}&sz=64`}
                          alt=""
                          className="w-3.5 h-3.5 object-contain shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="truncate">
                          <div className="font-medium truncate">{res.title}</div>
                          <div className="text-[10px] text-slate-500 truncate">{res.domain}</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {flatItems.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No matching commands or resources found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-[#1E2230] bg-[#0B0D13]/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to dismiss</span>
          </div>
          <span>MySpace Command Engine</span>
        </div>
      </div>
    </div>
  );
};
