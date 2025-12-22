// src/lib/ui.js

// >>> 全局变量：用于存储天气信息 <<<
let weatherData = {
    city: '定位中...',
    weather: '',
    temp: '',
    icon: '',
    province: ''
};
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY; 

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

// 4. 下雪特效 (11月-2月限定)
export function initSnowEffect() {
    const now = new Date();
    const month = now.getMonth() + 1; 
    if (![11, 12, 1, 2].includes(month)) return;

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

// 7. 天气与时钟
function loadAMapScript() {
    return new Promise((resolve, reject) => {
        if (window.AMap) { resolve(window.AMap); return; }
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.CitySearch,AMap.Weather`;
        script.onload = () => resolve(window.AMap);
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
    });
}

export async function initWeather() {
    try {
        await loadAMapScript();
        const citySearch = new window.AMap.CitySearch();
        citySearch.getLocalCity(function (status, result) {
            if (status === 'complete' && result.info === 'OK') {
                const adcode = result.adcode;
                weatherData.city = result.city || result.province;
                const weather = new window.AMap.Weather();
                weather.getLive(adcode, function(err, data) {
                    if (!err) {
                        weatherData.weather = data.weather;
                        weatherData.temp = data.temperature;
                        weatherData.icon = getWeatherIcon(data.weather);
                        updateClock();
                    }
                });
                updateClock();
            } else {
                weatherData.city = '定位失败';
                updateClock();
            }
        });
    } catch (e) {
        weatherData.city = 'API 错误';
        updateClock();
    }
}

function getWeatherIcon(text) {
    if (!text) return '🌡️';
    if (text.includes('晴')) return '☀️';
    if (text.includes('云') || text.includes('阴')) return '☁️';
    if (text.includes('雨')) return '🌧️';
    if (text.includes('雪')) return '❄️';
    if (text.includes('雷')) return '⛈️';
    if (text.includes('风')) return '🍃';
    if (text.includes('雾') || text.includes('霾')) return '🌫️';
    return '🌡️';
}

export function updateClock() {
    let d = document.getElementById('clock-display');
    if(!d) {
        d = document.createElement('div');
        d.id = 'clock-display';
        d.style.position = 'fixed'; d.style.top = '20px'; d.style.right = '20px'; d.style.textAlign = 'right'; d.style.zIndex = '999'; d.style.fontFamily = "'Lora', serif";
        document.body.appendChild(d);
    }

    if (document.body.classList.contains('dark-mode')) {
        d.style.color = '#e0e0e0'; d.style.textShadow = 'none';
    } else {
        d.style.color = '#333'; d.style.textShadow = '0 1px 2px rgba(255,255,255,0.8)';
    }

    const n = new Date();
    const timeStr = n.toLocaleTimeString('zh-CN', { hour12: false });
    const dateStr = n.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    let lunarStr = '';
    try {
        lunarStr = new Intl.DateTimeFormat('zh-CN', { calendar: 'chinese', year: 'numeric', month: 'long', day: 'numeric' }).format(n);
        lunarStr = lunarStr.replace(/^\d+年/, ''); 
    } catch(e) {}

    let weatherHtml = '';
    let infoText = weatherData.city;
    if (weatherData.weather) infoText += ` · ${weatherData.weather} ${weatherData.temp}°C`;
    
    let flag = '🇨🇳'; 
    if (weatherData.city === '定位中...') flag = '🌏';
    if (weatherData.city === '定位失败' || weatherData.city === 'API 错误') flag = '⚠️';

    if (weatherData.city) {
        weatherHtml = `<div style="font-size: 0.85rem; opacity: 0.8; margin-top: 4px; color: #D4AF37; font-weight: bold;">${flag} ${weatherData.icon || ''} ${infoText}</div>`;
    }

    d.innerHTML = `<div style="font-size: 1.2rem; font-weight: 600; letter-spacing: 1px;">${timeStr}</div><div style="font-size: 0.8rem; opacity: 0.7;">${dateStr}</div>${weatherHtml}${lunarStr ? `<div style="font-size: 0.75rem; opacity: 0.6; font-family: 'KaiTi', serif;">农历 ${lunarStr}</div>` : ''}`;
}

// >>> 核心修复：改回使用 unpkg 源 <<<
export function initLive2D() {
    if (document.getElementById('live2d-script')) return;

    const script = document.createElement('script');
    script.id = 'live2d-script';
    script.src = 'https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js';
    script.async = true;
    script.onload = () => {
        if (window.L2Dwidget) {
            window.L2Dwidget.init({
                "model": {
                    "jsonPath": "https://imuncle.github.io/live2d/live2d_3/shizuku/shizuku.model.json",
                    "scale": 1
                },
                "display": {
                    "position": "left",
                    "width": 150,
                    "height": 300,
                    "hOffset": 0,
                    "vOffset": -20
                },
                "mobile": {
                    "show": true, 
                    "scale": 0.5
                },
                "react": {
                    "opacityDefault": 0.9,
                    "opacityOnHover": 1
                }
            });
        }
    };
    script.onerror = () => {
        console.error("Live2D script failed to load. unpkg might be slow.");
    };
    document.body.appendChild(script);
}

// 9. 页面元数据
export function updatePageMeta(p) { document.title = p.title; }
export function loadPrism() {} 
export function highlightCode() {}
