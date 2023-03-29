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

### CPU调度事件 - CPU Scheduling events 

#### 基础

在Android和Linux上，Perfetto可以通过Linux内核ftrace基础设施收集CPU调度器跟踪信息。

可以获取细粒度的调度事件，例如：
- 任何时间点哪些线程在哪个CPU核上调度，精确到纳秒。
- 正在运行的线程被取消调度的原因（例如，抢占，阻塞在互斥锁上，阻塞的系统调用或任何其他等待队列）。
- 一个线程何时变为可执行状态的时间点，即使它没有立即被放置在任何CPU运行队列中，还可以查看使其可执行的原线程。

#### UI

- 当缩小界面时，UI显示了CPU使用情况的量化视图，其中折叠了CPU调度信息：

![](/learn-android/performance/fluency-tools-perfetto-cpu-bar-graphs.png)

- 当放大界面时，可以看到单个调度事件：

![](/learn-android/performance/fluency-tools-perfetto-cpu-zoomed.png)

- 当单击CPU切片会在详细面板中显示相关信息：

![](/learn-android/performance/fluency-tools-perfetto-cpu-sched-details.png)

- 当向下滚动时，当展开单个进程时，调度事件也会为每个线程创建一个跟踪，这允许跟踪单个线程状态的演变：

![](/learn-android/performance/fluency-tools-perfetto-cpu-process-threads.png)

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

### 系统调用 - system calls

#### 基础

在Linux和Android（仅限userdebug、profilable版本），Perfetto可以跟踪系统调用。

system calls对于理解Android系统的运行过程具有非常大的帮助。

#### UI

在UI层面，系统调用与每个线程片段的跟踪轨迹一起显示：

![](/learn-android/performance/fluency-tools-perfetto-cpu-system-calls.png)

这里是一段启动Android系统setting app的system call，可以清晰的看到setting app的启动过程涉及到了诸多函数的a调用：ActivityThreadMain、bindApplication、activityStart、activityResume。

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


## 引用

- https://ui.perfetto.dev/#!/record
- https://perfetto.dev/
- https://github.com/google/perfetto
- https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/app/ActivityThread.java;l=7875?q=ActivityThreadMain&hl=zh-cn

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可