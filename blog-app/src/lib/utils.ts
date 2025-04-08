import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期为本地化字符串
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
 * 将字符串转换为URL友好的slug格式
 * 对中文字符进行特殊处理
 */
export function slugify(str: string) {
  // 中文字符处理: 将中文字符转为拼音或保留原样并用连字符分隔
  // 由于无法直接转拼音，这里采用简单替换空格和特殊字符的方法
  // 实际使用可以考虑使用如pinyin库来转换中文
  
  if (!str) return "";
  
  // 检查是否包含中文字符
  const containsChinese = /[\u4e00-\u9fa5]/.test(str);
  
  if (containsChinese) {
    // 对于中文文章，使用更友好的编码方法
    return encodeURIComponent(str.trim())
      .replace(/%/g, '')  // 移除百分号
      .replace(/[^\w\s-]/g, '_')  // 将其他非法URL字符替换为下划线
      .replace(/_{2,}/g, '_')  // 多个连续下划线替换为一个
      .toLowerCase();
  }
  
  // 非中文处理
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // 移除非单词/空格/连字符字符
    .replace(/[\s_-]+/g, '-')  // 将空格和下划线替换为连字符
    .replace(/^-+|-+$/g, '');  // 移除首尾连字符
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function calculateReadingTime(content: string) {
  const wordsPerMinute = 200;
  const numberOfWords = content.split(/\s/g).length;
  return Math.ceil(numberOfWords / wordsPerMinute);
} 