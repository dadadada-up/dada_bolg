import { Post } from '@/types/post';
import { getDb, getTimestamp } from './db';
import { savePost, getAllPosts, deletePost as deleteDbPost, getPostBySlug } from './db-posts';
import { savePostSafe } from './db-posts.patch';
import * as github from './github';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { enhancedSlugify } from './utils';

// 同步状态类型
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// 同步方向
export type SyncDirection = 'to-github' | 'from-github' | 'bidirectional' | 'to-local' | 'from-local';

// 同步操作类型
export type SyncOperation = 'create' | 'update' | 'delete';

// 同步项目接口
interface SyncItem {
  id: string;
  operation: SyncOperation;
  status: 'pending' | 'success' | 'error';
  error?: string;
  path?: string;
  slug?: string;
  retry_count: number;
  created_at: number;
}

// 获取本地内容路径
const contentBasePath = path.resolve(process.cwd(), '../../content');

// 获取当前同步状态
export async function getSyncStatus(): Promise<{
  status: SyncStatus;
  lastSync: string | null;
  pendingOperations: number;
}> {
  const db = await getDb();
  const syncStatus = await db.get('SELECT * FROM sync_status WHERE id = 1');
  
  // 获取待同步项数量
  const pendingCountResult = await db.get('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?', ['pending']);
  const pendingCount = pendingCountResult?.count || 0;
  
  return {
    status: syncStatus?.sync_in_progress ? 'syncing' : 'idle',
    lastSync: syncStatus?.last_sync_time ? new Date(syncStatus.last_sync_time * 1000).toISOString() : null,
    pendingOperations: pendingCount
  };
}

// 创建同步队列表，如果不存在
async function ensureSyncQueueTable() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      operation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      path TEXT,
      slug TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);
}

// 添加同步项到队列
export async function addToSyncQueue(
  operation: SyncOperation,
  slug?: string,
  path?: string
): Promise<string> {
  await ensureSyncQueueTable();
  
  const db = await getDb();
  const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const now = getTimestamp();
  
  await db.run(`
    INSERT INTO sync_queue (id, operation, status, path, slug, created_at)
    VALUES (?, ?, 'pending', ?, ?, ?)
  `, [id, operation, path, slug, now]);
  
  console.log(`[同步服务] 添加操作到队列: ${operation}, slug: ${slug}, path: ${path}`);
  
  return id;
}

// 更新同步项状态
export async function updateSyncItemStatus(
  id: string,
  status: 'pending' | 'success' | 'error',
  error?: string
): Promise<void> {
  const db = await getDb();
  
  if (status === 'error' && error) {
    await db.run(`
      UPDATE sync_queue 
      SET status = ?, error = ?, retry_count = retry_count + 1
      WHERE id = ?
    `, [status, error, id]);
    
    console.log(`[同步服务] 更新同步项状态: ${id}, 状态: ${status}, 错误: ${error}`);
  } else {
    await db.run(`
      UPDATE sync_queue 
      SET status = ?
      WHERE id = ?
    `, [status, id]);
    
    console.log(`[同步服务] 更新同步项状态: ${id}, 状态: ${status}`);
  }
}

