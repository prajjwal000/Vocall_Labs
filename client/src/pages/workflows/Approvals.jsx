import React, { useState } from 'react';
import { useApprovals } from '../../hooks/useWorkflows';
import { usePermissions } from '../../hooks/usePermissions';
import ApprovalDecisionModal from '../../components/workflows/ApprovalDecisionModal';

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const { can, isOwner } = usePermissions();

  const canReadApprovals = can('approvals.read') || isOwner;
  const canDecideApprovals = can(['approvals.approve', 'approvals.reject']) || isOwner;

  const { data, isLoading, refetch } = useApprovals({
    status: activeTab || undefined,
  });

  const approvals = data?.data || [];

  if (!canReadApprovals) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view approvals.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Approval Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review pending employee submissions, evaluate requests, and process approvals or rejections.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Pending Action ({activeTab === 'pending' ? approvals.length : '...'})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Approved History
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Rejected History
        </button>
      </div>

      {/* Approvals Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 animate-pulse">
          Loading approval items...
        </div>
      ) : approvals.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="text-3xl">✅</div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">All Caught Up!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'There are no pending requests requiring your approval right now.'
              : 'No historical approvals found for this filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Request Code</th>
                <th className="py-3.5 px-6">Request Summary</th>
                <th className="py-3.5 px-6">Requester</th>
                <th className="py-3.5 px-6">Assigned Stage</th>
                <th className="py-3.5 px-6">SLA & Due Target</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {approvals.map((appr) => {
                const req = appr.requestId || {};
                const requester = req.requesterId || {};

                const getSlaBadge = (slaStatus, text) => {
                  switch (slaStatus) {
                    case 'breached':
                      return (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                          🚨 Breached ({text || 'Overdue'})
                        </span>
                      );
                    case 'warning':
                      return (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                          ⚠️ Warning ({text || 'Near SLA'})
                        </span>
                      );
                    default:
                      return (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                          ⏱️ {text || 'On Track'}
                        </span>
                      );
                  }
                };

                return (
                  <tr key={appr._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {req.requestCode || 'REQ-XXXX'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white">{req.title || 'Workflow Request'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Created {new Date(appr.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {requester.firstName} {requester.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{requester.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                        Stage {appr.stepNumber}: {appr.stepName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getSlaBadge(appr.slaStatus, appr.timeRemainingText)}
                    </td>
                    <td className="py-4 px-6 capitalize font-semibold text-slate-700 dark:text-slate-300">
                      {appr.status}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {appr.status === 'pending' ? (
                        canDecideApprovals ? (
                          <button
                            onClick={() => setSelectedApproval(appr)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          >
                            Review & Decide →
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Pending action
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Decided {appr.decidedAt ? new Date(appr.decidedAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Modal */}
      {selectedApproval && (
        <ApprovalDecisionModal
          approval={selectedApproval}
          isOpen={Boolean(selectedApproval)}
          onClose={() => setSelectedApproval(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default Approvals;
