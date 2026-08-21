import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useDashboardSummary = () => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ['dashboard', 'summary', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const res = await dashboardService.getSummary(orgId);
      return res.data;
    },
    enabled: Boolean(orgId),
    staleTime: 30 * 1000,
  });
};

export const useDashboardActivity = (params = {}) => {
  const { activeOrganization } = useWorkspaceStore();
  const orgId = activeOrganization?.id;

  return useQuery({
    queryKey: ['dashboard', 'activity', orgId, params],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await dashboardService.getActivity(orgId, params);
      return res.data || [];
    },
    enabled: Boolean(orgId),
    staleTime: 30 * 1000,
  });
};
