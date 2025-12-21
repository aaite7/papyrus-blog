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
        // 只在文章详情页显示
        if (!window.location.pathname.startsWith('/post/')) {
            bar.style.width = '0%';
            return;
        }
        
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        bar.style.width = scrolled + '%';
    };
    
    document.addEventListener('scroll', update, { passive: true });
    // 初始化执行一次
    update();
}

// 4. 划词分享
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

// 5. 灯箱 (图片放大)
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

// 6. 其他工具函数
export function loadPrism() {} 
export function highlightCode() {}
export function initSnowEffect() {}
export function updateClock() {
    const d = document.getElementById('clock-display');
    if(d) d.innerText = new Date().toLocaleTimeString();
}
export function updatePageMeta(p) { document.title = p.title; }
