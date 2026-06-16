// src/lib/views.js - 重构后的主入口
import { supabase } from './supabase.js';
import { postsService } from './posts.js';
import { commentsService } from './comments.js';
import { generateTOC, injectHeadingIds, renderTOC } from './toc.js';
import * as UI from './ui.js';
import { highlightText, truncate, readingTime, debounce, escapeHtml } from './utils.js';
import { updatePageMeta, addStructuredData, addWebSiteStructuredData } from './seo.js';
import { saveSearchHistory, showSearchHistory, hideSearchHistory } from './search-history.js';
import { makeCardsFocusable, initKeyboardNavigation } from './keyboard-nav.js';
import { initReadingTracker } from './reading-progress.js';
import { optimizeExistingImages, createResponsiveImage, supportsWebP } from './image-optimizer.js';
import { withErrorHandling, initGlobalErrorHandler } from './error-boundary.js';
import { initAnalytics, trackPageView, trackEvent, getPostViewCount } from './analytics.js';
import { initVirtualScroll, refreshVirtualScroll } from './virtual-scroll.js';

function renderFooter() {
  return `<footer class="site-footer"><span class="footer-logo">Minimalist</span><div class="footer-copy">© ${new Date().getFullYear()} Scriptorium.</div></footer>`;
}

function renderIcon(iconStr, className = '') {
  if (!iconStr) return '';
  if (iconStr.startsWith('http')) {
    return `<span class="${className}"><img src="${iconStr}" alt="icon"></span>`;
  }
  return `<span class="${className}">${iconStr}</span>`;
}

// --- Home ---
export async function renderHome(APP, state, router) {
  // 初始化全局错误处理
  initGlobalErrorHandler();
  
  try {
    state.posts = await withErrorHandling(
      postsService.getAllPosts(),
      'load_posts',
      []
    );
    state.categories = await withErrorHandling(
      postsService.getAllCategories(),
      'load_categories',
      []
    );
    state.selectedCategory = null;
    state.currentPage = 1;
    state.postsPerPage = 6;
    state.featuredPost = state.posts[0];
    state.isLoading = false;
    state.hasMore = true;
  } catch (err) {
    APP.innerHTML = `<div class="error">Failed to load posts: ${err.message}</div>`;
    return;
  }
  
  const renderList = (append = false) => {
    // 暴露给无限滚动使用
    window.__renderList = renderList;
    let filtered = state.posts;
    
    if (state.selectedCategory) {
      filtered = filtered.filter(p => p.category === state.selectedCategory);
    }
    
    if (state.searchQuery) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(state.searchQuery) || 
        p.content?.toLowerCase().includes(state.searchQuery)
      );
    }
    
    const totalPosts = filtered.length;
    
    // 虚拟滚动：超过 50 篇文章时启用
    const useVirtualScroll = totalPosts > 50;
    
    if (useVirtualScroll && !append) {
      // 虚拟滚动模式：只渲染可见区域
      setTimeout(() => {
        const container = document.querySelector('.manuscripts');
        if (container) {
          initVirtualScroll(
            '.manuscripts',
            filtered,
            (post, index) => renderManuscriptCard(post, state.searchQuery, index)
          );
        }
      }, 100);
      return;
    }
    
    // 无限滚动：计算当前应显示的数量
    const maxVisible = state.currentPage * state.postsPerPage;
    const visiblePosts = filtered.slice(0, maxVisible);
    state.hasMore = maxVisible < totalPosts;
    
  const popularPosts = state.posts.slice(0, 5).sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  const allTags = [...new Set(state.posts.flatMap(p => p.tags || []))].slice(0, 15);

  // 更新文章阅读量（使用真实数据）
  const updatedPosts = visiblePosts.map(p => ({
    ...p,
    view_count: getPostViewCount(p.id) || p.view_count || 0
  }));

    const mainContent = `
      ${renderHeroSection()}
      <div class="divider">⚜</div>
      <div class="search-scroll">
        <input type="search" id="search" placeholder="Seek words..." value="${state.searchQuery || ''}" aria-label="搜索文章" autocomplete="off">
      </div>
      ${renderCategoryFilter(state.categories, state.selectedCategory)}
      
      <div class="home-layout">
        <main class="main-content">
          ${!state.searchQuery && state.currentPage === 1 && state.featuredPost ? renderFeaturedSection(state.featuredPost) : ''}
          
          <div class="section-title">
            <h2>${state.selectedCategory ? `${state.selectedCategory} 文章` : '全部文章'}</h2>
            <span class="post-count">${totalPosts} 篇</span>
          </div>
          
          <div class="manuscripts ${!state.searchQuery && state.currentPage === 1 && state.featuredPost ? 'with-featured' : ''}">
            ${updatedPosts.length 
              ? updatedPosts.map((p, i) => renderManuscriptCard(p, state.searchQuery, i)).join('')
              : renderEmptyState()
            }
          </div>
          
          ${state.isLoading ? renderLoadingSpinner() : ''}
          ${!state.hasMore && visiblePosts.length > 0 ? renderEndMessage() : ''}
          ${state.hasMore && visiblePosts.length > 0 ? renderInfiniteScrollTrigger() : ''}
        </main>
        
        <aside class="sidebar">
          ${renderSearchWidget(state.searchQuery)}
          ${renderProfileWidget(state)}
          ${renderPopularPostsWidget(popularPosts)}
          ${renderTagsWidget(allTags)}
          ${renderTocWidget()}
        </aside>
      </div>
      
      ${renderFooter()}
    `;
    
    if (append) {
      const mainContentEl = APP.querySelector('.main-content');
      if (mainContentEl) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = mainContent;
        const newManuscriptsEl = tempDiv.querySelector('.manuscripts');
        if (!newManuscriptsEl) return;
        const manuscriptsEl = APP.querySelector('.manuscripts');
        if (!manuscriptsEl) return;
        manuscriptsEl.innerHTML = newManuscriptsEl.innerHTML;
        
        const loadingEl = APP.querySelector('.loading-spinner');
        if (loadingEl) loadingEl.remove();
        
        const endEl = APP.querySelector('.end-message');
        if (endEl) endEl.remove();
        
        const triggerEl = APP.querySelector('.scroll-trigger');
        if (triggerEl) triggerEl.remove();
        
        if (state.isLoading) {
          manuscriptsEl.insertAdjacentHTML('afterend', renderLoadingSpinner());
        } else if (!state.hasMore) {
          manuscriptsEl.insertAdjacentHTML('afterend', renderEndMessage());
        } else {
          manuscriptsEl.insertAdjacentHTML('afterend', renderInfiniteScrollTrigger());
          setTimeout(() => initInfiniteScroll(state), 100);
        }
      }
    } else {
      APP.innerHTML = mainContent + renderScrollTopButton();
      setTimeout(() => initInfiniteScroll(state), 100);
      setTimeout(initScrollTopButton, 100);
      setTimeout(() => {
        makeCardsFocusable();
        initKeyboardNavigation();
        bindCardClickEvents(router);
      }, 200);
    }
    
    const renderListWithHistory = initSearchHistoryEnhancements(state, renderList);
    initSearchWithDebounce(state, renderListWithHistory);
    initCategoryFilter(state, renderListWithHistory);
    initWidgetInteractions(router);
  };
  
  renderList();
}

