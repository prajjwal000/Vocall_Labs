import React, { useEffect } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePlatformPermissionStore } from '../../store/platformPermissionStore';

const PlatformProtectedRoute = ({ requiredPermission = null, children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const {
    isPlatformUser,
    isInitialized,
    isLoading: isPermLoading,
    fetchPermissions,
    can,
  } = usePlatformPermissionStore();

  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      fetchPermissions();
    }
  }, [isAuthenticated, isInitialized, fetchPermissions]);

  if (isAuthLoading || (!isInitialized && isPermLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying Platform Access Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isPlatformUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Platform Access Denied
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account is not configured as an internal Nexus Platform User. Platform administration is strictly restricted to authorized staff.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/app/dashboard"
              className="inline-block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              Return to Customer Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="p-12 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-900">Permission Restricted</h2>
        <p className="text-xs text-slate-500">
          Your platform role lacks the <code className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{requiredPermission}</code> capability. Contact a Platform Administrator to request access.
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PlatformProtectedRoute;
