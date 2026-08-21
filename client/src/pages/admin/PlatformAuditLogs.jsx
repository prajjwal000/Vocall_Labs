import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Clock,
  Shield,
  User,
  Building2,
  Calendar,
  Code,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';

export const PlatformAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await platformAdminService.getAuditLogs({
        search: search || undefined,
        action: selectedAction || undefined,
      });
      setLogs(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, selectedAction]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Security & Audit Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable administrative activity logs recording changes to tenant plans, roles, ticket replies, and system settings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Recorded Events: <strong className="text-slate-900 dark:text-white font-mono">{total}</strong>
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs placeholder-slate-400 border-none bg-transparent focus:outline-hidden text-slate-900 dark:text-white font-medium"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Action Types</option>
          <option value="organization.updated">organization.updated</option>
          <option value="organization.suspended">organization.suspended</option>
          <option value="pricing.updated">pricing.updated</option>
          <option value="ticket.updated">ticket.updated</option>
          <option value="ticket.replied">ticket.replied</option>
          <option value="settings.updated">settings.updated</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
            <p className="text-xs">Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No audit events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                      <div>{log.actorName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{log.actorEmail}</div>
                    </td>

                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                      <div>{log.targetName || log.targetType}</div>
                      <div className="text-[10px] font-mono text-slate-400">{log.targetType}</div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
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

export default PlatformAuditLogs;
