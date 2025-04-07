
---"
categories: "
  - "技术工具"
date: "2025-01-24'"
description: "Setup Instructions  设置说明1. Create a Notion Integration1. 创建 Notion 集成Go"
  to Notion – The all-in-one workspace for your notes"
  - "tasks"
  - "wikis"
---  - "and data..."
image: "/assets/images/posts/tech-tools/2025-01-24-notioncursor/image_23.png""
original_title: "notion+cursor""
published: true"
tags: "
  - "Cursor Notion 技术"
title: "notion+cursor"
yuque_url: ''"
---"
## 

## Setup Instructions 设置说明

### 1\. Create a Notion Integration  
1\. 创建 Notion 集成

  1. Go to [Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.](https://www.notion.so/my-integrations)  
转到 [Notion 集成页面](https://www.notion.so/my-integrations)
  2. Click "New integration" 点击 “New integration”
  3. Name your integration (e.g., "Cursor Docs")  
为您的集成命名（例如，“Cursor Docs”）
  4. Select the workspace where you want to use the integration  
选择要在其中使用集成的工作区
  5. Click "Submit" to create the integration  
单击 “Submit” 创建集成
  6. Copy your "Internal Integration Token"  
复制您的 “Internal Integration Token”

### 2\. Configure Extension 配置扩展

  1. 安装拓展程序

![](/assets/images/notion-cursor/image_23.png)

  2. Open Command Palette in VS Code (Cmd/Ctrl + Shift + P)  
在 VS Code 中打开命令面板 （Cmd/Ctrl + Shift + P）![](/assets/images/notion-cursor/image_22.png)
  3. Search for "Notion: Configure Settings"  
搜索 “Notion： Configure Settings”

![](/assets/images/notion-cursor/image_24.png)

  4. Paste your Integration Token when prompted  
出现提示时粘贴您的集成令牌

Integration Token：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

  5. The extension will verify your connection  
该扩展将验证您的连接

notion 页面链接：

[https://www.notion.so/daboss/asset-tracker-18dca1806c5b8058a1eac5390ebeb973](https://www.notion.so/daboss/asset-tracker-18dca1806c5b8058a1eac5390ebeb973)

![](/assets/images/notion-cursor/image_25.png)

  

### 3\. 实现数据库与 Integration 连接

操作步骤如下：

  1. 打开你的 Notion 数据库页面
  2. 点击右上角的 Share 按钮（分享按钮）
  3. 在弹出的菜单中找到 Connections，点击 Add connections
  4. 在搜索框中找到你刚才创建的 Integration 名称并选择

![](/assets/images/notion-cursor/image_26.png)

完成这些步骤后，你就可以获取数据库 ID 了：

  1. 在浏览器中打开你的数据库页面
  2. 从 URL 中复制数据库 ID：

[https://www.notion.so/workspace/[这一串就是数据库ID]?v=](https://www.notion.so/workspace/\[这一串就是数据库ID\]?v=)...

数据库 ID 通常是一串 32 位的字符，类似：  
8a5d5d6c7d4e4f1a9b8c7d6e5f4a3b2c

这个 ID 就是代码中需要用到的 DATABASE_ID。  
提示：如果在 Share 菜单里看不到你的 Integration，可以：

  1. 确认 Integration 创建成功
  2. 刷新页面后重试
  3. 检查 Integration 的权限设置是否正确（应该有 Read 权限）

  

快捷

重启服务器
    
    
    npm run dev

  

参考资料：

  * Notion API 文档: [https://developers.notion.com/docs](https://developers.notion.com/docs)
  * @notionhq/client npm 包: [https://www.npmjs.com/package/@notionhq/client](https://www.npmjs.com/package/@notionhq/client)
  * 插件Cursor + Notion：

[https://marketplace.visualstudio.com/items?itemName=LiamHz.cursor-plus-notion](https://marketplace.visualstudio.com/items?itemName=LiamHz.cursor-plus-notion)

