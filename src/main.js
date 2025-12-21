import { authService } from './lib/auth.js';
import * as Visuals from './lib/visuals.js';
import * as Views from './lib/views.js';

const APP = document.getElementById('app');

// 状态管理
const state = {
  isAdmin: authService.isAuthenticated(),
  searchQuery: '',
  selectedCategory: null,
  selectedTag: null,
  darkMode: localStorage.getItem('darkMode') === 'true'
};

// 路由管理
const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    // 全局点击拦截
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.dataset.link || link.getAttribute('href'));
      }
      // 卡片点击
      const card = e.target.closest('[data-post-id]');
      if (card && !e.target.closest('button')) {
        this.navigate(`/post/${card.dataset.postId}`);
      }
    });
    this.route();
  },
  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.route();
  },
  async route() {
    const path = window.location.pathname;
    APP.innerHTML = '<div class="loading">Unrolling the scroll...</div>';
    window.scrollTo(0, 0);

    try {
      if (path === '/') {
          await Views.renderHome(APP, state, this);
      } else if (path === '/login') {
          Views.renderLogin(APP, this);
      } else if (path === '/admin') {
          state.isAdmin ? await Views.renderAdmin(APP, this) : this.navigate('/login');
      } else if (path === '/create') {
          state.isAdmin ? await Views.renderEditor(APP, null, this) : this.navigate('/login');
      } else if (path.startsWith('/edit/')) {
          state.isAdmin ? await Views.renderEditor(APP, path.split('/edit/')[1], this) : this.navigate('/login');
      } else if (path.startsWith('/post/')) {
          await Views.renderPost(APP, path.split('/post/')[1], this, Visuals.updatePageMeta);
      } else {
          APP.innerHTML = '<div class="error">404: Scroll not found</div>';
      }
    } catch (e) {
      console.error(e);
      APP.innerHTML = `<div class="error">Error: ${e.message}</div>`;
    }
  }
};

// UI更新逻辑
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

  // 夜间模式初始状态
  if (state.darkMode) {
      document.body.classList.add('dark-mode');
      if(toggleBtn) toggleBtn.textContent = '☀';
  }
}

// 绑定全局事件
document.addEventListener('DOMContentLoaded', () => {
  // 1. 注入样式
  Visuals.injectGlobalStyles();
  
  // 2. 启动时钟
  Visuals.updateClock();
  setInterval(Visuals.updateClock, 1000);

  // 3. 启动特效
  Visuals.initSnowEffect();

  // 4. 监听滚动 (用于 TOC 高亮和阅读进度条)
  window.addEventListener('scroll', () => {
      Visuals.updateProgressBar();
      // 这里如果需要 TOC 高亮逻辑，也可以封装到 Visuals 里，或者保持简单
  });

  // 5. 绑定导航栏按钮
  document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      authService.logout();
      state.isAdmin = false;
      updateAuthUI();
      router.navigate('/');
  });

  document.getElementById('dark-mode-toggle')?.addEventListener('click', (e) => {
      e.preventDefault();
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      document.body.classList.toggle('dark-mode');
      e.target.textContent = state.darkMode ? '☀' : '☾';
  });

  // 6. 初始化 UI 和 路由
  updateAuthUI();
  router.init();
});
