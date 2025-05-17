import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  try {
    const category = params.category;
    
    // 获取环境变量
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'dadadada-up';
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'dada_blog';
    
    // 构建API URL，检查特定分类目录
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/content/posts/${category}`;
    
    console.log(`[GitHub Test] 尝试访问目录: ${apiUrl}`);
    
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
        }
      }, { status: 500 });
    }
    
    // 目录存在，查看其内容
    // 遍历目录结构，找出所有md文件
    const files = Array.isArray(data) 
      ? data
          .filter(item => item.type === 'file' && item.name.endsWith('.md'))
          .map(file => ({
            name: file.name,
            path: file.path,
            size: file.size,
            url: file.download_url
          }))
      : [];
    
    return Response.json({
      success: true,
      category,
      files,
      filesFound: files.length,
      apiUrl
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