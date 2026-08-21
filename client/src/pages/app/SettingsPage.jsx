import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

const SettingsPage = () => {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMeetsPolicy = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setStatusMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (currentPassword === newPassword) {
      setStatusMessage({ type: 'error', text: 'New password cannot be the same as current password' });
      return;
    }

    if (
      !passwordMeetsPolicy.length ||
      !passwordMeetsPolicy.upper ||
      !passwordMeetsPolicy.lower ||
      !passwordMeetsPolicy.number
    ) {
      setStatusMessage({ type: 'error', text: 'New password does not satisfy security requirements' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setStatusMessage({ type: 'success', text: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please check your current password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account information and security credentials.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">User Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Your personal identification details on Nexus</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider">Full Name</span>
            <span className="block font-medium text-slate-900 mt-1">{user?.firstName} {user?.lastName}</span>
          </div>
          <div>
            <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider">Email Address</span>
            <span className="block font-medium text-slate-900 mt-1">{user?.email}</span>
          </div>
          <div>
            <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider">Account Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mt-1 capitalize">
              {user?.status || 'active'}
            </span>
          </div>
        </div>
      </div>

      {/* Security & Password Change */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Security & Password</h2>
          <p className="text-xs text-slate-500 mt-0.5">Update your password regularly to keep your account secure</p>
        </div>
        
        <div className="p-6">
          {statusMessage.text && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Password policy checklist */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-medium text-slate-700 mb-1">Password requirements:</div>
              <div className={`flex items-center ${passwordMeetsPolicy.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.length ? '✓' : '•'}</span> At least 8 characters
              </div>
              <div className={`flex items-center ${passwordMeetsPolicy.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.upper ? '✓' : '•'}</span> At least one uppercase letter
              </div>
              <div className={`flex items-center ${passwordMeetsPolicy.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.lower ? '✓' : '•'}</span> At least one lowercase letter
              </div>
              <div className={`flex items-center ${passwordMeetsPolicy.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.number ? '✓' : '•'}</span> At least one number
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
