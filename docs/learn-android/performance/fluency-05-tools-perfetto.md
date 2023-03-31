---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第05篇 - 性能分析工具 - Perfetto

## Perfetto的介绍

Perfetto是一款高性能、开源的系统分析（system profiling）、应用跟踪（app tracing）和跟踪分析（trace analysis）工具。它提供了用于记录系统级和应用级trace的服务和库、Native和Java堆分析、以及基于Web的用户界面可视化和探索大规模跟踪记录。

Perfetto的记录trace功能基于一种新的内核空间到用户空间协议，该协议基于直接的protobuf序列化，并将数据存储在共享内存缓冲区中。

Perfetto有许多数据源，在Linux和Android上，可以从不同的系统接口收集详细的性能数据，例如：
- Kernel tracing - 内核跟踪，Perfetto与Linux的ftrace集成，允许将内核事件（例如调度事件，系统调用）记录到跟踪中。
- /proc和/sys pollers - 轮询器，允许对进程范围或系统范围的CPU和内存计数器进行采样。
- Android HAL模块集，用于记录电池和能耗计数器。
- Native heap profiling，一种低开销的堆分析器，用于挂钩malloc/free/new/delete并将内存关联到调用堆栈，基于外部进程展开，可配置采样，可附加到已经运行的进程。
- 使用与Android RunTime紧密集成的外部分析器捕获Java heap dumps，可获取托管堆保留图的完整快照（类型、字段名称、保留大小和对其他对象的引用）。

Perfetto的设计目标是在减少性能开销的同时提供高度的可扩展性和可配置性，以帮助开发人员快速诊断和调试复杂的软件系统。

> Java heap dumps：Java堆转储是一种诊断工具，用于分析Java虚拟机（JVM）中的内存泄漏和性能问题。它可以捕获当前JVM堆的所有对象，然后将它们的状态记录在一个文件中，包括对象的类型，引用关系，大小和内存地址等信息。堆转储文件可以通过多种工具进行分析，例如MAT（内存分析工具）或jhat（Java堆分析工具），可以帮助开发人员定位和解决内存泄漏和性能问题。

## 使用Perfetto记录trace

使用Perfetto记录trace有两种主要的方式，一种是使用Perfetto UI来记录trace，另一种是使用命令行来记录trace，命令行中又分为使用config配置文件记录trace和使用类atrace缩写的命令来记录trace。

### Perfetto UI

Perfetto UI中将探针（probes）- 可配置的trace事件，分为了五大类：CPU、GPU、Power、Memory、Android apps，里面可通过trace config多达百种不同的配置。

其中性能分析最为常用的则是Android apps*&svcs中的Atrace userspace annotations和Frame timeline了，atrace中有大量的系统trace points可以让开发者方便的进行分析，frame timeline则可以让开发者了解是否有卡顿、卡帧的情况。

### Perfetto cmdline

通过使用Perfetto提供的record_android_trace脚本，就可以方便的进行trace记录了，而且使用方式也兼容了atrace的使用方式，且得到的信息也基本够一般场景下的性能分析了，例如：
```shell
record_android_trace -o trace_file.perfetto-trace -t 10s -b 32mb sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory
```

除了使用atrace的参数来使用record_android_trace外，还可以使用本地的config.pbtx文件配置自定义的事件，不过这种方式难度较高，普通开发者往往不太熟悉config.pbtx可配置的内容，这种情况下使用Perfetto UI更好一些，这里也有一个例子：
```shell
./record_android_trace -c config.pbtx -o trace_file.perfetto-trace 
```

## 数据源与UI可视化

想要用好Perfetto，具备理解trace可视化图表的能力必不可少，下面会对常用的数据源做一些分析和解读。 

其中部分翻译自官方文档，部分来自于经验总结。

### CPU - Scheduling details

#### 基础

在Android和Linux上，Perfetto可以通过Linux内核ftrace基础设施收集CPU调度器跟踪信息。

