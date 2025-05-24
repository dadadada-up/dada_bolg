// 导出所有数据库存储库

// 导出文章存储库
import * as postRepository from './posts';

// 导出分类存储库
import * as categoryRepository from './categories';

// 导出标签存储库
import * as tagRepository from './tags';

// 导出数据库工具函数
import { getCurrentTimestamp } from '../database';

// 直接导出常用函数
export { getAllPosts, getPostBySlug, deletePost } from './posts';
export { getAllCategories, getCategoryBySlug } from './categories';
export { getAllTags, getTagBySlug } from './tags';

export {
  postRepository,
  categoryRepository,
  tagRepository,
  getCurrentTimestamp
}; 