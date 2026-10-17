import React from 'react';
import { X, Download, FileSpreadsheet, FileJson, Check } from 'lucide-react';
import { Resource, Collection, Workspace } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  collections: Collection[];
  workspaces: Workspace[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  resources,
  collections,
  workspaces,
}) => {
  if (!isOpen) return null;

  const downloadJson = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      resources,
      collections,
      workspaces,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myspace-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    // Generate CSV for resources
    const headers = ['Title', 'URL', 'Domain', 'Type', 'Collection', 'Tags', 'Favorite', 'Pinned', 'Launches', 'Notes', 'Created'];
    const rows = resources.map((r) => {
      const col = collections.find((c) => c.id === r.collectionId);
      return [
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.url || '').replace(/"/g, '""')}"`,
        `"${(r.domain || '').replace(/"/g, '""')}"`,
        `"${r.resourceType}"`,
        `"${(col?.name || '').replace(/"/g, '""')}"`,
        `"${(r.tags || []).join('; ')}"`,
        r.isFavorite ? 'Yes' : 'No',
        r.isPinned ? 'Yes' : 'No',
        r.clickCount,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        `"${r.createdAt}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myspace-resources-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#12151E] border border-[#1E2230] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2230]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-violet-400" />
            <h3 className="text-base font-bold text-white">Export Your Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          Download a complete portable archive of your resources, collections, and workspaces.
        </p>

        <div className="mt-4 space-y-3">
          <button
            onClick={downloadJson}
            className="w-full p-4 rounded-xl bg-[#0B0D13] hover:bg-[#161A26] border border-[#1E2230] hover:border-violet-600/60 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-950/60 border border-violet-800/60 flex items-center justify-center text-violet-300">
                <FileJson className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-violet-300">
                  Full Database Export (.JSON)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Complete structure with workspaces, notes, and collections.
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-violet-400" />
          </button>

          <button
            onClick={downloadCsv}
            className="w-full p-4 rounded-xl bg-[#0B0D13] hover:bg-[#161A26] border border-[#1E2230] hover:border-emerald-600/60 transition-all text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-300">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-emerald-300">
                  Resource Spreadsheet (.CSV)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Universal spreadsheet format compatible with Excel and Google Sheets.
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </button>
        </div>

        <div className="mt-6 flex justify-end pt-3 border-t border-[#1E2230]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
