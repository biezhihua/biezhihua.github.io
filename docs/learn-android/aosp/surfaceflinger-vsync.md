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

## VSYNC-sf/VSYNC-app的申请与投递

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

### SF向VsyncDispatch注册回调的过程

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

### DispSyncSource是VsyncDispatch与EventThread之间的桥梁

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

### App向EventThread注册Connection

如果有App关心VSYN-APP，则需要向appEventThread注册Connection，可能有多个App同时关注VSYNC-app信号，所以在EventThread的内部有一个mDisplayEventConnections来保存着Connection，Connection是一个Bn对象，因为要与APP进行binder通讯。

```c++
 /frameworks/native/services/surfaceflinger/Scheduler/EventThread.h
 

class EventThread : public android::EventThread, private VSyncSource::Callback {
    ...

    std::vector<wp<EventThreadConnection>> mDisplayEventConnections GUARDED_BY(mMutex);

    ....
};

status_t EventThread::registerDisplayEventConnection(const sp<EventThreadConnection>& connection) {
    std::lock_guard<std::mutex> lock(mMutex);

    // this should never happen
    auto it = std::find(mDisplayEventConnections.cbegin(),
            mDisplayEventConnections.cend(), connection);
    if (it != mDisplayEventConnections.cend()) {
        ALOGW("DisplayEventConnection %p already exists", connection.get());
        mCondition.notify_all();
        return ALREADY_EXISTS;
    }

    mDisplayEventConnections.push_back(connection);
    mCondition.notify_all();
    return NO_ERROR;
}

void EventThread::removeDisplayEventConnectionLocked(const wp<EventThreadConnection>& connection) {
    auto it = std::find(mDisplayEventConnections.cbegin(),
            mDisplayEventConnections.cend(), connection);
    if (it != mDisplayEventConnections.cend()) {
        mDisplayEventConnections.erase(it);
    }
}

```

以上贴的三段代码，分别是定义Connection的集合对象，往appEventThread注册Connection和删除Connection。

```c++
ConnectionHandle Scheduler::createConnection(std::unique_ptr<EventThread> eventThread) {
    const ConnectionHandle handle = ConnectionHandle{mNextConnectionHandleId++};
    ALOGV("Creating a connection handle with ID %" PRIuPTR, handle.id);

    auto connection = createConnectionInternal(eventThread.get());

    std::lock_guard<std::mutex> lock(mConnectionsLock);
    mConnections.emplace(handle, Connection{connection, std::move(eventThread)});
    return handle;
}

sp<EventThreadConnection> Scheduler::createConnectionInternal(
        EventThread* eventThread, ISurfaceComposer::EventRegistrationFlags eventRegistration) {
    return eventThread->createEventConnection([&] { resync(); }, eventRegistration);
}

sp<EventThreadConnection> EventThread::createEventConnection(
        ResyncCallback resyncCallback,
        ISurfaceComposer::EventRegistrationFlags eventRegistration) const {
    return new EventThreadConnection(const_cast<EventThread*>(this),
                                     IPCThreadState::self()->getCallingUid(),
                                     std::move(resyncCallback), eventRegistration);
}

```

## SF请求VSYNC-sf

### scheduleFrame

当应用上帧的时候，也就是当BufferQueue有新的Graphic Buffer到达时，应用会通过binder通讯，调用到SurfaceFlinger的setTransactionState方法，再去调用setTransactionFlags方法，通知SF有新的Graphic Buffer到达：

SF的scheduleCommit方法中调用MessageQueue的scheduleFrame方法。

scheduleFrame方法就是SF去申请一次性的VSYNC。

```c++
应用上帧的调用栈

thread #17, name = 'binder:458_5', stop reason = breakpoint 1.3
frame #0: 0x000058e7b49e4022 surfaceflinger`android::SurfaceFlinger::setTransactionFlags(unsigned int, android::scheduler::TransactionSchedule, android::sp<android::IBinder> const&, android::SurfaceFlinger::FrameHint) [inlined] android::SurfaceFlinger::scheduleCommit(this=0x00006ffc7adad8c0, hint=kActive) at SurfaceFlinger.cpp:1827:14
frame #1: 0x000058e7b49e4022 surfaceflinger`android::SurfaceFlinger::setTransactionFlags(this=0x00006ffc7adad8c0, mask=16, schedule=<unavailable>, applyToken=<unavailable>, frameHint=kActive) at SurfaceFlinger.cpp:3705:9
frame #2: 0x000058e7b49fd042 surfaceflinger`android::SurfaceFlinger::setTransactionState(android::FrameTimelineInfo const&, android::Vector<android::ComposerState> const&, android::Vector<android::DisplayState> const&, unsigned int, android::sp<android::IBinder> const&, android::InputWindowCommands const&, long, bool, android::client_cache_t const&, bool, std::__1::vector<android::ListenerCallbacks, std::__1::allocator<android::ListenerCallbacks> > const&, unsigned long) [inlined] android::SurfaceFlinger::queueTransaction(this=0x00006ffc7adad8c0, state=0x00006ffae5e532a0) at SurfaceFlinger.cpp:4112:5
frame #3: 0x000058e7b49fce58 surfaceflinger`android::SurfaceFlinger::setTransactionState(this=<unavailable>, frameTimelineInfo=0x00006ffae5e53560, states=0x00006ffae5e53530, displays=0x00006ffae5e53500, flags=<unavailable>, applyToken=0x00006ffae5e534f0, inputWindowCommands=0x00006ffae5e53580, desiredPresentTime=0, isAutoTimestamp=<unavailable>, uncacheBuffer=0x00006ffae5e534c0, hasListenerCallbacks=<unavailable>, listenerCallbacks=size=0, transactionId=2508260901263) at SurfaceFlinger.cpp:4187:5
frame #4: 0x00006ffd830e74da libgui.so`android::BnSurfaceComposer::onTransact(this=0x00006ffc7adad8c0, code=<unavailable>, data=0x00006ffae5e53b00, reply=<unavailable>, flags=<unavailable>) at ISurfaceComposer.cpp:1100:20
frame #5: 0x000058e7b4a04351 surfaceflinger`android::SurfaceFlinger::onTransact(this=0x00006ffc7adad8c0, code=8, data=0x00006ffae5e53b00, reply=0x00006ffae5e53a80, flags=16) at SurfaceFlinger.cpp:5719:39
frame #6: 0x00006ffd860b46f1 libbinder.so`android::BBinder::transact(this=0x00006ffc7adad8c0, code=8, data=0x00006ffae5e53b00, reply=0x00006ffae5e53a80, flags=16) at Binder.cpp:297:19
frame #7: 0x00006ffd860bf834 libbinder.so`android::IPCThreadState::executeCommand(this=0x00006ffbcadac310, cmd=<unavailable>) at IPCThreadState.cpp:1293:68
frame #8: 0x00006ffd860bf2be libbinder.so`android::IPCThreadState::getAndExecuteCommand(this=0x00006ffbcadac310) at IPCThreadState.cpp:563:18
frame #9: 0x00006ffd860bfc90 libbinder.so`android::IPCThreadState::joinThreadPool(this=0x00006ffbcadac310, isMain=<unavailable>) at IPCThreadState.cpp:649:18
frame #10: 0x00006ffd860ef9e8 libbinder.so`android::PoolThread::threadLoop(this=0x00006ffb6adb6a30) at ProcessState.cpp:72:33
frame #11: 0x00006ffd8145be56 libutils.so`android::Thread::_threadLoop(user=0x00006ffb6adb6a30) at Mutex.h:0:12
frame #12: 0x00006ffd7ae66d9b libc.so`__pthread_start(arg=0x00006ffae5e53cf0) at pthread_create.cpp:364:18
frame #13: 0x00006ffd7adfad48 libc.so`::__start_thread(fn=(libc.so`__pthread_start(void*) at pthread_create.cpp:339), arg=0x00006ffae5e53cf0)(void *), void *) at clone.cpp:53:16
```

```c++

