import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Sparkles,
  LayoutGrid,
  FileText,
  CheckCircle2,
  AlertCircle,
  History,
  GitBranch,
  Clock,
  Plus,
  GitCompare,
  Lock,
} from 'lucide-react';
import { workflowService } from '../../services/workflowService';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useWorkflowVersions, useWorkflowMutations } from '../../hooks/useWorkflows';
import WorkflowStudio from './studio/WorkflowStudio';
import WorkflowFormMode from './WorkflowFormMode';
import BuildWithAiView from './BuildWithAiView';
import VersionHistoryDrawer from '../versioning/VersionHistoryDrawer';
import VersionCompareModal from '../versioning/VersionCompareModal';
import FormCompatibilityWarning from '../versioning/FormCompatibilityWarning';

export const WorkflowBuilderModal = ({ isOpen, onClose, editingWorkflow = null }) => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  // Active workflow & version pointers
  const workflowId = editingWorkflow?._id || editingWorkflow?.id;
  const { data: versionsList = [], isLoading: isLoadingVersions } = useWorkflowVersions(workflowId);
  const { forkDraft, updateDraft, publishVersion, discardDraft } = useWorkflowMutations();

  // Mode: 'studio' | 'form' | 'ai'
  const [mode, setMode] = useState('studio');

  // Shared Workflow & Version State
  const [activeVersion, setActiveVersion] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [icon, setIcon] = useState('⚡');
  const [steps, setSteps] = useState([]);
  const [formSchema, setFormSchema] = useState([]);
  const [formId, setFormId] = useState(null);
  const [formVersionId, setFormVersionId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Versioning Drawer & Compare Modal states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Populate state when opening modal
  useEffect(() => {
    if (editingWorkflow) {
      setName(editingWorkflow.name || '');
      setDescription(editingWorkflow.description || '');
      setCategory(editingWorkflow.category || 'general');
      setIcon(editingWorkflow.icon || '⚡');
      setSteps(
        editingWorkflow.steps && editingWorkflow.steps.length > 0
          ? editingWorkflow.steps.map((s, idx) => ({
              stepNumber: s.stepNumber || idx + 1,
              name: s.name || `Stage ${idx + 1}`,
              stepType: s.stepType || 'approval',
              assigneeType: s.assigneeType || 'role',
              assigneeRoleKey: s.assigneeRoleKey || 'manager',
              slaHours: s.slaHours || 24,
              conditionLogic: s.conditionLogic || 'always',
              conditions: s.conditions || [],
            }))
          : [
              {
                stepNumber: 1,
                name: 'Manager Review',
                stepType: 'approval',
                assigneeType: 'role',
                assigneeRoleKey: 'manager',
                slaHours: 24,
                conditionLogic: 'always',
                conditions: [],
              },
            ]
      );
      setFormSchema(
        editingWorkflow.formSchema && editingWorkflow.formSchema.length > 0
          ? editingWorkflow.formSchema
          : [
              {
                fieldKey: 'request_title',
                label: 'Request Title',
                type: 'text',
                required: true,
                placeholder: 'e.g. Budget Request',
              },
            ]
      );
      setFormId(editingWorkflow.formId || null);
      setFormVersionId(editingWorkflow.formVersionId || null);

      // Resolve active version object
      if (editingWorkflow.currentVersionId && typeof editingWorkflow.currentVersionId === 'object') {
        setActiveVersion(editingWorkflow.currentVersionId);
      } else if (editingWorkflow.version) {
        setActiveVersion(editingWorkflow.version);
      } else {
        setActiveVersion({
          version: editingWorkflow.latestVersionNumber || 1,
          status: editingWorkflow.status === 'draft' ? 'draft' : 'published',
        });
      }
    } else {
      setName('');
      setDescription('');
      setCategory('general');
      setIcon('⚡');
      setSteps([
        {
          stepNumber: 1,
          name: 'Manager Review',
          stepType: 'approval',
          assigneeType: 'role',
          assigneeRoleKey: 'manager',
          slaHours: 24,
          conditionLogic: 'always',
          conditions: [],
        },
      ]);
      setFormSchema([
        {
          fieldKey: 'request_title',
          label: 'Request Title',
          type: 'text',
          required: true,
          placeholder: 'e.g. Budget Request',
        },
      ]);
      setFormId(null);
      setFormVersionId(null);
      setActiveVersion({ version: 1, status: 'draft' });
    }
    setError('');
    setSuccessMessage('');
  }, [editingWorkflow, isOpen]);

  if (!isOpen) return null;

  const isReadOnly = activeVersion && activeVersion.status !== 'draft';

  // Handle switching active version to view or continue editing
  const handleSelectVersion = (versionDoc) => {
    setActiveVersion(versionDoc);
    if (versionDoc.name) setName(versionDoc.name);
    if (versionDoc.description !== undefined) setDescription(versionDoc.description);
    if (versionDoc.category) setCategory(versionDoc.category);
    if (versionDoc.icon) setIcon(versionDoc.icon);
    if (versionDoc.steps) setSteps(versionDoc.steps);
    if (versionDoc.formSchema) setFormSchema(versionDoc.formSchema);
    if (versionDoc.formId !== undefined) setFormId(versionDoc.formId);
    if (versionDoc.formVersionId !== undefined) setFormVersionId(versionDoc.formVersionId);
    setIsHistoryOpen(false);
  };

  // Handle Forking a new Draft from any version snapshot
  const handleForkDraft = async (fromVersion = null) => {
    if (!workflowId) return;
    setIsSaving(true);
    setError('');
    try {
      const fromVerId = fromVersion?._id || fromVersion?.id || activeVersion?._id || activeVersion?.id;
      const res = await forkDraft.mutateAsync({
        workflowId,
        fromVersionId: fromVerId,
      });

      setActiveVersion(res.version);
      if (res.version.steps) setSteps(res.version.steps);
      if (res.version.formSchema) setFormSchema(res.version.formSchema);
      setSuccessMessage(`Created new Draft v${res.version.version}! You can now make changes safely.`);
      setIsHistoryOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fork new draft version');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Discarding a Draft
  const handleDiscardDraft = async (versionDoc) => {
    if (!workflowId) return;
    if (!window.confirm(`Discard Draft v${versionDoc.version}? All un-published changes will be lost.`)) return;

    try {
      await discardDraft.mutateAsync({
        workflowId,
        versionId: versionDoc._id || versionDoc.id,
      });

      // Find published version or fallback
      const remaining = versionsList.filter((v) => (v.id || v._id) !== (versionDoc.id || versionDoc._id));
      const pub = remaining.find((v) => v.status === 'published') || remaining[0];
      if (pub) {
        handleSelectVersion(pub);
      }
      setSuccessMessage(`Draft v${versionDoc.version} discarded.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to discard draft');
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!name.trim()) {
      setError('Please enter a workflow name.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const formattedSteps = steps.map((step, idx) => ({
        ...step,
        stepNumber: idx + 1,
        name: step.name || `Stage ${idx + 1}`,
      }));

      if (!workflowId) {
        // Create new workflow in Draft status
        const res = await workflowService.createWorkflow({
          name: name.trim(),
          description: description.trim(),
          category,
          icon,
          status: 'draft',
          steps: formattedSteps,
          formSchema,
          formId,
          formVersionId,
        });
        setActiveVersion(res.version);
        setSuccessMessage('Workflow draft created successfully!');
      } else {
        // If current active version is draft, update it
        const versionId = activeVersion?._id || activeVersion?.id;
        if (activeVersion?.status === 'draft' && versionId) {
          const updated = await updateDraft.mutateAsync({
            workflowId,
            versionId,
            data: {
              name: name.trim(),
              description: description.trim(),
              category,
              icon,
              steps: formattedSteps,
              formSchema,
              formId,
              formVersionId,
            },
          });
          setActiveVersion(updated.data || updated);
          setSuccessMessage('Draft saved successfully.');
        } else {
          // If published, fork first
          await handleForkDraft(activeVersion);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['workflows'] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Workflow Version
  const handlePublish = async () => {
    if (!name.trim()) {
      setError('Please enter a workflow name.');
      return;
    }
    if (steps.length === 0) {
      setError('Please add at least one approval stage before publishing.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const formattedSteps = steps.map((step, idx) => ({
        ...step,
        stepNumber: idx + 1,
        name: step.name || `Stage ${idx + 1}`,
      }));

      let targetWfId = workflowId;
      let targetVersionId = activeVersion?._id || activeVersion?.id;

      if (!targetWfId) {
        // Create directly as published v1
        const res = await workflowService.createWorkflow({
          name: name.trim(),
          description: description.trim(),
          category,
          icon,
          status: 'active',
          steps: formattedSteps,
          formSchema,
          formId,
          formVersionId,
        });
        targetWfId = res.workflow?._id || res.workflow?.id;
        targetVersionId = res.version?._id || res.version?.id;
      } else {
        // Update draft first
        if (activeVersion?.status === 'draft' && targetVersionId) {
          await updateDraft.mutateAsync({
            workflowId: targetWfId,
            versionId: targetVersionId,
            data: {
              name: name.trim(),
              description: description.trim(),
              category,
              icon,
              steps: formattedSteps,
              formSchema,
              formId,
              formVersionId,
            },
          });

          // Publish version
          const published = await publishVersion.mutateAsync({
            workflowId: targetWfId,
            versionId: targetVersionId,
            changeSummary: `Published v${activeVersion.version}`,
          });
          setActiveVersion(published.data || published);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSuccessMessage('Workflow published successfully!');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to publish workflow');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col overflow-hidden w-screen h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden"
      >
        {/* Full-Screen Header with Mode Switcher & Version Controls */}
        <header className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0 gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="text-xl p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                {icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    {name || 'Untitled Workflow'}
                  </h2>
                  {activeVersion && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        activeVersion.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : activeVersion.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      v{activeVersion.version} • {activeVersion.status}
                    </span>
                  )}
                  {isReadOnly && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
                      <Lock className="w-3 h-3" /> Read Only
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  {isReadOnly
                    ? 'Published versions are immutable. Fork a new draft to edit.'
                    : 'Editing draft version. Changes are isolated.'}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shrink-0">
            <button
              type="button"
              onClick={() => setMode('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'studio'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('form')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'form'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Form</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'ai'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI</span>
            </button>
          </div>

          {/* Action Buttons & Version History Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {workflowId && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-indigo-500" />
                <span>Versions</span>
              </button>
            )}

            {isReadOnly ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleForkDraft(activeVersion)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Version to Edit</span>
              </motion.button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Version</span>
                </motion.button>
              </>
            )}
          </div>
        </header>

        {/* Global Notification Banner */}
        {error && (
          <div className="px-6 py-2 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError('')} className="text-rose-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Read-Only Notice for Published Versions */}
        {isReadOnly && (
          <div className="px-6 py-2 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>
                You are viewing <strong>v{activeVersion?.version} ({activeVersion?.status})</strong> in read-only mode. Published versions are permanently preserved.
              </span>
            </div>
            <button
              onClick={() => handleForkDraft(activeVersion)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Click here to fork a new editable draft →
            </button>
          </div>
        )}

        {/* Workspace Canvas / Studio */}
        <div className="flex-1 flex overflow-hidden">
          {mode === 'studio' ? (
            <WorkflowStudio
              name={name}
              setName={isReadOnly ? () => {} : setName}
              category={category}
              setCategory={isReadOnly ? () => {} : setCategory}
              description={description}
              setDescription={isReadOnly ? () => {} : setDescription}
              icon={icon}
              setIcon={isReadOnly ? () => {} : setIcon}
              steps={steps}
              setSteps={isReadOnly ? () => {} : setSteps}
              formSchema={formSchema}
              setFormSchema={isReadOnly ? () => {} : setFormSchema}
              formId={formId}
              setFormId={isReadOnly ? () => {} : setFormId}
              formVersionId={formVersionId}
              setFormVersionId={isReadOnly ? () => {} : setFormVersionId}
              isReadOnly={isReadOnly}
            />
          ) : mode === 'form' ? (
            <WorkflowFormMode
              name={name}
              setName={isReadOnly ? () => {} : setName}
              category={category}
              setCategory={isReadOnly ? () => {} : setCategory}
              description={description}
              setDescription={isReadOnly ? () => {} : setDescription}
              icon={icon}
              setIcon={isReadOnly ? () => {} : setIcon}
              steps={steps}
              setSteps={isReadOnly ? () => {} : setSteps}
              formSchema={formSchema}
              setFormSchema={isReadOnly ? () => {} : setFormSchema}
              isReadOnly={isReadOnly}
            />
          ) : (
            <BuildWithAiView
              onApplyWorkflow={(aiData) => {
                if (isReadOnly) {
                  setError('Cannot overwrite a published version. Create a new version first.');
                  return;
                }
                if (aiData.name) setName(aiData.name);
                if (aiData.category) setCategory(aiData.category);
                if (aiData.description) setDescription(aiData.description);
                if (aiData.icon) setIcon(aiData.icon);
                if (aiData.formSchema) setFormSchema(aiData.formSchema);
                if (aiData.steps) setSteps(aiData.steps);
                setMode('studio');
              }}
              onClose={onClose}
              onSwitchToStudio={() => setMode('studio')}
            />
          )}
        </div>

        {/* Version History Drawer */}
        <VersionHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title={name}
          entityType="workflow"
          currentVersionId={activeVersion?._id || activeVersion?.id}
          versions={versionsList}
          isLoading={isLoadingVersions}
          onSelectVersion={handleSelectVersion}
          onForkDraft={handleForkDraft}
          onDiscardDraft={handleDiscardDraft}
          onOpenCompare={() => {
            setIsHistoryOpen(false);
            setIsCompareOpen(true);
          }}
        />

        {/* Version Comparison Modal */}
        <VersionCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          entityType="workflow"
          entityId={workflowId}
          versions={versionsList}
        />
      </motion.div>
    </div>,
    document.body
  );
};

export default WorkflowBuilderModal;
