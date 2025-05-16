const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取并显示连接信息
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('数据库URL:', url);
console.log('令牌:', token ? '已设置' : '未设置');

// 直接尝试最简单的连接
async function testConnection() {
  try {
    console.log('创建客户端...');
    const client = createClient({
      url,
      authToken: token
    });
    
    console.log('执行基本查询...');
    const result = await client.execute('SELECT 1 as test');
    
    console.log('查询结果:', result);
    console.log('测试成功!');
  } catch (err) {
    console.error('错误:', err);
  }
}

testConnection(); 