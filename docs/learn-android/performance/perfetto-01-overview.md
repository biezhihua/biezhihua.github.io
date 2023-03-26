---
article: false
---
# Perfetto - 01 - System profiling, app tracing and trace analysis

Perfetto是一个可用于性能检测和跟踪分析的生产级别开源栈。它提供了记录系统级别和应用程序级别跟踪的服务和库，原生+Java堆剖析，使用SQL分析跟踪的库以及用于可视化和探索多GB跟踪的基于Web的用户界面。简而言之，Perfetto是一种强大的性能分析工具，可以用于分析应用程序和系统级别的性能问题。

## Recording traces 记录跟踪数据

在其核心，Perfetto引入了一种基于直接protobuf序列化到共享内存缓冲区的新颖用户空间到用户空间跟踪协议。该跟踪协议既用于内置数据源内部，也通过跟踪SDK和Track Event Library向C++应用程序公开。

这种新的跟踪协议通过可扩展的基于protobuf的能力广告和数据源配置机制（参见跟踪配置文档）允许动态配置跟踪的所有方面。不同的数据源可以复用不同用户定义的缓冲区的子集，也允许将任意长的跟踪流式传输到文件系统中
。
### System-wide tracing on Android and Linux 在Android和Linux上进行全系统跟踪

在Linux和Android上，Perfetto捆绑了许多数据源，能够从不同的系统接口收集详细的性能数据。有关完整的集合和详细信息，请参阅文档的数据源部分。一些例子：

- Kernel tracing 内核跟踪：Perfetto与Linux的ftrace集成，允许将内核事件（例如调度事件，系统调用）记录到跟踪中。

- /proc和/sys轮询器，允许对进程范围或系统范围的CPU和内存计数器进行采样。

与Android HAL模块集成，用于记录电池和能耗计数器。

本地堆分析：一种低开销的堆分析器，用于挂钩malloc/free/new/delete并将内存关联到调用堆栈，基于外部进程展开，可配置采样，可附加到已经运行的进程。

使用与Android RunTime紧密集成的外部分析器捕获Java堆转储，可获取托管堆保留图的完整快照（类型、字段名称、保留大小和对其他对象的引用），但不会转储全部堆内容（字符串和位图），从而缩短序列化时间和输出文件大小。

在Android上，Perfetto是下一代系统跟踪系统，并取代基于Chromium的Systrace。ATrace基于的工具集仍然得到全面支持。有关更多详细信息，请参阅Android开发人员文档。

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