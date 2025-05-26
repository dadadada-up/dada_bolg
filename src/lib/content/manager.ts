import { Post } from '@/types/post';
import { fallbackPosts, getAllFallbackPosts, getFallbackPostBySlug } from '@/lib/fallback-data';
import { isTursoEnabled } from '@/lib/db/turso-client';
import { query, queryOne, execute } from '@/lib/db/database';

/**
 * 内容管理器 - 支持Turso数据库和备用数据
 * 
 * 优先尝试使用Turso数据库，失败时回退到备用数据
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

// 获取所有文章 - 优先使用数据库，失败时使用备用数据
export async function getAllPosts({
  includeUnpublished = false,
  limit = 100
} = {}): Promise<{
  posts: Post[];
  total: number;
}> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log('[Turso] 尝试从Turso数据库获取文章');
      
      // 从数据库获取文章
      const sql = `
        SELECT 
          p.id, p.slug, p.title, p.content, p.excerpt, p.description,
          p.is_published, p.is_featured, 
          p.image_url as imageUrl, p.reading_time,
          p.created_at, p.updated_at,
          COALESCE(
            (SELECT json_group_array(c.name) FROM post_categories pc 
             JOIN categories c ON pc.category_id = c.id 
             WHERE pc.post_id = p.id),
            '[]'
          ) as categories_json,
          COALESCE(
            (SELECT json_group_array(t.name) FROM post_tags pt 
             JOIN tags t ON pt.tag_id = t.id 
             WHERE pt.post_id = p.id),
            '[]'
          ) as tags_json,
          substr(p.created_at, 1, 10) as date
        FROM posts p
        WHERE ${includeUnpublished ? '1=1' : 'p.is_published = 1'}
        ORDER BY p.created_at DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;
      
      const dbPosts = await query(sql);
      
      if (dbPosts && dbPosts.length > 0) {
        console.log(`[Turso] 从数据库成功获取 ${dbPosts.length} 篇文章`);
        
        // 处理数据库结果
        const posts = dbPosts.map((post: any) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || post.description,
          description: post.description,
          is_published: !!post.is_published,
          is_featured: !!post.is_featured,
          imageUrl: post.imageUrl,
          date: post.date,
          created_at: post.created_at,
          updated_at: post.updated_at,
          categories: JSON.parse(post.categories_json || '[]'),
          tags: JSON.parse(post.tags_json || '[]')
        }));
        
        return {
          posts,
          total: posts.length
        };
      }
    }
    
    // 如果Turso未启用或查询失败，使用备用数据
    console.log('[文章管理] 从Turso获取文章失败，使用备用数据');
    const posts = getAllFallbackPosts();
    const filteredPosts = includeUnpublished 
      ? posts 
      : posts.filter(post => post.is_published);
    
    const limitedPosts = filteredPosts.slice(0, limit);
    
    return {
      posts: limitedPosts,
      total: filteredPosts.length
    };
  } catch (error) {
    console.error('[文章管理] 获取文章失败:', error);
    
    // 失败时使用备用数据
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
}

// 根据slug获取单篇文章 - 优先使用数据库，失败时使用备用数据
export async function getPostBySlug(
  slug: string
): Promise<Post | null> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log(`[Turso] 尝试从Turso数据库获取文章: ${slug}`);
      
      // 首先查询slug_mapping表，获取post_id
      const slugMapping = await queryOne(`
        SELECT post_id FROM slug_mapping 
        WHERE slug = ? 
        ORDER BY is_primary DESC 
        LIMIT 1
      `, [slug]);
      
      let postId: number | null = null;
      
      if (slugMapping && slugMapping.post_id) {
        postId = slugMapping.post_id;
        console.log(`[Turso] 找到slug映射: ${slug} -> post_id: ${postId}`);
      } else {
        // 如果在映射表中找不到，直接在posts表中查找
        const postIdQuery = await queryOne(`
          SELECT id FROM posts WHERE slug = ? LIMIT 1
        `, [slug]);
        
        if (postIdQuery && postIdQuery.id) {
          postId = postIdQuery.id;
          console.log(`[Turso] 在posts表中直接找到文章: ${slug}, id: ${postId}`);
        }
      }
      
      // 如果找到了post_id，获取完整文章信息
      if (postId) {
        const postSql = `
          SELECT 
            p.id, p.slug, p.title, p.content, p.excerpt, p.description,
            p.is_published, p.is_featured, 
            p.image_url as imageUrl, p.reading_time,
            p.created_at, p.updated_at,
            COALESCE(
              (SELECT json_group_array(c.name) FROM post_categories pc 
               JOIN categories c ON pc.category_id = c.id 
               WHERE pc.post_id = p.id),
              '[]'
            ) as categories_json,
            COALESCE(
              (SELECT json_group_array(t.name) FROM post_tags pt 
               JOIN tags t ON pt.tag_id = t.id 
               WHERE pt.post_id = p.id),
              '[]'
            ) as tags_json,
            substr(p.created_at, 1, 10) as date
          FROM posts p
          WHERE p.id = ?
        `;
        
        const dbPost = await queryOne(postSql, [postId]);
        
        if (dbPost) {
          console.log(`[Turso] 成功获取文章: ${dbPost.title}`);
          
          return {
            id: dbPost.id,
            slug: dbPost.slug,
            title: dbPost.title,
            content: dbPost.content,
            excerpt: dbPost.excerpt || dbPost.description,
            description: dbPost.description,
            is_published: !!dbPost.is_published,
            is_featured: !!dbPost.is_featured,
            imageUrl: dbPost.imageUrl,
            date: dbPost.date,
            created_at: dbPost.created_at,
            updated_at: dbPost.updated_at,
            categories: JSON.parse(dbPost.categories_json || '[]'),
            tags: JSON.parse(dbPost.tags_json || '[]')
          };
        }
      }
    }
    
    // 如果Turso未启用或查询失败，使用备用数据
    console.log(`[文章管理] 从Turso获取文章${slug}失败，使用备用数据`);
    return getFallbackPostBySlug(slug) || null;
  } catch (error) {
    console.error(`[文章管理] 获取文章${slug}失败:`, error);
    
    // 失败时使用备用数据
    return getFallbackPostBySlug(slug) || null;
  }
}

// 删除文章 (Vercel环境中禁用)
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