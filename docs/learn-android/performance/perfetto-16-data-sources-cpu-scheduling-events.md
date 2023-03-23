---
article: false
---

# CPU Scheduling events

在Android和Linux上，Perfetto可以通过Linux内核的ftrace基础设施收集调度器跟踪。

这允许获得细粒度的调度事件，例如:
- 在任何时间点，哪个线程调度在哪个CPU核心上，具有纳秒精度。
- 一个正在运行的线程被取消调度的原因(例如抢占，在互斥锁上阻塞，阻塞系统调用或任何其他等待队列)。
- 一个线程有资格被执行的时间点，即使它没有立即被放在任何CPU运行队列上，以及使其可执行的源线程。

## UI

当缩小时，UI显示了CPU使用情况的量化视图，它折叠了调度信息:

向下滚动，当展开单个进程时，调度事件还为每个线程创建一个跟踪，这允许跟踪单个线程的状态演变:

## SQL

## TraceConfig

## Scheduling wakeups and latency analysis 调度唤醒和延迟分析

sched_switch事件仅在线程处于R(unnable)状态并且正在CPU运行队列上运行时触发，而sched_waking事件则在任何事件导致线程状态改变时触发。

当线程A挂起wait()时，它将进入状态S(睡眠)并从CPU运行队列中移除。当线程B通知变量时，内核将线程A转换到R(unnable)状态。此时线程A有资格被放回运行队列。然而，这可能不会发生一段时间，因为，例如:

- 所有cpu都可能忙于运行其他线程，线程A需要等待分配运行队列插槽(或者其他线程具有更高的优先级)。
- 除了当前CPU之外的其他CPU，但是调度器负载均衡器可能需要一些时间将线程移动到另一个CPU上。

除非使用实时线程优先级，大多数Linux内核调度器配置都不是严格的工作节约。例如，调度器可能倾向于等待一段时间，希望在当前CPU上运行的线程处于空闲状态，从而避免跨CPU迁移，因为跨CPU迁移在开销和功耗方面都可能更昂贵。

当启用sched_waking事件时，当选择CPU片时，UI中会出现以下内容:

### Decoding end_state

sched_slice表包含了系统调度活动的信息:

## Reference 
- https://perfetto.dev/docs/data-sources/cpu-scheduling
- https://perfetto.dev/docs/analysis/sql-tables#sched_slice
