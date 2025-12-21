// src/lib/views.js
import { postsService } from './posts.js';
import { commentsService } from './comments.js';
import { generateTOC, injectHeadingIds, renderTOC } from './toc.js';
import { authService } from './auth.js';
import * as UI from './ui.js';

function highlightText(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}
function renderFooter() {
    return `<footer class="site-footer"><span class="footer-logo">Minimalist</span><div class="footer-copy">© ${new Date().getFullYear()} Scriptorium.</div></footer>`;
}
function renderIcon(iconStr, className = '') {
    if (!iconStr) return '';
    if (iconStr.startsWith('http')) return `<span class="${className}"><img src="${iconStr}" alt="icon"></span>`;
    return `<span class="${className}">${iconStr}</span>`;
}

// --- Home ---
export async function renderHome(APP, state) {
  state.posts = await postsService.getAllPosts();
  const renderList = () => {
      let filtered = state.posts;
      if (state.searchQuery) filtered = filtered.filter(p => p.title?.toLowerCase().includes(state.searchQuery) || p.content?.toLowerCase().includes(state.searchQuery));

      APP.innerHTML = `
        <div class="hero fade-in"><h1><span class="star-icon left">✦</span> Minimalist <span class="star-icon right">✦</span></h1><p class="hero-subtitle">Ancient Wisdom, Modern Stories</p></div>
        <div class="divider">✦ ✦ ✦</div>
        <div class="search-scroll"><input type="search" id="search" placeholder="Seek words..." value="${state.searchQuery || ''}"></div>
        <div class="manuscripts">${filtered.length ? filtered.map(p => `
            <div class="manuscript" data-post-id="${p.id}" style="${p.is_pinned ? 'border-color:#D4AF37;background:#fffdf5;' : ''}"> 
                <div class="manuscript-header">
                    <h2 class="manuscript-title">
                        ${p.is_pinned ? '<span class="pinned-badge">📌 Top</span>' : ''} 
                        ${renderIcon(p.icon, 'list-icon')} 
                        ${highlightText(p.title, state.searchQuery)}
                    </h2>
                    <div class="manuscript-date">${new Date(p.created_at).toLocaleDateString('zh-CN')}</div>
                </div>
                
                ${p.image ? (p.crop_data ? `
                    <div class="manuscript-image-container" style="position:relative; width:100%; height:300px; overflow:hidden; border-radius:4px; margin:15px 0;">
                        <img src="${p.image}" style="position:absolute; max-width:none; transition: opacity 0.3s; opacity:0;" 
                             onload="
                                this.style.opacity = 1;
                                const container = this.parentElement;
                                const cW = container.offsetWidth;
                                const cH = container.offsetHeight;
                                const scale = Math.max(cW / ${p.crop_data.width}, cH / ${p.crop_data.height});
                                this.width = this.naturalWidth * scale;
                                this.height = this.naturalHeight * scale;
                                this.style.left = ((-${p.crop_data.x} * scale) + (cW - ${p.crop_data.width} * scale) / 2) + 'px';
                                this.style.top = ((-${p.crop_data.y} * scale) + (cH - ${p.crop_data.height} * scale) / 2) + 'px';
                             ">
                    </div>` 
                    : `<div class="manuscript-image-container" style="width:100%; height:300px; overflow:hidden; border-radius:4px; margin:15px 0;">
                        <img src="${p.image}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                    </div>`) : ''}
                
                <p class="manuscript-excerpt">${highlightText(p.content?.substring(0, 150), state.searchQuery)}...</p>
                <div class="manuscript-footer"><span>👁 ${p.view_count||0}</span></div>
            </div>`).join('') : '<div class="empty-scroll"><h3>No manuscripts found</h3></div>'}
        </div>
        ${renderFooter()}
      `;
      document.getElementById('search').addEventListener('input', e => { state.searchQuery = e.target.value.toLowerCase(); renderList(); });
      window.addEventListener('resize', () => { document.querySelectorAll('.manuscript-image-container img[onload]').forEach(img => img.dispatchEvent(new Event('load'))); });
  };
  renderList();
}

