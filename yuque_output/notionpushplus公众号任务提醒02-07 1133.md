---
title: notion+pushplus公众号任务提醒
02-07 11:33
url: https://www.yuque.com/dadadada_up/pm/olb8vrktbg9yuwam
type: DOC
path: notion+pushplus公众号任务提醒
02-07 11:33
---



返回文档

一、Notion 任务数据库创建与集成  


1\. 创建任务数据库  
1新建页面：  
○打开 Notion 应用，点击左侧栏中的“+ New Page”按钮，创建一个新的页面。  
○将页面命名为“任务管理”或其他你喜欢的名字。  
2添加表格视图：  
○在新建页面中选择“Table”视图，这将创建一个默认的表格数据库。  
3定义任务属性：  
○添加以下常用属性：  
■任务名称：描述任务内容。  
■截止日期：设定任务的最后完成日期。  
■优先级：设置任务的优先级（如“高”、“中”、“低”）。  
■状态：跟踪任务进度（如“待办”、“进行中”、“已完成”）。  
■负责人：指派任务给特定团队成员。  


2\. 创建 Notion 集成并获取 Integration Token  
1创建集成：  
○访问 [Notion 集成页面](https://www.notion.so/my-integrations)。  
○点击“New integration”，创建一个新的集成。  
○填写集成名称（如“Task Reminder”），然后点击“Submit”。  
○创建完成后，系统会生成一个复杂的密钥（Integration Token），点击“Show”查看并记录这个密钥。  
2将集成添加到数据库：  
○打开你的任务管理数据库页面。  
○点击页面右上角的“...”或“Share”按钮，选择“Add connections”。  
○找到你创建的集成，将其添加到数据库中。  


二、PushPlus 账号注册与配置  


1\. 注册 PushPlus 账号  
1访问官网：  
○打开 [PushPlus 官网](https://www.pushplus.plus/)，点击“注册”按钮。  
2创建账号：  
○使用微信扫码登录，完成注册。  


2\. 创建群组并获取 Token  
1创建群组：  
○登录后，点击顶部导航栏的“一对多”消息，创建一个群组。  
○填写群组名称（如“任务提醒群”），群组编码需要是纯英文+数字。  
○创建完成后，系统会生成一个二维码，你可以扫码加入群组，并邀请其他成员加入。  
2获取 Token：  
○在 PushPlus 管理页面，点击“一对一推送”或“一对多推送”，复制对应的 Token。  


三、GitHub 部署项目代码  


1\. 创建 GitHub 仓库  
1登录 GitHub：  
○打开 [GitHub 官网](https://github.com/)，登录你的账号。  
2创建仓库：  
○点击右上角的“+”按钮，选择“New repository”。  
○填写仓库名称（如“notion-pushplus-reminder”），并选择公开或私有。  


2\. 配置 GitHub Actions 自动部署  
1创建 .github/workflows 文件夹：  
○在你的项目根目录下创建 .github/workflows 文件夹。  
2添加部署脚本：  
○在 .github/workflows 文件夹中创建一个 YAML 文件（如 deploy.yml），并添加以下内容：  
yaml复制  


○根据你的项目需求，调整上述脚本。  
3配置环境变量：  
○在 GitHub 仓库的“Settings”->“Secrets”中添加以下环境变量：  
■NOTION\_TOKEN：你的 Notion 集成 Token。  
■PUSHPLUS\_TOKEN：你的 PushPlus Token。  
■其他可能需要的环境变量（如数据库 ID 等）。  


3\. 推送代码并触发部署  
1提交代码：  
○在本地终端中，运行以下命令将代码推送到 GitHub：  
bash复制  


2监控部署：  
○在 GitHub 仓库中，点击“Actions”标签页，查看部署进度。  


四、测试与优化  
1测试提醒功能：  
○在 Notion 数据库中添加一条任务，确保任务信息能够通过 PushPlus 推送到公众号。  
○检查 PushPlus 的消息推送记录，确认消息是否成功发送。  
2优化提醒逻辑：  
○根据需求调整项目代码中的提醒逻辑，例如设置提醒时间、提醒频率等。  
通过以上步骤，你可以成功搭建一个基于 Notion 和 PushPlus 的任务提醒系统，并通过 GitHub Actions 实现自动部署。希望这个教程对你有所帮助！  


附录：我的 notion 数据库字段  
通过 notion api 查询数据库字段信息，查询结果如下：  


  
任务提醒  
张三今日待处理任务2条  
任务1: 准备周会 \[工作\] P0 重要紧急 截止日期: 2024-02-10  
任务2: 写周报 \[工作\] P1 重要不紧急 截止日期: 2024-02-11  
  
李四今日待处理任务1条  
任务1: 客户会议 \[工作\] P0 重要紧急 截止日期: 2024-02-10  
  
1notion的Integration Token：ntn\_6369834877882AeAuRrPPKbzflVe8SamTw4JJOJOHPNd5m  
2Notion 页面链接：[https://www.notion.so/daboss01/192ed4b7aaea81859bbbf3ad4ea54b56?v=192ed4b7aaea8133a1be000ce6312603](https://www.notion.so/daboss01/192ed4b7aaea81859bbbf3ad4ea54b56?v=192ed4b7aaea8133a1be000ce6312603)  
3pushplus 的token：3cfcadc8fcf744769292f0170e724ddb  


​

若有收获，就点个赞吧
