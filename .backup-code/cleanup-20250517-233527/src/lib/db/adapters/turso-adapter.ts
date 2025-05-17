/**
 * Turso数据库适配器
 * 
 * 将Turso数据库接口适配为与SQLite兼容的接口，
 * 使系统其余部分可以无缝切换使用Turso或本地SQLite
 */

import { Database } from 'sqlite';
import tursoClient from './turso-client-new';

// 自定义Statement类型，避免从sqlite导入
interface Statement {
  readonly sql: string;
  run(...params: any[]): Promise<any>;
  get(...params: any[]): Promise<any>;
  all(...params: any[]): Promise<any[]>;
  finalize(): Promise<void>;
}

/**
 * Turso运行结果适配为SQLite格式
 */
interface TursoRunResult {
  lastID?: number;
  changes?: number;
}

/**
 * Turso数据库适配器，实现Database接口
 */
export class TursoDatabase implements Omit<Database, 'get'> {
  /**
   * 检查Turso客户端是否可用
   */
  private checkClient() {
    if (!tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
  }

  /**
   * 执行SQL并返回所有结果
   */
  async all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    this.checkClient();
    
    console.log('[TursoAdapter] all:', sql);
    
    try {
      const args = params.length ? params : undefined;
      // 使用非空断言，因为前面已经检查过了
      const result = await tursoClient!.execute({ 
        sql, 
        args 
      });
      
      return result.rows as T[];
    } catch (error) {
      console.error('[TursoAdapter] 执行查询失败:', error);
      throw error;
    }
  }

  /**
   * 执行SQL并返回单个结果
   * 注意: 这个方法返回类型与Database接口不完全兼容，但实际使用中可以正常工作
   */
  async get<T = any>(sql: string, ...params: any[]): Promise<T | undefined> {
    this.checkClient();
    
    console.log('[TursoAdapter] get:', sql);
    
    try {
      const args = params.length ? params : undefined;
      // 使用非空断言
      const result = await tursoClient!.execute({ 
        sql, 
        args 
      });
      
      return result.rows[0] as T | undefined;
    } catch (error) {
      console.error('[TursoAdapter] 执行单行查询失败:', error);
      throw error;
    }
  }

  /**
   * 执行SQL并返回受影响的行数
   */
  async run(sql: string, ...params: any[]): Promise<TursoRunResult> {
    this.checkClient();
    
    console.log('[TursoAdapter] run:', sql);
    
    try {
      const args = params.length ? params : undefined;
      // 使用非空断言
      const result = await tursoClient!.execute({ 
        sql, 
        args 
      });
      
      // Turso不直接提供lastID，我们在适用情况下尝试从结果获取
      let lastID: number | undefined = undefined;
      
      // 对于INSERT语句，尝试获取last_insert_rowid()
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        try {
          // 使用非空断言
          const idResult = await tursoClient!.execute({ 
            sql: 'SELECT last_insert_rowid() as id' 
          });
          lastID = idResult.rows[0]?.id;
        } catch (error) {
          console.warn('[TursoAdapter] 无法获取last_insert_rowid');
        }
      }
      
      return {
        lastID,
        changes: 1 // Turso不提供直接的changes值，默认返回1
      };
    } catch (error) {
      console.error('[TursoAdapter] 执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行SQL不返回结果
   */
  async exec(sql: string): Promise<void> {
    this.checkClient();
    
    console.log('[TursoAdapter] exec:', sql);
    
    try {
      // 对于包含多条SQL语句的情况，需要分割并逐个执行
      const statements = sql.split(';').filter(s => s.trim());
      
      if (statements.length > 1) {
        // 使用非空断言
        await tursoClient!.batch(
          statements.map(statement => ({ sql: statement.trim() }))
        );
      } else {
        // 使用非空断言
        await tursoClient!.execute({ sql });
      }
    } catch (error) {
      console.error('[TursoAdapter] 执行失败:', error);
      throw error;
    }
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
   * 准备语句（暂不支持，抛出错误）
   */
  prepare(): Promise<Statement> {
    throw new Error('Turso适配器不支持prepare语句');
  }

  /**
   * 关闭连接（对Turso无操作）
   */
  async close(): Promise<void> {
    // Turso不需要显式关闭连接
    console.log('[TursoAdapter] close调用（无操作）');
  }

  /**
   * 适配器不支持的SQLite方法，抛出错误
   */
  configure(): this {
    throw new Error('Turso适配器不支持configure方法');
  }

  /**
   * 适配器不支持的SQLite方法，抛出错误
   */
  async migrate(): Promise<void> {
    throw new Error('Turso适配器不支持migrate方法');
  }

  /**
   * 适配器不支持的SQLite方法，抛出错误
   */
  function(): void {
    throw new Error('Turso适配器不支持function方法');
  }

  /**
   * 适配器不支持的SQLite方法，抛出错误
   */
  async loadExtension(): Promise<void> {
    throw new Error('Turso适配器不支持loadExtension方法');
  }

  /**
   * 获取数据库驱动器的类型（返回null）
   */
  driver() {
    return null;
  }

  /**
   * 获取数据库名称
   */
  name = 'TursoDatabase';

  /**
   * 获取数据库内存使用量（Turso不支持，返回0）
   */
  readonly memory = {
    /**
     * 获取高水位标记（Turso不支持，返回0）
     */
    highWaterMark: 0,
    /**
     * 获取当前使用量（Turso不支持，返回0）
     */
    current: 0
  };
} 