// --- Post ---
export async function renderPost(APP, id, router, updateMetaCallback) {
  const post = await postsService.getPostById(id);
  if (!post) { APP.innerHTML = '<div class="error">Lost scroll...</div>'; return; }

  if (!sessionStorage.getItem(`view_${id}`)) {
      postsService.updatePost(id, { view_count: (post.view_count||0)+1 });
      sessionStorage.setItem(`view_${id}`, '1');
  }

  if (updateMetaCallback) updateMetaCallback(post);
  const content = DOMPurify.sanitize(marked.parse(post.content || '', { breaks: true, gfm: true }));
  const comments = await commentsService.getCommentsByPostId(id);
  const likes = post.likes || 0;
  const isLiked = localStorage.getItem(`liked_${id}`);

  let imageHTML = '';
  if (post.image) {
      if (post.crop_data) {
          imageHTML = `<div class="single-image-container" style="position:relative; width:100%; height:400px; overflow:hidden; border-radius:8px; margin-bottom:30px; border: 4px solid #D4AF37;"><img src="${post.image}" style="position:absolute; max-width:none;" onload="const cW=this.parentElement.offsetWidth;const cH=this.parentElement.offsetHeight;const scale=Math.max(cW/${post.crop_data.width},cH/${post.crop_data.height});this.width=this.naturalWidth*scale;this.height=this.naturalHeight*scale;this.style.left=((- ${post.crop_data.x}*scale)+(cW-${post.crop_data.width}*scale)/2)+'px';this.style.top=((- ${post.crop_data.y}*scale)+(cH-${post.crop_data.height}*scale)/2)+'px';"></div>`;
      } else {
          imageHTML = `<div class="single-image-container"><img src="${post.image}" class="single-image" style="object-fit:${post.image_fit||'contain'};"></div>`;
      }
  }

  APP.innerHTML = `
    <div id="reading-progress"></div>
    <div id="toc"></div> <div class="floating-bar">
        <div class="action-btn ${isLiked?'liked':''}" id="btn-like">♥ <span class="btn-badge" id="l-cnt">${likes}</span></div>
        <div class="action-btn" id="btn-share">🔗</div>
        <div class="action-btn" id="btn-top">⬆</div>
    </div>

    <div class="single-manuscript fade-in">
        ${renderIcon(post.icon, 'single-icon')}
        <h1 class="single-title">${post.title}</h1>
        <div class="single-meta">Scribed on ${new Date(post.created_at).toLocaleDateString('zh-CN')} • 👁 ${post.view_count||0}</div>
        ${imageHTML}
        <article class="article-content">${injectHeadingIds(content)}</article>
    </div>

    <div id="comments-section"><div class="divider">✦ Comments (${comments.length}) ✦</div><div id="comments-list"></div>
      <div class="form-container" style="margin-top:20px;"><form id="comment-form"><input id="cn" placeholder="Name" required><input id="ce" placeholder="Email" required><textarea id="cc" placeholder="Comment..." required></textarea><button type="submit" class="btn-primary">Post</button></form></div>
    </div>
    ${renderFooter()}
  `;

  UI.initLightbox();
  UI.initReadingProgress();

  if (generateTOC(post.content).length > 0) { 
      document.getElementById('toc').innerHTML = renderTOC(generateTOC(post.content)); 
      document.getElementById('toc').querySelectorAll('a').forEach(l => l.addEventListener('click', e => { 
          e.preventDefault(); 
          document.getElementById(l.getAttribute('href').substring(1))?.scrollIntoView({behavior:'smooth'}); 
      }));
      
      const onScroll = () => {
          let current = '';
          document.querySelectorAll('.article-content h1[id], .article-content h2[id], .article-content h3[id]').forEach(h => {
              if (h.getBoundingClientRect().top < 150) current = h.getAttribute('id');
          });
          document.querySelectorAll('#toc a').forEach(l => {
              l.classList.remove('active');
              if (l.getAttribute('href').substring(1) === current) l.classList.add('active');
          });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
  }

  document.getElementById('btn-like').addEventListener('click', async (e) => {
      if(localStorage.getItem(`liked_${id}`)) return UI.showToast('Already liked!', 'info');
      e.currentTarget.classList.add('liked');
      document.getElementById('l-cnt').textContent = parseInt(document.getElementById('l-cnt').textContent)+1;
      localStorage.setItem(`liked_${id}`, '1');
      UI.showToast('Liked! ❤️', 'success');
      await postsService.updatePost(id, { likes: likes + 1 });
  });
  document.getElementById('btn-share').addEventListener('click', () => { navigator.clipboard.writeText(window.location.href); UI.showToast('Link copied!', 'success'); });
  document.getElementById('btn-top').addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  const cList = document.getElementById('comments-list');
  cList.innerHTML = comments.length ? comments.map(c => `<div style="padding:15px;border-bottom:1px solid #eee;margin-bottom:10px;"><div><b>${c.author_name}</b> <small style="opacity:0.6">${new Date(c.created_at).toLocaleDateString()}</small></div><p style="margin-top:5px;">${c.content}</p></div>`).join('') : '<p style="text-align:center;opacity:0.6">No comments yet.</p>';
  
  document.getElementById('comment-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      try {
          await commentsService.createComment(id, document.getElementById('cn').value, document.getElementById('ce').value, document.getElementById('cc').value);
          router.route(); UI.showToast('Comment posted!', 'success');
      } catch(err) { UI.showToast(err.message, 'error'); }
  });
}

