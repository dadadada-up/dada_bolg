/**
 * API路由配置
 * 提供通用的API路由配置和辅助函数
 */

import { isVercelEnv } from '@/lib/db/env-config';

// 强制动态路由，防止静态生成
export const dynamicConfig = {
  dynamic: 'force-dynamic',
  revalidate: 0
};

/**
 * 安全地获取查询参数
 * @param request 请求对象
 * @param key 参数名
 * @param defaultValue 默认值
 */
export function getQueryParam(request: Request, key: string, defaultValue: string = ''): string {
  try {
    const url = new URL(request.url);
    return url.searchParams.get(key) || defaultValue;
  } catch (error) {
    console.error(`[API] 获取查询参数 ${key} 失败:`, error);
    return defaultValue;
  }
}

/**
 * 安全地获取数字查询参数
 * @param request 请求对象
 * @param key 参数名
 * @param defaultValue 默认值
 */
export function getNumberQueryParam(request: Request, key: string, defaultValue: number = 0): number {
  const value = getQueryParam(request, key, String(defaultValue));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 安全地获取布尔查询参数
 * @param request 请求对象
 * @param key 参数名
 * @param defaultValue 默认值
 */
export function getBooleanQueryParam(request: Request, key: string, defaultValue: boolean = false): boolean {
  const value = getQueryParam(request, key, String(defaultValue));
  return value === 'true' || value === '1';
}

/**
 * 创建JSON响应
 * @param data 响应数据
 * @param status 状态码
 */
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

/**
 * 创建错误响应
 * @param message 错误消息
 * @param status 状态码
 */
export function errorResponse(message: string, status: number = 500): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * 处理API异常
 * @param error 错误对象
 */
export function handleApiError(error: any): Response {
  console.error('[API] 错误:', error);
  const message = error instanceof Error ? error.message : String(error);
  return errorResponse(message);
}

/**
 * 检查是否应该返回Vercel环境的模拟数据
 * @param routeName API路由名称，用于日志记录
 * @returns 如果在Vercel环境中，返回true
 */
export function shouldUseMockData(routeName: string = 'API'): boolean {
  if (isVercelEnv) {
    console.log(`[${routeName}] 检测到Vercel环境，将返回模拟数据`);
    return true;
  }
  return false;
} 