import { Post } from '@/types/post';
import { getAllFallbackPosts } from '@/lib/fallback-data';
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import { query, queryOne, execute } from '@/lib/db/database';
import limax from 'limax';

/**
 * Slug管理器 - 支持Turso数据库和备用数据
 * 
 * 优先尝试使用Turso数据库，失败时回退到备用数据
 */

// 检测slug是否包含中文
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

// 检测slug是否包含随机ID后缀
export function hasRandomSuffix(slug: string): boolean {
  return /[-_][a-z0-9]{4,8}(?:-[a-z0-9]{4,8})*$/.test(slug);
}

// 生成优化的拼音slug
export function generatePinyinSlug(title: string): string {
  return limax(title, { tone: false, separator: '-' });
}

// 确保slug的唯一性 (优先使用数据库，失败时使用备用数据)
export async function ensureUniqueSlug(slug: string, postId?: string): Promise<string> {
  try {
    if (isTursoEnabled()) {
      console.log(`[Turso] 确保slug唯一: ${slug}`);
      
      let uniqueSlug = slug;
      let counter = 1;
      
      while (true) {
        // 检查是否存在相同的slug
        const params = [uniqueSlug];
        let sql = `SELECT COUNT(*) as count FROM posts WHERE slug = ?`;
        
        // 如果提供了postId，排除当前文章
        if (postId) {
          sql += ` AND id != ?`;
          params.push(postId);
        }
        
        const result = await queryOne(sql, params);
        const count = result ? result.count : 0;
        
        // 如果没有找到相同的slug，可以使用当前slug
        if (count === 0) {
          return uniqueSlug;
        }
        
        // 添加数字后缀
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
    }
    
    // 如果Turso未启用或查询失败，使用备用数据
    console.log(`[文章管理] 从Turso确保slug唯一失败，使用备用数据: ${slug}`);
    const posts = getAllFallbackPosts();
    let uniqueSlug = slug;
    let counter = 1;
    
    while (true) {
      const existingPost = posts.find(p => p.slug === uniqueSlug && p.id?.toString() !== postId);
      if (!existingPost) break;
      
      // 如果已存在，添加数字后缀
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    return uniqueSlug;
  } catch (error) {
    console.error(`[文章管理] 确保slug唯一失败:`, error);
    
    // 失败时使用备用数据
    const posts = getAllFallbackPosts();
    let uniqueSlug = slug;
    let counter = 1;
    
    while (true) {
      const existingPost = posts.find(p => p.slug === uniqueSlug && p.id?.toString() !== postId);
      if (!existingPost) break;
      
      // 如果已存在，添加数字后缀
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    return uniqueSlug;
  }
}

// 修复随机后缀的slug (Vercel环境中禁用)
export async function fixRandomSuffixSlugs(): Promise<{
  processed: number;
  fixed: number;
  errors: string[];
}> {
  console.log('[Vercel环境] 修复随机后缀的slug功能被禁用');
  return {
    processed: 0,
    fixed: 0,
    errors: []
  };
}

// 将中文slug转换为拼音 (Vercel环境中禁用)
export async function convertChineseSlugs(): Promise<{
  processed: number;
  converted: number;
  errors: string[];
}> {
  console.log('[Vercel环境] 将中文slug转换为拼音功能被禁用');
  return {
    processed: 0,
    converted: 0,
    errors: []
  };
}

// 分析slug状态 (优先使用数据库，失败时使用备用数据)
export async function analyzeSlugs(): Promise<{
  total: number;
  chineseCount: number;
  randomSuffixCount: number;
  cleanCount: number;
  chineseSlugs: Array<{slug: string, title: string}>;
  randomSuffixSlugs: Array<{slug: string, title: string}>;
}> {
  try {
    if (isTursoEnabled()) {
      console.log(`[Turso] 尝试分析slug状态`);
      
      // 从数据库获取所有文章的slug和title
      const sql = `SELECT slug, title FROM posts`;
      const dbSlugs = await query(sql);
      
      if (dbSlugs && dbSlugs.length > 0) {
        console.log(`[Turso] 从数据库获取到 ${dbSlugs.length} 个slug`);
        
        const chineseSlugs: Array<{slug: string, title: string}> = [];
        const randomSuffixSlugs: Array<{slug: string, title: string}> = [];
        
        // 分析每个slug
        for (const item of dbSlugs) {
          if (containsChinese(item.slug)) {
            chineseSlugs.push({
              slug: item.slug,
              title: item.title
            });
          }
          
          if (hasRandomSuffix(item.slug)) {
            randomSuffixSlugs.push({
              slug: item.slug,
              title: item.title
            });
          }
        }
        
        // 计算统计结果
        return {
          total: dbSlugs.length,
          chineseCount: chineseSlugs.length,
          randomSuffixCount: randomSuffixSlugs.length,
          cleanCount: dbSlugs.length - chineseSlugs.length - randomSuffixSlugs.length,
          chineseSlugs,
          randomSuffixSlugs
        };
      }
    }
    
    // 如果Turso未启用或查询失败，使用备用数据
    console.log('[文章管理] 从Turso分析slug状态失败，使用备用数据');
    const posts = getAllFallbackPosts();
    
    const chineseSlugs: Array<{slug: string, title: string}> = [];
    const randomSuffixSlugs: Array<{slug: string, title: string}> = [];
    
    // 分析每篇文章的slug
    for (const post of posts) {
      if (containsChinese(post.slug)) {
        chineseSlugs.push({
          slug: post.slug,
          title: post.title
        });
      }
      
      if (hasRandomSuffix(post.slug)) {
        randomSuffixSlugs.push({
          slug: post.slug,
          title: post.title
        });
      }
    }
    
    // 计算统计结果
    return {
      total: posts.length,
      chineseCount: chineseSlugs.length,
      randomSuffixCount: randomSuffixSlugs.length,
      cleanCount: posts.length - chineseSlugs.length - randomSuffixSlugs.length,
      chineseSlugs,
      randomSuffixSlugs
    };
  } catch (error) {
    console.error('[文章管理] 分析slug状态失败:', error);
    
    // 失败时使用备用数据
    const posts = getAllFallbackPosts();
    
    const chineseSlugs: Array<{slug: string, title: string}> = [];
    const randomSuffixSlugs: Array<{slug: string, title: string}> = [];
    
    // 分析每篇文章的slug
    for (const post of posts) {
      if (containsChinese(post.slug)) {
        chineseSlugs.push({
          slug: post.slug,
          title: post.title
        });
      }
      
      if (hasRandomSuffix(post.slug)) {
        randomSuffixSlugs.push({
          slug: post.slug,
          title: post.title
        });
      }
    }
    
    // 计算统计结果
    return {
      total: posts.length,
      chineseCount: chineseSlugs.length,
      randomSuffixCount: randomSuffixSlugs.length,
      cleanCount: posts.length - chineseSlugs.length - randomSuffixSlugs.length,
      chineseSlugs,
      randomSuffixSlugs
    };
  }
}

// 优化所有slug (Vercel环境中禁用)
export async function optimizeAllSlugs(): Promise<{
  total: number;
  randomSuffixFixed: number;
  chineseConverted: number;
  errors: string[];
}> {
  console.log('[Vercel环境] 优化所有slug功能被禁用');
  return {
    total: 0,
    randomSuffixFixed: 0,
    chineseConverted: 0,
    errors: []
  };
} 