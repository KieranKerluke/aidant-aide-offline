import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { secureFetch } from "@/lib/csrf";
import { validateData } from "@/lib/validation";
import { secureStore, secureRetrieve } from "@/lib/secure-storage";
import { z } from "zod";
import { secureLogger } from "@/lib/secure-logger";

// Token response schema validation
const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

export function OAuthCallback() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const exchangeCodeForTokens = async () => {
    try {
      // Get authorization code from URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (!code) {
        throw new Error('Authorization code not found');
      }

      // Validate code format
      if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
        throw new Error('Invalid authorization code format');
      }

      // Exchange code for tokens using secure fetch
      const response = await secureFetch(`/.netlify/functions/google-oauth?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) {
        throw new Error('Failed to exchange authorization code for tokens');
      }

      const data = await response.json();
      
      // Validate response data
      const validatedData = validateData(tokenResponseSchema, data);
      
      // Store tokens securely using our enhanced secure storage
      const tokenData = {
        access_token: validatedData.access_token,
        refresh_token: validatedData.refresh_token,
        expires_at: validatedData.expires_in 
          ? new Date(Date.now() + validatedData.expires_in * 1000).toISOString()
          : null
      };

      await secureStore(tokenData);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Navigate to calendar page
      navigate('/calendar');
    } catch (error) {
      secureLogger.error('OAuth callback error:', error);
      setErrorMessage('Failed to complete authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    exchangeCodeForTokens();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate('/calendar')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Calendar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
