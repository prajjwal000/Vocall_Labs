import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Users } from 'lucide-react';

export const PlanUsage = ({ usage, organization }) => {
  const membersUsed = usage?.membersUsed || 1;
  const membersLimit = usage?.membersLimit || 50;
  const memberPercentage = Math.min(Math.round((membersUsed / membersLimit) * 100), 100);

  const workflowsUsed = usage?.workflowsUsed || 0;
  const workflowsLimit = usage?.workflowsLimit || 20;
  const workflowPercentage = Math.min(Math.round((workflowsUsed / workflowsLimit) * 100), 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Workspace Plan & Limits</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tier: <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{organization?.plan || 'Growth Tier'}</span>
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>Active</span>
        </span>
      </div>

      <div className="space-y-4">
        {/* Members Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Active Team Members</span>
            </span>
            <span className="text-slate-900 dark:text-white font-mono text-[11px]">
              {membersUsed} / {membersLimit}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${memberPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Workflows Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              <span>Automated Workflows</span>
            </span>
            <span className="text-slate-900 dark:text-white font-mono text-[11px]">
              {workflowsUsed} / {workflowsLimit}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${workflowPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Need higher quotas?</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center space-x-1">
          <span>Explore Tier Upgrades</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};

export default PlanUsage;
