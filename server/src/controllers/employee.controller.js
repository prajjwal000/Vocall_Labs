const mongoose = require('mongoose');
const OrganizationMember = require('../models/OrganizationMember');
const Department = require('../models/Department');
const Role = require('../models/Role');
const User = require('../models/User');

const getEmployees = async (req, res, next) => {
  try {
    const { search, departmentId, roleId, status } = req.query;
    const organizationId = req.organization._id;

    const query = { organizationId };

    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'invited'] };
    }

    if (departmentId && departmentId !== 'all') {
      if (departmentId === 'unassigned') {
        query.departmentId = null;
      } else if (mongoose.Types.ObjectId.isValid(departmentId)) {
        query.departmentId = new mongoose.Types.ObjectId(departmentId);
      }
    }

    if (roleId && roleId !== 'all' && mongoose.Types.ObjectId.isValid(roleId)) {
      query.roleId = new mongoose.Types.ObjectId(roleId);
    }

    const members = await OrganizationMember.find(query)
      .populate('userId', 'firstName lastName email status lastLoginAt')
      .populate('departmentId', 'name code color')
      .populate('roleId', 'name key isSystem')
      .sort({ createdAt: -1 });

    let results = members
      .filter((m) => m.userId)
      .map((m) => ({
        id: m.id || m._id.toString(),
        userId: m.userId.id || m.userId._id.toString(),
        firstName: m.userId.firstName,
        lastName: m.userId.lastName,
        fullName: `${m.userId.firstName} ${m.userId.lastName}`,
        email: m.userId.email,
        userStatus: m.userId.status,
        membershipStatus: m.status,
        jobTitle: m.jobTitle || 'Staff Member',
        department: m.departmentId
          ? {
              id: m.departmentId.id || m.departmentId._id.toString(),
              name: m.departmentId.name,
              code: m.departmentId.code,
              color: m.departmentId.color,
            }
          : null,
        role: m.roleId
          ? {
              id: m.roleId.id || m.roleId._id.toString(),
              name: m.roleId.name,
              key: m.roleId.key,
            }
          : { name: m.role, key: m.role },
        isOwner: m.role === 'owner',
        lastLoginAt: m.userId.lastLoginAt,
        joinedAt: m.joinedAt,
      }));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.jobTitle.toLowerCase().includes(q) ||
          (e.department && e.department.name.toLowerCase().includes(q))
      );
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const organizationId = req.organization._id;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const member = await OrganizationMember.findOne({
      _id: employeeId,
      organizationId,
    })
      .populate('userId', 'firstName lastName email status lastLoginAt createdAt')
      .populate('departmentId', 'name code color description')
      .populate('roleId', 'name key permissions');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Employee not found in organization' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: member.id || member._id.toString(),
        userId: member.userId?._id?.toString(),
        firstName: member.userId?.firstName,
        lastName: member.userId?.lastName,
        fullName: `${member.userId?.firstName} ${member.userId?.lastName}`,
        email: member.userId?.email,
        jobTitle: member.jobTitle || 'Staff Member',
        department: member.departmentId
          ? {
              id: member.departmentId._id.toString(),
              name: member.departmentId.name,
              code: member.departmentId.code,
              color: member.departmentId.color,
            }
          : null,
        role: member.roleId
          ? {
              id: member.roleId._id.toString(),
              name: member.roleId.name,
              key: member.roleId.key,
            }
          : { name: member.role, key: member.role },
        status: member.status,
        joinedAt: member.joinedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const organizationId = req.organization._id;
    const { departmentId, jobTitle, roleId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const member = await OrganizationMember.findOne({
      _id: employeeId,
      organizationId,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Check if owner role is being modified
    if (member.role === 'owner' && roleId !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Workspace owner role cannot be changed',
      });
    }

    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === '' || departmentId === 'unassigned') {
        member.departmentId = null;
      } else if (mongoose.Types.ObjectId.isValid(departmentId)) {
        const dept = await Department.findOne({
          _id: departmentId,
          organizationId,
          status: 'active',
        });
        if (dept) {
          member.departmentId = departmentId;
        }
      }
    }

    if (jobTitle !== undefined) {
      member.jobTitle = typeof jobTitle === 'string' ? jobTitle.trim() : '';
    }

    if (roleId && mongoose.Types.ObjectId.isValid(roleId) && member.role !== 'owner') {
      const roleDoc = await Role.findOne({ _id: roleId, organizationId });
      if (roleDoc) {
        member.roleId = roleDoc._id;
        member.role = roleDoc.key;
      }
    }

    await member.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  updateEmployee,
};
