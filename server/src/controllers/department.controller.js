const departmentService = require('../services/department.service');

const getDepartments = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const departments = await departmentService.getDepartments(req.organization._id, {
      search,
      status,
    });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const department = await departmentService.getDepartmentById(
      req.organization._id,
      departmentId
    );
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(
      req.organization._id,
      req.body
    );
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const department = await departmentService.updateDepartment(
      req.organization._id,
      departmentId,
      req.body
    );
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const result = await departmentService.deleteDepartment(
      req.organization._id,
      departmentId
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const assignMembers = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { memberIds, jobTitle } = req.body;
    const result = await departmentService.assignMembersToDepartment(
      req.organization._id,
      departmentId,
      memberIds,
      jobTitle
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { departmentId, memberId } = req.params;
    const result = await departmentService.removeMemberFromDepartment(
      req.organization._id,
      departmentId,
      memberId
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getDepartmentTree = async (req, res, next) => {
  try {
    const tree = await departmentService.getDepartmentOrgTree(req.organization._id);
    res.status(200).json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignMembers,
  removeMember,
  getDepartmentTree,
};
