import { NextResponse } from 'next/server';
import { getPostBySlug as getGithubPostBySlug, deletePost as deleteGithubPost } from '@/lib/github';
import { getPostBySlug, deletePost } from '@/lib/db/repositories';
import { clearAllGithubCache } from '@/lib/cache/fs-cache';
import { Post } from '@/types/post';
import fs from 'fs';
import path from 'path';
import { createDataService } from '@/lib/services/data/service';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // 1. 尝试从数据库获取文章
    const post = await getPostBySlug(slug);
    
    // 2. 从数据库删除文章
    if (post) {
      const deleted = await deletePost(slug);
      console.log(`[API] 从数据库永久删除文章: ${slug}, 结果: ${deleted}`);
    }

    // 3. 尝试从GitHub获取并删除文章（备用功能）
    try {
      const githubPost = await getGithubPostBySlug(slug);
      if (githubPost) {
        await deleteGithubPost(githubPost);
        console.log(`[API] 从Github永久删除文章: ${slug}`);
      }
    } catch (githubError) {
      console.error(`[API] 从Github删除文章失败 (非致命错误): ${slug}`, githubError);
    }
    
    // 4. 尝试从本地文件系统删除文章文件（如果有）
    try {
      const contentDir = path.join(process.cwd(), 'content');
      const postsDir = path.join(contentDir, 'posts');
      
      // 检查posts目录是否存在
      if (fs.existsSync(postsDir)) {
        // 尝试查找和删除文件
        const files = fs.readdirSync(postsDir);
        const mdFile = files.find(f => f.startsWith(slug) && (f.endsWith('.md') || f.endsWith('.mdx')));
        
        if (mdFile) {
          const filePath = path.join(postsDir, mdFile);
          fs.unlinkSync(filePath);
          console.log(`[API] 从本地文件系统删除文章: ${filePath}`);
        }
      }
    } catch (fsError) {
      console.error(`[API] 从文件系统删除文章失败 (非致命错误): ${slug}`, fsError);
    }
    
    // 5. 清除缓存
    clearAllGithubCache();
    
    return Response.json({ success: true, slug });
  } catch (error) {
    console.error(`[API] 文章永久删除失败: ${params.slug}`, error);
    return Response.json(
      { error: '文章删除失败', message: error instanceof Error ? error.message : String(error) },
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