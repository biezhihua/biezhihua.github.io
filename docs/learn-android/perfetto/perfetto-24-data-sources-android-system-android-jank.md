---
article: false
---

# Perfetto - 24 - Android Jank detection with FrameTimeline

一帧画面如果呈现在屏幕上的时间与调度器给出的预测呈现时间不匹配，那么这个帧被称为janky。

janky 可能导致的问题有：
- 不稳定的帧率
- 延迟增加

FrameTimeline是SurfaceFlinger中检测jank的模块，并报告jank的源头。SurfaceViews目前不受支持，但将在未来支持。

## UI

对于每个至少有一个帧呈现在屏幕上的应用程序，都会添加两个新的跟踪。

- 期望时间轴：每个片段表示给应用程序渲染帧的时间。为避免系统中出现jank，应用程序应在这个时间范围内完成。
- 实际时间轴：这些片段表示应用程序完成帧的实际时间（包括GPU工作）并将其发送到SurfaceFlinger进行组合。注意：FrameTimeline目前尚不知道应用程序的实际帧开始时间，所以使用了预期的开始时间。这里的片段结束时间表示max（GPU时间，post时间）。post时间是应用程序的帧发布到SurfaceFlinger的时间。

同样，SurfaceFlinger也会获得这两个新的跟踪，表示其应该在内部完成的期望时间，以及完成合成帧并呈现在屏幕上所需的实际时间。在这里，SurfaceFlinger的工作表示在显示堆栈下面的所有内容。这包括Composer和DisplayHAL。因此，这些片段表示SurfaceFlinger主线程的开始到屏幕更新。

这些片段的名称表示从choreographer接收到的标记。您可以将实际时间轴跟踪中的片段与期望时间轴跟踪中的相应片段进行比较，以查看应用程序的表现如何与期望相比。此外，为了调试目的，标记添加到应用程序的doFrame和RenderThread片段中。对于SurfaceFlinger，相同的标记显示在onMessageReceived中。

> 在Android操作系统中，Display HAL（Hardware Abstraction Layer）是用于抽象底层硬件接口的一个组件。它提供了一个标准化的接口，让Android的图形系统能够在不同的硬件设备上运行，并且让硬件厂商可以轻松地支持Android的图形系统。Display HAL的主要作用是提供显示屏幕的基本功能，例如在屏幕上显示图像、调整屏幕亮度、旋转屏幕等等。在Android的架构中，Display HAL是图形系统和硬件之间的接口，它与硬件抽象层（HAL）和Android图形系统（例如SurfaceFlinger）进行交互，并且为Android应用程序提供了标准的显示功能。通过使用Display HAL，Android能够支持各种不同的屏幕和硬件设备，并且提供一致的用户体验。

### Selecting an actual timeline slice

选择详细信息提供有关帧发生了什么的更多信息。这些包括：

- Present Type
    - 帧是早期、准时还是迟到呈现的。
- On time finish 准时完成
    - 应用程序是否按时完成了帧的工作？
- Jank Type
    - 这个帧有没有观察到jank？如果是，这显示观察到了什么类型的jank。如果没有，则类型将为None。
- Prediction type
    - 预测是否在FrameTimeline收到此帧时过期？如果是，它将说已过期的预测。如果没有，那就是有效预测。
- GPU Composition
    - 告诉帧是否由GPU合成。
- Layer Name
    - 呈现该帧的层/表面的名称。一些进程会将帧更新到多个表面。在这里，具有相同令牌的多个切片将显示在实际时间轴中。层名称可以是区分这些切片的一种好方法。
- Is Buffer? 是否为缓冲区？
    - 一个布尔值，告诉我们这帧是否对应于缓冲区或者动画。

### Flow events 流事件

在应用程序中选择实际时间轴切片也会将一条线连接到相应的SurfaceFlinger时间轴切片。

由于SurfaceFlinger可以将多个层的帧合成单个屏幕帧（称为DisplayFrame），因此选择DisplayFrame会将箭头绘制到所有被合成在一起的帧上。这可能跨越多个进程。

