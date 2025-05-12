import { NextResponse } from 'next/server';
import { getPostBySlug as getGithubPostBySlug, updatePost as updateGithubPost, deletePost as deleteGithubPost } from '@/lib/github';
import { clearAllGithubCache } from '@/lib/fs-cache';
import { getPostBySlug, deletePost } from '@/lib/db-posts';
import { savePostSafe, getPostBySqlite } from '@/lib/db-posts.patch';
import { queuePostChange } from '@/lib/sync-service';
import { Post } from '@/types/post';
import initializeDatabase from '@/lib/db';
import fs from 'fs';
import path from 'path';
import * as github from '@/lib/github';
import { revalidatePath } from 'next/cache';

// 确保数据库初始化
initializeDatabase();

// 缓存
const postCache = new Map<string, { post: Post; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
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
    
    // 尝试从数据库获取文章（使用修复版本的函数）
    const post = await getPostBySqlite(slug);
    
    if (!post) {
      // 如果数据库中没有找到，尝试从GitHub获取
      const githubPost = await getGithubPostBySlug(slug);
      
      if (githubPost) {
        // 如果GitHub中找到文章，保存到数据库并返回
        savePostSafe(githubPost);
        
        // 更新缓存
        postCache.set(slug, {
          post: githubPost,
          timestamp: Date.now()
        });
        
        return Response.json(githubPost);
      }
      
      // 如果两处都找不到，返回404
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

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await request.json();
    const slug = params.slug;
    
    // 验证必要字段
    if (!data.title || !data.content || !data.categories) {
      return Response.json(
        { error: '标题、内容和分类是必需的' },
        { status: 400 }
      );
    }
    
    // 使用安全版本保存更新后的文章
    const postId = savePostSafe(data as Post);
    
    // 添加文章到同步队列
    await queuePostChange('update', data as Post);
    
    // 清除缓存
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/posts`);
    
    return Response.json({
      success: true,
      postId,
      slug: data.slug
    });
  } catch (error) {
    console.error(`更新文章失败: ${params.slug}`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新文章失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`[API] 请求删除文章: ${slug}`);
    
    // 先清除缓存，确保获取最新数据
    try {
      await clearAllGithubCache();
      console.log(`[API] 删除前清除缓存成功`);
    } catch (cacheError) {
      console.warn(`[API] 删除前清除缓存失败: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`);
      // 继续处理，不中断操作
    }
    
    // 从数据库中获取文章
    const post = getPostBySlug(slug);
    
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
    const deleted = deletePost(slug);
    
    if (!deleted) {
      throw new Error('从数据库中删除文章失败');
    }
    
    // 将删除操作添加到同步队列
    await queuePostChange('delete', post);
    
    // 彻底清除所有相关缓存
    clearAllGithubCache();
    postCache.delete(slug);
    
    // 删除GitHub端的文章文件
    try {
      // 如果有原始文件路径信息，尝试删除GitHub上的文件
      if (post.metadata?.originalFile) {
        await deleteGithubPost(post);
        console.log(`[API] 成功删除GitHub文件: ${post.metadata.originalFile}`);
        
        // 同时删除本地文件系统中的文件
        const localFilePath = post.metadata.originalFile.replace(/^content\//, '');
        const absoluteFilePath = path.join(process.cwd(), 'content', localFilePath);
        
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
          console.log(`[API] 成功删除本地文件系统文件: ${absoluteFilePath}`);
        } else {
          console.log(`[API] 本地文件不存在，无需删除: ${absoluteFilePath}`);
        }
      } else {
        // 没有原始文件路径信息，尝试构建可能的文件路径
        if (post.categories && post.categories.length > 0 && post.date) {
          const category = post.categories[0];
          const dateStr = post.date.split('T')[0];
          const possibleFilename = `${dateStr}-${slug}.md`;
          const possiblePath = path.join(process.cwd(), 'content', 'posts', category, possibleFilename);
          
          if (fs.existsSync(possiblePath)) {
            fs.unlinkSync(possiblePath);
            console.log(`[API] 成功删除本地构建的文件: ${possiblePath}`);
          } else {
            console.log(`[API] 尝试删除构建路径失败，文件不存在: ${possiblePath}`);
          }
        }
      }
    } catch (fileError) {
      console.error(`[API] 删除文件失败:`, fileError);
      // 继续执行，不中断流程
    }
    
    // 再次清除所有缓存，确保前端获取不到已删除的文章
    await clearAllGithubCache();
    await fetch('/api/cache/clear', { method: 'POST' }).catch(err => {
      console.error('[API] 删除后清除额外缓存失败:', err);
    });
    
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