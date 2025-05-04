// Netlify serverless function to handle token revocation securely

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
    const { token } = JSON.parse(event.body);
    
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token is required' }),
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

    if (!clientId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Make the token revocation request to Google
    const response = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: token,
        client_id: clientId,
      }).toString(),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Error revoking token:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error || 'Failed to revoke token' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json',
        // Return the CSRF token back to the client
        'X-CSRF-Token': csrfToken
      }
    };
  } catch (error) {
    console.error('Token revocation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
