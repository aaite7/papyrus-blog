// src/lib/instant-search.js

import { postsService } from './posts.js';
import { debounce } from './utils.js';

/**
 * 搜索配置
 */
const CONFIG = {
  // 最小搜索字符数
  minLength: 2,
  // 最大结果显示数
  maxResults: 8,
  // 防抖延迟（毫秒）
  debounceMs: 200
};

/**
 * 全局搜索状态
 */
let state = {
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: -1
};

/**
 * 实时搜索（带防抖）
 */
export function initInstantSearch() {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;
  
  // 创建结果容器
  const container = createSearchResultsContainer();
  searchInput.parentElement.style.position = 'relative';
  searchInput.parentElement.appendChild(container);
  
  // 输入事件
  searchInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    
    if (query.length < CONFIG.minLength) {
      hideResults();
      return;
    }
    
    await performSearch(query);
    showResults();
  }, CONFIG.debounceMs));
  
  // 键盘导航
  searchInput.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        selectCurrent();
        break;
      case 'Escape':
        hideResults();
        searchInput.blur();
        break;
    }
  });
  
  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !container.contains(e.target)) {
      hideResults();
    }
  });
  
  // 聚焦时显示（如果有结果）
  searchInput.addEventListener('focus', () => {
    if (state.results.length > 0) {
      showResults();
    }
  });
  
  console.log('[InstantSearch] Initialized');
}

/**
 * 创建搜索结果容器
 */
function createSearchResultsContainer() {
  const container = document.createElement('div');
  container.className = 'instant-search-results';
  container.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 8px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;
    display: none;
  `;
  return container;
}

/**
 * 执行搜索
 */
async function performSearch(query) {
  state.query = query;
  state.selectedIndex = -1;
  
  try {
    const allPosts = await postsService.getAllPosts();
    
    // 搜索匹配
    const results = allPosts.filter(post => 
      post.title?.toLowerCase().includes(query.toLowerCase()) ||
      post.content?.toLowerCase().includes(query.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, CONFIG.maxResults);
    
    state.results = results;
    renderResults();
  } catch (error) {
    console.error('[InstantSearch] Search failed:', error);
  }
}

/**
 * 渲染结果
 */
function renderResults() {
  const container = document.querySelector('.instant-search-results');
  if (!container) return;
  
  if (state.results.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="padding: 30px; text-align: center; color: #999;">
        <div style="font-size: 2rem; margin-bottom: 10px;">🔍</div>
        <div>未找到匹配的文章</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="search-results-header" style="
      padding: 12px 20px;
      background: rgba(212, 175, 55, 0.1);
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      font-size: 0.9rem;
      color: #666;
    ">
      找到 ${state.results.length} 篇相关文章
    </div>
    ${state.results.map((post, index) => `
      <div class="search-result-item ${index === state.selectedIndex ? 'selected' : ''}" 
           data-index="${index}"
           data-post-id="${post.id}"
           style="padding: 15px 20px; cursor: pointer; transition: background 0.2s;"
           onmouseenter="this.style.background='rgba(212, 175, 55, 0.08)'"
           onmouseleave="this.style.background='transparent'">
        <div class="result-title" style="font-family: 'Playfair Display', serif; color: #333; margin-bottom: 8px;">
          ${highlightMatch(post.title, state.query)}
        </div>
        <div class="result-meta" style="font-size: 0.85rem; color: #888;">
          <span>👁 ${post.view_count || 0}</span>
          <span style="margin-left: 15px;">📅 ${new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    `).join('')}
  `;
  
  // 添加点击事件
  container.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const postId = item.dataset.postId;
      if (postId) {
        window.location.href = `/post/${postId}`;
      }
    });
  });
}

/**
 * 高亮匹配文本
 */
function highlightMatch(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark style="background: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>');
}

/**
 * 转义正则特殊字符
 */
function escapeRegex(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * 显示结果
 */
function showResults() {
  const container = document.querySelector('.instant-search-results');
  if (container) {
    container.style.display = 'block';
    state.isOpen = true;
  }
}

/**
 * 隐藏结果
 */
function hideResults() {
  const container = document.querySelector('.instant-search-results');
  if (container) {
    container.style.display = 'none';
    state.isOpen = false;
    state.selectedIndex = -1;
  }
}

/**
 * 选择下一项
 */
function selectNext() {
  if (state.selectedIndex < state.results.length - 1) {
    state.selectedIndex++;
    updateSelection();
  }
}

/**
 * 选择上一项
 */
function selectPrevious() {
  if (state.selectedIndex > 0) {
    state.selectedIndex--;
    updateSelection();
  }
}

/**
 * 选择当前项
 */
function selectCurrent() {
  if (state.selectedIndex >= 0 && state.selectedIndex < state.results.length) {
    const post = state.results[state.selectedIndex];
    window.location.href = `/post/${post.id}`;
  }
}

/**
 * 更新选中状态
 */
function updateSelection() {
  const container = document.querySelector('.instant-search-results');
  if (!container) return;
  
  container.querySelectorAll('.search-result-item').forEach((item, index) => {
    if (index === state.selectedIndex) {
      item.style.background = 'rgba(212, 175, 55, 0.15)';
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.style.background = 'transparent';
    }
  });
}
