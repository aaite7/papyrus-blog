import { authService } from './lib/auth.js';
import { postsService } from './lib/posts.js';
import { commentsService } from './lib/comments.js';
import { generateTOC, injectHeadingIds, renderTOC } from './lib/toc.js';

const APP = document.getElementById('app');

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
}

const state = {
  isAdmin: authService.isAuthenticated(),
  posts: [],
  searchQuery: '',
  selectedCategory: null,
  selectedTag: null,
  darkMode: localStorage.getItem('darkMode') !== null
    ? localStorage.getItem('darkMode') === 'true'
    : isNightTime()
};

// --- 样式注入：包含星星闪烁 + 下雪效果 ---
function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* 星星闪烁动画 */
    @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
    }
    .star-icon {
        display: inline-block;
        color: var(--gold);
        margin: 0 15px;
        font-size: 1.5rem;
        vertical-align: middle;
        animation: twinkle 3s infinite ease-in-out;
    }
    .star-icon.left { animation-delay: 0s; }
    .star-icon.right { animation-delay: 1.5s; }

    /* 下雪效果动画 */
    @keyframes snowfall {
        0% {
            transform: translateY(-10px) translateX(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(300px) translateX(20px) rotate(360deg);
            opacity: 0;
        }
    }
    
    /* 确保 Hero 区域可以关住雪花 */
    .hero {
        position: relative !important; 
        overflow: hidden !important;
    }

    .snowflake {
        position: absolute;
        top: -10px;
        background: white;
        border-radius: 50%;
        pointer-events: none; /* 让雪花不挡鼠标点击 */
        z-index: 1;
        box-shadow: 0 0 5px rgba(255,255,255,0.8);
    }
  `;
  document.head.appendChild(style);
}

// --- 日期检查逻辑：是否在冬季下雪期 ---
function isSnowSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; // JS月份是0-11，所以+1变1-12
    const day = now.getDate();

    // 逻辑：
    // 1. 如果是 12 月 (12月初开始) -> 开启
    // 2. 如果是 1 月 (全月) -> 开启
    // 3. 如果是 2 月，且日期小于等于 10 号 (2月初结束) -> 开启
    if (month === 12) return true;
    if (month === 1) return true;
    if (month === 2 && day <= 10) return true; // 这里控制2月几号结束，目前是10号

    return false;
}

// --- 下雪逻辑：只在 Hero 区域下雪 + 日期限制 ---
function initSnowEffect() {
    // 第一步：先检查日期，如果不是冬天，直接退出，不生成雪花
    if (!isSnowSeason()) {
        console.log('Not snow season yet. Winter is coming...');
        return; 
    }

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // 清除可能存在的旧定时器，防止重复
    if (window.snowInterval) clearInterval(window.snowInterval);

    window.snowInterval = setInterval(() => {
        // 如果页面切换了，找不到 hero 了，就停止下雪
        if (!document.querySelector('.hero')) {
            clearInterval(window.snowInterval);
            return;
        }

        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        
        // 随机大小
        const size = Math.random() * 4 + 2 + 'px'; // 2px 到 6px
        snowflake.style.width = size;
        snowflake.style.height = size;

        // 随机水平位置
        snowflake.style.left = Math.random() * 100 + '%';

        // 随机动画时长 (越慢看起来越飘逸)
        const duration = Math.random() * 5 + 5 + 's'; // 5s 到 10s
        snowflake.style.animation = `snowfall ${duration} linear forwards`;

        // 稍微透明一点，更有质感
        snowflake.style.opacity = Math.random() * 0.5 + 0.3;

        heroSection.appendChild(snowflake);

        // 动画结束后移除元素
        setTimeout(() => {
            snowflake.remove();
        }, 10000); 

    }, 300); // 每300毫秒生成一片雪花
}

function updateAuthUI() {
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');
  const clockDisplay = document.getElementById('clock-display');
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  if (state.isAdmin) {
    adminLink.textContent = 'Scriptorium';
    logoutBtn.classList.remove('hidden');
  } else {
    adminLink.textContent = 'Scribe';
    logoutBtn.classList.add('hidden');
  }

  updateClock();
  setInterval(updateClock, 1000);

  if (state.darkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀';
  } else {
    document.body.classList.remove('dark-mode');
    darkModeToggle.textContent = '☾';
  }
}

function updateClock() {
  const clockDisplay = document.getElementById('clock-display');
  if (!clockDisplay) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  clockDisplay.innerHTML = `
    <div style="font-size: 1rem; font-weight: 600;">${timeStr}</div>
    <div style="font-size: 0.85rem; opacity: 0.8;">${dateStr}</div>
  `;
}

const router = {
  init() {
    window.addEventListener('popstate', () => this.route());
    document.body.addEventListener('click', e => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        this.navigate(link.dataset.link || link.getAttribute('href'));
      }
      if (e.target.id === 'logout-btn') {
        e.preventDefault();
        handleLogout();
      }
      if (e.target.id === 'dark-mode-toggle') {
        e.preventDefault();
        toggleDarkMode();
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

    // 切换页面时，清除之前的雪花定时器，避免内存泄漏
    if (window.snowInterval) {
        clearInterval(window.snowInterval);
        window.snowInterval = null;
    }

    try {
      if (path === '/') await renderHome();
      else if (path === '/login') renderLogin();
      else if (path === '/admin') state.isAdmin ? await renderAdmin() : this.navigate('/login');
      else if (path === '/create') state.isAdmin ? renderEditor() : this.navigate('/login');
      else if (path.startsWith('/edit/')) state.isAdmin ? await renderEditor(path.split('/edit/')[1]) : this.navigate('/login');
      else if (path.startsWith('/post/')) await renderPost(path.split('/post/')[1]);
      else APP.innerHTML = '<div class="error">This scroll has been lost to time...</div>';
    } catch (e) {
      APP.innerHTML = `<div class="error">Error: ${e.message}</div>`;
      console.error(e);
    }
  }
};

async function renderHome() {
  state.posts = await postsService.getAllPosts();

  const categories = [...new Set(state.posts.map(p => p.category).filter(Boolean))];
  const tags = [...new Set(state.posts.flatMap(p => p.tags || []))];

  // --- 首页结构 ---
  APP.innerHTML = `
    <div class="hero fade-in">
      <h1>
        <span class="star-icon left">✦</span>
        Minimalist
        <span class="star-icon right">✦</span>
      </h1>
      <p class="hero-subtitle">Ancient Wisdom, Modern Stories</p>
    </div>

    <div class="divider">✦ ✦ ✦</div>

    <div id="popular-posts-container"></div>

    <div class="search-scroll">
      <input type="search" id="search" placeholder="Seek the words within...">
    </div>

    <div class="filter-tags">
      <div class="wax-seal active" data-filter="all">All Manuscripts</div>
      ${categories.map(c => `<div class="wax-seal" data-filter="category:${c}">${c}</div>`).join('')}
      ${tags.map(t => `<div class="wax-seal" data-filter="tag:${t}">#${t}</div>`).join('')}
    </div>

    <div class="manuscripts" id="manuscripts"></div>
  `;

  // --- 关键点：渲染完首页HTML后，启动下雪（带季节检查） ---
  setTimeout(initSnowEffect, 100); 

  const popularPosts = await postsService.getPopularPosts(5);
  if (popularPosts.length > 0) {
    const popularContainer = document.getElementById('popular-posts-container');
    popularContainer.innerHTML = `
      <div class="popular-posts-section">
        <h2 class="section-title">🔥 Most Popular</h2>
        <div class="popular-posts-list">
          ${popularPosts.map((p, index) => `
            <div class="popular-post-item" data-post-id="${p.id}">
              <span class="popular-rank">#${index + 1}</span>
              <div class="popular-post-info">
                <h4>${p.title}</h4>
                <p class="popular-post-meta">${p.view_count || 0} views • ${p.category || 'Uncategorized'}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderPosts();

  document.getElementById('search').addEventListener('input', e => {
    state.searchQuery = e.target.value.toLowerCase();
    renderPosts();
  });

  document.querySelectorAll('.wax-seal').forEach(seal => {
    seal.addEventListener('click', e => {
      document.querySelectorAll('.wax-seal').forEach(s => s.classList.remove('active'));
      e.target.classList.add('active');
      const filter = e.target.dataset.filter;
      if (filter === 'all') {
        state.selectedCategory = null;
        state.selectedTag = null;
      } else if (filter.startsWith('category:')) {
        state.selectedCategory = filter.split(':')[1];
        state.selectedTag = null;
      } else if (filter.startsWith('tag:')) {
        state.selectedTag = filter.split(':')[1];
        state.selectedCategory = null;
      }
      renderPosts();
    });
  });
}

function renderPosts() {
  let filtered = state.posts;

  if (state.searchQuery) {
    filtered = filtered.filter(p =>
      p.title?.toLowerCase().includes(state.searchQuery) ||
      p.content?.toLowerCase().includes(state.searchQuery)
    );
  }

  if (state.selectedCategory) {
    filtered = filtered.filter(p => p.category === state.selectedCategory);
  }

  if (state.selectedTag) {
    filtered = filtered.filter(p => p.tags?.includes(state.selectedTag));
  }

  const container = document.getElementById('manuscripts');

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-scroll"><h3>No manuscripts found</h3><p>Perhaps the words you seek have not yet been written...</p></div>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const excerpt = p.content?.substring(0, 150) + '...' || 'No content available';
    const formattedDate = new Date(p.created_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="manuscript" data-post-id="${p.id}">
        <div class="manuscript-header">
          <h2 class="manuscript-title">${p.title}</h2>
          <div class="manuscript-date">${formattedDate}</div>
        </div>
        <div class="manuscript-meta">
          <span>✎ ${p.category || 'Uncategorized'}</span>
        </div>
        ${p.image ? (p.crop_data ? `
          <div class="manuscript-image-container" style="width: 100%; margin: 15px 0;">
            <div style="position: relative; width: 100%; height: 300px; overflow: hidden; border: 4px solid var(--gold); box-shadow: inset 0 0 20px var(--shadow);">
              <img src="${p.image}"
                   style="position: absolute;
                          width: auto;
                          height: auto;
                          max-width: none;
                          filter: sepia(0.2);"
                   onload="(function(img){
                      const container = img.parentElement;
                      const cropW = ${p.crop_data.width};
                      const cropH = ${p.crop_data.height};
                      const cropX = ${p.crop_data.x};
                      const cropY = ${p.crop_data.y};
                      const containerW = container.offsetWidth;
                      const containerH = container.offsetHeight;
                      const scaleW = containerW / cropW;
                      const scaleH = containerH / cropH;
                      const scale = Math.max(scaleW, scaleH);
                      const scaledWidth = img.naturalWidth * scale;
                      const scaledHeight = img.naturalHeight * scale;
                      const scaledCropX = cropX * scale;
                      const scaledCropY = cropY * scale;
                      const scaledCropW = cropW * scale;
                      const scaledCropH = cropH * scale;
                      const centerX = (containerW - scaledCropW) / 2;
                      const centerY = (containerH - scaledCropH) / 2;
                      img.style.width = scaledWidth + 'px';
                      img.style.height = scaledHeight + 'px';
                      img.style.left = (-scaledCropX + centerX) + 'px';
                      img.style.top = (-scaledCropY + centerY) + 'px';
                   })(this)"
                   alt="${p.title}"
                   loading="lazy">
            </div>
          </div>
        ` : `<img src="${p.image}" class="manuscript-image" style="object-fit: ${p.image_fit || 'contain'};" alt="${p.title}" loading="lazy">`) : ''}
        <p class="manuscript-excerpt">${excerpt}</p>
        <div class="manuscript-footer">
          <div class="manuscript-tags">
            ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          <div class="manuscript-stats">
            <span>👁 ${p.view_count || 0}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function renderPost(id) {
  const post = await postsService.getPostById(id);

  if (!post) {
    APP.innerHTML = '<div class="error">This manuscript has been lost...</div>';
    return;
  }

  const allPosts = await postsService.getAllPosts();
  const publishedPosts = allPosts.filter(p => !p.is_draft);
  const currentIndex = publishedPosts.findIndex(p => p.id === id);
  const prevPost = currentIndex < publishedPosts.length - 1 ? publishedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : null;

  updatePageMeta(post);

  const formattedDate = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = DOMPurify.sanitize(marked.parse(post.content || ''));
  const comments = await commentsService.getCommentsByPostId(id);

  APP.innerHTML = `
    <div class="single-manuscript fade-in">
      <h1 class="single-title">${post.title}</h1>
      <div class="single-meta">
        <div class="single-meta-line">
          Scribed on ${formattedDate} • 👁 ${post.view_count || 0} views
        </div>
      </div>
      ${post.image ? (post.crop_data ? `
        <div class="single-image-container" style="width: 100%; max-width: 800px; margin: 40px auto; display: block;">
          <div style="position: relative; width: 100%; padding-bottom: ${(post.crop_data.height / post.crop_data.width * 100)}%; overflow: hidden; border: 6px solid var(--gold); box-shadow: 0 8px 24px var(--shadow);">
            <img src="${post.image}"
                 style="position: absolute;
                        left: ${-(post.crop_data.x / post.crop_data.width * 100)}%;
                        top: ${-(post.crop_data.y / post.crop_data.height * 100)}%;
                        width: auto;
                        height: auto;
                        max-width: none;
                        filter: sepia(0.15);"
                 onload="(function(img){
                    const container = img.parentElement;
                    const cropW = ${post.crop_data.width};
                    const cropH = ${post.crop_data.height};
                    const cropX = ${post.crop_data.x};
                    const cropY = ${post.crop_data.y};
                    const scale = container.offsetWidth / cropW;
                    img.style.width = (img.naturalWidth * scale) + 'px';
                    img.style.height = (img.naturalHeight * scale) + 'px';
                    img.style.left = (-cropX * scale) + 'px';
                    img.style.top = (-cropY * scale) + 'px';
                 })(this)"
                 alt="${post.title}">
          </div>
        </div>
      ` : `<img src="${post.image}" class="single-image" style="object-fit: ${post.image_fit || 'contain'};" alt="${post.title}">`) : ''}

      <div class="article-with-toc">
        <div id="toc-container"></div>
        <article class="article-content" id="article-content">${content}</article>
      </div>
    </div>

    <div class="post-navigation">
      ${prevPost ? `
        <a href="/post/${prevPost.id}" class="nav-post nav-prev" data-link="/post/${prevPost.id}">
          <span class="nav-label">← 上一篇</span>
          <span class="nav-title">${prevPost.title}</span>
        </a>
      ` : '<div></div>'}
      ${nextPost ? `
        <a href="/post/${nextPost.id}" class="nav-post nav-next" data-link="/post/${nextPost.id}">
          <span class="nav-label">下一篇 →</span>
          <span class="nav-title">${nextPost.title}</span>
        </a>
      ` : '<div></div>'}
    </div>

    <div id="comments-section" style="margin-top: 60px;">
      <div class="divider">✦ Comments (${comments.length}) ✦</div>

      <div class="form-container" style="margin-bottom: 40px;">
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.8rem; color: var(--burgundy); margin-bottom: 20px; text-align: center;">Leave a Comment</h3>
        <form id="comment-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="comment-name" required>
          </div>
          <div class="form-group">
            <label>Email (not displayed publicly)</label>
            <input type="email" id="comment-email" required>
          </div>
          <div class="form-group">
            <label>Comment</label>
            <textarea id="comment-content" rows="1" required></textarea>
          </div>
          <button type="submit" class="btn-primary">Post Comment</button>
        </form>
      </div>

      <div id="comments-list"></div>
    </div>
  `;

  const headings = generateTOC(post.content);
  if (headings.length > 0) {
    const tocContainer = document.getElementById('toc-container');
    tocContainer.innerHTML = renderTOC(headings);

    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = injectHeadingIds(content);

    document.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    window.addEventListener('scroll', () => {
      const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id]');
      const tocLinks = document.querySelectorAll('.toc-link');

      let activeIndex = 0;
      headingElements.forEach((heading, index) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          activeIndex = index;
        }
      });

      tocLinks.forEach((link, index) => {
        if (index === activeIndex) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    });
  }

  const relatedPosts = await postsService.getRelatedPosts(id, post.tags, 3);
  if (relatedPosts.length > 0) {
    const relatedSection = document.createElement('div');
    relatedSection.className = 'related-posts-section';
    relatedSection.innerHTML = `
      <div class="divider">✦ Related Articles ✦</div>
      <div class="related-posts-grid">
        ${relatedPosts.map(p => `
          <div class="related-post-card" data-post-id="${p.id}">
            ${p.image ? `
              <div class="related-post-image" style="background-image: url('${p.image}');"></div>
            ` : ''}
            <div class="related-post-content">
              <h4>${p.title}</h4>
              <p class="related-post-meta">${p.view_count || 0} views</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const commentsSection = document.getElementById('comments-section');
    commentsSection.parentNode.insertBefore(relatedSection, commentsSection);
  }

  renderComments(comments);

  const commentForm = document.getElementById('comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('comment-name').value;
      const email = document.getElementById('comment-email').value;
      const content = document.getElementById('comment-content').value;

      try {
        await commentsService.createComment(id, name, email, content);
        router.route();
      } catch (error) {
        alert('Failed to post comment: ' + error.message);
      }
    });
  }
}

function renderComments(comments) {
  const commentsList = document.getElementById('comments-list');

  if (!comments.length) {
    commentsList.innerHTML = '<p style="text-align: center; color: var(--sepia); font-style: italic; padding: 40px 0;">No comments yet. Be the first to share your thoughts!</p>';
    return;
  }

  function renderCommentTree(comment, depth = 0) {
    const formattedDate = new Date(comment.created_at).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const marginLeft = depth > 0 ? 'margin-left: 40px;' : '';
    const replyBtn = '<button class="btn-reply" data-comment-id="' + comment.id + '" style="margin-top: 10px; padding: 6px 12px; font-size: 0.85rem; background: var(--parchment); border: 1px solid var(--gold); color: var(--burgundy); cursor: pointer; border-radius: 3px; font-family: \'Lora\', serif;">回复</button>';

    let html = `
      <div class="comment-item" style="${marginLeft} margin-bottom: 20px;">
        <div class="manuscript" style="padding: 24px;">
          <div class="manuscript-meta" style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: var(--burgundy);">👤 ${comment.author_name}</span>
            <span style="opacity: 0.7;">${formattedDate}</span>
          </div>
          <p style="line-height: 1.8; color: var(--ink);">${comment.content}</p>
          ${replyBtn}
          <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none; margin-top: 15px; padding: 15px; background: rgba(255, 250, 240, 0.5); border: 1px solid var(--gold); border-radius: 4px;">
            <h4 style="margin-bottom: 10px; font-size: 1rem; color: var(--burgundy);">回复 ${comment.author_name}</h4>
            <form class="reply-form" data-parent-id="${comment.id}">
              <input type="text" class="reply-name" placeholder="姓名" required style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--sepia); font-family: 'Lora', serif;">
              <input type="email" class="reply-email" placeholder="邮箱" required style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--sepia); font-family: 'Lora', serif;">
              <textarea class="reply-content" placeholder="写下你的回复..." required rows="1" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid var(--sepia); font-family: 'Lora', serif; resize: vertical;"></textarea>
              <div style="display: flex; gap: 8px;">
                <button type="submit" class="btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">发送回复</button>
                <button type="button" class="btn-cancel-reply" style="padding: 8px 16px; font-size: 0.9rem; background: #ccc; border: none; color: #333; cursor: pointer; border-radius: 4px; font-family: 'Lora', serif;">取消</button>
              </div>
            </form>
          </div>
        </div>
    `;

    if (comment.replies && comment.replies.length > 0) {
      html += '<div class="comment-replies">';
      comment.replies.forEach(reply => {
        html += renderCommentTree(reply, depth + 1);
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  commentsList.innerHTML = comments.map(c => renderCommentTree(c)).join('');

  document.querySelectorAll('.btn-reply').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const commentId = e.target.dataset.commentId;
      const replyForm = document.getElementById(`reply-form-${commentId}`);

      document.querySelectorAll('.reply-form-container').forEach(form => {
        if (form.id !== `reply-form-${commentId}`) {
          form.style.display = 'none';
        }
      });

      replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
    });
  });

  document.querySelectorAll('.btn-cancel-reply').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const form = e.target.closest('.reply-form-container');
      form.style.display = 'none';
    });
  });

  document.querySelectorAll('.reply-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const parentId = form.dataset.parentId;
      const name = form.querySelector('.reply-name').value;
      const email = form.querySelector('.reply-email').value;
      const content = form.querySelector('.reply-content').value;

      const postId = window.location.pathname.split('/').pop();

      try {
        await commentsService.createComment(postId, name, email, content, parentId);
        router.route();
      } catch (error) {
        alert('Failed to post reply: ' + error.message);
      }
    });
  });
}

function updatePageMeta(post) {
  document.title = `${post.title} - Minimalist`;

  const description = post.content?.substring(0, 160) || 'Read this post on Minimalist blog';

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description;

  updateOGTags(post, description);
}

function renderLogin() {
  APP.innerHTML = `
    <div class="form-container fade-in">
      <h2 class="form-title">Enter the Scriptorium</h2>
      <form id="login-form">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" required>
        </div>
        <button type="submit" class="btn-primary" style="width: 100%;">Sign In</button>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      authService.login(email, password);
      state.isAdmin = true;
      updateAuthUI();
      router.navigate('/admin');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  });
}

