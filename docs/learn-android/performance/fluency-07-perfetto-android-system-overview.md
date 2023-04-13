---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第07篇 - 从Perfetto角度理解Android系统 - 概述

## 前言

文章中涉及到源码分析的部分，其AOSP版本为**android-13.0.0_r41**。

## Android系统与Perfetto

Perfetto 是一个功能强大的性能追踪和分析工具，用于分析 Android 系统在各个层面的性能。通过 Perfetto 的追踪和可视化工具，我们可以更深入地了解 Android 系统的运行状况、性能瓶颈、潜在优化点，也可以更好以源码的角度理解 Android 系统。

从 Perfetto 的角度理解 Android 系统，可以关注以下几个方面：

- **图形渲染和显示**：Perfetto 可以追踪 Android 图形渲染的详细过程，包括 应用绘制和渲染、SurfaceFlinger、硬件合成器（Hardware Composer）以及 GPU 的使用情况。这有助于分析图形渲染性能，找到优化点以提高帧率和响应速度。

- **系统服务和组件**：Perfetto 可以追踪 Android 系统中关键进程（system_server）中的各种服务和组件，如 ActivityManager、WindowManager 等。通过分析这些服务的运行状态和事件，可以了解它们在系统中的行为和对性能的影响。

- **CPU 调度和线程**：Perfetto 可以展示系统中各个进程和线程的运行状态，包括 CPU 调度、上下文切换、线程等待等情况。这有助于分析线程间的同步问题、竞态条件以及 CPU 资源使用情况。

- **IPC 通信**：Perfetto 可以追踪 Android 系统中的跨进程通信（IPC），如 Binder 通信。这有助于分析进程间通信的性能瓶颈和潜在问题。

- **内存使用情况**：Perfetto 可以展示进程的内存使用情况，包括堆内存、匿名内存、文件映射等。通过分析内存使用情况，可以找到内存泄漏、内存碎片以及不必要的内存分配等问题。

- **电池与能耗**：Perfetto 可以追踪 Android 设备的能耗情况，包括 CPU、GPU、屏幕等各个组件的功耗。通过分析能耗数据，可以找到优化设备电池续航的方法。

通过 Perfetto，可以从多个维度深入了解 Android 系统的性能表现，找到系统中存在的问题，从而为应用程序和系统的优化提供有力的依据。

## 流畅性与Perfetto

由于本系文章列以性能优化的流畅性为主题，后续文章将深入探讨如何使用 Perfetto 分析工具来理解 Android 系统的图形渲染和显示、系统服务和组件、CPU 调度和线程以及 IPC 通信等方面，目标为开发人员进行流畅性优化提供的帮助。

开发者最易接触到的流畅性问题便是卡顿问题，其涉及到“图形渲染与显示”的部分，我们会首先带着“一帧是如何渲染的”的问题，去了解Android的图形架构，明晰该过程所涉及到的各个环节，例如：VSYNC、Choreographer、MainThread && RenderThread、SurfaceFlinger、Hardware Composer，以及它们是如何和帧的不同阶段对应起来的。