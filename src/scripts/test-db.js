// 测试数据库操作的脚本
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_PATH = path.resolve(process.cwd(), 'data', 'blog.db');

// 确保数据库文件存在
if (!fs.existsSync(DB_PATH)) {
  console.error(`数据库文件不存在: ${DB_PATH}`);
  process.exit(1);
}

// 打开数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('打开数据库失败:', err.message);
    process.exit(1);
  }
  console.log(`成功连接到数据库: ${DB_PATH}`);
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON');

// 查询文章
const getPost = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM posts WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('查询文章失败:', err.message);
        reject(err);
      } else {
        console.log('查询文章成功:', row);
        resolve(row);
      }
    });
  });
};

// 更新文章
const updatePost = (id, title, content) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE posts 
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `;
    
    const now = new Date().toISOString();
    db.run(sql, [title, content, now, id], function(err) {
      if (err) {
        console.error('更新文章失败:', err.message);
        reject(err);
      } else {
        console.log(`更新文章成功，影响行数: ${this.changes}`);
        resolve(this.changes);
      }
    });
  });
};

// 主函数
const main = async () => {
  try {
    // 查询ID为175的文章
    const post = await getPost(175);
    
    if (!post) {
      console.log('文章不存在');
      return;
    }
    
    // 更新文章
    const newTitle = '产品经理基础篇：项目管理入门修改测试';
    const newContent = '测试内容 - 通过脚本更新';
    
    await updatePost(post.id, newTitle, newContent);
    
    // 再次查询文章，验证更新是否成功
    const updatedPost = await getPost(175);
    console.log('更新后的文章:', updatedPost);
    
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  }
};

// 执行主函数
main(); 