-- Add conversations table for chat-based gradient generation
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add messages table to store chat history
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Store AI-generated gradients inline (before user saves them)
  -- Format: [{ name: "...", type: "linear", colorStops: [...], previewUrl: "..." }]
  suggested_gradients JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to gradients table for chat context and storage
ALTER TABLE gradients
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_gradients_conversation_id ON gradients(conversation_id);
CREATE INDEX IF NOT EXISTS idx_gradients_message_id ON gradients(message_id);

-- Add updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get conversation with messages
CREATE OR REPLACE FUNCTION get_conversation_with_messages(conv_id UUID)
RETURNS TABLE (
  conversation JSONB,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    row_to_json(c.*)::JSONB as conversation,
    COALESCE(
      json_agg(
        json_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'suggested_gradients', m.suggested_gradients,
          'created_at', m.created_at
        ) ORDER BY m.created_at ASC
      )::JSONB,
      '[]'::JSONB
    ) as messages
  FROM conversations c
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE c.id = conv_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION auto_generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if it's the first message and conversation has no title
  IF (
    SELECT COUNT(*) FROM messages WHERE conversation_id = NEW.conversation_id
  ) = 1 AND NEW.role = 'user' THEN
    UPDATE conversations
    SET title = LEFT(NEW.content, 100)
    WHERE id = NEW.conversation_id AND (title IS NULL OR title = '');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_title_conversation AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION auto_generate_conversation_title();

-- Create Supabase Storage bucket policies (to be run in Supabase Dashboard SQL Editor)
-- Note: This assumes you've created a bucket named 'gradients' in Supabase Storage

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own gradient images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gradients' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own gradient images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gradients' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own gradient images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gradients' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to gradient images
CREATE POLICY "Anyone can view gradient images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gradients');
