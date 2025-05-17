import { NextResponse } from 'next/server';
import { getPostBySlug as getGithubPostBySlug, deletePost as deleteGithubPost } from '@/lib/github';
import { clearAllGithubCache } from '@/lib/cache/fs-cache';
import { getPostBySlug, deletePost as deleteDbPost } from '@/lib/db/posts';
import { queuePostChange } from '@/lib/sync/service';
import { Post } from '@/types/post';
import initializeDatabase from '@/lib/db';
import fs from 'fs';
import path from 'path';

// 确保数据库初始化
initializeDatabase();

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`[API] 请求永久删除文章: ${slug}`);
    
    // 先清除缓存，确保获取最新数据
    try {
      await clearAllGithubCache();
      console.log(`[API] 删除前清除缓存成功`);
    } catch (cacheError) {
      console.warn(`[API] 删除前清除缓存失败: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`);
    }
    
    // 从数据库中获取文章
    const post = getPostBySlug(slug);
    
    // 如果文章不存在
    if (!post) {
      console.log(`[API] 文章不存在: ${slug}`);
      return Response.json(
        { 
          error: '文章不存在或已被删除'
        },
        { status: 404 }
      );
    }
    
    let filesystemDeleted = false;
    let databaseDeleted = false;
    
    // 1. 尝试删除文件系统文件
    try {
      if (post.metadata?.originalFile) {
        // 方法1: 使用GitHub API删除
        await deleteGithubPost(post);
        console.log(`[API] 成功删除GitHub文件: ${post.metadata.originalFile}`);
        
        // 方法2: 删除本地文件系统文件
        const localFilePath = post.metadata.originalFile.replace(/^content\//, '');
        const absoluteFilePath = path.join(process.cwd(), 'content', localFilePath);
        
        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
          console.log(`[API] 成功删除本地文件: ${absoluteFilePath}`);
          filesystemDeleted = true;
        } else {
          console.log(`[API] 本地文件不存在: ${absoluteFilePath}`);
        }
      } else if (post.categories && post.categories.length > 0 && post.date) {
        // 尝试构建可能的文件路径并删除
        const category = post.categories[0];
        const dateStr = post.date.split('T')[0];
        const possibleFilename = `${dateStr}-${slug}.md`;
        const possiblePath = path.join(process.cwd(), 'content', 'posts', category, possibleFilename);
        
        if (fs.existsSync(possiblePath)) {
          fs.unlinkSync(possiblePath);
          console.log(`[API] 成功删除本地文件: ${possiblePath}`);
          filesystemDeleted = true;
        } else {
          console.log(`[API] 本地文件不存在: ${possiblePath}`);
        }
      }
    } catch (fileError) {
      console.error(`[API] 删除文件系统文件失败:`, fileError);
    }
    
    // 2. 尝试从数据库中删除文章
    try {
      const deleted = deleteDbPost(slug);
      if (deleted) {
        console.log(`[API] 从数据库成功删除文章: ${slug}`);
        databaseDeleted = true;
      } else {
        console.log(`[API] 从数据库删除文章失败: ${slug}`);
      }
    } catch (dbError) {
      console.error(`[API] 从数据库删除文章时出错:`, dbError);
    }
    
    // 3. 将删除操作添加到同步队列
    try {
      await queuePostChange('delete', post);
      console.log(`[API] 已将删除操作添加到同步队列`);
    } catch (queueError) {
      console.error(`[API] 添加删除操作到同步队列失败:`, queueError);
    }
    
    // 4. 再次清除所有缓存，确保前端获取不到已删除的文章
    await clearAllGithubCache();
    
    return Response.json({
      success: true,
      message: '文章永久删除成功',
      details: {
        slug: post.slug,
        title: post.title,
        filesystemDeleted,
        databaseDeleted
      }
    });
  } catch (error: any) {
    console.error(`[API] 永久删除文章失败 ${params.slug}:`, error);
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '永久删除文章失败', 
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 也支持DELETE方法
export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return POST(request, { params });
} 