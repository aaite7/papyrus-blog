// src/lib/visuals.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 基础动画 --- */
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    .star-icon { display: inline-block; color: var(--gold); margin: 0 15px; font-size: 1.5rem; vertical-align: middle; animation: twinkle 3s infinite ease-in-out; }
    .star-icon.left { animation-delay: 0s; } .star-icon.right { animation-delay: 1.5s; }
    
    @keyframes snowfall { 0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) translateX(20px) rotate(360deg); opacity: 0; } }
    .hero { position: relative !important; overflow: hidden !important; }
    .snowflake { position: absolute; top: -10px; background: white; border-radius: 50%; pointer-events: none; z-index: 1; box-shadow: 0 0 5px rgba(255,255,255,0.8); }

    /* --- 阅读进度条 --- */
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 5px; background: linear-gradient(90deg, var(--gold, #d4af37), var(--burgundy, #800020)); z-index: 2147483647; transition: width 0.1s ease-out; box-shadow: 0 1px 5px rgba(0,0,0,0.2); pointer-events: none; }

    /* --- 图片裁剪 --- */
    .image-crop-container { margin: 20px 0; padding: 20px; background: var(--parchment); border: 2px solid var(--gold); }
    .hidden { display: none !important; }
    #crop-wrapper { position: relative; display: inline-block; max-width: 100%; border: 2px solid var(--gold); user-select: none; cursor: crosshair; }
    #crop-box { position: absolute; border: 2px dashed #fff; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5); display: none; pointer-events: none; z-index: 10; }
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; }

    /* --- 代码编辑器样式 --- */
    .editor-textarea {
        background-color: #1e1e1e !important; 
        color: #d4d4d4 !important; 
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important; 
        font-size: 14px !important;
        line-height: 1.6 !important;
        padding: 20px !important;
        border: 2px solid var(--gold) !important;
        border-radius: 6px;
        white-space: pre !important; 
        overflow-x: auto !important; 
        overflow-y: auto !important;
        word-wrap: normal !important;
        tab-size: 4; 
        min-height: 500px;
    }
    .editor-textarea:focus { outline: none; border-color: var(--burgundy) !important; box-shadow: 0 0 15px rgba(212, 175, 55, 0.3); }

    /* --- 代码显示样式 --- */
    .code-wrapper { position: relative; margin: 1.5em 0; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: left !important; }
    pre {
        background: #272822 !important; 
        color: #f8f8f2 !important;
        padding: 1.2rem !important;
        margin: 0 !important;
        border-radius: 8px;
        overflow-x: auto;
        font-family: 'Consolas', 'Monaco', monospace !important;
        line-height: 1.5;
        text-align: left !important;
        white-space: pre !important;
    }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s; opacity: 0; z-index: 100; backdrop-filter: blur(2px); }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    .copy-btn:hover { background: rgba(255,255,255,0.4); transform: translateY(-1px); }

    /* --- >>> 核心修复：文章内容强制保留格式 <<< --- */
    .article-content {
        font-size: 1.15rem;
        line-height: 1.8; /* 稍微调小行高，让对齐更紧凑 */
        color: var(--ink);
        
        /* 关键：保留空格和换行，但允许自动换行防止撑破 */
        white-space: pre-wrap !important; 
        
        /* 确保长单词断行 */
        overflow-wrap: break-word !important;
        word-wrap: break-word !important;
        word-break: break-word !important;
        
        max-width: 100%;
        text-align: left; /* 强制左对齐，对齐代码和文本 */
        font-family: 'Lora', 'Consolas', sans-serif; /* 混合字体优化显示 */
    }
    
    /* 修正段落间距，因为有了 pre-wrap，回车本身就会产生空行，所以减小 margin */
    .article-content p {
        margin-bottom: 0.5em !important; 
        margin-top: 0 !important;
    }

    /* 标题样式 */
    .article-content h1, 
    .article-content h2, 
    .article-content h3 {
        margin-top: 1.5em !important;
        margin-bottom: 0.8em !important;
        font-family: 'Playfair Display', serif;
    }

    .article-content img,
    .article-content iframe,
    .article-content video {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin: 1em 0;
    }

    .article-content table {
        display: block;
        width: 100%;
        overflow-x: auto;
        border-collapse: collapse;
        margin: 1.5em 0;
    }
    .article-content th, .article-content td {
        border: 1px solid var(--sepia);
        padding: 8px 12px;
    }
  `;
  document.head.appendChild(style);
}

// ... (以下所有函数保持不变，确保完整复制) ...
export function loadPrism() {
    if (window.Prism) return;
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css'; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    script.onload = () => { const a = document.createElement('script'); a.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js'; document.body.appendChild(a); };
    document.body.appendChild(script);
}

export function highlightCode() {
    const interval = setInterval(() => {
        document.querySelectorAll('pre').forEach(pre => {
            if (pre.parentElement.classList.contains('code-wrapper')) return;
            const wrapper = document.createElement('div'); wrapper.className = 'code-wrapper';
            pre.parentNode.insertBefore(wrapper, pre); wrapper.appendChild(pre);
            const btn = document.createElement('button'); btn.className = 'copy-btn'; btn.textContent = 'Copy Code';
            btn.addEventListener('click', () => { navigator.clipboard.writeText(pre.innerText).then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy Code', 2000); }); });
            wrapper.appendChild(btn);
        });
        if (window.Prism) { window.Prism.highlightAll(); clearInterval(interval); }
    }, 200); 
    setTimeout(() => clearInterval(interval), 5000);
}

function isSnowSeason() {
    const now = new Date(); const m = now.getMonth() + 1; const d = now.getDate();
    return (m === 12 || m === 1 || (m === 2 && d <= 10));
}

export function initSnowEffect() {
    if (!isSnowSeason()) return;
    const observer = new MutationObserver(() => {
        const hero = document.querySelector('.hero');
        if (hero && !hero.dataset.snowing) { hero.dataset.snowing = "true"; startSnowing(hero); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function startSnowing(container) {
    if (window.snowInterval) clearInterval(window.snowInterval);
    window.snowInterval = setInterval(() => {
        if (!document.contains(container)) return;
        const s = document.createElement('div'); s.className = 'snowflake';
        const size = Math.random() * 4 + 2 + 'px'; s.style.width = size; s.style.height = size; s.style.left = Math.random() * 100 + '%';
        s.style.animation = `snowfall ${Math.random() * 5 + 5 + 's'} linear forwards`; s.style.opacity = Math.random() * 0.5 + 0.3;
        container.appendChild(s); setTimeout(() => s.remove(), 10000); 
    }, 300);
}

function ensureProgressBar() {
    let bar = document.getElementById('reading-progress');
    if (!bar) { bar = document.createElement('div'); bar.id = 'reading-progress'; document.body.appendChild(bar); }
    return bar;
}

export function updateProgressBar() {
    if (!window.location.pathname.startsWith('/post/')) { const b = document.getElementById('reading-progress'); if(b) b.style.width = '0%'; return; }
    const bar = ensureProgressBar();
    const st = window.scrollY || document.documentElement.scrollTop;
    const dh = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (dh > 0 ? (st / dh) * 100 : 0) + '%';
}

export function updateClock() {
  const d = document.getElementById('clock-display'); if (!d) return;
  const n = new Date();
  let l = ''; try { l = new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', year: 'numeric', month: 'long', day: 'numeric' }).format(n).replace(/^\d+/, ''); } catch (e) {}
  d.innerHTML = `<div style="font-size: 1rem; font-weight: 600;">${n.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div><div style="font-size: 0.85rem; opacity: 0.8;">${n.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</div>${l?`<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 2px; font-family: 'KaiTi', serif;">农历 ${l}</div>`:''}`;
}

export function updatePageMeta(post) {
  document.title = `${post.title} - Minimalist`;
  let m = document.querySelector('meta[name="description"]');
  if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
  m.content = post.content?.substring(0, 160) || 'Read this post on Minimalist blog';
}