提问：SurfaceFlinger可以将多个层的帧合成单个屏幕帧（称为DisplayFrame）?
- 在Android操作系统中，SurfaceFlinger是负责显示屏幕上所有内容的组件。它可以将多个层的帧合成单个屏幕帧，并且在屏幕上显示这个帧。SurfaceFlinger使用GPU硬件加速来加速帧合成的过程，以提高显示性能。在SurfaceFlinger的帧合成过程中，每个层都被绘制到自己的缓冲区中，然后SurfaceFlinger使用混合和蒙版技术将这些缓冲区合成为单个帧。这个过程中，SurfaceFlinger需要考虑每个层的透明度、变换、叠加模式等因素，以保证最终的合成效果正确无误。当所有层的帧都被合成为单个屏幕帧后，SurfaceFlinger将这个帧提交给Display HAL进行显示。通过这种方式，SurfaceFlinger可以实现高效的屏幕绘制和显示，并且为用户提供流畅的体验。
- 在Android操作系统中，SurfaceFlinger是一个重要的组件，负责显示屏幕上所有内容。它可以将多个层的帧合成单个屏幕帧，并且在屏幕上显示这个帧。这个帧被称为DisplayFrame，表示屏幕上的可见区域。
在SurfaceFlinger的帧合成过程中，每个层都被绘制到自己的缓冲区中，然后SurfaceFlinger使用混合和蒙版技术将这些缓冲区合成为单个帧。这个过程中，SurfaceFlinger需要考虑每个层的透明度、变换、叠加模式等因素，以保证最终的合成效果正确无误。
当所有层的帧都被合成为单个DisplayFrame后，SurfaceFlinger将这个帧提交给Display HAL进行显示。Display HAL会将这个帧发送到屏幕上进行显示。
通过这种方式，SurfaceFlinger可以实现高效的屏幕绘制和显示，并且为用户提供流畅的体验。同时，SurfaceFlinger还支持硬件加速，可以在GPU的帮助下提高帧合成的速度和效率，以进一步提高显示性能。

### Color codes

| 颜色 | 解释 |
| --- | --- |
| 绿色 | 良好的帧。没有观察到卡顿 |
| 浅绿 | 高延迟状态。帧速率平滑，但帧呈现较晚，导致输入延迟增加。 |
| 红色 | 卡顿帧。所属的进程是卡顿的原因。 |
| 黄色 | 仅由应用程序使用。帧存在卡顿，但应用程序不是原因，SurfaceFlinger导致了卡顿。 |
| 蓝色 | 丢失帧。与卡顿无关。SurfaceFlinger放弃了这个帧，优先选择更新的帧。 |

注：在这个上下文中，“jank”表示卡顿或延迟，指在用户交互或应用程序运行时，屏幕的响应时间不足，会造成不良用户体验。

## Janks explained

Jank类型在JankInfo.h中定义。由于每个应用程序的编写方式不同，没有通用的方法可以深入了解应用程序的内部，并指定Jank的原因。我们的目标不是这样做，而是提供一种快速的方法来判断应用程序是否不稳定或SurfaceFlinger是否不稳定。

https://cs.android.com/android/platform/superproject/+/master:frameworks/native/libs/gui/include/gui/JankInfo.h;l=22

### None

一切正常。该帧没有Jank。应该争取达到的理想状态。

### App janks

AppDeadlineMissed
应用程序运行时间超出预期，导致Jank。应用程序帧所花费的总时间通过使用choreographer唤醒作为起始时间，max（gpu，post time）作为结束时间进行计算。Post time是帧发送到SurfaceFlinger的时间。由于GPU通常并行运行，因此可能是GPU完成的时间晚于post time。

BufferStuffing
这更像是一种状态而不是Jank。如果应用程序在上一个帧甚至未被呈现之前继续向SurfaceFlinger发送新帧，则会发生这种情况。内部缓冲区被填充了尚未呈现的缓冲区，因此得名Buffer Stuffing。队列中的这些额外缓冲区仅一个接一个地呈现，因此导致额外的延迟。这也可能导致阶段性问题，即应用程序没有更多的缓冲区可用，因此进入阻塞等待。应用程序执行的实际工作持续时间可能仍然在截止时间之内，但由于堆积的性质，无论应用程序多快完成工作，所有帧都将至少延迟一个VSync呈现。在此状态下，帧仍将保持平滑，但存在与延迟呈现相关的增加的输入延迟。

