// src/main.js
import { supabase } from './lib/supabase.js';
import * as Styles from './lib/styles.js';
import * as UI from './lib/ui.js';
import * as Views from './lib/views.js';
import { postsService } from './lib/posts.js';
import { injectDecorations } from './lib/decorations.js';
import { makeCardsFocusable, initKeyboardNavigation } from './lib/keyboard-nav.js';
import { optimizeExistingImages } from './lib/image-optimizer.js';
import { initGlobalErrorHandler } from './lib/error-boundary.js';
import { initAnalytics } from './lib/analytics.js';
import { injectFeedLinks } from './lib/rss-generator.js';
import { initAutoDarkMode, toggleDarkModeManually } from './lib/auto-dark-mode.js';
import { initLatestCommentsWidget } from './lib/comments-visualization.js';
import { renderArchivePage } from './lib/archive.js';
import { initInstantSearch } from './lib/instant-search.js';
import { initI18n, initLanguageSwitcher } from './lib/i18n.js';

const APP = document.getElementById('app');
const state = { isAdmin: false, searchQuery: '' };

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

    const live2dWidget = document.getElementById('live2d-widget');
    if (live2dWidget) {
        live2dWidget.style.display = (path === '/') ? 'block' : 'none';
    }
    
    try {
        if (path === '/') {
            await Views.renderHome(APP, state);
            // 启动下雪
            if (UI.initSnowEffect) UI.initSnowEffect();
            // 启动 Live2D
            if (UI.initLive2D) UI.initLive2D();
            // 加载最新评论
            setTimeout(initLatestCommentsWidget, 500);
        }
        else if (path === '/archive') {
            await renderArchivePage(APP);
        }
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

async function updateAuthUI() {
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');
  const toggleBtn = document.getElementById('dark-mode-toggle');

  const { data: { session } } = await supabase.auth.getSession();
  state.isAdmin = !!session;

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
        const key = e.key || '';
        if (key === '/') {
            e.preventDefault();
            document.getElementById('search')?.focus();
        }
        if (key.toLowerCase() === 'j') window.scrollBy({ top: 300, behavior: 'smooth' });
        if (key.toLowerCase() === 'k') window.scrollBy({ top: -300, behavior: 'smooth' });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  Styles.injectGlobalStyles();
  if (UI.loadPrism) UI.loadPrism();
  if (UI.initSelectionSharer) UI.initSelectionSharer();
  if (UI.initReadingProgress) UI.initReadingProgress();
  
  // 初始化 i18n
  initI18n();
  
  // 初始化全局错误处理
  initGlobalErrorHandler();
  
  // 初始化分析追踪
  initAnalytics();
  
  // 初始化自动暗黑模式
  initAutoDarkMode({ mode: 'smart', respectSystem: true });
  
  // 注入 RSS/Atom Feed 链接
  injectFeedLinks();
  
  // 初始化实时搜索
  initInstantSearch();
  
  // 初始化语言切换器
  initLanguageSwitcher();
  
  // 优化图片
  setTimeout(() => optimizeExistingImages(), 500);
  
  // 装饰样式
  injectDecorations();
  
  // 键盘导航
  const initCardNav = () => {
    makeCardsFocusable();
    initKeyboardNavigation();
  };
  setTimeout(initCardNav, 200);
  if(UI.loadPrism) UI.loadPrism();
  if(UI.initSelectionSharer) UI.initSelectionSharer();
  if(UI.initReadingProgress) UI.initReadingProgress();
  
  // >>> 核心：启动天气查询 <<<
  if(UI.initWeather) UI.initWeather();

  const logout = document.getElementById('logout-btn');
  if(logout) logout.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      state.isAdmin = false;
      updateAuthUI();
      router.navigate('/');
      if(UI.showToast) UI.showToast('Logged out.', 'info');
  });

  const toggle = document.getElementById('dark-mode-toggle');
  if(toggle) toggle.addEventListener('click', (e) => {
      e.preventDefault();
      // 使用手动切换（会禁用自动切换）
      toggleDarkModeManually();
  });

  supabase.auth.onAuthStateChange((event, session) => {
    state.isAdmin = !!session;
    updateAuthUI();
    router.route(); // Re-route on auth change
  });

  updateAuthUI();
  initShortcuts();
  router.init();
});
