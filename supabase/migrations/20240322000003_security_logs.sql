-- Create security_logs table
CREATE TABLE security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  level TEXT NOT NULL,
  environment TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all logs"
  ON security_logs FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Service can insert logs"
  ON security_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX idx_security_logs_level ON security_logs(level);
CREATE INDEX idx_security_logs_service ON security_logs(service);

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER cleanup_old_logs_trigger
  AFTER INSERT ON security_logs
  EXECUTE FUNCTION cleanup_old_security_logs(); 