async function renderAdmin() {
  const posts = await postsService.getAllPosts();

  APP.innerHTML = `
    <div class="admin-header">
      <h2 class="admin-title">The Scriptorium</h2>
      <button class="btn-primary" data-link="/create">✎ Inscribe New</button>
    </div>
    <div class="admin-ledger">
      ${posts.map(p => {
        const formattedDate = new Date(p.created_at).toLocaleDateString('zh-CN');
        const pinnedBadge = p.is_pinned ? '<span style="color: var(--gold); margin-left: 8px;">📌</span>' : '';
        const draftBadge = p.is_draft ? '<span style="color: #999; margin-left: 8px; font-size: 0.85em;">[草稿]</span>' : '';
        return `
          <div class="ledger-entry">
            <div class="entry-info">
              <h3>${p.title}${pinnedBadge}${draftBadge}</h3>
              <div class="entry-meta">
                ${formattedDate} • ${p.view_count || 0} views
              </div>
            </div>
            <div class="entry-actions">
              ${p.is_draft ? `<button class="btn-primary" data-publish="${p.id}">发布</button>` : ''}
              <button class="btn-secondary" data-pin="${p.id}" data-pinned="${p.is_pinned ? 'true' : 'false'}">
                ${p.is_pinned ? '取消置顶' : '置顶'}
              </button>
              <button class="btn-secondary" data-link="/edit/${p.id}">Revise</button>
              <button class="btn-danger" data-delete="${p.id}">Destroy</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('Delete this post forever?')) return;
      try {
        await postsService.deletePost(e.target.dataset.delete);
        router.route();
      } catch (error) {
        alert('Failed to delete post: ' + error.message);
      }
    });
  });

  document.querySelectorAll('[data-pin]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postId = e.target.dataset.pin;
      const isPinned = e.target.dataset.pinned === 'true';
      try {
        await postsService.togglePin(postId, !isPinned);
        router.route();
      } catch (error) {
        alert('Failed to toggle pin: ' + error.message);
      }
    });
  });

  document.querySelectorAll('[data-publish]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const postId = e.target.dataset.publish;
      try {
        await postsService.publishDraft(postId);
        router.route();
      } catch (error) {
        alert('Failed to publish draft: ' + error.message);
      }
    });
  });
}