// 从数据库同步到GitHub
export async function syncToGitHub(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  await ensureSyncQueueTable();
  
  const db = await getDb();
  
  // 标记同步进行中
  await db.run('UPDATE sync_status SET sync_in_progress = 1 WHERE id = 1');
  console.log('[同步服务] 开始同步到GitHub...');
  
  try {
    // 获取所有待处理的同步项
    const pendingItems = await db.all(`
      SELECT * FROM sync_queue 
      WHERE status = 'pending' 
      ORDER BY created_at ASC
      LIMIT 10
    `);
    
    console.log(`[同步服务] 找到 ${pendingItems.length} 个待处理项`);
    
    let processed = 0;
    let errors = 0;
    
    // 批量处理
    for (const item of pendingItems) {
      try {
        console.log(`[同步服务] 处理同步项: ${item.id}, 操作: ${item.operation}, slug: ${item.slug}`);
        
        switch (item.operation) {
          case 'create':
          case 'update':
            if (item.slug) {
              // 获取数据库中的文章
              const posts = await getAllPosts({ limit: 1 });
              const post = posts.posts.find(p => p.slug === item.slug);
              
              if (post) {
                console.log(`[同步服务] 找到文章: ${post.title}, 开始同步到GitHub`);
                await github.updatePost(post);
                await updateSyncItemStatus(item.id, 'success');
                processed++;
              } else {
                console.log(`[同步服务] 找不到Slug为 ${item.slug} 的文章`);
                throw new Error(`找不到Slug为 ${item.slug} 的文章`);
              }
            } else {
              throw new Error('缺少文章Slug');
            }
            break;
            
          case 'delete':
            if (item.path) {
              // 构造最小的Post对象用于删除
              const postToDelete = {
                slug: item.slug || '',
                title: '',
                date: '',
                content: '',
                excerpt: '',
                categories: [],
                tags: [],
                metadata: {
                  originalFile: item.path,
                  wordCount: 0,
                  readingTime: 0
                }
              } as Post;
              
              console.log(`[同步服务] 删除文章: ${item.slug}, 路径: ${item.path}`);
              await github.deletePost(postToDelete);
              await updateSyncItemStatus(item.id, 'success');
              processed++;
            } else {
              throw new Error('缺少文件路径');
            }
            break;
        }
      } catch (error) {
        console.error(`[同步服务] 处理同步项 ${item.id} 失败:`, error);
        await updateSyncItemStatus(item.id, 'error', error instanceof Error ? error.message : String(error));
        errors++;
      }
    }
    
    // 更新最后同步时间
    if (processed > 0 || errors === 0) {
      await db.run(`
        UPDATE sync_status 
        SET last_sync_time = ?, sync_in_progress = 0
        WHERE id = 1
      `, [getTimestamp()]);
    }
    
    console.log(`[同步服务] 同步到GitHub完成, 处理: ${processed}, 错误: ${errors}`);
    
    return { success: true, processed, errors };
  } catch (error) {
    console.error('[同步服务] 同步到GitHub失败:', error);
    
    // 重置同步状态
    await db.run('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1');
    
    return { success: false, processed: 0, errors: 1 };
  }
}

// 从GitHub同步到数据库
export async function syncFromGitHub(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  const db = getDb();
  
  // 标记同步进行中
  db.prepare('UPDATE sync_status SET sync_in_progress = 1 WHERE id = 1').run();
  console.log('[同步服务] 开始从GitHub同步文章...');
  
  try {
    console.log('[同步服务] 开始从GitHub同步文章...');
    
    // 获取GitHub上的所有文章
    const githubPosts = await github.getPosts();
    console.log(`[同步服务] 从GitHub获取到 ${githubPosts.length} 篇文章`);
    
    // 获取数据库中的所有文章
    const dbPostsResult = getAllPosts();
    const dbPosts = dbPostsResult.posts;
    console.log(`[同步服务] 从数据库获取到 ${dbPosts.length} 篇文章`);
    
    // 跟踪处理的文章和错误
    let processed = 0;
    let errors = 0;
    
    // 记录数据库已有的文章slug
    const existingSlugs = new Set(dbPosts.map(post => post.slug));
    
    // 处理GitHub上的每篇文章
    for (const post of githubPosts) {
      try {
        console.log(`[同步服务] 处理GitHub文章: ${post.slug}`);
        
        // 检查文章是否已存在于数据库中
        const existingPost = getPostBySlug(post.slug);
        
        if (existingPost) {
          // 如果已存在，检查是否需要更新
          const existingDate = new Date(existingPost.updated || existingPost.date);
          const newDate = new Date(post.updated || post.date);
          
          if (newDate > existingDate || post.content !== existingPost.content) {
            // 使用安全的保存函数
            savePostSafe(post);
            console.log(`[同步服务] 更新数据库中的文章: ${post.title}`);
          } else {
            console.log(`[同步服务] 文章已存在且不需要更新: ${post.title}`);
          }
        } else {
          // 如果不存在，添加到数据库
          // 使用安全的保存函数
          savePostSafe(post);
          console.log(`[同步服务] 在数据库中新增文章: ${post.title}`);
        }
        
        // 从集合中移除已处理的slug
        existingSlugs.delete(post.slug);
        processed++;
      } catch (error) {
        console.error(`[同步服务] 处理文章 ${post.slug} 失败:`, error);
        errors++;
      }
    }
    
    // 检查可能已删除的文章
    if (existingSlugs.size > 0) {
      console.log(`[同步服务] 发现 ${existingSlugs.size} 篇可能已删除的文章`);
      
      // 这里可以选择是否从数据库中删除这些文章
      // 默认不执行删除，避免误删除
    }
    
    console.log(`[同步服务] 从GitHub同步完成, 处理: ${processed}, 错误: ${errors}`);
    
    return {
      success: true,
      processed,
      errors
    };
  } catch (error) {
    console.error('[同步服务] 从GitHub同步失败:', error);
    return {
      success: false,
      processed: 0,
      errors: 1
    };
  }
}

