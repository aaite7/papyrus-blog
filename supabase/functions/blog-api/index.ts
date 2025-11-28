import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/blog-api', '');
    const method = req.method;

    if (method === 'GET' && path === '/posts') {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, image, excerpt, category, tags, mood, is_pinned, read_time, created_at, views, likes, published')
        .eq('published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posts = data.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        image: post.image,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        mood: post.mood,
        isPinned: post.is_pinned,
        read_time: post.read_time,
        date: post.created_at.split('T')[0],
        views: post.views,
        likes: post.likes,
        published: post.published,
      }));

      return new Response(JSON.stringify(posts), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'GET' && path.startsWith('/posts/')) {
      const id = path.split('/')[2];

      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('posts')
        .update({ views: post.views + 1 })
        .eq('id', id);

      const response = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        image: post.image,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        category: post.category,
        tags: post.tags,
        mood: post.mood,
        isPinned: post.is_pinned,
        read_time: post.read_time,
        date: post.created_at.split('T')[0],
        views: post.views + 1,
        likes: post.likes,
        published: post.published,
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && path === '/login') {
      const { username, password } = await req.json();
      const adminUser = Deno.env.get('ADMIN_USER') || 'admin';
      const adminPass = Deno.env.get('ADMIN_PASS') || 'password';

      if (username === adminUser && password === adminPass) {
        const token = crypto.randomUUID();
        return new Response(JSON.stringify({ success: true, token }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && path.match(/\/posts\/[^/]+\/like$/)) {
      const id = path.split('/')[2];
      
      const { data: post, error } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', id)
        .maybeSingle();

      if (error || !post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('posts')
        .update({ likes: post.likes + 1 })
        .eq('id', id);

      return new Response(JSON.stringify({ success: true, likes: post.likes + 1 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isProtectedRoute = (method === 'POST' || method === 'PUT' || method === 'DELETE') && path.startsWith('/posts') && !path.includes('/like');
    if (isProtectedRoute) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (method === 'POST' && path === '/posts') {
      const postData = await req.json();

      let excerpt = postData.excerpt || '';
      if (!excerpt && postData.content) {
        excerpt = postData.content.substring(0, 150).replace(/\s+/g, ' ').trim() + '...';
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: postData.title || 'Untitled',
          image: postData.image || '',
          excerpt,
          content: postData.content || '',
          author: postData.author || 'Admin',
          category: postData.category || 'Thoughts',
          tags: postData.tags || [],
          mood: postData.mood || 'neutral',
          is_pinned: postData.isPinned || false,
          published: postData.published !== false,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, post: data }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT' && path.startsWith('/posts/')) {
      const id = path.split('/')[2];
      const postData = await req.json();

      let excerpt = postData.excerpt;
      if (!excerpt && postData.content) {
        excerpt = postData.content.substring(0, 150).replace(/\s+/g, ' ').trim() + '...';
      }

      const updateData: any = {};
      if (postData.title !== undefined) updateData.title = postData.title;
      if (postData.image !== undefined) updateData.image = postData.image;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (postData.content !== undefined) updateData.content = postData.content;
      if (postData.author !== undefined) updateData.author = postData.author;
      if (postData.category !== undefined) updateData.category = postData.category;
      if (postData.tags !== undefined) updateData.tags = postData.tags;
      if (postData.mood !== undefined) updateData.mood = postData.mood;
      if (postData.isPinned !== undefined) updateData.is_pinned = postData.isPinned;
      if (postData.published !== undefined) updateData.published = postData.published;

      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, post: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE' && path.startsWith('/posts/')) {
      const id = path.split('/')[2];

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});