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

## SurfaceFlinger的VSYNC的分发逻辑

### VSyncDispatchTimerQueue::setTimer

```c++
#00 pc 00000000001d8da6  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(long, std::__1::__hash_map_iterator<std::__1::__hash_iterator<std::__1::__hash_node<std::__1::__hash_value_type<android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, std::__1::shared_ptr<android::scheduler::VSyncDispatchTimerQueueEntry> >, void*>*> > const&)+2310)
#01 pc 00000000001d9cd1  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::schedule(android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, android::scheduler::VSyncDispatch::ScheduleTiming)+657)
#02 pc 00000000001da3fe  /system/bin/surfaceflinger (android::scheduler::VSyncCallbackRegistration::schedule(android::scheduler::VSyncDispatch::ScheduleTiming)+46)
#03 pc 00000000001be52f  /system/bin/surfaceflinger (android::scheduler::DispSyncSource::setVSyncEnabled(bool)+159)
#04 pc 00000000001c1fab  /system/bin/surfaceflinger (void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::impl::EventThread::EventThread(std::__1::unique_ptr<android::VSyncSource, std::__1::default_delete<android::VSyncSource> >, android::frametimeline::TokenManager*, std::__1::function<void (long)>, std::__1::function<bool (long, unsigned int)>, std::__1::function<long (unsigned int)>)::$_1> >(void*)+187)
#05 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#06 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)

```

```c++
#00 pc 00000000001d8da6  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(long, std::__1::__hash_map_iterator<std::__1::__hash_iterator<std::__1::__hash_node<std::__1::__hash_value_type<android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, std::__1::shared_ptr<android::scheduler::VSyncDispatchTimerQueueEntry> >, void*>*> > const&)+2310)
#01 pc 00000000001d9cd1  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::schedule(android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, android::scheduler::VSyncDispatch::ScheduleTiming)+657)
#02 pc 00000000001da3fe  /system/bin/surfaceflinger (android::scheduler::VSyncCallbackRegistration::schedule(android::scheduler::VSyncDispatch::ScheduleTiming)+46)
#03 pc 00000000001bec63  /system/bin/surfaceflinger (android::scheduler::CallbackRepeater::callback(long, long, long)+179)
#04 pc 00000000001d83ca  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::timerCallback()+986)
#05 pc 00000000006707d1  /system/bin/surfaceflinger (void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*)+833)
#06 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#07 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)

```

```c++
#00 pc 00000000001d8da6  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(long, std::__1::__hash_map_iterator<std::__1::__hash_iterator<std::__1::__hash_node<std::__1::__hash_value_type<android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, std::__1::shared_ptr<android::scheduler::VSyncDispatchTimerQueueEntry> >, void*>*> > const&)+2310)
#01 pc 00000000001d9cd1  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::schedule(android::StrongTyping<unsigned long, android::scheduler::CallbackTokenTag, android::Compare, android::Hash>, android::scheduler::VSyncDispatch::ScheduleTiming)+657)
#02 pc 00000000001da3fe  /system/bin/surfaceflinger (android::scheduler::VSyncCallbackRegistration::schedule(android::scheduler::VSyncDispatch::ScheduleTiming)+46)
#03 pc 00000000001ca7a2  /system/bin/surfaceflinger (android::impl::MessageQueue::scheduleFrame()+146)
#04 pc 00000000001e43fd  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionFlags(unsigned int, android::scheduler::TransactionSchedule, android::sp<android::IBinder> const&, android::SurfaceFlinger::FrameHint)+397)
#05 pc 00000000001fd541  /system/bin/surfaceflinger (android::SurfaceFlinger::setTransactionState(android::FrameTimelineInfo const&, android::Vector<android::ComposerState> const&, android::Vector<android::DisplayState> const&, unsigned int, android::sp<android::IBinder> const&, android::InputWindowCommands const&, long, bool, android::client_cache_t const&, bool, std::__1::vector<android::ListenerCallbacks, std::__1::allocator<android::ListenerCallbacks> > const&, unsigned long)+2033)
#06 pc 00000000000d84d9  /system/lib64/libgui.so (android::BnSurfaceComposer::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+11849)
#07 pc 0000000000204850  /system/bin/surfaceflinger (android::SurfaceFlinger::onTransact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+800)
#08 pc 00000000000586f0  /system/lib64/libbinder.so (android::BBinder::transact(unsigned int, android::Parcel const&, android::Parcel*, unsigned int)+176)
#09 pc 0000000000063833  /system/lib64/libbinder.so (android::IPCThreadState::executeCommand(int)+1203)
#10 pc 00000000000632bd  /system/lib64/libbinder.so (android::IPCThreadState::getAndExecuteCommand()+157)
#11 pc 0000000000063c8f  /system/lib64/libbinder.so (android::IPCThreadState::joinThreadPool(bool)+63)
#12 pc 00000000000939e7  /system/lib64/libbinder.so (android::PoolThread::threadLoop()+23)
#13 pc 0000000000013e55  /system/lib64/libutils.so (android::Thread::_threadLoop(void*)+325)
#14 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#15 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

### DispSyncSource

```c++
DispSyncSource::DispSyncSource(VSyncDispatch& vSyncDispatch, VSyncTracker& vSyncTracker,
                               std::chrono::nanoseconds workDuration,
                               std::chrono::nanoseconds readyDuration, bool traceVsync,
                               const char* name)
      : mName(name),
        mValue(base::StringPrintf("VSYNC-%s", name), 0),
        mTraceVsync(traceVsync),
        mVsyncOnLabel(base::StringPrintf("VsyncOn-%s", name)),
        mVSyncTracker(vSyncTracker),
        mWorkDuration(base::StringPrintf("VsyncWorkDuration-%s", name), workDuration),
        mReadyDuration(readyDuration) {
    mCallbackRepeater =
            std::make_unique<CallbackRepeater>(vSyncDispatch,
                                               std::bind(&DispSyncSource::onVsyncCallback, this,
                                                         std::placeholders::_1,
                                                         std::placeholders::_2,
                                                         std::placeholders::_3),
                                               name, workDuration, readyDuration,
                                               std::chrono::steady_clock::now().time_since_epoch());
}
```

```c++
CallbackRepeater::CallbackRepeater(VSyncDispatch& dispatch, VSyncDispatch::Callback cb, const char* name,
                    std::chrono::nanoseconds workDuration, std::chrono::nanoseconds readyDuration,
                    std::chrono::nanoseconds notBefore)
        : mName(name),
        mCallback(cb),
        mRegistration(dispatch,
                        std::bind(&CallbackRepeater::callback, this, std::placeholders::_1,
                                std::placeholders::_2, std::placeholders::_3),
                        mName),
        mStarted(false),
        mWorkDuration(workDuration),
        mReadyDuration(readyDuration),
        mLastCallTime(notBefore) {}

