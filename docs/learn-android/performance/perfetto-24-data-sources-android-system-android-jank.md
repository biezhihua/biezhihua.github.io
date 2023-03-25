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
### Flow events

在应用程序中选择实际时间轴切片也会将一条线连接到相应的SurfaceFlinger时间轴切片。

流事件
在应用程序中选择实际时间轴切片也会将一条线连接到相应的SurfaceFlinger时间轴切片。

由于SurfaceFlinger可以将多个层的帧合成单个屏幕帧（称为DisplayFrame），因此选择DisplayFrame会将箭头绘制到所有被合成在一起的帧上。这可能跨越多个进程。

### Color codes

## Janks explained

Jank类型在JankInfo.h中定义。由于每个应用程序的编写方式不同，没有通用的方法可以深入了解应用程序的内部，并指定Jank的原因。我们的目标不是这样做，而是提供一种快速的方法来判断应用程序是否不稳定或SurfaceFlinger是否不稳定。

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

## Reference

- https://perfetto.dev/docs/data-sources/frametimeline
- https://developer.android.com/reference/android/view/Choreographer