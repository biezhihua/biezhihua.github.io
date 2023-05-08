---
tag:
  - android
  - google-docs
---

# Android | Docs | google-android-atrace

## > 体系化的为我讲解atrace的作用、源码、实现原理、使用方法、注意事项等

atrace（Android Trace）是一个用于分析Android系统性能的工具。它通过收集内核中的跟踪数据，帮助开发者了解系统中的各种事件（如CPU调度、内存分配、同步原语等）的执行情况，从而发现性能瓶颈、优化应用程序。

一、作用

1. 诊断性能问题：通过分析系统事件，找出性能瓶颈，为性能优化提供依据。
2. 监控系统运行：了解应用程序在运行时的整体状况，包括CPU使用情况、线程调度等。
3. 跟踪事件执行：通过可视化工具，可以查看事件执行的顺序，分析事件之间的关联。

二、源码 atrace的源代码位于AOSP（Android Open Source Project）的`system/extra/atrace`目录下。主要由C++编写，使用了一些Android系统特性。你可以通过访问Android源代码库来查看atrace的源码：[https://android.googlesource.com/platform/system/extra/+/refs/heads/master/atrace/](https://android.googlesource.com/platform/system/extra/+/refs/heads/master/atrace/)

三、实现原理

1. atrace通过访问Android内核中的跟踪数据，收集事件信息。这些数据存储在`/sys/kernel/debug/tracing`目录下。
2. atrace使用Ftrace（Function Tracer）内核子系统来收集数据。Ftrace允许在内核中插入探针，记录函数调用和返回信息。
3. atrace通过在内核中添加tracepoints（跟踪点）来获取事件信息。tracepoints是内核中特定位置的插入点，允许开发者在运行时插入或移除探针。
4. atrace将收集到的跟踪数据以ATRACE\_TAG格式输出，可以通过Systrace工具进行可视化分析。

四、使用方法

1. 在Android设备上启用atrace：`adb shell setprop debug.atrace.tags.enableflags <trace_category>`
2. 开始跟踪：`adb shell atrace --async_start -t <trace_time> -c <trace_categories>`
3. 停止跟踪：`adb shell atrace --async_stop`
4. 将跟踪数据保存到文件：`adb shell atrace --async_dump -o <output_file>`
5. 使用Systrace工具进行可视化分析：将输出文件导入Systrace工具。

五、注意事项

1. atrace可能会对系统性能产生一定影响，因此在生产环境中谨慎使用。
2. 需要使用具有root权限的设备才能完全访问所有功能。
3. 跟踪数据可能会包含敏感信息，注意保护隐私。

通过了解atrace的作用、源码、实现原理、使用方法和注意事项，你可以更好地利用这个工具来优化你的Android应用程序。以下是一些建议，可以帮助你更高效地使用atrace：

1. 适时使用：在对应用程序进行性能分析时，使用atrace可以帮助你发现问题和优化点。但在应用程序的正常开发阶段，避免频繁使用atrace，以免影响开发速度。

2. 分析重点：针对你的应用程序关注的性能指标，有针对性地选择atrace的跟踪类别。例如，如果你关注CPU使用情况，可以选择“sched”类别；关注内存分配，可以选择“kmem”类别。

3. 多次验证：在优化应用程序后，多次使用atrace进行性能验证，以确保优化效果显著并且持久。

4. 与其他工具结合：atrace可以与其他Android性能分析工具（如Systrace、Traceview、Perfetto等）结合使用，提供更全面、更深入的性能分析。

5. 学习参考：阅读atrace的源码和文档，学习其实现原理和使用技巧，以便更好地运用这个工具。

通过以上建议，你可以更有效地利用atrace来诊断和解决Android应用程序的性能问题。同时，不断学习和实践，掌握更多性能优化技巧，有助于你成为一名优秀的Android开发者。

## > 深入且详细的分析atrace的源码

atrace的源码主要位于AOSP的`system/extra/atrace`目录下。为了更好地理解atrace的源码，我们可以从以下几个方面进行深入分析：

1. 源码结构 atrace源码主要包括以下几个文件：

* atrace.cpp：主程序文件，包含main函数。
* atrace.h：头文件，定义了各种数据结构和函数原型。
* util.cpp：实用工具集，包含一些辅助函数。

2. main函数 atrace的main函数是程序的入口点。它主要负责解析命令行参数，根据参数执行相应的操作。这些操作包括启动跟踪、停止跟踪、设置跟踪类别等。

3. 跟踪类别 atrace支持多种跟踪类别，如CPU调度、内存管理等。源码中定义了一个名为`trace_categories`的结构体数组，用于存储各种跟踪类别的信息。开发者可以根据需要添加新的跟踪类别。

4. 跟踪数据收集 atrace通过访问`/sys/kernel/debug/tracing`目录下的文件来收集跟踪数据。主要有以下几个步骤：

* 打开`/sys/kernel/debug/tracing/trace_marker`文件，用于向内核写入跟踪事件。
* 打开`/sys/kernel/debug/tracing/trace`文件，用于读取内核中的跟踪数据。
* 打开`/sys/kernel/debug/tracing/set_event`文件，用于设置要跟踪的事件类别。
* 打开`/sys/kernel/debug/tracing/trace_clock`文件，用于设置内核跟踪时钟。

5. 跟踪数据输出 atrace将收集到的跟踪数据以ATRACE\_TAG格式输出。这些数据可以通过Systrace工具进行可视化分析。atrace的输出数据格式与Systrace工具兼容，可以直接导入Systrace进行分析。

6. 辅助函数 在util.cpp文件中，atrace定义了一些辅助函数，如`write_str`（用于向文件写入字符串）、`read_file`（用于读取文件内容）等。这些辅助函数简化了atrace的主要功能实现。

通过深入分析atrace的源码，我们可以更好地了解其工作原理和实现细节。这对于使用atrace进行性能分析、定制atrace工具以满足特定需求，以及学习内核跟踪技术都非常有帮助。

## > android操作系统使用ATRACE\_TAG\_GRAPHICS预埋那些tracepoints，请详细列举出来，并说明其作用

ATRACE\_TAG\_GRAPHICS是一个跟踪标签，用于表示与Android图形系统相关的跟踪事件。Android图形系统主要涉及到SurfaceFlinger、Hardware Composer（HWC）、渲染引擎（如OpenGL ES、Vulkan）等组件。跟踪这些组件的性能可以帮助开发者发现图形渲染过程中的性能瓶颈，优化应用程序。

以下是一些与ATRACE\_TAG\_GRAPHICS相关的主要tracepoints，它们涵盖了Android图形系统的关键环节：

1. SurfaceFlinger：

    * SF\_prepare: SurfaceFlinger准备提交一帧的开始。
    * SF\_queueBuffer: SurfaceFlinger向屏幕提交一帧的缓冲区。
    * SF\_latchBuffer: SurfaceFlinger从客户端获取一帧的缓冲区。
2. Hardware Composer (HWC)：

    * HWC\_prepare: HWC准备一帧的开始。
    * HWC\_set: HWC设置一帧的屏幕显示参数。
    * HWC\_submit: HWC向显示硬件提交一帧的开始。
3. 渲染引擎（如OpenGL ES、Vulkan）：

    * GLES\_issueDrawCall: OpenGL ES发起一个绘制调用。
    * GLES\_submit: OpenGL ES提交一个命令缓冲区。
    * VK\_queueSubmit: Vulkan提交一个命令缓冲区。
4. 其他图形相关tracepoints：

    * EGL\_swapBuffers: EGL交换前后缓冲区。
    * HWUI\_draw: Android的硬件UI渲染器（如Skia）进行绘制操作。

这些tracepoints涵盖了Android图形系统的关键环节，包括SurfaceFlinger、Hardware Composer、渲染引擎等组件。通过分析这些tracepoints的性能数据，开发者可以发现图形渲染过程中的性能瓶颈，从而优化应用程序。

需要注意的是，这些tracepoints可能会随着Android版本的迭代而发生变化，因此在使用atrace进行性能分析时，应关注对应Android版本的源代码以获取准确的tracepoints信息。

## > 解析一下 atrace\_begin\_body 的实现原理

`atrace_begin_body`是一个内联函数，其主要作用是标记一个跟踪事件的开始。这个函数通常用于Android Framework层或应用层代码中，以收集应用程序运行时的性能数据。在Android Native层，对应的函数是`ATRACE_BEGIN`。

`atrace_begin_body`的实现原理可以从以下几个方面进行解析：

1. atrace标签：跟踪事件的开始和结束都使用相应的atrace标签进行标记。`atrace_begin_body`函数需要一个字符串参数，表示事件的名称。这个字符串将作为事件的标识，用于在跟踪数据中区分不同的事件。

2. 写入trace\_marker：`atrace_begin_body`通过向`/sys/kernel/debug/tracing/trace_marker`文件写入特定格式的字符串来标记事件的开始。这个文件由内核提供，用于接收用户空间发起的跟踪事件。字符串的格式为`B|<pid>|<event_name>`，其中`B`表示事件开始，`<pid>`表示进程ID，`<event_name>`表示事件名称。

3. 跟踪数据收集：内核会根据写入`trace_marker`的字符串信息，在相应的tracepoint处插入探针，收集跟踪数据。这些数据将存储在内核的trace buffer中，可以通过atrace工具进行导出和分析。

以下是`atrace_begin_body`的简化实现：

cpp

```cpp
static inline void atrace_begin_body(const char* name) {
    // 获取进程ID
    int pid = getpid();
    
    // 构造写入trace_marker的字符串
    char buf[1024];
    size_t len = snprintf(buf, sizeof(buf), "B|%d|%s", pid, name);

    // 向trace_marker写入字符串，标记事件开始
    int fd = open("/sys/kernel/debug/tracing/trace_marker", O_WRONLY);
    if (fd >= 0) {
        write(fd, buf, len);
        close(fd);
    }
}
```

通过理解`atrace_begin_body`的实现原理，我们可以更好地利用这个函数来收集应用程序运行时的性能数据，从而发现性能瓶颈，优化应用程序。同时，这也有助于我们学习和了解Android内核跟踪机制的工作原理。

* system/core/libcutils/trace-dev.cpp
* system/core/libcutils/trace-host.cpp

## atrace source code

<https://cs.android.com/android/platform/superproject/+/master:frameworks/native/cmds/atrace/atrace.cpp>

这是Android系统中atrace工具的源代码，用于收集系统跟踪数据，包括CPU使用情况、内存分配、磁盘I/O、网络数据等等。代码中定义了atrace命令支持的各种选项，如-b用于设置缓冲区大小，-z用于压缩数据，-t用于指定跟踪时长等等。同时，代码中还实现了各种不同的跟踪类别（如gfx、view、input等），以及对于每个跟踪类别所对应的系统数据源进行设置和启用。最后，代码中还实现了对于atrace工具的使用说明和帮助信息。

<https://cs.android.com/android/platform/superproject/+/master:system/core/libcutils/include/cutils/trace.h>

<https://cs.android.com/android/platform/superproject/+/master:system/core/libutils/include/utils/Trace.h>

<https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/android/os/Trace.java>

In Android, atrace is a tool used for application profiling and debugging. It can trace a variety of events in the system, such as CPU usage, memory allocation, and graphics rendering.

The parameter "gfx" when using atrace refers specifically to graphics events. This allows developers to track the performance of their app's rendering pipeline, including details such as the frame rate, GPU usage, and how long it takes to render each frame. This information can help identify performance bottlenecks and improve the overall performance and user experience of the application.

atrace gfx是一个Android系统级别的跟踪类别，它允许开发人员跟踪与图形相关的事件。通过使用atrace gfx，可以监视应用程序的绘图性能，包括GPU渲染、图形合成等。它可以帮助开发人员定位应用程序的绘图性能瓶颈，并对应用程序的图形性能进行优化。

atrace gfx功能的实现代码是在Android的源代码中的frameworks/native/cmds/atrace/atrace.cpp文件中的handle_gfx函数中。具体来说，该函数使用sys_write()函数将"gfx"字符串写入到/sys/kernel/debug/tracing/tracing_mark_write文件中，以便将GFX跟踪标记写入跟踪缓冲区中。写入后，跟踪缓冲区中包含有关GFX操作的详细信息，可以使用其他工具（如Systrace）对其进行分析和可视化。
