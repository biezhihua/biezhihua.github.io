---
tag:
  - android
  - aosp
---

# Android | AOSP | SurfaceFlinger模块-VSYNC研究

## 前言1

转载自：<https://www.jianshu.com/p/5e9c558d1543> ，并结合Perfetto更新了部分内容。

## 前言2

Vsync信号是SurfaceFlinger进程中核心的一块逻辑，我们主要从以下几个方面着手讲解。

- 软件Vsync是怎么实现的，它是如何保持有效性的？
- systrace中看到的VSYNC信号如何解读，这些脉冲信号是在哪里打印的？
- 为什么VSYNC-sf / VSYNC-app 时断时续？
- SF请求VSYNC-SF信号进行合成的流程是怎样的？
- “dumpsys SurfaceFlinger --dispsync"命令输出如何解读？

## VSYNC 信号

当前手机屏幕显示屏大部分都是60Hz（也有一部分是90Hz/120Hz/165Hz）,意味着显示屏每隔16.66毫秒刷新一次，如果在显示屏刷新时刻去更新显示的内容，就会导致屏幕撕裂（其中还有掉帧问题，就是连续的两个刷新周期，显示屏只能显示同一帧图像，具体请查询Android黄油计划），为了避免这种情况，我们在显示屏幕两次刷新之间的空档期去更新显示内容，当可以安全的更新内容时，系统会收到显示屏发来的信号，处于历史原因，我们称之为VSYNC信号。

### 硬件VSYNC和软件VSYNC

通过 Perfetto 来认识VSYNC

![](/learn-android/aosp/surfaceflinger-vsync-1.png)

- 因为我们只有一个显示屏，所以只有一个硬件VSYNC，即HW_VSYNC。HW_VSYNC_displayid脉冲的宽度是16ms，因此显示屏的帧率是60Hz。

- HW_VSYNC_ON_displayid表示硬件VSYNC是否打开。可见硬件VSYNC大部分时间是关闭的，只有在特殊场景下才会打开（比如更新SW VSYNC模型的时候）,displayId在sf中标识这个显示屏的唯一字符串。

- App的绘制以及SF的合成分别由对应的软件VSYNC来驱动的：VSYNC-app驱动App进行绘制；VSYNC-sf驱动SF对相关的Layer进行合成。

- VSYNC-app与VSYNC-sf是”按需发射“的，如果App要更新界面，它得”申请“VSYNC-app，如果没有App申请VSYNC-app，那么VSYNC-app将不再发射。同样，当App更新了界面，它会把对应的Graphic Buffer放到Buffer Queue中。Buffer Queue通知SF进行合成，此时SF会申请VSYNC-sf。如果SF不再申请VSYNC-sf，VSYNC-sf将不再发射。注意，默认情况下这些申请都是一次性的，意味着，如果App要持续不断的更新，它就得不断去申请VSYNC-app；而对SF来说，只要有合成任务，它就得再去申请VSYNC-sf。

- VSYNC-app与VSYNC-sf是相互独立的。VSYNC-app触发App的绘制，Vsync-sf触发SF合成。App绘制与SF合成都会加大CPU的负载，为了避免绘制与合成打架造成的性能问题，VSYNC-app可以与VSYNC-sf稍微错开一下，像下图一样：

![](/learn-android/aosp/surfaceflinger-vsync-2.png)

- 从我们抓的systrace中也可看到这种偏移，但是要注意：systrace中VSYNC脉冲，上升沿与下降沿各是一次VSYNC信号。这里的高、低电平只是一种示意，如果要查看VSYNC-app与VSYNC-sf的偏移，不能错误的以为“同是上升沿或者同是下降沿进行比对”。忘记上升沿或者下降沿吧，只需拿两个人相邻的VSYNC信号进行比对。如下图所示，VSYNC-app领先VSYNC-sf有85微秒。不过要注意，这个85微秒只是软件误差，算不得数，在我们的系统中，VSYNC-app与VSYNC-sf并没有错开。有必要再补充下：SF进行合成的是App的上一帧，而App当前正在绘制的那一帧，要等到下一个VSYNC-sf来临时再进行合成。