async function renderEditor(id = null) {
  let post = {
    title: '',
    content: '',
    category: 'Thoughts',
    tags: [],
    image: '',
    image_fit: 'contain'
  };

  if (id) {
    post = await postsService.getPostById(id);
    if (!post) {
      router.navigate('/admin');
      return;
    }
  }

  APP.innerHTML = `
    <div class="form-container">
      <div class="admin-header">
        <h2 class="admin-title">${id ? 'Revise Manuscript' : 'New Manuscript'}</h2>
        <button class="btn-secondary" data-link="/admin">Cancel</button>
      </div>
      <form id="post-form">
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="title" value="${post.title}" required>
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <input type="url" id="image" value="${post.image || ''}">
          <button type="button" class="btn-secondary" id="crop-image-btn" style="margin-top: 10px;">裁剪图片</button>
        </div>
        <div id="crop-container" class="image-crop-container hidden">
          <div id="crop-status" style="padding: 10px; background: #fff3cd; border: 1px solid var(--gold); margin-bottom: 15px; border-radius: 4px; font-family: 'Lora', serif;">
            <strong>📝 使用说明：</strong>在图片上按住鼠标左键拖动，框选你想要的区域
          </div>
          <div id="crop-wrapper" style="position: relative; display: inline-block; max-width: 100%; border: 2px solid var(--gold); user-select: none;">
            <img id="crop-image" style="max-width: 100%; display: block; cursor: crosshair; user-select: none;">
            <div id="crop-box" style="position: absolute; border: 3px dashed #8B0000; background: rgba(139, 0, 0, 0.2); display: none; pointer-events: none; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5); z-index: 10;"></div>
          </div>
          <div class="crop-controls">
            <button type="button" class="btn-primary" id="apply-crop-btn">✓ 应用裁剪</button>
            <button type="button" class="btn-secondary" id="reset-crop-btn">↻ 重置</button>
            <button type="button" class="btn-secondary" id="cancel-crop-btn">✕ 取消</button>
          </div>
        </div>
        <div class="form-group">
          <label>Image Display Mode</label>
          <select id="image-fit">
            <option value="contain" ${post.image_fit === 'contain' ? 'selected' : ''}>Full Image (完整显示)</option>
            <option value="cover" ${post.image_fit === 'cover' ? 'selected' : ''}>Cropped (裁剪填充)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" id="category" value="${post.category}" list="categories">
          <datalist id="categories">
            <option value="Thoughts">
            <option value="Stories">
            <option value="Poetry">
            <option value="Journal">
            <option value="Philosophy">
          </datalist>
        </div>
        <div class="form-group">
          <label>Tags (separated by commas)</label>
          <input type="text" id="tags" value="${(post.tags || []).join(', ')}">
        </div>
        <div class="form-group">
          <label style="display: flex; justify-content: space-between; align-items: center;">
            <span>Content (Markdown supported)</span>
            <button type="button" id="toggle-preview-btn" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;">切换预览</button>
          </label>
          <div class="editor-container">
            <div class="editor-pane" id="editor-pane">
              <textarea id="content" required>${post.content || ''}</textarea>
            </div>
            <div class="preview-pane hidden" id="preview-pane">
              <div id="preview-content" class="article-content"></div>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" class="btn-primary">${id ? 'Update' : 'Create'} Post</button>
          <button type="button" id="save-draft-btn" class="btn-secondary">保存为草稿</button>
        </div>
      </form>
    </div>
  `;

  let cropData = post.crop_data || null;
  let isDrawing = false;
  let hasSelection = false;
  let startX = 0;
  let startY = 0;

  const cropImageBtn = document.getElementById('crop-image-btn');
  const cropContainer = document.getElementById('crop-container');
  const cropWrapper = document.getElementById('crop-wrapper');
  const cropImage = document.getElementById('crop-image');
  const cropBox = document.getElementById('crop-box');
  const applyCropBtn = document.getElementById('apply-crop-btn');
  const resetCropBtn = document.getElementById('reset-crop-btn');
  const cancelCropBtn = document.getElementById('cancel-crop-btn');

  cropImageBtn.addEventListener('click', () => {
    const imageUrl = document.getElementById('image').value;
    if (!imageUrl) {
      alert('请先输入图片URL');
      return;
    }

    cropImage.src = imageUrl;
    cropContainer.classList.remove('hidden');
    cropBox.style.display = 'none';
    hasSelection = false;

    cropImage.onload = () => {
      if (cropData) {
        const img = cropImage;
        const scaleX = img.width / cropData.width;
        const scaleY = img.height / cropData.height;

        cropBox.style.left = (cropData.x * scaleX) + 'px';
        cropBox.style.top = (cropData.y * scaleY) + 'px';
        cropBox.style.width = (cropData.width * scaleX) + 'px';
        cropBox.style.height = (cropData.height * scaleY) + 'px';
        cropBox.style.display = 'block';
        hasSelection = true;
      }
    };

    cropImage.onerror = () => {
      alert('图片加载失败，请检查URL是否正确');
    };
  });

  cropWrapper.onmousedown = (e) => {
    if (hasSelection) {
      console.log('Selection already locked, click reset to redraw');
      return;
    }

    e.preventDefault();
    isDrawing = true;

    const rect = cropImage.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    cropBox.style.left = startX + 'px';
    cropBox.style.top = startY + 'px';
    cropBox.style.width = '0px';
    cropBox.style.height = '0px';
    cropBox.style.display = 'block';

    console.log('✓ Started drawing at:', startX, startY);
  };

  cropWrapper.onmousemove = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    const rect = cropImage.getBoundingClientRect();
    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;

    currentX = Math.max(0, Math.min(currentX, cropImage.width));
    currentY = Math.max(0, Math.min(currentY, cropImage.height));

    const width = currentX - startX;
    const height = currentY - startY;

    if (width > 0) {
      cropBox.style.left = startX + 'px';
      cropBox.style.width = width + 'px';
    } else {
      cropBox.style.left = currentX + 'px';
      cropBox.style.width = Math.abs(width) + 'px';
    }

    if (height > 0) {
      cropBox.style.top = startY + 'px';
      cropBox.style.height = height + 'px';
    } else {
      cropBox.style.top = currentY + 'px';
      cropBox.style.height = Math.abs(height) + 'px';
    }
  };

  cropWrapper.onmouseup = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    const boxWidth = parseFloat(cropBox.style.width) || 0;
    const boxHeight = parseFloat(cropBox.style.height) || 0;

    if (boxWidth > 10 && boxHeight > 10) {
      hasSelection = true;
      console.log('✓ Selection locked! Dimensions:', {
        left: cropBox.style.left,
        top: cropBox.style.top,
        width: cropBox.style.width,
        height: cropBox.style.height
      });
    } else {
      cropBox.style.display = 'none';
      console.log('✗ Selection too small, try again');
    }

    isDrawing = false;
  };

  cropWrapper.onmouseleave = () => {
    if (isDrawing) {
      const boxWidth = parseFloat(cropBox.style.width) || 0;
      const boxHeight = parseFloat(cropBox.style.height) || 0;
      if (boxWidth > 10 && boxHeight > 10) {
        hasSelection = true;
      }
      isDrawing = false;
    }
  };

  applyCropBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const boxLeft = parseFloat(cropBox.style.left) || 0;
    const boxTop = parseFloat(cropBox.style.top) || 0;
    const boxWidth = parseFloat(cropBox.style.width) || 0;
    const boxHeight = parseFloat(cropBox.style.height) || 0;

    console.log('Crop box dimensions:', { boxLeft, boxTop, boxWidth, boxHeight });

    if (boxWidth < 10 || boxHeight < 10) {
      alert('请先在图片上框选裁剪区域（拖动鼠标画框）');
      return;
    }

    const img = cropImage;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const displayWidth = img.width;
    const displayHeight = img.height;

    console.log('Image dimensions:', {
      natural: { width: naturalWidth, height: naturalHeight },
      display: { width: displayWidth, height: displayHeight }
    });

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    cropData = {
      x: Math.round(boxLeft * scaleX),
      y: Math.round(boxTop * scaleY),
      width: Math.round(boxWidth * scaleX),
      height: Math.round(boxHeight * scaleY)
    };

    console.log('Crop data saved:', cropData);
    alert('✓ 裁剪区域已保存！\n\n现在点击"保存文章"按钮来保存这篇文章和裁剪设置。');
    cropContainer.classList.add('hidden');
  });

  resetCropBtn.addEventListener('click', (e) => {
    e.preventDefault();
    cropBox.style.display = 'none';
    cropData = null;
    hasSelection = false;
    console.log('Selection reset, you can draw again');
  });

  cancelCropBtn.addEventListener('click', (e) => {
    e.preventDefault();
    cropContainer.classList.add('hidden');
    isDrawing = false;
    hasSelection = false;
    cropBox.style.display = 'none';
  });

  const collectFormData = () => {
    const imageValue = document.getElementById('image').value;
    return {
      title: document.getElementById('title').value,
      content: document.getElementById('content').value,
      category: document.getElementById('category').value,
      tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean),
      image: imageValue.trim() || null,
      image_fit: document.getElementById('image-fit').value,
      crop_data: cropData
    };
  };

  document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const postData = { ...collectFormData(), is_draft: false };
    console.log('Submitting post data with crop_data:', postData);

    try {
      if (id) {
        await postsService.updatePost(id, postData);
      } else {
        await postsService.createPost(postData);
      }
      router.navigate('/admin');
    } catch (error) {
      alert('Failed to save post: ' + error.message);
    }
  });

  document.getElementById('save-draft-btn').addEventListener('click', async (e) => {
    e.preventDefault();

    const postData = { ...collectFormData(), is_draft: true };

    try {
      if (id) {
        await postsService.updatePost(id, postData);
      } else {
        await postsService.saveDraft(postData);
      }
      router.navigate('/admin');
    } catch (error) {
      alert('Failed to save draft: ' + error.message);
    }
  });

  const contentTextarea = document.getElementById('content');
  const previewContent = document.getElementById('preview-content');
  const previewPane = document.getElementById('preview-pane');
  const editorPane = document.getElementById('editor-pane');
  const togglePreviewBtn = document.getElementById('toggle-preview-btn');
  let previewMode = false;

  function updatePreview() {
    if (typeof marked !== 'undefined') {
      const markdown = contentTextarea.value;
      const html = marked.parse(markdown);
      previewContent.innerHTML = DOMPurify.sanitize(html);
    }
  }

  togglePreviewBtn.addEventListener('click', () => {
    previewMode = !previewMode;
    if (previewMode) {
      updatePreview();
      editorPane.classList.add('split');
      previewPane.classList.remove('hidden');
      togglePreviewBtn.textContent = '仅编辑';
    } else {
      editorPane.classList.remove('split');
      previewPane.classList.add('hidden');
      togglePreviewBtn.textContent = '切换预览';
    }
  });

  let debounceTimer;
  contentTextarea.addEventListener('input', () => {
    if (previewMode) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePreview, 300);
    }
  });
}

