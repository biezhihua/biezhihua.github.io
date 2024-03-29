---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第04篇 - 追踪（tracing）

## 前言

本篇文章翻译自perfetto的[tracing-101](https://perfetto.dev/docs/tracing-101)，目的是为那些不知道"tracing"是什么的人提供一些说明。

在Perfetto的相关文章中涉及到了很多名词，例如：trace、tracing、profiling、profiler等，单词都类似，但是在不同的上下文中却有不同的含义，不太了解的人非常容易迷糊，这里也做一下简要的介绍。

### 名词解释

#### trace

在Perfetto中，trace是指包含与软件系统执行相关的事件和数据的详细记录文件。通过收集和记录有关系统行为的各个方面的数据生成trace file，例如内核事件、应用程序级别事件、CPU使用率、内存分配、网络活动等等。使用各种数据源（例如ftrace、系统调用和自定义插桩）收集数据，然后以压缩的二进制格式存储在trace file中。可以使用Perfetto的可视化工具和API打开和分trace file，以深入了解系统的性能和行为。

一般来说trace中通常包含tracing数据和profling数据，当然也可能仅有其中一个。

#### tracing

tracing（追踪）是一种用于软件开发和系统分析的技术，通过收集程序或系统执行过程中发生的事件数据来监视其执行情况。通常，收集的数据用于诊断和解决性能问题，以及了解系统在不同条件下的行为。tracing涉及在代码或系统中插入标记（markers）或探针（probes）来捕获相关事件和数据，然后聚合和分析所捕获的数据以获得对系统行为的洞察。

#### profiling

profiling（分析）是用于测量和分析软件程序或系统行为的技术。它涉及在程序执行过程中收集各种指标的数据，如 CPU 使用率、内存使用率和 I/O 操作。然后，收集到的数据可以用于识别性能瓶颈和优化区域。通常将分析（profiling）与追踪（tracing）结合使用，以提供系统行为的全面图像。

#### profiler

分析器（profiler），一般指Android Profiler、Perfetto等分析工具。

## [tracing-101](https://perfetto.dev/docs/tracing-101)

本页面提供了分析的鸟瞰图。目的是为那些不知道"tracing"是什么的人提供指引。

## Introduction

### Performance - 性能

分析关注于如何让软件运行更好。"更好"的定义因情况而异。例如：

- 使用更少的资源（CPU、内存、网络、电池等）执行相同的任务。
- 提高可用资源的利用率。
- 识别并完全消除不必要的工作。

改善性能的难点之一在于找出性能问题的根本原因。现代软件系统很复杂，有许多组件和交叉互动的网络。帮助工程师理解系统执行并定位重要问题的技术很关键。

追踪（tracing）和分析（profiling）是性能分析中两种广泛使用的技术。Perfetto是一套开源工具，结合了追踪（tracing）和分析（profiling）技术，为用户提供强大的系统分析功能。

### Tracing - 追踪

追踪（tracing）涉及收集关于系统执行的高度详细数据。单次连续会话的记录被称为追踪文件或简称为追踪（a trace file or trace）。

追踪（tracing）包含足够的详细的信息以完全重建事件的时间线。它们通常包括诸如调度程序上下文切换、线程唤醒、系统调用等低级别的内核事件。有了“正确”的追踪，就不需要再重现性能错误，因为追踪提供了所有必要的上下文。

被认为重要的程序代码也会进行插桩。这种插桩追踪了程序随时间的运行情况（例如，正在运行哪些函数，每次调用花费了多长时间）以及执行的上下文（例如，函数调用的参数是什么，为什么要运行某个函数）。

追踪（tracing）中的详细信息水平使得在除了最简单的情况之外，直接阅读追踪就像读取日志文件一样变得不切实际。相反，用户会使用追踪分析库（trace analysis）和追踪查看器（trace viwers）的组合。追踪分析库为用户提供了以编程方式提取和总结追踪事件（trace events）的方法。追踪查看器（trace viewers）将追踪中的事件可（events in a trace）视化为时间线，使用户能够以图形方式查看系统在一段时间内的操作。

#### Logging vs Tracing - 日志与追踪

很好的直觉是，日志（logging）记录是功能测试所需的，而追踪（tracing）是分析所需的。追踪（tracing）在某种程度上是“结构化”的日志记录：与系统的各个部分发出任意字符串不同，追踪（tracing）以结构化方式反映系统的详细状态，以允许重建事件的时间线。

此外，追踪框架（例如Perfetto）非常注重最小化开销。这是必要的，以使框架不会显着干扰所测量的任何内容：现代框架足够快，可以在纳秒级别测量执行，而不会显着影响程序的执行速度。

小插曲：理论上，追踪框架（tracing frameworks）的功能也足以充当日志记录系统。但是，在实践中，两者的利用方式有所不同，因此它们往往是分开的。

#### Metrics vs Tracing - 指标与追踪

指标（metrics）是追踪系统性能随时间变化的数字值。通常指标映射到高层概念。指标的示例包括：CPU使用率、内存使用率、网络带宽等。指标（metrics）是直接从应用程序或操作系统中收集的。

在了解了追踪（tracing）的强大之后，自然会出现一个问题：为什么要在高级别指标上费力呢？为什么不直接使用追踪，并在结果追踪上计算指标呢？在某些情况下，这确实可能是正确的方法。在使用基于追踪的指标的本地和实验室环境中，从追踪中计算指标而不是直接收集指标是一种强大的方法。如果指标出现问题，可以轻松打开追踪（trace）以找到导致问题的原因。

然而，基于追踪的指标并不是万能的解决方案。在生产环境中运行时，追踪的重量级特性可能使其无法24/7地进行收集。使用追踪计算指标可能需要占用几兆字节的数据，而直接收集指标只需要占用几个字节的数据。

当您想要了解系统性能随时间变化的情况，但不想或无法支付收集追踪数据的成本时，使用指标是正确的选择。在这些情况下，追踪（tracing）应用作为排除问题的工具。当指标显示存在问题时，可以针对性地进行追踪（tracing）以了解问题的原因。

### Profiling - 分析

分析（profiling）涉及对程序资源的使用情况进行采样。一次连续会话的记录会话称为一份分析报告（profile）。

每个采样都会收集函数调用栈（即代码行以及所有调用函数）。通常，这些信息会在整个分析报告（profile）中进行聚合。对于每个看到的调用栈，聚合会给出该调用栈对该资源使用量的百分比。目前最常见的分析类型（types of profiling）是内存分析（memory profiling）和CPU分析（CPU profiling）。

内存分析（memory profiling）用于了解程序在堆上分配内存的哪些部分。分析器（profiler）通常钩入（hooks）本地（C / C ++ / Rust等）程序的 malloc（和free）调用，以采样调用 malloc 的调用栈。还会记录分配了多少字节的信息。 CPU分析（CPU profiling）用于了解程序在哪里花费 CPU 时间。分析器（profiler）会随着时间推移捕获运行在CPU上的调用栈。通常这是定期进行的（例如每50毫秒），但也可以在操作系统发生某些事件时进行。

#### Profiling vs Tracing - 分析与追踪

比较分析（profiling）和追踪（tracing）有两个主要问题：

- 为什么在我可以追踪（tracing）所有内容时却要对我的程序进行分析（profiling）？
- 为什么使用追踪（tracing）来重构事件时间线时，分析（profiling）会给出使用最多资源的精确代码行？

##### When to use profiling over tracing - 何时使用分析而不是追踪

追踪（tracing）无法捕获极高频事件（例如每个函数调用）的执行，因此分析（profiling）工具填补了这一空白。通过抽样，它们可以大幅减少存储的信息量。统计分析工具的统计性质很少是问题；抽样算法专门设计用于捕获高度代表实际资源使用情况的数据。

附注：一些非常专业的追踪工具可以捕获每个函数调用（例如 magic-trace），但它们每秒输出几十亿字节的数据，使它们对除了调查微小代码片段之外的任何事情都不切实际。它们的开销通常也比通用追踪工具高。

##### When to use tracing over profiling - 何时使用追踪而不是分析

虽然分析工具（profiler）可以提供资源使用的调用栈，但它们缺乏有关为什么会发生这种情况的信息。例如，为什么函数 foo() 调用了这么多次 malloc？它们只会说 foo() 在 Y 次 malloc 调用中分配了 X 个字节。追踪（tracing）在提供这种准确上下文方面非常出色：应用程序的插装代码和低级内核事件共同提供了深入的见解：为什么代码首先被运行在这里。

注：Perfetto支持同时收集、分析和可视化分析报告和追踪文件（profiles and traces），这样你就可以两全齐美!

## Perfetto

Perfetto是一个用于软件分析的工具套件，其目的是帮助工程师了解系统使用资源的情况。它有助于识别可以进行的改进以提高性能并验证这些改进的影响。

注意：在Perfetto中，由于可以同时收集profile和trace（分析报告和追踪文件（profiles and traces）），即使它只包含了分析（profiling）数据，我们也会将其称为“trace”。

### Recording traces - 记录trace

Perfetto在记录追踪方面具有高度可配置性。有数百个旋钮可以调整，以控制收集什么数据，如何收集，追踪应包含多少信息等。

如果您不熟悉Perfetto，则在Linux上记录追踪快速入门是一个好的起点。对于Android开发人员，Android快速入门记录追踪将更为适用。追踪配置页面也是一个有用的参考资料。

以下子部分概述了在记录Perfetto追踪时值得考虑的各个要点。

#### Kernel tracing - 内核追踪

Perfetto与Linux内核的ftrace追踪系统紧密集成，以记录内核事件（例如调度、系统调用、唤醒）。调度、系统调用和CPU频率数据源页面给出了配置ftrace收集的示例。

本地支持的ftrace事件可以在这个原型消息的字段中找到。Perfetto还支持将它不理解的ftrace事件（即它没有protobuf消息）收集为“通用”事件。这些事件被编码为键值对，类似于JSON字典。

强烈建议在生产用例中依赖通用事件：低效的编码会导致追踪大小膨胀，并且追踪处理器无法有意义地解析它们。相反，应该为Perfetto添加解析重要ftrace事件的支持：下面是一组简单的步骤。

##### Instrumentation with Perfetto SDK - 使用 Perfetto SDK 进行插桩

Perfetto 提供了一个 C++ SDK，可以用于程序以发出追踪事件。该 SDK 设计为非常低开销，并以合并形式的一个 .cc 文件和一个 .h 文件进行分发，易于集成到任何构建系统中。

一个 C SDK 正在积极开发中，预计到 2023 年第二季度将可供一般使用。有关详细信息，请参见此文档（注意，查看此文档需要成为该组的成员）。

一个 Java/Kotlin SDK 用于 Android（作为 JetPack 库）。该 SDK 正在开发中，但没有确定的发布时间表。

##### android.os.Trace（atrace）与 Perfetto SDK

注意：此部分仅适用于 Android 平台开发人员或具有追踪经验的 Android 应用程序开发人员。其他读者可以安全地跳过此部分。

Perfetto 相对于 atrace 具有显著优势。其中一些最大的优势包括：

- 性能：从系统/应用程序代码追踪到 Perfetto 仅需要一个内存写入，比 atrace 引入的系统调用延迟快得多。这通常使 Perfetto 比 atrace 快 3-4 倍。
- 功能：atrace 的 API 极其有限，缺乏对调试参数、自定义时钟、流事件的支持。Perfetto 具有更丰富的 API，允许自然表示数据流。
- 追踪文件大小：Perfetto 支持各种功能（delta 编码时间戳、字符串内部化、protobuf 编码），这些功能大大减少了追踪文件的大小。
不

幸的是，也存在一些缺点：

- 专用线程：每个想要追踪到 Perfetto 的进程都需要一个专用线程。
- 追踪启动唤醒：目前，当追踪启动时，每个注册追踪的进程都会被唤醒，这显著限制了可以追踪的进程数量。这个限制将在未来几个季度被消除。

目前，Perfetto 团队的建议是在大多数用例中继续使用 atrace：如果您认为自己有一个用例可以从 SDK 中受益，请直接联系团队。到 2023 年中期，应解决当前 SDK 的限制，从而使 SDK 更广泛地得到采用。

## 总结

这篇文章主要是介绍了分析的两种技术：追踪（tracing）和分析（profiling）以及一个分析工具集Perfetto。

文章首先介绍了分析的定义，即使软件更高效。

然后，文章介绍了追踪和分析这两种技术。追踪（tracing）是收集系统执行详细数据的技术，记录下每个事件发生的时间和具体的执行情况。而分析（profiling）则是抽样某种资源的使用情况，包括内存和CPU等。

文章还介绍了日志记录（logging）与追踪（tracing）之间的区别。日志记录（logging）是为了功能测试，而追踪（tracing）是为了分析。同时，文章也介绍了指标（metrics）与追踪（tracing）之间的区别。指标是用于追踪系统性能变化的数字值，如CPU使用率、内存使用率等。

接下来，文章介绍了分析（profiling）和追踪（tracing）之间的区别分析（profiling）能够提供系统中资源使用的函数调用堆栈，而追踪（tracing）则能够提供函数调用堆栈以及执行时的上下文信息。

最后，文章介绍了Perfetto这个分析工具，以及如何使用它来记录追踪（tracing）和分析（profiling）数据。

总的来说，这篇文章向读者介绍了分析的两种技术，以及如何使用Perfetto工具集来记录和分析追踪（trace）数据。

## 引用

- <https://zhuanlan.zhihu.com/p/593844343>

> "Tracing"（追踪）在计算机科学和软件工程中是一种监控和诊断技术。它涉及收集程序执行过程中的事件和数据，以便于分析程序的行为和性能。通过追踪技术，开发者可以深入了解程序的运行状态，从而找出性能瓶颈、资源泄漏或其他潜在问题。
在Perfetto中，"tracing"指的是收集系统和应用程序在运行过程中产生的事件、资源使用情况以及其他相关信息。Perfetto是一个高性能的追踪工具，用于监控和分析Android、Linux以及其他类似操作系统的性能。它允许开发者以低开销的方式收集详细的性能数据，从而更好地优化系统性能和提高用户体验。
总之，"tracing"是一种监控和诊断技术，用于收集程序运行过程中的事件和数据。在Perfetto的背景下，它涉及到对Android和其他操作系统的性能进行分析和优化。

## 版权声明

本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
