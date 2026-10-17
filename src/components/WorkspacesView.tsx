import React, { useState } from 'react';
import {
  Layout,
  Plus,
  Pin,
  FileText,
  Trash2,
  Edit2,
  ExternalLink,
  BookOpen,
  Bookmark,
  Film,
  Sparkles,
  Code,
  Shield,
  Save,
  Check,
} from 'lucide-react';
import { Workspace, Resource, Collection } from '../types';
import { ResourceCard } from './ResourceCard';

interface WorkspacesViewProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSelectWorkspace: (id: string) => void;
  resources: Resource[];
  collections: Collection[];
  onOpenResource: (id: string, url: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onDeleteResource: (id: string) => void;
  onEditResource: (resource: Resource) => void;
  onUpdateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<any>;
  onDeleteWorkspace: (id: string) => Promise<any>;
  onOpenCreateWorkspace: () => void;
  onOpenAddResource: () => void;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  resources,
  collections,
  onOpenResource,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onDeleteResource,
  onEditResource,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onOpenCreateWorkspace,
  onOpenAddResource,
}) => {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');

  // Sync notes when active workspace changes
  React.useEffect(() => {
    if (activeWs) {
      setNotesContent(activeWs.projectNotes || '');
    }
  }, [activeWs?.id]);

  const handleSaveNotes = async () => {
    if (!activeWs) return;
    await onUpdateWorkspace(activeWs.id, { projectNotes: notesContent });
    setNotesSaved(true);
    setEditingNotes(false);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleSaveWorkspaceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWs) return;
    await onUpdateWorkspace(activeWs.id, {
      name: editName,
      description: editDesc,
      color: editColor,
    });
    setShowEditModal(false);
  };

  if (workspaces.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <Layout className="w-10 h-10 text-violet-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Workspaces Found</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Workspaces serve as focused command centers for your study tracks, research, and projects.
        </p>
        <button
          onClick={onOpenCreateWorkspace}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer"
        >
          Create Workspace
        </button>
      </div>
    );
  }

  // Filter resources assigned to this workspace
  const workspaceResources = resources.filter(
    (r) => r.workspaceIds && r.workspaceIds.includes(activeWs.id)
  );

  const pinnedInWs = workspaceResources.filter((r) => r.isPinned);

  return (
    <div className="space-y-6">
      {/* Workspace Switcher Strip */}
      <div className="flex items-center justify-between gap-4 border-b border-[#1E2230] pb-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          {workspaces.map((ws) => {
            const isActive = activeWs.id === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-violet-950/70 text-white border border-violet-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#12151E]'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ws.color || '#6366F1' }}
                />
                <span>{ws.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenCreateWorkspace}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#12151E] hover:bg-[#1A1E2C] border border-[#1E2230] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Active Workspace Header Banner */}
      <div className="p-6 rounded-2xl bg-[#12151E] border border-[#1E2230] relative overflow-hidden">
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: activeWs.color || '#8B5CF6' }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activeWs.color || '#8B5CF6' }}
              />
              <h1 className="text-xl font-bold text-white tracking-tight">{activeWs.name}</h1>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
              {activeWs.description || 'Project command center and workspace environment.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setEditName(activeWs.name);
                setEditDesc(activeWs.description);
                setEditColor(activeWs.color || '#8B5CF6');
                setShowEditModal(true);
              }}
              className="p-2 text-slate-400 hover:text-white bg-[#1A1E2C] border border-[#272C3E] rounded-lg transition-colors cursor-pointer"
              title="Edit workspace details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${activeWs.name}" workspace? Saved resources will be preserved.`)) {
                  onDeleteWorkspace(activeWs.id);
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-400 bg-[#1A1E2C] border border-[#272C3E] rounded-lg transition-colors cursor-pointer"
              title="Delete workspace"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenAddResource}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Workspace</span>
            </button>
          </div>
        </div>

        {/* Workspace Notes Scratchpad */}
        <div className="mt-6 pt-5 border-t border-[#1E2230]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span>Workspace Scratchpad & Notes</span>
            </div>
            <div className="flex items-center gap-2">
              {notesSaved && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved to cloud
                </span>
              )}
              {editingNotes ? (
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-md transition-colors cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Notes</span>
                </button>
              ) : (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Edit Notes
                </button>
              )}
            </div>
          </div>

          {editingNotes ? (
            <textarea
              rows={4}
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Record study goals, cheat sheets, terminal commands, or project roadmap..."
              className="w-full p-3 text-xs font-mono bg-[#0B0D13] border border-[#272C3E] rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-y"
            />
          ) : (
            <div
              onClick={() => setEditingNotes(true)}
              className="p-3.5 rounded-xl bg-[#0B0D13]/70 border border-[#1E2230] text-xs text-slate-300 font-mono whitespace-pre-wrap hover:border-[#272C3E] transition-colors cursor-pointer min-h-[60px]"
            >
              {notesContent || (
                <span className="text-slate-600 italic font-sans">
                  Click here to add project scratchpad notes, commands, or learning milestones...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pinned Quick Access in this Workspace */}
      {pinnedInWs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Pin className="w-3.5 h-3.5 text-violet-400" />
            <span>Pinned Quick Access ({pinnedInWs.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedInWs.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                collections={collections}
                onOpen={onOpenResource}
                onToggleFavorite={onToggleFavorite}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onDelete={onDeleteResource}
                onEdit={onEditResource}
              />
            ))}
          </div>
        </div>
      )}

      {/* Workspace Resources Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Workspace Resources ({workspaceResources.length})
          </div>
        </div>

        {workspaceResources.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#12151E] border border-[#1E2230]">
            <p className="text-xs text-slate-400">
              No resources assigned to "{activeWs.name}" yet.
            </p>
            <button
              onClick={onOpenAddResource}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-violet-300 bg-violet-950/60 border border-violet-800/60 rounded-lg hover:bg-violet-900 transition-colors cursor-pointer"
            >
              + Add First Resource to Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspaceResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                collections={collections}
                onOpen={onOpenResource}
                onToggleFavorite={onToggleFavorite}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onDelete={onDeleteResource}
                onEdit={onEditResource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Workspace Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#12151E] border border-[#1E2230] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Edit Workspace</h3>
            <form onSubmit={handleSaveWorkspaceEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Accent Color</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#6366F1', '#38BDF8', '#EC4899', '#10B981', '#F59E0B'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        editColor === c ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2230]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
