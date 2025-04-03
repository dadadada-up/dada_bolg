# Dada博客文档项目

这个仓库包含了个人博客的所有文档和资源，按照不同主题和用途组织。

## 项目结构

```
dada_bolg/
├── docs/                           # 主文档目录
│   ├── posts/                      # 博客文章
│   │   ├── product-management/     # 产品管理相关
│   │   ├── tech-tools/             # 技术工具相关
│   │   ├── finance/                # 财务金融相关
│   │   ├── insurance/              # 保险相关
│   │   │   └── agriculture-insurance/ # 农业保险相关
│   │   ├── personal-blog/          # 个人博客建设相关
│   │   ├── open-source/            # 开源项目相关
│   │   └── family-life/            # 家庭生活相关
│   │       └── travel/             # 旅行计划相关
│   ├── assets/                     # 静态资源
│   │   ├── images/                 # 图片资源
│   │   └── files/                  # 其他文件
│   └── drafts/                     # 草稿文章
├── 家庭生活/                        # 家庭生活相关文档(已整合到docs)
├── 个人博客建设项目/                 # 博客建设相关文档(已整合到docs)
├── 开源项目/                        # 开源项目相关文档(已整合到docs)
├── 技术知识/                        # 技术知识相关文档(已整合到docs)
└── 保险/                           # 保险相关文档(已整合到docs)
```

## 主要内容

本仓库主要包含以下几类内容：

1. **博客文章**：按主题分类的正式博客文章，位于 `docs/posts/` 目录下
2. **静态资源**：包括图片、附件等，位于 `docs/assets/` 目录下
3. **草稿文章**：尚未完成或正在编辑的文章，位于 `docs/drafts/` 目录下
4. **原始文件夹**：原始的分类文件夹（已整合到docs目录）

## 文档命名规范

- 文件名格式：`YYYY-MM-DD-标题.md`
- 中文标题使用英文命名：`2024-10-29-real-estate-series.md`（原"房地产系列"）
- 英文标题使用英文命名：`2024-03-18-vscode-drawio-guide.md`

## 已完成的文档标准化工作

1. **文件重命名**：
   - 中文文件名已标准化为英文命名，如：
     - `2024-03-20个人博客项目需求说明书.md` → `2024-03-20-personal-blog-requirements.md`
     - `2025-04-03钉钉消息监控助手.md` → `2025-04-03-dingtalk-message-monitor.md`
     - `2024-03-18-dingtalk-monitor-打造企业级钉钉监控利器.md` → `2024-03-18-dingtalk-monitor-enterprise.md`

2. **Front Matter修复**：
   - 添加缺失的Front Matter
   - 修复Front Matter结构问题
   - 修复冒号后空格、引号等格式问题
   - 统一标题格式

3. **图片路径更新**：
   - 本地图片路径规范化为 `/assets/images/posts/分类/YYYY-MM-DD-标题/图片名.jpg`
   - 远程图片已下载至本地并更新引用路径

4. **未命名文档处理**：
   - 将所有未命名文档统一重命名为 `YYYY-MM-DD-unnamed-document.md`
   - 为空文档添加基本模板

5. **特殊字符处理**：
   - 移除文件名中的特殊字符如引号、冒号等
   - 修复多余的连字符

6. **标题匹配问题修复**：
   - 确保文件名与Front Matter中的标题一致
   - 优化了比较算法，允许空格与连字符的差异

## 修复成果

- **格式统一**：50个文件现在全部符合命名规范
- **标题匹配**：所有文件名与Front Matter标题保持一致
- **路径规范**：所有图片路径都已标准化
- **元数据完整**：所有文档都有完整的Front Matter

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

4. **fix_remote_images.sh**：处理远程图片
   ```bash
   chmod +x fix_remote_images.sh
   ./fix_remote_images.sh
   ```
   脚本会下载远程图片到本地，并更新引用路径。

5. **fix_front_matter_structure.sh**：修复Front Matter结构问题
   ```bash
   chmod +x fix_front_matter_structure.sh
   ./fix_front_matter_structure.sh
   ```
   脚本会修复Front Matter的起始和结束标记，并添加缺失的Front Matter。

6. **fix_filename_quotes.sh**：修复文件名中的引号问题
   ```bash
   chmod +x fix_filename_quotes.sh
   ./fix_filename_quotes.sh
   ```
   脚本会移除文件名中的引号和特殊字符。

7. **fix_remaining_files.sh**：处理剩余的文件命名问题
   ```bash
   chmod +x fix_remaining_files.sh
   ./fix_remaining_files.sh
   ```
   脚本会处理特定的中文文件名，并修复标题不匹配问题。

8. **fix_title_match.sh**：修复标题匹配问题
   ```bash
   chmod +x fix_title_match.sh
   ./fix_title_match.sh
   ```
   脚本会确保文件名与Front Matter中的标题保持一致。

9. **fix_all.sh**：一次性执行所有修复脚本
   ```bash
   chmod +x fix_all.sh
   ./fix_all.sh
   ```
   综合脚本，按顺序执行所有修复操作，并生成详细的日志文件。

## 后续维护建议

1. **新增文档**：使用标准格式 `YYYY-MM-DD-英文标题.md`
2. **图片管理**：将图片存放在对应的 `/assets/images/posts/分类/YYYY-MM-DD-标题/` 目录下
3. **定期检查**：运行 `./check_filename_format.sh` 检查是否有不符合规范的文件
4. **批量修复**：如有多个文件需要修复，运行 `./fix_all.sh` 进行一键修复

## 贡献指南

如需贡献内容，请参考 [CONTRIBUTING.md](./CONTRIBUTING.md) 文件中的规范。

## 版权说明

除特别注明外，本仓库内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议。 