// 导出所有数据库存储库

// 导出文章存储库
import * as postRepository from './posts';

// 导出分类存储库
import * as categoryRepository from './categories';

// 导出标签存储库
import * as tagRepository from './tags';

export {
  postRepository,
  categoryRepository,
  tagRepository
}; 