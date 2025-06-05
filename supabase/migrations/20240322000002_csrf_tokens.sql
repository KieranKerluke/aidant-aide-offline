-- Create csrf_tokens table
CREATE TABLE csrf_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Enable RLS
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tokens"
  ON csrf_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON csrf_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON csrf_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX idx_csrf_tokens_user_id ON csrf_tokens(user_id);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_csrf_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM csrf_tokens
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired tokens
CREATE TRIGGER cleanup_expired_tokens_trigger
AFTER INSERT ON csrf_tokens
EXECUTE FUNCTION cleanup_expired_csrf_tokens();

-- Create function to validate token
CREATE OR REPLACE FUNCTION validate_csrf_token(token_to_validate TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  token_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM csrf_tokens
    WHERE token = token_to_validate
    AND expires_at > NOW()
  ) INTO token_exists;
  
  IF token_exists THEN
    DELETE FROM csrf_tokens WHERE token = token_to_validate;
  END IF;
  
  RETURN token_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 