// 从本地文件系统同步到数据库
export async function syncFromLocal(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  const db = getDb();
  
  // 标记同步进行中
  db.prepare('UPDATE sync_status SET sync_in_progress = 1 WHERE id = 1').run();
  console.log('[同步服务] 开始从本地文件系统同步...');
  
  try {
    if (!fs.existsSync(contentBasePath)) {
      console.error(`[同步服务] 本地内容目录不存在: ${contentBasePath}`);
      return { success: false, processed: 0, errors: 1 };
    }
    
    const postsPath = path.join(contentBasePath, 'posts');
    if (!fs.existsSync(postsPath)) {
      console.error(`[同步服务] 本地文章目录不存在: ${postsPath}`);
      return { success: false, processed: 0, errors: 1 };
    }
    
    // 获取所有分类目录
    const categories = fs.readdirSync(postsPath)
      .filter(item => {
        const itemPath = path.join(postsPath, item);
        return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
      });
    
    console.log(`[同步服务] 找到 ${categories.length} 个分类目录: ${categories.join(', ')}`);
    
    // 获取数据库中的所有文章
    const dbPosts = getAllPosts().posts;
    const dbPostMap = new Map<string, Post>();
    dbPosts.forEach(post => {
      dbPostMap.set(post.slug, post);
    });
    
    let processed = 0;
    let errors = 0;
    
    // 遍历所有分类目录
    for (const category of categories) {
      const categoryPath = path.join(postsPath, category);
      
      // 获取该分类下的所有Markdown文件
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md') && fs.statSync(path.join(categoryPath, file)).isFile());
      
      console.log(`[同步服务] 在分类 ${category} 中找到 ${files.length} 个Markdown文件`);
      
      // 处理每个文件
      for (const file of files) {
        try {
          const filePath = path.join(categoryPath, file);
          const relativePath = path.relative(contentBasePath, filePath);
          
          console.log(`[同步服务] 处理文件: ${filePath}`);
          
          // 读取文件内容
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // 解析前置元数据
          let data, markdown;
          try {
            const parsed = matter(content);
            data = parsed.data;
            markdown = parsed.content;
          } catch (error) {
            console.error(`[同步服务] 解析文件 ${filePath} 的前置元数据失败:`, error);
            // 尝试提取标题和日期
            const fileName = path.basename(file, '.md');
            const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
            
            data = {
              title: dateMatch ? dateMatch[2].replace(/-/g, ' ') : fileName,
              date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
              categories: [category],
              tags: []
            };
            markdown = content;
          }
          
          // 确保有slug
          if (!data.slug) {
            data.slug = enhancedSlugify(data.title, { maxLength: 80 });
          }
          
          // 构建Post对象
          const post: Post = {
            slug: data.slug,
            title: data.title,
            date: data.date,
            updated: data.updated || data.updateDate || data.date,
            content: markdown,
            excerpt: data.description || markdown.substring(0, 160).replace(/\n/g, ' ') + '...',
            categories: data.categories || [category],
            tags: data.tags || [],
            published: data.published !== false,
            featured: !!data.featured,
            coverImage: data.image || data.coverImage,
            readingTime: Math.ceil(markdown.split(/\s+/).length / 200) || 1,
            metadata: {
              originalFile: relativePath,
              wordCount: markdown.split(/\s+/).length,
              readingTime: Math.ceil(markdown.split(/\s+/).length / 200) || 1
            }
          };
          
          // 检查是否需要更新数据库
          const dbPost = dbPostMap.get(post.slug);
          if (!dbPost) {
            console.log(`[同步服务] 在数据库中新增文章: ${post.title}`);
            savePostSafe(post);
            processed++;
          } else if (post.updated && (!dbPost.updated || new Date(post.updated) > new Date(dbPost.updated))) {
            console.log(`[同步服务] 更新数据库中的文章: ${post.title}`);
            savePostSafe(post);
            processed++;
          } else {
            console.log(`[同步服务] 文章已是最新: ${post.title}`);
          }
        } catch (error) {
          console.error(`[同步服务] 处理文件 ${file} 失败:`, error);
          errors++;
        }
      }
    }
    
    // 更新最后同步时间
    db.prepare(`
      UPDATE sync_status 
      SET last_sync_time = ?, sync_in_progress = 0
      WHERE id = 1
    `).run(getTimestamp());
    
    console.log(`[同步服务] 从本地文件系统同步完成, 处理: ${processed}, 错误: ${errors}`);
    
    return { success: true, processed, errors };
  } catch (error) {
    console.error('[同步服务] 从本地文件系统同步失败:', error);
    
    // 重置同步状态
    db.prepare('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1').run();
    
    return { success: false, processed: 0, errors: 1 };
  }
}

