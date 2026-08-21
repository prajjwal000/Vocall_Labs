import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformRoleService } from '../../services/platformRoleService';
import { usePlatformPermissionStore } from '../../store/platformPermissionStore';
import { Shield, Lock, CheckCircle2, AlertCircle, Save, Users, Sparkles } from 'lucide-react';

export const PlatformRolesManagement = () => {
  const queryClient = useQueryClient();
  const { can } = usePlatformPermissionStore();

  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'team'
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // 1. Fetch Platform Roles & Permission Catalog
  const {
    data: rolesData,
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: ['platform-roles'],
    queryFn: async () => {
      const res = await platformRoleService.getPlatformRoles();
      return {
        roles: res.data || [],
        catalog: res.catalog || [],
      };
    },
    enabled: can('roles.view'),
  });

  // 2. Fetch Platform Team Users
  const {
    data: teamUsers = [],
    isLoading: isLoadingTeam,
  } = useQuery({
    queryKey: ['platform-users'],
    queryFn: async () => {
      const res = await platformRoleService.getPlatformUsers();
      return res.data || [];
    },
    enabled: can('users.view'),
  });

  const roles = rolesData?.roles || [];
  const catalog = rolesData?.catalog || [];

  // Group catalog by module
  const groupedCatalog = catalog.reduce((acc, perm) => {
    const mod = perm.module || 'other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  // Selected Role
  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  useEffect(() => {
    if (activeRole) {
      setSelectedRoleId(activeRole.id);
      setRolePermissions(activeRole.permissions || []);
    }
  }, [activeRole?.id]);

  // Update Role Permissions Mutation
  const updateRoleMutation = useMutation({
    mutationFn: (newPerms) =>
      platformRoleService.updatePlatformRole(activeRole.id, {
        permissions: newPerms,
      }),
    onSuccess: () => {
      setStatusMessage({
        type: 'success',
        text: `Permissions for ${activeRole?.name} updated successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update platform role',
      });
    },
  });

  // Assign Team Member Role Mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }) =>
      platformRoleService.assignUserPlatformRole(userId, roleId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Team member platform role updated!' });
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to assign role',
      });
    },
  });

  const handleTogglePermission = (key) => {
    if (activeRole?.isLocked) return;
    if (rolePermissions.includes(key)) {
      setRolePermissions(rolePermissions.filter((p) => p !== key));
    } else {
      setRolePermissions([...rolePermissions, key]);
    }
  };

  const handleToggleModule = (moduleName) => {
    if (activeRole?.isLocked) return;
    const modPerms = (groupedCatalog[moduleName] || []).map((p) => p.key);
    const allSelected = modPerms.every((p) => rolePermissions.includes(p));

    if (allSelected) {
      setRolePermissions(rolePermissions.filter((p) => !modPerms.includes(p)));
    } else {
      const merged = new Set([...rolePermissions, ...modPerms]);
      setRolePermissions(Array.from(merged));
    }
  };

  const handleSave = () => {
    setStatusMessage({ type: '', text: '' });
    updateRoleMutation.mutate(rolePermissions);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Roles & Access Control
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure internal Nexus administrative roles, permission matrices, and platform staff.
          </p>
        </div>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold border flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Role Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Platform Team Members ({teamUsers.length})
        </button>
      </div>

      {/* Tab 1: Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles List Sidebar */}
          <div className="space-y-2">
            <h2 className="text-xs uppercase font-bold text-slate-400 px-1 mb-2">
              Platform Roles
            </h2>
            {isLoadingRoles ? (
              <div className="text-xs text-slate-500 py-4">Loading roles...</div>
            ) : (
              roles.map((r) => {
                const isSelected = r.id === activeRole?.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRoleId(r.id);
                      setRolePermissions(r.permissions || []);
                      setStatusMessage({ type: '', text: '' });
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-500/50 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {r.name}
                      </span>
                      {r.isLocked && (
                        <span className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 font-semibold">
                          <Lock className="w-2.5 h-2.5 mr-1" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Permissions Matrix Detail */}
          <div className="lg:col-span-3 space-y-6">
            {activeRole && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {activeRole.name} Permissions
                      </h2>
                      {activeRole.isLocked && (
                        <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 px-2 py-0.5 rounded-md font-semibold">
                          System Locked (Super Admin)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activeRole.description}
                    </p>
                  </div>

                  {can('roles.update') && !activeRole.isLocked && (
                    <button
                      onClick={handleSave}
                      disabled={updateRoleMutation.isPending}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {updateRoleMutation.isPending ? 'Saving...' : 'Save Permissions'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Modules Grid */}
                <div className="space-y-6">
                  {Object.entries(groupedCatalog).map(([modName, perms]) => {
                    const modPermKeys = perms.map((p) => p.key);
                    const isAllSelected =
                      activeRole.permissions?.includes('*') ||
                      modPermKeys.every((k) => rolePermissions.includes(k));

                    return (
                      <div
                        key={modName}
                        className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {modName} Module
                          </h3>
                          {!activeRole.isLocked && (
                            <button
                              type="button"
                              onClick={() => handleToggleModule(modName)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                            >
                              {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {perms.map((perm) => {
                            const isChecked =
                              activeRole.permissions?.includes('*') ||
                              rolePermissions.includes(perm.key);

                            return (
                              <label
                                key={perm.key}
                                className={`flex items-start space-x-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-500/30'
                                    : 'bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/50'
                                } ${
                                  activeRole.isLocked ? 'cursor-not-allowed opacity-80' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={activeRole.isLocked}
                                  onChange={() => handleTogglePermission(perm.key)}
                                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                    {perm.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                                    {perm.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Team Members Assignment */}
      {activeTab === 'team' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform Staff Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Users with internal platform access and assigned administrative roles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Assigned Role</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoadingTeam ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-500">
                      Loading platform team...
                    </td>
                  </tr>
                ) : teamUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-500">
                      No platform staff found.
                    </td>
                  </tr>
                ) : (
                  teamUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-slate-200">
                        {u.firstName} {u.lastName}
                        {u.isBootstrapAdmin && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-[10px] font-bold">
                            Bootstrap Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                          {u.platformRole?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {u.platformStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {can('users.update') && !u.isBootstrapAdmin ? (
                          <select
                            value={u.platformRole?.id || u.platformRole?._id || ''}
                            onChange={(e) =>
                              assignRoleMutation.mutate({
                                userId: u.id,
                                roleId: e.target.value,
                              })
                            }
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-indigo-500"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {u.isBootstrapAdmin ? 'Immutable' : 'Read-only'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformRolesManagement;