status_t SurfaceFlinger::setTransactionState(
        const FrameTimelineInfo& frameTimelineInfo, const Vector<ComposerState>& states,
        const Vector<DisplayState>& displays, uint32_t flags, const sp<IBinder>& applyToken,
        const InputWindowCommands& inputWindowCommands, int64_t desiredPresentTime,
        bool isAutoTimestamp, const client_cache_t& uncacheBuffer, bool hasListenerCallbacks,
        const std::vector<ListenerCallbacks>& listenerCallbacks, uint64_t transactionId) {
    ...

    queueTransaction(state);

    ...

    return NO_ERROR;
}

void SurfaceFlinger::queueTransaction(TransactionState& state) {
    ...

    setTransactionFlags(eTransactionFlushNeeded, schedule, state.applyToken, frameHint);
}

void SurfaceFlinger::setTransactionFlags(uint32_t mask, TransactionSchedule schedule,
                                         const sp<IBinder>& applyToken, FrameHint frameHint) {
    modulateVsync(&VsyncModulator::setTransactionSchedule, schedule, applyToken);

    if (const bool scheduled = mTransactionFlags.fetch_or(mask) & mask; !scheduled) {
        scheduleCommit(frameHint);
    }
}

void SurfaceFlinger::scheduleCommit(FrameHint hint) {
    if (hint == FrameHint::kActive) {
        mScheduler->resetIdleTimer();
    }
    mPowerAdvisor->notifyDisplayUpdateImminent();
    mScheduler->scheduleFrame();
}


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

### schedule

上面的代码是通过Vsync结构体的registration对象调用schedule方法。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/MessageQueue.h
struct Vsync {
    frametimeline::TokenManager* tokenManager = nullptr;
    std::unique_ptr<scheduler::VSyncCallbackRegistration> registration;

    mutable std::mutex mutex;
    TracedOrdinal<std::chrono::nanoseconds> workDuration
            GUARDED_BY(mutex) = {"VsyncWorkDuration-sf", std::chrono::nanoseconds(0)};
    std::chrono::nanoseconds lastCallbackTime GUARDED_BY(mutex) = std::chrono::nanoseconds{0};
    std::optional<nsecs_t> scheduledFrameTime GUARDED_BY(mutex);
    TracedOrdinal<int> value = {"VSYNC-sf", 0};
};
```

间接的调用到VsynDispatch的schedule方法。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
ScheduleResult VSyncCallbackRegistration::schedule(VSyncDispatch::ScheduleTiming scheduleTiming) {
    if (!mValidToken) {
        return std::nullopt;
    }
    return mDispatch.get().schedule(mToken, scheduleTiming);
}

aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
ScheduleResult VSyncDispatchTimerQueue::schedule(CallbackToken token,
                                                 ScheduleTiming scheduleTiming) {
    ScheduleResult result;
    {
        ...

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

void VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(
        nsecs_t now, CallbackMap::iterator const& skipUpdateIt) {
    ...

    if (min && min < mIntendedWakeupTime) {
        ...
        setTimer(*min, now);
    } else {
        ...
    }
}


void VSyncDispatchTimerQueue::setTimer(nsecs_t targetTime, nsecs_t /*now*/) {
    mIntendedWakeupTime = targetTime;
    mTimeKeeper->alarmAt(std::bind(&VSyncDispatchTimerQueue::timerCallback, this),
                         mIntendedWakeupTime);
    mLastTimerSchedule = mTimeKeeper->now();
}
```

其中的mToken是当初SF注册的到VsyncDispatch的索引，通过mToken可以找到注册到VsyncDispatch中的VsyncDispatchTimerQueueEntry对象，这个对象记录了很多信息，包括回调到SF的函数地址，下一次发送VSYNC信号的时间等等。

## VSYNC-sf产生和发射

从前面的代码可以看到，当应用上帧的时候，SurfaceFlinger就会去申请VSYNC-sf的信号，那申请的VSYNC-sf的信号，什么时候会发给SurfaceFlinger，去做合成的动作。从前面的代码，已经可以看到申请信息的时候，已经调用到VsyncDispatch的schedule的方法。

要了解VSYNC-sf的发射路径，需要仔细阅读VsyncDispatch的子类的实现逻辑，查看VSyncDispatchTimerQueue.cpp的代码如下：

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
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
```

从上面的代码，token是编号，就是代表sf，app或者appSF注册到VsyncDispatch的索引值，VsyncDispatch中有一个集合记录这三个的回调信息，也就是mCallbacks，这个里面存储了一个对象VsyncDispatchtimerQueueEntry，这个类很关键，它保存了回调的函数指针，回调的名字和两个信号直接的误差值等等。

```c++
/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatch.h

struct ScheduleTiming {
    nsecs_t workDuration = 0;
    nsecs_t readyDuration = 0;
    nsecs_t earliestVsync = 0;

     bool operator==(const ScheduleTiming& other) const {
         return workDuration == other.workDuration && readyDuration == other.readyDuration &&
                 earliestVsync == other.earliestVsync;
     }

     bool operator!=(const ScheduleTiming& other) const { return !(*this == other); }
 };
```

这个类保存了几个关键信息，有一个ArmingInfo是参与计算Vsync唤醒的时间信息。当SurfaceFlinger申请Vsync-sf的信号，从上面的schedule方法传入一个ScheduleTiming结构体。

```c++
/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatch.h

struct ScheduleTiming {
    nsecs_t workDuration = 0;
    nsecs_t readyDuration = 0;
    nsecs_t earliestVsync = 0;

     bool operator==(const ScheduleTiming& other) const {
         return workDuration == other.workDuration && readyDuration == other.readyDuration &&
                 earliestVsync == other.earliestVsync;
     }

     bool operator!=(const ScheduleTiming& other) const { return !(*this == other); }
 };
```

这个结构体会记录三个值，workDuration，readyDuration。这两个值是固定的，而且这两个值在不同的刷新率下都是不一样的，都是参与计算Vsync信号发射的时间，我们这边只重点关注earliestVsync，这个是上一个Vsync发射的时间。 这个值是很关键的，根据这个值，再通过一个软件模型校准的值，获得下一次Vsync发射的时间值。

前面的schedule方法中，假如是sf的token来申请Vsync信息，会调用callback->schedule这个方法，这个方法很重要，主要是根据上一次的vysnc发射时间计算下一次的Vsync发射时间。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp
ScheduleResult VSyncDispatchTimerQueueEntry::schedule(VSyncDispatch::ScheduleTiming timing,
                                                      VSyncTracker& tracker, nsecs_t now) {
    auto nextVsyncTime = tracker.nextAnticipatedVSyncTimeFrom(
            std::max(timing.earliestVsync, now + timing.workDuration + timing.readyDuration));
    auto nextWakeupTime = nextVsyncTime - timing.workDuration - timing.readyDuration;

    bool const wouldSkipAVsyncTarget =
            mArmedInfo && (nextVsyncTime > (mArmedInfo->mActualVsyncTime + mMinVsyncDistance));
    bool const wouldSkipAWakeup =
            mArmedInfo && ((nextWakeupTime > (mArmedInfo->mActualWakeupTime + mMinVsyncDistance)));
    if (wouldSkipAVsyncTarget && wouldSkipAWakeup) {
        return getExpectedCallbackTime(nextVsyncTime, timing);
    }

    bool const alreadyDispatchedForVsync = mLastDispatchTime &&
            ((*mLastDispatchTime + mMinVsyncDistance) >= nextVsyncTime &&
             (*mLastDispatchTime - mMinVsyncDistance) <= nextVsyncTime);
    if (alreadyDispatchedForVsync) {
        nextVsyncTime =
                tracker.nextAnticipatedVSyncTimeFrom(*mLastDispatchTime + mMinVsyncDistance);
        nextWakeupTime = nextVsyncTime - timing.workDuration - timing.readyDuration;
    }

    auto const nextReadyTime = nextVsyncTime - timing.readyDuration;
    mScheduleTiming = timing;
    mArmedInfo = {nextWakeupTime, nextVsyncTime, nextReadyTime};
    return getExpectedCallbackTime(nextVsyncTime, timing);
}

```

