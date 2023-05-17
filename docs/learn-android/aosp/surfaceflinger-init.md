---
tag:
  - android
  - aosp
---

# Android | AOSP | SurfaceFlinger模块

## 前言1

转载自：<https://www.jianshu.com/p/db6f62f70ed1> ，并结合Perfetto更新了部分内容。

SurfaceFlinger是一个系统服务，作用就是接受不同layer的buffer数据进行合成，然后发送到显示设备进行显示。

SurfaceFlinger进程是什么时候起来的？

在之前的Android低版本手机上，SurfaceFlinger进程是在init.rc中启动的，在最新的高版本上SurfaceFlinger进程并不是直接在init.rc文件中启动的，而是通过Android.bp去启动surfaceflinger.rc文件，然后解析文件内容启动SurfaceFlinger进程。

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

关于init.rc文件的解析和Android.bp编译脚本的执行本文不做深入研究，启动SurfaceFlinger进程，就会执行到main函数。

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

关于main函数中，有几个关键的点需要关注。

- ProcessState::self() 函数的调用，个人理解是同binder驱动建立链接，获取驱动的版本，通知驱动，同时启动线程来处理Client的请求，总结如下：
（1）构建ProcessState全局对象gProcess
（2）打开binder驱动，建立链接
（3）在驱动内部创建该进程的binder_proc,binder_thread结构，保存该进程的进程信息和线程信息，并加入驱动的红黑树队列中。
（4）获取驱动的版本信息
（5）把该进程最多可同时启动的线程告诉驱动，并保存到改进程的binder_proc结构中
（6）把设备文件/dev/binder映射到内存中

- 设置SurfaceFlinger进程的优先级

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
adb shell ls -l /dev/cpuset

查看system-background的cpuset的cpu
adb shell cat /dev/cpuset/system-background/cpus

查看system-background的应用
adb shell cat /dev/cpuset/system-background/tasks

查看SurfaceFlinger的cpuset
adb shell 'cat /proc/(pid of surfaceflinger)/cpuset'

可以自定义cpuset，就是可以根据各自的需求，动态配置自定义的cpuset，例如SurfaceFlinger的线程默认跑到4个小核上，假如有个需求要把SurfaceFlinger的线程跑到大核上，就可以配置自定义cpuset，在进入某个场景的时候，把SurfaceFlinger进程pid配置到自定义的cpuset的tasks中。

- 初始化SurfaceFlinger

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

- 实例化 SurfaceFlinger

有个SurfaceFlingerFactory.cpp，设计模式中的工厂类，在该头文件中定义了好多创建不同对象的函数。

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp
sp<SurfaceFlinger> createSurfaceFlinger() {
    static DefaultFactory factory;
    return new SurfaceFlinger(factory);
}
```

通过createSurfaceFlinger()方法创建了一个SurfaceFlinger对象。

```c++
/frameworks/native/services/surfaceflinger/SurfaceFlinger.h
class SurfaceFlinger : public BnSurfaceComposer,
                       public PriorityDumper,
                       private IBinder::DeathRecipient,
                       private HWC2::ComposerCallback,
                       private ISchedulerCallback 
```

SurfaceFlinger继承BnSurfaceComposer，实现ISurfaceComposer接口，实现ComposerCallback，PriorityDumper是一个辅助类，提供了SurfaceFlinger的dump信息。

![](/learn-android/aosp/surfaceflinger-1.webp)

ISurfaceComposer 是Client端对SurfaceFlinger进程的binder接口调用。

ComposerCallback，这个是HWC模块的回调，这个包含了三个很关键的回调函数，onComposerHotplug函数表示
显示屏热插拔事件， onComposerHalRefresh函数表示Refresh事件，onComposerHalVsync表示Vsync信号事件。

接下来分析SurfaceFlinger的构造函数。

在SurfaceFlinger中的构造方法中，初始化了很多全局变量，有一些变量会直接影响整个代码的执行流程，而这些变量都可以在开发者模式中去更改它，SurfaceFlinger作为binder的服务端，设置应用中的开发者模式做为Client端进行binder调用去设置更改，主要是为了调试测试，其中还包含芯片厂商高通的一些辅助功能。

初始化 SurfaceFlinger
实例化SurfaceFlinger对象之后，调用init方法，这个方法有几个比较重要的代码。

构造SkiaRenderEngine渲染引擎:

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

在Android S版本之前，这块的绘制流程都是OpenGL ES实现的，在Android S版本上这块逻辑已经切换到Skia库进行绘制，mCompositionEngine这个类比较重要，主要负责Layer的Client合成，Client合成就是GPU合成。目前Layer的合成方式有两种，一个是GPU合成，一个是HWC合成，针对Skia库的研究有单独的章节进行讲解。

在init方法中，重点看这个函数中调用了initScheduler方法。

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

图中是initScheduler方法中几个关键的代码，该代码和Vsync研究密切相关，当分析研究SurfaceFlinger的合成流程，也就最核心的流程，其触发条件就是由Vsync控制的，Vsync很像一个节拍器，SurfaceFlinger中每一帧的合成都需要跟随节拍器，太快或者太慢都会导致屏幕显示异常，一般表现为画面卡顿，不流畅，关于Vsync的研究有独立章节进行讲解。

将SurfaceFlinger添加到 ServiceManager进程中

SurfaceFlinger模块提供很多binder接口，在服务端的onTransact函数会根据Client端传递的code做不同的代码处理，下图是onTransact函数中一处code的处理。

```c++
case 1034: {
    switch (n = data.readInt32()) {
        case 0:
        case 1:
            enableRefreshRateOverlay(static_cast<bool>(n));
            break;
        default: {
            Mutex::Autolock lock(mStateLock);
            reply->writeBool(mRefreshRateOverlay != nullptr);
        }
    }
    return NO_ERROR;
}
```

这个code是1034的逻辑，是那个Client端调用过来的呢？

是设置应用中的开发者模式页面中的功能，搜索了Settings应用中关于1034的逻辑，找到了一处代码包含这段逻辑。

```c++
Settings/src/com/android/settings/development/ShowRefreshRatePreferenceController.java

