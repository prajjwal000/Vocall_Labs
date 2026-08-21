import React from 'react';

export const WorkflowProgressTracker = ({ request }) => {
  if (!request) return null;

  const { status, currentStepNumber, totalSteps, history = [] } = request;

  const getStatusBadge = (st) => {
    switch (st) {
      case 'approved':
        return { label: 'Fully Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'rejected':
        return { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: `In Progress (Step ${currentStepNumber}/${totalSteps})`, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const badge = getStatusBadge(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">Request Lifecycle Status:</span>
        <div className="flex items-center space-x-2">
          {request.timeRemainingText && request.status !== 'approved' && request.status !== 'rejected' && request.status !== 'cancelled' && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
              request.slaStatus === 'breached'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : request.slaStatus === 'approaching_breach'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              ⏱️ {request.timeRemainingText}
            </span>
          )}
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="relative flex items-center justify-between py-2">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-0"></div>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          let isComplete = false;
          let isCurrent = false;

          if (status === 'approved') {
            isComplete = true;
          } else if (status === 'rejected') {
            isComplete = stepNum < currentStepNumber;
          } else {
            isComplete = stepNum < currentStepNumber;
            isCurrent = stepNum === currentStepNumber;
          }

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  isComplete
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isComplete ? '✓' : stepNum}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 mt-1">
                Stage {stepNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* History Log */}
      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Audit & Decision Log
        </div>
        <div className="divide-y divide-slate-100">
          {history.map((h, i) => (
            <div key={i} className="py-2.5 flex items-start justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                  {h.action === 'skipped' ? (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                      ⚡ Auto-Skipped
                    </span>
                  ) : (
                    <span className="capitalize font-bold">{h.action}</span>
                  )}
                  <span>: {h.stepName}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  By {h.actorName || 'System'} • <span className="italic">"{h.comment}"</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgressTracker;
