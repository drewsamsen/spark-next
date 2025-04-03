-- Create a view to show the usage count for each category
-- Since views inherit the security model from underlying tables,
-- we'll incorporate the user_id check directly in the view definition
CREATE OR REPLACE VIEW category_usage_counts AS
SELECT 
  c.id,
  c.name,
  c.slug,
  c.user_id,
  c.created_at,
  c.updated_at,
  (
    SELECT COUNT(*) FROM book_categories bc WHERE bc.category_id = c.id
  ) + 
  (
    SELECT COUNT(*) FROM highlight_categories hc WHERE hc.category_id = c.id
  ) + 
  (
    SELECT COUNT(*) FROM spark_categories sc WHERE sc.category_id = c.id
  ) AS usage_count
FROM 
  categories c
WHERE 
  c.user_id = auth.uid(); -- This ensures only the user's categories are visible 