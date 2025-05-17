/**
 * 控制面板API（新版）
 * 
 * 使用统一数据服务获取控制面板数据
 */

import { NextResponse } from 'next/server';
import { getAllPosts, getCategories, getTags } from '@/lib/services/data';

// 生成随机浏览量数据（临时）
function generateRandomViews(min = 100, max = 5000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET() {
  try {
    // 获取所有文章（包括未发布的）
    const { posts, total } = await getAllPosts({ 
      includeUnpublished: true,
      limit: 1000 // 获取足够多的文章来计算统计信息
    });
    
    // 获取所有分类和标签
    const categories = await getCategories();
    const tags = await getTags();
    
    // 计算统计信息
    const published = posts.filter(post => post.is_published).length;
    const draft = total - published;
    
    // 构建分类和标签计数
    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    
    // 统计每个分类的文章数
    categories.forEach(category => {
      categoryCounts[category.name] = 0;
    });
    
    // 统计每个标签的文章数
    tags.forEach(tag => {
      tagCounts[tag.name] = 0;
    });
    
    // 计算每个文章所属的分类和标签
    posts.forEach(post => {
      // 统计分类
      if (Array.isArray(post.categories)) {
        post.categories.forEach(categoryName => {
          if (categoryCounts[categoryName] !== undefined) {
            categoryCounts[categoryName]++;
          } else {
            categoryCounts[categoryName] = 1;
          }
        });
      }
      
      // 统计标签
      if (Array.isArray(post.tags)) {
        post.tags.forEach(tagName => {
          if (tagCounts[tagName] !== undefined) {
            tagCounts[tagName]++;
          } else {
            tagCounts[tagName] = 1;
          }
        });
      }
    });
    
    // 获取最近5篇发布的文章
    const recentPosts = posts
      .filter(post => post.is_published)
      .sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || '');
        const dateB = new Date(b.date || b.created_at || '');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(post => ({
        id: post.id || post.slug,
        title: post.title,
        slug: post.slug,
        date: post.date || post.created_at,
        views: generateRandomViews() // 临时使用随机数
      }));
    
    // 构建响应数据
    const dashboardData = {
      posts: {
        total,
        published,
        draft,
        categories: categoryCounts,
        tags: tagCounts
      },
      stats: {
        totalViews: posts.length * 100, // 临时数据
        totalComments: Math.floor(posts.length * 2.5), // 临时数据
        avgReadTime: 4.5 // 临时数据
      },
      recentPosts
    };
    
    return Response.json(dashboardData);
  } catch (error) {
    console.error('[控制面板API-新] 获取数据失败:', error);
    
    // 出错时返回空数据结构
    return Response.json(
      {
        error: '获取控制面板数据失败',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 