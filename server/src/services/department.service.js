const mongoose = require('mongoose');
const Department = require('../models/Department');
const OrganizationMember = require('../models/OrganizationMember');
const User = require('../models/User');
const Role = require('../models/Role');

const DEFAULT_DEPARTMENTS = [
  {
    name: 'Engineering & Technology',
    code: 'ENG',
    description: 'Product software architecture, infrastructure, quality engineering, and technical systems.',
    color: '#6366f1',
    budget: 250000,
  },
  {
    name: 'Product & Design',
    code: 'PRD',
    description: 'Product strategy, user experience research, UI/UX prototyping, and roadmap planning.',
    color: '#8b5cf6',
    budget: 120000,
  },
  {
    name: 'Operations & Facilities',
    code: 'OPS',
    description: 'Business process workflows, logistics, vendor management, and office operations.',
    color: '#10b981',
    budget: 95000,
  },
  {
    name: 'Human Resources & People',
    code: 'HR',
    description: 'Talent acquisition, employee relations, organizational culture, and compliance.',
    color: '#f59e0b',
    budget: 80000,
  },
  {
    name: 'Finance & Accounting',
    code: 'FIN',
    description: 'Financial reporting, budget forecasting, accounts payable, and auditing.',
    color: '#06b6d4',
    budget: 150000,
  },
];

/**
 * Initializes default departments if none exist for the organization
 */
const initializeDefaultDepartments = async (organizationId) => {
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const count = await Department.countDocuments({ organizationId: orgId });
  if (count === 0) {
    const docs = DEFAULT_DEPARTMENTS.map((d) => ({
      ...d,
      organizationId: orgId,
      status: 'active',
    }));
    await Department.insertMany(docs);
  }
};

/**
 * List all departments for an organization with member counts & head user details
 */
const getDepartments = async (organizationId, { search, status = 'active' } = {}) => {
  await initializeDefaultDepartments(organizationId);

  const query = { organizationId };
  if (status && status !== 'all') {
    query.status = status;
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { code: regex }, { description: regex }];
  }

  const departments = await Department.find(query)
    .populate('headUserId', 'firstName lastName email')
    .populate('parentDepartmentId', 'name code')
    .sort({ name: 1 });

  // Get member counts for each department
  const memberCounts = await OrganizationMember.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: 'active',
        departmentId: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$departmentId',
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = memberCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  return departments.map((d) => {
    const json = d.toJSON();
    return {
      ...json,
      memberCount: countMap[d._id.toString()] || 0,
      headUser: d.headUserId
        ? {
            id: d.headUserId._id.toString(),
            name: `${d.headUserId.firstName} ${d.headUserId.lastName}`,
            email: d.headUserId.email,
          }
        : null,
      parentDepartment: d.parentDepartmentId
        ? {
            id: d.parentDepartmentId._id.toString(),
            name: d.parentDepartmentId.name,
            code: d.parentDepartmentId.code,
          }
        : null,
    };
  });
};

/**
 * Retrieves department details and assigned member list
 */
const getDepartmentById = async (organizationId, departmentId) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    const error = new Error('Invalid department ID');
    error.statusCode = 400;
    throw error;
  }

  const department = await Department.findOne({ _id: departmentId, organizationId })
    .populate('headUserId', 'firstName lastName email')
    .populate('parentDepartmentId', 'name code');

  if (!department) {
    const error = new Error('Department not found in this organization');
    error.statusCode = 404;
    throw error;
  }

  // Get all members assigned to this department
  const members = await OrganizationMember.find({
    organizationId,
    departmentId,
    status: 'active',
  })
    .populate('userId', 'firstName lastName email')
    .populate('roleId', 'name key')
    .sort({ createdAt: 1 });

  // Get child sub-departments
  const subDepartments = await Department.find({
    organizationId,
    parentDepartmentId: departmentId,
    status: 'active',
  }).select('name code color memberCount');

  return {
    ...department.toJSON(),
    headUser: department.headUserId
      ? {
          id: department.headUserId._id.toString(),
          name: `${department.headUserId.firstName} ${department.headUserId.lastName}`,
          email: department.headUserId.email,
        }
      : null,
    parentDepartment: department.parentDepartmentId
      ? {
          id: department.parentDepartmentId._id.toString(),
          name: department.parentDepartmentId.name,
          code: department.parentDepartmentId.code,
        }
      : null,
    subDepartments: subDepartments.map((s) => s.toJSON()),
    members: members.map((m) => ({
      id: m.id || m._id.toString(),
      userId: m.userId?.id || m.userId?._id?.toString(),
      name: `${m.userId?.firstName} ${m.userId?.lastName}`,
      email: m.userId?.email,
      role: m.roleId?.name || m.role,
      roleKey: m.roleId?.key || m.role,
      jobTitle: m.jobTitle || 'Team Member',
      joinedAt: m.joinedAt,
    })),
    memberCount: members.length,
  };
};

/**
 * Creates a new department
 */