function handleLogout() {
  authService.logout();
  state.isAdmin = false;
  updateAuthUI();
  router.navigate('/');
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  localStorage.setItem('darkMode', state.darkMode);

  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (state.darkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀';
  } else {
    document.body.classList.remove('dark-mode');
    darkModeToggle.textContent = '☾';
  }
}

function updateOGTags(post, description) {
  const ogTags = {
    'og:title': post.title,
    'og:description': description,
    'og:type': 'article',
    'og:url': window.location.href,
    'og:site_name': 'Minimalist Blog',
    'twitter:card': 'summary_large_image',
    'twitter:title': post.title,
    'twitter:description': description
  };

  if (post.image) {
    ogTags['og:image'] = post.image;
    ogTags['twitter:image'] = post.image;
  }

  Object.entries(ogTags).forEach(([property, content]) => {
    const isTwitter = property.startsWith('twitter:');
    let tag = document.querySelector(`meta[${isTwitter ? 'name' : 'property'}="${property}"]`);

    if (!tag) {
      tag = document.createElement('meta');
      if (isTwitter) {
        tag.name = property;
      } else {
        tag.setAttribute('property', property);
      }
      document.head.appendChild(tag);
    }
    tag.content = content;
  });

  addStructuredData(post);
}

function addStructuredData(post) {
  let script = document.getElementById('structured-data');
  if (!script) {
    script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'datePublished': post.created_at,
    'dateModified': post.updated_at || post.created_at,
    'description': post.content?.substring(0, 160) || '',
    'author': {
      '@type': 'Person',
      'name': 'Minimalist Blog'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Minimalist',
      'logo': {
        '@type': 'ImageObject',
        'url': window.location.origin + '/favicon.ico'
      }
    }
  };

  if (post.image) {
    structuredData.image = post.image;
  }

  script.textContent = JSON.stringify(structuredData);
}

function checkAutoNightMode() {
  const manuallySet = localStorage.getItem('darkMode') !== null;
  if (!manuallySet) {
    const shouldBeNight = isNightTime();
    if (state.darkMode !== shouldBeNight) {
      state.darkMode = shouldBeNight;
      const darkModeToggle = document.getElementById('dark-mode-toggle');
      if (state.darkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = '☀';
      } else {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = '☾';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectGlobalStyles(); // 调用样式注入
  updateAuthUI();
  router.init();

  setInterval(checkAutoNightMode, 60000);
});
