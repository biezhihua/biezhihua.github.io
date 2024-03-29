---
article: false
---

# Perfetto - 02 - Tracing 101

本页面提供了分析的鸟瞰图。目的是为那些不知道"tracing"是什么的人提供指引。

## Introduction to...

### Performance 性能

分析关注于如何让软件运行更好。"更好"的定义因情况而异。例如：

- 使用更少的资源（CPU、内存、网络、电池等）执行相同的任务。
- 提高可用资源的利用率。
- 识别并完全消除不必要的工作。

改善性能的难点之一在于找出性能问题的根本原因。现代软件系统很复杂，有许多组件和交叉互动的网络。帮助工程师理解系统执行并定位重要问题的技术很关键。

跟踪和分析是性能分析中两种广泛使用的技术。Perfetto是一套开源工具，结合了跟踪和剖析技术，为用户提供强大的系统分析功能。


### Tracing 跟踪

跟踪涉及收集关于系统执行的高度详细数据。单次连续记录称为跟踪文件或简称为跟踪（ a trace file or trace）。

跟踪包含足够的详细信息以完全重建事件时间线。它们通常包括诸如调度程序上下文切换、线程唤醒、系统调用等低级内核事件。有了“正确”的跟踪，就不需要再重现性能错误，因为跟踪提供了所有必要的上下文。

在被认为重要的程序区域，应用程序代码也会进行插桩。这种插桩跟踪了程序随时间的运行情况（例如，正在运行哪些函数，每次调用花费了多长时间）以及执行的上下文（例如，函数调用的参数是什么，为什么要运行某个函数）。

跟踪中的详细信息水平使得在除了最简单的情况之外，直接阅读跟踪就像读取日志文件一样变得不切实际。相反，用户会使用跟踪分析库和跟踪查看器的组合。跟踪分析库为用户提供了以编程方式提取和总结跟踪事件的方法。跟踪查看器将跟踪中的事件可视化为时间线，使用户能够以图形方式查看系统在一段时间内的操作。

#### Logging vs Tracing 日志与跟踪

很好的直觉是，日志记录是功能测试所需的，而跟踪是分析所需的。 跟踪在某种程度上是“结构化”的日志记录：与系统的各个部分发出任意字符串不同，跟踪以结构化方式反映系统的详细状态，以允许重建事件的时间线。

此外，跟踪框架（例如Perfetto）非常注重最小化开销。 这是必要的，以使框架不会显着干扰所测量的任何内容：现代框架足够快，可以在纳秒级别测量执行，而不会显着影响程序的执行速度。

小插曲：理论上，跟踪框架的功能也足以充当日志记录系统。 但是，在实践中，两者的利用方式有所不同，因此它们往往是分开的。

#### Metrics vs Tracing 指标与跟踪

指标是跟踪系统性能随时间变化的数字值。通常指标映射到高层概念。指标的示例包括：CPU使用率、内存使用率、网络带宽等。指标是直接从应用程序或操作系统中收集的。

在了解了跟踪的强大之后，自然会出现一个问题：为什么要在高级别指标上费力呢？为什么不直接使用跟踪，并在结果跟踪上计算指标呢？在某些情况下，这确实可能是正确的方法。在使用基于跟踪的指标的本地和实验室环境中，从跟踪中计算指标而不是直接收集指标是一种强大的方法。如果指标出现回归，可以轻松打开跟踪以找到导致回归的原因。

然而，基于跟踪的指标并不是万能的解决方案。在生产环境中运行时，跟踪的重量级特性可能使其无法24/7地进行收集。使用跟踪计算指标可能需要占用几兆字节的数据，而直接收集指标只需要占用几个字节的数据。

当您想要了解系统性能随时间变化的情况，但不想或无法支付收集跟踪数据的成本时，使用指标是正确的选择。在这些情况下，跟踪应用作为排除问题的工具。当指标显示存在问题时，可以针对性地进行跟踪以了解回归的原因。

### Profiling 分析

分析（profiling）涉及对程序资源的一些使用进行采样。一次连续的记录会话称为一份分析报告（profile）。

