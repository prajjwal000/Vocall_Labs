import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  CreditCard,
  Receipt,
  LifeBuoy,
  Activity,
  Sliders,
  LogOut,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePlatformPermissionStore } from '../store/platformPermissionStore';
import ThemeToggle from '../components/ui/ThemeToggle';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const { role, can } = usePlatformPermissionStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Organizations', path: '/admin/organizations', icon: Building2, permission: 'organizations.view' },
    { name: 'Platform Users', path: '/admin/users', icon: Users, permission: 'users.view' },
    { name: 'Roles & Permissions', path: '/admin/roles', icon: Shield, permission: 'roles.view' },
    { name: 'Pricing Plans', path: '/admin/pricing', icon: CreditCard, permission: 'pricing.view' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: Receipt, permission: 'subscriptions.view' },
    { name: 'Support Tickets', path: '/admin/tickets', icon: LifeBuoy, permission: 'tickets.view' },
    { name: 'Audit Logs', path: '/admin/audit', icon: Activity, permission: 'audit.view' },
    { name: 'Platform Settings', path: '/admin/settings', icon: Sliders, permission: 'settings.view' },
  ];

  const visibleNavLinks = navLinks.filter(
    (link) => !link.permission || can(link.permission)
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Platform Admin Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center font-black text-base text-white shadow-md shadow-indigo-500/20">
            P
          </div>
          <div>
            <span className="text-sm font-black tracking-tight block text-slate-900 dark:text-white">
              Nexus Platform
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">
              Global Admin
            </span>
          </div>
        </div>

        {/* Current Platform Role Card */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Role</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                role?.key === 'platform_admin'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
              }`}
            >
              {role?.name || 'Platform User'}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || ''}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shadow-xs shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Administration
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/app/dashboard"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer Workspace</span>
            </Link>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 text-slate-900 dark:text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
