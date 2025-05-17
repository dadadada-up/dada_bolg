import { NextResponse } from 'next/server';

/**
 * 为旧API添加弃用警告的中间件
 * 
 * @param handler 原始API处理函数
 * @param newApiPath 替代的新API路径
 * @param migrationInfo 迁移提示信息
 */
export function withDeprecationWarning(
  handler: (request: Request) => Promise<Response>, 
  newApiPath: string,
  migrationInfo?: string
) {
  return async (request: Request) => {
    // 调用原始处理函数
    const response = await handler(request);
    
    // 尝试解析原始响应
    let originalData: any = {};
    try {
      const clonedResponse = response.clone();
      originalData = await clonedResponse.json();
    } catch (e) {
      // 忽略解析错误
    }
    
    // 添加弃用警告
    const deprecationInfo = {
      ...originalData,
      _deprecationWarning: {
        message: `⚠️ 此API即将弃用，请尽快迁移到新API: ${newApiPath}`,
        newApiPath,
        migrationInfo: migrationInfo || "详情请参考: /docs/api-migration-guide.md",
        deadline: "将在一个月后停用"
      }
    };
    
    // 创建新响应，使用Response构造函数而不是NextResponse.json
    return new Response(
      JSON.stringify(deprecationInfo),
      { 
        status: response.status, 
        statusText: response.statusText, 
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Content-Type': 'application/json'
        }
      }
    );
  };
} 