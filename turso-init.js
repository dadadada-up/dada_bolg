import { createClient } from '@libsql/client';

// 获取Turso数据库连接配置
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

// 如果未配置Turso，直接退出
if (!tursoUrl || !tursoToken) {
  console.log('未配置Turso数据库，跳过初始化');
  process.exit(0);
}

// 连接数据库
try {
  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken
  });
  
  console.log('成功连接到Turso数据库');
  
  // 创建基本表结构（如果不存在）
  const createTables = async () => {
    const tables = await client.execute({ 
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" 
    });
    
    if (tables.rows.length === 0) {
      console.log('创建基本表结构...');
      
      // 创建最基本的表结构
      await client.execute({ 
        sql: `CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          content TEXT,
          published BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`
      });
      
      console.log('表结构创建完成');
    } else {
      console.log('已存在表，跳过初始化');
    }
  };
  
  // 执行表创建
  createTables()
    .then(() => {
      console.log('Turso初始化完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('Turso初始化失败:', error);
      // 不让构建因此失败
      process.exit(0);
    });
  
} catch (error) {
  console.error('连接Turso数据库失败:', error);
  // 不让构建因此失败
  process.exit(0);
} 