void callback(nsecs_t vsyncTime, nsecs_t wakeupTime, nsecs_t readyTime) {
 
    mCallback(vsyncTime, wakeupTime, readyTime);

}
```

```c++
void DispSyncSource::onVsyncCallback(nsecs_t vsyncTime, nsecs_t targetWakeupTime,
                                     nsecs_t readyTime) {
    VSyncSource::Callback* callback;
    {
        std::lock_guard lock(mCallbackMutex);
        callback = mCallback;
    }

    if (mTraceVsync) {
        mValue = (mValue + 1) % 2;
    }

    if (callback != nullptr) {
        callback->onVSyncEvent(targetWakeupTime, {vsyncTime, readyTime});
    }
}
```

```c++
EventThread::EventThread(std::unique_ptr<VSyncSource> vsyncSource,
                         android::frametimeline::TokenManager* tokenManager,
                         InterceptVSyncsCallback interceptVSyncsCallback,
                         ThrottleVsyncCallback throttleVsyncCallback,
                         GetVsyncPeriodFunction getVsyncPeriodFunction)
      : mVSyncSource(std::move(vsyncSource)),
        mTokenManager(tokenManager),
        mInterceptVSyncsCallback(std::move(interceptVSyncsCallback)),
        mThrottleVsyncCallback(std::move(throttleVsyncCallback)),
        mGetVsyncPeriodFunction(std::move(getVsyncPeriodFunction)),
        mThreadName(mVSyncSource->getName()) {

    mVSyncSource->setCallback(this);

    mThread = std::thread([this]() NO_THREAD_SAFETY_ANALYSIS {
        std::unique_lock<std::mutex> lock(mMutex);
        threadMain(lock);
    });

}
```

### EventThread::onVSyncEvent

```c++
#00 pc 00000000001c106e  /system/bin/surfaceflinger (android::impl::EventThread::onVSyncEvent(long, android::VSyncSource::VSyncData)+94)
#01 pc 00000000001bec22  /system/bin/surfaceflinger (android::scheduler::CallbackRepeater::callback(long, long, long)+114)
#02 pc 00000000001d844a  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::timerCallback()+986)
#03 pc 0000000000670851  /system/bin/surfaceflinger (void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*)+833)
#04 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#05 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

### MessageQueue::vsyncCallback

```c++
#00 pc 00000000001ca4c2  /system/bin/surfaceflinger (android::impl::MessageQueue::vsyncCallback(long, long, long)+258)
#01 pc 00000000001d84da  /system/bin/surfaceflinger (android::scheduler::VSyncDispatchTimerQueue::timerCallback()+986)
#02 pc 00000000006708e1  /system/bin/surfaceflinger (void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*)+833)
#03 pc 00000000000ccd9a  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*)+58)
#04 pc 0000000000060d47  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+55)
```

## dumpsys SurfaceFlinger

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

## DisplayEventReceiver建立与SurfaceFlinger通信通道

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

## DisplayEventReceiver::sendEvents

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

## SurfaceFlinger::composite

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
virtual ScheduleResult schedule(CallbackToken token, ScheduleTiming scheduleTiming) = 0;


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
