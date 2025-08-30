"use client";

import { useState, useEffect } from 'react';
import  Button  from '@/components/ui/button';
import { Github, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface GitHubOAuthButtonProps {
  onTokenReceived?: (token: string) => void;
  className?: string;
}

export function GitHubOauthStatus({ onTokenReceived, className }: GitHubOAuthButtonProps) {
  const [hasToken, setHasToken] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  // Your GitHub OAuth App credentials (get these from GitHub Developer Settings)
  const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'your_github_client_id';
  const REDIRECT_URI = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/callback';

  useEffect(() => {
    const existingToken = Cookies.get('github_token');
    
    setHasToken(!!existingToken);

    // Listen for OAuth callback completion
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        const { token } = event.data;
        storeToken(token);
        setIsAuthenticating(false);
        if(token){
          router.push('/');
        }
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        setAuthError(event.data.error);
        setIsAuthenticating(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const storeToken = (token: string) => {
    // Store token in cookie (expires in 30 days)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    document.cookie = `github_token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
    
    setHasToken(true);
    setAuthError(null);
    onTokenReceived?.(token);
  };

  const handleGetAccessToken = () => {
    setIsAuthenticating(true);
    setAuthError(null);

    // GitHub OAuth authorization URL with required scopes
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'public_repo, read:user');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', Math.random().toString(36).substring(7));

    // Open OAuth popup window
    const popup = window.open(
      authUrl.toString(),
      'github-oauth',
      'width=600,height=700,left=' + 
      (window.innerWidth / 2 - 300) + 
      ',top=' + 
      (window.innerHeight / 2 - 350)
    );

    // Check if popup is closed without completing auth
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        setIsAuthenticating(false);
      }
    }, 1000);
  };

  const removeToken = () => {
    document.cookie = 'github_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setHasToken(false);
    setAuthError(null);
  };

  if (hasToken) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <Github className="w-5 h-5" />
          <span className="font-medium">GitHub Connected</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={removeToken}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={`border-red-200 bg-red-50 ${className}`}>
        Authentication failed: {authError}
      </div>
    );
  }

  return (

      <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-gray-600">
        <Github className="w-5 h-5" />
        <span className="font-medium">GitHub Not Connected</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGetAccessToken}
        loading={isAuthenticating}
        className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
      >
        Connect GitHub
      </Button>
    </div>
  );
}
