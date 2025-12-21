// src/main.js
import { authService } from './lib/auth.js';
import * as Styles from './lib/styles.js'; // 样式
import * as UI from './lib/ui.js';         // 交互
import * as Views from './lib/views.js';   // 页面视图

// >>> 确保没有 import ... from './lib/visuals.js' <<<

const APP = document.getElementById('app');
const state = { isAdmin: authService.isAuthenticated(), searchQuery: '' };

const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) { e.preventDefault(); this.navigate(link.dataset.link); }
      const card = e.target.closest('[data-post-id]');
      // 只有点击卡片且不是点击按钮/链接时才跳转
      if (card && !e.target.closest('button') && !e.target.closest('a')) {
        this.navigate(`/post/${card.dataset.postId}`);
      }
    });
    this.route();
  },
  navigate(path) { window.history.pushState({}, '', path); this.route(); },
  async route() {
    const path = window.location.pathname;
    
    // 显示骨架屏
    APP.innerHTML = UI.renderSkeleton(); 
    window.scrollTo(0, 0);
    
    try {
        if (path === '/') await Views.renderHome(APP, state);
        else if (path === '/login') Views.renderLogin(APP, this);
        else if (path === '/admin') state.isAdmin ? await Views.renderAdmin(APP, this) : this.navigate('/login');
        else if (path === '/create') state.isAdmin ? await Views.renderEditor(APP, null, this) : this.navigate('/login');
        else if (path.startsWith('/edit/')) state.isAdmin ? await Views.renderEditor(APP, path.split('/edit/')[1], this) : this.navigate('/login');
        else if (path.startsWith('/post/')) {
            await Views.renderPost(APP, path.split('/post/')[1], this, UI.updatePageMeta);
            UI.highlightCode();
            UI.initReadingProgress();
        }
        else APP.innerHTML = '<div class="error">404: Scroll not found</div>';
    } catch (e) {
        console.error(e); APP.innerHTML = `<div class="error">Error: ${e.message}</div>`;
    }
  }
};

function updateAuthUI() {
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');
  const toggleBtn = document.getElementById('dark-mode-toggle');

  if (state.isAdmin) {
    adminLink.textContent = 'Scriptorium';
    logoutBtn.classList.remove('hidden');
  } else {
    adminLink.textContent = 'Scribe';
    logoutBtn.classList.add('hidden');
  }

  // 时钟
  if (window.clockInterval) clearInterval(window.clockInterval);
  UI.updateClock();
  window.clockInterval = setInterval(UI.updateClock, 1000);

  // 夜间模式回显
  if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      if(toggleBtn) toggleBtn.textContent = '☀';
  }
}

// 快捷键
function initShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            if (e.key === 'Escape') document.activeElement.blur();
            return;
        }
        if (e.key === '/') {
            e.preventDefault();
            document.getElementById('search')?.focus();
        }
        if (e.key.toLowerCase() === 'j') window.scrollBy({ top: 300, behavior: 'smooth' });
        if (e.key.toLowerCase() === 'k') window.scrollBy({ top: -300, behavior: 'smooth' });
        if (e.key === 'Escape') document.querySelector('.lightbox-overlay.active')?.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  Styles.injectGlobalStyles(); // 注入样式
  UI.loadPrism();
  UI.initSnowEffect();
  UI.initSelectionSharer();
  UI.initReadingProgress();
  
  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      authService.logout();
      state.isAdmin = false;
      updateAuthUI();
      router.navigate('/');
      UI.showToast('Logged out.', 'info');
  });

  document.getElementById('dark-mode-toggle')?.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', isDark);
      e.target.textContent = isDark ? '☀' : '☾';
  });

  updateAuthUI();
  initShortcuts();
  router.init();
});
