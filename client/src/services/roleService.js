import api from '../lib/axios';

export const roleService = {
  async getPermissions() {
    const response = await api.get('/permissions');
    return response.data;
  },

  async getOrganizationRoles(organizationId) {
    const response = await api.get(`/organizations/${organizationId}/roles`);
    return response.data;
  },

  async getRoleById(organizationId, roleId) {
    const response = await api.get(`/organizations/${organizationId}/roles/${roleId}`);
    return response.data;
  },

  async createRole(organizationId, data) {
    const response = await api.post(`/organizations/${organizationId}/roles`, data);
    return response.data;
  },

  async updateRole(organizationId, roleId, data) {
    const response = await api.patch(`/organizations/${organizationId}/roles/${roleId}`, data);
    return response.data;
  },

  async deleteRole(organizationId, roleId) {
    const response = await api.delete(`/organizations/${organizationId}/roles/${roleId}`);
    return response.data;
  },

  async getOrganizationMembers(organizationId) {
    const response = await api.get(`/organizations/${organizationId}/members`);
    return response.data;
  },

  async assignMemberRole(organizationId, memberId, roleId) {
    const response = await api.patch(
      `/organizations/${organizationId}/members/${memberId}/role`,
      { roleId }
    );
    return response.data;
  },
};
