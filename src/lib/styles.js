// src/lib/styles.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  // 1. 强制清理旧样式 (防止缓存导致的样式不生效)
  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 全局重置 --- */
    * { box-sizing: border-box; }

    /* --- 1. 文章卡片布局 (核心修复：Icon 在框内) --- */
    .manuscript {
        background: #fff;
        padding: 40px; /* 内部留白，防止内容贴边 */
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 8px;
        margin-bottom: 40px;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        overflow: hidden; /* 防止溢出 */
        transition: transform 0.2s;
    }
    .manuscript:hover { transform: translateY(-2px); }

    /* >>> 关键修改：头部使用 Flex 垂直居中布局 <<< */
    /* 这会让 Icon, 标题, 日期 从上到下乖乖排列，绝不会跑出框外 */
    .manuscript-header {
        display: flex;
        flex-direction: column; /* 垂直排列 */
        align-items: center;    /* 水平居中 */
        gap: 15px;              /* 元素之间的间距 */
        margin-bottom: 25px;
        text-align: center;
    }

    /* 列表页图标样式 */
    .list-icon {
        font-size: 3rem;       /* 图标调大一点，更好看 */
        line-height: 1;
        margin: 0;             /* 清除多余边距 */
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    .list-icon img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }

    /* 标题样式 */
    .manuscript-title {
        font-family: 'Playfair Display', serif;
        font-size: 2rem;
        color: #8B0000;
        margin: 0;
        line-height: 1.2;
    }

    /* 置顶标签 */
    .pinned-badge { 
        background: #D4AF37; 
        color: #fff; 
        font-size: 0.7rem; 
        padding: 4px 10px; 
        border-radius: 20px; 
        text-transform: uppercase; 
        font-weight: bold; 
        letter-spacing: 1px;
        margin-bottom: 5px; /* 跟下面的图标拉开一点距离 */
    }

    /* --- 2. 悬浮目录 (保持之前修复的完美状态) --- */
    .single-manuscript {
        max-width: 800px !important;
        margin: 40px auto !important;
        padding: 0 20px;
        position: relative;
    }

    #toc {
        position: fixed !important;
        top: 120px !important;
        left: 20px !important; /* 死死钉在屏幕最左边 */
        width: 240px !important;
        max-height: 70vh;
        overflow-y: auto;
        z-index: 9999;
        text-align: left;
        padding-left: 10px;
        border-left: 2px solid rgba(212, 175, 55, 0.15); /* 左侧金线 */
        
        /* 隐藏滚动条 */
        scrollbar-width: none; 
        -ms-overflow-style: none;
    }
    #toc::-webkit-scrollbar { display: none !important; }

    #toc a {
        display: block;
        margin-bottom: 12px;
        color: #999;
        text-decoration: none;
        font-size: 0.9rem;
        font-family: 'Lora', serif;
        transition: 0.2s;
        padding-left: 10px;
    }
    #toc a:hover { color: #D4AF37; padding-left: 15px; }
    #toc a.active { color: #8B0000; font-weight: bold; padding-left: 15px; border-left: 3px solid #8B0000; margin-left: -12px; }
    @media (max-width: 1200px) { #toc { display: none !important; } }

    /* --- 3. 其他基础样式 (保持不变) --- */
    .article-content { width: 100%; font-size: 1.15rem; line-height: 1.8; color: #333; white-space: pre-wrap !important; overflow-wrap: break-word !important; text-align: justify; font-family: 'Lora', sans-serif; }
    .article-content img { max-width: 100% !important; height: auto !important; margin: 1em 0; border-radius: 4px; }
    .article-content h1, .article-content h2 { margin-top: 1.5em; margin-bottom: 0.8em; font-family: 'Playfair Display', serif; }
    
    /* 详情页图标 */
    .single-icon { font-size: 4rem; margin-bottom: 20px; display: block; text-align: center; }
    .single-icon img { width: 80px; height: 80px; border-radius: 10px; }

    /* 组件 */
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 6px; background: linear-gradient(90deg, #FFD700, #FF4500); z-index: 999999; pointer-events: none; }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast-notification { background: rgba(30, 30, 30, 0.95); color: #fff; padding: 12px 24px; border-radius: 50px; font-family: 'Lora', serif; font-size: 0.95rem; border: 1px solid #D4AF37; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: auto; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: #fdfbf7; color: #704214; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s; position: relative; }
    .action-btn.liked { color: #e91e63 !important; border-color: #e91e63 !important; animation: heartBeat 1s; }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: #8B0000; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; }
    
    /* 动画 */
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    @keyframes snowfall { 0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) translateX(20px) rotate(360deg); opacity: 0; } }
    @keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
    .star-icon { display: inline-block; color: #D4AF37; margin: 0 15px; font-size: 1.5rem; vertical-align: middle; animation: twinkle 3s infinite ease-in-out; }
    .hero { position: relative !important; overflow: hidden !important; }
    .snowflake { position: absolute; top: -10px; background: white; border-radius: 50%; pointer-events: none; z-index: 1; box-shadow: 0 0 5px rgba(255,255,255,0.8); }
    
    /* 编辑器 */
    .editor-container { display: flex; gap: 20px; align-items: stretch; }
    .editor-pane { width: 100%; transition: width 0.3s ease; }
    .editor-pane.split { width: 50%; }
    .preview-pane { width: 50%; border: 2px solid #D4AF37; border-radius: 6px; padding: 20px; background: #fff; overflow-y: auto; max-height: 600px; }
    .preview-pane.hidden { display: none !important; }
    .editor-textarea { width: 100%; background-color: #1e1e1e !important; color: #d4d4d4 !important; font-family: 'Consolas', monospace !important; font-size: 14px !important; line-height: 1.6 !important; padding: 20px !important; border: 2px solid #D4AF37 !important; border-radius: 6px; white-space: pre !important; overflow: auto !important; word-wrap: normal !important; min-height: 600px; resize: vertical; }
    .image-crop-container { margin: 20px 0; padding: 20px; background: #2a2a2a; border: 2px solid #D4AF37; text-align: center; }
    .hidden { display: none !important; }
    #crop-wrapper { position: relative; display: inline-block; max-width: 100%; user-select: none; cursor: crosshair; }
    #crop-box { position: absolute; border: 1px dashed #fff; outline: 1px dashed #000; display: none; pointer-events: none; z-index: 10; }
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
    .skeleton { animation: shimmer 2s infinite linear; background: linear-gradient(to right, #eee 4%, #f5f5f5 25%, #eee 36%); background-size: 1000px 100%; border-radius: 4px; }
    .skeleton-card { padding: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; opacity: 0; transition: 0.2s; }
    .code-wrapper { position: relative; margin: 1.8em 0; border-radius: 8px; overflow: hidden; text-align: left !important; }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    pre { background: #272822 !important; color: #f8f8f2 !important; padding: 1.5rem !important; margin: 0 !important; overflow-x: auto; font-family: 'Consolas', monospace !important; white-space: pre !important; }
    .site-footer { margin-top: 80px; padding: 40px 20px; text-align: center; border-top: 1px solid #D4AF37; background: #fdfbf7; color: #704214; }
    .icon-input-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: #fdfbf7; padding: 10px; border: 1px dashed #D4AF37; border-radius: 6px; }
    .current-icon-preview { font-size: 2rem; width: 50px; text-align: center; }
    .current-icon-preview img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
    .selection-popover { position: absolute; background: #222; border-radius: 5px; padding: 5px 10px; display: flex; gap: 10px; z-index: 10000; opacity: 0; pointer-events: none; transition: 0.2s; transform: translateY(10px); }
    .selection-popover.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .popover-btn { background: none; border: none; color: #fff; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; }
    .lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 999999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: 0.3s; }
    .lightbox-overlay.active { opacity: 1; pointer-events: auto; }
    .lightbox-img { max-width: 95%; max-height: 95%; border: 2px solid #D4AF37; transform: scale(0.9); transition: 0.3s; }
    .lightbox-overlay.active .lightbox-img { transform: scale(1); }
    mark { background-color: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px; }
  `;
  document.head.appendChild(style);
}
