import React from 'react';
import { motion } from 'framer-motion';

export const KpiCard = ({ title, value, badge, icon, subtext, color = 'indigo' }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/50',
      glow: 'group-hover:shadow-indigo-500/10',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
      glow: 'group-hover:shadow-amber-500/10',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
      glow: 'group-hover:shadow-blue-500/10',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group ${scheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center text-lg font-bold border ${scheme.border} shadow-2xs group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value !== undefined ? value : '0'}
        </div>
        {badge && (
          <div className="flex items-center space-x-2 pt-1">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {badge}
            </span>
          </div>
        )}
      </div>

      {subtext && (
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
          {subtext}
        </div>
      )}
    </motion.div>
  );
};

export default KpiCard;
