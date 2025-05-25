#!/usr/bin/env ts-node
/**
 * 用于查找和处理重复的文章
 * 
 * 使用方法：
 * npx ts-node --esm src/scripts/find-duplicate-posts.ts --delete --merge --verbose --title="标题关键词"
 * 
 * 选项：
 * --delete: 删除重复的文章
 * --merge: 合并重复的文章
 * --verbose: 显示详细信息
 * --title="标题关键词": 按标题关键词筛选
 * 
 * 所有参数都是可选的。默认情况下，脚本只会显示重复文章，不会执行任何修改操作。
 */

// 使用CommonJS风格导入以兼容ts-node
const dbModule = require('../lib/db');
const { getDb, initDb } = dbModule;
const { differenceInDays, parseISO } = require('date-fns');

// 定义文章类型接口
interface Post {
  id: string;
  slug: string;
  title: string;
  date: string;
  content: string;
  original_file?: string;
}

// 解析命令行参数
const args = process.argv.slice(2);
const DELETE_MODE = args.includes('--delete');
const MERGE_MODE = args.includes('--merge');
const VERBOSE = args.includes('--verbose');
let TITLE_FILTER = '';

// 提取标题关键词
args.forEach(arg => {
  if (arg.startsWith('--title=')) {
    TITLE_FILTER = arg.substring('--title='.length).toLowerCase();
  }
});

// 定义相似度阈值
const TITLE_SIMILARITY_THRESHOLD = 0.8;
const CONTENT_SIMILARITY_THRESHOLD = 0.8;
const MIN_CONTENT_LENGTH = 200; // 最小内容长度

// 计算字符串相似度 (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // 计算Levenshtein距离
  const costs = Array(shorter.length + 1).fill(0);
  
  for (let i = 0; i <= shorter.length; i++) {
    costs[i] = i;
  }
  
  for (let i = 1; i <= longer.length; i++) {
    let lastValue = i;
    
    for (let j = 1; j <= shorter.length; j++) {
      const costToInsert = costs[j - 1] + 1;
      const costToDelete = costs[j] + 1;
      
      let costToSubstitute = lastValue;
      if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
        costToSubstitute += 1;
      }
      
      lastValue = costs[j];
      costs[j] = Math.min(costToInsert, costToDelete, costToSubstitute);
    }
  }
  
  // 计算相似度
  const distance = costs[shorter.length];
  const similarity = 1.0 - distance / longer.length;
  return similarity;
}

// 简化文章内容用于比较
function simplifyContent(content: string): string {
  // 去除HTML标签的简单实现(不使用依赖)
  const strippedContent = content
    .replace(/<[^>]*>/g, ' ') // 去除HTML标签
    .replace(/&[a-z0-9]+;/gi, ' '); // 去除HTML实体
  
  // 替换所有空白字符为单个空格
  return strippedContent
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// 初始化数据库
initDb();
const db = getDb();

// 获取所有文章
console.log('📊 加载文章...');
const postsQuery = `
  SELECT 
    id, slug, title, date, content, original_file
  FROM posts
  ${TITLE_FILTER ? "WHERE title LIKE ?" : ""}
  ORDER BY date DESC
`;

const postsData = TITLE_FILTER
  ? db.prepare(postsQuery).all(`%${TITLE_FILTER}%`)
  : db.prepare(postsQuery).all();

// 确保获取的数据符合Post接口
const posts: Post[] = postsData.map((p: any) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  date: p.date,
  content: p.content,
  original_file: p.original_file
}));

console.log(`📝 共加载${posts.length}篇文章`);

// 标记已经处理过的文章ID，避免重复处理
const processedIds = new Set<string>();

// 用于存储重复组
const duplicateGroups: Post[][] = [];

// 查找重复文章
console.log('🔍 查找重复文章...');

