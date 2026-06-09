// src/lib/reading-progress.js

const STORAGE_KEY = 'reading_progress';
const READ_THRESHOLD = 0.7; // 70% 阅读进度算已读

/**
 * 获取阅读进度
 */
export function getReadingProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * 保存阅读进度
 */
export function saveReadingProgress(postId, percentage, timestamp = Date.now()) {
  const progress = getReadingProgress();
  progress[postId] = { percentage, timestamp, completed: percentage >= READ_THRESHOLD };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

/**
 * 检查文章是否已读
 */
export function isPostRead(postId) {
  const progress = getReadingProgress();
  return progress[postId]?.completed || false;
}

/**
 * 获取已读文章列表
 */
export function getReadPosts() {
  const progress = getReadingProgress();
  return Object.entries(progress)
    .filter(([_, data]) => data.completed)
    .map(([id, _]) => id);
}

/**
 * 获取阅读统计
 */
export function getReadingStats() {
  const progress = getReadingProgress();
  const readCount = Object.values(progress).filter(p => p.completed).length;
  const totalTime = Object.values(progress).reduce((acc, p) => acc + (p.percentage / 100) * 5, 0); // 假设每篇 5 分钟
  
  return { readCount, totalTime: Math.round(totalTime) };
}

/**
 * 清除阅读进度
 */
export function clearReadingProgress(postId) {
  if (!postId) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    const progress = getReadingProgress();
    delete progress[postId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {}
  }
}

/**
 * 初始化阅读进度追踪
 */
export function initReadingTracker(postId) {
  if (!postId) return;
  
  let lastScrollTop = 0;
  let ticking = false;
  
  const trackProgress = () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    
    let percentage = 0;
    if (documentHeight > 0) {
      percentage = Math.min(100, Math.max(0, (scrollTop / documentHeight) * 100));
    }
    
    saveReadingProgress(postId, percentage);
    updateProgressBar(percentage);
    
    lastScrollTop = scrollTop;
    ticking = false;
  };
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(trackProgress);
      ticking = true;
    }
  }, { passive: true });
  
  // 显示进度条
  showProgressBar();
  
  // 如果已读，显示标记
  if (isPostRead(postId)) {
    showReadBadge();
  }
}

/**
 * 显示阅读进度条
 */
function showProgressBar() {
  const existing = document.querySelector('.reading-progress-bar');
  if (existing) return;
  
  const bar = document.createElement('div');
  bar.className = 'reading-progress-bar';
  bar.id = 'reading-progress';
  document.body.appendChild(bar);
}

/**
 * 更新进度条
 */
function updateProgressBar(percentage) {
  const bar = document.getElementById('reading-progress');
  if (bar) {
    bar.style.width = `${percentage}%`;
  }
}

/**
 * 显示已读标记
 */
export function showReadBadge() {
  const title = document.querySelector('.single-title');
  if (!title || title.parentElement.querySelector('.read-badge')) return;
  
  const badge = document.createElement('span');
  badge.className = 'read-badge';
  badge.innerHTML = '✓ 已读';
  badge.style.cssText = `
    display: inline-block;
    background: rgba(7, 193, 96, 0.2);
    color: #07c160;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
    margin-left: 15px;
    vertical-align: middle;
    border: 1px solid rgba(7, 193, 96, 0.3);
  `;
  
  title.parentElement.appendChild(badge);
}

/**
 * 渲染继续阅读小部件
 */
export function renderContinueReadingWidget(posts) {
  const readPosts = getReadPosts();
  if (readPosts.length === 0) return '';
  
  const recentReadPosts = posts.filter(p => readPosts.includes(p.id)).slice(0, 5);
  
  return `
    <div class="widget widget-continue-reading">
      <div class="widget-header">
        <span class="widget-icon">📚</span>
        <h3>继续阅读</h3>
      </div>
      <div class="widget-content">
        <div class="continue-reading-list">
          ${recentReadPosts.map(post => `
            <div class="continue-reading-item" data-post-id="${post.id}">
              <div class="cr-info">
                <h4>${post.title}</h4>
                <span class="cr-progress">${Math.round((getReadingProgress()[post.id]?.percentage || 0))}% 已读</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
