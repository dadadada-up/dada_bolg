import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Post } from '@/types/post';

// 根据环境决定缓存目录
const CACHE_BASE_DIR = process.env.CACHE_DIR || '.cache';
// 默认过期时间 - 1小时（之前是24小时）
const DEFAULT_TTL = 1000 * 60 * 60;
// 针对不同类型数据的缓存时间
const POSTS_TTL = 1000 * 60 * 15; // 文章列表缓存15分钟
const TREE_TTL = 1000 * 60 * 60; // 目录树缓存1小时
const CONTENT_TTL = 1000 * 60 * 60 * 4; // 内容缓存4小时

// 确保缓存目录存在
function ensureCacheDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (error) {
      console.error(`[FS-Cache] 创建缓存目录失败: ${error}`);
      return false;
    }
  }
  return true;
}

// 从键生成文件名
function getFilePath(key: string, namespace: string = 'default'): string {
  // 使用 MD5 哈希确保文件名合法且唯一
  const hash = crypto.createHash('md5').update(key).digest('hex');
  const dirPath = path.join(CACHE_BASE_DIR, namespace);
  
  // 确保目录存在
  if (!ensureCacheDir(dirPath)) {
    return '';
  }
  
  return path.join(dirPath, `${hash}.json`);
}

// 设置缓存项
export async function setCacheItem<T>(
  key: string,
  data: T,
  namespace: string = 'default',
  ttl: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    const filePath = getFilePath(key, namespace);
    if (!filePath) return false;
    
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(cacheData, null, 2),
      'utf8'
    );
    
    return true;
  } catch (error) {
    console.error(`[FS-Cache] 写入缓存失败 (${namespace}/${key}): ${error}`);
    return false;
  }
}

// 获取缓存项
export async function getCacheItem<T>(
  key: string,
  namespace: string = 'default'
): Promise<{ data: T; timestamp: number } | null> {
  try {
    const filePath = getFilePath(key, namespace);
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    
    const rawData = await fs.promises.readFile(filePath, 'utf8');
    const cacheData = JSON.parse(rawData);
    
    // 检查是否过期
    if (cacheData.expiry < Date.now()) {
      // 异步删除过期文件，不等待完成
      fs.promises.unlink(filePath).catch(() => {});
      return null;
    }
    
    return {
      data: cacheData.data as T,
      timestamp: cacheData.timestamp
    };
  } catch (error) {
    console.error(`[FS-Cache] 读取缓存失败 (${namespace}/${key}): ${error}`);
    return null;
  }
}

// 缓存帖子列表的特化方法
export async function setCachedPosts(posts: Post[]): Promise<boolean> {
  return setCacheItem('all-posts', posts, 'github-posts', POSTS_TTL);
}

// 获取缓存的帖子列表的特化方法
export async function getCachedPosts(): Promise<{ data: Post[]; timestamp: number } | null> {
  return getCacheItem<Post[]>('all-posts', 'github-posts');
}

// 缓存单个文件内容
export async function setCachedContent(
  path: string,
  content: string,
  ttl: number = CONTENT_TTL
): Promise<boolean> {
  return setCacheItem(path, content, 'github-content', ttl);
}

// 获取缓存的文件内容
export async function getCachedContent(
  path: string
): Promise<{ data: string; timestamp: number } | null> {
  return getCacheItem<string>(path, 'github-content');
}

// 缓存仓库树数据
export async function setCachedTreeData(
  treeData: any
): Promise<boolean> {
  return setCacheItem('repo-tree', treeData, 'github-tree', TREE_TTL);
}

// 获取缓存的仓库树数据
export async function getCachedTreeData(): Promise<{ data: any; timestamp: number } | null> {
  return getCacheItem<any>('repo-tree', 'github-tree');
}

