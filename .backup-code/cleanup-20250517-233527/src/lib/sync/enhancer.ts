/**
 * 同步增强模块 - 提供改进的同步功能
 * 
 * 这个模块提供了增强的同步功能，主要解决以下问题：
 * 1. 改进YAML前置元数据解析和验证
 * 2. 优化slug生成算法
 * 3. 增强错误处理和重试机制
 * 4. 提供冲突检测和解决策略
 */

import { Post } from '@/types/post';
import matter from 'gray-matter';
import { enhancedSlugify } from './utils';
import { savePostSafe } from './db-posts.patch';
import { getDb, getTimestamp } from './db';
import * as github from './github';
import slugify from 'limax';
import crypto from 'crypto';

// 定义标准的错误类型
export class SyncError extends Error {
  recoverable: boolean;
  postSlug?: string;
  
  constructor(message: string, recoverable = true, postSlug?: string) {
    super(message);
    this.name = 'SyncError';
    this.recoverable = recoverable;
    this.postSlug = postSlug;
  }
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  backoffFactor: number;
  maxDelay: number;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 15000
};

/**
 * YAML前置元数据验证器
 * 检查YAML数据结构是否有效
 */
export function validateYamlFrontMatter(data: any): { 
  valid: boolean;
  errors: string[];
  fixableErrors: boolean;
} {
  const errors: string[] = [];
  let fixableErrors = true;
  
  // 必需字段检查
  const requiredFields = ['title', 'date'];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`缺少必需字段: ${field}`);
      fixableErrors = field !== 'title'; // 标题缺失无法修复
    }
  }
  
  // 日期格式检查
  if (data.date) {
    try {
      const dateObj = new Date(data.date);
      if (isNaN(dateObj.getTime())) {
        errors.push(`日期格式无效: ${data.date}`);
        fixableErrors = true; // 日期可以使用当前日期修复
      }
    } catch (e) {
      errors.push(`日期解析错误: ${data.date}`);
      fixableErrors = true;
    }
  }
  
  // 类别和标签格式检查
  if (data.categories) {
    if (!Array.isArray(data.categories) && typeof data.categories !== 'string') {
      errors.push(`分类格式无效: ${JSON.stringify(data.categories)}`);
      fixableErrors = true;
    }
  }
  
  if (data.tags) {
    if (!Array.isArray(data.tags) && typeof data.tags !== 'string') {
      errors.push(`标签格式无效: ${JSON.stringify(data.tags)}`);
      fixableErrors = true;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    fixableErrors: errors.length > 0 && fixableErrors
  };
}

/**
 * 增强的YAML前置元数据修复
 * 修复常见的YAML格式问题
 */
export function enhancedFixYamlFrontMatter(content: string): string {
  try {
    // 使用gray-matter解析前置数据
    const parsed = matter(content);
    const { data, content: markdownContent } = parsed;
    
    // 验证解析结果
    const validation = validateYamlFrontMatter(data);
    
    // 如果验证失败且无法修复，直接返回原始内容
    if (!validation.valid && !validation.fixableErrors) {
      console.error('YAML前置数据无法修复:', validation.errors);
      return content;
    }
    
    // 修复常见问题
    const fixedData = { ...data };
    
    // 确保title存在（如果不存在，尝试从内容中提取）
    if (!fixedData.title) {
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
      if (titleMatch && titleMatch[1]) {
        fixedData.title = titleMatch[1].trim();
      } else {
        fixedData.title = '未命名文章';
      }
    }
    
    // 确保date是有效的（如不存在或无效，使用当前日期）
    if (!fixedData.date || !(typeof fixedData.date === 'string' || fixedData.date instanceof Date)) {
      fixedData.date = new Date().toISOString().split('T')[0];
    }
    
    // 确保categories是数组
    if (!fixedData.categories) {
      fixedData.categories = ['未分类'];
    } else if (!Array.isArray(fixedData.categories)) {
      if (typeof fixedData.categories === 'string') {
        fixedData.categories = [fixedData.categories];
      } else {
        fixedData.categories = ['未分类'];
      }
    }
    
    // 确保tags是数组
    if (!fixedData.tags) {
      fixedData.tags = [];
    } else if (!Array.isArray(fixedData.tags)) {
      if (typeof fixedData.tags === 'string') {
        fixedData.tags = [fixedData.tags];
      } else {
        fixedData.tags = [];
      }
    }
    
    // 确保description是字符串
    if (fixedData.description && typeof fixedData.description !== 'string') {
      fixedData.description = String(fixedData.description);
    }
    
    // 确保published是布尔值
    if (fixedData.published !== undefined && typeof fixedData.published !== 'boolean') {
      fixedData.published = Boolean(fixedData.published);
    }
    
    // 重新组装Markdown
    return `---\n${formatYamlData(fixedData)}\n---\n${markdownContent}`;
  } catch (error) {
    console.error('修复YAML前置数据时出错:', error);
    return content; // 发生错误时返回原始内容
  }
}

