import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Folder,
  Tag,
  Star,
} from 'lucide-react';
import { Collection, Resource, ResourceType } from '../types';

interface ShareTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
  sharedTitle?: string;
  sharedText?: string;
  collections: Collection[];
  onSaveResource: (data: Omit<Resource, 'id' | 'ownerId' | 'clickCount' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  checkDuplicateUrl: (url: string) => Resource | undefined;
}

export const ShareTargetModal: React.FC<ShareTargetModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
  sharedTitle,
  sharedText,
  collections,
  onSaveResource,
  checkDuplicateUrl,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [resourceType, setResourceType] = useState<ResourceType>('website');
  const [domain, setDomain] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [githubData, setGithubData] = useState<any>(null);

  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState<Resource | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSaveSuccess(false);
      return;
    }

    // Extract genuine URL from shared payload (Android share sheets sometimes put URL inside text)
    let extractedUrl = sharedUrl || '';
    if (!extractedUrl && sharedText) {
      const match = sharedText.match(/https?:\/\/[^\s]+/);
      if (match) {
        extractedUrl = match[0];
      }
    }

    if (extractedUrl) {
      setUrl(extractedUrl);
      setTitle(sharedTitle || '');
      setDescription(sharedText && sharedText !== extractedUrl ? sharedText : '');

      const dup = checkDuplicateUrl(extractedUrl);
      setDuplicate(dup || null);

      fetchMetadata(extractedUrl);
    }
  }, [isOpen, sharedUrl, sharedTitle, sharedText]);

  const fetchMetadata = async (targetUrl: string) => {
    setLoadingMetadata(true);
    try {
      const res = await fetch(`/api/scrape-metadata?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data.success && data.metadata) {
        const meta = data.metadata;
        if (!title) setTitle(meta.title);
        if (!description) setDescription(meta.description);
        setDomain(meta.domain);
        setFaviconUrl(meta.faviconUrl);
        setResourceType(meta.resourceType || 'website');
        if (meta.githubData) setGithubData(meta.githubData);
      }
    } catch (err) {
      console.warn('Metadata fetch failed, using fallbacks', err);
      try {
        const p = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
        setDomain(p.hostname);
        setFaviconUrl(`https://www.google.com/s2/favicons?domain=${p.hostname}&sz=128`);
      } catch {
        // ignore
      }
    } finally {
      setLoadingMetadata(false);
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

  const handleSave = async (e: React.FormEvent) => {
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

    try {
      await onSaveResource({
        url: url.trim(),
        title: title.trim() || resolvedDomain,
        description: description.trim(),
        domain: resolvedDomain,
        faviconUrl: faviconUrl || `https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=128`,
        resourceType,
        collectionId: collectionId || null,
        workspaceIds: [],
        tags,
        notes: notes.trim(),
        isFavorite,
        isPinned: false,
        isArchived: false,
        githubData,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save shared resource:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#12151E] border border-violet-600/40 p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2230]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-950 border border-violet-700/60 flex items-center justify-center text-violet-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Save from Android Share</h3>
              <p className="text-[11px] text-slate-400">Shared link detected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saveSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Saved to MySpace!</h4>
            <p className="text-xs text-slate-400">
              Your resource was securely synchronized to your Cloud Firestore library.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {duplicate && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center justify-between">
                <span>Already in your library: "{duplicate.title}"</span>
                <button
                  type="button"
                  onClick={() => window.open(duplicate.url, '_blank')}
                  className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* URL Display */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Shared Link</label>
              <div className="p-2.5 rounded-lg bg-[#0B0D13] border border-[#1E2230] text-xs font-mono text-slate-300 break-all flex items-center justify-between gap-2">
                <span className="truncate">{url}</span>
                {loadingMetadata && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400 shrink-0" />}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Collection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-violet-400" />
                <span>Save to Collection</span>
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#0B0D13] border border-[#1E2230] rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="">(No Collection - Save to Library Root)</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Tags (Press Enter or comma)</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0B0D13] border border-[#1E2230] rounded-lg min-h-[38px]">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-[#1A1E2C] text-slate-300 rounded border border-[#272C3E]"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="hover:text-rose-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="add tags..."
                  className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1E2230]">
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving || !url.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save to Account</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
