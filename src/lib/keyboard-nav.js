// src/lib/keyboard-nav.js

/**
 * 初始化键盘导航
 */
export function initKeyboardNavigation() {
  // Tab 键遍历卡片
  const focusableCards = document.querySelectorAll('[data-post-id][tabindex="0"]');
  
  focusableCards.forEach((card, index) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = focusableCards[index + 1];
        if (next) next.focus();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = focusableCards[index - 1];
        if (prev) prev.focus();
      }
    });
  });
}

/**
 * 使卡片可聚焦
 */
export function makeCardsFocusable() {
  document.querySelectorAll('[data-post-id]').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `阅读文章：${card.querySelector('.manuscript-title')?.textContent || ''}`);
  });
}

/**
 * 初始化快捷键
 */
export function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    // 输入框中不触发快捷键
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }
    
    // / 聚焦搜索
    if (e.key === '/') {
      e.preventDefault();
      const searchInput = document.getElementById('search');
      if (searchInput) searchInput.focus();
    }
    
    // j 向下滚动
    if (e.key.toLowerCase() === 'j') {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    }
    
    // k 向上滚动
    if (e.key.toLowerCase() === 'k') {
      window.scrollBy({ top: -300, behavior: 'smooth' });
    }
    
    // t 回到顶部
    if (e.key.toLowerCase() === 't') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // g 跳到底部
    if (e.key.toLowerCase() === 'g') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  });
}
