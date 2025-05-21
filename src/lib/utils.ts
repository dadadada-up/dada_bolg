import clsx from 'clsx';
import { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 截断文本
 */
export function truncateText(text: string, length: number) {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * 生成 slug
 */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * 增强版 slug 生成
 * 支持中文和其他非拉丁字符
 */
export function enhancedSlugify(text: string) {
  if (!text) return '';
  
  // 处理中文和其他非拉丁字符
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 保留字母、数字、空格和连字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符替换为单个
    .trim(); // 去除首尾空格
    
  return slug || `post-${Date.now().toString(36)}`; // 如果为空，生成一个基于时间的 slug
}

/**
 * 计算阅读时间
 */
export function getReadingTime(content: string) {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute) || 1;
}

/**
 * 随机 ID 生成
 */
export function generateId(length: number = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 检查是否为外部链接
 */
export function isExternalLink(url: string) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    return fallback;
  }
}

/**
 * 格式化数字
 * 添加千位分隔符，可选择保留小数位
 */
export function formatNumber(num: number, decimals: number = 0) {
  if (num === undefined || num === null) return '0';
  
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * 从 Markdown 内容中提取标题
 * 返回标题数组，每个标题包含级别、文本和 ID
 */
export function extractHeadings(content: string) {
  if (!content) return [];
  
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    
    headings.push({
      level,
      text,
      id
    });
  }
  
  return headings;
}