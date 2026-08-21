import api from '../lib/axios';
import { useWorkspaceStore } from '../store/workspaceStore';

const getOrgHeaders = () => {
  const activeOrg = useWorkspaceStore.getState().activeOrganization;
  const orgId = activeOrg?.id || activeOrg?._id;
  return orgId ? { 'X-Organization-Id': orgId } : {};
};

export const workflowService = {
  // AI Synthesis
  async generateWithAi(prompt) {
    const res = await api.post(
      '/workflows/generate-ai',
      { prompt },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  // Workflows
  async getWorkflows(params = {}) {
    const res = await api.get('/workflows', {
      params,
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async getWorkflow(workflowId, params = {}) {
    const res = await api.get(`/workflows/${workflowId}`, {
      params,
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async getWorkflowVersions(workflowId) {
    const res = await api.get(`/workflows/${workflowId}/versions`, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async forkWorkflowDraft(workflowId, fromVersionId = null) {
    const res = await api.post(
      `/workflows/${workflowId}/fork`,
      { fromVersionId },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  async updateWorkflowDraft(workflowId, versionId, data) {
    const res = await api.patch(
      `/workflows/${workflowId}/versions/${versionId}`,
      data,
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  async publishWorkflowVersion(workflowId, versionId, changeSummary = '') {
    const res = await api.post(
      `/workflows/${workflowId}/versions/${versionId}/publish`,
      { changeSummary },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  async discardWorkflowDraft(workflowId, versionId) {
    const res = await api.delete(`/workflows/${workflowId}/versions/${versionId}`, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async compareWorkflowVersions(workflowId, v1, v2) {
    const res = await api.get(`/workflows/${workflowId}/compare`, {
      params: { v1, v2 },
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async createWorkflow(data) {
    const res = await api.post('/workflows', data, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async updateWorkflow(workflowId, data) {
    const res = await api.patch(`/workflows/${workflowId}`, data, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async deleteWorkflow(workflowId) {
    const res = await api.delete(`/workflows/${workflowId}`, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  // Requests
  async submitRequest(workflowId, formData) {
    const res = await api.post(
      `/workflows/${workflowId}/submit`,
      { formData },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  async getRequests(params = {}) {
    const res = await api.get('/requests', {
      params,
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async getRequest(requestId) {
    const res = await api.get(`/requests/${requestId}`, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async cancelRequest(requestId) {
    const res = await api.post(`/requests/${requestId}/cancel`, {}, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  // Approvals
  async getApprovals(params = {}) {
    const res = await api.get('/approvals', {
      params,
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  async decideApproval(approvalId, decisionData) {
    const res = await api.post(`/approvals/${approvalId}/decide`, decisionData, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },
};