/**
 * 将对象格式化为YAML字符串
 */
function formatYamlData(data: Record<string, any>): string {
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      // 处理数组
      lines.push(`${key}:`);
      value.forEach(item => {
        if (typeof item === 'string') {
          lines.push(`  - "${item.replace(/"/g, '\\"')}"`);
        } else {
          lines.push(`  - ${item}`);
        }
      });
    } else if (value instanceof Date) {
      // 处理日期
      lines.push(`${key}: "${value.toISOString().split('T')[0]}"`);
    } else if (typeof value === 'string') {
      // 处理字符串
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else if (typeof value === 'object' && value !== null) {
      // 处理嵌套对象
      lines.push(`${key}:`);
      const formattedObj = formatYamlData(value).split('\n');
      formattedObj.forEach(line => {
        lines.push(`  ${line}`);
      });
    } else {
      // 处理布尔值、数字等
      lines.push(`${key}: ${value}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 改进的Slug生成算法
 * 生成基于标题和日期的可预测slug，避免随机后缀
 */
export function generatePredictableSlug(title: string, date: string, existingSlugs: string[] = []): string {
  // 基本的基于标题的slug
  let baseSlug = slugify(title, { tone: false });
  
  // 如果标题生成的slug太短，使用哈希替代
  if (baseSlug.length < 3) {
    const hash = crypto.createHash('md5').update(title + date).digest('hex').substring(0, 8);
    baseSlug = `post-${hash}`;
  }
  
  // 如果不存在冲突，直接返回
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  // 尝试添加日期
  const datePart = date.replace(/[-T:]/g, '').substring(0, 8); // YYYYMMDD格式
  const dateSlug = `${baseSlug}-${datePart}`;
  
  if (!existingSlugs.includes(dateSlug)) {
    return dateSlug;
  }
  
  // 最后，添加短哈希以避免冲突
  for (let i = 1; i <= 100; i++) {
    const hash = crypto.createHash('md5').update(`${title}${date}${i}`).digest('hex').substring(0, 4);
    const uniqueSlug = `${baseSlug}-${hash}`;
    
    if (!existingSlugs.includes(uniqueSlug)) {
      return uniqueSlug;
    }
  }
  
  // 最终回落方案 - 时间戳
  return `${baseSlug}-${Date.now()}`;
}

/**
 * 具有重试机制的异步函数执行器
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  let lastError: Error | null = null;
  let delay = retryConfig.initialDelay;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是最后一次尝试，抛出错误
      if (attempt >= retryConfig.maxRetries) {
        throw lastError;
      }
      
      // 判断错误是否临时性，对于永久性错误无需重试
      if (isPermanentError(lastError)) {
        throw lastError;
      }
      
      console.log(`[重试] 操作失败，将在${delay}ms后重试 (${attempt + 1}/${retryConfig.maxRetries}): ${lastError.message}`);
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 计算下一次延迟时间
      delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelay);
    }
  }
  
  // 这里理论上不会执行到，因为最后一次失败后会抛出异常
  throw lastError || new Error('未知错误');
}

/**
 * 判断是否为永久性错误
 */
function isPermanentError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  // 判断是否为永久性错误
  const permanentErrorPatterns = [
    'not found',
    'unauthorized',
    'forbidden',
    'invalid token',
    'permission denied',
    'validation failed',
    'already exists',
    'invalid argument'
  ];
  
  return permanentErrorPatterns.some(pattern => 
    message.includes(pattern) || stack.includes(pattern)
  );
}

/**
 * 增强的从GitHub同步到数据库函数
 */
export async function enhancedSyncFromGitHub(): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  errorDetails: Array<{ message: string; post?: string; recoverable: boolean; }>;
}> {
  const db = getDb();
  const errorDetails: Array<{ message: string; post?: string; recoverable: boolean }> = [];
  
  // 标记同步进行中
  db.prepare('UPDATE sync_status SET sync_in_progress = 1 WHERE id = 1').run();
  console.log('[同步服务增强] 开始从GitHub同步文章...');
  
  try {
    let processed = 0;
    let errors = 0;
    
    // 使用重试机制获取文章
    const posts = await withRetry(
      async () => await github.getPosts(),
      { maxRetries: 3, initialDelay: 2000 }
    );
    
    console.log(`[同步服务增强] 从GitHub获取到 ${posts.length} 篇文章`);
    
    // 记录所有现有的slugs
    const existingSlugs = db.prepare('SELECT slug FROM slug_mapping').all().map((row: any) => row.slug);
    
    // 对每篇文章进行处理
    for (const post of posts) {
      try {
        // 验证文章数据
        if (!post.title || !post.slug || !post.content) {
          const error = `文章缺少必要字段: ${post.slug || '未知'}`;
          console.error(`[同步服务增强] ${error}`);
          errorDetails.push({ message: error, post: post.slug, recoverable: false });
          errors++;
          continue;
        }
        
        // 确保slug是确定性的
        if (post.slug.match(/[-_][a-z0-9]{6,}$/)) {
          console.log(`[同步服务增强] 检测到随机后缀slug: ${post.slug}, 尝试修复`);
          
          // 生成更好的slug
          const betterSlug = generatePredictableSlug(post.title, post.date, existingSlugs);
          
          // 添加到已存在列表防止冲突
          existingSlugs.push(betterSlug);
          
          // 保留原始slug以备参考
          const originalSlug = post.slug;
          post.slug = betterSlug;
          
          console.log(`[同步服务增强] 修复随机slug: ${originalSlug} -> ${betterSlug}`);
        }
        
        // 使用安全版本保存文章
        const postId = savePostSafe(post);
        
        if (postId) {
          processed++;
          console.log(`[同步服务增强] 成功保存文章: ${post.title} (${post.slug})`);
        } else {
          throw new Error(`保存文章失败: ${post.slug}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[同步服务增强] 同步文章失败: ${post.slug}`, errorMessage);
        
        errorDetails.push({
          message: errorMessage,
          post: post.slug,
          recoverable: !isPermanentError(error instanceof Error ? error : new Error(errorMessage))
        });
        
        errors++;
      }
    }
    
    // 更新同步状态
    db.prepare(`
      UPDATE sync_status 
      SET last_sync_time = ?, sync_in_progress = 0
      WHERE id = 1
    `).run(getTimestamp());
    
    console.log(`[同步服务增强] 同步完成: 处理 ${processed} 篇文章, ${errors} 篇失败`);
    
    return {
      success: errors === 0,
      processed,
      errors,
      errorDetails
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[同步服务增强] 同步过程中发生严重错误:', errorMessage);
    
    // 重置同步状态
    db.prepare('UPDATE sync_status SET sync_in_progress = 0 WHERE id = 1').run();
    
    return {
      success: false,
      processed: 0,
      errors: 1,
      errorDetails: [{
        message: errorMessage,
        recoverable: false
      }]
    };
  }
} 