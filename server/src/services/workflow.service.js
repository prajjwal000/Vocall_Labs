const Workflow = require('../models/Workflow');
const WorkflowVersion = require('../models/WorkflowVersion');
const FormVersion = require('../models/FormVersion');
const WorkflowRequest = require('../models/WorkflowRequest');
const WorkflowApproval = require('../models/WorkflowApproval');
const Role = require('../models/Role');
const OrganizationMember = require('../models/OrganizationMember');

/**
 * Sequential Request Code Generator (e.g., REQ-0001)
 */
const generateRequestCode = async (organizationId) => {
  const latest = await WorkflowRequest.findOne({ organizationId })
    .sort({ createdAt: -1 })
    .select('requestCode');

  if (!latest || !latest.requestCode) {
    return 'REQ-0001';
  }

  const match = latest.requestCode.match(/REQ-(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10) + 1;
    return `REQ-${num.toString().padStart(4, '0')}`;
  }
  return `REQ-${Date.now().toString().slice(-4)}`;
};

/**
 * Default Workflow Templates
 */
const DEFAULT_TEMPLATES = [
  {
    name: 'Expense Reimbursement',
    description: 'Submit business, travel, and software expenses for departmental and finance approval',
    category: 'expense',
    icon: '💰',
    formSchema: [
      {
        fieldKey: 'expenseTitle',
        label: 'Expense Description',
        type: 'text',
        placeholder: 'e.g. Flight tickets for client meeting',
        required: true,
      },
      {
        fieldKey: 'amount',
        label: 'Total Amount',
        type: 'number',
        placeholder: '0.00',
        required: true,
      },
      {
        fieldKey: 'currency',
        label: 'Currency',
        type: 'select',
        required: true,
        options: [
          { label: 'USD ($)', value: 'USD' },
          { label: 'EUR (€)', value: 'EUR' },
          { label: 'GBP (£)', value: 'GBP' },
          { label: 'INR (₹)', value: 'INR' },
        ],
        defaultValue: 'USD',
      },
      {
        fieldKey: 'category',
        label: 'Expense Category',
        type: 'select',
        required: true,
        options: [
          { label: 'Travel & Lodging', value: 'travel' },
          { label: 'Software & Tools', value: 'software' },
          { label: 'Client Entertainment & Meals', value: 'meals' },
          { label: 'Office Supplies', value: 'supplies' },
        ],
      },
      {
        fieldKey: 'expenseDate',
        label: 'Date Incurred',
        type: 'date',
        required: true,
      },
      {
        fieldKey: 'notes',
        label: 'Business Justification / Receipt Notes',
        type: 'textarea',
        placeholder: 'Provide any additional context or receipt IDs...',
        required: false,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        name: 'Department Manager Review',
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'manager',
      },
      {
        stepNumber: 2,
        name: 'Finance & Accounts Sign-Off',
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'approver',
      },
    ],
  },
  {
    name: 'Leave & Time-Off Request',
    description: 'Request annual PTO, sick leave, or personal time off',
    category: 'leave',
    icon: '🌴',
    formSchema: [
      {
        fieldKey: 'leaveType',
        label: 'Leave Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Paid Time Off (PTO)', value: 'pto' },
          { label: 'Sick Leave', value: 'sick' },
          { label: 'Parental Leave', value: 'parental' },
          { label: 'Unpaid Leave', value: 'unpaid' },
        ],
      },
      {
        fieldKey: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: true,
      },
      {
        fieldKey: 'endDate',
        label: 'End Date',
        type: 'date',
        required: true,
      },
      {
        fieldKey: 'reason',
        label: 'Handover / Reason Notes',
        type: 'textarea',
        placeholder: 'Briefly describe your coverage or reason...',
        required: false,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        name: 'Team Manager Approval',
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'manager',
      },
      {
        stepNumber: 2,
        name: 'HR Operations Confirmation',
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'admin',
      },
    ],
  },
  {
    name: 'Hardware & Equipment Procurement',
    description: 'Request new laptops, monitors, accessories, or developer hardware',
    category: 'procurement',
    icon: '💻',
    formSchema: [
      {
        fieldKey: 'itemType',
        label: 'Item Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Workstation Laptop (Mac / ThinkPad)', value: 'laptop' },
          { label: 'External 4K Monitor', value: 'monitor' },
          { label: 'Noise Cancelling Headset', value: 'headset' },
          { label: 'Other Accessory / Adapter', value: 'other' },
        ],
      },
      {
        fieldKey: 'specs',
        label: 'Specification / Model',
        type: 'text',
        placeholder: 'e.g. MacBook Pro 16" M3 Max 36GB',
        required: true,
      },
      {
        fieldKey: 'urgency',
        label: 'Urgency Level',
        type: 'select',
        required: true,
        options: [
          { label: 'Standard (1-2 Weeks)', value: 'standard' },
          { label: 'High (3-5 Days)', value: 'high' },
          { label: 'Critical / Replacement', value: 'critical' },
        ],
      },
      {
        fieldKey: 'justification',
        label: 'Business Need',
        type: 'textarea',
        placeholder: 'Why is this hardware needed for your project/role?',
        required: true,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        name: 'Manager Approval',
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'manager',
      },
      {
        stepNumber: 2,
        name: 'IT Operations Procurement',
        stepType: 'approval',
        assigneeType: 'role',
        assigneeRoleKey: 'admin',
      },
    ],
  },
];

