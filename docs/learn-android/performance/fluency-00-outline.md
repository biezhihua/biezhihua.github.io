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

- 源码版本：
  - <https://cs.android.com/android/platform/superproject/+/master>

## 大纲

- 第01篇：[**性能优化 - 流畅性 - 概述**](./fluency-01-overview.md)
  - 本篇文章会介绍：当我们提及流畅性时，指的到底是什么？从用户角度和技术角度各有什么区别？

- 第02篇：[**性能优化 - 流畅性 - 帧率**](./fluency-02-fps.md)
  - 本篇文章会介绍：基本概念；帧率匹配；60FPS、90FPS、120FPS的差异。

- 第03篇：[**性能优化 - 流畅性 - 可观测技术**](./fluency-03-observability-technology.md)
  - 本篇文章会介绍：Android中都有哪些可观测技术？都有什么作用？能帮助我们做什么？

- 第04篇：[**性能优化 - 流畅性 - 跟踪（tracing）**](./fluency-04-tracing.md)
  - 本篇文章会介绍：trace是什么？

- 第05篇：[**性能优化 - 流畅性 - 性能分析工具 - Perfetto**](./fluency-05-tools-perfetto.md)
  - 本篇文章会介绍：如何识别Perfetto中的展示效果。

- 第06篇：[**性能优化 - 流畅性 - 性能分析工具 - Android Studio Profiler**](./fluency-06-tools-android-profiler.md)
  - 本篇文章会介绍：如何利用集成工具排查性能问题。

- 第06篇：[**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 概述**](./fluency-07-perfetto-android-system-overview.md)
  - 本篇文章会介绍：一帧的渲染过程，以及其中涉及到的各个部分和阶段，用来引入剩余文章内容。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Vsync**
  - 本篇文章会介绍：介绍Vsync机制；Vsync机制是如何驱动画面渲染的。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Choreographer**
  - 本篇文章会介绍：介绍Choreographer机制；Vsync机制和Choreographer机制是如何协作的。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - MainThread和RenderThread**
  - 本篇文章会介绍：介绍主线程与渲染线程的创建与协作关系。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - SurfaceFlinger**
  - 本篇文章会介绍：介绍SurfaceFlinger机制；Vsync机制和SurfaceFlinger机制是如何协作的。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - Trip Buffer**
  - 本篇文章会介绍：介绍Trip Buffer机制；介绍如何判断掉帧。

- 第08篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 系统服务和组件 - Message、Handler、MessageQueue、Looper**
  - 本篇文章会介绍：介绍消息机制；消息机制与Vsync机制是如何协作的。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 系统服务和组件 - SystemServer**
  - 本篇文章会介绍：。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - 系统服务和组件 - Input**
  - 本篇文章会介绍：介绍事件机制；事件机制与Vsync是如何协作的。

- 第07篇：**性能优化 - 流畅性 - 从Perfetto角度理解Android系统 - IPC 通信 - Binder**
  - 本篇文章会介绍：介绍Binder机制;介绍锁竞争导致的性能恶化。

- 第07篇：**性能优化 - 流畅性 - 实战 - 分析和解决卡顿问题**
  - 本篇文章会介绍：模拟碰到过的实际案例，分析和解决其碰到的性能问题。

## 引用

- <https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance>
- <https://developer.android.com/topic/performance>
- <https://androidperformance.com>
- <https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance>
- <https://androidperformance.com/2021/04/24/android-systrace-smooth-in-action-1>

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
