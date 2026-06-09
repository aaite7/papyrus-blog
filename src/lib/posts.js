// src/lib/posts.js
import { supabase } from './supabase.js';
import { truncate } from './utils.js';

export const postsService = {
  /**
   * 获取所有文章（置顶优先）
   * @returns {Promise<Array>} 文章列表
   */
  async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_draft', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('获取文章列表失败:', err);
      throw new Error('无法加载文章列表');
    }
  },

  /**
   * 获取单篇文章
   * @param {string} id - 文章 ID
   * @returns {Promise<Object|null>} 文章详情
   */
  async getPostById(id) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return data;
    } catch (err) {
      console.error('获取文章详情失败:', err);
      return null;
    }
  },

  /**
   * 创建文章
   * @param {Object} postData - 文章数据
   * @returns {Promise<Object>} 创建结果
   */
  async createPost(postData) {
    try {
      const { title, content, image, category, tags, is_draft, image_fit, crop_data, icon, is_pinned } = postData;
      
      const newPost = { 
        title: title || 'Untitled',
        content: content || '',
        image: image || '',
        category: category || 'Uncategorized',
        tags: tags || [],
        is_draft: is_draft || false,
        image_fit: image_fit || 'contain',
        crop_data: crop_data || null,
        icon: icon || '',
        is_pinned: is_pinned || false,
        view_count: 0,
        likes: 0
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('创建文章失败:', err);
      throw new Error('无法创建文章');
    }
  },

  /**
   * 更新文章
   * @param {string} id - 文章 ID
   * @param {Object} updates - 更新字段
   * @returns {Promise<void>}
   */
  async updatePost(id, updates) {
    try {
      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('更新文章失败:', err);
      throw new Error('无法更新文章');
    }
  },

  /**
   * 删除文章
   * @param {string} id - 文章 ID
   * @returns {Promise<void>}
   */
  async deletePost(id) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('删除文章失败:', err);
      throw new Error('无法删除文章');
    }
  },

  /**
   * 获取热门文章
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 热门文章列表
   */
  async getPopularPosts(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, view_count, category')
        .eq('is_draft', false)
        .order('view_count', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('获取热门文章失败:', err);
      return [];
    }
  },

  /**
   * 获取相关文章
   * @param {string} currentId - 当前文章 ID
   * @param {Array} tags - 标签数组
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 相关文章列表
   */
  async getRelatedPosts(currentId, tags, limit = 3) {
    if (!tags || tags.length === 0) return [];
    
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, title, image, view_count, category')
        .eq('is_draft', false)
        .neq('id', currentId)
        .overlaps('tags', tags)
        .limit(limit);
      
      return data || [];
    } catch (err) {
      console.error('获取相关文章失败:', err);
      return [];
    }
  },
  
  /**
   * 获取按分类分组的文章
   * @param {string} category - 分类名称
   * @returns {Promise<Array>} 文章列表
   */
  async getPostsByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_draft', false)
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('获取分类文章失败:', err);
      return [];
    }
  },
  
  /**
   * 获取所有分类
   * @returns {Promise<Array>} 分类列表
   */
  async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('category')
        .eq('is_draft', false);
      
      if (error) throw error;
      
      const categories = [...new Set(data.map(p => p.category))].sort();
      return categories;
    } catch (err) {
      console.error('获取分类列表失败:', err);
      return [];
    }
  }
};
