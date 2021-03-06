---
title: RUST学习记录
tags:
---

https://kaisery.github.io/trpl-zh-cn/title-page.html


# 常见的编程概念

- &:
    - 引用
- *:
    - 解引用

- 语句和表达式的定义：
    - 语句（Statements）是执行一些操作但不返回值的指令。
    - 表达式（Expressions）计算并产生一个值。

- 字符串字面值：
    - 符串字面值，即被硬编码进程序里的字符串值。

- https://kaisery.github.io/trpl-zh-cn/ch03-03-how-functions-work.html


# 所有权

- 基础规则：
    - Rust中的每一个值都有一个被称为所有者（owner）的变量。
    - 值在任意时刻有且只有一个所有者。
    - 当所有者（变量）离开作用域（scope），这个值将被丢弃。

- 深拷贝：
    - Rust 永远也不会自动创建数据的 “深拷贝”。因此，任何自动的复制可以被认为对运行时性能影响较小。

- 栈上的数据：
    - 拷贝

- drop:
    - 只对堆上的数据生效

- 可变引用：
    - ：在特定作用域中的特定数据只能有一个可变引用。
- 引用：
    - 不能在拥有不可变引用的同时拥有可变引用。

- &str:
    - &str 是一个不可变引用。

- slice:
    - 会尝试获取数据的不可变引用，之后就不能再进行可变的借用了。

# 结构体关联的数据：

-  元组结构体:
    - 元组（在第三章讨论过）类似的结构体，称为 元组结构体（tuple structs）.
    - 元组结构体有着结构体名称提供的含义，但没有具体的字段名，只有字段的类型。
    - struct Color(i32, i32, i32);

- 类单元结构体:unit-like structs
    - 定义一个没有任何字段的结构体！
    - 类单元结构体常常在你想要在某个类型上实现 trait 但不需要在类型中存储数据的时候发挥作用。我们将在第十章介绍 trait。


# 枚举和模式匹配

# 使用包、Crate和模块管理不断增长的项目

- 什么是crate:
    - crate 是一个二进制项或者库。
    - crate 有库和二进制库两种类型。
        - binary crate 
        - library crate


- 什么是包：
    - 包（package） 是提供一系列功能的一个或者多个 crate。
    - 一个包会包含有一个 Cargo.toml 文件，阐述如何去构建这些 crate。
    - 一个包中至多 只能 包含一个库 crate(library crate)；
    - 包中可以包含任意多个二进制 crate(binary crate)；
    - 包中至少包含一个 crate，无论是库的还是二进制的

- 约定：
    - 约定：src/main.rs 就是一个与包同名的二进制 crate 的 crate 根
    - 约定：src/lib.rs 就是一个与包同名的库 crate 的 crate 根。

- 根模块名：
    - crate

#  字符串

- 字符串的意义：
    - Rust 的核心语言中只有一种字符串类型：str，字符串 slice，它通常以被借用的形式出现，&str。

- String:
    - 称作 String 的类型是由标准库提供的，而没有写进核心语言部分，它是可增长的、可变的、有所有权的、UTF-8 编码的字符串类型。

# 泛型、trait与生命周期

- 什么是泛型：
    - 每一个编程语言都有高效处理重复概念的工具。在 Rust 中其工具之一就是 泛型（generics）。泛型是具体类型或其他属性的抽象替代。
- trait:
    - trait，这是一个定义泛型行为的方法。
- 生命周期：
    - 生命周期（lifetimes），它是一类允许我们向编译器提供引用如何相互关联的泛型。

- 泛型的场景：
    - 函数、结构体、枚举和方法

# 生命周期与引用有效性

- 引用
    - Rust 中的每一个引用都有其 生命周期（lifetime），也就是引用保持有效的作用域。

- Rust 编译器有一个 借用检查器（borrow checker）
    - 比较作用域来确保所有的借用都是有效的

- 函数声明：
    - 就像泛型类型参数，泛型生命周期参数需要声明在函数名和参数列表间的尖括号中。