/**
 * 渲染 Hero 区域
 */
function renderHeroSection() {
  return `
    <div class="hero fade-in">
      <div class="hero-bg-decoration">
        <div class="hero-gradient-orb orb-1"></div>
        <div class="hero-gradient-orb orb-2"></div>
        <div class="hero-gradient-orb orb-3"></div>
      </div>
      <div class="hero-content" role="banner">
        <div class="hero-badge fade-in-up">古风极简博客</div>
        <h1 class="hero-title fade-in-up" style="animation-delay: 0.1s">Minimalist</h1>
        <p class="hero-subtitle fade-in-up" style="animation-delay: 0.2s">Ancient Wisdom, Modern Stories</p>
        <p class="hero-description fade-in-up" style="animation-delay: 0.3s">一个受古代卷轴和手写稿启发的极简博客<br>在喧嚣的数字世界中，为您呈现一片宁静的阅读天地</p>
        <div class="hero-cta fade-in-up" style="animation-delay: 0.4s">
          <button class="btn-hero-primary" onclick="document.querySelector('.manuscripts')?.scrollIntoView({behavior:'smooth'})">
            开始阅读
            <span class="btn-hero-arrow">↓</span>
          </button>
          <button class="btn-hero-secondary" data-link="/archive">
            浏览归档
          </button>
        </div>
      </div>
      <div class="hero-decoration" aria-hidden="true">
        <div class="scroll-ornament"></div>
        <div class="ink-splash"></div>
        <div class="floating-particles">
          <span class="particle">✦</span>
          <span class="particle">✧</span>
          <span class="particle">✦</span>
          <span class="particle">✧</span>
          <span class="particle">✦</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染焦点文章区（首屏特色）
 */
function renderFeaturedSection(post) {
  const imageHTML = post.image ? `
    <div class="featured-image" style="background-image: url('${post.image}')">
      <div class="featured-overlay">
        <span class="featured-badge">📌 焦点文章</span>
      </div>
    </div>
  ` : '';
  
  return `
    <div class="featured-section fade-in">
      <div class="featured-content">
        ${imageHTML}
        <div class="featured-info">
          <div class="featured-header">
            <span class="featured-label">Featured Article</span>
            ${post.icon ? renderIcon(post.icon, 'featured-icon') : ''}
          </div>
          <h2 class="featured-title">${escapeHtml(post.title)}</h2>
          <p class="featured-excerpt">${truncate(post.content, 120)}</p>
          <div class="featured-meta">
            <span class="meta-item"><span class="meta-icon">📅</span> ${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
            <span class="meta-item"><span class="meta-icon">👁</span> ${post.view_count || 0}</span>
            <span class="meta-item"><span class="meta-icon">⏱</span> ${readingTime(post.content)} 分钟阅读</span>
          </div>
          <button class="btn-featured" data-post-id="${post.id}">
            阅读全文 <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染空状态
 */
function renderEmptyState() {
  return `
    <div class="empty-state fade-in">
      <div class="empty-icon">📭</div>
      <h3>没有找到相关文章</h3>
      <p>换个关键词试试看，或者浏览其他分类</p>
      <button class="btn-clear-search" onclick="document.getElementById('search').value=''; window.dispatchEvent(new Event('input'))">
        清除搜索
      </button>
    </div>
  `;
}

/**
 * 渲染搜索小部件
 */
function renderSearchWidget(searchQuery) {
  return `
    <div class="widget widget-search">
      <div class="widget-header">
        <span class="widget-icon">🔍</span>
        <h3>搜索</h3>
      </div>
      <div class="widget-content">
        <div class="search-box">
          <input type="text" id="sidebar-search" placeholder="输入关键词..." value="${searchQuery || ''}" autocomplete="off">
          <button class="search-btn">🔍</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染个人简介小部件
 */
function renderProfileWidget(state) {
  return `
    <div class="widget widget-profile">
      <div class="profile-bg"></div>
      <div class="profile-avatar">
        <span class="avatar-emoji">📖</span>
      </div>
      <div class="profile-info">
        <h3>Minimalist</h3>
        <p class="profile-bio">在数字世界中书写古风韵味，<br>分享智慧与思考。</p>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">${state?.posts?.length || 0}</span>
            <span class="stat-label">文章</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${state?.categories?.length || 0}</span>
            <span class="stat-label">分类</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${new Date().getFullYear()}</span>
            <span class="stat-label">创立于</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染热门文章小部件
 */
function renderPopularPostsWidget(popularPosts) {
  return `
    <div class="widget widget-popular">
      <div class="widget-header">
        <span class="widget-icon">🔥</span>
        <h3>热门文章</h3>
      </div>
      <div class="widget-content">
        <div class="popular-list">
          ${popularPosts.map((post, i) => `
            <div class="popular-item" data-post-id="${post.id}">
              <span class="popular-rank ${i < 3 ? 'top-3' : ''}">${i + 1}</span>
              <div class="popular-info">
                <h4>${escapeHtml(post.title)}</h4>
                <span class="popular-views">👁 ${post.view_count || 0}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染标签云小部件
 */
function renderTagsWidget(tags) {
  if (!tags.length) return '';
  return `
    <div class="widget widget-tags">
      <div class="widget-header">
        <span class="widget-icon">🏷️</span>
        <h3>标签云</h3>
      </div>
      <div class="widget-content">
        <div class="tags-cloud">
          ${tags.map(tag => `
            <span class="tag-item" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染目录导航小部件
 */
function renderTocWidget() {
  return `
    <div class="widget widget-toc">
      <div class="widget-header">
        <span class="widget-icon">📑</span>
        <h3>快速导航</h3>
      </div>
      <div class="widget-content">
        <nav class="quick-nav">
          <a href="#top" class="nav-item" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;">⬆ 回到顶部</a>
          <a href="/" class="nav-item">🏠 首页</a>
          <a href="/login" class="nav-item">🔐 登录</a>
        </nav>
      </div>
    </div>
  `;
}

/**
 * 渲染分类筛选器
 */
function renderCategoryFilter(categories, selected) {
  if (!categories || !categories.length) return '';
  
  // 过滤掉 null/undefined/空字符串
  const validCategories = categories.filter(cat => cat && cat.trim());
  
  if (!validCategories.length) return '';
  
  return `
    <div class="category-filter">
      <button class="category-btn ${!selected ? 'active' : ''}" data-category="">
        全部
      </button>
      ${validCategories.map(cat => `
        <button class="category-btn ${selected === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * 初始化小部件交互
 */
function initWidgetInteractions(router) {
  // 侧边栏搜索
  const sidebarSearch = document.getElementById('sidebar-search');
  const mainSearch = document.getElementById('search');
  
  if (sidebarSearch && mainSearch) {
    sidebarSearch.addEventListener('input', (e) => {
      mainSearch.value = e.target.value;
      mainSearch.dispatchEvent(new Event('input'));
    });
  }
  
  if (mainSearch && sidebarSearch) {
    mainSearch.addEventListener('input', (e) => {
      sidebarSearch.value = e.target.value;
    });
  }
  
  // 热门文章点击
  document.querySelectorAll('.popular-item').forEach(item => {
    item.addEventListener('click', () => {
      const postId = item.dataset.postId;
      if (postId) {
        window.location.href = `/post/${postId}`;
      }
    });
  });
  
  // 标签点击
  document.querySelectorAll('.tag-item').forEach(tag => {
    tag.addEventListener('click', () => {
      window.location.href = `/?tag=${encodeURIComponent(tag.dataset.tag)}`;
    });
  });
  
  // 焦点文章按钮
  const featuredBtn = document.querySelector('.btn-featured');
  if (featuredBtn) {
    featuredBtn.addEventListener('click', () => {
      const postId = featuredBtn.dataset.postId;
      if (postId) {
        window.location.href = `/post/${postId}`;
      }
    });
  }
  
  // 绑定卡片点击事件
  bindCardClickEvents(router);
}

/**
 * 绑定文章卡片点击事件
 */
function bindCardClickEvents(routerInstance) {
  document.querySelectorAll('.manuscript[data-post-id]').forEach(card => {
    // 移除旧的事件监听器（如果有）
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    
    // 添加点击事件
    newCard.addEventListener('click', (e) => {
      // 避免与内部按钮冲突
      if (e.target.closest('button, a, input')) return;
      
      const postId = newCard.dataset.postId;
      if (postId && routerInstance) {
        routerInstance.navigate(`/post/${postId}`);
      }
    });
    
    // 确保有 tabindex
    newCard.setAttribute('tabindex', '0');
  });
}

/**
 * 渲染加载动画
 */
function renderLoadingSpinner() {
  return `
    <div class="loading-spinner">
      <div class="spinner-scroll">
        <div class="spinner-body"></div>
      </div>
      <p>正在加载卷轴...</p>
    </div>
  `;
}

/**
 * 渲染结束提示
 */
function renderEndMessage() {
  return `
    <div class="end-message">
      <span class="end-icon">✦</span>
      <p>已加载全部文章</p>
    </div>
  `;
}

/**
 * 渲染无限滚动触发器
 */
function renderInfiniteScrollTrigger() {
  return `<div class="scroll-trigger" style="height: 100px;"></div>`;
}

/**
 * 初始化无限滚动
 */
let scrollObserver = null;
function initInfiniteScroll(state) {
  const trigger = document.querySelector('.scroll-trigger');
  if (!trigger || !state.hasMore || state.isLoading) return;
  
  if (scrollObserver) {
    scrollObserver.disconnect();
  }
  
  const callback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !state.isLoading && state.hasMore) {
        state.isLoading = true;
        state.currentPage++;
        
        setTimeout(() => {
          const renderList = window.__renderList;
          if (renderList) {
            renderList(true);
            state.isLoading = false;
          }
        }, 500);
      }
    });
  };
  
  scrollObserver = new IntersectionObserver(callback, {
    root: null,
    rootMargin: '200px',
    threshold: 0
  });
  
  scrollObserver.observe(trigger);
}

/**
 * 渲染回到顶部按钮
 */
function renderScrollTopButton() {
  return `
    <button id="scroll-top-btn" class="scroll-top-btn" aria-label="回到顶部">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  `;
}

/**
 * 初始化回到顶部按钮
 */
function initScrollTopButton() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;
  
  const toggleVisibility = () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  window.addEventListener('scroll', toggleVisibility, { passive: true });
  btn.addEventListener('click', scrollToTop);
  
  // 初始检查
  toggleVisibility();
}

/**
 * 初始化带搜索历史的搜索
 */
function initSearchHistoryEnhancements(state, renderList) {
  const searchInput = document.getElementById('search');
  if (!searchInput) return renderList;

  // 聚焦时显示搜索历史
  searchInput.addEventListener('focus', () => {
    showSearchHistory(searchInput);
  });

  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target)) {
      hideSearchHistory();
    }
  });

  // 返回包装后的 renderList，自动保存搜索历史
  return (append = false) => {
    if (state.searchQuery && state.searchQuery.trim().length > 0) {
      saveSearchHistory(state.searchQuery);
    }
    renderList(append);
  };
}

