import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import limax from "limax";

/**
 * 合并classNames工具函数
 * 组合多个类名，并自动处理tailwind类名的冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 数字格式化函数，用于格式化较大的数字
 * @param num 要格式化的数字
 * @param options 格式化选项
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number, options: {
  notation?: 'compact' | 'standard',
  maximumFractionDigits?: number
} = {}): string {
  const { notation = 'compact', maximumFractionDigits = 1 } = options;
  
  if (num < 1000) {
    return num.toString();
  }
  
  try {
    return new Intl.NumberFormat('zh-CN', {
      notation,
      maximumFractionDigits
    }).format(num);
  } catch (error) {
    console.error('数字格式化失败:', error);
    return num.toString();
  }
}

/**
 * 增强版的日期格式化函数，支持多种格式
 * @param dateString ISO格式的日期字符串
 * @param format 格式化类型: 'default' | 'ymd' | 'relative'
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string, format: 'default' | 'ymd' | 'relative' = 'default'): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    switch (format) {
      case 'ymd':
        return formatDateYMD(dateString);
      case 'relative':
        return formatRelativeTime(dateString);
      case 'default':
      default:
        return date.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }
  } catch (error) {
    console.error('日期格式化失败:', error);
    return dateString;
  }
}

/**
 * 将日期格式化为 YYYY-MM-DD 格式
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDateYMD(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 将日期格式化为相对时间（例如：3天前，1周前等）
 * @param dateString ISO格式的日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return "刚刚";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  } else if (diffInDays < 30) {
    return `${diffInDays}天前`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  } else {
    return `${diffInYears}年前`;
  }
}

/**
 * 增强版的 slug 生成函数，支持多语言和更好的特殊字符处理
 * @param text 需要转换为 slug 的文本
 * @param options 可选配置
 * @returns 生成的 slug
 */
export function enhancedSlugify(text: string, options: any = {}): string {
  return limax(text, {
    tone: false,
    separator: "-",
    ...options,
  });
}

/**
 * 将字符串转换为URL友好的slug格式
 * 对中文字符进行特殊处理
 * 
 * 注意: 此函数现在使用 enhancedSlugify 作为实现，以提供更好的多语言支持
 */
export function slugify(text: string): string {
  return enhancedSlugify(text);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function calculateReadingTime(content: string) {
  const wordsPerMinute = 200;
  const numberOfWords = content.split(/\s/g).length;
  return Math.ceil(numberOfWords / wordsPerMinute);
}

/**
 * 从Markdown内容中提取标题
 * @param content - Markdown内容
 * @returns 标题数组，包含文本和级别信息
 */
export function extractHeadings(content: string) {
  if (!content) {
    return [];
  }
  
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = enhancedSlugify(text);
    
    headings.push({
      text,
      level,
      slug,
    });
  }

  return headings;
} 