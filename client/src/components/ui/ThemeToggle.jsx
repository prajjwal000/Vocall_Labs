import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(false);

  // Initialize state based on the DOM and localStorage
  useEffect(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark') || 
                            localStorage.getItem('nexus_theme') === 'dark' ||
                            (localStorage.getItem('nexus_theme_preference') && JSON.parse(localStorage.getItem('nexus_theme_preference'))?.state?.theme === 'dark');
    
    setIsDark(isCurrentlyDark);
    if (isCurrentlyDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    
    // Direct DOM manipulation
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexus_theme', 'dark');
      try {
        localStorage.setItem('nexus_theme_preference', JSON.stringify({ state: { theme: 'dark' }}));
      } catch(e) {}
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexus_theme', 'light');
      try {
        localStorage.setItem('nexus_theme_preference', JSON.stringify({ state: { theme: 'light' }}));
      } catch(e) {}
    }
    
    // Dispatch a custom event just in case any other component wants to listen
    window.dispatchEvent(new Event('theme_changed'));
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      type="button"
      className={`px-3 py-2 rounded-2xl border transition-all cursor-pointer flex items-center space-x-2 shadow-xs z-50 relative pointer-events-auto ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
      </motion.div>
      <span className="text-xs font-bold capitalize select-none hidden sm:inline">
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
