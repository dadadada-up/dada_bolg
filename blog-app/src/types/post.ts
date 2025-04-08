export interface Post {
  slug: string;             // URL友好的路径
  title: string;            // 文章标题
  content: string;          // Markdown内容
  html?: string;            // 渲染后的HTML（可选缓存）
  coverImage?: string | null; // 封面图URL
  excerpt?: string;         // 文章摘要
  date: string;             // 发布时间
  updated: string;          // 最后更新时间
  published: boolean;       // 是否发布
  featured?: boolean;       // 是否推荐
  categories: string[];     // 分类
  tags: string[];           // 标签
  metadata: {               // 元数据
    wordCount: number;      // 字数统计
    readingTime: number;    // 阅读时间（分钟）
    originalFile?: string;  // 原始文件路径
    [key: string]: any;     // 其他元数据
  };
  readingTime: number;
}

export interface Category {
  name: string;             // 分类名称
  slug: string;             // URL友好的路径
  description?: string;     // 分类描述
  parentCategory?: string;  // 父分类
  postCount: number;        // 文章数量
}

export interface Tag {
  name: string;             // 标签名称
  slug: string;             // URL友好的路径
  postCount: number;        // 文章数量
} 