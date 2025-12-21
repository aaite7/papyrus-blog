// src/lib/views.js
import { postsService } from './posts.js';
import { commentsService } from './comments.js';
import { generateTOC, injectHeadingIds, renderTOC } from './toc.js';
import { authService } from './auth.js';
import * as UI from './ui.js';

// Helper
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
            <div class="manuscript" data-post-id="${p.id}">
                <div class="manuscript-header"><h2 class="manuscript-title">${renderIcon(p.icon, 'list-icon')} ${highlightText(p.title, state.searchQuery)}</h2><div class="manuscript-date">${new Date(p.created_at).toLocaleDateString('zh-CN')}</div></div>
                ${p.image ? (p.crop_data ? `
                    <div style="position:relative;width:100%;height:300px;overflow:hidden;border-radius:4px;margin:15px 0;box-shadow:inset 0 0 20px rgba(0,0,0,0.1);">
                        <img src="${p.image}" style="position:absolute; object-fit: cover;
                            width:${p.crop_data.containerW}px; height:${p.crop_data.containerH}px;
                            left:${p.crop_data.left}px; top:${p.crop_data.top}px;" loading="lazy">
                    </div>` 
                    : `<img src="${p.image}" class="manuscript-image" style="object-fit:${p.image_fit||'contain'};max-height:300px;" loading="lazy">`) : ''}
                <p class="manuscript-excerpt">${highlightText(p.content?.substring(0, 150), state.searchQuery)}...</p>
                <div class="manuscript-footer"><span>👁 ${p.view_count||0}</span></div>
            </div>`).join('') : '<div class="empty-scroll"><h3>No manuscripts found</h3></div>'}
        </div>
        ${renderFooter()}
      `;
      document.getElementById('search').addEventListener('input', e => { state.searchQuery = e.target.value.toLowerCase(); renderList(); });
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

  // 简单的裁剪回显逻辑
  let imageHTML = '';
  if (post.image) {
      if (post.crop_data) {
          // 如果有裁剪数据，模拟裁剪显示（这里简化处理，实际需要根据比例计算）
          // 更好的方式是保存裁剪后的图片 URL，但纯前端裁剪通常保存坐标
          // 这里我们简单展示原图，或者如果需要严格显示裁剪：
          // 实际上首页列表已经展示了裁剪效果。详情页通常展示全图或 Cover。
          // 为了简单，详情页我们展示完整大图，或者使用 object-fit: cover
          imageHTML = `<div class="single-image-container"><img src="${post.image}" class="single-image" style="object-fit:cover; width:100%; max-height:500px;"></div>`;
      } else {
          imageHTML = `<div class="single-image-container"><img src="${post.image}" class="single-image" style="object-fit:${post.image_fit||'contain'};"></div>`;
      }
  }

  APP.innerHTML = `
    <div id="reading-progress"></div>
    <div class="floating-bar">
        <div class="action-btn ${isLiked?'liked':''}" id="btn-like">♥ <span class="btn-badge" id="l-cnt">${likes}</span></div>
        <div class="action-btn" id="btn-share">🔗</div>
        <div class="action-btn" id="btn-top">⬆</div>
    </div>
    <div class="single-manuscript fade-in">
        ${renderIcon(post.icon, 'single-icon')}
        <h1 class="single-title">${post.title}</h1>
        <div class="single-meta">Scribed on ${new Date(post.created_at).toLocaleDateString('zh-CN')} • 👁 ${post.view_count||0}</div>
        ${imageHTML}
        <div class="article-with-toc"><div id="toc"></div><article class="article-content">${content}</article></div>
    </div>
    <div id="comments-section"><div class="divider">✦ Comments (${comments.length}) ✦</div><div id="comments-list"></div>
      <div class="form-container" style="margin-top:20px;"><form id="comment-form"><input id="cn" placeholder="Name" required><input id="ce" placeholder="Email" required><textarea id="cc" placeholder="Comment..." required></textarea><button type="submit" class="btn-primary">Post</button></form></div>
    </div>
    ${renderFooter()}
  `;

  UI.initLightbox();
  if (generateTOC(post.content).length > 0) { 
      document.getElementById('toc').innerHTML = renderTOC(generateTOC(post.content)); 
      document.getElementById('toc').querySelectorAll('a').forEach(l => l.addEventListener('click', e => { e.preventDefault(); document.getElementById(l.getAttribute('href').substring(1))?.scrollIntoView({behavior:'smooth'}); })); 
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

export function renderLogin(APP, router) {
    APP.innerHTML = `<div class="form-container fade-in"><h2 class="form-title">Login</h2><form id="login-form"><input type="email" id="le" placeholder="Email" required><input type="password" id="lp" placeholder="Password" required><button type="submit" class="btn-primary" style="width:100%;margin-top:20px;">Sign In</button></form></div>${renderFooter()}`;
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        try {
            await authService.login(document.getElementById('le').value, document.getElementById('lp').value);
            router.navigate('/admin'); UI.showToast('Welcome back.', 'success');
        } catch(err) { UI.showToast('Login failed: ' + err.message, 'error'); }
    });
}

