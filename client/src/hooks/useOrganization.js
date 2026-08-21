import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organizationService';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useOrganization = () => {
  const queryClient = useQueryClient();
  const { activeOrganization, setActiveOrganization, setOrganizations } = useWorkspaceStore();

  const {
    data: orgsData,
    isLoading,
    error,
    refetch: refreshOrganizations,
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await organizationService.getOrganizations();
      return res.data || [];
    },
    staleTime: 0,
  });

  const organizations = orgsData || [];

  useEffect(() => {
    if (!isLoading && organizations) {
      setOrganizations(organizations);

      if (organizations.length > 0) {
        // Match activeOrganization with fresh server data to sync role & permissions
        const matched = activeOrganization && organizations.find((o) => o.id === activeOrganization.id);
        if (matched) {
          if (
            matched.role !== activeOrganization.role ||
            matched.ownerId !== activeOrganization.ownerId ||
            JSON.stringify(matched.permissions) !== JSON.stringify(activeOrganization.permissions) ||
            JSON.stringify(matched.settings) !== JSON.stringify(activeOrganization.settings)
          ) {
            setActiveOrganization(matched);
          }
        } else {
          // Default to first valid organization from fresh server data
          setActiveOrganization(organizations[0]);
          queryClient.invalidateQueries();
        }
      } else {
        setActiveOrganization(null);
      }
    }
  }, [organizations, isLoading, activeOrganization, setActiveOrganization, setOrganizations, queryClient]);

  const switchOrganization = (orgId) => {
    const targetOrg = organizations.find((o) => o.id === orgId);
    if (targetOrg) {
      setActiveOrganization(targetOrg);
      // Invalidate all organization-scoped cached data so cross-tenant data is never leaked
      queryClient.invalidateQueries();
    }
  };

  return {
    activeOrganization,
    organizations,
    isLoading,
    error,
    switchOrganization,
    refreshOrganizations,
  };
};

export default useOrganization;
