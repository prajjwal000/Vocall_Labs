import { create } from 'zustand';
import { authService } from '../services/authService';
import { useWorkspaceStore } from './workspaceStore';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      error: null,
    }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authService.getMe();
      if (response && response.success && response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      // Clear old workspace state so fresh permissions load
      useWorkspaceStore.getState().clearWorkspace();
      const response = await authService.login(credentials);
      if (response && response.success && response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to login';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      useWorkspaceStore.getState().clearWorkspace();
      const response = await authService.register(data);
      if (response && response.success && response.data?.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }
      throw new Error(response.message || 'Registration failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to register';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      useWorkspaceStore.getState().clearWorkspace();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));

export default useAuthStore;
