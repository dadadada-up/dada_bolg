/**
 * 分类数据插入脚本
 * 
 * 此脚本用于将标准分类数据插入到数据库中
 * 解决数据类型不匹配问题
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// 要插入的分类数据
const CATEGORIES = [
  { name: "保险", slug: "insurance" },
  { name: "产品管理", slug: "product-management" },
  { name: "读书笔记", slug: "reading" },
  { name: "个人博客", slug: "personal-blog" },
  { name: "家庭生活", slug: "family-life" },
  { name: "金融", slug: "finance" },
  { name: "开源", slug: "open-source" },
  { name: "技术工具", slug: "tech-tools" }
];

async function main() {
  console.log('开始插入分类数据...');
  
  // 连接数据库
  const dbPath = path.join(rootDir, 'data', 'blog.db');
  console.log(`数据库路径: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.error('错误: 数据库文件不存在');
    console.log('需要先初始化数据库。请运行: npm run init-db');
    process.exit(1);
  }
  
  // 连接数据库
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // 1. 查看表结构
    console.log('获取categories表结构...');
    const tableInfo = await db.all('PRAGMA table_info(categories)');
    console.log('表结构:');
    console.table(tableInfo);
    
    // 2. 清空现有数据
    console.log('清空现有分类数据...');
    await db.exec('DELETE FROM categories');
    
    // 3. 开始事务
    await db.exec('BEGIN TRANSACTION');
    
    // 4. 插入分类数据
    console.log('插入分类数据...');
    
    let successCount = 0;
    let failCount = 0;
    
    const currentDate = new Date().toISOString();
    
    for (const category of CATEGORIES) {
      try {
        // 不指定ID，让数据库自动生成
        await db.run(`
          INSERT INTO categories (name, slug, description, post_count, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          category.name, 
          category.slug, 
          '', 
          0, 
          currentDate, 
          currentDate
        ]);
        
        console.log(`成功插入分类: ${category.name} (${category.slug})`);
        successCount++;
      } catch (error) {
        console.error(`插入分类 ${category.name} 失败:`, error);
        failCount++;
      }
    }
    
    // 5. 提交事务
    await db.exec('COMMIT');
    
    // 6. 输出结果
    console.log('\n插入完成:');
    console.log(`- 成功: ${successCount} 条`);
    console.log(`- 失败: ${failCount} 条`);
    
    if (successCount > 0) {
      const verifyData = await db.all('SELECT * FROM categories');
      console.log('\n验证数据:');
      console.table(verifyData);
    }
    
  } catch (error) {
    // 回滚事务
    await db.exec('ROLLBACK');
    console.error('插入过程出错，事务已回滚:', error);
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

// 执行主函数
main().catch(error => {
  console.error('脚本执行出错:', error);
  process.exit(1);
}); 