/**
 * GitHub API缓存优化器
 * 用于优化GitHub API调用，减少请求次数，提高性能
 */

import { getCachedContent, setCachedContent } from "./fs-cache";

// 缓存配置
const MEMORY_CACHE_TTL = 1000 * 60 * 5; // 内存缓存5分钟
const FS_CACHE_TTL = 1000 * 60 * 60 * 24; // 文件系统缓存24小时

// 内存缓存
const memoryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * 批量预加载内容
 * @param paths 需要预加载的路径列表
 * @param fetchFunction 获取内容的函数
 */
export async function preloadContents<T>(
  paths: string[],
  fetchFunction: (path: string) => Promise<T>
): Promise<void> {
  // 过滤出未缓存的路径
  const uncachedPaths = paths.filter(path => !memoryCache.has(path));
  
  if (uncachedPaths.length === 0) return;
  
  // 并行获取内容
  const promises = uncachedPaths.map(async (path) => {
    try {
      // 先检查文件系统缓存
      const cachedContent = await getCachedContent(`github-content-${path}`);
      
      if (cachedContent) {
        // 更新内存缓存
        memoryCache.set(path, {
          data: cachedContent,
          timestamp: Date.now()
        });
        return;
      }
      
      // 获取内容
      const content = await fetchFunction(path);
      
      // 更新缓存
      memoryCache.set(path, {
        data: content,
        timestamp: Date.now()
      });
      
      // 更新文件系统缓存
      await setCachedContent(`github-content-${path}`, content, FS_CACHE_TTL);
    } catch (error) {
      console.error(`预加载内容失败: ${path}`, error);
    }
  });
  
  // 等待所有请求完成
  await Promise.allSettled(promises);
}

/**
 * 获取缓存的内容，如果缓存不存在则获取并缓存
 * @param key 缓存键
 * @param fetchFunction 获取内容的函数
 */
export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>
): Promise<T> {
  // 检查内存缓存
  const cachedItem = memoryCache.get(key);
  
  if (cachedItem && Date.now() - cachedItem.timestamp < MEMORY_CACHE_TTL) {
    return cachedItem.data as T;
  }
  
  // 检查文件系统缓存
  const cachedContent = await getCachedContent(`github-data-${key}`);
  
  if (cachedContent) {
    // 更新内存缓存
    memoryCache.set(key, {
      data: cachedContent,
      timestamp: Date.now()
    });
    return cachedContent as T;
  }
  
  // 获取新数据
  const data = await fetchFunction();
  
  // 更新缓存
  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // 更新文件系统缓存
  await setCachedContent(`github-data-${key}`, data, FS_CACHE_TTL);
  
  return data;
}

/**
 * 批量获取内容，优化并行请求
 * @param keys 需要获取的键列表
 * @param fetchFunction 获取单个内容的函数
 */
export async function batchGetContents<T>(
  keys: string[],
  fetchFunction: (key: string) => Promise<T>
): Promise<Record<string, T>> {
  // 创建结果对象
  const results: Record<string, T> = {};
  
  // 过滤出未缓存的键
  const uncachedKeys = keys.filter(key => !memoryCache.has(key));
  
  // 并行获取未缓存的内容
  if (uncachedKeys.length > 0) {
    const promises = uncachedKeys.map(async (key) => {
      try {
        // 先检查文件系统缓存
        const cachedContent = await getCachedContent(`github-content-${key}`);
        
        if (cachedContent) {
          results[key] = cachedContent as T;
          // 更新内存缓存
          memoryCache.set(key, {
            data: cachedContent,
            timestamp: Date.now()
          });
          return;
        }
        
        // 获取内容
        const content = await fetchFunction(key);
        results[key] = content;
        
        // 更新缓存
        memoryCache.set(key, {
          data: content,
          timestamp: Date.now()
        });
        
        // 更新文件系统缓存
        await setCachedContent(`github-content-${key}`, content, FS_CACHE_TTL);
      } catch (error) {
        console.error(`获取内容失败: ${key}`, error);
        results[key] = null as unknown as T;
      }
    });
    
    // 等待所有请求完成
    await Promise.allSettled(promises);
  }
  
  // 添加已缓存的内容
  for (const key of keys) {
    if (results[key] === undefined) {
      const cachedItem = memoryCache.get(key);
      if (cachedItem) {
        results[key] = cachedItem.data as T;
      }
    }
  }
  
  return results;
}

/**
 * 清除指定键的缓存
 * @param key 缓存键
 */
export function clearCache(key: string): void {
  memoryCache.delete(key);
  // 文件系统缓存会在下次获取时自动更新
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys())
  };
}