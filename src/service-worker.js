// src/lib/service-worker.js

const CACHE_NAME = 'minimalist-blog-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 请求事件 - 网络优先，失败则缓存
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // API 请求：网络优先
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 静态资源：缓存优先
  if (request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // HTML 页面：网络优先
  event.respondWith(networkFirst(request));
});

/**
 * 网络优先策略
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflinePage();
  }
}

/**
 * 缓存优先策略
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return createOfflinePage();
  }
}

/**
 * 创建离线页面
 * @returns {Response}
 */
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>离线了</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
            color: #333;
          }
          .offline-message {
            text-align: center;
            padding: 40px;
          }
          h1 { font-size: 2rem; margin-bottom: 10px; }
          p { opacity: 0.7; }
        </style>
      </head>
      <body>
        <div class="offline-message">
          <h1>📡 离线了</h1>
          <p>请检查网络连接后刷新页面</p>
          <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;cursor:pointer;">重试</button>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