### 与VSYNC相关的线程

抓了好几份systrace，都没有显示出线程的名字，按照后面讲解代码中的理解，我用679手机查看SurfaceFlinger进程的线程信息，大概列出和VSYNC相关的线程名字。

- TimerDispatch线程： TimerDispatch充当软件VSYNC的信号泵，这个线程包装成VsyncDispatchTimeQueue这个类，里面有一个CallbackMap变量，存放的是那些关心VSYNC信号的人（appEventThread, appSfEventThread, sf的MessageQueue），TimerDispatch就是根据模型计算的唤醒时间对着它们发送SW VSYNC。

- appEventThread线程：它是EventThread类型的实例，它是VSYNC-app寄宿的线程。很明显，它就是VSYNC-app的掌门人。一方面，它接收App对VSYNC-app的请求，如果没有App请求VSYNC-app，它就进入休眠；另一方面，它接收TimerDispatch发射过来VSYNC-app，控制App的绘制。

- appSfEventThread线程：它是EventThread类型的实例，它是VSYNC-appSf寄宿的线程，和appEventThread线程功能是类似的，用于调试代码，暂时忽略。

- MessageQueue（表示主线程）： 它是VSYNC-sf寄宿的线程，很明显，它就是VSYNC-sf的掌门人，不过它专给SF一个人服务。一方面，如果SF有合成需求，会向它提出申请；另一方面，它接收TimerDispatch发射过来的VSYNC-sf，控制SF的合成。

HW VSYNC/SW VSYNC/VSYNC/VSYNC-app与VSYNC-SF的关联可以用一个PLL图来表示：

![](/learn-android/aosp/surfaceflinger-vsync-3.png)

### VSYNC信号从哪里开始初始化的？

因为Android大版本每次更新，SurfaceFlinger模块都要进行代码重构，，所以我们就从Android 13代码的源头开始讲起。

我们在讲解SurfaceFlinger::init方法的时候，init会去初始化HWComposer并注册回调函数，如下：

```c++
// frameworks/native/services/surfaceflinger/surfaceflinger.rc

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
```

```c++
frameworks/native/services/surfaceflinger/main_surfaceflinger.cpp
int main(int, char**) {
    signal(SIGPIPE, SIG_IGN);
    
    ...
    
    // instantiate surfaceflinger
    sp<SurfaceFlinger> flinger = surfaceflinger::createSurfaceFlinger();

    ...

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

    ...

    // run surface flinger in this thread
    flinger->run();

    return 0;
}

frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp
sp<SurfaceFlinger> createSurfaceFlinger() {
    static DefaultFactory factory;

    return new SurfaceFlinger(factory);
}
```

我们在讲解SurfaceFlinger::init方法的时候，init会去初始化HWComposer并注册回调函数，如下：

```C++
// Do not call property_set on main thread which will be blocked by init
// Use StartPropertySetThread instead.
void SurfaceFlinger::init() {
    ...

    mCompositionEngine->setTimeStats(mTimeStats);
    mCompositionEngine->setHwComposer(getFactory().createHWComposer(mHwcServiceName));
    mCompositionEngine->getHwComposer().setCallback(*this);

    ...
}
```

- 创建一个HWComposer对象并传入一个name属性，再把该对象设置到mCompositionEngine中。
- 这里的this就是SurfaceFlinger本身，它实现了HWC2::ComposerCallback回调方法。

定义ComposerCallback回调方法:

```c++
/frameworks/native/services/surfaceflinger/DisplayHardware/HWC2.h

struct ComposerCallback {
    virtual void onComposerHalHotplug(hal::HWDisplayId, hal::Connection) = 0;
    virtual void onComposerHalRefresh(hal::HWDisplayId) = 0;
    virtual void onComposerHalVsync(hal::HWDisplayId, int64_t timestamp,
                                    std::optional<hal::VsyncPeriodNanos>) = 0;
    virtual void onComposerHalVsyncPeriodTimingChanged(hal::HWDisplayId,
                                                       const hal::VsyncPeriodChangeTimeline&) = 0;
    virtual void onComposerHalSeamlessPossible(hal::HWDisplayId) = 0;

protected:
    ~ComposerCallback() = default;
};
```