// 从数据库同步到本地文件系统
export async function syncToLocal(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  try {
    // 确定本地内容目录
    const contentDir = path.resolve(process.cwd(), '../../content');
    const postsDir = path.join(contentDir, 'posts');
    
    // 确保目录存在
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    
    // 获取数据库中的所有文章
    const { posts } = getAllPosts();
    console.log(`[同步服务] 从数据库获取到 ${posts.length} 篇文章`);
    
    // 跟踪处理的文章和错误
    let processed = 0;
    let errors = 0;
    
    // 处理数据库中的每篇文章
    for (const post of posts) {
      try {
        // 确定分类目录
        const category = post.categories[0] || 'uncategorized';
        const categoryDir = path.join(postsDir, category);
        
        // 确保分类目录存在
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        // 确定文件名
        // 从日期中提取年月日部分
        const postDate = post.date.split('T')[0];
        const fileName = `${postDate}-${post.slug}.md`;
        const filePath = path.join(categoryDir, fileName);
        
        console.log(`[同步服务] 处理文章: ${post.title}, 保存到: ${filePath}`);
        
        // 构建front matter
        const frontMatter = {
          title: post.title,
          date: post.date,
          categories: post.categories,
          tags: post.tags,
          description: post.excerpt,
          ...(post.coverImage && { image: post.coverImage })
        };
        
        // 手动构建文件内容，包括前置元数据和内容
        let fileContent = '---\n';
        for (const [key, value] of Object.entries(frontMatter)) {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              fileContent += `${key}:\n`;
              for (const item of value) {
                fileContent += `  - "${item}"\n`;
              }
            } else if (typeof value === 'string') {
              // 处理字符串值，确保添加引号
              fileContent += `${key}: "${value}"\n`;
            } else {
              // 处理其他类型值
              fileContent += `${key}: ${value}\n`;
            }
          }
        }
        fileContent += '---\n\n';
        fileContent += post.content;
        
        // 写入文件
        fs.writeFileSync(filePath, fileContent, 'utf-8');
        
        processed++;
      } catch (error) {
        console.error(`[同步服务] 处理文章 ${post.slug} 失败:`, error);
        errors++;
      }
    }
    
    console.log(`[同步服务] 同步到本地文件系统完成, 处理: ${processed}, 错误: ${errors}`);
    
    return {
      success: true,
      processed,
      errors
    };
  } catch (error) {
    console.error('[同步服务] 同步到本地文件系统失败:', error);
    return {
      success: false,
      processed: 0,
      errors: 1
    };
  }
}

