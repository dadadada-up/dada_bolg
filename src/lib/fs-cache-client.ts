import { Post } from '@/types/post';

// 客户端安全版本的缓存函数
// 这些函数将通过API端点操作缓存，而不是直接使用文件系统

export async function getCacheStats(namespace: string = 'default'): Promise<{
  count: number;
  size: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  try {
    const res = await fetch('/api/cache/status');
    if (res.ok) {
      const data = await res.json();
      if (namespace === 'github-posts') return data.cacheStats.posts;
      if (namespace === 'github-content') return data.cacheStats.content;
      if (namespace === 'github-tree') return data.cacheStats.tree;
    }
  } catch (error) {
    console.error(`[Client Cache] 获取缓存状态失败: ${error}`);
  }
  
  // 默认返回空状态
  return {
    count: 0,
    size: 0,
    oldestTimestamp: null,
    newestTimestamp: null
  };
}

export async function setCachedPosts(posts: Post[]): Promise<boolean> {
  console.warn('[Client Cache] setCachedPosts 在客户端不可用');
  return false;
}

export async function getCachedPosts(): Promise<{ data: Post[]; timestamp: number } | null> {
  console.warn('[Client Cache] getCachedPosts 在客户端不可用');
  return null;
}

export async function setCachedContent(
  path: string,
  content: string
): Promise<boolean> {
  console.warn('[Client Cache] setCachedContent 在客户端不可用');
  return false;
}

export async function getCachedContent(
  path: string
): Promise<{ data: string; timestamp: number } | null> {
  console.warn('[Client Cache] getCachedContent 在客户端不可用');
  return null;
}

export async function setCachedTreeData(
  treeData: any
): Promise<boolean> {
  console.warn('[Client Cache] setCachedTreeData 在客户端不可用');
  return false;
}

export async function getCachedTreeData(): Promise<{ data: any; timestamp: number } | null> {
  console.warn('[Client Cache] getCachedTreeData 在客户端不可用');
  return null;
}

export async function clearCache(namespace: string): Promise<boolean> {
  try {
    const res = await fetch('/api/cache/clear', {
      method: 'POST'
    });
    return res.ok;
  } catch (error) {
    console.error(`[Client Cache] 清除缓存失败: ${error}`);
    return false;
  }
}

export async function clearAllGithubCache(): Promise<boolean> {
  return clearCache('all');
}

export async function setCacheItem<T>(
  key: string,
  data: T,
  namespace: string = 'default'
): Promise<boolean> {
  console.warn('[Client Cache] setCacheItem 在客户端不可用');
  return false;
}

export async function getCacheItem<T>(
  key: string,
  namespace: string = 'default'
): Promise<{ data: T; timestamp: number } | null> {
  console.warn('[Client Cache] getCacheItem 在客户端不可用');
  return null;
} 