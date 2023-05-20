---
tag:
  - android
  - aosp
---

# Android | AOSP | SurfaceFlinger模块 | 转载&加工

## 前言1

转载自：<https://www.jianshu.com/p/db6f62f70ed1> ，并结合Perfetto更新了部分内容。

## 前言2

源码版本：android-13.0.0_r41

## surfaceflinger 进程的启动

`SurfaceFlinger` 是一个系统服务，作用就是接受不同 layer 的 buffer 数据进行合成，然后发送到显示设备进行显示。

`surfaceflinger` 进程是什么时候起来的？

在最新的高版本上是通过 `Android.bp` 去启动 `surfaceflinger.rc` 文件，然后解析文件内容启动 `SurfaceFlinger` 进程。

```c++
frameworks/native/services/surfaceflinger/Android.bp
cc_binary {
    name: "surfaceflinger",
    defaults: ["libsurfaceflinger_binary"],
    init_rc: ["surfaceflinger.rc"],
    ...
}
```

```c++
frameworks/native/services/surfaceflinger/surfaceflinger.rc

service surfaceflinger /system/bin/surfaceflinger
    class core animation
    user system
    group graphics drmrpc readproc
    capabilities SYS_NICE
    onrestart restart --only-if-running zygote
    task_profiles HighPerformance
    socket pdx/system/vr/display/client     stream 0666 system graphics u:object_r:pdx_display_client_endpoint_socket:s0
    socket pdx/system/vr/display/manager    stream 0666 system graphics u:object_r:pdx_display_manager_endpoint_socket:s0
    socket pdx/system/vr/display/vsync      stream 0666 system graphics u:object_r:pdx_display_vsync_endpoint_socket:s0

```

关于 `init.rc` 文件的解析和 `Android.bp` 编译脚本的执行本文不做深入研究，启动 `surfaceflinger` 进程，就会执行到 `main_surfaceflinger.cpp` 中 `main` 函数。

```c++
frameworks/native/services/surfaceflinger/main_surfaceflinger.cpp

int main(int, char**) {
    signal(SIGPIPE, SIG_IGN);

    hardware::configureRpcThreadpool(1 /* maxThreads */,
            false /* callerWillJoin */);

    startGraphicsAllocatorService();

    // When SF is launched in its own process, limit the number of
    // binder threads to 4.
    ProcessState::self()->setThreadPoolMaxThreadCount(4);

    // Set uclamp.min setting on all threads, maybe an overkill but we want
    // to cover important threads like RenderEngine.
    if (SurfaceFlinger::setSchedAttr(true) != NO_ERROR) {
        ALOGW("Couldn't set uclamp.min: %s\n", strerror(errno));
    }

    // The binder threadpool we start will inherit sched policy and priority
    // of (this) creating thread. We want the binder thread pool to have
    // SCHED_FIFO policy and priority 1 (lowest RT priority)
    // Once the pool is created we reset this thread's priority back to
    // original.
    int newPriority = 0;
    int origPolicy = sched_getscheduler(0);
    struct sched_param origSchedParam;

    int errorInPriorityModification = sched_getparam(0, &origSchedParam);
    if (errorInPriorityModification == 0) {
        int policy = SCHED_FIFO;
        newPriority = sched_get_priority_min(policy);

        struct sched_param param;
        param.sched_priority = newPriority;

        errorInPriorityModification = sched_setscheduler(0, policy, &param);
    }

    // start the thread pool
    sp<ProcessState> ps(ProcessState::self());
    ps->startThreadPool();

    // Reset current thread's policy and priority
    if (errorInPriorityModification == 0) {
        errorInPriorityModification = sched_setscheduler(0, origPolicy, &origSchedParam);
    } else {
        ALOGE("Failed to set SurfaceFlinger binder threadpool priority to SCHED_FIFO");
    }

    // instantiate surfaceflinger
    sp<SurfaceFlinger> flinger = surfaceflinger::createSurfaceFlinger();

    // Set the minimum policy of surfaceflinger node to be SCHED_FIFO.
    // So any thread with policy/priority lower than {SCHED_FIFO, 1}, will run
    // at least with SCHED_FIFO policy and priority 1.
    if (errorInPriorityModification == 0) {
        flinger->setMinSchedulerPolicy(SCHED_FIFO, newPriority);
    }

    setpriority(PRIO_PROCESS, 0, PRIORITY_URGENT_DISPLAY);

    set_sched_policy(0, SP_FOREGROUND);

    // Put most SurfaceFlinger threads in the system-background cpuset
    // Keeps us from unnecessarily using big cores
    // Do this after the binder thread pool init
    if (cpusets_enabled()) set_cpuset_policy(0, SP_SYSTEM);

    // initialize before clients can connect
    flinger->init();

    // publish surface flinger
    sp<IServiceManager> sm(defaultServiceManager());
    sm->addService(String16(SurfaceFlinger::getServiceName()), flinger, false,
                   IServiceManager::DUMP_FLAG_PRIORITY_CRITICAL | IServiceManager::DUMP_FLAG_PROTO);

    // publish gui::ISurfaceComposer, the new AIDL interface
    sp<SurfaceComposerAIDL> composerAIDL = new SurfaceComposerAIDL(flinger);
    sm->addService(String16("SurfaceFlingerAIDL"), composerAIDL, false,
                   IServiceManager::DUMP_FLAG_PRIORITY_CRITICAL | IServiceManager::DUMP_FLAG_PROTO);

    startDisplayService(); // dependency on SF getting registered above

    if (SurfaceFlinger::setSchedFifo(true) != NO_ERROR) {
        ALOGW("Couldn't set to SCHED_FIFO: %s", strerror(errno));
    }

    // run surface flinger in this thread
    flinger->run();

    return 0;
}
```

