import { Post, normalizePost } from '@/types/post';
import * as db from '../database';
import { slugify } from '@/lib/utils';

// 数据库中Post对象的类型
interface DbPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  content_html?: string;
  excerpt?: string;
  description?: string;
  is_published: number;
  is_featured: number;
  is_yaml_valid: number;
  is_manually_edited: number;
  reading_time?: number;
  source_path?: string;
  image_url?: string;
  yuque_url?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

/**
 * 获取所有文章
 */
export async function getAllPosts(options: {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  search?: string;
  searchField?: string;
  published?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeUnpublished?: boolean;
} = {}): Promise<{ posts: Post[], total: number }> {
  const {
    limit = 10,
    offset = 0,
    category,
    tag,
    search,
    searchField,
    published,
    sortBy = 'created_at',
    sortOrder = 'desc',
    includeUnpublished = false
  } = options;

  console.log(`[DB] 查询文章参数: 分类=${category}, 标签=${tag}, 搜索=${search}, 搜索字段=${searchField}, 状态=${published}`);

  // 构建查询条件
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  // 发布状态筛选
  if (published !== undefined) {
    whereConditions.push('p.is_published = ?');
    queryParams.push(published ? 1 : 0);
  } 
  // 只有在未指定具体发布状态且不包含未发布文章时，才添加默认的已发布条件
  else if (!includeUnpublished) {
    whereConditions.push('p.is_published = 1');
  }

  // 按分类筛选
  if (category) {
    // 支持通过分类的slug或name进行筛选
    whereConditions.push('(c.slug = ? OR c.name = ?)');
    queryParams.push(category, category);
    console.log(`[DB] 添加分类筛选条件(slug或name): ${category}`);
  } else {
    // 如果没有分类筛选，但使用了LEFT JOIN，需要添加条件避免结果重复
    // 这是因为LEFT JOIN会包含没有分类的文章，但我们不希望排除这些文章
    console.log(`[DB] 没有分类筛选，添加条件避免LEFT JOIN导致的结果重复`);
  }

  // 按标签筛选
  if (tag) {
    whereConditions.push('t.slug = ?');
    queryParams.push(tag);
  }
  
  // 按搜索关键词筛选
  if (search) {
    if (searchField === 'title') {
      whereConditions.push('p.title LIKE ?');
      queryParams.push(`%${search}%`);
      console.log(`[DB] 添加标题搜索条件: ${search}`);
    } else {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
  }

  // 构建WHERE子句
  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';
  
  console.log(`[DB] 最终WHERE条件: ${whereClause}`);
  console.log(`[DB] 查询参数: ${JSON.stringify(queryParams)}`);
  console.log(`[DB] 应用的筛选条件: 分类=${category || '全部'}, 标签=${tag || '全部'}, 搜索=${search || '无'}, 搜索字段=${searchField || '全部'}, 状态=${published !== undefined ? (published ? '已发布' : '草稿') : '全部'}`);

  // 构建ORDER BY子句
  // 支持sortBy以下字段: created_at, updated_at, title, reading_time
  const validSortFields = ['created_at', 'updated_at', 'title', 'reading_time'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const orderByClause = `ORDER BY p.${orderField} ${order}`;

  // 获取总数
  let countQuery = `
    SELECT COUNT(DISTINCT p.id) as count
    FROM posts p
  `;

  // 添加JOIN子句（始终添加分类JOIN，以便支持分类筛选）
  // 无论是否有分类筛选，都添加JOIN，这样确保在同时有搜索和分类筛选时能够正确工作
  countQuery += `
    LEFT JOIN post_categories pc ON p.id = pc.post_id
    LEFT JOIN categories c ON pc.category_id = c.id
  `;

  if (tag) {
    countQuery += `
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN tags t ON pt.tag_id = t.id
    `;
  }

  // 添加WHERE条件
  countQuery += ` ${whereClause}`;

  // 执行计数查询
  const countResult = await db.queryOne<{ count: number }>(countQuery, queryParams);
  const total = countResult?.count || 0;

  // 没有结果时直接返回
  if (total === 0) {
    return { posts: [], total: 0 };
  }

  // 构建文章查询
  let postsQuery = `
    SELECT DISTINCT
      p.id, p.slug, p.title, p.content, p.content_html, p.excerpt, p.description,
      p.is_published, p.is_featured, p.is_yaml_valid, p.is_manually_edited,
      p.reading_time, p.source_path, p.image_url, p.yuque_url,
      p.created_at, p.updated_at, p.published_at
    FROM posts p
  `;

  // 添加JOIN子句（始终添加分类JOIN，以便支持分类筛选）
  // 无论是否有分类筛选，都添加JOIN，这样确保在同时有搜索和分类筛选时能够正确工作
  postsQuery += `
    LEFT JOIN post_categories pc ON p.id = pc.post_id
    LEFT JOIN categories c ON pc.category_id = c.id
  `;

  if (tag) {
    postsQuery += `
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN tags t ON pt.tag_id = t.id
    `;
  }

  // 添加WHERE和ORDER BY条件
  postsQuery += `
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  // 添加分页参数
  queryParams.push(limit, offset);
  
  // 输出最终的SQL查询
  console.log('[DB] 最终构建的SQL查询:');
  console.log(postsQuery);
  console.log('[DB] 查询参数:', queryParams);

  // 执行查询
  const dbPosts = await db.query<DbPost>(postsQuery, queryParams);

  // 获取每篇文章的分类和标签
  const posts = await Promise.all(dbPosts.map(async (dbPost) => {
    // 获取文章分类
    const categoriesQuery = `
      SELECT c.name, c.slug
      FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `;
    const categories = await db.query<{ name: string, slug: string }>(categoriesQuery, [dbPost.id]);

    // 获取文章标签
    const tagsQuery = `
      SELECT t.name, t.slug
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `;
    const tags = await db.query<{ name: string, slug: string }>(tagsQuery, [dbPost.id]);

    // 转换为前端使用的Post类型
    return mapDbPostToPost(dbPost, {
      categories: categories.map(c => c.name),
      categorySlugs: categories.map(c => c.slug),
      tags: tags.map(t => t.name)
    });
  }));

  return { posts, total };
}

/**
 * 按slug获取文章
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  // 查询文章
  const query = `
    SELECT 
      p.id, p.slug, p.title, p.content, p.content_html, p.excerpt, p.description,
      p.is_published, p.is_featured, p.is_yaml_valid, p.is_manually_edited,
      p.reading_time, p.source_path, p.image_url, p.yuque_url,
      p.created_at, p.updated_at, p.published_at
    FROM posts p
    WHERE p.slug = ?
  `;
  
  const dbPost = await db.queryOne<DbPost>(query, [slug]);
  
  if (!dbPost) {
    return null;
  }
  
  // 获取文章分类
  const categoriesQuery = `
    SELECT c.name, c.slug
    FROM categories c
    JOIN post_categories pc ON c.id = pc.category_id
    WHERE pc.post_id = ?
  `;
  const categories = await db.query<{ name: string, slug: string }>(categoriesQuery, [dbPost.id]);
  
  // 获取文章标签
  const tagsQuery = `
    SELECT t.name, t.slug
    FROM tags t
    JOIN post_tags pt ON t.id = pt.tag_id
    WHERE pt.post_id = ?
  `;
  const tags = await db.query<{ name: string, slug: string }>(tagsQuery, [dbPost.id]);
  
  // 转换为前端使用的Post类型
  return mapDbPostToPost(dbPost, {
    categories: categories.map(c => c.name),
    categorySlugs: categories.map(c => c.slug),
    tags: tags.map(t => t.name)
  });
}

/**
 * 保存文章
 */
export async function savePost(post: Post): Promise<number> {
  // 规范化Post对象，确保新旧字段都能正确处理
  const normalizedPost = normalizePost(post);
  
  // 确保ID是数字类型
  let postIdNumber: number | undefined;
  if (normalizedPost.id !== undefined) {
    if (typeof normalizedPost.id === 'string') {
      postIdNumber = parseInt(normalizedPost.id, 10);
      if (isNaN(postIdNumber)) {
        console.warn(`[savePost] 无效的文章ID (字符串): ${normalizedPost.id}`);
        postIdNumber = undefined;
      }
    } else {
      postIdNumber = normalizedPost.id;
    }
  }
  
  // 使用事务确保所有操作的原子性
  return db.withTransaction(async () => {
    const now = db.getCurrentTimestamp();
    
    // 判断是新建还是更新
    // 首先检查是否有ID，其次检查是否有slug
    let existingPost;
    
    if (postIdNumber) {
      // 如果有ID，直接通过ID查找
      try {
        existingPost = await db.queryOne<{ id: number, slug: string, title: string }>(
          'SELECT id, slug, title FROM posts WHERE id = ?', 
          [postIdNumber]
        );
        
        if (!existingPost) {
          console.warn(`[savePost] 未找到ID为 ${postIdNumber} 的文章，将尝试通过slug查找`);
        }
      } catch (error) {
        console.error(`[savePost] 通过ID查询文章失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 如果通过ID没有找到文章，尝试通过slug查找
    if (!existingPost && normalizedPost.slug) {
      try {
        existingPost = await db.queryOne<{ id: number, slug: string, title: string }>(
          'SELECT id, slug, title FROM posts WHERE slug = ?', 
          [normalizedPost.slug]
        );
      } catch (error) {
        console.error(`[savePost] 通过slug查询文章失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 如果有ID则更新，否则插入
    let postId: number;
    
    if (existingPost) {
      // 更新文章
      postId = existingPost.id;
      
      // 检查是否标题发生变化且slug也变化了
      const isTitleChanged = existingPost.title !== normalizedPost.title;
      const isSlugChanged = existingPost.slug !== normalizedPost.slug;
      
      // 如果标题和slug都发生了变化，需要更新slug映射关系
      if (isTitleChanged && isSlugChanged) {
        console.log(`[Post Repository] 检测到标题和slug变更: 标题从"${existingPost.title}"变为"${normalizedPost.title}", slug从"${existingPost.slug}"变为"${normalizedPost.slug}"`);
        
        // 检查是否存在slug映射表
        const hasSlugMappingTable = await db.queryOne<{ count: number }>(
          "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='slug_mapping'"
        );
        
        // 如果存在slug映射表，则添加旧slug作为别名
        if (hasSlugMappingTable && hasSlugMappingTable.count > 0) {
          // 检查旧slug是否已经在映射表中
          const oldSlugMapping = await db.queryOne<{ id: number, is_primary: number }>(
            "SELECT id, is_primary FROM slug_mapping WHERE slug = ? AND post_id = ?",
            [existingPost.slug, postId]
          );
          
          if (oldSlugMapping) {
            // 如果是主slug，则设置为非主slug
            if (oldSlugMapping.is_primary === 1) {
              await db.execute(
                "UPDATE slug_mapping SET is_primary = 0 WHERE id = ?",
                [oldSlugMapping.id]
              );
            }
          } else {
            // 如果旧slug不在映射表中，添加为别名
            await db.execute(
              "INSERT INTO slug_mapping (post_id, slug, is_primary, created_at) VALUES (?, ?, 0, ?)",
              [postId, existingPost.slug, now]
            );
          }
          
          // 检查新slug是否已在映射表中
          const newSlugMapping = await db.queryOne<{ id: number }>(
            "SELECT id FROM slug_mapping WHERE slug = ? AND post_id = ?",
            [normalizedPost.slug, postId]
          );
          
          if (newSlugMapping) {
            // 如果新slug已存在，更新为主slug
            await db.execute(
              "UPDATE slug_mapping SET is_primary = 1 WHERE id = ?",
              [newSlugMapping.id]
            );
          } else {
            // 如果新slug不存在，添加为主slug
            await db.execute(
              "INSERT INTO slug_mapping (post_id, slug, is_primary, created_at) VALUES (?, ?, 1, ?)",
              [postId, normalizedPost.slug, now]
            );
          }
        }
      } else if (!isTitleChanged && isSlugChanged) {
        // 标题没变但slug变了，说明是手动修改了slug，记录日志
        console.log(`[Post Repository] 检测到手动修改slug: 从"${existingPost.slug}"变为"${normalizedPost.slug}"`);
      } else if (isTitleChanged && !isSlugChanged) {
        // 标题变了但slug没变，说明是手动保持了原slug，记录日志
        console.log(`[Post Repository] 检测到标题变更但保持原slug: 标题从"${existingPost.title}"变为"${normalizedPost.title}"`);
      } else {
        // 标题和slug都没变，只是更新了其他内容
        console.log(`[Post Repository] 更新文章内容，标题和slug保持不变: "${existingPost.title}" (${existingPost.slug})`);
      }
      
      const updateSql = `
        UPDATE posts SET
          slug = ?,
          title = ?,
          content = ?,
          content_html = ?,
          excerpt = ?,
          description = ?,
          is_published = ?,
          is_featured = ?,
          is_yaml_valid = ?,
          is_manually_edited = ?,
          reading_time = ?,
          source_path = ?,
          image_url = ?,
          updated_at = ?,
          published_at = ?
        WHERE id = ?
      `;
      
      // 获取当前时间，确保每次更新都刷新updated_at字段
      const currentTime = db.getCurrentTimestamp();
      
      try {
        // 优先使用新字段名，回退到旧字段名
        await db.execute(updateSql, [
          normalizedPost.slug,
          normalizedPost.title,
          normalizedPost.content,
          normalizedPost.contentHtml || null,
          normalizedPost.excerpt || null,
          normalizedPost.description || null,
          (normalizedPost.isPublished || normalizedPost.published) ? 1 : 0,
          (normalizedPost.isFeatured || normalizedPost.featured) ? 1 : 0,
          (normalizedPost.isYamlValid !== false && normalizedPost.yamlValid !== false) ? 1 : 0,
          (normalizedPost.isManuallyEdited || normalizedPost.manuallyEdited) ? 1 : 0,
          normalizedPost.readingTime || null,
          (normalizedPost.sourcePath || normalizedPost.source_path || normalizedPost.metadata?.originalFile) || null,
          (normalizedPost.imageUrl || normalizedPost.coverImage) || null,
          currentTime, // 始终使用当前时间作为更新时间
          (normalizedPost.isPublished || normalizedPost.published) ? (normalizedPost.publishedAt || now) : null,
          postId
        ]);
      } catch (error) {
        console.error(`[savePost] 更新文章失败, ID: ${postId}, 错误:`, error);
        
        // 尝试使用直接的SQL语句更新
        try {
          const simpleSql = `UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ?`;
          await db.execute(simpleSql, [
            normalizedPost.title,
            normalizedPost.content,
            currentTime,
            postId
          ]);
          console.log(`[savePost] 使用简化SQL更新文章成功, ID: ${postId}`);
        } catch (fallbackError) {
          console.error(`[savePost] 简化SQL更新也失败, ID: ${postId}, 错误:`, fallbackError);
          throw fallbackError;
        }
      }
      
      // 更新文章对象的updated_at字段，确保返回给前端的数据是最新的
      normalizedPost.updated_at = currentTime;
      normalizedPost.updatedAt = currentTime;
      normalizedPost.updated = currentTime;
      
      console.log(`[Post Repository] 更新文章成功，ID: ${postId}, 标题: ${normalizedPost.title}, 更新时间: ${currentTime}`);
    } else {
      // 新建文章
      // 如果未提供slug，则根据标题生成
      const slug = normalizedPost.slug || slugify(normalizedPost.title);
      
      const insertSql = `
        INSERT INTO posts (
          slug, title, content, content_html, excerpt, description,
          is_published, is_featured, is_yaml_valid, is_manually_edited,
          reading_time, source_path, image_url,
          created_at, updated_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // 优先使用新字段名，回退到旧字段名
      const result = await db.execute(insertSql, [
        slug,
        normalizedPost.title,
        normalizedPost.content,
        normalizedPost.contentHtml || null,
        normalizedPost.excerpt || null,
        normalizedPost.description || null,
        (normalizedPost.isPublished || normalizedPost.published) ? 1 : 0,
        (normalizedPost.isFeatured || normalizedPost.featured) ? 1 : 0,
        (normalizedPost.isYamlValid !== false && normalizedPost.yamlValid !== false) ? 1 : 0,
        (normalizedPost.isManuallyEdited || normalizedPost.manuallyEdited) ? 1 : 0,
        normalizedPost.readingTime || null,
        (normalizedPost.sourcePath || normalizedPost.source_path || normalizedPost.metadata?.originalFile) || null,
        (normalizedPost.imageUrl || normalizedPost.coverImage) || null,
        normalizedPost.createdAt || normalizedPost.date || now,
        normalizedPost.updatedAt || normalizedPost.updated || now,
        (normalizedPost.isPublished || normalizedPost.published) ? (normalizedPost.publishedAt || now) : null
      ]);
      
      // 获取新插入的ID
      const newPost = await db.queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
      if (!newPost) {
        throw new Error('插入文章失败');
      }
      
      postId = newPost.id;
      console.log(`[Post Repository] 创建文章成功，ID: ${postId}, 标题: ${normalizedPost.title}`);
    }
    
    // 更新分类
    if (normalizedPost.categories && normalizedPost.categories.length > 0) {
      // 先删除旧的关联
      await db.execute('DELETE FROM post_categories WHERE post_id = ?', [postId]);
      
      // 插入新的关联
      for (const categoryName of normalizedPost.categories) {
        // 先尝试通过slug查找分类（处理英文slug的情况，如 tech-tools）
        // 为了处理前端传来的英文分类名（如tech-tools），先检查是否已经是slug
        const isSlug = /^[a-z0-9-]+$/.test(categoryName);
        
        let category;
        if (isSlug) {
          // 如果是英文slug格式，直接按slug查询
          category = await db.queryOne<{ id: number }>('SELECT id FROM categories WHERE slug = ?', [categoryName]);
        }
        
        // 如果没找到，再尝试按name查询
        if (!category) {
          category = await db.queryOne<{ id: number }>('SELECT id FROM categories WHERE name = ?', [categoryName]);
        }
        
        if (!category) {
          // 创建新分类
          const categorySlug = slugify(categoryName);
          await db.execute(
            'INSERT INTO categories (name, slug, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [categoryName, categorySlug, now, now]
          );
          
          category = await db.queryOne<{ id: number }>('SELECT id FROM categories WHERE name = ?', [categoryName]);
          
          if (!category) {
            throw new Error(`创建分类失败: ${categoryName}`);
          }
        }
        
        // 创建关联
        await db.execute(
          'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
          [postId, category.id]
        );
      }
    }
    
    // 更新标签
    if (normalizedPost.tags && normalizedPost.tags.length > 0) {
      // 先删除旧的关联
      await db.execute('DELETE FROM post_tags WHERE post_id = ?', [postId]);
      
      // 插入新的关联
      for (const tagName of normalizedPost.tags) {
        // 获取或创建标签
        let tag = await db.queryOne<{ id: number }>('SELECT id FROM tags WHERE name = ?', [tagName]);
        
        if (!tag) {
          // 创建新标签
          const tagSlug = slugify(tagName);
          await db.execute(
            'INSERT INTO tags (name, slug, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [tagName, tagSlug, now, now]
          );
          
          tag = await db.queryOne<{ id: number }>('SELECT id FROM tags WHERE name = ?', [tagName]);
          
          if (!tag) {
            throw new Error(`创建标签失败: ${tagName}`);
          }
        }
        
        // 创建关联
        await db.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tag.id]
        );
      }
    }
    
    // 更新分类和标签的计数
    await updateCategoryCounts();
    await updateTagCounts();
    
    return postId;
  });
}

/**
 * 删除文章
 */
export async function deletePost(slug: string): Promise<boolean> {
  const post = await db.queryOne<{ id: number }>('SELECT id FROM posts WHERE slug = ?', [slug]);
  
  if (!post) {
    return false;
  }
  
  return db.withTransaction(async () => {
    // 删除关联
    await db.execute('DELETE FROM post_categories WHERE post_id = ?', [post.id]);
    await db.execute('DELETE FROM post_tags WHERE post_id = ?', [post.id]);
    await db.execute('DELETE FROM slug_mapping WHERE post_id = ?', [post.id]);
    
    // 删除文章
    await db.execute('DELETE FROM posts WHERE id = ?', [post.id]);
    
    // 更新分类和标签的计数
    await updateCategoryCounts();
    await updateTagCounts();
    
    return true;
  });
}

/**
 * 更新所有分类的文章计数
 */
async function updateCategoryCounts(): Promise<void> {
  const sql = `
    UPDATE categories 
    SET post_count = (
      SELECT COUNT(DISTINCT pc.post_id) 
      FROM post_categories pc
      JOIN posts p ON pc.post_id = p.id AND p.is_published = 1
      WHERE pc.category_id = categories.id
    )
  `;
  
  await db.execute(sql);
}

/**
 * 更新所有标签的文章计数
 */
async function updateTagCounts(): Promise<void> {
  const sql = `
    UPDATE tags 
    SET post_count = (
      SELECT COUNT(DISTINCT pt.post_id)
      FROM post_tags pt
      JOIN posts p ON pt.post_id = p.id AND p.is_published = 1
      WHERE pt.tag_id = tags.id
    )
  `;
  
  await db.execute(sql);
}

/**
 * 将数据库Post对象转换为前端使用的Post对象
 */
function mapDbPostToPost(dbPost: DbPost, related: {
  categories: string[];
  categorySlugs: string[];
  tags: string[];
}): Post {
  // 将数据库对象转换为前端使用的Post对象
  const post: Post = {
    id: dbPost.id,
    slug: dbPost.slug,
    title: dbPost.title,
    content: dbPost.content,
    contentHtml: dbPost.content_html,
    excerpt: dbPost.excerpt,
    description: dbPost.description,
    
    // 使用Post类型支持的字段
    published: Boolean(dbPost.is_published),
    featured: Boolean(dbPost.is_featured),
    yamlValid: Boolean(dbPost.is_yaml_valid),
    manuallyEdited: Boolean(dbPost.is_manually_edited),
    
    // 前端友好字段别名
    isPublished: Boolean(dbPost.is_published),
    isFeatured: Boolean(dbPost.is_featured),
    isYamlValid: Boolean(dbPost.is_yaml_valid),
    isManuallyEdited: Boolean(dbPost.is_manually_edited),
    
    // 日期字段
    date: dbPost.created_at,
    updated: dbPost.updated_at,
    publishedAt: dbPost.published_at,
    
    // 前端友好日期别名
    createdAt: dbPost.created_at,
    updatedAt: dbPost.updated_at,
    
    // 媒体字段
    imageUrl: dbPost.image_url,
    coverImage: dbPost.image_url,
    readingTime: dbPost.reading_time,
    
    // 源信息
    sourcePath: dbPost.source_path,
    source_path: dbPost.source_path,
    yuqueUrl: dbPost.yuque_url,
    
    // 分类和标签
    categories: related.categories,
    categorySlugs: related.categorySlugs,
    tags: related.tags,
    
    // 元数据
    metadata: {
      wordCount: calculateWordCount(dbPost.content),
      readingTime: dbPost.reading_time || calculateReadingTime(dbPost.content),
      originalFile: dbPost.source_path
    }
  };
  
  return post;
}

/**
 * 计算内容的字数
 */
function calculateWordCount(content: string): number {
  if (!content) return 0;
  // 简单实现：按空白字符分割，去除空项
  return content.split(/\s+/).filter(Boolean).length;
}

/**
 * 计算阅读时间（分钟）
 */
function calculateReadingTime(content: string): number {
  if (!content) return 0;
  // 假设平均阅读速度为200字/分钟
  const wordCount = calculateWordCount(content);
  return Math.ceil(wordCount / 200);
} 