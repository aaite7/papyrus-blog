/*
  # Creative Blog Schema - Unique Features

  1. Schema Updates
    - Drop old posts table and create new enhanced version
    - Add `mood` field for emotional context
    - Add `read_time` for estimated reading duration
    - Add `likes` counter for engagement
    - Add `color_theme` for personalized post styling
    - Add `published` status for draft management
    
  2. New Features
    - Reading time estimation
    - Mood/emotion tracking
    - Like system
    - Custom color themes per post
    - Draft/published workflow
    
  3. Security
    - Enable RLS with public read, authenticated write
*/

-- Drop existing posts table if exists
DROP TABLE IF EXISTS posts CASCADE;

-- Create enhanced posts table with unique features
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  slug text UNIQUE,
  image text DEFAULT '',
  excerpt text DEFAULT '',
  content text NOT NULL DEFAULT '',
  author text DEFAULT 'Anonymous',
  category text DEFAULT 'Thoughts',
  tags text[] DEFAULT '{}',
  mood text DEFAULT 'neutral',
  color_theme text DEFAULT 'default',
  read_time integer DEFAULT 1,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts only
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  TO public
  USING (published = true);

-- Authenticated users can view all posts
CREATE POLICY "Authenticated users can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update posts
CREATE POLICY "Authenticated users can update posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete posts
CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_mood ON posts(mood);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    ) || '-' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
DROP TRIGGER IF EXISTS generate_slug_trigger ON posts;
CREATE TRIGGER generate_slug_trigger
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_title();

-- Function to estimate read time based on content
CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
DECLARE
  word_count integer;
  words_per_minute integer := 200;
BEGIN
  word_count := array_length(regexp_split_to_array(NEW.content, '\s+'), 1);
  NEW.read_time := GREATEST(1, CEIL(word_count::float / words_per_minute));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate read time
DROP TRIGGER IF EXISTS calculate_read_time_trigger ON posts;
CREATE TRIGGER calculate_read_time_trigger
  BEFORE INSERT OR UPDATE OF content ON posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_read_time();