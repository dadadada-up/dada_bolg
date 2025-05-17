import { NextResponse } from 'next/server';
import { getPosts, updatePost } from '@/lib/github';
import { slugify } from '@/lib/utils';
import { Tag } from '@/types/post';

// 获取特定标签信息
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const tagName = decodeURIComponent(params.name);
    const posts = await getPosts();
    
    // 查找包含该标签的文章
    const tagPosts = posts.filter(post => 
      post.tags.includes(tagName)
    );
    
    if (tagPosts.length === 0) {
      return Response.json(
        { error: `标签 "${tagName}" 不存在` },
        { status: 404 }
      );
    }
    
    // 创建标签对象
    const tag: Tag = {
      name: tagName,
      slug: slugify(tagName),
      postCount: tagPosts.length
    };
    
    return Response.json(tag);
  } catch (error) {
    console.error(`获取标签 ${params.name} 失败:`, error);
    return Response.json(
      { error: '获取标签信息失败' },
      { status: 500 }
    );
  }
}

// 重命名标签
export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const oldName = decodeURIComponent(params.name);
    const { newName } = await request.json();
    
    if (!newName || typeof newName !== 'string') {
      return Response.json(
        { error: '新标签名称不能为空' },
        { status: 400 }
      );
    }
    
    const posts = await getPosts();
    
    // 查找包含该标签的所有文章
    const affectedPosts = posts.filter(post => 
      post.tags.includes(oldName)
    );
    
    if (affectedPosts.length === 0) {
      return Response.json(
        { error: `标签 "${oldName}" 不存在或未被任何文章使用` },
        { status: 404 }
      );
    }
    
    // 更新每篇文章的标签
    let updatedCount = 0;
    const updatePromises = affectedPosts.map(async post => {
      try {
        // 替换标签名称
        const updatedTags = post.tags.map(tag => 
          tag === oldName ? newName : tag
        );
        
        // 创建更新后的文章对象
        const updatedPost = {
          ...post,
          tags: updatedTags
        };
        
        // 更新文章
        await updatePost(updatedPost);
        updatedCount++;
        return true;
      } catch (error) {
        console.error(`更新文章 ${post.slug} 的标签失败:`, error);
        return false;
      }
    });
    
    // 等待所有更新完成
    await Promise.allSettled(updatePromises);
    
    return Response.json({
      success: true,
      oldName,
      newName,
      totalAffected: affectedPosts.length,
      updatedCount
    });
  } catch (error) {
    console.error(`重命名标签 ${params.name} 失败:`, error);
    return Response.json(
      { error: '重命名标签失败' },
      { status: 500 }
    );
  }
}

// 删除标签
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const tagName = decodeURIComponent(params.name);
    const posts = await getPosts();
    
    // 查找包含该标签的所有文章
    const affectedPosts = posts.filter(post => 
      post.tags.includes(tagName)
    );
    
    // 如果有文章使用此标签，则不允许删除
    if (affectedPosts.length > 0) {
      return Response.json(
        { 
          error: `无法删除标签 "${tagName}"，仍有 ${affectedPosts.length} 篇文章使用此标签`,
          affectedCount: affectedPosts.length 
        },
        { status: 400 }
      );
    }
    
    // 如果没有文章使用此标签，返回成功
    return Response.json({
      success: true,
      message: `标签 "${tagName}" 已成功删除`
    });
  } catch (error) {
    console.error(`删除标签 ${params.name} 失败:`, error);
    return Response.json(
      { error: '删除标签失败' },
      { status: 500 }
    );
  }
} 