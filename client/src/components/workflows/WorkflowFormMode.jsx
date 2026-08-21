import React from 'react';
import { Plus, Trash2, Shield, FileText, Cloud, AlertCircle } from 'lucide-react';
import { useOrganization } from '../../hooks/useOrganization';
import { Link } from 'react-router-dom';

export const WorkflowFormMode = ({
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
  icon,
  setIcon,
  steps,
  setSteps,
  formSchema,
  setFormSchema,
}) => {
  const { activeOrganization } = useOrganization();
  const storageConfig = activeOrganization?.settings?.storageConfig;
  const isStorageConfigured = Boolean(
    storageConfig?.isConfigured ||
    storageConfig?.provider === 'local' ||
    (storageConfig?.provider === 's3' && storageConfig?.s3?.bucket) ||
    (storageConfig?.provider === 'azure' && storageConfig?.azure?.containerName)
  );
  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        name: `Stage ${steps.length + 1}`,
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'admin',
      },
    ]);
  };

  const handleRemoveStep = (index) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(updated);
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleAddField = () => {
    const key = `field_${Date.now()}`;
    setFormSchema([
      ...formSchema,
      { fieldKey: key, label: `Custom Field ${formSchema.length + 1}`, type: 'text', required: false, placeholder: '' },
    ]);
  };

  const handleRemoveField = (index) => {
    setFormSchema(formSchema.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...formSchema];
    updated[index][field] = value;
    if (field === 'label') {
      updated[index].fieldKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    setFormSchema(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full bg-white dark:bg-slate-900">
      {/* 1. Basic Metadata */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Workflow Details & Classification
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-base bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white"
            />
          </div>
          <div className="col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Workflow Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Contract Sign-Off Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white font-medium"
            >
              <option value="general">General</option>
              <option value="expense">Expense & Finance</option>
              <option value="leave">Time Off & HR</option>
              <option value="procurement">Hardware & IT</option>
              <option value="it_support">Internal Operations</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
            <input
              type="text"
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Sequential Approval Stages */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Sequential Approval Stages</h3>
            <p className="text-[11px] text-slate-400">Order of reviews required before resolution</p>
          </div>
          <button
            type="button"
            onClick={handleAddStep}
            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stage</span>
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const hasCondition = step.conditionLogic !== 'always' && step.conditions && step.conditions.length > 0;
            const primaryCondition = step.conditions?.[0] || { field: '', operator: 'gt', value: '' };

            return (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
              >
                {/* Header Row */}
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    required
                    value={step.name}
                    onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                    placeholder="Stage Title"
                    className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                  <select
                    value={step.assigneeRoleKey || 'admin'}
                    onChange={(e) => handleStepChange(idx, 'assigneeRoleKey', e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shrink-0"
                  >
                    <option value="manager">Manager Role</option>
                    <option value="approver">Approver Role</option>
                    <option value="admin">Workspace Admin</option>
                    <option value="owner">Organization Owner</option>
                  </select>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* SLA & Condition Settings Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                  {/* SLA Target */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] shrink-0">
                      ⏱️ Stage SLA:
                    </span>
                    <select
                      value={step.slaHours ?? 24}
                      onChange={(e) => handleStepChange(idx, 'slaHours', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    >
                      <option value={4}>4 Hours (Fast/Urgent)</option>
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours (1 Day - Standard)</option>
                      <option value={48}>48 Hours (2 Days)</option>
                      <option value={72}>72 Hours (3 Days)</option>
                      <option value={120}>120 Hours (5 Days)</option>
                      <option value={168}>168 Hours (7 Days)</option>
                    </select>
                  </div>

                  {/* Condition Toggle */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] shrink-0">
                      ⚡ Routing:
                    </span>
                    <select
                      value={step.conditionLogic || 'always'}
                      onChange={(e) => {
                        const newLogic = e.target.value;
                        const updated = [...steps];
                        updated[idx].conditionLogic = newLogic;
                        if (newLogic !== 'always' && (!updated[idx].conditions || updated[idx].conditions.length === 0)) {
                          const firstField = formSchema[0]?.fieldKey || 'amount';
                          updated[idx].conditions = [{ field: firstField, operator: 'gt', value: '1000' }];
                        }
                        setSteps(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    >
                      <option value="always">Always Execute Stage</option>
                      <option value="all">Conditional Rule (All Match)</option>
                      <option value="any">Conditional Rule (Any Match)</option>
                    </select>
                  </div>
                </div>

                {/* Expandable Condition Rule Builder */}
                {step.conditionLogic && step.conditionLogic !== 'always' && (
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-2 text-xs">
                    <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                      <span>⚡ Execution Condition (Skip if false):</span>
                      <span className="text-[10px] text-slate-400 font-normal">e.g. Leave Days &gt; 3 or Amount &gt; 5000</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Field */}
                      <div>
                        <select
                          value={primaryCondition.field || (formSchema[0]?.fieldKey || '')}
                          onChange={(e) => {
                            const updated = [...steps];
                            if (!updated[idx].conditions) updated[idx].conditions = [{}];
                            updated[idx].conditions[0].field = e.target.value;
                            setSteps(updated);
                          }}
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        >
                          {formSchema.length === 0 ? (
                            <option value="">(Add trigger fields first)</option>
                          ) : (
                            formSchema.map((f) => (
                              <option key={f.fieldKey} value={f.fieldKey}>
                                {f.label} ({f.fieldKey})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Operator */}
                      <div>
                        <select
                          value={primaryCondition.operator || 'gt'}
                          onChange={(e) => {
                            const updated = [...steps];
                            if (!updated[idx].conditions) updated[idx].conditions = [{}];
                            updated[idx].conditions[0].operator = e.target.value;
                            setSteps(updated);
                          }}
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
                        >
                          <option value="gt">&gt; Greater than</option>
                          <option value="gte">&ge; Greater than or equal</option>
                          <option value="lt">&lt; Less than</option>
                          <option value="lte">&le; Less than or equal</option>
                          <option value="eq">== Equals</option>
                          <option value="neq">!= Not Equals</option>
                          <option value="contains">Contains text</option>
                        </select>
                      </div>

                      {/* Value */}
                      <div>
                        <input
                          type="text"
                          value={primaryCondition.value || ''}
                          onChange={(e) => {
                            const updated = [...steps];
                            if (!updated[idx].conditions) updated[idx].conditions = [{}];
                            updated[idx].conditions[0].value = e.target.value;
                            setSteps(updated);
                          }}
                          placeholder="e.g. 5000 or 3"
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Form Trigger Fields */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Dynamic Trigger Form Fields</h3>
            <p className="text-[11px] text-slate-400">Questions requester must fill out when triggering</p>
          </div>
          <button
            type="button"
            onClick={handleAddField}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {formSchema.map((field, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center space-x-3"
            >
              <input
                type="text"
                required
                value={field.label}
                onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                placeholder="Field Label"
                className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
              />
              <select
                value={field.type}
                onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
              >
                <option value="text">Text Input</option>
                <option value="number">Numeric</option>
                <option value="date">Date</option>
                <option value="textarea">Long Text</option>
                <option value="file" disabled={!isStorageConfigured}>
                  {isStorageConfigured ? '📁 File Upload / Attachment' : '📁 File Upload (Requires S3/Azure Storage in Settings)'}
                </option>
              </select>
              <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 dark:border-slate-700"
                />
                <span>Required</span>
              </label>
              <button
                type="button"
                onClick={() => handleRemoveField(idx)}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowFormMode;
