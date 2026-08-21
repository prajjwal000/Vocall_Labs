import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText, CheckCircle2, Cloud, AlertCircle } from 'lucide-react';
import { useOrganization } from '../../../hooks/useOrganization';
import { useNavigate } from 'react-router-dom';

export const CreateCustomFormModal = ({ isOpen, onClose, onSaveForm }) => {
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const storageConfig = activeOrganization?.settings?.storageConfig;
  const isStorageConfigured = Boolean(
    storageConfig?.isConfigured ||
    storageConfig?.provider === 'local' ||
    (storageConfig?.provider === 's3' && storageConfig?.s3?.bucket) ||
    (storageConfig?.provider === 'azure' && storageConfig?.azure?.containerName)
  );

  const [formName, setFormName] = useState('Custom Request Form');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([
    { fieldKey: 'request_title', label: 'Request Title', type: 'text', required: true },
    { fieldKey: 'amount', label: 'Amount', type: 'number', required: true },
    { fieldKey: 'due_date', label: 'Due Date', type: 'date', required: false },
  ]);

  if (!isOpen) return null;

  const handleAddField = () => {
    const key = `field_${Date.now()}`;
    setFields([
      ...fields,
      {
        fieldKey: key,
        label: `Field ${fields.length + 1}`,
        type: 'text',
        required: true,
      },
    ]);
  };

  const handleRemoveField = (index) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, prop, value) => {
    const updated = [...fields];
    updated[index][prop] = value;
    if (prop === 'label') {
      updated[index].fieldKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    setFields(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onSaveForm({
      name: formName.trim(),
      description: description.trim(),
      fields,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              📝
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Custom Form
              </h3>
              <p className="text-[11px] text-slate-400">
                Design custom fields to capture requester input.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Form Name & Description */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Form Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Expense Request"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this form..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Form Fields ({fields.length})
              </label>
              <button
                type="button"
                onClick={handleAddField}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {fields.map((field, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">FIELD {idx + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        value={field.label}
                        onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                        placeholder="Field Label"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                      >
                        <option value="text">Text Input</option>
                        <option value="number">Numeric</option>
                        <option value="date">Date</option>
                        <option value="textarea">Long Text</option>
                        <option value="file" disabled={!isStorageConfigured}>
                          {isStorageConfigured ? '📁 File Upload / Attachment' : '📁 File Upload (Requires Cloud Storage in Settings)'}
                        </option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center space-x-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                      className="rounded text-indigo-600 h-3.5 w-3.5 border-slate-300 dark:border-slate-700"
                    />
                    <span>Required Field</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Save & Add to Workflow
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateCustomFormModal;
