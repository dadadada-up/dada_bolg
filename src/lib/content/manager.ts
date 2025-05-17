import { Post } from '@/types/post';
import { fallbackPosts, getAllFallbackPosts, getFallbackPostBySlug } from '@/lib/fallback-data';

/**
 * 内容管理器 - 在Vercel环境中的简化版本
 * 
 * 使用备用数据而不是数据库连接
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
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  
  // 计算Jaccard相似度
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);
  
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
  // 简化的slugify函数
  return post.title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
    .replace(/[\s\u4e00-\u9fa5]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Vercel环境中使用备用数据实现
export async function getAllPosts({
  includeUnpublished = false,
  limit = 100
} = {}): Promise<{
  posts: Post[];
  total: number;
}> {
  const posts = getAllFallbackPosts();
  const filteredPosts = includeUnpublished 
    ? posts 
    : posts.filter(post => post.is_published);
  
  const limitedPosts = filteredPosts.slice(0, limit);
  
  return {
    posts: limitedPosts,
    total: filteredPosts.length
  };
}

export async function getPostBySlug(
  slug: string
): Promise<Post | null> {
  const post = getFallbackPostBySlug(slug);
  return post || null;
}

export async function deletePost(
  slug: string
): Promise<boolean> {
  console.log(`[Vercel环境] 删除文章功能被禁用: ${slug}`);
  return false;
}

// 清理孤立的slug映射
export async function cleanOrphanedSlugMappings(): Promise<number> {
  console.log('[Vercel环境] 清理孤立引用功能被禁用');
  return 0;
}

// 分析并查找所有重复文章组
export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  console.log('[Vercel环境] 查找重复文章功能被禁用');
  return [];
}

// 处理重复文章，保留最佳版本并删除其他
export async function processDuplicateGroups(): Promise<{
  keptCount: number;
  deletedCount: number;
  slugsFixed: number;
  errors: string[];
}> {
  console.log('[Vercel环境] 处理重复文章功能被禁用');
  return {
    keptCount: 0,
    deletedCount: 0,
    slugsFixed: 0,
    errors: []
  };
}

// 删除特定文章
export async function removeSpecificArticles(slugs: string[]): Promise<{
  attempted: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  console.log('[Vercel环境] 删除特定文章功能被禁用');
  return {
    attempted: 0,
    successful: 0,
    failed: 0,
    errors: []
  };
}

// 数据库清理
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
  console.log('[Vercel环境] 数据库清理功能被禁用');
  return {
    duplicateGroups: [],
    orphanedMappings: 0,
    processingResults: {
      keptCount: 0,
      deletedCount: 0,
      slugsFixed: 0,
      errors: []
    }
  };
}

// 处理所有内容
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
  console.log('[Vercel环境] 内容处理功能被禁用');
  return {
    duplicateGroups: 0,
    processedResults: {
      keptCount: 0,
      deletedCount: 0,
      slugsFixed: 0,
      errors: []
    },
    orphanedMappings: 0
  };
}

// 清除GitHub缓存 (空实现)
export async function clearAllGithubCache(): Promise<void> {
  console.log('[Vercel环境] 清除GitHub缓存功能被禁用');
} 