/*
  # Add Image Crop Coordinates

  1. Changes
    - Add `crop_data` column to posts table to store crop coordinates
    - Stores JSON object with x, y, width, height for cropped region
    - Allows null for images without custom crop
  
  2. Notes
    - Enables users to manually crop images
    - Coordinates are stored as percentages for responsive display
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'crop_data'
  ) THEN
    ALTER TABLE posts ADD COLUMN crop_data jsonb DEFAULT NULL;
  END IF;
END $$;