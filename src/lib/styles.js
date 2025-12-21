// src/lib/styles.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  // 强制移除旧样式，防止重复
  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 全局重置 --- */
    * { box-sizing: border-box; }

    /* --- 1. 核心布局修复 (针对你的截图问题) --- */
    
    /* 文章卡片：强制内边距，防止 "Pinned Post" 顶到边框 */
    .manuscript {
        background: #fff;
        padding: 40px !important; /* >>> 关键修复：强制留白 */
        border: 1px solid rgba(212, 175, 55, 0.2);
        border-radius: 8px;
        margin-bottom: 40px;
        position: relative;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        overflow: hidden; /* 防止溢出 */
    }
    
    /* 目录容器：强制固定在最左侧，无滚动条 */
    #toc {
        position: fixed !important;
        top: 120px !important;
        left: 20px !important; /* >>> 关键修复：贴在屏幕左边 */
        width: 220px !important;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 9999;
        text-align: left;
        padding-left: 5px;
        
        /* 隐藏滚动条 */
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE */
    }
    #toc::-webkit-scrollbar { display: none !important; } /* Chrome */

    /* 目录链接样式 */
    #toc a {
        display: block;
        margin-bottom: 12px;
        color: #999;
        text-decoration: none;
        font-size: 0.9rem;
        font-family: 'Lora', serif;
        transition: 0.2s;
        border-left: 2px solid transparent;
        padding-left: 10px;
    }
    #toc a:hover { color: #D4AF37; padding-left: 15px; }
    #toc a.active { 
        color: #8B0000; 
        font-weight: bold; 
        border-left: 3px solid #8B0000; /* 左侧高亮线 */
        padding-left: 15px;
    }
    /* 屏幕太窄时隐藏目录 */
    @media (max-width: 1200px) { #toc { display: none !important; } }

    /* 详情页容器：限制宽度，居中 */
    .single-manuscript {
        max-width: 800px !important;
        margin: 40px auto !important;
        padding: 0 20px;
        position: relative;
    }

    /* --- 2. 其他基础样式 (保持完整性) --- */
    .pinned-badge { display: inline-block; background: #D4AF37; color: #fff; font-size: 0.7rem; padding: 3px 8px; border-radius: 4px; margin-right: 10px; vertical-align: middle; text-transform: uppercase; font-weight: bold; transform: translateY(-2px); }
    .manuscript-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; color: #8B0000; margin: 0 0 15px 0; line-height: 1.3; }
    .single-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #8B0000; margin-bottom: 20px; line-height: 1.2; text-align: center; }
    
    .article-content { width: 100%; font-size: 1.15rem; line-height: 1.8; color: #333; white-space: pre-wrap !important; overflow-wrap: break-word !important; text-align: justify; font-family: 'Lora', sans-serif; }
    .article-content img { max-width: 100% !important; height: auto !important; margin: 1em 0; border-radius: 4px; }
    
    /* 基础组件 */
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 6px; background: linear-gradient(90deg, #FFD700, #FF4500); z-index: 999999; pointer-events: none; }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast-notification { background: rgba(30, 30, 30, 0.95); color: #fff; padding: 12px 24px; border-radius: 50px; font-family: 'Lora', serif; font-size: 0.95rem; border: 1px solid #D4AF37; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: auto; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: #fdfbf7; color: #704214; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s; position: relative; }
    .action-btn:hover { transform: scale(1.1); background: #fff; color: #8B0000; }
    .action-btn.liked { color: #e91e63 !important; border-color: #e91e63 !important; animation: heartBeat 1s; }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: #8B0000; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; }
    
    /* 图标 & 动画 */
    .single-icon { font-size: 4rem; margin-bottom: 10px; display: block; text-align: center; }
    .single-icon img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; }
    .list-icon { font-size: 1.5rem; margin-right: 10px; vertical-align: middle; }
    .list-icon img { width: 24px; height: 24px; border-radius: 4px; object-fit: cover; vertical-align: middle; }
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
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
    
    /* 裁剪 & 骨架 */
    .image-crop-container { margin: 20px 0; padding: 20px; background: #2a2a2a; border: 2px solid #D4AF37; text-align: center; }
    .hidden { display: none !important; }
    #crop-wrapper { position: relative; display: inline-block; max-width: 100%; user-select: none; cursor: crosshair; }
    #crop-box { position: absolute; border: 1px dashed #fff; outline: 1px dashed #000; display: none; pointer-events: none; z-index: 10; }
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }
    .skeleton { animation: shimmer 2s infinite linear; background: linear-gradient(to right, #eee 4%, #f5f5f5 25%, #eee 36%); background-size: 1000px 100%; border-radius: 4px; }
    .skeleton-card { padding: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
    @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
    
    /* 代码块 */
    .code-wrapper { position: relative; margin: 1.8em 0; border-radius: 8px; overflow: hidden; text-align: left !important; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    pre { background: #272822 !important; color: #f8f8f2 !important; padding: 1.5rem !important; margin: 0 !important; overflow-x: auto; font-family: 'Consolas', monospace !important; white-space: pre !important; }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; opacity: 0; transition: 0.2s; }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    
    .site-footer { margin-top: 80px; padding: 40px 20px; text-align: center; border-top: 1px solid #D4AF37; background: #fdfbf7; color: #704214; }
    .icon-input-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: #fdfbf7; padding: 10px; border: 1px dashed #D4AF37; border-radius: 6px; }
    .current-icon-preview { font-size: 2rem; width: 50px; text-align: center; }
    .current-icon-preview img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
    mark { background-color: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px; }
  `;
  document.head.appendChild(style);
}