这个是最核心的逻辑，从上面代码可以看到下面几个点的逻辑顺序。

- 先传入之前的Vsync发射的时间，timeing这个对象，就是sf上一次发射信息的时间信息，这边有三个值，workDuration和readyDuration的值在不同刷新率下是不一样的，而且sf和app的配置也是不一样的，这两个值在参与计算值感觉只是一个阈值，并没有什么实际作用。 我们先举例这两个值都是0，在解释下上面的代码，我们先判断当前时间和上一次Vsync-sf发射的时间的最大值。

- 把最大值传递个VsyncTracker中的nextAnticipatedVsyncTimeFrom方法中，从传入的参数根据这个方法名字，可以获得下一次Vsync发射的时间，如果获取的发射时间大于mArmedInfo中记录的上一次发射的时间，需要把这次的申请的发射时间跳过不处理，还是用之前的发射时间。

- 如果还记录着最后一次vsync发射的时间，这个时间和下一次vsync发射的时间在一定的误差之中，重新校正下一次发发射时间，拿上一次最后发射的时间传到VsyncTracker中，获取下一次Vsync发射时间。
然后把发射时间，减去固定的值，保存到mArmedInfo中，用于后面的设置定时器。

```c++
/frameworks/native/services/surfaceflinger/Scheduler/VSyncDispatchTimerQueue.cpp

if (callback->wakeupTime() < mIntendedWakeupTime - mTimerSlack) {
    rearmTimerSkippingUpdateFor(now, it);//发射Vsync信号
}
```

这个方法执行完毕之后，会判断下一次发射的时间，和上一次设置的发射的时间做比较，如果小于这个值，需要把最近的发射时间重新设置到定时器中，这个mIntendedWakeupTiem变量在每次正常发射之后，这个值通常会设置为默认值，是int 8个字节的最大值 9223372036854775807，所以通常就会走到rearmTimerSkippingUpdateFor的函数中。

```c++
void VSyncDispatchTimerQueue::rearmTimerSkippingUpdateFor(
        nsecs_t now, CallbackMap::iterator const& skipUpdateIt) {
    std::optional<nsecs_t> min;
    std::optional<nsecs_t> targetVsync;
    std::optional<std::string_view> nextWakeupName;
    for (auto it = mCallbacks.begin(); it != mCallbacks.end(); it++) {
        auto& callback = it->second;
        if (!callback->wakeupTime() && !callback->hasPendingWorkloadUpdate()) {
            continue;
        }

        if (it != skipUpdateIt) {
            callback->update(mTracker, now);
        }
        auto const wakeupTime = *callback->wakeupTime();
        if (!min || *min > wakeupTime) {
            nextWakeupName = callback->name();
            min = wakeupTime;
            targetVsync = callback->targetVsync();
        }
    }

    if (min && min < mIntendedWakeupTime) {
        if (ATRACE_ENABLED() && nextWakeupName && targetVsync) {
            ftl::Concat trace(ftl::truncated<5>(*nextWakeupName), " alarm in ", ns2us(*min - now),
                              "us; VSYNC in ", ns2us(*targetVsync - now), "us");
            ATRACE_NAME(trace.c_str());
        }
        setTimer(*min, now);
    } else {
        ATRACE_NAME("cancel timer");
        cancelTimer();
    }
}
```

从上面的函数中，可以很明显的看出来，SurfaceFlinger申请的Vsync-sf发射时间，把下一次唤醒的时间传入这个函数中，首先在mCallbacks中查找有没有发现发射更早的时间，假如app申请的发射时间在处理中，如果传过来的是Vsync-sf的发射时间，会把app或者appSf的发射时间更新下，然后从中找一个最近的，最快的发射时间设置到定时器中。

```c++
void VSyncDispatchTimerQueue::setTimer(nsecs_t targetTime, nsecs_t /*now*/) {
    mIntendedWakeupTime = targetTime;
    mTimeKeeper->alarmAt(std::bind(&VSyncDispatchTimerQueue::timerCallback, this),
                         mIntendedWakeupTime);
    mLastTimerSchedule = mTimeKeeper->now();
}

```

定时器就是前面介绍的mTimer，我们把下次发射的时间设置到定时器中，会在对应的时间内回调到VsynDispatchTimerQueue的timerCallback方法中。然后把最近的一次发射时间设置给mIntendedWakerupTime这个变量。

假如Vsync-sf的定时器设置给Timer之后，接下来就是Vsync-sf的发射过程，假如Timer的定时器到时间之后，会调用到VsynDispatchTimerQueue的timerCallback中，这个timerCallback方法很重要。是分发SW-VSYNC的地方。

```c++
void VSyncDispatchTimerQueue::timerCallback() {
    struct Invocation {
        std::shared_ptr<VSyncDispatchTimerQueueEntry> callback;
        nsecs_t vsyncTimestamp;
        nsecs_t wakeupTimestamp;
        nsecs_t deadlineTimestamp;
    };
    std::vector<Invocation> invocations;
    {
        std::lock_guard lock(mMutex);
        auto const now = mTimeKeeper->now();
        mLastTimerCallback = now;
        for (auto it = mCallbacks.begin(); it != mCallbacks.end(); it++) {
            auto& callback = it->second;
            auto const wakeupTime = callback->wakeupTime();
            if (!wakeupTime) {
                continue;
            }

            auto const readyTime = callback->readyTime();

            auto const lagAllowance = std::max(now - mIntendedWakeupTime, static_cast<nsecs_t>(0));
            if (*wakeupTime < mIntendedWakeupTime + mTimerSlack + lagAllowance) {
                callback->executing();
                invocations.emplace_back(Invocation{callback, *callback->lastExecutedVsyncTarget(),
                                                    *wakeupTime, *readyTime});
            }
        }

        mIntendedWakeupTime = kInvalidTime;
        rearmTimer(mTimeKeeper->now());
    }

    for (auto const& invocation : invocations) {
        invocation.callback->callback(invocation.vsyncTimestamp, invocation.wakeupTimestamp,
                                      invocation.deadlineTimestamp);
    }
}
```

从上面的代码流程中，可以看到当发射的时间回调这个方法中，会在mCallbacks的集合中查找符合这次发射的时间的匹配者， 先判断该对象中的发射时间是否有效，如果有效的话，获取当前的时间信息和发射时间的差值。因为设置给定时器的唤醒时间，和当前时间按理是一致的，但是因为软件实现肯定是有偏差值的，所以拿发射的时间值，和真正的发射的时间值有个校验。如果符合发射的时间，则把需要发射的对象放到invocation的集合中。然后遍历这个集合挨个把Vsync信号发射给对应的代码。