// --- Login/Admin/Editor (保持不变) ---
export function renderLogin(APP, router) {
    APP.innerHTML = `<div class="form-container fade-in"><h2 class="form-title">Login</h2><form id="login-form"><input type="email" id="le" placeholder="Email" required><input type="password" id="lp" placeholder="Password" required><button type="submit" class="btn-primary" style="width:100%;margin-top:20px;">Sign In</button></form></div>${renderFooter()}`;
    document.getElementById('login-form').addEventListener('submit', async e => { e.preventDefault(); try { await authService.login(document.getElementById('le').value, document.getElementById('lp').value); router.navigate('/admin'); UI.showToast('Welcome back.', 'success'); } catch(err) { UI.showToast('Login failed: ' + err.message, 'error'); } });
}
export async function renderAdmin(APP, router) {
    const posts = await postsService.getAllPosts();
    APP.innerHTML = `<div class="admin-header"><h2 class="admin-title">Scriptorium</h2><button class="btn-primary" data-link="/create">✎ New Post</button></div><div class="admin-ledger">${posts.map(p => `<div class="ledger-entry" style="${p.is_pinned ? 'border-left:4px solid #D4AF37;background:#fffdf5;' : ''}"><div class="entry-info"><h3>${p.is_pinned ? '📌 ' : ''}${renderIcon(p.icon, 'list-icon')} ${p.title} ${p.is_draft?'<span style="color:#999">[Draft]</span>':''}</h3><small>${new Date(p.created_at).toLocaleDateString()}</small></div><div class="entry-actions"><button class="btn-secondary" data-pin="${p.id}" style="${p.is_pinned ? 'color:#D4AF37;border-color:#D4AF37;' : ''}">${p.is_pinned ? 'Unpin' : 'Pin'}</button><button class="btn-secondary" data-link="/edit/${p.id}">Edit</button><button class="btn-danger" data-del="${p.id}">Del</button></div></div>`).join('')}</div>${renderFooter()}`;
    document.querySelectorAll('[data-pin]').forEach(b => b.addEventListener('click', async e => { const id = e.target.dataset.pin; const post = posts.find(p => p.id == id); try { await postsService.updatePost(id, { is_pinned: !post.is_pinned }); router.route(); UI.showToast(post.is_pinned ? 'Unpinned' : 'Pinned to top!', 'success'); } catch(err) { UI.showToast(err.message, 'error'); } }));
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async e => { if(confirm('Delete forever?')) { await postsService.deletePost(e.target.dataset.del); router.route(); UI.showToast('Deleted.', 'info'); } }));
}
export async function renderEditor(APP, id, router) {
    let post = { title: '', content: '', category: '', tags: [], image: '', image_fit: 'contain', icon: '' };
    if(id) post = await postsService.getPostById(id);
    APP.innerHTML = `<div class="form-container"><div class="admin-header"><h2 class="admin-title">${id?'Edit':'New'} Manuscript</h2><button class="btn-secondary" data-link="/admin">Cancel</button></div><form id="post-form"><div class="icon-input-wrapper"><div class="current-icon-preview" id="icon-preview">${renderIcon(post.icon || '📝')}</div><div style="flex:1;"><label style="font-size:0.8rem;color:#666;">Page Icon</label><input id="picon" value="${post.icon||''}" placeholder="e.g. 🚀 or https://..." style="width:100%;"></div><button type="button" class="btn-secondary" id="random-icon-btn">🎲</button></div><div class="form-group"><label>Title</label><input id="pt" value="${post.title}" required></div><div class="form-group"><label>Cover Image URL</label><input id="pi" value="${post.image||''}"><button type="button" class="btn-secondary" id="crop-image-btn" style="margin-top:10px;">✂ Crop Cover</button></div><div id="crop-container" class="image-crop-container hidden"><div style="color:#fff;margin-bottom:10px;">Drag to crop</div><div id="crop-wrapper"><img id="crop-image" src="" style="display:block; max-width:100%;"><div id="crop-box"></div></div><div class="crop-controls"><button type="button" class="btn-primary" id="apply-crop-btn">Apply Crop</button><button type="button" class="btn-secondary" id="cancel-crop-btn">Cancel</button></div></div><div class="form-group"><label>Fit</label><select id="pfit"><option value="contain" ${post.image_fit==='contain'?'selected':''}>Contain</option><option value="cover" ${post.image_fit==='cover'?'selected':''}>Cover</option></select></div><div class="form-group"><label style="display:flex;justify-content:space-between;"><span>Content</span><span>Ctrl+I: Img | Tab: Indent</span></label><div class="editor-container"><div class="editor-pane" id="editor-pane"><textarea id="pc" class="editor-textarea" required placeholder="Write...">${post.content||''}</textarea></div><div class="preview-pane hidden" id="preview-pane"><div id="preview-content" class="article-content"></div></div></div><button type="button" id="toggle-preview-btn" class="btn-secondary" style="margin-top:5px;width:100%;">Toggle Preview</button></div><div class="form-group"><label>Category</label><input id="pcat" value="${post.category}"></div><div class="form-group"><label>Tags</label><input id="ptags" value="${(post.tags||[]).join(',')}"></div><button type="submit" class="btn-primary">Save</button> <button type="button" id="draft-btn" class="btn-secondary">Draft</button></form></div>`;
    const iconInput = document.getElementById('picon'); const updateIcon = () => document.getElementById('icon-preview').innerHTML = renderIcon(iconInput.value || '📝'); iconInput.addEventListener('input', updateIcon); document.getElementById('random-icon-btn').addEventListener('click', () => { iconInput.value = ['🚀','💡','🔥','✨','📝','📚','🎨','💻','🪐','🌊'][Math.floor(Math.random()*10)]; updateIcon(); });
    let cropData = post.crop_data || null, isDrawing = false, startX, startY;
    const els = { btn: document.getElementById('crop-image-btn'), container: document.getElementById('crop-container'), wrapper: document.getElementById('crop-wrapper'), img: document.getElementById('crop-image'), box: document.getElementById('crop-box') };
    els.btn.addEventListener('click', () => { const url = document.getElementById('pi').value; if(!url) return UI.showToast('Input image URL first!', 'error'); els.img.src = url; els.container.classList.remove('hidden'); els.box.style.display='none'; });
    document.getElementById('cancel-crop-btn').addEventListener('click', () => els.container.classList.add('hidden'));
    els.wrapper.onmousedown = e => { e.preventDefault(); isDrawing = true; const r = els.img.getBoundingClientRect(); startX = e.clientX - r.left; startY = e.clientY - r.top; els.box.style.left=startX+'px'; els.box.style.top=startY+'px'; els.box.style.width='0px'; els.box.style.height='0px'; els.box.style.display='block'; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); };
    const onMove = e => { if (!isDrawing) return; const rect = els.img.getBoundingClientRect(); let currX = Math.max(0, Math.min(e.clientX - rect.left, rect.width)); let currY = Math.max(0, Math.min(e.clientY - rect.top, rect.height)); els.box.style.width = Math.abs(currX - startX) + 'px'; els.box.style.height = Math.abs(currY - startY) + 'px'; els.box.style.left = Math.min(currX, startX) + 'px'; els.box.style.top = Math.min(currY, startY) + 'px'; };
    const onUp = () => { isDrawing = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.getElementById('apply-crop-btn').addEventListener('click', () => { const sX = els.img.naturalWidth / els.img.width; const sY = els.img.naturalHeight / els.img.height; cropData = { width: Math.round(parseFloat(els.box.style.width) * sX), height: Math.round(parseFloat(els.box.style.height) * sY), x: Math.round(parseFloat(els.box.style.left) * sX), y: Math.round(parseFloat(els.box.style.top) * sY) }; UI.showToast('Crop Applied!', 'success'); els.container.classList.add('hidden'); });
    const ta = document.getElementById('pc'); ta.addEventListener('keydown', e => { if((e.ctrlKey||e.metaKey)&&e.code==='KeyI'){e.preventDefault();const s=ta.selectionStart;ta.setRangeText(`\n![Img](https://picsum.photos/seed/${Date.now()}/800/450)\n`,s,s,'end');} if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart,en=ta.selectionEnd;ta.setRangeText('    ',s,en,'end');} });
    let mode = false; document.getElementById('toggle-preview-btn').addEventListener('click', () => { mode = !mode; document.getElementById('editor-pane').classList.toggle('split'); document.getElementById('preview-pane').classList.toggle('hidden'); if(mode) document.getElementById('preview-content').innerHTML = DOMPurify.sanitize(marked.parse(ta.value, { breaks: true, gfm: true })); });
    const save = async (draft) => { const data = { title: document.getElementById('pt').value, content: ta.value, image: document.getElementById('pi').value, image_fit: document.getElementById('pfit').value, category: document.getElementById('pcat').value, tags: document.getElementById('ptags').value.split(',').filter(Boolean), crop_data: cropData, is_draft: draft, icon: iconInput.value }; if(id) await postsService.updatePost(id, data); else await postsService.createPost(data); router.navigate('/admin'); UI.showToast(draft?'Draft Saved':'Published!', 'success'); };
    document.getElementById('post-form').addEventListener('submit', e => { e.preventDefault(); save(false); }); document.getElementById('draft-btn').addEventListener('click', () => save(true));
}
