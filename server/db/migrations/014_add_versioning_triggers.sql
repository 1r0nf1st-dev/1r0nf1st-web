-- Add versioning triggers to automatically create note versions when content changes
-- This migration adds triggers that create a version entry whenever a note's content is updated

-- Function to create a version when note content changes
CREATE OR REPLACE FUNCTION create_note_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM note_versions
    WHERE note_id = NEW.id;
    
    -- Insert new version with the OLD content (before the change)
    INSERT INTO note_versions (note_id, content, content_text, version_number)
    VALUES (
      NEW.id,
      OLD.content, -- Store the OLD content (before change)
      extract_text_from_content(OLD.content),
      next_version
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create version on update (only when content changes)
CREATE TRIGGER create_note_version_trigger
  AFTER UPDATE ON notes
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_note_version();

-- Function to cleanup old versions (keep last 50 versions per note)
CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS TRIGGER AS $$
DECLARE
  max_version INTEGER;
  cutoff_version INTEGER;
BEGIN
  -- Get the maximum version number for this note
  SELECT MAX(version_number)
  INTO max_version
  FROM note_versions
  WHERE note_id = NEW.note_id;
  
  -- Calculate cutoff (keep last 50 versions)
  cutoff_version := max_version - 50;
  
  -- Delete versions older than the cutoff
  IF cutoff_version > 0 THEN
    DELETE FROM note_versions
    WHERE note_id = NEW.note_id
      AND version_number < cutoff_version;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup old versions after inserting a new one
CREATE TRIGGER cleanup_old_versions_trigger
  AFTER INSERT ON note_versions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_versions();
