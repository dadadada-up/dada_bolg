
---"
categories: "
  - "技术工具"
date: "2025-01-01'"
description: "1、 数据库表结构设计1.1 数据关系用户与账本：每个用户至少有一个账本。账本与账目分类：每个账本有一个且仅有一个账目分类。账本与交易记录：每个账本可以有多个交易记录。交易记录与账目分类：每个交易记录属于一个账目分类。账本与成员：一个账本可以有多个成员。账本与管理员：一个账本可以有多个管理员。..."
image: "/assets/images/posts/tech-tools/2025-01-01-/image_42.svg""
original_title: "tech-tools-document"未命名文档""
published: true"
---tags: "
  - "AI 技术"
title: "tech-tools-document"
yuque_url: ''"
---"
## 1、 数据库表结构设计

## 1.1 数据关系

  1.**用户与账本**：每个用户至少有一个账本。
  2.**账本与账目分类**：每个账本有一个且仅有一个账目分类。
  3.**账本与交易记录**：每个账本可以有多个交易记录。
  4.**交易记录与账目分类**：每个交易记录属于一个账目分类。
  5.**账本与成员**：一个账本可以有多个成员。
  6.**账本与管理员**：一个账本可以有多个管理员。
  7.**账本与创建者**：一个账本有一个创建者。

![占位图](/content/assets/images/tech-tools/2025-01-01-tech-tools-document/placeholder.png)

  

## 1.2 数据库表明细
    
    
    /*** 数据库表结构定义
     */
    
    // 用户表 (user)
    const userSchema = {
      id: Number,           // 自增主键
      user_id: String,      // 业务主键
      openid: String,       // 微信openid
      user_nickname: String,// 用户昵称
      user_avatar: String,  // 用户头像
      user_gender: Number,  // 性别 0-未知 1-男 2-女
      user_mobile: String,  // 手机号（可选）
      user_last_login: Date,// 最近登录时间
      create_time: Date,    // 创建时间
      update_time: Date     // 更新时间
    }
    
    // 账本表 (account_book)
    const accountBookSchema = {
      id: Number,           // 自增主键
      accountBook_id: String,      // 业务主键
      user_id: String,      // 创建者ID
      user_nickname: String,// 创建者昵称
      accountBook_name: String,    // 账本名称
      accountBook_type: String,    // 账本类型：'personal'个人/'shared'共享
      is_default: Boolean,// 是否默认账本
      create_time: Date,
      update_time: Date
    }
    
    // 账本成员表 (account_book_member)
    const accountBookMemberSchema = {
      id: Number,           // 自增主键
      member_id: String,    // 业务主键
      accountBook_id: String,      // 关联账本ID
      accountBook_name: String,    // 账本名称
      user_id: String,      // 成员用户ID
      user_nickname: String,// 成员昵称
      member_role: String,  // 角色：'creator'创建者/'member'成员
      member_relation: String, // 与创建者关系
      create_time: Date,
      update_time: Date
    }
    
    // 账目分类表 (account_category)
    const accountCategorySchema = {
      id: Number,           // 自增主键
      accountCategory_id: String,  // 业务主键
      accountBook_id: String,      // 关联账本ID
      accountBook_name: String,    // 账本名称
      parent_id: String,    // 父分类ID（为空表示一级分类）
      parent_name: String,  // 父分类名称（为空表示一级分类）
      accountCategory_name: String,// 分类名称
      accountCategory_type: String,// 类型：'expense'支出/'income'收入
      accountCategory_level: Number, // 分类层级：1-一级分类，2-二级分类
      accountCategory_icon: String,// 图标
      accountCategory_order: Number,// 排序
      is_default: Boolean,  // 是否默认分类
      is_system: Boolean,   // 是否系统预置（系统预置不允许删除）
      is_valid: Boolean,    // 是否有效（软删除）
      create_time: Date,
      update_time: Date
    }
    
    // 交易记录表 (transaction_record)
    const transactionRecordSchema = {
      id: Number,           // 自增主键
      transaction_id: String,// 业务主键
      accountBook_id: String,      // 关联账本ID
      accountBook_name: String,    // 账本名称
      user_id: String,      // 记录用户ID
      user_nickname: String,// 记录用户昵称
      transaction_type: String,   // 类型：'expense'支出/'income'收入
      transaction_amount: Number, // 金额
      accountCategory_id: String,  // 关联分类ID
      accountCategory_name: String,// 分类名称
      parent_accountCategory_id: String, // 父分类ID
      parent_accountCategory_name: String, // 父分类名称
      transaction_date: Date,     // 交易日期
      transaction_desc: String,   // 描述
      transaction_images: Array,  // 票据图片
      transaction_location: String,// 位置
      create_time: Date,
      update_time: Date
    }
    
    // 账本统计表 (account_book_stats)
    const accountBookStatsSchema = {
      id: Number,           // 自增主键
      stats_id: String,     // 业务主键
      accountBook_id: String,      // 关联账本ID
      accountBook_name: String,    // 账本名称
      stats_year: Number,   // 年份
      stats_month: Number,  // 月份（可选）
      stats_income: Number, // 收入总额
      stats_expense: Number,// 支出总额
      stats_balance: Number,// 结余
      stats_category: Array,// 分类统计
      create_time: Date,
      update_time: Date
    }
    
    // 交易记录导入表 (transaction_import)
    const transactionImportSchema = {
      id: Number,           // 自增主键
      import_id: String,    // 业务主键
      accountBook_id: String,      // 关联账本ID
      accountBook_name: String,    // 账本名称
      user_id: String,      // 导入用户ID
      user_nickname: String,// 导入用户昵称
      import_type: String,  // 导入类型：'wechat'/'alipay'/'excel'/'csv'
      import_file: String,  // 文件地址
      import_status: String,// 状态：'pending'/'processing'/'success'/'failed'
      import_result: Object,// 导入结果
      create_time: Date,
      update_time: Date
    }
    
    const TABLE_NAMES = {
      USER: 'user',
      ACCOUNT_BOOK: 'account_book',
      ACCOUNT_BOOK_MEMBER: 'account_book_member',
      ACCOUNT_CATEGORY: 'account_category',
      TRANSACTION_RECORD: 'transaction_record',
      ACCOUNT_BOOK_STATS: 'account_book_stats'
    }
    
    module.exports = {
      userSchema,
      accountBookSchema,
      accountBookMemberSchema,
      accountCategorySchema,
      transactionRecordSchema,
      accountBookStatsSchema,
      transactionImportSchema,
      
      // 表名常量
      TABLE_NAMES
    }

