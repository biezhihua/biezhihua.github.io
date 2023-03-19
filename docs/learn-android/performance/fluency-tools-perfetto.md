---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第04篇 - 性能分析工具 - Perfetto

## 介绍

## 数据源

System-wide tracing on Android and Linux
On Linux and Android, Perfetto bundles a number of data sources that are able to gather detailed performance data from different system interfaces. For the full sets and details see the Data Sources section of the documentation. Some examples:

- Kernel tracing: Perfetto integrates with Linux's ftrace and allows to record kernel events (e.g scheduling events, syscalls) into the trace.

- /proc and /sys pollers, which allow to sample the state of process-wide or system-wide cpu and memory counters over time.

- Integration with Android HALs modules for recording battery and energy-usage counters.

- Native heap profiling: a low-overhead heap profiler for hooking malloc/free/new/delete and associating memory to call-stacks, based on out-of-process unwinding, configurable sampling, attachable to already running processes.

- Capturing Java heap dumps with an out-of-process profiler tightly integrated with the Android RunTime that allows to get full snapshots of the managed heap retention graph (types, field names, retained size and references to other objects) without, however, dumping the full heap contents (strings and bitmaps) and hence reducing the serialization time and output file size.

On Android, Perfetto is the next-generation system tracing system and replaces the chromium-based systrace. ATrace-based instrumentation remains fully supported. See Android developer docs for more details.

## 引用

- https://ui.perfetto.dev/#!/record
- https://perfetto.dev/
- https://github.com/google/perfetto

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可