/**
 * Seed Default Workflows for an Organization if none exist
 */
/**
 * Seed Default Workflows for an Organization if none exist
 */
const ensureDefaultWorkflows = async (organizationId, userId = null) => {
  const count = await Workflow.countDocuments({ organizationId });
  if (count === 0) {
    const roles = await Role.find({ organizationId });
    const roleMap = {};
    roles.forEach((r) => {
      roleMap[r.key] = r._id;
    });

    for (const tpl of DEFAULT_TEMPLATES) {
      const steps = tpl.steps.map((s) => ({
        ...s,
        assigneeRoleId: roleMap[s.assigneeRoleKey] || null,
      }));

      const wf = await Workflow.create({
        organizationId,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        icon: tpl.icon,
        status: 'active',
        formSchema: tpl.formSchema,
        steps,
        latestVersionNumber: 1,
        createdBy: userId,
      });

      const initialVer = await WorkflowVersion.create({
        organizationId,
        workflowId: wf._id,
        version: 1,
        status: 'published',
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        icon: tpl.icon,
        formSchema: tpl.formSchema,
        steps,
        changeSummary: 'Initial published version',
        createdBy: userId,
        publishedBy: userId,
        publishedAt: new Date(),
      });

      wf.currentVersionId = initialVer._id;
      wf.publishedVersionId = initialVer._id;
      await wf.save();
    }
  }
};

/**
 * Ensures legacy workflows have a corresponding WorkflowVersion
 */
const ensureWorkflowVersionSnapshot = async (workflow) => {
  if (!workflow.publishedVersionId && !workflow.currentVersionId) {
    const existing = await WorkflowVersion.findOne({ workflowId: workflow._id });
    if (existing) {
      workflow.currentVersionId = existing._id;
      if (existing.status === 'published') {
        workflow.publishedVersionId = existing._id;
      }
      await workflow.save();
      return existing;
    }

    const initialVer = await WorkflowVersion.create({
      organizationId: workflow.organizationId,
      workflowId: workflow._id,
      version: 1,
      status: workflow.status === 'draft' ? 'draft' : 'published',
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      icon: workflow.icon,
      formSchema: workflow.formSchema || [],
      steps: workflow.steps || [],
      changeSummary: 'Migrated to versioning system',
      createdBy: workflow.createdBy,
      publishedBy: workflow.status === 'draft' ? null : workflow.createdBy,
      publishedAt: workflow.status === 'draft' ? null : new Date(),
    });

    workflow.latestVersionNumber = 1;
    workflow.currentVersionId = initialVer._id;
    if (initialVer.status === 'published') {
      workflow.publishedVersionId = initialVer._id;
    }
    await workflow.save();
    return initialVer;
  }
  return null;
};

/**
 * Query Workflows with Search, Filters & Pagination
 */
