import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../../services/organizationService';
import { useWorkspaceStore } from '../../store/workspaceStore';

const CreateOrganization = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveOrganization } = useWorkspaceStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!name.trim()) {
      setLocalError('Please enter an organization name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await organizationService.createOrganization({
        name: name.trim(),
        description: description.trim(),
      });

      if (res.success && res.data?.organization) {
        const newOrg = res.data.organization;
        // Invalidate organizations query so the list updates
        await queryClient.invalidateQueries({ queryKey: ['organizations'] });
        // Set as current active workspace
        setActiveOrganization(newOrg);
        // Navigate to dashboard
        navigate('/app/dashboard', { replace: true });
      } else {
        setLocalError(res.message || 'Failed to create organization');
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link
          to="/app/dashboard"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 inline-flex items-center space-x-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">Create New Organization</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up a new workspace to manage your employees, departments, and operations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {localError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              id="orgName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Technologies"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              This will be used to generate your workspace URL slug and identification.
            </p>
          </div>

          <div>
            <label htmlFor="orgDesc" className="block text-sm font-medium text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="orgDesc"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workspace or business unit"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating workspace...</span>
                </div>
              ) : (
                'Create workspace'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganization;