每个采样都会收集函数调用栈（即代码行以及所有调用函数）。通常，这些信息会在整个分析报告中进行聚合。对于每个看到的调用栈，聚合会给出该调用栈对该资源使用量的百分比。目前最常见的分析类型是内存分析和CPU分析（ By far the most common types of profiling are memory profiling and CPU profiling.）。

内存分析用于了解程序在堆上分配内存的哪些部分。分析器通常钩入本地（C / C ++ / Rust等）程序的malloc（和free）调用，以采样调用malloc的调用栈。还会记录分配了多少字节的信息。 CPU分析用于了解程序在哪里花费CPU时间。分析器会随着时间推移捕获运行在CPU上的调用栈。通常这是定期进行的（例如每50毫秒），但也可以在操作系统发生某些事件时进行。

#### Profiling vs Tracing 分析与跟踪

比较分析和追踪有两个主要问题：

为什么在我可以追踪所有内容时，要对我的程序进行分析？
为什么使用追踪来重构事件时间线时，分析会给出使用最多资源的精确代码行？

##### When to use profiling over tracing 何时使用分析而不是追踪

追踪无法捕获极高频事件（例如每个函数调用）的执行，因此分析工具填补了这一空白。通过抽样，它们可以大幅减少存储的信息量。统计分析工具的统计性质很少是问题；抽样算法专门设计用于捕获高度代表实际资源使用情况的数据。

附注：一些非常专业的追踪工具可以捕获每个函数调用（例如 magic-trace），但它们每秒输出几十亿字节的数据，使它们对除了调查微小代码片段之外的任何事情都不切实际。它们的开销通常也比通用追踪工具高。

##### When to use tracing over profiling 何时使用追踪而不是分析

虽然分析工具可以提供资源使用的调用栈，但它们缺乏有关为什么会发生这种情况的信息。例如，为什么函数 foo() 调用了这么多次 malloc？它们只会说 foo() 在 Y 次 malloc 调用中分配了 X 个字节。追踪在提供这种准确上下文方面非常出色：应用程序的插装代码和低级内核事件共同提供了深入的见解：为什么代码首先被运行在这里。

注：Perfetto支持同时收集、分析和可视化分析报告和跟踪文件（profiles and traces），这样你就可以两全齐美!

## Perfetto

Perfetto是一个用于软件分析的工具套件，其目的是帮助工程师了解系统使用资源的情况。它有助于识别可以进行的改进以提高性能并验证这些改进的影响。

注意：在Perfetto中，由于可以同时收集profile和trace（分析报告和跟踪文件（profiles and traces）），即使它只包含了 分析（profiling）数据，我们也会将其称为“trace”。

### Recording traces

Perfetto在记录跟踪方面具有高度可配置性。有数百个旋钮可以调整，以控制收集什么数据，如何收集，跟踪应包含多少信息等。

如果您不熟悉Perfetto，则在Linux上记录跟踪快速入门是一个好的起点。对于Android开发人员，Android快速入门记录跟踪将更为适用。跟踪配置页面也是一个有用的参考资料。

以下子部分概述了在记录Perfetto跟踪时值得考虑的各个要点。

#### Kernel tracing 内核跟踪

Perfetto与Linux内核的ftrace跟踪系统紧密集成，以记录内核事件（例如调度、系统调用、唤醒）。调度、系统调用和CPU频率数据源页面给出了配置ftrace收集的示例。

本地支持的ftrace事件可以在这个原型消息的字段中找到。Perfetto还支持将它不理解的ftrace事件（即它没有protobuf消息）收集为“通用”事件。这些事件被编码为键值对，类似于JSON字典。

强烈建议在生产用例中依赖通用事件：低效的编码会导致跟踪大小膨胀，并且跟踪处理器无法有意义地解析它们。相反，应该为Perfetto添加解析重要ftrace事件的支持：下面是一组简单的步骤。

##### Instrumentation with Perfetto SDK 使用 Perfetto SDK 进行插桩

Perfetto 提供了一个 C++ SDK，可以用于仪器化程序以发出跟踪事件。该 SDK 设计为非常低开销，并以合并形式的一个 .cc 文件和一个 .h 文件进行分发，易于集成到任何构建系统中。

一个 C SDK 正在积极开发中，预计到 2023 年第二季度将可供一般使用。有关详细信息，请参见此文档（注意，查看此文档需要成为该组的成员）。

