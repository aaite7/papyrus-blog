// src/lib/visuals.js

// 注入所有 CSS 样式 (星星、下雪、进度条、夜间模式基础)
export function injectGlobalStyles() {
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
    
    .hero {
        position: relative !important; 
        overflow: hidden !important;
    }

    .snowflake {
        position: absolute;
        top: -10px;
        background: white;
        border-radius: 50%;
        pointer-events: none; 
        z-index: 1;
        box-shadow: 0 0 5px rgba(255,255,255,0.8);
    }

    /* 阅读进度条样式 */
    #reading-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, var(--gold), var(--burgundy));
        z-index: 9999;
        transition: width 0.1s ease-out;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
    }
  `;
  document.head.appendChild(style);
}

// 辅助：判断是否是下雪季节 (12月-2月)
function isSnowSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const day = now.getDate();
    if (month === 12) return true;
    if (month === 1) return true;
    if (month === 2 && day <= 10) return true;
    return false;
}

// 启动下雪特效
export function initSnowEffect() {
    if (!isSnowSeason()) return;

    // 使用 MutationObserver 监听 DOM 变化，确保 Hero 出现时自动下雪
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
        // 如果页面切走了，hero 没了，就停止生成
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

// 更新时钟和农历
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

  clockDisplay.innerHTML = `
    <div style="font-size: 1rem; font-weight: 600;">${timeStr}</div>
    <div style="font-size: 0.85rem; opacity: 0.8;">${dateStr}</div>
    ${lunarStr ? `<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 2px; font-family: 'KaiTi', 'STKaiti', serif;">农历 ${lunarStr}</div>` : ''}
  `;
}

// 更新进度条
export function updateProgressBar() {
    const progressBar = document.getElementById('reading-progress');
    if (progressBar) {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    }
}

// SEO Meta 更新
export function updatePageMeta(post) {
  document.title = `${post.title} - Minimalist`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = post.content?.substring(0, 160) || 'Read this post on Minimalist blog';
  // 这里简化了 OGTags，如果需要完整版可以在这里扩展
}
