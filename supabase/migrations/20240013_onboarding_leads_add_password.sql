-- Add desired_password column to onboarding_leads
-- Stores the password the user chose in the Tally registration form

ALTER TABLE onboarding_leads ADD COLUMN IF NOT EXISTS desired_password text;
