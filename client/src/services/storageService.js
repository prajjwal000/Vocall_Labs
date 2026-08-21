import api from '../lib/axios';

export const storageService = {
  /**
   * Uploads a file for a workflow request
   */
  async uploadFile(file, organizationId) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    if (organizationId) {
      headers['x-organization-id'] = organizationId;
    }

    const response = await api.post('/storage/upload', formData, { headers });
    return response.data;
  },

  /**
   * Tests storage configuration connectivity
   */
  async testStorageConnection(data) {
    const response = await api.post('/storage/test', data);
    return response.data;
  },
};

export default storageService;
