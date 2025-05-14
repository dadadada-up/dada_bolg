import { Database } from 'sqlite';
import tursoClient, { useTurso } from './turso-client';

/**
 * Turso数据库适配器 - 将Turso客户端的接口转换为SQLite接口
 */
export class TursoDatabase implements Database {
  /**
   * 执行SQL语句（不返回结果）
   */
  async exec(sql: string): Promise<void> {
    if (!useTurso || !tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    await tursoClient.execute(sql);
  }

  /**
   * 执行SQL语句并返回结果（用于INSERT、UPDATE、DELETE等）
   */
  async run(sql: string, ...params: any[]): Promise<any> {
    if (!useTurso || !tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    const result = await tursoClient.execute({ 
      sql, 
      args: params.length > 0 ? params : undefined 
    });
    
    return {
      lastID: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : undefined,
      changes: result.rowsAffected || 0
    };
  }

  /**
   * 执行SQL查询并返回第一行结果
   */
  async get(sql: string, ...params: any[]): Promise<any> {
    if (!useTurso || !tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    const result = await tursoClient.execute({ 
      sql, 
      args: params.length > 0 ? params : undefined 
    });
    
    return result.rows[0] || null;
  }

  /**
   * 执行SQL查询并返回所有行结果
   */
  async all(sql: string, ...params: any[]): Promise<any[]> {
    if (!useTurso || !tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    const result = await tursoClient.execute({ 
      sql, 
      args: params.length > 0 ? params : undefined 
    });
    
    return result.rows || [];
  }

  /**
   * 执行事务
   */
  async transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
    if (!useTurso || !tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    
    try {
      await this.exec('BEGIN');
      const result = await fn(this);
      await this.exec('COMMIT');
      return result;
    } catch (error) {
      await this.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   * 注意：Turso客户端不需要显式关闭
   */
  async close(): Promise<void> {
    // Turso客户端不需要显式关闭
    console.log('[数据库] Turso连接不需要显式关闭');
  }

  /**
   * 返回Turso原始客户端，用于特殊情况
   */
  getRawClient() {
    return tursoClient;
  }

  // 实现其他必要的Database接口方法...
  // 根据实际使用情况添加更多方法
} 