- 生命周期省略：
    - 函数或方法的参数的生命周期被称为 输入生命周期（input lifetimes），而返回值的生命周期被称为 输出生命周期（output lifetimes）。
    - 省略规则并不提供完整的推断：如果 Rust 在明确遵守这些规则的前提下变量的生命周期仍然是模棱两可的话，它不会猜测剩余引用的生命周期应该是什么。在这种情况，编译器会给出一个错误，这可以通过增加对应引用之间相联系的生命周期注解来解决。
    - 第一条规则是每一个是引用的参数都有它自己的生命周期参数。换句话说就是，有一个引用参数的函数有一个生命周期参数：fn foo<'a>(x: &'a i32)，有两个引用参数的函数有两个不同的生命周期参数，fn foo<'a, 'b>(x: &'a i32, y: &'b i32)，依此类推。
    - 第二条规则是如果只有一个输入生命周期参数，那么它被赋予所有输出生命周期参数：fn foo<'a>(x: &'a i32) -> &'a i32。
    - 第三条规则是如果方法有多个输入生命周期参数并且其中一个参数是 &self 或 &mut self，说明是个对象的方法(method)(译者注： 这里涉及rust的面向对象参见17章), 那么所有输出生命周期参数被赋予 self 的生命周期。



# Rust 中的函数式语言功能：迭代器与闭包

-  闭包（closures）:
    - Rust 的 闭包（closures）是可以保存进变量或作为参数传递给其他函数的匿名函数。

# 智能指针

- 指针：
    - 指针 （pointer）是一个包含内存地址的变量的通用概念
    - 引用以 & 符号为标志并借用了他们所指向的值。除了引用数据没有任何其他特殊功能。它们也没有任何额外开销，所以应用得最多。

- 智能指针：
    - 智能指针（smart pointers）是一类数据结构，他们的表现类似指针，但是也拥有额外的元数据和功能。
    - 普通引用和智能指针的一个额外的区别是引用是一类只借用数据的指针；相反，在大部分情况下，智能指针 拥有 他们指向的数据。

- Box:
    - 当box离开作用域时，它将被释放，这个释放过程作用于box本身（位于栈上）和它所指向的数据（位于堆上）。

# 无畏并发

- 并发编程（Concurrent programming），代表程序的不同部分相互独立的执行
- 并行编程（parallel programming）代表程序不同部分于同时执行

- 并发可能出现的问题：
    - 竞争状态（Race conditions），多个线程以不一致的顺序访问数据或资源
    - 死锁（Deadlocks），两个线程相互等待对方停止使用其所拥有的资源，这会阻止它们继续运行
    - 只会发生在特定情况且难以稳定重现和修复的 bug

# Rust的面向对象特征

# 模式用来匹配值的结构

- 模式有两种形式：refutable（可反驳的）和 irrefutable（不可反驳的）
- 能匹配任何传递的可能值的模式被称为是 不可反驳的（irrefutable）
- 对某些可能的值进行匹配会失败的模式被称为是 可反驳的（refutable）。

# 高级特性

- “不安全的超级力量。” 这些超级力量是：
    - 解引用裸指针
    - 调用不安全的函数或方法
    - 访问或修改可变静态变量
    - 实现不安全 trait
    - 访问 union 的字段

- 有一点很重要，unsafe 并不会关闭借用检查器或禁用任何其他 Rust 安全检查：如果在不安全代码中使用引用，它仍会被检查。unsafe 关键字只是提供了那五个不会被编译器检查内存安全的功能。你仍然能在不安全块中获得某种程度的安全。

 - 常量和静态变量：
    - 常量与不可变静态变量可能看起来很类似，不过一个微妙的区别是静态变量中的值有一个固定的内存地址。使用这个值总是会访问相同的地址。另一方面，常量则允许在任何被用到的时候复制其数据。
    - 常量与静态变量的另一个区别在于静态变量可以是可变的。访问和修改可变静态变量都是 不安全 的。