"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GitHubCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      // Send error to parent window
      window.opener?.postMessage({
        type: 'GITHUB_AUTH_ERROR',
        error: error
      }, window.location.origin);
      window.close();
      return;
    }

    if (code) {
      // Exchange code for access token
      exchangeCodeForToken(code, state);
    }
  }, [searchParams]);

  const exchangeCodeForToken = async (code: string, state: string | null) => {
    try {
      // Call your backend API to exchange code for token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

      const data = await response.json();

      if (data.access_token) {
        // Send token to parent window
        window.opener?.postMessage({
          type: 'GITHUB_AUTH_SUCCESS',
          token: data.access_token
        }, window.location.origin);
      } else {
        throw new Error(data.error || 'Failed to get access token');
      }
    } catch (error) {
      window.opener?.postMessage({
        type: 'GITHUB_AUTH_ERROR',
        error: error instanceof Error ? error.message : 'Authentication failed'
      }, window.location.origin);
    } finally {
      window.close();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing GitHub authentication...</p>
      </div>
    </div>
  );
}
