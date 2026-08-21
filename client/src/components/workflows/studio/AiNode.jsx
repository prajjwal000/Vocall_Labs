import React from 'react';
import { Sparkles } from 'lucide-react';

export const AiNode = ({ data = {} }) => {
  return (
    <div className="p-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm space-y-1.5 min-w-[180px]">
      <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{data.label || 'AI Decision Node'}</span>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        {data.description || 'Automated AI routing condition'}
      </p>
    </div>
  );
};

export default AiNode;
