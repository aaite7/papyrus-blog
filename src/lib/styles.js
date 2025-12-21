// src/lib/styles.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 基础动画 --- */
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    @keyframes snowfall { 0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) translateX(20px) rotate(360deg); opacity: 0; } }
    @keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
    
    .star-icon { display: inline-block; color: #D4AF37; margin: 0 15px; font-size: 1.5rem; vertical-align: middle; animation: twinkle 3s infinite ease-in-out; }
    .hero { position: relative !important; overflow: hidden !important; }
    .snowflake { position: absolute; top: -10px; background: white; border-radius: 50%; pointer-events: none; z-index: 1; box-shadow: 0 0 5px rgba(255,255,255,0.8); }

    /* --- >>> 核心升级：Post Icon 样式 <<< --- */
    /* 1. 详情页大图标 */
    .single-icon { font-size: 4rem; margin-bottom: 10px; display: block; line-height: 1; }
    .single-icon img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    
    /* 2. 列表页小图标 */
    .list-icon { font-size: 1.5rem; margin-right: 10px; vertical-align: middle; }
    .list-icon img { width: 24px; height: 24px; border-radius: 4px; object-fit: cover; vertical-align: middle; }

    /* 3. 编辑器图标输入区 */
    .icon-input-wrapper {
        display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        background: #fdfbf7; padding: 10px; border: 1px dashed #D4AF37; border-radius: 6px;
    }
    .current-icon-preview { font-size: 2rem; width: 50px; text-align: center; }
    .current-icon-preview img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }

    /* --- 原有样式保持不变 --- */
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 6px; background: linear-gradient(90deg, #FFD700, #FF4500); z-index: 2147483647; transition: width 0.1s linear; box-shadow: 0 2px 8px rgba(0,0,0,0.5); pointer-events: none; display: block !important; }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast-notification { background: rgba(30, 30, 30, 0.95); color: #fff; padding: 12px 24px; border-radius: 50px; font-family: 'Lora', serif; font-size: 0.95rem; box-shadow: 0 5px 20px rgba(0,0,0,0.3); border: 1px solid #D4AF37; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: auto; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: #fdfbf7; color: #704214; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s; position: relative; }
    .action-btn:hover { transform: scale(1.1); background: #fff; color: #8B0000; }
    .action-btn:active { transform: scale(0.95); }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: #8B0000; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; font-family: 'Consolas', monospace; pointer-events: none; }
    .liked { color: #e91e63 !important; border-color: #e91e63 !important; animation: heartBeat 1s; }
    .editor-textarea { background-color: #1e1e1e !important; color: #d4d4d4 !important; font-family: 'Consolas', 'Monaco', monospace !important; font-size: 14px !important; line-height: 1.6 !important; padding: 20px !important; border: 2px solid #D4AF37 !important; border-radius: 6px; white-space: pre !important; overflow: auto !important; word-wrap: normal !important; tab-size: 4; min-height: 500px; }
    .editor-textarea:focus { outline: none; border-color: #8B0000 !important; }
    .article-content { font-size: 1.15rem; line-height: 1.8; color: #333; white-space: pre-wrap !important; overflow-wrap: break-word !important; max-width: 100%; text-align: left; font-family: 'Lora', sans-serif; }
    .article-content p { margin-bottom: 0.5em !important; }
    .article-content h1, .article-content h2 { margin-top: 1.5em !important; margin-bottom: 0.8em !important; font-family: 'Playfair Display', serif; }
    .article-content img { max-width: 100% !important; height: auto !important; margin: 1em 0; cursor: zoom-in; }
    .code-wrapper { position: relative; margin: 1.8em 0; border-radius: 8px; overflow: hidden; text-align: left !important; }
    pre { background: #272822 !important; color: #f8f8f2 !important; padding: 1.2rem !important; margin: 0 !important; overflow-x: auto; font-family: 'Consolas', monospace !important; white-space: pre !important; }
    .copy-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 4px; cursor: pointer; opacity: 0; transition: 0.2s; }
    .code-wrapper:hover .copy-btn { opacity: 1; }
    .selection-popover { position: absolute; background: #222; border-radius: 5px; padding: 5px 10px; display: flex; gap: 10px; z-index: 10000; opacity: 0; pointer-events: none; transition: 0.2s; transform: translateY(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .selection-popover.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
    .popover-btn { background: none; border: none; color: #fff; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; }
    .lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 999999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: 0.3s; }
    .lightbox-overlay.active { opacity: 1; pointer-events: auto; }
    .lightbox-img { max-width: 95%; max-height: 95%; border: 2px solid #D4AF37; transform: scale(0.9); transition: 0.3s; }
    .lightbox-overlay.active .lightbox-img { transform: scale(1); }
    .site-footer { margin-top: 80px; padding: 40px 20px; text-align: center; border-top: 1px solid #D4AF37; background: #fdfbf7; color: #704214; }
    .footer-logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: bold; color: #8B0000; display: block; margin-bottom: 10px; }
    .footer-link { margin: 0 10px; color: inherit; text-decoration: none; opacity: 0.7; }
    .footer-link:hover { opacity: 1; color: #8B0000; }
    .image-crop-container { margin: 20px 0; padding: 20px; background: #fdfbf7; border: 2px solid #D4AF37; }
    .hidden { display: none !important; }
    mark { background-color: rgba(212, 175, 55, 0.4); color: inherit; padding: 0 2px; border-radius: 2px; }
  `;
  document.head.appendChild(style);
}
