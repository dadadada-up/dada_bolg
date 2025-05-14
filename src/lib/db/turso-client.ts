import { createClient } from '@libsql/client';
import { isVercelBuild } from '@/lib/env';

// 判断是否使用Turso
const useTurso = !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN;

// 创建Turso客户端连接
const tursoClient = useTurso ? createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
  // 可选：使用内嵌副本以获得最佳性能
  syncUrl: process.env.NODE_ENV === 'production' 
    ? process.env.TURSO_DATABASE_URL 
    : undefined,
}) : null;

// 记录数据库连接信息（仅开发环境）
if (useTurso && process.env.NODE_ENV !== 'production') {
  console.log(`[数据库] 使用Turso数据库: ${process.env.TURSO_DATABASE_URL}`);
} else if (process.env.NODE_ENV !== 'production') {
  console.log('[数据库] 未配置Turso，将使用本地SQLite数据库');
}

export default tursoClient;
export { useTurso }; 