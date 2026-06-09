// src/lib/sw-register.js

/**
 * 注册 Service Worker
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker 不支持');
    return;
  }
  
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker 注册成功:', registration.scope);
      
      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  });
}

/**
 * 显示更新通知
 */
function showUpdateNotification() {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 15px 25px;
    border-radius: 50px;
    font-family: 'Lora', serif;
    font-size: 0.9rem;
    border: 1px solid #D4AF37;
    z-index: 9999999;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  `;
  toast.innerHTML = `
    <span>🔄 有新版本可用，点击刷新</span>
  `;
  toast.addEventListener('click', () => {
    window.location.reload();
  });
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 8000);
}

/**
 * 注销 Service Worker
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service Worker 已注销');
  }
}
