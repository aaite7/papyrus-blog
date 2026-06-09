// src/lib/utils.js

/**
 * 安全地解析 JSON，避免 JSON.parse 抛异常
 * @param {string} str - 待解析的 JSON 字符串
 * @param {*} fallback - 解析失败时的默认值
 * @returns {*} 解析结果或默认值
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或 Date 对象
 * @param {string} locale - 区域设置，默认 'zh-CN'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, locale = 'zh-CN') {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 截断文本并添加省略号
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+/g, ' ') + '...';
}

/**
 * 高亮文本中的关键词
 * @param {string} text - 原始文本
 * @param {string} query - 搜索关键词
 * @returns {string} 高亮后的 HTML
 */
export function highlightText(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 转义正则表达式中的特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 生成随机 ID
 * @returns {string} 随机 ID
 */
export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * 检查是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 计算阅读时间（分钟）
 * @param {string} content - 文章内容
 * @returns {number} 阅读时间（分钟）
 */
export function readingTime(content) {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * 转义 HTML 特殊字符
 * @param {string} text - 原始文本
 * @returns {string} 转义后的 HTML
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
