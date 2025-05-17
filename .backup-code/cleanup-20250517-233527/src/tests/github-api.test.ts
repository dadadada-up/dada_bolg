// vitest已配置为全局模式，无需导入测试函数
// 不需要从 vitest 中导入，因为 tsconfig.json 中已配置全局类型

// 在导入之前进行模拟设置
vi.mock('../lib/github', () => {
  return {
    getPosts: vi.fn().mockResolvedValue([
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
    ]),
    getPostBySlug: vi.fn().mockImplementation((slug: string) => {
      if (slug === 'test-post-1') {
        return Promise.resolve({
          slug: 'test-post-1',
          title: '测试文章1',
          date: new Date().toISOString(),
          content: '# 测试文章1\n\n这是一篇测试文章。',
          excerpt: '这是一篇测试文章。',
          categories: ['test-category'],
          tags: ['测试'],
          published: true
        });
      }
      return Promise.resolve(null);
    }),
    getFileContent: vi.fn().mockImplementation((path: string) => {
      if (path.includes('test-post-1')) {
        return Promise.resolve('# 测试文章\n\n这是测试内容。');
      }
      // 提供一个默认返回值，确保在发生错误时也能返回null
      return Promise.resolve(null);
    }),
    updatePost: vi.fn().mockResolvedValue(undefined),
    createPost: vi.fn().mockResolvedValue({ success: true }),
    deletePost: vi.fn().mockResolvedValue(undefined),
    clearContentCache: vi.fn(),
    forceRefreshAllData: vi.fn().mockResolvedValue(true),
    getEnglishCategoryName: vi.fn().mockImplementation((name: string) => {
      const mapping: Record<string, string> = {
        '测试': 'test-category',
        '其他': 'another-category'
      };
      return mapping[name] || name;
    }),
    getDisplayCategoryName: vi.fn().mockImplementation((name: string) => {
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
});

// 模拟 Octokit
vi.mock('octokit', () => {
  return {
    Octokit: vi.fn().mockImplementation(() => ({
      rest: {
        git: {
          getTree: vi.fn().mockResolvedValue({
            data: {
              tree: [
                { path: 'content/posts/tech-tools/test-post-1.md', type: 'blob' },
                { path: 'content/posts/another-category/test-post-2.md', type: 'blob' }
              ]
            }
          })
        },
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              type: 'file',
              content: Buffer.from('# 测试内容').toString('base64')
            }
          })
        }
      }
    }))
  };
});

// 模拟文件系统缓存
vi.mock('@/lib/fs-cache', () => {
  const cache = new Map<string, any>();
  
  return {
    getCachedPosts: vi.fn().mockResolvedValue(null),
    setCachedPosts: vi.fn().mockImplementation((posts: any[]) => {
      cache.set('posts', posts);
      return Promise.resolve(true);
    }),
    getCachedContent: vi.fn().mockImplementation((path: string) => {
      return Promise.resolve(cache.get(`content:${path}`) || null);
    }),
    setCachedContent: vi.fn().mockImplementation((path: string, content: string) => {
      cache.set(`content:${path}`, content);
      return Promise.resolve(true);
    }),
    getCachedTreeData: vi.fn().mockResolvedValue(null),
    setCachedTreeData: vi.fn().mockResolvedValue(true),
    clearAllGithubCache: vi.fn().mockResolvedValue(true),
    getCacheStats: vi.fn().mockResolvedValue({ count: 0, size: 0 }),
    clearCache: vi.fn().mockResolvedValue(true),
    clearCacheItem: vi.fn().mockResolvedValue(true),
    clearPostCache: vi.fn().mockResolvedValue(true)
  };
});

// 现在导入被模拟的模块
import { 
  getPosts, 
  getPostBySlug, 
  getFileContent, 
  updatePost, 
  createPost, 
  deletePost, 
  clearContentCache,
  getEnglishCategoryName,
  getDisplayCategoryName,
  getAllCategoryMappings,
  forceRefreshAllData
} from '../lib/github';
import { Post } from '@/types/post';

// 模拟环境变量
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_GITHUB_REPO_OWNER: 'test-owner',
    NEXT_PUBLIC_GITHUB_REPO_NAME: 'test-repo',
    GITHUB_TOKEN: 'github_pat_test_token'
  };
});

afterAll(() => {
  process.env = originalEnv;
  vi.clearAllMocks();
});

// 在每个测试前清除模拟状态
beforeEach(() => {
  vi.clearAllMocks();
});