// 双向同步
export async function syncBidirectional(): Promise<{
  success: boolean;
  toGitHub: { processed: number; errors: number; };
  fromGitHub: { processed: number; errors: number; };
}> {
  console.log('[同步服务] 开始双向同步...');
  
  try {
    // 首先从GitHub同步到数据库
    const fromGitHubResult = await syncFromGitHub();
    
    // 如果从GitHub同步有大量错误，也尝试从本地同步
    if (!fromGitHubResult.success || fromGitHubResult.errors > fromGitHubResult.processed) {
      console.log('[同步服务] 从GitHub同步不理想，尝试从本地文件系统同步...');
      await syncFromLocal();
    }
    
    // 然后从数据库同步到GitHub
    const toGitHubResult = await syncToGitHub();
    
    // 同步到本地文件系统（作为备份）
    await syncToLocal();
    
    return {
      success: fromGitHubResult.success && toGitHubResult.success,
      fromGitHub: {
        processed: fromGitHubResult.processed,
        errors: fromGitHubResult.errors
      },
      toGitHub: {
        processed: toGitHubResult.processed,
        errors: toGitHubResult.errors
      }
    };
  } catch (error) {
    console.error('[同步服务] 双向同步失败:', error);
    
    return {
      success: false,
      fromGitHub: { processed: 0, errors: 1 },
      toGitHub: { processed: 0, errors: 1 }
    };
  }
}

// 当有文章变更时，将其添加到同步队列
export async function queuePostChange(
  operation: SyncOperation,
  post: Post
): Promise<string> {
  const path = post.metadata?.originalFile || `content/posts/${post.categories[0]}/${post.slug}.md`;
  return addToSyncQueue(operation, post.slug, path);
}

// 初始化同步服务
export async function initializeSync(): Promise<boolean> {
  try {
    ensureSyncQueueTable();
    
    const db = getDb();
    // 检查同步状态表是否存在
    const syncStatus = db.prepare('SELECT * FROM sync_status WHERE id = 1').get();
    if (!syncStatus) {
      db.prepare('INSERT INTO sync_status (id, last_sync_time, sync_in_progress) VALUES (1, NULL, 0)').run();
    }
    
    return true;
  } catch (error) {
    console.error('[同步服务] 初始化同步服务失败:', error);
    return false;
  }
}

// 初始化文件，创建一个标记文件表示已初始化
export async function createInitialFlag(): Promise<boolean> {
  try {
    const flagPath = path.join(contentBasePath, '.initialized');
    if (!fs.existsSync(flagPath)) {
      // 创建内容目录
      if (!fs.existsSync(contentBasePath)) {
        fs.mkdirSync(contentBasePath, { recursive: true });
      }
      
      // 创建posts目录
      const postsPath = path.join(contentBasePath, 'posts');
      if (!fs.existsSync(postsPath)) {
        fs.mkdirSync(postsPath, { recursive: true });
      }
      
      // 创建初始化标记文件
      fs.writeFileSync(flagPath, new Date().toISOString(), 'utf-8');
      console.log(`[同步服务] 创建初始化标记文件: ${flagPath}`);
    }
    return true;
  } catch (error) {
    console.error('[同步服务] 创建初始化标记文件失败:', error);
    return false;
  }
} 