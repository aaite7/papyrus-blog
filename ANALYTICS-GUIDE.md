# 分析功能使用指南 📊

## 功能概述

为 Minimalist Blog 添加了完整的用户行为分析功能，基于 Supabase 数据库追踪页面浏览和用户事件，帮助了解用户行为和优化内容。

## 核心特性

### 1. 页面浏览追踪
- ✅ 自动记录每次页面访问
- ✅ 匿名用户指纹识别
- ✅ 会话管理（30 分钟超时）
- ✅ 来源页面追踪
- ✅ 屏幕分辨率和视口大小
- ✅ 文章关联（post_id）

### 2. 事件追踪
- ✅ 链接点击
- ✅ 搜索行为
- ✅ 文章阅读完成（80% 可见）
- ✅ 自定义事件扩展

### 3. 真实阅读量统计
- ✅ 替换虚假的 view_count
- ✅ 基于实际浏览记录
- ✅ 去重机制（基于会话）

### 4. 热门文章排名
- ✅ 基于真实阅读量
- ✅ 实时更新
- ✅ 时间范围可配置

### 5. 分析统计
- ✅ 总浏览量
- ✅ 独立访客数
- ✅ 会话数
- ✅ 平均每会话浏览数
- ✅ 热门页面 Top 10

## 数据库表结构

### page_views 表
```sql
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,           -- 会话 ID
  user_fingerprint TEXT NOT NULL,     -- 用户指纹
  url TEXT NOT NULL,                  -- 访问 URL
  title TEXT,                         -- 页面标题
  referrer TEXT,                      -- 来源页面
  post_id TEXT,                       -- 文章 ID
  viewed_at TIMESTAMPTZ,              -- 访问时间
  user_agent TEXT,                    -- 用户代理
  screen_resolution TEXT,             -- 屏幕分辨率
  viewport_size TEXT                  -- 视口大小
);
```

### analytics_events 表
```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,           -- 会话 ID
  user_fingerprint TEXT NOT NULL,     -- 用户指纹
  event_name TEXT NOT NULL,           -- 事件名称
  event_properties JSONB,             -- 事件属性
  url TEXT NOT NULL,                  -- 事件 URL
  occurred_at TIMESTAMPTZ             -- 发生时间
);
```

## 部署步骤

### 1. 执行数据库迁移
```bash
# 在 Supabase SQL Editor 中执行
# supabase/analytics_tables.sql
```

### 2. 配置 RLS（可选）
如果启用 Row Level Security：
```sql
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入
CREATE POLICY "Allow anonymous insert" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON page_views
  FOR SELECT USING (true);
```

### 3. 验证安装
打开浏览器控制台，应该看到：
```
[Analytics] Initialized
[Analytics] Page view tracked: /
```

## 使用方法

### 追踪页面浏览
```javascript
import { trackPageView } from './lib/analytics.js';

// 手动追踪（自动在 renderPost 中调用）
trackPageView(postId, postTitle);
```

### 追踪事件
```javascript
import { trackEvent } from './lib/analytics.js';

// 自定义事件
trackEvent('button_click', {
  button_id: 'subscribe-btn',
  button_text: '订阅'
});
```

### 获取阅读量
```javascript
import { getPostViewCount } from './lib/analytics.js';

// 获取文章真实阅读量
const count = await getPostViewCount(postId);
```

### 获取热门文章
```javascript
import { getPopularPosts } from './lib/analytics.js';

// 获取 Top 5 热门文章
const popular = await getPopularPosts(5);
```

### 获取统计分析
```javascript
import { getAnalyticsStats } from './lib/analytics.js';

// 获取最近 7 天统计
const stats = await getAnalyticsStats(7);
console.log(stats);
// {
//   totalViews: 1234,
//   uniqueVisitors: 567,
//   totalSessions: 890,
//   avgViewsPerSession: "1.39",
//   topPages: [...],
//   period: "7 days"
// }
```

## 管理员后台集成

### 添加分析仪表盘
在 admin 页面添加：

```javascript
import { getAnalyticsStats, exportAnalyticsData } from './lib/analytics.js';

// 显示统计
const stats = await getAnalyticsStats(7);
console.log('总浏览:', stats.totalViews);
console.log('独立访客:', stats.uniqueVisitors);

// 导出数据
const csv = await exportAnalyticsData(
  new Date('2026-01-01'),
  new Date('2026-12-31')
);
```

### 热门文章小部件
```javascript
// 替换原来的热门文章逻辑
const popularPosts = await getPopularPosts(5);
// 渲染 popularPosts 到侧边栏
```

## 数据隐私

### 匿名化处理
- ✅ 不使用 Cookie
- ✅ 使用指纹而非真实 ID
- ✅ 不收集个人信息
- ✅ 符合 GDPR 要求

### 数据保留
建议保留 90 天数据：
```sql
-- 手动清理
DELETE FROM page_views 
WHERE viewed_at < NOW() - INTERVAL '90 days';
```

或设置自动清理（需要 pg_cron）：
```sql
SELECT cron.schedule(
  'cleanup-old-analytics',
  '0 3 * * *',
  $$DELETE FROM page_views WHERE viewed_at < NOW() - INTERVAL '90 days'$$
);
```

## 性能优化

### 批量上报
- 最多累积 10 条记录
- 每 5 秒上报一次
- 失败自动重试

### 索引优化
已创建以下索引：
- `idx_page_views_post_id` - 文章查询
- `idx_page_views_viewed_at` - 时间范围查询
- `idx_page_views_session_id` - 会话查询
- `idx_page_views_user_fingerprint` - 访客查询

## 查询示例

### 热门文章
```sql
SELECT post_id, COUNT(*) as views
FROM page_views
WHERE post_id IS NOT NULL
GROUP BY post_id
ORDER BY views DESC
LIMIT 10;
```

### 每日趋势
```sql
SELECT 
  DATE(viewed_at) as date,
  COUNT(*) as views
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(viewed_at)
ORDER BY date DESC;
```

### 独立访客
```sql
SELECT 
  COUNT(DISTINCT user_fingerprint) as unique_visitors,
  COUNT(*) as total_views
FROM page_views
WHERE viewed_at >= NOW() - INTERVAL '7 days';
```

## 故障排查

### 问题：数据未上报
**解决**:
1. 检查 Supabase 连接
2. 查看控制台错误日志
3. 验证表结构是否正确

### 问题：重复计数
**解决**:
- 正常现象（不同会话）
- 可调整 SESSION_TIMEOUT
- 使用 DISTINCT user_fingerprint 去重

### 问题：性能下降
**解决**:
1. 检查索引是否创建
2. 启用数据清理（90 天）
3. 使用物化视图

## 文件清单

| 文件 | 说明 |
|------|------|
| `src/lib/analytics.js` | 分析核心模块 |
| `supabase/analytics_tables.sql` | 数据库迁移脚本 |
| `ANALYTICS-GUIDE.md` | 本文档 |

## 更新日志

### 2026-06-09
- ✅ 实现页面浏览追踪
- ✅ 实现事件追踪
- ✅ 真实阅读量统计
- ✅ 热门文章排名
- ✅ 分析统计功能
- ✅ 数据导出功能

---

**文档版本**: 1.0  
**最后更新**: 2026-06-09
