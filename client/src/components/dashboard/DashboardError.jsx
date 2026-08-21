import React from 'react';

export const DashboardError = ({ onRetry }) => {
  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-4">
      <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
        ⚠️
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">Something went wrong</h2>
        <p className="text-xs text-slate-500 mt-1">
          We couldn't load your organization dashboard data. Please try again.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default DashboardError;
