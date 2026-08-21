import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const FormCompatibilityWarning = ({ missingFields = [] }) => {
  if (!missingFields || missingFields.length === 0) return null;

  return (
    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold text-amber-800 dark:text-amber-300">
          ⚠️ Form Compatibility Warning
        </p>
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          The selected Form Version is missing fields referenced by workflow conditions. You must update the stage conditions or restore these fields before publishing:
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-amber-800 dark:text-amber-300 pt-1">
          {missingFields.map((m, idx) => (
            <li key={idx}>
              Field <span className="font-bold">"{m.missingField}"</span> used in Step {m.stepNumber} ({m.stepName})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FormCompatibilityWarning;
