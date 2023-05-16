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


handleMessage的函数调用栈：
thread #1, name = 'surfaceflinger', stop reason = step over
frame #0: 0x0000566eac668d7d surfaceflinger`android::impl::MessageQueue::Handler::handleMessage(this=0x00007a3974b6aac0, (null)=<unavailable>) at MessageQueue.cpp:48:31
frame #1: 0x00007a3bcbff84b0 libutils.so`android::Looper::pollInner(this=0x00007a39e4b59b10, timeoutMillis=<unavailable>) at Looper.cpp:333:26
frame #2: 0x00007a3bcbff828f libutils.so`android::Looper::pollOnce(this=0x00007a39e4b59b10, timeoutMillis=-1, outFd=0x0000000000000000, outEvents=0x0000000000000000, outData=0x0000000000000000) at Looper.cpp:213:18
frame #3: 0x0000566eac669442 surfaceflinger`android::impl::MessageQueue::waitMessage() [inlined] android::Looper::pollOnce(this=<unavailable>, timeoutMillis=-1) at Looper.h:270:16
frame #4: 0x0000566eac669431 surfaceflinger`android::impl::MessageQueue::waitMessage(this=0x00007a3a44b593c0) at MessageQueue.cpp:145:32
frame #5: 0x0000566eac672709 surfaceflinger`android::scheduler::Scheduler::run(this=0x00007a3a44b593c0) at Scheduler.cpp:131:9
frame #6: 0x0000566eac6d6b2b surfaceflinger`main [inlined] android::SurfaceFlinger::run(this=<unavailable>) at SurfaceFlinger.cpp:483:17
frame #7: 0x0000566eac6d6b1f surfaceflinger`main((null)=1, (null)=<unavailable>) at main_surfaceflinger.cpp:167:14
frame #8: 0x00007a3bc9670cca libc.so`::__libc_init(raw_args=<unavailable>, onexit=<unavailable>, slingshot=(surfaceflinger`main at main_surfaceflinger.cpp:79), structors=<unavailable>)(), int (*)(int, char **, char **), const structors_array_t *const) at libc_init_dynamic.cpp:157:8

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

#### DispSyncSource是VsyncDispatch与EventThread之间的桥梁

DispSyncSource是对标准SW VSYNC的细分，产生VSYNC-app，它可以认为是信号源，仍然需要触发下游组件来接受信号，对DisplaySyncSource来说，它的下游组件就是EventThread。所以说DispSyncSource是VsyncDispatch与EventThread之间通讯的纽带。

在DispSyncSource类中，下游组件用mCallback来表示，mCallback是VSyncSource::Callback类型，而EventThread也继承自VsyncSource::Callback。

相关代码如下：

DispSyncSource是怎么和VsyncDispatch建立联系？

这个和SF向VsyncDispatch注册很类似，DispSyncSource有个mCallbackRepeater对象，该对象在初始化的时候，会传入DispSyncSource的回调接口DispSyncsource::onVsyncCallback。

