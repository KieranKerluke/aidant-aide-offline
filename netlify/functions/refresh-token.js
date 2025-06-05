// Netlify serverless function to handle token refresh securely

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the request body
    const { refreshToken } = JSON.parse(event.body);
    
    if (!refreshToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Refresh token is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Validate the CSRF token
    const csrfToken = event.headers['x-csrf-token'];
    if (!csrfToken) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'CSRF token missing' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Get environment variables - use server-side env vars, not client-side VITE_ ones
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Make the token refresh request to Google
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error refreshing token:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error || 'Failed to refresh token' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Return the new access token
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        // Return the CSRF token back to the client
        'X-CSRF-Token': csrfToken
      }
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
