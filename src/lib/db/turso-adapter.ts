/**
 * Turso数据库适配器
 * 
 * 实现统一的数据库接口
 */

import { Database } from './types';
import { getDatabaseUrl, getDatabaseAuthToken } from './env-config';
import { createTursoClientInstance } from './turso-client';

// 自定义Statement类型，避免从sqlite导入
interface Statement {
  readonly sql: string;
  run(...params: any[]): Promise<any>;
  get(...params: any[]): Promise<any>;
  all(...params: any[]): Promise<any[]>;
  finalize(): Promise<void>;
}

/**
 * Turso运行结果
 */
interface TursoRunResult {
  lastID?: number;
  changes: number;
}

/**
 * Turso数据库适配器，实现通用数据库接口
 */
export class TursoDatabase implements Database {
  private client: any;
  private initialized: boolean = false;

  constructor() {
    // 延迟初始化，避免在构建时执行
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // 获取Turso配置
      const url = getDatabaseUrl();
      const authToken = getDatabaseAuthToken();

      console.log(`[Turso] 连接到数据库: ${url}`);
      
      // 创建Turso客户端
      this.client = createTursoClientInstance(url, authToken);

      this.initialized = true;
      console.log('[Turso] 数据库连接成功');
    } catch (error) {
      console.error('[Turso] 数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 执行SQL查询并返回所有结果
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.initialize();
    
    try {
      const result = await this.client.execute({ 
        sql, 
        args: params.length > 0 ? params : undefined 
      });
    return result.rows as T[];
    } catch (error) {
      console.error('[TursoAdapter] 执行查询失败:', error, '查询:', sql, '参数:', params);
      throw error;
    }
  }
  
  /**
   * 执行SQL并返回单个结果
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    await this.initialize();
    
    try {
      const result = await this.client.execute({ 
        sql, 
        args: params.length > 0 ? params : undefined 
      });
    return result.rows[0] as T | undefined;
    } catch (error) {
      console.error('[TursoAdapter] 执行单行查询失败:', error, '查询:', sql, '参数:', params);
      throw error;
    }
  }
  
  /**
   * 执行SQL并返回受影响的行数
   */
  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    await this.initialize();
    
    try {
      const result = await this.client.execute({ 
        sql, 
        args: params.length > 0 ? params : undefined 
      });
      
      let lastID = 0;
      // 对于INSERT语句，尝试获取last_insert_rowid()
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        try {
          const idResult = await this.client.execute({ 
            sql: 'SELECT last_insert_rowid() as id' 
          });
          lastID = idResult.rows[0]?.id || 0;
        } catch (error) {
          console.warn('[TursoAdapter] 无法获取last_insert_rowid');
        }
      }
      
    return {
        lastID,
      changes: result.rowsAffected || 0,
    };
    } catch (error) {
      console.error('[TursoAdapter] 执行失败:', error, '查询:', sql, '参数:', params);
      throw error;
    }
  }
  
  /**
   * 执行SQL语句
   */
  async exec(sql: string): Promise<void> {
    await this.initialize();
    
    try {
      // 对于包含多条SQL语句的情况，需要分割并逐个执行
      const statements = sql.split(';').filter(s => s.trim());
      
      if (statements.length > 1) {
        await this.client.batch(
          statements.map(statement => ({ sql: statement.trim() }))
        );
      } else {
    await this.client.execute({ sql });
      }
    } catch (error) {
      console.error('[TursoAdapter] 执行失败:', error, '查询:', sql);
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
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // Turso客户端不需要显式关闭
  }
  
  /**
   * 数据库名称
   */
  name = 'TursoDatabase';
} 