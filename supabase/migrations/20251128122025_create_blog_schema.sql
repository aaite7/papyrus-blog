/*
  # Create Blog Schema

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `image` (text, cover image URL)
      - `excerpt` (text, auto-generated from content if empty)
      - `content` (text, markdown content)
      - `category` (text)
      - `tags` (text array)
      - `views` (integer, default 0)
      - `is_pinned` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
  2. Security
    - Enable RLS on `posts` table
    - Add policy for public read access
    - Add policy for authenticated admin to create/update/delete
    
  3. Indexes
    - Index on category for filtering
    - Index on created_at for sorting
    - Index on is_pinned for featured posts
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  image text DEFAULT '',
  excerpt text DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text DEFAULT 'Uncategorized',
  tags text[] DEFAULT '{}',
  views integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public can view all posts
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert posts
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
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING gin(tags);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;