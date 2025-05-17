import { Post } from '@/types/post';

// 分类映射
export const categoryMappings: Record<string, string> = {
  "product-management": "产品管理",
  "tech-tools": "技术工具",
  "family-life": "家庭生活",
  "insurance": "保险",
  "finance": "金融",
  "open-source": "开源",
  "personal-blog": "个人博客",
  "reading": "读书笔记"
};

// 英文到中文的转换函数
export function getDisplayCategoryName(englishName: string): string {
  return categoryMappings[englishName] || englishName;
}

// 中文到英文的转换函数
export function getEnglishCategoryName(chineseName: string): string {
  const entry = Object.entries(categoryMappings).find(([_, value]) => value === chineseName);
  return entry ? entry[0] : chineseName;
}

// 获取所有中英文分类映射
export function getAllCategoryMappings(): Array<{name: string, slug: string}> {
  return Object.entries(categoryMappings).map(([slug, name]) => ({
    slug,
    name
  }));
}

// 增强文章对象，添加displayCategories中文分类名
export function enhancePostCategories(post: Post): Post {
  if (!post.categories || post.categories.length === 0) {
    return post;
  }
  
  // 创建一个新的文章对象，避免修改原对象
  return {
    ...post,
    displayCategories: post.categories.map(category => getDisplayCategoryName(category))
  };
}

// 客户端版本的API函数，通过API调用获取数据
export async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch('/api/posts-new');
    if (!response.ok) {
      throw new Error('获取文章列表失败');
    }
    const data = await response.json();
    // 为每篇文章添加中文分类名
    return (data.data || []).map(enhancePostCategories);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(`/api/posts-new/${slug}`);
    if (!response.ok) {
      return null;
    }
    const post = await response.json();
    // 添加中文分类名
    return enhancePostCategories(post);
  } catch (error) {
    console.error(`获取文章 ${slug} 失败:`, error);
    return null;
  }
}

export function clearContentCache() {
  return fetch('/api/cache/clear', {
    method: 'POST'
  }).then(res => res.ok).catch(() => false);
} 