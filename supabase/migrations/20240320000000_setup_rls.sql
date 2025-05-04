-- Enable RLS on the sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read their own sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow users to update their own sessions" ON sessions;
DROP POLICY IF EXISTS "Allow users to delete their own sessions" ON sessions;

-- Create a policy to allow authenticated users to read their own sessions
CREATE POLICY "Allow users to read their own sessions"
  ON sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a policy to allow authenticated users to insert sessions
CREATE POLICY "Allow authenticated users to insert sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a policy to allow users to update their own sessions
CREATE POLICY "Allow users to update their own sessions"
  ON sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a policy to allow users to delete their own sessions
CREATE POLICY "Allow users to delete their own sessions"
  ON sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add a user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sessions
    ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$; 