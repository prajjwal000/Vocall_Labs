const storageService = require('../services/storage.service');

/**
 * Test Cloud Storage Connection
 * POST /api/organizations/:organizationId/storage/test
 */
const testStorageConnection = async (req, res, next) => {
  try {
    const { provider, s3, azure } = req.body;
    const result = await storageService.validateStorageConnection({
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

/**
 * Upload a File
 * POST /api/storage/upload
 */
const uploadFile = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id'] || req.user?.activeOrganizationId || 'shared';
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file.',
      });
    }

    const uploaded = await storageService.saveUploadedFile({
      file,
      organizationId,
    });

    res.status(200).json({
      success: true,
      data: uploaded,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  testStorageConnection,
  uploadFile,
};
