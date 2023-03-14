---
article: false
---

# 性能优化系列

最近碰到不少性能优化相关的问题，又恰好拜读了很多优秀的博客与文章，萌生出总结一下知识体系的想法。

此处重点介绍[Gracker](https://androidperformance.com/)的博客。

在Gracker的[《一本讲 Android 流畅性的书，应该有什么内容？》](https://androidperformance.com/2021/10/27/if-i-write-a-book-about-performance/#/%E5%86%85%E5%AE%B9%E4%BB%8B%E7%BB%8D)博客中对性能优化类书籍的目录大纲和介绍内容有自己的感悟和总结，我认为非常有价值，这里也参考了他的思路进行性能优化方面的知识点整理。

- [可观测技术](./what-is-observability.md)

- 流畅性概述
    - Android 流畅性概述是指 Android 应用在运行时的流畅度，即用户感知到的页面渲染是否卡顿或延迟。
    - Android 流畅性的优化和测试涉及到多个方面，包括硬件、系统、应用、用户等。
- 分析工具介绍
    - 正所谓 工欲善其事必先利其器，趁手的工具对于分析性能问题至关重要，这一章主要会讲性能分析经常遇到的工具，并非是简单的介绍，会结合 Android 系统机制来讲解，工具主要包括但不限于 Systrace(Perfetto) 、AS Profiler、SimplePerf、MAT、Log 工具（Log 内容分析和 Log 原理）、命令行工具（dumpsys meminfo、dumpsys gfxinfo、dumpsys cpuinfo、dumpsys SurfaceFlinger、dumpsys activity、dumpsys input、dumpsys window 等）、三方性能库（Koom、Matrix、Facebook profilo、BlockCanary、LeakCanary、Tailor/Raphael 等）
    - 性能分析中的可观测技术 https://www.androidperformance.com/2022/01/07/The-Performace-1-Performance-Tools/#/Log-%E7%B1%BB%E5%9E%8B
    - Android 性能工具，包括 Systrace、Traceview、Hierarchy Viewer 等。 
- 运行机制概述
    - 这一章主要会讲一些 Android 运行机制相关的内容，了解这些知识点，对于分析 Android 流畅性问题是必须的，当下面这些知识点你非常熟悉之后，碰到流畅性的问题，你的脑海中就有一个图形化的工具在运转：用户怎么操作的、系统怎么反馈的、App 运行到了哪里、最有可能是哪里出现了问题、用什么工具去 Debug 最方便。
    - App 主线程运行原理（主线程和渲染线程）
    - Message、Handler、MessageQueue、Looper 机制
    - 屏幕刷新机制和 Vsync
    - Choreogrepher 机制
    - Buffer 工作流和 SurfaceFlinger 工作流
    - Input 流程
    - ANR 的设计思想
    - Android 运行机制，包括进程、线程、消息队列、Looper、Handler 等。
    - Android 绘制机制，包括 View 的绘制流程、SurfaceView 和 TextureView 的区别、硬件加速等。
- 分析流畅性问题
    - 分析卡顿问题
    - 分析响应速度问题
    - 分析内存问题
    - Android 性能优化，包括布局优化、内存优化、电量优化等。
- 性能测试
    - Android 性能测试，包括帧率测试、内存测试、电量测试等。
- 性能监控
- 系统性能优化介绍
- 高效工作指南
