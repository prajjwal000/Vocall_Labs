import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formService } from '../services/formService';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useForms = (params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['forms', orgId, params],
    queryFn: async () => {
      if (!orgId) return { data: [], pagination: {} };
      const res = await formService.getForms(params);
      return res;
    },
    enabled: Boolean(orgId),
  });
};

export const useForm = (formId, params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['form', orgId, formId, params],
    queryFn: async () => {
      if (!orgId || !formId || formId === 'undefined') return null;
      const res = await formService.getFormById(formId, params.versionId, params.versionNumber);
      return res;
    },
    enabled: Boolean(orgId && formId && formId !== 'undefined'),
  });
};

export const useFormVersions = (formId) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  return useQuery({
    queryKey: ['form-versions', orgId, formId],
    queryFn: async () => {
      if (!orgId || !formId || formId === 'undefined') return [];
      const res = await formService.getFormVersions(formId);
      return res.data || [];
    },
    enabled: Boolean(orgId && formId && formId !== 'undefined'),
  });
};

export const useFormMutations = () => {
  const queryClient = useQueryClient();
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id || activeOrganization?._id;

  const createForm = useMutation({
    mutationFn: async ({ data, publishImmediately }) => {
      return formService.createForm(data, publishImmediately);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', orgId] });
    },
  });

  const forkDraft = useMutation({
    mutationFn: async ({ formId, fromVersionId }) => {
      return formService.forkFormDraft(formId, fromVersionId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['form-versions', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['forms', orgId] });
    },
  });

  const updateDraft = useMutation({
    mutationFn: async ({ formId, versionId, data }) => {
      return formService.updateFormDraft(formId, versionId, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['form-versions', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['forms', orgId] });
    },
  });

  const publishVersion = useMutation({
    mutationFn: async ({ formId, versionId, changeSummary }) => {
      return formService.publishFormVersion(formId, versionId, changeSummary);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['form-versions', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['forms', orgId] });
    },
  });

  const discardDraft = useMutation({
    mutationFn: async ({ formId, versionId }) => {
      return formService.discardFormDraft(formId, versionId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['form-versions', orgId, variables.formId] });
      queryClient.invalidateQueries({ queryKey: ['forms', orgId] });
    },
  });

  return {
    createForm,
    forkDraft,
    updateDraft,
    publishVersion,
    discardDraft,
  };
};
