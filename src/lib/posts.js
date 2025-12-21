// src/lib/posts.js
import { supabase } from './supabase.js';

export const postsService = {
  // 1. 获取文章 (>>> 核心修复：先按置顶排序，再按时间 <<<)
  async getAllPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('is_pinned', { ascending: false }) // 1. 置顶优先
      .order('created_at', { ascending: false }); // 2. 时间倒序
    if (error) throw error;
    return data;
  },

  async getPostById(id) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async createPost(postData) {
    const { title, content, image, category, tags, is_draft, image_fit, crop_data, icon } = postData;
    const { data, error } = await supabase
      .from('posts')
      .insert([{ 
          title, content, image, category, tags, is_draft, 
          image_fit, crop_data, icon, 
          view_count: 0, likes: 0, is_pinned: false // 默认不置顶
      }]);
    if (error) throw error;
    return data;
  },

  async updatePost(id, updates) {
    const { error } = await supabase.from('posts').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deletePost(id) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  async getPopularPosts(limit = 5) {
    const { data, error } = await supabase.from('posts').select('id, title, view_count, category').eq('is_draft', false).order('view_count', { ascending: false }).limit(limit);
    if (error) console.error(error);
    return data || [];
  },

  async getRelatedPosts(currentId, tags, limit = 3) {
    if (!tags || tags.length === 0) return [];
    const { data } = await supabase.from('posts').select('id, title, image, view_count').eq('is_draft', false).neq('id', currentId).overlaps('tags', tags).limit(limit);
    return data || [];
  }
};
