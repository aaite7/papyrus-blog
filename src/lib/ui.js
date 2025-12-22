// src/lib/ui.js

// 1. 骨架屏
export function renderSkeleton() {
    const card = `
        <div class="skeleton-card">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
        </div>`;
    return `
        <div class="hero fade-in"><h1><span class="star-icon left">✦</span> Minimalist <span class="star-icon right">✦</span></h1><p class="hero-subtitle">Loading...</p></div>
        <div class="divider">✦ ✦ ✦</div>
        <div class="manuscripts">${card + card + card}</div>
    `;
}

// 2. Toast 通知
export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// 3. 阅读进度条
export function initReadingProgress() {
    let bar = document.getElementById('reading-progress');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'reading-progress';
        document.body.appendChild(bar);
    }
    const update = () => {
        if (!window.location.pathname.startsWith('/post/')) {
            bar.style.width = '0%';
            return;
        }
        const h = document.documentElement;
        const b = document.body;
        const st = 'scrollTop';
        const sh = 'scrollHeight';
        const percent = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
        bar.style.width = percent + '%';
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
}

// 4. 下雪特效 (已复活 ❄️)
export function initSnowEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return; 

    if (hero.dataset.snowing) return;
    hero.dataset.snowing = "true";

    const createSnowflake = () => {
        if (!document.contains(hero)) return;

        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        
        const size = Math.random() * 3 + 2 + 'px'; 
        snowflake.style.width = size;
        snowflake.style.height = size;
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.opacity = Math.random() * 0.5 + 0.3;
        
        const duration = Math.random() * 5 + 5 + 's';
        snowflake.style.animation = `snowfall ${duration} linear forwards`;
        
        hero.appendChild(snowflake);

        setTimeout(() => { snowflake.remove(); }, 10000);
    };

    setInterval(createSnowflake, 200);
}

// 5. 划词分享
export function initSelectionSharer() {
    let p = document.getElementById('selection-popover');
    if (!p) {
        p = document.createElement('div'); p.id = 'selection-popover'; p.className = 'selection-popover';
        p.innerHTML = `<button class="popover-btn" id="pop-copy">Copy</button>`;
        document.body.appendChild(p);
        document.getElementById('pop-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(window.getSelection().toString());
            p.classList.remove('visible');
            showToast('Copied!');
        });
    }
    document.addEventListener('mouseup', () => {
        const s = window.getSelection().toString().trim();
        if (s) {
            const r = window.getSelection().getRangeAt(0).getBoundingClientRect();
            p.style.top = (r.top + window.scrollY - 40) + 'px';
            p.style.left = (r.left + r.width/2 - 30) + 'px';
            p.classList.add('visible');
        } else {
            p.classList.remove('visible');
        }
    });
}

// 6. 灯箱
export function initLightbox() {
    const imgs = document.querySelectorAll('.article-content img');
    if(!imgs.length) return;
    let overlay = document.querySelector('.lightbox-overlay');
    if(!overlay) {
        overlay = document.createElement('div'); overlay.className = 'lightbox-overlay';
        overlay.innerHTML = '<img class="lightbox-img">';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => overlay.classList.remove('active'));
    }
    imgs.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.querySelector('img').src = img.src;
            overlay.classList.add('active');
        });
    });
}

// 7. 时钟与农历 (>>> 核心修复：找回农历显示 <<<)
export function updateClock() {
    const d = document.getElementById('clock-display');
    if(!d) return;

    const n = new Date();
    
    // 1. 获取基础时间
    const timeStr = n.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = n.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    
    // 2. 获取农历 (使用 Intl API)
    let lunarStr = '';
    try {
        // 部分浏览器支持 chinese calendar
        lunarStr = new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', year: 'numeric', month: 'long', day: 'numeric' }).format(n);
        // 去掉前面的 "xxxx年" (农历年份通常不直观，只保留日期)
        lunarStr = lunarStr.replace(/^\d+年/, ''); 
    } catch(e) {
        // 如果浏览器不支持农历，就留空，不报错
        console.log('Lunar calendar not supported');
    }

    // 3. 渲染 HTML
    d.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 600; letter-spacing: 1px;">${timeStr}</div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px;">${dateStr}</div>
        ${lunarStr ? `<div style="font-size: 0.8rem; opacity: 0.6; color: #D4AF37; margin-top: 2px; font-family: 'KaiTi', serif;">农历 ${lunarStr}</div>` : ''}
    `;
}

// 8. 页面元数据
export function updatePageMeta(p) { document.title = p.title; }
export function loadPrism() {} 
export function highlightCode() {}
