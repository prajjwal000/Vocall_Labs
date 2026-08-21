const workflowService = require('../services/workflow.service');
const aiWorkflowService = require('../services/aiWorkflow.service');

// -------------------------------------------------------------
// AI WORKFLOW SYNTHESIS
// -------------------------------------------------------------

const generateAiWorkflow = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const aiSettings = req.organization.settings?.aiConfig || {};

    const result = await aiWorkflowService.generateWorkflowFromPrompt({
      prompt,
      provider: aiSettings.provider || 'gemini',
      apiKey: aiSettings.apiKey || '',
      model: aiSettings.model || 'gemini-1.5-flash',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// WORKFLOW DEFINITIONS
// -------------------------------------------------------------

const getWorkflows = async (req, res, next) => {
  try {
    const { search, status, category, page, limit } = req.query;
    const result = await workflowService.getWorkflows({
      organizationId: req.organization._id,
      search,
      status,
      category,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflowById = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { versionId, versionNumber } = req.query;

    const result = await workflowService.getWorkflowById({
      organizationId: req.organization._id,
      workflowId,
      versionId,
      versionNumber: versionNumber ? parseInt(versionNumber, 10) : null,
    });

    res.status(200).json({
      success: true,
      data: result.workflow,
      version: result.version,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkflowVersions = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const versions = await workflowService.getWorkflowVersions({
      organizationId: req.organization._id,
      workflowId,
    });

    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

const createWorkflowDraft = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { fromVersionId } = req.body;

    const result = await workflowService.createWorkflowDraft({
      organizationId: req.organization._id,
      workflowId,
      fromVersionId,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: result.workflow,
      version: result.version,
      isExistingDraft: result.isExistingDraft,
      message: result.isExistingDraft ? 'Resumed existing draft' : 'New draft version created',
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkflowDraft = async (req, res, next) => {
  try {
    const { workflowId, versionId } = req.params;

    const version = await workflowService.updateWorkflowDraft({
      organizationId: req.organization._id,
      workflowId,
      versionId,
      updateData: req.body,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: version,
      message: 'Workflow draft saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const publishWorkflowVersion = async (req, res, next) => {
  try {
    const { workflowId, versionId } = req.params;
    const { changeSummary } = req.body;

    const version = await workflowService.publishWorkflowVersion({
      organizationId: req.organization._id,
      workflowId,
      versionId,
      userId: req.user._id,
      changeSummary,
    });

    res.status(200).json({
      success: true,
      data: version,
      message: `Workflow v${version.version} published successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const discardWorkflowDraft = async (req, res, next) => {
  try {
    const { workflowId, versionId } = req.params;

    const result = await workflowService.discardWorkflowDraft({
      organizationId: req.organization._id,
      workflowId,
      versionId,
    });

    res.status(200).json({
      success: true,
      ...result,
      message: 'Workflow draft discarded',
    });
  } catch (error) {
    next(error);
  }
};

const compareWorkflowVersions = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { v1, v2 } = req.query;

    const diff = await workflowService.compareWorkflowVersions({
      organizationId: req.organization._id,
      workflowId,
      v1Id: v1,
      v2Id: v2,
    });

    res.status(200).json({
      success: true,
      ...diff,
    });
  } catch (error) {
    next(error);
  }
};

const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow({
      organizationId: req.organization._id,
      data: req.body,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

const updateWorkflow = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const workflow = await workflowService.updateWorkflow({
      organizationId: req.organization._id,
      workflowId,
      updateData: req.body,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Workflow updated successfully',
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkflow = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const result = await workflowService.deleteWorkflow({
      organizationId: req.organization._id,
      workflowId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// REQUESTS & EXECUTIONS
// -------------------------------------------------------------

const submitRequest = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const { formData } = req.body;

    const request = await workflowService.submitWorkflowRequest({
      organizationId: req.organization._id,
      workflowId,
      formData: formData || req.body,
      requesterId: req.user._id,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully and queued for approval',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

const getRequests = async (req, res, next) => {
  try {
    const { status, scope, page, limit } = req.query;
    const isOwner = req.userRole === 'owner' || req.organization.ownerId?.toString() === req.user._id.toString();

    const result = await workflowService.getRequests({
      organizationId: req.organization._id,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
      status,
      scope,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const result = await workflowService.getRequestById({
      organizationId: req.organization._id,
      requestId,
    });

    res.status(200).json({
      success: true,
      data: result.request,
      approvals: result.approvals,
    });
  } catch (error) {
    next(error);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const isOwner = req.userRole === 'owner' || req.organization.ownerId?.toString() === req.user._id.toString();

    const result = await workflowService.cancelRequest({
      organizationId: req.organization._id,
      requestId,
      userId: req.user._id,
      isOwner,
      userRole: req.userRole,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.request,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// APPROVALS
// -------------------------------------------------------------

const getApprovals = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const isOwner = req.userRole === 'owner' || req.organization.ownerId?.toString() === req.user._id.toString();

    const result = await workflowService.getApprovals({
      organizationId: req.organization._id,
      userId: req.user._id,
      userRole: req.userRole,
      isOwner,
      status,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const decideApproval = async (req, res, next) => {
  try {
    const { approvalId } = req.params;
    const { decision, comment } = req.body;
    const isOwner = req.userRole === 'owner' || req.organization.ownerId?.toString() === req.user._id.toString();

    const result = await workflowService.processApprovalDecision({
      organizationId: req.organization._id,
      approvalId,
      decision,
      comment,
      user: req.user,
      userRole: req.userRole,
      isOwner,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.request,
      approval: result.approval,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAiWorkflow,
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
  deleteWorkflow,
  submitRequest,
  getRequests,
  getRequestById,
  cancelRequest,
  getApprovals,
  decideApproval,
};
