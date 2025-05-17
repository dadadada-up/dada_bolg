/**
 * 同步历史API
 * 
 * 此API用于获取数据同步的历史记录
 * 仅在开发环境中可用
 */

// 导入同步历史存储
import { syncHistory } from '../sync-db/route';

export async function GET() {
  // 仅在开发环境中可用
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: '此API仅在开发环境中可用' },
      { status: 404 }
    );
  }
  
  // 返回同步历史记录
  return Response.json({
    history: syncHistory || []
  });
} 