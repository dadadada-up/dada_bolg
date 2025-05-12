import { Post } from '@/types/post';
import { vi } from 'vitest';

/**
 * GitHub API 模拟数据
 */
export const mockPosts: Post[] = [
  {
    slug: 'test-post-1',
    title: '测试文章1',
    date: new Date().toISOString(),
    content: '# 测试文章1\n\n这是一篇测试文章。',
    excerpt: '这是一篇测试文章。',
    categories: ['test-category'],
    tags: ['测试', '示例'],
    published: true
  },
  {
    slug: 'test-post-2',
    title: '测试文章2',
    date: new Date().toISOString(),
    content: '# 测试文章2\n\n这是另一篇测试文章。',
    excerpt: '这是另一篇测试文章。',
    categories: ['another-category'],
    tags: ['测试', '示例', '其他'],
    published: true
  }
];

/**
 * 创建模拟的GitHub模块
 */
export function createMockGithubModule() {
  return {
    getPosts: vi.fn().mockResolvedValue(mockPosts),
    getPostBySlug: vi.fn().mockImplementation((slug: string) => {
      const post = mockPosts.find(p => p.slug === slug);
      return Promise.resolve(post || null);
    }),
    updatePost: vi.fn().mockResolvedValue({ success: true }),
    createPost: vi.fn().mockResolvedValue({ success: true }),
    deletePost: vi.fn().mockResolvedValue({ success: true }),
    getContents: vi.fn().mockResolvedValue([
      { path: 'posts/test-category/test-post-1.md', type: 'file' },
      { path: 'posts/another-category/test-post-2.md', type: 'file' }
    ]),
    getFileContent: vi.fn().mockResolvedValue('# 测试内容\n\n这是从GitHub获取的测试内容。'),
    clearContentCache: vi.fn().mockResolvedValue(true),
    getEnglishCategoryName: vi.fn().mockImplementation(name => {
      const mapping: Record<string, string> = {
        '测试': 'test-category',
        '其他': 'another-category'
      };
      return mapping[name] || 'uncategorized';
    }),
    getDisplayCategoryName: vi.fn().mockImplementation(name => {
      const mapping: Record<string, string> = {
        'test-category': '测试',
        'another-category': '其他'
      };
      return mapping[name] || name;
    }),
    getAllCategoryMappings: vi.fn().mockReturnValue([
      { name: '测试', slug: 'test-category' },
      { name: '其他', slug: 'another-category' }
    ])
  };
}

/**
 * 模拟GitHub错误情况
 */
export function createErrorMockGithubModule() {
  return {
    getPosts: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    getPostBySlug: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    updatePost: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    createPost: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    deletePost: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    getContents: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    getFileContent: vi.fn().mockRejectedValue(new Error('GitHub API 错误')),
    clearContentCache: vi.fn().mockRejectedValue(new Error('缓存清除错误'))
  };
} 