## `ProcessState::self()`

`ProcessState::self()`  函数的调用，个人理解是同 binder 驱动建立链接，获取驱动的版本，通知驱动，同时启动线程来处理 Client 的请求，总结如下：

- 构建 ProcessState 全局对象 gProcess
- 打开 binder 驱动，建立链接
- 在驱动内部创建该进程的 binder_proc , binder_thread 结构，保存该进程的进程信息和线程信息，并加入驱动的红黑树队列中。
- 获取驱动的版本信息
- 把该进程最多可同时启动的线程告诉驱动，并保存到改进程的 binder_proc 结构中
- 把设备文件 /dev/binder 映射到内存中

```c++
// When SF is launched in its own process, limit the number of
// binder threads to 4.
ProcessState::self()->setThreadPoolMaxThreadCount(4);
```

## 设置进程优先级

```c++
setpriority(PRIO_PROCESS, 0, PRIORITY_URGENT_DISPLAY);

set_sched_policy(0, SP_FOREGROUND);

// Put most SurfaceFlinger threads in the system-background cpuset
// Keeps us from unnecessarily using big cores
// Do this after the binder thread pool init
if (cpusets_enabled()) set_cpuset_policy(0, SP_SYSTEM);
```

关于cpuset的使用，有一些简单的命令如下：

查看cpuset的所有分组

```
adb shell ls -l /dev/cpuset
```

查看system-background的cpuset的cpu

```
adb shell cat /dev/cpuset/system-background/cpus
```

查看system-background的应用

```
adb shell cat /dev/cpuset/system-background/tasks
```

查看SurfaceFlinger的cpuset

```
adb shell 'cat /proc/(pid of surfaceflinger)/cpuset'
```

可以自定义cpuset，就是可以根据各自的需求，动态配置自定义的cpuset，例如SurfaceFlinger的线程默认跑到4个小核上，假如有个需求要把SurfaceFlinger的线程跑到大核上，就可以配置自定义cpuset，在进入某个场景的时候，把SurfaceFlinger进程pid配置到自定义的cpuset的tasks中。

## SurfaceFlinger 初始化过程

```c++
// 实例化 SurfaceFlinger
sp<SurfaceFlinger> flinger = surfaceflinger::createSurfaceFlinger();

// 初始化 SurfaceFlinger
flinger->init();

// 将 SurfaceFlinger添加到 ServiceManager 进程中
sp<IServiceManager> sm(defaultServiceManager());
sm->addService(String16(SurfaceFlinger::getServiceName()), flinger, false, IServiceManager::DUMP_FLAG_PRIORITY_CRITICAL | IServiceManager::DUMP_FLAG_PROTO);

//启动 DisplayService
startDisplayService();

// 启动 SurfaceFlinger
flinger->run();
````

## SurfaceFlinger 实例化

有个 `SurfaceFlingerFactory.cpp` ，设计模式中的工厂类，在该头文件中定义了好多创建不同对象的函数。

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp
sp<SurfaceFlinger> createSurfaceFlinger() {
    static DefaultFactory factory;
    return new SurfaceFlinger(factory);
}
```

