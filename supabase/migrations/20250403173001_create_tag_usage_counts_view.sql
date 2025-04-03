-- Create a view to show the usage count for each tag
-- Since views inherit the security model from underlying tables,
-- we'll incorporate the user_id check directly in the view definition
CREATE OR REPLACE VIEW tag_usage_counts AS
SELECT 
  t.id,
  t.name,
  t.user_id,
  t.created_at,
  t.updated_at,
  (
    SELECT COUNT(*) FROM book_tags bt WHERE bt.tag_id = t.id
  ) + 
  (
    SELECT COUNT(*) FROM highlight_tags ht WHERE ht.tag_id = t.id
  ) + 
  (
    SELECT COUNT(*) FROM spark_tags st WHERE st.tag_id = t.id
  ) AS usage_count
FROM 
  tags t
WHERE 
  t.user_id = auth.uid(); -- This ensures only the user's tags are visible 