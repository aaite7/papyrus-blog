# Minimalist - 怀旧博客平台

欢迎来到 Minimalist，一个充满怀旧气息的博客平台，其设计灵感源自古老的卷轴和手稿。在这里，您可以用一种优雅、永恒的方式分享思想、故事和智慧。

## ✨ 主要功能

- **响应式设计**：无论是在桌面还是移动设备上，都能提供舒适的阅读体验。
- **动态时钟**：导航栏中集成了一个动态时钟，能够实时显示中文格式的日期和时间。
- **暗黑模式**：支持手动切换和根据系统偏好自动切换的暗黑模式，提供夜间舒适的阅读环境。
- **后台管理**：提供一个名为 “Scriptorium” 的后台管理界面，让博主可以轻松管理所有文章。
- **文章管理**：
  - **创建与编辑**：支持 Markdown 语法的可视化编辑器，并可以实时预览。
  - **发布与草稿**：可以将文章保存为草稿，或直接发布。
  - **置顶与删除**：可以将重要文章置顶，或删除不再需要的文章。
- **图片裁剪**：在编辑文章时，可以对文章图片进行裁剪，以达到最佳的显示效果。
- **分类与标签**：可以为文章添加分类和标签，方便读者查找和筛选。
- **评论系统**：
  - **发表评论**：读者可以对文章发表评论。
  - **树状回复**：支持对评论进行多级回复，形成树状讨论。
- **文章阅读**：
  - **目录 (TOC)**：自动为文章内容生成目录，方便读者快速跳转。
  - **代码高亮**：为文章中的代码块提供清晰的语法高亮。
  - **相关文章推荐**：在文章末尾，根据标签推荐相关的文章。
- **SEO 优化**：
  - **Meta 标签**：自动为文章页面生成描述和关键词等 Meta 标签。
  - **Open Graph 与 Twitter Card**：为社交媒体分享提供丰富的预览信息。
  - **结构化数据**：为文章添加 `application/ld+json` 格式的结构化数据，方便搜索引擎理解。

## 🚀 技术栈

- **前端框架**：原生 JavaScript (ESM)
- **构建工具**：Vite
- **后端服务**：Supabase (数据库, 云函数)
- **Markdown 解析**：marked
- **HTML 清理**：DOMPurify

## 本地部署

### 1. 环境准备

- [Node.js](https://nodejs.org/) (版本 >= 16.x)
- [npm](https://www.npmjs.com/) (通常随 Node.js 一同安装)

### 2. 克隆与安装

```bash
git clone https://github.com/your-username/minimalist-blog.git
cd minimalist-blog
npm install
```

### 3. 配置 Supabase

1.  访问 [Supabase](https://supabase.com/) 并创建一个新项目。
2.  在项目的 `SQL Editor` 中，运行以下 SQL 语句来创建 `posts` 和 `comments` 表，以及相关的函数：

    ```sql
    -- 创建 posts 表
    CREATE TABLE posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      tags TEXT[],
      image TEXT,
      image_fit TEXT DEFAULT 'contain',
      crop_data JSONB,
      is_pinned BOOLEAN DEFAULT false,
      pinned_at TIMESTAMP WITH TIME ZONE,
      is_draft BOOLEAN DEFAULT false,
      view_count INT DEFAULT 0
    );

    -- 创建 comments 表
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE
    );

    -- 创建视图数增加函数
    CREATE OR REPLACE FUNCTION increment_view_count(post_id UUID)
    RETURNS void AS $$
      UPDATE posts
      SET view_count = view_count + 1
      WHERE id = post_id;
    $$ LANGUAGE sql;
    ```

3.  在项目根目录创建一个 `.env` 文件，并填入您的 Supabase 项目信息：

    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

    您可以在 Supabase 项目的 `Settings` -> `API` 中找到这些信息。

### 4. 启动项目

```bash
npm run dev
```

项目将在 `http://localhost:5173` (或 Vite 指定的其他端口) 上运行。

### 5. 管理员登录

- **后台地址**: `/admin`
- **邮箱**: `admin@minimalist.blog`
- **密码**: `minimalist2024`

## 部署

1.  **构建项目**:

    ```bash
    npm run build
    ```

    构建产物将生成在 `dist` 目录中。

2.  **部署平台**:

    您可以将 `dist` 目录的内容部署到任何静态网站托管平台。项目已为您配置好了 `vercel.json`，因此您可以轻松地将其部署到 [Vercel](https://vercel.com/)。
