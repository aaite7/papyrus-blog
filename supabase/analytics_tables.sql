-- Minimalist Blog 分析功能数据库迁移
-- 执行时间：2026-06-09
-- 说明：创建页面浏览和事件追踪表

-- 页面浏览表
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_fingerprint TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  post_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  
  -- 索引优化查询性能
  CONSTRAINT chk_session_id CHECK (session_id ~ '^sess_'),
  CONSTRAINT chk_user_fingerprint CHECK (user_fingerprint ~ '^user_')
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_views_post_id ON page_views(post_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_fingerprint ON page_views(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(url);

-- 分析事件表
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_fingerprint TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB,
  url TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 索引优化
  CONSTRAINT chk_event_session CHECK (session_id ~ '^sess_'),
  CONSTRAINT chk_event_fingerprint CHECK (user_fingerprint ~ '^user_')
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON analytics_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- 添加注释
COMMENT ON TABLE page_views IS '页面浏览记录，用于分析用户行为和热门内容';
COMMENT ON TABLE analytics_events IS '用户行为事件记录，用于分析用户交互';
COMMENT ON COLUMN page_views.post_id IS '关联的文章 ID，用于统计文章阅读量';
COMMENT ON COLUMN page_views.user_fingerprint IS '匿名用户指纹，用于统计独立访客';
COMMENT ON COLUMN analytics_events.event_properties IS '事件附加属性，JSON 格式存储';

-- 可选：创建物化视图用于快速查询热门文章
CREATE OR REPLACE VIEW popular_posts AS
SELECT 
  post_id,
  COUNT(*) as view_count,
  MAX(title) as title,
  MAX(viewed_at) as last_viewed
FROM page_views
WHERE post_id IS NOT NULL
GROUP BY post_id
ORDER BY view_count DESC;

-- 权限设置（如果使用 RLS）
-- ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 可选：自动清理旧数据（保留 90 天）
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'cleanup-old-analytics',
--   '0 3 * * *', -- 每天凌晨 3 点
--   $$DELETE FROM page_views WHERE viewed_at < NOW() - INTERVAL '90 days'$$
-- );
