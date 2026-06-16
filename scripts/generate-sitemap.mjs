import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://minimalist.ggff.net';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, updated_at, created_at')
    .eq('is_draft', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch posts:', error.message);
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
    ...(posts || []).map(p => ({
      loc: `${SITE_URL}/post/${p.id}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: (p.updated_at || p.created_at || today).split('T')[0]
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <lastmod>${u.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

  const fs = await import('fs');
  fs.writeFileSync('public/sitemap.xml', xml, 'utf-8');
  console.log(`Sitemap generated: ${urls.length} URLs`);
}

generateSitemap();
