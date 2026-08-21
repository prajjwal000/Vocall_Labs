import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowDown, Sparkles, Sliders, CheckCircle2, ChevronDown } from 'lucide-react';
import TriggerFormNode from './TriggerFormNode';
import ApprovalStageNode from './ApprovalStageNode';
import WorkflowElementsSidebar from './WorkflowElementsSidebar';
import NodeInspector from './NodeInspector';
import CreateCustomFormModal from './CreateCustomFormModal';

export const WorkflowStudio = ({
  // Workflow state
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
  formId,
  setFormId,
  formVersionId,
  setFormVersionId,
  isReadOnly = false,
}) => {
  // Form Title / Label State
  const [formTitle, setFormTitle] = useState('Trigger Form');

  // Custom Form Modal State
  const [isCustomFormModalOpen, setIsCustomFormModalOpen] = useState(false);

  // Selection state: { type: 'trigger' | 'step' | 'metadata', index?: number }
  const [selectedType, setSelectedType] = useState('trigger');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Step operations
  const handleAddStep = () => {
    const newStepIndex = steps.length;
    const newStep = {
      stepNumber: newStepIndex + 1,
      name: `Stage ${newStepIndex + 1} Review`,
      stepType: 'approval',
      assigneeType: 'role',
      assigneeRoleKey: 'admin',
    };
    setSteps([...steps, newStep]);
    setSelectedType('step');
    setSelectedIndex(newStepIndex);
  };

  const handleRemoveStep = (index) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(updated);
    if (selectedType === 'step' && selectedIndex === index) {
      setSelectedType('trigger');
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  // Form Schema operations
  const handleAddField = () => {
    const key = `field_${Date.now()}`;
    const newField = {
      fieldKey: key,
      label: `Field ${formSchema.length + 1}`,
      type: 'text',
      required: true,
      placeholder: '',
    };
    setFormSchema([...formSchema, newField]);
    setSelectedType('trigger');
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

  // Handling Custom Form creation
  const handleSaveCustomForm = (customForm) => {
    setFormTitle(customForm.name);
    setFormSchema(customForm.fields);
    if (!name || name === 'Untitled Workflow') {
      setName(customForm.name);
    }
    if (customForm.description && !description) {
      setDescription(customForm.description);
    }
    setSelectedType('trigger');
  };

  // Handling Predefined Form selection
  const handleSelectPredefinedForm = (predefinedForm) => {
    setFormTitle(predefinedForm.name);
    setFormSchema(predefinedForm.fields);
    if (!name || name === 'Untitled Workflow') {
      setName(predefinedForm.name);
    }
    if (predefinedForm.description && !description) {
      setDescription(predefinedForm.description);
    }
    if (predefinedForm.category) {
      setCategory(predefinedForm.category);
    }
    if (predefinedForm.icon) {
      setIcon(predefinedForm.icon);
    }
    setSelectedType('trigger');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-100/70 dark:bg-slate-950 relative">
      {/* 1. Left Elements Sidebar with dedicated Forms Section */}
      <WorkflowElementsSidebar
        steps={steps}
        formSchema={formSchema}
        formTitle={formTitle}
        onAddStep={handleAddStep}
        onSelectTrigger={() => setSelectedType('trigger')}
        onSelectStep={(idx) => {
          setSelectedType('step');
          setSelectedIndex(idx);
        }}
        selectedType={selectedType}
        selectedIndex={selectedIndex}
        onOpenCreateCustomForm={() => setIsCustomFormModalOpen(true)}
        onSelectPredefinedForm={handleSelectPredefinedForm}
      />

      {/* 2. Center Visual Canvas */}
      <div className="flex-1 flex flex-col overflow-y-auto relative bg-[linear-gradient(to_right,#cbd5e140_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e140_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b30_1px,transparent_1px),linear-gradient(to_bottom,#1e293b30_1px,transparent_1px)] bg-[size:2rem_2rem]">
        
        {/* Canvas Top Bar Indicator */}
        <div className="p-4 flex items-center justify-between pointer-events-none sticky top-0 z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs pointer-events-auto backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-0.5"></span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Interactive Flow Canvas
            </span>
            <span className="text-[10px] text-slate-400">
              ({steps.length + 1} Pipeline Nodes)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedType('metadata')}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer pointer-events-auto shadow-2xs ${
              selectedType === 'metadata'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            ⚙️ Edit Process Metadata
          </button>
        </div>

        {/* Pipeline Nodes Flow (Centered Column) */}
        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 space-y-3 max-w-2xl mx-auto w-full">
          
          {/* Node 1: Form Node (with Configure trigger) */}
          <TriggerFormNode
            formTitle={formTitle}
            formSchema={formSchema}
            isSelected={selectedType === 'trigger'}
            onClick={() => setSelectedType('trigger')}
            onConfigure={() => setSelectedType('trigger')}
          />

          {/* Connector to First Approval Stage */}
          <div className="flex flex-col items-center py-1">
            <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500"></div>
            <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs my-0.5">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-400 to-slate-300 dark:from-indigo-500 dark:to-slate-700"></div>
          </div>

          {/* Node 2..N: Sequential Approval Stages */}
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <ApprovalStageNode
                step={step}
                index={idx}
                totalSteps={steps.length}
                isSelected={selectedType === 'step' && selectedIndex === idx}
                onClick={() => {
                  setSelectedType('step');
                  setSelectedIndex(idx);
                }}
                onRemove={handleRemoveStep}
              />

              {/* Connector between steps or below last step */}
              <div className="flex flex-col items-center py-1">
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
                <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center shadow-2xs my-0.5">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
                <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700"></div>
              </div>
            </React.Fragment>
          ))}

          {/* Add Step In-Line Button at Bottom of Pipeline */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleAddStep}
            className="w-72 p-3 bg-white/90 dark:bg-slate-900/90 border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-2 group"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-xs transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>+ Add Approval Stage {steps.length + 1}</span>
          </motion.button>
        </div>
      </div>

      {/* 3. Right Node Inspector */}
      <NodeInspector
        selectedType={selectedType}
        selectedIndex={selectedIndex}
        name={name}
        setName={setName}
        category={category}
        setCategory={setCategory}
        description={description}
        setDescription={setDescription}
        icon={icon}
        setIcon={setIcon}
        steps={steps}
        onStepChange={handleStepChange}
        onRemoveStep={handleRemoveStep}
        onAddStep={handleAddStep}
        formSchema={formSchema}
        onAddField={isReadOnly ? () => {} : handleAddField}
        onFieldChange={isReadOnly ? () => {} : handleFieldChange}
        onRemoveField={isReadOnly ? () => {} : handleRemoveField}
        formId={formId}
        setFormId={setFormId}
        formVersionId={formVersionId}
        setFormVersionId={setFormVersionId}
        isReadOnly={isReadOnly}
      />

      {/* 4. Create Custom Form Modal */}
      {isCustomFormModalOpen && (
        <CreateCustomFormModal
          isOpen={isCustomFormModalOpen}
          onClose={() => setIsCustomFormModalOpen(false)}
          onSaveForm={handleSaveCustomForm}
        />
      )}
    </div>
  );
};

export default WorkflowStudio;
