import { showToast } from './ui.js';

/**
 * 渲染分享模态框
 */
export function renderShareModal(post) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(post.title);
  const summary = encodeURIComponent(`推荐阅读：${post.title}`);
  
  return `
    <div class="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div class="share-content">
        <div class="share-header">
          <h3 id="share-title">分享文章</h3>
          <button class="close-share" aria-label="关闭分享">✕</button>
        </div>
        <div class="share-buttons">
          ${renderWechatBtn(url, title)}
          ${renderWeiboBtn(url, title, summary)}
          ${renderTwitterBtn(url, title)}
          <button class="share-btn copy" data-action="copy" aria-label="复制链接" title="复制链接">📋</button>
        </div>
        <input type="text" class="share-link-input" value="${window.location.href}" readonly aria-label="文章链接">
      </div>
    </div>
  `;
}

function renderWechatBtn(url, title) {
  return `
    <button class="share-btn wechat" data-action="share" data-platform="wechat" 
            onclick="window.open('http://www.weixin888.com/share.php?url=${url}&title=${title}', '_blank')"
            aria-label="分享到微信" title="微信">
      💬
    </button>
  `;
}

function renderWeiboBtn(url, title, summary) {
  return `
    <button class="share-btn weibo" data-action="share" data-platform="weibo"
            onclick="window.open('http://service.weibo.com/share/share.php?url=${url}&title=${title}&pic=&summary=${summary}', '_blank')"
            aria-label="分享到微博" title="微博">
      🌐
    </button>
  `;
}

function renderTwitterBtn(url, title) {
  return `
    <button class="share-btn twitter" data-action="share" data-platform="twitter"
            onclick="window.open('https://twitter.com/intent/tweet?url=${url}&text=${title}', '_blank')"
            aria-label="分享到 Twitter" title="Twitter">
      🐦
    </button>
  `;
}

/**
 * 初始化分享功能
 */
export function initShare() {
  // 关闭按钮
  document.querySelector('.close-share')?.addEventListener('click', closeModal);
  
  // 点击模态框背景关闭
  document.querySelector('.share-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('share-modal')) {
      closeModal();
    }
  });
  
  // ESC 关闭
  const handleEsc = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', handleEsc, { once: true });
  
  // 复制链接
  document.querySelector('.share-btn.copy')?.addEventListener('click', copyLink);
  
  // 添加分享按钮到文章页
  addShareButtonsToPost();
}

/**
 * 关闭模态框
 */
function closeModal() {
  const modal = document.querySelector('.share-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

/**
 * 复制链接
 */
async function copyLink() {
  const input = document.querySelector('.share-link-input');
  if (!input) return;
  
  try {
    await navigator.clipboard.writeText(input.value);
    showToast('链接已复制', 'success');
  } catch {
    input.select();
    document.execCommand('copy');
    showToast('链接已复制', 'success');
  }
}

/**
 * 添加分享按钮到文章页
 */
export function addShareButtonsToPost() {
  const articleContent = document.querySelector('.article-content');
  if (!articleContent) return;
  
  const shareBtn = document.createElement('button');
  shareBtn.className = 'post-share-btn';
  shareBtn.innerHTML = '📤 分享';
  shareBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 20px;
  `;
  
  shareBtn.addEventListener('mouseenter', () => {
    shareBtn.style.transform = 'translateY(-2px)';
    shareBtn.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
  });
  
  shareBtn.addEventListener('mouseleave', () => {
    shareBtn.style.transform = 'translateY(0)';
    shareBtn.style.boxShadow = 'none';
  });
  
  shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const title = document.querySelector('.single-title')?.textContent || document.title;
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = renderShareModal({ title });
    document.body.appendChild(modalContainer.firstElementChild);
    
    setTimeout(() => {
      document.querySelector('.share-modal')?.classList.add('active');
      initShare();
    }, 10);
  });
  
  const relatedSection = document.querySelector('.related-posts-section');
  if (relatedSection) {
    relatedSection.before(shareBtn);
  } else {
    articleContent.appendChild(shareBtn);
  }
}

/**
 * 打开分享模态框
 */
export function openShareModal(post) {
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = renderShareModal(post);
  document.body.appendChild(modalContainer.firstElementChild);
  
  setTimeout(() => {
    document.querySelector('.share-modal')?.classList.add('active');
    initShare();
  }, 10);
}
