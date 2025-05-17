import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 获取环境变量
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'dadadada-up';
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'dada_blog';
    
    // 构建API URL，特别检查content/posts目录
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/content/posts`;
    
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
    
    // 目录存在，查看其内容
    // 遍历目录结构，找出所有子目录
    const directories = Array.isArray(data) 
      ? data.filter(item => item.type === 'dir').map(dir => dir.name) 
      : [];
    
    return Response.json({
      success: true,
      directories: directories,
      itemsFound: Array.isArray(data) ? data.length : 0,
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