/**
 * 初始化带防抖的搜索
 */
function initSearchWithDebounce(state, renderList) {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', debounce((e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderList();
  }, 300));
}

// 导出给 keyboard-nav 使用
export { initSearchWithDebounce, initCategoryFilter };

/**
 * 初始化分类筛选
 */
function initCategoryFilter(state, renderList) {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedCategory = btn.dataset.category || null;
      state.currentPage = 1;
      renderList();
    });
  });
}

/**
 * 渲染分页器
 * @param {number} currentPage - 当前页
 * @param {number} totalPages - 总页数
 * @param {number} totalPosts - 总文章数
 */
function renderPagination(currentPage, totalPages, totalPosts = 0) {
  if (totalPages <= 1) return '';
  
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  // 上一页
  if (currentPage > 1) {
    pages.push(`<button class="page-btn" data-page="${currentPage - 1}" aria-label="Previous page" style="padding: 8px 16px; border: 1px solid #D4AF37; border-radius: 4px; background: transparent; color: #D4AF37; cursor: pointer;">&lt;</button>`);
  }
  
  // 第一页
  if (startPage > 1) {
    pages.push(`<button class="page-btn" data-page="1" style="padding: 8px 16px; border: 1px solid #D4AF37; border-radius: 4px; background: transparent; color: #D4AF37; cursor: pointer;">1</button>`);
    if (startPage > 2) {
      pages.push(`<span style="padding: 0 10px; color: #999;">...</span>`);
    }
  }
  
  // 中间页码
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    pages.push(
      `<button class="page-btn ${isActive ? 'active' : ''}" 
                data-page="${i}" 
                style="padding: 8px 16px; border: 1px solid #D4AF37; border-radius: 4px; background: ${isActive ? '#D4AF37' : 'transparent'}; color: ${isActive ? '#fff' : '#D4AF37'}; cursor: pointer; margin: 0 5px;">
        ${i}
      </button>`
    );
  }
  
  // 最后一页
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(`<span style="padding: 0 10px; color: #999;">...</span>`);
    }
    pages.push(`<button class="page-btn" data-page="${totalPages}" style="padding: 8px 16px; border: 1px solid #D4AF37; border-radius: 4px; background: transparent; color: #D4AF37; cursor: pointer;">${totalPages}</button>`);
  }
  
  // 下一页
  if (currentPage < totalPages) {
    pages.push(`<button class="page-btn" data-page="${currentPage + 1}" aria-label="Next page" style="padding: 8px 16px; border: 1px solid #D4AF37; border-radius: 4px; background: transparent; color: #D4AF37; cursor: pointer;">&gt;</button>`);
  }
  
  return `
    <div class="pagination" style="display: flex; justify-content: center; align-items: center; gap: 5px; padding: 40px 0; margin-top: 20px;">
      ${pages.join('')}
    </div>
    <div style="text-align: center; padding: 10px 0; color: #999; font-size: 0.9rem;">
      第 ${currentPage} 页，共 ${totalPages} 页，${totalPosts || 0} 篇文章
    </div>
  `;
}

