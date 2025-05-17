import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 获取和处理环境变量
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || '未设置',
      GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '已设置' : '未设置',
      GITHUB_TOKEN_LENGTH: process.env.GITHUB_TOKEN?.length || 0,
      GITHUB_TOKEN_PREVIEW: process.env.GITHUB_TOKEN 
        ? `${process.env.GITHUB_TOKEN.substring(0, 5)}...${process.env.GITHUB_TOKEN.substring(process.env.GITHUB_TOKEN.length - 5)}`
        : null,
      NEXT_PUBLIC_GITHUB_TOKEN: process.env.NEXT_PUBLIC_GITHUB_TOKEN ? '已设置' : '未设置',
      NEXT_PUBLIC_GITHUB_TOKEN_LENGTH: process.env.NEXT_PUBLIC_GITHUB_TOKEN?.length || 0,
      NEXT_PUBLIC_GITHUB_TOKEN_PREVIEW: process.env.NEXT_PUBLIC_GITHUB_TOKEN 
        ? `${process.env.NEXT_PUBLIC_GITHUB_TOKEN.substring(0, 5)}...${process.env.NEXT_PUBLIC_GITHUB_TOKEN.substring(process.env.NEXT_PUBLIC_GITHUB_TOKEN.length - 5)}`
        : null,
      NEXT_PUBLIC_GITHUB_REPO_OWNER: process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || '未设置',
      NEXT_PUBLIC_GITHUB_REPO_NAME: process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || '未设置',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '未设置',
    };
    
    // 检查token是否匹配
    const tokensMatch = process.env.GITHUB_TOKEN === process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    
    return Response.json({
      success: true,
      environment: envVars,
      tokensMatch,
      headers: {
        host: request.headers.get('host'),
        referer: request.headers.get('referer')
      }
    });
  } catch (error) {
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '未知错误' 
      }, 
      { status: 500 }
    );
  }
} 