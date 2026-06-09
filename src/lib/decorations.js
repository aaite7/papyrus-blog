// src/lib/decorations.js

export function injectDecorations() {
  const styleId = 'decorations-global-styles';
  const old = document.getElementById(styleId);
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* ==================== 新首页布局 ==================== */
    .home-layout { display: grid; grid-template-columns: 1fr 320px; gap: 60px; max-width: 1500px; margin: 0 auto; padding: 0 50px; }
    .main-content { min-width: 0; }
    @media (max-width: 1200px) { .home-layout { grid-template-columns: 1fr; gap: 40px; } .sidebar { position: static !important; margin-top: 40px; } }
    @media (max-width: 768px) { .home-layout { padding: 0 20px; } }
    
    /* Hero 区域增强 */
    .hero { position: relative; overflow: hidden; z-index: 1; text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #f4ebe1 0%, #fffef7 100%); border-bottom: 1px solid rgba(212, 175, 55, 0.2); }
    body.dark-mode .hero { background: linear-gradient(135deg, #1a1612 0%, #2a2420 100%); }
    .hero-title { font-family: 'Playfair Display', serif; font-size: 3.5rem; color: #8B0000; margin-bottom: 20px; animation: fadeInUp 0.8s ease; }
    body.dark-mode .hero-title { color: #f0f0f0; }
    .hero-subtitle { font-family: 'Caveat', cursive; font-size: 1.8rem; color: #D4AF37; margin-bottom: 15px; }
    .hero-description { font-family: 'Lora', serif; font-size: 1.1rem; color: #666; max-width: 600px; margin: 0 auto 25px; line-height: 1.8; }
    body.dark-mode .hero-description { color: #ccc; }
    .hero-features { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-top: 25px; }
    .feature-tag { background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; color: #D4AF37; }
    
    /* 焦点文章区 */
    .featured-section { margin: 40px 0; animation: fadeInUp 0.8s ease; }
    .featured-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; background: linear-gradient(135deg, #fffdf5 0%, #f4ebe1 100%); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); transition: all 0.3s ease; position: relative; }
    body.dark-mode .featured-content { background: linear-gradient(135deg, #2a2420 0%, #1e1e1e 100%); border-color: rgba(212, 175, 55, 0.5); }
    .featured-content:hover { transform: translateY(-5px); box-shadow: 0 15px 50px rgba(0,0,0,0.12); }
    .featured-image { background-size: cover; background-position: center; min-height: 300px; position: relative; }
    .featured-badge { position: absolute; bottom: 20px; left: 20px; background: #D4AF37; color: #fff; padding: 6px 14px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; }
    .featured-info { padding: 35px; display: flex; flex-direction: column; justify-content: center; }
    .featured-label { font-size: 0.8rem; color: #D4AF37; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-bottom: 15px; }
    .featured-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: #8B0000; margin-bottom: 15px; line-height: 1.3; }
    body.dark-mode .featured-title { color: #f0f0f0; }
    .featured-excerpt { color: #666; line-height: 1.7; margin-bottom: 20px; }
    body.dark-mode .featured-excerpt { color: #ccc; }
    .featured-meta { display: flex; gap: 20px; margin-bottom: 25px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: #888; }
    .btn-featured { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #fff; border: none; padding: 14px 30px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 10px; position: relative; overflow: hidden; }
    .btn-featured:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4); }
    .btn-featured:hover .btn-arrow { transform: translateX(5px); }
    
    /* 区块标题 */
    .section-title { display: flex; justify-content: space-between; align-items: center; margin: 40px 0 25px; padding-bottom: 15px; border-bottom: 2px solid rgba(212, 175, 55, 0.2); }
    .section-title h2 { display: flex; align-items: center; gap: 10px; font-family: 'Playfair Display', serif; font-size: 1.8rem; color: #8B0000; }
    body.dark-mode .section-title h2 { color: #f0f0f0; }
    .post-count { background: rgba(212, 175, 55, 0.1); padding: 6px 14px; border-radius: 20px; font-size: 0.9rem; color: #D4AF37; animation: pulse 2s infinite; }
    
    /* 侧边栏 */
    .sidebar { position: sticky; top: 20px; height: fit-content; }
    .widget { background: #fff; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 25px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: all 0.3s ease; position: relative; }
    body.dark-mode .widget { background: #1e1e1e; border-color: rgba(212, 175, 55, 0.3); }
    .widget:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
    .widget::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); transform: scaleX(0); transition: transform 0.3s ease; }
    .widget:hover::after { transform: scaleX(1); }
    .widget-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #fff; }
    .widget-icon { font-size: 1.3rem; }
    .widget-header h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: bold; }
    .widget-content { padding: 20px; }
    
    /* 个人简介 */
    .widget-profile { position: relative; text-align: center; }
    .profile-bg { height: 80px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); }
    .profile-avatar { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); width: 80px; height: 80px; background: #fff; border: 3px solid #D4AF37; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    body.dark-mode .profile-avatar { background: #2a2420; }
    .profile-info { padding-top: 50px; padding-bottom: 20px; }
    .profile-info h3 { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #8B0000; margin-bottom: 10px; }
    body.dark-mode .profile-info h3 { color: #f0f0f0; }
    .profile-bio { color: #666; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px; }
    body.dark-mode .profile-bio { color: #ccc; }
    .profile-stats { display: flex; justify-content: space-around; padding-top: 15px; border-top: 1px solid rgba(212, 175, 55, 0.2); }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .stat-value { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: bold; color: #D4AF37; }
    .stat-label { font-size: 0.8rem; color: #888; }
    
    /* 热门文章 */
    .popular-list { display: flex; flex-direction: column; gap: 15px; }
    .popular-item { display: flex; gap: 15px; align-items: flex-start; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
    .popular-item:hover { background: rgba(212, 175, 55, 0.05); }
    .popular-rank { width: 28px; height: 28px; border-radius: 50%; background: rgba(212, 175, 55, 0.2); color: #D4AF37; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; }
    .popular-rank.top-3 { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #fff; }
    .popular-info { flex: 1; min-width: 0; }
    .popular-info h4 { font-size: 0.95rem; color: #333; margin-bottom: 6px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    body.dark-mode .popular-info h4 { color: #f0f0f0; }
    .popular-views { font-size: 0.85rem; color: #888; }
    
    /* 标签云 */
    .tags-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag-item { background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); padding: 6px 12px; border-radius: 16px; font-size: 0.85rem; color: #D4AF37; cursor: pointer; transition: all 0.3s ease; }
    .tag-item:hover { background: #D4AF37; color: #fff; transform: scale(1.05); }
    
    /* 快速导航 */
    .quick-nav { display: flex; flex-direction: column; gap: 12px; }
    .nav-item { display: flex; align-items: center; gap: 10px; color: #666; text-decoration: none; padding: 10px; border-radius: 6px; transition: all 0.3s ease; }
    body.dark-mode .nav-item { color: #ccc; }
    .nav-item:hover { background: rgba(212, 175, 55, 0.1); color: #D4AF37; transform: translateX(5px); }
    
    /* 搜索框 */
    .search-box { display: flex; gap: 0; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; overflow: hidden; }
    .search-box input { flex: 1; border: none; padding: 12px 15px; font-size: 0.95rem; outline: none; background: #fff; color: #333; }
    body.dark-mode .search-box input { background: #2a2420; color: #f0f0f0; }
    .search-btn { background: #D4AF37; border: none; padding: 0 18px; cursor: pointer; font-size: 1.1rem; color: #fff; transition: background 0.3s; }
    .search-btn:hover { background: #B8860B; }
    
    /* 空状态 */
    .empty-state { text-align: center; padding: 60px 20px; background: rgba(212, 175, 55, 0.05); border-radius: 12px; border: 2px dashed rgba(212, 175, 55, 0.3); animation: fadeIn 0.5s ease; }
    .empty-icon { font-size: 4rem; margin-bottom: 20px; }
    .empty-state h3 { color: #8B0000; font-family: 'Playfair Display', serif; margin-bottom: 10px; }
    body.dark-mode .empty-state h3 { color: #f0f0f0; }
    .empty-state p { color: #666; margin-bottom: 20px; }
    body.dark-mode .empty-state p { color: #ccc; }
    .btn-clear-search { background: #D4AF37; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s; }
    .btn-clear-search:hover { background: #B8860B; transform: translateY(-2px); }
    
    /* 卡片增强 */
    .manuscript.featured-card { grid-column: 1 / -1; transform: scale(1.02); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
    .manuscript.featured-card:hover { transform: scale(1.03) translateY(-3px); }
    .manuscript .footer-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #888; margin-right: 15px; }
    .manuscript .category-tag { background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); padding: 4px 10px; border-radius: 12px; color: #D4AF37; }
    .manuscript::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%); opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
    .manuscript:hover::before { opacity: 1; }
    .manuscript-title { transition: color 0.3s ease; }
    .manuscript:hover .manuscript-title { color: #D4AF37; }
    .manuscript-image-container { overflow: hidden; }
    .manuscript-image-container img { transition: transform 0.5s ease; }
    .manuscript:hover .manuscript-image-container img { transform: scale(1.05); }
    .manuscript-footer { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(212, 175, 55, 0.2); }
    
    /* 装饰元素 */
    .scroll-divider { text-align: center; padding: 30px 0; color: #D4AF37; font-size: 1.5rem; letter-spacing: 10px; opacity: 0.6; }
    .ink-splash { position: absolute; width: 200px; height: 200px; background: radial-gradient(circle, rgba(139,0,0,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
    .ink-splash.top-right { top: -100px; right: -100px; }
    .ink-splash.bottom-left { bottom: -100px; left: -100px; }
    
    .corner-ornament { position: absolute; width: 60px; height: 60px; border: 3px solid #D4AF37; pointer-events: none; }
    .corner-ornament.top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
    .corner-ornament.top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
    .corner-ornament.bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
    .corner-ornament.bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }
    
    .seal-decoration { position: fixed; bottom: 100px; right: 30px; width: 60px; height: 60px; background: radial-gradient(circle, #c97a7a 0%, #800020 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Caveat', cursive; font-size: 1.5rem; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transform: rotate(-15deg); opacity: 0.8; z-index: 9999; pointer-events: none; }
    
    /* 加载动画 */
    .loading-spinner { text-align: center; padding: 40px 20px; }
    .spinner-scroll { width: 60px; height: 40px; margin: 0 auto 20px; position: relative; }
    .spinner-body { width: 100%; height: 100%; border: 3px solid rgba(212, 175, 55, 0.3); border-radius: 4px; animation: scrollUnfold 1.5s infinite; }
    @keyframes scrollUnfold { 0%, 100% { transform: scaleY(0.8); opacity: 0.5; } 50% { transform: scaleY(1.1); opacity: 1; } }
    .loading-spinner p { color: #888; font-size: 0.95rem; }
    
    .end-message { text-align: center; padding: 40px 20px; color: #999; }
    .end-icon { font-size: 1.5rem; color: #D4AF37; animation: twinkle 2s infinite; }
    .end-message p { margin-top: 10px; font-size: 0.95rem; }
    
    .scroll-trigger { height: 100px; }
    
    /* 动画 */
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeInUp 0.6s ease; }
    
    .featured-content::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%); opacity: 0; transition: opacity 0.5s; pointer-events: none; }
    .featured-content:hover::before { opacity: 1; }
    
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.2) rotate(15deg); } }
    
    /* 回到顶部按钮 */
    .scroll-top-btn { position: fixed; bottom: 120px; right: 30px; width: 50px; height: 50px; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); opacity: 0; visibility: hidden; transform: translateY(20px); transition: all 0.3s ease; z-index: 9998; }
    .scroll-top-btn.visible { opacity: 1; visibility: visible; transform: translateY(0); }
    .scroll-top-btn:hover { background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%); transform: translateY(-5px); box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4); }
    .scroll-top-btn:active { transform: translateY(-2px) scale(0.95); }
    .scroll-top-btn svg { width: 24px; height: 24px; stroke-width: 2.5; }
    
    /* 搜索历史 */
    .search-history-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 1000; margin-top: 8px; overflow: hidden; }
    body.dark-mode .search-history-dropdown { background: #1e1e1e; }
    .search-history-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: rgba(212, 175, 55, 0.1); border-bottom: 1px solid rgba(212, 175, 55, 0.2); }
    .search-history-header span { font-size: 0.9rem; color: #666; font-weight: bold; }
    body.dark-mode .search-history-header span { color: #ccc; }
    .clear-history-btn { background: none; border: none; color: #999; cursor: pointer; font-size: 1.1rem; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; }
    .clear-history-btn:hover { background: rgba(212, 175, 55, 0.2); color: #D4AF37; }
    .search-history-list { list-style: none; padding: 0; margin: 0; max-height: 250px; overflow-y: auto; }
    .search-history-item { display: flex; align-items: center; gap: 10px; padding: 12px 15px; cursor: pointer; transition: background 0.2s; }
    .search-history-item:hover { background: rgba(212, 175, 55, 0.08); }
    .history-icon { font-size: 1rem; opacity: 0.6; }
    .history-text { flex: 1; font-size: 0.95rem; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    body.dark-mode .history-text { color: #f0f0f0; }
    
    /* 焦点指示器 */
    .manuscript:focus-visible, .popular-item:focus-visible, .tag-item:focus-visible, .nav-item:focus-visible { outline: 3px solid #D4AF37; outline-offset: 2px; }
    .btn-featured:focus-visible, .seal-btn:focus-visible, .nav-btn:focus-visible { outline: 3px solid #D4AF37; outline-offset: 4px; }
    input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid rgba(212, 175, 55, 0.5); outline-offset: 2px; }
    button:focus-visible { outline: 3px solid #D4AF37; outline-offset: 2px; }
    
    /* 分享按钮 */
    .share-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; opacity: 0; visibility: hidden; transition: all 0.3s; }
    .share-modal.active { opacity: 1; visibility: visible; }
    .share-content { background: #fff; border-radius: 12px; padding: 30px; max-width: 400px; width: 90%; border: 2px solid rgba(212, 175, 55, 0.3); box-shadow: 0 10px 50px rgba(0,0,0,0.3); }
    body.dark-mode .share-content { background: #1e1e1e; }
    .share-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid rgba(212, 175, 55, 0.2); }
    .share-header h3 { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #8B0000; }
    body.dark-mode .share-header h3 { color: #f0f0f0; }
    .close-share { background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s; }
    .close-share:hover { background: rgba(212, 175, 55, 0.1); color: #D4AF37; }
    .share-buttons { display: flex; gap: 15px; justify-content: center; }
    .share-btn { width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(212, 175, 55, 0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; font-size: 1.5rem; background: transparent; }
    .share-btn:hover { transform: scale(1.1) rotate(8deg); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .share-btn.wechat { color: #07c160; }
    .share-btn.weibo { color: #e6162d; }
    .share-btn.twitter { color: #1da1f2; }
    .share-btn.copy { color: #D4AF37; }
    .share-link-input { width: 100%; padding: 12px; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 6px; font-family: 'Lora', serif; font-size: 0.95rem; margin-top: 20px; background: rgba(212, 175, 55, 0.05); }
    body.dark-mode .share-link-input { background: rgba(212, 175, 55, 0.1); color: #f0f0f0; }
    
    /* 阅读进度 */
    .reading-progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); z-index: 10001; transition: width 0.1s; }
    
    /* 虚拟滚动 */
    .virtual-scroll-wrapper { overflow-y: auto; overflow-x: hidden; will-change: scroll-position; }
    .virtual-scroll-viewport { will-change: transform; }
    .virtual-scroll-item { will-change: auto; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .virtual-scroll-item:last-child { border-bottom: none; }
    
    /* 图片优化 */
    img.loaded { opacity: 1 !important; }
    .image-loading { background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    
    /* 错误通知 */
    .error-notification { animation: slideInRight 0.3s ease; }
    @keyframes slideInRight { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    
    /* ==================== 打印样式优化 ==================== */
    @media print {
      /* 隐藏非必要元素 */
      nav, .scroll-decoration, .hero, .sidebar, .floating-bar, .scroll-top-btn, .seal-decoration, .share-modal, .error-notification, #dark-mode-toggle, #clock-display, .search-scroll, .filter-tags, .section-title, .widget, .toc-sidebar, .post-share-btn, .loading-spinner, .end-message {
        display: none !important;
      }
      
      /* 文章布局优化 */
      .home-layout { display: block !important; }
      .main-content { width: 100% !important; margin: 0 !important; padding: 0 !important; }
      
      /* 文章卡片 */
      .manuscripts { display: block !important; }
      .manuscript { 
        page-break-inside: avoid; 
        break-inside: avoid;
        margin-bottom: 30px !important;
        padding: 20px !important;
        border: 1px solid #000 !important;
        box-shadow: none !important;
        background: #fff !important;
      }
      .manuscript-title { 
        font-size: 18pt !important; 
        color: #000 !important;
        margin-bottom: 10px !important;
      }
      .manuscript-excerpt { 
        font-size: 11pt !important; 
        line-height: 1.6 !important;
        color: #333 !important;
      }
      .manuscript-date, .footer-meta { 
        font-size: 9pt !important; 
        color: #666 !important;
      }
      .manuscript-image-container { 
        max-height: 300px !important; 
        overflow: hidden !important;
        page-break-inside: avoid;
      }
      .manuscript-image-container img { 
        max-width: 100% !important; 
        height: auto !important;
      }
      
      /* 单篇文章 */
      .single-manuscript {
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
      }
      .single-title { 
        font-size: 24pt !important; 
        text-align: center !important;
        color: #000 !important;
        margin-bottom: 20px !important;
      }
      .single-meta { 
        text-align: center !important;
        font-size: 10pt !important;
        color: #666 !important;
        margin-bottom: 30px !important;
        border-bottom: 2px solid #000 !important;
        padding-bottom: 15px !important;
      }
      .single-meta-line { margin-bottom: 5px !important; }
      .single-image { 
        max-width: 100% !important; 
        height: auto !important;
        page-break-inside: avoid;
        margin: 20px 0 !important;
      }
      .article-content { 
        font-size: 11pt !important; 
        line-height: 1.8 !important;
        color: #000 !important;
        text-align: justify !important;
      }
      .article-content p { 
        margin-bottom: 1em !important;
        text-indent: 2em !important;
      }
      .article-content h2 { 
        font-size: 16pt !important; 
        margin-top: 1.5em !important;
        page-break-after: avoid;
      }
      .article-content h3 { 
        font-size: 13pt !important; 
        margin-top: 1.2em !important;
      }
      .article-content img { 
        max-width: 100% !important; 
        height: auto !important;
        page-break-inside: avoid;
      }
      .article-content pre, .article-content code { 
        font-family: 'Courier New', monospace !important;
        font-size: 9pt !important;
        background: #f5f5f5 !important;
        border: 1px solid #ddd !important;
      }
      .article-content pre { 
        padding: 10px !important;
        overflow-x: auto !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
      }
      .article-content blockquote { 
        border-left: 3px solid #000 !important;
        padding-left: 15px !important;
        margin: 1em 0 !important;
        font-style: italic !important;
        color: #333 !important;
      }
      .article-content a { 
        color: #000 !important; 
        text-decoration: underline !important;
      }
      .article-content a[href^="http"]::after { 
        content: " (" attr(href) ")"; 
        font-size: 8pt !important;
      }
      
      /* 页眉页脚 */
      @page {
        margin: 2cm;
        size: A4;
      }
      
      /* 暗色模式适配 */
      body.dark-mode {
        --ink: #000 !important;
        --parchment: #fff !important;
        background: #fff !important;
      }
      body.dark-mode * {
        color: #000 !important;
        background: #fff !important;
        border-color: #000 !important;
      }
      
      /* 链接显示 */
      a {
        text-decoration: underline;
        color: #000;
      }
      
      /* 避免空白页 */
      body {
        font-size: 11pt;
        line-height: 1.6;
      }
    }
    
    /* 移动端优化 */
    @media (max-width: 768px) {
      .hero-title { font-size: 2.2rem; }
      .hero-subtitle { font-size: 1.3rem; }
      .hero-description { font-size: 0.95rem; }
      .featured-content { grid-template-columns: 1fr; }
      .featured-image { min-height: 200px; }
      .sidebar { position: static !important; }
      .widget { margin-bottom: 20px; }
      .section-title h2 { font-size: 1.4rem; }
      .manuscript.featured-card { transform: none; }
      .seal-decoration { display: none; }
    }
    
    /* 归档页面 */
    .archive-page { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
    .archive-header { text-align: center; margin-bottom: 50px; padding: 40px; background: linear-gradient(135deg, #fffdf5 0%, #f4ebe1 100%); border-radius: 12px; border: 2px solid rgba(212, 175, 55, 0.3); }
    body.dark-mode .archive-header { background: linear-gradient(135deg, #2a2420 0%, #1e1e1e 100%); }
    .archive-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #8B0000; margin-bottom: 15px; }
    body.dark-mode .archive-title { color: #f0f0f0; }
    .archive-subtitle { color: #666; font-size: 1.1rem; }
    body.dark-mode .archive-subtitle { color: #ccc; }
    .archive-timeline { position: relative; padding-left: 30px; }
    .archive-timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, #D4AF37 0%, transparent 100%); }
    .archive-group { margin-bottom: 40px; position: relative; }
    .archive-group::before { content: ''; position: absolute; left: -35px; top: 25px; width: 12px; height: 12px; background: #D4AF37; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    body.dark-mode .archive-group::before { border-color: #1e1e1e; }
    .archive-group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px 20px; background: rgba(212, 175, 55, 0.1); border-radius: 8px; cursor: pointer; transition: all 0.3s; }
    .archive-group-header:hover { background: rgba(212, 175, 55, 0.2); }
    .archive-month { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #8B0000; }
    body.dark-mode .archive-month { color: #f0f0f0; }
    .archive-count { background: #D4AF37; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 0.9rem; font-weight: bold; }
    .archive-posts { display: flex; flex-direction: column; gap: 15px; }
    .archive-post-item { display: flex; gap: 20px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2); transition: all 0.3s; animation: fadeInUp 0.5s ease forwards; opacity: 0; }
    body.dark-mode .archive-post-item { background: #1e1e1e; }
    .archive-post-item:hover { transform: translateX(10px); border-color: #D4AF37; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2); }
    .archive-post-date { display: flex; flex-direction: column; align-items: center; min-width: 60px; }
    .archive-post-date .day { font-size: 2rem; font-weight: bold; color: #D4AF37; line-height: 1; }
    .archive-post-date .month { font-size: 0.9rem; color: #666; text-transform: uppercase; }
    body.dark-mode .archive-post-date .month { color: #ccc; }
    .archive-post-info { flex: 1; min-width: 0; }
    .archive-post-title { display: block; font-family: 'Playfair Display', serif; font-size: 1.2rem; color: #333; text-decoration: none; margin-bottom: 10px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    body.dark-mode .archive-post-title { color: #f0f0f0; }
    .archive-post-title:hover { color: #D4AF37; }
    .archive-post-meta { display: flex; gap: 15px; flex-wrap: wrap; }
    .archive-post-meta .meta-item { font-size: 0.85rem; color: #888; }
    .archive-stats { margin-top: 50px; padding: 30px; background: rgba(212, 175, 55, 0.05); border-radius: 12px; border: 2px dashed rgba(212, 175, 55, 0.3); }
    .archive-stats h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #8B0000; margin-bottom: 25px; text-align: center; }
    body.dark-mode .archive-stats h3 { color: #f0f0f0; }
    .year-stats { display: flex; flex-direction: column; gap: 15px; }
    .year-stat-item { display: flex; align-items: center; gap: 15px; }
    .year-label { font-weight: bold; color: #333; min-width: 80px; }
    body.dark-mode .year-label { color: #f0f0f0; }
    .year-bar-container { flex: 1; height: 8px; background: rgba(212, 175, 55, 0.2); border-radius: 4px; overflow: hidden; }
    .year-bar { height: 100%; background: linear-gradient(90deg, #D4AF37 0%, #B8860B 100%); border-radius: 4px; transition: width 0.5s ease; }
    .year-count { color: #666; font-size: 0.9rem; min-width: 60px; text-align: right; }
    body.dark-mode .year-count { color: #ccc; }
    .archive-group.collapsed .archive-posts { display: none; }
    .archive-group.collapsed .archive-count { transform: rotate(180deg); }
  `;
  document.head.appendChild(style);
}
