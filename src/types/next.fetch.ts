// 这个文件会被Next.js从@vercel/fetch中导入
// 用于在构建时拦截fetch请求

export function fetch() {
  console.log('[Next.js Fetch] 拦截了fetch调用');
  
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ data: [], total: 0, totalPages: 0 }),
    text: async () => "{}",
    headers: new Headers(),
  });
} 