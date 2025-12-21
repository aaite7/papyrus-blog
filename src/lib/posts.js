import { supabase } from './supabase.js';

const fixPost = (post) => {
  if (!post) return null;
  const newPost = { ...post };
  if (!Array.isArray(newPost.tags)) {
    newPost.tags = [];
  }
  return newPost;
};

const preparePostDataForWrite = (postData) => {
    const data = { ...postData };
    let tags = data.tags;

    if (!tags) {
        data.tags = [];
        return data;
    }

    // If tags is not an array, make it one.
    if (!Array.isArray(tags)) {
        tags = [tags];
    }
    
    // Recursively flatten and parse to handle any level of nesting or stringification.
    const processArray = (arr) => {
        let result = [];
        for (const item of arr) {
            if (Array.isArray(item)) {
                result.push(...processArray(item)); // Recurse for nested arrays
            } else if (typeof item === 'string') {
                try {
                    const parsed = JSON.parse(item);
                    // If parsing results in an array, process it. Otherwise, just add the parsed value.
                    if (Array.isArray(parsed)) {
                        result.push(...processArray(parsed));
                    } else {
                        result.push(parsed);
                    }
                } catch (e) {
                    // Not a JSON string, add it as is.
                    result.push(item);
                }
            } else {
                // Not an array or string, just add it.
                result.push(item);
            }
        }
        return result;
    };

    const finalTags = processArray(tags);

    // Final cleanup: ensure all elements are non-empty strings.
    data.tags = finalTags.map(String).filter(tag => tag && tag.trim() !== '');
    
    return data;
};

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
