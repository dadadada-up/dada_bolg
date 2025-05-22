/**
 * Turso数据库适配器
 * 
 * 将Turso数据库接口适配为与SQLite兼容的接口，
 * 使系统其余部分可以无缝切换使用Turso或本地SQLite
 */

import tursoClient from './turso-client-new';
import * as fallbackData from '../fallback-data';

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
 * Turso数据库适配器，实现通用数据库接口
 */
export class TursoDatabase {
  /**
   * 检查Turso客户端是否可用
   */
  private checkClient() {
    if (!tursoClient) {
      console.warn('[TursoAdapter] Turso客户端未初始化，将使用备用数据');
      return false;
    }
    return true;
  }
  
  /**
   * 执行SQL查询并返回所有结果
   */
  async all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    const clientAvailable = this.checkClient();
    
    console.log('[TursoAdapter] all:', sql);
    
    if (!clientAvailable) {
      return this.getFallbackResults<T[]>(sql, params, 'all');
    }
    
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
      return this.getFallbackResults<T[]>(sql, params, 'all');
    }
  }
  
  /**
   * 执行SQL并返回单个结果
   * 注意: 这个方法返回类型与Database接口不完全兼容，但实际使用中可以正常工作
   */
  async get<T = any>(sql: string, ...params: any[]): Promise<T | undefined> {
    const clientAvailable = this.checkClient();
    
    console.log('[TursoAdapter] get:', sql);
    
    if (!clientAvailable) {
      return this.getFallbackResults<T | undefined>(sql, params, 'get');
    }
    
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
      return this.getFallbackResults<T | undefined>(sql, params, 'get');
    }
  }
  
  /**
   * 执行SQL并返回受影响的行数
   */
  async run(sql: string, ...params: any[]): Promise<TursoRunResult> {
    const clientAvailable = this.checkClient();
    
    console.log('[TursoAdapter] run:', sql);
    
    if (!clientAvailable) {
      return { lastID: 1, changes: 1 };
    }
    
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
      return { lastID: 1, changes: 1 };
    }
  }
  
  /**
   * 执行SQL语句
   */
  async exec(sql: string): Promise<void> {
    const clientAvailable = this.checkClient();
    
    console.log('[TursoAdapter] exec:', sql);
    
    if (!clientAvailable) {
      return;
    }
    
    try {
      // 使用非空断言
      await tursoClient!.execute({ sql });
    } catch (error) {
      console.error('[TursoAdapter] 执行失败:', error);
    }
  }
  
  /**
   * 获取备用数据结果
   */
  private getFallbackResults<T>(sql: string, params: any[], method: 'get' | 'all'): T {
    console.log(`[TursoAdapter] 使用备用数据 (${method}): ${sql}`);
    
    // 提取查询类型，简单判断是SELECT还是其他操作
    const queryType = sql.trim().toLowerCase().startsWith('select') ? 'select' : 'other';
    
    if (queryType === 'select') {
      // 针对不同的查询返回不同的模拟数据
      if (sql.includes('FROM posts') || sql.includes('from posts')) {
        if (method === 'get') {
          // 尝试提取slug参数
          const slugMatch = sql.match(/WHERE\s+slug\s*=\s*['"]?([^'"\s)]+)['"]?/i);
          const slugParam = slugMatch ? slugMatch[1] : (params[0] || '');
          
          // 根据slug获取文章
          const post = fallbackData.getFallbackPostBySlug(slugParam) || fallbackData.getAllFallbackPosts()[0];
          return post as unknown as T;
        } else {
          // 返回所有文章
          return fallbackData.getAllFallbackPosts() as unknown as T;
        }
      } else if (sql.includes('FROM categories') || sql.includes('from categories')) {
        if (method === 'get') {
          return fallbackData.fallbackCategories[0] as unknown as T;
        } else {
          return fallbackData.fallbackCategories as unknown as T;
        }
      } else if (sql.includes('FROM tags') || sql.includes('from tags')) {
        if (method === 'get') {
          return fallbackData.fallbackTags[0] as unknown as T;
        } else {
          return fallbackData.fallbackTags as unknown as T;
        }
      } else if (sql.includes('COUNT') || sql.includes('count')) {
        // 返回计数查询模拟数据
        if (method === 'get') {
          return { total: 1, count: 1 } as unknown as T;
        } else {
          return [{ total: 1, count: 1 }] as unknown as T;
        }
      } else if (sql.includes('last_insert_rowid()')) {
        // 返回最后插入ID
        if (method === 'get') {
          return { id: 1 } as unknown as T;
        } else {
          return [{ id: 1 }] as unknown as T;
        }
      }
    }
    
    // 默认返回
    if (method === 'get') {
      return undefined as unknown as T;
    } else {
      return [] as unknown as T;
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
   * 准备语句（未实现）
   */
  prepare(): Promise<Statement> {
    throw new Error('TursoAdapter不支持prepare操作');
  }
  
  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    console.log('[TursoAdapter] close');
    // Turso不需要显式关闭
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