---
tag:
  - android
  - performance
---

# Android | 性能优化 | 概述 - Overview

## 前言 - Foreword

最近碰到不少性能优化相关的问题，又恰好拜读了很多优秀的博客与文章，萌生出总结一下知识体系的想法。

此处重点介绍[Gracker](https://androidperformance.com/)的博客。

在Gracker的[《一本讲 Android 流畅性的书，应该有什么内容？》](https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance)博客中对性能优化类书籍的目录大纲和介绍内容有自己的感悟和总结，我认为非常有价值，这里也参考了他的思路进行性能优化方面的知识点整理。

## 大纲 - Outline

- 可观测技术 - Observable Technology
    - Android中都有哪些可观测技术？都有什么作用？能帮助我们做什么？

- 流畅性 - Performance and Fluidity
    - 当我们提及流畅性时，指的到底是什么？从用户角度和技术角度各有什么区别？

- 性能分析工具 - Performance Analysis Tools
    - Perfetto
    - Android Studio Profiler

- 从Perfetto角度来理解Android系统 - Understanding the Android System from a Perfetto Perspective
    - App 主线程运行原理（主线程和渲染线程）
    - Message、Handler、MessageQueue、Looper 机制
    - 屏幕刷新机制和 Vsync
    - Choreographer 机制
    - Buffer 工作流和 SurfaceFlinger 工作流
    - Input 流程
    - ANR 的设计思想
    - Android 运行机制，包括进程、线程、消息队列、Looper、Handler 等。
    - Android 绘制机制，包括 View 的绘制流程、SurfaceView 和 TextureView 的区别、硬件加速等。

- 性能问题实战
    - 深入分析卡顿问题
    - 深入分析响应速度问题
    - 深入分析内存问题

## 引用 - Reference

- https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance
