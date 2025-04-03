
---"
categories: "
  - "技术工具"
date: "2025-01-07'"
description: "下载链接sublimetext设置成中文：要在 Sublime Text 中设置中文界面，你可以按照以下步骤操作：安装 Package Control"
  插件打开 Sublime Text。按下快捷键 Ctrl + Shift + P（Windows/Linux）或 Cmd + Shift + ..."
image: "/assets/images/posts/tech-tools/2025-01-07-sublimetext/''""
original_title: "Sublime Text""
---published: true"
tags: "
  - "技术"
title: "Sublime Text"
yuque_url: ''"
---"
## 下载链接

[sublimetext](https://www.sublimetext.com/)

## 设置成中文：

要在 Sublime Text 中设置中文界面，你可以按照以下步骤操作：

### 安装 Package Control 插件

  1.**打开 Sublime Text**。
  2.**按下快捷键**` Ctrl + Shift + P`**（Windows/Linux）或**` Cmd + Shift + P`**（Mac）**，打开命令面板。
  3.**在命令面板中输入**` Install Package Control`，然后选择该选项进行安装。

    * 如果是第一次安装，可能会弹出一个确认框，点击确认即可。

### 安装中文语言包

  1.**安装完成后，再次打开命令面板**，输入 `Install Package` 并选择该命令。
  2.**在弹出的搜索框中输入**` ChineseLocalizations`，然后选择该插件进行安装。
  3.**安装完成后，需要重新打开 Sublime Text**。

### 设置中文界面

  1.**重新打开 Sublime Text**后，点击菜单栏中的 `Help`（帮助）选项。
  2.**在下拉菜单中选择**` Language`**（语言）**，然后选择 `简体中文`。

### 配置文件设置（可选）

如果你希望确保 Sublime Text 在启动时自动使用中文界面，可以修改配置文件：

  1.**按下快捷键**` Ctrl + Shift + P`**打开命令面板**，输入 `Preferences: Open Settings (User)` 并选择该命令。
  2.**在打开的**` settings.json`**文件中，添加以下代码**：

    
    
    {
        "locale": "zh_CN"
    }

确保将上述代码添加到文件的末尾，然后保存并关闭文件。

  3.**重启 Sublime Text**，即可看到中文界面。

通过这些步骤，你可以在 Sublime Text 中成功设置中文界面，并享受更加友好的使用体验。
