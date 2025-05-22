/**
 * Turso数据库适配器
 * 
 * 将Turso数据库接口适配为与SQLite兼容的接口，
 * 使系统其余部分可以无缝切换使用Turso或本地SQLite
 */

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
 * Turso运行结果
 */
interface TursoRunResult {
  lastID?: number;
  changes: number;
}

/**
 * Turso数据库适配器，实现通用数据库接口
 */
export class TursoDatabase {
  /**
   * 检查Turso客户端是否可用
   */
  private checkClient() {
    if (!tursoClient) {
      throw new Error('Turso客户端未初始化');
    }
    return true;
  }
  
  /**
   * 执行SQL查询并返回所有结果
   */
  async all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    this.checkClient();
    
    console.log('[TursoAdapter] all:', sql);
    
    const args = params.length ? params : undefined;
    const result = await tursoClient!.execute({ sql, args });
    return result.rows as T[];
  }
  
  /**
   * 执行SQL并返回单个结果
   */
  async get<T = any>(sql: string, ...params: any[]): Promise<T | undefined> {
    this.checkClient();
    
    console.log('[TursoAdapter] get:', sql);
    
    const args = params.length ? params : undefined;
    const result = await tursoClient!.execute({ sql, args });
    return result.rows[0] as T | undefined;
  }
  
  /**
   * 执行SQL并返回受影响的行数
   */
  async run(sql: string, ...params: any[]): Promise<TursoRunResult> {
    this.checkClient();
    
    console.log('[TursoAdapter] run:', sql);
    
    const args = params.length ? params : undefined;
    const result = await tursoClient!.execute({ sql, args });
    
    // 对于INSERT语句，尝试获取last_insert_rowid()
    let lastID: number | undefined = undefined;
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const idResult = await tursoClient!.execute({ 
        sql: 'SELECT last_insert_rowid() as id' 
      });
      lastID = idResult.rows[0]?.id;
    }
    
    return {
      lastID,
      changes: 1 // Turso不提供直接的changes值，默认返回1
    };
  }
  
  /**
   * 执行SQL语句
   */
  async exec(sql: string): Promise<void> {
    this.checkClient();
    console.log('[TursoAdapter] exec:', sql);
    await tursoClient!.execute({ sql });
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