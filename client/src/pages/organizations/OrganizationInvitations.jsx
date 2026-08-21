import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../hooks/useOrganization';
import { invitationService } from '../../services/invitationService';
import { organizationService } from '../../services/organizationService';

const OrganizationInvitations = () => {
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [newDomain, setNewDomain] = useState('');

  // Domain restriction state
  const [domainEnabled, setDomainEnabled] = useState(
    activeOrganization?.settings?.domainRestrictionEnabled || false
  );
  const [allowedDomains, setAllowedDomains] = useState(
    activeOrganization?.settings?.allowedEmailDomains || []
  );

  const orgId = activeOrganization?.id;
  const isOwnerOrAdmin =
    activeOrganization?.role === 'owner' || activeOrganization?.role === 'admin';

  // Fetch invitations
  const {
    data: invitationsData,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: ['invitations', orgId, activeTab],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await invitationService.getInvitations(orgId, {
        status: activeTab === 'all' ? undefined : activeTab,
      });
      return res.data || [];
    },
    enabled: Boolean(orgId) && isOwnerOrAdmin,
  });

  const invitations = invitationsData || [];

  // Invite Mutation
  const inviteMutation = useMutation({
    mutationFn: (email) => invitationService.createInvitation(orgId, { email }),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}!` });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send invitation',
      });
    },
  });

  // Resend Mutation
  const resendMutation = useMutation({
    mutationFn: (invitationId) => invitationService.resendInvitation(orgId, invitationId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Invitation resent successfully with a fresh token!' });
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to resend invitation',
      });
    },
  });

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: (invitationId) => invitationService.revokeInvitation(orgId, invitationId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Invitation revoked successfully.' });
      queryClient.invalidateQueries({ queryKey: ['invitations', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to revoke invitation',
      });
    },
  });

  // Domain Settings Save
  const handleSaveDomains = async () => {
    try {
      await organizationService.updateOrganization(orgId, {
        domainRestrictionEnabled: domainEnabled,
        allowedEmailDomains: allowedDomains,
      });
      await refreshOrganizations();
      setStatusMessage({ type: 'success', text: 'Domain restriction settings updated!' });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update domain settings',
      });
    }
  };

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    const cleanDomain = newDomain.toLowerCase().trim().replace(/^@/, '');
    if (!allowedDomains.includes(cleanDomain)) {
      setAllowedDomains([...allowedDomains, cleanDomain]);
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domainToRemove) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domainToRemove));
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    if (!inviteEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }
    inviteMutation.mutate(inviteEmail.trim());
  };

  if (!isOwnerOrAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          Only organization owners and administrators can manage team invitations.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Accepted</span>;
      case 'expired':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Expired</span>;
      case 'revoked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Revoked</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Invitations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Invite colleagues and employees to join <span className="font-semibold text-slate-800">{activeOrganization?.name}</span>.
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Domain Restriction Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Email Domain Restriction</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only permit invitations to employees with specific corporate email domains.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={domainEnabled}
              onChange={(e) => setDomainEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {domainEnabled && (
          <div className="space-y-4 pt-2">
            <form onSubmit={handleAddDomain} className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. acme.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Add Domain
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1">
              {allowedDomains.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No domains added. All domains will be blocked until one is specified.</span>
              ) : (
                allowedDomains.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    @{d}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(d)}
                      className="ml-1.5 text-indigo-400 hover:text-indigo-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveDomains}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Save Domain Rules
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Invite New Employee</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            An invitation link will be dispatched to their email address.
          </p>
        </div>

        <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Invitation History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage existing team invitations</p>
          </div>

          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {['all', 'pending', 'accepted', 'expired', 'revoked'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Sent By</th>
                <th className="px-6 py-3.5">Expires</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingInvitations ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-xs text-slate-400">
                    Loading invitations...
                  </td>
                </tr>
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-xs text-slate-400">
                    No {activeTab !== 'all' ? activeTab : ''} invitations found.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{inv.email}</td>
                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {inv.invitedBy ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName}` : 'Admin'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {(inv.status === 'pending' || inv.status === 'expired') && (
                        <button
                          onClick={() => resendMutation.mutate(inv.id)}
                          disabled={resendMutation.isPending}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
                        >
                          Resend
                        </button>
                      )}
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => revokeMutation.mutate(inv.id)}
                          disabled={revokeMutation.isPending}
                          className="text-xs font-semibold text-red-600 hover:text-red-500 cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrganizationInvitations;
