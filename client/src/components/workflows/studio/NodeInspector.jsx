import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Plus,
  Trash2,
  FileText,
  Shield,
  Sliders,
  CheckCircle2,
  X,
  Lock,
  GitBranch,
  AlertTriangle,
} from 'lucide-react';
import { useForms, useFormVersions } from '../../../hooks/useForms';
import { formService } from '../../../services/formService';
import FormCompatibilityWarning from '../../versioning/FormCompatibilityWarning';

export const NodeInspector = ({
  selectedType, // 'trigger' | 'step' | 'metadata'
  selectedIndex,
  // Metadata state
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
  icon,
  setIcon,
  // Steps state
  steps = [],
  onStepChange,
  onRemoveStep,
  onAddStep,
  // Form Schema state
  formSchema = [],
  onAddField,
  onFieldChange,
  onRemoveField,
  // Form Version Pinning
  formId,
  setFormId,
  formVersionId,
  setFormVersionId,
  isReadOnly = false,
}) => {
  // Available forms in workspace
  const { data: formsData } = useForms();
  const formsList = formsData?.data || [];

  // Versions of currently selected form
  const { data: formVersionsList = [] } = useFormVersions(formId);

  // Compute live missing condition fields for compatibility warning
  const missingConditionFields = [];
  const formKeySet = new Set((formSchema || []).map((f) => (f.fieldKey || '').toLowerCase()));

  steps.forEach((step) => {
    if (step.conditions && Array.isArray(step.conditions)) {
      step.conditions.forEach((c) => {
        if (c.field && !formKeySet.has(c.field.toLowerCase())) {
          missingConditionFields.push({
            stepNumber: step.stepNumber,
            stepName: step.name,
            missingField: c.field,
          });
        }
      });
    }
  });

  // Handle selecting a catalog form
  const handleSelectCatalogForm = async (selectedId) => {
    if (!selectedId) {
      if (setFormId) setFormId(null);
      if (setFormVersionId) setFormVersionId(null);
      return;
    }

    if (setFormId) setFormId(selectedId);
    try {
      const formDoc = await formService.getFormById(selectedId);
      const activeVer = formDoc.version;
      if (activeVer) {
        if (setFormVersionId) setFormVersionId(activeVer._id || activeVer.id);
        if (activeVer.fields && activeVer.fields.length > 0) {
          // Replace form schema with the version snapshot
          activeVer.fields.forEach((f, idx) => {
            if (onFieldChange) onFieldChange(idx, 'full_object', f);
          });
        }
      }
    } catch {
      // Ignored
    }
  };

  // Handle changing to a specific Form Version
  const handleSelectFormVersion = async (selectedVerId) => {
    if (setFormVersionId) setFormVersionId(selectedVerId);
    const targetVer = formVersionsList.find((v) => (v.id || v._id) === selectedVerId);
    if (targetVer && targetVer.fields) {
      targetVer.fields.forEach((f, idx) => {
        if (onFieldChange) onFieldChange(idx, 'full_object', f);
      });
    }
  };

  // 1. TRIGGER FORM INSPECTOR
  if (selectedType === 'trigger') {
    return (
      <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <span className="text-base">📝</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Trigger Form Inspector
                </h3>
              </div>
              {isReadOnly && (
                <span className="text-[10px] flex items-center gap-1 font-bold text-slate-400">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Define or pin the immutable form schema required to launch this process.
            </p>
          </div>

          {/* Form Version Pinning Section */}
          <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
              <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
              <span>Catalog Form & Version Pinning</span>
            </div>

            {/* Select Form from Catalog */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Linked Form:
              </label>
              <select
                disabled={isReadOnly}
                value={formId || ''}
                onChange={(e) => handleSelectCatalogForm(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white disabled:opacity-60"
              >
                <option value="">(Custom In-Line Schema)</option>
                {formsList.map((f) => (
                  <option key={f.id || f._id} value={f.id || f._id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Pinned Version */}
            {formId && formVersionsList.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pinned Version:
                </label>
                <select
                  disabled={isReadOnly}
                  value={formVersionId || ''}
                  onChange={(e) => handleSelectFormVersion(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white disabled:opacity-60 font-mono"
                >
                  {formVersionsList.map((v) => (
                    <option key={v.id || v._id} value={v.id || v._id}>
                      v{v.version} • {v.status} {v.status === 'published' ? '★' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Workflows stay permanently pinned to this version even if newer form versions are released.
                </p>
              </div>
            )}
          </div>

          {/* Compatibility Warning if any condition references a missing field */}
          <FormCompatibilityWarning missingFields={missingConditionFields} />

          {/* Form Fields Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Form Fields ({formSchema.length})
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={onAddField}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              )}
            </div>

            {formSchema.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">No trigger fields added yet.</div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={onAddField}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    + Add First Field
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {formSchema.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                        Field {idx + 1}
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => onRemoveField(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Delete field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Field Label */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Label <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        required
                        value={field.label}
                        onChange={(e) => onFieldChange(idx, 'label', e.target.value)}
                        placeholder="e.g. Request Title"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-60"
                      />
                    </div>

                    {/* Field Type */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Field Type
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={field.type}
                        onChange={(e) => onFieldChange(idx, 'type', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:opacity-60"
                      >
                        <option value="text">Text Input</option>
                        <option value="number">Numeric</option>
                        <option value="date">Date</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown Menu</option>
                        <option value="file_upload">File Attachment</option>
                      </select>
                    </div>

                    {/* Required Checkbox */}
                    <label className="flex items-center space-x-2 pt-1 text-[11px] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={field.required}
                        onChange={(e) => onFieldChange(idx, 'required', e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Required Field</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // 2. APPROVAL STAGE INSPECTOR
  if (selectedType === 'step' && steps[selectedIndex]) {
    const step = steps[selectedIndex];
    return (
      <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Shield className="w-4 h-4" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Stage {selectedIndex + 1} Inspector
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Configure reviewer assignment, SLA deadlines, and logic rules.
              </p>
            </div>
            {isReadOnly && (
              <span className="text-[10px] flex items-center gap-1 font-bold text-slate-400">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          {/* Stage Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Stage Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              required
              value={step.name}
              onChange={(e) => onStepChange(selectedIndex, 'name', e.target.value)}
              placeholder="e.g. Department Manager Approval"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Reviewer Role Assignment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Assigned Reviewer Role
            </label>
            <select
              disabled={isReadOnly}
              value={step.assigneeRoleKey || 'manager'}
              onChange={(e) => onStepChange(selectedIndex, 'assigneeRoleKey', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <option value="manager">Department Manager</option>
              <option value="admin">Workspace Administrator</option>
              <option value="approver">Finance & Approver Role</option>
              <option value="owner">Workspace Owner</option>
            </select>
          </div>

          {/* SLA Turnaround */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              SLA Turnaround Deadline (Hours)
            </label>
            <input
              type="number"
              disabled={isReadOnly}
              min="1"
              max="720"
              value={step.slaHours ?? 24}
              onChange={(e) => onStepChange(selectedIndex, 'slaHours', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>

          {/* Execution Condition Logic */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Condition Logic
              </span>
            </div>

            <select
              disabled={isReadOnly}
              value={step.conditionLogic || 'always'}
              onChange={(e) => onStepChange(selectedIndex, 'conditionLogic', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white disabled:opacity-60"
            >
              <option value="always">Always Require This Stage</option>
              <option value="all">Require When ALL Conditions Match</option>
              <option value="any">Require When ANY Condition Matches</option>
            </select>
          </div>
        </div>

        {!isReadOnly && steps.length > 1 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onRemoveStep(selectedIndex)}
              className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Stage {selectedIndex + 1}</span>
            </button>
          </div>
        )}
      </aside>
    );
  }

  // 3. METADATA INSPECTOR
  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 overflow-y-auto">
      <div className="space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-4 h-4" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Process Metadata
            </h3>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">
            Workflow Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            disabled={isReadOnly}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">
            Category
          </label>
          <select
            disabled={isReadOnly}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            <option value="expense">Expense & Finance</option>
            <option value="leave">Time Off & Leave</option>
            <option value="procurement">Procurement & Hardware</option>
            <option value="it_support">IT Support</option>
            <option value="general">General Operations</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 dark:text-white">
            Description
          </label>
          <textarea
            disabled={isReadOnly}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>
      </div>
    </aside>
  );
};

export default NodeInspector;
