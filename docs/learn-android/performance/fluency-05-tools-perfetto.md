---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第05篇 - 性能分析工具 - Perfetto

## Perfetto的介绍

Perfetto是一款高性能、开源的系统分析（system profiling）、应用追踪（app tracing）和追踪分析（trace analysis）工具。它提供了用于记录系统级和应用级跟踪的服务和库、Native和Java堆分析、以及基于Web的用户界面可视化和探索大规模跟踪记录。

Perfetto的记录追踪功能基于一种新的内核空间到用户空间追踪协议，该协议基于直接的protobuf序列化，并将数据存储在共享内存缓冲区中。

Perfetto有许多数据源，在Linux和Android上，可以从不同的系统接口收集详细的性能数据，例如：
- Kernel tracing - 内核跟踪，Perfetto与Linux的ftrace集成，允许将内核事件（例如调度事件，系统调用）记录到跟踪中。
- /proc和/sys pollers - 轮询器，允许对进程范围或系统范围的CPU和内存计数器进行采样。
- Android HAL模块集，用于记录电池和能耗计数器。
- Native heap profiling：一种低开销的堆分析器，用于挂钩malloc/free/new/delete并将内存关联到调用堆栈，基于外部进程展开，可配置采样，可附加到已经运行的进程。
- 使用与Android RunTime紧密集成的外部分析器捕获Java heap dumps，可获取托管堆保留图的完整快照（类型、字段名称、保留大小和对其他对象的引用）。

Perfetto包括一个用于导入、解析和查询新的和旧的追踪格式的Trace Processor项目。

Perfetto提供了一个全新的追踪可视化工具，可用于打开和查询长达数小时的追踪。该工具利用现代Web平台技术，具有基于WebWorkers的多线程设计，可使UI始终响应。

Perfetto的设计目标是在减少性能开销的同时提供高度的可扩展性和可配置性，以帮助开发人员快速诊断和调试复杂的软件系统。

> Java heap dumps：Java堆转储是一种诊断工具，用于分析Java虚拟机（JVM）中的内存泄漏和性能问题。它可以捕获当前JVM堆的所有对象，然后将它们的状态记录在一个文件中，包括对象的类型，引用关系，大小和内存地址等信息。堆转储文件可以通过多种工具进行分析，例如MAT（内存分析工具）或jhat（Java堆分析工具），可以帮助开发人员定位和解决内存泄漏和性能问题。

## 引用

- https://ui.perfetto.dev/#!/record
- https://perfetto.dev/
- https://github.com/google/perfetto

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可