可以获取细粒度的调度事件，例如：
- 任何时间点哪些线程在哪个CPU核上调度，精确到纳秒。
- 正在运行的线程被取消调度的原因（例如，抢占，阻塞在互斥锁上，阻塞的系统调用或任何其他等待队列）。
- 一个线程何时变为可执行状态的时间点，即使它没有立即被放置在任何CPU运行队列中，还可以查看使其可执行的原线程。

#### 记录trace

##### 使用UI

通过开启配置：Record new trace -> CPU - Scheduling details，来记录trace。

![](/learn-android/performance/fluency-tools-perfetto-cpu-scheduling-details.png)

##### 使用命令行

config.pbtx:
```
buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.process_stats"
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "sched/sched_switch"
            ftrace_events: "power/suspend_resume"
            ftrace_events: "sched/sched_wakeup"
            ftrace_events: "sched/sched_wakeup_new"
            ftrace_events: "sched/sched_waking"
            ftrace_events: "sched/sched_process_exit"
            ftrace_events: "sched/sched_process_free"
            ftrace_events: "task/task_newtask"
            ftrace_events: "task/task_rename"
        }
    }
}
duration_ms: 10000
```

记录trace的命令：
```
// windows
python3 record_android_trace -c config.pbtx -o trace_file.perfetto-trace

// mac or linux
record_android_trace -c config.pbtx -o trace_file.perfetto-trace
```

#### UI解读

- 当缩小界面时，UI显示了CPU使用情况的量化视图，其中折叠了CPU调度信息：

![](/learn-android/performance/fluency-tools-perfetto-cpu-bar-graphs.png)

- 当放大界面时，可以看到单个调度事件：

![](/learn-android/performance/fluency-tools-perfetto-cpu-zoomed.png)

- 当单击CPU切片会在详细面板中显示相关信息：

![](/learn-android/performance/fluency-tools-perfetto-cpu-sched-details.png)

- 当向下滚动时，展开单个进程，调度事件也会为每个线程创建一个跟踪，这允许跟踪单个线程状态的演变：

![](/learn-android/performance/fluency-tools-perfetto-cpu-process-threads.png)

请注意，只有在开启了Scheduling details的配置后，可视化工具才会正确的显示进程、线程名。

#### 调度唤醒和延迟分析 - Scheduling wakeups and latency analysis 

当一个线程（A）从S（睡眠）状态转换为R（可运行）状态时可能没有那么迅速，这可能因为：
- 所有CPU可能都在忙于运行其他线程，线程（A）需要等待以分配运行队列插槽（或其他线程具有更高的优先级）。
- 除当前CPU外的其他某些CPU，但是调度器负载平衡器可能需要一些时间才能将线程移动到另一个CPU。
  - 除非使用实时线程优先级，否则大多数Linux内核调度器配置都不是严格的工作保存配置。例如，调度器可能希望等待一段时间，以便在当前CPU上运行的线程进入空闲状态，避免跨CPU迁移，这可能在开销和功率方面更昂贵。

而这种情况就会造成线程的延迟，在Perfetto上选择一个CPU切片就可以看到这种状态：

![](/learn-android/performance/fluency-tools-perfetto-cup-scheduling-latency.png)

#### 线程end_state状态

在Perfetto中，end\_state提供了有关事件结束时线程状态的信息。下面是一些常见的状态及其解释：

