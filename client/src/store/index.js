import { create } from 'zustand';

export const useStore = create((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