// 清除指定命名空间的所有缓存
export async function clearCache(namespace: string): Promise<boolean> {
  try {
    const dirPath = path.join(CACHE_BASE_DIR, namespace);
    if (!fs.existsSync(dirPath)) {
      return true; // 目录不存在视为成功
    }
    
    const files = await fs.promises.readdir(dirPath);
    
    // 并行删除所有文件
    await Promise.all(
      files.map(file => 
        fs.promises.unlink(path.join(dirPath, file))
          .catch(err => console.error(`[FS-Cache] 删除文件失败 ${file}: ${err}`))
      )
    );
    
    return true;
  } catch (error) {
    console.error(`[FS-Cache] 清除缓存失败 (${namespace}): ${error}`);
    return false;
  }
}

// 清除特定键的缓存
export async function clearCacheItem(key: string, namespace: string = 'default'): Promise<boolean> {
  try {
    const filePath = getFilePath(key, namespace);
    if (!filePath || !fs.existsSync(filePath)) {
      return true; // 文件不存在视为成功
    }
    
    await fs.promises.unlink(filePath);
    console.log(`[FS-Cache] 成功清除缓存项 (${namespace}/${key})`);
    return true;
  } catch (error) {
    console.error(`[FS-Cache] 清除缓存项失败 (${namespace}/${key}): ${error}`);
    return false;
  }
}

// 清除特定文章的缓存
export async function clearPostCache(slug: string): Promise<boolean> {
  try {
    // 尝试清除文章内容缓存，但保留文章列表缓存
    // 注意：这需要与文章路径生成逻辑匹配
    const contentPattern = new RegExp(`.*${slug}.*\\.md$`);
    const dirPath = path.join(CACHE_BASE_DIR, 'github-content');
    if (fs.existsSync(dirPath)) {
      const files = await fs.promises.readdir(dirPath);
      
      // 查找匹配的缓存文件
      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file);
          const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
          
          // 如果缓存的键包含文章的slug，清除该缓存
          if (data && data.key && contentPattern.test(data.key)) {
            await fs.promises.unlink(filePath);
            console.log(`[FS-Cache] 清除文章相关缓存: ${file}`);
          }
        } catch (err) {
          // 继续处理其他文件
          console.error(`[FS-Cache] 处理缓存文件失败 ${file}: ${err}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[FS-Cache] 清除文章缓存失败 (${slug}): ${error}`);
    return false;
  }
}

// 清除所有GitHub相关缓存
export async function clearAllGithubCache(): Promise<boolean> {
  try {
    const namespaces = ['github-posts', 'github-content', 'github-tree'];
    
    // 并行清除所有命名空间
    await Promise.all(
      namespaces.map(namespace => 
        clearCache(namespace)
          .catch(err => console.error(`[FS-Cache] 清除缓存失败 ${namespace}: ${err}`))
      )
    );
    
    return true;
  } catch (error) {
    console.error(`[FS-Cache] 清除所有GitHub缓存失败: ${error}`);
    return false;
  }
}

// 获取指定命名空间的缓存状态
export async function getCacheStats(namespace: string = 'default'): Promise<{
  count: number;
  size: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  try {
    const dirPath = path.join(CACHE_BASE_DIR, namespace);
    if (!fs.existsSync(dirPath)) {
      return {
        count: 0,
        size: 0,
        oldestTimestamp: null,
        newestTimestamp: null
      };
    }
    
    const files = await fs.promises.readdir(dirPath);
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    
    // 检查所有文件
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);
      
      totalSize += stats.size;
      
      try {
        const rawData = await fs.promises.readFile(filePath, 'utf8');
        const cacheData = JSON.parse(rawData);
        
        if (cacheData.timestamp < oldestTimestamp) {
          oldestTimestamp = cacheData.timestamp;
        }
        
        if (cacheData.timestamp > newestTimestamp) {
          newestTimestamp = cacheData.timestamp;
        }
      } catch (e) {
        // 忽略无法解析的文件
      }
    }
    
    return {
      count: files.length,
      size: totalSize,
      oldestTimestamp: oldestTimestamp === Infinity ? null : oldestTimestamp,
      newestTimestamp: newestTimestamp === 0 ? null : newestTimestamp
    };
  } catch (error) {
    console.error(`[FS-Cache] 获取缓存统计失败 (${namespace}): ${error}`);
    return {
      count: 0,
      size: 0,
      oldestTimestamp: null,
      newestTimestamp: null
    };
  }
} 