## Vsync-app的申请和发射

### 应用向surfaceflinger注册connection

前面讲了Vsync-sf的发射，为什么这两块要分开说，因为再Android S版本之前的版本，Vsync-app和Vsync-sf都是EventThread的形式，在12版本上Vsync-sf的逻辑去掉EventThread的形式，谷歌做了重构，所以就剩下Vsync-app还是采用EventThead的形式。

接下来我们讲下应用怎么去申请Vsync-app的信号，本章节主要讲解SurfaceFlinger里面的逻辑，针对应用怎么申请Vsync-app信息，简单的说下，就是通过Choreographer这个对象去申请Vsync-app的信号，然后通过其内部类FrameDisplayEventReceiver来接受vsync信号，也就是Vsync-app的发射最后到这个对象里面，来触发app刷新，核心就是FrameDisplayEventReceiver类，这个类的初始化在是Choreographer的构造函数中。

```java
aosp/frameworks/base/core/java/android/view/Choreographer.java
private Choreographer(Looper looper, int vsyncSource) {
    mLooper = looper;
    mHandler = new FrameHandler(looper);
    mDisplayEventReceiver = USE_VSYNC
            ? new FrameDisplayEventReceiver(looper, vsyncSource)
            : null;
    mLastFrameTimeNanos = Long.MIN_VALUE;

    mFrameIntervalNanos = (long)(1000000000 / getRefreshRate());

    mCallbackQueues = new CallbackQueue[CALLBACK_LAST + 1];
    for (int i = 0; i <= CALLBACK_LAST; i++) {
        mCallbackQueues[i] = new CallbackQueue();
    }
    // b/68769804: For low FPS experiments.
    setFPSDivisor(SystemProperties.getInt(ThreadedRenderer.DEBUG_FPS_DIVISOR, 1));
}
```

FrameDisplayEventReceiver继承DisplayEventReceiver，在DisplayEventReceiver的构造方法中，调用nativeInit方法。

```java
private final class FrameDisplayEventReceiver extends DisplayEventReceiver
        implements Runnable {
        ...
}

/**
 * Creates a display event receiver.
 *
 * @param looper The looper to use when invoking callbacks.
 * @param vsyncSource The source of the vsync tick. Must be on of the VSYNC_SOURCE_* values.
 * @param eventRegistration Which events to dispatch. Must be a bitfield consist of the
 * EVENT_REGISTRATION_*_FLAG values.
 */
public DisplayEventReceiver(Looper looper, int vsyncSource, int eventRegistration) {
    if (looper == null) {
        throw new IllegalArgumentException("looper must not be null");
    }

    mMessageQueue = looper.getQueue();
    mReceiverPtr = nativeInit(new WeakReference<DisplayEventReceiver>(this), mMessageQueue,
            vsyncSource, eventRegistration);
}
```

这个方法会在初始化NativeDisplayEventReceiver对象，NativeDisplayEventReceiver对象继承DisplayEventDispatcher对象，这个对象在初始化的时候，会初始化mReceiver对象，初始化这个mReceiver对象的时候会创建DisplayEventReceiver对象。

```c++
aosp/frameworks/native/libs/gui/DisplayEventReceiver.cpp

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
/frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp

EventThreadConnection::EventThreadConnection(
        EventThread* eventThread, uid_t callingUid, ResyncCallback resyncCallback,
        ISurfaceComposer::EventRegistrationFlags eventRegistration)
      : resyncCallback(std::move(resyncCallback)),
        mOwnerUid(callingUid),
        mEventRegistration(eventRegistration),
        mEventThread(eventThread),
        mChannel(gui::BitTube::DefaultSize) {}

binder::Status EventThreadConnection::stealReceiveChannel(gui::BitTube* outChannel) {
    std::scoped_lock lock(mLock);
    if (mChannel.initCheck() != NO_ERROR) {
        return binder::Status::fromStatusT(NAME_NOT_FOUND);
    }

    outChannel->setReceiveFd(mChannel.moveReceiveFd());
    outChannel->setSendFd(base::unique_fd(dup(mChannel.getSendFd())));
    return binder::Status::ok();
}

void EventThreadConnection::onFirstRef() {
    // NOTE: mEventThread doesn't hold a strong reference on us
    mEventThread->registerDisplayEventConnection(this);
}
```

这个构造方法中有很重要的步骤，具体如下：

- 获取SurfaceFlinger的binder代理对象BpSurfaceComposer，就可以调用SurfaceFlinger binder服务端的接口

- 调用SurfaceFlinger的binder接口创建一个connection，这个connection就是注册到EventThread中，用来判断是不是要接受Vsync-app信号。

  - 在SurfaceFlinger创建这个这个connection是会走到EventThread的createEventConnection，在EventThreadConnection的构造方法中会创建一个sockert对象。这个mEventConnection也是一个binder对象，IDisplayEventConnection，SurfaceFlinger进程返回BpDisplayEventConnection赋值给mEventConection。而服务端就是EventThreadConnection。

- 在DisplayEventReceiver构造方法中也会创建一个空的gui::BitTubet对象，并且调用connection的binder接口，把socket对象设置到EventThreadConnection对象中，这个操作就是把两边关联起来，从代码实现可以看出是讲SurfaceFlinger进程中服务端创建的gui::BitTube对象赋值给应用端空的gui::BitTube对象。

- 然后EventThreadConnection初始化好之后，在第一次引用调用的时候，会把自己注册到EventThread的集合中mDisplayEventConnections。

### Vsync-app的申请和发射

接下来我们主要讲解app怎么向SurfaceFlinger申请Vsync-app的，然后Vsync-app的信号怎么发射到应用的。

正常应用要申请Vsync信号，都是通过Choregrapher对象调用postFrameCallback方法，而应用在绘制的时候也会调用这个方法，就是ViewRootImpl中的scheduleTraversals方法，其实在函数实现中也是调用了Choregrapher的postFrameCallback方法。

而postFrameCallback方法其实是调用Choreographer的scheduleFameLocked方法，调用到scheduleVsyncLocked方法，在调用到NativeDisplayEventReceiver的scheduleVsync方法中。因为继承关系查看DisplayEventDispather的scheduleVsync方法，可以看到是通过DisplayEventReceiver去请求下一个Vsync信号。

我们看下DisplayEventReceiver的requestNextVsync方法

```c++
status_t DisplayEventReceiver::requestNextVsync() {
    if (mEventConnection != nullptr) {
        mEventConnection->requestNextVsync();
        return NO_ERROR;
    }
    return mInitError.has_value() ? mInitError.value() : NO_INIT;
}
```

会调用到mEeventConnection的requestNextVsync接口，mEventConnection是binder的代理，最终会调用到SurfaceFlinger进程的binder服务端EventThreadConnection的requestNextVsync，接下来就是申请Vsyn-app信号，SurfaceFlinger模块的代码逻辑了。

```c++
void EventThread::requestNextVsync(const sp<EventThreadConnection>& connection) {
    if (connection->resyncCallback) {
        connection->resyncCallback();
    }

    std::lock_guard<std::mutex> lock(mMutex);

    if (connection->vsyncRequest == VSyncRequest::None) {
        connection->vsyncRequest = VSyncRequest::Single;
        mCondition.notify_all();
    } else if (connection->vsyncRequest == VSyncRequest::SingleSuppressCallback) {
        connection->vsyncRequest = VSyncRequest::Single;
    }
}
```

