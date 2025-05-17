// 简单的认证工具

// 这里我们使用硬编码的用户凭证进行演示
// 在生产环境中应该使用环境变量和哈希密码
const ADMIN_USER = {
  username: 'admin',
  // 这里应该是密码哈希，为了演示简单使用明文
  password: 'admin123',
};

// 检查用户凭证是否有效
export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USER.username && password === ADMIN_USER.password;
}

// 生成一个简单的"token"
export function generateToken(username: string): string {
  // 这是一个非常简化的实现，实际应使用JWT
  const payload = { username, exp: Date.now() + 24 * 60 * 60 * 1000 }; // 24小时过期
  return btoa(JSON.stringify(payload));
}

// 验证token是否有效
export function validateToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token));
    return payload.username === ADMIN_USER.username && payload.exp > Date.now();
  } catch (e) {
    return false;
  }
}

// 从token中获取用户信息
export function getUserFromToken(token: string): { username: string } | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp > Date.now()) {
      return { username: payload.username };
    }
    return null;
  } catch (e) {
    return null;
  }
} 