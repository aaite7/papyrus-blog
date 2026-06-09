import { supabase } from './supabase.js';
import { showToast } from './ui.js';

export const commentsService = {
  /**
   * 获取文章评论（支持 nested 回复）
   * @param {string} postId - 文章 ID
   * @returns {Promise<Array>} 评论树
   */
  async getCommentsByPostId(postId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return this.buildCommentTree(data);
    } catch (err) {
      console.error('获取评论失败:', err);
      return [];
    }
  },

  /**
   * 构建评论树
   * @param {Array} comments - 扁平的评论数组
   * @returns {Array} 树形结构的评论
   */
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

  /**
   * 创建评论
   * @param {string} postId - 文章 ID
   * @param {string} authorName - 作者名
   * @param {string} authorEmail - 作者邮箱
   * @param {string} content - 评论内容
   * @param {string|null} parentId - 父评论 ID（用于回复）
   * @returns {Promise<Object>} 创建的评论
   */
  async createComment(postId, authorName, authorEmail, content, parentId = null) {
    try {
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
    } catch (err) {
      console.error('创建评论失败:', err);
      throw err;
    }
  },

  /**
   * 渲染评论（支持回复嵌套）
   * @param {Array} comments - 评论树
   * @param {number} depth - 当前深度
   * @returns {string} HTML
   */
  renderComments(comments, depth = 0) {
    if (!comments || !comments.length) {
      return '<p style="text-align:center;opacity:0.6">暂无评论</p>';
    }

    return comments.map(comment => this.renderCommentItem(comment, depth)).join('');
  },

  /**
   * 渲染单条评论
   * @param {Object} comment - 评论对象
   * @param {number} depth - 深度
   * @returns {string} HTML
   */
  renderCommentItem(comment, depth = 0) {
    const indent = depth > 0 ? 'style="margin-left: 30px; border-left: 2px solid #D4AF37; padding-left: 15px;"' : '';
    const date = new Date(comment.created_at).toLocaleDateString('zh-CN');
    
    let repliesHTML = '';
    if (comment.replies && comment.replies.length) {
      repliesHTML = `<div style="margin-top: 10px;">${this.renderComments(comment.replies, depth + 1)}</div>`;
    }

    return `
      <div class="comment-item" style="padding:15px; border-bottom:1px solid #eee; margin-bottom:10px; ${indent}" data-comment-id="${comment.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <b style="color:#333;">${escapeHtml(comment.author_name)}</b>
            <small style="opacity:0.6; margin-left:10px;">${date}</small>
          </div>
          <button class="reply-btn" data-parent-id="${comment.id}" 
                  style="background:none; border:none; color:#D4AF37; cursor:pointer; font-size:0.85rem;">
            回复
          </button>
        </div>
        <p style="margin:0; line-height:1.6; color:#444;">${escapeHtml(comment.content)}</p>
        ${repliesHTML}
      </div>
    `;
  }
};

/**
 * 转义 HTML 特殊字符
 * @param {string} text 
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
