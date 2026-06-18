import { escapeHtml } from './utils.js';

import { postsService } from './posts.js';

/**
 * 按年月分组文章
 */
export async function getArchivedPosts() {
  try {
    const posts = await postsService.getAllPosts();
    
    // 按年月分组
    const groups = {};
    
    posts.forEach(post => {
      const date = new Date(post.created_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 0-indexed
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      if (!groups[key]) {
        groups[key] = {
          year,
          month,
          label: `${year}年${month}月`,
          posts: []
        };
      }
      
      groups[key].posts.push(post);
    });
    
    // 转换为数组并排序
    return Object.values(groups).sort((a, b) => {
      const keyA = `${a.year}-${String(a.month).padStart(2, '0')}`;
      const keyB = `${b.year}-${String(b.month).padStart(2, '0')}`;
      return keyB.localeCompare(keyA);
    });
  } catch (error) {
    console.error('[Archive] Failed to load:', error);
    return [];
  }
}

/**
 * 渲染归档页面
 */
export async function renderArchivePage(APP) {
  const groups = await getArchivedPosts();
  const totalPosts = groups.reduce((sum, g) => sum + g.posts.length, 0);
  
  APP.innerHTML = `
    <div class="archive-page fade-in">
      <div class="archive-header">
        <h1 class="archive-title">📚 文章归档</h1>
        <p class="archive-subtitle">共 ${totalPosts} 篇文章 · 跨越 ${groups.length} 个月</p>
      </div>
      
      <div class="archive-timeline">
        ${groups.map(group => renderArchiveGroup(group)).join('')}
      </div>
      
      ${renderArchiveStats(groups)}
    </div>
  `;
  
  // 添加交互
  initArchiveInteractions();
}

/**
 * 渲染单个月份分组
 */
function renderArchiveGroup(group) {
  return `
    <div class="archive-group" data-year="${group.year}" data-month="${group.month}">
      <div class="archive-group-header">
        <h2 class="archive-month">${group.label}</h2>
        <span class="archive-count">${group.posts.length} 篇</span>
      </div>
      <div class="archive-posts">
        ${group.posts.map((post, index) => `
          <div class="archive-post-item" style="animation-delay: ${index * 0.05}s">
            <div class="archive-post-date">
              <span class="day">${new Date(post.created_at).getDate()}</span>
              <span class="month">${new Date(post.created_at).toLocaleDateString('zh-CN', { month: 'short' })}</span>
            </div>
            <div class="archive-post-info">
              <a href="/post/${post.id}" class="archive-post-title">${escapeHtml(post.title)}</a>
              <div class="archive-post-meta">
                <span class="meta-item">👁 ${post.view_count || 0}</span>
                ${post.tags && post.tags.length > 0 ? `
                  <span class="meta-item">🏷️ ${post.tags.length}</span>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 渲染统计信息
 */
function renderArchiveStats(groups) {
  const yearlyStats = {};
  
  groups.forEach(g => {
    if (!yearlyStats[g.year]) {
      yearlyStats[g.year] = 0;
    }
    yearlyStats[g.year] += g.posts.length;
  });
  
  const years = Object.keys(yearlyStats).sort((a, b) => b.localeCompare(a));
  
  if (years.length <= 1) return '';
  
  return `
    <div class="archive-stats">
      <h3>📊 年度统计</h3>
      <div class="year-stats">
        ${years.map(year => `
          <div class="year-stat-item">
            <span class="year-label">${year}年</span>
            <div class="year-bar-container">
              <div class="year-bar" style="width: ${(yearlyStats[year] / Math.max(...Object.values(yearlyStats)) * 100)}%"></div>
            </div>
            <span class="year-count">${yearlyStats[year]} 篇</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 初始化归档页面交互
 */
function initArchiveInteractions() {
  // 分组展开/收起
  document.querySelectorAll('.archive-group-header').forEach(header => {
    header.addEventListener('click', () => {
      const group = header.parentElement;
      group.classList.toggle('collapsed');
    });
  });
  
  // 年份筛选
  const years = [...new Set(
    Array.from(document.querySelectorAll('[data-year]'))
      .map(el => el.dataset.year)
  )];
  
  if (years.length > 1) {
    // 可以添加年份筛选器
    console.log('[Archive] Available years:', years);
  }
}

/**
 * 渲染归档页面链接（添加到导航或首页）
 */
export function renderArchiveLink() {
  return `
    <a href="/archive" class="archive-nav-link" data-link="/archive" style="
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #D4AF37;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      background: rgba(212, 175, 55, 0.1);
      transition: all 0.3s;
    " onmouseenter="this.style.background='rgba(212, 175, 55, 0.2)'" onmouseleave="this.style.background='rgba(212, 175, 55, 0.1)'">
      📚 归档
    </a>
  `;
}


