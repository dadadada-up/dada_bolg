import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { Database } from './types';

export class SQLiteDatabase implements Database {
  private db: any;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      const dbPath = path.resolve(process.cwd(), 'data', 'blog.db');
      console.log(`[SQLite] 连接数据库: ${dbPath}`);
      
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
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
    await this.initialize();
    return this.db.all(sql, params);
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    await this.initialize();
    return this.db.get(sql, params);
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    await this.initialize();
    return this.db.run(sql, params);
  }

  async exec(sql: string): Promise<void> {
    await this.initialize();
    return this.db.exec(sql);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }
  }
} 