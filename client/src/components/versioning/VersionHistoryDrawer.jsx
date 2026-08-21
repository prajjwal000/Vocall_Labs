import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  GitBranch,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  GitCompare,
  Plus,
  Trash2,
  Eye,
  Edit3,
  User,
} from 'lucide-react';

export const VersionHistoryDrawer = ({
  isOpen,
  onClose,
  title,
  entityType = 'workflow',
  currentVersionId,
  versions = [],
  isLoading = false,
  onSelectVersion,
  onForkDraft,
  onDiscardDraft,
  onOpenCompare,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Version History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {title || (entityType === 'form' ? 'Form Definition' : 'Workflow Definition')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body / Version Timeline */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
                <p className="text-xs">Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <GitBranch className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No version history</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {versions.map((ver) => {
                  const verId = ver.id || ver._id;
                  const isCurrent = currentVersionId && (currentVersionId === verId || currentVersionId === ver._id);
                  const isPublished = ver.status === 'published';
                  const isDraft = ver.status === 'draft';
                  const author = ver.publishedBy || ver.createdBy;
                  const authorName = author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email : 'Author';

                  return (
                    <div key={verId} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[27px] top-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform ${
                          isPublished
                            ? 'bg-emerald-500 border-white dark:border-slate-900 shadow-sm'
                            : isDraft
                            ? 'bg-amber-500 border-white dark:border-slate-900 shadow-sm animate-pulse'
                            : 'bg-slate-300 dark:bg-slate-700 border-white dark:border-slate-900'
                        }`}
                      />

                      {/* Version Card */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700/60 shadow-sm ring-1 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              v{ver.version}
                            </span>
                            {getStatusBadge(ver.status)}
                            {isCurrent && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                Active View
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description / Change summary */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                          {ver.changeSummary || (isDraft ? 'Work in progress' : 'Version snapshot')}
                        </p>

                        {/* Author & Timestamp */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            {authorName}
                          </span>
                          <span>{formatDate(ver.publishedAt || ver.updatedAt || ver.createdAt)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-2">
                          {isDraft ? (
                            <>
                              <button
                                onClick={() => onSelectVersion && onSelectVersion(ver)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Continue Editing
                              </button>
                              {onDiscardDraft && (
                                <button
                                  onClick={() => onDiscardDraft(ver)}
                                  title="Discard this draft"
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onSelectVersion && onSelectVersion(ver)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View (Read Only)
                              </button>

                              {onForkDraft && (
                                <button
                                  onClick={() => onForkDraft(ver)}
                                  title="Create a new draft version starting from this snapshot"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition border border-indigo-200/60 dark:border-indigo-800/60"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  New Version From This
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            {onOpenCompare && versions.length >= 2 && (
              <button
                onClick={onOpenCompare}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition"
              >
                <GitCompare className="w-4 h-4 text-indigo-500" />
                Compare Versions (Diff)
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VersionHistoryDrawer;
