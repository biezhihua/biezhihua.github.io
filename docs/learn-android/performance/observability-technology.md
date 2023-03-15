---
tag:
  - android
  - performance
---

# 性能优化 | 第01篇 - 可观测性技术 - Observability Technology

## 什么是可观测性技术？

> What is Observability Technology?

可观测性技术是一种通过检查系统的输出来测量系统内部状态的能力。

可观测性技术通常包括三个方面：
- 日志(logs)：系统中事件和活动的文本记录，如错误消息、警告和信息性消息。
- 指标(metrics)：系统行为随时间的定量测量，如 CPU 利用率、内存使用和响应时间等。
- 跟踪(traces)：请求在系统中的活动和事务记录，包括它的路径、涉及的服务和在每个步骤花费的时间的信息。

通过收集和分析这些数据，可观测性技术使开发人员能够了解系统的行为，进而诊断问题，并做出关于如何提高其性能、可靠性和可扩展性的决策。

可观测性技术还为实施自动化警报和监视提供了基础，可以帮助及时检测和响应问题。

## 为什么可观测性技术很重要？

> Why is Observability Technology important?

可观测性技术是一个系统性工程，它能够让你更深入的了解软件里发生的事情。

可观测性技术对于软件开发方面非常重要，原因如下：
- 问题排查：当系统发生故障或者出现异常情况时，可观测性技术可以帮助开发人员快速定位问题的根源，从而更快地解决问题。
- 性能优化：通过监测系统的各个组件，可以了解系统的性能瓶颈，从而采取相应的优化措施，提高系统的性能和稳定性。
- 技术成长：对个人来说，当面对复杂的系统，通过阅读代码来了解整个运行过程其实是很困难的事情，更高效的方法就是借助此类工具，以最直观的的方式获取软件运行的状态。

更重要的可观测性技术允许你回答一些有趣的问题来摆脱某些技术困境，例如：[ref-1]
- 这个操作到底有没有被执行？执行时间有多长？
- 为什么两个版本的前后差异这么大？
- 当 CPU 使用量变高的时候系统都在执行什么操作？
- 为什么启动速度变慢了？
- 为什么这个页面滑动总是会卡一下？

## Android中的的可观测性技术

> Observability Technology in Android

在Android中，通过可观测性技术来收集和分析各种类型数据，以便从外部了解和观察Android系统。 数据类型包括日志（Log）、度量（Matric）、跟踪（Trace）。

### 日志

> Log

在 Android 开发中，Log 是最常用的调试工具之一。它能够记录应用程序的运行状态，帮助开发人员追踪代码中的错误并解决问题。使用 Log 技术可以输出调试信息、警告信息和错误信息。

Android 中的 Log 提供了五个级别的日志输出，分别是VERBOSE、DEBUG、INFO、WARN和ERROR。通过设置不同的日志级别，可以输出不同级别的信息，从而在开发过程中帮助开发人员更快地定位和解决问题。

在移动设备上，由于设备资源和运行环境的限制，不推荐使用Debug模式。因此，Log就成为了开发人员调试应用程序的重要工具。

通过使用Log输出相关信息，开发人员可以:
- 可得到应用程序的运行状态，包括代码执行路径、变量值和异常信息等。
- 可以快速定位问题所在，并进行相应的修复。
- 可以进行性能分析和代码优化，提高应用程序的性能和稳定性。

总之，你可以根据你的目的，将 Log 类型进行等级划分，它就像一个索引一样，可以进一步可以提高分析问题、定位目标信息的效率。

### 指标

> Metric

在 Android 应用程序中，指标（Metric）类型相比 Log 类型使用目的上更为聚焦，它记录的是某个维度上数值的变化，指标（Metric）会在在应用程序运行时收集的各种数据，例如：内存使用情况、CPU使用率、网络延迟等。这些指标数据可以用于监控应用程序的性能，帮助开发人员了解应用程序的行为，并诊断和解决问题。

Android 提供了一些用于收集和记录指标数据的工具和库。其中最常用的是 Android 系统自带的 MetricsLogger 类，该类提供了许多方法用于记录各种指标数据，例如计数器、时间戳和键值对等。

收集到的指标数据可以通过各种方式进行可视化和分析，例如在Android Studio中使用Profiler工具、使用第三方工具和库等。

### 跟踪

> Trace

