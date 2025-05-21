/**
 * 仪表盘API（修复版本）
 * 
 * 使用 Turso 数据库获取统计数据
 */

import { query, queryOne } from '@/lib/db/database';

// 生成随机浏览量，用于演示
function generateRandomViews(): number {
  return Math.floor(Math.random() * 1000) + 100;
}

export async function GET() {
  try {
    // 查询统计数据
    const postCountSql = `SELECT COUNT(*) as count FROM posts`;
    const publishedPostCountSql = `SELECT COUNT(*) as count FROM posts WHERE is_published = 1`;
    const draftPostCountSql = `SELECT COUNT(*) as count FROM posts WHERE is_published = 0`;
    const categoryCountSql = `SELECT COUNT(*) as count FROM categories`;
    const tagCountSql = `SELECT COUNT(*) as count FROM tags`;
    
    // 查询最近的文章
    const recentPostsSql = `
      SELECT 
        id, title, slug, excerpt, is_published, 
        created_at, updated_at
      FROM posts 
      WHERE is_published = 1
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    // 查询分类统计
    const categoriesSql = `
      SELECT 
        c.name, c.slug,
        COUNT(pc.post_id) as post_count
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      LEFT JOIN posts p ON pc.post_id = p.id AND p.is_published = 1
      GROUP BY c.id
      ORDER BY post_count DESC
    `;
    
    // 查询标签统计
    const tagsSql = `
      SELECT 
        t.name, t.slug,
        COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.is_published = 1
      GROUP BY t.id
      ORDER BY post_count DESC
    `;
    
    // 执行所有查询
    const [
      postCount,
      publishedPostCount,
      draftPostCount,
      categoryCount,
      tagCount,
      recentPosts,
      categories,
      tags
    ] = await Promise.all([
      queryOne(postCountSql),
      queryOne(publishedPostCountSql),
      queryOne(draftPostCountSql),
      queryOne(categoryCountSql),
      queryOne(tagCountSql),
      query(recentPostsSql),
      query(categoriesSql),
      query(tagsSql)
    ]);
    
    // 格式化最近文章数据
    const formattedRecentPosts = recentPosts.map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      date: post.created_at ? new Date(post.created_at).toISOString() : undefined,
      views: generateRandomViews() // 临时使用随机数
    }));
    
    // 格式化分类数据
    const categoriesMap: Record<string, number> = {};
    categories.forEach((cat: any) => {
      categoriesMap[cat.name] = cat.post_count;
    });
    
    // 格式化标签数据
    const tagsMap: Record<string, number> = {};
    tags.forEach((tag: any) => {
      tagsMap[tag.name] = tag.post_count;
    });
    
    // 构建响应
    const response = {
      posts: {
        total: postCount?.count || 0,
        published: publishedPostCount?.count || 0,
        draft: draftPostCount?.count || 0,
        categories: categoriesMap,
        tags: tagsMap
      },
      stats: {
        totalViews: Math.floor((postCount?.count || 0) * 100), // 临时数据
        totalComments: Math.floor((postCount?.count || 0) * 2.5), // 临时数据
        avgReadTime: 4.5 // 临时数据
      },
      recentPosts: formattedRecentPosts,
      source: 'turso-db'
    };
    
    return Response.json(response);
  } catch (error) {
    console.error('[API修复版] 获取仪表盘数据失败:', error);
    
    return Response.json(
      { 
        error: '获取仪表盘数据失败', 
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 