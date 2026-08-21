import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';

export const PlatformSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const res = await platformAdminService.getSubscriptions({
        search: search || undefined,
      });
      setSubscriptions(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🧾</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Tenant Subscriptions & Billing
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor tenant subscription lifecycles, billing renewal timelines, and active invoice statuses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Active Subscriptions: <strong className="text-slate-900 dark:text-white font-mono">{total}</strong>
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions by organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs placeholder-slate-400 border-none bg-transparent focus:outline-hidden text-slate-900 dark:text-white font-medium"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
            <p className="text-xs">Loading billing records...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Organization</th>
                  <th className="py-3.5 px-4">Plan Tier</th>
                  <th className="py-3.5 px-4">Monthly Rate</th>
                  <th className="py-3.5 px-4">Billing Status</th>
                  <th className="py-3.5 px-4">Next Renewal</th>
                  <th className="py-3.5 px-5">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sub.organization.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {sub.organization.ownerEmail}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="capitalize font-bold text-indigo-600 dark:text-indigo-400">
                        {sub.plan}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      ${sub.priceMonthly}/mo
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sub.billingStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {sub.billingStatus === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {sub.billingStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {new Date(sub.renewsAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5 text-slate-400">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformSubscriptions;
