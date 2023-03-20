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
    -  类别可用于跨多个进程启用事件组，而不必担心是哪个特定的系统进程发出它们。
- 应用程序事件:与系统事件具有相同的语义。然而，与系统事件不同的是，它们没有任何标签过滤功能(所有应用程序事件共享相同的标签ATRACE_TAG_APP)，但可以在每个应用程序的基础上启用。

有关如何启用系统事件和应用事件的说明，请参阅下面的TraceConfig部分。

## 检测的开销

ATrace检测有不可忽略的成本，每个事件需要1-10us，。这是因为每个事件都涉及到一个字符串化、一个来自受管理执行环境的JNI调用，以及一个用户空间`<->`内核空间的往返，以将标记写入`/sys/kernel/debug/tracing/trace_marker`(这是最昂贵的部分)。

我们的团队正在考虑Android的迁移路径，根据新引入的跟踪SDK。目前的建议是在Android上继续使用现有的ATrace API。

## 用户界面

在UI级别，这些函数在流程跟踪组的范围内创建切片和计数器，如下所示:

## Reference

https://perfetto.dev/docs/data-sources/atrace