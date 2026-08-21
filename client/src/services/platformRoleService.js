import api from '../lib/axios';

export const platformRoleService = {
  async getMyPlatformPermissions() {
    const response = await api.get('/admin/me/permissions');
    return response.data;
  },

  async getPlatformRoles() {
    const response = await api.get('/admin/roles');
    return response.data;
  },

  async getPlatformRoleById(roleId) {
    const response = await api.get(`/admin/roles/${roleId}`);
    return response.data;
  },

  async updatePlatformRole(roleId, data) {
    const response = await api.patch(`/admin/roles/${roleId}`, data);
    return response.data;
  },

  async getPlatformUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async assignUserPlatformRole(userId, roleId) {
    const response = await api.patch(`/admin/users/${userId}/role`, { roleId });
    return response.data;
  },
};
