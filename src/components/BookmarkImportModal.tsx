import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, FileCode } from 'lucide-react';

interface BookmarkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    items: Array<{
      url: string;
      title: string;
      description?: string;
      collectionName?: string;
      tags?: string[];
    }>
  ) => Promise<{ imported: number; skipped: number }>;
}

export const BookmarkImportModal: React.FC<BookmarkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const parseBookmarksHtml = (htmlText: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));

    const items: Array<{
      url: string;
      title: string;
      collectionName?: string;
      tags?: string[];
    }> = [];

    for (const link of links) {
      const url = link.getAttribute('href');
      if (!url || url.startsWith('javascript:') || url.startsWith('place:')) continue;

      const title = link.textContent?.trim() || '';

      // Determine parent folder/collection
      let folderName = 'Bookmarks';
      let parent = link.parentElement;
      while (parent && parent.tagName !== 'BODY') {
        const prevSibling = parent.previousElementSibling;
        if (prevSibling && (prevSibling.tagName === 'H3' || prevSibling.tagName === 'H2')) {
          folderName = prevSibling.textContent?.trim() || folderName;
          break;
        }
        parent = parent.parentElement;
      }

      // Check for tags attribute (Chrome / Firefox bookmark format uses TAGS="tag1,tag2")
      const tagsAttr = link.getAttribute('tags') || link.getAttribute('data-tags') || '';
      const tags = tagsAttr
        ? tagsAttr.split(',').map((t) => t.trim()).filter(Boolean)
        : [folderName.toLowerCase().replace(/[^a-z0-9]/g, '')].filter(Boolean);

      items.push({
        url,
        title,
        collectionName: folderName !== 'Bookmarks' ? folderName : undefined,
        tags,
      });
    }

    return items;
  };

  const handleStartImport = async () => {
    if (!file) return;
    setIsParsing(true);
    setError(null);

    try {
      const text = await file.text();
      const extracted = parseBookmarksHtml(text);

      if (extracted.length === 0) {
        setError('No valid bookmark URLs found in the selected file.');
        setIsParsing(false);
        return;
      }

      const res = await onImport(extracted);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import bookmark file');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#12151E] border border-[#1E2230] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2230]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-violet-400" />
            <h3 className="text-base font-bold text-white">Import Browser Bookmarks</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          Upload an exported HTML bookmarks file from Chrome, Firefox, Safari, Edge, Brave, or Arc.
          Folders will be automatically converted into visual <strong>Collections</strong> and tags.
        </p>

        {/* File Dropzone */}
        <div className="mt-4 p-6 rounded-xl border-2 border-dashed border-[#272C3E] hover:border-violet-600/60 bg-[#0B0D13] text-center transition-colors">
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileChange}
            className="hidden"
            id="bookmark-file-input"
          />
          <label htmlFor="bookmark-file-input" className="cursor-pointer block">
            <FileCode className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-200">
              {file ? file.name : 'Choose an HTML bookmark export'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Click to browse files'}
            </div>
          </label>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Import Completed Successfully!</span>
            </div>
            <div className="mt-2 text-slate-300 space-y-1">
              <div>• <strong>{result.imported}</strong> new resources saved and categorized.</div>
              <div>• <strong>{result.skipped}</strong> existing duplicate URLs skipped.</div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-[#1E2230]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleStartImport}
              disabled={!file || isParsing}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Import to MySpace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
