# 前言

从年中cursor开源以来，逐渐火遍全网，成为编程的又一更强力助手，在亲身使用了三个月后写下该教程，供广大开发者参考，cursor的使用十分简单，看完你会了解到集成了先进LLM的cursor在编程方面的强大。（结尾总结有彩蛋）

# 1\. cursor是什么？

Cursor是一个集成了先进大型[语言模型](https://so.csdn.net/so/search?q=%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B&spm=1001.2101.3001.7020)（LLM）如GPT-4、Claude 3.5的代码编辑器，可以理解为在VSCode中集成了AI辅助编程助手。它通过自然语言理解和代码生成技术，帮助开发者更高效地编写和理解代码。

![](/assets/images/cursor-jie-shao/image_29.png)

# 2\. 使用步骤

## 2.1 cursor的下载

cursor直接在官网下载安装即可，并且注册账号，在第一次打开cursor时输入账号信息即可。

 _**cursor官网：**_[Cursor - The AI Code Editor](https://www.cursor.com/)

下载页面：

![](/assets/images/cursor-jie-shao/image_32.png)

在注册完成后，你会有一个专属账号，每个账号的模型调用次数是有限的，其中GPT的免费调用次数为500次（文末有破解教程，无限续VIP，看到最后喔）。

![](/assets/images/cursor-jie-shao/image_30.jpeg)

### 设置中文

安装好Cursor 后，启动Cursor 软件，会发现是英文的，下面讲述一下设置成中文的方法。

  1.**打开命令面板**：按下键盘组合键`Ctrl+Shift+P`（Windows/Linux）或`Cmd+Shift+P`（macOS），这将打开命令面板。
  2.**输入语言配置命令**：在命令面板的搜索框中输入`Configure Display Language`，然后按下回车键。
  3.**选择中文**：在弹出的选项中选择中文（Chinese），系统会提示您重启软件以应用更改。
  4.**重启软件**：按照提示重启Cursor软件，完成语言设置。

点击最上面的框，输入>language，可以配置简体中文。

![](/assets/images/cursor-jie-shao/image_28.png)

如果在命令面板中找不到中文设置选项，那可能需要安装中文语言包来设置中文界面，安装步骤如下：

  1.**打开扩展程序页面**：按下键盘组合键`Ctrl+Shift+X`，进入扩展程序页面。
  2.**搜索中文语言包**：在搜索框中输入"Chinese"，搜索中文语言包。
  3.**安装中文语言包**：在搜索结果中找到合适的中文语言包，点击安装。
  4.**重启软件**：安装完成后，重启Cursor软件，即可看到软件界面已经成功切换为中文。

## 2.2 内置模型

cursor内置了很多LLMs，包括最先进的GPT4s、Claude3.5s和openai最新发布的推理模型o1-preview和o1-mini，在右上角的设置中即可打开相应的模型进行辅助编程。平时用的最多的还是Claude3.5和GPT4，因为代码能力真的很强悍，后面会展示。

![](/assets/images/cursor-jie-shao/image_31.jpeg)  
![](/assets/images/cursor-jie-shao/image_33.png)

## 2.3 常用快捷键

cursor最常用的快捷键就四个，非常好记

 _**Tab**_ _**：自动填充**_

 _**Ctrl+K**_ _**：编辑代码**_

 _**Ctrl+L**_ _**：回答用户关于代码和整个项目的问题，也可以编辑代码（功能最全面）**_

 _**Ctrl+i**_ _**：编辑整个项目代码（跨文件编辑代码）**_

这里主要讲一下 _**Ctrl+L**_

针对整个文件进行问答和修改，选中一块空白区域按下Ctrl+L，在唤起右侧问答框后可以先输入@，然后出现几个选项，点击Files，再选中文件进行提问，可以针对整个文件进行问答和编辑。![](/assets/images/cursor-jie-shao/image_34.jpeg)![](/assets/images/cursor-jie-shao/image_35.jpeg)

## 2.4 项目的全自动开发

## 2.5 将外部文档作为知识库进行问答

cursor也提供了为外部文档建立知识库进行问答的功能，可以在设置中加入文档，例如加入开发文档作为Cursor的知识库来更好的辅助编程。

![](/assets/images/cursor-jie-shao/image_36.jpeg)

加入文档之后，使用文档进行提问的方式和单个文件一样，使用Ctrl+L唤起对话框，然后输入@，点击docs选择添加好的文档即可。

![](/assets/images/cursor-jie-shao/image_37.jpeg)

## 2.6 加入内置System prompt

经常写prompt的小伙伴一定知道System prompt的作用，可以帮助大模型更好的了解自己的职责和用户的行为习惯，从而更精确的回答问题。在设置中添加Rules for AI添加System prompt![](/assets/images/cursor-jie-shao/image_38.jpeg)

具体的prompt如下：
    
    
    # 角色定义
    您是一名经验丰富的产品经理和工程师，帮助用户实现产品设计和开发需求。
    
    # 目标
    主动满足用户需求，确保项目顺利完成。
    
    ## 第一步：理解项目基础
    查阅并理解项目文档，必要时创建 `readme.md`。
    
    ## 第二步：明确用户需求
    全面理解用户需求并补充细节，采用简单解决方案。
    
    ### 编写代码请求
    分析需求，选择合适技术并编写清晰注释，实现简单有效的方案。
    
    ### 解决代码问题
    理解代码逻辑，分析问题根源并与用户多次沟通调整方案。
    
    ## 第三步：项目总结与反思
    完成后回顾过程并更新 `readme.md` 文件。

## 2.7 更详细的使用方法

以上介绍的使用技巧足够你应付所有的开发需求，如果你对Cursor很感兴趣，可以参考以下网站进行更多了解

[ _**https://cursor101.com/zh**_](https://cursor101.com/zh)

#  3\. 科学使用

cursor虽好，收费难顶。这里提供一个全网最简单的无限续费VIP的方式。打开[CURSOR VIP](https://cursor.jeter.eu.org/)

![](/assets/images/cursor-jie-shao/image_39.jpeg)

然后点击，即可看见破解命令。随便复制一个即可，国内选上面可能好一点。

![](/assets/images/cursor-jie-shao/image_40.jpeg)

然后直接粘贴到终端运行（运行之后要一直开着终端，切勿关闭，可以最小化），然后重新启动cursor即可。

![](/assets/images/cursor-jie-shao/image_41.jpeg)