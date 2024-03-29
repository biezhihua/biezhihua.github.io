---
article: false
---

# Perfetto - 13 - Memory counters and events

Perfetto允许在Android和Linux上收集大量内存事件和计数器。这些事件来自内核接口，包括ftrace和/proc接口，有两种类型:轮询计数器和内核在ftrace缓冲区中推送的事件。

## Per-process polled counters

https://perfetto.dev/docs/reference/trace-packet-proto#ProcessStats

### UI
### SQL
### TraceConfig

## Per-process memory events (ftrace)
### rss_stat

最新版本的Linux内核允许在常驻设置大小(RSS) mm计数器发生变化时报告ftrace事件。这与VmRSS在/proc/pid/status中可用的计数器相同。此事件的主要优点是，作为事件驱动的推送事件，它允许检测非常短的内存使用突发，否则使用/proc计数器无法检测到。

数百MB的内存使用峰值会对Android产生巨大的负面影响，即使它们只持续了几毫秒，因为它们会导致大量低内存消耗来回收内存。

支持这一点的内核特性已经在b3d1411b6的Linux内核中引入，后来由e4dcad20改进。从Linux v5.5-rc1开始，它们在上游可用。这个补丁已经被反移植到几个运行Android 10 (Q)的谷歌像素内核中。

### mm_event

Mm_event是一个ftrace事件，它捕获有关关键内存事件(由/proc/vmstat公开的事件的子集)的统计信息。与RSS-stat计数器更新不同，mm事件的容量非常大，单独跟踪它们是不可行的。相反，Mm_event只在跟踪中报告周期性的直方图，从而有效地减少了开销。

mm_event仅在运行Android 10 (Q)及以上版本的一些谷歌Pixel内核上可用。

mm_event使能后，将记录以下mm事件类型:

- mem.mm。min_flt:页面轻微错误
- mem.mm。maj_flt:主要页面错误
- mem.mm。swp_flt: swapcache提供的页面错误
- mem.mm。read_io: I/O支持的读页错误
- memm .mm. compaction:内存压缩事件
- memm .mm.reclaim:内存回收事件

对于每种事件类型，事件记录:
- 计数:自前一个事件以来事件发生了多少次。
- Min_lat:自上次事件发生以来的最小延迟时间(mm事件持续时间)。
- Max_lat:自上次事件以来记录的最高延迟。

### UI
### SQL
### TraceConfig

## System-wide polled counters 全系统轮询计数器
### UI
### SQL
### TraceConfig

## Low-memory Kills (LMK)

当需要内存时，Android框架会关闭应用程序和服务，尤其是后台应用程序，为新打开的应用程序腾出空间。这些被称为低内存终止(LMK)。

注意lmk并不总是性能问题的症状。经验法则是，游戏的严重程度(游戏邦注:即用户所感受到的影响)与应用被扼杀的状态成正比。应用程序状态可以从OOM调整分数的跟踪中派生出来。

前台应用程序或服务的LMK通常是一个大问题。当用户正在使用的应用程序在他们的手指下消失，或者他们最喜欢的音乐播放器服务突然停止播放音乐时，就会发生这种情况。

相反，缓存应用程序或服务的LMK通常是正常的，在大多数情况下，最终用户不会注意到，直到他们尝试返回应用程序，然后冷启动。

在这两个极端之间的情况更加微妙。缓存应用/服务的lmk如果发生在风暴中(即观察到大多数进程在短时间内得到LMK-ed)，仍然可能是有问题的，而且通常是系统的某些组件导致内存峰值的症状。

### lowmemorykiller vs lmkd

ndroid上的lmk，无论是旧的内核内lowmemkiller还是更新的lmkd，都使用与标准Linux内核的OOM Killer完全不同的机制。Perfetto目前只支持Android LMK事件(内核和用户空间)，不支持跟踪Linux内核OOM Killer事件。Linux OOMKiller事件理论上仍有可能在Android上发生，但几乎不可能发生。如果出现这种情况，则更有可能是错误配置的BSP的症状。

### UI
### SQL
### TraceConfig

## App states and OOM adjustment score App状态和OOM调整分数

Android应用程序的状态可以从进程oom_score_adj的跟踪中推断出来。映射不是1:1，状态比oom_score_adj值组多，缓存进程的oom_score_adj范围从900到1000。

映射可以从ActivityManager的ProcessList源推断出来

## Reference

- https://perfetto.dev/docs/data-sources/memory-counters
- https://manpages.debian.org/stretch/manpages/proc.5.en.html
- https://perfetto.dev/docs/reference/trace-packet-proto#ProcessStats