/**
 * Turso数据库适配器
 * 
 * 将Turso数据库接口适配为与SQLite兼容的接口，
 * 使系统其余部分可以无缝切换使用Turso或本地SQLite
 */

import { Database } from './types';
import { getDatabaseUrl, getDatabaseAuthToken } from './env-config';
import { createTursoClientInstance } from './turso-client-new';

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

      if (!url || !authToken) {
        throw new Error('缺少Turso配置: TURSO_DATABASE_URL或TURSO_AUTH_TOKEN未设置');
      }

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
    const result = await this.client.execute({ sql, args: params });
    return result.rows as T[];
  }
  
  /**
   * 执行SQL并返回单个结果
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    await this.initialize();
    const result = await this.client.execute({ sql, args: params });
    return result.rows[0] as T | undefined;
  }
  
  /**
   * 执行SQL并返回受影响的行数
   */
  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    await this.initialize();
    const result = await this.client.execute({ sql, args: params });
    return {
      lastID: result.lastInsertId || 0,
      changes: result.rowsAffected || 0,
    };
  }
  
  /**
   * 执行SQL语句
   */
  async exec(sql: string): Promise<void> {
    await this.initialize();
    await this.client.execute({ sql });
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
   * 准备语句（未实现）
   */
  prepare(): Promise<Statement> {
    throw new Error('TursoAdapter不支持prepare操作');
  }
  
  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // Turso客户端不需要显式关闭
  }
  
  /**
   * 配置（未实现）
   */
  configure(): this {
    console.log('[TursoAdapter] configure - 未实现');
    return this;
  }
  
  /**
   * 迁移（未实现）
   */
  async migrate(): Promise<void> {
    console.log('[TursoAdapter] migrate - 未实现');
  }
  
  /**
   * 函数（未实现）
   */
  function(): void {
    console.log('[TursoAdapter] function - 未实现');
  }
  
  /**
   * 加载扩展（未实现）
   */
  async loadExtension(): Promise<void> {
    console.log('[TursoAdapter] loadExtension - 未实现');
  }
  
  /**
   * 驱动（未实现）
   */
  driver() {
    console.log('[TursoAdapter] driver - 未实现');
    return null;
  }
  
  /**
   * 数据库名称
   */
  name = 'TursoDatabase';
  
  /**
   * 内存数据库（未实现）
   */
  readonly memory = {
    name: ':memory:',
  };
} 