// Import polyfill before any Google SDK imports
import './google-sdk-polyfill';

import { OAuth2Client } from 'google-auth-library';

// Initialize the OAuth2 client
export const oauth2Client = new OAuth2Client(
  import.meta.env.VITE_GOOGLE_CLIENT_ID,
  import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  import.meta.env.VITE_GOOGLE_REDIRECT_URI
);

// Get the authorization URL
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/calendar'
    ],
  });
}

// Handle the OAuth callback
export async function handleAuthCallback(code: string): Promise<void> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  // Store the tokens in localStorage
  localStorage.setItem('google_tokens', JSON.stringify(tokens));
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const tokens = localStorage.getItem('google_tokens');
  if (!tokens) return false;
  
  try {
    const parsedTokens = JSON.parse(tokens);
    oauth2Client.setCredentials(parsedTokens);
    return true;
  } catch (error) {
    return false;
  }
}

// Sign out
export function signOut(): void {
  localStorage.removeItem('google_tokens');
  oauth2Client.revokeCredentials();
}