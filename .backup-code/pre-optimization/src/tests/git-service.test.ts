import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { GitService, GitConfig } from '../lib/git-service';

// 创建一个测试用的临时目录
const TEST_REPO_PATH = path.join(process.cwd(), 'test-repo');

// 测试配置
const testConfig: GitConfig = {
  localPath: TEST_REPO_PATH,
  remoteName: 'origin',
  remoteUrl: '', // 不使用远程仓库进行测试
  defaultBranch: 'main',
  author: {
    name: 'Test User',
    email: 'test@example.com'
  }
};

describe('GitService', () => {
  let gitService: GitService;
  
  // 测试前的设置
  beforeAll(() => {
    // 确保测试目录存在
    if (!fs.existsSync(TEST_REPO_PATH)) {
      fs.mkdirSync(TEST_REPO_PATH, { recursive: true });
    }
    
    // 创建Git服务实例
    gitService = new GitService(testConfig);
  });
  
  // 测试后的清理
  afterAll(() => {
    // 删除测试目录
    if (fs.existsSync(TEST_REPO_PATH)) {
      fs.rmSync(TEST_REPO_PATH, { recursive: true, force: true });
    }
  });
  
  // 测试GitService初始化
  it('should initialize a git repository', async () => {
    const result = await gitService.initialize();
    expect(result).toBe(true);
    
    // 验证是否创建了.git目录
    const gitDir = path.join(TEST_REPO_PATH, '.git');
    expect(fs.existsSync(gitDir)).toBe(true);
  });
  
  // 测试获取仓库状态
  it('should get repository status', async () => {
    const status = await gitService.getStatus();
    expect(status.isRepo).toBe(true);
    expect(status.currentBranch).toBe('main');
  });
  
  // 测试添加和提交文件
  it('should stage and commit files', async () => {
    // 创建测试文件
    const testFilePath = path.join(TEST_REPO_PATH, 'test.md');
    fs.writeFileSync(testFilePath, '# Test File\n\nThis is a test file.', 'utf-8');
    
    // 添加文件到暂存区
    const stageResult = await gitService.stageFiles(['test.md']);
    expect(stageResult).toBe(true);
    
    // 提交更改
    const commitResult = await gitService.commitChanges('Add test file');
    expect(commitResult).toBe(true);
    
    // 检查状态
    const status = await gitService.getStatus();
    expect(status.hasChanges).toBe(false);
  });
  
  // 测试获取文件历史
  it('should get file history', async () => {
    const testFilePath = path.join(TEST_REPO_PATH, 'test.md');
    
    // 获取文件历史
    const history = await gitService.getFileHistory(testFilePath);
    expect(history.filePath).toBe('test.md');
    expect(history.commits.length).toBeGreaterThanOrEqual(1);
    expect(history.commits[0].message).toBe('Add test file');
  });
}); 