---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 - 流畅性 | 第03篇 - 可观测性技术 - Observability Technology

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

更重要的可观测性技术允许你回答一些有趣的问题来摆脱某些技术困境，例如：
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

Trace 通过在代码中插入标记点（Trace Point），来记录应用程序的执行过程，包括方法调用、线程切换等等。这些标记点可以帮助开发者了解应用程序的运行状态，比如执行时间、调用顺序、线程运行情况等等。

Trace 特别适用于 Android 应用与系统级的分析场景，用它可以诊断：函数调用链、Binder 调用时的调用链、跨进程事件流等复杂场景。

Trace 技术提供了一组API，使得开发者可以在代码中灵活地使用 Trace 技术来记录和分析应用程序的性能。具体来说，开发者可以使用以下三个API来使用 Trace：
- `Debug.startMethodTracing()`：开始记录方法调用信息，并输出到文件中。
- `Debug.stopMethodTracing()`：停止记录方法调用信息，并将输出文件保存到指定的位置。
- `TraceCompat.beginSection()`：开始记录自定义的 Trace Point。
- `TraceCompat.endSection()`：停止记录自定义的 Trace Point。

此外，Android 系统中，一些重要的模块都已经默认插入了一些 Trace Point，通过 Trace Tag 来分类，其中信息来源如下：
- Framework Java 层的 Trace Point 通过 android.os.Trace 类完成。
- Framework Native 层的 Trace Point 通过 ATrace 宏完成。
- App 开发者可以通过 android.os.Trace 类自定义 Trace。

总之，Trace 是 Android 开发中非常实用的性能分析工具，它可以帮助开发者快速定位应用程序中的性能瓶颈，从而优化代码，提高应用程序的性能。

## Android中用于收集和分析各种类型的数据的工具

> Tools for collecting and analyzing various types of data in Android

Android 中有很多工具可以收集和分析可用于性能优化的数据，这里对他们进行一个简要的介绍。

这里先给一个工具之间关系的架构图，大家有个初步的印象。

![](/learn-android/performance/profile-tools-arch.png)

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

> 建议在运行Android 10及更高版本的设备上使用Perfetto。

![](/learn-android/performance/perfetto.png)

Perfetto 是 Android 10 中引入的平台级跟踪工具。这是适用于 Android、Linux 和 Chrome 的成熟开源跟踪项目。与 Systrace 不同，它提供数据源超集，可让以协议缓冲区二进制流形式记录任意长度的跟踪记录。可以在 Perfetto 界面中打开这些跟踪记录。

Perfetto 相比 Systrace 最大的改进是可以支持长时间数据抓取，这是得益于它有一个可在后台运行的服务，通过它实现了对收集上来的数据进行 Protobuf 的编码并存盘。

Perfetto 使用不同的来源从设备中收集性能跟踪数据，包括：
- 使用 ftrace 收集内核信息。
- 使用 Atrace 收集服务和应用中的用户空间注释。
- 使用 heapprofd 收集服务和应用程序的本地内存使用信息。

Perfetto 所支持的数据类型、获取方法，以及分析方式上也是前所未有的全面，它几乎支持所有的类型与方法。数据类型上通过 ATRACE 实现了 Trace 类型支持，通过可定制的节点读取机制实现了 Metric 类型的支持，在 UserDebug 版本上通过获取 Logd 数据实现了 Log 类型的支持。

在数据抓取层面，可以通过 Perfetto.dev 网页、命令行工具手动触发抓取与结束，通过设置中的开发者选项触发长时间抓取，甚至可以通过框架中提供的 Perfetto Trigger API 来动态开启数据抓取，基本上涵盖了我们在项目上能遇到的所有的情境。

在数据分析层面，Perfetto 提供了类似 Systrace 操作的数据可视化分析网页，但底层实现机制完全不同，最大的好处是可以支持超大文件的渲染，这是 Systrace 做不到的（超过 300M 以上时可能会崩溃、可能会超卡）。

