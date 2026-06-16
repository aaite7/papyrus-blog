// src/lib/image-optimizer.js
import { escapeHtml } from './utils.js';

/**
 * 检测 WebP 支持
 */
export function supportsWebP() {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      resolve(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } else {
      resolve(false);
    }
  });
}

/**
 * 将图片 URL 转换为 WebP（如果支持）
 */
export function optimizeImageUrl(url, quality = 0.8) {
  if (!url) return url;
  
  // 如果是 CDN 图片，添加格式参数
  if (url.includes('supabase.co') || url.includes('cloudinary.com')) {
    return url + '?format=webp&quality=' + Math.round(quality * 100);
  }
  
  // 本地图片返回原 URL
  return url;
}

/**
 * 生成 BlurHash 占位符（简化版 - 使用纯色）
 */
export function generateBlurHashPlaceholder(color = '#f4ebe1') {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${color}"/>
    </svg>
  `)}`;
}

/**
 * 创建响应式图片标签
 */
export function createResponsiveImage(post, options = {}) {
  const {
    width = 800,
    height = 600,
    sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    loading = 'lazy',
    decoding = 'async'
  } = options;

  if (!post.image) return '';

  const webpUrl = optimizeImageUrl(post.image);
  const fallbackUrl = post.image;
  const blurPlaceholder = generateBlurHashPlaceholder('#f4ebe1');

  return `
    <picture>
      <source 
        srcset="${escapeHtml(webpUrl)}" 
        type="image/webp"
      >
      <img
        src="${escapeHtml(fallbackUrl)}"
        alt="${escapeHtml(post.title)}"
        width="${width}"
        height="${height}"
        sizes="${sizes}"
        loading="${loading}"
        decoding="${decoding}"
        style="width:100%; height:100%; object-fit:cover; background-image:url(${blurPlaceholder}); background-size:cover;"
        onerror="this.src='${generateBlurHashPlaceholder()}'; this.onerror=null;"
      >
    </picture>
  `;
}

/**
 * 预加载关键图片
 */
export function preloadCriticalImages(images) {
  images.forEach((src, index) => {
    if (index > 2) return; // 只预加载前 3 张
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizeImageUrl(src);
    document.head.appendChild(link);
  });
}

/**
 * 懒加载观察者
 */
export function initLazyLoadObserver(threshold = 0.1) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (src) {
          img.src = optimizeImageUrl(src);
          img.removeAttribute('data-src');
        }
        
        if (srcset) {
          img.srcset = optimizeImageUrl(srcset);
          img.removeAttribute('data-srcset');
        }
        
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '50px', threshold });

  return observer;
}

/**
 * 优化现有图片 - 增强版
 */
export function optimizeExistingImages(container = document) {
  const images = container.querySelectorAll('img[src]');
  
  images.forEach(img => {
    const parent = img.parentElement;
    
    // 如果已经在 picture 标签中，跳过
    if (parent.tagName === 'PICTURE') return;
    
    // 添加 loading 属性
    if (!img.loading) {
      img.loading = 'lazy';
    }
    
    // 添加 decoding 属性
    if (!img.decoding) {
      img.decoding = 'async';
    }
    
    // 添加 alt 如果缺失
    if (!img.alt) {
      img.alt = '文章图片';
    }
    
    // 添加淡入效果类
    img.classList.add('lazy-image');
    
    // 添加加载完成监听
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    }, { once: true });
  });
  
  // 为文章卡片图片添加 Intersection Observer 预加载
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          // 提前加载：当图片进入视口前 200px 开始加载
          const src = img.dataset.src || img.src;
          const srcset = img.dataset.srcset || img.srcset;
          
          if (src && img.dataset.src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          
          if (srcset && img.dataset.srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
          }
          
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    
    container.querySelectorAll('img[src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * 创建带 LQIP 占位图的图片卡片
 */
export function createImageWithLQIP(imageUrl, alt, options = {}) {
  const {
    width = 800,
    height = 600,
    objectFit = 'cover'
  } = options;
  
  const blurPlaceholder = generateBlurHashPlaceholder('#f4ebe1');
  const webpUrl = optimizeImageUrl(imageUrl);
  
  return `
    <div class="image-wrapper lazy-container" style="position:relative;overflow:hidden;background:${blurPlaceholder};">
      <picture>
        <source srcset="${escapeHtml(webpUrl)}" type="image/webp">
        <img
          data-src="${escapeHtml(imageUrl)}"
          data-srcset="${escapeHtml(webpUrl)}"
          alt="${escapeHtml(alt)}"
          width="${width}"
          height="${height}"
          loading="lazy"
          decoding="async"
          style="width:100%; height:100%; object-fit:${objectFit}; opacity:0; transition:opacity 0.3s ease;"
          class="lazy-image"
          onload="this.style.opacity='1'; this.classList.add('loaded');"
        >
      </picture>
      <div class="image-skeleton" style="position:absolute;inset:0;background:linear-gradient(90deg, #f4ebe1 25%, #f9f3eb 50%, #f4ebe1 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
    </div>
    <style>
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .lazy-image.loaded + .image-skeleton { display: none; }
    </style>
  `;
}

/**
 * 图片压缩提示
 */
export function getImageOptimizationTips() {
  return {
    recommended: {
      format: 'WebP',
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      maxSize: '300KB'
    },
    tips: [
      '使用 WebP 格式可减少 25-35% 文件大小',
      '最大宽度不超过 1920px',
      '质量设置为 80% 可平衡清晰度和大小',
      '使用 tinypng.com 或 squoosh.app 压缩',
      '考虑使用 CDN 自动优化'
    ]
  };
}
