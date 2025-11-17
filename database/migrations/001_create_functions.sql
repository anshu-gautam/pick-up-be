-- Create function to increment user generations
CREATE OR REPLACE FUNCTION increment_generations(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET generations_used = generations_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get trending gradients
CREATE OR REPLACE FUNCTION get_trending_gradients(days_ago INTEGER DEFAULT 30, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  gradient JSONB,
  view_count BIGINT,
  save_count BIGINT,
  export_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    row_to_json(g.*)::JSONB as gradient,
    COUNT(CASE WHEN ae.event_type = 'view' THEN 1 END) as view_count,
    COUNT(CASE WHEN ae.event_type = 'save' THEN 1 END) as save_count,
    COUNT(CASE WHEN ae.event_type = 'export' THEN 1 END) as export_count
  FROM gradients g
  LEFT JOIN analytics_events ae ON ae.gradient_id = g.id
    AND ae.created_at >= NOW() - INTERVAL '1 day' * days_ago
  WHERE g.is_public = true
  GROUP BY g.id
  ORDER BY (
    COUNT(CASE WHEN ae.event_type = 'view' THEN 1 END) +
    COUNT(CASE WHEN ae.event_type = 'save' THEN 1 END) * 2 +
    COUNT(CASE WHEN ae.event_type = 'export' THEN 1 END) * 3
  ) DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
