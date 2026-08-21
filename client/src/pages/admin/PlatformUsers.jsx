import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import { platformRoleService } from '../../services/platformRoleService';

export const PlatformUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Role Assignment Modal
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        platformRoleService.getPlatformUsers(),
        platformRoleService.getPlatformRoles(),
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error('Failed to load platform users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAssign = (user) => {
    setEditingUser(user);
    setSelectedRoleId(user.platformRole?._id || user.platformRole?.id || '');
    setModalError('');
  };

  const handleSaveRoleAssignment = async (e) => {
    e.preventDefault();
    if (!editingUser || !selectedRoleId) return;
    setIsUpdating(true);
    setModalError('');

    try {
      await platformRoleService.assignUserPlatformRole(editingUser.id, selectedRoleId);
      setSuccessMessage(`Assigned platform role to ${editingUser.firstName} ${editingUser.lastName}`);
      setEditingUser(null);
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to assign role');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Platform Staff & Team Members
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage global internal administrators, platform support staff, and grant granular platform RBAC roles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Active Staff: <strong className="text-slate-900 dark:text-white font-mono">{users.length}</strong>
          </span>
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

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5 w-full sm:w-80 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search platform staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs placeholder-slate-400 border-none bg-transparent focus:outline-hidden text-slate-900 dark:text-white font-medium"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 opacity-60" />
            <p className="text-xs">Loading platform staff accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No platform staff accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Assigned Platform Role</th>
                  <th className="py-3.5 px-4">Platform Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {user.firstName?.[0] || 'A'}{user.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.isBootstrapAdmin && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Bootstrap Root
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {user.email}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.platformRole?.key === 'platform_admin'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.platformRole?.name || 'No Role Assigned'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {user.platformStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleOpenAssign(user)}
                        disabled={user.isBootstrapAdmin}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Assign Role</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {editingUser && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <form onSubmit={handleSaveRoleAssignment}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200/60">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Assign Platform Role
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {editingUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {modalError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-xs font-semibold border border-rose-200">
                      {modalError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                      Select Platform Role
                    </label>
                    <div className="space-y-2">
                      {roles.map((r) => (
                        <label
                          key={r.id || r._id}
                          className={`p-3 rounded-2xl border flex items-start space-x-3 cursor-pointer transition ${
                            selectedRoleId === (r.id || r._id)
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="platformRole"
                            value={r.id || r._id}
                            checked={selectedRoleId === (r.id || r._id)}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="mt-1 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {r.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {r.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating || !selectedRoleId}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isUpdating ? 'Assigning...' : 'Confirm Role'}</span>
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

export default PlatformUsers;