一个 Java/Kotlin SDK 用于 Android（作为 JetPack 库）。该 SDK 正在开发中，但没有确定的发布时间表。

##### android.os.Trace（atrace）与 Perfetto SDK

注意：此部分仅适用于 Android 平台开发人员或具有跟踪经验的 Android 应用程序开发人员。其他读者可以安全地跳过此部分。

Perfetto 相对于 atrace 具有显著优势。其中一些最大的优势包括：

- 性能：从系统/应用程序代码跟踪到 Perfetto 仅需要一个内存写入，比 atrace 引入的系统调用延迟快得多。这通常使 Perfetto 比 atrace 快 3-4 倍。
- 功能：atrace 的 API 极其有限，缺乏对调试参数、自定义时钟、流事件的支持。Perfetto 具有更丰富的 API，允许自然表示数据流。
- 跟踪文件大小：Perfetto 支持各种功能（delta 编码时间戳、字符串内部化、protobuf 编码），这些功能大大减少了跟踪文件的大小。
不

幸的是，也存在一些缺点：
- 专用线程：每个想要跟踪到 Perfetto 的进程都需要一个专用线程。
- 跟踪启动唤醒：目前，当跟踪启动时，每个注册跟踪的进程都会被唤醒，这显著限制了可以跟踪的进程数量。这个限制将在未来几个季度被消除。

目前，Perfetto 团队的建议是在大多数用例中继续使用 atrace：如果您认为自己有一个用例可以从 SDK 中受益，请直接联系团队。到 2023 年中期，应解决当前 SDK 的限制，从而使 SDK 更广泛地得到采用。


## other

这篇文章是介绍分析中的追踪和分析技术的概述。追踪和分析是用于分析的两种常用技术，Perfetto是一个开源的工具套件，结合了追踪和分析，为用户提供强大的系统分析功能。文章介绍了追踪和分析的基本概念、追踪和日志记录的区别、指标和追踪之间的关系、分析中追踪和分析的使用场景以及Perfetto的相关特点和使用方法。

文章提到，追踪是一种收集系统执行细节数据的技术，包括内核事件和应用程序代码中重要区域的仪器化，追踪生成的数据可用于重现性能错误和深入理解系统的执行情况。但由于追踪数据量庞大，因此通常需要使用追踪分析库和追踪查看器来处理和可视化追踪数据。

文章还介绍了追踪和日志记录之间的区别，追踪是“结构化”日志记录，提供系统详细状态的结构化表示，而日志记录则是针对功能测试的。

文章提到了指标和追踪之间的关系，指标是跟踪系统性能的数字值，通常映射到高级概念。在一些场景下，指标的计算可能是从追踪数据中提取而来，这种方式更加适合本地和实验室环境。而在生产环境下，追踪的数据量较大，可能会对系统产生较大的性能影响，此时指标是更好的选择。

文章还介绍了分析中的另一种常用技术-分析。分析是通过对程序资源的采样来分析程序的使用情况，主要有内存分析和CPU分析两种类型。文章比较了分析和追踪的异同，追踪可以提供更详细的上下文信息，而分析可以捕获到执行频率高的事件。

最后，文章介绍了Perfetto的特点和使用方法，Perfetto是一个用于软件分析的工具套件，支持同时收集和分析追踪和分析数据。Perfetto具有高度的可配置性，可以对采集数据的方式进行调整和优化，同时也支持与Linux内核的ftrace追踪系统集成，以记录内核事件。此外，Perfetto还提供了C++和Java/Kotlin SDK来支持程序的仪器化和跟踪。

## other1

这篇文章主要是为那些不知道什么是跟踪（tracing）的人提供一个概述，帮助他们理解分析的基础知识。文章讨论了分析的目标和难点，并介绍了两种常用的分析技术——跟踪和剖析。文章还介绍了Perfetto这个开源分析工具套件，它将跟踪和剖析结合起来，提供了强大的分析功能。

文章首先介绍了分析的定义和目标，包括使用更少的资源执行相同的工作、提高可用资源的利用率、识别和消除不必要的工作等。难点在于找到性能问题的根本原因，而现代软件系统通常非常复杂，涉及许多组件和交叉相互作用。因此，分析需要一些技术来帮助工程师理解系统的执行情况并准确定位关键问题。

