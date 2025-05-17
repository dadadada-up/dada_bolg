import { Post } from '@/types/post';

/**
 * 数据服务接口定义
 */
export interface DataService {
  // 查询操作
  // ----------------------------
  
  // 获取所有文章
  getAllPosts(options?: {
    includeUnpublished?: boolean;
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
  }): Promise<{
    posts: Post[];
    total: number;
  }>;

  // 根据slug获取单篇文章
  getPostBySlug(slug: string): Promise<Post | null>;

  // 获取所有分类
  getCategories(): Promise<Array<{
    id?: string;
    name: string;
    slug: string;
    description?: string;
  }>>;

  // 获取所有标签
  getTags(): Promise<Array<{
    id?: string;
    name: string;
    slug: string;
  }>>;

  // 搜索文章
  searchPosts(query: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    posts: Post[];
    total: number;
  }>;
  
  // 修改操作
  // ----------------------------
  
  // 创建或更新文章
  savePost(post: Post): Promise<{ id: number; slug: string }>;
  
  // 更新文章发布状态
  updatePostStatus(id: number, isPublished: boolean): Promise<boolean>;
  
  // 更新文章特色状态
  updatePostFeatured(id: number, isFeatured: boolean): Promise<boolean>;
  
  // 删除文章
  deletePost(id: number): Promise<boolean>;
  
  // 创建或更新分类
  saveCategory(category: { 
    id?: string | number; 
    name: string; 
    slug: string; 
    description?: string 
  }): Promise<{ id: number; slug: string }>;
  
  // 删除分类
  deleteCategory(id: number): Promise<boolean>;
  
  // 创建或更新标签
  saveTag(tag: { 
    id?: string | number; 
    name: string; 
    slug: string 
  }): Promise<{ id: number; slug: string }>;
  
  // 删除标签
  deleteTag(id: number): Promise<boolean>;
  
  // 同步数据到SQLite
  syncToSQLite(): Promise<boolean>;
}

/**
 * 创建数据服务实例的工厂函数
 */
export function createDataService(): DataService; 