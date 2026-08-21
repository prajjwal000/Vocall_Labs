import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Settings, Layers } from 'lucide-react';

export const WorkflowCard = ({ workflow, onTrigger, onEdit, canManage, canTrigger = true }) => {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'expense':
        return { label: 'Expense & Finance', bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' };
      case 'leave':
        return { label: 'Time Off & HR', bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50' };
      case 'procurement':
        return { label: 'Hardware & IT', bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50' };
      default:
        return { label: 'General Process', bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const badge = getCategoryBadge(workflow.category);
  const stepsCount = workflow.steps?.length || 1;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-xl shadow-2xs group-hover:scale-105 transition-transform">
              {workflow.icon || '⚡'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {workflow.name}
              </h3>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
              v{workflow.publishedVersionId?.version || workflow.currentVersionId?.version || workflow.latestVersionNumber || 1}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
              {stepsCount} {stepsCount === 1 ? 'Step' : 'Stages'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
          {workflow.description || 'Automated multi-stage approval process.'}
        </p>

        {/* Steps Preview Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Approval Routing Pipeline
          </div>
          <div className="flex items-center space-x-1.5 overflow-hidden">
            {workflow.steps?.map((step, idx) => (
              <React.Fragment key={step._id || idx}>
                <div className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                  {idx + 1}. {step.name}
                </div>
                {idx < workflow.steps.length - 1 && (
                  <span className="text-slate-300 dark:text-slate-600 text-xs font-bold">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
        {canManage ? (
          <button
            onClick={() => onEdit(workflow)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-500" />
            <span>Edit Process & Form</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">
            {canTrigger ? 'Ready to fill / submit' : 'View only'}
          </span>
        )}

        {canTrigger && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTrigger(workflow)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>Fill / Submit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default WorkflowCard;
