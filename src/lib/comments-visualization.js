// src/lib/comments-visualization.js

import { commentsService } from './comments.js';

/**
 * 获取文章评论数
 */
export async function getCommentCount(postId) {
  try {
    const comments = await commentsService.getCommentsByPostId(postId);
    return comments.length;
  } catch (error) {
    console.error('[Comments] Failed to get count:', error);
    return 0;
  }
}

/**
 * 获取最新评论（跨文章）
 */
export async function getLatestComments(limit = 5) {
  try {
    // 由于 Supabase 结构限制，需要获取所有文章的评论
    // 实际应该优化数据库查询
    const { data: allComments, error } = await window.supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      // comments 表可能不存在，静默失败
      return [];
    }
    
    return allComments.map(c => ({
      id: c.id,
      post_id: c.post_id,
      content: c.content,
      author_name: c.author_name,
      created_at: c.created_at
    }));
  } catch (error) {
    console.error('[Comments] Failed to get latest:', error);
    return [];
  }
}

/**
 * 渲染评论数徽章
 */
export function renderCommentBadge(postId, count) {
  if (count === 0) return '';
  
  return `
    <span class="comment-badge" style="
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85rem;
      color: #D4AF37;
      margin-left: 10px;
    " title="${count} 条评论">
      💬 ${count}
    </span>
  `;
}

/**
 * 渲染最新评论小部件
 */
export function renderLatestCommentsWidget(comments) {
  if (!comments || comments.length === 0) {
    return `
      <div class="widget widget-latest-comments">
        <div class="widget-header">
          <span class="widget-icon">💬</span>
          <h3>最新评论</h3>
        </div>
        <div class="widget-content">
          <p style="text-align: center; color: #999; padding: 20px;">暂无评论</p>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="widget widget-latest-comments">
      <div class="widget-header">
        <span class="widget-icon">💬</span>
        <h3>最新评论</h3>
      </div>
      <div class="widget-content">
        <div class="latest-comments-list">
          ${comments.map(comment => `
            <div class="latest-comment-item" data-post-id="${comment.post_id}">
              <div class="lc-avatar">${comment.author_name?.charAt(0).toUpperCase() || 'A'}</div>
              <div class="lc-content">
                <div class="lc-author">${escapeHtml(comment.author_name || '匿名')}</div>
                <div class="lc-excerpt">${escapeHtml(truncate(comment.content, 50))}</div>
                <div class="lc-meta">
                  <span class="lc-post">${escapeHtml(truncate(comment.post_title, 20))}</span>
                  <span class="lc-time">${formatTime(comment.created_at)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * 在文章卡片上添加评论数
 */
export function addCommentCountToCards() {
  document.querySelectorAll('[data-post-id]').forEach(async card => {
    const postId = card.dataset.postId;
    const count = await getCommentCount(postId);
    
    if (count > 0) {
      const footer = card.querySelector('.manuscript-footer');
      if (footer) {
        const badge = document.createElement('span');
        badge.className = 'footer-meta';
        badge.innerHTML = `
          <span class="meta-icon" aria-hidden="true">💬</span> 
          ${count}
        `;
        footer.appendChild(badge);
      }
    }
  });
}

/**
 * 初始化最新评论小部件
 */
export async function initLatestCommentsWidget() {
  const comments = await getLatestComments(5);
  const widgetHtml = renderLatestCommentsWidget(comments);
  
  // 插入到侧边栏
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = widgetHtml;
    const widget = tempDiv.firstElementChild;
    
    // 插入到热门标签之前
    const tagsWidget = sidebar.querySelector('.widget-tags');
    if (tagsWidget) {
      sidebar.insertBefore(widget, tagsWidget);
    } else {
      sidebar.appendChild(widget);
    }
    
    // 添加点击事件
    widget.querySelectorAll('.latest-comment-item').forEach(item => {
      item.addEventListener('click', () => {
        const postId = item.dataset.postId;
        if (postId) {
          window.location.href = `/post/${postId}#comments`;
        }
      });
    });
  }
}

/**
 * 转义 HTML
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 截断文本
 */
function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

/**
 * 格式化时间
 */
function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-CN');
}
