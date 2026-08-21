import api from '../lib/axios';

export const dashboardService = {
  async getSummary(organizationId) {
    const response = await api.get('/dashboard/summary', {
      headers: {
        'X-Organization-Id': organizationId,
      },
    });
    return response.data;
  },

  async getActivity(organizationId, params = {}) {
    const response = await api.get('/dashboard/activity', {
      headers: {
        'X-Organization-Id': organizationId,
      },
      params,
    });
    return response.data;
  },
};
