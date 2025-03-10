---
title: Notion API
02-05 17:05
url: https://www.yuque.com/dadadada_up/pm/ytq0soz9bo7r8ybc
type: DOC
path: Notion API
02-05 17:05
---



返回文档

Notion API文档：[https://developers.notion.com/docs/working-with-databases](https://developers.notion.com/docs/working-with-databases)  
好的！以下是根据你提供的Notion API文档内容，整理的相关API接口信息，包括接口的功能、入参、出参和示例代码。  


1Notion API  


1.1 获取数据库信息（Retrieve a Database）  


功能  
获取指定数据库的详细信息，包括其结构（字段定义）。  


入参  
●database\_id：数据库的唯一标识符（UUID格式）。  


出参  
返回一个包含数据库信息的对象，包括：  
●id：数据库的唯一标识符。  
●title：数据库的标题。  
●properties：数据库的字段（列）定义。  
●其他数据库元数据。  


示例代码  
bash复制  
​

Bash

运行代码

复制代码

9

1

2

3

curl -X GET "https://api.notion.com/v1/databases/\{database\_id\}" \

-H "Authorization: Bearer $NOTION\_API\_KEY" \

-H "Notion-Version: 2021-08-16"

示例响应  
  
​

JSON

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

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

32

33

\{

"object": "database",

"id": "2f26ee68-df30-4251-aad4-8ddc420cba3d",

"created\_time": "2020-03-17T19:10:04.968Z",

"last\_edited\_time": "2020-03-17T21:49:37.913Z",

"title": \[

\{

"type": "text",

"text": \{

"content": "Grocery List"

\}

\}

\],

"properties": \{

"Grocery item": \{

"id": "fy:\{",

"type": "title",

"title": \{\}

\},

"Price": \{

"id": "dia\[",

"type": "number",

"number": \{

"format": "dollar"

\}

\},

"Last ordered": \{

"id": "\]\\\R\[",

"type": "date",

"date": \{\}

\}

\}

\}

1.2 向数据库中添加页面（Create a Page in a Database）  


功能  
在指定数据库中创建一个新页面（记录）。  


入参  
●parent：指定父级数据库的ID。  
●properties：页面的属性，必须符合数据库的字段定义。  


出参  
返回一个包含新创建页面信息的对象，包括：  
●id：页面的唯一标识符。  
●properties：页面的属性值。  
●其他页面元数据。  


示例代码  
bash复制  


示例响应  
  


1.3 查询数据库中的页面（Query a Database）  


功能  
根据指定的过滤条件查询数据库中的页面。  


入参  
●database\_id：数据库的唯一标识符。  
●filter：过滤条件，用于筛选页面。  
●sorts：排序条件，用于对结果进行排序。  


出参  
返回一个包含查询结果的分页对象，包括：  
●results：符合过滤条件的页面列表。  
●has\_more：是否还有更多结果。  
●next\_cursor：用于获取下一页结果的游标。  


示例代码  
bash复制  


示例响应  
  


1.4 更新页面属性（Update Page Properties）  


功能  
更新指定页面的属性值。  


入参  
●page\_id：页面的唯一标识符。  
●properties：要更新的属性值。  


出参  
返回一个包含更新后页面信息的对象，包括：  
●id：页面的唯一标识符。  
●properties：更新后的属性值。  
●其他页面元数据。  


示例代码  
bash复制  


示例响应  
  


  


2 数据库属性（Database properties）  


2.1 数据库属性概述  
每个数据库对象都包含一个名为 properties 的子对象，该对象由多个数据库属性对象组成。这些属性对象定义了数据库的模式，并在Notion用户界面中作为数据库列显示。  


2.2 数据库属性对象包含的键  
每个数据库属性对象包含以下键：  
●id（字符串）：属性的标识符，通常是随机字母和符号的短字符串。某些自动生成的属性类型具有特殊的人类可读ID。  
●name（字符串）：属性在Notion中的名称。  
●description（字符串）：属性的描述，如在Notion中显示。  
●type（字符串枚举）：控制属性行为的类型。可能的值包括但不限于："checkbox"、"created\_by"、"created\_time"、"date"、"email"、"files"、"formula"、"last\_edited\_by"、"last\_edited\_time"、"multi\_select"、"number"、"people"、"phone\_number"、"relation"、"rich\_text"、"rollup"、"select"、"status"、"title"、"url"。  


2.3 类型特定的配置  
每个数据库属性对象还包含一个类型对象。对象的键是对象的 type，值是一个包含类型特定配置的对象。  


2.4 属性类型示例  
以下是一些属性类型及其配置的示例：  
●Checkbox：在Notion UI中作为包含复选框的列显示。  
  


●Created by：在Notion UI中作为包含每行作者提及的列显示。  
  


●Date：在Notion UI中作为包含日期值的列显示。  
  


●Multi-select：在Notion UI中作为包含多个选项值的列显示。  
  


●Number：在Notion UI中作为包含数值的列显示。  
  


●Select：在Notion UI中作为包含单一选项值的列显示。  
  


●Title：控制数据库行在打开时顶部显示的标题。  
  


注意事项  
●所有数据库都需要一个且仅有一个 title 属性。  
●某些属性类型（如 status）不能通过API更新其 name 或 options 值，需要在Notion UI中进行更新。  
这些信息提供了Notion API中数据库属性的详细概述，包括它们的结构、类型以及如何在Notion中表示。  


​

若有收获，就点个赞吧
