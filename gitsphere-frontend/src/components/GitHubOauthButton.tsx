"use client";

import { useState, useEffect } from 'react';
import  Button  from '@/components/ui/button';
import { Github, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface GitHubOAuthButtonProps {
  onTokenReceived?: (token: string) => void;
  className?: string;
}

export function GitHubOAuthButton({ onTokenReceived, className }: GitHubOAuthButtonProps) {
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
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <Github className="w-5 h-5" />
          <span className="font-medium">GitHub Connected</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={removeToken}
          className="text-red-600 hover:text-red-700"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {authError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Authentication failed: {authError}
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-blue-200 bg-blue-50">
        <Github className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Click below to securely connect your GitHub account. This will grant access to:
          <ul className="mt-2 list-disc list-inside text-sm">
            <li>Public repositories</li>
            <li>User profile information</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Button
        onClick={handleGetAccessToken}
        disabled={isAuthenticating}
        className="w-full"
        size="lg"
      >
        {isAuthenticating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Connecting to GitHub...
          </>
        ) : (
          <>
            <Github className="w-5 h-5 mr-2" />
            Get Access Token
          </>
        )}
      </Button>
    </div>
  );
}
