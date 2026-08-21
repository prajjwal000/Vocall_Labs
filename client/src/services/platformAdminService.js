import api from '../lib/axios';

export const platformAdminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getOrganizations: async (params = {}) => {
    const res = await api.get('/admin/organizations', { params });
    return res.data;
  },

  updateOrganization: async (orgId, data) => {
    const res = await api.patch(`/admin/organizations/${orgId}`, data);
    return res.data;
  },

  getPricingPlans: async () => {
    const res = await api.get('/admin/pricing');
    return res.data;
  },

  updatePricingPlan: async (planKey, data) => {
    const res = await api.patch(`/admin/pricing/${planKey}`, data);
    return res.data;
  },

  getSubscriptions: async (params = {}) => {
    const res = await api.get('/admin/subscriptions', { params });
    return res.data;
  },

  getTickets: async (params = {}) => {
    const res = await api.get('/admin/tickets', { params });
    return res.data;
  },

  getTicketById: async (ticketId) => {
    const res = await api.get(`/admin/tickets/${ticketId}`);
    return res.data;
  },

  updateTicket: async (ticketId, data) => {
    const res = await api.patch(`/admin/tickets/${ticketId}`, data);
    return res.data;
  },

  replyTicket: async (ticketId, text) => {
    const res = await api.post(`/admin/tickets/${ticketId}/reply`, { text });
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/admin/audit', { params });
    return res.data;
  },

  getSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data;
  },

  updateSettings: async (data) => {
    const res = await api.patch('/admin/settings', data);
    return res.data;
  },
};

export const customerSupportService = {
  getTickets: async () => {
    const res = await api.get('/support/tickets');
    return res.data;
  },

  createTicket: async (data) => {
    const res = await api.post('/support/tickets', data);
    return res.data;
  },

  replyTicket: async (ticketId, text) => {
    const res = await api.post(`/support/tickets/${ticketId}/reply`, { text });
    return res.data;
  },
};
