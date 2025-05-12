import { NextResponse } from 'next/server';
import { Category } from '@/types/post';
import initializeDatabase, { getDb, generateId } from '@/lib/db';

// 定义数据库分类记录的接口
interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
}

// 标准分类映射
const STANDARD_CATEGORIES = [
  'tech-tools',
  'product-management',
  'open-source',
  'personal-blog',
  'finance',
  'insurance',
  'family-life',
  'reading'
];

// 确保数据库和标准分类都已初始化
async function ensureCategoriesInitialized() {
  try {
    console.log('[API] 确保分类数据已初始化');
    await initializeDatabase();
    
    const db = await getDb();
    
    // 检查分类表是否为空
    const categoriesCount = await db.get('SELECT COUNT(*) as count FROM categories');
    
    if (categoriesCount.count === 0) {
      console.log('[API] 分类表为空，添加标准分类');
      
      // 执行事务，确保全部添加成功或全部失败
      await db.exec('BEGIN TRANSACTION');
      
      try {
        // 添加标准分类
        for (const slug of STANDARD_CATEGORIES) {
          const name = getChineseNameForSlug(slug);
          const id = generateId();
          
          try {
            await db.run(`
              INSERT INTO categories (id, name, slug, description) 
              VALUES (?, ?, ?, ?)
            `, [id, name, slug, '']);
            
            console.log(`[API] 添加标准分类: ${name} (${slug})`);
          } catch (insertError) {
            console.error(`[API] 添加分类 ${slug} 失败:`, insertError);
            // 继续下一个，不抛出错误
          }
        }
        
        // 提交事务
        await db.exec('COMMIT');
        console.log('[API] 分类初始化完成');
      } catch (txError) {
        // 回滚事务
        await db.exec('ROLLBACK');
        console.error('[API] 分类初始化事务失败，已回滚:', txError);
      }
    }
  } catch (error) {
    console.error('[API] 初始化分类失败:', error);
  }
}

// 添加内存缓存
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5分钟缓存

// 执行初始化
ensureCategoriesInitialized();

/**
 * 从数据库获取所有分类，不依赖于内存中的categoryMappings
 */
