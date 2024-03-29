---
article: true
---

# Learn | Compilers

![](/public-articles/learn-compilers.png)

## 什么是编译

> Bilibili: https://www.bilibili.com/video/BV1dL4y1H7T8?p=1&vd_source=7067fca17f42bb32fbfaf035206bde26

### 计算机程序设计语言及编译

- 高级语言  High Level Language
  - 自然语言的简洁形式
  - x = 2
- 汇编语言  Assembly Language
  - 引入助记符 
  - MOV X,2
- 机器语言  Machine Language
  - 可以被计算机直接理解
  - C706 0000 0002

- 高级语言 -> 汇编语言 = 编译 Compiling
- 高级语言 -> 机器语言 = 编译 Compiling
- 汇编语言 -> 机器语言 = 汇编 Assembiling

### 编译器在语言处理系统中的位置

- 源程序
- 预处理器 preprocessor
- 经过预处理的源程序
- 编译器
- 汇编语言程序
- 汇编器 Assembler
- 可重定位的机器代码  Relocatable
- 链接器  Linker、加载器 Loader
- 目标机器代码

## 编译系统的结构

### 人工英汉翻译的例子

> https://zhuanlan.zhihu.com/p/362072187

源语言句子 -> 第一步：分析源语言 -> 句子的语义 -> 第二步：生成目标语言 -> 目标语言句子

- 分析源语言
  - 语义分析  Semantic Analysis
  - 语法分析  Syntax Analysis
  - 词法分析  Lexical Analysis

![](https://pic1.zhimg.com/80/v2-030d08a420bca7456162086ecb04c704_720w.webp)


### 编译器结构

- 词法分析器 -> 词法单元流
- 语法分析器 -> 语法树
- 语义分析器 -> 语法树
- 中间代码生成器 -> 中间表示形式
- 机器无关代码优化器
- 目标代码生成器 -> 目标机器语言
- 机器相关代码优化器 

![](https://pic2.zhimg.com/80/v2-6c3637f5e5bbbc839e178f810c113895_720w.webp)
- 编译器前端
- 编译器后端

## 词法分析/扫描(Scanning) 概述

编译的第一个阶段，从左到右逐行扫描源程序的字符，识别出各个单词(是高级语言中有是在意义的最小语法单元，由字符构成)，确定单词的类型。将识别的单词转换成统一的机内表示即词法单元 简称Token。

token:<种别码，属性值>

![](https://pic4.zhimg.com/80/v2-51b995febf4f2e7c055cb0740c3f4527_720w.webp)

下面图中是一个词法分析后得到的token序列的例子：

![](https://pic3.zhimg.com/80/v2-7c6928e62b7657127220f05fc9083822_720w.webp)

## 语法分析(parsing) 概述

### 语法分析的定义

语法分析器从词法分析器输出的 token 序列中识别出各类短语，并构造语法分析树(parse tree)，语法分析树描述了句子的语法结构。

![](https://pic4.zhimg.com/80/v2-4c011627644419f6eed405c9ef739ff7_720w.webp)

### 语法分析的规则

即语法规则又称文法，规定了单词如何构成短语、句子、过程和程序。

语法规则的标示如下，含义是A定义为B或者C

```text
BNF:A::=B∣C

<句子>::=<主><谓><宾>

<主>::=<定><名>
```

### 语法分析的方法

推导(derive)和归约(reduce)

推导：最左推导、最右推导
归约：最右归约、最左归约,推导的逆过程就是归约

### 例子：赋值语句的分析树

![](https://pic2.zhimg.com/80/v2-a14ebfe5942e78da4e79a6a93f0dcf25_720w.webp)

### 例子：变量声明语句的分析树

![](https://pic1.zhimg.com/80/v2-58b789adf66113d62dd172760c781ba4_720w.webp)

## 语义分析 概述

### 语义分析的主要任务

#### 收集标识符的属性信息

- 种属(Kind)： 简单变量、复合变量(数组、记录、...)、过程、...
- 类型 (Type)：整型、实型、字符型、布尔型、指针型、...
- 存储位置、长度
  - ![](https://pic3.zhimg.com/80/v2-26cc7c62cc9d0c77bfcfea454b422292_720w.webp)
- 值
- 作用域
- 参数和返回值信息，参数个数、参数类型、参数传递方式、返回值类型、...
  
语义分析阶段收集的标识符的信息都会存储在一个符号表里，每个标识符都对应符号表中的一条记录，记录的每个字段记录标识符的每个属性，符号表通常带有一个字符串表用来存放程序中用到的标识符和字符常数，Name 就会被分为两个部分，一部分存放标识符在字符串表中的起始位置，另一部分用来存储标识符的长度，符号表如下图：
![](https://pic1.zhimg.com/80/v2-30d4f4fcef94a9ee860b0ece9647f450_720w.webp)

除了符号表还有常量表(登记各类常量表)；标号表(登记标号的定义和应用，不常用目标)；入口名表(登记过程的层号、程序符号表入口等)，各种表的生成大部分在词法分析阶段但是在后面各个阶段都有维护；


#### 语义检查

- 变量或过程未经声明就使用
- 变量或过程名重复声明
- 运算分量类型不匹配
- 操作符与操作数之间的类型不匹配
  - 数组下标不是整数
  - 对非数组变量使用数组访问操作符
  - 对非过程名使用过程调用操作符
  - 过程调用的**参数类型或数目不匹配**
  - 函数返回类型有误

## 中间代码生成及编译器后端

### 常用的中间代码表示形式

- 三地址码 (Three-address Code)：
  - 三地址码由类似于汇编语言的指令序列组成，每个指令最多有三个操作数(operand)
- 语法结构树/语法树 (Syntax Trees)
- 逆波兰式

#### 三地址指令的表示：

- 四元式 (Quadruples)，(op, y, z, x)
- 三元式 (Triples)
- 间接三元式(Indirect triples)

![](https://pic3.zhimg.com/80/v2-b2aa99ac42a1abef2b5a921bb8cbc99e_720w.webp)

### 中间代码生成案例

![](https://pic2.zhimg.com/80/v2-3e61dfb5938cc1b99939e34b63cd7619_720w.webp)