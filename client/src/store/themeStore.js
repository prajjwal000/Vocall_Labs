import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  theme: (typeof window !== 'undefined' && localStorage.getItem('nexus_theme')) || 'light',

  toggleTheme: () => {
    const currentTheme = get().theme;
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (nextTheme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('nexus_theme', nextTheme);
    }
    set({ theme: nextTheme });
  },

  initTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_theme') || 'light';
      const root = document.documentElement;
      if (saved === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      set({ theme: saved });
    }
  },
}));