根据HWC2::ComposerCallback的设计逻辑，SurfaceFlinger::init方法中设置完HWC的回调之后，会立刻收到一个Hotplug事件，并在SurfaceFlinger::onComposerHalHotplug中去处理，所以流程就走到了：

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp
    
void SurfaceFlinger::onComposerHalHotplug(hal::HWDisplayId hwcDisplayId, hal::Connection connection) {
  ...
    if (std::this_thread::get_id() == mMainThreadId) {
        // Process all pending hot plug events immediately if we are on the main thread.
        processDisplayHotplugEventsLocked();
    }
  ...
}
```

继续分析processDisplayHotplugEventsLocked的方法

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp

void SurfaceFlinger::processDisplayHotplugEventsLocked() {
    for (const auto& event : mPendingHotplugEvents) {

        ...

        processDisplayChangesLocked();
    }

    mPendingHotplugEvents.clear();
}



void SurfaceFlinger::processDisplayChangesLocked() {
    ...

    if (!curr.isIdenticalTo(draw)) {
        mVisibleRegionsDirty = true;

        ....

        // find displays that were added
        // (ie: in current state but not in drawing state)
        for (size_t i = 0; i < curr.size(); i++) {
            const wp<IBinder>& displayToken = curr.keyAt(i);
            if (draw.indexOfKey(displayToken) < 0) {
                processDisplayAdded(displayToken, curr[i]);
            }
        }
    }

   ...
}

oid SurfaceFlinger::processDisplayAdded(const wp<IBinder>& displayToken,
                                         const DisplayDeviceState& state) {
    ...

    auto display = setupNewDisplayDeviceInternal(displayToken, std::move(compositionDisplay), state,
                                                 displaySurface, producer);
    if (display->isPrimary()) {
        initScheduler(display);
    }

    ...
}
```

就会走到了initScheduler方法，这个方法就是初始化VSYNC信号的函数。

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp

void SurfaceFlinger::initScheduler(const sp<DisplayDevice>& display) {
    if (mScheduler) {
        // If the scheduler is already initialized, this means that we received
        // a hotplug(connected) on the primary display. In that case we should
        // update the scheduler with the most recent display information.
        ALOGW("Scheduler already initialized, updating instead");
        mScheduler->setRefreshRateConfigs(display->holdRefreshRateConfigs());
        return;
    }
    const auto currRefreshRate = display->getActiveMode()->getFps();
    mRefreshRateStats = std::make_unique<scheduler::RefreshRateStats>(*mTimeStats, currRefreshRate,
                                                                      hal::PowerMode::OFF);

    mVsyncConfiguration = getFactory().createVsyncConfiguration(currRefreshRate);
    mVsyncModulator = sp<VsyncModulator>::make(mVsyncConfiguration->getCurrentConfigs());

    using Feature = scheduler::Feature;
    scheduler::FeatureFlags features;

    if (sysprop::use_content_detection_for_refresh_rate(false)) {
        features |= Feature::kContentDetection;
    }
    if (base::GetBoolProperty("debug.sf.show_predicted_vsync"s, false)) {
        features |= Feature::kTracePredictedVsync;
    }
    if (!base::GetBoolProperty("debug.sf.vsync_reactor_ignore_present_fences"s, false) &&
        !getHwComposer().hasCapability(Capability::PRESENT_FENCE_IS_NOT_RELIABLE)) {
        features |= Feature::kPresentFences;
    }

    mScheduler = std::make_unique<scheduler::Scheduler>(static_cast<ICompositor&>(*this),
                                                        static_cast<ISchedulerCallback&>(*this),
                                                        features);
    {
        auto configs = display->holdRefreshRateConfigs();
        if (configs->kernelIdleTimerController().has_value()) {
            features |= Feature::kKernelIdleTimer;
        }

        mScheduler->createVsyncSchedule(features);
        mScheduler->setRefreshRateConfigs(std::move(configs));
    }
    setVsyncEnabled(false);
    mScheduler->startTimers();

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

    mScheduler->initVsync(mScheduler->getVsyncDispatch(), *mFrameTimeline->getTokenManager(),
                          configs.late.sfWorkDuration);

    mRegionSamplingThread =
            new RegionSamplingThread(*this, RegionSamplingThread::EnvironmentTimingTunables());
    mFpsReporter = new FpsReporter(*mFrameTimeline, *this);
    // Dispatch a mode change request for the primary display on scheduler
    // initialization, so that the EventThreads always contain a reference to a
    // prior configuration.
    //
    // This is a bit hacky, but this avoids a back-pointer into the main SF
    // classes from EventThread, and there should be no run-time binder cost
    // anyway since there are no connected apps at this point.
    mScheduler->onPrimaryDisplayModeChanged(mAppConnectionHandle, display->getActiveMode());
}

