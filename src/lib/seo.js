// src/lib/seo.js

/**
 * 更新页面 Meta 标签
 * @param {Object} post - 文章对象
 */
export function updatePageMeta(post) {
  if (!post) return;
  
  // 标题优化：包含文章标题 + 站点名 + 地理位置
  const title = `${post.title} | Minimalist Blog - 南昌`;
  document.title = title;
  updateMetaTag('name', 'title', title);
  
  // 描述优化：包含摘要 + 关键词
  const excerpt = post.excerpt || post.content?.substring(0, 150) + '...';
  const description = `${excerpt} - Minimalist 古风极简博客，位于南昌，分享智慧与故事。`;
  updateMetaTag('name', 'description', description);
  
  // 关键词优化
  const keywords = generateKeywords(post);
  updateMetaTag('name', 'keywords', keywords);
  
  updateMetaTag('name', 'author', post.author_name || 'Minimalist Blog Team');
  
  // Open Graph
  updateMetaTag('property', 'og:title', post.title);
  updateMetaTag('property', 'og:description', excerpt);
  updateMetaTag('property', 'og:type', 'article');
  updateMetaTag('property', 'og:url', window.location.href);
  updateMetaTag('property', 'og:locale', 'zh_CN');
  updateMetaTag('property', 'og:site_name', 'Minimalist Blog');
  updateMetaTag('property', 'article:published_time', post.created_at);
  if (post.updated_at) {
    updateMetaTag('property', 'article:modified_time', post.updated_at);
  }
  if (post.category) {
    updateMetaTag('property', 'article:section', post.category);
  }
  if (post.tags && post.tags.length) {
    post.tags.forEach(tag => {
      addMetaTag('property', 'article:tag', tag);
    });
  }
  
  if (post.image) {
    updateMetaTag('property', 'og:image', post.image);
    updateMetaTag('property', 'og:image:secure_url', post.image);
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:image:alt', post.title);
  }
  
  // Twitter Card
  updateMetaTag('name', 'twitter:card', 'summary_large_image');
  updateMetaTag('name', 'twitter:title', post.title);
  updateMetaTag('name', 'twitter:description', excerpt);
  if (post.image) {
    updateMetaTag('name', 'twitter:image', post.image);
    updateMetaTag('name', 'twitter:image:alt', post.title);
  }
}

/**
 * 生成文章关键词
 * @param {Object} post - 文章对象
 * @returns {string} 关键词字符串
 */
function generateKeywords(post) {
  const baseKeywords = ['博客', '古风', '极简', '南昌', '阅读', '文章'];
  const postKeywords = [
    post.title,
    post.category,
    ...(post.tags || [])
  ].filter(Boolean);
  
  return [...baseKeywords, ...postKeywords].slice(0, 10).join(', ');
}

/**
 * 更新或创建 Meta 标签
 * @param {string} attrType - 'name' 或 'property'
 * @param {string} attrValue - 属性值
 * @param {string} content - 内容
 */
export function updateMetaTag(attrType, attrValue, content) {
  removeMetaTag(attrType, attrValue);
  
  const meta = document.createElement('meta');
  meta.setAttribute(attrType, attrValue);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

/**
 * 添加 Meta 标签（不删除已有）
 */
function addMetaTag(attrType, attrValue, content) {
  const existing = document.querySelector(`meta[${attrType}="${attrValue}"]`);
  if (!existing) {
    const meta = document.createElement('meta');
    meta.setAttribute(attrType, attrValue);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

/**
 * 移除 Meta 标签
 */
export function removeMetaTag(attrType, attrValue) {
  const existing = document.querySelector(`meta[${attrType}="${attrValue}"]`);
  if (existing) {
    existing.remove();
  }
}

/**
 * 添加结构化数据 (JSON-LD)
 * @param {Object} post - 文章对象
 */
export function addStructuredData(post) {
  removeStructuredData();
  
  if (!post) return;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.content?.substring(0, 150) + '...',
    "url": window.location.href,
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": {
      "@type": "Person",
      "name": post.author_name || "Minimalist Blog Team",
      "url": window.location.origin
    },
    "publisher": {
      "@type": "Organization",
      "name": "Minimalist Blog",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/public/favicon.svg`,
        "width": 100,
        "height": 100
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    },
    "articleBody": post.content,
    "wordCount": post.content?.split(/\s+/).length || 0,
    "inLanguage": "zh-CN",
    "keywords": generateKeywords(post)
  };
  
  if (post.image) {
    structuredData.image = {
      "@type": "ImageObject",
      "url": post.image,
      "width": 1200,
      "height": 630
    };
  }
  
  if (post.category) {
    structuredData.articleSection = post.category;
  }
  
  if (post.tags && post.tags.length) {
    structuredData.keywords = post.tags.join(', ');
  }
  
  // 地理位置标注（南昌）
  structuredData.location = {
    "@type": "City",
    "name": "南昌",
    "alternateName": "Nanchang",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.682892,
      "longitude": 115.857844
    },
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "JX",
      "addressCountry": "CN",
      "addressLocality": "南昌"
    }
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  script.id = 'structured-data';
  document.head.appendChild(script);
}

/**
 * 移除结构化数据
 */
export function removeStructuredData() {
  const existing = document.getElementById('structured-data');
  if (existing) {
    existing.remove();
  }
}

/**
 * 为首页添加结构化数据
 */
export function addWebSiteStructuredData() {
  removeStructuredData();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Minimalist Blog",
    "alternateName": "古风极简博客",
    "url": window.location.origin,
    "description": "一个受古代卷轴和手写稿启发的极简博客，位于南昌",
    "inLanguage": "zh-CN",
    "publisher": {
      "@type": "Organization",
      "name": "Minimalist Blog Team"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "author": {
      "@type": "Person",
      "name": "Blog Admin"
    }
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  script.id = 'website-structured-data';
  document.head.appendChild(script);
}

/**
 * 添加面包屑导航结构化数据
 * @param {Array} items - 面包屑项 [{name, url}]
 */
export function addBreadcrumbStructuredData(items) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  });
  document.head.appendChild(script);
}
