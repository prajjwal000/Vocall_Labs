import React from 'react';
import KpiCard from './KpiCard';

export const DashboardKpiGrid = ({ summary }) => {
  if (!summary) return null;

  const { employees, requests, approvals, workflows, tasks } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Tasks Card */}
      {tasks?.isAvailable ? (
        <KpiCard
          title="Assigned Tasks"
          value={tasks.active}
          badge={
            tasks.completed > 0
              ? `${tasks.completed} Done • Active Queue`
              : 'Delegation Enabled'
          }
          subtext="Operational duties & delegations"
          icon="📌"
          color="indigo"
        />
      ) : employees?.isAvailable ? (
        <KpiCard
          title="Team Members"
          value={employees.total}
          badge={
            employees.pendingInvitations > 0
              ? `+${employees.pendingInvitations} Pending Invite`
              : `${employees.newThisMonth} Joined This Month`
          }
          subtext="Active workspace members"
          icon="👥"
          color="indigo"
        />
      ) : null}

      {/* 2. Requests Card */}
      {requests?.isAvailable && (
        <KpiCard
          title="Pending Requests"
          value={requests.pending}
          badge={requests.pending === 0 ? 'All Caught Up' : 'Requires Action'}
          subtext="Submitted employee requests"
          icon="📋"
          color="blue"
        />
      )}

      {/* 3. Approvals Card */}
      {approvals?.isAvailable && (
        <KpiCard
          title="Pending Approvals"
          value={approvals.pending}
          badge={approvals.pending === 0 ? 'Zero Pending' : 'Review Needed'}
          subtext="Items awaiting your approval"
          icon="✅"
          color="emerald"
        />
      )}

      {/* 4. Workflows Card */}
      {workflows?.isAvailable && (
        <KpiCard
          title="Active Workflows"
          value={workflows.active}
          badge="Automation Engine"
          subtext="Live organization automations"
          icon="⚡"
          color="amber"
        />
      )}
    </div>
  );
};

export default DashboardKpiGrid;
