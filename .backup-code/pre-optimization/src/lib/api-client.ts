import useSWR from 'swr';
import { Post } from '@/types/post';
import { 
  getEnglishCategoryName 
} from './github-client';
import { 
  updatePost as clientUpdatePost, 
  createPost as clientCreatePost,
  deletePost as clientDeletePost
} from './client-api';
import { queuePostChange } from '@/lib/sync/service';

// 缓存时间（毫秒），增加到30分钟以提高性能
const CACHE_TTL = 1000 * 60 * 30;
// 重新验证时间（毫秒），5分钟检查一次数据更新
const REVALIDATE_INTERVAL = 1000 * 60 * 5;

// 默认的fetcher函数
const defaultFetcher = async (url: string) => {
  try {
    console.log(`[API] 发起请求: ${url}`);
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache', // 避免浏览器缓存
      }
    });
    
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        errorData = { error: `无法解析错误响应: ${e}` };
      }
      
      // 创建增强的错误对象
      const error = new Error(errorData.error || `API请求失败: ${res.status}`);
      (error as any).status = res.status;
      (error as any).info = errorData;
      console.error(`[API] 请求失败: ${url}`, error);
      throw error;
    }
    
    return res.json();
  } catch (error) {
    console.error('[API] 请求失败:', error);
    if (!(error instanceof Error)) {
      const wrappedError = new Error(`未知错误: ${error}`);
      throw wrappedError;
    }
    throw error;
  }
};

// 获取所有文章列表（带缓存）
export function useAllPosts(limit: number = 100) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/posts-new?limit=${limit}`, 
    defaultFetcher,
    {
      revalidateOnFocus: false, // 页面聚焦时不重新验证
      revalidateOnReconnect: true, // 网络重连时验证
      dedupingInterval: 5000, // 5秒内的重复请求会被去重
      focusThrottleInterval: 10000, // 页面聚焦事件的节流
      loadingTimeout: 10000, // 10秒超时
      errorRetryCount: 3,  // 错误重试3次
      errorRetryInterval: 5000, // 错误重试间隔5秒
      refreshInterval: REVALIDATE_INTERVAL, // 定期检查更新
      refreshWhenHidden: false, // 页面隐藏时不刷新
      refreshWhenOffline: false, // 离线时不刷新
      shouldRetryOnError: true, // 错误时重试
      suspense: false, // 不使用Suspense
    }
  );

  return {
    posts: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isValidating, // 添加验证状态
    isError: error,
    refresh: mutate, // 提供刷新函数用于手动重新获取数据
    isEmpty: data && (!data.data || data.data.length === 0),
  };
}

// 获取单篇文章
export function usePost(slug: string) {
  const { data, error, isLoading, mutate } = useSWR<Post>(
    slug ? `/api/posts-new/${slug}` : null,
    async (url) => {
      // 添加时间戳和nocache参数避免缓存
      const finalUrl = `${url}?nocache=true&t=${Date.now()}`;
      const response = await fetch(finalUrl, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error(`获取文章失败: ${response.status}`);
      }
      
      return response.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5秒内只请求一次
      focusThrottleInterval: 10000,
      errorRetryCount: 3  // 错误时最多重试3次
    }
  );

  // 封装刷新函数，清除缓存后重新获取
  const refresh = async () => {
    try {
      // 首先清除服务器端缓存
      await fetch('/api/cache/clear', { method: 'POST' });
      // 然后强制SWR重新获取数据
      return mutate();
    } catch (error) {
      console.error("刷新文章数据失败:", error);
      // 即使缓存清除失败，也尝试重新获取数据
      return mutate();
    }
  };

  return {
    post: data,
    isLoading,
    isError: error,
    refresh
  };
}

// 创建新文章 - 使用新的客户端API
export async function createPost(postData: Post) {
  try {
    // 先清除缓存，确保之前没有相关数据
    await fetch('/api/cache/clear', { method: 'POST' });
    
    const response = await fetch('/api/posts-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `创建文章失败: ${response.status}`);
    }

    const result = await response.json();
    
    // 创建成功后，再次清除缓存以确保新内容可见
    await fetch('/api/cache/clear', { method: 'POST' });
    
    // 成功后在后台触发同步到GitHub
    fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'to-github' })
    }).catch(err => {
      console.error('触发同步失败:', err);
    });
    
    return result;
  } catch (error) {
    console.error('创建文章失败:', error);
    throw error;
  }
}

// 更新文章 - 使用新的客户端API
export async function updatePost(slug: string, postData: Post) {
  try {
    // 先清除缓存
    await fetch('/api/cache/clear', { method: 'POST' });
    
    const response = await fetch(`/api/posts-new/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `更新文章失败: ${response.status}`);
    }

    const result = await response.json();
    
    // 更新成功后，再次清除缓存
    await fetch('/api/cache/clear', { method: 'POST' });
    
    // 成功后在后台触发同步到GitHub
    fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'to-github' })
    }).catch(err => {
      console.error('触发同步失败:', err);
    });
    
    return result;
  } catch (error) {
    console.error(`更新文章失败 ${slug}:`, error);
    throw error;
  }
}

// 删除文章 - 使用新的客户端API
export async function deletePost(slug: string) {
  try {
    // 先清除缓存
    await fetch('/api/cache/clear', { method: 'POST' });
    
    const response = await fetch(`/api/posts-new/${slug}`, {
      method: 'DELETE',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `删除文章失败: ${response.status}`);
    }

    const result = await response.json();
    
    // 删除成功后，尝试调用永久删除API
    try {
      console.log(`尝试永久删除文章文件: ${slug}`);
      const permanentResponse = await fetch(`/api/posts-new/delete-permanent/${slug}`, {
        method: 'POST',
        cache: 'no-store'
      });
      
      if (permanentResponse.ok) {
        const permanentResult = await permanentResponse.json();
        console.log('永久删除结果:', permanentResult);
      } else {
        console.error('永久删除API调用失败:', await permanentResponse.text());
      }
    } catch (permanentError) {
      console.error('调用永久删除API失败:', permanentError);
    }
    
    // 删除成功后，再次清除缓存
    await fetch('/api/cache/clear', { method: 'POST' });
    
    // 成功后在后台触发同步到GitHub
    fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'to-github' })
    }).catch(err => {
      console.error('触发同步失败:', err);
    });
    
    return result;
  } catch (error) {
    console.error(`删除文章失败 ${slug}:`, error);
    throw error;
  }
} 