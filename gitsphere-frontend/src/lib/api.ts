/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ProfileAnalysis, RepositoryAnalysis, BattleResult, BattleRequest, ProfileInsights } from './types';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// Process failed requests queue after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Token refresh function
const refreshToken = async (): Promise<string> => {
  const currentToken = Cookies.get('github_token');
  
  if (!currentToken) {
    throw new Error('No token available for refresh');
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const newToken = response.data.access_token;
    
    // Update cookie with new token
    Cookies.set('github_token', newToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: 1 // 1 day
    });
    
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Clear invalid token
    Cookies.remove('github_token');
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?expired=true';
    }
    
    throw error;
  }
};

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('github_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and retry
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check for new token in response headers (from middleware)
    const newToken = response.headers['x-new-token'];
    const tokenRefreshed = response.headers['x-token-refreshed'];
    
    if (newToken && tokenRefreshed === 'true') {
      Cookies.set('github_token', newToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: 1
      });
      console.log('Token automatically refreshed by middleware');
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if it's a 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            }
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshToken();
        
        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        // Process queued requests
        processQueue(null, newToken);
        
        // Retry the original request
        return api(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, reject all queued requests
        processQueue(refreshError, null);
        
        // Handle authentication failure
        console.error('Authentication failed, redirecting to login');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
        
        return Promise.reject(refreshError);
        
      } finally {
        isRefreshing = false;
      }
    }
    
    // For other errors, just reject
    return Promise.reject(error);
  }
);

// Profile Analyzer API
export const profileAnalyzerApi = {
  analyze: async (username: string): Promise<ProfileAnalysis> => {
    const response = await api.get(`/api/v1/profile-analyzer/analyze/${username}`);
    return response.data;
  },
  
  getInsights: async (username: string): Promise<ProfileInsights> => {
    const response = await api.get(`/api/v1/profile-analyzer/insights/${username}`);
    return response.data;
  },
  
  getProfile: async (username: string) => {
    const response = await api.get(`/api/v1/profile-analyzer/profile/${username}`);
    return response.data;
  },
};

// Repository Analyzer API
export const repositoryAnalyzerApi = {
  analyze: async (owner: string, repo: string): Promise<RepositoryAnalysis> => {
    const response = await api.get(`/api/v1/repository-analyzer/analyze/${owner}/${repo}`);
    return response.data;
  },
  
  getInsights: async (owner: string, repo: string) => {
    const response = await api.get(`/api/v1/repository-analyzer/insights/${owner}/${repo}`);
    return response.data;
  },
  
  bulkAnalyze: async (repositories: { owner: string; repo: string }[]) => {
    const response = await api.post('/api/v1/repository-analyzer/bulk-analyze', repositories);
    return response.data;
  },

  getRepositoryTree: async (owner: string, repo: string) => {
    const response = await api.get(`/api/v1/repository-analyzer/tree/${owner}/${repo}`);
    return response.data;
  },

  getFileContent: async (owner: string, repo: string, path: string) => {
    const encodedPath = encodeURIComponent(path);
    const response = await api.get(`/api/v1/repository-analyzer/file/${owner}/${repo}/${encodedPath}`);
    return response.data;
  },
};

// Battle API
export const battleApi = {
  startBattle: async (battleRequest: BattleRequest): Promise<BattleResult> => {
    const response = await api.post('/api/v1/battle/start', battleRequest);
    return response.data;
  },
  
  quickBattle: async (user1: string, user2: string) => {
    const response = await api.post('/api/v1/battle/quick-battle', { user1, user2 });
    return response.data;
  },
  
  multiBattle: async (usernames: string[]) => {
    const response = await api.post('/api/v1/battle/multi-battle', { usernames });
    return response.data;
  },
};

// Export manual refresh function for components to use
export const manualRefreshToken = refreshToken;

export default api;