```

- 先判断mScheduler是否为空，避免重复初始化。

- 初始化mRefreshRateConfigs对象，这个对象包含了刷新率的配置信息，包含当前屏幕的刷新率，刷新周期等信息。

- currRefreshRate是一个Fps对象，其中存储了刷新率fps和刷新周期period。

- 初始化mVsyncConfiguration对象，这个类封装了不同刷新率下的Vsync配置信息，app phase就是VSYNC-app的偏移量，sf phase是VSYNC-sf的偏移量。这个类会再创建appEventThread或者sf的回调函数中把偏移量传递进去，主要是为了计算SW VSYNC唤醒VSYNC-app或者VSYNC-sf的时间，这个类可以通过属性进行配置，代码实现中也固定了部分参数。

初- 始化Scheduler对象 mScheduler，这个类的构造函数中，初始化了 VsyncSchedule这个结构体，该结构体里面的三个对象都非常重要，dispatch就是TimerDispatcher的线程，也就是VYSNC信号的节拍器（心跳），其他两个对象是为dispatch服务的。

- 创建appEventThread和appSfEventThread，appEventThread/appSfEventThread就是上面说的这个线程，同步绑定回调函数到VsyncDispatch上面，名字是"app","appSf","sf"。

- mEventQueue的initVsync方法主要是绑定一个回调函数到VsyncDispatch上面，回调名字是"sf"。

```c++
// Schedule that synchronizes to hardware VSYNC of a physical display.
class VsyncSchedule {
public:
    explicit VsyncSchedule(FeatureFlags);
    VsyncSchedule(VsyncSchedule&&);
    ~VsyncSchedule();

    // TODO(b/185535769): Hide behind API.
    const VsyncTracker& getTracker() const { return *mTracker; }
    VsyncTracker& getTracker() { return *mTracker; }
    VsyncController& getController() { return *mController; }

    // TODO(b/185535769): Remove once VsyncSchedule owns all registrations.
    VsyncDispatch& getDispatch() { return *mDispatch; }

    void dump(std::string&) const;

private:
    friend class TestableScheduler;

    using TrackerPtr = std::unique_ptr<VsyncTracker>;
    using DispatchPtr = std::unique_ptr<VsyncDispatch>;
    using ControllerPtr = std::unique_ptr<VsyncController>;

    // For tests.
    VsyncSchedule(TrackerPtr, DispatchPtr, ControllerPtr);

    static TrackerPtr createTracker();
    static DispatchPtr createDispatch(VsyncTracker&);
    static ControllerPtr createController(VsyncTracker&, FeatureFlags);

    class PredictedVsyncTracer;
    using TracerPtr = std::unique_ptr<PredictedVsyncTracer>;

    // Effectively const except in move constructor.
    TrackerPtr mTracker;
    DispatchPtr mDispatch;
    ControllerPtr mController;
    TracerPtr mTracer;
};

