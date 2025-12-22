// src/lib/styles.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 1. 全局重置 --- */
    * { box-sizing: border-box; }
    
    /* 基础动画 */
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    @keyframes snowfall { 0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) translateX(20px) rotate(360deg); opacity: 0; } }
    @keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
    
    .star-icon { display: inline-block; color: #D4AF37; margin: 0 15px; font-size: 1.5rem; vertical-align: middle; animation: twinkle 3s infinite ease-in-out; }
    
    .hero { position: relative !important; overflow: hidden !important; z-index: 1; }
    .snowflake { position: absolute; top: -10px; background: white; border-radius: 50%; pointer-events: none; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }

    /* --- 2. 卡片与布局 --- */
    .manuscript {
        background: #fff;
        padding: 40px;
        border: 1px solid rgba(212, 175, 55, 0.2);
        border-radius: 8px;
        margin-bottom: 40px;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        overflow: hidden;
        transition: all 0.3s;
    }
    .manuscript:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

    .single-manuscript {
        max-width: 800px !important;
        margin: 40px auto;
        background: #fff;
        padding: 50px;
        border: 1px solid rgba(212, 175, 55, 0.2);
        border-radius: 8px;
        box-shadow: 0 4px 30px rgba(0,0,0,0.03);
        position: relative;
        transition: all 0.3s;
    }

    .manuscript-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
        text-align: center;
    }

    .manuscript-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; color: #8B0000; margin: 0; line-height: 1.3; }
    .single-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #8B0000; margin: 0 0 10px 0; line-height: 1.2; text-align: center; }
    
    .pinned-badge { display: inline-block; background: #D4AF37; color: #fff; font-size: 0.7rem; padding: 4px 10px; border-radius: 20px; font-weight: bold; letter-spacing: 1px; }
    .list-icon { font-size: 3rem; line-height: 1; margin: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
    .list-icon img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
    .single-icon { font-size: 4rem; margin-bottom: 20px; display: block; text-align: center; }
    .single-icon img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; }

    /* --- 3. 悬浮目录 (TOC) --- */
    #toc {
        position: fixed !important; top: 120px !important;
        left: 20px !important; width: 240px !important; max-height: 70vh;
        overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none;
        z-index: 999; text-align: left; padding-left: 10px; border-left: 2px solid rgba(212, 175, 55, 0.15);
    }
    #toc::-webkit-scrollbar { display: none !important; }
    #toc a { display: block; margin-bottom: 12px; color: #999; text-decoration: none; font-size: 0.9rem; font-family: 'Lora', serif; transition: 0.2s; padding-left: 10px; }
    #toc a:hover { color: #D4AF37; padding-left: 15px; }
    #toc a.active { color: #8B0000; font-weight: bold; padding-left: 15px; border-left: 3px solid #8B0000; margin-left: -12px; }
    @media (max-width: 1200px) { #toc { display: none !important; } }

    /* --- 4. 暗黑模式 --- */
    body.dark-mode { background: #121212 !important; color: #e0e0e0; }
    body.dark-mode .manuscript, body.dark-mode .single-manuscript { background: #1e1e1e !important; border-color: #333 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    body.dark-mode .manuscript-title, body.dark-mode .single-title { color: #f0f0f0 !important; }
    body.dark-mode .article-content { color: #ccc !important; }
    body.dark-mode .site-footer { background: #181818 !important; border-top-color: #333 !important; color: #888 !important; }
    body.dark-mode .editor-textarea { background: #1e1e1e !important; color: #d4d4d4 !important; border-color: #444 !important; }
    body.dark-mode #toc a { color: #666; }
    body.dark-mode #toc a:hover, body.dark-mode #toc a.active { color: #D4AF37; }

    /* --- 文章内容样式 --- */
    .article-content { width: 100%; font-size: 1.15rem; line-height: 1.8; color: #333; white-space: pre-wrap !important; overflow-wrap: break-word !important; text-align: justify; font-family: 'Lora', sans-serif; }
    .article-content p { margin-bottom: 1.5em; }

    /* >>> 修复：强制去除文章内表格的边框 (解决“框框”问题) <<< */
    .article-content table { border-collapse: collapse; border: none !important; margin: 1em 0; }
    .article-content td, 
    .article-content th { 
        border: none !important; 
        background: transparent !important; 
        padding: 5px 0; 
    }
    
    /* >>> 修复：强制杀掉首字下沉 <<< */
    .article-content p::first-letter,
    .article-content p:first-of-type::first-letter,
    .article-content > p:first-child::first-letter {
        float: none !important;
        font-size: inherit !important;
        line-height: inherit !important;
        color: inherit !important;
        margin: 0 !important;
        padding: 0 !important;
        font-weight: normal !important;
        font-family: inherit !important;
    }

    .article-content img { max-width: 100% !important; height: auto !important; margin: 1em 0; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .article-content h1, .article-content h2 { margin-top: 1.5em; margin-bottom: 0.8em; font-family: 'Playfair Display', serif; }
    
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 6px; background: linear-gradient(90deg, #FFD700, #FF4500); z-index: 999999; pointer-events: none; }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast-notification { background: rgba(30, 30, 30, 0.95); color: #fff; padding: 12px 24px; border-radius: 50px; font-family: 'Lora', serif; font-size: 0.95rem; border: 1px solid #D4AF37; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: auto; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: #fdfbf7; color: #704214; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s; position: relative; }
    .action-btn.liked { color: #e91e63 !important; border-color: #e91e63 !important; animation: heartBeat 1s; }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: #8B0000; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; }
    .site-footer { margin-top: 80px; padding: 40px 20px; text-align: center; border-top: 1px solid #D4AF37; background: #fdfbf7; color: #704214; }
    
    .editor-container { display: flex; gap: 20px; align-items: stretch; height: 600px; }
    .editor-pane, .preview-pane { flex: 1; display: flex; flex-direction: column; transition: all 0.3s ease; }
    .hidden { display: none !important; }
    .editor-textarea { width: 100%; height: 100%; background-color: #ffffff !important; color: #333333 !important; font-family: 'Consolas', monospace !important; font-size: 15px !important; line-height: 1.6 !important; padding: 25px !important; border: 2px solid rgba(212, 175, 55, 0.3) !important; border-radius: 8px; resize: none; outline: none; overflow-y: auto !important; white-space: pre-wrap !important; }
    .preview-pane { border: 2px dashed rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 25px; background: #fffdf5; overflow-y: auto; }
    
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background-color: rgba(212, 175, 55, 0.5); border-radius: 4px; }
    
    .image-crop-container { margin: 20px 0; padding: 20px; background: #2a2a2a; border: 2px solid #D4AF37; text-align: center; }
    #crop-wrapper { position: relative; display: inline-block; max-width: 100%; cursor: crosshair; }
    #crop-box { position: absolute; border: 1px dashed #fff; outline: 1px dashed #000; display: none; pointer-events: none; z-index: 10; }
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
    .code-wrapper { position: relative; margin: 1.8em 0; border-radius: 8px; overflow: hidden; text-align: left !important; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    pre { background: #272822 !important; color: #f8f8f2 !important; padding: 1.5rem !important; margin: 0 !important; overflow-x: auto; font-family: 'Consolas', monospace !important; white-space: pre !important; }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; opacity: 0; transition: 0.2s; }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    .selection-popover { position: absolute; background: #222; border-radius: 5px; padding: 5px 10px; display: flex; gap: 10px; z-index: 10000; opacity: 0; pointer-events: none; transition: 0.2s; transform: translateY(10px); }
    .selection-popover.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .popover-btn { background: none; border: none; color: #fff; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; }
    .lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 999999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: 0.3s; }
    .lightbox-overlay.active { opacity: 1; pointer-events: auto; }
    .lightbox-img { max-width: 95%; max-height: 95%; border: 2px solid #D4AF37; transform: scale(0.9); transition: 0.3s; }
    .lightbox-overlay.active .lightbox-img { transform: scale(1); }
    .skeleton { animation: shimmer 2s infinite linear; background: linear-gradient(to right, #eee 4%, #f5f5f5 25%, #eee 36%); background-size: 1000px 100%; border-radius: 4px; }
    .skeleton-card { padding: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
    .skeleton-title { height: 28px; width: 60%; margin-bottom: 15px; }
    .skeleton-img { height: 200px; width: 100%; margin-bottom: 15px; }
    .skeleton-text { height: 16px; width: 100%; margin-bottom: 8px; }
    .skeleton-text.short { width: 80%; }
    mark { background-color: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px; }
  `;
  document.head.appendChild(style);
}
