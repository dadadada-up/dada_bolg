BEGIN TRANSACTION;

-- 创建一个映射表来存储要合并的分类ID
CREATE TEMP TABLE category_mapping AS
WITH preferred_categories AS (
  SELECT MIN(id) as keep_id, 
         CASE 
           WHEN name LIKE '%读书笔记%' OR name = 'reading' OR slug LIKE '%reading%' THEN '读书笔记'
           WHEN name LIKE '%技术工具%' OR name = 'tech-tools%' OR name = '技术' OR slug LIKE '%tech-tools%' THEN '技术工具'
           WHEN name LIKE '%产品经理%' OR name = 'product-management%' OR slug LIKE '%product-management%' THEN '产品经理'
           WHEN name LIKE '%家庭生活%' OR name = 'family-life%' OR slug LIKE '%family-life%' THEN '家庭生活'
           WHEN name LIKE '%保险%' OR name = 'insurance%' OR slug LIKE '%insurance%' THEN '保险'
           WHEN name LIKE '%金融%' OR name = 'finance%' OR slug LIKE '%finance%' THEN '金融'
           WHEN name LIKE '%开源%' OR name = 'open-source%' OR slug LIKE '%open-source%' THEN '开源'
           ELSE name
         END as normalized_name
  FROM categories
  GROUP BY normalized_name
)
SELECT c.id as old_id, pc.keep_id as new_id
FROM categories c
JOIN preferred_categories pc
ON CASE 
     WHEN c.name LIKE '%读书笔记%' OR c.name = 'reading' OR c.slug LIKE '%reading%' THEN '读书笔记'
     WHEN c.name LIKE '%技术工具%' OR c.name = 'tech-tools%' OR c.name = '技术' OR c.slug LIKE '%tech-tools%' THEN '技术工具'
     WHEN c.name LIKE '%产品经理%' OR c.name = 'product-management%' OR c.slug LIKE '%product-management%' THEN '产品经理'
     WHEN c.name LIKE '%家庭生活%' OR c.name = 'family-life%' OR c.slug LIKE '%family-life%' THEN '家庭生活'
     WHEN c.name LIKE '%保险%' OR c.name = 'insurance%' OR c.slug LIKE '%insurance%' THEN '保险'
     WHEN c.name LIKE '%金融%' OR c.name = 'finance%' OR c.slug LIKE '%finance%' THEN '金融'
     WHEN c.name LIKE '%开源%' OR c.name = 'open-source%' OR c.slug LIKE '%open-source%' THEN '开源'
     ELSE c.name
   END = pc.normalized_name;

-- 更新post_categories表中的category_id
UPDATE post_categories
SET category_id = (
  SELECT new_id 
  FROM category_mapping 
  WHERE old_id = category_id
)
WHERE category_id IN (SELECT old_id FROM category_mapping);

-- 删除不需要的分类
DELETE FROM categories 
WHERE id IN (
  SELECT old_id 
  FROM category_mapping 
  WHERE old_id != new_id
);

-- 更新保留的分类记录
UPDATE categories
SET name = CASE 
    WHEN name LIKE '%读书笔记%' OR name = 'reading' OR slug LIKE '%reading%' THEN '读书笔记'
    WHEN name LIKE '%技术工具%' OR name = 'tech-tools%' OR name = '技术' OR slug LIKE '%tech-tools%' THEN '技术工具'
    WHEN name LIKE '%产品经理%' OR name = 'product-management%' OR slug LIKE '%product-management%' THEN '产品经理'
    WHEN name LIKE '%家庭生活%' OR name = 'family-life%' OR slug LIKE '%family-life%' THEN '家庭生活'
    WHEN name LIKE '%保险%' OR name = 'insurance%' OR slug LIKE '%insurance%' THEN '保险'
    WHEN name LIKE '%金融%' OR name = 'finance%' OR slug LIKE '%finance%' THEN '金融'
    WHEN name LIKE '%开源%' OR name = 'open-source%' OR slug LIKE '%open-source%' THEN '开源'
    ELSE name
  END,
  slug = CASE 
    WHEN name LIKE '%读书笔记%' OR name = 'reading' OR slug LIKE '%reading%' THEN 'reading'
    WHEN name LIKE '%技术工具%' OR name = 'tech-tools%' OR name = '技术' OR slug LIKE '%tech-tools%' THEN 'tech-tools'
    WHEN name LIKE '%产品经理%' OR name = 'product-management%' OR slug LIKE '%product-management%' THEN 'product-management'
    WHEN name LIKE '%家庭生活%' OR name = 'family-life%' OR slug LIKE '%family-life%' THEN 'family-life'
    WHEN name LIKE '%保险%' OR name = 'insurance%' OR slug LIKE '%insurance%' THEN 'insurance'
    WHEN name LIKE '%金融%' OR name = 'finance%' OR slug LIKE '%finance%' THEN 'finance'
    WHEN name LIKE '%开源%' OR name = 'open-source%' OR slug LIKE '%open-source%' THEN 'open-source'
    ELSE slug
  END;

-- 更新时间戳格式
UPDATE categories
SET created_at = datetime(created_at, 'unixepoch'),
    updated_at = datetime(updated_at);

-- 更新文章计数
UPDATE categories
SET post_count = (
  SELECT COUNT(DISTINCT post_id)
  FROM post_categories
  WHERE category_id = categories.id
);

DROP TABLE category_mapping;

COMMIT; 