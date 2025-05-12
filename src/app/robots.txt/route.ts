export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
  
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/

# 站点地图
Sitemap: ${baseUrl}/sitemap.xml

# 社交媒体验证
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400'
    }
  });
} 