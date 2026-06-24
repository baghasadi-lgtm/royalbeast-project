ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS depreciation_posted_through DATE;
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS paid_from VARCHAR(20) DEFAULT 'cash' CHECK (paid_from IN ('cash', 'capital'));