## 2、关键数据流程

## 2.1 用户登陆流程

![占位图](/content/assets/images/tech-tools/2025-01-01-tech-tools-document/placeholder.png)

## 2.2 小程序初始化流程

![占位图](/content/assets/images/tech-tools/2025-01-01-tech-tools-document/placeholder.png)

## 2.3 记账模块功能

### 2.3.1 记账流程

![占位图](/content/assets/images/tech-tools/2025-01-01-tech-tools-document/placeholder.png)

  

### 2.3.1 账本管理流程
    
    
    graph TD  
        A[账本操作] --> B[创建账本]  
    		B[创建账本]--> G[邀请他人加入账本]  
        A --> C[设置默认账本]  
        A --> D[编辑账本]--> G[邀请他人加入账本]  
        A --> E[删除账本]  
        C --> F[更新其他账本为非默认]  
    		E[删除账本]--> Q[是否存在交易记录]  
    		Q[是否存在交易记录]-->|存在| x[不允许删除]  
    		Q[是否存在交易记录]-->|不存在| Y[允许删除]

## 2.3.3 账目分类管理流程

![占位图](/content/assets/images/tech-tools/2025-01-01-tech-tools-document/placeholder.png)

所有表都采用软删除策略（`is_valid` 字段），保证数据的可追溯性。同时，关键操作都有相应的错误处理和数据验证机制。

  

  

## 3 数据初始化设计

