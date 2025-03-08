---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第00篇 - 序

## 前言

最近碰到不少性能优化相关的问题，又恰好拜读了很多优秀的博客与文章，萌生出总结一下知识体系的想法。

Android发展至今天，性能优化可分为多种优化方向：

- 应用相关：
  - 流畅性问题：
    - 流畅度（滑动列表的时候掉帧、窗口动画不连贯、重启手机进入桌面卡顿）（渲染缓慢、帧冻结）
    - 响应速度（应用启动白屏过长、点击电源键亮屏慢、滑动不跟手）（App start time、ANR）
  - 稳定性问题：
    - 界面操作没有反应、闪退、点击图标没有响应（Crash）
  - 电池问题
  - 内存问题
- 构建相关：
  - 包大小
  - 构建速度

本系列文章将流畅度问题和响应速度问题统一为流畅性问题，并聚焦于流畅性问题的定义、分析和排查等方面。

本系列文章按照 - 定义问题、寻找关键点、搞清楚该使用的技术、弄明白该使用的工具、如何准确快速的定位问题、实战演示 - 的思路来编写文章，最终教会读者如何优化自己的应用。

## 大纲

- 第01篇：[**性能优化 - 流畅性 - 概述**](./fluency-01-overview.md)
  - 摘要：当我们提及流畅性时，指的到底是什么？从用户角度和技术角度各有什么区别？

- 第02篇：[**性能优化 - 流畅性 - 帧率**](./fluency-02-fps.md)
  - 摘要：基本概念；帧率匹配；60FPS、90FPS、120FPS的差异。

- 第03篇：[**性能优化 - 流畅性 - 可观测技术**](./fluency-03-observability-technology.md)
  - 摘要：Android中都有哪些可观测技术？都有什么作用？能帮助我们做什么？

- 第04篇：[**性能优化 - 流畅性 - 追踪（tracing）**](./fluency-04-tracing.md)
  - 摘要：trace是什么？

- 第05篇：[**性能优化 - 流畅性 - 性能分析工具 - Perfetto**](./fluency-05-tools-perfetto.md)
  - 摘要：如何识别Perfetto中的展示效果。

- 第06篇：[**性能优化 - 流畅性 - 性能分析工具 - Android Studio Profiler**](./fluency-06-tools-android-profiler.md)
  - 摘要：如何利用集成工具排查性能问题。

- 第07篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 概述**](./fluency-07-perfetto-android-overview.md)
  - 摘要：一帧的渲染过程，以及其中涉及到的各个部分和阶段，用来引入剩余文章内容。

- 第08篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Vsync**](./fluency-08-perfetto-android-graphics-vsync.md)
  - 摘要：本部分将详细介绍Vsync信号的作用和原理，以及它如何影响图形渲染流程。

- 第09篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Choreographer**](./fluency-09-perfetto-android-graphics-choreographer.md)
  - 摘要：本部分将讨论Choreographer的作用和原理，以及它与Vsync机制之间的关系。

- 第10篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - UI线程与Render线程**](./fluency-10-perfetto-android-graphics-uithread-and-renderthread.md)
  - 摘要：本部分将讨论UI线程和Render线程的作用及区别，分析它们在图形渲染过程中的关键角色。

- 第11篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - SurfaceFlinger**](./fluency-11-perfetto-android-graphics-surfaceflinger.md)
  - 摘要：本部分将详细介绍SurfaceFlinger的作用，以及它与其他图形组件的协作关系。

- 第12篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Hardware Composer**](./fluency-12-perfetto-android-graphics-hardware-composer.md)
  - 摘要：本部分将讨论Hardware Composer的作用和原理，以及它与SurfaceFlinger之间的协作关系。

- 第13篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Trip Buffer**](./fluency-13-perfetto-android-graphics-trip-buffer.md)
  - 摘要：本部分将介绍Triple Buffer的作用和原理，以及它与图形渲染的关系。

- 第15篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 系统服务和组件 - SystemServer**
  - 摘要：。

- 第16篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 系统服务和组件 - Message、Handler、MessageQueue、Looper**
  - 摘要：。

- 第17篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 系统服务和组件 - Input**
  - 摘要。

- 第18篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - IPC 通信 - Binder**
  - 摘要：介绍Binder机制;介绍锁竞争导致的性能恶化。

- 第19篇：**性能优化 - 流畅性 - 实战 - 分析和解决卡顿问题**
  - 摘要：模拟碰到过的实际案例，分析和解决其碰到的性能问题。

## 引用

- <https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance>
- <https://developer.android.com/topic/performance>
- <https://androidperformance.com>
- <https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance>
- <https://androidperformance.com/2021/04/24/android-systrace-smooth-in-action-1>

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
