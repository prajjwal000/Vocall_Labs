import api from '../lib/axios';

export const invitationService = {
  async createInvitation(organizationId, data) {
    const response = await api.post(`/organizations/${organizationId}/invitations`, data);
    return response.data;
  },

  async getInvitations(organizationId, params = {}) {
    const response = await api.get(`/organizations/${organizationId}/invitations`, {
      params,
    });
    return response.data;
  },

  async resendInvitation(organizationId, invitationId) {
    const response = await api.post(
      `/organizations/${organizationId}/invitations/${invitationId}/resend`
    );
    return response.data;
  },

  async revokeInvitation(organizationId, invitationId) {
    const response = await api.delete(
      `/organizations/${organizationId}/invitations/${invitationId}`
    );
    return response.data;
  },

  async getInvitationByToken(token) {
    const response = await api.get(`/invitations/${token}`);
    return response.data;
  },

  async acceptInvitation(token, data = {}) {
    const response = await api.post(`/invitations/${token}/accept`, data);
    return response.data;
  },
};
