---
tag:
  - android
  - aosp
---

# Android | VSYNC

## SurfaceFlinger工程理解

### SurfaceFlinger

SurfaceFlinger的启动和消息队列处理机制（四）

- <https://www.cnblogs.com/roger-yu/p/15761646.html>
- <https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/main_surfaceflinger.cpp?hl=zh-cn>
- <https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp;l=26?q=createSurfaceFlinger&ss=android%2Fplatform%2Fsuperproject&hl=zh-cn>

### surfaceflinger.rc的作用，以及其内容的含义

`surfaceflinger.rc` 是一个 Android init 脚本，用于定义 SurfaceFlinger 服务的配置。SurfaceFlinger 是 Android 系统的核心组件，负责合成和显示图形。该文件定义了 SurfaceFlinger 服务的启动方式和权限。现在让我们分析文件的每一行内容：

1. `service surfaceflinger /system/bin/surfaceflinger`定义一个名为 "surfaceflinger" 的服务，它的可执行文件位于 `/system/bin/surfaceflinger`。

2. `class core animation`将 SurfaceFlinger 服务分配到 "core" 和 "animation" 类别。这些类别用于在特定条件下控制服务的启动和关闭。

3. `user system`设置 SurfaceFlinger 服务运行在 "system" 用户上下文中。

4. `group graphics drmrpc readproc`将 SurfaceFlinger 服务的组设置为 "graphics"、"drmrpc" 和 "readproc"。这些组定义了服务的权限。

5. `capabilities SYS_NICE`赋予 SurfaceFlinger 服务 SYS\_NICE 功能。这允许服务更改其调度优先级，以便在需要时获得更多 CPU 时间。

6. `onrestart restart --only-if-running zygote`如果 SurfaceFlinger 服务重启，该行命令会尝试重启名为 "zygote" 的服务。`--only-if-running` 参数确保仅在 "zygote" 服务已运行时执行重启操作。

7. `task_profiles HighPerformance`为 SurfaceFlinger 服务分配 "HighPerformance" 任务配置文件。这可能会调整服务的性能参数。

8-10. `socket pdx/...`这三行定义了 SurfaceFlinger 服务用于与客户端通信的 UNIX 域套接字。套接字的权限、所有者和安全上下文在这些行中定义。

总之，`surfaceflinger.rc` 文件定义了 SurfaceFlinger 服务的启动配置、权限和通信方式。这个文件在 Android 系统启动时被 init 进程读取，用于正确地启动和运行 SurfaceFlinger 服务。

- <https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/surfaceflinger.rc;l=1?q=surfaceflinger.rc&sq=&hl=zh-cn>

### Android init 脚本

Android init 脚本是一种 Android 系统启动时用于配置和启动各种服务、设置属性和创建目录等操作的脚本。它们主要用于定义系统的启动流程和配置各种组件。这些脚本通常位于 Android 源码中的各个子项目和设备特定代码中，如 `system/core/rootdir`、`device/<manufacturer>/<device>/rootdir` 等。

Android init 脚本的作用包括：

1. 设置系统属性：用于配置系统行为、开关和设备特性等。
2. 创建目录和文件：用于在启动过程中创建必要的目录结构和文件。
3. 设置权限：用于设定系统目录和文件的访问权限，以确保正确的访问控制。
4. 启动服务：用于配置和启动系统中的各种守护进程和服务。

Android init 脚本使用一种名为 `init` 的简单语言编写，该语言包含一系列命令和关键字，用于表示不同的操作。例如：

- `service`：定义一个服务，包括服务名、可执行文件路径和相关参数。
- `on`：定义在特定事件触发时要执行的操作。
- `setprop`：设置系统属性。
- `mkdir`：创建目录。
- `chmod`：更改文件或目录权限。

要使用 Android init 脚本，您需要：

1. 在 Android 源码中找到相关的 init 脚本，如 `init.rc`、`init.<device>.rc` 或设备特定的 init 脚本。
2. 阅读和理解脚本中的命令和关键字，以及它们在系统启动过程中的作用。
3. 修改或添加 init 脚本中的命令和关键字，以满足您的需求。
4. 编译并刷入新的 Android 系统映像，然后观察更改后的系统行为。

- <https://android.googlesource.com/platform/system/core/+/master/init/README.md>

- <https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/Android.bp?hl=zh-cn>

### Android.bp的作用

`Android.bp` 是 Android 开源项目 (AOSP) 中的一种构建脚本，它使用类似 Makefile 的语法来描述如何构建 Android 应用程序、库和模块。它是 AOSP 中使用的 Soong 构建系统的核心组件之一，是 Android 7.0 及更高版本中用于构建的主要构建系统。

`Android.bp` 文件中描述了一个模块的依赖关系、编译选项、源代码文件列表等信息，构建系统将基于这些信息来生成构建脚本和构建产物。相比于之前使用的 GNU Make 工具链，Soong 构建系统更加灵活、可扩展和高效，能够更好地支持 Android 平台的复杂构建需求。

在 Android 源代码中，每个模块都有一个相应的 `Android.bp` 文件，用于描述该模块的构建规则。这些模块包括 Android 系统本身、应用程序、共享库、静态库、插件等。开发者可以修改这些 `Android.bp` 文件来增加、删除或修改模块的构建规则，以满足自己的需求。

总之，`Android.bp` 文件是 AOSP 中描述如何构建 Android 应用程序、库和模块的核心文件，它是 Soong 构建系统的核心组件之一。

## SurfaceFlinger初始化逻辑

### SurfaceFlinger::onComposerHalHotplug

```c++
#00 pc 00000000001ec9bc  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+524)
#01 pc 000000000017bdc1  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#02 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#03 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#04 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#05 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#06 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#07 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#08 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#09 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#10 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#11 pc 0000000000175c35  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#12 pc 0000000000183c74  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#13 pc 00000000001e4e8d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#14 pc 0000000000237a34  /system/bin/surfaceflinger (main+1220)
#15 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

### SurfaceFlinger::run

```c++
#00 pc 00000000001d38fb  /system/bin/surfaceflinger (android::scheduler::Scheduler::run()+59)
#01 pc 0000000000237d9a  /system/bin/surfaceflinger (main+2090)
#02 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

## SurfaceFlinger的VSYNC初始化逻辑

### SurfaceFlinger::initScheduler

```c++
 #  adb logcat | findstr "SurfaceFlinger::initScheduler"
- waiting for device -
#00 pc 00000000001f674f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+7359)
#01 pc 00000000001ea395  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#02 pc 00000000001e747f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#03 pc 00000000001ec964  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#04 pc 000000000017bdc1  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#05 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#06 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#07 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#08 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#09 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#10 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#11 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#12 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#13 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#14 pc 0000000000175c35  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#15 pc 0000000000183c74  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#16 pc 00000000001e4e8d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#17 pc 0000000000237b34  /system/bin/surfaceflinger (main+1220)
#18 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

- <https://www.cnblogs.com/roger-yu/p/15761646.html>
- <https://www.cnblogs.com/roger-yu/p/15099541.html>
- <https://blog.csdn.net/xiajun07061225/article/details/9250579>
- <https://blog.csdn.net/xiaosayidao/article/details/73992078>

### epoll_wait

`epoll_wait()`是Linux中用于监视多个文件描述符（file descriptors）的I/O事件的高效方法。它是Linux特有的I/O多路复用（I/O multiplexing）机制，类似于`select()`和`poll()`，但在性能和可扩展性方面有显著的优势。`epoll_wait()`可以在大量并发连接的情况下实现高效的I/O事件通知，因此在高并发服务器（如Web服务器、数据库服务器等）和事件驱动编程中非常有用。

`epoll_wait()`的作用是等待`epoll`实例中的文件描述符上的I/O事件。当关注的文件描述符上有事件发生（如数据可读、数据可写、错误等），`epoll_wait()`会将这些事件放入一个事件数组中，以便应用程序可以处理这些事件。

以下是`epoll_wait()`的简要使用步骤：

1. 使用`epoll_create()`或`epoll_create1()`创建一个新的`epoll`实例。
2. 使用`epoll_ctl()`将需要监视的文件描述符添加到`epoll`实例中，并指定感兴趣的事件（如`EPOLLIN`表示可读，`EPOLLOUT`表示可写等）。
3. 调用`epoll_wait()`等待`epoll`实例中的文件描述符上的事件。这个调用会阻塞，直到有事件发生或超时。
4. 当`epoll_wait()`返回时，检查事件数组中的事件，并相应地处理这些事件。
5. 重复步骤3和4，直到应用程序完成对文件描述符的监视。

以下是`epoll_wait()`函数的原型：

```c
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
```

参数解释：

- `epfd`：由`epoll_create()`或`epoll_create1()`返回的`epoll`实例的文件描述符。
- `events`：指向`epoll_event`结构体数组的指针，用于存储发生的事件。
- `maxevents`：`events`数组的大小，即最多可以返回的事件数量。
- `timeout`：等待事件的超时时间（以毫秒为单位）。如果设置为-1，`epoll_wait()`将一直阻塞，直到有事件发生；如果设置为0，则`epoll_wait()`立即返回，即使没有事件发生。

返回值：

- 成功时，返回发生的事件数量。
- 失败时，返回-1并设置`errno`。

注意：`epoll_wait()`是Linux特有的，不是POSIX标准的一部分。因此，在非Linux系统上（如BSD、macOS等），需要使用其他I/O多路复用机制（如`select()`、`poll()`或`kqueue()`）。

### Scheduler::createVsyncSchedule

```c++
 #  adb logcat | findstr "Scheduler::createVsyncSchedule"