private static final String SHOW_REFRESH_RATE_KEY = "show_refresh_rate";
@VisibleForTesting
static final int SURFACE_FLINGER_CODE = 1034;
public ShowRefreshRatePreferenceController(Context context) {
    super(context);
    mSurfaceFlinger = ServiceManager.getService(SURFACE_FLINGER_SERVICE_KEY);
}

@VisibleForTesting
void updateShowRefreshRateSetting() {
    // magic communication with surface flinger.
    try {
        if (mSurfaceFlinger != null) {
            final Parcel data = Parcel.obtain();
            final Parcel reply = Parcel.obtain();
            data.writeInterfaceToken(SURFACE_COMPOSER_INTERFACE_KEY);
            data.writeInt(SETTING_VALUE_QUERY);
            mSurfaceFlinger.transact(SURFACE_FLINGER_CODE, data, reply, 0 /* flags */);
            final boolean enabled = reply.readBoolean();
            ((SwitchPreference) mPreference).setChecked(enabled);
            reply.recycle();
             data.recycle();
         }
     } catch (RemoteException ex) {
         // intentional no-op
     }
 }
```

从上面的代码可以看到，App端对SurfaceFlinger进程进行了binder通讯。

启动 SurfaceFlinger

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

在前面介绍的main函数，SurfaceFlinger对象是一个智能指针，sp强引用指针。该智能指针在第一次引用的时候，会调用onFirstRef方法，进一步实例化内部需要的对象，这个方法调用了mEventQueue的init方法，而这个对象就是线程安全的MessageQueue对象。

SurfaceFlinger中的MessageQueue和Android应用层开发的MessageQueue设计非常相似，只是个别角色做的事情稍微有一点不同。

SurfaceFlinger的MessageQueue机制的角色：

MessageQueue 同样做为消息队列向外暴露接口，不像应用层的MessageQueue一样作为Message链表的队列缓存，而是提供了相应的发送消息的接口以及等待消息方法。
native的Looper是整个MessageQueue的核心，以epoll_event为核心，event_fd为辅助构建一套快速的消息回调机制。
native的Handler则是实现handleMessage方法，当Looper回调的时候，将会调用Handler中的handleMessage方法处理回调函数。

MessageQueue init

```c++
/frameworks/native/services/surfaceflinger/Scheduler/MessageQueue.cpp

void MessageQueue::init(const sp<SurfaceFlinger>& flinger) {
    mFlinger = flinger;
    mLooper = new Looper(true);
    mHandler = new Handler(*this);
}
该init方法中实例化了Looper和Handle。

void MessageQueue::Handler::handleMessage(const Message& message) {
    switch (message.what) {
        case INVALIDATE:
            mEventMask.fetch_and(~eventMaskInvalidate);
            mQueue.mFlinger->onMessageReceived(message.what, mVsyncId, mExpectedVSyncTime);
            break;
        case REFRESH:
            mEventMask.fetch_and(~eventMaskRefresh);
            mQueue.mFlinger->onMessageReceived(message.what, mVsyncId, mExpectedVSyncTime);
            break;
    }
}
```

在上面的回调函数，可以看到注册了两种不同的刷新监听，一个是invalidate刷新，一个是refresh刷新。它们最后都会回调到SurfaceFlinger中的onMessageReceived中，换句话说，每当我们需要图元刷新的时候，就会通过mEventQueue的post方法，回调到SurfaceFlinger的主线程进行合成刷新。

以上就是SurfaceFlinger进程初始化的过程，中间提到了一些比较重要的类或者对象，接下来会通过几个章节对SurfaceFlinger进程中比较核心的逻辑进行代码讲解。
