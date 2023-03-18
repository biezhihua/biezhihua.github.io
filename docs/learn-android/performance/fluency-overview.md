---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 | 第01篇 - 流畅性 - 概述

> Overview

流畅性是指应用程序或系统的动画和操作在用户交互时的反应速度和顺畅度。在移动设备上，流畅性是一个非常重要的性能指标，因为它直接影响到用户体验。如果应用程序或系统的动画和操作不流畅，用户可能会感到卡顿和延迟，从而降低了应用程序的可用性和用户满意度。因此，开发人员需要在设计和开发应用程序时考虑如何优化流畅性，以提供更好的用户体验。

对于开发来说，可以将性能优化分为若干个不同的内容，例如：
- 内存优化
- 电源优化
- 包大小优化
- 启动优化
- 渲染优化（渲染缓慢、冻结帧）

对于用户来说，他们的感知与开发不同，大部分的问题对用户来说都是卡顿问题，也可以叫流畅性问题，例如：
- 滑动列表的时候掉帧
- 应用启动白屏过长
- 点击电源键亮屏慢
- 界面操作没有反应然后闪退
- 点击图标没有响应
- 窗口动画不连贯
- 滑动不跟手
- 重启手机进入桌面卡顿

- Slow renderding
  - jank
- Frozen Frames
- App startup slow


## 引用

- https://developer.android.com/topic/performance/vitals/render
- https://developer.android.com/topic/performance/vitals/frozen
- https://developer.android.com/topic/performance/appstartup/tools-libs
- https://developer.android.com/topic/performance/appstartup/analysis-optimization
- https://developer.android.com/topic/performance/vitals/launch-time
- https://developer.android.com/topic/performance/rendering
- https://developer.android.com/training/articles/perf-anr