import { NextResponse } from 'next/server';
import * as postRepository from '@/lib/db/repositories/post-repository';
import { revalidatePath } from 'next/cache';
import { Post } from '@/types/post';
import * as db from '@/lib/db/database'; // 导入数据库操作函数

// 缓存
const postCache = new Map<string, { post: Post; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

/**
 * 解码slug，确保即使是编码过的slug也能正确处理
 */
function decodeSlugIfNeeded(slug: string): string {
  try {
    // 尝试解码，如果解码后与原值不同，说明它是编码过的
    const decoded = decodeURIComponent(slug);
    return decoded !== slug ? decoded : slug;
  } catch (e) {
    // 如果解码出错，返回原始值
    console.warn(`解码slug失败: ${slug}`, e);
    return slug;
  }
}

/**
 * 获取文章
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    let { slug } = params;
    // 解码slug，确保能正确处理编码过的URL
    slug = decodeSlugIfNeeded(slug);
    
    const { searchParams } = new URL(request.url);
    const noCache = searchParams.get('nocache') === 'true';
    
    // 如果指定不使用缓存，或者URL中包含时间戳参数，则跳过缓存
    const bypassCache = noCache || searchParams.has('t');
    
    if (!bypassCache) {
      // 检查缓存
      const cachedPost = postCache.get(slug);
      if (cachedPost && Date.now() - cachedPost.timestamp < CACHE_TTL) {
        return Response.json(cachedPost.post);
      }
    }
    
    // 从数据库获取文章
    const post = await postRepository.getPostBySlug(slug);
    
    if (!post) {
      // 如果找不到，返回404
      return Response.json(
        { error: '文章不存在', slug },
        { status: 404 }
      );
    }
    
    // 更新缓存
    postCache.set(slug, {
      post,
      timestamp: Date.now()
    });
    
    return Response.json(post);
  } catch (error) {
    console.error(`获取文章失败 ${params.slug}:`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '获取文章失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新文章
 */
export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await request.json();
    let oldSlug = params.slug;
    // 解码slug，确保能正确处理编码过的URL
    oldSlug = decodeSlugIfNeeded(oldSlug);
    
    // 验证必要字段
    if (!data.title || !data.content || !data.categories) {
      return Response.json(
        { error: '标题、内容和分类是必需的' },
        { status: 400 }
      );
    }
    
    // 获取原始文章，确保它存在
    const existingPost = await postRepository.getPostBySlug(oldSlug);
    if (!existingPost) {
      return Response.json(
        { error: '要更新的文章不存在' },
        { status: 404 }
      );
    }
    
    // 检查我们是否需要更新slug - 通过title生成新的slug
    const shouldUpdateSlug = 
      existingPost.title !== data.title && 
      oldSlug === data.slug; // 如果前端传来的slug与路径中的slug相同，则根据title更新slug
    
    // 保存更新后的文章
    const post = data as Post;
    
    // 确保传递文章ID，这样savePost函数会更新而不是创建新文章
    if (!post.id && existingPost.id) {
      post.id = existingPost.id;
      console.log(`[API] 使用现有文章ID: ${post.id}`);
    }
    
    // 确保ID是数字类型
    let postId = existingPost.id;
    if (typeof post.id === 'string') {
      const parsedId = parseInt(post.id, 10);
      if (isNaN(parsedId)) {
        console.warn(`[API] 无效的文章ID: ${post.id}，将使用现有文章ID: ${existingPost.id}`);
        post.id = existingPost.id;
      } else {
        post.id = parsedId;
        postId = parsedId;
      }
    } else if (typeof post.id === 'number') {
      postId = post.id;
    }
    
    console.log(`[API] 更新文章，ID: ${postId}, 类型: ${typeof postId}`);
    
    // 如果前端没有修改slug，但标题发生了变化，则生成新的slug
    let newSlug = post.slug;
    if (shouldUpdateSlug) {
      // 导入slugify函数
      const { enhancedSlugify } = await import('@/lib/utils');
      // 根据新标题生成新slug
      newSlug = enhancedSlugify(post.title, { maxLength: 80 });
      console.log(`[API] 根据新标题自动生成slug: ${post.title} -> ${newSlug}`);
    } else {
      // 如果标题没有变化，或者前端明确提供了不同于原始slug的新slug，则使用原始slug
      // 这确保了只有在标题变化且前端没有明确指定新slug时才自动更新slug
      if (oldSlug === data.slug) {
        newSlug = oldSlug;
        console.log(`[API] 保持原始slug不变: ${oldSlug}`);
      } else {
        newSlug = data.slug;
        console.log(`[API] 使用前端提供的自定义slug: ${data.slug}`);
      }
    }
    
    try {
      // 使用直接的SQL语句更新文章
      const currentTime = db.getCurrentTimestamp();
      const updateSql = `
        UPDATE posts 
        SET title = ?, 
            content = ?, 
            slug = ?,
            updated_at = ?
        WHERE id = ?
      `;
      
      await db.execute(updateSql, [
        post.title,
        post.content,
        newSlug,
        currentTime,
        postId
      ]);
      
      console.log(`[API] 文章更新成功，ID: ${postId}, 标题: ${post.title}`);
      
      // 检查slug是否已更改
      const isSlugChanged = oldSlug !== newSlug;
      
      // 清除缓存
      postCache.delete(oldSlug); // 清除旧slug的缓存
      if (isSlugChanged) {
        postCache.delete(newSlug); // 如果slug变更，同时清除新slug的缓存
        console.log(`[API] 文章slug已更改: ${oldSlug} -> ${newSlug}`);
      }
      
      // 清除页面缓存
      revalidatePath(`/posts/${oldSlug}`);
      revalidatePath(`/posts/${newSlug}`);
      revalidatePath(`/posts`);
      revalidatePath(`/admin/posts`);
      
      return Response.json({
        success: true,
        postId,
        oldSlug,
        slug: newSlug,
        isSlugChanged
      });
    } catch (error) {
      console.error(`更新文章失败: ${params.slug}`, error);
      return Response.json(
        { error: error instanceof Error ? error.message : '更新文章失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`更新文章失败: ${params.slug}`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新文章失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除文章
 */
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    let { slug } = params;
    // 解码slug，确保能正确处理编码过的URL
    slug = decodeSlugIfNeeded(slug);
    
    console.log(`[API] 请求删除文章: ${slug}`);
    
    // 从数据库中获取文章
    const post = await postRepository.getPostBySlug(slug);
    
    // 如果文章不存在，返回404错误
    if (!post) {
      console.log(`[API] 文章不存在: ${slug}`);
      return Response.json(
        { 
          error: '文章不存在或已被删除'
        },
        { status: 404 }
      );
    }
    
    // 从数据库中删除文章
    const deleted = await postRepository.deletePost(slug);
    
    if (!deleted) {
      throw new Error('从数据库中删除文章失败');
    }
    
    // 清除缓存
    postCache.delete(slug);
    
    // 清除页面缓存
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/posts`);
    
    return Response.json({
      success: true,
      message: '文章删除成功',
      slug: post.slug,
      title: post.title
    });
  } catch (error: any) {
    console.error(`[API] 删除文章失败 ${params.slug}:`, error);
    
    // 返回更详细的错误信息
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '删除文章失败', 
        details: error instanceof Error ? error.stack : undefined,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
} 