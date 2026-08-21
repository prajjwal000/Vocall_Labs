import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck, AlertCircle, ArrowRight, MessageSquare, ShieldAlert } from 'lucide-react';
import { useDelegateTask, useEligibleAssignees } from '../../hooks/useTasks';

export const DelegateTaskModal = ({ task, isOpen, onClose, onSuccess }) => {
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const taskId = task?._id || task?.id;
  const { data: eligibleUsers = [], isLoading: isLoadingUsers } = useEligibleAssignees(taskId);
  const delegateTask = useDelegateTask();

  if (!isOpen || !task) return null;

  const currentOwner = task.currentAssignee || {};
  const maxDepth = 10;
  const currentDepth = task.delegationDepth || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!toUserId) {
      setError('Please select a team member to delegate this task to.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a brief justification / reason for delegating.');
      return;
    }

    try {
      const taskId = task._id || task.id;
      await delegateTask.mutateAsync({
        taskId,
        toUserId,
        reason: reason.trim(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delegate task');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Delegate Task
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transfer task responsibility to another eligible colleague.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Task Info Pill */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current Task
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {task.title}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Current Owner:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {currentOwner.firstName} {currentOwner.lastName}
                </span>
                <span>•</span>
                <span className="font-mono text-[10px]">Depth {currentDepth}/{maxDepth}</span>
              </div>
            </div>

            {/* Delegate To Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                <span>Delegate To <span className="text-rose-500">*</span></span>
              </label>
              <select
                required
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
              >
                <option value="">-- Select Eligible Employee --</option>
                {isLoadingUsers ? (
                  <option disabled value="">Loading eligible colleagues...</option>
                ) : eligibleUsers && eligibleUsers.length > 0 ? (
                  eligibleUsers.map((member) => {
                    const uId = member.userId?._id || member.userId?.id || member.userId;
                    return (
                      <option key={uId} value={uId}>
                        {member.firstName} {member.lastName} ({member.email})
                      </option>
                    );
                  })
                ) : (
                  <option disabled value="">No eligible members available (cycles excluded)</option>
                )}
              </select>
              <p className="text-[10px] text-slate-400">
                Nexus automatically filters out users already in this delegation chain to prevent cycles.
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>Reason for Delegation <span className="text-rose-500">*</span></span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I am out of office today / transferring technical review to domain specialist..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-medium"
              />
            </div>

            {/* Guardrail Note */}
            <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                Once delegated, the new owner will take responsibility to complete or delegate the task. Your action will be permanently recorded in the audit trail.
              </span>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={delegateTask.isPending}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {delegateTask.isPending ? 'Delegating...' : 'Delegate Task →'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DelegateTaskModal;