### SurfaceFlinger Janks

SurfaceFlinger可以以两种方式组合帧：

- 设备合成-使用专用硬件
- GPU /客户端合成-使用GPU合成

需要注意的重要事项是，执行设备合成是在主线程上进行的阻塞调用。但是，GPU合成是并行进行的。SurfaceFlinger执行必要的绘制调用，然后将gpu fence交给显示设备。然后，显示设备等待fence被信号通知，然后呈现帧。

> 这句话的意思是，显示设备等待fence信号，然后呈现帧画面。通常情况下，在绘制完整个帧之后，CPU会发出一个fence信号告知显示设备可以呈现这个帧了。显示设备接收到信号后，等待直到绘制完成的帧数据已经传输到设备上，然后就可以将这个帧呈现出来了。

> 需要注意的重要事项是，执行设备合成是在主线程上进行的阻塞调用 - 这句话的意思是，设备的帧合成操作是在主线程上进行的，这是一个阻塞式的调用。在Android中，主线程负责处理UI事件，包括用户输入、布局计算、视图绘制等等。由于设备的帧合成需要访问屏幕缓冲区并执行GPU操作等比较耗时的操作，因此这个操作会阻塞主线程，导致UI响应变慢。这可能会导致卡顿、延迟等问题，从而影响用户体验。为了避免这个问题，Android系统会使用异步线程来执行一些耗时的操作，如设备的帧合成操作。这样，主线程可以专注于处理UI事件，确保响应速度和用户体验。

> gpu fence - 在Android系统中，GPU fence是一种用于同步GPU操作的机制。GPU fence本质上是一种信号量，用于跟踪GPU执行的命令缓冲区中的命令是否已经完成。当GPU完成命令缓冲区中的所有命令后，它会发出一个信号，表示这个缓冲区现在是可用的。这个信号就是GPU fence。应用程序可以使用GPU fence来等待GPU操作完成，以确保在继续执行其他操作之前，GPU的所有命令都已经完成。这可以避免一些潜在的问题，如图像撕裂和渲染不一致等。在Android系统中，GPU fence通常用于同步渲染和显示操作。

SurfaceFlingerCpuDeadlineMissed
预计SurfaceFlinger在给定的截止时间内完成。如果主线程运行时间超过了截止时间，则卡顿就是SurfaceFlingerCpuDeadlineMissed。SurfaceFlinger的CPU时间是在主线程上花费的时间。如果使用设备合成，则包括整个合成时间。如果使用GPU合成，则包括编写绘制调用并将帧交给GPU的时间。

SurfaceFlingerGpuDeadlineMissed
SurfaceFlinger主线程在CPU上花费的时间+ GPU合成时间总时间超出了预期。在这里，CPU时间仍将在截止时间内，但由于GPU上的工作未能及时完成，帧被推送到下一个垂直同步（vsync）。

DisplayHAL
DisplayHAL卡顿指的是SurfaceFlinger完成工作并按时将帧发送到HAL，但是帧未在垂直同步上呈现。它将在下一个垂直同步上呈现。可能是SurfaceFlinger未给HAL足够的时间进行工作，或者可能是HAL的工作出现了真正的延迟。

PredictionError
SurfaceFlinger的调度器提前计划呈现帧的时间。然而，这种预测有时会偏离实际的硬件垂直同步时间。例如，一帧可能被预测为20ms的呈现时间。由于估计偏差，帧的实际呈现时间可能为23ms。这被称为SurfaceFlinger调度程序中的预测错误。调度器会定期进行自我纠正，因此这种漂移不是永久性的。然而，预测中存在漂移的帧仍将被分类为卡顿以进行跟踪。

通常情况下，单独的预测错误不会被用户察觉，因为调度器会迅速适应并修正漂移。

### Unknown jank

