import React from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GitBranch,
  FileSpreadsheet,
  CheckSquare,
  ListTodo,
  FileText,
  Settings,
  Building,
  UserPlus,
  Shield,
  LogOut,
  Sparkles,
  ChevronRight,
  Lock,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useOrganization } from '../hooks/useOrganization';
import OrganizationSwitcher from '../components/organization/OrganizationSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';

const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const { can, isOwner, role } = usePermissions();
  const { activeOrganization } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navSections = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: 'Tasks', path: '/app/tasks', icon: <ListTodo className="w-4 h-4" /> },
        { name: 'Workflows & Forms', path: '/app/workflows', icon: <GitBranch className="w-4 h-4" /> },
        { name: 'Requests', path: '/app/requests', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { name: 'Approvals', path: '/app/approvals', icon: <CheckSquare className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Workspace Management',
      items: [
        { name: 'Employees', path: '/app/employees', icon: <Users className="w-4 h-4" />, permission: 'employees.read' },
        { name: 'Departments', path: '/app/departments', icon: <Briefcase className="w-4 h-4" />, permission: 'departments.read' },
        { name: 'Org Settings', path: '/app/settings/organization', icon: <Building className="w-4 h-4" />, permission: 'settings.read' },
        { name: 'Team Invitations', path: '/app/settings/invitations', icon: <UserPlus className="w-4 h-4" />, permission: 'invitations.create' },
        { name: 'Roles & Permissions', path: '/app/settings/roles', icon: <Shield className="w-4 h-4" />, permission: 'roles.read' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { name: 'Account Settings', path: '/app/settings', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xs dark:shadow-xl z-20">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-black text-base text-white shadow-md shadow-indigo-500/25"
            >
              N
            </motion.div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Nexus
            </span>
          </div>
        </div>

        {/* Dynamic Organization Switcher */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <OrganizationSwitcher />
        </div>

        {/* Platform Admin Shortcut for Platform Users */}
        {user?.isPlatformUser && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
            <Link
              to="/admin/roles"
              className="w-full flex items-center justify-between p-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Platform Admin</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
              {section.items.map((link) => {
                const hasAccess = !link.permission || isOwner || can(link.permission);
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <span>{link.icon}</span>
                      <span>{link.name}</span>
                    </div>
                    {!hasAccess && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono flex items-center space-x-1">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User profile footer in sidebar */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{role || 'member'} Role</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-2xs z-10">
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              Workspace Live
            </span>
            {activeOrganization && (
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden md:inline">
                Organization: <strong className="text-slate-900 dark:text-white">{activeOrganization.name}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />

            <div className="text-right hidden sm:block pl-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {isOwner ? 'Owner Role' : role ? `${role} Role` : user?.isPlatformUser ? 'Platform Superuser' : 'Member'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Content View with Framer Motion Page Transition */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
