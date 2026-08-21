import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Check,
  Edit,
  Save,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';

export const PlatformPricing = () => {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    priceMonthly: 0,
    membersLimit: 5,
    workflowsLimit: 5,
    tasksLimit: 20,
    storageLimitMb: 500,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const res = await platformAdminService.getPricingPlans();
      setPlans(res.plans || []);
    } catch (err) {
      console.error('Failed to fetch pricing plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      priceMonthly: plan.priceMonthly || 0,
      membersLimit: plan.limits?.membersLimit || 5,
      workflowsLimit: plan.limits?.workflowsLimit || 5,
      tasksLimit: plan.limits?.tasksLimit || 20,
      storageLimitMb: plan.limits?.storageLimitMb || 500,
    });
    setModalError('');
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsUpdating(true);
    setModalError('');

    try {
      await platformAdminService.updatePricingPlan(editingPlan.key, formData);
      setSuccessMessage(`Pricing tier "${editingPlan.name}" updated successfully!`);
      setEditingPlan(null);
      fetchPlans();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update pricing plan');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">💳</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Pricing & Limits Configuration
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure global SaaS subscription pricing tiers, feature allocations, and system capacity limits.
          </p>
        </div>
      </div>

      {/* Success Banner */}
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

      {/* Pricing Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isGrowth = plan.key === 'growth';
            const isEnterprise = plan.key === 'enterprise';

            return (
              <motion.div
                key={plan.key}
                whileHover={{ y: -4 }}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-8 border flex flex-col justify-between relative shadow-xs ${
                  isGrowth
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {isGrowth && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <span className="text-[11px] font-bold uppercase font-mono text-slate-400">
                      {plan.key}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  {/* Price Tag */}
                  <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                        ${plan.priceMonthly}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">/month</span>
                    </div>
                  </div>

                  {/* Limits Breakdown */}
                  <div className="space-y-2.5 pb-6 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Cluster Capacity Limits
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Max Team Members:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{plan.limits?.membersLimit}</strong>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Max Workflows:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{plan.limits?.workflowsLimit}</strong>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Monthly Task Quota:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{plan.limits?.tasksLimit}</strong>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Storage Allocation:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{plan.limits?.storageLimitMb} MB</strong>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-6 space-y-2.5">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Included Features
                    </div>
                    {plan.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Tier Limits & Pricing</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Plan Edit Modal */}
      {editingPlan && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <form onSubmit={handleSavePlan}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200/60">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Edit {editingPlan.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Key: {editingPlan.key}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {modalError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 font-semibold border border-rose-200">
                      {modalError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Monthly Price ($ USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.priceMonthly}
                      onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Max Team Members
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.membersLimit}
                        onChange={(e) => setFormData({ ...formData, membersLimit: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Max Workflows
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.workflowsLimit}
                        onChange={(e) => setFormData({ ...formData, workflowsLimit: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Monthly Tasks Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.tasksLimit}
                        onChange={(e) => setFormData({ ...formData, tasksLimit: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Storage Limit (MB)
                      </label>
                      <input
                        type="number"
                        min="50"
                        value={formData.storageLimitMb}
                        onChange={(e) => setFormData({ ...formData, storageLimitMb: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
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
                    <span>{isUpdating ? 'Saving...' : 'Update Plan'}</span>
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

export default PlatformPricing;
