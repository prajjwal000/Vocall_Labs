import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, Plus, ChevronDown } from 'lucide-react';
import { useOrganization } from '../../hooks/useOrganization';

export const OrganizationSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { activeOrganization, organizations, isLoading, switchOrganization } = useOrganization();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (orgId) => {
    switchOrganization(orgId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    navigate('/app/organizations/new');
  };

  return (
    <div className="relative px-3 py-2" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer shadow-xs focus:outline-none"
      >
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0">
            {activeOrganization?.name?.[0]?.toUpperCase() || 'W'}
          </div>
          <div className="truncate">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Workspace
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {isLoading ? 'Loading...' : activeOrganization?.name || 'Select Workspace'}
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu with Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-3 right-3 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 divide-y divide-slate-100 dark:divide-slate-800"
          >
            <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Organizations ({organizations.length})
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {organizations.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                  No organizations found.
                </div>
              ) : (
                organizations.map((org) => {
                  const isActive = activeOrganization?.id === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelect(org.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          {org.name?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <div className="truncate">
                          <div className="truncate">{org.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{org.role || 'member'}</div>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create organization</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizationSwitcher;
