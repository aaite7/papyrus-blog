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

    /* --- 代码高亮增强 (Copy Button) --- */
    .code-wrapper { position: relative; margin: 1.5em 0; }
    .copy-btn {
        position: absolute; top: 5px; right: 5px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: #ddd; font-size: 0.8rem; padding: 4px 8px; border-radius: 4px;
        cursor: pointer; transition: all 0.2s; opacity: 0;
    }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    .copy-btn:hover { background: rgba(255,255,255,0.3); color: #fff; }
    /* Prism 覆盖样式，使其适应你的极简主题 */
    code[class*="language-"], pre[class*="language-"] { font-family: 'Fira Code', 'Consolas', monospace !important; font-size: 0.95rem !important; }
  `;
  document.head.appendChild(style);
}

// --- 动态加载 Prism.js ---
export function loadPrism() {
    if (window.Prism) return; // 避免重复加载

    // 1. 加载 CSS (选择 Tomorrow Night 主题，适合暗色/复古风)
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    document.head.appendChild(link);

    // 2. 加载 JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    script.onload = () => {
        // 加载常用语言包
        const autoloader = document.createElement('script');
        autoloader.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';
        document.body.appendChild(autoloader);
    };
    document.body.appendChild(script);
}

// --- 触发高亮 + 注入复制按钮 ---
export function highlightCode() {
    // 等待 Prism 加载完成
    const interval = setInterval(() => {
        if (window.Prism) {
            clearInterval(interval);
            
            // 1. 执行高亮
            window.Prism.highlightAll();

            // 2. 注入复制按钮
            document.querySelectorAll('pre').forEach(pre => {
                // 防止重复注入
                if (pre.parentElement.classList.contains('code-wrapper')) return;

                // 包裹一层 wrapper 以便定位按钮
                const wrapper = document.createElement('div');
                wrapper.className = 'code-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);

                // 创建按钮
                const btn = document.createElement('button');
                btn.className = 'copy-btn';
                btn.textContent = 'Copy';
                
                btn.addEventListener('click', () => {
                    const code = pre.querySelector('code').innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        btn.textContent = 'Copied!';
                        setTimeout(() => btn.textContent = 'Copy', 2000);
                    });
                });

                wrapper.appendChild(btn);
            });
        }
    }, 100); // 每100ms检查一次
    
    // 超时清除 (5秒)
    setTimeout(() => clearInterval(interval), 5000);
}

// ... (以下代码保持不变：isSnowSeason, initSnowEffect, updateClock, updateProgressBar, updatePageMeta) ...

function isSnowSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const day = now.getDate();
    if (month === 12) return true;
    if (month === 1) return true;
    if (month === 2 && day <= 10) return true;
    return false;
}

export function initSnowEffect() {
    if (!isSnowSeason()) return;
    const observer = new MutationObserver(() => {
        const heroSection = document.querySelector('.hero');
        if (heroSection && !heroSection.dataset.snowing) {
            heroSection.dataset.snowing = "true";
            startSnowing(heroSection);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function startSnowing(container) {
    if (window.snowInterval) clearInterval(window.snowInterval);
    window.snowInterval = setInterval(() => {
        if (!document.contains(container)) return;
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        const size = Math.random() * 4 + 2 + 'px';
        snowflake.style.width = size;
        snowflake.style.height = size;
        snowflake.style.left = Math.random() * 100 + '%';
        const duration = Math.random() * 5 + 5 + 's';
        snowflake.style.animation = `snowfall ${duration} linear forwards`;
        snowflake.style.opacity = Math.random() * 0.5 + 0.3;
        container.appendChild(snowflake);
        setTimeout(() => snowflake.remove(), 10000); 
    }, 300);
}

export function updateClock() {
  const clockDisplay = document.getElementById('clock-display');
  if (!clockDisplay) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  let lunarStr = '';
  try {
    lunarStr = new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', year: 'numeric', month: 'long', day: 'numeric' }).format(now);
    lunarStr = lunarStr.replace(/^\d+/, ''); 
  } catch (e) { console.warn('Lunar calendar not supported'); }
  clockDisplay.innerHTML = `<div style="font-size: 1rem; font-weight: 600;">${timeStr}</div><div style="font-size: 0.85rem; opacity: 0.8;">${dateStr}</div>${lunarStr ? `<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 2px; font-family: 'KaiTi', 'STKaiti', serif;">农历 ${lunarStr}</div>` : ''}`;
}

function ensureProgressBar() {
    let bar = document.getElementById('reading-progress');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'reading-progress';
        document.body.appendChild(bar); 
    }
    return bar;
}

export function updateProgressBar() {
    if (!window.location.pathname.startsWith('/post/')) {
        const bar = document.getElementById('reading-progress');
        if (bar) bar.style.width = '0%';
        return;
    }
    const progressBar = ensureProgressBar();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = scrollPercent + '%';
}

export function updatePageMeta(post) {
  document.title = `${post.title} - Minimalist`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = post.content?.substring(0, 160) || 'Read this post on Minimalist blog';
}
