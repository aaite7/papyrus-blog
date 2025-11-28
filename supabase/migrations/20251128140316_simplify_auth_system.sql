/*
  # Simplify Authentication System

  1. Changes
    - Remove user registration functionality
    - Remove user_profiles table
    - Remove comments table
    - Simplify posts table to remove author references
    - Keep basic post management for admin only

  2. Security
    - Admin authentication will be handled via simple login
    - No public user registration
*/

DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP POLICY IF EXISTS "Anyone can read published posts" ON posts;
DROP POLICY IF EXISTS "Admins can insert posts" ON posts;
DROP POLICY IF EXISTS "Admins can update posts" ON posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON posts;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE posts DROP COLUMN author_id;
  END IF;
END $$;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);
