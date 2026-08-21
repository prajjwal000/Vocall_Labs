import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Mail, Users, Activity, Clock } from 'lucide-react';

export const RecentActivity = ({ activities = [], isLoading = false }) => {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'member_joined':
        return { icon: <UserCheck className="w-3.5 h-3.5 text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/50' };
      case 'invitation_accepted':
        return { icon: <Users className="w-3.5 h-3.5 text-indigo-500" />, bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50' };
      case 'invitation_sent':
        return { icon: <Mail className="w-3.5 h-3.5 text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/50' };
      default:
        return { icon: <Activity className="w-3.5 h-3.5 text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900/50' };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Workspace Activity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real events and team audit stream</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
            <span>Live Feed</span>
          </span>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading activity feed...</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-lg">
                📭
              </div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Recent Activity</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Real activities and team actions will appear here as your team interacts with Nexus.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activities.map((item, idx) => {
                const badge = getEventBadge(item.type);
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-2xl px-2 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-xl border ${badge.bg} flex items-center justify-center text-xs shrink-0 mt-0.5`}>
                        {badge.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          By <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.actor?.name || 'User'}</span>
                          {item.roleName && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                              {item.roleName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatTimeAgo(item.timestamp)}</span>
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
