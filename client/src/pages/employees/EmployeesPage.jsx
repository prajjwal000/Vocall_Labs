import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../hooks/useOrganization';
import { usePermissions } from '../../hooks/usePermissions';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { roleService } from '../../services/roleService';
import {
  Users,
  Search,
  Filter,
  Briefcase,
  Shield,
  Mail,
  Calendar,
  Clock,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  UserCheck,
  Building,
} from 'lucide-react';

export const EmployeesPage = () => {
  const { activeOrganization } = useOrganization();
  const { can, isOwner } = usePermissions();
  const queryClient = useQueryClient();

  const orgId = activeOrganization?.id || activeOrganization?._id;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    departmentId: '',
    jobTitle: '',
    roleId: '',
  });

  // 1. Fetch Employees
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
  } = useQuery({
    queryKey: [
      'employees',
      orgId,
      searchQuery,
      selectedDeptFilter,
      selectedRoleFilter,
      selectedStatusFilter,
    ],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await employeeService.getEmployees(orgId, {
        search: searchQuery,
        departmentId: selectedDeptFilter,
        roleId: selectedRoleFilter,
        status: selectedStatusFilter,
      });
      return res.data || [];
    },
    enabled: Boolean(orgId) && (can('employees.read') || isOwner),
  });

  // 2. Fetch Departments for Dropdowns
  const { data: departmentsData = [] } = useQuery({
    queryKey: ['departments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await departmentService.getDepartments(orgId);
      return res.data || [];
    },
    enabled: Boolean(orgId),
  });

  // 3. Fetch Roles for Dropdowns
  const { data: rolesData = [] } = useQuery({
    queryKey: ['roles', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await roleService.getOrganizationRoles(orgId);
      return res.data || [];
    },
    enabled: Boolean(orgId),
  });

  const employees = employeesData || [];
  const departments = departmentsData || [];
  const roles = rolesData || [];

  // Update Employee Mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, payload }) =>
      employeeService.updateEmployee(orgId, employeeId, payload),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Employee details updated successfully!' });
      setModalOpen(false);
      setEditingEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['employees', orgId] });
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update employee',
      });
    },
  });

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      departmentId: emp.department?.id || '',
      jobTitle: emp.jobTitle || '',
      roleId: emp.role?.id || '',
    });
    setModalOpen(true);
  };

  const handleSaveEmployee = (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setStatusMessage({ type: '', text: '' });
    updateEmployeeMutation.mutate({
      employeeId: editingEmployee.id,
      payload: {
        departmentId: formData.departmentId || null,
        jobTitle: formData.jobTitle,
        roleId: formData.roleId || undefined,
      },
    });
  };

  if (!can('employees.read') && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view the employee directory.
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
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Employee Directory & Staff Roster
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View team members, assign departments, configure job titles, and manage organizational access for{' '}
            <strong className="text-slate-900 dark:text-white">{activeOrganization?.name}</strong>.
          </p>
        </div>
      </div>

      {/* Status Messages */}
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

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, email, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Departments</option>
            <option value="unassigned">Unassigned</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                [{d.code}] {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id || r._id} value={r.id || r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Organization Members ({employees.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active staff members, assigned departments, and system privileges.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-4">Job Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">RBAC Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isLoadingEmployees ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Loading employee directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No employees match the selected criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const canEdit = (can('employees.update') || isOwner) && !emp.isOwner;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {emp.fullName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {emp.jobTitle || 'Team Member'}
                      </td>

                      <td className="py-4 px-4">
                        {emp.department ? (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                            style={{ backgroundColor: emp.department.color || '#6366f1' }}
                          >
                            [{emp.department.code}] {emp.department.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            emp.isOwner
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                          }`}
                        >
                          {emp.role?.name || emp.role?.key}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.membershipStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {emp.membershipStatus}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {canEdit ? (
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ml-auto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Profile</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {emp.isOwner ? 'Workspace Owner' : 'View Only'}
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

      {/* Edit Employee Modal */}
      {modalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <form onSubmit={handleSaveEmployee}>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Employee Profile
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingEmployee.fullName} ({editingEmployee.email})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Job Title / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Frontend Architect"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assigned Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Unassigned (No Department)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.code}] {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!editingEmployee.isOwner && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      RBAC Role
                    </label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      {roles
                        .filter((r) => r.key !== 'owner')
                        .map((r) => (
                          <option key={r.id || r._id} value={r.id || r._id}>
                            {r.name} ({r.key})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {updateEmployeeMutation.isPending ? 'Saving...' : 'Save Changes'}
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

export default EmployeesPage;