const createDepartment = async (organizationId, payload) => {
  const { name, code, description, headUserId, parentDepartmentId, color, budget } = payload;

  if (!name || !name.trim()) {
    const error = new Error('Department name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!code || !code.trim()) {
    const error = new Error('Department code is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = code.trim().toUpperCase();

  // Check code collision within organization
  const existingCode = await Department.findOne({ organizationId, code: normalizedCode });
  if (existingCode) {
    const error = new Error(`A department with code '${normalizedCode}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  // Validate headUserId if provided
  let validHeadId = null;
  if (headUserId && mongoose.Types.ObjectId.isValid(headUserId)) {
    const headMember = await OrganizationMember.findOne({
      organizationId,
      userId: headUserId,
      status: 'active',
    });
    if (headMember) {
      validHeadId = headUserId;
    }
  }

  // Validate parentDepartmentId if provided
  let validParentId = null;
  if (parentDepartmentId && mongoose.Types.ObjectId.isValid(parentDepartmentId)) {
    const parentDept = await Department.findOne({
      _id: parentDepartmentId,
      organizationId,
      status: 'active',
    });
    if (parentDept) {
      validParentId = parentDepartmentId;
    }
  }

  const department = await Department.create({
    name: name.trim(),
    code: normalizedCode,
    description: description ? description.trim() : '',
    organizationId,
    headUserId: validHeadId,
    parentDepartmentId: validParentId,
    color: color || '#6366f1',
    budget: typeof budget === 'number' && budget >= 0 ? budget : 0,
    status: 'active',
  });

  return department.toJSON();
};

/**
 * Updates a department
 */
const updateDepartment = async (organizationId, departmentId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    const error = new Error('Invalid department ID');
    error.statusCode = 400;
    throw error;
  }

  const department = await Department.findOne({ _id: departmentId, organizationId });
  if (!department) {
    const error = new Error('Department not found in this organization');
    error.statusCode = 404;
    throw error;
  }

  const { name, code, description, headUserId, parentDepartmentId, color, budget, status } =
    updateData;

  if (name !== undefined) {
    if (!name.trim()) {
      const error = new Error('Department name cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    department.name = name.trim();
  }

  if (code !== undefined) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      const error = new Error('Department code cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    if (normalizedCode !== department.code) {
      const existing = await Department.findOne({
        organizationId,
        code: normalizedCode,
        _id: { $ne: departmentId },
      });
      if (existing) {
        const error = new Error(`A department with code '${normalizedCode}' already exists`);
        error.statusCode = 409;
        throw error;
      }
      department.code = normalizedCode;
    }
  }

  if (description !== undefined) {
    department.description = typeof description === 'string' ? description.trim() : '';
  }

  if (headUserId !== undefined) {
    if (headUserId === null || headUserId === '') {
      department.headUserId = null;
    } else if (mongoose.Types.ObjectId.isValid(headUserId)) {
      department.headUserId = headUserId;
    }
  }

  if (parentDepartmentId !== undefined) {
    if (parentDepartmentId === null || parentDepartmentId === '') {
      department.parentDepartmentId = null;
    } else if (mongoose.Types.ObjectId.isValid(parentDepartmentId)) {
      // Prevent cyclical hierarchy (cannot be own parent)
      if (parentDepartmentId.toString() === departmentId.toString()) {
        const error = new Error('A department cannot be its own parent');
        error.statusCode = 400;
        throw error;
      }
      department.parentDepartmentId = parentDepartmentId;
    }
  }

  if (color !== undefined) {
    department.color = color || '#6366f1';
  }

  if (budget !== undefined) {
    department.budget = Number(budget) >= 0 ? Number(budget) : 0;
  }

  if (status !== undefined && ['active', 'archived'].includes(status)) {
    department.status = status;
  }

  await department.save();
  return department.toJSON();
};

/**
 * Deletes or archives a department and unassigns members
 */
const deleteDepartment = async (organizationId, departmentId) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    const error = new Error('Invalid department ID');
    error.statusCode = 400;
    throw error;
  }

  const department = await Department.findOne({ _id: departmentId, organizationId });
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  // Unassign members currently in this department
  await OrganizationMember.updateMany(
    { organizationId, departmentId },
    { $set: { departmentId: null } }
  );

  // Unlink sub-departments
  await Department.updateMany(
    { organizationId, parentDepartmentId: departmentId },
    { $set: { parentDepartmentId: null } }
  );

  await Department.deleteOne({ _id: departmentId });

  return { message: `Department '${department.name}' deleted successfully` };
};

/**
 * Assigns or reassigns members to a department
 */
const assignMembersToDepartment = async (organizationId, departmentId, memberIds, jobTitle = null) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    const error = new Error('Invalid department ID');
    error.statusCode = 400;
    throw error;
  }

  const department = await Department.findOne({ _id: departmentId, organizationId });
  if (!department) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    const error = new Error('Please select at least one member to assign');
    error.statusCode = 400;
    throw error;
  }

  const updateFields = { departmentId };
  if (jobTitle && typeof jobTitle === 'string' && jobTitle.trim()) {
    updateFields.jobTitle = jobTitle.trim();
  }

  await OrganizationMember.updateMany(
    {
      organizationId,
      _id: { $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)) },
    },
    { $set: updateFields }
  );

  return { message: `Assigned ${memberIds.length} member(s) to ${department.name}` };
};

/**
 * Remove a member from a department
 */
const removeMemberFromDepartment = async (organizationId, departmentId, memberId) => {
  await OrganizationMember.updateOne(
    { organizationId, _id: memberId, departmentId },
    { $set: { departmentId: null } }
  );

  return { message: 'Member unassigned from department' };
};

/**
 * Builds organizational tree structure for visual hierarchy charts
 */
const getDepartmentOrgTree = async (organizationId) => {
  const departments = await getDepartments(organizationId, { status: 'active' });

  const deptMap = {};
  departments.forEach((d) => {
    deptMap[d.id] = { ...d, children: [] };
  });

  const roots = [];
  departments.forEach((d) => {
    if (d.parentDepartment && deptMap[d.parentDepartment.id]) {
      deptMap[d.parentDepartment.id].children.push(deptMap[d.id]);
    } else {
      roots.push(deptMap[d.id]);
    }
  });

  return roots;
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignMembersToDepartment,
  removeMemberFromDepartment,
  getDepartmentOrgTree,
};