export async function GET() {
  try {
    console.log('[API] 开始从数据库获取分类数据');
    
    // 检查缓存是否有效
    const now = Date.now();
    if (categoriesCache && (now - categoriesCacheTimestamp < CACHE_TTL)) {
      console.log('[API] 使用缓存的分类数据');
      return Response.json(categoriesCache);
    }
    
    const db = await getDb();
    
    // 创建一个获取文章计数的函数
    async function getPostCount(categoryName: string): Promise<number> {
      try {
        // 1. 获取这个分类名下的所有分类ID
        const allCategoryIds = await db.all(`
          SELECT id FROM categories WHERE name = ?
        `, [categoryName]);
        
        if (allCategoryIds.length === 0) return 0;
        
        // 2. 构建IN语句查询参数
        const ids = allCategoryIds.map((row: any) => row.id);
        const placeholders = ids.map(() => '?').join(',');
        
        // 3. 查询这些分类关联的不重复已发布文章数量
        // 完全移除对published列的引用，只使用is_published
        try {
          // 先尝试使用is_published
          const result = await db.get(`
            SELECT COUNT(DISTINCT pc.post_id) as count
            FROM post_categories pc
            JOIN posts p ON pc.post_id = p.id
            WHERE pc.category_id IN (${placeholders})
            AND p.is_published = 1
          `, ...ids) as { count: number };
          
          return result?.count || 0;
        } catch (err) {
          // 如果失败（列不存在），则使用published
          console.log(`[API] 使用is_published失败，尝试使用published:`, err);
          
          try {
            const result = await db.get(`
              SELECT COUNT(DISTINCT pc.post_id) as count
              FROM post_categories pc
              JOIN posts p ON pc.post_id = p.id
              WHERE pc.category_id IN (${placeholders})
              AND p.published = 1
            `, ...ids) as { count: number };
            
            return result?.count || 0;
          } catch (err2) {
            // 如果两者都失败，则返回0
            console.log(`[API] 使用published也失败:`, err2);
            return 0;
          }
        }
      } catch (error) {
        console.error(`[API] 计算分类 "${categoryName}" 的文章数量失败:`, error);
        return 0;
      }
    }
    
    // 1. 先获取符合标准slug的中文分类
    const standardCategories = await db.all(`
      SELECT id, name, slug, description, 0 as post_count
      FROM categories
      WHERE (name IN ('技术工具', '产品管理', '开源', '个人博客', '金融', '保险', '家庭生活', '读书笔记')
      OR slug IN ('tech-tools', 'product-management', 'open-source', 'personal-blog', 'finance', 'insurance', 'family-life', 'reading'))
    `) as DbCategory[];
    
    console.log(`[API] 找到 ${standardCategories.length} 个标准分类`);
    
    // 2. 计算每个分类的文章数量
    const categories: Category[] = [];
    
    for (const category of standardCategories) {
      // 计算文章数量
      const postCount = await getPostCount(category.name);
      
      categories.push({
        name: category.name,
        slug: category.slug,
        postCount: postCount,
        description: category.description || ''
      });
      
      console.log(`[API] 分类 "${category.name}" (${category.slug}) 文章数量: ${postCount}`);
    }
    
    // 3. 检查是否缺少任何标准分类，如果有则添加
    const existingSlugs = categories.map(c => c.slug);
    
    for (const standardSlug of STANDARD_CATEGORIES) {
      if (!existingSlugs.includes(standardSlug)) {
        // 查找该slug对应的英文名分类
        const englishCategory = await db.get(`
          SELECT id, name, slug, description, 0 as post_count
          FROM categories
          WHERE slug = ?
        `, [standardSlug]) as DbCategory | undefined;
        
        if (englishCategory) {
          // 计算文章数量
          const postCount = await getPostCount(englishCategory.name);
          
          categories.push({
            name: getChineseNameForSlug(standardSlug),
            slug: standardSlug,
            postCount: postCount,
            description: englishCategory.description || ''
          });
          
          console.log(`[API] 添加英文分类 "${standardSlug}" 文章数量: ${postCount}`);
        } else {
          // 如果不存在，添加一个空记录并插入数据库
          const name = getChineseNameForSlug(standardSlug);
          const id = generateId();
          
          try {
            // 检查该slug是否已经存在
            const existingCategory = await db.get(`
              SELECT id FROM categories WHERE slug = ?
            `, [standardSlug]);
            
            if (!existingCategory) {
              await db.run(`
                INSERT INTO categories (id, name, slug, description) 
                VALUES (?, ?, ?, ?)
              `, [id, name, standardSlug, '']);
              
              console.log(`[API] 数据库中创建缺失分类: "${name}" (${standardSlug})`);
            } else {
              console.log(`[API] 分类已存在: "${standardSlug}", 跳过创建`);
            }
          } catch (err) {
            console.error(`[API] 创建分类失败: ${err}`);
          }
          
          categories.push({
            name: name,
            slug: standardSlug,
            postCount: 0,
            description: ''
          });
          
          console.log(`[API] 添加缺失分类 "${standardSlug}" 文章数量: 0`);
        }
      }
    }
    
    // 按名称排序
    categories.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    
    console.log(`[API] 最终返回 ${categories.length} 个分类`);
    
    // 更新缓存
    categoriesCache = categories;
    categoriesCacheTimestamp = now;
    
    return Response.json(categories);
  } catch (error) {
    console.error('[API] 从数据库获取分类失败:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '获取分类失败' },
      { status: 500 }
    );
  }
}

/**
 * 根据标准slug获取中文分类名
 */
function getChineseNameForSlug(slug: string): string {
  const nameMap: Record<string, string> = {
    'tech-tools': '技术工具',
    'product-management': '产品管理',
    'open-source': '开源',
    'personal-blog': '个人博客',
    'finance': '金融',
    'insurance': '保险',
    'family-life': '家庭生活',
    'reading': '读书笔记'
  };
  
  return nameMap[slug] || slug;
}

/**
 * 清除分类缓存
 */
function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = 0;
} 