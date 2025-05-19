/**
 * 数据库环境配置
 * 控制使用哪种数据库连接方式
 */

// 检查是否强制使用本地SQLite
export const USE_LOCAL_SQLITE = process.env.USE_LOCAL_SQLITE === 'true' || 
                               process.env.NODE_ENV === 'development' ||
                               process.env.DISABLE_TURSO === 'true';

// 检查是否使用备用API
export const USE_BACKUP_API = process.env.USE_BACKUP_DATA === 'true' || 
                             process.env.NODE_ENV === 'development';

// 检查Turso配置是否有效
export function isTursoConfigValid(): boolean {
  const hasTursoUrl = !!process.env.TURSO_DATABASE_URL;
  const hasTursoToken = !!process.env.TURSO_AUTH_TOKEN;
  
  // 检查URL是否为占位符
  const isValidUrl = hasTursoUrl && 
    process.env.TURSO_DATABASE_URL !== 'libsql://your-database-name.turso.io' &&
    !process.env.TURSO_DATABASE_URL?.includes('your-database-name');
  
  // 检查Token是否为占位符
  const isValidToken = hasTursoToken &&
    process.env.TURSO_AUTH_TOKEN !== 'your-auth-token' &&
    !process.env.TURSO_AUTH_TOKEN?.includes('your-auth-token');
  
  return isValidUrl && isValidToken && !USE_LOCAL_SQLITE;
}

// 导出数据库配置
export const DB_CONFIG = {
  useTurso: isTursoConfigValid(),
  useLocalSqlite: USE_LOCAL_SQLITE,
  useBackupApi: USE_BACKUP_API,
  
  // 获取API路径前缀
  getApiPrefix: () => USE_BACKUP_API ? '-new-fixed' : '-new',
  
  // 获取API URL，自动选择主API或备用API
  getApiUrl: (basePath: string) => {
    const prefix = USE_BACKUP_API ? '-new-fixed' : '-new';
    return `/api/${basePath}${prefix}`;
  }
};

// 打印当前配置信息
console.log(`[数据库配置] 使用Turso: ${DB_CONFIG.useTurso}`);
console.log(`[数据库配置] 使用本地SQLite: ${DB_CONFIG.useLocalSqlite}`);
console.log(`[数据库配置] 使用备用API: ${DB_CONFIG.useBackupApi}`); 