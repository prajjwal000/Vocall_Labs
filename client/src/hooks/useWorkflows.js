import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflowService';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useWorkflows = (params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ['workflows', orgId, params],
    queryFn: async () => {
      if (!orgId) return { data: [], pagination: {} };
      const res = await workflowService.getWorkflows(params);
      return res;
    },
    enabled: Boolean(orgId),
  });
};

export const useWorkflow = (workflowId, params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['workflow', orgId, workflowId, params],
    queryFn: async () => {
      if (!orgId || !workflowId || workflowId === 'undefined') return null;
      const res = await workflowService.getWorkflow(workflowId, params);
      return res;
    },
    enabled: Boolean(orgId && workflowId && workflowId !== 'undefined'),
  });
};

export const useWorkflowVersions = (workflowId) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['workflow-versions', orgId, workflowId],
    queryFn: async () => {
      if (!orgId || !workflowId || workflowId === 'undefined') return [];
      const res = await workflowService.getWorkflowVersions(workflowId);
      return res.data || [];
    },
    enabled: Boolean(orgId && workflowId && workflowId !== 'undefined'),
  });
};

export const useWorkflowMutations = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  const forkDraft = useMutation({
    mutationFn: async ({ workflowId, fromVersionId }) => {
      return workflowService.forkWorkflowDraft(workflowId, fromVersionId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-versions', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
    },
  });

  const updateDraft = useMutation({
    mutationFn: async ({ workflowId, versionId, data }) => {
      return workflowService.updateWorkflowDraft(workflowId, versionId, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-versions', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
    },
  });

  const publishVersion = useMutation({
    mutationFn: async ({ workflowId, versionId, changeSummary }) => {
      return workflowService.publishWorkflowVersion(workflowId, versionId, changeSummary);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-versions', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
    },
  });

  const discardDraft = useMutation({
    mutationFn: async ({ workflowId, versionId }) => {
      return workflowService.discardWorkflowDraft(workflowId, versionId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-versions', orgId, variables.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
    },
  });

  return {
    forkDraft,
    updateDraft,
    publishVersion,
    discardDraft,
  };
};

export const useRequests = (params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ['requests', orgId, params],
    queryFn: async () => {
      if (!orgId) return { data: [], pagination: {} };
      const res = await workflowService.getRequests(params);
      return res;
    },
    enabled: Boolean(orgId),
  });
};

export const useApprovals = (params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ['approvals', orgId, params],
    queryFn: async () => {
      if (!orgId) return { data: [], pagination: {} };
      const res = await workflowService.getApprovals(params);
      return res;
    },
    enabled: Boolean(orgId),
  });
};

export const useSubmitWorkflow = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useMutation({
    mutationFn: async ({ workflowId, formData }) => {
      return workflowService.submitRequest(workflowId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', orgId] });
      queryClient.invalidateQueries({ queryKey: ['approvals', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity', orgId] });
    },
  });
};

export const useProcessApproval = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useMutation({
    mutationFn: async ({ approvalId, decision, comment }) => {
      return workflowService.decideApproval(approvalId, { decision, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', orgId] });
      queryClient.invalidateQueries({ queryKey: ['requests', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity', orgId] });
    },
  });
};
