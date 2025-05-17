import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 获取环境变量
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'dadadada-up';
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'dada_blog';
    
    // 构建API URL
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    
    // 发送请求
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dada Blog Test API'
      }
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 检查响应状态
    if (!response.ok) {
      return Response.json({
        status: response.status,
        statusText: response.statusText,
        error: data,
        tokenInfo: {
          exists: !!token,
          length: token?.length || 0,
          preview: token ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : null
        },
        envInfo: {
          NODE_ENV: process.env.NODE_ENV,
          GITHUB_TOKEN_EXISTS: !!process.env.GITHUB_TOKEN,
          NEXT_PUBLIC_GITHUB_TOKEN_EXISTS: !!process.env.NEXT_PUBLIC_GITHUB_TOKEN
        }
      }, { status: 500 });
    }
    
    // 返回成功响应
    return Response.json({
      success: true,
      repoInfo: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        visibility: data.visibility
      },
      tokenInfo: {
        exists: !!token,
        length: token?.length || 0,
        preview: token ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}` : null
      }
    });
  } catch (error) {
    // 返回错误响应
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : null
      }, 
      { status: 500 }
    );
  }
} 