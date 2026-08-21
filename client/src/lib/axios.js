import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Request interceptor to automatically attach active organization ID header
api.interceptors.request.use((config) => {
  const activeOrg = useWorkspaceStore.getState().activeOrganization;
  const orgId = activeOrg?.id || activeOrg?._id;
  if (orgId && !config.headers['x-organization-id'] && !config.headers['X-Organization-Id']) {
    config.headers['X-Organization-Id'] = orgId;
  }
  return config;
});

// Response interceptor for centralized 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const originalRequest = error.config;

    // 401 Unauthorized handling
    if (status === 401) {
      const isAuthCheck = originalRequest?.url?.includes('/auth/me');
      const isLoginRequest = originalRequest?.url?.includes('/auth/login');
      const isRegisterRequest = originalRequest?.url?.includes('/auth/register');

      if (!isAuthCheck && !isLoginRequest && !isRegisterRequest) {
        useAuthStore.getState().setUser(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
