import { getDb } from './db';
import { getAllPosts, getPostBySlug, deletePost } from './db-posts';
import { Post } from '@/types/post';
import { enhancedSlugify } from './utils';
import { clearAllGithubCache } from './fs-cache';
import * as github from './github';

/**
 * 内容管理器 - 整合多个清理和修复功能的统一模块
 * 
 * 整合了以下原有功能:
 * - clean-db: 基础清理功能
 * - clean-duplicates: 特定文章的重复处理
 * - fix-duplicates: 高级重复处理
 * - clean-db-advanced: 高级数据库清理功能
 */

// 文章类型定义
interface DuplicateGroup {
  original: Post;
  duplicates: Post[];
}

// 计算两个文章标题的相似度 (0-1)
export function calculateSimilarity(title1: string, title2: string): number {
  if (!title1 || !title2) return 0;
  
  // 简化标题比较
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 保留中文字符和英文字母数字
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normTitle1 = normalize(title1);
  const normTitle2 = normalize(title2);
  
  // 如果标题完全一样，返回1
  if (normTitle1 === normTitle2) return 1;
  
  // 简单的字符重叠度检查
  const words1 = new Set(normTitle1.split(' '));
  const words2 = new Set(normTitle2.split(' '));
  
  // 计算交集大小
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  
  // 计算Jaccard相似度
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// 判断是否有随机字符串后缀
export function hasRandomSuffix(slug: string): boolean {
  // 检查是否有类似随机数/字母组合的后缀
  return /[-_][a-z0-9]{4,8}(?:-[a-z0-9]{4,8})*$/.test(slug);
}

// 提取文章核心slug
export function extractCoreSlug(slug: string): string {
  // 移除随机后缀，获取slug的核心部分
  return slug.replace(/[-_][a-z0-9]{4,8}(?:-[a-z0-9]{4,8})*$/, '');
}

// 根据各种指标判断是否为重复文章
export function areDuplicateArticles(post1: Post, post2: Post): boolean {
  // 如果标题非常相似 (80%以上)
  const titleSimilarity = calculateSimilarity(post1.title, post2.title);
  if (titleSimilarity > 0.8) return true;
  
  // 提取slug的核心部分，检查是否一致
  const coreSlug1 = extractCoreSlug(post1.slug);
  const coreSlug2 = extractCoreSlug(post2.slug);
  
  if (coreSlug1 && coreSlug2 && coreSlug1 === coreSlug2) return true;
  
  // 内容相似度检查 (可选)
  if (post1.content && post2.content) {
    const contentSimilarity = calculateSimilarity(
      post1.content.substring(0, 200), 
      post2.content.substring(0, 200)
    );
    if (contentSimilarity > 0.9) return true;
  }

  // 特定文章处理 - Notion+Cursor相关
  if ((post1.title.includes('Notion') && post1.title.includes('Cursor')) && 
      (post2.title.includes('Notion') && post2.title.includes('Cursor'))) {
    return true;
  }
  
  // 特定文章处理 - 投资前必知必会相关
  if ((post1.title.includes('投资前必知必会') || post1.title.includes('tou zi qian')) && 
      (post2.title.includes('投资前必知必会') || post2.title.includes('tou zi qian'))) {
    return true;
  }
  
  return false;
}

// 选择重复文章中质量最好的一篇保留
export function selectBestVersion(posts: Post[]): Post {
  // 文章质量评分
  const scorePost = (post: Post): number => {
    let score = 0;
    
    // 1. 更干净的slug (没有随机字符串)得分高
    if (!hasRandomSuffix(post.slug)) score += 10;
    
    // 2. 较短的slug得分高 (通常是人工编辑的slug)
    score += Math.max(0, 30 - post.slug.length);
    
    // 3. 有内容的得分高
    if (post.content) {
      score += Math.min(20, Math.floor(post.content.length / 100));
    }
    
    // 4. 有分类和标签的得分高
    score += (post.categories?.length || 0) * 5;
    score += (post.tags?.length || 0) * 2;
    
    // 5. 最近更新的文章得分高
    if (post.date) {
      try {
        const date = new Date(post.date);
        if (!isNaN(date.getTime())) {
          // 最近30天内更新的文章得分更高
          const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
          score += Math.max(0, 30 - daysAgo);
        }
      } catch (e) {}
    }
    
    // 6. 中文标题优先
    if (/[\u4e00-\u9fa5]/.test(post.title)) {
      score += 15;
    }
    
    return score;
  };
  
  // 对文章按质量评分排序，选择最高分的
  return [...posts].sort((a, b) => scorePost(b) - scorePost(a))[0];
}

// 生成更规范的slug
export function generateCleanSlug(post: Post): string {
  // 从标题生成干净的slug
  return enhancedSlugify(post.title, { maxLength: 80 });
}

// 清理孤立的slug映射
export async function cleanOrphanedSlugMappings(): Promise<number> {
  const db = await getDb();
  const result = await db.run(`
    DELETE FROM slug_mapping 
    WHERE post_id NOT IN (SELECT id FROM posts)
  `);
  
  return result.changes || 0;
}

// 分析并查找所有重复文章组
export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const { posts } = await getAllPosts({includeUnpublished: true, limit: 1000});
  const groups: DuplicateGroup[] = [];
  const processedSlugs = new Set<string>();
  
  for (const post of posts) {
    // 跳过已处理的文章
    if (processedSlugs.has(post.slug)) continue;
    
    const currentGroup: Post[] = [post];
    processedSlugs.add(post.slug);
    
    // 找出与当前文章相似的所有其他文章
    for (const otherPost of posts) {
      if (processedSlugs.has(otherPost.slug)) continue;
      if (areDuplicateArticles(post, otherPost)) {
        currentGroup.push(otherPost);
        processedSlugs.add(otherPost.slug);
      }
    }
    
    // 如果找到多于一篇相似文章，将它们作为一个组
    if (currentGroup.length > 1) {
      const bestPost = selectBestVersion(currentGroup);
      const duplicates = currentGroup.filter(p => p.slug !== bestPost.slug);
      
      groups.push({
        original: bestPost,
        duplicates
      });
    }
  }
  
  return groups;
}

