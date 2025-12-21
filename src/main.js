// src/main.js
import { authService } from './lib/auth.js';
import * as Styles from './lib/styles.js';
import * as UI from './lib/ui.js';
import * as Views from './lib/views.js';
// 不要 import visuals.js，或者保留它也没关系，因为现在它是哑巴文件了

const APP = document.getElementById('app');
const state = { isAdmin: authService.isAuthenticated(), searchQuery: '' };

const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) { e.preventDefault(); this.navigate(link.dataset.link); }
      const card = e.target.closest('[data-post-id]');
      if (card && !e.target.closest('button') && !e.target.closest('a')) {
        this.navigate(`/post/${card.dataset.postId}`);
      }
    });
    this.route();
  },
  navigate(path) { window.history.pushState({}, '', path); this.route(); },
  async route() {
    const path = window.location.pathname;
    
    // 渲染骨架屏
    APP.innerHTML = UI.renderSkeleton ? UI.renderSkeleton() : 'Loading...';
    window.scrollTo(0, 0);
    
    try {
        if (path === '/') await Views.renderHome(APP, state);
        else if (path === '/login') Views.renderLogin(APP, this);
        else if (path === '/admin') state.isAdmin ? await Views.renderAdmin(APP, this) : this.navigate('/login');
        else if (path === '/create') state.isAdmin ? await Views.renderEditor(APP, null, this) : this.navigate('/login');
        else if (path.startsWith('/edit/')) state.isAdmin ? await Views.renderEditor(APP, path.split('/edit/')[1], this) : this.navigate('/login');
        else if (path.startsWith('/post/')) {
            await Views.renderPost(APP, path.split('/post/')[1], this, UI.updatePageMeta);
            if(UI.highlightCode) UI.highlightCode();
            if(UI.initReadingProgress) UI.initReadingProgress();
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

  if (window.clockInterval) clearInterval(window.clockInterval);
  if (UI.updateClock) {
      UI.updateClock();
      window.clockInterval = setInterval(UI.updateClock, 1000);
  }

  if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      if(toggleBtn) toggleBtn.textContent = '☀';
  }
}

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
    });
}

document.addEventListener('DOMContentLoaded', () => {
  Styles.injectGlobalStyles();
  if(UI.loadPrism) UI.loadPrism();
  if(UI.initSnowEffect) UI.initSnowEffect();
  if(UI.initSelectionSharer) UI.initSelectionSharer();
  if(UI.initReadingProgress) UI.initReadingProgress();
  
  const logout = document.getElementById('logout-btn');
  if(logout) logout.addEventListener('click', (e) => {
      e.preventDefault();
      authService.logout();
      state.isAdmin = false;
      updateAuthUI();
      router.navigate('/');
      if(UI.showToast) UI.showToast('Logged out.', 'info');
  });

  const toggle = document.getElementById('dark-mode-toggle');
  if(toggle) toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', isDark);
      e.target.textContent = isDark ? '☀' : '☾';
  });

  updateAuthUI();
  initShortcuts();
  router.init();
});