```c++
aosp/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp
void SurfaceFlinger::initScheduler(const sp<DisplayDevice>& display) {
    ...

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

    ...
}


aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp
ConnectionHandle Scheduler::createConnection(
        const char* connectionName, frametimeline::TokenManager* tokenManager,
        std::chrono::nanoseconds workDuration, std::chrono::nanoseconds readyDuration,
        impl::EventThread::InterceptVSyncsCallback interceptCallback) {

    auto vsyncSource = makePrimaryDispSyncSource(connectionName, workDuration, readyDuration);

    auto throttleVsync = makeThrottleVsyncCallback();

    auto getVsyncPeriod = makeGetVsyncPeriodFunction();

    auto eventThread = std::make_unique<impl::EventThread>(std::move(vsyncSource), tokenManager,
                                                           std::move(interceptCallback),
                                                           std::move(throttleVsync),
                                                           std::move(getVsyncPeriod));
    return createConnection(std::move(eventThread));
}


aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp
std::unique_ptr<VSyncSource> Scheduler::makePrimaryDispSyncSource(
        const char* name, std::chrono::nanoseconds workDuration,
        std::chrono::nanoseconds readyDuration, bool traceVsync) {
    return std::make_unique<scheduler::DispSyncSource>(mVsyncSchedule->getDispatch(),
                                                       mVsyncSchedule->getTracker(), workDuration,
                                                       readyDuration, traceVsync, name);
}

aosp/frameworks/native/services/surfaceflinger/Scheduler/DispSyncSource.cpp
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

aosp/frameworks/native/services/surfaceflinger/Scheduler/DispSyncSource.cpp
CallbackRepeater(VSyncDispatch& dispatch, VSyncDispatch::Callback cb, const char* name,
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

aosp/frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp
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

    ...

    mVSyncSource->setCallback(this);

    mThread = std::thread([this]() NO_THREAD_SAFETY_ANALYSIS {
        std::unique_lock<std::mutex> lock(mMutex);
        threadMain(lock);
    });

    ...
}

```

在初始化DispSyncSource的时候，会创建mCallbackRepeater对象，这个对象需要传入VsyncDispatch和DispSyncSource回调函数。

在CallbackRepeater的构造方法中，会创建VsyncCallbackRegistration这个对象，这个对象在创建的时候，会给VsyncDispatch注册回调函数。

当VsyncDispatch发送信号的时候，先传递给CallbackRepeater，再传递到DispSyncsource中。

当DispSyncSource收到信息会把信号发送到EventThread中。

回调函数调用栈：

