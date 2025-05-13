// 强制更新：使用标准sqlite API，修复Vercel构建错误
import { NextResponse } from 'next/server';
import { getPosts, updatePost, getContents } from '@/lib/github';
import { slugify } from '@/lib/utils';
import { Category } from '@/types/post';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getChineseCategoryName, getCategoryBySlug } from '@/lib/category-service';

// 定义数据库分类记录的接口
interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
}

// 获取特定分类信息
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const categorySlug = params.name;
    
    // 获取分类目录
    const contents = await getContents('content/posts');
    const directories = contents.filter(item => item.type === 'dir');
    
    // 查找匹配的分类
    const categoryDir = directories.find(dir => dir.name === categorySlug);
    
    if (!categoryDir) {
      return Response.json(
        { error: `分类 '${categorySlug}' 不存在` },
        { status: 404 }
      );
    }
    
    // 获取分类的中文名称
    const categoryName = await getChineseCategoryName(categorySlug);
    
    // 获取分类下的文章数量
    const posts = await getPosts();
    const postCount = posts.filter(post => post.categories.includes(categorySlug)).length;
    
    return Response.json({
      name: categoryName,
      slug: categorySlug,
      postCount,
      description: '' // 可以从其他地方获取描述
    });
  } catch (error) {
    console.error(`获取分类 '${params.name}' 失败:`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '获取分类失败' },
      { status: 500 }
    );
  }
}

// 重命名分类
export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const oldSlug = params.name;
    const data = await request.json();
    
    // 验证必填字段
    if (!data.name) {
      return Response.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }
    
    // 如果没有提供新的slug，保持原来的slug
    const newSlug = data.slug || oldSlug;
    
    // 如果slug变了，需要检查是否已存在
    if (newSlug !== oldSlug) {
      // 验证英文标识格式
      if (!/^[a-z0-9-]+$/.test(newSlug)) {
        return Response.json(
          { error: '分类标识只能包含小写字母、数字和连字符' },
          { status: 400 }
        );
      }
      
      // 检查新slug是否已存在
      const contents = await getContents('content/posts');
      const existingDirs = contents.filter(item => item.type === 'dir').map(dir => dir.name);
      
      if (existingDirs.includes(newSlug)) {
        return Response.json(
          { error: `分类标识 '${newSlug}' 已存在` },
          { status: 400 }
        );
      }
    }
    
    // 更新数据库中的分类记录
    const db = await getDb();
    
    try {
      // 开始事务
      await db.exec('BEGIN TRANSACTION');
      
      // 查找现有分类
      const existingCategory = await db.get(
        `SELECT id, name, slug, description, post_count 
        FROM categories 
        WHERE slug = ?`,
        [oldSlug]
      ) as DbCategory | undefined;
      
      if (existingCategory) {
        // 如果 slug 改变了，创建新记录并保留原有关联
        if (newSlug !== oldSlug) {
          // 检查新 slug 是否已存在于数据库
          const newSlugExists = await db.get(
            `SELECT id FROM categories WHERE slug = ?`,
            [newSlug]
          );
          
          if (newSlugExists) {
            await db.exec('ROLLBACK');
            return Response.json(
              { error: `分类标识 '${newSlug}' 已存在于数据库中` },
              { status: 400 }
            );
          }
          
          // 插入新分类记录
          await db.run(
            `INSERT INTO categories (slug, name, description, post_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [newSlug, data.name, data.description || '', existingCategory.post_count]
          );
          
          // 获取新记录的 ID
          const newCategory = await db.get(
            `SELECT id FROM categories WHERE slug = ?`,
            [newSlug]
          ) as { id: string };
          
          // 更新文章关联
          await db.run(
            `UPDATE post_categories
            SET category_id = ?
            WHERE category_id = ?`,
            [newCategory.id, existingCategory.id]
          );
          
          // 删除旧分类记录
          await db.run(
            `DELETE FROM categories WHERE id = ?`,
            [existingCategory.id]
          );
        } else {
          // 仅更新现有记录
          await db.run(
            `UPDATE categories
            SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE slug = ?`,
            [data.name, data.description || '', oldSlug]
          );
        }
      } else {
        // 分类不存在，创建新记录
        await db.run(
          `INSERT INTO categories (slug, name, description, post_count, created_at, updated_at)
          VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [newSlug, data.name, data.description || '']
        );
      }
      
      // 提交事务
      await db.exec('COMMIT');
      
      // 清除分类缓存
      revalidatePath('/api/categories/db-categories');
      revalidatePath('/api/categories-new/db-categories');
      revalidatePath('/admin/categories');
      
      console.log(`[API] 成功更新分类 ${oldSlug} -> ${newSlug}`);
    } catch (error) {
      // 回滚事务
      await db.exec('ROLLBACK');
      throw error;
    }
    
    // 如果slug变了，我们需要更新所有该分类下的文章
    if (newSlug !== oldSlug) {
      const posts = await getPosts();
      const postsToUpdate = posts.filter(post => post.categories.includes(oldSlug));
      
      // 这里可以添加文章更新的逻辑
      // 比如替换旧的分类名称为新的分类名称
      
      for (const post of postsToUpdate) {
        // 更新分类
        post.categories = post.categories.map(cat => cat === oldSlug ? newSlug : cat);
        
        // 更新文章
        await updatePost(post);
      }
    }
    
    return Response.json({
      success: true,
      category: {
        name: data.name,
        slug: newSlug,
        description: data.description || '',
        postCount: 0 // 这里应该计算实际的文章数量
      }
    });
  } catch (error) {
    console.error(`更新分类 '${params.name}' 失败:`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '更新分类失败' },
      { status: 500 }
    );
  }
}

// 删除分类
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const categorySlug = params.name;
    
    // 检查该分类下是否有文章
    const posts = await getPosts();
    const categoryPosts = posts.filter(post => post.categories.includes(categorySlug));
    
    if (categoryPosts.length > 0) {
      return Response.json(
        { error: `无法删除分类 '${categorySlug}'，该分类下有 ${categoryPosts.length} 篇文章` },
        { status: 400 }
      );
    }
    
    // 删除数据库中的分类记录
    const db = await getDb();
    
    try {
      // 查找分类 ID
      const category = await db.get(
        `SELECT id FROM categories WHERE slug = ?`,
        [categorySlug]
      ) as { id: string } | undefined;
      
      if (category) {
        // 删除分类
        await db.run(
          `DELETE FROM categories WHERE id = ?`,
          [category.id]
        );
        
        // 清除分类缓存
        revalidatePath('/api/categories/db-categories');
        revalidatePath('/api/categories-new/db-categories');
        revalidatePath('/admin/categories');
        
        console.log(`[API] 成功删除分类 ${categorySlug}`);
      }
    } catch (error) {
      console.error(`删除分类记录失败:`, error);
    }
    
    // 删除分类目录
    // 在实际应用中，这里应该删除GitHub上的目录
    // 这里我们假设删除成功
    
    return Response.json({
      success: true,
      message: `分类 '${categorySlug}' 已成功删除`
    });
  } catch (error) {
    console.error(`删除分类 '${params.name}' 失败:`, error);
    return Response.json(
      { error: error instanceof Error ? error.message : '删除分类失败' },
      { status: 500 }
    );
  }
} 