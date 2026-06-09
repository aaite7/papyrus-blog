# RSS/Atom Feed 使用指南 📡

## 功能概述

为 Minimalist Blog 添加了完整的 RSS 2.0 和 Atom 1.0 Feed 支持，方便用户订阅和获取最新内容。

## 特性

### RSS 2.0 Feed
- ✅ 标准 RSS 2.0 格式
- ✅ 包含文章标题、链接、摘要
- ✅ 完整内容（content:encoded）
- ✅ 文章图片作为 enclosure
- ✅ 标签分类
- ✅ 发布时间（RFC 822）

### Atom 1.0 Feed
- ✅ 标准 Atom 1.0 (RFC 4287)
- ✅ 包含媒体内容（media:content）
- ✅ 发布/更新时间
- ✅ 版权信息
- ✅ 作者信息

### 发现链接
- ✅ HTML head 自动添加 `<link rel="alternate">`
- ✅ 浏览器地址栏显示 RSS 图标

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| RSS 2.0 | `/public/rss.xml` | 标准 RSS Feed |
| Atom 1.0 | `/public/atom.xml` | Atom Feed |
| 生成器 | `/src/lib/rss-generator.js` | 动态生成逻辑 |

## 使用方法

### 1. 用户订阅
用户可以通过以下 URL 订阅：
- **RSS 2.0**: `https://yourdomain.com/rss.xml`
- **Atom 1.0**: `https://yourdomain.com/atom.xml`

### 2. 浏览器发现
打开网站后，浏览器会自动检测到 Feed：
- **Chrome**: 地址栏出现 RSS 图标
- **Firefox**: 书签菜单显示订阅选项
- **Safari**: 分享菜单包含订阅选项

### 3. 阅读器订阅
在 RSS 阅读器中输入 URL 即可：
- Feedly
- Inoreader
- The Old Reader
- Reeder
- 知乎阅读器

## 动态生成（高级）

如果需要动态生成包含实际文章的 Feed：

```javascript
import { generateRssFeed, generateAtomFeed } from './lib/rss-generator.js';

// 生成 RSS
const rssXml = await generateRssFeed(posts);

// 生成 Atom
const atomXml = await generateAtomFeed(posts);

// 添加到页面 head
import { injectFeedLinks } from './lib/rss-generator.js';
injectFeedLinks();
```

## 自定义配置

修改 `rss-generator.js` 中的 CONFIG：

```javascript
const CONFIG = {
  siteTitle: '你的博客名称',
  siteUrl: 'https://yourdomain.com',
  siteDescription: '博客描述',
  language: 'zh-CN',
  ttl: 60, // 缓存时间（分钟）
  itemsLimit: 20 // 显示文章数
};
```

## 示例 Feed

### RSS 2.0 节选
```xml
<rss version="2.0">
  <channel>
    <title>Minimalist Blog - 古风极简博客</title>
    <link>https://yourdomain.com</link>
    <description>一个受古代卷轴启发的极简博客</description>
    
    <item>
      <title>文章标题</title>
      <link>https://yourdomain.com/post/123</link>
      <guid>https://yourdomain.com/post/123</guid>
      <description>文章摘要...</description>
      <pubDate>Tue, 09 Jun 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
```

### Atom 1.0 节选
```xml
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Minimalist Blog</title>
  <link href="https://yourdomain.com" rel="alternate"/>
  
  <entry>
    <title>文章标题</title>
    <link href="https://yourdomain.com/post/123" rel="alternate"/>
    <id>https://yourdomain.com/post/123</id>
    <published>2026-06-09T12:00:00Z</published>
    <updated>2026-06-09T12:00:00Z</updated>
  </entry>
</feed>
```

## SEO 优化

### 1. 添加站点地图引用
在 `robots.txt` 中添加：
```
Sitemap: https://yourdomain.com/sitemap.xml
```

### 2. 添加 Feed 引用
在 `index.html` 的 `<head>` 中已自动添加：
```html
<link rel="alternate" type="application/rss+xml" title="RSS 2.0" href="/rss.xml">
<link rel="alternate" type="application/atom+xml" title="Atom 1.0" href="/atom.xml">
```

### 3. Google Search Console
在 Google Search Console 中提交 Feed URL，帮助 Google 更好地索引内容。

---

# 暗黑模式自动切换指南 🌓

## 功能概述

