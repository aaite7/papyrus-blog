// src/lib/i18n.js

/**
 * 简化多语言支持
 * 使用 localStorage 存储语言偏好
 */

const translations = {
  'zh-CN': {
    // 导航
    'nav.home': '首页',
    'nav.archive': '归档',
    'nav.admin': '管理',
    'nav.logout': '退出',
    
    // 搜索
    'search.placeholder': '搜索文章...',
    'search.no_results': '未找到相关文章',
    'search.results_count': '找到 {count} 篇相关文章',
    
    // 文章
    'article.views': '阅读',
    'article.read_time': '分钟阅读',
    'article.comments': '评论',
    'article.share': '分享',
    'article.print': '打印',
    
    // 分类
    'category.all': '全部文章',
    'category.filtered': '{category} 文章',
    
    // 日期
    'date.today': '今天',
    'date.yesterday': '昨天',
    'date.days_ago': '{days} 天前',
    'date.hours_ago': '{hours} 小时前',
    'date.minutes_ago': '{minutes} 分钟前',
    
    // 错误
    'error.load_failed': '加载失败',
    'error.not_found': '文章未找到',
    'error.network': '网络连接错误',
    
    // 按钮
    'btn.load_more': '加载更多',
    'btn.back_to_top': '回到顶部',
    'btn.retry': '重试'
  },
  
  'en-US': {
    // 导航
    'nav.home': 'Home',
    'nav.archive': 'Archive',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    
    // 搜索
    'search.placeholder': 'Search articles...',
    'search.no_results': 'No articles found',
    'search.results_count': 'Found {count} articles',
    
    // 文章
    'article.views': 'Views',
    'article.read_time': 'min read',
    'article.comments': 'Comments',
    'article.share': 'Share',
    'article.print': 'Print',
    
    // 分类
    'category.all': 'All Posts',
    'category.filtered': '{category} Posts',
    
    // 日期
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
    'date.days_ago': '{days} days ago',
    'date.hours_ago': '{hours} hours ago',
    'date.minutes_ago': '{minutes} minutes ago',
    
    // 错误
    'error.load_failed': 'Failed to load',
    'error.not_found': 'Article not found',
    'error.network': 'Network error',
    
    // 按钮
    'btn.load_more': 'Load More',
    'btn.back_to_top': 'Back to Top',
    'btn.retry': 'Retry'
  }
};

/**
 * 当前语言
 */
let currentLang = localStorage.getItem('language') || 'zh-CN';

/**
 * 设置语言
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    updatePageTexts();
  }
}

/**
 * 获取翻译
 */
export function t(key, params = {}) {
  let text = translations[currentLang]?.[key] || translations['zh-CN'][key] || key;
  
  // 替换参数
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
  });
  
  return text;
}

/**
 * 获取当前语言
 */
export function getLanguage() {
  return currentLang;
}

/**
 * 更新页面上的所有文本
 */
function updatePageTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

/**
 * 初始化 i18n
 */
export function initI18n() {
  // 设置 HTML lang
  document.documentElement.lang = currentLang;
  
  // 更新页面文本
  updatePageTexts();
  
  console.log('[i18n] Initialized with language:', currentLang);
}

/**
 * 语言切换器 UI
 */
export function renderLanguageSwitcher() {
  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];
  
  return `
    <div class="language-switcher" style="position: relative; display: inline-block;">
      <button class="lang-btn" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 8px;">
        ${languages.find(l => l.code === currentLang)?.flag || '🌐'}
      </button>
      <div class="lang-dropdown" style="display: none; position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px;">
        ${languages.map(lang => `
          <button class="lang-option" data-lang="${lang.code}" style="display: block; width: 100%; padding: 12px 20px; text-align: left; background: none; border: none; cursor: pointer; transition: background 0.2s;" onmouseenter="this.style.background='rgba(212, 175, 55, 0.1)'" onmouseleave="this.style.background='none'">
            <span style="margin-right: 10px;">${lang.flag}</span>
            <span>${lang.name}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * 初始化语言切换器
 */
export function initLanguageSwitcher() {
  const btn = document.querySelector('.lang-btn');
  const dropdown = document.querySelector('.lang-dropdown');
  
  if (!btn || !dropdown) return;

  const langs = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];

  btn.addEventListener('click', () => {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });

  dropdown.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', () => {
      setLanguage(option.dataset.lang);
      dropdown.style.display = 'none';
      btn.textContent = langs.find(l => l.code === currentLang)?.flag || '🌐';
    });
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}