Perfetto 是继Systrace之后新一代的性能分析工具，未来会完全取代 Systrace。

本系列的大部分文章都会从Perfetto这个工具的视角进行分析，其使用方法后续文章会详细介绍。

### [Systrace](https://source.android.com/docs/core/tests/debug/systrace)

> Systrace 适用于所有Android 4.3（API级别18）及更高版本的平台，但建议在运行Android 10及更高版本的设备上使用Perfetto。

![](/learn-android/performance/systrace.png)

Systrace 是一个传统的平台提供的命令行工具，它可以在短时间内记录设备活动并生成一个压缩的文本文件。该工具会产生一个报告，结合了来自 Android 内核的数据，例如CPU调度程序、磁盘活动和应用程序线程等。

Systrace 是多种其他工具的封装容器：它是 atrace 的主机端封装容器。
- atrace 用于控制用户空间 trace 和设置 ftrace。
- ftrace 是 Linux 内核提供的一个跟踪工具，可以追踪内核中各个模块的调用情况和性能瓶颈，包括CPU调度、进程间通信、内存管理等方面。
- Systrace 使用 atrace 来启用 trace ，其在 Android 系统内核中使用 ftrace 功能，记录各个组件的调用情况并将其输出到文本文件中，最终生成可视化的性能分析报告。

Systrace 通过在 Android 系统的各个组件中插入调用跟踪代码（Trace Point）来捕获性能数据，并使用 ftrace 收集和处理这些数据。通过分析这些数据，可以得出应用程序在运行时的行为和性能瓶颈，帮助开发人员进行调试和优化。

在 Android 系统中，一些重要的模块都已经默认插入了一些 Trace Point，通过 Trace Tag 来分类，例如：系统的一些关键操作（比如 Touch 操作、Power 按钮、滑动操作等）、系统机制（input 分发、View 绘制、进程间通信、进程管理机制等）、软硬件信息（CPU 频率信息、CPU 调度信息、磁盘信息、内存信息等）的等模块上都有Trace Point，其数据来源如下：
- Framework Java 层的 Trace Point 通过 android.os.Trace 类完成。
- Framework Native 层的 Trace Point 通过 ATrace 宏完成。
- App 开发者可以通过 android.os.Trace 类自定义 Trace。

Systrace 还可以通过Android Debug Bridge（ADB）与设备进行通信，收集设备运行时的各种信息，例如CPU、内存、网络等数据。它可以对这些数据进行过滤和排序，以提供开发人员更精细的性能分析。

对于 Android 开发者来说，Systrace 最大的作用就是把整个 Android 系统的运行状态，从黑盒变成了白盒。全局性和可视化使得 Systrace 成为 Android 开发者在分析复杂的性能问题的时候的首选。

**Systrace 和 atrace 和 ftrace 之间的关系**：
- ftrace：是一个内核函数跟踪器，function tracer，旨在帮助开发人员和系统设计者可以找到内核内部发生的事情。为数据采集部分。
- atrace：Android tracer，使用ftrace来跟踪Android上层的函数调用。为数据采集部分。
- systrace：Android 的 trace 数据分析工具，将 atrace 采集上来的数据，以图形化的方式展现出来。

### [atrace](https://perfetto.dev/docs/data-sources/atrace)

atrace 是 Android 系统中的一个命令行工具，用于跟踪和分析系统各种事件，例如CPU使用情况、内存分配、输入事件等等。它可以帮助开发者分析应用程序和系统的性能瓶颈，定位问题和优化代码。

atrace 通过连接到设备并使用 adb shell 命令来执行跟踪和分析操作，可以生成包含跟踪数据的日志文件，然后使用专业工具进行分析。