顾名思义，这种卡顿的原因是未知的。例如，SurfaceFlinger或应用程序花费的时间比预期时间长，但帧仍然被提前呈现。这种卡顿发生的概率非常低，但不是不可能。

## SQL
## TraceConfig

## 总结

### 2023年3月31日00:23:34

这篇文章是介绍如何在Perfetto中选择时间线切片以查看帧率性能数据的。Perfetto是一种性能分析工具，它可以帮助开发者分析系统和应用程序的性能数据。帧率是衡量应用程序流畅度的一个关键指标。在这篇文章中，介绍了如何在Perfetto中使用FrameTimeline数据源来查看帧率性能数据，并选择特定的时间线切片来分析数据。

首先，文章介绍了FrameTimeline数据源的基本概念，包括如何启用该数据源，并解释了每个字段的含义。然后，文章介绍了如何在Perfetto UI中选择特定的时间线切片，并解释了每个切片的含义。接下来，文章介绍了如何使用Perfetto的SQL查询语言来筛选和分析数据。最后，文章提供了一些实用的技巧和建议，如如何解决帧率下降问题、如何识别慢操作以及如何使用GPU信息来优化应用程序性能。

总的来说，这篇文章介绍了如何在Perfetto中使用FrameTimeline数据源来分析帧率性能数据，以及如何使用UI和SQL查询来选择和分析时间线切片。这对于开发者来说是一个非常有用的工具，可以帮助他们优化应用程序的性能，提高用户体验。

### 2023年3月31日00:24:00

这篇文章介绍了如何在Perfetto工具中选择并查看帧时间轴（Frame Timeline）的实际时间片段（slice）。

在Perfetto的UI中，可以使用时间线轴（Time axis）选择帧时间轴，然后使用“Select”工具选择感兴趣的时间段。选择的时间段会被显示在Current Selection区域中。在这个区域中，可以查看所选时间段的详细信息，包括时间段名称、类别、开始时间、绝对时间、持续时间、线程持续时间、进程、用户ID和时间片ID等。可以使用这些信息来了解帧的性能情况和相关信息。

文章还介绍了一些帧时间轴中的标记和颜色。例如，“Janky”表示帧存在卡顿或延迟，不良用户体验；“Dropped”表示该帧被SurfaceFlinger丢弃；“Yellow”表示应用程序不是导致卡顿的原因，而是由SurfaceFlinger引起的。

最后，文章提供了一些有用的提示，如调整时间轴的时间单位、调整时间轴的颜色方案、查看帧时间轴的详细信息等等。这些技巧可以帮助开发人员更好地理解应用程序的性能瓶颈，从而进行优化和调试。


### 2023年3月31日00:24:29

这篇文章主要介绍了在Perfetto中选择时间轴片段的方法和原理。Perfetto是一款用于性能分析的工具，可以用于跟踪和分析Android设备的帧率和卡顿情况。帧率和卡顿是衡量应用程序性能的关键指标，因此了解如何选择时间轴片段是非常重要的。

在Perfetto中，时间轴片段可以通过选择时间范围或使用过滤器来选择。时间轴片段包含了有关系统和应用程序的各种信息，如CPU使用率、内存使用情况、I/O操作、网络活动等等。其中，关于帧率和卡顿的信息主要包括每个帧的状态、显示延迟、应用程序的卡顿情况等。

在时间轴片段中，每个帧都有一个对应的状态，可以用不同的颜色表示。例如，绿色表示良好的帧，红色表示卡顿的帧，黄色表示应用程序不是卡顿的原因等等。此外，时间轴片段还包含了有关每个帧的信息，如帧的开始时间、结束时间、持续时间、线程持续时间、进程、用户ID、片段ID等等。

通过选择合适的时间轴片段，可以分析系统和应用程序的性能问题，并找到导致卡顿和延迟的原因。Perfetto可以帮助开发人员识别和解决应用程序性能问题，提高应用程序的响应速度和用户体验。

## Reference

- https://perfetto.dev/docs/data-sources/frametimeline
- https://developer.android.com/reference/android/view/Choreographer