```

那么从上面的代码逻辑中，我们可以知道节拍器线程（心跳）一共绑定了3个Callback，分别是"app" ,"appSf","sf"。

### VSYNC-sf/VSYNC-app的申请与投递

我们先看看通道的建立过程，也是从源代码开始看起。

### 向VsyncDispatch注册Callback

我们知道VsyncDispatch是节拍器（心跳），也就是TimerDispatch的线程所在，所以我们需要了解下VsyncDispatch是在什么时候初始化的？在前面Vsync信号初始化的逻辑中，我们了解到Scheduler类再构造方法中会创建VsyncDispatch对象，而这个对象也就是SurfaceFlinger系统中唯一的，相关代码如下：

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp

void SurfaceFlinger::initScheduler(const sp<DisplayDevice>& display) {
    i...

    mScheduler = std::make_unique<scheduler::Scheduler>(static_cast<ICompositor&>(*this),
                                                        static_cast<ISchedulerCallback&>(*this),
                                                        features);
    {
        ...

        mScheduler->createVsyncSchedule(features);

        ...
    }
    s...
}

void Scheduler::createVsyncSchedule(FeatureFlags features) {
    //  https://en.cppreference.com/w/cpp/utility/optional/emplace
    mVsyncSchedule.emplace(features);
}

// Schedule that synchronizes to hardware VSYNC of a physical display.
class VsyncSchedule {
public:
    explicit VsyncSchedule(FeatureFlags);
    VsyncSchedule(VsyncSchedule&&);
    ~VsyncSchedule();

    ...
};

aosp/frameworks/native/services/surfaceflinger/Scheduler/VsyncSchedule.cpp
VsyncSchedule::VsyncSchedule(FeatureFlags features)
      : mTracker(createTracker()),
        mDispatch(createDispatch(*mTracker)),
        mController(createController(*mTracker, features)) {
    if (features.test(Feature::kTracePredictedVsync)) {
        mTracer = std::make_unique<PredictedVsyncTracer>(*mDispatch);
    }
}

VsyncSchedule::TrackerPtr VsyncSchedule::createTracker() {
    // TODO(b/144707443): Tune constants.
    constexpr nsecs_t kInitialPeriod = (60_Hz).getPeriodNsecs();
    constexpr size_t kHistorySize = 20;
    constexpr size_t kMinSamplesForPrediction = 6;
    constexpr uint32_t kDiscardOutlierPercent = 20;

    return std::make_unique<VSyncPredictor>(kInitialPeriod, kHistorySize, kMinSamplesForPrediction,
                                            kDiscardOutlierPercent);
}

VsyncSchedule::DispatchPtr VsyncSchedule::createDispatch(VsyncTracker& tracker) {
    using namespace std::chrono_literals;

    // TODO(b/144707443): Tune constants.
    constexpr std::chrono::nanoseconds kGroupDispatchWithin = 500us;
    constexpr std::chrono::nanoseconds kSnapToSameVsyncWithin = 3ms;

    return std::make_unique<VSyncDispatchTimerQueue>(std::make_unique<Timer>(), tracker,
                                                     kGroupDispatchWithin.count(),
                                                     kSnapToSameVsyncWithin.count());
}

VsyncSchedule::ControllerPtr VsyncSchedule::createController(VsyncTracker& tracker,
                                                             FeatureFlags features) {
    // TODO(b/144707443): Tune constants.
    constexpr size_t kMaxPendingFences = 20;
    const bool hasKernelIdleTimer = features.test(Feature::kKernelIdleTimer);

    auto reactor = std::make_unique<VSyncReactor>(std::make_unique<SystemClock>(), tracker,
                                                  kMaxPendingFences, hasKernelIdleTimer);

    reactor->setIgnorePresentFences(!features.test(Feature::kPresentFences));
    return reactor;
}

```

从该方法可以看出，Scheduler对象初始化的时候，会间接的构造出VsyncDispatchTimerQueue对象，这个时候有小伙伴就疑问怎么不是VsyncDispatch对象呢？