Trace 是 Android 平台提供的一种性能分析工具，它可以用于检测应用程序中的性能瓶颈，并帮助开发者找出需要优化的代码段。

Trace 通过在代码中插入标记点（Trace Markers）（Trace Point），来记录应用程序的执行过程，包括方法调用、线程切换等等。这些标记点可以帮助开发者了解应用程序的运行状态，比如执行时间、调用顺序、线程运行情况等等。

Trace 特别适用于 Android 应用与系统级的分析场景，用它可以诊断：函数调用链、Binder 调用时的调用链、跨进程事件流等复杂场景。

Trace 技术提供了一组API，使得开发者可以在代码中灵活地使用 Trace 技术来记录和分析应用程序的性能。具体来说，开发者可以使用以下三个API来使用 Trace：
- `Debug.startMethodTracing()`：开始记录方法调用信息，并输出到文件中。
- `Debug.stopMethodTracing()`：停止记录方法调用信息，并将输出文件保存到指定的位置。
- `TraceCompat.beginSection()`：开始记录自定义的 Trace Markers。
- `TraceCompat.endSection()`：停止记录自定义的 Trace Markers。

此外，Android 系统中，一些重要的模块都已经默认插入了一些 Trace Markers，通过 TraceTag 来分类，其中信息来源如下
- Framework Java 层的 TracePoint 通过 android.os.Trace 类完成。
- Framework Native 层的 TracePoint 通过 ATrace 宏完成。
- App 开发者可以通过 android.os.Trace 类自定义 Trace。

总之，Trace 是 Android 开发中非常实用的性能分析工具，它可以帮助开发者快速定位应用程序中的性能瓶颈，从而优化代码，提高应用程序的性能。

## Android中用于收集和分析各种类型的数据的工具

> Tools for collecting and analyzing various types of data in Android

Android 中有很多工具可用于收集和分析可用于性能优化的数据，这里对他们进行一个简要的介绍。

### [Android Profiler](https://developer.android.com/studio/profile/android-profiler) 

> Android Studio Electric Eel | 2022.1.1 Patch 2

Android Profiler是Android Studio集成的一款强大的性能分析工具，可以帮助开发者分析和优化应用程序在Android设备上的性能。

目前 Android Profiler 已经集成了 4 类性能分析工具： CPU、Memory、Network、Battery，其中 CPU 相关性能分析工具为 CPU Profiler，它把 CPU 相关的性能分析工具都集成在了一起，开发者可以根据自己需求来选择使用哪一个。

鉴于已经有一些独立的 CPU 性能分析工具，如 Perfetto、Simpleperf、Java Method Trace 等，目前 CPU Profiler 做法就是从这些已知的工具中获取数据，然后把数据解析成自己想要的样式，通过统一的界面展示出来。

![](/learn-android/performance/android-profiler.png)

