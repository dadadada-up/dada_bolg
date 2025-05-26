/**
 * 统一数据服务接口
 * 
 * 这个模块提供对数据库操作的统一抽象层，使用Turso数据库
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

// 查询操作
// ----------------------------

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

// 修改操作
// ----------------------------

// 创建或更新文章
export async function savePost(post: Post): Promise<{ id: number; slug: string }> {
  const service = getDataService();
  return service.savePost(post);
}

// 更新文章发布状态
export async function updatePostStatus(id: number, isPublished: boolean): Promise<boolean> {
  const service = getDataService();
  return service.updatePostStatus(id, isPublished);
}

// 更新文章特色状态
export async function updatePostFeatured(id: number, isFeatured: boolean): Promise<boolean> {
  const service = getDataService();
  return service.updatePostFeatured(id, isFeatured);
}

// 删除文章
export async function deletePost(id: number): Promise<boolean> {
  const service = getDataService();
  return service.deletePost(id);
}

// 创建或更新分类
export async function saveCategory(category: {
  id?: string | number;
  name: string;
  slug: string;
  description?: string;
}): Promise<{ id: number; slug: string }> {
  const service = getDataService();
  return service.saveCategory(category);
}

// 删除分类
export async function deleteCategory(id: number): Promise<boolean> {
  const service = getDataService();
  return service.deleteCategory(id);
}

// 创建或更新标签
export async function saveTag(tag: {
  id?: string | number;
  name: string;
  slug: string;
}): Promise<{ id: number; slug: string }> {
  const service = getDataService();
  return service.saveTag(tag);
}

// 删除标签
export async function deleteTag(id: number): Promise<boolean> {
  const service = getDataService();
  return service.deleteTag(id);
}

// 保留向后兼容性，但已废弃
export async function syncToSQLite(): Promise<boolean> {
  console.log('syncToSQLite方法已废弃，项目现在只使用Turso数据库');
  return true;
}

// 重新导出数据服务类型
export type { DataService } from './service'; 