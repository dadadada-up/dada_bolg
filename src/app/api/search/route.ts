import { NextRequest, NextResponse } from "next/server";
import { createDataService } from "@/lib/services/data/service";
import { dynamicConfig, getQueryParam, getNumberQueryParam, shouldUseMockData } from '@/lib/api/route-config';

// 强制动态路由，防止静态生成
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // 检查是否应该返回模拟数据
    if (shouldUseMockData('搜索API')) {
      // 返回模拟搜索结果
      return Response.json({
        posts: [
          {
            id: 1,
            title: "Next.js 14 新特性解析",
            slug: "nextjs-14-features",
            excerpt: "Next.js 14 带来了许多激动人心的新特性，本文将详细解析这些特性及其应用场景。",
            is_published: true,
            is_featured: true,
            imageUrl: "https://example.com/images/nextjs14.jpg",
            date: new Date().toISOString(),
            categories: ["技术", "前端"],
            tags: ["Next.js", "React", "Web开发"]
          }
        ],
        query: "nextjs",
        total: 1,
        page: 1,
        totalPages: 1,
        source: "vercel-mock"
      });
    }
    
    // 获取查询参数
    const query = getQueryParam(request, "q", "").toLowerCase();
    const page = getNumberQueryParam(request, "page", 1);
    const limit = getNumberQueryParam(request, "limit", 10);
    
    // 如果没有查询参数，返回空结果
    if (!query) {
      return Response.json({ 
        posts: [],
        query: "",
        total: 0,
        page: 1,
        totalPages: 0
      });
    }
    
    // 使用DataService获取所有文章
    const dataService = createDataService();
    
    // 尝试使用内置搜索功能
    if (query.length >= 3) {
      try {
        const searchResult = await dataService.searchPosts(query, { 
          limit: 1000 // 获取足够多的结果以进行本地排序和分页
        });
        
        // 如果搜索成功且有结果，则处理这些结果
        if (searchResult && searchResult.posts.length > 0) {
          // 按相关度排序
          const sortedPosts = searchResult.posts.sort((a, b) => {
            // 标题匹配优先
            const aTitleMatch = a.title.toLowerCase().includes(query);
            const bTitleMatch = b.title.toLowerCase().includes(query);
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            
            // 然后按日期排序
            return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
          });
          
          // 分页处理
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedPosts = sortedPosts.slice(startIndex, endIndex);
          
          return Response.json({ 
            posts: paginatedPosts,
            query,
            total: sortedPosts.length,
            page,
            totalPages: Math.ceil(sortedPosts.length / limit)
          });
        }
      } catch (searchError) {
        console.warn("数据库搜索失败，使用内存搜索:", searchError);
      }
    }
    
    // 获取所有文章并在内存中搜索（作为备选方案）
    const { posts: allPosts } = await dataService.getAllPosts();
    
    // 根据查询参数过滤文章
    const filteredPosts = allPosts.filter(post => {
      // 如果查询关键词很短，只匹配标题、标签和分类
      if (query.length < 3) {
        return (
          post.title.toLowerCase().includes(query) ||
          post.tags.some(tag => String(tag).toLowerCase().includes(query)) ||
          post.categories.some(category => String(category).toLowerCase().includes(query))
        );
      }
      
      // 如果查询关键词较长，匹配标题、摘要、内容、标签和分类
      return (
        post.title.toLowerCase().includes(query) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
        (post.content && post.content.toLowerCase().includes(query)) ||
        post.tags.some(tag => String(tag).toLowerCase().includes(query)) ||
        post.categories.some(category => String(category).toLowerCase().includes(query))
      );
    });
    
    // 按相关度排序
    const sortedPosts = filteredPosts.sort((a, b) => {
      // 标题匹配优先
      const aTitleMatch = a.title.toLowerCase().includes(query);
      const bTitleMatch = b.title.toLowerCase().includes(query);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // 然后按日期排序
      return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
    });
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = sortedPosts.slice(startIndex, endIndex);
    
    return Response.json({ 
      posts: paginatedPosts,
      query,
      total: sortedPosts.length,
      page,
      totalPages: Math.ceil(sortedPosts.length / limit)
    });
  } catch (error) {
    console.error("搜索API错误:", error);
    return Response.json(
      { error: "搜索处理失败" },
      { status: 500 }
    );
  }
} 