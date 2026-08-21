import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  CreditCard,
  Zap,
  Activity,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';
import { Link } from 'react-router-dom';

export const PlatformDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await platformAdminService.getDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load platform dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
        {error}
      </div>
    );
  }

  const { overview = {}, planDistribution = {}, recentOrganizations = [] } = data || {};

  const stats = [
    {
      title: 'Total Organizations',
      value: overview.totalOrganizations || 0,
      sub: `${overview.activeOrganizations || 0} active • ${overview.suspendedOrganizations || 0} suspended`,
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
      link: '/admin/organizations',
    },
    {
      title: 'Monthly Recurring Rev.',
      value: `$${(overview.monthlyRecurringRevenue || 0).toLocaleString()}`,
      sub: 'Tier subscriptions annualized',
      icon: CreditCard,
      color: 'from-emerald-600 to-teal-600',
      link: '/admin/subscriptions',
    },
    {
      title: 'Global Platform Users',
      value: overview.totalUsers || 0,
      sub: `${overview.platformStaffCount || 0} internal staff accounts`,
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      link: '/admin/users',
    },
    {
      title: 'Support Helpdesk',
      value: overview.openTickets || 0,
      sub: 'Open / In-Progress Tickets',
      icon: LifeBuoy,
      color: 'from-amber-600 to-orange-600',
      link: '/admin/tickets',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Operations Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global metrics, tenant distribution, system health, and customer organization directory.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {s.title}
                  </span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 block">
                    {s.value}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${s.color} text-white shadow-md shadow-indigo-500/10`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  {s.sub}
                </span>
                <Link
                  to={s.link}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  View <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Second Row: Plan Distribution & System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Distribution Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subscription Plan Tiers
              </h3>
            </div>
            <Link to="/admin/pricing" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage Pricing →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Starter Plan</div>
                  <div className="text-[10px] text-slate-400">Free Community Tier</div>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-slate-700 dark:text-slate-200">
                {planDistribution.starter || 0} orgs
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <div>
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Growth Plan ($49/mo)</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400">Standard Production Tier</div>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-indigo-700 dark:text-indigo-300">
                {planDistribution.growth || 0} orgs
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200">Enterprise ($199/mo)</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400">Dedicated Scale & SLA</div>
                </div>
              </div>
              <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-300">
                {planDistribution.enterprise || 0} orgs
              </span>
            </div>
          </div>
        </div>

        {/* Global Pipeline Metrics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform Workload & Processing Volume
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Live MongoDB Aggregation</span>
          </div>

          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block font-mono">
                {overview.totalWorkflows || 0}
              </span>
              <span className="text-xs font-bold text-slate-500 mt-1 block">Active Workflows</span>
            </div>

            <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block font-mono">
                {overview.totalRequests || 0}
              </span>
              <span className="text-xs font-bold text-slate-500 mt-1 block">Requests Handled</span>
            </div>

            <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block font-mono">
                {overview.completedTasks || 0}
              </span>
              <span className="text-xs font-bold text-slate-500 mt-1 block">Tasks Completed</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <span>Multi-Tenant Node Cluster: <strong>US-East (Primary)</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>RBAC Isolation: <strong>100% Enforced</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Organizations Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Tenant Organizations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recently provisioned workspace clusters on the platform
            </p>
          </div>

          <Link
            to="/admin/organizations"
            className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl text-xs font-bold transition"
          >
            Manage All Organizations ({overview.totalOrganizations || 0}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Organization</th>
                <th className="pb-3">Slug</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Workspace Owner</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrganizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 font-bold text-slate-900 dark:text-white">{org.name}</td>
                  <td className="py-3 font-mono text-slate-400">{org.slug}</td>
                  <td className="py-3">
                    <span className="capitalize font-bold text-indigo-600 dark:text-indigo-400">
                      {org.plan}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        org.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">
                    {org.owner} <span className="text-slate-400">({org.ownerEmail})</span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
