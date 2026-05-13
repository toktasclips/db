-- Onboarding leads table for Dijital Barista admin portal
-- Tracks prospective clients from Tally form submissions through account creation

CREATE TABLE IF NOT EXISTS onboarding_leads (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            text        NOT NULL,
  phone                text,
  email                text,
  instagram            text,
  current_situation    text,
  goal                 text,
  notes                text,
  source               text        NOT NULL DEFAULT 'tally',
  status               text        NOT NULL DEFAULT 'pending',
  selected_offer_id    uuid        REFERENCES offers(id),
  selected_offer_name  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  converted_user_id    uuid
);

CREATE INDEX IF NOT EXISTS onboarding_leads_status_idx
  ON onboarding_leads(status, created_at DESC);

ALTER TABLE onboarding_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_leads_all" ON onboarding_leads
  FOR ALL USING (true) WITH CHECK (true);
