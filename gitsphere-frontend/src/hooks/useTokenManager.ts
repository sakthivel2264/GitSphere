// hooks/useTokenManager.ts
import { useState, useCallback, useEffect } from 'react';
import { manualRefreshToken } from '@/lib/api';
import Cookies from 'js-cookie';

export const useTokenManager = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{
    isValid: boolean;
    expiresAt: string | null;
    shouldRefresh: boolean;
  }>({
    isValid: false,
    expiresAt: null,
    shouldRefresh: false
  });

  const checkTokenStatus = useCallback(async () => {
    const token = Cookies.get('github_token');
    if (!token) {
      setTokenStatus({ isValid: false, expiresAt: null, shouldRefresh: false });
      return;
    }

    try {
      const response = await fetch('/api/auth/token/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setTokenStatus({
          isValid: status.valid,
          expiresAt: status.expires_at,
          shouldRefresh: status.should_refresh
        });
        
        // Auto-refresh if needed
        if (status.should_refresh && !isRefreshing) {
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Token status check failed:', error);
    }
  }, [isRefreshing]);

  const refreshToken = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await manualRefreshToken();
      await checkTokenStatus();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, checkTokenStatus]);

  // Check token status periodically
  useEffect(() => {
    checkTokenStatus();
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [checkTokenStatus]);

  return {
    tokenStatus,
    isRefreshing,
    refreshToken,
    checkTokenStatus
  };
};
