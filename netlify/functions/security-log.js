// Netlify serverless function for secure logging of security events

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the log entry
    const logEntry = JSON.parse(event.body);

    // Insert log entry into security_logs table
    const { error } = await supabase
      .from('security_logs')
      .insert([{
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        environment: logEntry.environment,
        service: logEntry.service,
        message: logEntry.message,
        data: logEntry.data
      }]);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    // Don't expose error details in production
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      })
    };
  }
};
