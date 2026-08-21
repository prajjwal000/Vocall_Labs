import api from '../lib/axios';
import { useWorkspaceStore } from '../store/workspaceStore';

const getOrgHeaders = () => {
  const activeOrg = useWorkspaceStore.getState().activeOrganization;
  const orgId = activeOrg?.id || activeOrg?._id;
  return orgId ? { 'X-Organization-Id': orgId } : {};
};

export const taskService = {
  // Query tasks list
  async getTasks(params = {}) {
    const res = await api.get('/tasks', {
      params,
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  // Single task details with timeline and delegation history
  async getTask(taskId) {
    const res = await api.get(`/tasks/${taskId}`, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  // Create / Assign a new task
  async createTask(data) {
    const res = await api.post('/tasks', data, {
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  // Complete task
  async completeTask(taskId, { notes } = {}) {
    const res = await api.post(
      `/tasks/${taskId}/complete`,
      { notes },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  // Delegate task
  async delegateTask(taskId, { toUserId, reason }) {
    const res = await api.post(
      `/tasks/${taskId}/delegate`,
      { toUserId, reason },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  // Cancel task
  async cancelTask(taskId, { reason } = {}) {
    const res = await api.post(
      `/tasks/${taskId}/cancel`,
      { reason },
      { headers: getOrgHeaders() }
    );
    return res.data;
  },

  // Get eligible assignees / delegates
  async getEligibleAssignees(taskId = null) {
    const res = await api.get('/tasks/eligible-assignees', {
      params: taskId ? { taskId } : {},
      headers: getOrgHeaders(),
    });
    return res.data;
  },

  // Task statistics for dashboard
  async getDashboardStats() {
    const res = await api.get('/tasks/dashboard-stats', {
      headers: getOrgHeaders(),
    });
    return res.data;
  },
};

export default taskService;
