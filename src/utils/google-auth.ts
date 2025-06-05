// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;

// Get the redirect URI from environment variables or fallback to localhost for development
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI as string;

// Function to build the Google OAuth URL
export const buildGoogleAuthUrl = (state?: string) => {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent',
  });
  
  if (state) {
    params.append('state', state);
  }
  
  return `${baseUrl}?${params.toString()}`;
};