这边我们把这几个类图的关系画出来，如下：

![](/learn-android/aosp/surfaceflinger-vsync-4.webp)

VsyncDispatchTimerQueue是继承VsyncDispatch，而节拍器（心跳）线程也就是该对象中的mTimeKeeper，这个Timer.cpp中会创建TimerDispatch这个名字的线程。

```c++

aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.h
/*
 * VSyncDispatchTimerQueue is a class that will dispatch callbacks as per VSyncDispatch interface
 * using a single timer queue.
 */
class VSyncDispatchTimerQueue : public VSyncDispatch {
    // Constructs a VSyncDispatchTimerQueue.
    // \param[in] tk                    A timekeeper.
    // \param[in] tracker               A tracker.
    // \param[in] timerSlack            The threshold at which different similarly timed callbacks
    //                                  should be grouped into one wakeup.
    // \param[in] minVsyncDistance      The minimum distance between two vsync estimates before the
    //                                  vsyncs are considered the same vsync event.
    VSyncDispatchTimerQueue(std::unique_ptr<TimeKeeper>, VSyncTracker&, nsecs_t timerSlack,
                            nsecs_t minVsyncDistance);
};


aosp/frameworks/native/services/surfaceflinger/Scheduler/include/scheduler/Timer.h
class Timer : public TimeKeeper {
public:
    Timer();
    ~Timer();

    nsecs_t now() const final;

    void alarmAt(std::function<void()>, nsecs_t time) final;
    void alarmCancel() final;

private:
    void threadMain();
    bool dispatch();
    void endDispatch();
};

aosp/frameworks/native/services/surfaceflinger/Scheduler/include/scheduler/Timer.cpp
Timer::Timer() {
    reset();
    mDispatchThread = std::thread([this]() { threadMain(); });
}

void Timer::reset() {
    std::function<void()> cb;
    {
        std::lock_guard lock(mMutex);
        if (mExpectingCallback && mCallback) {
            cb = mCallback;
        }

        cleanup();
        mTimerFd = timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC | TFD_NONBLOCK);
        mEpollFd = epoll_create1(EPOLL_CLOEXEC);
       ...
    }
    ...
}

void Timer::threadMain() {
    while (dispatch()) {
        reset();
    }
}

void Timer::alarmAt(std::function<void()> callback, nsecs_t time) {
    std::lock_guard lock(mMutex);
    using namespace std::literals;
    static constexpr int ns_per_s =
            std::chrono::duration_cast<std::chrono::nanoseconds>(1s).count();

    mCallback = std::move(callback);
    mExpectingCallback = true;

    struct itimerspec old_timer;
    struct itimerspec new_timer {
        .it_interval = {.tv_sec = 0, .tv_nsec = 0},
        .it_value = {.tv_sec = static_cast<long>(time / ns_per_s),
                     .tv_nsec = static_cast<long>(time % ns_per_s)},
    };

    if (timerfd_settime(mTimerFd, TFD_TIMER_ABSTIME, &new_timer, &old_timer)) {
        ALOGW("Failed to set timerfd %s (%i)", strerror(errno), errno);
    }
}


bool Timer::dispatch() {
    ...
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &param) != 0) {
        ALOGW("Failed to set SCHED_FIFO on dispatch thread");
    }

    if (pthread_setname_np(pthread_self(), "TimerDispatch")) { //线程命名
        ALOGW("Failed to set thread name on dispatch thread");
    }
    ...
     
    while (true) {
         ...
        int nfds = epoll_wait(mEpollFd, events, DispatchType::MAX_DISPATCH_TYPE, -1);
        ...  
        for (auto i = 0; i < nfds; i++) {
            if (events[i].data.u32 == DispatchType::TIMER) {
                ...
                if (cb) {
                    setDebugState(DebugState::InCallback);
                    cb();//回调操作
                    setDebugState(DebugState::Running);
                }
            }
        ...
        }
    }
}

```

