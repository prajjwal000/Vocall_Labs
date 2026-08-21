import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-8 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="h-8 w-16 bg-slate-300 rounded-md"></div>
            <div className="h-3 w-32 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-64">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-64">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