通过 `createSurfaceFlinger()` 方法创建了一个 `SurfaceFlinger` 对象。

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlinger.h
class SurfaceFlinger : public BnSurfaceComposer,
                       public PriorityDumper,
                       private IBinder::DeathRecipient,
                       private HWC2::ComposerCallback,
                       private ICompositor,
                       private scheduler::ISchedulerCallback {
```

### BnSurfaceComposer

`ISurfaceComposer` 是 Client 端对 `SurfaceFlinger` 进程的 binder 接口调用。

```c++
class BnSurfaceComposer: public BnInterface<ISurfaceComposer> {
    ...
}
```

### ICompositor

ICompositor是SurfaceFlinger触发合成时的调用。

```c++
struct ICompositor {
    virtual bool commit(nsecs_t frameTime, int64_t vsyncId, nsecs_t expectedVsyncTime) = 0;
    virtual void composite(nsecs_t frameTime, int64_t vsyncId) = 0;
    virtual void sample() = 0;
}

```

### ComposerCallback

`ComposerCallback` ，这个是HWC模块的回调，这个包含了三个很关键的回调函数， `onComposerHotplug` 函数表示
显示屏热插拔事件， `onComposerHalRefresh` 函数表示 Refresh 事件， `onComposerHalVsync` 表示Vsync信号事件。

```c++
struct ComposerCallback {
    virtual void onComposerHalHotplug(hal::HWDisplayId, hal::Connection) = 0;
    virtual void onComposerHalRefresh(hal::HWDisplayId) = 0;
    virtual void onComposerHalVsync(hal::HWDisplayId, int64_t timestamp,
                                    std::optional<hal::VsyncPeriodNanos>) = 0;
    virtual void onComposerHalVsyncPeriodTimingChanged(hal::HWDisplayId,
                                                       const hal::VsyncPeriodChangeTimeline&) = 0;
    virtual void onComposerHalSeamlessPossible(hal::HWDisplayId) = 0;
    virtual void onComposerHalVsyncIdle(hal::HWDisplayId) = 0;

protected:
    ~ComposerCallback() = default;
};
```

## SurfaceFlinger 构造函数

在 `SurfaceFlinger` 中的构造方法中，初始化了很多全局变量，有一些变量会直接影响整个代码的执行流程，而这些变量都可以在开发者模式中去更改它， `SurfaceFlinger` 作为 binder 的服务端，设置应用中的开发者模式做为 Client 端进行 binder 调用去设置更改，主要是为了调试测试，其中还包含芯片厂商高通的一些辅助功能。

```c++
SurfaceFlinger::SurfaceFlinger(Factory& factory, SkipInitializationTag)
      : mFactory(factory),
        mPid(getpid()),
        mInterceptor(mFactory.createSurfaceInterceptor()),
        mTimeStats(std::make_shared<impl::TimeStats>()),
        mFrameTracer(mFactory.createFrameTracer()),
        mFrameTimeline(mFactory.createFrameTimeline(mTimeStats, mPid)),
        mCompositionEngine(mFactory.createCompositionEngine()),
        mHwcServiceName(base::GetProperty("debug.sf.hwc_service_name"s, "default"s)),
        mTunnelModeEnabledReporter(new TunnelModeEnabledReporter()),
        mInternalDisplayDensity(getDensityFromProperty("ro.sf.lcd_density", true)),
        mEmulatedDisplayDensity(getDensityFromProperty("qemu.sf.lcd_density", false)),
        mPowerAdvisor(std::make_unique<Hwc2::impl::PowerAdvisor>(*this)),
        mWindowInfosListenerInvoker(sp<WindowInfosListenerInvoker>::make(*this)) {
    ALOGI("Using HWComposer service: %s", mHwcServiceName.c_str());
}
```

## SurfaceFlinger 初始化

实例化 `SurfaceFlinger` 对象之后，调用 `init` 方法，这个方法有几个比较重要的代码。

```c++
// Do not call property_set on main thread which will be blocked by init
// Use StartPropertySetThread instead.
void SurfaceFlinger::init() {
    ALOGI(  "SurfaceFlinger's main thread ready to run. "
            "Initializing graphics H/W...");
    Mutex::Autolock _l(mStateLock);

    // Get a RenderEngine for the given display / config (can't fail)
    // TODO(b/77156734): We need to stop casting and use HAL types when possible.
    // Sending maxFrameBufferAcquiredBuffers as the cache size is tightly tuned to single-display.
    auto builder = renderengine::RenderEngineCreationArgs::Builder()
                           .setPixelFormat(static_cast<int32_t>(defaultCompositionPixelFormat))
                           .setImageCacheSize(maxFrameBufferAcquiredBuffers)
                           .setUseColorManagerment(useColorManagement)
                           .setEnableProtectedContext(enable_protected_contents(false))
                           .setPrecacheToneMapperShaderOnly(false)
                           .setSupportsBackgroundBlur(mSupportsBlur)
                           .setContextPriority(
                                   useContextPriority
                                           ? renderengine::RenderEngine::ContextPriority::REALTIME
                                           : renderengine::RenderEngine::ContextPriority::MEDIUM);
    if (auto type = chooseRenderEngineTypeViaSysProp()) {
        builder.setRenderEngineType(type.value());
    }
    mCompositionEngine->setRenderEngine(renderengine::RenderEngine::create(builder.build()));
    mMaxRenderTargetSize =
            std::min(getRenderEngine().getMaxTextureSize(), getRenderEngine().getMaxViewportDims());

    // Set SF main policy after initializing RenderEngine which has its own policy.
    if (!SetTaskProfiles(0, {"SFMainPolicy"})) {
        ALOGW("Failed to set main task profile");
    }

    mCompositionEngine->setTimeStats(mTimeStats);
    mCompositionEngine->setHwComposer(getFactory().createHWComposer(mHwcServiceName));
    mCompositionEngine->getHwComposer().setCallback(*this);
    ClientCache::getInstance().setRenderEngine(&getRenderEngine());

    enableLatchUnsignaledConfig = getLatchUnsignaledConfig();

    if (base::GetBoolProperty("debug.sf.enable_hwc_vds"s, false)) {
        enableHalVirtualDisplays(true);
    }

    // Process any initial hotplug and resulting display changes.
    processDisplayHotplugEventsLocked();
    const auto display = getDefaultDisplayDeviceLocked();
    LOG_ALWAYS_FATAL_IF(!display, "Missing primary display after registering composer callback.");
    const auto displayId = display->getPhysicalId();
    LOG_ALWAYS_FATAL_IF(!getHwComposer().isConnected(displayId),
                        "Primary display is disconnected.");

    // initialize our drawing state
    mDrawingState = mCurrentState;

    // set initial conditions (e.g. unblank default device)
    initializeDisplays();

    mPowerAdvisor->init();

    char primeShaderCache[PROPERTY_VALUE_MAX];
    property_get("service.sf.prime_shader_cache", primeShaderCache, "1");
    if (atoi(primeShaderCache)) {
        if (setSchedFifo(false) != NO_ERROR) {
            ALOGW("Can't set SCHED_OTHER for primeCache");
        }

        mRenderEnginePrimeCacheFuture = getRenderEngine().primeCache();

        if (setSchedFifo(true) != NO_ERROR) {
            ALOGW("Can't set SCHED_OTHER for primeCache");
        }
    }

    onActiveDisplaySizeChanged(display);

    // Inform native graphics APIs whether the present timestamp is supported:

    const bool presentFenceReliable =
            !getHwComposer().hasCapability(Capability::PRESENT_FENCE_IS_NOT_RELIABLE);
    mStartPropertySetThread = getFactory().createStartPropertySetThread(presentFenceReliable);

    if (mStartPropertySetThread->Start() != NO_ERROR) {
        ALOGE("Run StartPropertySetThread failed!");
    }

    ALOGV("Done initializing");
}
```

### SkiaRenderEngine 渲染引擎初始化

```c++
// Get a RenderEngine for the given display / config (can't fail)
// TODO(b/77156734): We need to stop casting and use HAL types when possible.
// Sending maxFrameBufferAcquiredBuffers as the cache size is tightly tuned to single-display.
auto builder = renderengine::RenderEngineCreationArgs::Builder()
                        .setPixelFormat(static_cast<int32_t>(defaultCompositionPixelFormat))
                        .setImageCacheSize(maxFrameBufferAcquiredBuffers)
                        .setUseColorManagerment(useColorManagement)
                        .setEnableProtectedContext(enable_protected_contents(false))
                        .setPrecacheToneMapperShaderOnly(false)
                        .setSupportsBackgroundBlur(mSupportsBlur)
                        .setContextPriority(
                                useContextPriority
                                        ? renderengine::RenderEngine::ContextPriority::REALTIME
                                        : renderengine::RenderEngine::ContextPriority::MEDIUM);
if (auto type = chooseRenderEngineTypeViaSysProp()) {
    builder.setRenderEngineType(type.value());
}
mCompositionEngine->setRenderEngine(renderengine::RenderEngine::create(builder.build()));
```

在Android S版本之前，这块的绘制流程都是 OpenGL ES 实现的，在Android S 版本上这块逻辑已经切换到 Skia 库进行绘制， `mCompositionEngine` 这个类比较重要，主要负责 Layer 的 Client 合成，Client合 成就是 GPU 合成。目前 Layer 的合成方式有两种，一个是 GPU 合成，一个是 HWC 合成，针对 Skia 库的研究有单独的章节进行讲解。

### initScheduler 调度器初始化

在 `init` 方法中，重点看这个函数中调用了 `initScheduler` 方法。

```c++
// start the EventThread
mScheduler = getFactory().createScheduler(*mRefreshRateConfigs, *this);
const auto configs = mVsyncConfiguration->getCurrentConfigs();
const nsecs_t vsyncPeriod = currRefreshRate.getPeriodNsecs();
mAppConnectionHandle =
        mScheduler->createConnection("app", mFrameTimeline->getTokenManager(),
                                     /*workDuration=*/configs.late.appWorkDuration,
                                     /*readyDuration=*/configs.late.sfWorkDuration,
                                     impl::EventThread::InterceptVSyncsCallback());
mSfConnectionHandle =
        mScheduler->createConnection("appSf", mFrameTimeline->getTokenManager(),
                                     /*workDuration=*/std::chrono::nanoseconds(vsyncPeriod),
                                     /*readyDuration=*/configs.late.sfWorkDuration,
                                     [this](nsecs_t timestamp) {
                                         mInterceptor->saveVSyncEvent(timestamp);
                                     });

mEventQueue->initVsync(mScheduler->getVsyncDispatch(), *mFrameTimeline->getTokenManager(),
                       configs.late.sfWorkDuration);
```

图中是 `initScheduler` 方法中几个关键的代码，该代码和Vsync研究密切相关，当分析研究 `SurfaceFlinger` 的合成流程，也就最核心的流程，其触发条件就是由 Vsync 控制的，Vsync 很像一个节拍器，  `SurfaceFlinger` 中每一帧的合成都需要跟随节拍器，太快或者太慢都会导致屏幕显示异常，一般表现为画面卡顿，不流畅，关于Vsync的研究有独立章节进行讲解。

将 `SurfaceFlinger` 添加到 `ServiceManager` 进程中

`SurfaceFlinger` 模块提供很多 binder 接口，在服务端的 `onTransact` 函数会根据 Client 端传递的 code 做不同的代码处理

## SurfaceFlinger 启动

```c++
void SurfaceFlinger::run() {
    while (true) {
        mEventQueue->waitMessage();
    }
}
void SurfaceFlinger::onFirstRef() {
    mEventQueue->init(this);
}
```

在前面介绍的 `main` 函数， `SurfaceFlinger` 对象是一个智能指针，sp 强引用指针。该智能指针在第一次引用的时候，会调用 `onFirstRef` 方法，进一步实例化内部需要的对象，这个方法调用了 `mEventQueue` 的 `init` 方法，而这个对象就是线程安全的 `MessageQueue` 对象。

`SurfaceFlinger` 中的 `MessageQueue` 和 Android 应用层开发的 `MessageQueue` 设计非常相似，只是个别角色做的事情稍微有一点不同。

`SurfaceFlinger` 的 `MessageQueue` 机制的角色：

`MessageQueue` 同样做为消息队列向外暴露接口，不像应用层的 `MessageQueue` 一样作为 `Message` 链表的队列缓存，而是提供了相应的发送消息的接口以及等待消息方法。

native 的 `Looper` 是整个 `MessageQueue` 的核心，以 `epoll_event` `为核心，event_fd` 为辅助构建一套快速的消息回调机制。

native 的 `Handler` 则是实现 `handleMessage` 方法，当 `Looper` 回调的时候，将会调用 `Handler` 中的 `handleMessage` 方法处理回调函数。

```c++
/frameworks/native/services/surfaceflinger/Scheduler/MessageQueue.cpp

MessageQueue::MessageQueue(ICompositor& compositor)
      : MessageQueue(compositor, sp<Handler>::make(*this)) {}

MessageQueue::MessageQueue(ICompositor& compositor, sp<Handler> handler)
      : mCompositor(compositor),
        mLooper(sp<Looper>::make(kAllowNonCallbacks)),
        mHandler(std::move(handler)) {}

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
```

每当我们需要图元刷新的时候，就会通过 `mEventQueue` 的 `post` 方法，回调到 `SurfaceFlinger` 的主线程进行合成刷新。
