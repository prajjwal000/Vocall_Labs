import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { activeOrganization } = useWorkspaceStore();
  const { user } = useAuthStore();

  const role = activeOrganization?.role || 'member';
  const permissions = Array.isArray(activeOrganization?.permissions)
    ? activeOrganization.permissions
    : [];

  const userId = (user?._id || user?.id || '').toString();
  const ownerId = (activeOrganization?.ownerId?._id || activeOrganization?.ownerId || '').toString();

  // Strict owner check: only true if role is explicitly 'owner' or user ID matches the org owner ID
  const isOwner =
    role === 'owner' ||
    Boolean(ownerId && userId && ownerId === userId);

  const isAdmin = isOwner || role === 'admin';

  /**
   * Checks whether the current user has a specific permission in the active workspace
   * @param {string|string[]} permissionKey - Permission key or array of keys (any matches)
   * @returns {boolean}
   */
  const can = (permissionKey) => {
    if (!activeOrganization) return false;
    if (isOwner) return true;
    if (permissions.includes('*')) return true;

    if (Array.isArray(permissionKey)) {
      return permissionKey.some((p) => permissions.includes(p));
    }

    return permissions.includes(permissionKey);
  };

  /**
   * Checks if user has a specific role in the active workspace
   */
  const hasRole = (roleKey) => {
    if (isOwner && roleKey === 'owner') return true;
    if (Array.isArray(roleKey)) {
      return roleKey.includes(role);
    }
    return role === roleKey;
  };

  return {
    can,
    hasRole,
    isOwner,
    isAdmin,
    role: isOwner ? 'owner' : role,
    permissions: isOwner ? ['*'] : permissions,
  };
};

export default usePermissions;
