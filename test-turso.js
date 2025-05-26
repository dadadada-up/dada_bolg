// 测试Turso本地连接
const { createClient } = require('@libsql/client');

async function main() {
  try {
    // 创建客户端连接到本地libSQL服务器
    const client = createClient({
      url: 'http://localhost:8080'
    });

    console.log('连接成功，执行测试查询...');

    // 执行简单的测试查询
    const result = await client.execute('SELECT 1 AS test');
    console.log('查询结果:', result);

    // 创建一个测试表
    console.log('创建测试表...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_posts (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        created_at TEXT
      )
    `);

    // 插入一些测试数据
    console.log('插入测试数据...');
    await client.execute(`
      INSERT INTO test_posts (id, title, content, created_at)
      VALUES (1, '测试文章', '这是一篇测试文章的内容', datetime('now'))
    `);

    // 查询测试数据
    console.log('查询测试数据...');
    const posts = await client.execute('SELECT * FROM test_posts');
    console.log('文章数据:', posts);

    console.log('测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

main(); 