- Timer类在构造方法会创建的一个线程mDispatchThread。

- 在这里用到了timerfd，timerfd是Linux为用户程序提供一个定时器接口，这个接口基于文件描述符，通过文件描述符的可读事件进行超时通知，因此可以配合epoll等使用，timerfd_create() 函数创建一个定时器对象，同时返回一个与之关联的文件描述符。

  - clockid: CLOCK_REALTIME:系统实时时间，随着系统实时时间改变而改变，即从UTC1970-1-1 0:0:0开始计时，CLOCK_MONOTONIC:从系统启动这一刻开始计时，不受系统时间被用户改变的影响。

  - flags: TFD_NONBLOCK(非堵塞模式)/TFD_CLOEXEC(表示程序执行exec函数时本fd将被系统自动关闭，表示不传递)

  - timerfd_settime（）这个函数用于设置新的超时时间，并开始计时，能够启动和停止定时器。

  - fd: 参数fd是timerfd_create函数返回的文件句柄。

  - flags: 参数flags为1设置是绝对时间，0代表是相对时间。

  - new_value: 参数new_value指定的定时器的超时时间以及超时间隔时间。

  - old_value: 参数old_value如果不为NULL, old_vlaue返回之前定时器设置的超时时间，具体参考timerfd_gettimer()函数。

- timerfd配合epoll函数使用，如果定时器时间到了，就会执行上图中alarmAt函数传入的函数指针，这个函数指针是VsyncDispatchTimerQueue.cpp类的timerCallback()函数，而这个函数中，就是对注册的callback执行回调。

#### SF向VsyncDispatch注册回调的过程

下面，我们跟踪下SF是如何注册自己的回调函数。

我们知道，App有个主线程（ActivityThread）专门进行UI处理，该主线程是由一个消息队列（Looper/handler）驱动，主线程不断的从消息队列中取出消息，处理消息，如此往复。

```java
//@ActivityThread.java
public static void main(String[] args) {
    ......
    //准备UI主线程的消息循环
    Looper.prepareMainLooper();

    //创建ActivityThread，并调用attach方法
    ActivityThread thread = new ActivityThread();
    thread.attach(false);

    if (sMainThreadHandler == null) {
        sMainThreadHandler = thread.getHandler();
    }
    //进入主线程消息循环
    Looper.loop();
}
```

SF也类似，有个主线程负责处理合成相关的事物，同时有一个消息队列来驱动，从第一章中SurfaceFlinger模块的主流程模块中讲解了MessageQueue的初始化过程，当初始化完毕之后，SF主线程就进入了消息循环，等待有申请合入相关的事物，然后去做相应的处理。

MessageQueue中有个方法initVsync(),在前面讲解的VSYNC信号的初始化过程中，其中调用了MessageQueue的initVsync函数。

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp

void SurfaceFlinger::initScheduler(const sp<DisplayDevice>& display) {
    ...

    mScheduler->initVsync(mScheduler->getVsyncDispatch(), *mFrameTimeline->getTokenManager(),
                          configs.late.sfWorkDuration);

    ...
}
```

在initVsync函数中初始化mVsync.registation对象，这个对象是VSyncDispatch.h文件中定义的类 VSyncCallbackRegistration，这个类的作用是操作已经注册回调的帮助类，在该类的构造函数中间接调用dispatch.registerCallback()。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/MessageQueue.cpp
void MessageQueue::initVsync(scheduler::VSyncDispatch& dispatch,
                             frametimeline::TokenManager& tokenManager,
                             std::chrono::nanoseconds workDuration) {
    setDuration(workDuration);
    mVsync.tokenManager = &tokenManager;
    mVsync.registration = std::make_unique<
            scheduler::VSyncCallbackRegistration>(dispatch,
                                                  std::bind(&MessageQueue::vsyncCallback, this,
                                                            std::placeholders::_1,
                                                            std::placeholders::_2,
                                                            std::placeholders::_3),
                                                  "sf");
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
VSyncCallbackRegistration::VSyncCallbackRegistration(VSyncDispatch& dispatch,
                                                     VSyncDispatch::Callback callback,
                                                     std::string callbackName)
      : mDispatch(dispatch),
        mToken(dispatch.registerCallback(std::move(callback), std::move(callbackName))),
        mValidToken(true) {}
}

aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
VSyncDispatchTimerQueue::CallbackToken VSyncDispatchTimerQueue::registerCallback(
        Callback callback, std::string callbackName) {
    std::lock_guard lock(mMutex);
    return CallbackToken{
            mCallbacks
                    .emplace(++mCallbackToken,
                             std::make_shared<VSyncDispatchTimerQueueEntry>(std::move(callbackName),
                                                                            std::move(callback),
                                                                            mMinVsyncDistance))
                    .first->first};
}

```

