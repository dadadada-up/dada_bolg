/**
 * 插入测试文章到数据库
 * 运行: node scripts/insert-test-article.cjs
 */

const sqlite3 = require('sqlite3').verbose();

// 连接到数据库
const db = new sqlite3.Database('./data/blog.db', (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 执行事务
db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  
  try {
    // 插入文章
    db.run(`
      INSERT OR REPLACE INTO posts (
        slug, title, content, excerpt, description, 
        is_published, is_featured, reading_time, image_url, 
        created_at, updated_at, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'fang-di-chan-xi-lie',
      '房地产系列文章',
      '# 房地产系列文章\n\n这是一系列关于房地产投资的文章，详细介绍了房地产的基本概念、投资策略和风险管理。\n\n## 为什么要投资房地产\n\n房地产投资是一种非常稳定的投资方式，可以带来持续的现金流和潜在的资本增值。\n\n## 房地产投资的类型\n\n- 住宅房产\n- 商业房产\n- 工业房产\n- REITs（房地产投资信托）',
      '这是一系列关于房地产投资的文章，详细介绍了房地产的基本概念、投资策略和风险管理。',
      '房地产投资系列文章，包含投资策略、风险分析和市场趋势',
      1, // is_published
      1, // is_featured
      5, // reading_time
      'https://example.com/images/real-estate.jpg',
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString()
    ], function(err) {
      if (err) {
        console.error('插入文章失败:', err.message);
        db.run('ROLLBACK');
        process.exit(1);
      }
      
      const postId = this.lastID;
      console.log(`成功插入文章 ID: ${postId}`);
      
      // 确保投资理财分类存在
      db.get('SELECT id FROM categories WHERE slug = ?', ['finance'], (err, row) => {
        if (err) {
          console.error('查询分类失败:', err.message);
          db.run('ROLLBACK');
          return;
        }
        
        let categoryId;
        if (row) {
          categoryId = row.id;
          linkPostToCategory();
        } else {
          // 创建投资理财分类
          db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', 
            ['投资理财', 'finance', '投资理财相关文章'], 
            function(err) {
              if (err) {
                console.error('创建分类失败:', err.message);
                db.run('ROLLBACK');
                return;
              }
              categoryId = this.lastID;
              linkPostToCategory();
            }
          );
        }
        
        function linkPostToCategory() {
          // 关联文章和分类
          db.run('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)', 
            [postId, categoryId], 
            (err) => {
              if (err) {
                console.error('关联文章和分类失败:', err.message);
                db.run('ROLLBACK');
                return;
              }
              
              console.log('文章分类关联成功');
              addTags();
            }
          );
        }
      });
      
      function addTags() {
        // 添加标签
        const tags = [
          { name: '房地产', slug: 'real-estate' },
          { name: '投资', slug: 'investment' },
          { name: '理财', slug: 'finance' }
        ];
        
        let tagsDone = 0;
        
        tags.forEach(tag => {
          // 检查标签是否存在
          db.get('SELECT id FROM tags WHERE slug = ?', [tag.slug], (err, row) => {
            if (err) {
              console.error(`查询标签失败 ${tag.name}:`, err.message);
              return;
            }
            
            let tagId;
            if (row) {
              tagId = row.id;
              linkTagToPost();
            } else {
              // 创建新标签
              db.run('INSERT INTO tags (name, slug) VALUES (?, ?)', 
                [tag.name, tag.slug], 
                function(err) {
                  if (err) {
                    console.error(`创建标签失败 ${tag.name}:`, err.message);
                    return;
                  }
                  tagId = this.lastID;
                  linkTagToPost();
                }
              );
            }
            
            function linkTagToPost() {
              // 关联标签和文章
              db.run('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', 
                [postId, tagId], 
                (err) => {
                  if (err) {
                    console.error(`关联标签和文章失败 ${tag.name}:`, err.message);
                    return;
                  }
                  
                  tagsDone++;
                  if (tagsDone === tags.length) {
                    console.log('所有标签关联完成');
                    addSlugMappings();
                  }
                }
              );
            }
          });
        });
      }
      
      function addSlugMappings() {
        // 添加slug映射
        const slugMappings = [
          { slug: 'fang-di-chan-xi-lie', isPrimary: 1 },
          { slug: 'yi-wen-xiang-jie-fang-di-chan-tou-zi-1686cmce', isPrimary: 0 }
        ];
        
        let slugsDone = 0;
        
        slugMappings.forEach(mapping => {
          db.run('INSERT OR REPLACE INTO slug_mapping (slug, post_id, is_primary) VALUES (?, ?, ?)',
            [mapping.slug, postId, mapping.isPrimary],
            (err) => {
              if (err) {
                console.error(`添加slug映射失败 ${mapping.slug}:`, err.message);
                return;
              }
              
              slugsDone++;
              if (slugsDone === slugMappings.length) {
                console.log('所有slug映射添加完成');
                
                // 提交事务
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('提交事务失败:', err.message);
                    db.run('ROLLBACK');
                  } else {
                    console.log('所有操作成功完成');
                  }
                  
                  // 关闭数据库连接
                  db.close();
                });
              }
            }
          );
        });
      }
    });
  } catch (error) {
    console.error('执行过程中发生错误:', error);
    db.run('ROLLBACK');
    db.close();
  }
}); 