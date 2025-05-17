/**
 * 性能优化工具
 * 
 * 此文件包含性能优化相关的工具函数，用于优化数据获取、缓存管理和性能监控
 */

import { clearAllGithubCache, getCacheStats, clearCacheItem, clearCache } from '@/lib/cache/fs-cache';

// 性能指标记录器
interface PerformanceMetric {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  error?: any;
}

// 全局性能指标存储
const performanceMetrics: PerformanceMetric[] = [];

/**
 * 记录操作的性能指标
 */
export function startPerformanceTracking(operationName: string): string {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  performanceMetrics.push({
    operationName,
    startTime: performance.now(),
    status: 'pending'
  });
  return id;
}

/**
 * 完成性能指标记录
 */
export function endPerformanceTracking(operationName: string, status: 'success' | 'error' = 'success', error?: any): number {
  const endTime = performance.now();
  const metric = performanceMetrics.find(m => 
    m.operationName === operationName && m.status === 'pending'
  );
  
  if (metric) {
    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;
    metric.status = status;
    if (error) metric.error = error;
    return metric.duration;
  }
  
  return 0;
}

/**
 * 获取性能指标报告
 */
export function getPerformanceReport(): Array<{
  operationName: string;
  duration: number;
  status: 'success' | 'error' | 'pending';
}> {
  return performanceMetrics
    .filter(m => m.duration !== undefined)
    .map(m => ({
      operationName: m.operationName,
      duration: m.duration || 0,
      status: m.status
    }))
    .sort((a, b) => b.duration - a.duration); // 按耗时降序排列
}

/**
 * 智能缓存优化器
 * 根据访问模式和常用数据自动优化缓存
 */
export async function optimizeCaches(): Promise<{
  success: boolean;
  optimizedItems: number;
  report: string;
}> {
  try {
    const trackingId = startPerformanceTracking('optimizeCaches');
    
    // 获取当前缓存状态
    const postsStats = await getCacheStats('github-posts');
    const contentStats = await getCacheStats('github-content');
    
    // 清除过期的缓存项
    let optimizedItems = 0;
    
    // 检查文章列表缓存是否过大或过旧
    if (postsStats.size > 5 * 1024 * 1024 || // 5MB
        (postsStats.oldestTimestamp && 
         Date.now() - postsStats.oldestTimestamp > 24 * 60 * 60 * 1000)) {
      await clearCache('github-posts');
      optimizedItems++;
    }
    
    // 如果内容缓存项太多，保留最近使用的100个
    if (contentStats.count > 100) {
      // 实际实现中需要遍历并按时间戳排序后删除旧项
      // 这里简化处理，如果超过100项就清除所有
      await clearCache('github-content');
      optimizedItems++;
    }
    
    // 结束性能跟踪
    const duration = endPerformanceTracking('optimizeCaches', 'success');
    
    return {
      success: true,
      optimizedItems,
      report: `缓存优化完成，处理了${optimizedItems}个优化项，耗时${duration.toFixed(2)}ms`
    };
  } catch (error) {
    endPerformanceTracking('optimizeCaches', 'error', error);
    console.error('缓存优化失败:', error);
    return {
      success: false,
      optimizedItems: 0,
      report: `缓存优化失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 预热指定文章的缓存
 * 提前加载数据以提升用户体验
 */
export async function preloadPostContent(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/posts-new/${slug}?t=${Date.now()}`);
    if (response.ok) {
      // 预加载成功，数据已经被缓存
      return true;
    }
    return false;
  } catch (error) {
    console.error(`预热文章缓存失败 (${slug}):`, error);
    return false;
  }
}

/**
 * 预热首页数据
 */
export async function preloadHomePageData(): Promise<boolean> {
  try {
    const trackingId = startPerformanceTracking('preloadHomePageData');
    
    // 并行预加载多个数据源
    await Promise.all([
      fetch('/api/posts-new?limit=10'),
      fetch('/api/categories-new'),
      fetch('/api/tags')
    ]);
    
    endPerformanceTracking('preloadHomePageData', 'success');
    return true;
  } catch (error) {
    endPerformanceTracking('preloadHomePageData', 'error', error);
    console.error('预热首页缓存失败:', error);
    return false;
  }
}

/**
 * 监控API调用性能
 */
export async function fetchWithPerformanceTracking(
  url: string, 
  options?: RequestInit
): Promise<Response> {
  const operationName = `fetch:${url.split('?')[0]}`;
  const trackingId = startPerformanceTracking(operationName);
  
  try {
    const response = await fetch(url, options);
    endPerformanceTracking(operationName, response.ok ? 'success' : 'error');
    return response;
  } catch (error) {
    endPerformanceTracking(operationName, 'error', error);
    throw error;
  }
}

export default {
  startPerformanceTracking,
  endPerformanceTracking,
  getPerformanceReport,
  optimizeCaches,
  preloadPostContent,
  preloadHomePageData,
  fetchWithPerformanceTracking
}; 