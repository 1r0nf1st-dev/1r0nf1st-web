-- Web Clipper tokens: long-lived API tokens for the browser extension
-- One token per user; generating a new one revokes the previous
CREATE TABLE IF NOT EXISTS web_clipper_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_clipper_tokens_user_id ON web_clipper_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_web_clipper_tokens_token_hash ON web_clipper_tokens(token_hash);
