import api from '../lib/axios';

export const employeeService = {
  async getEmployees(organizationId, params = {}) {
    const response = await api.get(`/organizations/${organizationId}/employees`, { params });
    return response.data;
  },

  async getEmployeeById(organizationId, employeeId) {
    const response = await api.get(`/organizations/${organizationId}/employees/${employeeId}`);
    return response.data;
  },

  async updateEmployee(organizationId, employeeId, payload) {
    const response = await api.patch(
      `/organizations/${organizationId}/employees/${employeeId}`,
      payload
    );
    return response.data;
  },
};

export default employeeService;
