---
article: false
---

# Perfetto - 42 - Buffers and dataflow

## Concepts

Perfetto中的跟踪是一个异步的多写单读管道。在许多方面，它的架构非常类似于现代GPU的命令缓冲区。

跟踪数据流的设计原则是：

跟踪快速通道基于对共享内存缓冲区的直接写入。
高度优化以实现低开销的写入。不是为低延迟的读取进行优化。
跟踪数据最终通过trace结束或通过IPC通道发出显式刷新请求提交到中央跟踪缓冲区。
生产者不可信，不应能够看到彼此的跟踪数据，因为这将泄露敏感信息。
在一般情况下，跟踪涉及两种缓冲区。当从Linux内核的ftrace基础设施中拉取数据时，会涉及第三个缓冲区（每个CPU一个）：

缓冲区

### 跟踪服务的中央缓冲区

这些缓冲区（上图中的黄色）由用户在跟踪配置的缓冲区部分定义。在最简单的情况下，一个跟踪会话=一个缓冲区，无论数据源和生产者的数量如何。

这是跟踪数据在内存中最终保留的地方，无论它来自内核ftrace基础设施，来自traced_probes中的其他数据源还是来自使用Perfetto SDK的另一个用户空间进程。在跟踪结束时（或在流式模式下），这些缓冲区会写入输出跟踪文件。

这些缓冲区可以包含来自不同数据源甚至不同生产者进程的跟踪数据包的混合。在缓冲区映射部分中定义哪些数据去哪里。因此，跟踪缓冲区不跨进程共享，以避免生产者进程之间的交叉对话和信息泄漏。

### 共享内存缓冲区
每个生产者进程都有一个与跟踪服务共享1：1的内存缓冲区（上图中的蓝色），无论它托管多少数据源。此缓冲区是临时暂存缓冲区，有两个目的：

在写入路径上实现零拷贝。该缓冲区允许从写入快速通道直接将跟踪数据序列化到可直接被跟踪服务读取的内存区域中。

将写操作与跟踪服务的读操作分离。跟踪服务的工作是尽可能快地将跟踪数据包从共享内存缓冲区（蓝色）移动到中央缓冲区（黄色）。共享内存缓冲区隐藏了跟踪服务的调度和响应延迟，使得生产者可以在跟踪服务暂时被阻塞时仍然保持写入数据而不会丢失数据。

### Ftrace buffer

当启用linux.ftrace数据源时，内核将具有自己的每个CPU缓冲区。这是不可避免的，因为内核无法直接写入用户空间缓冲区。traced_probes进程将定期读取这些缓冲区，将数据转换为二进制协议，并按照用户空间跟踪的相同数据流程进行处理。这些缓冲区需要足够大，以容纳两个ftrace读取周期之间的数据（TraceConfig.FtraceConfig.drain_period_ms）。

## Life of a trace packet

生命周期示例：

以下是跨缓冲区的跟踪数据包数据流的摘要。考虑一个生产者进程，其中包含两个以不同速率写入数据包的数据源，两者都指向同一个中央缓冲区。

当每个数据源开始写入时，它会获取一个空闲页面的共享内存缓冲区，并直接在其上序列化编码为 proto 的跟踪数据。

当共享内存缓冲区的页面被填满时，生产者将向服务发送异步 IPC 请求，请求它复制刚刚写入的共享内存页面。然后，生产者将获取共享内存缓冲区中的下一个空闲页面并继续写入。

当服务接收到 IPC 时，它将共享内存页面复制到中央缓冲区并将共享内存缓冲区页面标记为空闲状态。此时，生产者内的数据源可以重复使用该页面。

当跟踪会话结束时，服务向所有数据源发送 Flush 请求。作为对此的反应，数据源将提交所有未完成的共享内存页面，即使页面未完全填满。服务将这些页面复制到服务的中央缓冲区中。

## Buffer sizing
## Debugging data losses
## Atomicity and ordering guarantees
## Incremental state in trace packets
## Flushes and windowed trace importing

## Reference

- https://perfetto.dev/docs/concepts/buffers