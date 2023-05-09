---
tag:
  - android
  - aosp
---

# Android | AOSP | 应用启动全流程分析（源码深度剖析）

## 前言1

对优秀文章[《Android应用启动全流程分析（源码深度剖析）》](https://www.jianshu.com/p/37370c1d17fc)学习的记录

## 前言2

结合Perfetto分析工具，基于最新Android 13 AOSP源码完整的分析一下这个从用户手指触控点击屏幕应用图标到应用界面展示到屏幕上的整个应用启动过程，也是对之前所做所学的一个总结与归纳。

## 大纲

- Android触控事件处理机制
- Zygote进程启动和应用进程创建流程
- Handler消息机制
- AMS的Activity组件管理
- 应用Application和Activity组件创建与初始化
- 应用UI布局与绘制
- RenderThread渲染
- SurfaceFlinger合成显示

## Input触控事件处理流程

### 系统机制分析

Android 系统是由事件驱动的，而 input 是最常见的事件之一，用户的点击、滑动、长按等操作，都属于 input 事件驱动，其中的核心就是 InputReader 和 InputDispatcher。InputReader 和 InputDispatcher 是跑在 system_server 进程中的两个 native 循环线程，负责读取和分发 Input 事件。整个处理过程大致流程如下：

- InputReader 负责从 EventHub 里面把 Input 事件读取出来，然后交给 InputDispatcher 进行事件分发；
- InputDispatcher 在拿到 InputReader 获取的事件之后，对事件进行包装后，寻找并分发到目标窗口;
- InboundQueue 队列（“iq”）中放着 InputDispatcher 从 InputReader 中拿到的 input 事件；
- OutboundQueue（“oq”）队列里面放的是即将要被派发给各个目标窗口App的事件；
- WaitQueue 队列里面记录的是已经派发给 App（“wq”），但是 App 还在处理没有返回处理成功的事件；
- PendingInputEventQueue 队列（“aq”）中记录的是应用需要处理的 Input 事件，这里可以看到input事件已经传递到了应用进程；
- deliverInputEvent 标识 App UI Thread 被 Input 事件唤醒；
- InputResponse 标识 Input 事件区域，这里可以看到一个 Input_Down 事件 + 若干个 Input_Move 事件 + 一个 Input_Up 事件的处理阶段都被算到了这里；
- App 响应处理Input 事件，内部会在其界面View树中传递处理。

用一张图描述整个过程大致如下：

![](/learn-android/aosp/input-modal.webp)

### 结合Perfetto分析

从桌面点击应用图标启动应用，system_server 的 native 线程 InputReader 首先负责从 EventHub 中利用linux 的 epoll 机制监听并从屏幕驱动读取上报的触控事件，然后唤醒另外一条 native 线程InputDispatcher 负责进行进一步事件分发。InputDispatcher 中会先将事件放到 InboundQueue 也就是“iq”队列中，然后寻找具体处理 input 事件的目标应用窗口，并将事件放入对应的目标窗口 OutboundQueue 也就是“oq”队列中等待通过 SocketPair 双工信道发送到应用目标窗口中。最后当事件发送给具体的应用目标窗口后，会将事件移动到 WaitQueue也 就是“wq”中等待目标应用处理事件完成，并开启倒计时，如果目标应用窗口在5S内没有处理完成此次触控事件，就会向 system_server 报应用 ANR 异常事件。以上整个过程在 Android 系统源码中都加有相应的 trace，如下截图所示：

![](/learn-android/aosp/input-1.jpeg)

接着上面的流程继续往下分析：当 input 触控事件传递到桌面应用进程后，Input 事件到来后先通过 enqueueInputEvent 函数放入“aq” 本地待处理队列中，并唤醒应用的 UI 线程在deliverInputEvent 的流程中进行 input 事件的具体分发与处理。具体会先交给在应用界面Window创建时的 ViewRootImpl#setView 流程中创建的多个不同类型的 InputStage 中依次进行处理（比如对输入法处理逻辑的封装ImeInputStage），整个处理流程是按照责任链的设计模式进行。最后会交给 ViewPostImeInputStage 中具体进行处理，这里面会从 View 布局树的根节点 DecorView 开始遍历整个 View 树上的每一个子 View 或 ViewGroup 界面进行事件的分发、拦截、处理的逻辑。最后触控事件处理完成后会调用finishInputEvent 结束应用对触控事件处理逻辑，这里面会通过 JNI 调用到 native 层 InputConsumer 的 sendFinishedSignal 函数通知 InputDispatcher 事件处理完成，从触发从 "wq" 队列中及时移除待处理事件以免报ANR异常。

![](/learn-android/aosp/input-2.jpeg)
![](/learn-android/aosp/input-2-1.jpeg)

桌面应用界面 View 中在连续处理一个 ACTION_DOWN 的 TouchEvent 触控事件和多个 ACTION_MOVE，直到最后出现一个ACTION_UP 的 TouchEvent 事件后，判断属于 onClick 点击事件，然后透过 ActivityManager Binder 调用 AMS 的 startActivity (system_server进程，binder线程，startActivityInner) 服务接口触发启动应用的逻辑。从Perfetto上看如下图所示：

![](/learn-android/aosp/input-3.jpeg)
![](/learn-android/aosp/input-4.jpeg)

## 其他

### Perfetto中的 sys_read

`sys_read` 是 Linux 内核中的系统调用之一，用于从文件描述符中读取数据。在 Perfetto 中，它表示读取文件系统的操作，可以用来监测读取文件的行为，包括读取的大小、读取的时间和读取的文件描述符等信息。通过分析这些数据，可以得出一些关于应用程序性能的结论，例如文件读取的频率、文件大小和读取时间等。这些信息对于优化应用程序的磁盘访问行为非常有用。在 Perfetto 中，sys_read 这个事件会被记录在 ftrace 的 event 文件中。

### Perfetto中的 sys_write

在 Perfetto 的追踪记录中，`sys_write` 表示正在进行的写操作。这通常涉及将数据写入文件、管道或其他输出设备。它是 Linux 内核提供的系统调用之一，允许程序向文件描述符写入数据。

在 Perfetto 中，`sys_write` 通常与应用程序和内核的 I/O 操作相关。通过跟踪 `sys_write` 系统调用，可以了解应用程序和内核之间的 I/O 操作，以及它们对系统性能的影响。Perfetto 的追踪记录可以用于分析应用程序性能瓶颈，诊断内核和驱动程序问题，以及确定系统瓶颈的根本原因。

### Perfettoz中的 sys_ioctl

在 Linux 中，`ioctl` 是一个系统调用（system call），它可以用来对文件描述符执行各种控制操作。`ioctl` 的参数通常是一个整数（表示要执行的操作），以及一个结构体（用于输入或输出控制信息）。常见的用法包括控制硬件设备（如串口、网卡、声卡等）以及控制虚拟文件系统（如 `/proc`、`/sys` 等）。

在 Perfetto 中，`sys_ioctl` 是一个事件（event），表示执行了一个 `ioctl` 系统调用。通常会记录下 `ioctl` 的参数（如文件描述符、操作码、输入/输出参数等）以及相应的返回值。通过这些信息，可以分析出应用程序或系统内核的行为。例如，可能会分析某个应用程序使用 `ioctl` 控制了硬件设备的哪些参数，或者分析内核对文件系统的控制操作。

### Perfetto中的 sys_epoll_pwait

`sys_epoll_pwait` 是 Linux 内核中的系统调用，主要用于实现异步 I/O 和事件通知。`epoll` 是 Linux 中高效的 I/O 多路复用机制之一，`sys_epoll_pwait` 则是在 `epoll` 机制的基础上提供的等待事件发生的系统调用，可以等待一个或多个文件描述符上的指定事件集合发生，直到事件就绪或者超时为止。当指定的事件发生时，`sys_epoll_pwait` 返回事件相关的文件描述符和事件类型，以便应用程序进行处理。

在 Perfetto 中，`sys_epoll_pwait` 可能会被用于实现异步事件跟踪，通过在 Perfetto 中设置特定的跟踪事件，可以使用 `sys_epoll_pwait` 来等待事件发生并进行处理。例如，可以设置 Perfetto 跟踪网络通信事件，通过 `sys_epoll_pwait` 等待网络事件发生并记录跟踪信息。

## 引用

- <https://www.jianshu.com/p/37370c1d17fc>
