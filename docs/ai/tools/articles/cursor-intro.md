---
title: "Cursor 介绍"
date: 2024-02-10
categories:
  - AI
---





前言  
从年中cursor开源以来，逐渐火遍全网，成为编程的又一更强力助手，在亲身使用了三个月后写下该教程，供广大开发者参考，cursor的使用十分简单，看完你会了解到集成了先进LLM的cursor在编程方面的强大。（结尾总结有彩蛋）  


1\. cursor是什么？  
Cursor是一个集成了先进大型[语言模型](https://so.csdn.net/so/search?q=%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B&spm=1001.2101.3001.7020)（LLM）如GPT-4、Claude 3.5的代码编辑器，可以理解为在VSCode中集成了AI辅助编程助手。它通过自然语言理解和代码生成技术，帮助开发者更高效地编写和理解代码。  


O GPT\_JUDGE

品品BP

TEST.PY

TEST.PY > QUICK\_SORT

GPT\_JUDGE

OUTLINE

DEF QUICK\_SORT\(ARR\):

1

TIMELINE

IF LEN\(ARR\)

Y NOTEPADS

RETURN ARR

CREATE NEW NOTEPAD

PIVOT ARR\[LEN\(ARR\)//2\]

LEFT-\[X FOR X IN ARR IF X < PIVOT\]

RIGHT - \[X FOR X IN ARR IF X > PIVOT\]

RETURN QUICK\_SORT\(LEFT\) + \[PIVOT\] + QUICK\_SORT\(RIGHT\)

PRINT\(QUICK\_SORT\(\[3, 6, 8, 10, 1, 2, 1\]\)

LN 1,COL 21 SPACES:4 UTF-8 LF \(& PYTHON 3.9.664-BIT

CURSOR TAB

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1736219875237-3007a115-6048-40e2-a13a-177384ba1523.png?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  


2\. 使用步骤  


2.1 cursor的下载  
cursor直接在官网下载安装即可，并且注册账号，在第一次打开cursor时输入账号信息即可。  
cursor官网：

![](https://www.cursor.com/favicon.ico)

[Cursor - The AI Code Editor](https://www.cursor.com/)

  
下载页面：  


PO

CURSOR

CAREERS

FEATURES

DOCS

BLOG

DOWNLOAD

PRICING

FORUM

THE AL CODE EDITOR

.T TO MAKE YOU EXTRAORDINARILY PRODUCTIVE,

BUILT TC

CURSOR IS THE BEST WAY TO CODE WITH AI.

DOWNLOAD FOR MAC

WATCH DEMO

日日

茶

CHAT

COMPOSER

X

IMPLEMENT THE CLEANUP FUNCTION FOR THE TRANPORT STACK.DO NOT MAKE UPGRADE

LISTENERS OPTIONAL.

COULD YOU MAKE IT EASIER TO SWITCH CERTIFICATES IN TRANSPORT LISTENERS?

FOLLOW-UP INSTRUCTIONS...

I'LL HELP MODIFY THE CODE TO MAKE CERTIFICATE SWITCHING MORE FLEXIBLE.THE MAIN

72

PUB\(CRATE\) STRUCT TRANSPORTSTACK \{

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1736219982867-1fdb70ba-b391-4d3b-bee0-43d18ad03a3f.png?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  
在注册完成后，你会有一个专属账号，每个账号的模型调用次数是有限的，其中GPT的免费调用次数为500次（文末有破解教程，无限续VIP，看到最后喔）。  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736219975399-14e0a712-489c-408f-9a06-3c9085455c00.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1705%2Climit_0)

  


设置中文  
安装好Cursor 后，启动Cursor 软件，会发现是英文的，下面讲述一下设置成中文的方法。  
1打开命令面板：按下键盘组合键Ctrl+Shift+P（Windows/Linux）或Cmd+Shift+P（macOS），这将打开命令面板。  
2输入语言配置命令：在命令面板的搜索框中输入Configure Display Language，然后按下回车键。  
3选择中文：在弹出的选项中选择中文（Chinese），系统会提示您重启软件以应用更改。  
4重启软件：按照提示重启Cursor软件，完成语言设置。  
点击最上面的框，输入>language，可以配置简体中文。  


LANGUAGE

CURSOR SETTINGS

TEST.PY

富RM带

CHANGE LANGUAGE MODE

CLEAR DISPLAY LANGUAGE PREFERENCE

TEST.PY

CONFIGURE DISPLAY LANGUAGE

PRINT\("你好"\)

OUTLINE

1

PREFERENCES:CONFIGURE LANGUAGE SPECIFIC SETTINGS...

TIMELINE

PREFERENCES:LANGUAGE EXTENSIONS

NOTEPADS

PYTHON:RESTART LANGUAGE SERVER

\+ CREATE NEW NOTEPAD

PYTHON: SHOW LANGUAGE SERVER OUTPUT

VIEW:RESET LANGUAGE STATUS INTERACTION COUNTER

R0A0

LN 2,COL1 SPACES:4 UTF-8 LF \(A PYTHON

GO

中

3.9.6 64-BIT

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1736220019956-5117df4d-f9eb-4b7f-9ef6-207aa74d6b7a.png?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  
如果在命令面板中找不到中文设置选项，那可能需要安装中文语言包来设置中文界面，安装步骤如下：  
1打开扩展程序页面：按下键盘组合键Ctrl+Shift+X，进入扩展程序页面。  
2搜索中文语言包：在搜索框中输入“Chinese”，搜索中文语言包。  
3安装中文语言包：在搜索结果中找到合适的中文语言包，点击安装。  
4重启软件：安装完成后，重启Cursor软件，即可看到软件界面已经成功切换为中文。  


2.2 内置模型  
cursor内置了很多LLMs，包括最先进的GPT4s、Claude3.5s和openai最新发布的推理模型o1-preview和o1-mini，在右上角的设置中即可打开相应的模型进行辅助编程。平时用的最多的还是Claude3.5和GPT4，因为代码能力真的很强悍，后面会展示。  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220019739-3ad5b15f-cf73-462f-bebd-e0303ef9247d.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

GPT JUDGE

CURSOR SETTINGS X

TEST.PY

CURSOR SETTINGS

OUTLINE

TIMELINE

MODEL NAMES

NOTEPADS

ADD NEW MODELS TO CURSOR. OFTEN USED TO CONFIGURE THE LATEST OPENAI MODELS OR OPENROUTER MODELS

\+ CREATE NEW NOTEPAD

火 FEATURES

THUDM/GLM-4-9B-CHAT

BETA

CLAUDE-3-5-SONNET-20241022

CLAUDE-3-OPUS

CLAUDE-3.5-HAIKU

CLAUDE-3.5-SONNET

CURSOR-GMALL

GEMINI-2.0-FLASH-EXP

GEMINI-2.0-FLASH-THINKING-EXP

GEMINI-EXP-1206

GPT-3.5-TURBO

YGPT-4

GPT-4-TURBO-2024-04-09

GPT-4O-MINI

VL01

V

O1-PREVIEW

ADD MODEL

OPENAI APL KEY

UTF-8

R0A0

LN 2,COL1

LF

GO

GURSOR TAB 4

\#PYTHON

SPACES:4

![image.png](https://cdn.nlark.com/yuque/0/2025/png/40701240/1736220045554-fcbff9e8-c349-407a-b165-81b7d38b6f7a.png?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  


2.3 常用快捷键  
cursor最常用的快捷键就四个，非常好记  
Tab：自动填充  
Ctrl+K：编辑代码  
Ctrl+L：回答用户关于代码和整个项目的问题，也可以编辑代码（功能最全面）  
Ctrl+i：编辑整个项目代码（跨文件编辑代码）  
这里主要讲一下Ctrl+L  
针对整个文件进行问答和修改，选中一块空白区域按下Ctrl+L，在唤起右侧问答框后可以先输入@，然后出现几个选项，点击Files，再选中文件进行提问，可以针对整个文件进行问答和编辑。

![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220106893-23c3bdb6-5be4-442f-a1f6-42db9550b44c.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220106933-2f6278bc-4bf6-4b89-b40a-4d0373e72c55.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  


2.4 项目的全自动开发  


2.5 将外部文档作为知识库进行问答  
cursor也提供了为外部文档建立知识库进行问答的功能，可以在设置中加入文档，例如加入开发文档作为Cursor的知识库来更好的辅助编程。  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220148881-21ba3b48-1143-4fbb-b4e2-2e45b88db72e.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  
加入文档之后，使用文档进行提问的方式和单个文件一样，使用Ctrl+L唤起对话框，然后输入@，点击docs选择添加好的文档即可。  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220148952-c8bf3728-1dfc-450b-b309-de512629ae86.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  


2.6 加入内置System prompt  
经常写prompt的小伙伴一定知道System prompt的作用，可以帮助大模型更好的了解自己的职责和用户的行为习惯，从而更精确的回答问题。在设置中添加Rules for AI添加System prompt

![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220149045-e2e061d7-291a-4a52-9807-6adfb23dbf19.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  
具体的prompt如下：  


2.7 更详细的使用方法  
以上介绍的使用技巧足够你应付所有的开发需求，如果你对Cursor很感兴趣，可以参考以下网站进行更多了解  
[https://cursor101.com/zh](https://cursor101.com/zh)  


3\. 科学使用  
cursor虽好，收费难顶。这里提供一个全网最简单的无限续费VIP的方式。打开

![](https://cursor.jeter.eu.org/assets/favicon.ico)

[CURSOR VIP](https://cursor.jeter.eu.org/)

  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220149022-ea7c6013-b4e8-45ff-8c0b-a1af34b50973.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1706%2Climit_0)

  
然后点击，即可看见破解命令。随便复制一个即可，国内选上面可能好一点。  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220149017-03204143-13fa-402c-ace5-a4ced5e35f05.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1706%2Climit_0)

  
然后直接粘贴到终端运行（运行之后要一直开着终端，切勿关闭，可以最小化），然后重新启动cursor即可。  


![](https://cdn.nlark.com/yuque/0/2025/jpeg/40701240/1736220149344-93549189-53ba-40ef-8f0b-6198486f4a8f.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Fresize%2Cw_1500%2Climit_0)

  
  


​

若有收获，就点个赞吧