| end\_state | 翻译 | 解释 |
| --- | --- | --- |
| R | Runnable | 线程在结束时处于“运行”状态，即正在CPU上运行。 |
| R+ | Runnable (Preempted) | 线程在结束时处于“运行”状态，但是它已经超过了原定的时间配额（time slice），并且内核已经决定将它挂起。 |
| S | Sleeping | 线程在结束时处于“休眠”状态，即正在等待某些事件发生，例如I/O操作完成。 |
| D | Uninterruptible Sleep | 线程在结束时处于“不可中断的休眠”状态，即正在等待某些事件发生，但是不能被打断。 |
| T | Stopped | 线程在结束时处于“停止”状态，即已经被调试器暂停。 |
| t | Traced | 线程在结束时处于“跟踪停止”状态，即已经被调试器暂停，以进行跟踪。 |
| X | Exit (Dead) | 线程在结束时处于“死亡”状态，即已经退出。 |
| Z | Exit (Zombie) | 线程在结束时处于“僵尸”状态，即已经退出，但是它的父进程还没有处理完它的退出状态。 |
| x | Task Dead | 线程在结束时处于“信号处理停止”状态，即它正在处理信号并已被暂停。 |
| I | Idle | 线程在结束时处于“空闲”状态，即CPU没有正在运行的进程或线程。 |
| K | Wake Kill | 线程在结束时处于“被唤醒但被杀死”状态，即它已经被唤醒，但是内核决定将其终止。 |
| W | Waking | 线程在结束时处于“唤醒”状态，即正在从睡眠状态唤醒。 |
| P | Parked | 线程在结束时处于“Park”状态，即它已经被暂停，以节省CPU资源。 |
| N | No Load | 线程在结束时处于“未知”状态，即状态无法确定。 |

这些状态通常与事件的开始状态和其他上下文信息一起使用，来提供对系统行为的完整视图。

### CPU - Scheduling details & Syscalls

在Linux和Android（仅限userdebug、profilable版本），Perfetto可以跟踪系统调用，开启后会记录所有syscall的进入和退出。

#### 记录trace

##### 使用UI

通过开启配置：Record new trace -> CPU -> Scheduling details 和 Syscalls，来记录trace。

![](/learn-android/performance/fluency-tools-perfetto-cpu-scheduling-details.png)

##### 使用命令行

config.pbtx:
```
buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "raw_syscalls/sys_enter"
            ftrace_events: "raw_syscalls/sys_exit"
        }
    }
}
duration_ms: 10000
```


config.pbtx:
```
buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.process_stats"
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "sched/sched_switch"
            ftrace_events: "power/suspend_resume"
            ftrace_events: "sched/sched_wakeup"
            ftrace_events: "sched/sched_wakeup_new"
            ftrace_events: "sched/sched_waking"
            ftrace_events: "raw_syscalls/sys_enter"
            ftrace_events: "raw_syscalls/sys_exit"
            ftrace_events: "sched/sched_process_exit"
            ftrace_events: "sched/sched_process_free"
            ftrace_events: "task/task_newtask"
            ftrace_events: "task/task_rename"
        }
    }
}
duration_ms: 10000
```

记录trace的命令：
```
// windows
python3 record_android_trace -c config.pbtx -o trace_file.perfetto-trace

// mac or linux
record_android_trace -c config.pbtx -o trace_file.perfetto-trace
```

#### UI解读

![](/learn-android/performance/fluency-tools-perfetto-cpu-system-calls-detail-trace.png)

当向下滚动时，展开单个进程，调度事件也会为每个线程创建一个跟踪，里面包含了syscalls的函数，经常看到的有：
- `sys_futex`、`sys_exit`、`sys_epoll_pwait`、`sys_clone`、`sys_writev`、`sys_ioctl`、`sys_recvfrom`、`sys_read`、`sys_rt_sigtimedwait`等。


| 函数名 | 解释 | 使用场景 |
| --- | --- | --- |
| sys\_futex | 系统调用，用于操作互斥锁、条件变量等同步原语。 | 在多线程应用程序中使用，用于实现线程同步和互斥。 |
| sys\_exit | 系统调用，用于终止当前进程。 | 在应用程序中，用于正常退出或异常退出进程。 |
| sys\_epoll\_pwait | 系统调用，用于等待多个文件描述符上的事件。 | 在网络编程中，用于异步地等待TCP套接字的数据到达。 |
| sys\_clone | 系统调用，用于创建新的进程或线程。 | 在多线程应用程序中使用，用于创建新的线程。 |
| sys\_writev | 系统调用，用于向文件描述符写入数据。 | 在应用程序中，用于将数据写入文件、管道、套接字等。 |
| sys\_ioctl | 系统调用，用于控制设备和文件描述符的操作。 | 在应用程序中，用于与设备驱动程序通信以控制硬件设备。 |
| sys\_recvfrom | 系统调用，用于从套接字接收数据。 | 在网络编程中，用于接收UDP套接字上的数据。 |
| sys\_read | 系统调用，用于从文件描述符读取数据。 | 在应用程序中，用于从文件、管道、套接字等读取数据。 |
| sys\_rt\_sigtimedwait | 系统调用，用于等待实时信号。 | 在实时信号处理中使用，用于等待实时信号并处理信号。 |

