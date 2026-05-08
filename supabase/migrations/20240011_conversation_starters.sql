-- Conversation starters table for Kişisel Baristan
-- Each chatbot can have 0-N starters fetched from DB; no fallbacks shown if empty

CREATE TABLE IF NOT EXISTS conversation_starters (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id uuid        NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  prompt     text        NOT NULL DEFAULT '',
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_starters_chatbot_id_idx
  ON conversation_starters(chatbot_id, sort_order);

ALTER TABLE conversation_starters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "starters_select" ON conversation_starters
  FOR SELECT USING (true);

CREATE POLICY "starters_all" ON conversation_starters
  FOR ALL USING (true) WITH CHECK (true);
