-- Add academic_year column to universities table
ALTER TABLE universities
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-2026';

-- Create announcements table for dynamic banners
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  link_url TEXT,
  link_text TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active announcements
CREATE POLICY "Allow public read access to active announcements"
ON announcements FOR SELECT
TO public
USING (is_active = true AND (ends_at IS NULL OR ends_at > NOW()));

-- Allow authenticated users to manage announcements
CREATE POLICY "Allow authenticated users to manage announcements"
ON announcements FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create updated_at trigger for announcements
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- Insert sample announcements
INSERT INTO announcements (title, message, type, link_url, link_text, is_active) VALUES
  ('UPCAT 2025 Applications Now Open', 'The University of the Philippines has started accepting applications for UPCAT 2025. Deadline is September 15, 2025.', 'success', 'https://upcat.up.edu.ph', 'Apply Now', true),
  ('Important: ACET Schedule Change', 'Ateneo has moved the ACET exam date to November 23, 2025. Please update your calendars accordingly.', 'warning', NULL, NULL, true),
  ('New: UST Added to Tracker', 'We have added University of Santo Tomas (USTET) information to our tracker. Check out the updated requirements!', 'info', NULL, NULL, true);
