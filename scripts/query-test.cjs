const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取连接信息
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('数据库URL:', url);
console.log('令牌:', token ? '已设置' : '未设置');

// 基本查询测试
async function queryTest() {
  try {
    console.log('连接到Turso数据库...');
    const client = createClient({
      url,
      authToken: token
    });
    
    console.log('查询users表...');
    const users = await client.execute('SELECT * FROM users');
    
    console.log('用户数据:', JSON.stringify(users, null, 2));
    
    console.log('测试完成!');
  } catch (err) {
    console.error('错误:', err);
    console.error('错误详情:', JSON.stringify(err, null, 2));
  }
}

queryTest(); 