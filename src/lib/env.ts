/**
 * 环境工具，帮助检测当前运行环境并提供相应的功能
 */

/**
 * 是否在Vercel环境中
 */
export const isVercel = process.env.IS_VERCEL === '1' || process.env.VERCEL === '1';

/**
 * 是否在构建时
 */
export const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined';

/**
 * 是否在Vercel构建时
 * 改进检测逻辑，确保在Vercel构建环境中能够准确识别
 */
export const isVercelBuild = (isVercel || process.env.VERCEL) && isBuildTime;

/**
 * 是否可以安全地使用fetch API
 * 在Vercel构建时可能无法访问API，应避免使用fetch
 */
export const canUseFetch = !isVercelBuild;

/**
 * 获取基础URL
 */
export function getBaseUrl(): string {
  if (isVercel) {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
}

/**
 * 安全的fetch函数，在构建时返回空数据
 * @param url 请求的URL
 * @param options fetch选项
 * @returns 响应或空数据
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  if (isVercelBuild) {
    console.warn(`[安全fetch] 在Vercel构建时跳过请求: ${url}`);
    // 返回一个模拟的Response对象，不会引发网络请求
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, totalPages: 0 }),
      text: async () => "{}",
    } as Response;
  }
  
  // 确保URL是绝对的
  const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
  console.log(`[安全fetch] 请求: ${fullUrl}`);
  
  // 执行实际的fetch请求
  return fetch(fullUrl, options);
} 