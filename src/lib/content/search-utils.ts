import { Post } from "@/types/post";

/**
 * 对搜索查询进行预处理
 * 1. 全部转换为小写
 * 2. 移除多余空格
 * 3. 分词
 */
export function preprocessQuery(query: string): string[] {
  if (!query) return [];
  
  const trimmed = query.toLowerCase().trim();
  // 按空格分词
  return trimmed.split(/\s+/).filter(Boolean);
}

/**
 * 计算文章与查询的匹配得分
 * - 标题匹配：3分/关键词
 * - 分类匹配：2分/关键词
 * - 标签匹配：2分/关键词
 * - 摘要匹配：1分/关键词
 * - 内容匹配：0.5分/关键词
 */
export function scorePost(post: Post, queryTerms: string[]): number {
  if (!queryTerms.length) return 0;
  
  let score = 0;
  const title = post.title.toLowerCase();
  const content = post.content?.toLowerCase() || "";
  const excerpt = post.excerpt?.toLowerCase() || "";
  const categories = post.categories.map(c => c.toLowerCase());
  const tags = post.tags.map(t => t.toLowerCase());
  
  for (const term of queryTerms) {
    // 标题匹配得分最高
    if (title.includes(term)) {
      score += 3;
      // 标题精确匹配加成
      if (title === term) score += 2;
    }
    
    // 分类匹配
    if (categories.some(cat => cat.includes(term))) {
      score += 2;
      // 分类精确匹配加成
      if (categories.includes(term)) score += 1;
    }
    
    // 标签匹配
    if (tags.some(tag => tag.includes(term))) {
      score += 2;
      // 标签精确匹配加成
      if (tags.includes(term)) score += 1;
    }
    
    // 摘要匹配
    if (excerpt.includes(term)) {
      score += 1;
    }
    
    // 内容匹配
    if (content.includes(term)) {
      score += 0.5;
      
      // 计算出现次数，多次出现的关键词得分更高
      const occurrences = (content.match(new RegExp(term, "g")) || []).length;
      if (occurrences > 1) {
        score += Math.min(occurrences * 0.1, 1); // 最多加1分
      }
    }
  }
  
  return score;
}

/**
 * 基于查询对文章进行过滤和排序
 */
export function filterAndSortPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) return posts;
  
  const queryTerms = preprocessQuery(query);
  if (!queryTerms.length) return posts;
  
  // 计算每篇文章的得分
  const scoredPosts = posts.map(post => ({
    post,
    score: scorePost(post, queryTerms)
  }));
  
  // 过滤得分为0的文章（没有任何匹配）
  const filteredPosts = scoredPosts.filter(({ score }) => score > 0);
  
  // 按得分降序排序
  filteredPosts.sort((a, b) => b.score - a.score);
  
  return filteredPosts.map(({ post }) => post);
}

/**
 * 从查询中提取匹配的摘录
 * 查找包含查询词的第一段文本并返回
 */
export function extractMatchingExcerpt(content: string, queryTerms: string[], length: number = 160): string {
  if (!content || !queryTerms.length) return "";
  
  const lowerContent = content.toLowerCase();
  
  // 尝试找到包含查询词的段落
  for (const term of queryTerms) {
    const termIndex = lowerContent.indexOf(term);
    if (termIndex !== -1) {
      // 计算摘录的开始和结束位置
      const start = Math.max(0, termIndex - length / 2);
      const end = Math.min(content.length, start + length);
      
      // 提取摘录并添加省略号
      let excerpt = content.substring(start, end).trim();
      if (start > 0) excerpt = "..." + excerpt;
      if (end < content.length) excerpt = excerpt + "...";
      
      return excerpt;
    }
  }
  
  // 如果没有找到匹配项，返回内容的前N个字符
  return content.length > length
    ? content.substring(0, length) + "..."
    : content;
} 