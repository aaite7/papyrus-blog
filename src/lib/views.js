// src/lib/views.js
import { postsService } from './posts.js';
import { commentsService } from './comments.js';
import { generateTOC, injectHeadingIds, renderTOC } from './toc.js';
import { authService } from './auth.js';
import * as UI from './ui.js'; // 引入 UI 库

// Helper
function highlightText(t, q) { if (!q || !t) return t; return t.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>'); }
function renderFooter() { return `<footer class="site-footer"><span class="footer-logo">Minimalist</span><div class="footer-links"><a href="#" class="footer-link">Home</a><a href="#" class="footer-link">RSS</a></div><div class="footer-copy">© ${new Date().getFullYear()} Scriptorium</div></footer>`; }

// --- Home ---
export async function renderHome(APP, state) {
  state.posts = await postsService.getAllPosts();
  const renderList = () => {
      let filtered = state.posts;
      if (state.searchQuery) filtered = filtered.filter(p => p.title?.toLowerCase().includes(state.searchQuery) || p.content?.toLowerCase().includes(state.searchQuery));
      // ... filters ...
      APP.innerHTML = `
        <div class="hero fade-in"><h1><span class="star-icon left">✦</span> Minimalist <span class="star-icon right">✦</span></h1><p class="hero-subtitle">Ancient Wisdom</p></div>
        <div class="search-scroll"><input type="search" id="search" placeholder="Search..." value="${state.searchQuery || ''}"></div>
        <div class="manuscripts">${filtered.map(p => `
            <div class="manuscript" data-post-id="${p.id}">
                <h2 class="manuscript-title">${highlightText(p.title, state.searchQuery)}</h2>
                <div class="manuscript-date">${new Date(p.created_at).toLocaleDateString()}</div>
                <p>${highlightText(p.content?.substring(0, 150), state.searchQuery)}...</p>
            </div>`).join('')}
        </div>
        ${renderFooter()}
      `;
      // Events
      document.getElementById('search').addEventListener('input', e => { state.searchQuery = e.target.value.toLowerCase(); renderList(); });
      // 注意：这里去掉了 search.focus()，解决了自动弹出的问题
  };
  renderList();
}

// --- Post ---
export async function renderPost(APP, id, router, updateMetaCallback) {
  const post = await postsService.getPostById(id);
  if (!post) { APP.innerHTML = 'Error'; return; }
  
  // Update views
  if (!sessionStorage.getItem(`view_${id}`)) {
      postsService.updatePost(id, { view_count: (post.view_count||0)+1 });
      sessionStorage.setItem(`view_${id}`, '1');
  }
  
  if (updateMetaCallback) updateMetaCallback(post);
  const content = DOMPurify.sanitize(marked.parse(post.content || '', { breaks: true, gfm: true }));
  const comments = await commentsService.getCommentsByPostId(id);
  const likes = post.likes || 0;
  const isLiked = localStorage.getItem(`liked_${id}`);

  APP.innerHTML = `
    <div id="reading-progress"></div>
    <div class="floating-bar">
        <div class="action-btn ${isLiked?'liked':''}" id="btn-like">♥ <span class="btn-badge" id="l-cnt">${likes}</span></div>
        <div class="action-btn" id="btn-share">🔗</div>
        <div class="action-btn" id="btn-top">⬆</div>
    </div>
    <div class="single-manuscript fade-in">
        <h1 class="single-title">${post.title}</h1>
        ${post.image ? `<img src="${post.image}" style="width:100%;border:4px solid #d4af37;margin-bottom:30px;">` : ''}
        <div class="article-with-toc"><div id="toc"></div><article class="article-content">${content}</article></div>
    </div>
    <div id="comments-section"><h3 style="margin-top:50px;border-top:1px solid #ccc;padding-top:20px;">Comments</h3><div id="comments-list"></div></div>
    ${renderFooter()}
  `;

  // Init UI Components
  UI.initLightbox();
  if (generateTOC(post.content).length > 0) { document.getElementById('toc').innerHTML = renderTOC(generateTOC(post.content)); document.getElementById('toc').querySelectorAll('a').forEach(l => l.addEventListener('click', e => { e.preventDefault(); document.getElementById(l.getAttribute('href').substring(1))?.scrollIntoView({behavior:'smooth'}); })); }

  // Bind FAB
  document.getElementById('btn-like').addEventListener('click', async (e) => {
      if(localStorage.getItem(`liked_${id}`)) return UI.showToast('Already liked!', 'info');
      e.currentTarget.classList.add('liked');
      document.getElementById('l-cnt').textContent = parseInt(document.getElementById('l-cnt').textContent)+1;
      localStorage.setItem(`liked_${id}`, '1');
      UI.showToast('Thanks for liking! ❤️', 'success');
      await postsService.updatePost(id, { likes: likes + 1 });
  });
  document.getElementById('btn-share').addEventListener('click', () => { navigator.clipboard.writeText(window.location.href); UI.showToast('Link copied!', 'success'); });
  document.getElementById('btn-top').addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  // Comments (Simplified render)
  const cList = document.getElementById('comments-list');
  cList.innerHTML = comments.map(c => `<div style="padding:15px;border-bottom:1px solid #eee;"><b>${c.author_name}</b>: ${c.content}</div>`).join('');
}

// --- Editor (Keep logic here for simplicity or move to editor.js later) ---
export async function renderEditor(APP, id, router) {
    let post = { title: '', content: '' };
    if(id) post = await postsService.getPostById(id);
    
    APP.innerHTML = `
      <div class="form-container"><h2>${id?'Edit':'New'}</h2>
      <form id="post-form">
        <input id="pt" value="${post.title}" placeholder="Title" style="width:100%;padding:10px;margin-bottom:10px;">
        <div style="position:relative;">
            <textarea id="pc" class="editor-textarea" placeholder="Markdown content...">${post.content||''}</textarea>
            <div style="position:absolute;top:10px;right:20px;color:#666;font-size:0.8rem;">Ctrl+I for Image</div>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:20px;">Save</button>
      </form></div>
    `;

    const ta = document.getElementById('pc');
    // Ctrl+I Logic
    ta.addEventListener('keydown', e => {
        if((e.ctrlKey||e.metaKey) && e.code==='KeyI') {
            e.preventDefault();
            const start = ta.selectionStart;
            const img = `\n![Img](https://picsum.photos/seed/${Date.now()}/800/400)\n`;
            ta.setRangeText(img, start, start, 'end');
        }
        if(e.key==='Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); }
    });

    document.getElementById('post-form').addEventListener('submit', async e => {
        e.preventDefault();
        const data = { title: document.getElementById('pt').value, content: ta.value };
        if(id) await postsService.updatePost(id, data); else await postsService.createPost(data);
        router.navigate('/admin');
        UI.showToast('Saved successfully', 'success');
    });
}

export function renderLogin(APP, router) { /* ... simplified login ... */ }
export async function renderAdmin(APP, router) { /* ... simplified admin ... */ }
