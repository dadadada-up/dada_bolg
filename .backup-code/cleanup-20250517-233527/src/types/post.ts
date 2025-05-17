export interface Post {
  id?: number;              // 文章ID
  slug: string;             // URL友好的路径
  title: string;            // 文章标题
  
  // 内容字段
  content: string;          // Markdown内容
  contentHtml?: string;     // 渲染后的HTML内容
  excerpt?: string;         // 文章摘要
  description?: string;     // 文章描述
  
  // 状态字段 - 标准字段
  is_published?: boolean;   // 是否发布 (数据库标准字段)
  is_featured?: boolean;    // 是否推荐 (数据库标准字段)
  
  // 日期字段 - 标准字段
  created_at?: string;      // 创建日期 (数据库标准字段)
  updated_at?: string;      // 更新日期 (数据库标准字段)
  
  // 状态字段 - 兼容旧版 (已弃用，将移除)
  /** @deprecated 请使用 is_published */
  published?: boolean;      // 旧字段：是否发布
  /** @deprecated 请使用 is_featured */
  featured?: boolean;       // 旧字段：是否推荐
  /** @deprecated 请使用 is_yaml_valid */
  yamlValid?: boolean;      // 旧字段：YAML头信息是否有效
  /** @deprecated 请使用 is_manually_edited */
  manuallyEdited?: boolean; // 旧字段：是否手动编辑
  
  // 状态字段 - 前端友好别名
  isPublished?: boolean;    // 前端友好别名：是否发布
  isFeatured?: boolean;     // 前端友好别名：是否推荐
  isYamlValid?: boolean;    // 前端友好别名：YAML头信息是否有效
  isManuallyEdited?: boolean; // 前端友好别名：是否手动编辑
  
  // 媒体字段
  coverImage?: string;      // 封面图URL
  imageUrl?: string;        // 前端友好别名：封面图URL
  readingTime?: number;     // 阅读时间（分钟）
  
  // 日期字段 - 兼容旧版 (已弃用，将移除)
  /** @deprecated 请使用 created_at */
  date?: string;            // 旧字段：创建日期
  /** @deprecated 请使用 updated_at */
  updated?: string;         // 旧字段：更新日期
  
  // 日期字段 - 前端友好别名
  createdAt?: string;       // 前端友好别名：创建日期
  updatedAt?: string;       // 前端友好别名：更新日期
  publishedAt?: string;     // 发布日期
  
  // 分类和标签
  categories: string[];     // 分类名称
  categorySlugs?: string[]; // 分类别名
  displayCategories?: string[]; // 用于展示的中文分类名
  tags: string[];           // 标签
  
  // 源信息
  /** @deprecated 请使用 source_path */
  sourcePath?: string;      // 前端友好别名：源文件路径
  source_path?: string;     // 源文件路径
  yuqueUrl?: string;        // 语雀URL
  
  // 元数据
  metadata?: {
    wordCount: number;      // 字数统计
    readingTime: number;    // 阅读时间（分钟）
    originalFile?: string;  // 原始文件路径
    characterCount?: number; // 字符数统计
  };
  
  // 其他字段
  path?: string;            // 路径
  wordCount?: number;       // 字数统计（冗余）
  characterCount?: number;  // 字符数统计（冗余）
}

export interface Category {
  id?: number;              // 分类ID
  name: string;             // 分类名称
  slug: string;             // URL友好的路径
  description?: string;     // 分类描述
  parentId?: number;        // 父分类ID
  postCount: number;        // 文章数量
  createdAt?: string;       // 创建时间
  updatedAt?: string;       // 更新时间
}

export interface Tag {
  id?: number;              // 标签ID
  name: string;             // 标签名称
  slug: string;             // URL友好的路径
  postCount: number;        // 文章数量
  createdAt?: string;       // 创建时间
  updatedAt?: string;       // 更新时间
}

// 辅助函数：规范化Post对象，确保新旧字段都能被识别
export function normalizePost(post: Post): Post {
  return {
    ...post,
    // 优先使用标准数据库字段，然后是前端别名，最后是旧字段
    is_published: post.is_published !== undefined ? post.is_published : 
                (post.isPublished !== undefined ? post.isPublished : post.published),
    is_featured: post.is_featured !== undefined ? post.is_featured : 
               (post.isFeatured !== undefined ? post.isFeatured : post.featured),
    
    created_at: post.created_at || post.createdAt || post.date,
    updated_at: post.updated_at || post.updatedAt || post.updated,
    
    // 向后兼容
    isPublished: post.is_published !== undefined ? post.is_published : 
               (post.isPublished !== undefined ? post.isPublished : post.published),
    isFeatured: post.is_featured !== undefined ? post.is_featured : 
              (post.isFeatured !== undefined ? post.isFeatured : post.featured),
    
    published: post.is_published !== undefined ? post.is_published : 
             (post.isPublished !== undefined ? post.isPublished : post.published),
    featured: post.is_featured !== undefined ? post.is_featured : 
            (post.isFeatured !== undefined ? post.isFeatured : post.featured),
    
    createdAt: post.created_at || post.createdAt || post.date,
    updatedAt: post.updated_at || post.updatedAt || post.updated,
    
    date: post.created_at || post.createdAt || post.date,
    updated: post.updated_at || post.updatedAt || post.updated,
    
    // 其他字段兼容
    isYamlValid: post.isYamlValid !== undefined ? post.isYamlValid : post.yamlValid,
    yamlValid: post.yamlValid !== undefined ? post.yamlValid : post.isYamlValid,
    
    isManuallyEdited: post.isManuallyEdited !== undefined ? post.isManuallyEdited : post.manuallyEdited,
    manuallyEdited: post.manuallyEdited !== undefined ? post.manuallyEdited : post.isManuallyEdited,
    
    imageUrl: post.imageUrl || post.coverImage,
    coverImage: post.coverImage || post.imageUrl,
    
    sourcePath: post.sourcePath || post.source_path,
    source_path: post.source_path || post.sourcePath
  };
}