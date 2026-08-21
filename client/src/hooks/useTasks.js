import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useTasks = (params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['tasks', orgId, params],
    queryFn: async () => {
      if (!orgId) return { data: [], pagination: {} };
      const res = await taskService.getTasks(params);
      return res;
    },
    enabled: Boolean(orgId),
  });
};

export const useTaskDetails = (taskId) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['task', orgId, taskId],
    queryFn: async () => {
      if (!orgId || !taskId) return null;
      const res = await taskService.getTask(taskId);
      return res;
    },
    enabled: Boolean(orgId && taskId),
  });
};

export const useEligibleAssignees = (taskId = null) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['eligible-assignees', orgId, taskId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await taskService.getEligibleAssignees(taskId);
      return res.data || [];
    },
    enabled: Boolean(orgId),
  });
};

export const useTaskStats = () => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['task-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await taskService.getDashboardStats();
      return res.data;
    },
    enabled: Boolean(orgId),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useMutation({
    mutationFn: (data) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', orgId] });
    },
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useMutation({
    mutationFn: ({ taskId, notes }) => taskService.completeTask(taskId, { notes }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.invalidateQueries({ queryKey: ['task', orgId, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', orgId] });
    },
  });
};

export const useDelegateTask = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useMutation({
    mutationFn: ({ taskId, toUserId, reason }) => taskService.delegateTask(taskId, { toUserId, reason }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.invalidateQueries({ queryKey: ['task', orgId, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', orgId] });
    },
  });
};

export const useCancelTask = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useMutation({
    mutationFn: ({ taskId, reason }) => taskService.cancelTask(taskId, { reason }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.invalidateQueries({ queryKey: ['task', orgId, variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', orgId] });
    },
  });
};
