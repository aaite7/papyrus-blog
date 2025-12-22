// src/lib/ui.js

// >>> 全局变量：用于存储天气信息，供时钟使用 <<<
let weatherData = {
    city: '',
    weather: '',
    temp: '',
    icon: ''
};
const AMAP_KEY = "41151e8e6a20ccd713ae595cd3236735"; // 你的高德 KEY

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

// 4. 下雪特效
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

// --- >>> 核心功能：天气与时钟整合 <<< ---

// 7. 初始化天气 (IP定位 + 天气查询)
export async function initWeather() {
    try {
        // A. 获取 IP 定位
        const ipRes = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`);
        const ipData = await ipRes.json();
        
        if (ipData.status === '1' && ipData.adcode) {
            // B. 获取天气
            const weatherRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?city=${ipData.adcode}&key=${AMAP_KEY}`);
            const wData = await weatherRes.json();
            
            if (wData.status === '1' && wData.lives && wData.lives.length > 0) {
                const live = wData.lives[0];
                weatherData = {
                    city: live.city,
                    weather: live.weather,
                    temp: live.temperature,
                    icon: getWeatherIcon(live.weather) // 简单的图标映射
                };
                // 立即刷新一次时钟以显示天气
                updateClock();
            }
        }
    } catch (e) {
        console.error("Weather fetch failed:", e);
    }
}

// 简单的天气图标映射辅助函数
function getWeatherIcon(text) {
    if (text.includes('晴')) return '☀️';
    if (text.includes('云') || text.includes('阴')) return '☁️';
    if (text.includes('雨')) return '🌧️';
    if (text.includes('雪')) return '❄️';
    if (text.includes('雷')) return '⛈️';
    if (text.includes('风')) return '🍃';
    return '🌡️';
}

// 8. 时钟渲染 (含农历 + 天气)
export function updateClock() {
    const d = document.getElementById('clock-display');
    if(!d) return;

    const n = new Date();
    
    // 时间
    const timeStr = n.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = n.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    
    // 农历
    let lunarStr = '';
    try {
        lunarStr = new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', year: 'numeric', month: 'long', day: 'numeric' }).format(n);
        lunarStr = lunarStr.replace(/^\d+年/, ''); 
    } catch(e) {}

    // 组合 HTML：时间 + 日期 + (农历 | 天气)
    // 如果有天气数据，就显示；否则显示农历
    let extraInfo = '';
    if (weatherData.city) {
        extraInfo = `
            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px; color: #D4AF37;">
                ${weatherData.icon} ${weatherData.city} · ${weatherData.weather} ${weatherData.temp}°C
            </div>
            <div style="font-size: 0.7rem; opacity: 0.5; margin-top: 2px; font-family: 'KaiTi', serif;">农历 ${lunarStr}</div>
        `;
    } else {
        extraInfo = lunarStr ? `<div style="font-size: 0.8rem; opacity: 0.6; color: #D4AF37; margin-top: 2px; font-family: 'KaiTi', serif;">农历 ${lunarStr}</div>` : '';
    }

    d.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 600; letter-spacing: 1px;">${timeStr}</div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px;">${dateStr}</div>
        ${extraInfo}
    `;
}

// 9. 页面元数据
export function updatePageMeta(p) { document.title = p.title; }
export function loadPrism() {} 
export function highlightCode() {}
