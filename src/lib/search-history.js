// src/lib/search-history.js

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 10;

/**
 * 获取搜索历史
 */
export function getSearchHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 保存搜索历史
 */
export function saveSearchHistory(query) {
  if (!query || query.trim().length === 0) return;
  
  const history = getSearchHistory();
  const trimmedQuery = query.trim();
  
  // 移除重复项
  const filtered = history.filter(item => item !== trimmedQuery);
  
  // 添加到开头
  filtered.unshift(trimmedQuery);
  
  // 限制数量
  if (filtered.length > MAX_HISTORY) {
    filtered.length = MAX_HISTORY;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * 清除搜索历史
 */
export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * 渲染搜索历史建议
 */
export function renderSearchHistory(onSelect) {
  const history = getSearchHistory();
  if (history.length === 0) return '';
  
  return `
    <div class="search-history-dropdown">
      <div class="search-history-header">
        <span>最近搜索</span>
        <button class="clear-history-btn" aria-label="清除搜索历史">✕</button>
      </div>
      <ul class="search-history-list">
        ${history.map(query => `
          <li class="search-history-item" data-query="${escapeHtml(query)}">
            <span class="history-icon">🕐</span>
            <span class="history-text">${escapeHtml(query)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * 初始化搜索历史交互
 */
export function initSearchHistory(searchInput) {
  const history = getSearchHistory();
  if (history.length === 0) return;
  
  // 显示历史记录（在聚焦时）
  searchInput.addEventListener('focus', () => {
    showSearchHistory(searchInput);
  });
  
  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target)) {
      hideSearchHistory();
    }
  });
}

/**
 * 显示搜索历史下拉框
 */
export function showSearchHistory(searchInput) {
  hideSearchHistory();
  
  const dropdown = document.createElement('div');
  dropdown.className = 'search-history-dropdown';
  dropdown.innerHTML = `
    <div class="search-history-header">
      <span>最近搜索</span>
      <button class="clear-history-btn" aria-label="清除搜索历史">✕</button>
    </div>
    <ul class="search-history-list">
      ${getSearchHistory().map(query => `
        <li class="search-history-item" data-query="${escapeHtml(query)}">
          <span class="history-icon">🕐</span>
          <span class="history-text">${escapeHtml(query)}</span>
        </li>
      `).join('')}
    </ul>
  `;
  
  searchInput.parentElement.style.position = 'relative';
  searchInput.parentElement.appendChild(dropdown);
  
  // 点击历史项
  dropdown.querySelectorAll('.search-history-item').forEach(item => {
    item.addEventListener('click', () => {
      const query = item.dataset.query;
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input'));
      hideSearchHistory();
    });
  });
  
  // 清除按钮
  const clearBtn = dropdown.querySelector('.clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearSearchHistory();
      hideSearchHistory();
    });
  }
}

/**
 * 隐藏搜索历史下拉框
 */
export function hideSearchHistory() {
  const existing = document.querySelector('.search-history-dropdown');
  if (existing) existing.remove();
}

/**
 * 转义 HTML
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