- waiting for device -
#00 pc 00000000001d39f5  /system/bin/surfaceflinger (android::scheduler::Scheduler::createVsyncSchedule(android::ftl::Flags<android::scheduler::Feature>)+133)
#01 pc 00000000001f6cab  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+8587)
#02 pc 00000000001ea425  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#03 pc 00000000001e750f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#04 pc 00000000001ec9f4  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#05 pc 000000000017be01  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#06 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#07 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#08 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#09 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#10 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#11 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#12 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#13 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#14 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#15 pc 0000000000175c75  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#16 pc 0000000000183cb4  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#17 pc 00000000001e4f1d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#18 pc 0000000000237bc4  /system/bin/surfaceflinger (main+1220)
#19 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

```c++
void Scheduler::createVsyncSchedule(FeatureFlags features) {
    mVsyncSchedule.emplace(features);
}

```

```c++
VsyncSchedule::VsyncSchedule(FeatureFlags features)
      : mTracker(createTracker()),
        mDispatch(createDispatch(*mTracker)),
        mController(createController(*mTracker, features)) {
    if (features.test(Feature::kTracePredictedVsync)) {
        mTracer = std::make_unique<PredictedVsyncTracer>(*mDispatch);
    }
}

VsyncSchedule::VsyncSchedule(TrackerPtr tracker, DispatchPtr dispatch, ControllerPtr controller)
      : mTracker(std::move(tracker)),
        mDispatch(std::move(dispatch)),
        mController(std::move(controller)) {}

VsyncSchedule::VsyncSchedule(VsyncSchedule&&) = default;
VsyncSchedule::~VsyncSchedule() = default;
```

- <https://cs.android.com/android/platform/superproject/+/refs/heads/master:external/libcxx/include/optional;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=0;bpt=1;l=820?hl=zh-cn>

### VSyncDispatchTimerQueue::registerCallback

```c++
adb logcat | findstr "VSyncDispatchTimerQueue::registerCallback"
- waiting for device -
#00 pc 00000000001d8f2f  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::registerCallback(std::__1::function<void (long, long, long)>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >)+95)
#01 pc 00000000001da38c  /system/bin/surfaceflinger (android::scheduler::VSyncCallbackRegistration::VSyncCallbackRegistration(android::scheduler::VSyncDispatch&, std::__1::function<void (long, long, long)>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >)+140)
#02 pc 00000000001be235  /system/bin/surfaceflinger (android::scheduler::DispSyncSource::DispSyncSource(android::scheduler::VSyncDispatch&, android::scheduler::VSyncTracker&, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, bool, char const*)+805)
#03 pc 00000000001d3c34  /system/bin/surfaceflinger (android::scheduler::Scheduler::createConnection(char const*, android::frametimeline::TokenManager*, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::function<void (long)>)+116)
#04 pc 00000000001f6eea  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+8842)
#05 pc 00000000001ea565  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#06 pc 00000000001e764f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#07 pc 00000000001ecb34  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#08 pc 000000000017be41  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#09 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#10 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#11 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#12 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#13 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#14 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#15 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#16 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#17 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#18 pc 0000000000175cb5  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#19 pc 0000000000183cf4  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#20 pc 00000000001e505d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#21 pc 0000000000237d04  /system/bin/surfaceflinger (main+1220)
#22 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

```c++
#00 pc 00000000001d8f2f  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::registerCallback(std::__1::function<void (long, long, long)>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >)+95)
#01 pc 00000000001da38c  /system/bin/surfaceflinger (android::scheduler::VSyncCallbackRegistration::VSyncCallbackRegistration(android::scheduler::VSyncDispatch&, std::__1::function<void (long, long, long)>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >)+140)
#02 pc 00000000001be235  /system/bin/surfaceflinger (android::scheduler::DispSyncSource::DispSyncSource(android::scheduler::VSyncDispatch&, android::scheduler::VSyncTracker&, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, bool, char const*)+805)
#03 pc 00000000001d3c34  /system/bin/surfaceflinger (android::scheduler::Scheduler::createConnection(char const*, android::frametimeline::TokenManager*, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::function<void (long)>)+116)
#04 pc 00000000001f6f5e  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+8958)
#05 pc 00000000001ea565  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#06 pc 00000000001e764f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#07 pc 00000000001ecb34  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#08 pc 000000000017be41  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#09 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#10 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#11 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#12 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#13 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#14 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#15 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#16 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#17 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#18 pc 0000000000175cb5  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#19 pc 0000000000183cf4  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#20 pc 00000000001e505d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#21 pc 0000000000237d04  /system/bin/surfaceflinger (main+1220)
#22 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)

```

```c++
#00 pc 00000000001d8f2f  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::registerCallback(std::__1::function<void (long, long, long)>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >)+95)
#01 pc 00000000001da38c  /system/bin/surfaceflinger (android::scheduler::VSyncCallbackRegistration::VSyncCallbackRegistration(android::scheduler::VSyncDispatch&, std::__1::function<void (long, long, long)>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char> >)+140)
#02 pc 00000000001ca4b9  /system/bin/surfaceflinger (android::impl::MessageQueue::initVsync(android::scheduler::VSyncDispatch&, android::frametimeline::TokenManager&, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+153)
#03 pc 00000000001f6fb7  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+9047)
#04 pc 00000000001ea565  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#05 pc 00000000001e764f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#06 pc 00000000001ecb34  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#07 pc 000000000017be41  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#08 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#09 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#10 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#11 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#12 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#13 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#14 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#15 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#16 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#17 pc 0000000000175cb5  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#18 pc 0000000000183cf4  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#19 pc 00000000001e505d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#20 pc 0000000000237d04  /system/bin/surfaceflinger (main+1220)
#21 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)

```

## Scheduler::addResyncSample && Scheduler::addPresentFence

### 帮我解释方法的作用

```
// Passes a vsync sample to VsyncController. periodFlushed will be true if
// VsyncController detected that the vsync period changed, and false otherwise.
void addResyncSample(nsecs_t timestamp, std::optional<nsecs_t> hwcVsyncPeriod,
                        bool* periodFlushed);
