import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Trash2, ArrowDown, UserCheck } from 'lucide-react';

export const ApprovalStageNode = ({
  step,
  index,
  totalSteps,
  isSelected,
  onClick,
  onRemove,
}) => {
  const getAssigneeLabel = (key) => {
    switch (key) {
      case 'manager':
        return { label: 'Manager Role', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900/50' };
      case 'approver':
        return { label: 'Approver Role', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' };
      case 'owner':
        return { label: 'Organization Owner', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' };
      case 'admin':
      default:
        return { label: 'Workspace Admin', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900/50' };
    }
  };

  const assignee = getAssigneeLabel(step.assigneeRoleKey);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-72 bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all cursor-pointer shadow-md overflow-hidden text-left relative ${
        isSelected
          ? 'border-indigo-600 dark:border-indigo-500 ring-4 ring-indigo-500/20 shadow-indigo-500/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
      }`}
    >
      {/* Node Header */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {index + 1}
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate max-w-[140px]">
              {step.name || `Stage ${index + 1}`}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Sequential Review
            </span>
          </div>
        </div>

        {totalSteps > 1 && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer"
            title="Delete this stage"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Node Body */}
      <div className="p-3.5 space-y-2.5">
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Reviewer Authority & SLA
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${assignee.badge}`}>
              🛡️ {assignee.label}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              ⏱️ {step.slaHours || 24}h SLA
            </span>
          </div>
        </div>

        {/* Condition Rule Tag if present */}
        {step.conditionLogic && step.conditionLogic !== 'always' && step.conditions?.[0]?.field && (
          <div className="p-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1">
            <span>⚡ Rule:</span>
            <span className="font-mono font-bold truncate">
              {step.conditions[0].field} {step.conditions[0].operator} {step.conditions[0].value}
            </span>
          </div>
        )}
      </div>

      {/* Node Footer */}
      <div className="px-3.5 py-2 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <span>Approval Stage {index + 1} of {totalSteps}</span>
        <span className="font-mono text-slate-400">
          {step.conditionLogic && step.conditionLogic !== 'always' ? 'Conditional' : 'Required'}
        </span>
      </div>
    </motion.div>
  );
};

export default ApprovalStageNode;
