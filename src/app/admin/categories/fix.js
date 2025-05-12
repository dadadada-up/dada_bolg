var fs = require('fs'); var content = fs.readFileSync('page.tsx', 'utf8'); var newContent = content.replace(/\/\/ 获取分类统计数据[\s\S]*?setCategories\(categoriesWithStats\);/, '// 直接使用API返回的数据
      setCategories(data);'); fs.writeFileSync('page.tsx', newContent);
