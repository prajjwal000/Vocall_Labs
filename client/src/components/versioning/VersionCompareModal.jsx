import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GitCompare,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formService } from '../../services/formService';
import { workflowService } from '../../services/workflowService';

export const VersionCompareModal = ({
  isOpen,
  onClose,
  entityType = 'workflow',
  entityId,
  versions = [],
}) => {
  if (!isOpen) return null;

  const [baseVersionId, setBaseVersionId] = useState(
    versions.length >= 2 ? versions[1].id || versions[1]._id : versions[0]?.id || versions[0]?._id
  );
  const [targetVersionId, setTargetVersionId] = useState(
    versions.length >= 1 ? versions[0].id || versions[0]._id : ''
  );
  const [diffData, setDiffData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!baseVersionId || !targetVersionId || baseVersionId === targetVersionId) {
      setDiffData(null);
      return;
    }

    const fetchDiff = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (entityType === 'form') {
          const res = await formService.compareFormVersions(entityId, baseVersionId, targetVersionId);
          setDiffData(res);
        } else {
          const res = await workflowService.compareWorkflowVersions(entityId, baseVersionId, targetVersionId);
          setDiffData(res);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to compare versions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiff();
  }, [entityType, entityId, baseVersionId, targetVersionId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Version Comparison (Diff)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect structured additions, removals, and modifications between two release snapshots.
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

          {/* Version Selectors Bar */}
          <div className="p-4 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Base Version:
              </label>
              <select
                value={baseVersionId}
                onChange={(e) => setBaseVersionId(e.target.value)}
                className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {versions.map((v) => (
                  <option key={v.id || v._id} value={v.id || v._id}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Target Version:
              </label>
              <select
                value={targetVersionId}
                onChange={(e) => setTargetVersionId(e.target.value)}
                className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {versions.map((v) => (
                  <option key={v.id || v._id} value={v.id || v._id}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Diff Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {baseVersionId === targetVersionId ? (
              <div className="py-12 text-center text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select two different versions to compare changes.
                </p>
              </div>
            ) : isLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
                <p className="text-xs">Computing version diff...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 text-xs">
                {error}
              </div>
            ) : diffData ? (
              <div className="space-y-6">
                {!diffData.diff?.hasChanges && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
                    No structural differences detected between these two versions.
                  </div>
                )}

                {/* Form Diff Display */}
                {entityType === 'form' && (
                  <div className="space-y-4">
                    {/* Added Fields */}
                    {diffData.diff?.added?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5" />
                          Added Fields (+{diffData.diff.added.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {diffData.diff.added.map((f) => (
                            <div
                              key={f.fieldKey}
                              className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs"
                            >
                              <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                                + {f.label}
                              </div>
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                                {f.fieldKey} ({f.type}) {f.required ? '• Required' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Removed Fields */}
                    {diffData.diff?.removed?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MinusCircle className="w-3.5 h-3.5" />
                          Removed Fields (-{diffData.diff.removed.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {diffData.diff.removed.map((f) => (
                            <div
                              key={f.fieldKey}
                              className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 text-xs"
                            >
                              <div className="font-semibold text-rose-900 dark:text-rose-300">
                                - {f.label}
                              </div>
                              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-mono mt-0.5">
                                {f.fieldKey} ({f.type})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modified Fields */}
                    {diffData.diff?.modified?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Modified Fields ({diffData.diff.modified.length})
                        </h4>
                        <div className="space-y-2">
                          {diffData.diff.modified.map((m) => (
                            <div
                              key={m.fieldKey}
                              className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5"
                            >
                              <div className="font-semibold text-amber-900 dark:text-amber-300">
                                ~ {m.label} ({m.fieldKey})
                              </div>
                              <div className="space-y-1 pl-2">
                                {m.changes.map((c, idx) => (
                                  <div key={idx} className="text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                    <span className="font-mono text-slate-500 uppercase">{c.property}:</span>
                                    <span className="line-through text-slate-400">{String(c.from)}</span>
                                    <span>→</span>
                                    <span className="font-bold text-amber-700 dark:text-amber-400">{String(c.to)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow Diff Display */}
                {entityType === 'workflow' && (
                  <div className="space-y-4">
                    {/* Added Stages */}
                    {diffData.diff?.addedStages?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5" />
                          Added Stages (+{diffData.diff.addedStages.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {diffData.diff.addedStages.map((s) => (
                            <div
                              key={s.stepNumber}
                              className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs"
                            >
                              <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                                Stage {s.stepNumber}: + {s.name}
                              </div>
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                Type: {s.stepType} • Assignee: {s.assigneeRoleKey || s.assigneeType}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Removed Stages */}
                    {diffData.diff?.removedStages?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MinusCircle className="w-3.5 h-3.5" />
                          Removed Stages (-{diffData.diff.removedStages.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {diffData.diff.removedStages.map((s) => (
                            <div
                              key={s.stepNumber}
                              className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 text-xs"
                            >
                              <div className="font-semibold text-rose-900 dark:text-rose-300">
                                Stage {s.stepNumber}: - {s.name}
                              </div>
                              <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                                Type: {s.stepType} • Assignee: {s.assigneeRoleKey || s.assigneeType}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modified Stages */}
                    {diffData.diff?.modifiedStages?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Modified Stages ({diffData.diff.modifiedStages.length})
                        </h4>
                        <div className="space-y-2">
                          {diffData.diff.modifiedStages.map((m) => (
                            <div
                              key={m.stepNumber}
                              className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5"
                            >
                              <div className="font-semibold text-amber-900 dark:text-amber-300">
                                Stage {m.stepNumber}: ~ {m.name}
                              </div>
                              <div className="space-y-1 pl-2">
                                {m.changes.map((c, idx) => (
                                  <div key={idx} className="text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                    <span className="font-mono text-slate-500 uppercase">{c.property}:</span>
                                    <span className="line-through text-slate-400">{String(c.from)}</span>
                                    <span>→</span>
                                    <span className="font-bold text-amber-700 dark:text-amber-400">{String(c.to)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VersionCompareModal;
