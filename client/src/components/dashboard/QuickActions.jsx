import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Settings, CheckSquare, GitBranch, ArrowUpRight } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

export const QuickActions = () => {
  const { can, isOwner } = usePermissions();

  const actions = [
    {
      title: 'Tasks & Delegation',
      description: 'Assign or delegate team tasks',
      icon: <CheckSquare className="w-4 h-4 text-indigo-500" />,
      link: '/app/tasks',
      permission: 'tasks.read',
      color: 'hover:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50',
    },
    {
      title: 'Trigger Workflow',
      description: 'Submit an automated request',
      icon: <GitBranch className="w-4 h-4 text-purple-500" />,
      link: '/app/workflows',
      permission: 'workflows.read',
      color: 'hover:border-purple-400 bg-purple-50/50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50',
    },
    {
      title: 'Invite Employee',
      description: 'Send onboarding email invite',
      icon: <UserPlus className="w-4 h-4 text-purple-500" />,
      link: '/app/settings/invitations',
      permission: 'roles.create',
      color: 'hover:border-purple-400 bg-purple-50/50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50',
    },
    {
      title: 'Manage Roles',
      description: 'Configure RBAC & permissions',
      icon: <Shield className="w-4 h-4 text-emerald-500" />,
      link: '/app/settings/roles',
      permission: 'roles.read',
      color: 'hover:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      title: 'Org Settings',
      description: 'Manage workspace details',
      icon: <Settings className="w-4 h-4 text-slate-500" />,
      link: '/app/settings/organization',
      permission: 'settings.read',
      color: 'hover:border-slate-400 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80',
    },
  ];

  const visibleActions = actions.filter(
    (action) => !action.permission || isOwner || can(action.permission)
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Frequent workspace shortcuts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleActions.map((act) => (
          <motion.div
            key={act.title}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350 }}
          >
            <Link
              to={act.link}
              className={`p-3.5 rounded-2xl border ${act.color} transition-all flex items-center justify-between cursor-pointer group h-full`}
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
                  {act.icon}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{act.description}</div>
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
