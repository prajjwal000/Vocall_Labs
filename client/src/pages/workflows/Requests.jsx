import React, { useState } from 'react';
import { useRequests } from '../../hooks/useWorkflows';
import { usePermissions } from '../../hooks/usePermissions';
import WorkflowProgressTracker from '../../components/workflows/WorkflowProgressTracker';
import NewRequestModal from '../../components/workflows/NewRequestModal';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Send, Sparkles, Paperclip, ExternalLink } from 'lucide-react';

const Requests = () => {
  const [activeTab, setActiveTab] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const navigate = useNavigate();
  const { can, isOwner } = usePermissions();

  const canReadRequests =
    can('requests.read') ||
    can('forms.read') ||
    can('workflows.read') ||
    isOwner;
  const canCreateRequests =
    can('requests.create') ||
    can('forms.read') ||
    can('workflows.read') ||
    can('forms.create') ||
    isOwner;

  const { data, isLoading, refetch } = useRequests({
    status: activeTab || undefined,
  });

  const requests = data?.data || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'rejected':
        return { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
      case 'in_progress':
        return { label: 'In Review', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  if (!canReadRequests) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view requests and submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Requests & Submissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track real-time progress, approval stages, and decision history for submitted workflows.
          </p>
        </div>

        {canCreateRequests && (
          <button
            onClick={() => setIsNewRequestOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        {[
          { label: 'All Requests', value: '' },
          { label: 'Pending / In Review', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 animate-pulse">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="text-3xl">📭</div>
          <h3 className="text-base font-bold text-slate-800">No Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't submitted any workflow requests yet.
          </p>
          <button
            onClick={() => navigate('/app/workflows')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-block mt-2"
          >
            Explore Workflows
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Request Code</th>
                <th className="py-3.5 px-6">Title & Process</th>
                <th className="py-3.5 px-6">Submitted By</th>
                <th className="py-3.5 px-6">Current Stage</th>
                <th className="py-3.5 px-6">SLA Resolution</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {requests.map((req) => {
                const badge = getStatusBadge(req.status);
                const requester = req.requesterId || {};
                const workflow = req.workflowId || {};

                return (
                  <tr key={req._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600">
                      {req.requestCode}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{req.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <span>{workflow.icon || '⚡'}</span>
                        <span>{workflow.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">
                        {requester.firstName} {requester.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{requester.email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">
                      Stage {req.currentStepNumber} of {req.totalSteps}
                    </td>
                    <td className="py-4 px-6">
                      {req.status === 'approved' || req.status === 'rejected' || req.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          ✓ Resolved
                        </span>
                      ) : req.slaStatus === 'breached' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          🚨 {req.timeRemainingText || 'Overdue'}
                        </span>
                      ) : req.slaStatus === 'approaching_breach' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          ⚠️ {req.timeRemainingText || 'Urgent'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ⏱️ {req.timeRemainingText || 'On Track'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Track Progress →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="text-xs font-mono font-bold text-indigo-600">
                  {selectedRequest.requestCode}
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedRequest.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <WorkflowProgressTracker request={selectedRequest} />

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800">Submitted Parameters:</div>
                <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100 space-y-2 text-xs">
                  {Object.entries(selectedRequest.formData || {}).map(([k, v]) => {
                    const isFile = typeof v === 'object' && v !== null && v.url;
                    return (
                      <div key={k} className="pt-2 first:pt-0 flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-500 capitalize">{k}:</span>
                        {isFile ? (
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{v.fileName || 'View Attachment'}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        ) : (
                          <span className="font-bold text-slate-900 text-right">{String(v)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isNewRequestOpen && (
        <NewRequestModal
          isOpen={isNewRequestOpen}
          onClose={() => setIsNewRequestOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default Requests;
