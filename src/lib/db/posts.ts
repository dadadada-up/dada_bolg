import { Post } from '@/types/post';
import { query, queryOne, execute, getDatabase } from './database';

// 检测是否在Vercel环境中
const isVercel = process.env.VERCEL === '1';

// 添加必要的接口定义
interface DbPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  updated: string | null;
  content: string;
  excerpt: string;
  description: string | null;
  published: number;
  featured: number;
  cover_image: string | null;
  reading_time: number | null;
  original_file: string | null;
  created_at: number;
  updated_at: number;
  is_published: number;
  is_featured: number;
  image_url: string | null;
  source_path: string | null;
} 