void addPresentFence(std::shared_ptr<FenceTime>);
```

ChatGPT

以下是关于这两个方法的解释：

addResyncSample 方法：

此方法用于将一个 vsync 样本传递给 VsyncController。Vsync（垂直同步）是一种用于防止屏幕撕裂现象（图像的一部分比其他部分更新得更快）的技术。在显示系统中，VsyncController 通常负责处理这种垂直同步。

方法参数：

timestamp：表示 vsync 事件的时间戳（以纳秒为单位）。
hwcVsyncPeriod：一个 std::optional 类型的参数，表示硬件组件（如显示控制器）提供的 vsync 周期（以纳秒为单位）。如果不提供硬件组件的 vsync 周期，这个值为 std::nullopt。
periodFlushed：一个指向布尔值的指针，用于返回方法执行后的状态。如果 VsyncController 检测到 vsync 周期发生变化，则返回 true；否则返回 false。

该方法的作用是将 vsync 样本信息传递给 VsyncController 进行处理。在处理过程中，VsyncController 可能会检测到 vsync 周期的变化。这个方法可以帮助显示系统了解何时需要调整 vsync 周期以实现更好的画面同步。

addPresentFence 方法：

此方法用于向类的实例添加一个 PresentFence。PresentFence 通常是一个同步原语，用于确保在显示设备的显示内容更新之前，所有相关的图形操作已经完成。

方法参数：

std::shared_ptr<FenceTime>：一个指向 FenceTime 对象的智能指针（shared_ptr），表示一个 PresentFence。

该方法的作用是将一个 PresentFence 添加到类的实例中，以便在需要时可以同步图形操作和显示设备的更新。这有助于确保画面的正确呈现，防止由于操作未完成而导致的画面撕裂等问题。

## SurfaceFlinger的VSYNC的分发逻辑

### VSyncDispatchTimerQueue::setTimer

```c++
frame #0: 0x00005abb741b9a7a surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(long, std::__1::__hash_map_iterator<std::__1::__hash_iterator<std::__1::__hash_node<std::__1::__hash_value_type<android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, std::__1::shared_ptr<android::scheduler::VSyncDispatchTimerQueueEntry> >, void*>*> > const&) [inlined] android::scheduler::VSyncDispatchTimerQueue::setTimer(this=0x000075f24c689140, targetTime=93240144574, (null)=<unavailable>) at VSyncDispatchTimerQueue.cpp:221:25
frame #1: 0x00005abb741b9a7a surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(this=0x000075f24c689140, now=93230497120, skipUpdateIt=<unavailable>) at VSyncDispatchTimerQueue.cpp:259:9
frame #2: 0x00005abb741ba922 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::schedule(this=0x000075f24c689140, token=<unavailable>, scheduleTiming=(workDuration = 16666666, readyDuration = 15666666, earliestVsync = 89739144714)) at VSyncDispatchTimerQueue.cpp:360:13
frame #3: 0x00005abb741bb04f surfaceflinger`android::scheduler::VSyncCallbackRegistration::schedule(this=<unavailable>, scheduleTiming=(workDuration = 16666666, readyDuration = 15666666, earliestVsync = 89739144714)) at VSyncDispatchTimerQueue.cpp:436:28
frame #4: 0x00005abb7419f2e0 surfaceflinger`android::scheduler::DispSyncSource::setVSyncEnabled(bool) [inlined] android::scheduler::CallbackRepeater::start(this=<unavailable>, workDuration=(__rep_ = 16666666), readyDuration=(__rep_ = 15666666)) at DispSyncSource.cpp:61:31
frame #5: 0x00005abb7419f288 surfaceflinger`android::scheduler::DispSyncSource::setVSyncEnabled(this=0x000075f28c68c430, enable=<unavailable>) at DispSyncSource.cpp:144:28
frame #6: 0x00005abb741a2d5c surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*) at EventThread.cpp:0
frame #7: 0x00005abb741a2d04 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*) [inlined] android::impl::EventThread::EventThread(this=0x000075f1dc689378)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1::operator()() const at EventThread.cpp:255:9
frame #8: 0x00005abb741a2ce4 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*) [inlined] decltype(__f=0x000075f1dc689378)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1>(fp)()) std::__1::__invoke<android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1>(android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1&&) at type_traits:4353:1
frame #9: 0x00005abb741a2ce4 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*) [inlined] void std::__1::__thread_execute<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1>(__t=size=2, (null)=<unavailable>)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1>&, std::__1::__tuple_indices<>) at thread:342:5
frame #10: 0x00005abb741a2ce4 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(__vp=0x000075f1dc689370) at thread:352:5
frame #11: 0x000075f45f56bd9b libc.so`__pthread_start(arg=0x000075f1c52cecf0) at pthread_create.cpp:364:18
frame #12: 0x000075f45f4ffd48 libc.so`::__start_thread(fn=(libc.so`__pthread_start(void*) at pthread_create.cpp:339), arg=0x000075f1c52cecf0)(void *), void *) at clone.cpp:53:16
```

这是一个调用栈，表示当前线程在代码中的执行路径。从最底层的 `frame #0` 到更高层的 `frame #10`，我们可以看到每个函数调用和它们在源代码中的位置。

1. `frame #0`：在 `VSyncDispatchTimerQueue.cpp` 的第 337 行，`android::scheduler::VSyncDispatchTimerQueue::schedule` 函数正在执行。它试图将已注册的回调安排在特定时间调度。
2. `frame #1`：在 `VSyncDispatchTimerQueue.cpp` 的第 436 行，`android::scheduler::VSyncCallbackRegistration::schedule` 函数调用了 `VSyncDispatchTimerQueue::schedule` 函数。
3. `frame #2` 和 `frame #3`：在 `DispSyncSource.cpp` 的第 144 行，`android::scheduler::DispSyncSource::setVSyncEnabled` 函数调用了 `android::scheduler::CallbackRepeater::start` 函数。
4. `frame #4` 到 `frame #8`：这些帧表示在 `EventThread.cpp` 文件中创建和运行一个新线程的过程。它是由 `std::__1::__thread_proxy` 与 `std::__1::__thread_execute` 等 C++ 标准库函数实现的。
5. `frame #9` 和 `frame #10`：这些帧表示在 Android libc 中启动新线程的底层实现。这里有 `__pthread_start` 和 `__start_thread` 这两个函数。

这个调用栈显示了 `surfaceflinger` 进程中与调度和 VSync（垂直同步）相关的函数调用。从调用栈中我们可以看到，这个线程正在尝试根据所提供的时间安排回调函数，并启用或禁用 VSync 功能。

### EventThread::onVSyncEvent

