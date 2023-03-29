---
article: false
---

# Perfetto - 17 - System calls 系统调用

在Linux和Android（仅限userdebug版本），Perfetto可以跟踪系统调用。

目前，跟踪中只记录系统调用号，不记录参数以限制跟踪大小开销。

在导入时，Trace Processor使用内部系统调用映射表，当前支持x86，x86_64，ArmEabi，aarch32和aarch64。这些表是通过extract_linux_syscall_tables脚本生成的。

## UI

在UI层面，系统调用与每个线程片段轨迹一起显示：

## SQL
##  TraceConfig

## Reference 
- https://perfetto.dev/docs/data-sources/syscalls
