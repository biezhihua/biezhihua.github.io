---
article: false
---
# Perfetto - System profiling, app tracing and trace analysis

## Recording traces

在其核心，Perfetto引入了一种新颖的用户空间到用户空间跟踪协议，该协议基于共享内存缓冲区上的直接protobuf序列化。跟踪协议在内部用于内置数据源，并通过跟踪SDK和跟踪事件库公开给c++应用程序。

这个新的跟踪协议允许通过可扩展的基于protobuf的功能发布和数据源配置机制动态配置跟踪的所有方面(请参阅跟踪配置文档)。不同的数据源可以多路复用到用户定义的缓冲区的不同子集上，还允许将任意长的跟踪流输入文件系统。

### System-wide tracing on Android and Linux Android和Linux上的系统范围跟踪

在Linux和Android上，Perfetto捆绑了许多数据源，这些数据源能够从不同的系统接口收集详细的性能数据。有关完整集和详细信息，请参阅文档的数据源部分。一些例子:
 
- 内核跟踪:Perfetto集成了Linux的ftrace，允许将内核事件(例如调度事件，系统调用)记录到跟踪中。

- /proc和/sys轮询器，允许在一段时间内对进程级或系统级CPU和内存计数器的状态进行抽样。

- 与Android HALs模块集成，记录电池和能源使用计数器。

- 原生堆分析:一个低开销的堆分析器，用于挂钩malloc/free/new/delete，并将内存关联到调用堆栈，基于进程外unwind，可配置采样，可附加到已经运行的进程。

- 使用与Android RunTime紧密集成的进程外分析器捕获Java堆转储，允许获得托管堆保留图的完整快照(类型，字段名，保留大小和对其他对象的引用)，然而，不转储完整的堆内容(字符串和位图)，从而减少序列化时间和输出文件大小。

在Android上，Perfetto是下一代系统跟踪系统，取代了基于chromium的systrace。完全支持基于atrace的检测。详见Android开发者文档。

### Tracing SDK and user-space instrumentation

### Tracing in Chromium

## Trace analysis

除了跟踪记录功能，Perfetto代码库还包括一个专门用于导入、解析和查询新的和旧的跟踪格式的项目——跟踪处理器。

Trace Processor是一个可移植的c++ 17库，它提供了面向列的表存储，专为有效地将数小时的跟踪数据保存在内存中而设计，并公开了一个基于流行的SQLite查询引擎的SQL查询接口。跟踪数据模型变成一组SQL表，可以以非常强大和灵活的方式查询和连接这些SQL表，以分析跟踪数据。

在此基础上，Trace Processor还包括一个基于跟踪的度量子系统，该子系统由预烘焙的和可扩展的查询组成，可以以JSON或protobuf消息的形式输出关于跟踪的强类型摘要(例如，不同频率状态下的CPU使用情况，按进程和线程细分)。

基于跟踪的度量允许在性能测试场景、批分析或大型跟踪语料库中轻松集成跟踪。

Trace Processor还为低延迟查询和构建跟踪可视化器而设计。如今，Trace Processor被Perfetto UI用作Web Assembly模块，Android Studio和Android GPU Inspector用作原生c++库。

## Trace visualization

Perfetto还提供了一个全新的跟踪可视化工具，用于打开和查询数小时长的跟踪，可在ui.perfetto.dev中获得。新的可视化工具利用了现代web平台技术。其基于WebWorkers的多线程设计使UI始终响应;Trace Processor和SQLite的分析能力通过WebAssembly在浏览器中完全可用。

Perfetto UI在被打开一次之后就可以完全离线工作。使用UI打开的跟踪由浏览器本地处理，不需要任何服务器端交互。

## Contributing

## Reference

https://perfetto.dev/docs/