智能暗黑模式切换系统，支持三种模式：系统偏好、固定时间、基于日出日落的智能模式。

## 三种模式

### 1. 系统模式（System）
跟随操作系统的暗黑模式设置：
- macOS: 系统偏好设置 → 通用 → 外观
- Windows: 设置 → 个性化 → 颜色 → 默认应用模式
- iOS/Android: 控制中心 → 深色模式

**代码**:
```javascript
initAutoDarkMode({ mode: 'system' });
```

### 2. 固定时间模式（Schedule）
在指定时间自动切换：
- 默认：7:00 开启日间模式，18:00 开启暗黑模式
- 可自定义时间

**代码**:
```javascript
initAutoDarkMode({
  mode: 'schedule',
  lightHour: 7,
  darkHour: 18
});
```

### 3. 智能模式（Smart）⭐推荐
基于日出日落时间自动切换：
- 自动获取地理位置
- 计算当地日出日落时间
- 日出前切换日间，日落后切换暗黑

**代码**:
```javascript
initAutoDarkMode({ mode: 'smart' });
```

## 特性

### 自动检测
- ✅ 每小时检查并切换
- ✅ 页面可见时重新检查
- ✅ 系统偏好变化监听

### 用户覆盖
- ✅ 用户手动切换后，禁用自动切换
- ✅ 保存到 localStorage
- ✅ 下次访问仍使用用户偏好

### 无缝切换
- ✅ 平滑过渡动画
- ✅ 同步更新 Toggle 按钮
- ✅ 自定义事件通知

## 使用方法

### 初始化（已在 main.js 中集成）
```javascript
import { initAutoDarkMode } from './lib/auto-dark-mode.js';

// 智能模式（推荐）
initAutoDarkMode({
  mode: 'smart',
  respectSystem: true
});
```

### 手动切换
```javascript
import { toggleDarkModeManually } from './lib/auto-dark-mode.js';

// 用户点击 Toggle 按钮时调用
toggleDarkModeManually();
```

### 获取状态
```javascript
import { getDarkModeStatus } from './lib/auto-dark-mode.js';

const status = getDarkModeStatus();
console.log(status);
// {
//   isDark: true,
//   mode: 'smart',
//   autoEnabled: true
// }
```

## 配置选项

```javascript
initAutoDarkMode({
  // 模式：'system' | 'schedule' | 'smart'
  mode: 'smart',
  
  // 日间开始时间（仅 schedule 模式）
  lightHour: 7,
  
  // 夜间开始时间（仅 schedule 模式）
  darkHour: 18,
  
  // 是否尊重系统偏好
  respectSystem: true
});
```

## 工作原理

### 智能模式算法
1. **获取位置**: 使用 Geolocation API
2. **计算太阳时**: 基于纬度和日期
3. **判断模式**: 当前时间 vs 日出日落

### 计算公式
```javascript
// 简化版日出日落计算
const dayOfYear = // 一年中的第几天
const declination = 23.45 * sin(2π/365 * (dayOfYear - 81))
const hourAngle = acos(...)
sunrise = 12 - hourAngle/15
sunset = 12 + hourAngle/15
```

## 地理位置

### 隐私保护
- ❌ 不保存位置信息
- ❌ 不上传服务器
- ✅ 仅本地计算
- ✅ 失败时使用默认位置（南昌）

### 权限请求
首次使用会请求位置权限，用户可以拒绝，拒绝后使用默认位置。

## 事件监听

### 系统偏好变化
```javascript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...);
```

### 页面可见性
```javascript
document.addEventListener('visibilitychange', checkAndUpdate);
```

### 自定义事件
```javascript
window.addEventListener('darkModeChange', (e) => {
  console.log('暗黑模式切换:', e.detail.isDark);
});
```

## 故障排查

### 问题：不自动切换
**原因**: 用户可能手动切换过
**解决**: 清除 localStorage 中的 `darkMode` 键

```javascript
localStorage.removeItem('darkMode');
location.reload();
```

### 问题：定位失败
**原因**: 用户拒绝位置权限
**解决**: 使用默认位置（南昌），不影响功能

### 问题：切换不流畅
**原因**: CSS 过渡未设置
**解决**: 确保有 transition 样式

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `src/lib/auto-dark-mode.js` | 暗黑模式核心模块 |
| `src/main.js` | 集成初始化 |

---

**文档版本**: 1.0  
**最后更新**: 2026-06-09
