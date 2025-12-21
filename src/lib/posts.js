import { supabase } from './supabase.js';



  async const fixPost = (post) => {
  if (!post) return null;
  const newPost = { ...post };
  if (typeof newPost.tags === 'string') {
    newPost.tags = newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  } else if (!Array.isArray(newPost.tags)) {
    newPost.tags = [];
  }
  return newPost;
};

getPopularPosts(limit = 5) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_draft', false)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getRelatedPosts(postId, tags, limit = 3) {
    if (!tags || tags.length === 0) return [];

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_draft', false)
      .neq('id', postId)
      .overlaps('tags', tags)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getPostById(id) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      await supabase.rpc('increment_view_count', { post_id: id });
    }

    return data;
  },

  async createPost(postData) {
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePost(id, postData) {
    console.log('Updating post:', id, postData);
    const { data, error, status, statusText } = await supabase
      .from('posts')
      .update(postData)
      .eq('id', id);

    console.log('Update response:', { data, error, status, statusText });
    if (error) throw error;
    return { id, ...postData };
  },

  async togglePin(id, isPinned) {
    const updateData = {
      is_pinned: isPinned,
      pinned_at: isPinned ? new Date().toISOString() : null
    };
    return this.updatePost(id, updateData);
  },

  async saveDraft(postData) {
    return this.createPost({ ...postData, is_draft: true });
  },

  async publishDraft(id) {
    return this.updatePost(id, { is_draft: false });
  },

  async deletePost(id) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async searchPosts(query) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPostsByCategory(category) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPostsByTag(tag) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
