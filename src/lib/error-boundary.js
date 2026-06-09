// src/lib/error-boundary.js

/**
 * 错误边界配置
 */
const CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000
};

/**
 * 错误状态管理
 */
const errorState = {
  errors: new Map(),
  retryCounts: new Map()
};

/**
 * 全局错误处理器
 */
export function initGlobalErrorHandler() {
  // 处理未捕获的错误
  window.addEventListener('error', (event) => {
    handleError(event.error || new Error(event.message), 'global', event.filename);
  });

  // 处理未捕获的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason || new Error('Unknown promise rejection'), 'unhandledrejection');
  });

  console.log('[错误边界] 全局错误处理器已初始化');
}

/**
 * 处理错误
 */
function handleError(error, context, filename) {
  const errorId = `${context}-${Date.now()}`;
  
  // 记录错误
  errorState.errors.set(errorId, {
    error,
    context,
    filename,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  });

  // 生产环境不输出详细错误到控制台
  if (import.meta.env.MODE !== 'production') {
    console.error(`[${context}]`, error);
  }

  // 显示用户友好的错误提示
  showErrorNotification(error, context);

  // 自动重试（如果是网络错误）
  if (isNetworkError(error)) {
    scheduleRetry(errorId);
  }

  return errorId;
}

/**
 * 显示错误通知
 */
function showErrorNotification(error, context) {
  if (window.__errorNotificationTimer) {
    clearTimeout(window.__errorNotificationTimer);
  }

  window.__errorNotificationTimer = setTimeout(() => {
    const container = document.getElementById('error-notification-container');
    if (container) {
      container.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'error-notification-container';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      z-index: 10000;
    `;

    const message = getUserFriendlyMessage(error, context);
    const canRetry = isNetworkError(error);

    notification.innerHTML = `
      <div class="error-notification" style="
        background: linear-gradient(135deg, #8B0000 0%, #600000 100%);
        color: #fff;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        border-left: 4px solid #D4AF37;
        display: flex;
        flex-direction: column;
        gap: 10px;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.5rem;">⚠️</span>
          <strong>${message.title}</strong>
        </div>
        <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">${message.text}</p>
        ${canRetry ? `
          <button id="retry-action-btn" style="
            background: rgba(212, 175, 55, 0.2);
            border: 1px solid rgba(212, 175, 55, 0.5);
            color: #D4AF37;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            align-self: flex-start;
            transition: all 0.3s;
          " onmouseenter="this.style.background='rgba(212, 175, 55, 0.3)'" onmouseleave="this.style.background='rgba(212, 175, 55, 0.2)'">
            🔄 重试
          </button>
        ` : ''}
        <button onclick="document.getElementById('error-notification-container').remove()" style="
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 1.2rem;
          padding: 4px;
        ">✕</button>
      </div>
    `;

    document.body.appendChild(notification);

    // 5 秒后自动消失
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    // 绑定重试按钮事件
    const retryBtn = document.getElementById('retry-action-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        notification.remove();
        window.location.reload();
      });
    }
  }, 100);
}

/**
 * 获取用户友好的错误信息
 */
function getUserFriendlyMessage(error, context) {
  const messages = {
    network: {
      title: '网络连接问题',
      text: '无法连接到服务器，请检查网络连接后重试'
    },
    supabase: {
      title: '数据加载失败',
      text: '无法加载文章数据，请稍后重试'
    },
    render: {
      title: '页面渲染错误',
      text: '页面显示出现问题，请刷新页面'
    },
    permission: {
      title: '权限不足',
      text: '您没有权限执行此操作'
    },
    notfound: {
      title: '资源未找到',
      text: '请求的文章不存在或已被删除'
    },
    default: {
      title: '发生错误',
      text: '出现了一个意外错误，请刷新页面试试'
    }
  };

  if (isNetworkError(error)) return messages.network;
  if (isSupabaseError(error)) return messages.supabase;
  if (isRenderError(error, context)) return messages.render;
  if (isPermissionError(error)) return messages.permission;
  if (isNotFoundError(error)) return messages.notfound;
  
  return messages.default;
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error) {
  return (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('offline') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('ENOTFOUND') ||
    !navigator.onLine
  );
}

/**
 * 判断是否为 Supabase 错误
 */
export function isSupabaseError(error) {
  return (
    error.message?.includes('supabase') ||
    error.message?.includes('postgres') ||
    error.code?.startsWith('PGRST')
  );
}

/**
 * 判断是否为渲染错误
 */
export function isRenderError(error, context) {
  return (
    context === 'render' ||
    error.message?.includes('Cannot read') ||
    error.message?.includes('undefined') ||
    error.message?.includes('null')
  );
}

/**
 * 判断是否为权限错误
 */
export function isPermissionError(error) {
  return (
    error.message?.includes('permission') ||
    error.message?.includes('unauthorized') ||
    error.message?.includes('403')
  );
}

/**
 * 判断是否为资源未找到错误
 */
export function isNotFoundError(error) {
  return (
    error.message?.includes('not found') ||
    error.message?.includes('404') ||
    error.status === 404
  );
}

/**
 * 安排重试
 */
function scheduleRetry(errorId) {
  const count = errorState.retryCounts.get(errorId) || 0;
  
  if (count >= CONFIG.maxRetries) {
    errorState.retryCounts.delete(errorId);
    return;
  }

  errorState.retryCounts.set(errorId, count + 1);

  setTimeout(() => {
    console.log(`[错误边界] 重试 ${count + 1}/${CONFIG.maxRetries}`);
    window.location.reload();
  }, CONFIG.retryDelay * Math.pow(2, count)); // 指数退避
}

/**
 * 带错误处理的异步操作包装器
 */
export async function withErrorHandling(promise, context = 'operation', fallback = null) {
  try {
    return await promise;
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

/**
 * 带超时和重试的请求
 */
export async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      if (i < retries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, i))
        );
      }
    }
  }
  
  throw lastError;
}

/**
 * 获取错误统计
 */
export function getErrorStats() {
  const errors = Array.from(errorState.errors.values());
  const now = Date.now();
  
  return {
    total: errors.length,
    last1Hour: errors.filter(e => now - e.timestamp < 3600000).length,
    last24Hour: errors.filter(e => now - e.timestamp < 86400000).length,
    byContext: errors.reduce((acc, e) => {
      acc[e.context] = (acc[e.context] || 0) + 1;
      return acc;
    }, {})
  };
}

/**
 * 清除错误记录
 */
export function clearErrors() {
  errorState.errors.clear();
  errorState.retryCounts.clear();
}
