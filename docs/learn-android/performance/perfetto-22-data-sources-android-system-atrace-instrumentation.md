---
article: false
---

# ATrace: Android system and app trace events

## ATrace

在Android上，本地和托管应用程序可以向跟踪中注入自定义切片和计数器跟踪点。这可以通过以下方法实现:

- Java/Kotlin应用(SDK): `android.os.Trace`。见https://developer.android.com/reference/android/os/Trace。
- 本机进程(NDK): `ATrace_beginSection()` / `ATrace_setCounter()`定义在`<trace.h>`。见https://developer.android.com/ndk/reference/group/tracing。
- Android内部进程：`libcutils/trace.h`中定义的`ATRACE_BEGIN()` / `ATRACE_INT()`。

这个API在Android 4.3 (API级别18)和Perfetto之前就已经可用了。所有这些注释在内部都是通过内部libcutils API路由的，它们现在和将来都将受到Perfetto的支持。

有两种类型的跟踪事件:系统事件和应用程序事件。

- 系统事件:仅由Android内部使用libcutils触发。这些事件按类别分组(也称为标签)，例如:am (ActivityManager)， pm (PackageManager)。有关类别的完整列表，请参阅Perfetto UI的Record new trace页面。

- 类别可用于跨多个进程启用事件组，而不必担心是哪个特定的系统进程发出它们。

- 应用程序事件:与系统事件具有相同的语义。然而，与系统事件不同的是，它们没有任何标签过滤功能(所有应用程序事件共享相同的标签ATRACE_TAG_APP)，但可以在每个应用程序的基础上启用。

有关如何启用系统事件和应用事件的说明，请参阅下面的TraceConfig部分。

## 检测的开销

ATrace检测有不可忽略的成本，每个事件需要1-10us，。这是因为每个事件都涉及到一个字符串化、一个来自受管理执行环境的JNI调用，以及一个用户空间`<->`内核空间的往返，以将标记写入`/sys/kernel/debug/tracing/trace_marker`(这是最昂贵的部分)。

### what is the meaning of user-space and kernel-space in Android

In Android (and other operating systems), there are two distinct areas of memory where programs can run: the user-space and the kernel-space.

The user-space is where normal applications run. These are the programs that you download and run on your phone or tablet, such as games, social media apps, or productivity tools. The user-space is typically where most of the processing occurs, and it has access to a limited set of system resources.

On the other hand, the kernel-space is the privileged area of memory where the operating system itself runs. This area is where the low-level device drivers, security policies, and system services run. It has access to all the resources of the device, including hardware, memory, and input/output operations.

When an application wants to access a system resource, it makes a request to the kernel. The kernel then checks the request and performs the necessary action if it is allowed. This separation between the user-space and kernel-space is a key part of Android's security architecture, as it prevents applications from accessing system resources they shouldn't be able to access, and helps to prevent malicious code from taking over the device.

在Android（以及其他操作系统）中，有两个不同的内存区域可以运行程序：用户空间和内核空间。

用户空间是正常应用程序运行的地方。这些是您下载并在手机或平板电脑上运行的程序，例如游戏，社交媒体应用程序或生产力工具。用户空间通常是大部分处理发生的地方，并且它具有对一组有限的系统资源的访问权限。

另一方面，内核空间是特权内存区域，操作系统本身在其中运行。这个区域是低级设备驱动程序，安全策略和系统服务运行的地方。它可以访问设备的所有资源，包括硬件，内存和输入/输出操作。

当应用程序想要访问系统资源时，它会向内核发出请求。然后内核检查请求并执行必要的操作（如果被允许的话）。用户空间和内核空间之间的这种分离是Android安全体系结构的关键部分，因为它可以防止应用程序访问它们不应该访问的系统资源，并有助于防止恶意代码接管设备。

我们的团队正在考虑Android的迁移路径，根据新引入的跟踪SDK。目前的建议是在Android上继续使用现有的ATrace API。

## 用户界面

在UI级别，这些函数在流程跟踪组的范围内创建切片和计数器，如下所示:

## Reference

https://perfetto.dev/docs/data-sources/atrace