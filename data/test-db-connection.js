/**
 * 测试本地SQLite数据库连接
 */

const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();

async function main() {
  try {
    console.log('测试数据库连接...');
    
    // 测试 data/blog.db
    try {
      const dbPath1 = path.resolve(__dirname, 'blog.db');
      console.log(`尝试连接: ${dbPath1}`);
      
      const db1 = await open({
        filename: dbPath1,
        driver: sqlite3.Database
      });
      
      const count1 = await db1.get('SELECT COUNT(*) as count FROM posts');
      console.log(`data/blog.db 文章数量: ${count1.count}`);
      
      const sample1 = await db1.all('SELECT id, title, slug FROM posts LIMIT 3');
      console.log('示例文章:', sample1);
      
      await db1.close();
    } catch (error) {
      console.error(`连接 data/blog.db 失败:`, error);
    }
    
    // 测试 data/storage/blog.db
    try {
      const dbPath2 = path.resolve(__dirname, 'storage', 'blog.db');
      console.log(`\n尝试连接: ${dbPath2}`);
      
      const db2 = await open({
        filename: dbPath2,
        driver: sqlite3.Database
      });
      
      const count2 = await db2.get('SELECT COUNT(*) as count FROM posts');
      console.log(`data/storage/blog.db 文章数量: ${count2.count}`);
      
      const sample2 = await db2.all('SELECT id, title, slug FROM posts LIMIT 3');
      console.log('示例文章:', sample2);
      
      await db2.close();
    } catch (error) {
      console.error(`连接 data/storage/blog.db 失败:`, error);
    }
    
    console.log('\n测试完成');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

main(); 