```c++
frame #0: 0x00005abb741a1dd8 surfaceflinger`android::impl::EventThread::onVSyncEvent(this=0x000075f29c696ed0, timestamp=1419890091508, vsyncData=(expectedPresentationTime = 1419922424840, deadlineTimestamp = 1419906758174)) at EventThread.cpp:394:38
frame #1: 0x00005abb7419f9d3 surfaceflinger`android::scheduler::CallbackRepeater::callback(long, long, long) [inlined] std::__1::__function::__value_func<void (long, long, long)>::operator(this=0x000075f25c68bb70, __args=0x000075f1c53cba70, __args=0x000075f1c53cba68, __args=0x000075f1c53cba60)(long&&, long&&, long&&) const at functional:1799:16
frame #2: 0x00005abb7419f9b1 surfaceflinger`android::scheduler::CallbackRepeater::callback(long, long, long) [inlined] std::__1::function<void (long, long, long)>::operator(this= Function = android::scheduler::DispSyncSource::onVsyncCallback(long, long, long) , __arg=1419922424840, __arg=1419890091508, __arg=1419906758174)(long, long, long) const at functional:2347:12
frame #3: 0x00005abb7419f9b1 surfaceflinger`android::scheduler::CallbackRepeater::callback(this=0x000075f25c68bb50, vsyncTime=1419922424840, wakeupTime=1419890091508, readyTime=1419906758174) at DispSyncSource.cpp:92:9
frame #4: 0x00005abb741b90db surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] std::__1::__function::__value_func<void (long, long, long)>::operator(this=0x000075f28c68d390, __args=0x000075f1c53cbb18, __args=0x000075f1c53cbb10, __args=0x000075f1c53cbb08)(long&&, long&&, long&&) const at functional:1799:16
frame #5: 0x00005abb741b90b9 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] std::__1::function<void (long, long, long)>::operator(this= Function = android::scheduler::CallbackRepeater::callback(long, long, long) , __arg=1419922424840, __arg=1419890091508, __arg=1419906758174)(long, long, long) const at functional:2347:12
frame #6: 0x00005abb741b90b9 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] android::scheduler::VSyncDispatchTimerQueueEntry::callback(this=0x000075f28c68d370, vsyncTimestamp=<unavailable>, wakeupTimestamp=1419890091508, deadlineTimestamp=1419906758174) at VSyncDispatchTimerQueue.cpp:163:5
frame #7: 0x00005abb741b9087 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback(this=<unavailable>) at VSyncDispatchTimerQueue.cpp:300:30
frame #8: 0x00005abb746512d2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] std::__1::__function::__value_func<void ()>::operator(this=0x000075f1c53cbc20)() const at functional:1799:16
frame #9: 0x00005abb746512bb surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] std::__1::function<void ()>::operator(this= Function = android::scheduler::VSyncDispatchTimerQueue::timerCallback() )() const at functional:2347:12
frame #10: 0x00005abb746512bb surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) at Timer.cpp:216:21
frame #11: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] android::scheduler::Timer::threadMain(this=0x000075f24c689560) at Timer.cpp:148:12
frame #12: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] android::scheduler::Timer::Timer(this=0x000075f1dc6890b8)::$_0::operator()() const at Timer.cpp:44:46
frame #13: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] decltype(__f=0x000075f1dc6890b8)::$_0>(fp)()) std::__1::__invoke<android::scheduler::Timer::Timer()::$_0>(android::scheduler::Timer::Timer()::$_0&&) at type_traits:4353:1
frame #14: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] void std::__1::__thread_execute<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0>(__t=size=2, (null)=<unavailable>)::$_0>&, std::__1::__tuple_indices<>) at thread:342:5
frame #15: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(__vp=0x000075f1dc6890b0) at thread:352:5
frame #16: 0x000075f45f56bd9b libc.so`__pthread_start(arg=0x000075f1c53cbcf0) at pthread_create.cpp:364:18
frame #17: 0x000075f45f4ffd48 libc.so`::__start_thread(fn=(libc.so`__pthread_start(void*) at pthread_create.cpp:339), arg=0x000075f1c53cbcf0)(void *), void *) at clone.cpp:53:16
```

这是一个调用栈，它显示了在 Android SurfaceFlinger 代码中的一系列函数调用。我们可以从下往上分析这个调用栈。

1. Frame #17 和 #16 是 `libc.so` 库中的线程启动函数。
2. Frame #15 和之前的 Frame 代表了一个线程实例的创建过程，执行 `std::__1::__thread_proxy` 函数，该函数负责执行线程函数 `android::scheduler::Timer::Timer()::$_0`。
3. Frame #11 - #14 是在 `android::scheduler::Timer` 类中创建一个新线程，并调用 `threadMain` 方法。在 Frame #12，可以看到 `Timer.cpp` 文件中的 148 行调用了这个方法。
4. Frame #7 是 `android::scheduler::VSyncDispatchTimerQueue` 类中的 `timerCallback` 方法，在 Frame #10 的调用过程中，这个方法被注册为线程的回调函数。
5. Frame #6 是在调用队列中的一个条目进行回调，这里的回调函数是在 Frame #5 中通过函数对象的操作符 (`operator()`) 调用的。
6. Frame #3 是在 `android::scheduler::CallbackRepeater` 类中执行一个名为 `callback` 的函数，该函数用于处理 VSync 事件并通知已注册的监听器。
7. Frame #1 和 #2 是一个 `std::__1::function` 的实例，用于执行 `android::scheduler::DispSyncSource::onVsyncCallback` 函数。
8. 最后，Frame #0 是 `android::impl::EventThread::onVSyncEvent` 方法，这是在 `EventThread.cpp` 文件中的 394 行被调用的。这个方法处理 VSync 事件，将它们分发到需要的 SurfaceFlinger 客户端。

从这个调用栈来看，我们可以看到该程序在处理一个 VSync 事件。VSync 是一个用于同步显示器刷新率和图形处理器输出的技术，以减少画面撕裂和卡顿。这个调用栈显示了 VSync 事件如何从底层库经过各种回调函数，最终在 `android::impl::EventThread::onVSyncEvent` 中进行处理。

### makeVSync

```c++
DisplayEventReceiver::Event makeVSync(PhysicalDisplayId displayId, nsecs_t timestamp,
                                      uint32_t count, nsecs_t expectedPresentationTime,
                                      nsecs_t deadlineTimestamp) {
    DisplayEventReceiver::Event event;
    event.header = {DisplayEventReceiver::DISPLAY_EVENT_VSYNC, displayId, timestamp};
    ......
    return event;
}
```

### MessageQueue::vsyncCallback

```c++
flinger`android::impl::MessageQueue::vsyncCallback(this=0x000075f2dc68ccf0, vsyncTime=2017572400934, targetWakeupTime=2017556734268, readyTime=2017572400934) at MessageQueue.cpp:103:28
  frame #1: 0x00005abb741b90db surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] std::__1::__function::__value_func<void (long, long, long)>::operator(this=0x000075f28c68d910, __args=0x000075f1c53cbb18, __args=0x000075f1c53cbb10, __args=0x000075f1c53cbb08)(long&&, long&&, long&&) const at functional:1799:16
  frame #2: 0x00005abb741b90b9 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] std::__1::function<void (long, long, long)>::operator(this= Function = android::impl::MessageQueue::vsyncCallback(long, long, long) , __arg=2017572400934, __arg=2017556734268, __arg=2017572400934)(long, long, long) const at functional:2347:12
  frame #3: 0x00005abb741b90b9 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] android::scheduler::VSyncDispatchTimerQueueEntry::callback(this=0x000075f28c68d8f0, vsyncTimestamp=<unavailable>, wakeupTimestamp=2017556734268, deadlineTimestamp=2017572400934) at VSyncDispatchTimerQueue.cpp:163:5
  frame #4: 0x00005abb741b9087 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback(this=<unavailable>) at VSyncDispatchTimerQueue.cpp:300:30
  frame #5: 0x00005abb746512d2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] std::__1::__function::__value_func<void ()>::operator(this=0x000075f1c53cbc20)() const at functional:1799:16
  frame #6: 0x00005abb746512bb surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] std::__1::function<void ()>::operator(this= Function = android::scheduler::VSyncDispatchTimerQueue::timerCallback() )() const at functional:2347:12
  frame #7: 0x00005abb746512bb surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) at Timer.cpp:216:21
  frame #8: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] android::scheduler::Timer::threadMain(this=0x000075f24c689560) at Timer.cpp:148:12
  frame #9: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] android::scheduler::Timer::Timer(this=0x000075f1dc6890b8)::$_0::operator()() const at Timer.cpp:44:46
  frame #10: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] decltype(__f=0x000075f1dc6890b8)::$_0>(fp)()) std::__1::__invoke<android::scheduler::Timer::Timer()::$_0>(android::scheduler::Timer::Timer()::$_0&&) at type_traits:4353:1
  frame #11: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] void std::__1::__thread_execute<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0>(__t=size=2, (null)=<unavailable>)::$_0>&, std::__1::__tuple_indices<>) at thread:342:5
  frame #12: 0x00005abb74650ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(__vp=0x000075f1dc6890b0) at thread:352:5
  frame #13: 0x000075f45f56bd9b libc.so`__pthread_start(arg=0x000075f1c53cbcf0) at pthread_create.cpp:364:18
  frame #14: 0x000075f45f4ffd48 libc.so`::__start_thread(fn=(libc.so`__pthread_start(void*) at pthread_create.cpp:339), arg=0x000075f1c53cbcf0)(void *), void *) at clone.cpp:53:16
```

这是一个调用栈（call stack），用于记录程序在特定时间点的函数调用情况。从上到下是各个栈帧（stack frame），每个栈帧表示一个函数调用，包括函数名、参数、源代码文件名和行号等信息。以下是对这个调用栈的分析：

1. 最底层（frame #14 和 frame #13）是 pthread 相关的代码，表明这是一个以多线程方式运行的程序，使用 POSIX 线程库。
2. frame #12 是 C++11 标准库的线程实现，`std::__1::__thread_proxy` 函数将 POSIX 线程调用转换为 C++ 标准库线程调用。
3. 接下来的几个栈帧（frame #11, frame #10, frame #9, 和 frame #8）与 `android::scheduler::Timer` 类相关。它们表示在这个类的一个实例中创建了一个新线程，并调用了一个成员函数 `threadMain`。
4. 在 frame #7 中，`android::scheduler::Timer` 类的实现被继续执行。它调用了一个名为 `timerCallback` 的成员函数。
5. frame #6 和 frame #5 是另一个 C++11 函数对象调用，这次它调用了 `android::scheduler::VSyncDispatchTimerQueue::timerCallback()` 函数。
6. 在 frame #4，`android::scheduler::VSyncDispatchTimerQueue::timerCallback()` 函数被调用。
7. 接下来的几个栈帧（frame #3, frame #2, 和 frame #1）涉及到 C++11 函数对象的调用。这些调用在 `android::scheduler::VSyncDispatchTimerQueueEntry` 类中，它执行了一个名为 `callback` 的成员函数。
8. 最后，在 frame #0 中，`android::impl::MessageQueue::vsyncCallback()` 函数被调用，它是一个与 Android SurfaceFlinger 相关的实现细节。

总结：这个调用栈描述了一个与 Android SurfaceFlinger（负责管理 Android 应用的屏幕显示内容）相关的多线程程序。从底层的线程创建到顶层的 `vsyncCallback()` 函数调用，反映了程序在处理屏幕刷新相关任务。

### dumpsys SurfaceFlinger

```text
VsyncDispatch:
        Timer:
                DebugState: Waiting
        mTimerSlack: 0.50ms mMinVsyncDistance: 3.00ms
        mIntendedWakeupTime: 9223372013568.00ms from now
        mLastTimerCallback: 16057.86ms ago mLastTimerSchedule: 16049.38ms ago
        Callbacks:
                sf:
                        workDuration: 15.67ms readyDuration: 0.00ms earliestVsync: -20259.13ms relative to now
                        mLastDispatchTime: 16059.13ms ago
                appSf:
                        workDuration: 16.67ms readyDuration: 15.67ms earliestVsync: -52892.46ms relative to now
                        mLastDispatchTime: 52892.46ms ago
                app:
                        workDuration: 16.67ms readyDuration: 15.67ms earliestVsync: -16025.80ms relative to now
                        mLastDispatchTime: 16025.80ms ago
