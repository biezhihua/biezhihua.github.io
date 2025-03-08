---
article: false
---

# Perfetto - 16 - CPU Scheduling events CPU调度事件

在Android和Linux上，Perfetto可以通过Linux内核ftrace基础设施收集调度器跟踪信息。

这允许获取细粒度的调度事件，例如：

任何时间点哪些线程在哪个CPU核上调度，精确到纳秒。
正在运行的线程被取消调度的原因（例如，抢占，阻塞在互斥锁上，阻塞的系统调用或任何其他等待队列）。
一个线程何时变为可执行状态的时间点，即使它没有立即被放置在任何CPU运行队列中，还可以查看使其可执行的源线程。
用户界面


## UI

当缩小界面时，UI显示了CPU使用情况的量化视图，其中折叠了调度信息：

但是，通过放大视图，可以看到单个调度事件：

单击CPU切片会在详细面板中显示相关信息：

向下滚动时，当展开单个进程时，调度事件也会为每个线程创建一个跟踪，这允许跟踪单个线程状态的演变：


## SQL

## TraceConfig

## Scheduling wakeups and latency analysis 调度唤醒和延迟分析

通过在TraceConfig中进一步启用以下内容，ftrace数据源将记录调度唤醒事件：

ftrace_events:“sched/sched_wakeup_new”
ftrace_events:“sched/sched_waking”

只有当线程处于R（可运行）状态并且正在CPU运行队列上运行时，才会发出sched_switch事件，而当任何事件导致线程状态发生变化时，就会发出sched_waking事件。

考虑以下示例：

线程A
condition_variable.wait()
                                     线程B
                                     condition_variable.notify()

当线程A在wait（）上暂停时，它将进入S（睡眠）状态并从CPU运行队列中删除。当线程B通知变量时，内核将线程A转换为R（可运行）状态。此时，线程A有资格重新放回运行队列。但是，这可能需要一些时间，因为，例如：

- 所有CPU可能都在忙于运行其他线程，线程A需要等待以分配运行队列插槽（或其他线程具有更高的优先级）。
- 除当前CPU外的其他某些CPU，但是调度器负载平衡器可能需要一些时间才能将线程移动到另一个CPU。

除非使用实时线程优先级，否则大多数Linux内核调度器配置都不是严格的工作保存配置。例如，调度器可能希望等待一段时间，以便在当前CPU上运行的线程进入空闲状态，避免跨CPU迁移，这可能在开销和功率方面更昂贵。

注意：sched_waking和sched_wakeup提供几乎相同的信息。差异在于跨CPU的唤醒事件，涉及跨处理器中断。前者在源（wakee）CPU上发出，后者在目标（waked）CPU上发出。sched_waking通常足以进行延迟分析，除非您要分解由于跨处理器信令而导致的延迟。

启用sched_waking事件后，在选择CPU片段时，将出现以下内容：

### Decoding end_state

sched_slice表包含了系统调度活动的信息:

## Reference 
- https://perfetto.dev/docs/data-sources/cpu-scheduling
- https://perfetto.dev/docs/analysis/sql-tables#sched_slice
