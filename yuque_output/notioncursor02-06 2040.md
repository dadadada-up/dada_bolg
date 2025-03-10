---
title: notion+cursor
02-06 20:40
url: https://www.yuque.com/dadadada_up/pm/eqngk5zd2spp2esz
type: DOC
path: notion+cursor
02-06 20:40
---



返回文档

  


Setup Instructions 设置说明  


1\. Create a Notion Integration 1\. 创建 Notion 集成  
1Go to 

![](https://www.notion.so/images/favicon.ico)

[Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.](https://www.notion.so/my-integrations)

转到 [Notion 集成页面](https://www.notion.so/my-integrations)  
2Click "New integration" 点击 “New integration”  
3Name your integration \(e.g., "Cursor Docs"\) 为您的集成命名（例如，“Cursor Docs”）  
4Select the workspace where you want to use the integration 选择要在其中使用集成的工作区  
5Click "Submit" to create the integration 单击 “Submit” 创建集成  
6Copy your "Internal Integration Token" 复制您的 “Internal Integration Token”  


2\. Configure Extension 配置扩展  
1安装拓展程序  


O

U

CURSOR+NOTION

商店

50

CURSOR+NOTION

9

我园

CREATE AND MANAGE DOCUMENTATION IN NOTION DIRECTLY FROM CURSOR

DOCS

LIAMHZ

安装

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1738405626953-45e76eec-1b3d-4523-bed0-be91746d0f30.png?x-oss-process=image%2Fformat%2Cwebp)

  
2Open Command Palette in VS Code \(Cmd/Ctrl + Shift + P\) 在 VS Code 中打开命令面板 （Cmd/Ctrl + Shift + P）

按名称搜索文件\(追加:转到行,追加@转到符号\)

转到文件

6%

P

显示并运行命令

仑$P

搜索文本

%

转到编辑器中的符号

开始调试DEBUG

运行任务TASK

更多

最近打开

AEESTIPYNB~/DESKTOP

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1738381111088-d2c3ca16-8df3-422d-8c10-5aa3b9cb296f.png?x-oss-process=image%2Fformat%2Cwebp)

  
3Search for "Notion: Configure Settings" 搜索 “Notion： Configure Settings”  


NOTION:NOTION: CONFIGURE SETTINGS

最近使用

"文件操作需要预览"的重置选项

RESET CHOICE FOR 'FILE OPERATION NEEDS PREVIEW'

其他命令

帮助:报告问题...

HELP:REPORT ISSUE..

帮助:报告性能问题

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1738381143339-dc91a69d-2aba-4812-bc0c-dadba7194a9c.png?x-oss-process=image%2Fformat%2Cwebp)

  
4Paste your Integration Token when prompted 出现提示时粘贴您的集成令牌  
Integration Token：ntn\_542491556753EiLDxgQk70Xeqbct8ww1QWqxrh82crgbuK  
5The extension will verify your connection 该扩展将验证您的连接  
notion 页面链接：  
[https://www.notion.so/daboss/asset-tracker-18dca1806c5b8058a1eac5390ebeb973](https://www.notion.so/daboss/asset-tracker-18dca1806c5b8058a1eac5390ebeb973)  


HTTPS://WWW.NOTION.SO/WORKSPACE/YOUR-PAGE-NAME-123456789...

ENTER YOUR NOTION PAGE URL FOR THIS PROJECT\(按"ENTER"ESC"ESC"以取消\)

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1738381785156-23495b8d-663a-48d3-8617-a304e7dd7ad8.png?x-oss-process=image%2Fformat%2Cwebp)

  
  


3\. 实现数据库与 Integration 连接  
操作步骤如下：  
1打开你的 Notion 数据库页面  
2点击右上角的 Share 按钮（分享按钮）  
3在弹出的菜单中找到 Connections，点击 Add connections  
4在搜索框中找到你刚才创建的 Integration 名称并选择  


已删除的页面

AS

提及>

通知我

ASSET\_TRACKER

A

无

集成

EASYCSV

中户

SLAPDASH

在MAC应用中打开

上次由AIDARA编辑

管理连接

今天20:40

P1重要不紧急

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1738845629325-3800e742-09cf-4869-82b8-487b5a5af501.png?x-oss-process=image%2Fformat%2Cwebp)

  
完成这些步骤后，你就可以获取数据库 ID 了：  
1在浏览器中打开你的数据库页面  
2从 URL 中复制数据库 ID：  
[https://www.notion.so/workspace/\[这一串就是数据库ID\]?v=](https://www.notion.so/workspace/\[这一串就是数据库ID\]?v=)...  
数据库 ID 通常是一串 32 位的字符，类似： 8a5d5d6c7d4e4f1a9b8c7d6e5f4a3b2c  
这个 ID 就是代码中需要用到的 DATABASE\_ID。 提示：如果在 Share 菜单里看不到你的 Integration，可以：  
1确认 Integration 创建成功  
2刷新页面后重试  
3检查 Integration 的权限设置是否正确（应该有 Read 权限）  
  
快捷  
重启服务器  


  
参考资料：  
●Notion API 文档: [https://developers.notion.com/docs](https://developers.notion.com/docs)  
●@notionhq/client npm 包: [https://www.npmjs.com/package/@notionhq/client](https://www.npmjs.com/package/@notionhq/client)  
●插件Cursor + Notion：  
[https://marketplace.visualstudio.com/items?itemName=LiamHz.cursor-plus-notion](https://marketplace.visualstudio.com/items?itemName=LiamHz.cursor-plus-notion)  


​

若有收获，就点个赞吧
