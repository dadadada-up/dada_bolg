import { initializeDatabase, getDb } from '../src/lib/db';

async function main() {
  try {
    console.log('开始初始化数据库...');
    
    // 初始化数据库
    await initializeDatabase();
    console.log('数据库表创建完成');
    
    // 验证数据库连接
    const db = await getDb();
    console.log('数据库连接成功');
    
    // 检查表是否存在
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
    `);
    console.log('已创建的表:', tables.map(t => t.name).join(', '));
    
    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

main(); 