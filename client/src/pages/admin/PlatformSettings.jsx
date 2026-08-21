import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';
import { platformAdminService } from '../../services/platformAdminService';

export const PlatformSettings = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State (Platform Admin Core Controls Only)
  const [platformName, setPlatformName] = useState('Nexus Platform');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationAllowed, setRegistrationAllowed] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await platformAdminService.getSettings();
      const s = res.data || {};
      setSettings(s);
      setPlatformName(s.platformName || 'Nexus Platform');
      setMaintenanceMode(Boolean(s.maintenanceMode));
      setRegistrationAllowed(s.registrationAllowed !== false);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await platformAdminService.updateSettings({
        platformName,
        maintenanceMode,
        registrationAllowed,
      });
      setSuccessMessage('Platform settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update platform settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2">
        <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
        <p className="text-xs">Loading platform configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Global Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure global platform identity, system maintenance windows, and tenant onboarding controls.
          </p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Platform Branding */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Server className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Identity & Branding
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Platform Brand Name
            </label>
            <input
              type="text"
              required
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Section 2: Platform Access & Maintenance Flags */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Access & Operations Lifecycle
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Maintenance Mode */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Maintenance Mode
                </div>
                <div className="text-[10px] text-slate-400">
                  Block customer logins during updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Open Registration */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Allow New Signups
                </div>
                <div className="text-[10px] text-slate-400">
                  Permit new organizations to register
                </div>
              </div>
              <input
                type="checkbox"
                checked={registrationAllowed}
                onChange={(e) => setRegistrationAllowed(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save Platform Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlatformSettings;
