import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getAuthUrl, handleAuthCallback, isAuthenticated } from '@/lib/auth';

export function GoogleAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the OAuth callback
    const code = searchParams.get('code');
    if (code) {
      setIsLoading(true);
      handleAuthCallback(code)
        .then(() => {
          navigate('/');
        })
        .catch((error) => {
          console.error('Error during authentication:', error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [searchParams, navigate]);

  const handleSignIn = () => {
    window.location.href = getAuthUrl();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to PairAidant</h1>
        <p className="mb-4">Please sign in with your Google account to continue</p>
        <Button onClick={handleSignIn}>Sign in with Google</Button>
      </div>
    </div>
  );
} 