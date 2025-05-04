// Generate a CSRF token
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Add CSRF token to headers
export function addCsrfToken(headers: HeadersInit = {}): HeadersInit {
  const token = localStorage.getItem('csrfToken') || generateCsrfToken();
  localStorage.setItem('csrfToken', token);
  
  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}

// Validate CSRF token
export function validateCsrfToken(token: string): boolean {
  const storedToken = localStorage.getItem('csrfToken');
  return token === storedToken;
}

// Secure fetch wrapper
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = addCsrfToken(options.headers);
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for CSRF protection
  });
  
  // Check for CSRF token in response
  const csrfToken = response.headers.get('X-CSRF-Token');
  if (csrfToken) {
    localStorage.setItem('csrfToken', csrfToken);
  }
  
  return response;
} 