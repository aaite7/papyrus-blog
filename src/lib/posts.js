// src/lib/posts.js
import { supabase } from './supabase.js'; // 确保你有这个文件，如果没有请告诉我

export const postsService = {
  // 1. 获取所有文章 (用于首页和后台)
  async getAllPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // 2. 获取单篇文章 (>>> 核心修复：编辑和详情页必须用到它 <<<)
  async getPostById(id) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null; // 查不到返回空，防止报错
    return data;
  },

  // 3. 创建新文章
  async createPost(postData) {
    // 确保字段只包含数据库里有的
    const { title, content, image, category, tags, is_draft, image_fit, crop_data, icon } = postData;
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
          title, content, image, category, tags, is_draft, 
          image_fit, crop_data, icon, // 新增字段
          view_count: 0, likes: 0 
      }]);
    if (error) throw error;
    return data;
  },

  // 4. 更新文章 (>>> 核心修复：保存编辑内容 <<<)
  async updatePost(id, updates) {
    const { error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  // 5. 删除文章
  async deletePost(id) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // 6. 获取热门文章
  async getPopularPosts(limit = 5) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, view_count, category')
      .eq('is_draft', false)
      .order('view_count', { ascending: false })
      .limit(limit);
    if (error) console.error(error);
    return data || [];
  },

  // 7. 获取相关文章 (根据标签)
  async getRelatedPosts(currentId, tags, limit = 3) {
    if (!tags || tags.length === 0) return [];
    const { data } = await supabase
      .from('posts')
      .select('id, title, image, view_count')
      .eq('is_draft', false)
      .neq('id', currentId)
      .overlaps('tags', tags) // 数组重叠查询
      .limit(limit);
    return data || [];
  },
  
  // 8. 切换置顶状态
  async togglePin(id, isPinned) {
      return await this.updatePost(id, { is_pinned: isPinned });
  },
  
  // 9. 发布草稿
  async publishDraft(id) {
      return await this.updatePost(id, { is_draft: false });
  }
};
