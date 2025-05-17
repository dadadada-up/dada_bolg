import { getDb } from './db';
import { getAllPosts } from './db-posts';
import { enhancedSlugify } from './utils';
import limax from 'limax';

/**
 * Slug管理器 - 整合多个Slug清理和优化功能
 * 
 * 整合功能:
 * - 修复随机ID后缀的slug (来自fix-slugs)
 * - 将中文slug转换为拼音 (来自clean-slugs.js)
 * - 优化slug格式，提高可读性
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

// 确保slug的唯一性
export async function ensureUniqueSlug(slug: string, postId?: string): Promise<string> {
  const db = await getDb();
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    let query = 'SELECT id FROM posts WHERE slug = ?';
    let params: any[] = [uniqueSlug];
    
    if (postId) {
      query += ' AND id != ?';
      params.push(postId);
    }
    
    const existingPost = await db.get(query, params);
    if (!existingPost) break;
    
    // 如果已存在，添加数字后缀
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

// 修复随机后缀的slug
export async function fixRandomSuffixSlugs(): Promise<{
  processed: number;
  fixed: number;
  errors: string[];
}> {
  const db = await getDb();
  const results = {
    processed: 0,
    fixed: 0,
    errors: [] as string[]
  };
  
  // 获取所有文章
  const { posts } = await getAllPosts({includeUnpublished: true, limit: 1000});
  results.processed = posts.length;
  
  console.log(`[Slug管理] 开始处理 ${posts.length} 篇文章的随机后缀...`);
  
  // 开始事务
  await db.exec('BEGIN TRANSACTION');
  
  try {
    for (const post of posts) {
      // 检查slug是否包含随机ID
      if (hasRandomSuffix(post.slug)) {
        // 从标题生成规范化的slug
        let newSlug = enhancedSlugify(post.title, { maxLength: 80 });
        
        console.log(`[Slug管理] 文章: "${post.title}"`);
        console.log(`[Slug管理] 旧slug: ${post.slug}`);
        console.log(`[Slug管理] 新slug: ${newSlug}`);
        
        // 确保新slug的唯一性
        newSlug = await ensureUniqueSlug(newSlug, post.id?.toString());
        
        // 获取文章ID
        let postId: string;
        if (post.id) {
          postId = post.id.toString();
        } else {
          const postIdQuery = await db.get('SELECT post_id FROM slug_mapping WHERE slug = ? AND is_primary = 1', [post.slug]) as { post_id: string } | undefined;
          
          if (!postIdQuery) {
            console.log(`[Slug管理] 未找到slug的主键映射: ${post.slug}`);
            results.errors.push(`未找到Slug映射: ${post.slug}`);
            continue;
          }
          
          postId = postIdQuery.post_id;
        }
        
        // 更新posts表中的slug
        await db.run('UPDATE posts SET slug = ? WHERE id = ?', [newSlug, postId]);
        
        // 更新主slug映射
        await db.run('UPDATE slug_mapping SET slug = ?, is_primary = 1 WHERE post_id = ? AND is_primary = 1', [newSlug, postId]);
        
        // 添加旧slug作为映射（防止链接失效）
        try {
          await db.run('INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 0)', [post.slug, postId, 0]);
        } catch (e) {
          // 可能已存在，忽略错误
        }
        
        results.fixed++;
      }
    }
    
    await db.exec('COMMIT');
    console.log(`[Slug管理] 成功修复 ${results.fixed} 篇文章的随机后缀`);
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('[Slug管理] 事务失败，已回滚:', error);
    throw error;
  }
  
  return results;
}

// 将中文slug转换为拼音
export async function convertChineseSlugs(): Promise<{
  processed: number;
  converted: number;
  errors: string[];
}> {
  const db = await getDb();
  const results = {
    processed: 0,
    converted: 0,
    errors: [] as string[]
  };
  
  // 获取所有文章
  const { posts } = await getAllPosts({includeUnpublished: true, limit: 1000});
  results.processed = posts.length;
  
  console.log(`[Slug管理] 开始处理 ${posts.length} 篇文章的中文slug...`);
  
  // 开始事务
  await db.exec('BEGIN TRANSACTION');
  
  try {
    for (const post of posts) {
      // 如果slug包含中文，则重新生成
      if (containsChinese(post.slug)) {
        // 从标题生成拼音slug
        let newSlug = generatePinyinSlug(post.title);
        
        console.log(`[Slug管理] 文章: "${post.title}"`);
        console.log(`[Slug管理] 旧slug(中文): ${post.slug}`);
        console.log(`[Slug管理] 新slug(拼音): ${newSlug}`);
        
        // 确保新slug的唯一性
        newSlug = await ensureUniqueSlug(newSlug, post.id?.toString());
        
        // 获取文章ID
        let postId: string;
        if (post.id) {
          postId = post.id.toString();
        } else {
          const postIdQuery = await db.get('SELECT post_id FROM slug_mapping WHERE slug = ? AND is_primary = 1', [post.slug]) as { post_id: string } | undefined;
          
          if (!postIdQuery) {
            console.log(`[Slug管理] 未找到slug的主键映射: ${post.slug}`);
            results.errors.push(`未找到Slug映射: ${post.slug}`);
            continue;
          }
          
          postId = postIdQuery.post_id;
        }
        
        // 更新posts表中的slug
        await db.run('UPDATE posts SET slug = ? WHERE id = ?', [newSlug, postId]);
        
        // 更新主slug映射
        await db.run('UPDATE slug_mapping SET slug = ?, is_primary = 1 WHERE post_id = ? AND is_primary = 1', [newSlug, postId]);
        
        // 添加旧slug作为映射（防止链接失效）
        try {
          await db.run('INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 0)', [post.slug, postId, 0]);
        } catch (e) {
          // 可能已存在，忽略错误
        }
        
        results.converted++;
      }
    }
    
    await db.exec('COMMIT');
    console.log(`[Slug管理] 成功转换 ${results.converted} 篇文章的中文slug`);
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('[Slug管理] 事务失败，已回滚:', error);
    throw error;
  }
  
  return results;
}

// 分析slug状态
export async function analyzeSlugs(): Promise<{
  total: number;
  chineseCount: number;
  randomSuffixCount: number;
  cleanCount: number;
  chineseSlugs: Array<{slug: string, title: string}>;
  randomSuffixSlugs: Array<{slug: string, title: string}>;
}> {
  // 获取所有文章
  const { posts } = await getAllPosts({includeUnpublished: true, limit: 1000});
  
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

// 执行全面的slug优化
export async function optimizeAllSlugs(): Promise<{
  total: number;
  randomSuffixFixed: number;
  chineseConverted: number;
  errors: string[];
}> {
  // 处理随机后缀
  const randomSuffixResults = await fixRandomSuffixSlugs();
  
  // 处理中文slug
  const chineseResults = await convertChineseSlugs();
  
  // 汇总结果
  return {
    total: randomSuffixResults.processed, // 总文章数应相同
    randomSuffixFixed: randomSuffixResults.fixed,
    chineseConverted: chineseResults.converted,
    errors: [...randomSuffixResults.errors, ...chineseResults.errors]
  };
} 