VsyncDispatch的注册函数就会往mCallbacks注册封装了callbackFn的VsyncDispatchTimerQueueEntry对象。从上面的几个步骤来看就完成了SF向VsyncDispatch注册的全部流程，相对Android S之前的系统版本实现优化了下，并没有采用EventThread的方式。


回调过程如下：

- 当VsyncDispatch发送VSYNC-sf的信号时，会走到MessageQueue类注册的回调函数。

```c++

ScheduleResult VSyncDispatchTimerQueue::schedule(CallbackToken token,
                                                 ScheduleTiming scheduleTiming) {
    ScheduleResult result;
    {
        ...

        if (callback->wakeupTime() < mIntendedWakeupTime - mTimerSlack) {
            rearmTimerSkippingUpdateFor(now, it);
        }
    }

    return result;
}


void VSyncDispatchTimerQueue::setTimer(nsecs_t targetTime, nsecs_t /*now*/) {
    mIntendedWakeupTime = targetTime;
    mTimeKeeper->alarmAt(std::bind(&VSyncDispatchTimerQueue::timerCallback, this),
                         mIntendedWakeupTime);
    mLastTimerSchedule = mTimeKeeper->now();
}

void VSyncDispatchTimerQueue::timerCallback() {
    struct Invocation {
        std::shared_ptr<VSyncDispatchTimerQueueEntry> callback;
        nsecs_t vsyncTimestamp;
        nsecs_t wakeupTimestamp;
        nsecs_t deadlineTimestamp;
    };
    std::vector<Invocation> invocations;

    ...

    for (auto const& invocation : invocations) {
        invocation.callback->callback(invocation.vsyncTimestamp, invocation.wakeupTimestamp,
                                      invocation.deadlineTimestamp);
    }
}

void MessageQueue::vsyncCallback(nsecs_t vsyncTime, nsecs_t targetWakeupTime, nsecs_t readyTime) {
    ATRACE_CALL();
    // Trace VSYNC-sf
    mVsync.value = (mVsync.value + 1) % 2;

    {
        std::lock_guard lock(mVsync.mutex);
        mVsync.lastCallbackTime = std::chrono::nanoseconds(vsyncTime);
        mVsync.scheduledFrameTime.reset();
    }

    const auto vsyncId = mVsync.tokenManager->generateTokenForPredictions(
            {targetWakeupTime, readyTime, vsyncTime});

    mHandler->dispatchFrame(vsyncId, vsyncTime);
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

```

- 在这个回调函数中，通过Handler将VSYNC事件转换成内部的msg，投递到消息队列中。

- SF主线程从消息队列中取出消息，回调到SF->handleMessage()

可见，MessageQueue是接收VSYNC-SF信号的，将VsyncDispatch发送的VSYNC-SF信号通过自身转到SF，驱动SF执行合成操作。

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
- <https://www.cnblogs.com/roger-yu/p/15761646.html>
- <https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/main_surfaceflinger.cpp?hl=zh-cn>
- <https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp;l=26?q=createSurfaceFlinger&ss=android%2Fplatform%2Fsuperproject&hl=zh-cn>
- <https://www.jianshu.com/p/5e9c558d1543>