文章接着介绍了跟踪和剖析这两种广泛使用的分析技术。跟踪涉及收集有关系统执行的高度详细的数据，包括内核事件和应用程序代码的仪表化。跟踪可以提供有关系统执行的深入洞察力，但需要使用跟踪分析库和跟踪查看器来处理跟踪数据。

剖析涉及对程序使用某些资源进行采样，以收集有关程序资源使用情况的信息。剖析通常用于CPU和内存分析，可以提供有关程序资源使用情况的信息，但缺乏跟踪提供的关于为什么会出现性能问题的深入洞察力。

文章还介绍了Perfetto工具套件，并讨论了如何使用它来记录跟踪和剖析数据。Perfetto可以高度配置以记录跟踪数据，例如与Linux内核的ftrace跟踪系统集成、使用Perfetto SDK在应用程序中进行仪表化等。Perfetto支持同时记录跟踪和剖析数据，因此可以在需要时使用两种技术。

总的来说，这篇文章提供了一个简要的分析概述，介绍了跟踪和剖析这两种技术以及Perfetto工具套件。对于那些想要深入了解分析的人来说，这是一个很好的入门资源。

## other2

这篇文章是一篇介绍性的文章，旨在向不了解“跟踪”是什么的人介绍分析的概念。文章重点介绍了跟踪和分析的概念、跟踪和分析的区别、跟踪和分析的应用以及跟踪和分析的工具。文章提到，跟踪和分析是解决性能问题的常用技术之一，可以帮助工程师了解系统的执行情况并定位性能问题的根源。跟踪技术是收集关于系统执行的高度详细数据的过程，以便全面重构事件的时间线，并且包含关于应用程序代码执行的上下文信息。文章还介绍了分析的两个主要技术：跟踪和分析，以及分析的工具——Perfetto，Perfetto是一个开源的分析套件，结合了跟踪和分析技术，为用户提供了强大的系统洞察力。


## other3

这篇文章主要介绍了分析中的追踪（tracing）和分析（profiling）技术以及它们的差异和应用场景。文章首先介绍了分析的目标和困难，然后分别解释了追踪和分析的概念和原理。在追踪方面，文章介绍了追踪数据的详细程度，以及如何使用追踪分析库和追踪查看器来分析追踪数据。文章还比较了追踪和日志记录（logging）之间的差异。在分析方面，文章介绍了分析的两种主要类型：内存分析和CPU分析。文章还比较了追踪和分析的优缺点，并介绍了如何使用Perfetto套件进行分析，包括如何配置追踪和使用Perfetto SDK来进行应用程序的仪表化。最后，文章还讨论了Perfetto在Android平台上的应用。

## other4

这篇文章介绍了分析的概念和一些工具，重点介绍了tracing和profiling两种分析技术，以及如何使用Perfetto进行分析。

文章首先介绍了分析的概念，即提高软件性能的方法，通常包括使用更少的资源、提高可用资源的利用率以及消除不必要的工作等。

文章接着介绍了tracing和profiling两种分析技术。tracing技术是指收集有关系统执行的高度详细的数据，通常包括内核事件和应用程序代码的仪器化部分。这些数据可以通过trace分析库和trace查看器进行可视化分析。相比之下，profiling技术则是通过对程序使用某些资源的采样来分析性能。

文章还介绍了如何使用Perfetto进行分析，包括如何记录跟踪、内核跟踪、使用Perfetto SDK进行仪器化以及使用Android的os.Trace和Perfetto SDK等相关内容。

最后，文章总结了tracing和profiling两种分析技术的优缺点，以及如何选择合适的分析技术。同时，Perfetto是一个支持同时记录跟踪和profiling的分析工具，具有高度可配置性和可扩展性。

## other5

本文介绍了分析中的追踪(tracing)和性能剖析(profiling)两种技术。追踪是收集系统执行过程中的详细数据，可以提供完整的事件时间线。追踪中包括内核事件和应用程序代码，可以通过追踪分析库和追踪查看器来分析和可视化数据。性能剖析是对程序的资源使用进行采样，并提供函数调用堆栈等信息以分析系统性能问题。本文还提到了Perfetto作为一个开源的追踪和性能剖析工具，可以同时收集、分析和可视化追踪和剖析数据。文章还介绍了Perfetto的配置和与Linux内核的集成，以及Perfetto SDK用于应用程序的仪器化和性能剖析。此外，还介绍了与Perfetto SDK相关的工具和技术，例如ATrace和Android的os.Trace。


