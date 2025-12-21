// src/lib/views.js
import { postsService } from './posts.js';
import { commentsService } from './comments.js';
import { generateTOC, injectHeadingIds, renderTOC } from './toc.js';
import { authService } from './auth.js';

// --- 首页渲染 (保持不变) ---
export async function renderHome(APP, state, router) {
  state.posts = await postsService.getAllPosts();
  const categories = [...new Set(state.posts.map(p => p.category).filter(Boolean))];
  const tags = [...new Set(state.posts.flatMap(p => p.tags || []))];

  APP.innerHTML = `
    <div class="hero fade-in">
      <h1><span class="star-icon left">✦</span> Minimalist <span class="star-icon right">✦</span></h1>
      <p class="hero-subtitle">Ancient Wisdom, Modern Stories</p>
    </div>
    <div class="divider">✦ ✦ ✦</div>
    <div id="popular-posts-container"></div>
    <div class="search-scroll"><input type="search" id="search" placeholder="Seek the words within..."></div>
    <div class="filter-tags">
      <div class="wax-seal active" data-filter="all">All Manuscripts</div>
      ${categories.map(c => `<div class="wax-seal" data-filter="category:${c}">${c}</div>`).join('')}
      ${tags.map(t => `<div class="wax-seal" data-filter="tag:${t}">#${t}</div>`).join('')}
    </div>
    <div class="manuscripts" id="manuscripts"></div>
  `;

  const popularPosts = await postsService.getPopularPosts(5);
  if (popularPosts.length > 0) {
    document.getElementById('popular-posts-container').innerHTML = `
      <div class="popular-posts-section"><h2 class="section-title">🔥 Most Popular</h2><div class="popular-posts-list">${popularPosts.map((p, index) => `<div class="popular-post-item" data-post-id="${p.id}"><span class="popular-rank">#${index + 1}</span><div class="popular-post-info"><h4>${p.title}</h4><p class="popular-post-meta">${p.view_count || 0} views • ${p.category || 'Uncategorized'}</p></div></div>`).join('')}</div></div>`;
  }
  
  const renderList = () => {
      let filtered = state.posts;
      if (state.searchQuery) filtered = filtered.filter(p => p.title?.toLowerCase().includes(state.searchQuery) || p.content?.toLowerCase().includes(state.searchQuery));
      if (state.selectedCategory) filtered = filtered.filter(p => p.category === state.selectedCategory);
      if (state.selectedTag) filtered = filtered.filter(p => p.tags?.includes(state.selectedTag));

      const container = document.getElementById('manuscripts');
      if (!filtered.length) { container.innerHTML = '<div class="empty-scroll"><h3>No manuscripts found</h3></div>'; return; }

      container.innerHTML = filtered.map(p => `
        <div class="manuscript" data-post-id="${p.id}">
          <div class="manuscript-header"><h2 class="manuscript-title">${p.title}</h2><div class="manuscript-date">${new Date(p.created_at).toLocaleDateString('zh-CN')}</div></div>
          <div class="manuscript-meta"><span>✎ ${p.category || 'Uncategorized'}</span></div>
          ${p.image ? (p.crop_data ? `
            <div class="manuscript-image-container" style="width: 100%; margin: 15px 0;">
              <div style="position: relative; width: 100%; height: 300px; overflow: hidden; border: 4px solid var(--gold); box-shadow: inset 0 0 20px var(--shadow);">
                <img src="${p.image}" style="position: absolute; width: auto; height: auto; max-width: none; filter: sepia(0.2);"
                     onload="(function(img){
                        const container = img.parentElement;
                        const cropW = ${p.crop_data.width}, cropH = ${p.crop_data.height}, cropX = ${p.crop_data.x}, cropY = ${p.crop_data.y};
                        const scale = Math.max(container.offsetWidth / cropW, container.offsetHeight / cropH);
                        img.style.width = (img.naturalWidth * scale) + 'px';
                        img.style.height = (img.naturalHeight * scale) + 'px';
                        img.style.left = ((-cropX * scale) + (container.offsetWidth - cropW * scale) / 2) + 'px';
                        img.style.top = ((-cropY * scale) + (container.offsetHeight - cropH * scale) / 2) + 'px';
                     })(this)" loading="lazy">
              </div>
            </div>` : `<img src="${p.image}" class="manuscript-image" style="object-fit:${p.image_fit||'contain'};max-height:300px;" loading="lazy">`) : ''}
          <p class="manuscript-excerpt">${p.content?.substring(0, 150) || ''}...</p>
          <div class="manuscript-footer"><div class="manuscript-tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div><span>👁 ${p.view_count||0}</span></div>
        </div>
      `).join('');
  };
  renderList();

  document.getElementById('search').addEventListener('input', e => { state.searchQuery = e.target.value.toLowerCase(); renderList(); });
  document.querySelectorAll('.wax-seal').forEach(seal => seal.addEventListener('click', e => {
      document.querySelectorAll('.wax-seal').forEach(s => s.classList.remove('active')); e.target.classList.add('active');
      const f = e.target.dataset.filter;
      if(f==='all') {state.selectedCategory=null;state.selectedTag=null;}
      else if(f.startsWith('category:')) {state.selectedCategory=f.split(':')[1];state.selectedTag=null;}
      else if(f.startsWith('tag:')) {state.selectedTag=f.split(':')[1];state.selectedCategory=null;}
      renderList();
  }));
}

// --- 文章详情页渲染 (保持不变) ---
export async function renderPost(APP, id, router, updateMetaCallback) {
  const post = await postsService.getPostById(id);
  if (!post) { APP.innerHTML = '<div class="error">This manuscript has been lost...</div>'; return; }

  try {
      const key = `has_viewed_post_${id}`;
      if (!sessionStorage.getItem(key)) {
          const newViews = (post.view_count || 0) + 1;
          post.view_count = newViews; 
          sessionStorage.setItem(key, 'true');
          postsService.updatePost(id, { view_count: newViews }).catch(console.error);
      }
  } catch (e) { console.error(e); }

  const all = await postsService.getAllPosts();
  const pubs = all.filter(p => !p.is_draft);
  const idx = pubs.findIndex(p => p.id === id);
  const prev = idx < pubs.length - 1 ? pubs[idx + 1] : null;
  const next = idx > 0 ? pubs[idx - 1] : null;

  if (updateMetaCallback) updateMetaCallback(post);

  const charCount = post.content ? post.content.length : 0;
  const readTime = Math.max(1, Math.ceil(charCount / 400));
  const content = DOMPurify.sanitize(marked.parse(post.content || ''));
  const comments = await commentsService.getCommentsByPostId(id);

  APP.innerHTML = `
    <div id="reading-progress"></div>
    <div class="single-manuscript fade-in">
      <h1 class="single-title">${post.title}</h1>
      <div class="single-meta">
        <div>Scribed on ${new Date(post.created_at).toLocaleDateString('zh-CN')} • 👁 ${post.view_count} views</div>
        <div style="font-size:1rem;color:var(--gold);margin-top:5px;">📚 预计阅读 ${readTime} 分钟</div>
      </div>
      ${post.image ? (post.crop_data ? `
        <div class="single-image-container" style="width: 100%; max-width: 800px; margin: 40px auto; display: block;">
          <div style="position: relative; width: 100%; padding-bottom: ${(post.crop_data.height / post.crop_data.width * 100)}%; overflow: hidden; border: 6px solid var(--gold); box-shadow: 0 8px 24px var(--shadow);">
            <img src="${post.image}" style="position: absolute; left: ${-(post.crop_data.x / post.crop_data.width * 100)}%; top: ${-(post.crop_data.y / post.crop_data.height * 100)}%; width: auto; height: auto; max-width: none; filter: sepia(0.15);"
                 onload="(function(img){
                    const container = img.parentElement;
                    const cropW = ${post.crop_data.width}, cropH = ${post.crop_data.height}, cropX = ${post.crop_data.x}, cropY = ${post.crop_data.y};
                    const scale = container.offsetWidth / cropW;
                    img.style.width = (img.naturalWidth * scale) + 'px';
                    img.style.height = (img.naturalHeight * scale) + 'px';
                    img.style.left = (-cropX * scale) + 'px';
                    img.style.top = (-cropY * scale) + 'px';
                 })(this)" alt="${post.title}">
          </div>
        </div>` : `<img src="${post.image}" class="single-image" style="object-fit:${post.image_fit||'contain'};" alt="${post.title}">`) : ''}
      <div class="article-with-toc"><div id="toc-container"></div><article class="article-content" id="article-content">${content}</article></div>
    </div>
    <div class="post-navigation">
      ${prev ? `<a href="#" class="nav-post nav-prev" data-link="/post/${prev.id}"><span class="nav-label">← 上一篇</span><span class="nav-title">${prev.title}</span></a>` : '<div></div>'}
      ${next ? `<a href="#" class="nav-post nav-next" data-link="/post/${next.id}"><span class="nav-label">下一篇 →</span><span class="nav-title">${next.title}</span></a>` : '<div></div>'}
    </div>
    <div id="comments-section"><div class="divider">✦ Comments (${comments.length}) ✦</div>
      <div class="form-container"><h3 class="form-title" style="font-size:1.5rem">Leave a Comment</h3><form id="comment-form"><div class="form-group"><label>Name</label><input type="text" id="cn" required></div><div class="form-group"><label>Email</label><input type="email" id="ce" required></div><div class="form-group"><label>Comment</label><textarea id="cc" rows="4" style="min-height: 120px;" required></textarea></div><button type="submit" class="btn-primary">Post</button></form></div>
      <div id="comments-list"></div>
    </div>
  `;

  const headings = generateTOC(post.content);
  if (headings.length > 0) {
      document.getElementById('toc-container').innerHTML = renderTOC(headings);
      document.getElementById('article-content').innerHTML = injectHeadingIds(content);
      document.querySelectorAll('.toc-link').forEach(l => l.addEventListener('click', e => {
          e.preventDefault(); 
          document.getElementById(l.getAttribute('href').substring(1))?.scrollIntoView({behavior:'smooth'});
      }));
  }

  window.addEventListener('scroll', () => {
    if (headings.length > 0) {
        const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id]');
        const tocLinks = document.querySelectorAll('.toc-link');
        let activeIndex = 0;
        headingElements.forEach((heading, index) => { if (heading.getBoundingClientRect().top <= 100) activeIndex = index; });
        tocLinks.forEach((link, index) => { index === activeIndex ? link.classList.add('active') : link.classList.remove('active'); });
    }
  });

  const relatedPosts = await postsService.getRelatedPosts(id, post.tags, 3);
  if (relatedPosts.length > 0) {
    const relatedSection = document.createElement('div');
    relatedSection.className = 'related-posts-section';
    relatedSection.innerHTML = `<div class="divider">✦ Related Articles ✦</div><div class="related-posts-grid">${relatedPosts.map(p => `<div class="related-post-card" data-post-id="${p.id}">${p.image ? `<div class="related-post-image" style="background-image: url('${p.image}');"></div>` : ''}<div class="related-post-content"><h4>${p.title}</h4><p class="related-post-meta">${p.view_count || 0} views</p></div></div>`).join('')}</div>`;
    const commentsSection = document.getElementById('comments-section');
    commentsSection.parentNode.insertBefore(relatedSection, commentsSection);
  }

  renderCommentsList(comments);
  if (document.getElementById('comment-form')) {
    document.getElementById('comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await commentsService.createComment(id, document.getElementById('cn').value, document.getElementById('ce').value, document.getElementById('cc').value);
        router.route();
      } catch (error) { alert('Failed to post comment: ' + error.message); }
    });
  }
}

function renderCommentsList(comments) {
    const list = document.getElementById('comments-list');
    if(!comments.length) { list.innerHTML = '<p style="text-align:center;padding:40px;color:var(--sepia);">No comments yet.</p>'; return; }
    
    const renderTree = (c, d=0) => `
        <div style="margin-left:${d*40}px;margin-bottom:20px;" class="comment-item">
            <div class="manuscript" style="padding:20px;">
                <div style="color:var(--burgundy);font-weight:bold;">${c.author_name} <span style="font-weight:normal;color:var(--sepia);font-size:0.8em;">${new Date(c.created_at).toLocaleDateString()}</span></div>
                <p>${c.content}</p>
                <button class="btn-reply" data-cid="${c.id}" style="font-size:0.8em;background:none;border:1px solid var(--sepia);padding:2px 8px;cursor:pointer;">回复</button>
                <div id="reply-${c.id}" style="display:none;margin-top:10px;"><form class="reply-form" data-pid="${c.id}"><input placeholder="Name" class="rn" required><input placeholder="Email" class="re" required><textarea placeholder="Reply..." class="rc" style="min-height: 80px;" required></textarea><button type="submit">Send</button></form></div>
            </div>
            ${c.replies?.map(r => renderTree(r, d+1)).join('') || ''}
        </div>`;
    
    list.innerHTML = comments.map(c => renderTree(c)).join('');
    
    document.querySelectorAll('.btn-reply').forEach(b => b.addEventListener('click', e => {
        const f = document.getElementById(`reply-${e.target.dataset.cid}`);
        f.style.display = f.style.display === 'none' ? 'block' : 'none';
    }));
    document.querySelectorAll('.reply-form').forEach(f => f.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            await commentsService.createComment(window.location.pathname.split('/').pop(), f.querySelector('.rn').value, f.querySelector('.re').value, f.querySelector('.rc').value, f.dataset.pid);
            window.location.reload();
        } catch(err) { alert(err.message); }
    }));
}

export function renderLogin(APP, router) {
    APP.innerHTML = `<div class="form-container"><h2 class="form-title">Login</h2><form id="login-form"><input type="email" id="le" placeholder="Email" required><input type="password" id="lp" placeholder="Password" required><button type="submit" class="btn-primary" style="width:100%;margin-top:20px;">Sign In</button></form></div>`;
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        try {
            await authService.login(document.getElementById('le').value, document.getElementById('lp').value);
            router.navigate('/admin');
        } catch(err) { alert(err.message); }
    });
}

export async function renderAdmin(APP, router) {
    const posts = await postsService.getAllPosts();
    APP.innerHTML = `<div class="admin-header"><h2 class="admin-title">Scriptorium</h2><button class="btn-primary" data-link="/create">New</button></div><div class="admin-ledger">${posts.map(p => `<div class="ledger-entry"><div class="entry-info"><h3>${p.title} ${p.is_draft?'[Draft]':''}</h3><small>${new Date(p.created_at).toLocaleDateString()}</small></div><div><button class="btn-secondary" data-link="/edit/${p.id}">Edit</button> <button class="btn-danger" data-del="${p.id}">Del</button></div></div>`).join('')}</div>`;
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async e => {
        if(confirm('Delete?')) { await postsService.deletePost(e.target.dataset.del); router.route(); }
    }));
}

// --- >>> 升级版编辑器：支持代码样式 + 随机图片 + Tab键 <<< ---
export async function renderEditor(APP, id, router) {
    let post = { title: '', content: '', category: '', tags: [], image: '', image_fit: 'contain' };
    if(id) post = await postsService.getPostById(id);
    
    APP.innerHTML = `
      <div class="form-container">
        <div class="admin-header"><h2 class="admin-title">${id?'Revise':'New'} Post</h2><button class="btn-secondary" data-link="/admin">Cancel</button></div>
        <form id="post-form">
          <div class="form-group"><label>Title</label><input id="pt" value="${post.title}" required></div>
          <div class="form-group">
            <label>Image URL</label>
            <input id="pi" value="${post.image||''}">
            <button type="button" class="btn-secondary" id="crop-image-btn" style="margin-top:10px;">裁剪图片</button>
          </div>
          <div id="crop-container" class="image-crop-container hidden" style="overflow: auto;">
            <div style="padding:10px;background:#fff3cd;border:1px solid var(--gold);margin-bottom:15px;"><strong>📝 说明：</strong>在图片上按住鼠标拖动来框选区域</div>
            <div id="crop-wrapper" style="position:relative;display:inline-block; border:2px solid var(--gold);">
                <img id="crop-image" style="display:block; max-width: 100%; max-height: 60vh; width: auto; height: auto; cursor:crosshair; user-select:none;">
                <div id="crop-box" style="position:absolute; border:2px dashed #8B0000; box-shadow:0 0 0 9999px rgba(0,0,0,0.5); display:none; pointer-events:none; z-index:10;"></div>
            </div>
            <div class="crop-controls">
              <button type="button" class="btn-primary" id="apply-crop-btn">✓ 应用</button>
              <button type="button" class="btn-secondary" id="reset-crop-btn">↻ 重置</button>
              <button type="button" class="btn-secondary" id="cancel-crop-btn">✕ 取消</button>
            </div>
          </div>
          <div class="form-group"><label>Fit</label><select id="pfit"><option value="contain" ${post.image_fit==='contain'?'selected':''}>Full</option><option value="cover" ${post.image_fit==='cover'?'selected':''}>Cropped</option></select></div>
          
          <div class="form-group">
            <label style="display:flex; justify-content:space-between; align-items:center;">
                <span>Content (Markdown)</span>
                <div>
                    <span style="font-size:0.8rem; color:#888; margin-right:10px;">快捷键: Ctrl+I 插入随机图 | Tab 缩进</span>
                    <button type="button" id="insert-img-btn" class="btn-secondary" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;">🎲 Random Img</button>
                    <button type="button" id="toggle-preview-btn" class="btn-secondary" style="padding:4px 8px; font-size:0.8rem;">Switch View</button>
                </div>
            </label>
            <div class="editor-container">
                <div class="editor-pane" id="editor-pane">
                    <textarea id="pc" class="editor-textarea" required placeholder="Write your masterpiece here...">${post.content||''}</textarea>
                </div>
                <div class="preview-pane hidden" id="preview-pane"><div id="preview-content" class="article-content"></div></div>
            </div>
          </div>

          <div class="form-group"><label>Category</label><input id="pcat" value="${post.category}"></div>
          <div class="form-group"><label>Tags</label><input id="ptags" value="${(post.tags||[]).join(',')}"></div>
          <button type="submit" class="btn-primary">Save</button> <button type="button" id="draft-btn" class="btn-secondary">Draft</button>
        </form>
      </div>`;
    
    // --- 裁剪逻辑 ---
    let cropData = post.crop_data || null; 
    let isDrawing = false, hasSelection = false, startX = 0, startY = 0;
    const els = { btn: document.getElementById('crop-image-btn'), container: document.getElementById('crop-container'), wrapper: document.getElementById('crop-wrapper'), img: document.getElementById('crop-image'), box: document.getElementById('crop-box') };
    
    els.btn.addEventListener('click', () => { 
        const url = document.getElementById('pi').value; 
        if(!url) return alert('Input URL first'); 
        els.img.src = url; els.container.classList.remove('hidden'); els.box.style.display = 'none'; hasSelection = false; 
        els.img.onload = () => { 
            if(cropData) { 
                const scaleX = els.img.width / els.img.naturalWidth;
                const scaleY = els.img.height / els.img.naturalHeight;
                els.box.style.left = (cropData.x * scaleX)+'px'; 
                els.box.style.top = (cropData.y * scaleY)+'px'; 
                els.box.style.width = (cropData.width * scaleX)+'px'; 
                els.box.style.height = (cropData.height * scaleY)+'px'; 
                els.box.style.display = 'block'; 
                hasSelection = true; 
            } 
        }; 
    });

    els.wrapper.onmousedown = (e) => { 
        if(hasSelection) return; e.preventDefault(); isDrawing = true; 
        const rect = els.img.getBoundingClientRect(); 
        startX = e.clientX - rect.left; startY = e.clientY - rect.top; 
        els.box.style.left = startX+'px'; els.box.style.top = startY+'px'; els.box.style.width = '0px'; els.box.style.height = '0px'; els.box.style.display = 'block'; 
    };
    els.wrapper.onmousemove = (e) => { 
        if(!isDrawing) return; e.preventDefault(); 
        const rect = els.img.getBoundingClientRect(); 
        const curX = Math.max(0, Math.min(e.clientX - rect.left, els.img.width)); 
        const curY = Math.max(0, Math.min(e.clientY - rect.top, els.img.height)); 
        els.box.style.width = Math.abs(curX - startX)+'px'; els.box.style.height = Math.abs(curY - startY)+'px'; 
        els.box.style.left = (curX > startX ? startX : curX)+'px'; els.box.style.top = (curY > startY ? startY : curY)+'px'; 
    };
    els.wrapper.onmouseup = () => { isDrawing = false; if(parseFloat(els.box.style.width)>10) hasSelection = true; else els.box.style.display = 'none'; };
    
    document.getElementById('apply-crop-btn').addEventListener('click', () => { 
        if(!hasSelection) return alert('Please select area'); 
        const scaleX = els.img.naturalWidth / els.img.width;
        const scaleY = els.img.naturalHeight / els.img.height;
        cropData = { 
            x: Math.round(parseFloat(els.box.style.left) * scaleX), 
            y: Math.round(parseFloat(els.box.style.top) * scaleY), 
            width: Math.round(parseFloat(els.box.style.width) * scaleX), 
            height: Math.round(parseFloat(els.box.style.height) * scaleY) 
        };
        alert('Crop Saved!'); els.container.classList.add('hidden');
    });
    
    document.getElementById('reset-crop-btn').addEventListener('click', () => { els.box.style.display='none'; cropData=null; hasSelection=false; });
    document.getElementById('cancel-crop-btn').addEventListener('click', () => els.container.classList.add('hidden'));

    // --- >>> 核心功能：插入图片 & Tab 支持 <<< ---
    const ta = document.getElementById('pc');

    // 1. 插入随机图片逻辑
    const insertRandomImage = () => {
        const cursor = ta.selectionStart;
        const seed = Date.now();
        const imgMd = `\n![Random Image](https://picsum.photos/seed/${seed}/800/450)\n`;
        ta.setRangeText(imgMd, cursor, cursor, 'end'); // 使用 setRangeText 更安全
        ta.focus();
    };

    // 2. 绑定按钮
    document.getElementById('insert-img-btn').addEventListener('click', insertRandomImage);

    // 3. 绑定键盘事件 (Tab & Ctrl+I)
    ta.addEventListener('keydown', (e) => {
        // Ctrl+I (Windows) or Cmd+I (Mac)
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyI') {
            e.preventDefault();
            console.log('Ctrl+I detected, inserting image...');
            insertRandomImage();
        }
        
        // Tab 键 -> 插入 4 个空格
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            // 在光标处插入4个空格
            ta.setRangeText('    ', start, end, 'end');
        }
    });

    // 实时预览逻辑
    let mode = false, debounce;
    document.getElementById('toggle-preview-btn').addEventListener('click', (e) => { 
        mode = !mode; 
        e.target.textContent = mode ? 'Edit Mode' : 'Preview Mode'; 
        document.getElementById('editor-pane').classList.toggle('split'); 
        document.getElementById('preview-pane').classList.toggle('hidden'); 
        if(mode) document.getElementById('preview-content').innerHTML = DOMPurify.sanitize(marked.parse(ta.value)); 
    });
    ta.addEventListener('input', () => { 
        if(mode) {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                document.getElementById('preview-content').innerHTML = DOMPurify.sanitize(marked.parse(ta.value));
            }, 300);
        }
    });

    const save = async (draft) => {
        const data = { title: document.getElementById('pt').value, content: document.getElementById('pc').value, image: document.getElementById('pi').value, image_fit: document.getElementById('pfit').value, category: document.getElementById('pcat').value, tags: document.getElementById('ptags').value.split(',').filter(Boolean), crop_data: cropData, is_draft: draft };
        if(id) await postsService.updatePost(id, data); else await postsService.createPost(data);
        router.navigate('/admin');
    };
    document.getElementById('post-form').addEventListener('submit', e => { e.preventDefault(); save(false); });
    document.getElementById('draft-btn').addEventListener('click', () => save(true));
}
