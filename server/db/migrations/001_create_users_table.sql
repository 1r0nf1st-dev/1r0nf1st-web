-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert default admin user (password: admin123)
-- You'll need to hash this password using bcrypt before inserting
-- For now, this is a placeholder - the app will create the admin user on first run
-- To manually create: INSERT INTO users (username, password_hash) VALUES ('admin', '<bcrypt_hash_of_admin123>');