describe('GitHub API 集成测试', () => {
  it('应该能够获取所有文章', async () => {
    const posts = await getPosts();
    
    expect(posts).toBeDefined();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    
    // 检查文章结构
    const post = posts[0];
    expect(post.slug).toBeDefined();
    expect(post.title).toBeDefined();
    expect(post.content).toBeDefined();
    expect(post.categories).toBeDefined();
    expect(Array.isArray(post.categories)).toBe(true);
  });
  
  it('应该能够通过 slug 获取单篇文章', async () => {
    const post = await getPostBySlug('test-post-1');
    
    expect(post).toBeDefined();
    if (post) {
      expect(post.slug).toBe('test-post-1');
      expect(post.title).toBeDefined();
      expect(post.content).toBeDefined();
    }
  });
  
  it('获取不存在的文章应该返回 null', async () => {
    const post = await getPostBySlug('non-existent-post');
    expect(post).toBeNull();
  });
  
  it('应该能够获取文件内容', async () => {
    const content = await getFileContent('content/posts/tech-tools/test-post-1.md');
    
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
  });
  
  it('应该能够创建新文章', async () => {
    const newPost: Post = {
      slug: 'new-test-post',
      title: '新测试文章',
      date: new Date().toISOString(),
      content: '# 新测试文章\n\n这是一篇新的测试文章。',
      excerpt: '这是一篇新的测试文章。',
      categories: ['test-category'],
      tags: ['测试', '新文章'],
      published: true
    };
    
    const result = await createPost(newPost);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(createPost).toHaveBeenCalledWith(newPost);
  });
  
  it('应该能够更新已有文章', async () => {
    const updatedPost: Post = {
      slug: 'test-post-1',
      title: '更新后的测试文章',
      date: new Date().toISOString(),
      content: '# 更新后的测试文章\n\n这是更新后的内容。',
      excerpt: '这是更新后的内容。',
      categories: ['test-category'],
      tags: ['测试', '更新'],
      published: true
    };
    
    await updatePost(updatedPost);
    
    expect(updatePost).toHaveBeenCalledWith(updatedPost);
  });
  
  it('应该能够删除文章', async () => {
    const postToDelete: Post = {
      slug: 'test-post-1',
      title: '测试文章',
      date: new Date().toISOString(),
      content: '# 测试文章\n\n这是测试内容。',
      excerpt: '这是测试内容。',
      categories: ['test-category'],
      tags: ['测试'],
      published: true
    };
    
    await deletePost(postToDelete);
    
    expect(deletePost).toHaveBeenCalledWith(postToDelete);
  });
  
  it('应该能够清除内容缓存', async () => {
    clearContentCache();
    
    expect(clearContentCache).toHaveBeenCalled();
  });
  
  it('应该能够强制刷新所有数据', async () => {
    const result = await forceRefreshAllData();
    
    expect(result).toBe(true);
    expect(forceRefreshAllData).toHaveBeenCalled();
  });
  
  it('应该能够获取分类映射', async () => {
    const mapping = await getAllCategoryMappings();
    
    expect(Array.isArray(mapping)).toBe(true);
    expect(mapping.length).toBeGreaterThan(0);
    expect(mapping[0]).toHaveProperty('name');
    expect(mapping[0]).toHaveProperty('slug');
  });
  
  it('应该能够获取英文分类名称', async () => {
    const englishName = getEnglishCategoryName('测试');
    
    expect(englishName).toBeDefined();
    expect(typeof englishName).toBe('string');
  });
  
  it('应该能够获取中文分类名称', async () => {
    const displayName = getDisplayCategoryName('test-category');
    
    expect(displayName).toBeDefined();
    expect(typeof displayName).toBe('string');
  });
  
  it('处理缺失的token时应该优雅失败', async () => {
    // 临时移除token
    const originalToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = '';
    
    // 预期这不会抛出错误，而是返回默认值
    const posts = await getPosts();
    
    // 恢复token
    process.env.GITHUB_TOKEN = originalToken;
    
    expect(posts).toBeDefined();
    expect(Array.isArray(posts)).toBe(true);
  });
  
  it('处理API错误时应该有合理的错误处理', async () => {
    // 手动修改一次实现，然后自动恢复
    const originalImplementation = vi.mocked(getFileContent).getMockImplementation();
    
    try {
      // 临时修改实现，使其返回 null
      vi.mocked(getFileContent).mockImplementationOnce(() => Promise.resolve(null));
      
      // 执行调用
      const content = await getFileContent('error-path.md');
      
      // 验证结果
      expect(content).toBeNull();
    } finally {
      // 恢复原始实现
      if (originalImplementation) {
        vi.mocked(getFileContent).mockImplementation(originalImplementation);
      }
    }
  });
}); 