import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Settings, ArrowRight, Wand2, AlertCircle, CheckCircle2, Loader2, Lightbulb } from 'lucide-react';
import { useOrganization } from '../../hooks/useOrganization';
import { workflowService } from '../../services/workflowService';

export const BuildWithAiView = ({ onApplyWorkflow, onClose, onSwitchToStudio }) => {
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const aiConfig = activeOrganization?.settings?.aiConfig;
  const isConfigured = Boolean(aiConfig?.isConfigured || (aiConfig?.apiKey && aiConfig?.apiKey.trim()));

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState(null);

  const samplePrompts = [
    {
      title: 'Travel & Expense Reimbursement',
      prompt: 'Create an expense claim workflow for travel and meals with amount, date, receipt notes. Require Step 1 Manager review, and Step 2 Approver Role sign-off.',
    },
    {
      title: 'Annual Leave & PTO Request',
      prompt: 'Design a time-off request workflow with leave type, start date, end date, and reason. Step 1 is Department Manager approval.',
    },
    {
      title: 'IT Hardware Procurement',
      prompt: 'Create a developer laptop and equipment requisition process with item name, estimated cost, and required date. Multi-stage approval from Manager to Admin.',
    },
    {
      title: 'New Employee Onboarding',
      prompt: 'Provision a new hire with full name, job title, department, and start date. Approval routed to Manager and Workspace Admin.',
    },
  ];

  const handleGenerate = async (customPrompt) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) {
      setError('Please provide a prompt describing your workflow requirements.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const res = await workflowService.generateWithAi(textToUse.trim());
      if (res.success && res.data) {
        setGeneratedPreview(res.data);
      } else {
        setError('Failed to generate workflow schema. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToStudio = () => {
    if (!generatedPreview) return;
    onApplyWorkflow(generatedPreview);
    if (onSwitchToStudio) onSwitchToStudio();
  };

  const handleGoToSettings = () => {
    if (onClose) onClose();
    navigate('/app/settings/organization');
  };

  // 1. UNCONFIGURED STATE
  if (!isConfigured) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5 shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-3xl mx-auto shadow-xs">
            ✨
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              AI Not Configured
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              AI Workflow Generator Not Configured
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To synthesize automated multi-stage pipelines and dynamic form schemas from natural language prompts, configure your AI provider (Google Gemini or OpenAI) in Workspace Settings.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoToSettings}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Configure AI in Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. CONFIGURED STATE
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/60 flex flex-col justify-between max-w-4xl mx-auto w-full space-y-6">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200 dark:border-purple-900/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
              ✨
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Prompt-to-Workflow Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                  {aiConfig?.provider || 'Gemini'} Connected
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Describe your business process and requirements to auto-generate the complete form schema and approval stages.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoToSettings}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>AI Settings</span>
          </button>
        </div>

        {/* Prompt Input Box */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Workflow Description & Rules
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Design a travel reimbursement workflow with fields for expense title, amount ($), expense date, and receipt notes. Step 1 is Department Manager approval, and Step 2 is Finance Approver sign-off."
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/40 focus:outline-hidden"
          />

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              Only standard field types (`text`, `number`, `date`, `textarea`) will be created.
            </span>

            <button
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={() => handleGenerate()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Schema...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestion Prompts */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Prompt Templates & Suggestions:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {samplePrompts.map((s, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setPrompt(s.prompt);
                  handleGenerate(s.prompt);
                }}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 rounded-2xl transition-all cursor-pointer group shadow-2xs"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-between">
                  <span>{s.title}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {s.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Generated Preview Card */}
        {generatedPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-white dark:bg-slate-900 border-2 border-purple-500/40 rounded-3xl space-y-4 shadow-lg shadow-purple-500/5"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{generatedPreview.icon || '✨'}</span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{generatedPreview.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold capitalize">
                      {generatedPreview.category}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">{generatedPreview.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyToStudio}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply to Studio Canvas</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Trigger Fields */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Generated Form Fields ({generatedPreview.formSchema?.length || 0})
                </span>
                <div className="space-y-1">
                  {(generatedPreview.formSchema || []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </span>
                      <span className="text-[9px] font-mono uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {f.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval Stages */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Generated Approval Stages ({generatedPreview.steps?.length || 0})
                </span>
                <div className="space-y-1">
                  {(generatedPreview.steps || []).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Stage {s.stepNumber}: {s.name}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded capitalize">
                        {s.assigneeRoleKey}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BuildWithAiView;