/**
 * 初始化分页器
 */
function initPagination(state, renderList) {
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentPage = parseInt(btn.dataset.page);
      renderList();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderManuscriptCard(post, searchQuery = '', index = 0) {
  const pinStyle = post.is_pinned ? 'border-color:#D4AF37;background:linear-gradient(135deg,#fffdf5 0%,#f4ebe1 100%);' : '';
  const pinBadge = post.is_pinned ? '<span class="pinned-badge">📌 Top</span>' : '';
  const icon = post.icon ? renderIcon(post.icon, 'list-icon') : '';
  
  const imageHTML = post.image ? renderPostImageForList(post) : '';
  
  const highlightedTitle = highlightText(post.title, searchQuery);
  const excerpt = truncate(post.content, 150);
  const highlightedExcerpt = highlightText(excerpt, searchQuery);
  
  return `
    <article class="manuscript fade-in" 
          role="article"
          data-post-id="${post.id}" 
          style="${pinStyle} animation-delay: ${index * 0.08}s"
          aria-labelledby="post-title-${post.id}"> 
      <div class="manuscript-inner">
        <div class="manuscript-content">
          ${imageHTML}
          <div class="manuscript-body">
            <div class="manuscript-header">
              ${icon}
              ${pinBadge}
            </div>
            <h2 class="manuscript-title" id="post-title-${post.id}">${highlightedTitle}</h2>
            <p class="manuscript-excerpt">${highlightedExcerpt}</p>
            <div class="manuscript-date">${new Date(post.created_at).toLocaleDateString('zh-CN')}</div>
          </div>
        </div>
        <div class="manuscript-footer">
          <div class="footer-left">
            <span class="footer-meta hover-scale"><span class="meta-icon">👁</span> <span class="meta-value">${post.view_count || 0}</span></span>
            <span class="footer-meta hover-scale"><span class="meta-icon">⏱</span> <span class="meta-value">${readingTime(post.content)} min</span></span>
          </div>
          ${post.category ? `<span class="footer-category">${escapeHtml(post.category)}</span>` : ''}
        </div>
      </div>
    </article>
  `;
}

function renderPostImageForList(post) {
  if (!post.image) return '';
  
  if (post.crop_data) {
    const { x, y, width, height } = post.crop_data;
    return `
      <div class="post-image" style="position:relative; width:100%; height:200px; overflow:hidden; border-radius:8px; margin-bottom:20px;">
        <picture>
          <source srcset="${post.image}?format=webp&quality=80" type="image/webp">
          <img src="${post.image}" 
               style="position:absolute; width:100%; height:100%; object-fit:cover;"
               loading="lazy"
               alt="${post.title}">
        </picture>
      </div>
    `;
  }
  
  return `
    <div class="post-image" style="width:100%; height:200px; overflow:hidden; border-radius:8px; margin-bottom:20px;">
      <picture>
        <source srcset="${post.image}?format=webp&quality=80" type="image/webp">
        <img src="${post.image}" 
             style="width:100%; height:100%; object-fit:cover;"
             loading="lazy"
             alt="${post.title}">
      </picture>
    </div>
  `;
}

function renderSinglePostImage(post) {
  if (!post.image) return '';
  
  if (post.crop_data) {
    const { x, y, width, height } = post.crop_data;
    return `
      <div class="single-image-container" style="position:relative; width:100%; height:400px; overflow:hidden; border-radius:8px; margin-bottom:30px; border: 4px solid #D4AF37;">
        <picture>
          <source srcset="${post.image}?format=webp&quality=85" type="image/webp">
          <img src="${post.image}" 
               style="position:absolute; max-width:none;"
               onload="
                 const cW=this.parentElement.offsetWidth;
                 const cH=this.parentElement.offsetHeight;
                 const scale=Math.max(cW/${width},cH/${height});
                 this.width=this.naturalWidth*scale;
                 this.height=this.naturalHeight*scale;
                 this.style.left=$((-${x}*scale)+(cW-${width}*scale)/2)+'px';
                 this.style.top=$((-${y}*scale)+(cH-${height}*scale)/2)+'px';
               "
               loading="lazy"
               alt="${post.title}">
        </picture>
      </div>
    `;
  }
  
  return `
    <div class="single-image-container" style="width:100%; margin-bottom:30px;">
      <picture>
        <source srcset="${post.image}?format=webp&quality=85" type="image/webp">
        <img src="${post.image}" 
             class="single-image" 
             style="width:100%; height:auto; object-fit:${post.image_fit || 'cover'}; border-radius:8px;"
             loading="lazy"
             alt="${post.title}">
      </picture>
    </div>
  `;
}

function initTOC(content) {
  const tocHeadings = generateTOC(content);
  if (tocHeadings.length === 0) return;
  
  const tocContainer = document.getElementById('toc');
  if (!tocContainer) return;
  tocContainer.innerHTML = renderTOC(tocHeadings);
  
  tocContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
  
  const onScroll = () => {
    let current = '';
    document.querySelectorAll('.article-content h1[id], .article-content h2[id], .article-content h3[id]').forEach(heading => {
      if (heading.getBoundingClientRect().top < 150) {
        current = heading.getAttribute('id');
      }
    });
    
    tocContainer.querySelectorAll('a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

export async function renderPost(APP, id, router, updateMetaCallback) {
  try {
    const post = await postsService.getPostById(id);
    if (!post) { 
      APP.innerHTML = '<div class="error">Lost scroll...</div>'; 
      return; 
    }

    const realViewCount = await getPostViewCount(id);
    post.view_count = realViewCount || post.view_count || 0;

    await updatePostView(id, post);
    
    if (updateMetaCallback) updateMetaCallback(post);
    updatePostMetaTags(post);
    
    trackPageView(id, post.title);
    
    if (typeof DOMPurify === 'undefined' || typeof marked === 'undefined') {
      APP.innerHTML = '<div class="error">页面依赖加载失败，请刷新页面重试</div>';
      return;
    }
    
    const content = DOMPurify.sanitize(marked.parse(post.content || '', { breaks: true, gfm: true }));
    const comments = await commentsService.getCommentsByPostId(id);
    const likes = post.likes || 0;
    const isLiked = localStorage.getItem(`liked_${id}`);

    APP.innerHTML = `
      <div id="reading-progress"></div>
      <div id="toc"></div>

      <div class="floating-bar">
        <div class="action-btn ${isLiked ? 'liked' : ''}" id="btn-like">
          ♥ <span class="btn-badge" id="l-cnt">${likes}</span>
        </div>
        <div class="action-btn" id="btn-print" title="打印文章">🖨️</div>
        <div class="action-btn" id="btn-share">🔗</div>
        <div class="action-btn" id="btn-top">⬆</div>
      </div>

      <div class="single-manuscript fade-in">
        <div class="manuscript-header">
          ${post.icon ? renderIcon(post.icon, 'single-icon') : ''}
          <h1 class="single-title">${post.title}</h1>
          <div class="single-meta">
            Scribed on ${new Date(post.created_at).toLocaleDateString('zh-CN')} • 👁 ${post.view_count || 0} • ⏱ ${readingTime(post.content)} min read
          </div>
        </div>
        
        ${renderSinglePostImage(post)}
        <article class="article-content">${injectHeadingIds(content)}</article>
        
        <div class="post-navigation">
          <div id="prev-post" class="nav-item nav-prev"></div>
          <div id="next-post" class="nav-item nav-next"></div>
        </div>
        
        <div id="related-posts" style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
          <h3 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">相关文章</h3>
          <div id="related-posts-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
            <div style="opacity: 0.5;">加载中...</div>
          </div>
        </div>
      </div>

      <div id="comments-section">
        <div class="divider">✦ Comments (${comments.length}) ✦</div>
        <div id="comments-list">
          ${commentsService.renderComments(comments)}
        </div>
        <div class="form-container" style="margin-top:20px;">
          <form id="comment-form">
            <input type="hidden" id="parent-id" value="">
            <input id="cn" placeholder="Name" required>
            <input id="ce" placeholder="Email" required>
            <textarea id="cc" placeholder="Comment..." required></textarea>
            <button type="submit" class="btn-primary">Post</button>
          </form>
          <div id="reply-preview" style="display: none; margin-top: 10px; padding: 10px; background: #fffdf5; border-left: 3px solid #D4AF37;">
            <span style="font-size: 0.85rem; color: #666;">正在回复:</span>
            <span id="reply-to-name" style="font-weight: bold; margin-left: 5px;"></span>
            <button id="cancel-reply" style="float: right; background: none; border: none; color: #999; cursor: pointer;">×</button>
          </div>
        </div>
      </div>
      ${renderFooter()}
    `;

    UI.initLightbox();
    UI.initReadingProgress();
    UI.initLazyLoad();
    
    initReadingTracker(id);

    updatePageMeta(post);
    addStructuredData(post);

    if (generateTOC(post.content).length > 0) { 
      initTOC(post.content);
    }

    initPostActions(id, likes);
    initCommentForm(id, router);
    initReplyButtons(id, router);
    loadRelatedPosts(id, post.tags);
    initCardHoverPreload();
    loadPostNavigation(id);
  } catch (err) {
    APP.innerHTML = `<div class="error">Failed to load post: ${err.message}</div>`;
    console.error(err);
  }
}

async function updatePostView(postId, post) {
  if (!sessionStorage.getItem(`view_${postId}`)) {
    try {
      await postsService.updatePost(postId, { view_count: (post.view_count || 0) + 1 });
      sessionStorage.setItem(`view_${postId}`, '1');
    } catch (err) {
      console.error('Failed to update view count:', err);
    }
  }
}

async function loadPostNavigation(currentPostId) {
  try {
    const allPosts = await postsService.getAllPosts();
    const sortedPosts = allPosts.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    const currentIndex = sortedPosts.findIndex(p => p.id === currentPostId);
    
    if (currentIndex === -1) return;
    
    const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
    
    const prevEl = document.getElementById('prev-post');
    const nextEl = document.getElementById('next-post');
    
    if (prevEl) {
      prevEl.innerHTML = prevPost 
        ? `<span class="nav-label">← 上一篇</span><h4 class="nav-title">${escapeHtml(prevPost.title)}</h4>`
        : `<span class="nav-label">← 上一篇</span><div class="nav-empty">没有更早的文章</div>`;
      
      if (prevPost) {
        prevEl.style.cursor = 'pointer';
        prevEl.addEventListener('click', () => router.navigate(`/post/${prevPost.id}`));
      }
    }
    
    if (nextEl) {
      nextEl.innerHTML = nextPost
        ? `<span class="nav-label">下一篇 →</span><h4 class="nav-title">${escapeHtml(nextPost.title)}</h4>`
        : `<span class="nav-label">下一篇 →</span><div class="nav-empty">没有更新的文章</div>`;
      
      if (nextPost) {
        nextEl.style.cursor = 'pointer';
        nextEl.addEventListener('click', () => router.navigate(`/post/${nextPost.id}`));
      }
    }
  } catch (err) {
    console.error('Failed to load post navigation:', err);
  }
}

function initPostActions(postId, likes) {
  const likeBtn = document.getElementById('btn-like');
  const shareBtn = document.getElementById('btn-share');
  const printBtn = document.getElementById('btn-print');
  const topBtn = document.getElementById('btn-top');
  
  likeBtn?.addEventListener('click', async (e) => {
    if (localStorage.getItem(`liked_${postId}`)) {
      UI.showToast('Already liked!', 'info');
      return;
    }
    
    e.currentTarget.classList.add('liked');
    const likeCountEl = document.getElementById('l-cnt');
    const newCount = parseInt(likeCountEl.textContent) + 1;
    likeCountEl.textContent = newCount;
    
    localStorage.setItem(`liked_${postId}`, '1');
    UI.showToast('Liked! ❤️', 'success');
    
    try {
      await postsService.updatePost(postId, { likes: newCount });
    } catch (err) {
      console.error('Failed to update likes:', err);
    }
  });
  
  shareBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    UI.showToast('Link copied!', 'success');
  });
  
  printBtn?.addEventListener('click', () => {
    window.print();
  });
  
  topBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initCommentForm(postId, router) {
  const form = document.getElementById('comment-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameEl = document.getElementById('cn');
    const emailEl = document.getElementById('ce');
    const contentEl = document.getElementById('cc');
    const parentIdEl = document.getElementById('parent-id');
    if (!nameEl || !emailEl || !contentEl || !parentIdEl) return;
    
    const name = nameEl.value;
    const email = emailEl.value;
    const content = contentEl.value;
    const parentId = parentIdEl.value;
    
    try {
      await commentsService.createComment(postId, name, email, content, parentId || null);
      router.route();
      UI.showToast('Comment posted!', 'success');
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  });
}

/**
 * 初始化回复按钮
 * @param {string} postId - 文章 ID
 * @param {Object} router - 路由对象
 */
function initReplyButtons(postId, router) {
  document.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parentId = e.target.dataset.parentId;
      const commentItem = e.target.closest('.comment-item');
      const authorName = commentItem?.querySelector('b')?.textContent || 'Anonymous';
      
      const parentIdEl = document.getElementById('parent-id');
      const replyPreviewEl = document.getElementById('reply-preview');
      const replyNameEl = document.getElementById('reply-to-name');
      const cancelReplyEl = document.getElementById('cancel-reply');
      const contentInput = document.getElementById('cc');
      
      if (!parentIdEl || !replyPreviewEl || !replyNameEl) return;
      
      parentIdEl.value = parentId;
      replyPreviewEl.style.display = 'block';
      replyNameEl.textContent = authorName;
      contentInput?.focus();
      
      cancelReplyEl?.addEventListener('click', () => {
        parentIdEl.value = '';
        replyPreviewEl.style.display = 'none';
      });
    });
  });
}

