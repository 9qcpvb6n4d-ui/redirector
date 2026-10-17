import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ResourceCard } from './components/ResourceCard';
import { ResourceTableView } from './components/ResourceTableView';
import { AddResourceModal } from './components/AddResourceModal';
import { CommandPalette } from './components/CommandPalette';
import { WorkspacesView } from './components/WorkspacesView';
import { CollectionsView } from './components/CollectionsView';
import { BookmarkImportModal } from './components/BookmarkImportModal';
import { ExportModal } from './components/ExportModal';
import { AuthView } from './components/AuthView';
import { ShareTargetModal } from './components/ShareTargetModal';
import { Logo } from './components/Logo';
import {
  ActiveTab,
  Resource,
  ResourceType,
} from './types';
import {
  Plus,
  LayoutGrid,
  List,
  Pin,
  Clock,
  Star,
  Compass,
  Archive,
  Folder,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Settings,
  Database,
  Info,
} from 'lucide-react';

export default function App() {
  const {
    user,
    profile,
    loading: authLoading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
  } = useAuth();

  const {
    resources,
    collections,
    workspaces,
    dataLoading,
    addResource,
    updateResource,
    deleteResource,
    toggleFavorite,
    togglePinned,
    toggleArchived,
    recordClick,
    createCollection,
    updateCollection,
    deleteCollection,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    checkDuplicateUrl,
    batchImportResources,
  } = useData(user?.uid);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [inlineSearch, setInlineSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsColor, setNewWsColor] = useState('#8B5CF6');

  // Android Web Share Target state
  const [sharedPayload, setSharedPayload] = useState<{ url: string; title?: string; text?: string } | null>(null);

  // Check URL parameters for Android share target or pending share
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('shared_url') || params.get('url');
    const sharedTitle = params.get('shared_title') || params.get('title') || undefined;
    const sharedText = params.get('shared_text') || params.get('text') || undefined;

    if (sharedUrl || sharedText) {
      const payload = {
        url: sharedUrl || '',
        title: sharedTitle,
        text: sharedText,
      };

      if (!user) {
        // Preserve in sessionStorage until user logs in
        sessionStorage.setItem('myspace_pending_share', JSON.stringify(payload));
      } else {
        setSharedPayload(payload);
      }

      // Clean query params from browser bar without refresh
      window.history.replaceState({}, '', window.location.pathname);
    } else if (user) {
      // Check if there was a pending share waiting for sign in
      const pending = sessionStorage.getItem('myspace_pending_share');
      if (pending) {
        try {
          const payload = JSON.parse(pending);
          setSharedPayload(payload);
          sessionStorage.removeItem('myspace_pending_share');
        } catch {
          // ignore
        }
      }
    }
  }, [user]);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0D13] flex flex-col items-center justify-center gap-3">
        <Logo size="lg" />
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mt-4" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthView
        onLoginWithGoogle={loginWithGoogle}
        onLoginWithEmail={loginWithEmail}
        onRegisterWithEmail={registerWithEmail}
        onResetPassword={resetPassword}
        authError={authError}
      />
    );
  }

  // Filter resources based on current view
  let displayedResources = resources;

  if (activeTab === 'home') {
    displayedResources = resources.filter((r) => !r.isArchived);
  } else if (activeTab === 'favorites') {
    displayedResources = resources.filter((r) => r.isFavorite && !r.isArchived);
  } else if (activeTab === 'recent') {
    displayedResources = resources
      .filter((r) => r.lastOpenedAt && !r.isArchived)
      .sort((a, b) => new Date(b.lastOpenedAt || 0).getTime() - new Date(a.lastOpenedAt || 0).getTime());
  } else if (activeTab === 'archive') {
    displayedResources = resources.filter((r) => r.isArchived);
  } else {
    displayedResources = resources.filter((r) => !r.isArchived);
  }

  // Apply resource type filter
  if (selectedTypeFilter !== 'all') {
    displayedResources = displayedResources.filter((r) => r.resourceType === selectedTypeFilter);
  }

  // Apply inline search query
  if (inlineSearch.trim()) {
    const q = inlineSearch.toLowerCase();
    displayedResources = displayedResources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.domain.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const pinnedResources = resources.filter((r) => r.isPinned && !r.isArchived);
  const favoritesCount = resources.filter((r) => r.isFavorite && !r.isArchived).length;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    await createWorkspace({
      name: newWsName.trim(),
      description: newWsDesc.trim(),
      color: newWsColor,
    });
    setNewWsName('');
    setNewWsDesc('');
    setShowCreateWorkspaceModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0D13] text-slate-100 flex flex-col">
      {/* Top Bar Contract */}
      <Header
        profile={profile}
        resourceCount={resources.length}
        workspaceCount={workspaces.length}
        onOpenAddModal={() => {
          setEditingResource(null);
          setShowAddModal(true);
        }}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onSignOut={logout}
        onOpenImport={() => setShowImportModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collections={collections}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={setActiveWorkspaceId}
          activeCollectionId={activeCollectionId}
          onSelectCollection={setActiveCollectionId}
          onOpenCreateCollection={() => {
            setActiveTab('collections');
          }}
          onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
          favoritesCount={favoritesCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'workspaces' || activeWorkspaceId ? (
            <WorkspacesView
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={setActiveWorkspaceId}
              resources={resources}
              collections={collections}
              onOpenResource={recordClick}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePinned}
              onToggleArchive={toggleArchived}
              onDeleteResource={deleteResource}
              onEditResource={(res) => {
                setEditingResource(res);
                setShowAddModal(true);
              }}
              onUpdateWorkspace={updateWorkspace}
              onDeleteWorkspace={deleteWorkspace}
              onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
              onOpenAddResource={() => {
                setEditingResource(null);
                setShowAddModal(true);
              }}
            />
          ) : activeTab === 'collections' || activeCollectionId ? (
            <CollectionsView
              collections={collections}
              resources={resources}
              activeCollectionId={activeCollectionId}
              onSelectCollection={setActiveCollectionId}
              onOpenResource={recordClick}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePinned}
              onToggleArchive={toggleArchived}
              onDeleteResource={deleteResource}
              onEditResource={(res) => {
                setEditingResource(res);
                setShowAddModal(true);
              }}
              onCreateCollection={createCollection}
              onUpdateCollection={updateCollection}
              onDeleteCollection={deleteCollection}
              onOpenAddResource={() => {
                setEditingResource(null);
                setShowAddModal(true);
              }}
            />
          ) : activeTab === 'settings' ? (
            /* Settings & Account View */
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Settings & Cloud Sync</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your personal internet configuration and data exports.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151E] border border-[#1E2230] space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-[#1E2230]">
                  <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-violet-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Cloud Firestore Backend</h3>
                    <p className="text-xs text-slate-400">
                      Isolated user database with zero-trust security rules and ABAC policies.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#0B0D13] border border-[#1E2230]">
                    <div className="text-slate-500 text-[11px]">Authenticated Account</div>
                    <div className="text-slate-200 font-medium mt-1 truncate">{profile?.email}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B0D13] border border-[#1E2230]">
                    <div className="text-slate-500 text-[11px]">Database Status</div>
                    <div className="text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Online & Connected</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151E] border border-[#1E2230] space-y-3">
                <h3 className="text-sm font-semibold text-white">Data Portability</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Import or export your bookmarks anytime in standard formats.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 text-xs font-semibold text-slate-200 bg-[#1A1E2C] hover:bg-[#272C3E] border border-[#272C3E] rounded-lg transition-colors cursor-pointer"
                  >
                    Import Browser Bookmarks
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 text-xs font-semibold text-slate-200 bg-[#1A1E2C] hover:bg-[#272C3E] border border-[#272C3E] rounded-lg transition-colors cursor-pointer"
                  >
                    Export Library (JSON/CSV)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Home / All / Favorites / Recent Dashboard */
            <div className="space-y-6">
              {/* Home Welcome & Stats Header */}
              {activeTab === 'home' && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Welcome to MySpace
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Your command center for developer tools, AI agents, repositories, and documentation.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingResource(null);
                        setShowAddModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Save New Link</span>
                    </button>
                  </div>

                  {/* Pinned Quick Access Strip */}
                  {pinnedResources.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                        <Pin className="w-3.5 h-3.5 text-violet-400" />
                        <span>Pinned Quick Access ({pinnedResources.length})</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {pinnedResources.map((res) => (
                          <div
                            key={res.id}
                            onClick={() => recordClick(res.id, res.url)}
                            className="p-2.5 rounded-xl bg-[#12151E] hover:bg-[#1A1E2C] border border-[#1E2230] hover:border-violet-600/60 transition-all cursor-pointer flex items-center gap-2.5 group"
                          >
                            <img
                              src={res.faviconUrl || `https://www.google.com/s2/favicons?domain=${res.domain}&sz=64`}
                              alt=""
                              className="w-5 h-5 object-contain rounded-xs shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-200 group-hover:text-violet-300 transition-colors truncate">
                                {res.title}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{res.domain}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Collections Strip */}
                  {collections.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <Folder className="w-3.5 h-3.5 text-violet-400" />
                          <span>Collections ({collections.length})</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('collections')}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                        >
                          View all →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {collections.slice(0, 3).map((col) => {
                          const count = resources.filter((r) => r.collectionId === col.id).length;
                          return (
                            <div
                              key={col.id}
                              onClick={() => {
                                setActiveCollectionId(col.id);
                                setActiveTab('collections');
                              }}
                              className="p-4 rounded-xl bg-[#12151E] hover:bg-[#161A26] border border-[#1E2230] hover:border-violet-600/50 transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                                  style={{ backgroundColor: `${col.color}20`, color: col.color }}
                                >
                                  <Folder className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-200 group-hover:text-violet-300 transition-colors truncate">
                                    {col.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 truncate font-mono tabular-nums">
                                    {count} saved
                                  </div>
                                </div>
                              </div>
                              <span className="text-slate-600 group-hover:text-violet-400 transition-colors text-xs">
                                →
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View Header for other tabs */}
              {activeTab !== 'home' && (
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight capitalize">
                    {activeTab === 'all'
                      ? 'All Resources'
                      : activeTab === 'favorites'
                      ? 'Starred Favorites'
                      : activeTab === 'recent'
                      ? 'Recently Launched'
                      : 'Archived Resources'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTab === 'favorites'
                      ? 'Your curated high-priority references and tools.'
                      : activeTab === 'recent'
                      ? 'Chronological launch history across your devices.'
                      : activeTab === 'archive'
                      ? 'Archived resources preserved in your Firestore database.'
                      : 'Complete index of all saved links.'}
                  </p>
                </div>
              )}

              {/* Resource Filter Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-[#1E2230]">
                {/* Type Filter Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'github', label: 'GitHub' },
                    { id: 'ai_tool', label: 'AI Tools' },
                    { id: 'docs', label: 'Docs' },
                    { id: 'website', label: 'Websites' },
                    { id: 'tutorial', label: 'Tutorials' },
                    { id: 'video', label: 'Videos' },
                    { id: 'api', label: 'APIs' },
                  ].map((filter) => {
                    const isActive = selectedTypeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedTypeFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-violet-950/70 text-violet-200 border border-violet-800/60'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151E]'
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search & Grid/Table toggles */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex-1 md:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={inlineSearch}
                      onChange={(e) => setInlineSearch(e.target.value)}
                      placeholder="Filter current view..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#12151E] border border-[#1E2230] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="flex items-center bg-[#12151E] border border-[#1E2230] rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-violet-950/80 text-violet-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'table' ? 'bg-violet-950/80 text-violet-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Resource Content: Grid or Table */}
              {dataLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading your cloud resources...
                </div>
              ) : displayedResources.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#12151E] border border-[#1E2230]">
                  <Compass className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white">No Resources Found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {inlineSearch || selectedTypeFilter !== 'all'
                      ? 'No items matched the active search filters.'
                      : 'Your library is empty. Save websites, GitHub repos, or documentation to get started.'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingResource(null);
                      setShowAddModal(true);
                    }}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    + Save Your First Resource
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {displayedResources.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      collections={collections}
                      onOpen={recordClick}
                      onToggleFavorite={toggleFavorite}
                      onTogglePin={togglePinned}
                      onToggleArchive={toggleArchived}
                      onDelete={deleteResource}
                      onEdit={(r) => {
                        setEditingResource(r);
                        setShowAddModal(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <ResourceTableView
                  resources={displayedResources}
                  collections={collections}
                  onOpen={recordClick}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteResource}
                  onEdit={(r) => {
                    setEditingResource(r);
                    setShowAddModal(true);
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingResource(null);
        }}
        onSave={addResource}
        collections={collections}
        workspaces={workspaces}
        checkDuplicateUrl={checkDuplicateUrl}
        editResource={editingResource}
        onUpdate={updateResource}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        resources={resources}
        collections={collections}
        workspaces={workspaces}
        onOpenResource={recordClick}
        onSelectWorkspace={(wsId) => {
          setActiveWorkspaceId(wsId);
          setActiveTab('workspaces');
        }}
        onSelectCollection={(colId) => {
          setActiveCollectionId(colId);
          setActiveTab('collections');
        }}
        onOpenAddModal={() => {
          setEditingResource(null);
          setShowAddModal(true);
        }}
        onOpenCreateCollection={() => {
          setActiveTab('collections');
        }}
        onOpenImport={() => setShowImportModal(true)}
        onOpenExport={() => setShowExportModal(true)}
      />

      <BookmarkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={batchImportResources}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        resources={resources}
        collections={collections}
        workspaces={workspaces}
      />

      {/* Android Share Target Modal */}
      {sharedPayload && (
        <ShareTargetModal
          isOpen={true}
          onClose={() => setSharedPayload(null)}
          sharedUrl={sharedPayload.url}
          sharedTitle={sharedPayload.title}
          sharedText={sharedPayload.text}
          collections={collections}
          onSaveResource={addResource}
          checkDuplicateUrl={checkDuplicateUrl}
        />
      )}

      {/* Create Workspace Modal */}
      {showCreateWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#12151E] border border-[#1E2230] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. AI Research, Hackathon 2026..."
                  className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purpose / Description</label>
                <textarea
                  rows={2}
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Brief description of this project environment..."
                  className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Accent Theme</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#6366F1', '#38BDF8', '#10B981', '#F59E0B', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewWsColor(c)}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        newWsColor === c ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2230]">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkspaceModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
