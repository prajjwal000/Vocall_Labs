import api from '../lib/axios';
import { useWorkspaceStore } from '../store/workspaceStore';

const getOrgHeaders = () => {
  const activeOrg = useWorkspaceStore.getState().activeOrganization;
  const orgId = activeOrg?.id || activeOrg?._id;
  return orgId ? { 'X-Organization-Id': orgId } : {};
};

export const formService = {
  getForms: async (params = {}) => {
    const response = await api.get('/forms', {
      params,
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  getFormById: async (formId, versionId = null, versionNumber = null) => {
    const params = {};
    if (versionId) params.versionId = versionId;
    if (versionNumber) params.versionNumber = versionNumber;
    const response = await api.get(`/forms/${formId}`, {
      params,
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  getFormVersions: async (formId) => {
    const response = await api.get(`/forms/${formId}/versions`, {
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  createForm: async (data, publishImmediately = false) => {
    const response = await api.post(`/forms?publishImmediately=${publishImmediately}`, data, {
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  forkFormDraft: async (formId, fromVersionId = null) => {
    const response = await api.post(`/forms/${formId}/fork`, { fromVersionId }, {
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  updateFormDraft: async (formId, versionId, data) => {
    const response = await api.patch(`/forms/${formId}/versions/${versionId}`, data, {
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  publishFormVersion: async (formId, versionId, changeSummary = '') => {
    const response = await api.post(`/forms/${formId}/versions/${versionId}/publish`, { changeSummary }, {
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  discardFormDraft: async (formId, versionId) => {
    const response = await api.delete(`/forms/${formId}/versions/${versionId}`, {
      headers: getOrgHeaders(),
    });
    return response.data;
  },

  compareFormVersions: async (formId, v1, v2) => {
    const response = await api.get(`/forms/${formId}/compare`, {
      params: { v1, v2 },
      headers: getOrgHeaders(),
    });
    return response.data;
  },
};