/**
 * 加载相关文章
 * @param {string} postId - 文章 ID
 * @param {Array} tags - 标签
 */
async function loadRelatedPosts(postId, tags) {
  const container = document.getElementById('related-posts-list');
  if (!container) return;
  
  try {
    const related = await postsService.getRelatedPosts(postId, tags, 3);
    
    if (!related.length) {
      container.innerHTML = '<div style="opacity: 0.5; grid-column: 1/-1;">暂无相关文章</div>';
      return;
    }
    
    container.innerHTML = related.map(post => `
      <div class="manuscript" data-post-id="${post.id}" style="padding: 20px; margin-bottom: 0; cursor: pointer;">
        ${post.image ? `<picture><source srcset="${post.image}?format=webp&quality=85" type="image/webp"><img src="${post.image}" style="width:100%; height:150px; object-fit:cover; border-radius:4px; margin-bottom:10px;" loading="lazy" alt="${escapeHtml(post.title)}"></picture>` : ''}
        <h4 style="margin: 0 0 5px 0; font-size: 1rem; color: #8B0000;">${escapeHtml(post.title)}</h4>
        <small style="opacity: 0.6;">👁 ${post.view_count || 0}</small>
      </div>
    `).join('');
    
    container.querySelectorAll('.manuscript').forEach(card => {
      card.addEventListener('click', () => {
        router.navigate(`/post/${card.dataset.postId}`);
      });
    });
  } catch (err) {
    console.error('加载相关文章失败:', err);
    container.innerHTML = '<div style="opacity: 0.5;">加载失败</div>';
  }
}

