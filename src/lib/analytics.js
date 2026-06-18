// src/lib/analytics.js

import { supabase } from './supabase.js';
import { safeJsonParse } from './utils.js';

/**
 * 分析配置
 */
const CONFIG = {
  // 会话超时时间（30 分钟）
  SESSION_TIMEOUT: 30 * 60 * 1000,
  // 批量上报最大数量
  BATCH_SIZE: 10,
  // 上报间隔（秒）
  REPORT_INTERVAL: 5000
};

/**
 * 分析状态
 */
const state = {
  sessionId: null,
  pageViews: [],
  events: [],
  lastReport: Date.now()
};

/**
 * 生成会话 ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取或创建会话
 */
function getOrCreateSession() {
  if (!state.sessionId) {
    // 尝试从 localStorage 获取
    const session = safeJsonParse(localStorage.getItem('analytics_session'), {});
    if (session && session.sessionId && Date.now() - session.timestamp < CONFIG.SESSION_TIMEOUT) {
      state.sessionId = session.sessionId;
      return session.sessionId;
    }
    
    // 创建新会话
    state.sessionId = generateSessionId();
    localStorage.setItem('analytics_session', JSON.stringify({
      sessionId: state.sessionId,
      timestamp: Date.now()
    }));
  }
  
  return state.sessionId;
}

/**
 * 获取用户指纹（简化版）
 */
function getUserFingerprint() {
  // 使用 timezone + language + screen 作为简单指纹
  const data = [
    new Date().getTimezoneOffset(),
    navigator.language,
    screen.width,
    screen.height,
    new Date().toDateString()
  ].join('|');
  
  // 简单 hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0;
  }
  
  return `user_${Math.abs(hash).toString(36)}`;
}

/**
 * 记录页面浏览
 */
