-- Add security headers to the database
-- Use environment variables for sensitive values
ALTER DATABASE postgres SET "app.jwt_secret" TO current_setting('app.settings.jwt_secret', true);
ALTER DATABASE postgres SET "app.jwt_issuer" TO current_setting('app.settings.jwt_issuer', true);
ALTER DATABASE postgres SET "app.jwt_audience" TO current_setting('app.settings.jwt_audience', true);

-- Create a function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id UUID,
  operation TEXT,
  max_requests INTEGER,
  time_window INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO request_count
  FROM request_logs
  WHERE user_id = $1
    AND operation = $2
    AND created_at > NOW() - $4;
    
  RETURN request_count < $3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to track rate limits
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  operation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on request_logs
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for request_logs
CREATE POLICY "Allow users to read their own request logs"
  ON request_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert request logs"
  ON request_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a trigger to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM request_logs
  WHERE created_at < NOW() - INTERVAL '1 day';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_logs_trigger
AFTER INSERT ON request_logs
EXECUTE FUNCTION cleanup_old_logs();

-- Set JWT secret from environment variable
ALTER DATABASE postgres SET "app.jwt_secret" TO current_setting('app.settings.jwt_secret', true);

-- Create security_headers table
CREATE TABLE security_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_name TEXT NOT NULL,
  header_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE security_headers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view security headers"
  ON security_headers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage security headers"
  ON security_headers FOR ALL
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_security_headers_updated_at
  BEFORE UPDATE ON security_headers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default security headers
INSERT INTO security_headers (header_name, header_value) VALUES
  ('X-Frame-Options', 'DENY'),
  ('X-XSS-Protection', '1; mode=block'),
  ('X-Content-Type-Options', 'nosniff'),
  ('Referrer-Policy', 'strict-origin-when-cross-origin'),
  ('Content-Security-Policy', 'default-src ''self''; script-src ''self'' ''unsafe-inline'' ''unsafe-eval'' https://apis.google.com; style-src ''self'' ''unsafe-inline''; img-src ''self'' data: https:; font-src ''self'' data:; connect-src ''self'' https://*.googleapis.com https://*.supabase.co; frame-src ''self'' https://accounts.google.com;'),
  ('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'),
  ('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); 