```

## SurfaceFlinger与DisplayEventReceiver的通信通道

### DisplayEventReceiver建立与SurfaceFlinger通信通道

```c++
DisplayEventReceiver::DisplayEventReceiver(
        ISurfaceComposer::VsyncSource vsyncSource,
        ISurfaceComposer::EventRegistrationFlags eventRegistration) {
    sp<ISurfaceComposer> sf(ComposerService::getComposerService());
    if (sf != nullptr) {
        mEventConnection = sf->createDisplayEventConnection(vsyncSource, eventRegistration);
        if (mEventConnection != nullptr) {
            mDataChannel = std::make_unique<gui::BitTube>();
            const auto status = mEventConnection->stealReceiveChannel(mDataChannel.get());
            if (!status.isOk()) {
                ALOGE("stealReceiveChannel failed: %s", status.toString8().c_str());
                mInitError = std::make_optional<status_t>(status.transactionError());
                mDataChannel.reset();
                mEventConnection.clear();
            }
        }
    }
}
```

```c++
#00 pc 00000000001c08c4  /system/bin/surfaceflinger (android::impl::EventThread::createEventConnection(std::__1::function<void ()>, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>) const+100)
#01 pc 00000000001d40d6  /system/bin/surfaceflinger (android::scheduler::Scheduler::createConnection(std::__1::unique_ptr<android::EventThread, std::__1::default_delete<android::EventThread> >)+118)
#02 pc 00000000001d3fcf  /system/bin/surfaceflinger (android::scheduler::Scheduler::createConnection(char const*, android::frametimeline::TokenManager*, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::function<void (long)>)+671)
#03 pc 00000000001f701a  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+8842)
#04 pc 00000000001ea695  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#05 pc 00000000001e777f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#06 pc 00000000001ecc64  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#07 pc 000000000017be81  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#08 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#09 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#10 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#11 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#12 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#13 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#14 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#15 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#16 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#17 pc 0000000000175cf5  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#18 pc 0000000000183d34  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#19 pc 00000000001e518d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#20 pc 0000000000237e34  /system/bin/surfaceflinger (main+1220)
#21 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

```c++
#00 pc 00000000001c08c4  /system/bin/surfaceflinger (android::impl::EventThread::createEventConnection(std::__1::function<void ()>, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>) const+100)
#01 pc 00000000001d40d6  /system/bin/surfaceflinger (android::scheduler::Scheduler::createConnection(std::__1::unique_ptr<android::EventThread, std::__1::default_delete<android::EventThread> >)+118)
#02 pc 00000000001d3fcf  /system/bin/surfaceflinger (android::scheduler::Scheduler::createConnection(char const*, android::frametimeline::TokenManager*, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::function<void (long)>)+671)
#03 pc 00000000001f708e  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayAdded(android::wp<android::IBinder> const&, android::DisplayDeviceState const&)+8958)
#04 pc 00000000001ea695  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayChangesLocked()+3685)
#05 pc 00000000001e777f  /system/bin/surfaceflinger (android::SurfaceFlinger::processDisplayHotplugEventsLocked()+8559)
#06 pc 00000000001ecc64  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+436)
#07 pc 000000000017be81  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
#08 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
#09 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
#10 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#11 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#12 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
#13 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
#14 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
#15 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
#16 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
#17 pc 0000000000175cf5  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
#18 pc 0000000000183d34  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
#19 pc 00000000001e518d  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
#20 pc 0000000000237e34  /system/bin/surfaceflinger (main+1220)
#21 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

```c++
#00 pc 00000000001c08c4  /system/bin/surfaceflinger (android::impl::EventThread::createEventConnection(std::__1::function<void ()>, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>) const+100)
#01 pc 00000000001d4611  /system/bin/surfaceflinger (android::scheduler::Scheduler::createDisplayEventConnection(android::scheduler::ConnectionHandle, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>)+433)
#02 pc 00000000001ec0b0  /system/bin/surfaceflinger (android::SurfaceFlinger::createDisplayEventConnection(android::ISurfaceComposer::VsyncSource, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>)+64)
#03 pc 00000000000d6092  /system/lib64/libgui.so (android::BnSurfaceComposer::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+2562)
#04 pc 00000000002049c0  /system/bin/surfaceflinger (android::SurfaceFlinger::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+800)
#05 pc 00000000000586f0  /system/lib64/libbinder.so (android::BBinder::transact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+176)
#06 pc 0000000000063833  /system/lib64/libbinder.so (android::IPCThreadState::executeCommand(int)+1203)
#07 pc 00000000000632bd  /system/lib64/libbinder.so (android::IPCThreadState::getAndExecuteCommand()+157)
#08 pc 0000000000063c8f  /system/lib64/libbinder.so (android::IPCThreadState::joinThreadPool(bool)+63)
#09 pc 00000000000939e7  /system/lib64/libbinder.so (android::PoolThread::threadLoop()+23)
#10 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#11 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#12 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

```c++
binder::Status EventThreadConnection::stealReceiveChannel(gui::BitTube* outChannel) {
    std::scoped_lock lock(mLock);
    if (mChannel.initCheck() != NO_ERROR) {
        return binder::Status::fromStatusT(NAME_NOT_FOUND);
    }

    outChannel->setReceiveFd(mChannel.moveReceiveFd());
    outChannel->setSendFd(base::unique_fd(dup(mChannel.getSendFd())));
    return binder::Status::ok();
}
```

- <https://www.cnblogs.com/roger-yu/p/16158539.html>

### DisplayEventReceiver::sendEvents

```c++

#00 pc 00000000000c1715  /system/lib64/libgui.so (android::DisplayEventReceiver::sendEvents(android::gui::BitTube*, android::DisplayEventReceiver::Event const*, unsigned long)+85)
#01 pc 00000000001c010d  /system/bin/surfaceflinger (android::EventThreadConnection::postEvent(android::DisplayEventReceiver::Event const&)+109)
#02 pc 00000000001c2a29  /system/bin/surfaceflinger (void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*)+2585)
#03 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#04 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

```c++
void EventThread::onVSyncEvent(nsecs_t timestamp, VSyncSource::VSyncData vsyncData) {
    std::lock_guard<std::mutex> lock(mMutex);

    LOG_FATAL_IF(!mVSyncState);
    mPendingEvents.push_back(makeVSync(mVSyncState->displayId, timestamp, ++mVSyncState->count,
                                       vsyncData.expectedPresentationTime,
                                       vsyncData.deadlineTimestamp));
    mCondition.notify_all();
}

void EventThread::threadMain(std::unique_lock<std::mutex>& lock) {
    DisplayEventConsumers consumers;

    while (mState != State::Quit) {
        std::optional<DisplayEventReceiver::Event> event;

        // Determine next event to dispatch.
        if (!mPendingEvents.empty()) {
            event = mPendingEvents.front();
            mPendingEvents.pop_front();

            switch (event->header.type) {
                case DisplayEventReceiver::DISPLAY_EVENT_HOTPLUG:
                    if (event->hotplug.connected && !mVSyncState) {
                        mVSyncState.emplace(event->header.displayId);
                    } else if (!event->hotplug.connected && mVSyncState &&
                               mVSyncState->displayId == event->header.displayId) {
                        mVSyncState.reset();
                    }
                    break;

                case DisplayEventReceiver::DISPLAY_EVENT_VSYNC:
                    if (mInterceptVSyncsCallback) {
                        mInterceptVSyncsCallback(event->header.timestamp);
                    }
                    break;
            }
        }

        bool vsyncRequested = false;

        // Find connections that should consume this event.
        auto it = mDisplayEventConnections.begin();
        while (it != mDisplayEventConnections.end()) {
            if (const auto connection = it->promote()) {
                vsyncRequested |= connection->vsyncRequest != VSyncRequest::None;

                if (event && shouldConsumeEvent(*event, connection)) {
                    consumers.push_back(connection);
                }

                ++it;
            } else {
                it = mDisplayEventConnections.erase(it);
            }
        }

        if (!consumers.empty()) {
            dispatchEvent(*event, consumers);
            consumers.clear();
        }

        State nextState;
        if (mVSyncState && vsyncRequested) {
            nextState = mVSyncState->synthetic ? State::SyntheticVSync : State::VSync;
        } else {
            ALOGW_IF(!mVSyncState, "Ignoring VSYNC request while display is disconnected");
            nextState = State::Idle;
        }

        if (mState != nextState) {
            if (mState == State::VSync) {
                mVSyncSource->setVSyncEnabled(false);
            } else if (nextState == State::VSync) {
                mVSyncSource->setVSyncEnabled(true);
            }

            mState = nextState;
        }

        if (event) {
            continue;
        }

        // Wait for event or client registration/request.
        if (mState == State::Idle) {
            mCondition.wait(lock);
        } else {
            // Generate a fake VSYNC after a long timeout in case the driver stalls. When the
            // display is off, keep feeding clients at 60 Hz.
            const std::chrono::nanoseconds timeout =
                    mState == State::SyntheticVSync ? 16ms : 1000ms;
            if (mCondition.wait_for(lock, timeout) == std::cv_status::timeout) {
                if (mState == State::VSync) {
                    ALOGW("Faking VSYNC due to driver stall for thread %s", mThreadName);
                    std::string debugInfo = "VsyncSource debug info:\n";
                    mVSyncSource->dump(debugInfo);
                    // Log the debug info line-by-line to avoid logcat overflow
                    auto pos = debugInfo.find('\n');
                    while (pos != std::string::npos) {
                        ALOGW("%s", debugInfo.substr(0, pos).c_str());
                        debugInfo = debugInfo.substr(pos + 1);
                        pos = debugInfo.find('\n');
                    }
                }

                LOG_FATAL_IF(!mVSyncState);
                const auto now = systemTime(SYSTEM_TIME_MONOTONIC);
                const auto deadlineTimestamp = now + timeout.count();
                const auto expectedVSyncTime = deadlineTimestamp + timeout.count();
                mPendingEvents.push_back(makeVSync(mVSyncState->displayId, now,
                                                   ++mVSyncState->count, expectedVSyncTime,
                                                   deadlineTimestamp));
            }
        }
    }
}

