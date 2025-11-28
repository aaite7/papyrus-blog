/*
  # Add Draft and Pinned Features to Posts

  ## Changes Made
  
  1. New Columns Added to `posts` table:
    - `is_draft` (boolean): Indicates if the post is a draft (not published)
      - Default: false (published by default)
    - `is_pinned` (boolean): Indicates if the post is pinned to the top
      - Default: false (not pinned by default)
    - `pinned_at` (timestamptz): When the post was pinned (for sorting pinned posts)
      - Default: null

  2. Security Changes:
    - Update RLS policies to allow admins to view drafts
    - Public users can only see published posts (is_draft = false)
    - Maintain existing admin access for all operations

  ## Notes
  - Draft posts are hidden from public view
  - Pinned posts will appear at the top of the list
  - Multiple posts can be pinned (sorted by pinned_at desc)
*/

-- Add draft and pinned columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_draft boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_pinned boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'pinned_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN pinned_at timestamptz;
  END IF;
END $$;

-- Drop existing SELECT policy for anonymous users and recreate with draft filter
DROP POLICY IF EXISTS "Anyone can view published posts" ON posts;

-- Create new policy that excludes drafts for anonymous users
CREATE POLICY "Anyone can view published posts"
  ON posts
  FOR SELECT
  TO anon
  USING (is_draft = false);

-- Update the authenticated users policy to allow viewing drafts for admins
DROP POLICY IF EXISTS "Authenticated users can view all posts" ON posts;

CREATE POLICY "Authenticated users can view all posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for better performance on draft and pinned queries
CREATE INDEX IF NOT EXISTS posts_is_draft_idx ON posts(is_draft);
CREATE INDEX IF NOT EXISTS posts_is_pinned_idx ON posts(is_pinned);
CREATE INDEX IF NOT EXISTS posts_pinned_at_idx ON posts(pinned_at DESC) WHERE is_pinned = true;