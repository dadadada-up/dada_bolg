import { NextResponse } from 'next/server';
import { postRepository, categoryRepository, tagRepository } from '@/lib/db/repositories';
import { initializeDatabase } from '@/lib/db/database';
import { Tag } from '@/types/post';

// 初始化数据库连接
initializeDatabase().catch(console.error);

// 添加内存缓存
let dashboardCache: any = null;
let dashboardCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

export async function GET() {
  try {
    console.log('[API] 开始获取仪表盘数据');
    
    // 检查缓存是否有效
    const now = Date.now();
    if (dashboardCache && (now - dashboardCacheTimestamp < CACHE_TTL)) {
      console.log('[API] 使用缓存的仪表盘数据');
      return Response.json(dashboardCache);
    }
    
    // 从数据库获取文章数据
    const { posts, total } = await postRepository.getAllPosts({ 
      includeUnpublished: true,
      limit: 1000 // 获取所有文章，用于统计
    });
    
    // 获取分类数据
    const categories = await categoryRepository.getAllCategories();
    
    // 获取标签数据
    const tags = await tagRepository.getPopularTags(20); // 获取前20个热门标签
    
    // 计算统计数据
    const published = posts.filter(post => post.published).length;
    const draft = total - published;
    
    // 构建分类统计
    const categoryCounts: Record<string, number> = {};
    categories.forEach(category => {
      categoryCounts[category.name] = category.postCount;
    });
    
    // 构建标签统计
    const tagCounts: Record<string, number> = {};
    tags.forEach((tag: Tag) => {
      tagCounts[tag.name] = tag.postCount;
    });
    
    // 获取最近文章
    const recentPosts = posts
      .filter(post => post.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        date: post.date,
        views: Math.floor(Math.random() * 2000) // 模拟访问量数据，实际应从统计表获取
      }));
    
    // 构建仪表盘数据
    const dashboardData = {
      posts: {
        total,
        published,
        draft,
        categories: categoryCounts,
        tags: tagCounts
      },
      stats: {
        totalViews: posts.length * Math.floor(Math.random() * 200), // 模拟数据
        totalComments: Math.floor(Math.random() * 500), // 模拟数据
        avgReadTime: 4.5 // 模拟数据
      },
      recentPosts
    };
    
    // 更新缓存
    dashboardCache = dashboardData;
    dashboardCacheTimestamp = now;
    
    return Response.json(dashboardData);
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    
    // 返回空数据结构，避免前端报错
    return Response.json({
      posts: {
        total: 0,
        published: 0,
        draft: 0,
        categories: {},
        tags: {}
      },
      stats: {
        totalViews: 0,
        totalComments: 0,
        avgReadTime: 0
      },
      recentPosts: []
    });
  }
} 