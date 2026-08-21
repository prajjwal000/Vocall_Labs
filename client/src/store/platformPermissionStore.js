import { create } from 'zustand';
import { platformRoleService } from '../services/platformRoleService';

export const usePlatformPermissionStore = create((set, get) => ({
  isPlatformUser: false,
  role: null,
  permissions: [],
  isLoading: false,
  isInitialized: false,

  fetchPermissions: async () => {
    set({ isLoading: true });
    try {
      const res = await platformRoleService.getMyPlatformPermissions();
      if (res.success && res.data) {
        set({
          isPlatformUser: res.data.isPlatformUser,
          role: res.data.role,
          permissions: res.data.permissions || [],
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch {
      set({
        isPlatformUser: false,
        role: null,
        permissions: [],
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  reset: () => {
    set({
      isPlatformUser: false,
      role: null,
      permissions: [],
      isLoading: false,
      isInitialized: false,
    });
  },

  can: (permissionKey) => {
    const { isPlatformUser, role, permissions } = get();
    if (!isPlatformUser) return false;
    if (role?.key === 'platform_admin' || permissions.includes('*')) return true;

    if (Array.isArray(permissionKey)) {
      return permissionKey.some((p) => permissions.includes(p));
    }

    return permissions.includes(permissionKey);
  },

  hasRole: (roleKey) => {
    const { isPlatformUser, role } = get();
    if (!isPlatformUser) return false;
    if (role?.key === 'platform_admin') return true;

    if (Array.isArray(roleKey)) {
      return roleKey.includes(role?.key);
    }
    return role?.key === roleKey;
  },
}));

export default usePlatformPermissionStore;