bool EventThread::shouldConsumeEvent(const DisplayEventReceiver::Event& event,
                                     const sp<EventThreadConnection>& connection) const {
    const auto throttleVsync = [&] {
        return mThrottleVsyncCallback &&
                mThrottleVsyncCallback(event.vsync.vsyncData.preferredExpectedPresentationTime(),
                                       connection->mOwnerUid);
    };

    switch (event.header.type) {
        case DisplayEventReceiver::DISPLAY_EVENT_HOTPLUG:
            return true;

        case DisplayEventReceiver::DISPLAY_EVENT_MODE_CHANGE: {
            return connection->mEventRegistration.test(
                    ISurfaceComposer::EventRegistration::modeChanged);
        }

        // VSYNC事件
        case DisplayEventReceiver::DISPLAY_EVENT_VSYNC:
            switch (connection->vsyncRequest) {

                // rate==0，不分发
                case VSyncRequest::None:
                    return false;

                // requestNextVsync 有请求时case
                case VSyncRequest::SingleSuppressCallback:
                    connection->vsyncRequest = VSyncRequest::None;
                    return false;

                // requestNextVsync 有请求时case
                case VSyncRequest::Single: {
                    if (throttleVsync()) {
                        return false;
                    }
                    connection->vsyncRequest = VSyncRequest::SingleSuppressCallback;
                    return true;
                }
                case VSyncRequest::Periodic:
                    if (throttleVsync()) {
                        return false;
                    }
                    return true;
                default:
                    // We don't throttle vsync if the app set a vsync request rate
                    // since there is no easy way to do that and this is a very
                    // rare case
                    // 根据setVsyncRate设置分发的频率，周期性的计数，每connection->vsyncRequest个分发一个
                    return event.vsync.count % vsyncPeriod(connection->vsyncRequest) == 0;
            }

        case DisplayEventReceiver::DISPLAY_EVENT_FRAME_RATE_OVERRIDE:
            [[fallthrough]];
        case DisplayEventReceiver::DISPLAY_EVENT_FRAME_RATE_OVERRIDE_FLUSH:
            return connection->mEventRegistration.test(
                    ISurfaceComposer::EventRegistration::frameRateOverride);

        default:
            return false;
    }
}

void EventThread::dispatchEvent(const DisplayEventReceiver::Event& event,
                                const DisplayEventConsumers& consumers) {
    for (const auto& consumer : consumers) {
        DisplayEventReceiver::Event copy = event;
        if (event.header.type == DisplayEventReceiver::DISPLAY_EVENT_VSYNC) {
            const int64_t frameInterval = mGetVsyncPeriodFunction(consumer->mOwnerUid);
            copy.vsync.vsyncData.frameInterval = frameInterval;
            generateFrameTimeline(copy.vsync.vsyncData, frameInterval, copy.header.timestamp,
                                  event.vsync.vsyncData.preferredExpectedPresentationTime(),
                                  event.vsync.vsyncData.preferredDeadlineTimestamp());
        }
        switch (consumer->postEvent(copy)) {
            case NO_ERROR:
                break;

            case -EAGAIN:
                // TODO: Try again if pipe is full.
                ALOGW("Failed dispatching %s for %s", toString(event).c_str(),
                      toString(*consumer).c_str());
                break;

            default:
                // Treat EPIPE and other errors as fatal.
                removeDisplayEventConnectionLocked(consumer);
        }
    }
}

```

- <https://www.cnblogs.com/roger-yu/p/16167404.html>

## SurfaceFlinger的合成过程

### SurfaceFlinger::composite

```c++
#00 pc 00000000001f1d32  /system/bin/surfaceflinger (android::SurfaceFlinger::composite(long, long)+130)
#01 pc 00000000001ca168  /system/bin/surfaceflinger (android::impl::MessageQueue::Handler::handleMessage(android::Message const&)+72)
#02 pc 00000000000184af  /system/lib64/libutils.so (android::Looper::pollInner(int)+447)
#03 pc 000000000001828e  /system/lib64/libutils.so (android::Looper::pollOnce(int, int*, int*, void**)+110)
#04 pc 00000000001ca841  /system/bin/surfaceflinger (android::impl::MessageQueue::waitMessage()+97)
#05 pc 00000000001d3b58  /system/bin/surfaceflinger (android::scheduler::Scheduler::run()+104)
#06 pc 000000000023824a  /system/bin/surfaceflinger (main+2090)
```

```c++
void MessageQueue::scheduleFrame() {
    ATRACE_CALL();

    {
        std::lock_guard lock(mInjector.mutex);
        if (CC_UNLIKELY(mInjector.connection)) {
            ALOGD("%s while injecting VSYNC", __FUNCTION__);
            mInjector.connection->requestNextVsync();
            return;
        }
    }

    std::lock_guard lock(mVsync.mutex);
    mVsync.scheduledFrameTime =
            mVsync.registration->schedule({.workDuration = mVsync.workDuration.get().count(),
                                           .readyDuration = 0,
                                           .earliestVsync = mVsync.lastCallbackTime.count()});
}
```

```c++

/*
* 调度已注册的回调以便派发。
*
* 回调将在一个 vsync 事件前 'workDuration + readyDuration' 纳秒被派发。
*
* 调用者通过 earliestVsync 参数指定应被目标化的最早的 vsync 事件。
* 回调将在 (workDuration + readyDuration - predictedVsync) 时被调度，其中
* predictedVsync 是第一个满足 ( predictedVsync >= earliestVsync ) 的 vsync 事件时间。
*
* 如果 (workDuration + readyDuration - earliestVsync) 已经过去，或者如果一个回调已经
* 被派发给预测的vsync，那么将返回一个错误。
*
* 重新调度一个回调到不同的时间是有效的。
*
* \param [in] token           要调度的回调。
* \param [in] scheduleTiming  这次调度调用的时间信息
* \return                     如果调度了一个回调，返回预期的回调时间。
*                             如果回调没有被注册，返回 std::nullopt。
*/

/*
* Schedules the registered callback to be dispatched.
*
* The callback will be dispatched at 'workDuration + readyDuration' nanoseconds before a vsync
* event.
*
* The caller designates the earliest vsync event that should be targeted by the earliestVsync
* parameter.
* The callback will be scheduled at (workDuration + readyDuration - predictedVsync), where
* predictedVsync is the first vsync event time where ( predictedVsync >= earliestVsync ).
*
* If (workDuration + readyDuration - earliestVsync) is in the past, or if a callback has
* already been dispatched for the predictedVsync, an error will be returned.
*
* It is valid to reschedule a callback to a different time.
*
* \param [in] token           The callback to schedule.
* \param [in] scheduleTiming  The timing information for this schedule call
* \return                     The expected callback time if a callback was scheduled.
*                             std::nullopt if the callback is not registered.
*/
virtual ScheduleResult VSyncDispatch::schedule(CallbackToken token, ScheduleTiming scheduleTiming) = 0;

