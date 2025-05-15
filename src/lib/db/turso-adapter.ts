import { Database } from 'sqlite';
import tursoClient from './turso-client';

/**
 * Turso数据库适配器
 * 将Turso客户端接口转换为与SQLite兼容的接口
 */

// 兼容的RunResult接口
interface RunResult {
  lastID: number;
  changes: number;
}

/**
 * Turso数据库适配器类
 * 实现SQLite Database接口，转发调用到Turso客户端
 */
export class TursoDatabase implements Database {
  /**
   * 执行SQL语句，不返回结果
   */
  async exec(sql: string): Promise<void> {
    console.log(`[TursoAdapter] exec: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
    
    if (!tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    await tursoClient.execute({ sql });
  }
  
  /**
   * 执行SQL语句，返回修改信息
   */
  async run(sql: string, ...params: any[]): Promise<RunResult> {
    console.log(`[TursoAdapter] run: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
    
    if (!tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    // 执行SQL
    const result = await tursoClient.execute({ sql, args: params });
    
    // 检查是否是INSERT语句并需要获取lastID
    let lastID = 0;
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      try {
        // 尝试获取最后插入的ID
        const lastIdResult = await tursoClient.execute({ 
          sql: 'SELECT last_insert_rowid() as lastID'
        });
        if (lastIdResult.rows.length > 0 && lastIdResult.rows[0].lastID) {
          lastID = Number(lastIdResult.rows[0].lastID);
        }
      } catch (error) {
        console.warn('[TursoAdapter] 无法获取last_insert_rowid()', error);
      }
    }
    
    // 提取变更数量
    let changes = 0;
    if (sql.trim().toUpperCase().startsWith('INSERT') || 
        sql.trim().toUpperCase().startsWith('UPDATE') || 
        sql.trim().toUpperCase().startsWith('DELETE')) {
      try {
        // 尝试获取变更数量
        const changesResult = await tursoClient.execute({ 
          sql: 'SELECT changes() as changes'
        });
        if (changesResult.rows.length > 0 && changesResult.rows[0].changes !== undefined) {
          changes = Number(changesResult.rows[0].changes);
        }
      } catch (error) {
        console.warn('[TursoAdapter] 无法获取changes()', error);
      }
    }
    
    return { lastID, changes };
  }
  
  /**
   * 执行SQL查询，返回单行结果
   */
  async get<T = any>(sql: string, ...params: any[]): Promise<T> {
    console.log(`[TursoAdapter] get: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
    
    if (!tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    const result = await tursoClient.execute({ sql, args: params });
    return (result.rows[0] || null) as T;
  }
  
  /**
   * 执行SQL查询，返回所有结果
   */
  async all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    console.log(`[TursoAdapter] all: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
    
    if (!tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    const result = await tursoClient.execute({ sql, args: params });
    return result.rows as T[];
  }
  
  /**
   * 关闭数据库连接
   * Turso客户端不需要显式关闭
   */
  async close(): Promise<void> {
    console.log('[TursoAdapter] close (noop)');
    // Turso不需要显式关闭
  }
  
  /**
   * 执行SQL语句，每行调用回调函数
   * 不支持，抛出错误
   */
  async each(): Promise<void> {
    throw new Error('TursoDatabase不支持each方法');
  }
  
  /**
   * 准备SQL语句
   * 不支持，抛出错误
   */
  async prepare(): Promise<any> {
    throw new Error('TursoDatabase不支持prepare方法');
  }
  
  /**
   * 开始事务
   */
  async begin(): Promise<void> {
    await this.exec('BEGIN TRANSACTION');
  }
  
  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    await this.exec('COMMIT');
  }
  
  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    await this.exec('ROLLBACK');
  }
  
  /**
   * 获取底层Turso客户端
   * 用于特殊情况下直接访问
   */
  getRawClient() {
    return tursoClient;
  }
} 