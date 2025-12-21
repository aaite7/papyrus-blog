import { authService } from './lib/auth.js';
import * as Visuals from './lib/visuals.js';
import * as Views from './lib/views.js';

const APP = document.getElementById('app');

const state = {
  isAdmin: authService.isAuthenticated(),
  searchQuery: '',
  selectedCategory: null,
  selectedTag: null,
  darkMode: localStorage.getItem('darkMode') === 'true'
};

const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.dataset.link || link.getAttribute('href'));
      }
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
          
          // 渲染后立即触发一次高亮和进度条检查
          Visuals.highlightCode(); 
          Visuals.updateProgressBar();
          
      } else {
          APP.innerHTML = '<div class="error">404: Scroll not found</div>';
      }
    } catch (e) {
      console.error(e);
      APP.innerHTML = `<div class="error">Error: ${e.message}</div>`;
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

  if (state.darkMode) {
      document.body.classList.add('dark-mode');
      if(toggleBtn) toggleBtn.textContent = '☀';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. 注入所有全局样式
  Visuals.injectGlobalStyles();
  
  // 2. 加载第三方库
  Visuals.loadPrism(); 
  
  // 3. 启动定时器和特效
  Visuals.updateClock();
  setInterval(Visuals.updateClock, 1000);
  Visuals.initSnowEffect();
  
  // >>> 核心升级：启动划词分享功能 <<<
  Visuals.initSelectionSharer();

  // 4. 监听滚动 (用于阅读进度条)
  window.addEventListener('scroll', () => {
      Visuals.updateProgressBar();
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

  updateAuthUI();
  router.init();
});
