/**
 * A simplified, yet powerful and secure Cloudflare Worker for a Blog API - V4 (Pinned Posts & SEO support)
 * This is the complete, final version.
 */

// --- Helper Functions ---
const jsonResponse = (data, options = {}) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...options.headers };
  return new Response(JSON.stringify(data), { ...options, headers });
};
const errorResponse = (message, status = 400) => jsonResponse({ error: message }, { status });

// --- Main Fetch Handler ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // --- Simplified Routing Logic ---
    if (method === 'GET') {
      if (path === '/api/posts') return handleGetPosts(request, env);
      if (path === '/api/categories') return handleGetCategories(request, env);
      if (path === '/api/tags') return handleGetTags(request, env);
      if (path.startsWith('/api/posts/')) {
        const id = path.split('/')[3];
        return handleGetPostById(request, env, ctx, id);
      }
    }

    if (method === 'POST' && path === '/api/login') {
      return handleLogin(request, env);
    }

    const isProtectedRoute = path.startsWith('/api/posts') && (method === 'POST' || method === 'PUT' || method === 'DELETE');
    if (isProtectedRoute) {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (token !== env.SECRET_TOKEN) {
        return errorResponse('Unauthorized', 401);
      }
      
      if (method === 'POST' && path === '/api/posts') return handleCreatePost(request, env, ctx);
      
      if (path.startsWith('/api/posts/')) {
          const id = path.split('/')[3];
          if (method === 'PUT') return handleUpdatePost(request, env, ctx, id);
          if (method === 'DELETE') return handleDeletePost(request, env, ctx, id);
      }
    }
    
    return errorResponse('Not Found', 404);
  }
};

// --- Handlers ---
async function handleGetPosts(request, env) {
    const postsIndex = await env.BLOG_KV.get('posts_index', 'json') || [];
    return jsonResponse(postsIndex);
}

async function handleGetCategories(request, env) {
    const categoriesIndex = await env.BLOG_KV.get('categories_index', 'json') || [];
    return jsonResponse(categoriesIndex);
}

async function handleGetTags(request, env) {
    const tagsIndex = await env.BLOG_KV.get('tags_index', 'json') || [];
    return jsonResponse(tagsIndex);
}

async function handleGetPostById(request, env, ctx, id) {
    const cache = caches.default;
    const cacheKey = new Request(new URL(request.url).toString(), request);
    let response = await cache.match(cacheKey);
    if (response) {
      ctx.waitUntil(incrementPostViews(env, id));
      return new Response(response.body, response);
    }
    const post = await env.BLOG_KV.get(`post_${id}`, 'json');
    if (!post) return errorResponse('Post not found', 404);
    ctx.waitUntil(incrementPostViews(env, id));
    response = jsonResponse(post);
    response.headers.set('Cache-Control', 's-maxage=600');
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
}

async function handleLogin(request, env) {
    const { username, password } = await request.json();
    if (username === env.ADMIN_USER && password === env.ADMIN_PASS) {
        return jsonResponse({ success: true, token: env.SECRET_TOKEN });
    }
    return errorResponse('Invalid credentials', 401);
}

async function handleCreatePost(request, env, ctx) {
    const postData = await request.json();
    const postId = crypto.randomUUID();
    let excerpt = postData.excerpt || '';
    if (!excerpt && postData.content) {
        excerpt = postData.content.substring(0, 100).replace(/\s+/g, ' ').trim() + '...';
    }

    const post = {
        id: postId,
        title: postData.title || 'Untitled',
        image: postData.image || '',
        excerpt: excerpt,
        content: postData.content || '',
        category: postData.category || 'Uncategorized',
        tags: postData.tags || [],
        views: 0,
        date: new Date().toISOString().split('T')[0],
        isPinned: postData.isPinned || false
    };
    
    await env.BLOG_KV.put(`post_${postId}`, JSON.stringify(post));
    ctx.waitUntil(updateIndexes(env));
    return jsonResponse({ success: true, post: post }, { status: 201 });
}

async function handleUpdatePost(request, env, ctx, id) {
    const [postData, existingPost] = await Promise.all([request.json(), env.BLOG_KV.get(`post_${id}`, 'json')]);
    if (!existingPost) return errorResponse('Post not found', 404);
    
    const updatedPost = { ...existingPost, ...postData };
    if (!updatedPost.excerpt && updatedPost.content) {
        updatedPost.excerpt = updatedPost.content.substring(0, 100).replace(/\s+/g, ' ').trim() + '...';
    }
    updatedPost.isPinned = postData.isPinned === true;

    await env.BLOG_KV.put(`post_${id}`, JSON.stringify(updatedPost));
    ctx.waitUntil(updateIndexes(env));
    ctx.waitUntil(invalidateCache(request));
    return jsonResponse({ success: true, post: updatedPost });
}

async function handleDeletePost(request, env, ctx, id) {
    await env.BLOG_KV.delete(`post_${id}`);
    ctx.waitUntil(updateIndexes(env));
    ctx.waitUntil(invalidateCache(request));
    return jsonResponse({ success: true });
}

// --- Background Tasks ---
async function invalidateCache(request) {
    const cache = caches.default;
    const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
    await cache.delete(cacheKey);
    console.log(`Cache invalidated for: ${new URL(request.url).toString()}`);
}

async function updateIndexes(env) {
    console.log("Rebuilding indexes with pinning support...");
    const { keys } = await env.BLOG_KV.list({ prefix: 'post_' });
    const posts = await Promise.all(keys.map(key => env.BLOG_KV.get(key.name, 'json')));
    
    const posts_index = [];
    const categories_index = new Set();
    const tags_index = new Set();
    
    for (const post of posts) {
      if (post) {
        posts_index.push({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          image: post.image,
          date: post.date,
          category: post.category,
          tags: post.tags || [],
          isPinned: post.isPinned || false,
        });
        if (post.category) categories_index.add(post.category);
        post.tags?.forEach(tag => tags_index.add(tag));
      }
    }
    
    posts_index.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.date) - new Date(a.date);
    });

    await Promise.all([
        env.BLOG_KV.put('posts_index', JSON.stringify(posts_index)),
        env.BLOG_KV.put('categories_index', JSON.stringify([...categories_index].sort())),
        env.BLOG_KV.put('tags_index', JSON.stringify([...tags_index].sort()))
    ]);
    console.log("Indexes rebuilt.");
}

async function incrementPostViews(env, postId) {
    const key = `post_${postId}`;
    const post = await env.BLOG_KV.get(key, 'json');
    if (post) {
        post.views = (post.views || 0) + 1;
        await env.BLOG_KV.put(key, JSON.stringify(post));
    }
}
