---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第06篇 - 性能分析工具 - Android CPU Profiler

## Android CPU Profiler 介绍

Android Profiler 是 Android Studio 内置的一个性能分析工具，用于监控和分析应用的性能。在 CPU 分析器中，有三种主要的跟踪类型：Callstack Sample、System Trace 和 Java/Kotlin Method Trace。

Callstack Sample 适用于快速定位性能瓶颈，System Trace 适用于分析应用程序与系统的交互，而 Java/Kotlin Method Trace 适用于深入分析代码中的性能问题。通过使用这些工具，可以更有效地发现并解决应用程序中的性能问题。

下面介绍这三种跟踪类型的使用场景和实现原理以及优缺点。

![fluency-tools-android-cpu-profiler-traces](/learn-android/performance/fluency-tools-android-cpu-profiler-traces.png)

### Callstack Sample

使用场景：

- Callstack Sample 适用于分析应用程序中可能存在的性能瓶颈。它会提供Java和Native方法的调用堆栈的采样，帮助你找到可能导致性能问题的函数。

实现原理：

- Callstack Sample 它使用 Simpleperf 采样 Java/Kotlin 和 Native 代码，通过周期性地获取应用程序的调用堆栈来分析应用程序的性能。它不会记录所有方法的调用信息，而是在指定的时间间隔内捕获调用堆栈的快照。通过这些快照，可以确定应用程序的性能瓶颈所在。

优缺点：

- 优点：
  - 低开销：由于采样的方式，Callstack Sample 对应用程序性能的影响较小，可以在实际运行过程中进行性能分析。
  - 快速定位：可以迅速发现 CPU 使用率高的线程和函数，便于快速定位性能瓶颈。
- 缺点：
  - 不够精确：采样的方式可能导致一些较短时间执行的方法被忽略，从而无法发现所有的性能问题。
  - 难以发现具体问题：仅提供了方法调用栈的概览，可能难以找到具体的性能问题。

### System Trace

使用场景：

- System Trace 适用于分析应用程序与操作系统之间的交互，以及与其他应用程序或系统组件之间的交互。System Trace 可以帮助你理解应用程序在系统范围内的性能表现，例如 CPU 调度、线程同步和其他系统级事件。

实现原理：

- System Trace 使用 Android 操作系统内置的跟踪工具 (如 Systrace 或 Perfetto) 收集操作系统级别的事件数据。这些工具可以捕获详细的系统事件，包括 CPU 调度、线程状态变化、锁争用、内存分配等。通过分析这些事件，可以了解应用程序与系统资源的交互情况，从而找到性能瓶颈。

优缺点：

- 优点：
  - 系统级信息：可以捕获操作系统级别的详细事件数据，帮助你了解应用程序与系统资源的交互情况。
  - 多方面分析：可以分析 CPU 调度、线程同步、内存分配等多方面的性能问题。
- 缺点：
  - 开销较大：由于收集的数据量较大，可能会对应用程序的性能产生一定影响。
  - 分析复杂：由于涉及系统级事件，分析 System Trace 可能需要更深入的操作系统知识。

### Java/Kotlin Method Trace

使用场景：

- Java/Kotlin Method Trace 适用于深入分析 Java 或 Kotlin 代码的性能问题。它可以帮助你了解代码中每个方法的执行时间和调用次数，从而发现潜在的性能问题。

实现原理：

- Java/Kotlin Method Trace 通过在应用程序运行时记录每个方法的调用信息来分析性能。当你开始方法跟踪时，Android Profiler 会通知应用程序启用方法跟踪。之后，应用程序会在每次方法调用时记录相关信息，包括方法名称、开始时间、执行时间等。在跟踪结束后，Android Profiler 会收集这些数据并生成一个详细的方法调用报告，供你分析性能问题。

优缺点：

- 优点：
  - 详细信息：可以获取每个方法的执行时间和调用次数，有助于深入分析代码中的性能问题。
  - 针对性强：专注于 Java/Kotlin 代码，使得在分析代码性能时更加针对性。
- 缺点：
  - 开销较大：由于需要记录每个方法的调用信息，可能会对应用程序的性能产生较大影响。
  - 可能不全面：仅针对 Java/Kotlin 代码，可能无法发现底层系统或原生代码中的性能问题。

## Android CPU Profiler 实践中的应用

Android CPU Profiler 在这些场景中要如何使用呢？基本的思路是：

- 先录制 System Trace，利用 Trace Points 初步分析、定位问题。
- 再借助 Java/Kotlin Method Trace 分析 Java 层代码的问题。
- 再借助 Callstack Sample Trace 分析 Native 层代码的问题。

Android CPU Profiler 最大优势是集成了各种子工具，在一个地方就能操作一切，对应用开发者来说是非常方便的，下面通过一个简单的案例来看一下Android CPU Profiler中的各个模式是如何配合的。

当碰到性能问题时，先通过 Android CPU Profiler 录制一个 System Trace 如下：

![fluency-tools-android-cpu-profiler-system-trace-record](/learn-android/performance/fluency-tools-android-cpu-profiler-system-trace-record.png)

通过上面 Trace 可以知道是在主线程中的 doFrame内的View#draw() 操作耗时，如果发现不了问题，建议导出到 <https://ui.perfetto.dev/> 进一步分析，通过查找发现是 View#draw() 方法内的名为 LowView-onDraw 的 Java方法耗时。

要分析 Java/Kotlin 函数耗时情况，我们要录制一个 Java/Kotlin Method Trace，如下：

![fluency-tools-android-cpu-profiler-java-kotlin-method-trace](/learn-android/performance/fluency-tools-android-cpu-profiler-java-kotlin-method-trace.png)

通过上面 Trace 很容易发现是一个叫做 Utils.stringFromJNI 的 native 函数耗时，因为涉及到C/C++ 代码，所以要再录制一个 Callstack Sample Trace 进一步分析，如下：

![fluency-tools-android-cpu-profiler-callstack-sample-record](/learn-android/performance/fluency-tools-android-cpu-profiler-callstack-sample-record.png)

可以发现在 native 的 Java_com_example_myapplication_Utils_stringFromJNI 中代码执行了 sleep，它就是导致了性能问题的原因。

## 引用

- <https://www.androidperformance.com/2022/01/07/The-Performace-1-Performance-Tools>

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