/**
 * 初始化卡片悬停预加载
 */
function initCardHoverPreload() {
  document.querySelectorAll('.manuscript').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const img = card.querySelector('img');
      if (img && img.src) {
        UI.preloadImage(img.src);
      }
    });
  });
}

// --- Login ---
export function renderLogin(APP, router) { 
  APP.innerHTML = `
    <div class="form-container fade-in">
      <h2 class="Form-title">Login</h2>
      <form id="login-form">
        <input type="email" id="le" placeholder="Email" required>
        <input type="password" id="lp" placeholder="Password" required>
        <button type="submit" class="btn-primary" id="login-btn" style="width:100%;margin-top:20px;position:relative;overflow:hidden;">
          <span class="btn-text">Sign In</span>
          <div class="login-progress" style="position:absolute;bottom:0;left:0;height:3px;background:linear-gradient(90deg,#D4AF37,#F4C430,#D4AF37);width:0%;transition:width 0.3s ease;"></div>
        </button>
      </form>
    </div>
    ${renderFooter()}
  `; 
  
  document.getElementById('login-form').addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const email = document.getElementById('le').value;
    const password = document.getElementById('lp').value;
    const loginBtn = document.getElementById('login-btn');
    const progress = loginBtn.querySelector('.login-progress');
    const btnText = loginBtn.querySelector('.btn-text');
    
    loginBtn.disabled = true;
    btnText.style.opacity = '0.7';
    progress.style.width = '30%';
    
    setTimeout(() => { progress.style.width = '60%'; }, 200);
    
    try { 
      setTimeout(() => { progress.style.width = '100%'; }, 400);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      progress.style.transition = 'width 0.3s ease, opacity 0.3s ease';
      progress.style.opacity = '0';
      
      UI.showToast('Welcome back.', 'success');
      router.navigate('/admin'); 
    } catch (err) { 
      progress.style.transition = 'width 0.3s ease, opacity 0.3s ease';
      progress.style.opacity = '0';
      progress.style.width = '0%';
      loginBtn.disabled = false;
      btnText.style.opacity = '1';
      UI.showToast('Login failed: ' + err.message, 'error'); 
    } 
  }); 
}

