import { NextResponse } from 'next/server';
import { getAllFallbackPosts } from '@/lib/fallback-data';
import { Post } from '@/types/post';
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import { query, queryOne, execute } from '@/lib/db/database';
import { getAllPosts } from '@/lib/content/manager';

// 内存缓存，用于服务器端缓存
interface ApiCache {
  data: any;
  timestamp: number;
}

// 添加接口层面的缓存，减轻对API的压力
const API_CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存
const apiCache = new Map<string, ApiCache>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const sortBy = searchParams.get('sort') || undefined;
    const sortOrder = searchParams.get('order') as 'asc' | 'desc' | undefined;
    
    // 构建缓存键
    const cacheKey = `posts-page${page}-limit${limit}-category${category}-tag${tag}-sort${sortBy}-order${sortOrder}`;
    
    // 检查缓存
    const now = Date.now();
    const cached = apiCache.get(cacheKey);
    if (cached && (now - cached.timestamp < API_CACHE_TTL)) {
      console.log('[文章API] 使用缓存数据');
      return Response.json(cached.data);
    }
    
    console.log(`[文章API] 获取文章列表: 页码=${page}, 限制=${limit}, 分类=${category}, 标签=${tag}`);
    
    // 尝试使用数据库
    let posts: Post[] = [];
    let source = 'turso';
    
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      try {
        console.log('[Turso] 尝试从数据库获取文章');
        
        if (category || tag) {
          // 如果有分类或标签筛选，构建复杂查询
          let sql = `
            SELECT 
              p.id, p.slug, p.title, p.content, p.excerpt, p.description,
              p.published as is_published, p.featured as is_featured, 
              p.cover_image as imageUrl, p.reading_time,
              p.created_at, p.updated_at,
              COALESCE(
                (SELECT json_group_array(c.name) FROM post_categories pc 
                 JOIN categories c ON pc.category_id = c.id 
                 WHERE pc.post_id = p.id),
                '[]'
              ) as categories_json,
              COALESCE(
                (SELECT json_group_array(t.name) FROM post_tags pt 
                 JOIN tags t ON pt.tag_id = t.id 
                 WHERE pt.post_id = p.id),
                '[]'
              ) as tags_json,
              substr(p.created_at, 1, 10) as date
            FROM posts p
            WHERE p.published = 1
          `;
          
          const params: any[] = [];
          
          // 添加分类筛选
          if (category) {
            sql += `
              AND EXISTS (
                SELECT 1 FROM post_categories pc 
                JOIN categories c ON pc.category_id = c.id 
                WHERE pc.post_id = p.id AND (c.name = ? OR c.slug = ?)
              )
            `;
            params.push(category, category);
          }
          
          // 添加标签筛选
          if (tag) {
            sql += `
              AND EXISTS (
                SELECT 1 FROM post_tags pt 
                JOIN tags t ON pt.tag_id = t.id 
                WHERE pt.post_id = p.id AND (t.name = ? OR t.slug = ?)
              )
            `;
            params.push(tag, tag);
          }
          
          // 添加排序
          if (sortBy && ['title', 'created_at', 'updated_at'].includes(sortBy)) {
            sql += ` ORDER BY p.${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
          } else {
            sql += ` ORDER BY p.created_at DESC`;
          }
          
          const dbPosts = await query(sql, params);
          
          if (dbPosts && dbPosts.length > 0) {
            // 处理数据库结果
            posts = dbPosts.map((post: any) => ({
              id: post.id,
              slug: post.slug,
              title: post.title,
              content: post.content,
              excerpt: post.excerpt || post.description,
              description: post.description,
              is_published: !!post.is_published,
              is_featured: !!post.is_featured,
              imageUrl: post.imageUrl,
              date: post.date,
              created_at: post.created_at,
              updated_at: post.updated_at,
              categories: JSON.parse(post.categories_json || '[]'),
              tags: JSON.parse(post.tags_json || '[]')
            }));
          } else {
            throw new Error('数据库查询未返回结果');
          }
        } else {
          // 简单情况，使用manager中的函数
          const result = await getAllPosts({ limit: 1000 });
          posts = result.posts;
        }
        
        console.log(`[Turso] 从数据库成功获取 ${posts.length} 篇文章`);
      } catch (dbError) {
        console.error('[Turso] 从数据库获取文章失败:', dbError);
        
        // 回退到备用数据
        posts = getAllFallbackPosts();
        source = 'fallback';
      }
    } else {
      // 使用备用数据
      posts = getAllFallbackPosts();
      source = 'fallback';
    }
    
    // 根据分类过滤 (如果使用备用数据)
    if (source === 'fallback' && category) {
      posts = posts.filter(post => 
        post.categories && post.categories.some(cat => 
          cat.toLowerCase() === category.toLowerCase() || 
          cat.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase()
        )
      );
    }
    
    // 根据标签过滤 (如果使用备用数据)
    if (source === 'fallback' && tag) {
      posts = posts.filter(post => 
        post.tags && post.tags.some(t => 
          t.toLowerCase() === tag.toLowerCase() || 
          t.toLowerCase().replace(/\s+/g, '-') === tag.toLowerCase()
        )
      );
    }
    
    // 排序 (如果使用备用数据)
    if (source === 'fallback') {
      if (sortBy && posts.length > 0 && posts[0][sortBy as keyof Post] !== undefined) {
        posts.sort((a, b) => {
          const aValue = a[sortBy as keyof Post];
          const bValue = b[sortBy as keyof Post];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' 
              ? aValue.localeCompare(bValue) 
              : bValue.localeCompare(aValue);
          }
          
          return 0;
        });
      } else {
        // 默认按日期降序排序
        posts.sort((a, b) => {
          const aDate = new Date(a.date || '').getTime();
          const bDate = new Date(b.date || '').getTime();
          return bDate - aDate;
        });
      }
    }
    
    // 计算总页数
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    
    // 分页
    const start = (page - 1) * limit;
    const end = start + limit;
    const pagedPosts = posts.slice(start, end);
    
    const response = {
      total,
      page,
      limit,
      totalPages,
      data: pagedPosts,
      source
    };
    
    // 更新缓存
    apiCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    return Response.json(response);
  } catch (error) {
    console.error('[文章API] 获取文章失败:', error);
    
    // 最后的回退，使用备用数据
    try {
      const posts = getAllFallbackPosts();
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      
      // 计算总页数
      const total = posts.length;
      const totalPages = Math.ceil(total / limit);
      
      // 分页
      const start = (page - 1) * limit;
      const end = start + limit;
      const pagedPosts = posts.slice(start, end);
      
      console.log(`[文章API] 出错后回退到备用数据: ${pagedPosts.length} 篇文章`);
      
      return Response.json({
        total,
        page,
        limit,
        totalPages,
        data: pagedPosts,
        source: 'fallback_error'
      });
    } catch (fallbackError) {
      return Response.json(
        { 
          error: '获取文章失败', 
          message: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }
}

// 处理单篇文章获取
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    return Response.json({
      success: true,
      message: 'Vercel部署环境不支持文章创建，请使用本地开发环境'
    });
  } catch (error) {
    console.error('处理请求失败:', error);
    return Response.json(
      { error: '处理请求失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 