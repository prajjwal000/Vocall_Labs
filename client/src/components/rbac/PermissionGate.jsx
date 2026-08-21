import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * PermissionGate conditionally renders children if the user has the required permission
 */
export const PermissionGate = ({ permission, fallback = null, children }) => {
  const { can } = usePermissions();

  if (!can(permission)) {
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGate;
