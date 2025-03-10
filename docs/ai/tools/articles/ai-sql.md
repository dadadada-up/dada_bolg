---
title: "AI帮我写SQL，十倍效率提升"
date: 2024-02-17
categories:
  - AI
---





写在前面  
在产品经理的日常工作中，数据分析是必不可少的环节，而编写 SQL 查询往往是其中最耗时的部分。理解表结构、筛选数据往往需要花费大量精力，这无疑降低了工作效率。本文将为你提供一种高效解决方案，通过借助 AI 技术，快速生成所需的 SQL 查询，从而帮助产品经理节省时间，提升数据分析效率。  
  
以下是policy 表的建表语句  
​

SQL

运行代码

复制代码

99

1

2

3

4

5

6

7

8

9

10

11

12

13

CREATE TABLE policy \(

policy\_id BIGINT AUTO\_INCREMENT PRIMARY KEY, \-- 保单ID，主键，自增

policy\_number VARCHAR\(50\) NOT NULL UNIQUE, \-- 保单编号，唯一

customer\_id BIGINT NOT NULL, \-- 客户ID，外键关联客户表

product\_id BIGINT NOT NULL, \-- 产品ID，外键关联产品表

policy\_status ENUM\('Active', 'Expired', 'Cancelled'\) NOT NULL DEFAULT 'Active', \-- 保单状态

start\_date DATE NOT NULL, \-- 保单生效日期

end\_date DATE NOT NULL, \-- 保单到期日期

premium DECIMAL\(10, 2\) NOT NULL, \-- 保费金额

payment\_frequency ENUM\('Monthly', 'Quarterly', 'Semi-Annually', 'Annually'\) NOT NULL, \-- 缴费频率

agent\_id BIGINT, \-- 代理人ID，可选

created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP, \-- 创建时间

updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP, \-- 更新时间

1给 AI 提需求写 sql  


1.1数据筛选逻辑  
policy\_status = 'Active', 'Expired'  
payment\_frequency='Monthly', 'Quarterly'  


1.2分组条件  
product\_id  
agent\_id  


1.3统计维度  
policy\_number  
  


1.4数据表 sql  
直接使用查询建表语句 sql，投喂给 A  
​

9

1

SHOW CREATE TABLE ods\_midplcy\_t\_agr\_policy;

2改写 SQL  
在 1 的基础上，提供需要改的 sql，比如  
​

99

1

2

3

4

5

6

7

8

9

10

11

12

帮我调整一下这段sql

其中我需要的数据表达如下：

1.数据筛选逻辑

xxx

policy\_version 取最新版本

2.分组条件

xxx

3.统计维度

xxx

  


需要改写的sql如下

  


3提示词（直接抄）  
​

99

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

- Role: 数据库SQL优化专家和数据分析师

- Background: 用户需要对一段SQL语句进行调整，以满足特定的数据筛选、分组和统计需求。用户已经提供了详细的数据筛选逻辑、分组条件和统计维度，但原始SQL语句存在一些问题，需要进行优化和改写。

- Profile: 你是一位精通SQL语言的数据库专家，对数据处理和分析有着丰富的经验，能够快速理解用户的需求，并根据数据筛选逻辑、分组条件和统计维度，对SQL语句进行优化和改写。

- Skills: 你具备SQL语句优化、数据筛选、分组和统计的能力，能够熟练使用SQL函数和语法，确保SQL语句的准确性和高效性。

- Goals:

- 根据用户提供的数据筛选逻辑，调整SQL语句中的WHERE子句，确保数据筛选的准确性。

- 根据用户提供的分组条件，调整SQL语句中的GROUP BY子句，确保分组的正确性。

- 根据用户提供的统计维度，调整SQL语句中的SELECT子句，确保统计结果的准确性。

- 优化SQL语句的性能，提高查询效率。

- Constrains: 优化后的SQL语句应符合SQL语法规范，能够正确执行并返回用户所需的结果。

- OutputFormat: 优化后的SQL语句

- Workflow:

1. 分析用户提供的数据筛选逻辑，明确筛选条件。

2. 根据筛选逻辑，调整SQL语句中的WHERE子句，确保数据筛选的准确性。

3. 分析用户提供的分组条件，明确分组字段。

4. 根据分组条件，调整SQL语句中的GROUP BY子句，确保分组的正确性。

5. 分析用户提供的统计维度，明确统计字段和计算方式。

6. 根据统计维度，调整SQL语句中的SELECT子句，确保统计结果的准确性。

7. 优化SQL语句的性能，提高查询效率。

​

若有收获，就点个赞吧