调用栈：

```c++
thread #17, name = 'binder:453_5', stop reason = step over
frame #0: 0x00005d3dc1ab6b1e surfaceflinger`android::impl::EventThread::requestNextVsync(this=0x00007b0c11c8a250, connection=0x00007b0b38d058a0) at EventThread.cpp:338:9
frame #1: 0x00005d3dc1ab5c8c surfaceflinger`android::EventThreadConnection::requestNextVsync(this=<unavailable>) at EventThread.cpp:197:19
frame #2: 0x00005d3dc1b77a12 surfaceflinger`android::gui::BnDisplayEventConnection::onTransact(this=0x00007b0be1c8f8f0, _aidl_code=<unavailable>, _aidl_data=0x00007b0b38d05b00, _aidl_reply=0x00007b0b38d05a80, _aidl_flags=<unavailable>) at IDisplayEventConnection.cpp:214:44
frame #3: 0x00007b0dd756d6f1 libbinder.so`android::BBinder::transact(this=0x00007b0be1c8f8f0, code=3, data=0x00007b0b38d05b00, reply=0x00007b0b38d05a80, flags=17) at Binder.cpp:297:19
frame #4: 0x00007b0dd7578834 libbinder.so`android::IPCThreadState::executeCommand(this=0x00007b0c21c9dd40, cmd=<unavailable>) at IPCThreadState.cpp:1293:68
frame #5: 0x00007b0dd75782be libbinder.so`android::IPCThreadState::getAndExecuteCommand(this=0x00007b0c21c9dd40) at IPCThreadState.cpp:563:18
frame #6: 0x00007b0dd7578c90 libbinder.so`android::IPCThreadState::joinThreadPool(this=0x00007b0c21c9dd40, isMain=<unavailable>) at IPCThreadState.cpp:649:18
frame #7: 0x00007b0dd75a89e8 libbinder.so`android::PoolThread::threadLoop(this=0x00007b0bc1c93140) at ProcessState.cpp:72:33
frame #8: 0x00007b0dddfe4e56 libutils.so`android::Thread::_threadLoop(user=0x00007b0bc1c93140) at Mutex.h:0:12
frame #9: 0x00007b0dd1d4ed9b libc.so`__pthread_start(arg=0x00007b0b38d05cf0) at pthread_create.cpp:364:18
frame #10: 0x00007b0dd1ce2d48 libc.so`::__start_thread(fn=(libc.so`__pthread_start(void*) at pthread_create.cpp:339), arg=0x00007b0b38d05cf0)(void *), void *) at clone.cpp:53:16
```

从代码中可以看出来，会把当前的申请Vsync-app的Connection的vsyncRequest赋值为 VsyncRequest::Single。我们可以理解一个应用就代表一个Connection。

如果某个应用的申请了Vsync-app信号，就会把对应的EventThreadConnection对象中的vsyncRequest变量进行重新赋值。

接下来看看EventThread如何处理，我们要从EventThread的线程函数看起：

```c++

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

```

EventThread的线程函数循环调用，一方面检测是否有Vsync信号发送过来了mPendingEvent，一方面检查是否有app请求了Vsync信号，如果有Vsync信号，而且有app请求了Vsync，则通过Connection把Vsync事件发送到对端。

从代码的的细节可以看出几个点：

- 检查是否有VsyncDispatch是否发送Vsync过来，所以要要遍历mPendingEvent

- 检查是否有app对Vsync感兴趣，所以要遍历EventThread的mDisplayEventConnections。

- 如果有Vsyn事件过来，但是没人对它感兴趣，说们本次Vsync就可以关闭了，见上面的mVsyncSource->setVsyncEnabled(false)方法。

- 如果有app申请了Vsync，但是没有接受到Vsync事件，可能是把之前的Vsync关了，所以要从新打开，并坐等下次Vsync的到来，但是为了保证安全，不能死等，所以设置一个timeout的时间。

### setVsyncEnabled

这个方法是开关Vsync-app信号的函数，从这个函数的实现，是间接调用mCallbackRepeater的start和stop方法。而CallbackRepeater是在创建DispSyncSource对象构造方法中创建的。

```c++
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

void DispSyncSource::setVSyncEnabled(bool enable) {
    std::lock_guard lock(mVsyncMutex);
    if (enable) {
        mCallbackRepeater->start(mWorkDuration, mReadyDuration);
        // ATRACE_INT(mVsyncOnLabel.c_str(), 1);
    } else {
        mCallbackRepeater->stop();
        // ATRACE_INT(mVsyncOnLabel.c_str(), 0);
    }
    mEnabled = enable;
}
```

可以看出CallbackRepeater对象传入了几个参数，一个是VsyncDispatch对象，一个回调的函数，是为了接受Vsync-app发射的信号。而在CallbackRepeater对象中的构造方法会把CallbackRepeater的回调函数，初始化VsyncCallbackRegistration，这个是一个辅助类，在构造方法中会在VsyncDispatch注册回调函数和回调的名字等信息。可以这样理解，DispSyncSource是EventThread和VsyncDispatch的纽带。

DispsyncSource中，VsyncCallbackRegistration是一个辅助类主要是帮助VsyncDispatch注册回调函数而且。

所以app申请Vsycn-app信号，调用DispVsynSource的setVsyncEnabled的函数，是间接调用CallbackRepeater的start的函数，就是这个类封装了VsyncDispatch的操作，也就是调用VsyncDispatch的schedule函数。

```c++
void start(std::chrono::nanoseconds workDuration, std::chrono::nanoseconds readyDuration) {
    std::lock_guard lock(mMutex);
    mStarted = true;
    mWorkDuration = workDuration;
    mReadyDuration = readyDuration;

    auto const scheduleResult =
            mRegistration.schedule({.workDuration = mWorkDuration.count(),
                                    .readyDuration = mReadyDuration.count(),
                                    .earliestVsync = mLastCallTime.count()});
    LOG_ALWAYS_FATAL_IF((!scheduleResult.has_value()), "Error scheduling callback");
}
void stop() {
    std::lock_guard lock(mMutex);
    LOG_ALWAYS_FATAL_IF(!mStarted, "DispSyncInterface misuse: callback already stopped");
    mStarted = false;
    mRegistration.cancel();
}
```

从前面讲解Vsync-sf的申请和发射，我们知道了这个schedule函数是请求Vsync-app信号的函数，这块代码和Vsync-sf的申请是一样的，就是计算下一次Vsync-app唤醒的时间，通过timer机制，把这个Vsync-app信号回调到注册到VsyncDiaptch的函数。

从Vsync-app的申请来看，最后会回调到CallbackRepeater的callback函数中，在这个函数中会调用mCallback函数，而这个函数的回调方法是DispSyncSource中的onVysncCallback函数中。

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

在这个函数中，首先会在Vsync-app的trace上标记信息，也即是开头那张图片的信息，所以为什么是断断续续的，是因为Vsync-app申请本来就是随机的。

然后调用callback的onVysncEvent函数，而callback就是EventThread对象，最终调用到EventThread的onVsyncEvent中。

```c++
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

从代码中可以看到，Vsync-app的信号加入到mPendingEvents中，然后唤醒theadMain的线程循环，然后找到对应的申请的应用，然后调用dispatchEvent函数

