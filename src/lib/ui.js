// src/lib/ui.js

// --- 1. Toast 通知系统 ---
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
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// --- 2. 阅读进度条 (全域监听) ---
export function initReadingProgress() {
    let bar = document.getElementById('reading-progress');
    if (!bar) { bar = document.createElement('div'); bar.id = 'reading-progress'; document.body.appendChild(bar); }
    
    const update = () => {
        if (!window.location.pathname.startsWith('/post/')) { bar.style.width = '0%'; return; }
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
        const clientHeight = window.innerHeight || document.documentElement.clientHeight;
        const total = scrollHeight - clientHeight;
        bar.style.width = (total > 0 ? (scrollTop / total) * 100 : 0) + '%';
    };
    
    document.addEventListener('scroll', update, { capture: true, passive: true });
    update(); // 初始化执行一次
}

// --- 3. 划词分享 ---
export function initSelectionSharer() {
    let popover = document.getElementById('selection-popover');
    if (!popover) {
        popover = document.createElement('div'); popover.id = 'selection-popover'; popover.className = 'selection-popover';
        popover.innerHTML = `<button class="popover-btn" id="pop-copy">📄 Copy</button>`;
        document.body.appendChild(popover);
        document.getElementById('pop-copy').addEventListener('click', () => { 
            navigator.clipboard.writeText(window.getSelection().toString()).then(() => showToast('Copied!', 'success')); 
            window.getSelection().removeAllRanges(); popover.classList.remove('visible'); 
        });
    }
    document.addEventListener('mouseup', (e) => {
        if (popover.contains(e.target)) return;
        const s = window.getSelection(); const t = s.toString().trim();
        if (t.length > 0) {
            const r = s.getRangeAt(0).getBoundingClientRect();
            const st = window.scrollY || document.documentElement.scrollTop;
            popover.style.top = (r.top + st - 50) + 'px';
            popover.style.left = (r.left + r.width / 2 - popover.offsetWidth / 2) + 'px';
            popover.classList.add('visible');
        } else { popover.classList.remove('visible'); }
    });
}

// --- 4. 图片灯箱 ---
export function initLightbox() {
    const images = document.querySelectorAll('.article-content img');
    if (images.length === 0) return;
    let overlay = document.querySelector('.lightbox-overlay');
    if (!overlay) {
        overlay = document.createElement('div'); overlay.className = 'lightbox-overlay';
        overlay.innerHTML = '<img class="lightbox-img" src="">';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => overlay.classList.remove('active'));
    }
    const imgElement = overlay.querySelector('img');
    images.forEach(img => {
        img.addEventListener('click', (e) => { e.stopPropagation(); imgElement.src = img.src; overlay.classList.add('active'); });
    });
}

// --- 5. 代码高亮 (Prism) ---
export function loadPrism() {
    if (window.Prism) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    s.onload = () => { const a = document.createElement('script'); a.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js'; document.body.appendChild(a); };
    document.body.appendChild(s);
}

export function highlightCode() {
    const interval = setInterval(() => {
        document.querySelectorAll('pre').forEach(pre => {
            if (pre.parentElement.classList.contains('code-wrapper')) return;
            const w = document.createElement('div'); w.className = 'code-wrapper';
            pre.parentNode.insertBefore(w, pre); w.appendChild(pre);
            const b = document.createElement('button'); b.className = 'copy-btn'; b.textContent = 'Copy';
            b.addEventListener('click', () => { navigator.clipboard.writeText(pre.innerText).then(() => showToast('Code copied!', 'success')); });
            w.appendChild(b);
        });
        if (window.Prism) { window.Prism.highlightAll(); clearInterval(interval); }
    }, 200);
    setTimeout(() => clearInterval(interval), 5000);
}

// --- 6. 其他 (下雪、时钟、Meta) ---
export function initSnowEffect() {
    const d = new Date(); if (!(d.getMonth()===11 || d.getMonth()===0 || (d.getMonth()===1 && d.getDate()<=10))) return;
    const o = new MutationObserver(() => {
        const h = document.querySelector('.hero');
        if (h && !h.dataset.snowing) {
            h.dataset.snowing = "true";
            setInterval(() => {
                if(!document.contains(h)) return;
                const s = document.createElement('div'); s.className = 'snowflake';
                const z = Math.random()*4+2+'px'; s.style.width=z;s.style.height=z;s.style.left=Math.random()*100+'%';
                s.style.animation=`snowfall ${Math.random()*5+5+'s'} linear forwards`;s.style.opacity=Math.random()*0.5+0.3;
                h.appendChild(s); setTimeout(()=>s.remove(),10000);
            }, 300);
        }
    });
    o.observe(document.body, {childList:true,subtree:true});
}

export function updateClock() {
    const d = document.getElementById('clock-display'); if (!d) return;
    const n = new Date();
    d.innerHTML = `<div style="font-size:1rem;font-weight:600;">${n.toLocaleTimeString('zh-CN')}</div><div style="font-size:0.85rem;opacity:0.8;">${n.toLocaleDateString('zh-CN')}</div>`;
}

export function updatePageMeta(p) {
    document.title = `${p.title} - Minimalist`;
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    m.content = p.content?.substring(0, 160) || 'Blog Post';
}
