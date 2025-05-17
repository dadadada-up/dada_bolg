const fs = require("fs");
const content = fs.readFileSync("page.tsx", "utf8");
const newContent = content.replace(/const fetchCategories = async \(\) => \{[\s\S]*?setLoading\(false\);\s*\};/, `const fetchCategories = async () => {
    setLoading(true);
    try {
      // 获取分类列表
      const response = await fetch("/api/categories-new");
      if (!response.ok) throw new Error("获取分类失败");
      const data = await response.json();
      
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取分类失败");
    } finally {
      setLoading(false);
    }
  };`);
fs.writeFileSync("page.tsx", newContent);
console.log("页面已更新成功！");
