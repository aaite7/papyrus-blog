// src/main.js
import { supabase } from './lib/supabase.js';
import * as Styles from './lib/styles.js';
import * as UI from './lib/ui.js';
import { injectDecorations } from './lib/decorations.js';
import { makeCardsFocusable, initKeyboardNavigation } from './lib/keyboard-nav.js';
import { optimizeExistingImages } from './lib/image-optimizer.js';
import { initGlobalErrorHandler } from './lib/error-boundary.js';
import { initAnalytics } from './lib/analytics.js';
import { injectFeedLinks } from './lib/rss-generator.js';
import { initAutoDarkMode, toggleDarkModeManually } from './lib/auto-dark-mode.js';
import { initI18n, initLanguageSwitcher } from './lib/i18n.js';
import { initInstantSearch } from './lib/instant-search.js';

const APP = document.getElementById('app');
const state = { isAdmin: false, searchQuery: '' };

// 动态导入大型模块
const loadViews = () => import('./lib/views.js');
const loadArchive = () => import('./lib/archive.js');
const loadDecorations = () => Styles.loadDecorations ? Styles.loadDecorations() : Promise.resolve();

let scrollPositions = new Map();

const router = {
  navigate(path) { window.history.pushState({}, '', path); this.route(); },
  async route() {
    const path = window.location.pathname;
    
    // 保存当前滚动位置
    const currentScroll = window.scrollY;
    if (window.location.pathname !== path) {
      scrollPositions.set(window.location.pathname, currentScroll);
    }
    
    APP.innerHTML = UI.renderSkeleton ? UI.renderSkeleton() : 'Loading...';

    const live2dWidget = document.getElementById('live2d-widget');
    if (live2dWidget) {
        live2dWidget.style.display = (path === '/') ? 'block' : 'none';
    }
    
    try {
        const Views = await loadViews();
        
        if (path === '/') {
            await Views.renderHome(APP, state);
            if (UI.initSnowEffect) UI.initSnowEffect();
            if (UI.initLive2D) UI.initLive2D();
            // 恢复首页滚动位置
            const scrollY = scrollPositions.get(path);
            if (scrollY !== undefined) {
              setTimeout(() => window.scrollTo(0, scrollY), 100);
            }
        }
        else if (path === '/archive') {
            const Archive = await loadArchive();
            await Archive.renderArchivePage(APP);
            // 恢复归档页滚动位置
            const scrollY = scrollPositions.get(path);
            if (scrollY !== undefined) {
              setTimeout(() => window.scrollTo(0, scrollY), 100);
            }
        }
        else if (path === '/login') Views.renderLogin(APP, this);
        else if (path === '/admin') state.isAdmin ? await Views.renderAdmin(APP, this) : this.navigate('/login');
        else if (path === '/create') state.isAdmin ? await Views.renderEditor(APP, null, this) : this.navigate('/login');
        else if (path.startsWith('/edit/')) state.isAdmin ? await Views.renderEditor(APP, path.split('/edit/')[1], this) : this.navigate('/login');
        else if (path.startsWith('/post/')) {
            await Views.renderPost(APP, path.split('/post/')[1], this, UI.updatePageMeta);
            if(UI.highlightCode) UI.highlightCode();
            if(UI.initReadingProgress) UI.initReadingProgress();
            // 恢复文章页滚动位置（从 hash 或保存的位置）
            const hash = window.location.hash;
            if (hash) {
              const el = document.querySelector(hash);
              if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            } else {
              const scrollY = scrollPositions.get(path);
              if (scrollY !== undefined) {
                setTimeout(() => window.scrollTo(0, scrollY), 100);
              }
            }
        }
        else APP.innerHTML = '<div class="error">404: Page not found</div>';
    } catch (e) {
        console.error(e); APP.innerHTML = `<div class="error">Error: ${e.message}</div>`;
    }
  }
};

async function updateAuthUI() {
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');
  const toggleBtn = document.getElementById('dark-mode-toggle');

  // 显示加载状态
  if (adminLink) {
    adminLink.classList.add('loading');
    const authLoading = adminLink.querySelector('.auth-loading');
    const adminText = adminLink.querySelector('.admin-text');
    if (authLoading) authLoading.classList.add('show');
    if (adminText) adminText.style.opacity = '0.5';
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    state.isAdmin = !!session;

    if (state.isAdmin) {
      if (adminLink.querySelector('.admin-text')) {
        adminLink.querySelector('.admin-text').textContent = 'Scriptorium';
      } else {
        adminLink.textContent = 'Scriptorium';
      }
      logoutBtn.classList.remove('hidden');
    } else {
      if (adminLink.querySelector('.admin-text')) {
        adminLink.querySelector('.admin-text').textContent = 'Scribe';
      } else {
        adminLink.textContent = 'Scribe';
      }
      logoutBtn.classList.add('hidden');
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    if (adminLink.querySelector('.admin-text')) {
      adminLink.querySelector('.admin-text').textContent = 'Scribe';
    } else {
      adminLink.textContent = 'Scribe';
    }
    logoutBtn.classList.add('hidden');
  } finally {
    if (adminLink) {
      adminLink.classList.remove('loading');
      const authLoading = adminLink.querySelector('.auth-loading');
      const adminText = adminLink.querySelector('.admin-text');
      if (authLoading) authLoading.classList.remove('show');
      if (adminText) adminText.style.opacity = '1';
    }
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

let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
  if (isInitialized) return;
  isInitialized = true;
  
  Styles.injectGlobalStyles();
  if (UI.loadPrism) UI.loadPrism();
  if (UI.initSelectionSharer) UI.initSelectionSharer();
  if (UI.initReadingProgress) UI.initReadingProgress();
  
  initI18n();
  initGlobalErrorHandler();
  initAnalytics();
  initAutoDarkMode({ mode: 'smart', respectSystem: true });
  injectFeedLinks();
  initInstantSearch();
  initLanguageSwitcher();
  
  setTimeout(() => optimizeExistingImages(), 500);
  
  // 延迟加载装饰样式（非关键）
  setTimeout(() => loadDecorations().then(() => injectDecorations()), 100);
  
  const initCardNav = () => {
    makeCardsFocusable();
    initKeyboardNavigation();
  };
  setTimeout(initCardNav, 200);
  
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
  
  // 汉堡菜单切换
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', navToggle.classList.contains('active'));
    });
    
    // 点击导航链接后关闭菜单
    navLinks.querySelectorAll('.nav-btn, a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    
    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  supabase.auth.onAuthStateChange((event, session) => {
    state.isAdmin = !!session;
    updateAuthUI();
    router.route(); // Re-route on auth change
  });

  updateAuthUI();
  initShortcuts();
  router.init();
});
