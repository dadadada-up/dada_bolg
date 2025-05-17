import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 获取环境变量
    const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const owner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER || 'dadadada-up';
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME || 'dada_blog';
    
    // 构建API URL，获取仓库树
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    
    console.log(`[GitHub Test] 获取仓库树: ${apiUrl}`);
    
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
    
    // 仓库存在，查看其内容
    // 过滤只获取 content/posts 目录下的markdown文件
    const markdownFiles = data.tree
      .filter((item: any) => 
        item.type === 'blob' && 
        item.path.startsWith('content/posts/') && 
        item.path.endsWith('.md')
      )
      .map((item: any) => ({
        path: item.path,
        size: item.size
      }));
    
    return Response.json({
      success: true,
      truncated: data.truncated,
      totalFiles: data.tree.length,
      markdownFilesFound: markdownFiles.length,
      markdownFiles: markdownFiles.slice(0, 10), // 仅返回前10个，以避免响应过大
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