import axios from 'axios';
import { DashboardData, FarmTask, AlertNotification, MandiComparisonResult } from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrisaarthi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for local storage caching
export const LocalCache = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(value));
    } catch (_) {}
  },
};

// API Functions
export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Auth
  login: async (emailOrMobile: string, password: string) => {
    const res = await apiClient.post('/auth/login', { emailOrMobile, password });
    if (res.data.token) {
      localStorage.setItem('agrisaarthi_token', res.data.token);
      localStorage.setItem('agrisaarthi_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (data: { name: string; emailOrMobile: string; password: string; preferredLanguage: string }) => {
    const res = await apiClient.post('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('agrisaarthi_token', res.data.token);
      localStorage.setItem('agrisaarthi_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Dashboard with Offline Fallback
  getDashboard: async (lang: string = 'mr'): Promise<DashboardData> => {
    try {
      const res = await apiClient.get(`/dashboard?lang=${lang}`);
      const data: DashboardData = res.data;
      LocalCache.set('dashboard_last', { ...data, cachedAt: new Date().toISOString() });
      return data;
    } catch (err) {
      console.warn('[Offline Mode] Network failed, retrieving cached dashboard');
      const cached = LocalCache.get<DashboardData & { cachedAt?: string }>('dashboard_last');
      if (cached) {
        return {
          ...cached,
          isCached: true,
          greeting: `${cached.greeting} (Offline Mode)`
        };
      }
      throw err;
    }
  },

  // Weather
  getWeather: async (lat?: number, lon?: number) => {
    const res = await apiClient.get('/weather', { params: { lat, lon } });
    return res.data;
  },

  // Mandi
  getMandiPrices: async (commodity: string, district?: string): Promise<MandiComparisonResult> => {
    const res = await apiClient.get('/mandi/prices', { params: { commodity, district } });
    return res.data;
  },

  // Soil
  getSoil: async (lat?: number, lon?: number) => {
    const res = await apiClient.get('/soil', { params: { lat, lon } });
    return res.data;
  },

  submitManualSoilTest: async (data: any) => {
    const res = await apiClient.post('/soil/manual', data);
    return res.data;
  },

  // Agent Autonomous Execution
  runAgent: async (params: { cropName?: string; cropStage?: string; language?: string; question?: string }) => {
    const res = await apiClient.post('/agent/run', params);
    return res.data;
  },

  // Conversational AI Advisory
  askChatAdvisory: async (question: string, language: string, cropName: string) => {
    const res = await apiClient.post('/advisory/chat', { question, language, cropName });
    return res.data;
  },

  // Tasks
  getTasks: async (): Promise<FarmTask[]> => {
    try {
      const res = await apiClient.get('/tasks');
      LocalCache.set('tasks_last', res.data);
      return res.data;
    } catch (err) {
      const cached = LocalCache.get<FarmTask[]>('tasks_last');
      if (cached) return cached;
      throw err;
    }
  },

  createTask: async (task: { title: string; description?: string; priority?: string }) => {
    const res = await apiClient.post('/tasks', task);
    return res.data;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const res = await apiClient.patch(`/tasks/${taskId}`, { status });
    return res.data;
  },

  // Alerts
  getAlerts: async (): Promise<AlertNotification[]> => {
    const res = await apiClient.get('/alerts');
    return res.data;
  },

  markAlertRead: async (alertId: string) => {
    const res = await apiClient.patch(`/alerts/${alertId}/read`);
    return res.data;
  },

  // Farm updates
  createFarm: async (farmData: any) => {
    const res = await apiClient.post('/farms', farmData);
    return res.data;
  },

  createCrop: async (cropData: any) => {
    const res = await apiClient.post('/crops', cropData);
    return res.data;
  }
};

