/**
 * 数据服务修复工具
 * 
 * 用于解决数据库类型不匹配和其他问题
 */

/**
 * 返回Turso兼容的聚合函数
 * 由于我们只使用Turso，所以始终返回json_group_array
 */
export function getAggregateFunction(): string {
  return 'json_group_array';
}

/**
 * 安全解析JSON字符串或数组字符串
 * 处理不同数据库返回的不同格式
 */
export function safeParseJsonArray(input: string): any[] {
  if (!input) return [];
  
  try {
    // 尝试作为JSON解析
    if (input.startsWith('[') && input.endsWith(']')) {
      return JSON.parse(input);
    }
    
    // 按逗号分隔
    return input.split(',').filter(Boolean);
  } catch (e) {
    console.error('解析JSON数组失败:', e);
    return [];
  }
}

/**
 * 构建安全的SQL查询
 * 处理Turso的语法
 */
export function buildSafeQuery(baseQuery: string): string {
  // 替换聚合函数
  const aggregateFunction = getAggregateFunction();
  return baseQuery.replace(/\{\{AGGREGATE_FUNCTION\}\}/g, aggregateFunction);
}

/**
 * 安全处理NULL值
 * 在不同数据库中确保一致的NULL处理
 */
export function safeCoalesce(query: string): string {
  return query.replace(/\{\{COALESCE\}\}/g, 'COALESCE');
}

/**
 * 为Vercel环境返回模拟数据
 */
export function getMockPostsResponse() {
  return {
    total: 57,
    page: 1,
    limit: 10,
    totalPages: 6,
    data: [
      {
        id: 1,
        title: "Next.js 14 新特性解析",
        slug: "nextjs-14-features",
        excerpt: "Next.js 14 带来了许多激动人心的新特性，本文将详细解析这些特性及其应用场景。",
        is_published: true,
        is_featured: true,
        imageUrl: "https://example.com/images/nextjs14.jpg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        categories: ["技术", "前端"],
        tags: ["Next.js", "React", "Web开发"]
      },
      {
        id: 2,
        title: "使用Turso数据库构建高性能应用",
        slug: "turso-database-high-performance",
        excerpt: "Turso是一个基于SQLite的分布式数据库，本文介绍如何用它构建高性能Web应用。",
        is_published: true,
        is_featured: false,
        imageUrl: "https://example.com/images/turso.jpg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        categories: ["技术", "数据库"],
        tags: ["Turso", "SQLite", "数据库"]
      }
    ],
    source: "vercel-mock-data"
  };
} 