import { authService } from './lib/auth.js';
import * as Styles from './lib/styles.js';
import * as UI from './lib/ui.js';
import * as Views from './lib/views.js';

const APP = document.getElementById('app');

const state = {
  isAdmin: authService.isAuthenticated(),
  searchQuery: '',
  // 可以在这里扩展更多全局状态
};

const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    
    // 全局点击代理：处理所有 data-link 的跳转
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.dataset.link;
        this.navigate(href);
      }
      
      // 处理文章卡片点击 (进入详情)
      const card = e.target.closest('[data-post-id]');
      // 排除点到了卡片里的按钮(如编辑/删除)的情况
      if (card && !e.target.closest('button') && !e.target.closest('a')) {
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
    
    // 简单的加载动画
    APP.innerHTML = '<div class="loading" style="text-align:center;padding:50px;font-family:serif;">Unrolling scroll...</div>';
    window.scrollTo(0, 0);

    try {
      // --- 路由匹配逻辑 ---
      
      if (path === '/') {
          // 首页
          await Views.renderHome(APP, state);
      } 
      else if (path === '/login') {
          // 登录页
          Views.renderLogin(APP, this);
      } 
      else if (path === '/admin') {
          // 后台管理页 (需权限)
          if (state.isAdmin) {
              await Views.renderAdmin(APP, this);
          } else {
              this.navigate('/login');
          }
      } 
      else if (path === '/create') {
          // 创建新文章 (需权限)
          if (state.isAdmin) {
              await Views.renderEditor(APP, null, this);
          } else {
              this.navigate('/login');
          }
      } 
      else if (path.startsWith('/edit/')) {
          // >>> 编辑文章 (需权限) <<<
          // path.split('/edit/')[1] 就是文章 ID
          const id = path.split('/edit/')[1];
          if (state.isAdmin && id) {
              await Views.renderEditor(APP, id, this);
          } else {
              this.navigate('/login');
          }
      } 
      else if (path.startsWith('/post/')) {
          // 文章详情页
          const id = path.split('/post/')[1];
          if (id) {
              await Views.renderPost(APP, id, this, UI.updatePageMeta);
              
              // 页面渲染后的后续动作
              UI.highlightCode(); // 代码高亮
              UI.initReadingProgress(); // 进度条
          } else {
              APP.innerHTML = '<div class="error">Scroll ID missing...</div>';
          }
      } 
      else {
          APP.innerHTML = '<div class="error" style="text-align:center;padding:50px;">404: The scroll you seek does not exist.</div>';
      }
      
    } catch (e) {
      console.error(e);
      APP.innerHTML = `<div class="error" style="color:red;padding:20px;">System Error: ${e.message}</div>`;
    }
  }
};

// UI 初始化与状态同步
function updateAuthUI() {
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');
  const toggleBtn = document.getElementById('dark-mode-toggle');

  if (state.isAdmin) {
    adminLink.textContent = 'Scriptorium'; // 管理员看到的名字
    logoutBtn.classList.remove('hidden');
  } else {
    adminLink.textContent = 'Scribe'; // 游客看到的名字
    logoutBtn.classList.add('hidden');
  }

  // 启动时钟
  if (window.clockInterval) clearInterval(window.clockInterval);
  UI.updateClock();
  window.clockInterval = setInterval(UI.updateClock, 1000);

  // 夜间模式回显
  if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      if(toggleBtn) toggleBtn.textContent = '☀';
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  // 1. 注入所有 CSS
  Styles.injectGlobalStyles();
  
  // 2. 预加载高亮库
  UI.loadPrism(); 
  
  // 3. 启动背景特效
  UI.initSnowEffect();
  
  // 4. 启动全局交互 (划词分享)
  UI.initSelectionSharer();
  
  // 5. 绑定导航栏全局事件
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

  // 6. 运行
  updateAuthUI();
  router.init();
});
