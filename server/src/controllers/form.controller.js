const formService = require('../services/form.service');

/**
 * Lists organization forms
 */
const getForms = async (req, res, next) => {
  try {
    const { category, search, page, limit } = req.query;
    const organizationId = req.organization._id;

    const result = await formService.getForms({
      organizationId,
      category,
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets single form along with active or requested version
 */
const getFormById = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { versionId, versionNumber } = req.query;
    const organizationId = req.organization._id;

    const result = await formService.getFormById({
      organizationId,
      formId,
      versionId,
      versionNumber: versionNumber ? parseInt(versionNumber, 10) : null,
    });

    res.status(200).json({
      success: true,
      data: result.form,
      version: result.version,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all version history for a form
 */
const getFormVersions = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const organizationId = req.organization._id;

    const versions = await formService.getFormVersions({
      organizationId,
      formId,
    });

    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new Form and initial v1 version
 */
const createForm = async (req, res, next) => {
  try {
    const organizationId = req.organization._id;
    const userId = req.user._id;
    const { publishImmediately } = req.query;

    const result = await formService.createForm({
      organizationId,
      userId,
      data: req.body,
      publishImmediately: publishImmediately === 'true' || req.body.status === 'published',
    });

    res.status(201).json({
      success: true,
      data: result.form,
      version: result.version,
      message: 'Form created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new sequential Draft version forked from an existing or published version
 */
const createFormDraft = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { fromVersionId } = req.body;
    const organizationId = req.organization._id;
    const userId = req.user._id;

    const result = await formService.createFormDraft({
      organizationId,
      formId,
      fromVersionId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: result.form,
      version: result.version,
      isExistingDraft: result.isExistingDraft,
      message: result.isExistingDraft ? 'Resumed existing draft' : 'New draft version created',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a draft version (Protected by immutability guard)
 */
const updateFormDraft = async (req, res, next) => {
  try {
    const { formId, versionId } = req.params;
    const organizationId = req.organization._id;
    const userId = req.user._id;

    const version = await formService.updateFormDraft({
      organizationId,
      formId,
      versionId,
      data: req.body,
      userId,
    });

    res.status(200).json({
      success: true,
      data: version,
      message: 'Draft saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publishes a draft form version
 */
const publishFormVersion = async (req, res, next) => {
  try {
    const { formId, versionId } = req.params;
    const { changeSummary } = req.body;
    const organizationId = req.organization._id;
    const userId = req.user._id;

    const version = await formService.publishFormVersion({
      organizationId,
      formId,
      versionId,
      userId,
      changeSummary,
    });

    res.status(200).json({
      success: true,
      data: version,
      message: `Version v${version.version} published successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Discards an un-published draft
 */
const discardFormDraft = async (req, res, next) => {
  try {
    const { formId, versionId } = req.params;
    const organizationId = req.organization._id;

    const result = await formService.discardFormDraft({
      organizationId,
      formId,
      versionId,
    });

    res.status(200).json({
      success: true,
      ...result,
      message: 'Draft discarded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compares two form versions
 */
const compareFormVersions = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { v1, v2 } = req.query;
    const organizationId = req.organization._id;

    const diff = await formService.compareFormVersions({
      organizationId,
      formId,
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

module.exports = {
  getForms,
  getFormById,
  getFormVersions,
  createForm,
  createFormDraft,
  updateFormDraft,
  publishFormVersion,
  discardFormDraft,
  compareFormVersions,
};