```c++
thread #8, name = 'TimerDispatch', stop reason = breakpoint 1.1
frame #0: 0x00005ea86f2f9dd8 surfaceflinger`android::impl::EventThread::onVSyncEvent(this=0x000076d980a215d0, timestamp=104396993542, vsyncData=(expectedPresentationTime = 104429326874, deadlineTimestamp = 104413660208)) at EventThread.cpp:394:38
frame #1: 0x00005ea86f2f79d3 surfaceflinger`android::scheduler::CallbackRepeater::callback(long, long, long) [inlined] std::__1::__function::__value_func<void (long, long, long)>::operator(this=0x000076d940a24830, __args=0x000076d8ac0fca70, __args=0x000076d8ac0fca68, __args=0x000076d8ac0fca60)(long&&, long&&, long&&) const at functional:1799:16
frame #2: 0x00005ea86f2f79b1 surfaceflinger`android::scheduler::CallbackRepeater::callback(long, long, long) [inlined] std::__1::function<void (long, long, long)>::operator(this= Function = android::scheduler::DispSyncSource::onVsyncCallback(long, long, long) , __arg=104429326874, __arg=104396993542, __arg=104413660208)(long, long, long) const at functional:2347:12
frame #3: 0x00005ea86f2f79b1 surfaceflinger`android::scheduler::CallbackRepeater::callback(this=0x000076d940a24810, vsyncTime=104429326874, wakeupTime=104396993542, readyTime=104413660208) at DispSyncSource.cpp:92:9
frame #4: 0x00005ea86f3110db surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] std::__1::__function::__value_func<void (long, long, long)>::operator(this=0x000076d970a222b0, __args=0x000076d8ac0fcb18, __args=0x000076d8ac0fcb10, __args=0x000076d8ac0fcb08)(long&&, long&&, long&&) const at functional:1799:16
frame #5: 0x00005ea86f3110b9 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] std::__1::function<void (long, long, long)>::operator(this= Function = android::scheduler::CallbackRepeater::callback(long, long, long) , __arg=104429326874, __arg=104396993542, __arg=104413660208)(long, long, long) const at functional:2347:12
frame #6: 0x00005ea86f3110b9 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback() [inlined] android::scheduler::VSyncDispatchTimerQueueEntry::callback(this=0x000076d970a22290, vsyncTimestamp=<unavailable>, wakeupTimestamp=104396993542, deadlineTimestamp=104413660208) at VSyncDispatchTimerQueue.cpp:163:5
frame #7: 0x00005ea86f311087 surfaceflinger`android::scheduler::VSyncDispatchTimerQueue::timerCallback(this=<unavailable>) at VSyncDispatchTimerQueue.cpp:300:30
frame #8: 0x00005ea86f7a92d2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] std::__1::__function::__value_func<void ()>::operator(this=0x000076d8ac0fcc20)() const at functional:1799:16
frame #9: 0x00005ea86f7a92bb surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] std::__1::function<void ()>::operator(this= Function = android::scheduler::VSyncDispatchTimerQueue::timerCallback() )() const at functional:2347:12
frame #10: 0x00005ea86f7a92bb surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) at Timer.cpp:216:21
frame #11: 0x00005ea86f7a8ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] android::scheduler::Timer::threadMain(this=0x000076d930a16f30) at Timer.cpp:148:12
frame #12: 0x00005ea86f7a8ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] android::scheduler::Timer::Timer(this=0x000076d8c0a1f638)::$_0::operator()() const at Timer.cpp:44:46
frame #13: 0x00005ea86f7a8ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] decltype(__f=0x000076d8c0a1f638)::$_0>(fp)()) std::__1::__invoke<android::scheduler::Timer::Timer()::$_0>(android::scheduler::Timer::Timer()::$_0&&) at type_traits:4353:1
frame #14: 0x00005ea86f7a8ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(void*) [inlined] void std::__1::__thread_execute<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0>(__t=size=2, (null)=<unavailable>)::$_0>&, std::__1::__tuple_indices<>) at thread:342:5
frame #15: 0x00005ea86f7a8ff2 surfaceflinger`void* std::__1::__thread_proxy<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct> >, android::scheduler::Timer::Timer()::$_0> >(__vp=0x000076d8c0a1f630) at thread:352:5
frame #16: 0x000076db4154dd9b libc.so`__pthread_start(arg=0x000076d8ac0fccf0) at pthread_create.cpp:364:18
frame #17: 0x000076db414e1d48 libc.so`::__start_thread(fn=(libc.so`__pthread_start(void*) at pthread_create.cpp:339), arg=0x000076d8ac0fccf0)(void *), void *) at clone.cpp:53:16
```

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
void VSyncDispatchTimerQueue::timerCallback() {
    ...

    for (auto const& invocation : invocations) {
        invocation.callback->callback(invocation.vsyncTimestamp, invocation.wakeupTimestamp,
                                      invocation.deadlineTimestamp);
    }
}


aosp/frameworks/native/services/surfaceflinger/Scheduler/DispSyncSource.cpp
void CallbackRepeater::callback(nsecs_t vsyncTime, nsecs_t wakeupTime, nsecs_t readyTime) {
    {
        std::lock_guard lock(mMutex);
        mLastCallTime = std::chrono::nanoseconds(vsyncTime);
    }

    mCallback(vsyncTime, wakeupTime, readyTime);

    {
        std::lock_guard lock(mMutex);
        if (!mStarted) {
            return;
        }
        auto const scheduleResult =
                mRegistration.schedule({.workDuration = mWorkDuration.count(),
                                        .readyDuration = mReadyDuration.count(),
                                        .earliestVsync = vsyncTime});
        LOG_ALWAYS_FATAL_IF(!scheduleResult.has_value(), "Error rescheduling callback");
    }
}

aosp/frameworks/native/services/surfaceflinger/Scheduler/DispSyncSource.cpp
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

aosp/frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp
void EventThread::onVSyncEvent(nsecs_t timestamp, VSyncSource::VSyncData vsyncData) {
    std::lock_guard<std::mutex> lock(mMutex);

    LOG_FATAL_IF(!mVSyncState);
    mPendingEvents.push_back(makeVSync(mVSyncState->displayId, timestamp, ++mVSyncState->count,
                                       vsyncData.expectedPresentationTime,
                                       vsyncData.deadlineTimestamp));
    mCondition.notify_all();
}

```

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
