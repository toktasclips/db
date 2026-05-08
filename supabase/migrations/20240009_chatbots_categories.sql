-- Add categories array to chatbots table
-- Enables tagging assistants with category chips (Satış, Pazarlama, etc.)

ALTER TABLE chatbots
  ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';
