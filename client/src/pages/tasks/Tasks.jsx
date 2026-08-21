import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  User,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  UserCheck,
  Flag,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useTasks, useTaskStats } from '../../hooks/useTasks';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import TaskDetailsModal from '../../components/tasks/TaskDetailsModal';
import CompleteTaskModal from '../../components/tasks/CompleteTaskModal';
import DelegateTaskModal from '../../components/tasks/DelegateTaskModal';

export const Tasks = () => {
  const { user } = useAuthStore();
  const { can, isOwner, role } = usePermissions();
  const [scope, setScope] = useState('my'); // 'my' | 'assigned_by_me' | 'delegated' | 'all'
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskForComplete, setTaskForComplete] = useState(null);
  const [taskForDelegate, setTaskForDelegate] = useState(null);

  const canReadTasks = can('tasks.read') || isOwner;
  const canCreateTasks = can('tasks.create') || isOwner;
  const canDelegateTasks = can('tasks.delegate') || isOwner;
  const canCompleteTasks = can('tasks.complete') || isOwner;

  const { data: tasksData, isLoading, refetch } = useTasks({
    scope,
    status: status || undefined,
    priority: priority || undefined,
    search: search || undefined,
  });

  const { data: statsData } = useTaskStats();

  const getId = (entity) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return (entity.id || entity._id || '').toString();
  };

  const tasks = tasksData?.data || [];
  const currentUserId = getId(user);
  const isManagerOrAdmin = isOwner || role === 'owner' || role === 'admin' || role === 'manager';

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

  if (!canReadTasks) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view organization tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Task Assignment & Delegation
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign operational duties, manage employee delegations with loop protection, and track execution lifecycles.
          </p>
        </div>

        {canCreateTasks && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Assign Task</span>
          </button>
        )}
      </div>

      {/* Metric Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            My Active Tasks
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {statsData ? (statsData.myTasks?.pending || 0) + (statsData.myTasks?.inProgress || 0) : '0'}
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
            {statsData?.myTasks?.completed || 0} completed
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Assigned by Me
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {statsData?.assignedTasks?.total || 0}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
            {statsData?.assignedTasks?.inProgress || 0} in progress
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Delegated Tasks
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {statsData?.totalDelegated || 0}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
            Chain preserved
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Completed
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {statsData ? (statsData.myTasks?.completed || 0) + (statsData.assignedTasks?.completed || 0) : '0'}
          </div>
          <div className="text-[10px] text-emerald-600/80 font-semibold mt-0.5">
            Audit recorded
          </div>
        </div>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <button
            onClick={() => setScope('my')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              scope === 'my'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Tasks ({statsData?.myTasks?.total ?? 0})
          </button>

          <button
            onClick={() => setScope('assigned_by_me')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              scope === 'assigned_by_me'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Assigned by Me ({statsData?.assignedTasks?.total ?? 0})
          </button>

          <button
            onClick={() => setScope('delegated')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              scope === 'delegated'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Delegated Tasks ({statsData?.totalDelegated ?? 0})
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={() => setScope('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                scope === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Workspace Tasks ({statsData?.allTasks?.total ?? 0})
            </button>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
          >
            <option value="">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Task List / Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400 animate-pulse">
          Loading tasks from database...
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="text-3xl">📭</div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Tasks Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {scope === 'my'
              ? 'You have no assigned tasks matching this filter.'
              : scope === 'assigned_by_me'
              ? 'You have not assigned any tasks yet.'
              : 'No task records matching the selected parameters.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-block mt-2"
          >
            + Assign First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((t) => {
            const taskId = getId(t);
            const isOwnerOfTask = getId(t.currentAssignee) === currentUserId;
            const isAssignerOfTask = getId(t.assignedBy) === currentUserId;
            const hasDelegations = t.delegationHistory && t.delegationHistory.length > 0;
            const isCompleted = t.status === 'completed';
            const isCancelled = t.status === 'cancelled';
            const canOperate = (isOwnerOfTask || isManagerOrAdmin) && !isCompleted && !isCancelled;

            return (
              <motion.div
                key={taskId}
                whileHover={{ y: -2 }}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isOwnerOfTask
                    ? 'border-indigo-300/80 dark:border-indigo-800/80 ring-1 ring-indigo-500/10'
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {/* Top Row: Status & Priority */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                      {isOwnerOfTask && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50">
                          Assigned to You
                        </span>
                      )}
                      {isAssignerOfTask && !isOwnerOfTask && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                          Assigned by You
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>

                  {/* Task Title */}
                  <h3
                    onClick={() => setSelectedTaskId(taskId)}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2"
                  >
                    {t.title}
                  </h3>

                  {/* Task Description snippet */}
                  {t.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Meta details */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  {/* Assignees breakdown */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Assigned by:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {t.assignedBy?.firstName} {t.assignedBy?.lastName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Current Owner:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {t.currentAssignee?.firstName} {t.currentAssignee?.lastName}
                      </span>
                    </div>

                    {getId(t.originalAssignee) !== getId(t.currentAssignee) && (
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>Originally:</span>
                        <span>{t.originalAssignee?.firstName} {t.originalAssignee?.lastName}</span>
                      </div>
                    )}
                  </div>

                  {/* Delegation Hop tag & Due date */}
                  <div className="flex items-center justify-between pt-1">
                    {hasDelegations ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                        ⚡ Delegated ({t.delegationHistory.length}x)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Direct Assignment</span>
                    )}

                    {t.dueDate && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedTaskId(taskId)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Details
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {/* Delegate button */}
                    {canOperate && canDelegateTasks && (
                      <button
                        onClick={() => setTaskForDelegate(t)}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Delegate →
                      </button>
                    )}

                    {/* Complete button */}
                    {canOperate && canCompleteTasks && (
                      <button
                        onClick={() => setTaskForComplete(t)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Complete ✓
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Done
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          isOpen={Boolean(selectedTaskId)}
          onClose={() => {
            setSelectedTaskId(null);
            refetch();
          }}
        />
      )}

      {/* Complete Task Modal */}
      {taskForComplete && (
        <CompleteTaskModal
          task={taskForComplete}
          isOpen={Boolean(taskForComplete)}
          onClose={() => setTaskForComplete(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Delegate Task Modal */}
      {taskForDelegate && (
        <DelegateTaskModal
          task={taskForDelegate}
          isOpen={Boolean(taskForDelegate)}
          onClose={() => setTaskForDelegate(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default Tasks;
