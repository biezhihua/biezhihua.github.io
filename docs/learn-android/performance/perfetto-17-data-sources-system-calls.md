---
article: false
---

# Perfetto - 17 - System calls

在Linux和Android上(仅限userdebug版本)，Perfetto可以跟踪系统调用。

现在跟踪中只记录系统调用号，不存储参数以限制跟踪大小开销。

在导入时，跟踪处理器使用一个内部的系统调用映射表，目前支持x86、x86_64、ArmEabi、aarch32和aarch64。这些表是通过extract_linux_syscall_tables脚本生成的。


## UI
## SQL
##  TraceConfig

## Reference 
- https://perfetto.dev/docs/data-sources/syscalls
