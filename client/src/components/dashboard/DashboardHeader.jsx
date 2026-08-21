import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Shield, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { ShimmerHeading } from '../ui/AnimatedText';

export const DashboardHeader = () => {
  const { user } = useAuthStore();
  const { activeOrganization } = useWorkspaceStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
          <span>{getGreeting()},</span>
          <ShimmerHeading>{user?.firstName || 'there'}</ShimmerHeading>
          <span>👋</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Real-time operations and workflow overview for{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            {activeOrganization?.name || 'your workspace'}
          </strong>
          .
        </p>
      </div>

      <div className="flex items-center space-x-2.5">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>{formattedDate}</span>
        </div>

        <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 px-3 py-1.5 rounded-xl">
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>{activeOrganization?.role ? `${activeOrganization.role.toUpperCase()} ROLE` : 'WORKSPACE'}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
