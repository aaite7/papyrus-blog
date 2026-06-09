// src/lib/rss-generator.js

import { postsService } from './posts.js';

/**
 * RSS 配置
 */
const CONFIG = {
  siteTitle: 'Minimalist Blog - 古风极简博客',
  siteUrl: 'https://yourdomain.com',
  siteDescription: '一个受古代卷轴和手写稿启发的极简博客',
  language: 'zh-CN',
  ttl: 60, // 分钟
  itemsLimit: 20
};

/**
 * 转义 XML 特殊字符
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 格式化日期为 RFC 822
 */
function formatRfc822(date) {
  const d = new Date(date);
  return d.toUTCString().replace('GMT', '+0000');
}

/**
 * 生成 RSS 2.0 Feed
 */
export async function generateRssFeed(posts = null) {
  try {
    // 如果没有传入文章，获取最新 20 篇
    if (!posts) {
      posts = await postsService.getAllPosts();
      posts = posts.slice(0, CONFIG.itemsLimit);
    }

    const now = new Date().toUTCString();
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(CONFIG.siteTitle)}</title>
    <link>${CONFIG.siteUrl}</link>
    <description>${escapeXml(CONFIG.siteDescription)}</description>
    <language>${CONFIG.language}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>${CONFIG.ttl}</ttl>
    <atom:link href="${CONFIG.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    
    ${posts.map(post => generateRssItem(post)).join('')}
  </channel>
</rss>`;

    return rss;
  } catch (error) {
    console.error('[RSS] Failed to generate feed:', error);
    return null;
  }
}

/**
 * 生成单个 RSS 项
 */
function generateRssItem(post) {
  const postUrl = `${CONFIG.siteUrl}/post/${post.id}`;
  const imageUrl = post.image ? `
    <enclosure url="${escapeXml(post.image)}" type="image/${post.image.match(/\.(\w+)$/)?.[1] || 'jpeg'}" />` : '';
  
  // 提取摘要（前 500 字符）
  const excerpt = post.content?.substring(0, 500) || '';
  const content = `
    <content:encoded><![CDATA[
      <div style="font-family: 'Lora', serif; line-height: 1.8; color: #333;">
        ${post.image ? `<img src="${post.image}" alt="${escapeXml(post.title)}" style="max-width: 100%; height: auto; margin-bottom: 20px;" />` : ''}
        <p>${excerpt}...</p>
        <p style="margin-top: 30px; font-style: italic; color: #666;">
          <a href="${postUrl}" style="color: #D4AF37; text-decoration: none;">阅读全文 →</a>
        </p>
      </div>
    ]]></content:encoded>`;

  const tags = post.tags?.map(tag => 
    `<category>${escapeXml(tag)}</category>`
  ).join('') || '';

  return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(excerpt)}...</description>
      ${content}
      <pubDate>${formatRfc822(post.created_at)}</pubDate>
      ${imageUrl}
      ${tags}
    </item>
  `;
}

/**
 * 生成 Atom 1.0 Feed
 */
export async function generateAtomFeed(posts = null) {
  try {
    if (!posts) {
      posts = await postsService.getAllPosts();
      posts = posts.slice(0, CONFIG.itemsLimit);
    }

    const now = new Date().toISOString();
    const updated = posts.length > 0 
      ? new Date(Math.max(...posts.map(p => new Date(p.created_at).getTime()))).toISOString()
      : now;
    
    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <title>${escapeXml(CONFIG.siteTitle)}</title>
  <subtitle>${escapeXml(CONFIG.siteDescription)}</subtitle>
  <link href="${CONFIG.siteUrl}" rel="alternate"/>
  <link href="${CONFIG.siteUrl}/atom.xml" rel="self"/>
  <id>${CONFIG.siteUrl}/</id>
  <updated>${escapeXml(updated)}</updated>
  <rights>Copyright © ${new Date().getFullYear()} Minimalist Blog</rights>
  <author>
    <name>Minimalist Blog Team</name>
  </author>
  ${posts.map(post => generateAtomEntry(post)).join('')}
</feed>`;

    return atom;
  } catch (error) {
    console.error('[Atom] Failed to generate feed:', error);
    return null;
  }
}

/**
 * 生成单个 Atom 条目
 */
function generateAtomEntry(post) {
  const postUrl = `${CONFIG.siteUrl}/post/${post.id}`;
  const excerpt = post.content?.substring(0, 500) || '';
  
  const media = post.image ? `
  <media:content url="${escapeXml(post.image)}" medium="image" type="image/${post.image.match(/\.(\w+)$/)?.[1] || 'jpeg'}" />` : '';

  const tags = post.tags?.map(tag => 
    `<category term="${escapeXml(tag)}" />`
  ).join('') || '';

  return `
  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${postUrl}" rel="alternate"/>
    <id>${postUrl}</id>
    <published>${new Date(post.created_at).toISOString()}</published>
    <updated>${new Date(post.updated_at || post.created_at).toISOString()}</updated>
    <summary type="html"><![CDATA[${excerpt}...]]></summary>
    <content type="html" xml:base="${postUrl}"><![CDATA[
      <div style="font-family: 'Lora', serif; line-height: 1.8; color: #333;">
        ${post.image ? `<img src="${post.image}" alt="${escapeXml(post.title)}" style="max-width: 100%; height: auto; margin-bottom: 20px;" />` : ''}
        <p>${excerpt}...</p>
      </div>
    ]]></content>
    ${media}
    ${tags}
  </entry>`;
}

/**
 * 生成 Feed 发现链接（添加到 HTML head）
 */
export function renderFeedDiscoveryLinks() {
  return `
    <link rel="alternate" type="application/rss+xml" title="RSS 2.0" href="/rss.xml">
    <link rel="alternate" type="application/atom+xml" title="Atom 1.0" href="/atom.xml">
  `;
}

/**
 * 设置 RSS 路由（在 main.js 中调用）
 */
export async function setupRssRoutes() {
  // 这个函数在 Vite 中需要通过特殊方式处理
  // 实际上应该在构建时生成静态 RSS 文件
  console.log('[RSS] Feed routes ready');
}

/**
 * 在 HTML head 中添加 Feed 发现链接
 */
export function injectFeedLinks() {
  const links = renderFeedDiscoveryLinks();
  document.head.insertAdjacentHTML('beforeend', links);
  console.log('[RSS] Feed discovery links injected');
}
