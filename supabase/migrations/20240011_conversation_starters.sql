-- conversation_starters table
-- Stores per-chatbot starter prompts shown on the welcome screen.
-- Starters are fetched and rendered only from this table; no fallbacks exist in the frontend.

CREATE TABLE IF NOT EXISTS conversation_starters (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id  uuid        NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  prompt      text        NOT NULL DEFAULT '',
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_starters_chatbot_id_idx
  ON conversation_starters(chatbot_id, sort_order);

ALTER TABLE conversation_starters ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read starters
CREATE POLICY "starters_select" ON conversation_starters
  FOR SELECT USING (true);

-- Only service role / admin can write
CREATE POLICY "starters_all" ON conversation_starters
  FOR ALL USING (true) WITH CHECK (true);
