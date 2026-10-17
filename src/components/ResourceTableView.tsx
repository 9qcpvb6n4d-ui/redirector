import React from 'react';
import {
  ExternalLink,
  Star,
  Pin,
  Trash2,
  Edit2,
  Globe,
  Sparkles,
  FileCode,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Resource, Collection } from '../types';

interface ResourceTableViewProps {
  resources: Resource[];
  collections: Collection[];
  onOpen: (id: string, url: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (resource: Resource) => void;
}

export const ResourceTableView: React.FC<ResourceTableViewProps> = ({
  resources,
  collections,
  onOpen,
  onToggleFavorite,
  onDelete,
  onEdit,
}) => {
  const getCollectionName = (id: string | null) => {
    if (!id) return '—';
    const c = collections.find((col) => col.id === id);
    return c ? c.name : '—';
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  if (resources.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        No resources match the selected criteria.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#1E2230] bg-[#12151E]">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="border-b border-[#1E2230] bg-[#0B0D13]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4 w-10"></th>
            <th className="py-3 px-4">Title & Link</th>
            <th className="py-3 px-4 hidden md:table-cell">Collection</th>
            <th className="py-3 px-4 hidden sm:table-cell">Type</th>
            <th className="py-3 px-4 hidden lg:table-cell">Tags</th>
            <th className="py-3 px-4 text-right">Launches</th>
            <th className="py-3 px-4 hidden sm:table-cell text-right">Added</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E2230]">
          {resources.map((res) => (
            <tr
              key={res.id}
              className="hover:bg-[#1A1E2C]/50 transition-colors group cursor-pointer"
              onClick={() => onOpen(res.id, res.url)}
            >
              {/* Star */}
              <td
                className="py-2.5 px-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(res.id, res.isFavorite);
                }}
              >
                <button className="text-slate-500 hover:text-amber-400 cursor-pointer">
                  <Star className={`w-3.5 h-3.5 ${res.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                </button>
              </td>

              {/* Title & Domain */}
              <td className="py-2.5 px-4 min-w-[220px]">
                <div className="flex items-center gap-2">
                  <img
                    src={res.faviconUrl || `https://www.google.com/s2/favicons?domain=${res.domain}&sz=64`}
                    alt=""
                    className="w-4 h-4 rounded-xs shrink-0 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="truncate">
                    <span className="font-medium text-slate-200 group-hover:text-violet-300 transition-colors truncate block">
                      {res.title}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">{res.domain}</span>
                  </div>
                </div>
              </td>

              {/* Collection */}
              <td className="py-2.5 px-4 hidden md:table-cell text-slate-400 truncate max-w-[140px]">
                {getCollectionName(res.collectionId)}
              </td>

              {/* Resource Type */}
              <td className="py-2.5 px-4 hidden sm:table-cell capitalize text-slate-400">
                {res.resourceType.replace('_', ' ')}
              </td>

              {/* Tags */}
              <td className="py-2.5 px-4 hidden lg:table-cell text-slate-400 truncate max-w-[180px]">
                {res.tags?.length ? res.tags.join(', ') : '—'}
              </td>

              {/* Launches */}
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                {res.clickCount}
              </td>

              {/* Date */}
              <td className="py-2.5 px-4 hidden sm:table-cell text-right font-mono tabular-nums text-slate-500">
                {formatDate(res.createdAt)}
              </td>

              {/* Actions */}
              <td
                className="py-2.5 px-4 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(res)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(res.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpen(res.id, res.url)}
                    className="p-1 text-slate-500 hover:text-white rounded cursor-pointer"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
