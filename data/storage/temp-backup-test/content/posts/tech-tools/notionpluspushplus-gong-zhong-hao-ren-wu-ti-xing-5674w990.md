###**一、Notion 任务数据库创建与集成**####  1\. 创建任务数据库

  1.**新建页面**：

    * 打开 Notion 应用，点击左侧栏中的“+ New Page”按钮，创建一个新的页面。
    * 将页面命名为“任务管理”或其他你喜欢的名字。

  2.**添加表格视图**：

    * 在新建页面中选择“Table”视图，这将创建一个默认的表格数据库。

  3.**定义任务属性**：

    * 添加以下常用属性：

      ***任务名称**：描述任务内容。
      ***截止日期**：设定任务的最后完成日期。
      ***优先级**：设置任务的优先级（如“高”、“中”、“低”）。
      ***状态**：跟踪任务进度（如“待办”、“进行中”、“已完成”）。
      ***负责人**：指派任务给特定团队成员。

#### 2\. 创建 Notion 集成并获取 Integration Token

  1.**创建集成**：

    * 访问 [Notion 集成页面](https://www.notion.so/my-integrations)。
    * 点击“New integration”，创建一个新的集成。
    * 填写集成名称（如“Task Reminder”），然后点击“Submit”。
    * 创建完成后，系统会生成一个复杂的密钥（Integration Token），点击“Show”查看并记录这个密钥。

  2.**将集成添加到数据库**：

    * 打开你的任务管理数据库页面。
    * 点击页面右上角的“...”或“Share”按钮，选择“Add connections”。
    * 找到你创建的集成，将其添加到数据库中。

###**二、PushPlus 账号注册与配置**####  1\. 注册 PushPlus 账号

  1.**访问官网**：

    * 打开 [PushPlus 官网](https://www.pushplus.plus/)，点击“注册”按钮。

  2.**创建账号**：

    * 使用微信扫码登录，完成注册。

#### 2\. 创建群组并获取 Token

  1.**创建群组**：

    * 登录后，点击顶部导航栏的“一对多”消息，创建一个群组。
    * 填写群组名称（如“任务提醒群”），群组编码需要是纯英文+数字。
    * 创建完成后，系统会生成一个二维码，你可以扫码加入群组，并邀请其他成员加入。

  2.**获取 Token**：

    * 在 PushPlus 管理页面，点击“一对一推送”或“一对多推送”，复制对应的 Token。

###**三、GitHub 部署项目代码**####  1\. 创建 GitHub 仓库

  1.**登录 GitHub**：

    * 打开 [GitHub 官网](https://github.com/)，登录你的账号。

  2.**创建仓库**：

    * 点击右上角的“+”按钮，选择“New repository”。
    * 填写仓库名称（如“notion-pushplus-reminder”），并选择公开或私有。

#### 2\. 配置 GitHub Actions 自动部署

  1.**创建**`**.github/workflows**`**文件夹**：

    * 在你的项目根目录下创建 `.github/workflows` 文件夹。

  2.**添加部署脚本**：

    * 在 `.github/workflows` 文件夹中创建一个 YAML 文件（如 `deploy.yml`），并添加以下内容：

yaml复制
    
    
    name: Deploy
    on:
      push:
        branches:
          - main
    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v2
          - name: Set up Node.js
            uses: actions/setup-node@v2
            with:
              node-version: '14'
          - name: Install dependencies
            run: npm install
          - name: Run tests
            run: npm test
          - name: Deploy to server
            run: npm run deploy

    * 根据你的项目需求，调整上述脚本。

  3.**配置环境变量**：

    * 在 GitHub 仓库的“Settings”->“Secrets”中添加以下环境变量：

      * `NOTION_TOKEN`：你的 Notion 集成 Token。
      * `PUSHPLUS_TOKEN`：你的 PushPlus Token。
      * 其他可能需要的环境变量（如数据库 ID 等）。

#### 3\. 推送代码并触发部署

  1.**提交代码**：

    * 在本地终端中，运行以下命令将代码推送到 GitHub：

bash复制
    
    
    git add .
    git commit -m "Initial commit"
    git push origin main

  2.**监控部署**：

    * 在 GitHub 仓库中，点击“Actions”标签页，查看部署进度。

###**四、测试与优化**1.**测试提醒功能**：

    * 在 Notion 数据库中添加一条任务，确保任务信息能够通过 PushPlus 推送到公众号。
    * 检查 PushPlus 的消息推送记录，确认消息是否成功发送。

  2.**优化提醒逻辑**：

    * 根据需求调整项目代码中的提醒逻辑，例如设置提醒时间、提醒频率等。

通过以上步骤，你可以成功搭建一个基于 Notion 和 PushPlus 的任务提醒系统，并通过 GitHub Actions 实现自动部署。希望这个教程对你有所帮助！

## 附录：我的 notion 数据库字段

通过 notion api 查询数据库字段信息，查询结果如下：
    
    
    'name': 'P0 重要紧急', 'color': 'red', 'description': 'P0'}, {'id': 'h=\\Z', 'name': 'P1 重要不紧急', 'color': 'blue', 'description': None}, {'id': '<`Sy', 'name': 'P2 紧急不重要', 'color': 'brown', 'description': None}, {'id': 'LiDV', 'name': 'P3 不重要不紧急', 'color': 'gray', 'description': None}]}}, '任务类型': {'id': 'vZVW', 'name': '任务类型', 'type': 'select', 'select': {'options': [{'id': '7f18fac4-5c65-4dca-b8d0-92984463e12b', 'name': '家庭生活', 'color': 'purple', 'description': None}, {'id': 'cfbc9b69-e23e-4cd1-94fe-d4fe26818d1d', 'name': '社交', 'color': 'blue', 'description': None}, {'id': '4eb1fd95-1211-4aab-be55-052c73cb9501', 'name': '个人成长', 'color': 'red', 'description': None}, {'id': 'a514dcce-1605-4b89-8b91-3d4c8530953f', 'name': '工作', 'color': 'yellow', 'description': None}]}}, '创建者': {'id': 'wA%3Cq', 'name': '创建者', 'type': 'created_by', 'created_by': {}}, '状态': {'id': '~W%5C%60', 'name': '状态', 'type': 'status', 'status': {'options': [{'id': 'a0438e1b-719f-4c03-95f2-17c6e0bb097d', 'name': '还未开始', 'color': 'red', 'description': None}, {'id': 'gjoD', 'name': '进行中', 'color': 'blue', 'description': None}, {'id': 'b81e1b11-7200-43bc-940d-9c361936a670', 'name': '已完成', 'color': 'green', 'description': None}], 'groups': [{'id': '72331709-9ef5-4913-9efd-8acdea25036e', 'name': 'To-do', 'color': 'gray', 'option_ids': ['a0438e1b-719f-4c03-95f2-17c6e0bb097d']}, {'id': 'b7cd0252-5a51-4a04-811b-dfb8a1680013', 'name': 'In progress', 'color': 'blue', 'option_ids': ['gjoD']}, {'id': '23d8eb0d-fa9b-4f2d-8244-5d1a77f59a4e', 'name': 'Complete', 'color': 'green', 'option_ids': ['b81e1b11-7200-43bc-940d-9c361936a670']}]}}, '任务名称': {'id': 'title', 'name': '任务名称', 'type': 'title', 'title': {}}}, 'parent': {'type': 'page_id', 'page_id': '192ed4b7-aaea-80f0-b95f-c938de278bf8'}, 'url': 'https://www.notion.so/192ed4b7aaea81859bbbf3ad4ea54b56', 'public_url': None, 'archived': False, 'in_trash': False, 'request_id': '4326727c-0a8f-41b2-86fc-a83f0e600619'}

任务提醒

张三今日待处理任务2条

任务1: 准备周会 [工作] P0 重要紧急 截止日期: 2024-02-10

任务2: 写周报 [工作] P1 重要不紧急 截止日期: 2024-02-11

李四今日待处理任务1条

任务1: 客户会议 [工作] P0 重要紧急 截止日期: 2024-02-10

  1. notion的Integration Token：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
  2. Notion 页面链接：[https://www.notion.so/daboss01/192ed4b7aaea81859bbbf3ad4ea54b56?v=192ed4b7aaea8133a1be000ce6312603](https://www.notion.so/daboss01/192ed4b7aaea81859bbbf3ad4ea54b56?v=192ed4b7aaea8133a1be000ce6312603)
  3. pushplus 的token：3cfcadc8fcf744769292f0170e724ddb