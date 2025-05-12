钉钉群消息智能分析助手 - 让群消息管理更轻松，问题处理更高效。

## 为什么需要它？

在日常工作中，我们经常遇到这些问题：

  * 📈**信息过载**：群里每天大量消息，重要信息容易被淹没
  * 🔍**问题追踪难**：用户反馈散落在各个群里，难以统一管理和追踪
  * 📊**数据孤岛**：缺乏对问题类型、优先级的系统化分析
  * ⏰**响应延迟**：重要问题可能被延误，影响用户体验
  * 📝**总结耗时**：人工整理群消息费时费力，效率低下

## 它是如何解决这些问题的？

DingTalk Monitor 通过智能化手段解决这些痛点：

### 1\. 智能消息分类

  * 自动识别消息类型（功能需求/技术问题/运营问题/用户反馈）
  * 智能提取关键信息（优先级/影响范围/提出人）
  * 结构化整理，便于后续分析和处理

### 2\. 实时问题追踪

  * 自动监控多个钉钉群的消息
  * 根据预设规则识别重要问题
  * 及时推送通知，确保问题不被遗漏

### 3\. 数据分析和可视化

  * 问题类型分布统计
  * 优先级分析
  * 影响范围评估
  * 趋势分析和预警

### 4\. 自动化工作流

  * 定时汇总分析（默认每4小时）
  * 智能分类推送
  * 支持自定义处理规则
  * 灵活的触发机制

## 效果展示

![](docs/images/demo.png)![](/assets/images/kai-yuan-tui-jian-dingtalk-monitor-da-zao-qi-ye-ji-ding-ding-jian-kong-li-qi-rang-xiao-xi-guan-li-cong-wei-ru-ci-gao-xiao/image_19.png)

## 快速开始

### 1\. 安装
    
    
    git clone https://github.com/dabossgit/dingtalk-monitor.git
    cd dingtalk-monitor
    npm install

### 2\. 配置
    
    
    cp .env.example .env
    # 编辑 .env 文件，填入你的钉钉机器人配置

### 3\. 运行
    
    
    # 启动定时任务
    npm start
    
    # 手动触发分析
    npm run analyze
    
    # 运行测试消息
    npm run test-messages

## 配置说明

### 环境变量

  * `DINGTALK_BOT_TOKEN`: 钉钉机器人的 access_token
  * `DINGTALK_BOT_SECRET`: 钉钉机器人的加签密钥
  * `MESSAGE_FETCH_INTERVAL`: 消息获取间隔（毫秒）
  * `MAX_MESSAGES_PER_FETCH`: 每次获取消息数量

## 项目结构
    
    
    src/
    ├── examiner/     # 消息监听模块
    ├── processor/    # 消息处理模块
    ├── storage/      # 本地存储模块
    ├── bot/         # 钉钉机器人模块
    └── scheduler/   # 定时任务模块

## 开源许可

本项目采用 [MIT 开源许可证](https://opensource.org/licenses/MIT)，这意味着你可以：

  * ✅ 免费使用
  * ✅ 自由修改
  * ✅ 自由分发
  * ✅ 商业使用

只需要保留原始版权和许可证声明即可。