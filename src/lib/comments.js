import { supabase } from './supabase.js';

export const commentsService = {
  async getCommentsByPostId(postId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return this.buildCommentTree(data);
  },

  buildCommentTree(comments) {
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap[comment.parent_id];
        if (parent) {
          parent.replies.push(commentMap[comment.id]);
        }
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  },

  async createComment(postId, authorName, authorEmail, content, parentId = null) {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          author_name: authorName,
          author_email: authorEmail,
          content: content,
          parent_id: parentId
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
