import api from '../lib/axios';

export const organizationService = {
  async getOrganizations() {
    const response = await api.get('/organizations');
    return response.data;
  },

  async getOrganization(id) {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  async createOrganization(data) {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  async updateOrganization(id, data) {
    const response = await api.patch(`/organizations/${id}`, data);
    return response.data;
  },

  async deleteOrganization(id) {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },

  async testAiConnection(id, data) {
    const response = await api.post(`/organizations/${id}/ai/test`, data);
    return response.data;
  },

  async testStorageConnection(id, data) {
    const response = await api.post(`/organizations/${id}/storage/test`, data);
    return response.data;
  },
};
