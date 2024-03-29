---
article: false
---
# Perfetto - 01 - System profiling, app tracing and trace analysis | Perfetto - 系统分析、应用程序跟踪和跟踪分析

Perfetto是一个开源的生产级系统性能检测和跟踪分析框架。它提供了服务和库来记录系统级和应用级的跟踪、原生+Java堆分析，以及使用SQL进行跟踪分析的库和基于Web的UI可视化和探索多GB跟踪数据。

## Recording traces 

Perfetto引入了一种新的用户空间到用户空间跟踪协议，基于直接的protobuf序列化到共享内存缓冲区。跟踪协议在内部用于内置数据源，通过跟踪SDK和跟踪事件库提供给C++应用程序使用。该跟踪协议允许通过可扩展的基于protobuf的能力广告和数据源配置机制动态配置跟踪的所有方面。不同的数据源可以多路复用到用户定义的不同子集的缓冲区中，还可以将任意长的跟踪流式传输到文件系统中。
。
### System-wide tracing on Android and Linux 在Android和Linux上进行全系统跟踪

在Linux和Android上，Perfetto捆绑了许多数据源，能够从不同的系统接口收集详细的性能数据。有关完整的集合和详细信息，请参阅文档的数据源部分。一些例子：

- Kernel tracing 内核跟踪：Perfetto与Linux的ftrace集成，允许将内核事件（例如调度事件，系统调用）记录到跟踪中。
- /proc和/sys 轮询器，允许对进程范围或系统范围的CPU和内存计数器进行采样。
- 与Android HAL模块集成，用于记录电池和能耗计数器。
- 本地堆分析：一种低开销的堆分析器，用于挂钩malloc/free/new/delete并将内存关联到调用堆栈，基于外部进程展开，可配置采样，可附加到已经运行的进程。
- 使用与Android RunTime紧密集成的外部分析器捕获Java堆转储，可获取托管堆保留图的完整快照（类型、字段名称、保留大小和对其他对象的引用），但不会转储全部堆内容（字符串和位图），从而缩短序列化时间和输出文件大小。

在Android上，Perfetto是下一代跟踪系统，并取代基于Chromium的Systrace。ATrace基于的工具集仍然得到全面支持。有关更多详细信息，请参阅Android开发人员文档。

### Tracing SDK and user-space instrumentation

Perfetto Tracing SDK使C++开发人员能够使用应用程序特定的跟踪点来丰富跟踪。您可以选择定义自己的强类型事件并创建自定义数据源的灵活性，或者使用更易于使用的Track Event库，使用TRACE_EVENT（“category”，“event_name”，“x”，“str”，“y”，42）形式的注释轻松创建时间范围切片、计数器和时间标记。

该SDK专为多进程系统和多线程进程的跟踪而设计。它基于ProtoZero，一个用于在线程本地共享内存缓冲区上直接编写protobuf事件的库。

相同的代码既可以在完全进程模式下工作，也可以在系统模式下工作，通过UNIX套接字连接到Linux / Android跟踪守护程序，允许将应用程序特定的仪器点与系统范围的跟踪事件相结合。

该SDK基于经过测试的便携式C++17代码，并使用主要的C++卫生器（ASan，TSan，MSan，LSan）进行测试。它不依赖于运行时代码修改或编译器插件。

### Tracing in Chromium

## Trace analysis

除了跟踪记录功能，Perfetto代码库还包括一个专门用于导入、解析和查询新的和旧的跟踪格式的项目——跟踪处理器 Trace Processor.。

Trace Processor是一个可移植的c++ 17库，它提供了面向列的表存储，专为有效地将数小时的跟踪数据保存在内存中而设计，并公开了一个基于流行的SQLite查询引擎的SQL查询接口。跟踪数据模型变成一组SQL表，可以以非常强大和灵活的方式查询和连接这些SQL表，以分析跟踪数据。

在此基础上，Trace Processor还包括一个基于跟踪的度量子系统，该子系统由预烘焙的和可扩展的查询组成，可以以JSON或protobuf消息的形式输出关于跟踪的强类型摘要(例如，不同频率状态下的CPU使用情况，按进程和线程细分)。

基于跟踪的度量允许在性能测试场景、批分析或大型跟踪语料库中轻松集成跟踪。

Trace Processor还为低延迟查询和构建跟踪可视化器而设计。如今，Trace Processor被Perfetto UI用作Web Assembly模块，Android Studio和Android GPU Inspector用作原生c++库。

## Trace visualization

Perfetto还提供了一个全新的跟踪可视化工具，用于打开和查询数小时长的跟踪，可在ui.perfetto.dev中获得。新的可视化工具利用了现代web平台技术。其基于WebWorkers的多线程设计使UI始终响应;Trace Processor和SQLite的分析能力通过WebAssembly在浏览器中完全可用。