## other6 

这篇文章主要是介绍了分析的两种技术：跟踪（tracing）和分析（profiling）以及一个分析工具集Perfetto。

文章首先介绍了分析的定义，即使软件更高效。然后，文章介绍了跟踪和分析这两种技术。跟踪是收集系统执行详细数据的技术，记录下每个事件发生的时间和具体的执行情况。而分析则是抽样某种资源的使用情况，包括内存和CPU等。

文章还介绍了日志记录与跟踪之间的区别。日志记录是为了功能测试，而跟踪是为了分析。同时，文章也介绍了指标（metrics）与跟踪之间的区别。指标是用于跟踪系统性能变化的数字值，如CPU使用率、内存使用率等。

接下来，文章介绍了分析和跟踪之间的区别分析能够提供系统中资源使用的函数调用堆栈，而跟踪则能够提供函数调用堆栈以及执行时的上下文信息。最后，文章介绍了Perfetto这个分析工具，以及如何使用它来记录跟踪和分析数据。

总的来说，这篇文章向读者介绍了分析的两种技术，以及如何使用Perfetto工具集来记录和分析跟踪数据。

## other7

what is the meaning of profiling

Profiling is a technique used in computer science to measure and analyze the behavior of a software program or system. It involves collecting data on various metrics, such as CPU usage, memory usage, and I/O operations, during the execution of a program. The collected data can then be used to identify performance bottlenecks and areas for optimization. Profiling is often used in conjunction with other techniques, such as tracing, to provide a comprehensive picture of the system's behavior.

profiling是计算机科学中用于测量和分析软件程序或系统行为的技术。它涉及在程序执行过程中收集各种指标的数据，如 CPU 使用率、内存使用率和 I/O 操作。然后，收集到的数据可以用于识别性能瓶颈和优化区域。通常将分析与其他技术（例如跟踪）结合使用，以提供系统行为的全面图像

what is the meaning of tracing

Tracing is a technique used in software development and system analysis to monitor the execution of a program or system by collecting data on events that occur during its execution. The collected data is typically used to diagnose and resolve performance issues, as well as to understand the behavior of the system under different conditions. Tracing involves instrumenting the code or system with markers or probes that capture the relevant events and data, and then aggregating and analyzing the captured data to gain insights into system behavior.

tracing是一种用于软件开发和系统分析的技术，通过收集程序或系统执行过程中发生的事件数据来监视其执行情况。通常，收集的数据用于诊断和解决性能问题，以及了解系统在不同条件下的行为。Tracing涉及在代码或系统中插入标记（markers）或探针（probes）来捕获相关事件和数据，然后聚合和分析所捕获的数据以获得对系统行为的洞察。

what is the meaning of trace in perfetto

In Perfetto, a trace refers to a file that contains a detailed record of events and data related to the execution of a software system. A trace file is generated by collecting and recording data about various aspects of the system's behavior, such as kernel events, application-level events, CPU usage, memory allocation, network activity, and more. The data is collected using various data sources, such as ftrace, syscalls, and custom instrumentation, and then stored in a trace file in a compressed binary format. The trace file can be opened and analyzed using Perfetto's visualization tools and APIs to gain deep insights into the system's performance and behavior. The trace file serves as a detailed record of the system's execution, enabling engineers to debug and optimize their software systems.

在Perfetto中，跟踪（trace）是指包含与软件系统执行相关的事件和数据的详细记录文件。通过收集和记录有关系统行为的各个方面的数据生成跟踪文件，例如内核事件、应用程序级别事件、CPU使用率、内存分配、网络活动等等。使用各种数据源（例如ftrace、系统调用和自定义插桩）收集数据，然后以压缩的二进制格式存储在跟踪文件中。可以使用Perfetto的可视化工具和API打开和分析跟踪文件，以深入了解系统的性能和行为。跟踪文件作为系统执行的详细记录，使工程师能够调试和优化其软件系统。

## Reference

- https://perfetto.dev/docs/contributing/common-tasks#add-a-new-ftrace-event