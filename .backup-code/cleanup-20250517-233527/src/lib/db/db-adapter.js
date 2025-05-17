/**
 * 数据库适配器
 * 根据环境自动选择使用SQLite或Turso云数据库
 */

const dbConfig = require('./database-config');
const { executeTursoQuery } = require('./turso-client');

/**
 * 执行数据库查询
 * 根据当前环境自动选择使用SQLite或Turso
 * 
 * @param {string} sql SQL查询语句
 * @param {Array|Object} params 查询参数
 * @returns {Promise<Object>} 查询结果
 */
async function executeQuery(sql, params = []) {
  // 在Vercel环境中使用Turso
  if (dbConfig.useTurso) {
    return await executeTursoQuery(sql, params);
  }
  
  // 在本地开发环境中使用SQLite
  // 注意: 仅在需要时才动态导入SQLite模块，避免在Vercel环境中加载
  try {
    if (dbConfig.logging.queries) {
      console.log(`执行SQLite查询: ${sql}`, params);
    }
    
    // 动态导入SQLite模块
    const sqlite = await import('better-sqlite3').catch(() => 
      import('sqlite').then(({ open }) => open(dbConfig.sqliteFilePath))
    );
    
    // 创建数据库连接
    const db = typeof sqlite.default === 'function' 
      ? sqlite.default(dbConfig.sqliteFilePath) 
      : await sqlite;
    
    // 执行查询
    const stmt = db.prepare(sql);
    const result = Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
    
    // 关闭连接
    if (typeof db.close === 'function') {
      db.close();
    }
    
    return { rows: result };
  } catch (error) {
    if (dbConfig.logging.errors) {
      console.error('SQLite查询执行失败:', error);
      console.error('SQL:', sql);
      console.error('参数:', params);
    }
    throw error;
  }
}

module.exports = {
  executeQuery
}; 