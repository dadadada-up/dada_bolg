/**
 * 本地开发环境初始化脚本
 * 
 * 初始化本地Turso开发环境，包括启动Docker容器和创建基本表结构
 * 使用方法: node scripts/init-dev-db.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 配置
const config = {
  containerName: 'turso-local',
  dataDir: path.join(__dirname, '..', 'data', 'turso'),
  localUrl: 'http://localhost:8080',
  schemaFile: path.join(__dirname, '..', 'schema.sql')
};

// 记录日志
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// 执行命令并返回结果
function execCommand(command) {
  try {
    log(`执行命令: ${command}`);
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`命令执行失败: ${error.message}`);
    return null;
  }
}

// 检查Docker是否安装
function checkDocker() {
  try {
    const result = execCommand('docker --version');
    log(`Docker已安装: ${result.trim()}`);
    return true;
  } catch (error) {
    log('Docker未安装或无法访问');
    return false;
  }
}

// 检查容器是否存在
function checkContainerExists() {
  const result = execCommand(`docker ps -a --filter "name=^${config.containerName}$" --format "{{.Names}}"`);
  return result && result.trim() === config.containerName;
}

// 检查容器是否运行中
function checkContainerRunning() {
  const result = execCommand(`docker ps --filter "name=^${config.containerName}$" --format "{{.Names}}"`);
  return result && result.trim() === config.containerName;
}

// 创建并启动容器
function createAndStartContainer() {
  // 确保数据目录存在
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    log(`创建数据目录: ${config.dataDir}`);
  }
  
  // 运行Docker容器
  const command = `docker run -d --name ${config.containerName} \
    -p 8080:8080 \
    -v ${config.dataDir}:/var/lib/sqld \
    --restart unless-stopped \
    ghcr.io/tursodatabase/libsql-server:latest`;
  
  const result = execCommand(command);
  
  if (result) {
    log(`容器创建成功: ${config.containerName}`);
    return true;
  } else {
    log('容器创建失败');
    return false;
  }
}

// 启动已存在的容器
function startContainer() {
  const result = execCommand(`docker start ${config.containerName}`);
  
  if (result) {
    log(`容器启动成功: ${config.containerName}`);
    return true;
  } else {
    log('容器启动失败');
    return false;
  }
}

// 停止容器
function stopContainer() {
  const result = execCommand(`docker stop ${config.containerName}`);
  
  if (result) {
    log(`容器停止成功: ${config.containerName}`);
    return true;
  } else {
    log('容器停止失败');
    return false;
  }
}

// 删除容器
function removeContainer() {
  const result = execCommand(`docker rm ${config.containerName}`);
  
  if (result) {
    log(`容器删除成功: ${config.containerName}`);
    return true;
  } else {
    log('容器删除失败');
    return false;
  }
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
    
    const req = http.request(config.localUrl, options, (res) => {
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

// 检查数据库连接
async function checkDatabaseConnection() {
  try {
    log('检查数据库连接...');
    await executeQuery('SELECT 1');
    log('数据库连接正常');
    return true;
  } catch (error) {
    log(`数据库连接失败: ${error.message}`);
    return false;
  }
}

// 检查表是否存在
async function checkTablesExist() {
  try {
    log('检查数据库表...');
    const result = await executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    if (!result || !result[0] || !result[0].results || !result[0].results.rows) {
      throw new Error('无效的响应格式');
    }
    
    const tables = result[0].results.rows.map(row => row.name);
    log(`发现 ${tables.length} 个表: ${tables.join(', ')}`);
    
    // 检查必要的表是否存在
    const requiredTables = ['posts', 'categories', 'tags', 'post_categories', 'post_tags', 'slug_mapping'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      log(`缺少必要的表: ${missingTables.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    log(`检查表失败: ${error.message}`);
    return false;
  }
}

// 创建基本表结构
async function createBasicSchema() {
  log('创建基本表结构...');
  
  const schema = `
  -- 文章表
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT 0,
    image_url TEXT,
    reading_time INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  
  -- 分类表
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- 标签表
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
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
    post_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, slug)
  );
  
  -- 同步状态表
  CREATE TABLE IF NOT EXISTS sync_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_sync_time INTEGER,
    sync_in_progress BOOLEAN DEFAULT false
  );
  
  -- 同步队列表
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    path TEXT,
    slug TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  `;
  
  // 保存Schema到文件
  fs.writeFileSync(config.schemaFile, schema, 'utf8');
  log(`Schema已保存到: ${config.schemaFile}`);
  
  // 执行Schema创建
  try {
    // 分割SQL语句并执行
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeQuery(statement);
      }
    }
    
    log('基本表结构创建成功');
    return true;
  } catch (error) {
    log(`创建表结构失败: ${error.message}`);
    return false;
  }
}

// 插入示例数据
async function insertSampleData() {
  log('插入示例数据...');
  
  const queries = [
    // 插入分类
    `INSERT INTO categories (name, slug, description) VALUES 
      ('技术工具', 'tech-tools', '技术工具相关文章'),
      ('产品经理', 'product-management', '产品管理相关文章'),
      ('开源项目', 'open-source', '开源项目相关文章'),
      ('个人博客', 'personal-blog', '个人随笔和博客文章'),
      ('金融', 'finance', '金融相关文章'),
      ('保险', 'insurance', '保险相关文章'),
      ('家庭生活', 'family-life', '家庭生活相关文章'),
      ('未分类', 'uncategorized', '未分类文章')`,
    
    // 插入标签  
    `INSERT INTO tags (name, slug) VALUES 
      ('JavaScript', 'javascript'),
      ('React', 'react'),
      ('Next.js', 'nextjs'),
      ('数据库', 'database'),
      ('博客', 'blog'),
      ('开发', 'development')`,
    
    // 插入示例文章
    `INSERT INTO posts (slug, title, content, excerpt, is_published, is_featured, created_at, updated_at) VALUES 
      ('hello-world', '你好，世界', '这是一篇示例文章的内容。欢迎使用博客系统！', '这是一篇示例文章', 1, 1, '2023-01-01 00:00:00', '2023-01-01 00:00:00'),
      ('getting-started', '开始使用', '这是关于如何开始使用这个博客系统的指南。', '使用指南', 1, 0, '2023-01-02 00:00:00', '2023-01-02 00:00:00')`,
    
    // 关联文章与分类
    `INSERT INTO post_categories (post_id, category_id) VALUES 
      (1, 4), 
      (2, 1)`,
    
    // 关联文章与标签
    `INSERT INTO post_tags (post_id, tag_id) VALUES 
      (1, 5),
      (2, 4),
      (2, 6)`,
    
    // 设置Slug映射
    `INSERT INTO slug_mapping (post_id, slug, is_primary) VALUES 
      (1, 'hello-world', 1),
      (2, 'getting-started', 1)`
  ];
  
  try {
    for (const query of queries) {
      await executeQuery(query);
    }
    
    log('示例数据插入成功');
    return true;
  } catch (error) {
    log(`插入示例数据失败: ${error.message}`);
    return false;
  }
}

// 初始化同步状态
async function initializeSyncStatus() {
  try {
    log('初始化同步状态...');
    await executeQuery(`
      INSERT OR REPLACE INTO sync_status (id, last_sync_time, sync_in_progress) 
      VALUES (1, strftime('%s', 'now'), 0)
    `);
    
    log('同步状态初始化成功');
    return true;
  } catch (error) {
    log(`初始化同步状态失败: ${error.message}`);
    return false;
  }
}

// 等待容器启动
function waitForContainer(attempts = 10, interval = 1000) {
  return new Promise((resolve) => {
    let attempt = 0;
    
    const check = async () => {
      if (attempt >= attempts) {
        log(`容器未能在${attempts}次尝试后启动`);
        resolve(false);
        return;
      }
      
      if (await checkDatabaseConnection()) {
        resolve(true);
        return;
      }
      
      attempt++;
      log(`等待容器启动... (${attempt}/${attempts})`);
      setTimeout(check, interval);
    };
    
    check();
  });
}

// 主函数
async function main() {
  try {
    log('开始初始化本地开发环境...');
    
    // 检查Docker
    if (!checkDocker()) {
      log('请先安装Docker');
      process.exit(1);
    }
    
    // 检查容器状态
    const containerExists = checkContainerExists();
    const containerRunning = checkContainerRunning();
    
    if (containerExists) {
      log(`容器${config.containerName}已存在`);
      
      if (!containerRunning) {
        log(`容器${config.containerName}未运行，正在启动...`);
        if (!startContainer()) {
          log('无法启动容器，请手动检查');
          process.exit(1);
        }
      } else {
        log(`容器${config.containerName}已在运行中`);
      }
    } else {
      log(`容器${config.containerName}不存在，创建新容器...`);
      if (!createAndStartContainer()) {
        log('无法创建容器，请手动检查');
        process.exit(1);
      }
    }
    
    // 等待容器启动完成
    log('等待容器启动完成...');
    const containerReady = await waitForContainer();
    
    if (!containerReady) {
      log('容器未能成功启动，请手动检查');
      process.exit(1);
    }
    
    // 检查表是否存在
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      log('数据库缺少必要的表，创建基本表结构...');
      
      // 创建基本表结构
      if (!await createBasicSchema()) {
        log('创建表结构失败');
        process.exit(1);
      }
      
      // 插入示例数据
      if (!await insertSampleData()) {
        log('插入示例数据失败');
        process.exit(1);
      }
      
      // 初始化同步状态
      if (!await initializeSyncStatus()) {
        log('初始化同步状态失败');
        process.exit(1);
      }
    } else {
      log('数据库表已存在，跳过初始化');
    }
    
    log('\n===========================');
    log('本地开发环境初始化完成!');
    log('- Turso本地服务器地址: http://localhost:8080');
    log('- 数据存储路径: ' + config.dataDir);
    log('- 数据库已包含基本表结构和示例数据');
    log('\n从生产环境同步数据:');
    log('  node scripts/sync-from-prod.js');
    log('\n导出为SQLite文件 (用于Navicat):');
    log('  node scripts/create-sqlite-db.js');
    log('===========================');
  } catch (error) {
    log(`初始化失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main(); 