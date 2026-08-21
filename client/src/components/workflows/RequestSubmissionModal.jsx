import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Send, AlertCircle, UploadCloud, FileText, CheckCircle2, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { useSubmitWorkflow } from '../../hooks/useWorkflows';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { storageService } from '../../services/storageService';
import { triggerConfetti } from '../../utils/confetti';

export const RequestSubmissionModal = ({ workflow, isOpen, onClose, onSuccess }) => {
  const { activeOrganization } = useWorkspaceStore();
  const [formData, setFormData] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [error, setError] = useState('');
  const submitWorkflow = useSubmitWorkflow();

  useEffect(() => {
    if (!isOpen || !workflow?.formSchema) {
      setFormData({});
      return;
    }
    const defaults = {};
    for (const field of workflow.formSchema) {
      if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
        defaults[field.fieldKey] = field.defaultValue;
      }
    }
    setFormData(defaults);
  }, [isOpen, workflow]);

  if (!isOpen || !workflow) return null;

  const handleChange = (fieldKey, value) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleFileUpload = async (fieldKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFields((prev) => ({ ...prev, [fieldKey]: true }));
    setError('');

    try {
      const res = await storageService.uploadFile(file, activeOrganization?.id);
      if (res.success && res.data) {
        handleChange(fieldKey, res.data);
      } else {
        setError('Failed to upload file. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleRemoveFile = (fieldKey) => {
    setFormData((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    for (const field of workflow.formSchema || []) {
      if (field.required && !formData[field.fieldKey]) {
        setError(`Please fill in "${field.label}"`);
        return;
      }
    }

    try {
      await submitWorkflow.mutateAsync({
        workflowId: workflow._id,
        formData,
      });
      triggerConfetti({ count: 70 });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex items-center justify-center text-xl shadow-2xs">
              {workflow.icon || '📝'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Trigger: {workflow.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete form details to initiate the approval pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {workflow.formSchema?.map((field) => (
              <div key={field.fieldKey} className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder || ''}
                    value={formData[field.fieldKey] || ''}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-2xs font-medium"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    step="any"
                    required={field.required}
                    placeholder={field.placeholder || '0.00'}
                    value={formData[field.fieldKey] || ''}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-2xs font-medium"
                  />
                )}

                {field.type === 'date' && (
                  <input
                    type="date"
                    required={field.required}
                    value={formData[field.fieldKey] || ''}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-2xs font-medium"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    required={field.required}
                    value={formData[field.fieldKey] || field.defaultValue || ''}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-2xs font-medium"
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    required={field.required}
                    placeholder={field.placeholder || ''}
                    value={formData[field.fieldKey] || ''}
                    onChange={(e) => handleChange(field.fieldKey, e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-2xs font-medium"
                  />
                )}

                {(field.type === 'file' || field.type === 'file_upload') && (
                  <div>
                    {formData[field.fieldKey] ? (
                      <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                              {formData[field.fieldKey].fileName || 'Uploaded Attachment'}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {formData[field.fieldKey].fileSize
                                ? `${(formData[field.fieldKey].fileSize / 1024).toFixed(1)} KB`
                                : 'Cloud File'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(field.fieldKey)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 bg-slate-50/60 dark:bg-slate-950/40 cursor-pointer transition-colors group">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(field.fieldKey, e)}
                        />
                        {uploadingFields[field.fieldKey] ? (
                          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading to Workspace Storage...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                              <UploadCloud className="w-4 h-4" />
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                Choose file or drag here
                              </span>
                              <span className="text-[10px] text-slate-400">
                                PDF, DOCX, PNG, JPG (up to 25MB)
                              </span>
                            </div>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Workflow pipeline summary */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Approval Steps Required:</div>
            <div className="space-y-1.5">
              {workflow.steps?.map((step, idx) => (
                <div key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-semibold">{step.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    ({step.assigneeRoleKey || step.assigneeType})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitWorkflow.isPending}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitWorkflow.isPending ? 'Submitting...' : 'Submit for Approval'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
};

export default RequestSubmissionModal;