[CPU Profiler](https://developer.android.google.cn/studio/profile/record-traces#configurations) 集成了性能分析工具：Perfetto、Simpleperf、Java Method Trace，它具备了这些工具的全部或部分功能，如下：

- **Callstack Simple**：它使用 Simpleperf 采样 Java/Kotlin 和 Native 代码。
> Samples java/kotlin and native code using Simpleperf

Simpleperf 是一个性能分析工具，可以帮助开发人员在 Android 设备上获取应用程序的CPU、内存和I/O使用情况。它支持多种性能分析技术，包括采样和跟踪。当在 Android Profiler 使用 Callstack Simple 时，Simpleperf 会使用采样技术来获取应用程序中 Java/Kotlin 和 Native 代码的调用栈信息。

Simpleperf 的采样技术是通过在应用程序进程中插入信号处理程序来实现的。当进程接收到特定的信号（例如SIGPROF）时，处理程序会中断应用程序的执行，并获取当前线程的调用栈信息。这些采样数据可以保存到文件中，供 Android Profiler 的 Callstack Simple 分析和显示。

下面是为Andorid系统的setting应用的列表界面录制一段**Callstack Simple**信息，下面是截图结果，分别为MainThread、RenderThread：

![](/learn-android/performance/android-profiler-callstack-sample-scroll-mainthread-setting-app.png)
![](/learn-android/performance/android-profiler-callstack-sample-scroll-renderthread-setting-app.png)

- [**System Trace**](https://developer.android.com/topic/performance/tracing)：记录设备活动在短时间内的行为被称为系统跟踪（System Trace）。系统跟踪会生成一个跟踪文件（trace file），该文件可用于生成系统报告（可被Android Profiler、Perfetto、Systrace界面展示）。该报告可帮助您确定如何最好地提高您的应用程序的性能。
> Traces Java/Kotlin and native code at the Android platform level

> 引用自官方文档：捕获非常翔实的细节，以便您检查应用与系统资源的交互情况。您可以检查线程状态的确切时间和持续时间、直观地查看所有内核的 CPU 瓶颈在何处，并添加需分析的自定义轨迹事件。当您排查性能问题时，此类信息至关重要。

Android平台提供了几种不同的选项来捕获或生成系统跟踪信息（trace file）：
- [Android Studio CPU profiler - System Trace](https://developer.android.com/studio/profile/android-profiler)，也就是当前我们介绍的这种。
- [System tracing utility](https://developer.android.com/topic/performance/tracing/on-device)，使用系统自带的工具。
- [Perfetto](https://perfetto.dev/)  command-line tool (Android 10 and higher)，新一代性能分析工具。
- [Systrace](https://source.android.com/docs/core/tests/debug/systrace) command-line tool，老一代性能分析工具。

下面是为Andorid系统的setting应用的列表界面录制一段**System Trace**信息，下面是截图结果：

![](/learn-android/performance/android-profiler-system-trace-setting-app.png)

- **Java/Kotlin Method Trace**：它是从虚拟机获取函数调用栈信息，用于分析 Java 函数调用和耗时情况。请注意，使用此方法会有很高的开销，致使获取的耗时信息是不准确的。
> Instruments Java/Kotlin code using Android Runtime, tracking every method call (this incurs high overhead making timing information inaccurate)

> 引用自官方文档：在运行时检测应用，从而在每个方法调用开始和结束时记录一个时间戳。系统会收集并比较这些时间戳，以生成方法跟踪数据，包括时间信息和 CPU 使用率。
请注意，与检测每个方法相关的开销会影响运行时性能，并且可能会影响分析数据；对于生命周期相对较短的方法，这一点更为明显。此外，如果应用在短时间内执行大量方法，则分析器可能很快就会超出其文件大小限制，因而不能再记录更多跟踪数据。

下面是为Andorid系统的setting应用的列表界面录制一段**Java/Kotlin Method Trace**信息，下面是截图结果：

![](/learn-android/performance/android-profiler-java-kotlin-method-trace.png)

- **Java/Kotlin Method Sample**：在应用的 Java 代码执行期间，采样获取应用的调用堆栈。已经不再推荐使用。
> legacy。Sample Java/Kotlin code using Android Runtime

> 引用自官方文档：应用的 Java 代码执行期间，频繁捕获应用的调用堆栈。分析器会比较捕获的数据集，以推导与应用的 Java 代码执行有关的时间和资源使用信息。
基于采样的跟踪存在一个固有的问题，那就是如果应用在捕获调用堆栈后进入一个方法并在下次捕获前退出该方法，性能分析器将不会记录该方法调用。如果您想要跟踪生命周期如此短的方法，应使用插桩跟踪。

下面是为Andorid系统的setting应用的列表界面录制一段**Java/Kotlin Method Sample**信息，下面是截图结果：

![](/learn-android/performance/android-profiler-java-kotlin-method-sample.png)

通过对比**Java/Kotlin Method Sample**与**Java/Kotlin Method Trace**，可以看到前者由于采样的原因，缺少了很多调用细节。

### [Perfetto](https://perfetto.dev/) 

Perfetto 是 Android 10 中引入的平台级跟踪工具。这是适用于 Android、Linux 和 Chrome 的成熟开源跟踪项目。与 Systrace 不同，它提供数据源超集，可让您以协议缓冲区二进制流形式记录任意长度的跟踪记录。您可以在 Perfetto 界面中打开这些跟踪记录。

Perfetto 相比 Systrace 最大的改进是可以支持长时间数据抓取，这是得益于它有一个可在后台运行的服务，通过它实现了对收集上来的数据进行 Protobuf 的编码并存盘。从数据来源来看，核心原理与 Systrace 是一致的，也都是基于 Linux 内核的 Ftrace 机制实现了用户空间与内核空间关键事件的记录（ATRACE、CPU 调度）。Systrace 提供的功能 Perfetto 都支持。

Perfetto 所支持的数据类型、获取方法，以及分析方式上看也是前所未有的全面，它几乎支持所有的类型与方法。数据类型上通过 ATRACE 实现了 Trace 类型支持，通过可定制的节点读取机制实现了 Metric 类型的支持，在 UserDebug 版本上通过获取 Logd 数据实现了 Log 类型的支持。

### [Systrace](https://source.android.com/docs/core/tests/debug/systrace)

Systrace 是 Trace 类型的可视化分析工具，是第一代系统级性能分析工具。Trace 类型所支持的功能它都有支持。在 Perfetto 出现之前，基本上是唯一的性能分析工具，它将 Android 系统和 App 的运行信息以图形化的方式展示出来，与 Log 相比，Systrace 的图像化方式更为直观；与 TraceView 相比，抓取 Systrace 时候的性能开销基本可以忽略，最大程度地减少观察者效应带来的影响。

在系统的一些关键操作（比如 Touch 操作、Power 按钮、滑动操作等）、系统机制（input 分发、View 绘制、进程间通信、进程管理机制等）、软硬件信息（CPU 频率信息、CPU 调度信息、磁盘信息、内存信息等）的关键流程上，插入类似 Log 的信息，我们称之为 TracePoint（本质是 Ftrace 信息），通过这些 TracePoint 来展示一个核心操作过程的执行时间、某些变量的值等信息。然后 Android 系统把这些散布在各个进程中的 TracePoint 收集起来，写入到一个文件中。导出这个文件后，Systrace 通过解析这些 TracePoint 的信息，得到一段时间内整个系统的运行信息。

Android 系统中，一些重要的模块都已经默认插入了一些 TracePoint，通过 TraceTag 来分类，其中信息来源如下
- Framework Java 层的 TracePoint 通过 android.os.Trace 类完成
- Framework Native 层的 TracePoint 通过 ATrace 宏完成
- App 开发者可以通过 android.os.Trace 类自定义 Trace

这样 Systrace 就可以把 Android 上下层的所有信息都收集起来并集中展示，对于 Android 开发者来说，Systrace 最大的作用就是把整个 Android 系统的运行状态，从黑盒变成了白盒。全局性和可视化使得 Systrace 成为 Android 开发者在分析复杂的性能问题的时候的首选。

### [ATrace](https://perfetto.dev/docs/data-sources/atrace)

ATrace是Android系统中的一个命令行工具，用于跟踪和分析系统各种事件，例如CPU使用情况、内存分配、输入事件等等。它可以帮助开发者分析应用程序和系统的性能瓶颈，定位问题和优化代码。ATrace通过连接到设备并使用adb shell命令来执行跟踪和分析操作，可以生成包含跟踪数据的日志文件，然后使用专业工具进行分析。

ATrace和Perfetto的关系：
- ATrace 和 Perfetto 都是 Android 系统中用于性能分析的工具，但它们具有不同的功能和用途。
- ATrace 是一个用于跟踪和分析 Android 系统中事件的工具，包括 CPU、GPU、内存、磁盘、网络等事件。它可以帮助开发人员了解系统中的性能瓶颈和优化机会。
- Perfetto 是一个完整的系统跟踪和性能分析工具，它能够提供更全面的性能数据和更好的可视化。它支持在 Android 设备上采集各种跟踪数据，包括 CPU、GPU、内存、磁盘、网络、系统事件等。除了 Android 系统本身，它还支持应用程序的跟踪，以及与其他系统的集成，如 Chrome 浏览器和 Fuchsia 操作系统。
- ATrace 是一个轻量级的跟踪工具，而 Perfetto 则是一个更全面的系统跟踪和性能分析工具，提供了更多的数据和功能。
- Perfetto使用了ATrace作为其底层跟工具。具体而言，Perfetto使用了一个称为“ATRACE HAL”的组件来连接到Android的ATRACE服务，并将跟踪数据收集到Perfetto中进行进一步的分析和可视化。Perfetto还支持使用FTrace和Linux Perf等其他跟踪工具来收集系统跟踪数据。

### [Traceview](https://developer.android.com/studio/profile/traceview) 

> Traceview is deprecated

Traceview 是 Android SDK 中的一个性能分析工具，它用于分析 Android 应用的代码执行性能。Traceview 可以帮助开发者在开发应用的过程中找到应用性能问题，并提供详细的信息，以便开发者更好地了解应用在设备上的执行情况。

Traceview 支持两种类型的跟踪：方法调用跟踪和时间轴跟踪。方法调用跟踪提供了方法级别的性能分析，可以展示每个方法被调用的次数、执行时间和 CPU 占用率等信息。时间轴跟踪提供了更全面的视图，包括线程执行情况、锁的等待和释放、GC 等事件。

使用 Traceview 可以很方便地找到应用中耗时的方法或者线程，并且可以与代码结合使用，帮助优化应用的性能。Traceview 已经被新的 Android Studio Profiler 工具替代，但仍然可以在老版本的 Android Studio 中使用。

### [FTrace](https://www.bing.com/search?q=atrace&cvid=b446260481014e4386f8ea3975bb6124&aqs=edge..69i57j0l8.1050j0j1&pglt=2211&FORM=ANNTA1&PC=U531&mkt=zh-CN):

FTrace是Linux内核中的一种跟踪工具，它可以用于收集和分析内核和用户空间的各种跟踪数据。它可以帮助开发人员了解系统运行的细节，从而优化应用程序的性能。

在Android中，FTrace可以与Systrace工具一起使用，以收集系统级别的跟踪数据。Systrace将FTrace输出的数据可视化为时间线形式，使开发人员可以更直观地了解系统的行为。

FTrace和Perfetto的关系:
- FTrace和Perfetto是两种不同的跟踪工具，但它们可以相互配合使用来提高系统跟踪的效率和深度。
- FTrace是Linux内核自带的跟踪工具，可以用于跟踪内核函数调用、进程调度、中断处理等系统级事件，通过将这些事件输出到trace buffer中来进行分析和优化。
- Perfetto是一个跨平台的系统跟踪工具，主要用于跟踪Android、Chrome OS和Linux系统中的事件，它可以收集包括CPU使用率、内存分配、网络数据传输等各种系统级事件。相比FTrace，Perfetto提供了更丰富的数据可视化和分析工具，可以帮助开发者更好地理解系统的运行状况。
- 在Android系统中，Perfetto集成了FTrace，使用FTrace可以收集更多的系统跟踪数据，并将其输出到Perfetto trace buffer中进行分析。因此，FTrace和Perfetto可以互相配合使用来实现更全面的系统跟踪和分析。

### [Simpleperf](https://android.googlesource.com/platform/system/extras/+/master/Simpleperf/doc/README.md)

Simpleperf是一种本地CPU分析工具，可用于分析Android应用程序和运行在Android上的本地进程。它能够分析Android上的Java和C++代码，支持的Android版本为L及以上。Simpleperf的设计目的是提供一种轻量级的、易于使用的工具，用于解决Android性能分析中的常见问题。

Simpleperf和Perfetto的关系：
- Simpleperf和Perfetto都是Android平台上的性能分析工具，但它们的设计目的和实现方式不同。
- Simpleperf是一种本地CPU分析工具，可用于分析Android应用程序和运行在Android上的本地进程。它能够分析Android上的Java和C++代码，支持的Android版本为L及以上。Simpleperf的设计目的是提供一种轻量级的、易于使用的工具，用于解决Android性能分析中的常见问题。
- Perfetto则是一种系统跟踪工具，可以用于收集Android系统中各种类型的跟踪数据。它的设计目的是提供一种高度可扩展的跟踪框架，可用于在Android系统中收集大量的、多样化的跟踪数据。Perfetto支持的Android版本为O及以上，它的实现方式涉及底层系统组件和内核模块。
- 因此，Simpleperf和Perfetto是两种不同的性能分析工具，它们在设计目的、实现方式和使用场景等方面存在差异。

## 引用

- https://zhuanlan.zhihu.com/p/593844343
- [ref-1](https://www.androidperformance.com/2022/01/07/The-Performace-1-Performance-Tools/)
- https://www.cnblogs.com/DataFlux/p/15343529.html
- https://juejin.cn/post/7110142192928161823#heading-10
- https://juejin.cn/post/7073727491000664095
- https://www.splunk.com/en_us/data-insider/what-is-observability.html
- https://www.techtarget.com/searchitoperations/definition/observability
- https://developer.android.com/topic/performance/tracing?hl=zh-cn
- https://source.android.com/docs/core/tests/debug/eval_perf
- https://androidperformance.com/2022/01/07/The-Performace-1-Performance-Tools
- https://developer.android.com/agi/sys-trace/system-profiler
- https://developer.android.com/topic/performance/tracing

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可