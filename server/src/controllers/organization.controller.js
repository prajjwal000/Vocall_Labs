const organizationService = require('../services/organization.service');

/**
 * Create a new organization
 * POST /api/organizations
 */
const createOrganization = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const organization = await organizationService.createOrganization({
      name,
      description,
      ownerId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List organizations for the authenticated user
 * GET /api/organizations
 */
const getUserOrganizations = async (req, res, next) => {
  try {
    const organizations = await organizationService.getUserOrganizations(req.user._id);

    res.status(200).json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get organization by ID
 * GET /api/organizations/:organizationId
 */
const getOrganizationById = async (req, res, next) => {
  try {
    const organization = await organizationService.getOrganizationById({
      organization: req.organization,
      membership: req.membership,
    });

    res.status(200).json({
      success: true,
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update organization settings
 * PATCH /api/organizations/:organizationId
 */
const updateOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.updateOrganization({
      organization: req.organization,
      userRole: req.userRole,
      updateData: req.body,
    });

    res.status(200).json({
      success: true,
      data: {
        organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete (soft-delete) organization
 * DELETE /api/organizations/:organizationId
 */
const deleteOrganization = async (req, res, next) => {
  try {
    const result = await organizationService.deleteOrganization({
      organization: req.organization,
      userRole: req.userRole,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const { validateAiConnection } = require('../services/aiWorkflow.service');

/**
 * Test AI Provider API Connection
 * POST /api/organizations/:organizationId/ai/test
 */
const testAiConnection = async (req, res, next) => {
  try {
    const { provider, apiKey, model } = req.body;
    const result = await validateAiConnection({
      provider: provider || 'gemini',
      apiKey,
      model,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const { validateStorageConnection } = require('../services/storage.service');

/**
 * Test Cloud Storage Connection
 * POST /api/organizations/:organizationId/storage/test
 */
const testStorageConnection = async (req, res, next) => {
  try {
    const { provider, s3, azure } = req.body;
    const result = await validateStorageConnection({
      provider: provider || 's3',
      s3,
      azure,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  testAiConnection,
  testStorageConnection,
};
