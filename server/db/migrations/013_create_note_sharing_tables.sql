-- Create shared_notes table for note sharing functionality
-- Supports both user-to-user sharing and public share links

CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- If shared_with_user_id is NULL, it's a public share (via link)
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Unique token for public share links
  share_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  permission VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  -- Ensure a note can only be shared once per user (unless it's a public share)
  -- Allow multiple public shares (shared_with_user_id IS NULL)
  UNIQUE(note_id, shared_with_user_id)
);

-- Indexes for shared_notes
CREATE INDEX IF NOT EXISTS idx_shared_notes_note_id ON shared_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_owner_id ON shared_notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_shared_with_user_id ON shared_notes(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_share_token ON shared_notes(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_notes_expires_at ON shared_notes(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_shared_notes_updated_at
  BEFORE UPDATE ON shared_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a share has expired
CREATE OR REPLACE FUNCTION is_share_expired(share_record shared_notes)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;