const getWorkflows = async ({
  organizationId,
  search = '',
  status,
  category,
  page = 1,
  limit = 20,
}) => {
  // Ensure default templates exist
  await ensureDefaultWorkflows(organizationId);

  const query = { organizationId };

  if (status && ['active', 'draft', 'archived'].includes(status)) {
    query.status = status;
  } else {
    query.status = { $ne: 'archived' };
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [workflows, total] = await Promise.all([
    Workflow.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('currentVersionId')
      .populate('publishedVersionId')
      .populate('createdBy', 'firstName lastName email'),
    Workflow.countDocuments(query),
  ]);

  // Backfill version snapshots if any workflow is missing one
  for (const wf of workflows) {
    if (!wf.currentVersionId) {
      await ensureWorkflowVersionSnapshot(wf);
    }
  }

  return {
    data: workflows,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Get Single Workflow by ID (optionally resolved to specific version)
 */
const getWorkflowById = async ({ organizationId, workflowId, versionId = null, versionNumber = null }) => {
  const workflow = await Workflow.findOne({ _id: workflowId, organizationId })
    .populate('createdBy', 'firstName lastName email')
    .populate('currentVersionId')
    .populate('publishedVersionId')
    .populate('steps.assigneeRoleId', 'name key');

  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    error.code = 'WORKFLOW_NOT_FOUND';
    throw error;
  }

  await ensureWorkflowVersionSnapshot(workflow);

  let versionDoc = null;
  if (versionId) {
    versionDoc = await WorkflowVersion.findOne({ _id: versionId, workflowId, organizationId })
      .populate('createdBy', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email')
      .populate('steps.assigneeRoleId', 'name key');
  } else if (versionNumber) {
    versionDoc = await WorkflowVersion.findOne({ workflowId, organizationId, version: versionNumber })
      .populate('createdBy', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email')
      .populate('steps.assigneeRoleId', 'name key');
  } else {
    versionDoc = workflow.currentVersionId || workflow.publishedVersionId;
    if (!versionDoc) {
      versionDoc = await WorkflowVersion.findOne({ workflowId, organizationId }).sort({ version: -1 });
    }
  }

  return {
    workflow,
    version: versionDoc,
  };
};

/**
 * Returns all historical versions of a workflow
 */
const getWorkflowVersions = async ({ organizationId, workflowId }) => {
  const workflow = await Workflow.findOne({ _id: workflowId, organizationId });
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    error.code = 'WORKFLOW_NOT_FOUND';
    throw error;
  }

  const versions = await WorkflowVersion.find({ workflowId, organizationId })
    .sort({ version: -1 })
    .populate('createdBy', 'firstName lastName email')
    .populate('publishedBy', 'firstName lastName email');

  return versions;
};

/**
 * Create Workflow Parent & Initial v1 Version
 */
const createWorkflow = async ({ organizationId, data, userId }) => {
  const { name, description, category, icon, formSchema, formId, formVersionId, steps, nodes, edges, status, changeSummary } = data;

  if (!name || !name.trim()) {
    const error = new Error('Workflow name is required');
    error.statusCode = 400;
    error.code = 'MISSING_WORKFLOW_NAME';
    throw error;
  }

  // Format steps
  const formattedSteps = (steps || []).map((step, idx) => ({
    stepNumber: idx + 1,
    name: step.name || `Step ${idx + 1}`,
    stepType: step.stepType || 'approval',
    assigneeType: step.assigneeType || 'role',
    assigneeRoleKey: step.assigneeRoleKey || null,
    assigneeRoleId: step.assigneeRoleId || null,
    assigneeUserId: step.assigneeUserId || null,
    autoApproveHours: step.autoApproveHours || 0,
    slaHours: step.slaHours || 24,
    conditionLogic: step.conditionLogic || 'always',
    conditions: step.conditions || [],
    requireAll: step.requireAll || false,
  }));

  const initialStatus = status === 'draft' ? 'draft' : 'published';

  // 1. Create parent workflow
  const workflow = await Workflow.create({
    organizationId,
    name: name.trim(),
    description: description || '',
    category: category || 'general',
    icon: icon || '⚡',
    status: initialStatus === 'published' ? 'active' : 'draft',
    formSchema: formSchema || [],
    steps: formattedSteps,
    latestVersionNumber: 1,
    createdBy: userId,
  });

  // 2. Create initial v1 snapshot
  const initialVersion = await WorkflowVersion.create({
    organizationId,
    workflowId: workflow._id,
    version: 1,
    status: initialStatus,
    name: name.trim(),
    description: description || '',
    category: category || 'general',
    icon: icon || '⚡',
    formId: formId || null,
    formVersionId: formVersionId || null,
    formSchema: formSchema || [],
    steps: formattedSteps,
    nodes: nodes || [],
    edges: edges || [],
    changeSummary: changeSummary || (initialStatus === 'published' ? 'Initial published workflow' : 'Initial draft'),
    createdBy: userId,
    publishedBy: initialStatus === 'published' ? userId : null,
    publishedAt: initialStatus === 'published' ? new Date() : null,
  });

  workflow.currentVersionId = initialVersion._id;
  if (initialStatus === 'published') {
    workflow.publishedVersionId = initialVersion._id;
  }
  await workflow.save();

  return {
    workflow,
    version: initialVersion,
  };
};

/**
 * Creates a new sequential Draft version forked from an existing or published version
 */
const createWorkflowDraft = async ({ organizationId, workflowId, fromVersionId = null, userId }) => {
  const workflow = await Workflow.findOne({ _id: workflowId, organizationId });
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    error.code = 'WORKFLOW_NOT_FOUND';
    throw error;
  }

  // Check if open draft already exists
  const existingDraft = await WorkflowVersion.findOne({
    workflowId,
    organizationId,
    status: 'draft',
  }).populate('createdBy', 'firstName lastName email');

  if (existingDraft) {
    if (!fromVersionId || existingDraft._id.toString() === fromVersionId.toString()) {
      return {
        workflow,
        version: existingDraft,
        isExistingDraft: true,
      };
    }
  }

  // Resolve source version
  let sourceVer = null;
  if (fromVersionId) {
    sourceVer = await WorkflowVersion.findOne({ _id: fromVersionId, workflowId, organizationId });
  }
  if (!sourceVer && workflow.publishedVersionId) {
    sourceVer = await WorkflowVersion.findById(workflow.publishedVersionId);
  }
  if (!sourceVer) {
    sourceVer = await WorkflowVersion.findOne({ workflowId, organizationId }).sort({ version: -1 });
  }

  const nextVersionNumber = (workflow.latestVersionNumber || 0) + 1;

  const newDraft = await WorkflowVersion.create({
    organizationId,
    workflowId: workflow._id,
    version: nextVersionNumber,
    status: 'draft',
    name: sourceVer?.name || workflow.name,
    description: sourceVer?.description || workflow.description,
    category: sourceVer?.category || workflow.category,
    icon: sourceVer?.icon || workflow.icon,
    formId: sourceVer?.formId || null,
    formVersionId: sourceVer?.formVersionId || null,
    formSchema: sourceVer?.formSchema ? JSON.parse(JSON.stringify(sourceVer.formSchema)) : [],
    steps: sourceVer?.steps ? JSON.parse(JSON.stringify(sourceVer.steps)) : [],
    nodes: sourceVer?.nodes ? JSON.parse(JSON.stringify(sourceVer.nodes)) : [],
    edges: sourceVer?.edges ? JSON.parse(JSON.stringify(sourceVer.edges)) : [],
    changeSummary: `Draft v${nextVersionNumber} created from v${sourceVer?.version || 1}`,
    createdBy: userId,
    publishedBy: null,
    publishedAt: null,
  });

  workflow.latestVersionNumber = nextVersionNumber;
  workflow.currentVersionId = newDraft._id;
  workflow.updatedBy = userId;
  await workflow.save();

  return {
    workflow,
    version: newDraft,
    isExistingDraft: false,
  };
};

/**
 * Updates an editable draft version
 * BACKEND IMMUTABILITY ENFORCEMENT: Rejects changes to published versions with 409 Conflict
 */
const updateWorkflowDraft = async ({ organizationId, workflowId, versionId, updateData, userId }) => {
  const version = await WorkflowVersion.findOne({ _id: versionId, workflowId, organizationId });

  if (!version) {
    const error = new Error('Workflow version not found');
    error.statusCode = 404;
    error.code = 'VERSION_NOT_FOUND';
    throw error;
  }

  // Enforce Immutability
  if (version.status === 'published') {
    const error = new Error('Published versions cannot be modified. Create a new version.');
    error.statusCode = 409;
    error.code = 'PUBLISHED_VERSION_IMMUTABLE';
    throw error;
  }

  if (version.status === 'archived') {
    const error = new Error('Archived versions cannot be modified.');
    error.statusCode = 409;
    error.code = 'ARCHIVED_VERSION_IMMUTABLE';
    throw error;
  }

  const { name, description, category, icon, formSchema, formId, formVersionId, steps, nodes, edges, changeSummary } = updateData;

  if (name) version.name = name.trim();
  if (description !== undefined) version.description = description;
  if (category) version.category = category;
  if (icon) version.icon = icon;
  if (formId !== undefined) version.formId = formId;
  if (formVersionId !== undefined) version.formVersionId = formVersionId;
  if (formSchema !== undefined) version.formSchema = formSchema;
  if (nodes !== undefined) version.nodes = nodes;
  if (edges !== undefined) version.edges = edges;
  if (changeSummary !== undefined) version.changeSummary = changeSummary.trim();

  if (Array.isArray(steps) && steps.length > 0) {
    version.steps = steps.map((step, idx) => ({
      stepNumber: idx + 1,
      name: step.name || `Step ${idx + 1}`,
      stepType: step.stepType || 'approval',
      assigneeType: step.assigneeType || 'role',
      assigneeRoleKey: step.assigneeRoleKey || null,
      assigneeRoleId: step.assigneeRoleId || null,
      assigneeUserId: step.assigneeUserId || null,
      autoApproveHours: step.autoApproveHours || 0,
      slaHours: step.slaHours || 24,
      conditionLogic: step.conditionLogic || 'always',
      conditions: step.conditions || [],
      requireAll: step.requireAll || false,
    }));
  }

  await version.save();

  // Sync parent metadata
  await Workflow.findByIdAndUpdate(workflowId, {
    name: version.name,
    description: version.description,
    category: version.category,
    icon: version.icon,
    formSchema: version.formSchema,
    steps: version.steps,
    updatedBy: userId,
  });

  return version;
};

/**
 * Checks compatibility between workflow condition fields and the referenced form version
 */
const checkFormWorkflowCompatibility = ({ formFields = [], steps = [] }) => {
  const formKeySet = new Set(formFields.map((f) => f.fieldKey.toLowerCase()));
  const missingConditionFields = [];

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

  return {
    isCompatible: missingConditionFields.length === 0,
    missingConditionFields,
  };
};

/**
 * Publishes a draft workflow version and makes it the active published standard
 */
const publishWorkflowVersion = async ({ organizationId, workflowId, versionId, userId, changeSummary = '' }) => {
  const version = await WorkflowVersion.findOne({ _id: versionId, workflowId, organizationId });

  if (!version) {
    const error = new Error('Workflow version not found');
    error.statusCode = 404;
    error.code = 'VERSION_NOT_FOUND';
    throw error;
  }

  if (version.status === 'published') {
    return version;
  }

  // Validate form compatibility if formVersion is pinned
  if (version.formVersionId) {
    const formVer = await FormVersion.findById(version.formVersionId);
    if (formVer) {
      const compat = checkFormWorkflowCompatibility({
        formFields: formVer.fields || [],
        steps: version.steps || [],
      });

      if (!compat.isCompatible) {
        const missing = compat.missingConditionFields.map((m) => `Field "${m.missingField}" in Step ${m.stepNumber}`).join(', ');
        const error = new Error(`Form compatibility error: The referenced Form Version is missing fields used in conditions (${missing}).`);
        error.statusCode = 400;
        error.code = 'FORM_INCOMPATIBLE';
        error.details = compat.missingConditionFields;
        throw error;
      }
    }
  }

  // Archive prior published versions
  await WorkflowVersion.updateMany(
    { workflowId, organizationId, status: 'published', _id: { $ne: versionId } },
    { status: 'archived' }
  );

  // Publish target version
  version.status = 'published';
  version.publishedBy = userId;
  version.publishedAt = new Date();
  if (changeSummary && changeSummary.trim()) {
    version.changeSummary = changeSummary.trim();
  }
  await version.save();

  // Update parent workflow pointers and live steps/formSchema
  await Workflow.findByIdAndUpdate(workflowId, {
    publishedVersionId: version._id,
    currentVersionId: version._id,
    status: 'active',
    name: version.name,
    description: version.description,
    category: version.category,
    icon: version.icon,
    formSchema: version.formSchema,
    steps: version.steps,
    updatedBy: userId,
  });

  return version;
};

/**
 * Discards an un-published draft workflow version
 */
const discardWorkflowDraft = async ({ organizationId, workflowId, versionId }) => {
  const version = await WorkflowVersion.findOne({ _id: versionId, workflowId, organizationId });

  if (!version) {
    const error = new Error('Workflow version not found');
    error.statusCode = 404;
    error.code = 'VERSION_NOT_FOUND';
    throw error;
  }

  if (version.status === 'published') {
    const error = new Error('Cannot discard a published version. Published versions are immutable.');
    error.statusCode = 400;
    error.code = 'CANNOT_DISCARD_PUBLISHED';
    throw error;
  }

  await WorkflowVersion.findByIdAndDelete(versionId);

  // Fallback parent currentVersionId
  const workflow = await Workflow.findById(workflowId);
  if (workflow && workflow.currentVersionId?.toString() === versionId.toString()) {
    const latestRemaining = await WorkflowVersion.findOne({ workflowId, organizationId }).sort({ version: -1 });
    workflow.currentVersionId = workflow.publishedVersionId || (latestRemaining ? latestRemaining._id : null);
    await workflow.save();
  }

  return { success: true, discardedVersionNumber: version.version };
};

/**
 * Compares two workflow version snapshots
 */
const compareWorkflowVersions = async ({ organizationId, workflowId, v1Id, v2Id }) => {
  const [v1, v2] = await Promise.all([
    WorkflowVersion.findOne({ _id: v1Id, workflowId, organizationId }),
    WorkflowVersion.findOne({ _id: v2Id, workflowId, organizationId }),
  ]);

  if (!v1 || !v2) {
    const error = new Error('Both workflow versions must exist to compare');
    error.statusCode = 404;
    error.code = 'VERSION_NOT_FOUND';
    throw error;
  }

  const v1StepMap = new Map((v1.steps || []).map((s) => [s.stepNumber, s]));
  const v2StepMap = new Map((v2.steps || []).map((s) => [s.stepNumber, s]));

  const addedStages = [];
  const removedStages = [];
  const modifiedStages = [];

  for (const [stepNum, s2] of v2StepMap.entries()) {
    if (!v1StepMap.has(stepNum)) {
      addedStages.push(s2);
    } else {
      const s1 = v1StepMap.get(stepNum);
      const changes = [];
      if (s1.name !== s2.name) changes.push({ property: 'name', from: s1.name, to: s2.name });
      if (s1.stepType !== s2.stepType) changes.push({ property: 'stepType', from: s1.stepType, to: s2.stepType });
      if (s1.assigneeRoleKey !== s2.assigneeRoleKey) changes.push({ property: 'role', from: s1.assigneeRoleKey, to: s2.assigneeRoleKey });
      if (s1.slaHours !== s2.slaHours) changes.push({ property: 'slaHours', from: s1.slaHours, to: s2.slaHours });
      if (s1.conditionLogic !== s2.conditionLogic) changes.push({ property: 'conditionLogic', from: s1.conditionLogic, to: s2.conditionLogic });

      if (changes.length > 0) {
        modifiedStages.push({
          stepNumber: stepNum,
          name: s2.name,
          changes,
        });
      }
    }
  }

  for (const [stepNum, s1] of v1StepMap.entries()) {
    if (!v2StepMap.has(stepNum)) {
      removedStages.push(s1);
    }
  }

  return {
    baseVersion: { id: v1._id, version: v1.version, status: v1.status },
    targetVersion: { id: v2._id, version: v2.version, status: v2.status },
    diff: {
      addedStages,
      removedStages,
      modifiedStages,
      hasChanges: addedStages.length > 0 || removedStages.length > 0 || modifiedStages.length > 0,
    },
  };
};

/**
 * Update Workflow (Legacy / Draft bridge)
 */
const updateWorkflow = async ({ organizationId, workflowId, updateData, userId }) => {
  const workflow = await Workflow.findOne({ _id: workflowId, organizationId });
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    error.code = 'WORKFLOW_NOT_FOUND';
    throw error;
  }

  // If workflow has active draft version, update the draft version
  if (workflow.currentVersionId) {
    const activeDraft = await WorkflowVersion.findOne({ _id: workflow.currentVersionId, status: 'draft' });
    if (activeDraft) {
      return await updateWorkflowDraft({ organizationId, workflowId, versionId: activeDraft._id, updateData, userId });
    }
  }

  // If published, fork a new draft version automatically
  const { version: newDraft } = await createWorkflowDraft({ organizationId, workflowId, userId });
  return await updateWorkflowDraft({ organizationId, workflowId, versionId: newDraft._id, updateData, userId });
};

/**
 * Delete (Archive) Workflow
 */
const deleteWorkflow = async ({ organizationId, workflowId }) => {
  const workflow = await Workflow.findOne({ _id: workflowId, organizationId });
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    error.code = 'WORKFLOW_NOT_FOUND';
    throw error;
  }

  workflow.status = 'archived';
  await workflow.save();

  // Archive versions
  await WorkflowVersion.updateMany({ workflowId, organizationId }, { status: 'archived' });

  return { message: 'Workflow archived successfully' };
};

