const roleService = require('../services/role.service');

/**
 * Get global permissions catalog
 * GET /api/permissions
 */
const getPermissionsCatalog = async (req, res, next) => {
  try {
    const catalog = await roleService.getPermissionsCatalog();
    res.status(200).json({
      success: true,
      data: catalog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all roles for the active organization
 * GET /api/organizations/:organizationId/roles
 */
const getOrganizationRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getOrganizationRoles(req.organization._id);
    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a custom role for the organization
 * POST /api/organizations/:organizationId/roles
 */
const createRole = async (req, res, next) => {
  try {
    const { name, key, description, permissions } = req.body;
    const role = await roleService.createRole({
      organizationId: req.organization._id,
      name,
      key,
      description,
      permissions,
    });

    res.status(201).json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single role
 * GET /api/organizations/:organizationId/roles/:roleId
 */
const getRoleById = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const role = await roleService.getRoleById({
      organizationId: req.organization._id,
      roleId,
    });

    res.status(200).json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a role
 * PATCH /api/organizations/:organizationId/roles/:roleId
 */
const updateRole = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const role = await roleService.updateRole({
      organizationId: req.organization._id,
      roleId,
      updateData: req.body,
    });

    res.status(200).json({
      success: true,
      data: {
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a custom role
 * DELETE /api/organizations/:organizationId/roles/:roleId
 */
const deleteRole = async (req, res, next) => {
  try {
    const { roleId } = req.params;
    const result = await roleService.deleteRole({
      organizationId: req.organization._id,
      roleId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role to an organization member
 * PATCH /api/organizations/:organizationId/members/:memberId/role
 */
const assignMemberRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { roleId } = req.body;

    const member = await roleService.assignMemberRole({
      organizationId: req.organization._id,
      memberId,
      roleId,
    });

    res.status(200).json({
      success: true,
      data: {
        member,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all members with role details
 * GET /api/organizations/:organizationId/members
 */
const getOrganizationMembers = async (req, res, next) => {
  try {
    const members = await roleService.getOrganizationMembersWithRoles(req.organization._id);
    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermissionsCatalog,
  getOrganizationRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  assignMemberRole,
  getOrganizationMembers,
};
