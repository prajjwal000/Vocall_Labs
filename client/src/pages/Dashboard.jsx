import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardSummary, useDashboardActivity } from '../hooks/useDashboard';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardKpiGrid from '../components/dashboard/DashboardKpiGrid';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';
import PlanUsage from '../components/dashboard/PlanUsage';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DashboardError from '../components/dashboard/DashboardError';

const Dashboard = () => {
  const { activeOrganization } = useWorkspaceStore();
  const { user } = useAuthStore();

  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
  } = useDashboardActivity({ limit: 8 });

  if (!activeOrganization) {
    if (user?.isPlatformUser) {
      return (
        <div className="max-w-xl mx-auto py-16 text-center space-y-5 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs">
            ⚡
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Signed in as Platform Admin</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You are authenticated as an internal Nexus Platform Superuser. Use the Platform Admin console to manage global platform roles, tenant accounts, and platform staff.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center space-x-3">
            <Link
              to="/admin/roles"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Open Platform Admin Console →
            </Link>
            <Link
              to="/app/organizations/new"
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              + Create Tenant Workspace
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-4xl">🏢</div>
        <div>
          <h2 className="text-base font-bold text-slate-800">No Active Organization</h2>
          <p className="text-xs text-slate-500 mt-1">
            Please select or create an organization to view your workspace dashboard.
          </p>
        </div>
        <Link
          to="/app/organizations/new"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          + Create Organization
        </Link>
      </div>
    );
  }

  if (isLoadingSummary) {
    return <DashboardSkeleton />;
  }

  if (isSummaryError) {
    return (
      <DashboardError
        onRetry={() => {
          refetchSummary();
          refetchActivities();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      {/* 1. Header with dynamic greeting */}
      <DashboardHeader />

      {/* 2. Real KPI Metrics Grid */}
      <DashboardKpiGrid summary={summary} />

      {/* 3. Middle Section: Quick Actions & Plan Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <PlanUsage usage={summary?.usage} organization={summary?.organization} />
      </div>

      {/* 4. Live Workspace Activity Feed */}
      <RecentActivity
        activities={activities}
        isLoading={isLoadingActivities}
      />
    </div>
  );
};

export default Dashboard;
