const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取连接信息
const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

console.log('数据库URL:', url);
console.log('令牌:', token ? '已设置' : '未设置');

// 迁移和查询测试
async function migrateAndTest() {
  try {
    console.log('连接到Turso数据库...');
    const client = createClient({
      url,
      authToken: token
    });
    
    console.log('查询posts表结构...');
    const tableInfo = await client.execute('PRAGMA table_info(posts)');
    console.log('表结构:', JSON.stringify(tableInfo, null, 2));
    
    console.log('插入测试数据...');
    const insertResult = await client.execute({
      sql: 'INSERT INTO posts (slug, title, content, is_published) VALUES (?, ?, ?, ?)',
      args: ['test-post', '测试文章', '这是一篇测试文章的内容。', 1]
    });
    
    console.log('插入结果:', insertResult);
    
    console.log('查询数据...');
    const posts = await client.execute('SELECT * FROM posts WHERE slug = "test-post"');
    
    console.log('查询结果:', JSON.stringify(posts, null, 2));
    
    console.log('测试完成!');
  } catch (err) {
    console.error('错误:', err);
  }
}

migrateAndTest(); 