/**
 * 状态检查API
 * 路径: /api/status
 */
import { initializeDatabase, getDatabase } from '@/lib/db/database';
import { isTursoEnabled } from '@/lib/db/turso-client-new';

// 系统信息
const systemInfo = {
  version: '1.0.0',
  name: 'Dada Blog',
  nextVersion: process.env.NEXT_VERSION || '未知',
  nodeVersion: process.version,
  environment: process.env.NODE_ENV,
  isVercel: process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL || process.env.IS_VERCEL || false,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  serverTime: new Date().toISOString(),
};

interface DatabaseStatus {
  type: string;
  connected: boolean;
  url: string;
  initialized: boolean;
  version: string | null;
  error?: string;
}

export async function GET(request: Request) {
  try {
    // 检查Turso是否启用
    const isTursoActive = isTursoEnabled();
    
    // 基本系统信息
    const statusInfo = {
      ...systemInfo,
      status: 'online',
      database: {
        type: isTursoActive ? 'Turso (云SQLite)' : 'SQLite (本地文件)',
        connected: false,
        url: isTursoActive ? '已配置' : '未配置',
        initialized: false,
        version: null,
      } as DatabaseStatus,
      config: {
        useTurso: isTursoActive,
        hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
        hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
        baseUrl: process.env.NEXT_PUBLIC_SITE_URL || '未配置',
      },
    };
    
    try {
      // 初始化数据库
      await initializeDatabase();
      statusInfo.database.initialized = true;
      
      // 测试连接
      const db = await getDatabase();
      const result = await db.get('SELECT sqlite_version() as version');
      
      statusInfo.database.connected = true;
      statusInfo.database.version = result?.version || '未知';
    } catch (dbError) {
      console.error('数据库连接测试失败:', dbError);
      statusInfo.database.error = dbError instanceof Error ? dbError.message : String(dbError);
    }
    
    return Response.json(statusInfo);
  } catch (error) {
    console.error('状态检查失败:', error);
    
    return Response.json({
      status: 'error',
      message: '状态检查失败',
      error: error instanceof Error ? error.message : String(error),
      time: new Date().toISOString(),
    }, { status: 500 });
  }
} 