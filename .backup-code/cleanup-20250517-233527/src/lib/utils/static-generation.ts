/**
 * 静态生成工具函数
 * 这个文件包含在Next.js静态生成时使用的工具函数，确保不依赖任何API调用
 */

import { categoryRepository, tagRepository, postRepository } from '@/lib/db/repositories';
import { Category, Post, Tag } from '@/types/post';
import { isVercelBuild } from '@/lib/utils/env';

/**
 * 安全的获取所有分类的静态参数
 * 这个函数用于generateStaticParams，它不会使用fetch
 */
export async function getCategoryParams(): Promise<{ slug: string }[]> {
  // 在Vercel构建时返回空数组
  if (isVercelBuild) {
    console.log('[静态生成] Vercel构建时，返回空分类参数');
    return [];
  }

  try {
    // 直接使用分类仓库获取所有分类
    const categories = await categoryRepository.getAllCategories();
    
    // 确保我们返回有效的结果，即使出现错误
    if (!categories || !Array.isArray(categories)) {
      console.error('获取分类参数失败: 分类不是数组');
      return [];
    }
    
    return categories.map((category) => ({
      slug: category.slug || '',
    }));
  } catch (error) {
    console.error('获取分类参数失败:', error);
    // 始终返回一个空数组以防止构建失败
    return [];
  }
}

/**
 * 安全的获取所有标签的静态参数
 * 这个函数用于generateStaticParams，它不会使用fetch
 */
export async function getTagParams(): Promise<{ slug: string }[]> {
  // 在Vercel构建时返回空数组
  if (isVercelBuild) {
    console.log('[静态生成] Vercel构建时，返回空标签参数');
    return [];
  }

  try {
    // 直接使用标签仓库获取所有标签
    const tags = await tagRepository.getAllTags();
    
    // 确保我们返回有效的结果，即使出现错误
    if (!tags || !Array.isArray(tags)) {
      console.error('获取标签参数失败: 标签不是数组');
      return [];
    }
    
    return tags.map((tag) => ({
      slug: tag.slug || '',
    }));
  } catch (error) {
    console.error('获取标签参数失败:', error);
    // 始终返回一个空数组以防止构建失败
    return [];
  }
}

/**
 * 安全的获取分类信息
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  // 在Vercel构建时返回null
  if (isVercelBuild) {
    console.log(`[静态生成] Vercel构建时，跳过获取分类: ${slug}`);
    return null;
  }

  try {
    return await categoryRepository.getCategoryBySlug(slug);
  } catch (error) {
    console.error(`获取分类信息失败 (${slug}):`, error);
    return null;
  }
}

/**
 * 安全的获取标签信息
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  // 在Vercel构建时返回null
  if (isVercelBuild) {
    console.log(`[静态生成] Vercel构建时，跳过获取标签: ${slug}`);
    return null;
  }

  try {
    return await tagRepository.getTagBySlug(slug);
  } catch (error) {
    console.error(`获取标签信息失败 (${slug}):`, error);
    return null;
  }
}

/**
 * 安全的获取分类下的文章
 */
export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  // 在Vercel构建时返回空数组
  if (isVercelBuild) {
    console.log(`[静态生成] Vercel构建时，跳过获取分类文章: ${categorySlug}`);
    return [];
  }

  try {
    const { posts } = await postRepository.getAllPosts({
      category: categorySlug,
      limit: 1000,
      published: true,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    return posts;
  } catch (error) {
    console.error(`获取分类文章失败 (${categorySlug}):`, error);
    return [];
  }
}

/**
 * 安全的获取标签下的文章
 */
export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  // 在Vercel构建时返回空数组
  if (isVercelBuild) {
    console.log(`[静态生成] Vercel构建时，跳过获取标签文章: ${tagSlug}`);
    return [];
  }

  try {
    const { posts } = await postRepository.getAllPosts({
      tag: tagSlug,
      limit: 100,
      published: true,
      sortBy: 'created_at', 
      sortOrder: 'desc'
    });
    return posts;
  } catch (error) {
    console.error(`获取标签文章失败 (${tagSlug}):`, error);
    return [];
  }
}

/**
 * 安全的获取所有分类
 */
export async function getAllCategories(): Promise<Category[]> {
  // 在Vercel构建时返回空数组
  if (isVercelBuild) {
    console.log('[静态生成] Vercel构建时，跳过获取所有分类');
    return [];
  }

  try {
    return await categoryRepository.getAllCategories();
  } catch (error) {
    console.error('获取所有分类失败:', error);
    return [];
  }
}

/**
 * 安全的获取所有标签
 */
export async function getAllTags(): Promise<Tag[]> {
  // 在Vercel构建时返回空数组
  if (isVercelBuild) {
    console.log('[静态生成] Vercel构建时，跳过获取所有标签');
    return [];
  }

  try {
    return await tagRepository.getAllTags();
  } catch (error) {
    console.error('获取所有标签失败:', error);
    return [];
  }
} 