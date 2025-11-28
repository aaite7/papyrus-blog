/*
  # Add Image Fit Mode

  1. Changes
    - Add `image_fit` column to posts table to control how images are displayed
    - Values: 'cover' (cropped) or 'contain' (full image)
    - Default: 'contain' (show full image)
  
  2. Notes
    - Allows users to choose between cropped or full image display
    - Applies to both list view and detail view
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'image_fit'
  ) THEN
    ALTER TABLE posts ADD COLUMN image_fit text DEFAULT 'contain';
  END IF;
END $$;