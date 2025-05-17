/**
 * 数据库模块导入测试脚本
 */

// 直接尝试导入数据库模块，不使用动态导入
import { getDb } from '../src/lib/db.js';

async function main() {
  console.log('开始测试数据库模块导入...');
  
  try {
    console.log('尝试获取数据库连接...');
    const db = await getDb();
    console.log('成功获取数据库连接');
    
    // 测试执行简单查询
    console.log('尝试执行查询...');
    const result = await db.get('SELECT sqlite_version()');
    console.log('查询结果:', result);
    
    console.log('数据库测试成功!');
  } catch (err) {
    console.error('数据库测试失败:', err);
  }
}

main().catch(err => {
  console.error('运行失败:', err);
}); 