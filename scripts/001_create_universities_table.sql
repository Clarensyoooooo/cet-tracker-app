-- Create universities table for CET tracker
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo TEXT,
  exam_name TEXT NOT NULL,
  exam_fee TEXT,
  application_start TEXT NOT NULL,
  application_end TEXT NOT NULL,
  application_status TEXT NOT NULL CHECK (application_status IN ('upcoming', 'ongoing', 'closed')),
  exam_dates JSONB NOT NULL DEFAULT '[]',
  results_release TEXT NOT NULL,
  test_locations TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  admission_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow public read access (this is public info)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read university data (public information)
CREATE POLICY "Allow public read access" ON universities 
  FOR SELECT USING (true);

-- Only authenticated users can modify (for admin)
CREATE POLICY "Allow authenticated insert" ON universities 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON universities 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON universities 
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities(slug);
CREATE INDEX IF NOT EXISTS idx_universities_status ON universities(application_status);
