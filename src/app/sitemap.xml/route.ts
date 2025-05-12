import { getPosts } from '@/lib/github';
import { getAllCategoryMappings } from '@/lib/github-client';

export async function GET() {
  try {
    const posts = await getPosts();
    const categories = await getAllCategoryMappings();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
    
    const staticPages = [
      { url: '', changefreq: 'daily', priority: '1.0' },
      { url: 'categories', changefreq: 'weekly', priority: '0.8' },
      { url: 'tags', changefreq: 'weekly', priority: '0.8' },
      { url: 'archives', changefreq: 'weekly', priority: '0.7' },
      { url: 'about', changefreq: 'monthly', priority: '0.6' },
    ];
    
    // 生成站点地图XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}/${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `).join('')}
  
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/categories/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join('')}
  
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${post.updated || post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  `).join('')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  } catch (error) {
    console.error('生成站点地图失败:', error);
    
    // 生成基本站点地图作为备用
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  }
} 