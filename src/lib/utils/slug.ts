/**
 * Slug处理相关工具函数
 */

/**
 * 确保slug正确编码
 */
export function encodeSlug(slug: string): string {
  // 检查slug是否已经被编码
  try {
    // 如果解码后与原始值相同，说明未编码
    if (decodeURIComponent(slug) === slug) {
      return encodeURIComponent(slug);
    }
    return slug; // 已编码，直接返回
  } catch (e) {
    // 如果解码出错，可能包含特殊字符，进行编码
    return encodeURIComponent(slug);
  }
}

/**
 * 编码slug用于URL，但保留斜杠
 */
export function encodeSlugForUrl(slug: string): string {
  return encodeURIComponent(slug).replace(/%2F/g, '/');
}

/**
 * 解码URL中的slug
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch (e) {
    return slug;
  }
} 