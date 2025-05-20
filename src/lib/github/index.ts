import { Post } from "@/types/post";
import { fallbackPosts, getAllFallbackPosts, getFallbackPostBySlug } from "@/lib/fallback-data";
import { isTursoEnabled } from '@/lib/db/turso-client-new';
import { query, queryOne, execute } from '@/lib/db/database';

/**
 * GitHub服务 - 支持Turso数据库和备用数据
 * 
 * 优先尝试使用Turso数据库，失败时回退到备用数据
 */

// 获取所有文章 - 优先使用数据库，失败时使用备用数据
export async function getPosts(): Promise<Post[]> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log('[Turso] 尝试从Turso数据库获取文章');
      
      // 从数据库获取文章
      const sql = `
        SELECT 
          p.id, p.slug, p.title, p.content, p.excerpt, p.description,
          p.is_published, p.is_featured, 
          p.cover_image as imageUrl, p.reading_time,
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
        ORDER BY p.created_at DESC
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
        
            return posts;
      }
    }
    
    // 如果Turso未启用或查询失败，使用备用数据
    console.log("[文章管理] 从Turso获取文章失败，使用备用数据");
    return getAllFallbackPosts();
          } catch (error) {
    console.error('[文章管理] 获取文章失败:', error);
    
    // 失败时使用备用数据
    return getAllFallbackPosts();
  }
}

// 根据slug获取单篇文章 - 优先使用数据库，失败时使用备用数据
export async function getPostBySlug(slug: string): Promise<Post | null> {
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
            p.cover_image as imageUrl, p.reading_time,
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

// 获取文件内容 (Vercel环境中禁用)
export async function getFileContent(path: string): Promise<string | null> {
  console.log(`[Vercel环境] 获取文件内容功能被禁用: ${path}`);
    return null;
}

// 更新文章 (Vercel环境中禁用)
export async function updatePost(post: Post): Promise<void> {
  console.log(`[Vercel环境] 更新文章功能被禁用: ${post.slug}`);
}

// 删除文章 (Vercel环境中禁用)
export async function deletePost(post: Post): Promise<void> {
  console.log(`[Vercel环境] 删除文章功能被禁用: ${post.slug}`);
}

// 创建文章 (Vercel环境中禁用)
export async function createPost(post: Post): Promise<any> {
  console.log(`[Vercel环境] 创建文章功能被禁用: ${post.slug}`);
  return { success: false, message: "Vercel环境不支持创建文章" };
}

// 刷新所有数据 (Vercel环境中禁用)
export async function forceRefreshAllData(): Promise<boolean> {
  console.log("[Vercel环境] 刷新所有数据功能被禁用");
      return false;
    }
    
// 清除缓存 (Vercel环境中禁用)
export function clearContentCache(): void {
  console.log("[Vercel环境] 清除缓存功能被禁用");
}

// 获取中文分类名 - 优先使用数据库，失败时使用备用数据
export function getDisplayCategoryName(englishName: string): string {
  // 分类英文名到中文名的映射
  const categoryMap: Record<string, string> = {
    'tech-tools': '技术工具',
    'product-management': '产品经理',
    'open-source': '开源项目',
    'personal-blog': '个人博客',
    'finance': '金融',
    'insurance': '保险',
    'family-life': '家庭生活',
    'uncategorized': '未分类'
  };
  
  return categoryMap[englishName] || englishName;
}

// 获取英文分类名
export function getEnglishCategoryName(chineseName: string): string {
  const reverseMap: Record<string, string> = {
    '技术工具': 'tech-tools',
    '产品经理': 'product-management',
    '开源项目': 'open-source',
    '个人博客': 'personal-blog',
    '金融': 'finance',
    '保险': 'insurance',
    '家庭生活': 'family-life',
    '未分类': 'uncategorized'
  };
  
  return reverseMap[chineseName] || chineseName;
}

// 获取所有分类映射 - 优先使用数据库，失败时使用备用数据
export async function getAllCategoryMappings(): Promise<Array<{name: string, slug: string}>> {
  try {
    // 检查是否启用了Turso
    if (isTursoEnabled()) {
      console.log('[Turso] 尝试从Turso数据库获取分类映射');
      
      // 从数据库获取分类
      const sql = `SELECT name, slug FROM categories ORDER BY name`;
      const dbCategories = await query(sql);
      
      if (dbCategories && dbCategories.length > 0) {
        console.log(`[Turso] 从数据库成功获取 ${dbCategories.length} 个分类`);
        return dbCategories;
      }
    }
  } catch (error) {
    console.error('[文章管理] 获取分类映射失败:', error);
  }
  
  // 如果Turso未启用或查询失败，使用备用映射
  return [
    { name: '技术工具', slug: 'tech-tools' },
    { name: '产品经理', slug: 'product-management' },
    { name: '开源项目', slug: 'open-source' },
    { name: '个人博客', slug: 'personal-blog' },
    { name: '金融', slug: 'finance' },
    { name: '保险', slug: 'insurance' },
    { name: '家庭生活', slug: 'family-life' },
    { name: '未分类', slug: 'uncategorized' }
  ];
}