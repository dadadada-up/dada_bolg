import { NextRequest, NextResponse } from "next/server";
import { getAllPosts } from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.toLowerCase() || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
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
    
    // 获取所有文章
    const allPosts = await getAllPosts();
    
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
        post.content.toLowerCase().includes(query) ||
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
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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