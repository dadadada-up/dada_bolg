# 博客文档说明

## 文档命名规范

- 文件名格式：`YYYY-MM-DD-标题.md`
- 中文标题使用中文命名：`2024-10-29-房地产系列.md`
- 英文标题使用英文命名：`2024-03-18-vscode-drawio-guide.md`

## 目录结构

```
docs/
├── posts/          # 博客文章
│   ├── tech/       # 技术类文章
│   ├── finance/    # 金融类文章
│   ├── life/       # 生活类文章
│   └── ...         # 其他分类
├── assets/         # 静态资源
│   ├── images/     # 图片资源
│   │   └── posts/  # 按文章分类存放图片
│   └── files/      # 其他文件
└── drafts/         # 草稿文章
```

## 已完成的修改

1. 文件重命名：
   - `2024-10-29-real-estate-series.md` → `2024-10-29-房地产系列.md`
   - `2025-02-20-dingtalk-monitor.md` → `2025-02-20-钉钉监控利器.md`
   - `2025-04-03-dingtalk-monitor.md` → `2025-04-03-钉钉消息监控助手.md`

2. 图片路径更新：
   - 更新了文章中的图片路径，使其符合规范：`/assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg`

3. Front Matter修复：
   - 修复了`2025-02-20-钉钉监控利器.md`中的Front Matter格式问题
   - 确保标题、分类、标签等符合规范

## 图片文件注意事项

- 图片应放在对应的目录下：`/assets/images/posts/分类/YYYY-MM-DD-标题/`
- 图片大小建议控制在500KB以内
- 推荐使用WebP格式以获得更好的性能

## 辅助脚本

为了帮助维护文档规范，我们提供了以下辅助脚本：

1. **check_filename_format.sh**：检查文件命名是否符合规范
   ```bash
   chmod +x check_filename_format.sh
   ./check_filename_format.sh
   ```
   脚本会生成一个报告文件`filename_check_results.txt`，列出所有不符合命名规范的文件。

2. **fix_image_paths.sh**：修复图片路径，使其符合规范
   ```bash
   chmod +x fix_image_paths.sh
   ./fix_image_paths.sh
   ```
   脚本会自动将不规范的图片路径调整为`/assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg`格式。

3. **fix_front_matter.sh**：修复Front Matter格式问题
   ```bash
   chmod +x fix_front_matter.sh
   ./fix_front_matter.sh
   ```
   脚本会修复常见的Front Matter格式问题，如冒号后无空格、缺少引号、数组格式不正确等。

4. **rename_files.sh**：根据Front Matter中的title字段重命名文件
   ```bash
   chmod +x rename_files.sh
   ./rename_files.sh
   ```
   脚本会根据Front Matter中的title字段自动重命名文件，使其与标题匹配。

5. **fix_remote_images.sh**：处理远程图片
   ```bash
   chmod +x fix_remote_images.sh
   ./fix_remote_images.sh
   ```
   脚本会下载远程图片到本地，并更新引用路径。

6. **fix_all.sh**：一次性执行所有修复脚本
   ```bash
   chmod +x fix_all.sh
   ./fix_all.sh
   ```
   综合脚本，按顺序执行所有修复操作，并生成详细的日志文件。

## 参考文档

详细的博客内容贡献指南请参考：[CONTRIBUTING.md](/CONTRIBUTING.md)