export async function trackPageView(postId = null, postTitle = null) {
  const sessionId = getOrCreateSession();
  const userFingerprint = getUserFingerprint();
  
  const pageView = {
    session_id: sessionId,
    user_fingerprint: userFingerprint,
    url: window.location.pathname,
    title: postTitle || document.title,
    referrer: document.referrer || null,
    post_id: postId,
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`
  };
  
  // 添加到队列
  state.pageViews.push(pageView);
  
  // 尝试上报
  await flushPageViews();
  
  console.log(`[Analytics] Page view tracked: ${pageView.url}`);
}

/**
 * 记录事件
 */
export async function trackEvent(eventName, properties = {}) {
  const sessionId = getOrCreateSession();
  const userFingerprint = getUserFingerprint();
  
  const event = {
    session_id: sessionId,
    user_fingerprint: userFingerprint,
    event_name: eventName,
    event_properties: JSON.stringify(properties),
    url: window.location.pathname,
    timestamp: Date.now()
  };
  
  // 添加到队列
  state.events.push(event);
  
  // 尝试上报
  await flushEvents();
  
  console.log(`[Analytics] Event tracked: ${eventName}`, properties);
}

/**
 * 批量上报页面浏览
 */
async function flushPageViews() {
  if (state.pageViews.length === 0) return;
  if (Date.now() - state.lastReport < CONFIG.REPORT_INTERVAL) return;
  
  const views = state.pageViews.splice(0, CONFIG.BATCH_SIZE);
  
  try {
    const { error } = await supabase
      .from('page_views')
      .insert(views.map(v => ({
        session_id: v.session_id,
        user_fingerprint: v.user_fingerprint,
        url: v.url,
        title: v.title,
        referrer: v.referrer,
        post_id: v.post_id,
        viewed_at: new Date(v.timestamp).toISOString(),
        user_agent: v.user_agent,
        screen_resolution: v.screen_resolution,
        viewport_size: v.viewport_size
      })));
    
    if (error) throw error;
    state.lastReport = Date.now();
    
    console.log(`[Analytics] Flushed ${views.length} page views`);
  } catch (error) {
    console.error('[Analytics] Failed to flush page views:', error);
    // 恢复数据
    state.pageViews.unshift(...views);
  }
}

/**
 * 批量上报事件
 */
async function flushEvents() {
  if (state.events.length === 0) return;
  if (Date.now() - state.lastReport < CONFIG.REPORT_INTERVAL) return;
  
  const events = state.events.splice(0, CONFIG.BATCH_SIZE);
  
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert(events.map(e => ({
        session_id: e.session_id,
        user_fingerprint: e.user_fingerprint,
        event_name: e.event_name,
        event_properties: e.event_properties,
        url: e.url,
        occurred_at: new Date(e.timestamp).toISOString()
      })));
    
    if (error) throw error;
    state.lastReport = Date.now();
    
    console.log(`[Analytics] Flushed ${events.length} events`);
  } catch (error) {
    console.error('[Analytics] Failed to flush events:', error);
    // 恢复数据
    state.events.unshift(...events);
  }
}

/**
 * 获取文章真实阅读量
 */
export async function getPostViewCount(postId) {
  try {
    const { count, error } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('[Analytics] Failed to get view count:', error);
    return 0;
  }
}

/**
 * 获取热门文章（基于真实阅读量）
 */
export async function getPopularPosts(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('post_id, title')
      .not('post_id', 'is', null)
      .order('viewed_at', { ascending: false })
      .limit(limit * 3); // 多取一些去重
    
    if (error) throw error;
    
    // 按 post_id 分组计数
    const viewCounts = {};
    const postTitles = {};
    
    data.forEach(view => {
      const postId = view.post_id;
      viewCounts[postId] = (viewCounts[postId] || 0) + 1;
      if (view.title) {
        postTitles[postId] = view.title;
      }
    });
    
    // 排序并返回
    return Object.entries(viewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([postId, count]) => ({
        post_id: postId,
        view_count: count,
        title: postTitles[postId]
      }));
  } catch (error) {
    console.error('[Analytics] Failed to get popular posts:', error);
    return [];
  }
}

/**
 * 获取分析统计
 */
export async function getAnalyticsStats(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // 总浏览量
    const { count: totalViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', since.toISOString());
    
    // 独立访客（基于指纹）
    const { data: visitors } = await supabase
      .from('page_views')
      .select('user_fingerprint')
      .gte('viewed_at', since.toISOString());
    
    const uniqueVisitors = new Set(visitors?.map(v => v.user_fingerprint) || []).size;
    
    // 会话数
    const { data: sessions } = await supabase
      .from('page_views')
      .select('session_id')
      .gte('viewed_at', since.toISOString());
    
    const totalSessions = new Set(sessions?.map(s => s.session_id) || []).size;
    
    // 热门页面
    const { data: topPages } = await supabase
      .from('page_views')
      .select('url, title')
      .gte('viewed_at', since.toISOString())
      .order('viewed_at', { ascending: false })
      .limit(10);
    
    return {
      totalViews: totalViews || 0,
      uniqueVisitors,
      totalSessions,
      avgViewsPerSession: totalSessions > 0 ? (totalViews / totalSessions).toFixed(2) : 0,
      topPages: topPages || [],
      period: `${days} days`
    };
  } catch (error) {
    console.error('[Analytics] Failed to get stats:', error);
    return null;
  }
}

/**
 * 初始化分析追踪
 */
export function initAnalytics() {
  // 页面浏览追踪
  trackPageView();
  
  // 历史后退/前进追踪
  window.addEventListener('popstate', () => {
    trackPageView();
  });
  
  // 出站链接追踪
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="http"]');
    if (link) {
      trackEvent('link_click', {
        url: link.href,
        text: link.textContent?.trim()
      });
    }
  });
  
  document.addEventListener('change', (e) => {
    if (e.target.id === 'search' && e.target.value.trim().length > 0) {
      trackEvent('search', { query: e.target.value.trim() });
    }
  });
  
  // 文章阅读完成追踪
  const readObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const postId = entry.target.dataset.postId;
        if (postId) {
          trackEvent('post_read', { post_id: postId });
        }
        readObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.8 });
  
  // 观察所有文章卡片
  setTimeout(() => {
    document.querySelectorAll('[data-post-id]').forEach(card => {
      readObserver.observe(card);
    });
  }, 1000);
  
  // 定期清理过期会话
  setInterval(() => {
    const stored = localStorage.getItem('analytics_session');
    if (stored) {
      const { timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp > CONFIG.SESSION_TIMEOUT) {
        localStorage.removeItem('analytics_session');
        state.sessionId = null;
      }
    }
  }, 60000);
  
  console.log('[Analytics] Initialized');
}

/**
 * 导出分析数据（管理员功能）
 */
export async function exportAnalyticsData(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('*')
      .gte('viewed_at', startDate.toISOString())
      .lte('viewed_at', endDate.toISOString())
      .order('viewed_at', { ascending: true });
    
    if (error) throw error;
    
    // 转换为 CSV
    const headers = ['session_id', 'user_fingerprint', 'url', 'title', 'post_id', 'viewed_at', 'referrer'];
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');
    
    return csv;
  } catch (error) {
    console.error('[Analytics] Failed to export data:', error);
    return null;
  }
}
