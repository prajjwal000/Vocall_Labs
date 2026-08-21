import React, { useState } from 'react';
import { useWorkflows } from '../../hooks/useWorkflows';
import { usePermissions } from '../../hooks/usePermissions';
import WorkflowCard from '../../components/workflows/WorkflowCard';
import WorkflowBuilderModal from '../../components/workflows/WorkflowBuilderModal';
import RequestSubmissionModal from '../../components/workflows/RequestSubmissionModal';
import { PREDEFINED_FORMS } from '../../components/workflows/studio/predefinedForms';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  Plus,
  Search,
  ArrowRight,
  Edit,
  FileSpreadsheet,
} from 'lucide-react';

const Workflows = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(null);

  const navigate = useNavigate();
  const { can, isOwner } = usePermissions();

  const canRead = can('workflows.read') || can('forms.read') || isOwner;
  const canCreate = can('workflows.create') || can('forms.create') || isOwner;
  const canUpdate = can('workflows.update') || can('forms.update') || isOwner;
  const canTrigger =
    can('workflows.read') ||
    can('forms.read') ||
    can('requests.create') ||
    can('forms.create') ||
    isOwner;

  const { data, isLoading } = useWorkflows({
    category: selectedCategory || undefined,
    search: search || undefined,
  });

  const workflows = data?.data || [];

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Expense & Finance', value: 'expense' },
    { label: 'Time Off & HR', value: 'leave' },
    { label: 'Hardware & IT', value: 'procurement' },
    { label: 'General Operations', value: 'general' },
  ];

  // Filter predefined templates based on category and search
  const filteredPredefined = PREDEFINED_FORMS.filter((f) => {
    const matchesCategory = !selectedCategory || f.category === selectedCategory;
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLaunchPredefined = (predefinedForm) => {
    // Check if matching workflow exists in live workflows
    const matched = workflows.find(
      (w) =>
        w.category === predefinedForm.category ||
        w.name.toLowerCase().includes(predefinedForm.name.toLowerCase())
    );

    if (matched) {
      setTriggeringWorkflow(matched);
    } else if (canCreate) {
      // Open builder prefilled with the template
      setEditingWorkflow({
        name: predefinedForm.name,
        category: predefinedForm.category,
        description: predefinedForm.description,
        icon: predefinedForm.icon,
        formSchema: predefinedForm.fields,
        steps: [
          {
            stepNumber: 1,
            name: 'Manager Review',
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'manager',
            slaHours: 24,
          },
          {
            stepNumber: 2,
            name: 'Admin Sign-Off',
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'admin',
            slaHours: 48,
          },
        ],
      });
      setIsBuilderOpen(true);
    } else if (workflows.length > 0) {
      setTriggeringWorkflow({
        ...workflows[0],
        name: predefinedForm.name,
        description: predefinedForm.description,
        icon: predefinedForm.icon,
        formSchema: predefinedForm.fields,
      });
    }
  };

  if (!canRead) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view workflows and forms.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>⚡ Workflows & Forms</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Design multi-stage approval pipelines, fill corporate forms, or author custom schemas in the visual Studio.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {can(['requests.read', 'forms.read', 'workflows.read']) && (
            <button
              onClick={() => navigate('/app/requests')}
              className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
              <span>My Submissions & Requests</span>
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setIsBuilderOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow / Form</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search workflows, forms & schemas..."
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
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Active Organization Workflows & Forms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Active Organization Processes & Forms ({workflows.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Deployed & ready for immediate submission</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-56"
              ></div>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="text-4xl">⚡</div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                No Custom Workflows Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {search
                  ? 'Try adjusting your search query or category filter.'
                  : 'Pick a pre-configured template below to launch instantly or author a new process.'}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => {
                  setEditingWorkflow(null);
                  setIsBuilderOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>+ Author Workflow / Form</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf._id || wf.id}
                workflow={wf}
                canManage={canUpdate}
                canTrigger={canTrigger}
                onTrigger={(w) => setTriggeringWorkflow(w)}
                onEdit={(w) => {
                  setEditingWorkflow(w);
                  setIsBuilderOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Standard Corporate Templates Catalog */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Standard Corporate Templates ({filteredPredefined.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Pre-built schemas with automated approval routing</span>
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
                {canCreate ? (
                  <button
                    onClick={() => {
                      setEditingWorkflow({
                        name: tmpl.name,
                        category: tmpl.category,
                        description: tmpl.description,
                        icon: tmpl.icon,
                        formSchema: tmpl.fields,
                        steps: [
                          {
                            stepNumber: 1,
                            name: 'Manager Review',
                            stepType: 'approval',
                            assigneeType: 'role',
                            assigneeRoleKey: 'manager',
                            slaHours: 24,
                          },
                          {
                            stepNumber: 2,
                            name: 'Admin Sign-Off',
                            stepType: 'approval',
                            assigneeType: 'role',
                            assigneeRoleKey: 'admin',
                            slaHours: 48,
                          },
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
                  <span className="text-[11px] text-slate-400 font-medium">
                    Pre-validated
                  </span>
                )}

                {canTrigger && (
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

export default Workflows;
