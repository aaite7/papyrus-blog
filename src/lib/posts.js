import { supabase } from './supabase.js';

// This function is no longer needed if the DB returns tags as an array, which it should.
// We keep a simplified version just in case of malformed data on read.
const fixPost = (post) => {
  if (!post) return null;
  const newPost = { ...post };
  if (!Array.isArray(newPost.tags)) {
    // If tags are not an array for any reason, default to an empty one.
    newPost.tags = [];
  }
  return newPost;
};

// This function prepares post data for writing to the DB.
const preparePostDataForWrite = (postData) => {
    const data = { ...postData };
    // If tags are a string, they are likely a JSON stringified array, e.g., '["tag1", "tag2"]'
    if (data.tags && typeof data.tags === 'string') {
        try {
            const parsedTags = JSON.parse(data.tags);
            if (Array.isArray(parsedTags)) {
                data.tags = parsedTags;
            } else {
                // If it's some other JSON that's not an array, wrap it in an array.
                data.tags = [parsedTags];
            }
        } catch (e) {
            // If it's not valid JSON, it might be a single tag as a string. Wrap it.
            // This avoids the malformed array literal by not assuming comma separation.
            data.tags = [data.tags];
        }
    } else if (!Array.isArray(data.tags)) {
        data.tags = [];
    }
    return data;
}

export const postsService = {
  async getAllPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('pinned_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(fixPost);
  },

  async getPopularPosts(limit = 5) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_draft', false)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(fixPost);
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
    return data.map(fixPost);
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

    return fixPost(data);
  },

  async createPost(postData) {
    const postDataToSave = preparePostDataForWrite(postData);

    const { data, error } = await supabase
      .from('posts')
      .insert([postDataToSave])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePost(id, postData) {
    const postDataToUpdate = preparePostDataForWrite(postData);
    const { data, error } = await supabase
      .from('posts')
      .update(postDataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
    return data.map(fixPost);
  },

  async getPostsByCategory(category) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(fixPost);
  },

  async getPostsByTag(tag) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(fixPost);
  }
};
