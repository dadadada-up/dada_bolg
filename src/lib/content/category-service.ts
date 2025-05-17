/**
 * 分类服务 - 提供统一的分类操作接口
 * 替代硬编码的categoryMappings，完全依赖数据库
 */

import { cache } from 'react';

// 分类接口定义
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// 缓存常量
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;

/**
 * 获取所有分类
 * 支持客户端和服务端调用，自动处理缓存
 */
export async function getAllCategories(): Promise<Category[]> {
  // 检查缓存是否有效
  const now = Date.now();
  if (categoriesCache && now - categoriesCacheTimestamp < CACHE_TTL) {
    return categoriesCache;
  }

  try {
    // 服务端调用
    if (typeof window === 'undefined') {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/categories-new`, { 
        next: { revalidate: 60 } // 1分钟重新验证
      });
      
      if (!res.ok) {
        throw new Error(`获取分类失败: ${res.status}`);
      }
      
      const data = await res.json();
      categoriesCache = data;
      categoriesCacheTimestamp = now;
      return data;
    } 
    // 客户端调用
    else {
      const res = await fetch('/api/categories-new');
      if (!res.ok) {
        throw new Error(`获取分类失败: ${res.status}`);
      }
      
      const data = await res.json();
      categoriesCache = data;
      categoriesCacheTimestamp = now;
      return data;
    }
  } catch (error) {
    console.error('获取分类失败:', error);
    // 如果有缓存数据，尽管过期也返回
    if (categoriesCache) {
      return categoriesCache;
    }
    return [];
  }
}

/**
 * 根据英文slug获取中文分类名
 */
export async function getChineseCategoryName(englishSlug: string): Promise<string> {
  const categories = await getAllCategories();
  const category = categories.find(c => c.slug === englishSlug);
  return category?.name || englishSlug;
}

/**
 * 根据中文名称获取分类slug
 */
export async function getEnglishCategorySlug(chineseName: string): Promise<string> {
  const categories = await getAllCategories();
  const category = categories.find(c => c.name === chineseName);
  return category?.slug || chineseName;
}

/**
 * 创建新分类
 */
export async function createCategory(name: string, slug: string, description: string = ''): Promise<Category | null> {
  try {
    const res = await fetch('/api/categories-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, slug, description }),
    });

    if (!res.ok) {
      throw new Error(`创建分类失败: ${res.status}`);
    }

    const data = await res.json();
    
    // 更新缓存
    if (categoriesCache) {
      categoriesCache.push(data);
    }
    
    return data;
  } catch (error) {
    console.error('创建分类失败:', error);
    return null;
  }
}

/**
 * 获取分类映射数组
 */
export async function getAllCategoryMappings(): Promise<Array<{name: string, slug: string}>> {
  const categories = await getAllCategories();
  return categories.map(category => ({
    name: category.name,
    slug: category.slug
  }));
}

/**
 * 获取特定分类
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getAllCategories();
  return categories.find(c => c.slug === slug) || null;
}

/**
 * 处理分类名列表，确保所有分类都存在于数据库
 * 用于文章创建/更新时的分类处理
 */
export async function processCategories(categoryNames: string[]): Promise<string[]> {
  if (!categoryNames || !categoryNames.length) return [];
  
  const categories = await getAllCategories();
  const result: string[] = [];
  
  for (const name of categoryNames) {
    // 检查是否为slug格式
    const isSlug = /^[a-z0-9-]+$/.test(name);
    
    // 如果是slug格式，检查是否存在
    if (isSlug) {
      const exists = categories.some(c => c.slug === name);
      if (exists) {
        result.push(name);
        continue;
      }
    }
    
    // 如果不是slug或slug不存在，检查中文名称
    const categoryByName = categories.find(c => c.name === name);
    if (categoryByName) {
      result.push(categoryByName.slug);
      continue;
    }
    
    // 如果不存在，创建新分类
    const newSlug = isSlug ? name : name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    try {
      const newCategory = await createCategory(name, newSlug);
      if (newCategory) {
        result.push(newCategory.slug);
      }
    } catch (error) {
      console.error(`创建分类失败: ${name}`, error);
    }
  }
  
  return result;
}

// 使用React缓存机制，服务端组件专用
export const getCachedCategories = cache(getAllCategories); 