atrace 它允许开发人员在应用程序代码中插入时间戳和注释，以便在跟踪文件中显示。要使用 atrace，需要在设备上启用开发者选项，并使用命令行工具将设备连接到计算机上。然后，可以使用以下命令在跟踪文件中启用和禁用 atrace：
- 启用：`adb shell atrace --async_start <category>`
- 禁用：`adb shell atrace --async_stop`
- 其中，`<category>`参数指定要跟踪的类别，例如gfx（图形）、input（输入）或view（视图）。跟踪文件将保存在设备上，可以使用类似于adb pull的命令将其下载到计算机上进行分析。

atrace (frameworks/native/cmds/atrace) 使用 ftrace 捕获内核事件，使用 adb 在设备上运行 atrace。atrace 会执行以下操作：
- 通过设置属性 (debug.atrace.tags.enableflags) 来设置用户模式跟踪。
- 通过写入相应的 ftrace sysfs 节点来启用所需的 ftrace 功能。不过，由于 ftrace 支持的功能更多，您可以自行设置一些 sysfs 节点，然后使用 atrace。

atrace 所支持的 category:
```
         gfx - Graphics
       input - Input
        view - View System
     webview - WebView
          wm - Window Manager
          am - Activity Manager
          sm - Sync Manager
       audio - Audio
       video - Video
      camera - Camera
         hal - Hardware Modules
         app - Application
         res - Resource Loading
      dalvik - Dalvik VM
          rs - RenderScript
      bionic - Bionic C Library
       power - Power Management
          pm - Package Manager
          ss - System Server
    database - Database
     network - Network
         adb - ADB
         pdx - PDX services
       sched - CPU Scheduling
         irq - IRQ Events
         i2c - I2C Events
        freq - CPU Frequency
        idle - CPU Idle
        disk - Disk I/O
         mmc - eMMC commands
       workq - Kernel Workqueues
  regulators - Voltage and Current Regulators
  binder_driver - Binder Kernel driver
  binder_lock - Binder global lock trace
   pagecache - Page cache
```

**atrace 和 ftrace 之间的关系**：
- ftrace：是一个内核函数跟踪器，function tracer，旨在帮助开发人员和系统设计者可以找到内核内部发生的事情。为数据采集部分。
- atrace：Android tracer，使用ftrace来跟踪Android上层的函数调用。为数据采集部分。


### [Simpleperf](https://developer.android.com/ndk/guides/simpleperf)

> https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/README.md
> 支持的 Android 版本为L及以上

Simpleperf 是一种 Native CPU 分析工具，可用于分析 Android 应用程序和运行在 Android 上的 Native 进程。它能够分析 Android 上的 Java 和 C++ 代码。Simpleperf 的设计目的是提供一种轻量级的、易于使用的工具，用于解决 Android 性能分析中的常见问题。

其底层实现原理如下：
- 对于应用程序的性能分析，Simpleperf 通过采集和分析进程中的事件，例如CPU指令、内存访问、函数调用等来获取性能数据。它利用了Linux内核中提供的一些性能计数器，例如硬件性能计数器和软件性能计数器，以及CPU中的调试寄存器，来收集这些事件。
- 对于内核层的性能分析，Simpleperf 通过采集和分析内核函数的事件来获取性能数据。它利用了Linux内核中提供的动态追踪（Dynamic Tracing）技术，例如 ftrace 和 perf_events ，来捕获内核函数的调用和返回事件。
- Simpleperf 在采集性能数据时，采用了采样（Sampling）的方式。采样是指在一定的时间间隔内（例如每秒钟采集1000次），随机地选择一个线程或进程，并记录其当前正在执行的指令或函数调用栈。这种方法可以避免对系统性能造成太大的影响，并且可以获取到全局的性能数据。
- Simpleperf 将采集到的性能数据存储在内存中，然后将其写入磁盘文件。它还提供了一些工具，例如report和annotate，用于解析和分析性能数据，并生成易于理解的报告和图表。
- Simpleperf 的底层实现原理主要是通过采集和分析事件来获取性能数据，利用采样的方式避免对系统性能造成太大的影响，然后将数据存储并解析分析。

