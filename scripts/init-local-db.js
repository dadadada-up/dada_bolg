/**
 * 初始化本地开发数据库脚本
 * 
 * 创建与生产环境相同的数据库结构和初始数据
 * 使用方法: node scripts/init-local-db.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

// 配置
const config = {
  tursoUrl: 'http://localhost:8080',  // 本地Turso服务器
  schemaFile: path.join(__dirname, '..', 'schema.sql'),  // 数据库结构文件
  sampleDataFile: path.join(__dirname, '..', 'sample-data.sql')  // 示例数据文件
};

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 执行HTTP API查询
async function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(config.tursoUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          console.error('解析响应失败:', error, 'Raw data:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify({
      statements: [{ q: query }]
    }));
    
    req.end();
  });
}

// 写入数据库架构
async function writeSchema() {
  // 数据库架构
  const schema = `
  -- 文章表
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    content_html TEXT,
    excerpt TEXT,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT 0,
    is_yaml_valid BOOLEAN NOT NULL DEFAULT 1,
    is_manually_edited BOOLEAN NOT NULL DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    source_path TEXT,
    image_url TEXT,
    yuque_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
  );
  
  -- 分类表
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER,
    post_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- 标签表
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    post_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- 文章-分类关联表
  CREATE TABLE IF NOT EXISTS post_categories (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, category_id)
  );
  
  -- 文章-标签关联表
  CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id)
  );
  
  -- Slug映射表
  CREATE TABLE IF NOT EXISTS slug_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_primary BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- 同步状态表
  CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT,
    target TEXT,
    status TEXT,
    items_synced INTEGER DEFAULT 0,
    message TEXT
  );`;
  
  // 保存架构文件
  fs.writeFileSync(config.schemaFile, schema, 'utf8');
  log(`数据库架构已保存到: ${config.schemaFile}`);
  
  // 执行架构文件
  try {
    log('正在创建数据库架构...');
    const queries = schema.split(';').filter(q => q.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        await executeQuery(query);
      }
    }
    
    log('数据库架构创建成功');
    return true;
  } catch (error) {
    log(`创建数据库架构失败: ${error.message}`);
    return false;
  }
}

// 填充示例数据
async function writeSampleData() {
  // 示例数据
  const sampleData = `
  -- 示例数据
  INSERT INTO posts (slug, title, content, excerpt, is_published, is_featured, created_at, updated_at, published_at)
  VALUES ('hello-world', 'Hello World', 'This is a test post', 'Test post excerpt', 1, 1, '2023-05-26 07:06:20', '2023-05-26 07:06:20', '2023-05-26 07:06:20');
  
  INSERT INTO categories (name, slug, description)
  VALUES 
    ('编程', 'programming', '编程相关文章'),
    ('技术', 'tech', '技术相关文章'),
    ('生活', 'life', '生活随笔');
  
  INSERT INTO tags (name, slug)
  VALUES ('测试', 'test');
  
  -- 关联文章与分类
  INSERT INTO post_categories (post_id, category_id, created_at)
  VALUES (1, 2, '2023-05-26 07:06:50');
  
  -- 关联文章与标签
  INSERT INTO post_tags (post_id, tag_id, created_at)
  VALUES (1, 1, '2023-05-26 07:07:05');
  
  -- 设置Slug映射
  INSERT INTO slug_mapping (post_id, slug, is_primary)
  VALUES (1, 'hello-world', 1);`;
  
  // 保存示例数据文件
  fs.writeFileSync(config.sampleDataFile, sampleData, 'utf8');
  log(`示例数据已保存到: ${config.sampleDataFile}`);
  
  // 执行示例数据
  try {
    log('正在填充示例数据...');
    const queries = sampleData.split(';').filter(q => q.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        await executeQuery(query);
      }
    }
    
    log('示例数据填充成功');
    return true;
  } catch (error) {
    log(`填充示例数据失败: ${error.message}`);
    return false;
  }
}

// 检查Turso服务器状态
async function checkTursoServer() {
  try {
    log('检查Turso服务器状态...');
    await executeQuery('SELECT 1');
    log('Turso服务器正常运行');
    return true;
  } catch (error) {
    log(`Turso服务器未运行或无法连接: ${error.message}`);
    log('请确保Docker容器已启动: docker start turso-local');
    return false;
  }
}

// 主函数
async function main() {
  try {
    log('开始初始化本地开发数据库...');
    
    // 检查Turso服务器
    const serverOk = await checkTursoServer();
    if (!serverOk) {
      log('无法连接到Turso服务器，初始化失败');
      process.exit(1);
    }
    
    // 创建数据库架构
    const schemaOk = await writeSchema();
    if (!schemaOk) {
      log('创建数据库架构失败');
      process.exit(1);
    }
    
    // 填充示例数据
    const dataOk = await writeSampleData();
    if (!dataOk) {
      log('填充示例数据失败');
      process.exit(1);
    }
    
    log('\n===========================');
    log('本地数据库初始化成功!');
    log('现在您的本地开发数据库已经与生产环境保持一致');
    log('可通过Navicat查看: /navicat_import/blog_database.db');
    log('===========================');
  } catch (error) {
    log(`初始化失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 