// --- Admin ---
export async function renderAdmin(APP, router) { 
  try {
    const posts = await postsService.getAllPosts();
    APP.innerHTML = `
      <div class="admin-header">
        <h2 class="admin-title">Scriptorium</h2>
        <button class="btn-primary" data-link="/create">✎ New Post</button>
      </div>
      <div class="admin-ledger">
        ${posts.map(p => `
          <div class="ledger-entry" style="${p.is_pinned ? 'border-left:4px solid #D4AF37;background:#fffdf5;' : ''}">
            <div class="entry-info">
              <h3>${p.is_pinned ? '📌 ' : ''}${renderIcon(p.icon, 'list-icon')} ${p.title} ${p.is_draft ? '<span style="color:#999">[Draft]</span>' : ''}</h3>
              <small>${new Date(p.created_at).toLocaleDateString()}</small>
            </div>
            <div class="entry-actions">
              <button class="btn-secondary" data-pin="${p.id}" style="${p.is_pinned ? 'color:#D4AF37;border-color:#D4AF37;' : ''}">
                ${p.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button class="btn-secondary" data-link="/edit/${p.id}">Edit</button>
              <button class="btn-danger" data-del="${p.id}">Del</button>
            </div>
          </div>
        `).join('')}
      </div>
      ${renderFooter()}
    `; 
    
    document.querySelectorAll('[data-pin]').forEach(btn => {
      btn.addEventListener('click', async (e) => { 
        const id = e.target.dataset.pin; 
        const post = posts.find(p => p.id == id);
        try { 
          await postsService.updatePost(id, { is_pinned: !post.is_pinned }); 
          router.route(); 
          UI.showToast(post.is_pinned ? 'Unpinned' : 'Pinned to top!', 'success'); 
        } catch (err) { 
          UI.showToast(err.message, 'error'); 
        } 
      });
    });
    
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', async (e) => { 
        if (confirm('Delete forever?')) { 
          try {
            await postsService.deletePost(e.target.dataset.del); 
            router.route(); 
            UI.showToast('Deleted.', 'info'); 
          } catch (err) {
            UI.showToast(err.message, 'error');
          }
        } 
      });
    });
  } catch (err) {
    APP.innerHTML = `<div class="error">Failed to load admin panel: ${err.message}</div>`;
  }
}

