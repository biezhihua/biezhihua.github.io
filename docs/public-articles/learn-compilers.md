---
article: true
---

# Learn | Compilers

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