import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  Star,
  Pin,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  Copy,
  Check,
  GitFork,
  Globe,
  Sparkles,
  FileCode,
  BookOpen,
  Video,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { Resource, Collection } from '../types';

interface ResourceCardProps {
  resource: Resource;
  collections: Collection[];
  onOpen: (id: string, url: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  collections,
  onOpen,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const collection = collections.find((c) => c.id === resource.collectionId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const getTypeIcon = () => {
    switch (resource.resourceType) {
      case 'github':
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
      case 'ai_tool':
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case 'docs':
        return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
      case 'tutorial':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-400" />;
      case 'course':
        return <GraduationCap className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTypeName = () => {
    switch (resource.resourceType) {
      case 'github':
        return 'GitHub';
      case 'ai_tool':
        return 'AI Tool';
      case 'docs':
        return 'Documentation';
      case 'tutorial':
        return 'Tutorial';
      case 'video':
        return 'Video';
      case 'course':
        return 'Course';
      case 'api':
        return 'API';
      case 'article':
        return 'Article';
      default:
        return 'Website';
    }
  };

  return (
    <div className="group relative bg-[#12151E] hover:bg-[#161A26] border border-[#1E2230] hover:border-violet-600/40 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between shadow-xs">
      <div>
        {/* Header: Favicon + Domain + Star & Menu */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#1A1E2C] border border-[#272C3E] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
              {!faviconError && resource.faviconUrl ? (
                <img
                  src={resource.faviconUrl}
                  alt={resource.domain}
                  onError={() => setFaviconError(true)}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                getTypeIcon()
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400 hover:text-slate-300 transition-colors truncate">
                {resource.domain}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span>{getTypeName()}</span>
                {collection && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-violet-400 truncate max-w-[120px]">{collection.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleFavorite(resource.id, resource.isFavorite)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                resource.isFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={resource.isFavorite ? 'Starred' : 'Star resource'}
            >
              <Star className={`w-3.5 h-3.5 ${resource.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {resource.isPinned && (
              <span title="Pinned to quick access">
                <Pin className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
              </span>
            )}

            {/* Context menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-[#1E2230] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#12151E] border border-[#1E2230] shadow-2xl py-1 text-xs text-slate-300 z-30">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpen(resource.id, resource.url);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in new tab</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy link'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onTogglePin(resource.id, resource.isPinned);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{resource.isPinned ? 'Unpin' : 'Pin to top'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(resource);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit details</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleArchive(resource.id, resource.isArchived);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1A1E2C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{resource.isArchived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <div className="border-t border-[#1E2230] my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(resource.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpen(resource.id, resource.url)}
          className="text-sm font-semibold text-slate-100 hover:text-violet-300 transition-colors line-clamp-1 cursor-pointer"
          title={resource.title}
        >
          {resource.title}
        </h3>

        {/* Description */}
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {resource.description || 'No description provided.'}
        </p>

        {/* GitHub Live Metadata Strip */}
        {resource.githubData && (
          <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-[#0B0D13] border border-[#1E2230] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="font-mono tabular-nums font-semibold text-slate-200">
                {resource.githubData.stars.toLocaleString()}
              </span>
            </div>
            {resource.githubData.language && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>{resource.githubData.language}</span>
              </div>
            )}
            {resource.githubData.forks !== undefined && (
              <div className="flex items-center gap-1">
                <GitFork className="w-3 h-3 text-slate-500" />
                <span className="font-mono tabular-nums">{resource.githubData.forks}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Tags & click count */}
      <div className="mt-4 pt-2.5 border-t border-[#1E2230] flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          {resource.tags && resource.tags.length > 0 ? (
            resource.tags.slice(0, 3).map((tag, idx) => (
              <React.Fragment key={tag}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span className="text-slate-400 truncate">#{tag}</span>
              </React.Fragment>
            ))
          ) : (
            <span className="text-slate-600">Untagged</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] tabular-nums text-slate-500">
          <span>{resource.clickCount} launches</span>
        </div>
      </div>
    </div>
  );
};