/**
 * Evaluates whether a workflow step condition is met against submitted form data
 */
const evaluateStepConditions = (step, formData = {}) => {
  if (!step) return true;
  if (!step.conditions || step.conditions.length === 0 || step.conditionLogic === 'always') {
    return true;
  }

  const evaluateSingle = (condition) => {
    if (!condition || !condition.field) return true;
    const rawValue = formData[condition.field];
    const targetValue = condition.value;

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return false;
    }

    const numRaw = parseFloat(rawValue);
    const numTarget = parseFloat(targetValue);
    const isNumeric = !isNaN(numRaw) && !isNaN(numTarget);

    let match = false;
    switch (condition.operator) {
      case 'gt':
        match = isNumeric ? numRaw > numTarget : String(rawValue) > String(targetValue);
        break;
      case 'gte':
        match = isNumeric ? numRaw >= numTarget : String(rawValue) >= String(targetValue);
        break;
      case 'lt':
        match = isNumeric ? numRaw < numTarget : String(rawValue) < String(targetValue);
        break;
      case 'lte':
        match = isNumeric ? numRaw <= numTarget : String(rawValue) <= String(targetValue);
        break;
      case 'eq':
        match = isNumeric
          ? numRaw === numTarget
          : String(rawValue).toLowerCase().trim() === String(targetValue).toLowerCase().trim();
        break;
      case 'neq':
        match = isNumeric
          ? numRaw !== numTarget
          : String(rawValue).toLowerCase().trim() !== String(targetValue).toLowerCase().trim();
        break;
      case 'contains':
        match = String(rawValue).toLowerCase().includes(String(targetValue).toLowerCase().trim());
        break;
      default:
        match = true;
    }

    return condition.action === 'skip' ? !match : match;
  };

  if (step.conditionLogic === 'any') {
    return step.conditions.some((c) => evaluateSingle(c));
  } else {
    return step.conditions.every((c) => evaluateSingle(c));
  }
};

