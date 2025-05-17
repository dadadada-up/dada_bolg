/**
 * 文件系统缓存 - Vercel环境中的简化版本
 * 
 * 提供与原始API兼容的空实现
 */

// 缓存的文章类型
interface CachedPost {
  slug: string;
  title: string;
  content: string;
  categories?: string[];
  tags?: string[];
  date?: string;
  // 其他字段...
}

// 获取缓存的文章列表
export async function getCachedPosts(): Promise<CachedPost[]> {
  console.log('[缓存] Vercel环境中不支持获取缓存文章');
  return [];
}

// 设置缓存的文章列表
export async function setCachedPosts(posts: CachedPost[]): Promise<void> {
  console.log('[缓存] Vercel环境中不支持设置缓存文章');
}

// 获取缓存的内容
export async function getCachedContent(path: string): Promise<string | null> {
  console.log(`[缓存] Vercel环境中不支持获取缓存内容: ${path}`);
  return null;
}

// 设置缓存的内容
export async function setCachedContent(path: string, content: string): Promise<void> {
  console.log(`[缓存] Vercel环境中不支持设置缓存内容: ${path}`);
}

// 获取缓存的树数据
export async function getCachedTreeData(): Promise<any> {
  console.log('[缓存] Vercel环境中不支持获取缓存树数据');
  return null;
}

// 设置缓存的树数据
export async function setCachedTreeData(data: any): Promise<void> {
  console.log('[缓存] Vercel环境中不支持设置缓存树数据');
}

// 清除所有GitHub缓存
export async function clearAllGithubCache(): Promise<boolean> {
  console.log('[缓存] Vercel环境中不支持清除GitHub缓存');
  return false;
}

// 获取缓存统计信息
export async function getCacheStats(): Promise<{
  postCacheExists: boolean;
  postCacheDate: string | null;
  contentCacheCount: number;
  treeCacheExists: boolean;
  treeCacheDate: string | null;
}> {
  console.log('[缓存] Vercel环境中不支持获取缓存统计');
  return {
    postCacheExists: false,
    postCacheDate: null,
    contentCacheCount: 0,
    treeCacheExists: false,
    treeCacheDate: null
  };
}

// 清除所有缓存
export async function clearCache(): Promise<boolean> {
  console.log('[缓存] Vercel环境中不支持清除缓存');
  return false;
}

// 清除指定缓存项
export async function clearCacheItem(cacheType: string): Promise<boolean> {
  console.log(`[缓存] Vercel环境中不支持清除指定缓存项: ${cacheType}`);
  return false;
}

// 清除文章缓存
export async function clearPostCache(): Promise<boolean> {
  console.log('[缓存] Vercel环境中不支持清除文章缓存');
  return false;
} 