/**
 * 环境工具，帮助检测当前运行环境并提供相应的功能
 */

// 检查是否在Vercel环境中
export const isVercel = process.env.VERCEL === '1';

// 检查是否在构建时
export const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined';

// 检查是否在Vercel构建时
export const isVercelBuild = isVercel && isBuildTime;

/**
 * 是否可以安全地使用fetch API
 * 在Vercel构建时可能无法访问API，应避免使用fetch
 */
export const canUseFetch = !isVercelBuild;

/**
 * 获取基础URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://dada-blog.vercel.app';
}

/**
 * 安全的fetch函数，在构建时返回空数据
 * @param url 请求的URL
 * @param options fetch选项
 * @returns 响应或空数据
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  if (isVercelBuild) {
    // 在Vercel构建时返回空数据，避免网络请求
    console.warn(`[安全fetch] 跳过请求: ${url}`);
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, totalPages: 0 }),
      text: async () => "{}",
      headers: new Headers(),
    } as Response;
  }
  
  // 正常环境下执行fetch
  return fetch(url, options);
} 