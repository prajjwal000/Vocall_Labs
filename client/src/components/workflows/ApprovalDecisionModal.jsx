import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, X, MessageSquare, AlertCircle, Paperclip, ExternalLink } from 'lucide-react';
import { useProcessApproval } from '../../hooks/useWorkflows';
import { triggerConfetti } from '../../utils/confetti';

export const ApprovalDecisionModal = ({ approval, isOpen, onClose, onSuccess }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const processApproval = useProcessApproval();

  if (!isOpen || !approval) return null;

  const request = approval.requestId || {};
  const requester = request.requesterId || {};

  const handleDecision = async (decision) => {
    setError('');
    try {
      await processApproval.mutateAsync({
        approvalId: approval._id,
        decision,
        comment,
      });
      if (decision === 'approved') {
        triggerConfetti({ count: 80 });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process decision');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 uppercase">
                Step {approval.stepNumber}: {approval.stepName}
              </span>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                {request.requestCode}
              </span>
              {approval.timeRemainingText && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                  approval.slaStatus === 'breached'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
                    : approval.slaStatus === 'approaching_breach'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200'
                }`}>
                  ⏱️ {approval.timeRemainingText}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Review: {request.title || 'Workflow Request'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requester Profile */}
          <div className="flex items-center space-x-3 p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
              {requester.firstName?.[0] || 'U'}{requester.lastName?.[0] || 'U'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {requester.firstName} {requester.lastName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{requester.email}</div>
            </div>
          </div>

          {/* Form Values */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Submitted Form Details:</div>
            <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-2 text-xs">
              {Object.entries(request.formData || {}).map(([key, val]) => {
                const isFile = typeof val === 'object' && val !== null && val.url;
                return (
                  <div key={key} className="pt-2 first:pt-0 flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 capitalize">{key}:</span>
                    {isFile ? (
                      <a
                        href={val.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{val.fileName || 'View Attachment'}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : (
                      <span className="font-bold text-slate-900 dark:text-white text-right">{String(val)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision Comment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>Reviewer Notes / Justification:</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Approved, budget verified..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-2xs font-medium"
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={processApproval.isPending}
              onClick={() => handleDecision('rejected')}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Request</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={processApproval.isPending}
              onClick={() => handleDecision('approved')}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Step</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApprovalDecisionModal;
