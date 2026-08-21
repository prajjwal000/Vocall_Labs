import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../hooks/useOrganization';
import { usePermissions } from '../../hooks/usePermissions';
import { departmentService } from '../../services/departmentService';
import { roleService } from '../../services/roleService';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  DollarSign,
  Layers,
  ChevronRight,
  FolderTree,
  LayoutGrid,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  UserPlus,
  UserCheck,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const COLOR_PALETTES = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b', // Slate
];

export const DepartmentsPage = () => {
  const { activeOrganization } = useOrganization();
  const { can, isOwner } = usePermissions();
  const queryClient = useQueryClient();

  const orgId = activeOrganization?.id || activeOrganization?._id;

  // View state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'tree'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [rosterDrawerOpen, setRosterDrawerOpen] = useState(false);
  const [activeDeptForRoster, setActiveDeptForRoster] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    headUserId: '',
    parentDepartmentId: '',
    color: '#6366f1',
    budget: 0,
  });

  // Assign Member to Dept State
  const [selectedMemberIdToAdd, setSelectedMemberIdToAdd] = useState('');
  const [memberJobTitleToAdd, setMemberJobTitleToAdd] = useState('');

  // 1. Fetch Departments
  const {
    data: departmentsData,
    isLoading: isLoadingDepts,
    refetch: refetchDepts,
  } = useQuery({
    queryKey: ['departments', orgId, searchQuery, statusFilter],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await departmentService.getDepartments(orgId, {
        search: searchQuery,
        status: statusFilter,
      });
      return res.data || [];
    },
    enabled: Boolean(orgId) && (can('departments.read') || isOwner),
  });

  // 2. Fetch Organization Tree
  const { data: treeData = [] } = useQuery({
    queryKey: ['departments-tree', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await departmentService.getDepartmentTree(orgId);
      return res.data || [];
    },
    enabled: Boolean(orgId) && viewMode === 'tree' && (can('departments.read') || isOwner),
  });

  // 3. Fetch Organization Members (for Head of Dept / Member selector)
  const { data: membersData = [] } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await roleService.getOrganizationMembers(orgId);
      return res.data || [];
    },
    enabled: Boolean(orgId) && (can('departments.read') || isOwner),
  });

  // 4. Fetch Active Department Details for Roster Drawer
  const {
    data: activeDeptDetails,
    isLoading: isLoadingRoster,
    refetch: refetchRoster,
  } = useQuery({
    queryKey: ['department-detail', orgId, activeDeptForRoster?.id],
    queryFn: async () => {
      if (!orgId || !activeDeptForRoster?.id) return null;
      const res = await departmentService.getDepartmentById(orgId, activeDeptForRoster.id);
      return res.data || null;
    },
    enabled: Boolean(orgId) && Boolean(activeDeptForRoster?.id) && rosterDrawerOpen,
  });

  const departments = departmentsData || [];
  const members = membersData || [];

  // Mutations
  const saveDeptMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingDept) {
        return departmentService.updateDepartment(orgId, editingDept.id, payload);
      }
      return departmentService.createDepartment(orgId, payload);
    },
    onSuccess: () => {
      setStatusMessage({
        type: 'success',
        text: `Department ${editingDept ? 'updated' : 'created'} successfully!`,
      });
      setModalOpen(false);
      setEditingDept(null);
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] });
      queryClient.invalidateQueries({ queryKey: ['departments-tree', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save department',
      });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (deptId) => departmentService.deleteDepartment(orgId, deptId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Department deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] });
      queryClient.invalidateQueries({ queryKey: ['departments-tree', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete department',
      });
    },
  });

  const assignMemberMutation = useMutation({
    mutationFn: ({ deptId, memberIds, jobTitle }) =>
      departmentService.assignMembers(orgId, deptId, { memberIds, jobTitle }),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Member assigned to department!' });
      setSelectedMemberIdToAdd('');
      setMemberJobTitleToAdd('');
      refetchRoster();
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] });
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to assign member',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ deptId, memberId }) =>
      departmentService.removeMember(orgId, deptId, memberId),
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Member removed from department.' });
      refetchRoster();
      queryClient.invalidateQueries({ queryKey: ['departments', orgId] });
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove member',
      });
    },
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      headUserId: '',
      parentDepartmentId: '',
      color: '#6366f1',
      budget: 0,
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      headUserId: dept.headUserId?._id || dept.headUserId || '',
      parentDepartmentId: dept.parentDepartmentId?._id || dept.parentDepartmentId || '',
      color: dept.color || '#6366f1',
      budget: dept.budget || 0,
    });
    setModalOpen(true);
  };

  // Open Roster Drawer
  const handleOpenRoster = (dept) => {
    setActiveDeptForRoster(dept);
    setRosterDrawerOpen(true);
  };

  const handleSaveDepartment = (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    saveDeptMutation.mutate({
      ...formData,
      budget: Number(formData.budget) || 0,
      headUserId: formData.headUserId || null,
      parentDepartmentId: formData.parentDepartmentId || null,
    });
  };

  const handleAddMemberToDept = (e) => {
    e.preventDefault();
    if (!selectedMemberIdToAdd || !activeDeptForRoster) return;
    assignMemberMutation.mutate({
      deptId: activeDeptForRoster.id,
      memberIds: [selectedMemberIdToAdd],
      jobTitle: memberJobTitleToAdd || 'Team Member',
    });
  };

  // Aggregated KPIs
  const totalHeadcount = departments.reduce((acc, d) => acc + (d.memberCount || 0), 0);
  const totalBudget = departments.reduce((acc, d) => acc + (d.budget || 0), 0);
  const avgTeamSize =
    departments.length > 0 ? (totalHeadcount / departments.length).toFixed(1) : '0';

  if (!can('departments.read') && !isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">
          You do not have permission to view or manage organizational departments.
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
            <span className="text-2xl">💼</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Departments & Organizational Structure
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize teams, assign department managers, manage departmental budgets, and visualize reporting hierarchies for{' '}
            <strong className="text-slate-900 dark:text-white">{activeOrganization?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Grid vs Tree View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Org Tree</span>
            </button>
          </div>

          {(can('departments.create') || isOwner) && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Department</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Departments
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {departments.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active teams</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Assigned Staff
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalHeadcount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across all departments</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Budget
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalBudget.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Allocated capital</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Team Size
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {avgTeamSize}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Members / dept</div>
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

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by department name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="active">Active Departments</option>
            <option value="archived">Archived Departments</option>
            <option value="all">All Departments</option>
          </select>
        </div>
      </div>

      {/* View Mode 1: Grid Cards */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoadingDepts ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse"
              />
            ))
          ) : departments.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No departments found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Try modifying your search filter.' : 'Create your first organizational department.'}
              </p>
            </div>
          ) : (
            departments.map((dept) => {
              const canEdit = can('departments.update') || isOwner;
              const canDelete = can('departments.delete') || isOwner;

              return (
                <div
                  key={dept.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                >
                  <div className="space-y-3">
                    {/* Card Top: Color accent & Code */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs"
                          style={{ backgroundColor: dept.color || '#6366f1' }}
                        >
                          {dept.code}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {dept.name}
                          </h3>
                          {dept.parentDepartment && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <span>Parent:</span>
                              <strong className="text-slate-600 dark:text-slate-300">
                                {dept.parentDepartment.name}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {dept.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {dept.description || 'Organizational business department.'}
                    </p>

                    {/* Department Head / Lead */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {dept.headUser?.name
                            ? dept.headUser.name.split(' ').map((n) => n[0]).join('')
                            : '—'}
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 block">
                            Department Head
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {dept.headUser?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      {dept.budget > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] font-medium text-slate-400 block">
                            Budget
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ${dept.budget.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Roster & Controls */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenRoster(dept)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{dept.memberCount} Staff Member{dept.memberCount === 1 ? '' : 's'}</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditModal(dept)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => deleteDeptMutation.mutate(dept.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View Mode 2: Hierarchy Org Tree */}
      {viewMode === 'tree' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Organizational Tree & Reporting Structure
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hierarchical view of parent and child departmental divisions.
            </p>
          </div>

          <div className="space-y-4">
            {treeData.map((node) => (
              <div
                key={node.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: node.color || '#6366f1' }}
                    >
                      {node.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {node.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Head: {node.headUser?.name || 'Unassigned'} • {node.memberCount} Members
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRoster(node)}
                    className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600"
                  >
                    View Roster
                  </button>
                </div>

                {/* Sub-departments */}
                {node.children && node.children.length > 0 && (
                  <div className="ml-6 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/50 space-y-2 pt-2">
                    {node.children.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: sub.color || '#8b5cf6' }}
                          >
                            {sub.code}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {sub.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({sub.memberCount} members)
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenRoster(sub)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          Manage
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Create / Edit Department */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <form onSubmit={handleSaveDepartment}>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingDept ? `Edit Department: ${editingDept.name}` : 'Create Department'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure organizational division properties and leadership
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

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Engineering & Technology"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Code (Tag) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ENG"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief summary of department responsibilities and operational mission..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Head of Department */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department Head / Manager
                    </label>
                    <select
                      value={formData.headUserId}
                      onChange={(e) => setFormData({ ...formData, headUserId: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">No Manager Assigned</option>
                      {members.map((m) => (
                        <option key={m.userId?.id || m.userId?._id} value={m.userId?.id || m.userId?._id}>
                          {m.user?.firstName} {m.user?.lastName} ({m.roleId?.name || m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Parent Department */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Parent Department (Optional)
                    </label>
                    <select
                      value={formData.parentDepartmentId}
                      onChange={(e) =>
                        setFormData({ ...formData, parentDepartmentId: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">Root Department (No Parent)</option>
                      {departments
                        .filter((d) => !editingDept || d.id !== editingDept.id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            [{d.code}] {d.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Budget Allocated ($ USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Department Color Accent
                    </label>
                    <div className="flex items-center space-x-1.5 pt-1">
                      {COLOR_PALETTES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            formData.color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
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
                  disabled={saveDeptMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {saveDeptMutation.isPending
                      ? 'Saving...'
                      : editingDept
                      ? 'Update Department'
                      : 'Create Department'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer 2: Department Roster Management */}
      {rosterDrawerOpen && activeDeptForRoster && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs"
                  style={{ backgroundColor: activeDeptForRoster.color || '#6366f1' }}
                >
                  {activeDeptForRoster.code}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeDeptForRoster.name} Roster
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeDeptDetails?.members?.length || 0} Staff Member(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRosterDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Add Member Form */}
              {(can('departments.update') || isOwner) && (
                <form
                  onSubmit={handleAddMemberToDept}
                  className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3"
                >
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Team Member to Department</span>
                  </h4>

                  <div className="space-y-2">
                    <select
                      required
                      value={selectedMemberIdToAdd}
                      onChange={(e) => setSelectedMemberIdToAdd(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">Select an Organization Member</option>
                      {members.map((m) => (
                        <option key={m.id || m._id} value={m.id || m._id}>
                          {m.user?.firstName} {m.user?.lastName} ({m.user?.email})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Job Title (e.g. Senior Backend Engineer)"
                      value={memberJobTitleToAdd}
                      onChange={(e) => setMemberJobTitleToAdd(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200"
                    />

                    <button
                      type="submit"
                      disabled={assignMemberMutation.isPending || !selectedMemberIdToAdd}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {assignMemberMutation.isPending ? 'Assigning...' : '+ Assign to Department'}
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Assigned Team Members
                </h4>

                {isLoadingRoster ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading department roster...
                  </div>
                ) : !activeDeptDetails?.members || activeDeptDetails.members.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-400">No members assigned to this department yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeDeptDetails.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {member.jobTitle} • <span className="font-mono text-indigo-500">{member.role}</span>
                            </div>
                          </div>
                        </div>

                        {(can('departments.update') || isOwner) && (
                          <button
                            onClick={() =>
                              removeMemberMutation.mutate({
                                deptId: activeDeptForRoster.id,
                                memberId: member.id,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            title="Unassign member from department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-right shrink-0">
              <button
                onClick={() => setRosterDrawerOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
