import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { getDb, initDb, closeDb, generateId, getTimestamp } from '../lib/db';
import { getAllPosts, savePost, getPostBySlug, deletePost } from '../lib/db-posts';
import { Post } from '@/types/post';

// 测试前创建临时数据库文件路径
const TEST_DB_DIR = path.join(process.cwd(), 'test-data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test-blog-cache.db');

// 设置环境变量
process.env.DB_PATH = TEST_DB_PATH;

describe('数据库功能测试', () => {
  // 测试前的设置
  beforeAll(() => {
    // 确保测试目录存在
    if (!fs.existsSync(TEST_DB_DIR)) {
      fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    }
    
    // 初始化测试数据库
    initDb();
  });
  
  // 测试后的清理
  afterAll(() => {
    // 关闭数据库连接
    closeDb();
    
    // 删除测试数据库文件
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    
    // 删除测试目录
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmdirSync(TEST_DB_DIR);
    }
  });
  
  // 测试数据库连接
  it('应该能成功连接数据库', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });
  
  // 测试生成ID
  it('应该能生成唯一ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });
  
  // 测试获取时间戳
  it('应该能获取当前时间戳', () => {
    const timestamp = getTimestamp();
    expect(typeof timestamp).toBe('number');
    expect(timestamp).toBeGreaterThan(0);
  });
  
  // 测试文章保存和获取
  it('应该能保存和获取文章', () => {
    // 创建测试文章
    const testPost: Post = {
      slug: 'test-post',
      title: '测试文章',
      date: new Date().toISOString(),
      content: '# 测试文章内容\n\n这是一篇测试文章。',
      excerpt: '这是一篇测试文章。',
      categories: ['test'],
      tags: ['测试'],
      published: true
    };
    
    // 保存文章
    savePost(testPost);
    
    // 获取所有文章
    const { posts } = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    
    // 获取特定文章
    const retrievedPost = getPostBySlug('test-post');
    expect(retrievedPost).toBeDefined();
    expect(retrievedPost?.title).toBe('测试文章');
    expect(retrievedPost?.slug).toBe('test-post');
  });
  
  // 测试文章删除
  it('应该能删除文章', () => {
    // 获取文章
    const post = getPostBySlug('test-post');
    expect(post).toBeDefined();
    
    // 删除文章
    if (post) {
      deletePost(post.slug);
    }
    
    // 确认文章已删除
    const deletedPost = getPostBySlug('test-post');
    expect(deletedPost).toBeNull();
  });
}); 