```c++
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

遍历DisplayEventConsumers的对象，挨个调用postEvent方法。

这个DisplayEventConsumers就是connection的vector集合对象，然后通过connection对象把Vsync事件发送出去。后面应用怎么接受到这个Vsync-app的信号，本章节就不分析，大家有兴趣的话可以自己下来了解下。

## SW VSYNC模型和校准

在Android S之前的版本，开关硬件VSync开关是有一个线程都做的，在12版本上面都已经做了重构。

### resyncToHardwareVsync

在前面的根据上一次的发射时间获取下一次的发射时间，调用VsyncTracker的nextAnticipatedVsyncTimeFrom方法中。在这个模型中，我们要关注几个核心参数：

- period: VSYNC周期

- mTimestamps: 硬件的时间戳样本集合

在开机的时候，SurfaceFlinger在初始化Display之后，会调用resyncToHardwareVsync方法与硬件VSYNC进行同步，调用链如下：

```c++
SurfaceFlinger::init()
 └-->initializeDisplays()
      └-->onInitializeDisplays()
           └-->setPowerModeInternal()
                 └-->resyncToHardwareVsync()
```

resyncToHardwareVsync的代码如下：

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp
void Scheduler::resyncToHardwareVsync(bool makeAvailable, Fps refreshRate) {
    {
        std::lock_guard<std::mutex> lock(mHWVsyncLock);
        if (makeAvailable) {
            mHWVsyncAvailable = makeAvailable;
        } else if (!mHWVsyncAvailable) {
            // Hardware vsync is not currently available, so abort the resync
            // attempt for now
            return;
        }
    }

    setVsyncPeriod(refreshRate.getPeriodNsecs());
}

```

makeAvailable默认传入true，period传入的是当前屏幕刷新率的周期值，这个在SurfaceFlinger初始化的时候，把硬件支持的帧率和周期都一对一保存起来，例如fps是60，period是16.666666。fps是90，period是11.111111。再调用到setVsyncPeriod，从这个方法名字可以看到，当屏幕的刷新率发生变化，软件模型肯定要重新同步硬件的时间戳信息，重新计算当前屏幕刷新率对应的period值。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp
void Scheduler::setVsyncPeriod(nsecs_t period) {
    if (period <= 0) return;

    std::lock_guard<std::mutex> lock(mHWVsyncLock);
    mVsyncSchedule->getController().startPeriodTransition(period);

    if (!mPrimaryHWVsyncEnabled) {
        mVsyncSchedule->getTracker().resetModel();
        mSchedulerCallback.setVsyncEnabled(true);
        mPrimaryHWVsyncEnabled = true;
    }
}

```

mPrimaryHWVsyncEnabled这个变量默认为false，就会走到下面的逻辑中，resetModel方法会清空软件模型的记录的硬件时间戳集合，setVsyncEnabled方法把硬件回调给SurfaceFlinger的开关打开，这个回调方法打开之后，硬件的Vsync信息会通过回调接口通知给SurfaceFlinger，在这个回调接口中，会把硬件的Vsync信息保存到VsyncTracker中。

```c++
aosp/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp
void SurfaceFlinger::onComposerHalVsync(hal::HWDisplayId hwcDisplayId, int64_t timestamp,
                                        std::optional<hal::VsyncPeriodNanos> vsyncPeriod) {
    const std::string tracePeriod = [vsyncPeriod]() {
        if (ATRACE_ENABLED() && vsyncPeriod) {
            std::stringstream ss;
            ss << "(" << *vsyncPeriod << ")";
            return ss.str();
        }
        return std::string();
    }();
    ATRACE_FORMAT("onComposerHalVsync%s", tracePeriod.c_str());

    Mutex::Autolock lock(mStateLock);
    const auto displayId = getHwComposer().toPhysicalDisplayId(hwcDisplayId);
    if (displayId) {
        const auto token = getPhysicalDisplayTokenLocked(*displayId);
        const auto display = getDisplayDeviceLocked(token);
        display->onVsync(timestamp);
    }

    if (!getHwComposer().onVsync(hwcDisplayId, timestamp)) {
        return;
    }

    const bool isActiveDisplay =
            displayId && getPhysicalDisplayTokenLocked(*displayId) == mActiveDisplayToken;
    if (!isActiveDisplay) {
        // For now, we don't do anything with non active display vsyncs.
        return;
    }

    bool periodFlushed = false;
    mScheduler->addResyncSample(timestamp, vsyncPeriod, &periodFlushed);
    if (periodFlushed) {
        modulateVsync(&VsyncModulator::onRefreshRateChangeCompleted);
    }
}

```

如代码所示，mScheduler->addResyncSample方法把硬件的时间戳信息timestamp保存起来。

等于上面的代码干了三件事情：

- 首先从HWC获取到硬件VSYNC的周期period，设置给VsyncController中。

- VsyncTracker先清理之前记录的采样信息，准备开始硬件VSYNC采样

- 通过mSchedulerCallback的setVsyncEnabled方法打开硬件VSYNC事件上报

相关代码如下： resetModel方法

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncPredictor.cpp

void VSyncPredictor::resetModel() {
    std::lock_guard lock(mMutex);
    mRateMap[mIdealPeriod] = {mIdealPeriod, 0};
    clearTimestamps();
}

void VSyncPredictor::clearTimestamps() {
    if (!mTimestamps.empty()) {
        auto const maxRb = *std::max_element(mTimestamps.begin(), mTimestamps.end());
        if (mKnownTimestamp) {
            mKnownTimestamp = std::max(*mKnownTimestamp, maxRb);
        } else {
            mKnownTimestamp = maxRb;
        }

        mTimestamps.clear();
        mLastTimestampIndex = 0;
    }
}

```

会清空mRateMap对应period的value对象，这个是一个结构体Model，会记录软件模型计算出来的Vsync周期。

### SW VSYNC模型更新与校准

前面已经把硬件的VSYNC回调打开了，那么每次HW VSYNC事件上报时，会调用Schedule的 addResyncSample方法，也就是会调用VsyncController中的addHwVsynctimestamp，从方法的名字可以看出，把硬件VSYNC的时间戳信息添加这个对象中。

```c++
bool VSyncReactor::addHwVsyncTimestamp(nsecs_t timestamp, std::optional<nsecs_t> hwcVsyncPeriod,
                                       bool* periodFlushed) {
    assert(periodFlushed);

    std::lock_guard lock(mMutex);
    if (periodConfirmed(timestamp, hwcVsyncPeriod)) {
        ATRACE_NAME("VSR: period confirmed");
        if (mPeriodTransitioningTo) {
            mTracker.setPeriod(*mPeriodTransitioningTo);
            *periodFlushed = true;
        }

        if (mLastHwVsync) {
            mTracker.addVsyncTimestamp(*mLastHwVsync);
        }
        mTracker.addVsyncTimestamp(timestamp);

        endPeriodTransition();
        mMoreSamplesNeeded = mTracker.needsMoreSamples();
    } else if (mPeriodConfirmationInProgress) {
        ATRACE_NAME("VSR: still confirming period");
        mLastHwVsync = timestamp;
        mMoreSamplesNeeded = true;
        *periodFlushed = false;
    } else {
        ATRACE_NAME("VSR: adding sample");
        *periodFlushed = false;
        mTracker.addVsyncTimestamp(timestamp);
        mMoreSamplesNeeded = mTracker.needsMoreSamples();
    }

    if (!mMoreSamplesNeeded) {
        setIgnorePresentFencesInternal(false);
    }
    return mMoreSamplesNeeded;
}
```

