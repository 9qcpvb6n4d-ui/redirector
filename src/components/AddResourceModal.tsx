import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Star,
  Pin,
  Tag,
  Folder,
  Layout,
  Globe,
} from 'lucide-react';
import { Resource, Collection, Workspace, ResourceType } from '../types';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Resource, 'id' | 'ownerId' | 'clickCount' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  collections: Collection[];
  workspaces: Workspace[];
  checkDuplicateUrl: (url: string) => Resource | undefined;
  editResource?: Resource | null;
  onUpdate?: (id: string, updates: Partial<Resource>) => Promise<any>;
  prefilledUrl?: string;
  prefilledTitle?: string;
  prefilledText?: string;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  collections,
  workspaces,
  checkDuplicateUrl,
  editResource,
  onUpdate,
  prefilledUrl,
  prefilledTitle,
  prefilledText,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('website');
  const [collectionId, setCollectionId] = useState<string>('');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [domain, setDomain] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [githubData, setGithubData] = useState<any>(null);

  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [duplicateResource, setDuplicateResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setResourceType('website');
      setCollectionId('');
      setSelectedWorkspaceIds([]);
      setTags([]);
      setTagInput('');
      setNotes('');
      setIsFavorite(false);
      setIsPinned(false);
      setDomain('');
      setFaviconUrl('');
      setGithubData(null);
      setScrapeError(null);
      setDuplicateResource(null);
      return;
    }

    if (editResource) {
      setUrl(editResource.url);
      setTitle(editResource.title);
      setDescription(editResource.description);
      setResourceType(editResource.resourceType);
      setCollectionId(editResource.collectionId || '');
      setSelectedWorkspaceIds(editResource.workspaceIds || []);
      setTags(editResource.tags || []);
      setNotes(editResource.notes || '');
      setIsFavorite(editResource.isFavorite);
      setIsPinned(editResource.isPinned);
      setDomain(editResource.domain);
      setFaviconUrl(editResource.faviconUrl);
      setGithubData(editResource.githubData || null);
    } else if (prefilledUrl) {
      setUrl(prefilledUrl);
      setTitle(prefilledTitle || '');
      setDescription(prefilledText || '');
      triggerMetadataFetch(prefilledUrl);
    }
  }, [isOpen, editResource, prefilledUrl]);

  // Handle URL changes & duplicate detection
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setScrapeError(null);
    if (!editResource && newUrl.trim()) {
      const dup = checkDuplicateUrl(newUrl.trim());
      setDuplicateResource(dup || null);
    } else {
      setDuplicateResource(null);
    }
  };

  const triggerMetadataFetch = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.includes('.')) return;
    setScraping(true);
    setScrapeError(null);

    try {
      const res = await fetch(`/api/scrape-metadata?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data.success && data.metadata) {
        const meta = data.metadata;
        if (!title || title === domain) setTitle(meta.title);
        if (!description) setDescription(meta.description);
        setDomain(meta.domain);
        setFaviconUrl(meta.faviconUrl);
        setResourceType(meta.resourceType || 'website');
        if (meta.githubData) {
          setGithubData(meta.githubData);
        }
      }
    } catch (err) {
      console.warn('Scraping failed, fallbacks available', err);
      try {
        const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
        setDomain(parsed.hostname);
        setFaviconUrl(`https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`);
      } catch {
        // ignore
      }
    } finally {
      setScraping(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleWorkspaceSelection = (wsId: string) => {
    if (selectedWorkspaceIds.includes(wsId)) {
      setSelectedWorkspaceIds(selectedWorkspaceIds.filter((id) => id !== wsId));
    } else {
      setSelectedWorkspaceIds([...selectedWorkspaceIds, wsId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setSaving(true);
    let resolvedDomain = domain;
    if (!resolvedDomain) {
      try {
        resolvedDomain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
      } catch {
        resolvedDomain = 'link';
      }
    }

    const payload = {
      url: url.startsWith('http') ? url.trim() : `https://${url.trim()}`,
      title: title.trim() || resolvedDomain,
      description: description.trim(),
      domain: resolvedDomain,
      faviconUrl: faviconUrl || `https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=128`,
      resourceType,
      collectionId: collectionId || null,
      workspaceIds: selectedWorkspaceIds,
      tags,
      notes: notes.trim(),
      isFavorite,
      isPinned,
      isArchived: editResource ? editResource.isArchived : false,
      githubData,
    };

    try {
      if (editResource && onUpdate) {
        await onUpdate(editResource.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save resource:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[#12151E] border border-[#1E2230] shadow-2xl p-6 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2230]">
          <div>
            <h2 className="text-base font-bold text-white">
              {editResource ? 'Edit Resource' : 'Save to MySpace'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Save websites, AI tools, GitHub repositories, or documentation links.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1A1E2C] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateResource && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Already saved:</strong> "{duplicateResource.title}" is already in your library.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.open(duplicateResource.url, '_blank');
              }}
              className="text-amber-400 hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* URL Input with Auto-Scrape Trigger */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Resource URL <span className="text-violet-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onBlur={() => {
                  if (url.trim() && !title && !editResource) {
                    triggerMetadataFetch(url.trim());
                  }
                }}
                placeholder="https://github.com/... or https://..."
                className="flex-1 px-3.5 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => triggerMetadataFetch(url.trim())}
                disabled={scraping || !url.trim()}
                className="px-3 py-2 text-xs font-medium bg-[#1A1E2C] hover:bg-[#272C3E] text-slate-200 border border-[#272C3E] rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {scraping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    <span>Enriching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Auto-Enrich</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Title & Resource Type in 2-col */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next.js Documentation"
                className="w-full px-3.5 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Resource Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as ResourceType)}
                className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="website">Website</option>
                <option value="github">GitHub Repo</option>
                <option value="ai_tool">AI Tool</option>
                <option value="docs">Documentation</option>
                <option value="tutorial">Tutorial</option>
                <option value="api">API Reference</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="course">Course</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or takeaway..."
              className="w-full px-3.5 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Collection & Workspaces Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-violet-400" />
                <span>Collection</span>
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="">(No collection)</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-indigo-400" />
                <span>Assign to Workspaces</span>
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#0B0D13] border border-[#1E2230] rounded-lg min-h-[38px]">
                {workspaces.map((ws) => {
                  const isSelected = selectedWorkspaceIds.includes(ws.id);
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => toggleWorkspaceSelection(ws.id)}
                      className={`px-2 py-0.5 text-[11px] rounded-md transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-violet-900/60 text-violet-200 border border-violet-700/60'
                          : 'bg-[#1A1E2C] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ws.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Tags (Press Enter or comma to add)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0B0D13] border border-[#1E2230] rounded-lg min-h-[40px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] bg-[#1A1E2C] text-slate-300 rounded border border-[#272C3E]"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "e.g. react, ai, docs..." : ""}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Personal Notes & Cheat Sheet</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key commands, shortcuts, or takeaways..."
              className="w-full px-3.5 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Star & Pin Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
              />
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span>Favorite</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
              />
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-violet-400 fill-violet-400' : 'text-slate-400'}`} />
              <span>Pin to Quick Access</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2230]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !url.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{editResource ? 'Save Changes' : 'Save Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
