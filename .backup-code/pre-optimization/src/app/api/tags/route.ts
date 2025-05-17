import { NextResponse } from 'next/server';
import { getPosts, updatePost } from '@/lib/github';
import { slugify } from '@/lib/utils';
import { Tag } from '@/types/post';

export async function GET() {
  try {
    const posts = await getPosts();
    
    // 统计每个标签下的文章数量
    const tagsMap: Record<string, Tag> = {};
    
    posts.forEach(post => {
      post.tags.forEach(tagName => {
        tagName = tagName.trim();
        if (tagName) {
          const slug = slugify(tagName);
          
          if (!tagsMap[tagName]) {
            tagsMap[tagName] = {
              name: tagName,
              slug,
              postCount: 0
            };
          }
          
          tagsMap[tagName].postCount += 1;
        }
      });
    });
    
    // 转换为数组并排序
    const tags = Object.values(tagsMap)
      .sort((a, b) => b.postCount - a.postCount);
    
    return Response.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return Response.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// 添加新标签（仅创建标签，不会自动关联到文章）
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return Response.json(
        { error: '标签名称不能为空' },
        { status: 400 }
      );
    }
    
    // 创建新标签对象
    const newTag: Tag = {
      name,
      slug: slugify(name),
      postCount: 0
    };
    
    return Response.json({
      success: true,
      tag: newTag
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    return Response.json(
      { error: '创建标签失败' },
      { status: 500 }
    );
  }
} 