这个函数有三个操作，首先会把当前的硬件上报的时间戳信息和当前的屏幕刷新率对于的固定period传入periodConfirmed方法中。这个periodConfirmed，就是确认是否有新的period设置进来，就是有没有发生屏幕刷新率切换。如果没有发生切换，这个函数默认返回false，如果没有发生刷新率切换，就是在保持同一个刷新率的情况下，最后走到else的逻辑中。也就是把timestamp这个变量添加到VsyncTracker对象中，然后调用该对象的needsMoreSamples方法判断要不要更多的样本，这边默认是6个样本，所以如果样本个数还没有达到，是需要一直增加样本到6个。就不需要样本了，就会把HW SYNC的硬件上报开关关闭掉。

可以说做2件事情：

- mTracker.addVsyncTimestamp方法，把样本加入到VsycnTracker的子类VsyncPredictor对象中。

- 通过needsMoreSamples方法，判断要不要获取更多的样本，如果样本足够，调用schedule的disableHardwareVsync函数，关闭硬件校准上报开关。

#### addVsyncTimestamp

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncPredictor.cpp
bool VSyncPredictor::addVsyncTimestamp(nsecs_t timestamp) {
    std::lock_guard lock(mMutex);

    if (!validate(timestamp)) {
        // VSR could elect to ignore the incongruent timestamp or resetModel(). If ts is ignored,
        // don't insert this ts into mTimestamps ringbuffer. If we are still
        // in the learning phase we should just clear all timestamps and start
        // over.
        if (mTimestamps.size() < kMinimumSamplesForPrediction) {
            // Add the timestamp to mTimestamps before clearing it so we could
            // update mKnownTimestamp based on the new timestamp.
            mTimestamps.push_back(timestamp);
            clearTimestamps();
        } else if (!mTimestamps.empty()) {
            mKnownTimestamp =
                    std::max(timestamp, *std::max_element(mTimestamps.begin(), mTimestamps.end()));
        } else {
            mKnownTimestamp = timestamp;
        }
        return false;
    }

    if (mTimestamps.size() != kHistorySize) {
        mTimestamps.push_back(timestamp);
        mLastTimestampIndex = next(mLastTimestampIndex);
    } else {
        mLastTimestampIndex = next(mLastTimestampIndex);
        mTimestamps[mLastTimestampIndex] = timestamp;
    }

    const size_t numSamples = mTimestamps.size();
    if (numSamples < kMinimumSamplesForPrediction) {
        mRateMap[mIdealPeriod] = {mIdealPeriod, 0};
        return true;
    }

    // This is a 'simple linear regression' calculation of Y over X, with Y being the
    // vsync timestamps, and X being the ordinal of vsync count.
    // The calculated slope is the vsync period.
    // Formula for reference:
    // Sigma_i: means sum over all timestamps.
    // mean(variable): statistical mean of variable.
    // X: snapped ordinal of the timestamp
    // Y: vsync timestamp
    //
    //         Sigma_i( (X_i - mean(X)) * (Y_i - mean(Y) )
    // slope = -------------------------------------------
    //         Sigma_i ( X_i - mean(X) ) ^ 2
    //
    // intercept = mean(Y) - slope * mean(X)
    //
    std::vector<nsecs_t> vsyncTS(numSamples);
    std::vector<nsecs_t> ordinals(numSamples);

    // Normalizing to the oldest timestamp cuts down on error in calculating the intercept.
    const auto oldestTS = *std::min_element(mTimestamps.begin(), mTimestamps.end());
    auto it = mRateMap.find(mIdealPeriod);
    auto const currentPeriod = it->second.slope;

    // The mean of the ordinals must be precise for the intercept calculation, so scale them up for
    // fixed-point arithmetic.
    constexpr int64_t kScalingFactor = 1000;

    nsecs_t meanTS = 0;
    nsecs_t meanOrdinal = 0;

    for (size_t i = 0; i < numSamples; i++) {
        traceInt64If("VSP-ts", mTimestamps[i]);

        const auto timestamp = mTimestamps[i] - oldestTS;
        vsyncTS[i] = timestamp;
        meanTS += timestamp;

        const auto ordinal = (vsyncTS[i] + currentPeriod / 2) / currentPeriod * kScalingFactor;
        ordinals[i] = ordinal;
        meanOrdinal += ordinal;
    }

    meanTS /= numSamples;
    meanOrdinal /= numSamples;

    for (size_t i = 0; i < numSamples; i++) {
        vsyncTS[i] -= meanTS;
        ordinals[i] -= meanOrdinal;
    }

    nsecs_t top = 0;
    nsecs_t bottom = 0;
    for (size_t i = 0; i < numSamples; i++) {
        top += vsyncTS[i] * ordinals[i];
        bottom += ordinals[i] * ordinals[i];
    }

    if (CC_UNLIKELY(bottom == 0)) {
        it->second = {mIdealPeriod, 0};
        clearTimestamps();
        return false;
    }

    nsecs_t const anticipatedPeriod = top * kScalingFactor / bottom;
    nsecs_t const intercept = meanTS - (anticipatedPeriod * meanOrdinal / kScalingFactor);

    auto const percent = std::abs(anticipatedPeriod - mIdealPeriod) * kMaxPercent / mIdealPeriod;
    if (percent >= kOutlierTolerancePercent) {
        it->second = {mIdealPeriod, 0};
        clearTimestamps();
        return false;
    }

    traceInt64If("VSP-period", anticipatedPeriod);
    traceInt64If("VSP-intercept", intercept);

    it->second = {anticipatedPeriod, intercept};

    ALOGV("model update ts: %" PRId64 " slope: %" PRId64 " intercept: %" PRId64, timestamp,
          anticipatedPeriod, intercept);
    return true;
}
```

这块代码是SW 模型更新的核心，是最关键的部分，是通过硬件VSYNC的样本计算出当前屏幕刷新率对于的Vsync周期，在这个方法中，谷歌采用了简单一元线性回归分析预测法，回归分析是一种预测性的建模技术，它研究的是因变量和自变量之间的关系。它能够表明自多个自变量对一个因变量的影响强度。这种技术通常用于预测分析、时间序列模型以及发现变量之间的因果关系。回归分析是一种通过建立模型来研究变量之间相互关系的密切程度、结构状态及进行模型预测的有效工具，是建模和分析数据的重要工具。

由于很多现象需要多个因素做全面分析，只有当众多因素中确实存在一个对因变量影响作用明显高于其他因素的变量，才能将它作为自变量，应用一元相关的回归分析进行预测，而谷歌采用的是回归算法中的最小二乘法。

![](/learn-android/aosp/surfaceflinger-vsync-5.webp)

在这个方程式中，b就是回归系数，a就是截距。

如果提供了一组x因变量的一组数据，再提供一组y自变量的一组数据，就可以通过上面的方程式推导出回归系数b和截距a。

回到代码，按照默认的流程分析这个函数，首先有一个集合mTimestamps会存储硬件的VSYNC样本，刚开始的时候这个样本集合会清空，最多采6个样本就可以进行计算，简单描述上述代码的流程如下：

- 清空mTimestamps的样本集合，打开硬件VSYNC开关，开始采集样本。

- 传入的时间戳会做一些校验工作，validate这个函数会对数据做一些处理，例如重复的数据等等。

- 如果传入的数据没有问题，则会一直添加到mTimestamps集合中，直到采6个样本信息就关闭VSYNC开关。

- 通过着6个样本，计算出x的因变量集合 ordinals，和y的自变量集合vsyncTS。通过6个样本把这两个集合的数据都计算出来，然后通过上面的方程式把回归系数和截距都计算出来，这块的回归系数就是Vsync的时间周期，前面我加过日志，我把这两个集合的内容可以贴出来看下，以下是90fps的vsync信息。

x的集合内容 {0，1000，2000，3000，4000，5000} ，从集合的内容是vsync的个数信息。

y的集合内容{0，11027000，22053000，33080000，44106000，55132000}，从代码中了解是硬件vsync时间戳的递增值，因为两个硬件vsync的时间戳的差值可以理解是一个vsync周期。

- 从这两个集合数据计算出回归系数b，和截距a，保存到当前的屏幕刷新率作为key的mRateMap的value中，这个value是一个结构体，保存两个值，当前屏幕刷新率对于的回归系数和截距。

#### nextAnticipatedVsyncTimeFromLocked

有了这个回归系数和截距，就可以传入上一次app或者sf发射的时间，计算出下一次发射的时间 ，在前面讲解Vsync-sf的发射流程，有一个很重要的点就是要计算下一次发射的时间，就是调用VsyncTracker的nextAnticipatedVsyncTimeFromLocked方法。

代码如下：

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/VSyncPredictor.cpp
nsecs_t VSyncPredictor::nextAnticipatedVSyncTimeFromLocked(nsecs_t timePoint) const {
    auto const [slope, intercept] = getVSyncPredictionModelLocked();

    if (mTimestamps.empty()) {
        traceInt64If("VSP-mode", 1);
        auto const knownTimestamp = mKnownTimestamp ? *mKnownTimestamp : timePoint;
        auto const numPeriodsOut = ((timePoint - knownTimestamp) / mIdealPeriod) + 1;
        return knownTimestamp + numPeriodsOut * mIdealPeriod;
    }

    auto const oldest = *std::min_element(mTimestamps.begin(), mTimestamps.end());

    // See b/145667109, the ordinal calculation must take into account the intercept.
    auto const zeroPoint = oldest + intercept;
    auto const ordinalRequest = (timePoint - zeroPoint + slope) / slope;
    auto const prediction = (ordinalRequest * slope) + intercept + oldest;

    traceInt64If("VSP-mode", 0);
    traceInt64If("VSP-timePoint", timePoint);
    traceInt64If("VSP-prediction", prediction);

    auto const printer = [&, slope = slope, intercept = intercept] {
        std::stringstream str;
        str << "prediction made from: " << timePoint << "prediction: " << prediction << " (+"
            << prediction - timePoint << ") slope: " << slope << " intercept: " << intercept
            << "oldestTS: " << oldest << " ordinal: " << ordinalRequest;
        return str.str();
    };

    ALOGV("%s", printer().c_str());
    LOG_ALWAYS_FATAL_IF(prediction < timePoint, "VSyncPredictor: model miscalculation: %s",
                        printer().c_str());

    return prediction;
}
```

