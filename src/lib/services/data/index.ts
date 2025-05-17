/**
 * 统一数据服务接口
 * 
 * 这个模块提供对数据库操作的统一抽象层，按照以下优先级尝试数据库连接：
 * 1. Turso云数据库
 * 2. 本地SQLite数据库
 * 
 * 如果所有数据库连接都失败，则直接抛出错误，不使用备用数据
 */

import { Post } from '@/types/post';
import { DataService } from './service';

// 单例模式的数据服务实例
let dataServiceInstance: DataService | null = null;

// 获取数据服务实例
export function getDataService(): DataService {
  if (!dataServiceInstance) {
    const { createDataService } = require('./service');
    dataServiceInstance = createDataService();
  }
  return dataServiceInstance;
}

// 为了便于使用，直接导出常用的数据访问方法
export async function getAllPosts(options?: {
  includeUnpublished?: boolean;
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
}): Promise<{
  posts: Post[];
  total: number;
}> {
  const service = getDataService();
  return service.getAllPosts(options);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const service = getDataService();
  return service.getPostBySlug(slug);
}

export async function getCategories(): Promise<Array<{
  id?: string;
  name: string;
  slug: string;
  description?: string;
}>> {
  const service = getDataService();
  return service.getCategories();
}

export async function getTags(): Promise<Array<{
  id?: string;
  name: string;
  slug: string;
}>> {
  const service = getDataService();
  return service.getTags();
}

// 搜索文章
export async function searchPosts(query: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  posts: Post[];
  total: number;
}> {
  const service = getDataService();
  return service.searchPosts(query, options);
}

// 重新导出数据服务类型
export type { DataService } from './service'; 