// --- Editor ---
export async function renderEditor(APP, id, router) {
  try {
    let post = { title: '', content: '', category: '', tags: [], image: '', image_fit: 'contain', icon: '' };
    if (id) {
      post = await postsService.getPostById(id);
      if (!post) {
        router.navigate('/admin');
        return;
      }
    }
    
    APP.innerHTML = `
      <div class="form-container">
        <div class="admin-header">
          <h2 class="admin-title">${id ? 'Edit' : 'New'} Manuscript</h2>
          <button class="btn-secondary" data-link="/admin">Cancel</button>
        </div>
        <form id="post-form">
          <div class="icon-input-wrapper">
            <div class="current-icon-preview" id="icon-preview">${renderIcon(post.icon || '📝')}</div>
            <div style="flex:1;">
              <label style="font-size:0.8rem;color:#666;">Page Icon</label>
              <input id="picon" value="${post.icon || ''}" placeholder="e.g. 🚀 or https://..." style="width:100%;">
            </div>
            <button type="button" class="btn-secondary" id="random-icon-btn">🎲</button>
          </div>
          
          <div class="form-group">
            <label>Title</label>
            <input id="pt" value="${post.title}" required>
          </div>
          
          <div class="form-group">
            <label>Cover Image URL</label>
            <input id="pi" value="${post.image || ''}">
            <button type="button" class="btn-secondary" id="crop-image-btn" style="margin-top:10px;">✂ Crop Cover</button>
          </div>
          
          <div id="crop-container" class="image-crop-container hidden">
            <div style="color:#fff;margin-bottom:10px;">Drag to crop</div>
            <div id="crop-wrapper">
              <img id="crop-image" src="" style="display:block; max-width:100%;">
              <div id="crop-box"></div>
            </div>
            <div class="crop-controls">
              <button type="button" class="btn-primary" id="apply-crop-btn">Apply Crop</button>
              <button type="button" class="btn-secondary" id="cancel-crop-btn">Cancel</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>Fit</label>
            <select id="pfit">
              <option value="contain" ${post.image_fit === 'contain' ? 'selected' : ''}>Contain</option>
              <option value="cover" ${post.image_fit === 'cover' ? 'selected' : ''}>Cover</option>
            </select>
          </div>
          
          <div class="form-group">
            <label style="display:flex;justify-content:space-between;">
              <span>Content</span>
              <span>Ctrl+I: Img | Tab: Indent</span>
            </label>
            <div class="editor-container">
              <div class="editor-pane" id="editor-pane">
                <textarea id="pc" class="editor-textarea" required placeholder="Write...">${post.content || ''}</textarea>
              </div>
              <div class="preview-pane hidden" id="preview-pane">
                <div id="preview-content" class="article-content"></div>
              </div>
            </div>
            <button type="button" id="toggle-preview-btn" class="btn-secondary" style="margin-top:5px;width:100%;">Toggle Preview</button>
          </div>
          
          <div class="form-group">
            <label>Category</label>
            <input id="pcat" value="${post.category}">
          </div>
          
          <div class="form-group">
            <label>Tags</label>
            <input id="ptags" value="${(post.tags || []).join(',')}">
          </div>
          
          <button type="submit" class="btn-primary">Save</button>
          <button type="button" id="draft-btn" class="btn-secondary">Draft</button>
        </form>
      </div>
    `;
    
    // 图标输入事件
    const iconInput = document.getElementById('picon');
    const updateIcon = () => {
      document.getElementById('icon-preview').innerHTML = renderIcon(iconInput.value || '📝');
    };
    iconInput.addEventListener('input', updateIcon);
    
    // 随机图标按钮
    document.getElementById('random-icon-btn').addEventListener('click', () => {
      const icons = ['🚀','💡','🔥','✨','📝','📚','🎨','💻','🪐','🌊'];
      iconInput.value = icons[Math.floor(Math.random() * icons.length)];
      updateIcon();
    });
    
    // 裁剪功能
    let cropData = post.crop_data || null;
    let isDrawing = false, startX, startY;
    const els = {
      btn: document.getElementById('crop-image-btn'),
      container: document.getElementById('crop-container'),
      wrapper: document.getElementById('crop-wrapper'),
      img: document.getElementById('crop-image'),
      box: document.getElementById('crop-box')
    };
    
    els.btn.addEventListener('click', () => {
      const url = document.getElementById('pi').value;
      if (!url) return UI.showToast('Input image URL first!', 'error');
      els.img.src = url;
      els.container.classList.remove('hidden');
      els.box.style.display = 'none';
    });
    
    document.getElementById('cancel-crop-btn').addEventListener('click', () => {
      els.container.classList.add('hidden');
    });
    
    els.wrapper.onmousedown = e => {
      e.preventDefault();
      isDrawing = true;
      const r = els.img.getBoundingClientRect();
      startX = e.clientX - r.left;
      startY = e.clientY - r.top;
      els.box.style.left = startX + 'px';
      els.box.style.top = startY + 'px';
      els.box.style.width = '0px';
      els.box.style.height = '0px';
      els.box.style.display = 'block';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    
    const onMove = e => {
      if (!isDrawing) return;
      const rect = els.img.getBoundingClientRect();
      let currX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      let currY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      els.box.style.width = Math.abs(currX - startX) + 'px';
      els.box.style.height = Math.abs(currY - startY) + 'px';
      els.box.style.left = Math.min(currX, startX) + 'px';
      els.box.style.top = Math.min(currY, startY) + 'px';
    };
    
    const onUp = () => {
      isDrawing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.getElementById('apply-crop-btn').addEventListener('click', () => {
      const sX = els.img.naturalWidth / els.img.width;
      const sY = els.img.naturalHeight / els.img.height;
      cropData = {
        width: Math.round(parseFloat(els.box.style.width) * sX),
        height: Math.round(parseFloat(els.box.style.height) * sY),
        x: Math.round(parseFloat(els.box.style.left) * sX),
        y: Math.round(parseFloat(els.box.style.top) * sY)
      };
      UI.showToast('Crop Applied!', 'success');
      els.container.classList.add('hidden');
    });
    
    // 编辑器快捷键
    const ta = document.getElementById('pc');
    ta.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyI') {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText(`\n![Img](https://picsum.photos/seed/${Date.now()}/800/450)\n`, s, s, 'end');
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.setRangeText('    ', s, en, 'end');
      }
    });
    
    // 预览切换
    let mode = false;
    document.getElementById('toggle-preview-btn').addEventListener('click', () => {
      mode = !mode;
      document.getElementById('editor-pane').classList.toggle('split');
      document.getElementById('preview-pane').classList.toggle('hidden');
      if (mode) {
        document.getElementById('preview-content').innerHTML = DOMPurify.sanitize(marked.parse(ta.value, { breaks: true, gfm: true }));
      }
    });
    
    // 保存功能
    const save = async (draft) => {
      const data = {
        title: document.getElementById('pt').value,
        content: ta.value,
        image: document.getElementById('pi').value,
        image_fit: document.getElementById('pfit').value,
        category: document.getElementById('pcat').value,
        tags: document.getElementById('ptags').value.split(',').filter(Boolean),
        crop_data: cropData,
        is_draft: draft,
        icon: iconInput.value
      };
      if (id) {
        await postsService.updatePost(id, data);
      } else {
        await postsService.createPost(data);
      }
      router.navigate('/admin');
      UI.showToast(draft ? 'Draft Saved' : 'Published!', 'success');
    };
    
    document.getElementById('post-form').addEventListener('submit', e => {
      e.preventDefault();
      save(false);
    });
    
    document.getElementById('draft-btn').addEventListener('click', () => {
      save(true);
    });
    
    // Cancel 按钮 — 使用全局 data-link 委托，此处无需重复绑定
  } catch (err) {
    APP.innerHTML = `<div class="error">Failed to load editor: ${err.message}</div>`;
  }
}

function updatePostMetaTags(post) {
  const url = `https://minimalist.ggff.net/post/${post.id}`;
  const imageUrl = post.image_url || 'https://minimalist.ggff.net/public/og-image.svg';
  
  document.title = `${post.title} | Minimalist`;
  
  const updateOrCreateMeta = (name, content, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attr}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };
  
  updateOrCreateMeta('description', post.excerpt || post.content?.substring(0, 160) || '');
  updateOrCreateMeta('keywords', (post.tags || []).join(', '));
  updateOrCreateMeta('og:title', `${post.title} | Minimalist`);
  updateOrCreateMeta('og:description', post.excerpt || post.content?.substring(0, 200) || '', true);
  updateOrCreateMeta('og:url', url, true);
  updateOrCreateMeta('og:image', imageUrl, true);
  updateOrCreateMeta('twitter:title', `${post.title} | Minimalist`);
  updateOrCreateMeta('twitter:description', post.excerpt || post.content?.substring(0, 200) || '');
  updateOrCreateMeta('twitter:image', imageUrl);
  
  const baseUri = 'https://minimalist.ggff.net';
  const scriptId = 'structured-data';
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 160) || '',
    image: imageUrl,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: { '@type': 'Organization', name: 'Minimalist Blog' },
    publisher: {
      '@type': 'Organization',
      name: 'Minimalist Blog',
      logo: { '@type': 'ImageObject', url: `${baseUri}/public/favicon.svg` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.tags || [],
    inLanguage: 'zh-CN'
  });
}
