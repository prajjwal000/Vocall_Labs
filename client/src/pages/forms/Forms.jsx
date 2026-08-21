import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Clock,
  CheckCircle2,
  Edit,
  Settings,
} from 'lucide-react';
import { useWorkflows } from '../../hooks/useWorkflows';
import { usePermissions } from '../../hooks/usePermissions';
import { PREDEFINED_FORMS } from '../../components/workflows/studio/predefinedForms';
import WorkflowBuilderModal from '../../components/workflows/WorkflowBuilderModal';
import RequestSubmissionModal from '../../components/workflows/RequestSubmissionModal';

export const Forms = () => {
  const navigate = useNavigate();
  const { can, isOwner } = usePermissions();

  const canReadForms = can('forms.read') || can('workflows.read') || isOwner;
  const canCreateForms = can('forms.create') || can('workflows.create') || isOwner;
  const canUpdateForms =
    can('forms.update') ||
    can('workflows.update') ||
    can('forms.create') ||
    can('workflows.create') ||
    isOwner;
  const canSubmitRequests =
    can('forms.read') ||
    can('forms.create') ||
    can('requests.create') ||
    can('workflows.read') ||
    isOwner;

  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(null);

  // Fetch live workflows
  const { data, isLoading } = useWorkflows({
    category: selectedCategory || undefined,
    search: search || undefined,
  });

  const liveWorkflows = data?.data || [];

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Expense & Finance', value: 'expense' },
    { label: 'Time Off & HR', value: 'leave' },
    { label: 'Hardware & IT', value: 'procurement' },
    { label: 'General Operations', value: 'general' },
  ];

  // Filter predefined forms based on category and search
  const filteredPredefined = PREDEFINED_FORMS.filter((f) => {
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLaunchPredefined = (predefinedForm) => {
    // Check if matching workflow exists in liveWorkflows
    const matched = liveWorkflows.find(
      (w) => w.category === predefinedForm.category || w.name.toLowerCase().includes(predefinedForm.name.toLowerCase())
    );

    if (matched) {
      setTriggeringWorkflow(matched);
    } else if (canCreateForms) {
      // If none exists and user has create perms, open builder prefilled
      setEditingWorkflow({
        name: predefinedForm.name,
        category: predefinedForm.category,
        description: predefinedForm.description,
        icon: predefinedForm.icon,
        formSchema: predefinedForm.fields,
        steps: [
          { stepNumber: 1, name: 'Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
          { stepNumber: 2, name: 'Admin Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin' },
        ],
      });
      setIsBuilderOpen(true);
    } else if (liveWorkflows.length > 0) {
      // If no exact match, trigger first available live workflow with the predefined fields
      setTriggeringWorkflow({
        ...liveWorkflows[0],
        name: predefinedForm.name,
        description: predefinedForm.description,
        icon: predefinedForm.icon,
        formSchema: predefinedForm.fields,
      });
    }
  };

  if (!canReadForms) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view form templates and catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">📋</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Forms & Request Catalog
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fill out standard corporate forms, launch operational requests, or author custom schemas in the Workflow Studio.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {can('requests.read') && (
            <button
              onClick={() => navigate('/app/requests')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              📋 My Submissions
            </button>
          )}

          {canCreateForms && (
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setIsBuilderOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Author Form (Studio)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search forms by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs placeholder-slate-400 border-none bg-transparent focus:outline-hidden text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Published Live Workspace Forms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Active Organization Forms ({liveWorkflows.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Deployed & ready for immediate submission</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-48"></div>
            ))}
          </div>
        ) : liveWorkflows.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-white/50 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No custom live forms found. Pick a pre-configured template below to launch instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveWorkflows.map((wf) => (
              <div
                key={wf._id || wf.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                        {wf.icon || '📄'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {wf.name}
                        </h3>
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
                          {wf.formSchema?.length || 0} fields schema
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                      v{wf.publishedVersionId?.version || wf.latestVersionNumber || 1}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {wf.description || 'Dynamic form template with automated multi-step approvals.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {canUpdateForms ? (
                    <button
                      onClick={() => {
                        setEditingWorkflow(wf);
                        setIsBuilderOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Edit Form</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {canSubmitRequests ? 'Ready to fill' : 'Catalog item'}
                    </span>
                  )}

                  {canSubmitRequests && (
                    <button
                      onClick={() => setTriggeringWorkflow(wf)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Fill Form</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Standard Predefined Templates Catalog */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Standard Corporate Form Templates ({filteredPredefined.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Pre-built schemas with validation rules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPredefined.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                      {tmpl.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {tmpl.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 capitalize">
                        {tmpl.category} • {tmpl.fields?.length || 0} fields
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Template
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>

                {/* Field Tags Preview */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tmpl.fields?.slice(0, 3).map((f) => (
                    <span
                      key={f.id}
                      className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                    >
                      {f.label}
                    </span>
                  ))}
                  {tmpl.fields?.length > 3 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                      +{tmpl.fields.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {canCreateForms ? (
                  <button
                    onClick={() => {
                      setEditingWorkflow({
                        name: tmpl.name,
                        category: tmpl.category,
                        description: tmpl.description,
                        icon: tmpl.icon,
                        formSchema: tmpl.fields,
                        steps: [
                          { stepNumber: 1, name: 'Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
                          { stepNumber: 2, name: 'Admin Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin' },
                        ],
                      });
                      setIsBuilderOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-purple-500" />
                    <span>Customize</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Pre-validated</span>
                )}

                {canSubmitRequests && (
                  <button
                    onClick={() => handleLaunchPredefined(tmpl)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Modal */}
      {triggeringWorkflow && (
        <RequestSubmissionModal
          workflow={triggeringWorkflow}
          isOpen={Boolean(triggeringWorkflow)}
          onClose={() => setTriggeringWorkflow(null)}
          onSuccess={() => navigate('/app/requests')}
        />
      )}

      {/* Workflow Builder Modal */}
      {isBuilderOpen && (
        <WorkflowBuilderModal
          isOpen={isBuilderOpen}
          initialData={editingWorkflow}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingWorkflow(null);
          }}
          onSaved={() => {
            setIsBuilderOpen(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
};

export default Forms;
