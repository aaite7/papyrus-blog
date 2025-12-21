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
          
          // 渲染后触发
          Visuals.highlightCode(); 
          // 这里不再需要手动 updateProgressBar，因为 initReadingProgress 已经设置了自动监听
          
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
  // 1. 注入样式
  Visuals.injectGlobalStyles();
  
  // 2. 加载库
  Visuals.loadPrism(); 
  
  // 3. 启动特效
  Visuals.updateClock();
  setInterval(Visuals.updateClock, 1000);
  Visuals.initSnowEffect();
  
  // 4. 启动交互组件 (划词分享 & 阅读进度条)
  Visuals.initSelectionSharer();
  Visuals.initReadingProgress(); // >>> 这里调用新的初始化函数

  // 5. 绑定全局按钮
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
