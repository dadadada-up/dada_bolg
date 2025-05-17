import { getPosts } from '@/lib/github';

export async function GET() {
  try {
    const posts = await getPosts();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
    const siteName = 'Dada Blog';
    const siteDescription = 'Dada的个人博客，分享技术文章和生活随笔';
    
    // 对内容进行基本的HTML实体转义
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // 生成RSS XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${siteName}]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/favicon.ico</url>
      <title><![CDATA[${siteName}]]></title>
      <link>${baseUrl}</link>
    </image>
    ${posts
      .filter(post => post.published !== false)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
      .map(post => {
        // 提取文章中的第一张图片作为封面
        const imageMatch = post.content.match(/<img.*?src=["'](.*?)["']/i);
        const coverImage = post.coverImage || (imageMatch ? imageMatch[1] : null);
        
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
      ${post.categories.map(category => `<category><![CDATA[${category}]]></category>`).join('')}
      ${post.tags.map(tag => `<category><![CDATA[${tag}]]></category>`).join('')}
      ${coverImage ? `<enclosure url="${coverImage}" type="image/jpeg" />` : ''}
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <dc:creator><![CDATA[Dada]]></dc:creator>
    </item>`;
      }).join('')}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  } catch (error) {
    console.error('生成RSS feed失败:', error);
    
    // 生成基本RSS feed作为备用
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Dada Blog</title>
    <link>${baseUrl}</link>
    <description>Dada的个人博客，分享技术文章和生活随笔</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  </channel>
</rss>`;

    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  }
} 