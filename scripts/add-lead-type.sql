-- Add lead_type column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'internet';

-- Classify existing leads by source
-- Dealertrack = service/DMS imports
UPDATE leads SET lead_type = 'service'
WHERE source ILIKE '%dealertrack%';

-- Walk-ins
UPDATE leads SET lead_type = 'walkin'
WHERE source ILIKE '%walk-in%' OR source ILIKE '%walk in%' OR source ILIKE '%fresh up%';

-- Phone
UPDATE leads SET lead_type = 'phone'
WHERE source ILIKE '%phone%';

-- Everything else stays 'internet' (the default)
