-- Function to update updated_at timestamp (reuse existing function if it exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON notebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to extract plain text from JSONB content (for search)
CREATE OR REPLACE FUNCTION extract_text_from_content(content JSONB)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  elem JSONB;
  text_elem JSONB;
  text_content TEXT;
BEGIN
  -- Extract text from TipTap/Slate document structure
  -- TipTap format: { type: 'doc', content: [...] }
  IF content ? 'content' AND jsonb_typeof(content->'content') = 'array' THEN
    FOR elem IN SELECT * FROM jsonb_array_elements(content->'content')
    LOOP
      IF elem->>'type' IN ('paragraph', 'heading', 'bulletList', 'orderedList') THEN
        -- Extract text from nested content array
        IF elem ? 'content' AND jsonb_typeof(elem->'content') = 'array' THEN
          FOR text_elem IN SELECT * FROM jsonb_array_elements(elem->'content')
          LOOP
            IF text_elem->>'type' = 'text' AND text_elem ? 'text' THEN
              text_content := text_elem->>'text';
              IF text_content IS NOT NULL AND text_content != '' THEN
                result := result || ' ' || text_content;
              END IF;
            END IF;
          END LOOP;
        END IF;
      ELSIF elem->>'type' = 'text' AND elem ? 'text' THEN
        -- Direct text node
        text_content := elem->>'text';
        IF text_content IS NOT NULL AND text_content != '' THEN
          result := result || ' ' || text_content;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update content_text when content changes
CREATE OR REPLACE FUNCTION update_note_content_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_text = extract_text_from_content(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_content_text_trigger
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_note_content_text();