### [ftrace](https://source.android.google.cn/docs/core/tests/debug/ftrace?hl=zh-cn)

ftrace 是Linux内核中的一种跟踪工具，它可以用于收集和分析内核和用户空间的各种跟踪数据。它可以帮助开发人员了解系统运行的细节，从而优化应用程序的性能。

ftrace 是Linux内核中的一个跟踪框架，它的实现原理如下：
- ftrace利用Linux内核中的动态追踪技术，通过在内核中插入一些跟踪点（tracepoint）来捕获系统的事件，例如函数调用、中断发生、进程调度等。这些跟踪点可以手动添加或者自动产生。
- ftrace 提供了多种跟踪器（tracer），例如函数图（function graph）、系统调用（syscall）、模块加载（module）等，可以根据不同的需求选择合适的跟踪器进行跟踪。
- ftrace 还提供了多种输出方式，例如ring buffer、trace_pipe、trace_file等，可以将跟踪数据输出到不同的位置，方便用户进行分析。
- ftrace 的跟踪功能可以通过/sys/kernel/debug/tracing目录下的文件进行配置和控制。例如，可以通过设置tracing_on文件来启用或停用跟踪功能；可以通过设置tracing_thresh文件来调整跟踪事件的阈值。
- ftrace 还支持对用户态进程进行跟踪，用户可以通过系统调用（例如perf_event_open）来注册自己的跟踪点，并将跟踪数据输出到ftrace中进行分析。

在Android中，ftrace 可以作为 Systrace、Perfetto、Simpleperf 的数据源。

### [Traceview](https://developer.android.com/studio/profile/traceview) 

> Traceview is deprecated

Traceview 是 Android SDK 中的一个性能分析工具，它用于分析 Android 应用的代码执行性能。Traceview 可以帮助开发者在开发应用的过程中找到应用性能问题，并提供详细的信息，以便开发者更好地了解应用在设备上的执行情况。

Traceview 支持两种类型的跟踪：方法调用跟踪和时间轴跟踪。方法调用跟踪提供了方法级别的性能分析，可以展示每个方法被调用的次数、执行时间和 CPU 占用率等信息。时间轴跟踪提供了更全面的视图，包括线程执行情况、锁的等待和释放、GC 等事件。

使用 Traceview 可以很方便地找到应用中耗时的方法或者线程，并且可以与代码结合使用，帮助优化应用的性能。Traceview 已经被新的 Android Profiler 工具替代，但仍然可以在老版本的 Android Studio 中使用。

## Android中可观测性技术工具的应用场景

> Use Cases of Observability Technology Tools in Android

我们可以利用上述这些工具来分析应用的性能问题。
- 从技术角度来说，可用于分析响应速度 、卡顿丢帧、 ANR这些类别。
- 从用户角度来说，可用于分析用户遇到的性能问题，包括但不限于:
  - 应用启动速度问题，包括冷启动、热启动、温启动。
  - 界面跳转速度慢、跳转动画卡顿。
  - 其他非跳转的点击操作慢（开关、弹窗、长按、选择等）。
  - 亮灭屏速度慢、开关机慢、解锁慢、人脸识别慢等。
  - 列表滑动卡顿。
  - 窗口动画卡顿。
  - 界面加载卡顿。
  - 整机卡顿。
  - App 点击无响应、卡死闪退。

## 引用

- https://zhuanlan.zhihu.com/p/593844343
- https://www.androidperformance.com/2022/01/07/The-Performace-1-Performance-Tools/
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
- https://developer.android.com/studio/command-line/perfetto
- https://developer.android.com/studio/command-line/systrace
- https://www.cnblogs.com/pyjetson/p/14946007.html
- http://bcoder.com/java/android-atrace-systrace-usage-instruction
- https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/README.md

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可