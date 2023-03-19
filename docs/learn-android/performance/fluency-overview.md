---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第01篇 - 概述

> Overview


## 什么是流畅性

> What is fluency?

流畅性是指应用程序或系统的动画和操作在用户交互时的反应速度和顺畅度。

在移动设备上，流畅性是一个非常重要的性能指标，因为它直接影响到用户体验。

如果应用程序或系统的动画和操作不流畅，用户可能会感到卡顿和延迟，从而降低了应用程序的可用性和用户满意度。

因此，需要在设计和开发应用程序时考虑如何优化流畅性，以提供更好的用户体验。

## Android中都有那些流畅性问题

> What are the fluency issues in Android?

从用户的角度来说，Android中的流畅性问题包含了很多场景，例如：
- 滑动列表的时候掉帧
- 滑动不跟手
- 应用启动白屏过长
- 点击电源键亮屏慢
- 界面操作没有反应然后闪退
- 点击按钮或图标没有响应
- 窗口动画不连贯
- 重启手机进入桌面卡顿

从开发的角度来说，Android的流畅性问题可以分为不同的类型，例如：
- 渲染类问题，它通常包括的用户场景为：
  - 滑动列表的时候掉帧
  - 滑动不跟手
  - 点击按钮或图标没有响应
  - 窗口动画不连贯
- 响应速度类问题，它通常包括的用户场景为：
  - 应用启动白屏过长
  - 点击电源键亮屏慢
  - 界面操作没有反应然后闪退
  - 重启手机进入桌面卡顿

## 解决问题的切入点

本系列主要是讲如何使用 Perfetto 工具去分析和解决流畅性相关的问题。

造成应用产生流畅性的因素有很多，可能有 App 自身的原因、也可能有 System 的原因。如果我们以整机运行的角度来展示问题发生的过程，去分析问题发生的原因，会方便我们去初步定位问题，而 Perfetto 就是可以为我们提供这种整机视角的高效工具。

## 引用

- https://developer.android.com/topic/performance/vitals/render
- https://developer.android.com/topic/performance/vitals/frozen
- https://developer.android.com/topic/performance/appstartup/tools-libs
- https://developer.android.com/topic/performance/appstartup/analysis-optimization
- https://developer.android.com/topic/performance/vitals/launch-time
- https://developer.android.com/topic/performance/rendering
- https://developer.android.com/training/articles/perf-anr
- https://androidperformance.com/2021/04/24/android-systrace-smooth-in-action-1/

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可