import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * RoleGate conditionally renders children if the user has one of the allowed roles
 */
export const RoleGate = ({ roles, fallback = null, children }) => {
  const { hasRole, isOwner } = usePermissions();

  if (isOwner) {
    return <>{children}</>;
  }

  if (!hasRole(roles)) {
    return fallback;
  }

  return <>{children}</>;
};

export default RoleGate;