export async function renderAdmin(APP, router) {
    const posts = await postsService.getAllPosts();
    APP.innerHTML = `<div class="admin-header"><h2 class="admin-title">Scriptorium</h2><button class="btn-primary" data-link="/create">✎ New Post</button></div><div class="admin-ledger">${posts.map(p => `<div class="ledger-entry"><div class="entry-info"><h3>${renderIcon(p.icon, 'list-icon')} ${p.title} ${p.is_draft?'<span style="color:#999">[Draft]</span>':''}</h3><small>${new Date(p.created_at).toLocaleDateString()}</small></div><div class="entry-actions"><button class="btn-secondary" data-link="/edit/${p.id}">Edit</button><button class="btn-danger" data-del="${p.id}">Del</button></div></div>`).join('')}</div>${renderFooter()}`;
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async e => {
        if(confirm('Delete forever?')) { await postsService.deletePost(e.target.dataset.del); router.route(); UI.showToast('Deleted.', 'info'); }
    }));
}

// --- >>> 核心：编辑器 (包含强力裁剪逻辑) <<< ---
export async function renderEditor(APP, id, router) {
    let post = { title: '', content: '', category: '', tags: [], image: '', image_fit: 'contain', icon: '' };
    if(id) post = await postsService.getPostById(id);
    
    APP.innerHTML = `
      <div class="form-container">
        <div class="admin-header"><h2 class="admin-title">${id?'Edit':'New'} Manuscript</h2><button class="btn-secondary" data-link="/admin">Cancel</button></div>
        <form id="post-form">
          <div class="icon-input-wrapper">
             <div class="current-icon-preview" id="icon-preview">${renderIcon(post.icon || '📝')}</div>
             <div style="flex:1;"><label style="font-size:0.8rem;color:#666;">Page Icon</label><input id="picon" value="${post.icon||''}" placeholder="e.g. 🚀 or https://..." style="width:100%;"></div>
             <button type="button" class="btn-secondary" id="random-icon-btn">🎲</button>
          </div>

          <div class="form-group"><label>Title</label><input id="pt" value="${post.title}" required></div>
          <div class="form-group"><label>Cover Image URL</label><input id="pi" value="${post.image||''}"><button type="button" class="btn-secondary" id="crop-image-btn" style="margin-top:10px;">✂ Crop Cover</button></div>
          
          <div id="crop-container" class="image-crop-container hidden">
            <div style="color:#fff;margin-bottom:10px;">Drag to crop</div>
            <div id="crop-wrapper"><img id="crop-image" src="" style="display:block; max-width:100%;"><div id="crop-box"></div></div>
            <div class="crop-controls"><button type="button" class="btn-primary" id="apply-crop-btn">Apply Crop</button><button type="button" class="btn-secondary" id="cancel-crop-btn">Cancel</button></div>
          </div>
          
          <div class="form-group"><label>Fit</label><select id="pfit"><option value="contain" ${post.image_fit==='contain'?'selected':''}>Contain</option><option value="cover" ${post.image_fit==='cover'?'selected':''}>Cover</option></select></div>
          
          <div class="form-group">
            <label style="display:flex;justify-content:space-between;"><span>Content</span><span>Ctrl+I: Img | Tab: Indent</span></label>
            <div class="editor-container">
                <div class="editor-pane" id="editor-pane"><textarea id="pc" class="editor-textarea" required placeholder="Write...">${post.content||''}</textarea></div>
                <div class="preview-pane hidden" id="preview-pane"><div id="preview-content" class="article-content"></div></div>
            </div>
            <button type="button" id="toggle-preview-btn" class="btn-secondary" style="margin-top:5px;width:100%;">Toggle Preview</button>
          </div>

          <div class="form-group"><label>Category</label><input id="pcat" value="${post.category}"></div>
          <div class="form-group"><label>Tags</label><input id="ptags" value="${(post.tags||[]).join(',')}"></div>
          <button type="submit" class="btn-primary">Save</button> <button type="button" id="draft-btn" class="btn-secondary">Draft</button>
        </form>
      </div>`;
    
    // Icon
    const iconInput = document.getElementById('picon');
    const updateIcon = () => document.getElementById('icon-preview').innerHTML = renderIcon(iconInput.value || '📝');
    iconInput.addEventListener('input', updateIcon);
    document.getElementById('random-icon-btn').addEventListener('click', () => { iconInput.value = ['🚀','💡','🔥','✨','📝','📚','🎨','💻','🪐','🌊'][Math.floor(Math.random()*10)]; updateIcon(); });

    // >>> 裁剪逻辑 (Global Event Listeners) <<<
    let cropData = post.crop_data || null, isDrawing = false, startX, startY;
    const els = { btn: document.getElementById('crop-image-btn'), container: document.getElementById('crop-container'), wrapper: document.getElementById('crop-wrapper'), img: document.getElementById('crop-image'), box: document.getElementById('crop-box') };
    
    els.btn.addEventListener('click', () => { 
        const url = document.getElementById('pi').value; 
        if(!url) return UI.showToast('Input image URL first!', 'error'); 
        els.img.src = url; els.container.classList.remove('hidden'); els.box.style.display='none'; 
    });
    
    document.getElementById('cancel-crop-btn').addEventListener('click', () => els.container.classList.add('hidden'));

    // Mouse Down (on wrapper)
    els.wrapper.onmousedown = e => {
        e.preventDefault(); 
        isDrawing = true;
        const rect = els.img.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        
        els.box.style.left = startX + 'px';
        els.box.style.top = startY + 'px';
        els.box.style.width = '0px';
        els.box.style.height = '0px';
        els.box.style.display = 'block';
        
        // Bind Move/Up to Document (Global)
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const onMove = e => {
        if (!isDrawing) return;
        const rect = els.img.getBoundingClientRect();
        let currX = e.clientX - rect.left;
        let currY = e.clientY - rect.top;
        
        // Constraint to image bounds
        currX = Math.max(0, Math.min(currX, rect.width));
        currY = Math.max(0, Math.min(currY, rect.height));
        
        const width = Math.abs(currX - startX);
        const height = Math.abs(currY - startY);
        const left = Math.min(currX, startX);
        const top = Math.min(currY, startY);
        
        els.box.style.width = width + 'px';
        els.box.style.height = height + 'px';
        els.box.style.left = left + 'px';
        els.box.style.top = top + 'px';
    };

    const onUp = () => {
        isDrawing = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };

    document.getElementById('apply-crop-btn').addEventListener('click', () => { 
        // 简单保存一个相对比例，或者只是保存显示区域的坐标
        // 这里演示保存 CSS 坐标，用于列表页展示
        // 实际项目建议后端裁剪，纯前端只能 CSS Mask
        
        // 为了演示效果，我们保存一个模拟数据，用于首页列表的 object-position 计算
        // 注意：这只是一个近似值
        const rect = els.img.getBoundingClientRect();
        const box = els.box.getBoundingClientRect();
        
        // 计算缩放比例 (Natural / Rendered)
        const scale = els.img.naturalWidth / els.img.width;
        
        // 保存相对于 300px 高度容器的偏移量 (Mock Logic)
        // 实际我们保存 cropBox 的相对位置
        cropData = {
            // 记录截取区域相对于显示图片的百分比
            // 简单起见，我们保存 box 的 css 数据，并在列表页用绝对定位模拟遮罩
            left: -(parseFloat(els.box.style.left) || 0), 
            top: -(parseFloat(els.box.style.top) || 0),
            containerW: els.img.width, // 记录当时图片的显示宽度
            containerH: els.img.height
        };
        
        UI.showToast('Crop Applied!', 'success'); 
        els.container.classList.add('hidden');
    });

    const ta = document.getElementById('pc');
    ta.addEventListener('keydown', e => {
        if((e.ctrlKey||e.metaKey) && e.code==='KeyI') { e.preventDefault(); const s=ta.selectionStart; ta.setRangeText(`\n![Img](https://picsum.photos/seed/${Date.now()}/800/450)\n`,s,s,'end'); }
        if(e.key==='Tab') { e.preventDefault(); const s=ta.selectionStart, en=ta.selectionEnd; ta.setRangeText('    ',s,en,'end'); }
    });

    let mode = false;
    document.getElementById('toggle-preview-btn').addEventListener('click', () => { 
        mode = !mode; 
        document.getElementById('editor-pane').classList.toggle('split'); 
        document.getElementById('preview-pane').classList.toggle('hidden'); 
        if(mode) document.getElementById('preview-content').innerHTML = DOMPurify.sanitize(marked.parse(ta.value, { breaks: true, gfm: true })); 
    });

    const save = async (draft) => {
        const data = { title: document.getElementById('pt').value, content: ta.value, image: document.getElementById('pi').value, image_fit: document.getElementById('pfit').value, category: document.getElementById('pcat').value, tags: document.getElementById('ptags').value.split(',').filter(Boolean), crop_data: cropData, is_draft: draft, icon: iconInput.value };
        if(id) await postsService.updatePost(id, data); else await postsService.createPost(data);
        router.navigate('/admin'); UI.showToast(draft?'Draft Saved':'Published!', 'success');
    };
    document.getElementById('post-form').addEventListener('submit', e => { e.preventDefault(); save(false); });
    document.getElementById('draft-btn').addEventListener('click', () => save(true));
}
