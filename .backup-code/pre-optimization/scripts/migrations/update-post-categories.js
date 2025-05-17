/**
 * 文章分类关系更新脚本
 * 
 * 此脚本用于批量更新文章与分类的关联关系
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// 要更新的文章分类关系
const POSTS_CATEGORIES = [
  { id: 8, slug: "notion-plus-cursor-shi-yong-zhi-nan-5673uwrh", category: "tech-tools" },
  { id: 28, slug: "vscode-drawio-usage-5676juqi", category: "tech-tools" },
  { id: 53, slug: "notioncursor-2", category: "tech-tools" },
  { id: 56, slug: "how-to-get-notion-database-fields-summary-5676nw9c", category: "tech-tools" },
  { id: 68, slug: "asset", category: "tech-tools" },
  { id: 70, slug: "R1", category: "tech-tools" },
  { id: 71, slug: "monitor", category: "open-source" },
  { id: 92, slug: "2025-qing-ming-quan-zhou-san-ri-you-xiang-xi-xing-cheng-5676ewxf", category: "family-life" },
  { id: 93, slug: "hang-zhou-2024-nian-yuan-dan-zou-yun-ji-hua", category: "family-life" },
  { id: 94, slug: "hang-zhou-zhou-bian-zhou-mo-chu-xing-ji-hua", category: "family-life" },
  { id: 95, slug: "ge-ren", category: "family-life" },
  { id: 96, slug: "fang-di-chan-xi-lie", category: "finance" },
  { id: 97, slug: "gang-bi-gou-mai-mei-zhai-xue-xi", category: "finance" },
  { id: 98, slug: "xin-ji-jian-shi-dai-nong-ye-bao-xian-shu-zhi-hua-zhuan-xing-du-shu-bi-ji", category: "reading" },
  { id: 99, slug: "gong-ji-ce-gai-ge-bei-jing-xia-zhong-guo-duo-ceng-ci-nong-ye-bao-xian-chan-pin-jie-gou-yan-jiu-du-shu-bi-ji", category: "reading" },
  { id: 100, slug: "nong-ye-bao-xian-5675qgmm", category: "insurance" },
  { id: 102, slug: "dingtalkmonitor-da-zao-qi-ye-ji-ding-ding-jian-kong-li-qi", category: "open-source" },
  { id: 105, slug: "brd-ye-wu-xu-qiu-wen-dang-mu-ban", category: "product-management" },
  { id: 106, slug: "zhu-liu-zhi-neng-ti-ping-tai-dui-bi", category: "tech-tools" },
  { id: 107, slug: "jiao-yi-chan-pin-jing-li", category: "product-management" },
  { id: 108, slug: "chan-pin-jia-gou-she-ji-zhi-chan-pin-shi-ti-she-ji-yi-er", category: "product-management" },
  { id: 109, slug: "gong-zuo-chang-yong-mo-ban", category: "product-management" },
  { id: 110, slug: "zhi-fu-bao-yi-liao-jian-kang-mo-kuai-chan-pin-ti-yan", category: "product-management" },
  { id: 111, slug: "you-zhi-you-xing-zi-chan-mo-kuai-diao-yan", category: "finance" },
  { id: 112, slug: "ai-bang-wo-xie-sql-shi-bei-xiaolti-sheng-567732oc", category: "product-management" },
  { id: 113, slug: "Asset Tracker", category: "tech-tools" },
  { id: 114, slug: "Cursor rules", category: "tech-tools" },
  { id: 115, slug: "cursor-jie-shao-5675frd3", category: "tech-tools" },
  { id: 116, slug: "cursor-man-xue-shi-yong-5674h30j", category: "tech-tools" },
  { id: 117, slug: "github-desktop-an-zhuang-yu-han-hua", category: "tech-tools" },
  { id: 118, slug: "github-cang-ku-san-zhong-ke-long-fang-shi", category: "tech-tools" },
  { id: 119, slug: "Notion API", category: "tech-tools" },
  { id: 120, slug: "Sublime Text", category: "tech-tools" },
  { id: 121, slug: "vs-code-zhong-shi-yong-drawio-wan-quan-zhi-nan", category: "tech-tools" },
  { id: 123, slug: "deepseek-ben-di-hua-bu-shu", category: "tech-tools" },
  { id: 124, slug: "deepseek-man-xue-fu-huo", category: "tech-tools" },
  { id: 126, slug: "notion+cursor", category: "tech-tools" },
  { id: 127, slug: "notionpluspushplus-gong-zhong-hao-ren-wu-ti-xing-5674w990", category: "tech-tools" },
  { id: 130, slug: "yi-xie-diao-yan", category: "family-life" },
  { id: 131, slug: "zai-macos-shang-qing-song-bu-shu-docker-xiang-xi-an-zhuang-yu-pei-zhi-b-5674to9g", category: "tech-tools" },
  { id: 132, slug: "ru-he-huo-qu-notion-shu-ju-ku-zi-duan-xin-xi", category: "tech-tools" },
  { id: 133, slug: "chang-yong-gong-ju", category: "tech-tools" },
  { id: 134, slug: "shu-ju-ku-biao-jie-gou", category: "tech-tools" },
  { id: 135, slug: "yu-que-wen-dang-neng-li-zhi-chi-zheng-li", category: "tech-tools" }
];

async function main() {
  console.log('开始更新文章分类关系...');
  
  // 连接数据库
  const dbPath = path.join(rootDir, 'data', 'blog.db');
  console.log(`数据库路径: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.error('错误: 数据库文件不存在');
    process.exit(1);
  }
  
  // 连接数据库
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // 开始事务
    await db.exec('BEGIN TRANSACTION');
    
    let successCount = 0;
    let failCount = 0;
    
    // 获取所有分类ID及其slug
    const categories = await db.all('SELECT id, slug FROM categories');
    console.log('获取到分类:');
    console.table(categories);
    
    // 创建分类slug到ID的映射
    const categoryMapping = {};
    for (const category of categories) {
      categoryMapping[category.slug] = category.id;
    }
    
    // 1. 为每个文章更新分类关系
    for (const post of POSTS_CATEGORIES) {
      try {
        // 1.1 查找分类ID
        const categoryId = categoryMapping[post.category];
        if (!categoryId) {
          console.error(`找不到分类: ${post.category}`);
          failCount++;
          continue;
        }
        
        // 1.2 清除当前文章的所有分类关联
        await db.run('DELETE FROM post_categories WHERE post_id = ?', [post.id]);
        
        // 1.3 添加新的分类关联
        await db.run(
          'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
          [post.id, categoryId]
        );
        
        console.log(`成功更新文章(ID: ${post.id}, 分类: ${post.category})`);
        successCount++;
      } catch (error) {
        console.error(`更新文章 ID ${post.id} 失败:`, error);
        failCount++;
      }
    }
    
    // 提交事务
    await db.exec('COMMIT');
    
    // 输出结果
    console.log('\n更新完成:');
    console.log(`- 成功: ${successCount} 篇文章`);
    console.log(`- 失败: ${failCount} 篇文章`);
    
    // 更新分类的文章计数
    console.log('\n更新分类的文章计数...');
    
    try {
      // 为每个分类计算文章数量
      for (const category of categories) {
        // 查询该分类关联的文章数量
        const result = await db.get(
          'SELECT COUNT(*) as count FROM post_categories WHERE category_id = ?',
          [category.id]
        );
        
        // 更新分类的post_count字段
        await db.run(
          'UPDATE categories SET post_count = ? WHERE id = ?',
          [result.count, category.id]
        );
        
        console.log(`分类 ${category.slug}: ${result.count} 篇文章`);
      }
      
      console.log('分类文章计数更新完成');
    } catch (error) {
      console.error('更新分类文章计数失败:', error);
    }
    
  } catch (error) {
    // 回滚事务
    await db.exec('ROLLBACK');
    console.error('更新过程出错，事务已回滚:', error);
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