import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  SlidersHorizontal,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Shield,
  X,
  Edit,
  Save,
  PauseCircle,
  PlayCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';

export const PlatformOrganizations = () => {
  const [orgs, setOrgs] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Edit Modal State
  const [editingOrg, setEditingOrg] = useState(null);
  const [editPlan, setEditPlan] = useState('starter');
  const [editStatus, setEditStatus] = useState('active');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const res = await platformAdminService.getOrganizations({
        search: search || undefined,
        plan: selectedPlan || undefined,
        status: selectedStatus || undefined,
      });
      setOrgs(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [search, selectedPlan, selectedStatus]);

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setEditPlan(org.plan || 'starter');
    setEditStatus(org.status || 'active');
    setModalError('');
  };

  const handleSaveOrgControl = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;
    setIsUpdating(true);
    setModalError('');

    try {
      await platformAdminService.updateOrganization(editingOrg.id, {
        plan: editPlan,
        status: editStatus,
      });
      setSuccessMessage(`Organization "${editingOrg.name}" updated successfully!`);
      setEditingOrg(null);
      fetchOrganizations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update organization');
    } finally {
      setIsUpdating(false);
    }
  };

  const plans = [
    { label: 'All Plans', value: '' },
    { label: 'Starter', value: 'starter' },
    { label: 'Growth', value: 'growth' },
    { label: 'Enterprise', value: 'enterprise' },
  ];

  const statuses = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🏢</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Organizations Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global tenant cluster control: modify tier subscriptions, suspend rogue workspaces, and monitor operational scale.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Total Workspaces: <strong className="text-slate-900 dark:text-white font-mono">{total}</strong>
          </span>
        </div>
      </div>

      {/* Global Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by organization name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs placeholder-slate-400 border-none bg-transparent focus:outline-hidden text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Plan Filter */}
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {plans.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
            <p className="text-xs">Loading customer organizations...</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No organizations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Organization</th>
                  <th className="py-3.5 px-4">Plan Tier</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Active Team</th>
                  <th className="py-3.5 px-4">Workflows</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {org.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {org.slug}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          org.plan === 'enterprise'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                            : org.plan === 'growth'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {org.plan}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          org.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {org.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {org.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {org.stats?.activeMembers || 1} members
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {org.stats?.activeWorkflows || 0} active
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {org.owner?.name || 'Owner'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{org.owner?.email}</div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleOpenEdit(org)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Manage Control</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Organization Control Modal */}
      {editingOrg && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <form onSubmit={handleSaveOrgControl}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/50">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {editingOrg.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Slug: {editingOrg.slug}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingOrg(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Controls */}
                <div className="p-6 space-y-5">
                  {modalError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-semibold border border-rose-200">
                      {modalError}
                    </div>
                  )}

                  {/* Plan Tier Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Subscription Tier
                    </label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="starter">Starter Plan (Free Community)</option>
                      <option value="growth">Growth Plan ($49/month)</option>
                      <option value="enterprise">Enterprise Tier ($199/month)</option>
                    </select>
                  </div>

                  {/* Status Toggle */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Workspace Lifecycle Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active (Normal Operational Access)</option>
                      <option value="suspended">Suspended (Block all members & execution)</option>
                    </select>
                  </div>

                  {/* Organization Stats Summary */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Members:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{editingOrg.stats?.activeMembers || 1} users</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Workflows:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{editingOrg.stats?.activeWorkflows || 0} pipelines</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingOrg(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdating ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default PlatformOrganizations;