for (let i = 0; i < posts.length; i++) {
  const post1 = posts[i];
  
  // 如果已处理过，则跳过
  if (processedIds.has(post1.id)) continue;
  
  const duplicates: Post[] = [post1];
  
  for (let j = i + 1; j < posts.length; j++) {
    const post2 = posts[j];
    
    // 如果已处理过，则跳过
    if (processedIds.has(post2.id)) continue;
    
    // 计算标题相似度
    const titleSimilarity = calculateSimilarity(
      post1.title.toLowerCase(), 
      post2.title.toLowerCase()
    );
    
    // 如果标题相似度高，检查内容
    if (titleSimilarity >= TITLE_SIMILARITY_THRESHOLD) {
      // 简化内容用于比较
      const content1 = simplifyContent(post1.content);
      const content2 = simplifyContent(post2.content);
      
      // 如果内容太短，跳过比较
      if (content1.length < MIN_CONTENT_LENGTH || content2.length < MIN_CONTENT_LENGTH) {
        continue;
      }
      
      // 计算内容相似度
      const contentSimilarity = calculateSimilarity(content1, content2);
      
      if (VERBOSE) {
        console.log(`比较: "${post1.title}" vs "${post2.title}"`);
        console.log(`  - 标题相似度: ${(titleSimilarity * 100).toFixed(2)}%`);
        console.log(`  - 内容相似度: ${(contentSimilarity * 100).toFixed(2)}%`);
      }
      
      // 如果内容相似度高，添加到重复组
      if (contentSimilarity >= CONTENT_SIMILARITY_THRESHOLD) {
        duplicates.push(post2);
        processedIds.add(post2.id);
      }
    }
  }
  
  // 如果找到重复，添加到重复组
  if (duplicates.length > 1) {
    duplicateGroups.push(duplicates);
    processedIds.add(post1.id);
  }
}

// 输出重复文章信息
if (duplicateGroups.length === 0) {
  console.log('✅ 没有找到重复文章');
  process.exit(0);
}

console.log(`\n🔄 找到${duplicateGroups.length}组重复文章：`);

// 处理每组重复
duplicateGroups.forEach((group, groupIndex) => {
  console.log(`\n第${groupIndex + 1}组: 共${group.length}篇文章`);
  
  // 按日期排序(新到旧)
  group.sort((a, b) => {
    try {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    } catch (e) {
      return 0;
    }
  });
  
  // 确定保留哪一篇(默认保留最新的)
  const keep = group[0];
  const duplicates = group.slice(1);
  
  console.log(`保留文章: [${keep.id}] ${keep.title} (${keep.date}) - ${keep.slug}`);
  console.log('重复文章:');
  
  duplicates.forEach(dup => {
    const daysDiff = differenceInDays(
      parseISO(keep.date),
      parseISO(dup.date)
    );
    
    console.log(`  - [${dup.id}] ${dup.title} (${dup.date}) - ${dup.slug}`);
    console.log(`    与保留文章相差${Math.abs(daysDiff)}天`);
    
    if (VERBOSE) {
      console.log(`    原始文件: ${dup.original_file || '未知'}`);
    }
  });
  
  // 删除重复文章
  if (DELETE_MODE) {
    console.log('🗑️ 删除重复文章...');
    
    duplicates.forEach(dup => {
      try {
        // 删除文章
        db.prepare('DELETE FROM posts WHERE id = ?').run(dup.id);
        console.log(`  ✓ 已删除: ${dup.title}`);
      } catch (error) {
        console.error(`  ✗ 删除失败: ${dup.title}`, error);
      }
    });
  }
  
  // 合并重复文章
  if (MERGE_MODE) {
    console.log('🔄 合并重复文章...');
    
    const keepSlug = keep.slug;
    
    duplicates.forEach(dup => {
      try {
        // 将重复文章的slug添加为slug_mapping
        const existingMapping = db.prepare('SELECT * FROM slug_mapping WHERE slug = ?').get(dup.slug);
        
        if (!existingMapping) {
          db.prepare('INSERT INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, 0)')
            .run(dup.slug, keep.id);
          
          console.log(`  ✓ 已添加slug映射: ${dup.slug} → ${keepSlug}`);
        } else {
          console.log(`  ℹ️ slug映射已存在: ${dup.slug}`);
        }
        
        // 如果启用了删除模式，删除重复文章
        if (DELETE_MODE) {
          // 已在前面的删除步骤处理
        } else {
          console.log(`  ⚠️ 重复文章保留在数据库中: ${dup.title}`);
        }
      } catch (error) {
        console.error(`  ✗ 合并失败: ${dup.title}`, error);
      }
    });
  }
});

// 统计和总结
console.log('\n📊 重复文章统计:');
console.log(`  - 找到${duplicateGroups.length}组重复文章`);
console.log(`  - 涉及${[...processedIds].length}篇文章`);
console.log(`  - 总共需要删除${duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0)}篇文章`);

if (!DELETE_MODE && !MERGE_MODE) {
  console.log('\n⚠️ 这是模拟运行。如需实际删除或合并，请添加 --delete 或 --merge 参数');
}

console.log('\n✅ 完成'); 