import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../hooks/useOrganization';
import { usePermissions } from '../../hooks/usePermissions';
import { roleService } from '../../services/roleService';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Lock,
  Users,
  Check,
} from 'lucide-react';

export const RolesManagement = () => {
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const { can, isOwner } = usePermissions();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'members'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Role Form state
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    permissions: [],
  });

  const orgId = activeOrganization?.id || activeOrganization?._id;

  // 1. Fetch Organization Roles
  const {
    data: rolesData,
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: ['roles', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await roleService.getOrganizationRoles(orgId);
      return res.data || [];
    },
    enabled: Boolean(orgId) && (can('roles.read') || isOwner),
  });

  // 2. Fetch Permissions Catalog
  const { data: permissionsCatalog = [] } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: async () => {
      const res = await roleService.getPermissions();
      return res.data || [];
    },
  });

  // 3. Fetch Organization Members with Roles
  const {
    data: membersData,
    isLoading: isLoadingMembers,
  } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await roleService.getOrganizationMembers(orgId);
      return res.data || [];
    },
    enabled: Boolean(orgId) && (can('roles.read') || isOwner),
  });

  const roles = rolesData || [];
  const members = membersData || [];

  // Group permissions by module
  const groupedPermissions = permissionsCatalog.reduce((acc, perm) => {
    const mod = perm.module || 'other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  // Save Role Mutation (Create / Update)
  const saveRoleMutation = useMutation({
    mutationFn: async (payload) => {
      const roleId = editingRole?.id || editingRole?._id;
      if (editingRole && roleId) {
        return roleService.updateRole(orgId, roleId, payload);
      }
      return roleService.createRole(orgId, payload);
    },
    onSuccess: () => {
      setStatusMessage({
        type: 'success',
        text: `Role ${editingRole ? 'updated' : 'created'} successfully!`,
      });
      setModalOpen(false);
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      refreshOrganizations();
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save role',
      });
    },
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => roleService.deleteRole(orgId, roleId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Role deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      refreshOrganizations();
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete role',
      });
    },
  });

  // Assign Member Role Mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ memberId, roleId }) =>
      roleService.assignMemberRole(orgId, memberId, roleId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Member role updated!' });
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      refreshOrganizations();
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to assign role',
      });
    },
  });

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      permissions: [],
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      key: role.key || '',
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
    });
    setModalOpen(true);
  };

  const handleTogglePermission = (key) => {
    const current = formData.permissions || [];
    if (current.includes(key)) {
      setFormData({ ...formData, permissions: current.filter((p) => p !== key) });
    } else {
      setFormData({ ...formData, permissions: [...current, key] });
    }
  };

  const handleToggleModule = (moduleName) => {
    const modPerms = (groupedPermissions[moduleName] || []).map((p) => p.key);
    const current = formData.permissions || [];
    const allSelected = modPerms.length > 0 && modPerms.every((p) => current.includes(p));

    if (allSelected) {
      setFormData({
        ...formData,
        permissions: current.filter((p) => !modPerms.includes(p)),
      });
    } else {
      const newPerms = new Set([...current, ...modPerms]);
      setFormData({ ...formData, permissions: Array.from(newPerms) });
    }
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    saveRoleMutation.mutate(formData);
  };

  if (!can('roles.read') && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view or manage organization roles.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Roles & Permissions (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Role-Based Access Control and configure module permissions for{' '}
            <strong className="text-slate-900 dark:text-white">{activeOrganization?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {(can('roles.create') || isOwner) && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
          )}
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
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roles'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Organization Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'members'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Member Role Assignment ({members.length})
        </button>
      </div>

      {/* Tab 1: Roles List */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoadingRoles ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse" />
            ))
          ) : (
            roles.map((role) => {
              const isOwnerRole = role.key === 'owner';
              const canEditThisRole = (can('roles.update') || isOwner) && !isOwnerRole;
              const canDeleteThisRole =
                (can('roles.delete') || isOwner) &&
                !role.isSystem &&
                !['owner', 'admin', 'member'].includes(role.key);

              return (
                <div
                  key={role.id || role._id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {role.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold block">
                            key: {role.key}
                          </span>
                        </div>
                      </div>

                      {role.isSystem && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          {isOwnerRole ? <Lock className="w-3 h-3 text-amber-500" /> : null}
                          System
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {role.description || 'Standard workspace operational role.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">
                        Permissions Granted:
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {isOwnerRole ? 'All (*)' : `${role.permissions?.length || 0} capabilities`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {canEditThisRole ? (
                      <button
                        onClick={() => handleOpenEditModal(role)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Role</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {isOwnerRole ? 'Full Access' : 'Read-only'}
                      </span>
                    )}

                    {canDeleteThisRole && (
                      <button
                        onClick={() => deleteRoleMutation.mutate(role.id || role._id)}
                        disabled={deleteRoleMutation.isPending}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Member Role Assignment */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Team Member Role Assignment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assign defined organization roles to team members to grant operational permissions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Current Role</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-5 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {isLoadingMembers ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      Loading team members...
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const isOrgOwner = m.role === 'owner';
                    const canChangeThisMember = (can('roles.update') || isOwner) && !isOrgOwner;

                    return (
                      <tr key={m.id || m._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.user?.firstName} {m.user?.lastName}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {m.user?.email}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                              isOrgOwner
                                ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                            }`}
                          >
                            {m.roleId?.name || m.role}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-400">
                          {new Date(m.joinedAt || m.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-5 text-right">
                          {canChangeThisMember ? (
                            <select
                              value={m.roleId?.id || m.roleId?._id || ''}
                              onChange={(e) =>
                                assignRoleMutation.mutate({
                                  memberId: m.id || m._id,
                                  roleId: e.target.value,
                                })
                              }
                              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="" disabled>Select Role</option>
                              {roles
                                .filter((r) => r.key !== 'owner')
                                .map((r) => (
                                  <option key={r.id || r._id} value={r.id || r._id}>
                                    {r.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {isOrgOwner ? 'Workspace Owner' : 'Immutable'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col justify-between">
            <form onSubmit={handleSaveRole} className="flex flex-col h-full overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Define specific module permissions for this role
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Role Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Department Manager"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          key: editingRole
                            ? formData.key
                            : e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Role Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingRole)}
                      placeholder="e.g. manager"
                      value={formData.key}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manager review authority for requisitions and workflows"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Grouped Permissions Matrix */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Module Permissions
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([modName, perms]) => {
                      const allSelected =
                        perms.length > 0 &&
                        perms.every((p) => (formData.permissions || []).includes(p.key));

                      return (
                        <div
                          key={modName}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                              {modName}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleModule(modName)}
                              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perms.map((p) => {
                              const isChecked = (formData.permissions || []).includes(p.key);
                              return (
                                <label
                                  key={p.key}
                                  className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                                    isChecked
                                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50'
                                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(p.key)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">
                                      {p.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      {p.key}
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
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveRoleMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {saveRoleMutation.isPending
                      ? 'Saving...'
                      : editingRole
                      ? 'Update Role'
                      : 'Create Role'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;
