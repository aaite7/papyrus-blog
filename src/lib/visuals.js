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

    /* --- >>> 核心修复：阅读进度条 (高可见度版) <<< --- */
    #reading-progress {
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 0%; 
        height: 6px; /* 加粗 */
        background: linear-gradient(90deg, #FFD700, #FF4500); /* 鲜艳的金红渐变 */
        z-index: 2147483647; /* 最高层级 */
        transition: width 0.1s linear; /* 线性过渡更顺滑 */
        box-shadow: 0 2px 8px rgba(0,0,0,0.5); /* 强阴影 */
        pointer-events: none;
        display: block !important;
    }

    /* --- 划词分享气泡 --- */
    .selection-popover { position: absolute; background: #222; border-radius: 5px; padding: 5px 10px; display: flex; gap: 10px; z-index: 10000; opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s; transform: translateY(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .selection-popover.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .selection-popover::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-width: 6px; border-style: solid; border-color: #222 transparent transparent transparent; }
    .popover-btn { background: none; border: none; color: #fff; cursor: pointer; font-size: 0.9rem; font-family: sans-serif; display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; }
    .popover-btn:hover { background: rgba(255,255,255,0.2); }

    /* --- 图片裁剪 --- */
    .image-crop-container { margin: 20px 0; padding: 20px; background: var(--parchment); border: 2px solid var(--gold); }
    .hidden { display: none !important; }
    #crop-wrapper { position: relative; display: inline-block; max-width: 100%; border: 2px solid var(--gold); user-select: none; cursor: crosshair; }
    #crop-box { position: absolute; border: 2px dashed #fff; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5); display: none; pointer-events: none; z-index: 10; }
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; }

    /* --- 编辑器 & 代码块 --- */
    .editor-textarea { background-color: #1e1e1e !important; color: #d4d4d4 !important; font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important; font-size: 14px !important; line-height: 1.6 !important; padding: 20px !important; border: 2px solid var(--gold) !important; border-radius: 6px; white-space: pre !important; overflow-x: auto !important; overflow-y: auto !important; word-wrap: normal !important; tab-size: 4; min-height: 500px; }
    .editor-textarea:focus { outline: none; border-color: var(--burgundy) !important; box-shadow: 0 0 15px rgba(212, 175, 55, 0.3); }
    .code-wrapper { position: relative; margin: 1.8em 0; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: left !important; }
    pre { background: #272822 !important; color: #f8f8f2 !important; padding: 1.2rem !important; margin: 0 !important; border-radius: 8px; overflow-x: auto; font-family: 'Consolas', 'Monaco', monospace !important; line-height: 1.5; text-align: left !important; white-space: pre !important; }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s; opacity: 0; z-index: 100; backdrop-filter: blur(2px); }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    .copy-btn:hover { background: rgba(255,255,255,0.4); transform: translateY(-1px); }

    /* --- 文章内容 --- */
    .article-content { font-size: 1.15rem; line-height: 1.8; color: var(--ink); white-space: pre-wrap !important; overflow-wrap: break-word !important; word-wrap: break-word !important; word-break: break-word !important; max-width: 100%; text-align: left; font-family: 'Lora', 'Consolas', sans-serif; }
    .article-content p { margin-bottom: 0.5em !important; margin-top: 0 !important; }
    .article-content h1, .article-content h2, .article-content h3 { margin-top: 1.5em !important; margin-bottom: 0.8em !important; font-family: 'Playfair Display', serif; }
    .article-content img, .article-content iframe, .article-content video { max-width: 100% !important; height: auto !important; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 1em 0; cursor: zoom-in; transition: transform 0.3s; }
    .article-content table { display: block; width: 100%; overflow-x: auto; border-collapse: collapse; margin: 1.5em 0; }
    .article-content th, .article-content td { border: 1px solid var(--sepia); padding: 8px 12px; }

    /* --- 灯箱 & 悬浮岛 --- */
    .lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 2147483647; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
    .lightbox-overlay.active { opacity: 1; pointer-events: auto; }
    .lightbox-img { max-width: 95%; max-height: 95%; border: 2px solid var(--gold); box-shadow: 0 0 30px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s; }
    .lightbox-overlay.active .lightbox-img { transform: scale(1); }
    mark { background-color: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px; }
    
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: var(--cream); color: var(--sepia); border: 2px solid var(--gold); display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px var(--shadow); transition: all 0.2s; position: relative; }
    .action-btn:hover { transform: scale(1.1); background: var(--parchment); color: var(--burgundy); }
    .action-btn:active { transform: scale(0.95); }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: var(--burgundy); color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; font-family: 'Consolas', monospace; pointer-events: none; }
    @keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
    .liked { color: #e91e63 !important; border-color: #e91e63 !important; animation: heartBeat 1s; }
  `;
  document.head.appendChild(style);
}

// --- >>> 核心修复：进度条初始化与监听 <<< ---
// 我们不再依赖 updateProgressBar 被外部调用，而是这里自己启动监听
export function initReadingProgress() {
    let bar = document.getElementById('reading-progress');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'reading-progress';
        document.body.appendChild(bar);
    }

    // 使用 capture: true 捕获所有滚动事件（包括 div 内部滚动）
    document.addEventListener('scroll', () => {
        if (!window.location.pathname.startsWith('/post/')) {
            bar.style.width = '0%';
            return;
        }

        // 智能获取当前滚动的元素
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        
        let scrolled = 0;
        
        if (height > 0) {
            // 标准 Window 滚动
            scrolled = (winScroll / height) * 100;
        } else {
            // 可能是某个 Div 在滚动 (比如 #app)
            const app = document.getElementById('app');
            if (app && app.scrollHeight > app.clientHeight) {
                scrolled = (app.scrollTop / (app.scrollHeight - app.clientHeight)) * 100;
            }
        }

        bar.style.width = scrolled + '%';
    }, { capture: true, passive: true });
}

// ... (以下函数保持不变) ...
export function loadPrism() { if(window.Prism)return; const l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css';document.head.appendChild(l);const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';s.onload=()=>{const a=document.createElement('script');a.src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';document.body.appendChild(a)};document.body.appendChild(s); }
export function highlightCode() { const i=setInterval(()=>{ document.querySelectorAll('pre').forEach(p=>{ if(p.parentElement.classList.contains('code-wrapper'))return; const w=document.createElement('div');w.className='code-wrapper';p.parentNode.insertBefore(w,p);w.appendChild(p); const b=document.createElement('button');b.className='copy-btn';b.textContent='Copy Code'; b.addEventListener('click',()=>{navigator.clipboard.writeText(p.innerText).then(()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy Code',2000)})}); w.appendChild(b); }); if(window.Prism){window.Prism.highlightAll();clearInterval(i)} },200); setTimeout(()=>clearInterval(i),5000); }
export function initSelectionSharer() { let popover = document.getElementById('selection-popover'); if (!popover) { popover = document.createElement('div'); popover.id = 'selection-popover'; popover.className = 'selection-popover'; popover.innerHTML = `<button class="popover-btn" id="pop-copy">📄 Copy</button><div style="width:1px;background:#555;margin:0 5px;"></div><button class="popover-btn" id="pop-tweet">🐦 Tweet</button>`; document.body.appendChild(popover); document.getElementById('pop-copy').addEventListener('click', () => { navigator.clipboard.writeText(window.getSelection().toString()).then(() => alert('Copied!')); clearSelection(); }); document.getElementById('pop-tweet').addEventListener('click', () => { const t = window.getSelection().toString(); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t.substring(0,120))}...`, '_blank'); clearSelection(); }); } document.addEventListener('mouseup', (e) => { if (popover.contains(e.target)) return; const s = window.getSelection(); const t = s.toString().trim(); if (t.length > 0) { const r = s.getRangeAt(0).getBoundingClientRect(); const st = window.scrollY || document.documentElement.scrollTop; popover.style.top = (r.top + st - 50) + 'px'; popover.style.left = (r.left + r.width / 2 - popover.offsetWidth / 2) + 'px'; popover.classList.add('visible'); } else { popover.classList.remove('visible'); } }); }
function clearSelection() { window.getSelection().removeAllRanges(); document.getElementById('selection-popover').classList.remove('visible'); }
function isSnowSeason(){const n=new Date(),m=n.getMonth()+1,d=n.getDate();return(m===12||m===1||(m===2&&d<=10))}
export function initSnowEffect(){if(!isSnowSeason())return;const o=new MutationObserver(()=>{const h=document.querySelector('.hero');if(h&&!h.dataset.snowing){h.dataset.snowing="true";startSnowing(h)}});o.observe(document.body,{childList:true,subtree:true})}
function startSnowing(c){if(window.snowInterval)clearInterval(window.snowInterval);window.snowInterval=setInterval(()=>{if(!document.contains(c))return;const s=document.createElement('div');s.className='snowflake';const z=Math.random()*4+2+'px';s.style.width=z;s.style.height=z;s.style.left=Math.random()*100+'%';s.style.animation=`snowfall ${Math.random()*5+5+'s'} linear forwards`;s.style.opacity=Math.random()*0.5+0.3;c.appendChild(s);setTimeout(()=>s.remove(),10000)},300)}
export function updateClock(){const d=document.getElementById('clock-display');if(!d)return;const n=new Date();let l='';try{l=new Intl.DateTimeFormat('zh-CN',{calendar:'chinese',year:'numeric',month:'long',day:'numeric'}).format(n).replace(/^\d+/,'')}catch(e){}d.innerHTML=`<div style="font-size: 1rem; font-weight: 600;">${n.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div><div style="font-size: 0.85rem; opacity: 0.8;">${n.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</div>${l?`<div style="font-size: 0.75rem; opacity: 0.6; margin-top: 2px; font-family: 'KaiTi', serif;">农历 ${l}</div>`:''}`}
export function updatePageMeta(p){document.title=`${p.title} - Minimalist`;let m=document.querySelector('meta[name="description"]');if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}m.content=p.content?.substring(0,160)||'Read this post on Minimalist blog'}
export function initLightbox() { const i=document.querySelectorAll('.article-content img');if(i.length===0)return;let o=document.querySelector('.lightbox-overlay');if(!o){o=document.createElement('div');o.className='lightbox-overlay';o.innerHTML='<img class="lightbox-img" src="">';document.body.appendChild(o);o.addEventListener('click',()=>{o.classList.remove('active')})}const e=o.querySelector('img');i.forEach(m=>{m.style.cursor='zoom-in';m.addEventListener('click',x=>{x.stopPropagation();e.src=m.src;o.classList.add('active')})}) }
