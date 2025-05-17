/**
 * 数据库配置文件
 * 根据环境自动选择使用本地SQLite或Turso云数据库
 */

// 判断当前环境
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';
const databaseMode = process.env.NEXT_PUBLIC_DATABASE_MODE || (isVercel ? 'turso' : 'sqlite');

// 导出配置
module.exports = {
  // 当前数据库模式: 'sqlite' 或 'turso'
  databaseMode,
  
  // 是否在Vercel环境
  isVercel,
  
  // 是否使用Turso
  useTurso: databaseMode === 'turso',
  
  // 是否使用SQLite
  useSQLite: databaseMode === 'sqlite',
  
  // 数据库文件路径 (仅在SQLite模式下使用)
  sqliteFilePath: './data/blog.db',
  
  // Turso配置 (仅在Turso模式下使用)
  tursoConfig: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  },
  
  // 日志配置
  logging: {
    // 是否启用查询日志
    queries: process.env.NODE_ENV === 'development',
    // 是否启用错误日志
    errors: true
  }
}; 