// src/lib/styles.js - 精简核心样式

const globalCSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --parchment: #f4ebe1; --ink: #2b1810; --sepia: #8b7355; --gold: #d4af37; --burgundy: #800020; --cream: #fffef7; --shadow: rgba(43, 24, 16, 0.15); }
body.dark-mode { --parchment: #2a2420; --ink: #e8dcc8; --sepia: #b8a588; --burgundy: #c97a7a; --cream: #1a1612; --shadow: rgba(0, 0, 0, 0.3); }
body { font-family: 'Lora', Georgia, serif; background: linear-gradient(135deg, #f4ebe1 0%, #e8dcc8 100%); color: var(--ink); line-height: 1.8; overflow-x: hidden; }
body.dark-mode { background: linear-gradient(135deg, #1a1612 0%, #2a2420 100%); }
@keyframes fadeIn { to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
`;

export function injectGlobalStyles() {
  const styleId = 'global-styles';
  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = globalCSS;
  document.head.appendChild(style);
}

// 按需加载装饰样式（延迟加载）
export function loadDecorations() {
  return import('./decorations.js').then(mod => mod.injectDecorations());
}
