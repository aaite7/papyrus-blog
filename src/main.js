import { authService } from './lib/auth.js';
import * as Styles from './lib/styles.js';
import * as UI from './lib/ui.js';
import * as Views from './lib/views.js';

const APP = document.getElementById('app');
const state = { isAdmin: authService.isAuthenticated(), searchQuery: '' };

const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) { e.preventDefault(); this.navigate(link.dataset.link); }
      const card = e.target.closest('[data-post-id]');
      if (card && !e.target.closest('button')) this.navigate(`/post/${card.dataset.postId}`);
    });
    this.route();
  },
  navigate(path) { window.history.pushState({}, '', path); this.route(); },
  async route() {
    const path = window.location.pathname;
    APP.innerHTML = '<div class="loading">...</div>';
    window.scrollTo(0, 0);
    
    if (path === '/') await Views.renderHome(APP, state);
    else if (path.startsWith('/post/')) {
        await Views.renderPost(APP, path.split('/post/')[1], this, UI.updatePageMeta);
        // Post-render inits
        UI.highlightCode();
        UI.initReadingProgress(); // Re-init purely for the check, global listener persists
    }
    else if (path === '/create') state.isAdmin ? await Views.renderEditor(APP, null, this) : this.navigate('/');
    // ... add other routes login/admin ...
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Styles.injectGlobalStyles();
  UI.loadPrism();
  UI.updateClock(); setInterval(UI.updateClock, 1000);
  UI.initSnowEffect();
  UI.initSelectionSharer();
  UI.initReadingProgress(); // Global init
  router.init();
});
