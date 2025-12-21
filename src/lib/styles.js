// src/lib/styles.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 1. 全局重置与基础动画 --- */
    * { box-sizing: border-box; } /* 关键：防止padding撑大盒子导致溢出 */
    
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    @keyframes snowfall { 0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) translateX(20px) rotate(360deg); opacity: 0; } }
    @keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
    @keyframes fadeInSlide { to { opacity: 1; transform: translateX(0); } }

    .star-icon { display: inline-block; color: #D4AF37; margin: 0 15px; font-size: 1.5rem; vertical-align: middle; animation: twinkle 3s infinite ease-in-out; }
    .hero { position: relative !important; overflow: hidden !important; }
    .snowflake { position: absolute; top: -10px; background: white; border-radius: 50%; pointer-events: none; z-index: 1; box-shadow: 0 0 5px rgba(255,255,255,0.8); }

    /* --- 2. 核心组件 (Toast, Progress, FAB) --- */
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 6px; background: linear-gradient(90deg, #FFD700, #FF4500); z-index: 2147483647; display: block !important; transition: width 0.1s linear; box-shadow: 0 2px 8px rgba(0,0,0,0.5); pointer-events: none; }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast-notification { background: rgba(30, 30, 30, 0.95); color: #fff; padding: 12px 24px; border-radius: 50px; font-family: 'Lora', serif; font-size: 0.95rem; box-shadow: 0 5px 20px rgba(0,0,0,0.3); border: 1px solid #D4AF37; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: auto; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: #fdfbf7; color: #704214; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s; position: relative; }
    .action-btn:hover { transform: scale(1.1); background: #fff; color: #8B0000; }
    .action-btn.liked { color: #e91e63 !important; border-color: #e91e63 !important; animation: heartBeat 1s; }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: #8B0000; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; font-family: 'Consolas', monospace; pointer-events: none; }

    /* --- >>> 核心修复 1：文章列表卡片 (修复内容溢出) <<< --- */
    .manuscript {
        background: #fff;
        /* 增加内边距，文字离边框远一点 */
        padding: 40px; 
        border: 1px solid rgba(212, 175, 55, 0.2);
        border-radius: 8px;
        margin-bottom: 40px;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        transition: transform 0.2s, box-shadow 0.2s;
        /* 关键：防止内容撑破圆角或边框 */
        overflow: hidden; 
    }
    .manuscript:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    
    .manuscript-header { margin-bottom: 20px; }
    .manuscript-title {
        font-family: 'Playfair Display', serif;
        font-size: 1.8rem;
        color: #8B0000;
        margin: 0 0 10px 0; /* 修正 Margin，防止顶到上面 */
        line-height: 1.3;
        /* 防止长单词撑破 */
        overflow-wrap: break-word;
        word-wrap: break-word;
    }
    
    /* 置顶徽标微调 */
    .pinned-badge { 
        display: inline-block; 
        background: #D4AF37; 
        color: #fff; 
        font-size: 0.7rem; 
        padding: 3px 8px; 
        border-radius: 4px; 
        margin-right: 10px; 
        vertical-align: middle; 
        text-transform: uppercase; 
        font-weight: bold; 
        letter-spacing: 1px;
        transform: translateY(-2px); /* 视觉对齐 */
    }

    /* --- >>> 核心修复 2：悬浮目录 (完美定位 & 无滚动条) <<< --- */
    .single-manuscript {
        max-width: 800px !important; /* 文章宽度固定 800px */
        margin: 40px auto;
        padding: 0 20px;
        position: relative;
    }

    #toc {
        position: fixed;
        top: 140px;
        /* >>> 核心算法：以屏幕中心为基准 <<< */
        /* 50% 是屏幕中间 */
        /* + 400px 是文章右边缘 (文章宽800的一半) */
        /* 我们要放在左边，所以是 50% (中心) - 400px (文章左边缘) - 260px (目录宽+间距) */
        /* 用 right 属性来写就是：距离右边 (50% + 460px) 的位置 */
        right: calc(50% + 460px); 
        
        width: 220px;
        max-height: 70vh;
        
        /* 隐藏滚动条但保留功能 */
        overflow-y: auto;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE */
        
        text-align: right; /* 文字靠右，视觉上紧贴文章 */
        padding-right: 15px;
        /* 加上右侧边框作为视觉引导，如果不喜欢可以删掉下面这行 */
        border-right: 2px solid rgba(212, 175, 55, 0.15); 
        
        z-index: 100;
        opacity: 0;
        transform: translateX(-30px);
        animation: fadeInSlide 0.6s ease-out forwards 0.2s;
    }
    
    #toc::-webkit-scrollbar { display: none; } /* Chrome 隐藏滚动条 */

    #toc a { 
        display: block; 
        margin-bottom: 14px; 
        color: #999; 
        text-decoration: none; 
        font-size: 0.9rem; 
        transition: all 0.2s;
        font-family: 'Lora', serif;
    }
    #toc a:hover { color: #D4AF37; transform: translateX(-5px); }
    
    /* 激活高亮 */
    #toc a.active { 
        color: #8B0000; 
        font-weight: bold; 
        transform: scale(1.05);
    }
    #toc a.active::after { /* 小圆点指示器 */
        content: '●'; 
        position: absolute; 
        right: -20px; /* 正好压在边框线上 */
        top: 0; 
        color: #D4AF37; 
        font-size: 0.6rem; 
        line-height: 1.8;
    }
    
    /* 屏幕小于 1400px 时隐藏目录，避免遮挡内容 */
    @media (max-width: 1400px) { #toc { display: none; } }

    /* --- 其他样式 --- */
    .article-content { width: 100%; font-size: 1.15rem; line-height: 1.8; color: #333; white-space: pre-wrap !important; overflow-wrap: break-word !important; word-wrap: break-word !important; text-align: justify; font-family: 'Lora', sans-serif; }
    .article-content p { margin-bottom: 1em !important; }
    .article-content h1, .article-content h2, .article-content h3 { margin-top: 1.5em !important; margin-bottom: 0.8em !important; font-family: 'Playfair Display', serif; scroll-margin-top: 80px; }
    .article-content img { max-width: 100% !important; height: auto !important; margin: 1em 0; cursor: zoom-in; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    
    .single-icon { font-size: 4rem; margin-bottom: 10px; display: block; line-height: 1; }
    .single-icon img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .list-icon { font-size: 1.5rem; margin-right: 10px; vertical-align: middle; }
    .list-icon img { width: 24px; height: 24px; border-radius: 4px; object-fit: cover; vertical-align: middle; }
    
    .editor-container { display: flex; gap: 20px; align-items: stretch; }
    .editor-pane { width: 100%; transition: width 0.3s ease; }
    .editor-pane.split { width: 50%; }
    .preview-pane { width: 50%; border: 2px solid #D4AF37; border-radius: 6px; padding: 20px; background: #fff; overflow-y: auto; max-height: 600px; }
    .preview-pane.hidden { display: none !important; }
    .editor-textarea { width: 100%; background-color: #1e1e1e !important; color: #d4d4d4 !important; font-family: 'Consolas', monospace !important; font-size: 14px !important; line-height: 1.6 !important; padding: 20px !important; border: 2px solid #D4AF37 !important; border-radius: 6px; white-space: pre !important; overflow: auto !important; word-wrap: normal !important; min-height: 600px; resize: vertical; }
    .editor-textarea:focus { outline: none; border-color: #8B0000 !important; }
    
    .site-footer { margin-top: 80px; padding: 40px 20px; text-align: center; border-top: 1px solid #D4AF37; background: #fdfbf7; color: #704214; }
    .footer-logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: bold; color: #8B0000; display: block; margin-bottom: 10px; }
    .footer-link { margin: 0 10px; color: inherit; text-decoration: none; opacity: 0.7; }
    .footer-link:hover { opacity: 1; color: #8B0000; }
    
    .icon-input-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: #fdfbf7; padding: 10px; border: 1px dashed #D4AF37; border-radius: 6px; }
    .current-icon-preview { font-size: 2rem; width: 50px; text-align: center; }
    .current-icon-preview img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
    .image-crop-container { margin: 20px 0; padding: 20px; background: #2a2a2a; border: 2px solid #D4AF37; text-align: center; }
    .hidden { display: none !important; }
    #crop-wrapper { position: relative; display: inline-block; max-width: 100%; user-select: none; cursor: crosshair; }
    #crop-box { position: absolute; border: 1px dashed #fff; outline: 1px dashed #000; display: none; pointer-events: none; z-index: 10; }
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
    
    .code-wrapper { position: relative; margin: 1.8em 0; border-radius: 8px; overflow: hidden; text-align: left !important; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    pre { background: #272822 !important; color: #f8f8f2 !important; padding: 1.5rem !important; margin: 0 !important; overflow-x: auto; font-family: 'Consolas', monospace !important; white-space: pre !important; }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; opacity: 0; transition: 0.2s; }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    
    .selection-popover { position: absolute; background: #222; border-radius: 5px; padding: 5px 10px; display: flex; gap: 10px; z-index: 10000; opacity: 0; pointer-events: none; transition: 0.2s; transform: translateY(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .selection-popover.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .popover-btn { background: none; border: none; color: #fff; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; }
    .lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 999999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: 0.3s; }
    .lightbox-overlay.active { opacity: 1; pointer-events: auto; }
    .lightbox-img { max-width: 95%; max-height: 95%; border: 2px solid #D4AF37; transform: scale(0.9); transition: 0.3s; }
    .lightbox-overlay.active .lightbox-img { transform: scale(1); }
    mark { background-color: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px; }
    
    .skeleton { animation: shimmer 2s infinite linear; background: linear-gradient(to right, #eee 4%, #f5f5f5 25%, #eee 36%); background-size: 1000px 100%; border-radius: 4px; }
    .skeleton-card { padding: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
    .skeleton-title { height: 28px; width: 60%; margin-bottom: 15px; }
    .skeleton-img { height: 200px; width: 100%; margin-bottom: 15px; }
    .skeleton-text { height: 16px; width: 100%; margin-bottom: 8px; }
    .skeleton-text.short { width: 80%; }
  `;
  document.head.appendChild(style);
}
