import path from 'path';
import { Database } from './types';
import { isVercelEnv } from './env-config';

export class SQLiteDatabase implements Database {
  private db: any;
  private initialized: boolean = false;

  constructor() {
    // 在Vercel环境中不要尝试初始化SQLite
    if (!isVercelEnv) {
      this.initialize();
    } else {
      console.log('[SQLite] 在Vercel环境中不初始化SQLite');
    }
  }

  private async initialize() {
    if (this.initialized) return;
    if (isVercelEnv) {
      throw new Error('在Vercel环境中不支持SQLite');
    }

    try {
      // 动态导入sqlite模块，避免在构建时加载
      const { open } = await import('sqlite');
      const sqlite3 = await import('sqlite3');
      
      const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
      console.log(`[SQLite] 连接数据库: ${dbPath}`);
      
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.default.Database
      });

      // 启用外键约束
      await this.db.exec('PRAGMA foreign_keys = ON');
      this.initialized = true;
      console.log('[SQLite] 数据库连接成功');
    } catch (error) {
      console.error('[SQLite] 数据库连接失败:', error);
      throw error;
    }
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (isVercelEnv) {
      console.log('[SQLite] Vercel环境中SQLite不可用，返回空数组');
      return [];
    }
    await this.initialize();
    return this.db.all(sql, params);
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (isVercelEnv) {
      console.log('[SQLite] Vercel环境中SQLite不可用，返回undefined');
      return undefined;
    }
    await this.initialize();
    return this.db.get(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (isVercelEnv) {
      console.log('[SQLite] Vercel环境中SQLite不可用，返回空结果');
      return { lastID: 0, changes: 0 };
    }
    await this.initialize();
    return this.db.run(sql, params);
  }

  async exec(sql: string): Promise<void> {
    if (isVercelEnv) {
      console.log('[SQLite] Vercel环境中SQLite不可用，跳过执行');
      return;
    }
    await this.initialize();
    return this.db.exec(sql);
  }

  async close(): Promise<void> {
    if (this.db && !isVercelEnv) {
      await this.db.close();
    }
  }
} 