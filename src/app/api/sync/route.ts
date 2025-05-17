/**
 * 同步API
 * 路径: /api/sync
 */

// 检查是否在Vercel环境中
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_IS_VERCEL === '1';

export async function GET(request: Request) {
  // 在Vercel环境中禁用此API
  if (isVercel) {
    return Response.json({
      success: false,
      message: '在Vercel环境中不支持此API',
      error: 'VERCEL_ENVIRONMENT'
    }, { status: 403 });
  }

  // 在Vercel环境中，不加载实际的同步模块
  // 这样可以避免在构建时尝试导入SQLite相关模块
  return Response.json({
    success: false,
    message: '同步功能暂时不可用',
    error: 'NOT_IMPLEMENTED'
  }, { status: 501 });
}

export async function POST(request: Request) {
  // 在Vercel环境中禁用此API
  if (isVercel) {
    return Response.json({
      success: false,
      message: '在Vercel环境中不支持此API',
      error: 'VERCEL_ENVIRONMENT'
    }, { status: 403 });
  }

  // 在Vercel环境中，不加载实际的同步模块
  // 这样可以避免在构建时尝试导入SQLite相关模块
  return Response.json({
    success: false,
    message: '同步功能暂时不可用',
    error: 'NOT_IMPLEMENTED'
  }, { status: 501 });
} 