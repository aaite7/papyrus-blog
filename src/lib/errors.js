// src/lib/errors.js

/**
 * 自定义错误类 - API 请求错误
 */
export class ApiError extends Error {
  constructor(message, statusCode = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * 自定义错误类 - 认证错误
 */
export class AuthError extends Error {
  constructor(message, provider = 'supabase') {
    super(message);
    this.name = 'AuthError';
    this.provider = provider;
  }
}

/**
 * 自定义错误类 - 验证错误
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * 安全的异步操作包装器，避免未捕获的 Promise reject
 * @param {Promise} promise 
 * @param {string} errorMessage 
 * @returns {Promise<[data, error]>}
 */
export async function safeAsync(promise, errorMessage = '操作失败') {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    console.error(`${errorMessage}:`, err);
    return [null, err];
  }
}

/**
 * 带重试的异步操作
 * @param {Function} fn - 异步函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise<any>}
 */
export async function withRetry(fn, retries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === retries - 1) break;
      
      console.warn(`重试 ${i + 1}/${retries}:`, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
