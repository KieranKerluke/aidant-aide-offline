/**
 * Environment Variables Validator
 * Ensures all required security-related environment variables are properly set
 */

// Define required environment variables for security
const REQUIRED_ENV_VARS = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_API_KEY',
  'VITE_GOOGLE_REDIRECT_URI',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Server-side only variables that should not be exposed in client code
const SERVER_ONLY_ENV_VARS = [
  'VITE_GOOGLE_CLIENT_SECRET'
];

/**
 * Validates that all required environment variables are set
 * @returns {boolean} True if all required variables are set, false otherwise
 */
export function validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!import.meta.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  return { 
    valid: missing.length === 0,
    missing
  };
}

/**
 * Checks for potentially exposed server-side variables in client code
 * @returns {boolean} True if no server-only variables are exposed, false otherwise
 */
export function checkForExposedServerVars(): { secure: boolean; exposed: string[] } {
  const exposed: string[] = [];
  
  // In development, warn about server-only vars in client code
  if (import.meta.env.DEV) {
    for (const envVar of SERVER_ONLY_ENV_VARS) {
      if (import.meta.env[envVar]) {
        exposed.push(envVar);
      }
    }
  }
  
  return {
    secure: exposed.length === 0,
    exposed
  };
}

/**
 * Initializes environment validation on app startup
 * Logs warnings for missing or insecurely exposed variables
 */
export function initEnvValidation(): void {
  const { valid, missing } = validateRequiredEnvVars();
  const { secure, exposed } = checkForExposedServerVars();
  
  if (!valid) {
    console.error('⚠️ Missing required environment variables:', missing.join(', '));
    // In production, this could throw an error instead of just logging
  }
  
  if (!secure) {
    console.warn('🔒 Security warning: Server-only environment variables exposed in client code:', 
      exposed.join(', '), 
      '\nThese should be moved to server-side functions.');
  }
}
