import { NextRequest } from 'next/server';

/**
 * 图片代理API，用于解决跨域问题
 * 支持语雀图片和其他需要跨域访问的图片
 * 通过URL参数指定图片地址，例如：/api/proxy?url=https://example.com/image.png
 */
export async function GET(request: NextRequest) {
  try {
    // 从URL参数中获取原始图片URL
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing URL parameter' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 验证URL格式和允许的域名
    try {
      const targetUrl = new URL(url);
      
      // 定义允许代理的域名列表
      const allowedDomains = [
        'cdn.nlark.com',
        'yuque.com',
        'raw.githubusercontent.com',
        'github.com',
        'cdn.jsdelivr.net'
      ];
      
      // 确保URL属于允许的域名
      const isAllowedDomain = allowedDomains.some(domain => 
        targetUrl.hostname.includes(domain) || 
        targetUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowedDomain) {
        console.error(`Proxy请求被拒绝 - 不允许的域名: ${targetUrl.hostname}`);
        return new Response(JSON.stringify({ error: 'Domain not allowed' }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('URL解析失败:', error);
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`代理请求: ${url}`);
    
    // 设置请求头模拟浏览器请求
    const headers = new Headers();
    
    // 根据不同域名设置不同的请求头
    if (url.includes('cdn.nlark.com') || url.includes('yuque.com')) {
      // 语雀图片特殊处理
      headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36');
      headers.set('Referer', 'https://www.yuque.com/');
      headers.set('Origin', 'https://www.yuque.com');
      headers.set('Accept', 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8');
    } else {
      // 一般图片处理
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      headers.set('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8');
      headers.set('Referer', 'https://github.com/');
    }
    
    // 发送请求获取图片
    const response = await fetch(url, {
      headers,
      cache: 'no-store', // 禁用缓存
    });
    
    if (!response.ok) {
      console.error(`代理请求失败: ${url}, 状态: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch image: ${response.statusText}` }), 
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 获取原始图片数据
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // 创建一个新的响应
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('代理请求处理失败:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 