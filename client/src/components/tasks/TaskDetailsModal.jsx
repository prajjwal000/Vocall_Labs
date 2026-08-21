import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  UserCheck,
  Flag,
  Calendar,
  Clock,
  ArrowRight,
  GitCommit,
  Ban,
  User,
  Shield,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useTaskDetails, useCancelTask } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import DelegateTaskModal from './DelegateTaskModal';
import CompleteTaskModal from './CompleteTaskModal';

export const TaskDetailsModal = ({ taskId, isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { isOwner, role } = usePermissions();
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, refetch } = useTaskDetails(taskId);
  const cancelTask = useCancelTask();

  const getId = (entity) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return (entity._id || entity.id || '').toString();
  };

  if (!isOpen || !taskId) return null;

  const task = data?.data || data?.task || {};
  const activities = data?.activities || [];

  const currentUserId = getId(user);
  const isCurrentOwner = getId(task.currentAssignee) === currentUserId;
  const isAssigner = getId(task.assignedBy) === currentUserId;
  const isAdminOrOwner = isOwner || role === 'owner' || role === 'admin';

  const canComplete = (isCurrentOwner || isAdminOrOwner) && task.status !== 'completed' && task.status !== 'cancelled';
  const canDelegate = (isCurrentOwner || isAdminOrOwner) && task.status !== 'completed' && task.status !== 'cancelled';
  const canCancel = (isAssigner || isAdminOrOwner) && task.status !== 'completed' && task.status !== 'cancelled';

  const handleCancelTask = async () => {
    try {
      await cancelTask.mutateAsync({
        taskId: getId(task),
        reason: cancelReason.trim() || 'Cancelled by manager',
      });
      setShowCancelPrompt(false);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel task');
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
      case 'high':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
      case 'low':
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'medium':
      default:
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
      case 'cancelled':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      case 'in_progress':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900/50';
      case 'delegated':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
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
          className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
            <div className="space-y-1.5 flex-1 pr-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${getPriorityBadge(task.priority)}`}>
                  {task.priority} Priority
                </span>
                {task.dueDate && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {task.title || 'Task Details'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading task details...
            </div>
          ) : (
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Ownership & Assignees Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
                {/* Assigner */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Assigned By
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {task.assignedBy?.firstName} {task.assignedBy?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{task.assignedBy?.email}</div>
                </div>

                {/* Original Assignee */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Original Assignee
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {task.originalAssignee?.firstName} {task.originalAssignee?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{task.originalAssignee?.email}</div>
                </div>

                {/* Current Owner */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>Current Owner</span>
                  </div>
                  <div className="font-bold text-indigo-700 dark:text-indigo-300 truncate">
                    {task.currentAssignee?.firstName} {task.currentAssignee?.lastName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{task.currentAssignee?.email}</div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Instructions & Description
                  </div>
                  <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>
              )}

              {/* Delegation History Chain */}
              {task.delegationHistory && task.delegationHistory.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                      <UserCheck className="w-4 h-4" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Delegation Chain ({task.delegationHistory.length} Hops)
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Level {task.delegationDepth} of 10
                    </span>
                  </div>

                  <div className="space-y-2">
                    {task.delegationHistory.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-2xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                            <span>{d.from?.firstName} {d.from?.lastName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-purple-700 dark:text-purple-300">{d.to?.firstName} {d.to?.lastName}</span>
                          </div>
                          {d.reason && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                              "{d.reason}"
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(d.delegatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Activity & Audit Timeline
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/50">
                  {activities.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No activity logged.</div>
                  ) : (
                    activities.map((act) => (
                      <div key={act._id || act.id} className="p-3.5 flex items-start justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              act.type === 'completed'
                                ? 'bg-emerald-500'
                                : act.type === 'delegated'
                                ? 'bg-purple-500'
                                : act.type === 'cancelled'
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`} />
                            <span>{act.details}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            By {act.actorName} ({act.actorEmail})
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(act.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cancel Confirmation Prompt */}
              {showCancelPrompt && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-3 text-xs">
                  <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center space-x-2">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Confirm Task Cancellation</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Reason for cancelling..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs"
                  />
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setShowCancelPrompt(false)}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCancelTask}
                      disabled={cancelTask.isPending}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                    >
                      {cancelTask.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
            <div>
              {canCancel && !showCancelPrompt && (
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel Task
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              {canDelegate && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowDelegateModal(true)}
                  className="px-4 py-2 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Delegate →</span>
                </motion.button>
              )}

              {canComplete && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowCompleteModal(true)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Task ✓</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sub-Modals */}
      {showDelegateModal && (
        <DelegateTaskModal
          task={task}
          isOpen={showDelegateModal}
          onClose={() => setShowDelegateModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {showCompleteModal && (
        <CompleteTaskModal
          task={task}
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default TaskDetailsModal;
