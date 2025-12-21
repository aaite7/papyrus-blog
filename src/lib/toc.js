// src/lib/toc.js

// 生成目录数据结构
export function generateTOC(content) {
    if (!content) return [];
    // 匹配 #, ##, ### 标题
    const regex = /^(#{1,3})\s+(.*)$/gm;
    const headings = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        // 生成简单的 ID：去除非字母数字字符，转小写
        const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ level, text, id });
    }
    return headings;
}

// 给文章内容注入 ID，以便锚点跳转
export function injectHeadingIds(htmlContent) {
    if (!htmlContent) return '';
    return htmlContent.replace(/<(h[1-3])>(.*?)<\/\1>/g, (match, tag, text) => {
        // 清理 HTML 标签获取纯文本
        const cleanText = text.replace(/<[^>]*>/g, ''); 
        const id = cleanText.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
        return `<${tag} id="${id}">${text}</${tag}>`;
    });
}

// 渲染目录 HTML
export function renderTOC(headings) {
    if (!headings || headings.length === 0) return '';
    
    return headings.map(h => {
        // 根据层级缩进：h1不缩进, h2缩进10px, h3缩进20px
        const padding = (h.level - 1) * 10;
        return `<a href="#${h.id}" style="padding-left: ${padding}px">${h.text}</a>`;
    }).join('');
}