注意：这些函数的使用场景可能因操作系统版本、编程语言、应用程序类型等因素而异。以上仅提供一般的参考。

### Android app&svcs - Atrace usersapce annotations

#### 基础

在Android上，开发者可以使用atrace向trace中插入自定义的跟踪点（trace point），可以通过以下方法实现:
- Java/Kotlin apps (SDK): `android.os.Trace`。
- Native processes (NDK): `ATrace_beginSection()` / `ATrace_setCounter()`定义在`<trace.h>`。
- Android internal processes：`libcutils/trace.h`中定义的`ATRACE_BEGIN()` / `ATRACE_INT()`。

有两种类型的跟踪事件:System events和App events:。
- System events:由Android内部使用libcutils触发。这些事件按类别分组(也称为标签 - TAG)，例如:am - ActivityManager， pm - PackageManager。TAG可用于跨多个进程启用事件组，而不必担心是哪个特定的系统进程发出它们。
- App events:与System events具有相同的语义。然而，与System events不同的是，它们没有任何标签（TAG）过滤功能(所有应用程序事件共享相同的标签ATRACE_TAG_APP)，但可以在每个应用程序的基础上启用。

atrace有不可忽略的成本，每个事件需要1-10us。这是因为每个事件都涉及到一个字符串化、一个来自执行环境的JNI调用，以及一个用户空间`<->`内核空间的往返，以将标记写入`/sys/kernel/debug/tracing/trace_marker`(这是最昂贵的部分)。

