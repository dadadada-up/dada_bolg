const fs = require('fs');
const path = require('path');
// 读取原始文件内容
const filePath = 'page.tsx';
let content = fs.readFileSync(filePath, 'utf8');
// 新的fetchCategories函数实现
const startPattern = "const fetchCategories = async () => {"; const endPattern = "setLoading(false);\n  };"; const startIndex = content.indexOf(startPattern); const endIndex = content.indexOf(endPattern) + endPattern.length; if (startIndex !== -1 && endIndex !== -1) { const newCode = `  const fetchCategories = async () => {
    setLoading(true);
    try {
      // 获取分类列表
      const response = await fetch(\"/api/categories-new\");
      if (!response.ok) throw new Error(\"获取分类失败\");
      const data = await response.json();
      
      // 直接使用API返回的数据，已包含正确的文章计数
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : \"获取分类失败\");
    } finally {
      setLoading(false);
    }
  };`; content = content.substring(0, startIndex) + newCode + content.substring(endIndex); fs.writeFileSync(filePath, content); console.log("Categories页面已成功更新！"); } else { console.log("无法找到要替换的代码段"); }
