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