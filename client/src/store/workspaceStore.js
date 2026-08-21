import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWorkspaceStore = create(
  persist(
    (set) => ({
      activeOrganization: null,
      organizations: [],

      setActiveOrganization: (activeOrganization) => set({ activeOrganization }),
      setOrganizations: (organizations) => set({ organizations }),
      clearWorkspace: () => set({ activeOrganization: null, organizations: [] }),
    }),
    {
      name: 'nexus_workspace_state',
      partialize: (state) => ({ activeOrganization: state.activeOrganization }),
    }
  )
);
