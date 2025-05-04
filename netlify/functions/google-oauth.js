// Netlify Function for Google OAuth token exchange
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { secureLogger } = require('@/lib/secure-logger');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validate CSRF token
async function validateCsrfToken(token) {
  if (!token) return false;
  
  try {
    const { data, error } = await supabase
      .from('csrf_tokens')
      .select('*')
      .eq('token', token)
      .single();
      
    if (error || !data) return false;
    
    // Delete used token
    await supabase
      .from('csrf_tokens')
      .delete()
      .eq('token', token);
      
    return true;
  } catch (error) {
    secureLogger.error('CSRF validation error:', error);
    return false;
  }
}

// Handler for the Netlify Function
exports.handler = async function(event, context) {
  try {
    // Validate CSRF token
    const csrfToken = event.headers['x-csrf-token'];
    if (!await validateCsrfToken(csrfToken)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid CSRF token' })
      };
    }

    // Validate request method
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Get authorization code
    const { code } = event.queryStringParameters;
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Authorization code is required' })
      };
    }

    // Exchange code for tokens using server-side environment variables
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    // Validate token response
    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid token response' })
      };
    }

    // Generate new CSRF token
    const newCsrfToken = crypto.randomBytes(32).toString('hex');
    
    // Store new CSRF token
    await supabase
      .from('csrf_tokens')
      .insert([{ token: newCsrfToken }]);

    // Return tokens with new CSRF token
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': newCsrfToken
      },
      body: JSON.stringify({
        access_token: tokenResponse.data.access_token,
        refresh_token: tokenResponse.data.refresh_token,
        expires_in: tokenResponse.data.expires_in,
        token_type: tokenResponse.data.token_type,
        scope: tokenResponse.data.scope
      })
    };
  } catch (error) {
    secureLogger.error('OAuth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message ? error.message.replace(/token|key|secret|password|auth/gi, '***REDACTED***') : 'Unknown error'
      })
    };
  }
};