// 处理重复文章，保留最佳版本并删除其他
export async function processDuplicateGroups(groups: DuplicateGroup[]): Promise<{
  keptCount: number;
  deletedCount: number;
  slugsFixed: number;
  errors: string[];
}> {
  const results = {
    keptCount: 0,
    deletedCount: 0,
    slugsFixed: 0,
    errors: [] as string[]
  };
  
  const db = await getDb();

  for (const group of groups) {
    try {
      results.keptCount++;
      
      // 优化保留文章的slug
      let cleanSlug = generateCleanSlug(group.original);
      const originalSlug = group.original.slug;
      
      // 如果当前slug不规范，生成新的
      if (hasRandomSuffix(group.original.slug)) {
        // 检查生成的slug是否已存在
        const slugExists = await db.get('SELECT COUNT(*) as count FROM slug_mapping WHERE slug = ? AND post_id != (SELECT post_id FROM slug_mapping WHERE slug = ? AND is_primary = 1)', [cleanSlug, group.original.slug]) as { count: number };
        
        if (slugExists.count > 0) {
          // 如果存在，添加时间戳使其唯一
          const timestamp = new Date().getTime().toString(36).substring(0, 4);
          cleanSlug = `${cleanSlug}-${timestamp}`;
        }
        
        // 获取文章ID
        const postIdQuery = await db.get('SELECT post_id FROM slug_mapping WHERE slug = ? AND is_primary = 1', [group.original.slug]) as { post_id: string } | undefined;
        
        if (postIdQuery) {
          // 开始事务
          await db.exec('BEGIN TRANSACTION');
          
          try {
            // 更新posts表
            await db.run('UPDATE posts SET slug = ? WHERE id = ?', [cleanSlug, postIdQuery.post_id]);
            
            // 更新主要slug映射
            await db.run('UPDATE slug_mapping SET slug = ? WHERE post_id = ? AND is_primary = 1', [cleanSlug, postIdQuery.post_id]);
            
            // 添加原始slug作为映射，确保旧链接仍然有效
            try {
              await db.run('INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 0)', [group.original.slug, postIdQuery.post_id]);
            } catch (e) {
              // 可能已存在，忽略
            }
            
            await db.exec('COMMIT');
            results.slugsFixed++;
          } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
          }
        }
      }
      
      // 删除重复的文章
      for (const duplicate of group.duplicates) {
        try {
          await deletePost(duplicate.slug);
          results.deletedCount++;
        } catch (error) {
          const errorMsg = `删除重复文章失败: ${duplicate.slug} - ${error instanceof Error ? error.message : '未知错误'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `处理重复文章组失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }
  }

  // 清理孤立的slug映射
  await cleanOrphanedSlugMappings();
  
  return results;
}

// 删除指定的脏数据文章
export async function removeSpecificArticles(slugs: string[]): Promise<{
  attempted: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    attempted: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // 清除GitHub缓存
  try {
    await clearAllGithubCache();
  } catch (error) {
    results.errors.push(`清除GitHub缓存失败: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // 删除指定的文章
  for (const slug of slugs) {
    results.attempted++;
    
    try {
      await deletePost(slug);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`删除文章失败: ${slug} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // 再次清除缓存，确保前端获取不到已删除的文章
  try {
    await clearAllGithubCache();
    await github.forceRefreshAllData();
  } catch (error) {
    results.errors.push(`最终清除缓存失败: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return results;
}

// 执行数据库完整清理和优化
export async function performDatabaseCleanup(): Promise<{
  duplicateGroups: DuplicateGroup[];
  orphanedMappings: number;
  processingResults?: {
    keptCount: number;
    deletedCount: number;
    slugsFixed: number;
    errors: string[];
  };
}> {
  // 1. 查找所有重复文章组
  const duplicateGroups = await findDuplicateGroups();
  
  // 2. 清理孤立的slug映射
  const orphanedMappings = await cleanOrphanedSlugMappings();
  
  return {
    duplicateGroups,
    orphanedMappings
  };
}

// 执行完整的内容处理 (分析+清理)
export async function processAllContent(): Promise<{
  duplicateGroups: number;
  processedResults: {
    keptCount: number;
    deletedCount: number;
    slugsFixed: number;
    errors: string[];
  };
  orphanedMappings: number;
}> {
  // 1. 分析内容
  const { duplicateGroups, orphanedMappings } = await performDatabaseCleanup();
  
  // 2. 处理重复内容
  const processedResults = await processDuplicateGroups(duplicateGroups);
  
  return {
    duplicateGroups: duplicateGroups.length,
    processedResults,
    orphanedMappings
  };
} 