## 3.1 分类数据初始化
    
    
    ### 默认账本关联的分类数据
    // 支出类主分类
    expense: [
      { id: 1, name: '餐饮', icon_url_url: '🍲', parentId: null },
      { id: 2, name: '交通', icon_url: '🚗', parentId: null },
      { id: 3, name: '购物', icon_url: '🛒', parentId: null },
      { id: 4, name: '家庭日常', icon_url: '🏠', parentId: null },
      { id: 5, name: '娱乐', icon_url: '🎮', parentId: null },
      { id: 6, name: '居住', icon_url: '🏘️', parentId: null },
      { id: 7, name: '通讯', icon_url: '📱', parentId: null },
      { id: 8, name: '医疗', icon_url: '🏥', parentId: null },
      { id: 9, name: '学习', icon_url: '📚', parentId: null },
      { id: 10, name: '其他', icon_url: '📝', parentId: null },
    
      // 餐饮子分类
      { id: 101, name: '餐饮', icon_url: '🍲', parentId: 1 },
      { id: 102, name: '三餐', icon_url: '🍽️', parentId: 1 },
      { id: 103, name: '食材', icon_url: '🥬', parentId: 1 },
      { id: 104, name: '水果', icon_url: '🍎', parentId: 1 },
      { id: 105, name: '零食', icon_url: '🍪', parentId: 1 },
    
      // 交通子分类
      { id: 201, name: '交通', icon_url: '🚗', parentId: 2 },
      { id: 202, name: '公交地铁', icon_url: '🚇', parentId: 2 },
      { id: 203, name: '打车', icon_url: '🚕', parentId: 2 },
      { id: 204, name: '共享单车', icon_url: '🚲', parentId: 2 },
      { id: 205, name: '加油', icon_url: '⛽', parentId: 2 },
      { id: 206, name: '停车费', icon_url: '🅿️', parentId: 2 },
      { id: 207, name: '车辆维修', icon_url: '🔧', parentId: 2 },
    
      // 购物子分类
      { id: 301, name: '购物', icon_url: '🛒', parentId: 3 },
      { id: 302, name: '日用品', icon_url: '🧴', parentId: 3 },
      { id: 303, name: '电子产品', icon_url: '📱', parentId: 3 },
      { id: 304, name: '家居用品', icon_url: '🪑', parentId: 3 },
      { id: 305, name: '化妆品', icon_url: '💄', parentId: 3 },
      { id: 306, name: '礼品', icon_url: '🎁', parentId: 3 },
      { id: 307, name: '服饰', icon_url: '👔', parentId: 3 },
    
      // 家庭日常子分类
      { id: 401, name: '生活用品', icon_url: '🧹', parentId: 4 },
      { id: 402, name: '清洁用品', icon_url: '🧼', parentId: 4 },
      { id: 403, name: '个护用品', icon_url: '🧴', parentId: 4 },
      { id: 404, name: '家居维修', icon_url: '🔨', parentId: 4 },
    
      // 娱乐子分类
      { id: 501, name: '电影', icon_url: '🎬', parentId: 5 },
      { id: 502, name: '游戏', icon_url: '🎮', parentId: 5 },
      { id: 503, name: '运动', icon_url: '⚽', parentId: 5 },
      { id: 504, name: '旅游', icon_url: '✈️', parentId: 5 },
      { id: 505, name: '聚会', icon_url: '🎉', parentId: 5 },
      { id: 506, name: '宠物', icon_url: '🐱', parentId: 5 },
    
      // 居住子分类
      { id: 601, name: '房租', icon_url: '🏠', parentId: 6 },
      { id: 602, name: '水费', icon_url: '💧', parentId: 6 },
      { id: 603, name: '电费', icon_url: '⚡', parentId: 6 },
      { id: 604, name: '燃气费', icon_url: '🔥', parentId: 6 },
      { id: 605, name: '物业费', icon_url: '🏢', parentId: 6 },
      { id: 606, name: '维修', icon_url: '🔧', parentId: 6 },
    
      // 通讯子分类
      { id: 701, name: '话费', icon_url: '📱', parentId: 7 },
      { id: 702, name: '网费', icon_url: '🌐', parentId: 7 },
      { id: 703, name: '视频会员', icon_url: '🎬', parentId: 7 },
      { id: 704, name: '软件订阅', icon_url: '💻', parentId: 7 },
    
      // 医疗子分类
      { id: 801, name: '门诊', icon_url: '👨‍⚕️', parentId: 8 },
      { id: 802, name: '住院', icon_url: '🏥', parentId: 8 },
      { id: 803, name: '药品', icon_url: '💊', parentId: 8 },
      { id: 804, name: '保健品', icon_url: '🌿', parentId: 8 },
      { id: 805, name: '医疗保险', icon_url: '📋', parentId: 8 },
    
      // 学习子分类
      { id: 901, name: '学费', icon_url: '🎓', parentId: 9 },
      { id: 902, name: '书籍', icon_url: '📚', parentId: 9 },
      { id: 903, name: '文具', icon_url: '✏️', parentId: 9 },
      { id: 904, name: '培训', icon_url: '📖', parentId: 9 },
      { id: 905, name: '考试', icon_url: '📝', parentId: 9 },
    
      // 其他子分类
      { id: 1001, name: '其他支出', icon_url: '📝', parentId: 10 }
    ],
    
    // 收入类
    income: [
      { id: 21, name: '工资', icon_url: '💰', parentId: null },
      { id: 22, name: '奖金', icon_url: '🎁', parentId: null },
      { id: 23, name: '理财', icon_url: '📈', parentId: null },
      { id: 24, name: '报销', icon_url: '📑', parentId: null },
      { id: 25, name: '其他', icon_url: '📝', parentId: null },
    
      // 工资子分类
      { id: 2101, name: '基本工资', icon_url: '💵', parentId: 21 },
      { id: 2102, name: '加班工资', icon_url: '⏰', parentId: 21 },
      { id: 2103, name: '提成', icon_url: '💹', parentId: 21 },
    
      // 奖金子分类
      { id: 2201, name: '年终奖', icon_url: '🎊', parentId: 22 },
      { id: 2202, name: '季度奖', icon_url: '🎯', parentId: 22 },
      { id: 2203, name: '项目奖金', icon_url: '🎖️', parentId: 22 },
      { id: 2204, name: '节日福利', icon_url: '🎉', parentId: 22 },
    
      // 理财子分类
      { id: 2301, name: '基金收益', icon_url: '📊', parentId: 23 },
      { id: 2302, name: '股票收益', icon_url: '📈', parentId: 23 },
      { id: 2303, name: '利息收入', icon_url: '💱', parentId: 23 },
      { id: 2304, name: '其他理财', icon_url: '💰', parentId: 23 },
    
      // 报销子分类
      { id: 2401, name: '交通报销', icon_url: '🚗', parentId: 24 },
      { id: 2402, name: '餐饮报销', icon_url: '🍽️', parentId: 24 },
      { id: 2403, name: '住宿报销', icon_url: '🏨', parentId: 24 },
      { id: 2404, name: '其他报销', icon_url: '📝', parentId: 24 },
    
      // 其他收入子分类
      { id: 2501, name: '其他收入', icon_url: '📝', parentId: 25 }
    ]

