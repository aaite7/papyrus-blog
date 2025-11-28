/*
  # Add Comments System

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `author_name` (text) - visitor name
      - `author_email` (text) - visitor email (not displayed publicly)
      - `content` (text) - comment content
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on comments table
    - Anyone can read comments
    - Anyone can create comments (no auth required)
    - No one can update/delete (admin only via direct DB access)
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
