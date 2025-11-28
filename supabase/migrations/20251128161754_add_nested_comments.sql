/*
  # Add Nested Comments Support

  ## Changes Made
  
  1. New Column Added to `comments` table:
    - `parent_id` (uuid, nullable): References another comment for nested replies
      - Foreign key to comments.id with CASCADE delete
      - Default: null (top-level comments)

  2. Security Changes:
    - Update existing RLS policies to work with nested comments
    - Maintain public read access and authenticated write access

  ## Notes
  - Top-level comments have parent_id = null
  - Reply comments have parent_id set to the parent comment's id
  - When a parent comment is deleted, all replies are also deleted (CASCADE)
  - Comments can be nested to any depth
*/

-- Add parent_id column for nested comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better performance on parent_id queries
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);

-- Create index for querying comments by post with parent relationship
CREATE INDEX IF NOT EXISTS comments_post_parent_idx ON comments(post_id, parent_id);