ScheduleResult VSyncDispatchTimerQueue::schedule(CallbackToken token,
                                                 ScheduleTiming scheduleTiming) {
    ScheduleResult result;
    {
        std::lock_guard lock(mMutex);

        auto it = mCallbacks.find(token);
        if (it == mCallbacks.end()) {
            return result;
        }
        auto& callback = it->second;
        auto const now = mTimeKeeper->now();

        /* If the timer thread will run soon, we'll apply this work update via the callback
         * timer recalculation to avoid cancelling a callback that is about to fire. */
        auto const rearmImminent = now > mIntendedWakeupTime;
        if (CC_UNLIKELY(rearmImminent)) {
            callback->addPendingWorkloadUpdate(scheduleTiming);
            return getExpectedCallbackTime(mTracker, now, scheduleTiming);
        }

        result = callback->schedule(scheduleTiming, mTracker, now);
        if (!result.has_value()) {
            return result;
        }

        if (callback->wakeupTime() < mIntendedWakeupTime - mTimerSlack) {
            rearmTimerSkippingUpdateFor(now, it);
        }
    }

    return result;
}

void MessageQueue::Handler::dispatchFrame(int64_t vsyncId, nsecs_t expectedVsyncTime) {
    if (!mFramePending.exchange(true)) {
        mVsyncId = vsyncId;
        mExpectedVsyncTime = expectedVsyncTime;
        mQueue.mLooper->sendMessage(this, Message());
    }
}

void MessageQueue::Handler::handleMessage(const Message&) {
    mFramePending.store(false);

    const nsecs_t frameTime = systemTime();
    auto& compositor = mQueue.mCompositor;

    if (!compositor.commit(frameTime, mVsyncId, mExpectedVsyncTime)) {
        return;
    }

    compositor.composite(frameTime, mVsyncId);
    compositor.sample();
}

void SurfaceFlinger::composite(nsecs_t frameTime, int64_t vsyncId)
    ....
}
```

## SurfaceFlinger的VSYNC驱动过程

### SurfaceFlinger::onComposerHalVsync

```c++
#00 pc 00000000001ec885  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalVsync(unsigned long, long, std::__1::optional<unsigned int>)+1349)
#01 pc 000000000017bffd  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onVsync_2_4(unsigned long, long, unsigned int) (.deab6692cfb85990cee799751e050a31)+45)
#02 pc 0000000000037aa2  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::_hidl_onVsync_2_4(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+290)
#03 pc 0000000000038660  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+800)
#04 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#05 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#06 pc 000000000009f345  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::getAndExecuteCommand()+229)
#07 pc 00000000000a093f  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::joinThreadPool(bool)+191)
#08 pc 00000000000ac0b7  /system/lib64/libhidlbase.so (android::hardware::PoolThread::threadLoop()+23)
#09 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#10 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#11 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

### SurfaceFlinger::setVsyncEnabled

```c++
#00 pc 00000000001ed1bf  /system/bin/surfaceflinger (android::SurfaceFlinger::setVsyncEnabled(bool)+95)
#01 pc 00000000001d5f53  /system/bin/surfaceflinger (android::scheduler::Scheduler::addResyncSample(long, std::__1::optional<long>, bool*)+195)
#02 pc 00000000001eca05  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalVsync(unsigned long, long, std::__1::optional<unsigned int>)+1413)
#03 pc 000000000017c05d  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onVsync_2_4(unsigned long, long, unsigned int) (.deab6692cfb85990cee799751e050a31)+45)
#04 pc 0000000000037aa2  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::_hidl_onVsync_2_4(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+290)
#05 pc 0000000000038660  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+800)
#06 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
#07 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
#08 pc 000000000009f345  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::getAndExecuteCommand()+229)
#09 pc 00000000000a093f  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::joinThreadPool(bool)+191)
#10 pc 00000000000ac0b7  /system/lib64/libhidlbase.so (android::hardware::PoolThread::threadLoop()+23)
#11 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#12 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#13 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

```c++
#00 pc 00000000001ed1bf  /system/bin/surfaceflinger (android::SurfaceFlinger::setVsyncEnabled(bool)+95)
#01 pc 00000000001d7e29  /system/bin/surfaceflinger (std::__1::__function::__func<android::scheduler::Scheduler::createConnectionInternal(android::EventThread*, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>)::$_10, std::__1::allocator<android::scheduler::Scheduler::createConnectionInternal(android::EventThread*, android::ftl::Flags<android::ISurfaceComposer::EventRegistration>)::$_10>, void ()>::operator()() (.9d08481b168e3390578a518ebb5bac7d)+265)
#02 pc 00000000001c0f7c  /system/bin/surfaceflinger (android::impl::EventThread::requestNextVsync(android::sp<android::EventThreadConnection> const&)+28)
#03 pc 00000000001c007b  /system/bin/surfaceflinger (android::EventThreadConnection::requestNextVsync()+107)
#04 pc 0000000000282381  /system/bin/surfaceflinger (android::gui::BnDisplayEventConnection::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+209)
#05 pc 00000000000586f0  /system/lib64/libbinder.so (android::BBinder::transact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+176)
#06 pc 0000000000063833  /system/lib64/libbinder.so (android::IPCThreadState::executeCommand(int)+1203)
#07 pc 00000000000632bd  /system/lib64/libbinder.so (android::IPCThreadState::getAndExecuteCommand()+157)
#08 pc 0000000000063c8f  /system/lib64/libbinder.so (android::IPCThreadState::joinThreadPool(bool)+63)
#09 pc 00000000000939e7  /system/lib64/libbinder.so (android::PoolThread::threadLoop()+23)
#10 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#11 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#12 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

```c++
#00 pc 00000000001ed1bf  /system/bin/surfaceflinger (android::SurfaceFlinger::setVsyncEnabled(bool)+95)
#01 pc 00000000001d6036  /system/bin/surfaceflinger (android::scheduler::Scheduler::addPresentFence(std::__1::shared_ptr<android::FenceTime>)+182)
#02 pc 00000000001f3ea3  /system/bin/surfaceflinger (android::SurfaceFlinger::composite(long, long)+8083)
#03 pc 00000000001ca288  /system/bin/surfaceflinger (android::impl::MessageQueue::Handler::handleMessage(android::Message const&)+72)
#04 pc 00000000000184af  /system/lib64/libutils.so (android::Looper::pollInner(int)+447)
#05 pc 000000000001828e  /system/lib64/libutils.so (android::Looper::pollOnce(int, int*, int*, void**)+110)
#06 pc 00000000001ca961  /system/bin/surfaceflinger (android::impl::MessageQueue::waitMessage()+97)
#07 pc 00000000001d3c78  /system/bin/surfaceflinger (android::scheduler::Scheduler::run()+104)
#08 pc 000000000023849a  /system/bin/surfaceflinger (main+2090)
#09 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

### MessageQueue::scheduleFrame

```c++

#00 pc 00000000001caae9  /system/bin/surfaceflinger (android::impl::MessageQueue::scheduleFrame()+89)
#01 pc 00000000001e482d  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionFlags(unsigned int, android::scheduler::TransactionSchedule, android::sp<android::IBinder> const&, android::SurfaceFlinger::FrameHint)+493)
#02 pc 00000000001fdab1  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionState(android::FrameTimelineInfo const&, android::Vector<android::ComposerState> const&, android::Vector<android::DisplayState> const&, unsigned int, android::sp<android::IBinder> const&, android::InputWindowCommands const&, long, bool, android::client_cache_t const&, bool, std::__1::vector<android::ListenerCallbacks, std::__1::allocator<android::ListenerCallbacks> > const&, unsigned long)+2033)
#03 pc 00000000000d8819  /system/lib64/libgui.so (android::BnSurfaceComposer::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+11849)
#04 pc 0000000000204dc0  /system/bin/surfaceflinger (android::SurfaceFlinger::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+800)
#05 pc 00000000000586f0  /system/lib64/libbinder.so (android::BBinder::transact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+176)
#06 pc 0000000000063833  /system/lib64/libbinder.so (android::IPCThreadState::executeCommand(int)+1203)
#07 pc 00000000000632bd  /system/lib64/libbinder.so (android::IPCThreadState::getAndExecuteCommand()+157)
#08 pc 0000000000063c8f  /system/lib64/libbinder.so (android::IPCThreadState::joinThreadPool(bool)+63)
#09 pc 00000000000939e7  /system/lib64/libbinder.so (android::PoolThread::threadLoop()+23)
#10 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#11 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#12 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