从上面的代码可以看到这个流程。

- 先判断mTimestamps的集合是否为空，如果为空，则拿默认值，90的帧率就是11.11111us去参与计算，mKnownTimestamp是之前样本的最大值，和传入上一次发射的时间做差值除Vsync的周期时间，我们理解样本的时间是比上一次的发射时间大，因为surfaceflinger在做合成的时候会把之前的fence时间的时间戳也存到这个集合中，这边会固定计算出下一个vsync发射的时间。

- 如果mTimestamps的集合不为空，通过这个集合的数据和传入的发射时间，算出一次线程回归方式的因变量x值，然后根据回归系数和截距，用方程式计算出自变量y值，而y值，也就是代码中的prediction，作为下一次vsync发射的时间。

以上的两个函数是最核心的逻辑，然后有同学会问，什么时候会打硬件Vsync开关，什么时候会关闭。除了刚开机的时候，会打开硬件Vsync开关，如果模型校准完成之后，再关闭。还有切换刷新率的时候也会打开Vsycn开关。

```c++
void EventThread::requestNextVsync(const sp<EventThreadConnection>& connection) {
    if (connection->resyncCallback) {
        connection->resyncCallback();
    }

    std::lock_guard<std::mutex> lock(mMutex);

    if (connection->vsyncRequest == VSyncRequest::None) {
        connection->vsyncRequest = VSyncRequest::Single;
        mCondition.notify_all();
    } else if (connection->vsyncRequest == VSyncRequest::SingleSuppressCallback) {
        connection->vsyncRequest = VSyncRequest::Single;
    }
}
```

它会先调用connection的resyncCallback的方法。这个方法是创建这个Connection的时候，传入的回调函数。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp
sp<EventThreadConnection> Scheduler::createConnectionInternal(
        EventThread* eventThread, ISurfaceComposer::EventRegistrationFlags eventRegistration) {
    return eventThread->createEventConnection([&] { resync(); }, eventRegistration);
}
```

等于每次app要申请的时候，会走到resyncAndRefresh中，这个函数就会强制进行一次硬件的VSYNC校准。

```c++
aosp/frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp
void Scheduler::resync() {
    static constexpr nsecs_t kIgnoreDelay = ms2ns(750);

    const nsecs_t now = systemTime();
    const nsecs_t last = mLastResyncTime.exchange(now);

    if (now - last > kIgnoreDelay) {
        const auto refreshRate = [&] {
            std::scoped_lock lock(mRefreshRateConfigsLock);
            return mRefreshRateConfigs->getActiveMode()->getFps();
        }();
        resyncToHardwareVsync(false, refreshRate);
    }
}
```

}
这个红色框框的部分，就是通知VsyncControler告诉VsyncTracker把时间戳清空掉，然后开始添加新的VSYNC时间戳信息，然后再进行校准。

除了上面的这种情况，还有一种情况，就是SurfaceFlinger再进行合成的时候，会把上一帧的完成合成的fence的时间也会同时添加到VsyncTracker的的时间戳集合。这个集合再情况的情况下，除了会增加6个硬件采样之外，这个集合也会添加fence的时间信息。

```c++
/home/biezhihua/projects/aosp/frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp

if (display && display->isInternal() && display->getPowerMode() == hal::PowerMode::ON &&
    mPreviousPresentFences[0].fenceTime->isValid()) {
    mScheduler->addPresentFence(mPreviousPresentFences[0].fenceTime);
}

void Scheduler::addPresentFence(const std::shared_ptr<FenceTime>& fenceTime) {
    if (mVsyncSchedule.controller->addPresentFence(fenceTime)) {
        enableHardwareVsync();
    } else {
        disableHardwareVsync(false);
    }
}
```

如上图的代码所示，我们通过给VsyncController中添加fence的时间信息，也会判断当前要不要打开Vsync进行校准，但是默认都是不打开VSYNC校准的，因为每一帧的合成都会把fence的时间传入到这个VsyncTracker中的时间戳集合中，所以这个函数会每次合成的时候都会重新计算回归系数和截距。

- 从HWC获取的display完成显示的fence， HW VSYNC就是display显示完成后发出来的，因此这个fence的时间戳可以看作是发射HW VSYNC的恰当时刻，虽然HW VSYNC可能已经关闭了。

- 将fence样本加入到VsyncTracker中，会重新校准出新的Vsync周期，如果再校准中的过程中发生误差过大，会重新打开HW VSYNC进行校准，所谓的校准，就是重新采集HW VSYNC样本，重新计算出新的回归习系数（vsync周期）和截距。

以上就是在SurfaceFlinger的postComposition中一直调用的方法。

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
