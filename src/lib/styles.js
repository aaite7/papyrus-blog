// src/lib/styles.js

export function injectGlobalStyles() {
  const styleId = 'minimalist-global-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* --- 基础动画 --- */
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    .star-icon { display: inline-block; color: #D4AF37; margin: 0 15px; font-size: 1.5rem; vertical-align: middle; animation: twinkle 3s infinite ease-in-out; }
    
    /* --- >>> 核心修复：裁剪区域样式 <<< --- */
    .image-crop-container { 
        margin: 20px 0; 
        padding: 20px; 
        background: #2a2a2a; /* 深色背景，突出图片 */
        border: 2px solid #D4AF37; 
        border-radius: 8px;
        text-align: center; /* 居中显示 */
    }
    .hidden { display: none !important; }
    
    #crop-wrapper { 
        position: relative; 
        display: inline-block; 
        max-width: 100%; 
        line-height: 0; /* 消除图片底部空隙 */
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
        user-select: none; /* 禁止文字选中 */
        -webkit-user-select: none;
        cursor: crosshair; 
    }
    
    /* 裁剪框：使用 outline 实现双色虚线，确保可见性 */
    #crop-box { 
        position: absolute; 
        border: 1px dashed #fff; 
        outline: 1px dashed #000; 
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6); /* 聚焦灯效果 */
        display: none; 
        pointer-events: none; /* 关键：让鼠标事件穿透框框 */
        z-index: 10; 
    }
    
    .crop-controls { display: flex; gap: 10px; margin-top: 15px; justify-content: center; }

    /* --- 其他样式保持不变 (为了节省篇幅，这里简写，请确保你保留了原来的 Toast/Editor/Footer 样式) --- */
    /* 请保留你之前 src/lib/styles.js 中的其他样式：
       .editor-textarea, .article-content, .toast-notification, .floating-bar, .site-footer 等等...
       如果没有备份，我可以给你完整版。这里仅展示针对裁剪的修复。
    */
    /* (建议保留原文件其他部分，只覆盖 image-crop-container 相关部分，或者如果你需要我提供完整 styles.js 请告诉我) */
    
    /* --- 下面是必须保留的核心基础样式，防止覆盖后页面错乱 --- */
    .hero { position: relative !important; overflow: hidden !important; }
    #reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 6px; background: linear-gradient(90deg, #FFD700, #FF4500); z-index: 2147483647; display: block !important; }
    .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
    .toast-notification { background: rgba(30, 30, 30, 0.95); color: #fff; padding: 12px 24px; border-radius: 50px; font-family: 'Lora', serif; font-size: 0.95rem; border: 1px solid #D4AF37; display: flex; align-items: center; gap: 10px; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: auto; }
    .toast-notification.show { opacity: 1; transform: translateY(0); }
    .floating-bar { position: fixed; bottom: 50px; right: 30px; display: flex; flex-direction: column; gap: 15px; z-index: 99999; opacity: 1; pointer-events: auto; }
    .action-btn { width: 50px; height: 50px; border-radius: 50%; background: #fdfbf7; color: #704214; border: 2px solid #D4AF37; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; position: relative; }
    .btn-badge { position: absolute; top: -5px; right: -5px; background: #8B0000; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; pointer-events: none; }
    .editor-container { display: flex; gap: 20px; align-items: stretch; }
    .editor-pane { width: 100%; transition: width 0.3s ease; }
    .editor-pane.split { width: 50%; }
    .preview-pane { width: 50%; border: 2px solid #D4AF37; border-radius: 6px; padding: 20px; background: #fff; overflow-y: auto; max-height: 600px; }
    .preview-pane.hidden { display: none !important; }
    .editor-textarea { width: 100%; background-color: #1e1e1e !important; color: #d4d4d4 !important; font-family: 'Consolas', monospace !important; font-size: 14px !important; line-height: 1.6 !important; padding: 20px !important; border: 2px solid #D4AF37 !important; border-radius: 6px; white-space: pre !important; overflow: auto !important; word-wrap: normal !important; min-height: 600px; resize: vertical; }
    .icon-input-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: #fdfbf7; padding: 10px; border: 1px dashed #D4AF37; border-radius: 6px; }
    .current-icon-preview { font-size: 2rem; width: 50px; text-align: center; }
    .current-icon-preview img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
    .site-footer { margin-top: 80px; padding: 40px 20px; text-align: center; border-top: 1px solid #D4AF37; background: #fdfbf7; }
    .article-content img { max-width: 100% !important; height: auto !important; margin: 1em 0; }
  `;
  document.head.appendChild(style);
}
