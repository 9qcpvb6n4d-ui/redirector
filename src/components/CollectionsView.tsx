import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Bookmark,
  Film,
  Sparkles,
  Code,
  FileText,
  Search,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { Collection, Resource } from '../types';
import { ResourceCard } from './ResourceCard';

interface CollectionsViewProps {
  collections: Collection[];
  resources: Resource[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onOpenResource: (id: string, url: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onDeleteResource: (id: string) => void;
  onEditResource: (resource: Resource) => void;
  onCreateCollection: (data: { name: string; description?: string; icon?: string; color?: string }) => Promise<any>;
  onUpdateCollection: (id: string, updates: Partial<Collection>) => Promise<any>;
  onDeleteCollection: (id: string) => Promise<any>;
  onOpenAddResource: () => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  resources,
  activeCollectionId,
  onSelectCollection,
  onOpenResource,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onDeleteResource,
  onEditResource,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onOpenAddResource,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('Folder');

  const getIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Bookmark':
        return <Bookmark className={className} />;
      case 'Film':
        return <Film className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      default:
        return <Folder className={className} />;
    }
  };

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setColor('#8B5CF6');
    setIcon('Folder');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (col: Collection) => {
    setEditingCollection(col);
    setName(col.name);
    setDescription(col.description);
    setColor(col.color || '#8B5CF6');
    setIcon(col.icon || 'Folder');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCollection) {
      await onUpdateCollection(editingCollection.id, { name, description, color, icon });
      setEditingCollection(null);
    } else {
      await onCreateCollection({ name, description, color, icon });
      setShowCreateModal(false);
    }
  };

  // If a specific collection is selected, show detail drilldown
  const activeCol = collections.find((c) => c.id === activeCollectionId);
  if (activeCol) {
    const colResources = resources.filter((r) => r.collectionId === activeCol.id);

    return (
      <div className="space-y-6">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectCollection(null)}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Collections</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(activeCol)}
              className="p-1.5 text-slate-400 hover:text-white bg-[#12151E] border border-[#1E2230] rounded-lg transition-colors cursor-pointer"
              title="Edit Collection"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${activeCol.name}"? Saved resources will be preserved and unlinked.`)) {
                  onDeleteCollection(activeCol.id);
                  onSelectCollection(null);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 bg-[#12151E] border border-[#1E2230] rounded-lg transition-colors cursor-pointer"
              title="Delete Collection"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenAddResource}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Collection</span>
            </button>
          </div>
        </div>

        {/* Collection Hero Header */}
        <div className="p-6 rounded-2xl bg-[#12151E] border border-[#1E2230] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
              style={{ backgroundColor: `${activeCol.color}20`, color: activeCol.color }}
            >
              {getIcon(activeCol.icon, 'w-6 h-6')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{activeCol.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{activeCol.description || 'Curated visual collection.'}</p>
            </div>
          </div>

          <div className="font-mono text-xs text-slate-400 tabular-nums">
            {colResources.length} items
          </div>
        </div>

        {/* Resources in Collection */}
        {colResources.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#12151E] border border-[#1E2230]">
            <p className="text-xs text-slate-400">This collection is currently empty.</p>
            <button
              onClick={onOpenAddResource}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-violet-300 bg-violet-950/60 border border-violet-800/60 rounded-lg hover:bg-violet-900 transition-colors cursor-pointer"
            >
              + Save Link to this Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {colResources.map((res) => (
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
    );
  }

  // Collections Overview Grid
  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Collections</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize resources into thematic libraries and visual folders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter collections..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#12151E] border border-[#1E2230] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCollections.map((col) => {
          const count = resources.filter((r) => r.collectionId === col.id).length;
          return (
            <div
              key={col.id}
              onClick={() => onSelectCollection(col.id)}
              className="group p-5 rounded-xl bg-[#12151E] hover:bg-[#161A26] border border-[#1E2230] hover:border-violet-600/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10"
                    style={{ backgroundColor: `${col.color}20`, color: col.color }}
                  >
                    {getIcon(col.icon)}
                  </div>
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenEdit(col)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${col.name}"? Saved links will be preserved.`)) {
                          onDeleteCollection(col.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                  {col.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {col.description || 'No description.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E2230] flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono tabular-nums">{count} resources</span>
                <span className="text-violet-400 group-hover:translate-x-0.5 transition-transform">
                  View →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Collection Modal */}
      {(showCreateModal || editingCollection) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#12151E] border border-[#1E2230] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingCollection ? 'Edit Collection' : 'Create Collection'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Collection Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Design Systems"
                  className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is saved in this collection..."
                  className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {['Folder', 'Bookmark', 'BookOpen', 'Code', 'Sparkles', 'Film'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        icon === ic
                          ? 'border-violet-500 bg-violet-950/60 text-violet-300'
                          : 'border-[#1E2230] bg-[#0B0D13] text-slate-400 hover:text-white'
                      }`}
                    >
                      {getIcon(ic)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Color</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#6366F1', '#38BDF8', '#10B981', '#F59E0B', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                        color === c ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2230]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCollection(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg"
                >
                  {editingCollection ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