Perfetto UI在被打开一次之后就可以完全离线工作。使用UI打开的跟踪由浏览器本地处理，不需要任何服务器端交互。

## Contributing


## Other

Perfetto是一款高性能、开源的系统分析（system profiling）、应用追踪（app tracing）和追踪分析（trace analysis）工具。它提供了用于记录系统级和应用级跟踪的服务和库、Native和Java堆分析、以及基于Web的用户界面可视化和探索大规模跟踪记录。Perfetto的设计目标是在减少性能开销的同时提供高度的可扩展性和可配置性，以帮助开发人员快速诊断和调试复杂的软件系统。

Perfetto是一个开源的生产级系统性能检测和跟踪分析框架。它提供了服务和库来记录系统级和应用级的跟踪、原生+Java堆分析，以及使用SQL进行跟踪分析的库和基于Web的UI可视化和探索多GB跟踪数据。

Perfetto是一个开源的系统性能分析和跟踪工具，旨在帮助开发人员收集和分析系统层面和应用程序层面的跟踪数据，以优化和调试软件系统。Perfetto提供了记录系统和应用程序跟踪、本地和Java堆栈跟踪、基于SQL的跟踪分析库和基于Web的跟踪可视化工具等服务和库

Perfetto是一个高性能系统性能分析工具，旨在提供系统层面和应用程序层面的跟踪记录、本地和Java堆分析、使用SQL分析跟踪记录的库，以及基于Web的用户界面可视化和探索大规模跟踪记录。Perfetto支持Android和Linux操作系统，并提供多种数据源，如内核跟踪、进程/系统范围的CPU和内存计数器采样、Android HAL模块集成等。此外，Perfetto提供了跟踪SDK和用户空间工具库，使C ++开发人员能够使用跟踪点增强跟踪，同时支持多进程和多线程跟踪，并使用基于ProtoZero的库直接编写protobuf事件。Perfetto还包含一个专门用于导入、解析和查询跟踪格式的项目Trace Processor，该项目提供一种基于SQL的查询接口，可用于分析跟踪数据，并支持跟踪度量系统，以便在性能测试方案中轻松集成跟踪记录。最后，Perfetto提供了一个全新的跟踪可视化器，可用于打开和查询长时间跟踪记录。

## Other1

Perfetto是一个面向生产环境的开源性能分析工具。它提供了一套记录系统层和应用层追踪的服务和库，支持本地和Java堆内存分析，支持使用SQL分析追踪数据，并提供了一个基于Web的UI界面来可视化和探索大量追踪数据。

Perfetto的记录追踪功能基于一种新颖的内核空间到用户空间追踪协议，该协议基于直接的protobuf序列化，并将数据存储在共享内存缓冲区中。该追踪协议可以通过可扩展的protobuf广告和数据源配置机制来动态配置追踪的各个方面。不同的数据源可以多路复用到用户定义的不同缓冲区的子集中，允许任意长的追踪数据流入文件系统。

在Linux和Android上，Perfetto提供了许多数据源，可以从不同的系统接口收集详细的性能数据，例如内核事件追踪（如调度事件、系统调用）、/proc和/sys轮询器（可采样处理器和内存计数器的系统状态）以及与Android HAL模块的集成。此外，它还支持本地堆分析，Java堆转储和跨进程和跨线程的Tracing SDK和用户空间插装。

Perfetto还包括一个用于导入、解析和查询新的和旧的追踪格式的Trace Processor项目。Trace Processor是一个可移植的C++17库，提供基于列的表存储，并且设计成可以高效地将数小时的追踪数据存入内存，并公开了一个基于流行的SQLite查询引擎的SQL查询接口。Trace Processor还包括一个基于追踪的指标子系统，包括预先制作的和可扩展的查询，可以以JSON或protobuf消息的形式输出追踪的强类型摘要。

Perfetto还提供了一个全新的追踪可视化工具，可用于打开和查询长达数小时的追踪。该工具利用现代Web平台技术，具有基于WebWorkers的多线程设计，可使UI始终响应。Trace Processor和SQLite的分析能力完全可在浏览器中使用WebAssembly。Perfetto UI是一款完全离线的工具，打开时会本地处理追踪数据，并不需要任何服务器端交互。

总之，Perfetto是一个非常强大的性能分析工具，可以帮助开发人员深入了解系统的行为和性能，以便优化和调试软件系统。

## other

Java堆转储是一种诊断工具，用于分析Java虚拟机（JVM）中的内存泄漏和性能问题。它可以捕获当前JVM堆的所有对象，然后将它们的状态记录在一个文件中，包括对象的类型，引用关系，大小和内存地址等信息。堆转储文件可以通过多种工具进行分析，例如MAT（内存分析工具）或jhat（Java堆分析工具），可以帮助开发人员定位和解决内存泄漏和性能问题。

## Reference

https://perfetto.dev/docs/