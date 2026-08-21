import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sliders, CheckCircle2 } from 'lucide-react';

export const TriggerFormNode = ({
  formTitle = 'Trigger Form',
  formSchema = [],
  isSelected,
  onClick,
  onConfigure,
}) => {
  const requiredCount = formSchema.filter((f) => f.required).length;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'number':
        return 'Numeric';
      case 'date':
        return 'Date';
      case 'textarea':
        return 'Long Text';
      case 'select':
        return 'Dropdown';
      case 'file':
      case 'file_upload':
        return '📁 File Upload';
      default:
        return 'Text Input';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-72 bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all cursor-pointer shadow-md overflow-hidden text-left ${
        isSelected
          ? 'border-indigo-600 dark:border-indigo-500 ring-4 ring-indigo-500/20 shadow-indigo-500/10'
          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
      }`}
    >
      {/* Node Header */}
      <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            📋
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate max-w-[140px]">
              {formTitle}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              Form Trigger
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onConfigure) onConfigure();
            else if (onClick) onClick();
          }}
          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 text-[10px] font-bold transition-colors cursor-pointer"
        >
          Configure
        </button>
      </div>

      {/* Node Body / Fields preview */}
      <div className="p-3.5 space-y-2">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Form Fields</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
            {formSchema.length} {formSchema.length === 1 ? 'field' : 'fields'}
          </span>
        </div>

        {formSchema.length === 0 ? (
          <div className="py-2 text-center text-xs text-slate-400 italic">
            No fields defined. Click Configure to add fields.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-hidden">
            {formSchema.slice(0, 4).map((field, idx) => (
              <div
                key={field.fieldKey || idx}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80"
              >
                <span className="truncate font-medium text-slate-800 dark:text-slate-200 max-w-[140px]">
                  {field.label || `Field ${idx + 1}`}
                  {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-1">
                  {getTypeLabel(field.type)}
                </span>
              </div>
            ))}
            {formSchema.length > 4 && (
              <div className="text-[10px] text-slate-400 text-center font-semibold pt-0.5">
                +{formSchema.length - 4} more fields
              </div>
            )}
          </div>
        )}
      </div>

      {/* Node Footer */}
      <div className="px-3.5 py-2 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
        <span>{formSchema.length} fields configured</span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {requiredCount} Required
        </span>
      </div>
    </motion.div>
  );
};

export default TriggerFormNode;
