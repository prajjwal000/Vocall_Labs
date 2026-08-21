const dashboardService = require('../services/dashboard.service');

/**
 * Get dashboard summary metrics for active organization
 * GET /api/dashboard/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const isOwner =
      req.membership?.role === 'owner' ||
      (req.organization?.ownerId &&
        req.user?._id &&
        req.organization.ownerId.toString() === req.user._id.toString());

    const summary = await dashboardService.getDashboardSummary({
      organizationId: req.organization._id,
      userPermissions: req.userPermissions || [],
      isOwner,
    });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent real organization activity feed
 * GET /api/dashboard/activity
 */
const getActivity = async (req, res, next) => {
  try {
    const { limit, page } = req.query;
    const activity = await dashboardService.getDashboardActivity({
      organizationId: req.organization._id,
      limit,
      page,
    });

    res.status(200).json({
      success: true,
      data: activity.data,
      pagination: activity.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getActivity,
};
