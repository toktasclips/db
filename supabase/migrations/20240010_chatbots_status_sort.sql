-- Add status and sort_order columns to chatbots table
-- Required by Kişisel Baristan save function (saveBotToDb payload)

ALTER TABLE chatbots
  ADD COLUMN IF NOT EXISTS status     text    DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
