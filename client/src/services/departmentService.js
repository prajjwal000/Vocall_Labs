import api from '../lib/axios';

export const departmentService = {
  async getDepartments(organizationId, params = {}) {
    const response = await api.get(`/organizations/${organizationId}/departments`, { params });
    return response.data;
  },

  async getDepartmentById(organizationId, departmentId) {
    const response = await api.get(`/organizations/${organizationId}/departments/${departmentId}`);
    return response.data;
  },

  async getDepartmentTree(organizationId) {
    const response = await api.get(`/organizations/${organizationId}/departments/tree`);
    return response.data;
  },

  async createDepartment(organizationId, payload) {
    const response = await api.post(`/organizations/${organizationId}/departments`, payload);
    return response.data;
  },

  async updateDepartment(organizationId, departmentId, payload) {
    const response = await api.patch(
      `/organizations/${organizationId}/departments/${departmentId}`,
      payload
    );
    return response.data;
  },

  async deleteDepartment(organizationId, departmentId) {
    const response = await api.delete(`/organizations/${organizationId}/departments/${departmentId}`);
    return response.data;
  },

  async assignMembers(organizationId, departmentId, payload) {
    const response = await api.post(
      `/organizations/${organizationId}/departments/${departmentId}/members`,
      payload
    );
    return response.data;
  },

  async removeMember(organizationId, departmentId, memberId) {
    const response = await api.delete(
      `/organizations/${organizationId}/departments/${departmentId}/members/${memberId}`
    );
    return response.data;
  },
};

export default departmentService;