```c++
#00 pc 00000000001caae9  /system/bin/surfaceflinger (android::impl::MessageQueue::scheduleFrame()+89)
#01 pc 00000000001e482d  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionFlags(unsigned int, android::scheduler::TransactionSchedule, android::sp<android::IBinder> const&, android::SurfaceFlinger::FrameHint)+493)
#02 pc 00000000001fa443  /system/bin/surfaceflinger (android::SurfaceFlinger::flushPendingTransactionQueues(std::__1::vector<android::TransactionState, std::__1::allocator<android::TransactionState> >&, std::__1::unordered_map<android::sp<android::IBinder>, unsigned long, android::gui::SpHash<android::IBinder>, std::__1::equal_to<android::sp<android::IBinder> >, std::__1::allocator<std::__1::pair<android::sp<android::IBinder> const, unsigned long> > >&, std::__1::unordered_set<android::sp<android::IBinder>, android::gui::SpHash<android::IBinder>, std::__1::equal_to<android::sp<android::IBinder> >, std::__1::allocator<android::sp<android::IBinder> > >&, bool)+931)
#03 pc 00000000001eebea  /system/bin/surfaceflinger (android::SurfaceFlinger::commit(long, long, long)+5978)
#04 pc 00000000001ca2c4  /system/bin/surfaceflinger (android::impl::MessageQueue::Handler::handleMessage(android::Message const&)+52)
#05 pc 00000000000184af  /system/lib64/libutils.so (android::Looper::pollInner(int)+447)
#06 pc 000000000001828e  /system/lib64/libutils.so (android::Looper::pollOnce(int, int*, int*, void**)+110)
#07 pc 00000000001caa11  /system/bin/surfaceflinger (android::impl::MessageQueue::waitMessage()+97)
#08 pc 00000000001d3d78  /system/bin/surfaceflinger (android::scheduler::Scheduler::run()+104)
#09 pc 000000000023859a  /system/bin/surfaceflinger (main+2090)
#10 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)


```

```c++
#00 pc 00000000001caae9  /system/bin/surfaceflinger (android::impl::MessageQueue::scheduleFrame()+89)
#01 pc 00000000001eda80  /system/bin/surfaceflinger (android::SurfaceFlinger::commit(long, long, long)+1520)
#02 pc 00000000001ca2c4  /system/bin/surfaceflinger (android::impl::MessageQueue::Handler::handleMessage(android::Message const&)+52)
#03 pc 00000000000184af  /system/lib64/libutils.so (android::Looper::pollInner(int)+447)
#04 pc 000000000001828e  /system/lib64/libutils.so (android::Looper::pollOnce(int, int*, int*, void**)+110)
#05 pc 00000000001caa11  /system/bin/surfaceflinger (android::impl::MessageQueue::waitMessage()+97)
#06 pc 00000000001d3d78  /system/bin/surfaceflinger (android::scheduler::Scheduler::run()+104)
#07 pc 000000000023859a  /system/bin/surfaceflinger (main+2090)
#08 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```

### CallbackRepeater::start

```bash
adb logcat | findstr "CallbackRepeater::start"

lunch sdk_phone_x86_64-eng && m -j32

emulator.exe -avd biezhihua_aosp  -system "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\system-qemu.img" -data "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\userdata.img" -writable-system -show-kernel -skip-adb-auth -wipe-data
```

```c++
#00 pc 00000000001be69f  /system/bin/surfaceflinger (android::scheduler::CallbackRepeater::start(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+175)
#01 pc 00000000001be7af  /system/bin/surfaceflinger (android::scheduler::DispSyncSource::setDuration(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+111)
#02 pc 00000000001c088f  /system/bin/surfaceflinger (android::impl::EventThread::setDuration(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+47)
#03 pc 00000000001d5939  /system/bin/surfaceflinger (android::scheduler::Scheduler::setDuration(android::scheduler::ConnectionHandle, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+393)
#04 pc 00000000001e454c  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionFlags(unsigned int, android::scheduler::TransactionSchedule, android::sp<android::IBinder> const&, android::SurfaceFlinger::FrameHint)+284)
#05 pc 00000000001fd771  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionState(android::FrameTimelineInfo const&, android::Vector<android::ComposerState> const&, android::Vector<android::DisplayState> const&, unsigned int, android::sp<android::IBinder> const&, android::InputWindowCommands const&, long, bool, android::client_cache_t const&, bool, std::__1::vector<android::ListenerCallbacks, std::__1::allocator<android::ListenerCallbacks> > const&, unsigned long)+2033)
#06 pc 00000000000d8819  /system/lib64/libgui.so (android::BnSurfaceComposer::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+11849)
#07 pc 0000000000204a80  /system/bin/surfaceflinger (android::SurfaceFlinger::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+800)
#08 pc 00000000000586f0  /system/lib64/libbinder.so (android::BBinder::transact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+176)
#09 pc 0000000000063833  /system/lib64/libbinder.so (android::IPCThreadState::executeCommand(int)+1203)
#10 pc 00000000000632bd  /system/lib64/libbinder.so (android::IPCThreadState::getAndExecuteCommand()+157)
#11 pc 0000000000063c8f  /system/lib64/libbinder.so (android::IPCThreadState::joinThreadPool(bool)+63)
#12 pc 00000000000939e7  /system/lib64/libbinder.so (android::PoolThread::threadLoop()+23)
#13 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#14 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#15 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

```c++
#00 pc 00000000001be69f  /system/bin/surfaceflinger (android::scheduler::CallbackRepeater::start(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+175)
#01 pc 00000000001be7af  /system/bin/surfaceflinger (android::scheduler::DispSyncSource::setDuration(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+111)
#02 pc 00000000001c088f  /system/bin/surfaceflinger (android::impl::EventThread::setDuration(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+47)
#03 pc 00000000001d5939  /system/bin/surfaceflinger (android::scheduler::Scheduler::setDuration(android::scheduler::ConnectionHandle, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+393)
#04 pc 00000000001f4219  /system/bin/surfaceflinger (android::SurfaceFlinger::composite(long, long)+9561)
#05 pc 00000000001ca178  /system/bin/surfaceflinger (android::impl::MessageQueue::Handler::handleMessage(android::Message const&)+72)
#06 pc 00000000000184af  /system/lib64/libutils.so (android::Looper::pollInner(int)+447)
#07 pc 000000000001828e  /system/lib64/libutils.so (android::Looper::pollOnce(int, int*, int*, void**)+110)
#08 pc 00000000001ca851  /system/bin/surfaceflinger (android::impl::MessageQueue::waitMessage()+97)
#09 pc 00000000001d3b68  /system/bin/surfaceflinger (android::scheduler::Scheduler::run()+104)
#10 pc 000000000023825a  /system/bin/surfaceflinger (main+2090)
#11 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)

```

```c++
#00 pc 00000000001be69f  /system/bin/surfaceflinger (android::scheduler::CallbackRepeater::start(std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >, std::__1::chrono::duration<long long, std::__1::ratio<1l, 1000000000l> >)+175)
#01 pc 00000000001be57b  /system/bin/surfaceflinger (android::scheduler::DispSyncSource::setVSyncEnabled(bool)+59)
#02 pc 00000000001c211b  /system/bin/surfaceflinger (void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*)+187)
#03 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#04 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

## VSYNC::Perfetto

```c++
onComposerHalVsync(16666666)
HIDL::IComposerCallback::onVsync_2_4::server 
HIDL::IComposerCallback::onVsync_2_4::client
```

![](/learn-android/aosp/vsync_perfetto.png)

## Reference

- <https://www.androidperformance.com/2019/12/01/Android-Systrace-Vsync/#/%E4%B8%8D%E4%BD%BF%E7%94%A8HW-VSYNC>
- <https://source.android.google.cn/docs/core/graphics?authuser=0#android-graphics-components>
- <https://source.android.com/docs/core/graphics/implement-vsync?hl=zh-cn>
- <https://juejin.cn/post/7081614840606785550>
- <https://www.jianshu.com/p/304f56f5d486>
- <https://blog.csdn.net/Android062005/article/details/123090139>
- <https://android-developers.googleblog.com/2020/04/high-refresh-rate-rendering-on-android.html>
- <https://utzcoz.github.io/2020/05/02/Analyze-AOSP-vsync-model.html>
- <https://utzcoz.github.io/2020/04/29/Print-call-stack-in-AOSP-native-code.html>
- <https://www.cnblogs.com/roger-yu/p/16230337.html>
- <https://www.cnblogs.com/roger-yu/p/16162940.html>
- <https://www.cnblogs.com/roger-yu/p/16162940.html>
- <https://www.cnblogs.com/roger-yu/p/15761646.html>
- <https://www.cnblogs.com/roger-yu/p/16075956.html>
- <https://www.cnblogs.com/roger-yu/p/15641545.html>
- <https://www.cnblogs.com/roger-yu/p/16122236.html>
- <https://www.cnblogs.com/roger-yu/p/15596840.html>
- <https://juejin.cn/post/7166061140298956836>
- <https://www.jianshu.com/p/5e9c558d1543>
