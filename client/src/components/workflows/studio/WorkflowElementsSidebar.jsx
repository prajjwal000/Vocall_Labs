import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Layers, FileText, Sparkles, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { PREDEFINED_FORMS } from './predefinedForms';

export const WorkflowElementsSidebar = ({
  steps = [],
  formSchema = [],
  formTitle = 'Trigger Form',
  onAddStep,
  onSelectTrigger,
  onSelectStep,
  selectedType,
  selectedIndex,
  onOpenCreateCustomForm,
  onSelectPredefinedForm,
}) => {
  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 overflow-y-auto shrink-0">
      <div className="space-y-6">
        
        {/* 1. WORKFLOW ELEMENTS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4 h-4" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Workflow Elements
            </h3>
          </div>

          <div className="space-y-2">
            {/* Trigger Form Element */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSelectTrigger}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                selectedType === 'trigger'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
                📝
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formTitle || 'Trigger Form'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {formSchema.length} {formSchema.length === 1 ? 'Field' : 'Fields'} configured
                </div>
              </div>
            </motion.div>

            {/* Add Approval Stage Element */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddStep}
              className="p-3 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer flex items-center space-x-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  + Add Approval Stage
                </div>
                <div className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 truncate">
                  Sequential review stage {steps.length + 1}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 2. FORMS SECTION */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
              <FileText className="w-4 h-4" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Forms
              </h3>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
              Catalog
            </span>
          </div>

          {/* + Create Custom Form Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onOpenCreateCustomForm}
            className="w-full p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Form</span>
          </motion.button>

          {/* Predefined Forms Sub-section */}
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Predefined Forms
            </div>

            <div className="space-y-2">
              {PREDEFINED_FORMS.map((form) => (
                <div
                  key={form.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="text-base shrink-0">{form.icon}</span>
                    <div className="truncate flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {form.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {form.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {form.fields.length} fields
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectPredefinedForm(form)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Add to Workflow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PIPELINE HIERARCHY TREE */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sequential Route ({steps.length + 1} Nodes)
          </div>

          <div className="space-y-1 text-xs">
            <button
              type="button"
              onClick={onSelectTrigger}
              className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                selectedType === 'trigger'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xs">📋</span>
              <span className="truncate flex-1">{formTitle || 'Trigger Form'}</span>
            </button>

            {steps.map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStep(idx)}
                className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  selectedType === 'step' && selectedIndex === idx
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate flex-1">{step.name || `Stage ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mt-4">
        <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Info className="w-3 h-3 text-indigo-500" />
          <span>Real-time Forms</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          Selecting a predefined form attaches standard schemas directly into your workflow.
        </p>
      </div>
    </aside>
  );
};

export default WorkflowElementsSidebar;
