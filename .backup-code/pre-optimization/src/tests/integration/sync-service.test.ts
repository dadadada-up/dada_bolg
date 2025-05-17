import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { syncFromGitHub, syncToGitHub, addToSyncQueue, updateSyncItemStatus } from '@/lib/sync/service';
import { savePostSafe } from '@/lib/db/posts-patch'; // 导入修复版本
import { Post } from '@/types/post';
import path from 'path';
import fs from 'fs';
import { getDb, initDb, closeDb } from '@/lib/db';

// 设置测试数据库路径
const TEST_DB_DIR = path.join(process.cwd(), 'test-sync-data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test-sync-cache.db');

// 设置环境变量
process.env.DB_PATH = TEST_DB_PATH;

// 模拟GitHub模块
vi.mock('@/lib/github', () => {
  return {
    getPosts: vi.fn().mockImplementation(() => {
      // 返回模拟的文章数据
      return [
        {
          slug: 'github-post-1',
          title: 'GitHub文章1',
          date: new Date().toISOString(),
          content: '# GitHub文章1\n\n这是一篇来自GitHub的文章。',
          excerpt: '这是一篇来自GitHub的文章。',
          categories: ['github-category'],
          tags: ['github', '测试'],
          published: true
        },
        {
          slug: 'github-post-2',
          title: 'GitHub文章2',
          date: new Date().toISOString(),
          content: '# GitHub文章2\n\n这是另一篇来自GitHub的文章。',
          excerpt: '这是另一篇来自GitHub的文章。',
          categories: ['github-category'],
          tags: ['github', '测试'],
          published: true
        }
      ];
    }),
    updatePost: vi.fn().mockResolvedValue({ success: true }),
    createPost: vi.fn().mockResolvedValue({ success: true }),
    deletePost: vi.fn().mockResolvedValue({ success: true }),
    getPostBySlug: vi.fn().mockImplementation((slug: string) => {
      // 简单根据slug返回模拟数据
      if (slug === 'github-post-1') {
        return Promise.resolve({
          slug: 'github-post-1',
          title: 'GitHub文章1',
          date: new Date().toISOString(),
          content: '# GitHub文章1\n\n这是一篇来自GitHub的文章。',
          excerpt: '这是一篇来自GitHub的文章。',
          categories: ['github-category'],
          tags: ['github', '测试'],
          published: true
        });
      }
      return Promise.resolve(null);
    }),
    getContents: vi.fn().mockResolvedValue([]),
    clearContentCache: vi.fn().mockResolvedValue(true)
  };
});

// 模拟文件系统模块
vi.mock('fs', () => {
  // 保留原始模块的部分功能
  const originalFs = vi.importActual('fs');
  
  // 返回模拟对象
  return {
    ...originalFs,
    existsSync: vi.fn().mockImplementation((path: string) => {
      // 如果是检查测试目录，返回true
      if (path === TEST_DB_DIR) return true;
      
      // 其他情况交给原始实现
      return (originalFs as any).existsSync(path);
    }),
    // 其他可能需要模拟的方法...
  };
});

describe('同步服务集成测试', () => {
  // 在所有测试前初始化
  beforeAll(() => {
    // 确保测试目录存在
    if (!fs.existsSync(TEST_DB_DIR)) {
      fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    }
    
    // 初始化测试数据库
    initDb();
  });
  
  // 在所有测试后清理
  afterAll(() => {
    // 关闭数据库连接
    closeDb();
    
    // 删除测试数据库文件
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // 删除测试目录
    if (fs.existsSync(TEST_DB_DIR)) {
      try {
        fs.rmdirSync(TEST_DB_DIR);
      } catch (error) {
        console.error('删除测试目录失败:', error);
      }
    }
  });
  
  // 测试从GitHub同步
  it('应该成功从GitHub同步文章', async () => {
    // 执行同步
    const result = await syncFromGitHub();
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThan(0);
    expect(result.errors).toBe(0);
  });
  
  // 测试向GitHub同步
  it('应该成功向GitHub同步文章', async () => {
    // 创建文章
    const post: Post = {
      slug: 'local-post',
      title: '本地文章',
      date: new Date().toISOString(),
      content: '# 本地文章\n\n这是一篇本地文章，将被同步到GitHub。',
      excerpt: '这是一篇本地文章。',
      categories: ['local-category'],
      tags: ['本地', '测试'],
      published: true
    };
    
    // 保存文章并添加到同步队列
    savePostSafe(post);
    await addToSyncQueue('create', post.slug);
    
    // 执行同步
    const result = await syncToGitHub();
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThan(0);
  });
  
  // 测试处理同步中的错误
  it('应该能处理同步中的错误', async () => {
    // 创建一个同步项但不提供实际文章
    const id = await addToSyncQueue('create', 'non-existent-post');
    
    // 执行同步
    const result = await syncToGitHub();
    
    // 验证结果 - 这应该仍然成功，但报告错误
    expect(result.success).toBe(true);
    expect(result.errors).toBeGreaterThan(0);
    
    // 更新同步项状态
    await updateSyncItemStatus(id, 'error', '文章不存在');
  });
  
  // 测试主键约束错误的修复
  it('应该处理主键约束错误', async () => {
    // 创建一个文章
    const post1: Post = {
      slug: 'duplicate-slug',
      title: '重复Slug测试1',
      date: new Date().toISOString(),
      content: '# 重复Slug测试1\n\n这是第一篇文章。',
      excerpt: '这是第一篇文章。',
      categories: ['test'],
      tags: ['测试'],
      published: true
    };
    
    // 保存第一篇文章
    savePostSafe(post1);
    
    // 创建第二篇文章，使用相同的slug
    const post2: Post = {
      slug: 'duplicate-slug',
      title: '重复Slug测试2',
      date: new Date().toISOString(),
      content: '# 重复Slug测试2\n\n这是第二篇文章。',
      excerpt: '这是第二篇文章。',
      categories: ['test'],
      tags: ['测试'],
      published: true
    };
    
    // 尝试保存第二篇文章 - 这应该处理冲突而不抛出错误
    const id = savePostSafe(post2);
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });
  
  // 测试在同步过程中更新现有文章
  it('应该能更新现有文章', async () => {
    // 首先创建一个文章
    const post: Post = {
      slug: 'update-test',
      title: '更新测试',
      date: new Date().toISOString(),
      content: '# 更新测试\n\n原始内容。',
      excerpt: '原始内容。',
      categories: ['test'],
      tags: ['测试'],
      published: true
    };
    
    // 保存文章
    savePostSafe(post);
    
    // 准备更新后的文章
    const updatedPost: Post = {
      ...post,
      title: '更新测试 (已更新)',
      content: '# 更新测试\n\n已更新的内容。',
      excerpt: '已更新的内容。',
      updated: new Date().toISOString()
    };
    
    // 更新文章
    savePostSafe(updatedPost);
    
    // 添加到同步队列
    await addToSyncQueue('update', 'update-test');
    
    // 执行同步
    const result = await syncToGitHub();
    
    // 验证结果
    expect(result.success).toBe(true);
  });
}); 