/**
 * Augment an approval or request item with live SLA calculations
 */
const enrichWithSla = (item) => {
  if (!item) return item;
  const rawObj = item.toObject ? item.toObject() : { ...item };
  const dueAt = rawObj.dueAt ? new Date(rawObj.dueAt) : null;

  if (!dueAt) {
    return {
      ...rawObj,
      slaStatus: 'on_track',
      hoursRemaining: null,
      timeRemainingText: 'No SLA Target',
    };
  }

  if (['approved', 'rejected', 'cancelled', 'skipped'].includes(rawObj.status)) {
    return {
      ...rawObj,
      slaStatus: 'completed',
      hoursRemaining: null,
      timeRemainingText: 'Completed',
    };
  }

  const now = Date.now();
  const diffMs = dueAt.getTime() - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    return {
      ...rawObj,
      slaStatus: 'breached',
      hoursRemaining: diffHours,
      timeRemainingText: overdueHours <= 1 ? 'Overdue (<1h)' : `Overdue by ${overdueHours}h`,
    };
  } else if (diffHours <= 6) {
    const hours = Math.floor(diffHours);
    const mins = Math.round((diffHours - hours) * 60);
    return {
      ...rawObj,
      slaStatus: 'approaching_breach',
      hoursRemaining: diffHours,
      timeRemainingText: hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`,
    };
  } else {
    const hours = Math.round(diffHours);
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return {
      ...rawObj,
      slaStatus: 'on_track',
      hoursRemaining: diffHours,
      timeRemainingText: days > 0 ? `${days}d ${remHours}h left` : `${hours}h left`,
    };
  }
};

/**
 * Submit a Request against a Workflow
 */
const submitWorkflowRequest = async ({
  organizationId,
  workflowId,
  formData = {},
  requesterId,
  user,
}) => {
  const workflow = await Workflow.findOne({ _id: workflowId, organizationId, status: 'active' });
  if (!workflow) {
    const error = new Error('Active workflow not found');
    error.statusCode = 404;
    error.code = 'WORKFLOW_NOT_FOUND';
    throw error;
  }

  // Validate required form fields
  for (const field of workflow.formSchema || []) {
    if (field.required) {
      const val = formData[field.fieldKey];
      if (val === undefined || val === null || val === '') {
        const error = new Error(`Field "${field.label}" is required`);
        error.statusCode = 400;
        error.code = 'MISSING_REQUIRED_FIELD';
        throw error;
      }
    }
  }

  const requestCode = await generateRequestCode(organizationId);
  const title =
    formData.expenseTitle ||
    formData.specs ||
    formData.leaveType ||
    formData.request_title ||
    `${workflow.name} Request`;

  const totalSteps = workflow.steps?.length || 1;
  const history = [
    {
      stepNumber: 1,
      stepName: 'Submission',
      action: 'submitted',
      actorId: requesterId,
      actorName: `${user.firstName} ${user.lastName}`,
      actorEmail: user.email,
      comment: 'Request submitted for review',
      timestamp: new Date(),
    },
  ];

  // Evaluate conditions starting from step 1 to find first active stage
  let activeStep = null;
  const allSteps = workflow.steps || [];

  for (let i = 0; i < allSteps.length; i++) {
    const candidate = allSteps[i];
    const isConditionMet = evaluateStepConditions(candidate, formData);

    if (isConditionMet) {
      activeStep = candidate;
      break;
    } else {
      // Record stage skip in audit history
      history.push({
        stepNumber: candidate.stepNumber,
        stepName: candidate.name,
        action: 'skipped',
        actorId: requesterId,
        actorName: 'Workflow Engine',
        actorEmail: 'system@nexus.internal',
        comment: `Stage skipped automatically (Conditions not met: ${candidate.conditions?.map((c) => `${c.field} ${c.operator} ${c.value}`).join(', ') || 'Rule'})`,
        timestamp: new Date(),
      });
    }
  }

  // If no step matched conditions (all skipped): auto-approve request!
  if (!activeStep) {
    const request = await WorkflowRequest.create({
      organizationId,
      workflowId: workflow._id,
      requesterId,
      requestCode,
      title: `${title} (${requestCode})`,
      formData,
      status: 'approved',
      currentStepNumber: totalSteps,
      totalSteps,
      history,
      completedAt: new Date(),
    });
    return enrichWithSla(request);
  }

  const slaHours = activeStep.slaHours || 24;
  const dueAt = new Date(Date.now() + slaHours * 3600000);

  // Create Request Record with active initial step
  const request = await WorkflowRequest.create({
    organizationId,
    workflowId: workflow._id,
    requesterId,
    requestCode,
    title: `${title} (${requestCode})`,
    formData,
    status: 'pending',
    currentStepNumber: activeStep.stepNumber,
    totalSteps,
    dueAt,
    slaHours,
    history,
  });

  // Create Step Approval Ticket with SLA dueAt
  await WorkflowApproval.create({
    organizationId,
    requestId: request._id,
    workflowId: workflow._id,
    stepNumber: activeStep.stepNumber,
    stepName: activeStep.name,
    assignedRoleKey: activeStep.assigneeRoleKey || null,
    assignedRoleId: activeStep.assigneeRoleId || null,
    assignedUserId: activeStep.assigneeUserId || null,
    dueAt,
    slaHours,
    status: 'pending',
  });

  return enrichWithSla(request);
};

/**
 * Process Approval Decision (Approve / Reject)
 */
const processApprovalDecision = async ({
  organizationId,
  approvalId,
  decision,
  comment = '',
  user,
  userRole,
  isOwner,
}) => {
  if (!['approved', 'rejected'].includes(decision)) {
    const error = new Error('Decision must be either "approved" or "rejected"');
    error.statusCode = 400;
    error.code = 'INVALID_DECISION';
    throw error;
  }

  const approval = await WorkflowApproval.findOne({
    _id: approvalId,
    organizationId,
    status: 'pending',
  });

  if (!approval) {
    const error = new Error('Pending approval task not found');
    error.statusCode = 404;
    error.code = 'APPROVAL_NOT_FOUND';
    throw error;
  }

  const request = await WorkflowRequest.findOne({
    _id: approval.requestId,
    organizationId,
  }).populate('workflowId');

  if (!request) {
    const error = new Error('Associated request not found');
    error.statusCode = 404;
    error.code = 'REQUEST_NOT_FOUND';
    throw error;
  }

  // Verify Authority
  let isAuthorized = isOwner || userRole === 'owner' || userRole === 'admin';
  if (!isAuthorized) {
    if (approval.assignedUserId && approval.assignedUserId.toString() === user._id.toString()) {
      isAuthorized = true;
    } else if (approval.assignedRoleKey && (userRole === approval.assignedRoleKey || userRole === 'admin')) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    const error = new Error('You do not have permission to approve/reject this request');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_APPROVAL';
    throw error;
  }

  // Update current approval
  approval.status = decision;
  approval.decidedBy = user._id;
  approval.comment = comment.trim();
  approval.decidedAt = new Date();
  approval.slaStatus = 'completed';
  await approval.save();

  const historyEntry = {
    stepNumber: approval.stepNumber,
    stepName: approval.stepName,
    action: decision,
    actorId: user._id,
    actorName: `${user.firstName} ${user.lastName}`,
    actorEmail: user.email,
    comment: comment.trim() || `Step ${approval.stepNumber} ${decision}`,
    timestamp: new Date(),
  };

  if (decision === 'rejected') {
    request.status = 'rejected';
    request.completedAt = new Date();
    request.history.push(historyEntry);
    await request.save();

    return {
      message: 'Request rejected',
      request: enrichWithSla(request),
      approval: enrichWithSla(approval),
    };
  }

  // If Approved: Evaluate next steps (skipping stages that do not meet conditions)
  const workflow = request.workflowId;
  const allSteps = workflow?.steps || [];
  let nextStep = null;

  for (let sNum = approval.stepNumber + 1; sNum <= allSteps.length; sNum++) {
    const candidate = allSteps.find((s) => s.stepNumber === sNum);
    if (!candidate) continue;

    const isConditionMet = evaluateStepConditions(candidate, request.formData);
    if (isConditionMet) {
      nextStep = candidate;
      break;
    } else {
      // Auto-skip stage and record in history
      historyEntry.comment += ` → Stage ${candidate.stepNumber} skipped (conditions not met)`;
      request.history.push({
        stepNumber: candidate.stepNumber,
        stepName: candidate.name,
        action: 'skipped',
        actorId: user._id,
        actorName: 'Workflow Engine',
        actorEmail: 'system@nexus.internal',
        comment: `Stage skipped automatically (Conditions not met: ${candidate.conditions?.map((c) => `${c.field} ${c.operator} ${c.value}`).join(', ') || 'Rule'})`,
        timestamp: new Date(),
      });
    }
  }

  if (nextStep) {
    const nextSlaHours = nextStep.slaHours || 24;
    const nextDueAt = new Date(Date.now() + nextSlaHours * 3600000);

    request.currentStepNumber = nextStep.stepNumber;
    request.status = 'in_progress';
    request.dueAt = nextDueAt;
    request.slaHours = nextSlaHours;
    request.history.push(historyEntry);
    await request.save();

    // Create Approval Task for Next Step with SLA
    const nextApproval = await WorkflowApproval.create({
      organizationId,
      requestId: request._id,
      workflowId: workflow._id,
      stepNumber: nextStep.stepNumber,
      stepName: nextStep.name,
      assignedRoleKey: nextStep.assigneeRoleKey || null,
      assignedRoleId: nextStep.assigneeRoleId || null,
      assignedUserId: nextStep.assigneeUserId || null,
      dueAt: nextDueAt,
      slaHours: nextSlaHours,
      status: 'pending',
    });

    return {
      message: `Step ${approval.stepNumber} approved. Advanced to ${nextStep.name}.`,
      request: enrichWithSla(request),
      approval: enrichWithSla(approval),
      nextApproval: enrichWithSla(nextApproval),
    };
  }

  // Final Step Approved: Workflow complete!
  request.status = 'approved';
  request.completedAt = new Date();
  request.history.push(historyEntry);
  await request.save();

  return {
    message: 'Request fully approved and completed!',
    request: enrichWithSla(request),
    approval: enrichWithSla(approval),
  };
};

/**
 * Get Organization Requests List
 */
const getRequests = async ({
  organizationId,
  userId,
  userRole,
  isOwner,
  status,
  scope = 'all',
  page = 1,
  limit = 20,
}) => {
  const query = { organizationId };

  // If user is regular member or scope is 'mine', filter by requester
  if (scope === 'mine' || (!isOwner && userRole !== 'admin' && userRole !== 'manager' && userRole !== 'approver')) {
    query.requesterId = userId;
  }

  if (status && ['pending', 'in_progress', 'approved', 'rejected', 'cancelled'].includes(status)) {
    query.status = status;
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [requests, total] = await Promise.all([
    WorkflowRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('workflowId', 'name category icon')
      .populate('requesterId', 'firstName lastName email'),
    WorkflowRequest.countDocuments(query),
  ]);

  return {
    data: requests.map((r) => enrichWithSla(r)),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Get Single Request Details with History & Active Approvals
 */
const getRequestById = async ({ organizationId, requestId }) => {
  const request = await WorkflowRequest.findOne({ _id: requestId, organizationId })
    .populate('workflowId')
    .populate('requesterId', 'firstName lastName email');

  if (!request) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    error.code = 'REQUEST_NOT_FOUND';
    throw error;
  }

  const approvals = await WorkflowApproval.find({ requestId, organizationId })
    .sort({ stepNumber: 1 })
    .populate('decidedBy', 'firstName lastName email');

  return {
    request: enrichWithSla(request),
    approvals: approvals.map((a) => enrichWithSla(a)),
  };
};

/**
 * Cancel Request
 */
const cancelRequest = async ({ organizationId, requestId, userId, isOwner, userRole }) => {
  const request = await WorkflowRequest.findOne({ _id: requestId, organizationId });
  if (!request) {
    const error = new Error('Request not found');
    error.statusCode = 404;
    error.code = 'REQUEST_NOT_FOUND';
    throw error;
  }

  const canCancel =
    isOwner ||
    userRole === 'admin' ||
    request.requesterId.toString() === userId.toString();

  if (!canCancel) {
    const error = new Error('You cannot cancel this request');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_CANCEL';
    throw error;
  }

  if (['approved', 'rejected', 'cancelled'].includes(request.status)) {
    const error = new Error(`Cannot cancel a request that is already ${request.status}`);
    error.statusCode = 400;
    error.code = 'INVALID_CANCEL_STATE';
    throw error;
  }

  request.status = 'cancelled';
  request.completedAt = new Date();
  request.history.push({
    stepNumber: request.currentStepNumber,
    stepName: 'Cancelled',
    action: 'cancelled',
    actorId: userId,
    comment: 'Request cancelled by user',
    timestamp: new Date(),
  });
  await request.save();

  // Mark any pending approvals as skipped
  await WorkflowApproval.updateMany(
    { requestId, organizationId, status: 'pending' },
    { status: 'skipped', decidedAt: new Date() }
  );

  return { message: 'Request cancelled successfully', request: enrichWithSla(request) };
};

/**
 * Get Approvals Queue (Pending & Decided)
 */
const getApprovals = async ({
  organizationId,
  userId,
  userRole,
  isOwner,
  status = 'pending',
  page = 1,
  limit = 20,
}) => {
  const query = { organizationId };

  if (status) {
    query.status = status;
  }

  // Filter tasks relevant to current user
  if (!isOwner && userRole !== 'owner' && userRole !== 'admin') {
    query.$or = [
      { assignedUserId: userId },
      { assignedRoleKey: userRole },
    ];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [approvals, total] = await Promise.all([
    WorkflowApproval.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate({
        path: 'requestId',
        populate: {
          path: 'requesterId',
          select: 'firstName lastName email',
        },
      })
      .populate('workflowId', 'name category icon')
      .populate('decidedBy', 'firstName lastName email'),
    WorkflowApproval.countDocuments(query),
  ]);

  return {
    data: approvals.map((a) => enrichWithSla(a)),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

module.exports = {
  DEFAULT_TEMPLATES,
  ensureDefaultWorkflows,
  getWorkflows,
  getWorkflowById,
  getWorkflowVersions,
  createWorkflow,
  createWorkflowDraft,
  updateWorkflow,
  updateWorkflowDraft,
  publishWorkflowVersion,
  discardWorkflowDraft,
  compareWorkflowVersions,
  checkFormWorkflowCompatibility,
  deleteWorkflow,
  submitWorkflowRequest,
  processApprovalDecision,
  getRequests,
  getRequestById,
  cancelRequest,
  getApprovals,
};
