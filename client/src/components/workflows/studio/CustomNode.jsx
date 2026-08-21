import React from 'react';
import { GitCommit } from 'lucide-react';

export const CustomNode = ({ data = {} }) => {
  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1.5 min-w-[180px]">
      <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
        <GitCommit className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{data.label || 'Workflow Step'}</span>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        {data.description || 'Custom workflow stage'}
      </p>
    </div>
  );
};

export default CustomNode;