## 3.2 资产分类主数据

### 3.2.1 资产分类主数据
    
    
    # 资产分类
    
    ## 资产
    ### 流动资产
    - 现金
    - 银行活期
    - 货币基金
    - 其他流动资产
    
    ### 固定资产
    - 自用房产
    - 自用汽车
    - 投资房产
    - 金银珠宝
    - 收藏品
    - 数码电子
    - 其他固定资产
    
    ### 投资理财
    - 基金
    - 股票
    - 银行理财
    - 投资保险
    - 加密货币
    - 其他投资理财
    
    ### 应收款
    - 借给他人的钱
    - 报销待收款
    - 投资待收款
    - 其他应收款
    
    ## 负债
    ### 流动负债
    - 信用卡
    - 小额消费贷
    - 其他短期消费性负债
    
    ### 投资负债
    - 投资房产按揭贷款
    - 股票配资/融资
    - 其他投资负债
    
    ### 固定负债
    - 自住房产按揭贷款
    - 汽车按揭贷款
    - 教育贷款
    - 其他固定负债
    

### 3.2.2 财务表设计

  

    
    
    // 家庭表 Family
    const Family = {
      _id: String,          // MongoDB自动生成的ID
      family_id: String,    // 业务ID，格式: "family_时间戳"
      name: String,         // 家庭名称
      description: String,  // 家庭描述
      avatar_url: String,   // 家庭头像
      owner_id: String,     // 家庭创建者user_id
      member_count: Number, // 成员数量
      create_time: String,  // 创建时间，ISO格式
      update_time: String   // 更新时间，ISO格式
    }
    
    // 家庭成员表 FamilyMember
    const FamilyMember = {
      _id: String,          // MongoDB自动生成的ID
      member_id: String,    // 业务ID，格式: "member_时间戳"
      family_id: String,    // 关联的家庭ID
      user_id: String,      // 关联的用户ID
      nickname: String,     // 成员昵称
      avatar_url: String,   // 成员头像
      role: String,         // 角色：'owner'|'admin'|'member'
      is_valid: Boolean,    // 是否有效
      create_time: String,  // 创建时间，ISO格式
      update_time: String   // 更新时间，ISO格式
    }
    
    // 资产记录表 Asset
    const Asset = {
      _id: String,                // MongoDB自动生成的ID
      asset_id: String,           // 业务ID，格式: "asset_时间戳"
      family_id: String,          // 关联的家庭ID
      member_id: String,          // 关联的成员ID
      category_level1: String,    // 资产一级分类：'asset'|'liability'
      category_level2: String,    // 资产二级分类
      category_level3: String,    // 资产三级分类
      name: String,              // 资产名称
      remark: String,            // 备注说明
      initial_amount: Number,    // 投入本金
      start_amount: Number,      // 期初金额
      end_amount: Number,        // 期末金额
      record_date: String,       // 记账日期，格式：YYYY-MM-DD
      is_valid: Boolean,         // 是否有效
      create_time: String,       // 创建时间，ISO格式
      update_time: String        // 更新时间，ISO格式
    }
    
    // 数据关联关系
    const Relations = {
      // 家庭与用户的关系：一对多
      FamilyUser: {
        from: 'family',
        localField: 'owner_id',
        foreignField: 'user_id',
        as: 'owner'
      },
    
      // 家庭成员与家庭的关系：多对一
      MemberFamily: {
        from: 'family_member',
        localField: 'family_id',
        foreignField: 'family_id',
        as: 'members'
      },
    
      // 家庭成员与用户的关系：一对一
      MemberUser: {
        from: 'family_member',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'user'
      },
    
      // 资产与家庭成员的关系：多对一
      AssetMember: {
        from: 'asset',
        localField: 'member_id',
        foreignField: 'member_id',
        as: 'assets'
      }
    }