可以在atrace的[源码](https://cs.android.com/android/platform/superproject/+/master:frameworks/native/cmds/atrace/atrace.cpp)中找到关于TAG的定义，基本上涉及到了系统应用的方方面面：

```
{ "gfx",        "Graphics",                 ATRACE_TAG_GRAPHICS, { } },
{ "input",      "Input",                    ATRACE_TAG_INPUT, { } },
{ "view",       "View System",              ATRACE_TAG_VIEW, { } },
{ "webview",    "WebView",                  ATRACE_TAG_WEBVIEW, { } },
{ "wm",         "Window Manager",           ATRACE_TAG_WINDOW_MANAGER, { } },
{ "am",         "Activity Manager",         ATRACE_TAG_ACTIVITY_MANAGER, { } },
{ "sm",         "Sync Manager",             ATRACE_TAG_SYNC_MANAGER, { } },
{ "audio",      "Audio",                    ATRACE_TAG_AUDIO, { } },
{ "video",      "Video",                    ATRACE_TAG_VIDEO, { } },
{ "camera",     "Camera",                   ATRACE_TAG_CAMERA, { } },
{ "hal",        "Hardware Modules",         ATRACE_TAG_HAL, { } },
{ "res",        "Resource Loading",         ATRACE_TAG_RESOURCES, { } },
{ "dalvik",     "Dalvik VM",                ATRACE_TAG_DALVIK, { } },
{ "rs",         "RenderScript",             ATRACE_TAG_RS, { } },
{ "bionic",     "Bionic C Library",         ATRACE_TAG_BIONIC, { } },
{ "power",      "Power Management",         ATRACE_TAG_POWER, { } },
{ "pm",         "Package Manager",          ATRACE_TAG_PACKAGE_MANAGER, { } },
{ "ss",         "System Server",            ATRACE_TAG_SYSTEM_SERVER, { } },
{ "database",   "Database",                 ATRACE_TAG_DATABASE, { } },
{ "network",    "Network",                  ATRACE_TAG_NETWORK, { } },
{ "adb",        "ADB",                      ATRACE_TAG_ADB, { } },
{ "vibrator",   "Vibrator",                 ATRACE_TAG_VIBRATOR, { } },
{ "aidl",       "AIDL calls",               ATRACE_TAG_AIDL, { } },
{ "nnapi",      "NNAPI",                    ATRACE_TAG_NNAPI, { } },
{ "rro",        "Runtime Resource Overlay", ATRACE_TAG_RRO, { } },
```

#### UI

在UI层面，这些被插桩的函数会在进程trace分组中创建切片（slice）和计数器（counter），这样的能力非常的重要，可以帮助开发者理解系统和App的执行流程，以快速定位到性能问题。

![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-atrace.png)

这里是一段启动Android系统设置App的system call，可以清晰的看到s设置App的启动过程涉及到了诸多函数的调用：ActivityThreadMain、bindApplication、activityStart、activityResume。

以ActivityThreadMain这个调用为例，在`frameworks/base/core/java/android/app/ActivityThread.java`文件中为`main`函数增加了trace信息，其底层使用的是atrace向ftrace添加事件来实现的。

```java
public static void main(String[] args) {
    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "ActivityThreadMain");

    // Install selective syscall interception
    AndroidOs.install();

    ......

    Looper.prepareMainLooper();

    ......

    ActivityThread thread = new ActivityThread();
    thread.attach(false, startSeq);

    if (sMainThreadHandler == null) {
        sMainThreadHandler = thread.getHandler();
    }

    ......

    // End of event ActivityThreadMain.
    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
    Looper.loop();

    throw new RuntimeException("Main thread loop unexpectedly exited");
}
```

当选中方法片段，可以看到片段的详细信息，例如：Start time、Duration、Process、Thread等，这些都可以为性能优化提供帮助：

![](/learn-android/performance/fluency-tools-perfetto-cpu-system-calls-detail.png)

关于Slice Details内字段解释如下：
| 字段 | 解释 |
| --- | --- |
| Name | 该片段的名称。例如，在CPU片段中，名称可以是系统调用名称或进程/线程名称。 |
| Category | 该片段的类别。例如，在CPU片段中，类别可以是系统调用、进程/线程、binder。 |
| Start time | 该片段的开始时间戳（以微秒为单位），相对于当前追踪的开始时间。 |
| Absolute time | 该片段的开始时间戳（以微秒为单位），相对于Unix纪元时间戳（1970年1月1日）。 |
| Duration | 该片段的持续时间（以微秒为单位）。 |
| Thread duration | 该片段在该线程上的持续时间（以微秒为单位）。 |
| Process | 包含该片段的进程的PID（进程标识符）。 |
| User ID | 包含该片段的进程的用户ID。 |
| Slice ID | 该片段的唯一标识符。 |

### Android app&svcs - Android Jank/dʒæŋk/ detection with FrameTimeline

这一部分官方讲的非常好，直接翻译过来的。

#### 基础

一帧画面如果呈现在屏幕上的时间与调度器给出的预测呈现时间不匹配，那么这个帧被称为jank。

janky 可能导致的问题有：
- 不稳定的帧率
- 延迟增加

FrameTimeline是SurfaceFlinger中检测jank的模块，并报告jank的源头。SurfaceViews目前不受支持，但将在未来支持。

#### 记录trace

##### 使用UI

![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-frametimeline-ui.png)

##### 使用命令行

config.pbtx:
```
buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "android.surfaceflinger.frametimeline"
    }
}
duration_ms: 10000
```


config.pbtx:
```
buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.process_stats"
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: "android.surfaceflinger.frametimeline"
    }
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "sched/sched_switch"
            ftrace_events: "power/suspend_resume"
            ftrace_events: "sched/sched_wakeup"
            ftrace_events: "sched/sched_wakeup_new"
            ftrace_events: "sched/sched_waking"
            ftrace_events: "sched/sched_process_exit"
            ftrace_events: "sched/sched_process_free"
            ftrace_events: "task/task_newtask"
            ftrace_events: "task/task_rename"
        }
    }
}
duration_ms: 10000
```

记录trace的命令：
```
// windows
python3 record_android_trace -c config.pbtx -o trace_file.perfetto-trace

// mac or linux
record_android_trace -c config.pbtx -o trace_file.perfetto-trace
```

#### UI

**对于每个应用，会添加两个新的跟踪内容 - Expected Timeline & Actual Timeline。**

![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-frametimeline.png)

- 期望时间轴（Expected Timeline）：每个片段表示给应用程序渲染帧的时间。为避免系统中出现jank，应用程序应在这个时间范围内完成。
- 实际时间轴（Actual Timeline）：这些片段表示应用程序完成帧的实际时间（包括GPU工作）并将其发送到SurfaceFlinger进行组合。
    - 注意：FrameTimeline目前尚不知道应用程序的实际帧开始时间，所以使用了预期的开始时间。这里的片段结束时间表示m`max(gpu time, post time)`。post时间是应用程序的帧发布到SurfaceFlinger的时间。
    - ![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-frametimeline-post-time.png)

![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-frametimeline-sf-vsyncid.png)

此外，主线程和RenderThread中的片段的名称表示从choreographer接收到的标记。可以将实际时间轴跟踪（Actual Timeline）中的片段与期望时间轴跟踪（Expected Timeline）中的相应片段进行比较，以查看应用程序的性能表现如何。

**对于SurfaceFlinger，也会添加两个新的跟踪内容 - Expected Timeline & Actual Timeline。**

表示其应该在内部完成的期望时间，以及完成合成帧并呈现在屏幕上所需的实际时间。在这里，SurfaceFlinger的是显示为堆栈的所有内容。这包括Composer和DisplayHAL。因此，这些片段表示SurfaceFlinger主线程的开始到屏幕更新。

![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-frametimeline-doframe.png)

> 在Android操作系统中，Display HAL（Hardware Abstraction Layer）是用于抽象底层硬件接口的一个组件。它提供了一个标准化的接口，让Android的图形系统能够在不同的硬件设备上运行，并且让硬件厂商可以轻松地支持Android的图形系统。Display HAL的主要作用是提供显示屏幕的基本功能，例如在屏幕上显示图像、调整屏幕亮度、旋转屏幕等等。在Android的架构中，Display HAL是图形系统和硬件之间的接口，它与硬件抽象层（HAL）和Android图形系统（例如SurfaceFlinger）进行交互，并且为Android应用程序提供了标准的显示功能。通过使用Display HAL，Android能够支持各种不同的屏幕和硬件设备，并且提供一致的用户体验。

**选择实际时间线片段，并选择详细信息提供有关帧发生了什么的更多信息。这些包括：**

![](/learn-android/performance/fluency-tools-perfetto-android-app-svcs-frametimeline-selection.png)

- Present Type
    - 帧是早期、准时还是迟到呈现的。
- On time finish 准时完成
    - 应用程序是否按时完成了帧的工作？
- Jank Type
    - 这个帧有没有观察到jank？如果是，这显示观察到了什么类型的jank。如果没有，则类型将为None。
- Prediction type
    - 预测是否在FrameTimeline收到此帧时过期？如果是，它将说已过期的预测。如果没有，那就是有效预测。
- GPU Composition
    - 告诉帧是否由GPU合成。
- Layer Name
    - 呈现该帧的层/表面的名称。一些进程会将帧更新到多个表面。在这里，具有相同令牌的多个切片将显示在实际时间轴中。层名称可以是区分这些切片的一种好方法。
- Is Buffer? 是否为缓冲区？
    - 一个布尔值，告诉我们这帧是否对应于缓冲区或者动画。


## 引用

- https://ui.perfetto.dev/#!/record
- https://perfetto.dev/
- https://github.com/google/perfetto
- https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/app/ActivityThread.java;l=7875?q=ActivityThreadMain&hl=zh-cn

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可