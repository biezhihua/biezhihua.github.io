---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第07篇 - 从Perfetto角度理解Android系统 - 概述

## 前言

文章中涉及到源码分析的部分，其AOSP版本为**android-13.0.0_r41**。

## 从Perfetto角度理解Android系统

Perfetto 是一个功能强大的性能追踪和分析工具，用于分析 Android 系统在各个层面的性能。通过 Perfetto 的追踪和可视化工具，可以更深入地了解 Android 系统的运行状况、性能瓶颈、潜在优化点。

从 Perfetto 的角度理解 Android 系统，可以关注以下几个方面：

- **图形渲染和显示**：Perfetto 可以追踪 Android 图形渲染的详细过程，包括 VSYNC、Choreographer、SurfaceFlinger、硬件合成器（Hardware Composer）以及 GPU 的使用情况。这有助于分析图形渲染性能，找到优化点以提高帧率和响应速度。

- **系统服务和组件**：Perfetto 可以追踪 Android 系统中关键进程（system_server）中的各种服务和组件，如 ActivityManager、WindowManager 等。通过分析这些服务的运行状态和事件，可以了解它们在系统中的行为和对性能的影响。

- **CPU 调度和线程**：Perfetto 可以展示系统中各个进程和线程的运行状态，包括 CPU 调度、上下文切换、线程等待等情况。这有助于分析线程间的同步问题、竞态条件以及 CPU 资源使用情况。

- **IPC 通信**：Perfetto 可以追踪 Android 系统中的跨进程通信（IPC），如 Binder 通信。这有助于分析进程间通信的性能瓶颈和潜在问题。

- **内存使用情况**：Perfetto 可以展示进程的内存使用情况，包括堆内存、匿名内存、文件映射等。通过分析内存使用情况，可以找到内存泄漏、内存碎片以及不必要的内存分配等问题。

- **电池与能耗**：Perfetto 可以追踪 Android 设备的能耗情况，包括 CPU、GPU、屏幕等各个组件的功耗。通过分析能耗数据，可以找到优化设备电池续航的方法。

通过 Perfetto，可以从多个维度深入了解 Android 系统的性能表现，找到系统中存在的问题，从而为应用程序和系统的优化提供有力的依据。

但是，由于本系列文章以性能优化的流畅性为主题，所以后续文章将聚焦并深入探讨如何使用 Perfetto 分析工具来理解我们最为关心的方面：**图形渲染和显示**、**系统服务和组件**以及 **IPC 通信**。

## 图形渲染和显示

我们先通过图形渲染架构概述来帮助读者更好地理解 Android 系统的图形渲染。

Android图形渲染架构涉及多个组件，包括VSYNC、Choreographer、SurfaceFlinger、Hardware Composer，以及渲染API与Surface之间的关系。

VSYNC是一个垂直同步信号，它按照固定频率触发（通常为每秒60次），通知系统进行屏幕刷新。VSYNC信号对于保持画面的流畅性和防止图像撕裂至关重要。

Choreographer是一个关键的调度组件，负责监听VSYNC信号，并在恰当的时机触发UI线程进行视图层次结构的测量、布局和绘制。当收到VSYNC信号时，Choreographer会调度UI线程更新界面，并将渲染任务传递给RenderThread。在Perfetto中，我们可以观察到Choreographer与VSYNC事件之间的关系，以评估UI渲染的性能。

SurfaceFlinger是Android系统的核心组件，负责将来自各个应用程序和系统UI的图形缓冲区合成到一起，并将最终的图像显示在屏幕上。SurfaceFlinger与Hardware Composer协同工作，后者是一个硬件抽象层（HAL），用于与底层显示硬件通信。在Perfetto中，我们可以观察到SurfaceFlinger和Hardware Composer的活动，以诊断显示合成过程中可能存在的性能问题。

在Android中，有多种渲染API可用于绘制图形，如Canvas 2D、OpenGL ES和Vulkan。这些API在渲染时会产生图形缓冲区，然后通过Surface传递给SurfaceFlinger。Surface是一个抽象类，它表示显示设备上的一块区域，用于承载渲染结果。在Perfetto中，我们可以分析各种渲染API的性能，并了解它们与Surface之间的关系。

通过结合这些组件的分析，我们可以从Perfetto的角度全面理解Android图形渲染架构的运作原理，从而为优化渲染性能提供有力支持。