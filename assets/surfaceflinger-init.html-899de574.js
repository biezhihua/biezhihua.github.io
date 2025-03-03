import{_ as s,C as r,Y as d,Z as a,$ as e,a0 as i,a1 as l,a2 as c}from"./framework-301d0703.js";const t={},o=e("h1",{id:"android-aosp-surfaceflinger模块-转载-加工",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#android-aosp-surfaceflinger模块-转载-加工","aria-hidden":"true"},"#"),i(" Android | AOSP | SurfaceFlinger模块 | 转载&加工")],-1),v=e("h2",{id:"前言1",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#前言1","aria-hidden":"true"},"#"),i(" 前言1")],-1),u={href:"https://www.jianshu.com/p/db6f62f70ed1",target:"_blank",rel:"noopener noreferrer"},m=c(`<h2 id="前言2" tabindex="-1"><a class="header-anchor" href="#前言2" aria-hidden="true">#</a> 前言2</h2><p>源码版本：android-13.0.0_r41</p><h2 id="surfaceflinger-进程的启动" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-进程的启动" aria-hidden="true">#</a> surfaceflinger 进程的启动</h2><p><code>SurfaceFlinger</code> 是一个系统服务，作用就是接受不同 layer 的 buffer 数据进行合成，然后发送到显示设备进行显示。</p><p><code>surfaceflinger</code> 进程是什么时候起来的？</p><p>在最新的高版本上是通过 <code>Android.bp</code> 去启动 <code>surfaceflinger.rc</code> 文件，然后解析文件内容启动 <code>SurfaceFlinger</code> 进程。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>frameworks/native/services/surfaceflinger/Android.bp
cc_binary {
    name: &quot;surfaceflinger&quot;,
    defaults: [&quot;libsurfaceflinger_binary&quot;],
    init_rc: [&quot;surfaceflinger.rc&quot;],
    ...
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>frameworks/native/services/surfaceflinger/surfaceflinger.rc

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

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>关于 <code>init.rc</code> 文件的解析和 <code>Android.bp</code> 编译脚本的执行本文不做深入研究，启动 <code>surfaceflinger</code> 进程，就会执行到 <code>main_surfaceflinger.cpp</code> 中 <code>main</code> 函数。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>frameworks/native/services/surfaceflinger/main_surfaceflinger.cpp

int main(int, char**) {
    signal(SIGPIPE, SIG_IGN);

    hardware::configureRpcThreadpool(1 /* maxThreads */,
            false /* callerWillJoin */);

    startGraphicsAllocatorService();

    // When SF is launched in its own process, limit the number of
    // binder threads to 4.
    ProcessState::self()-&gt;setThreadPoolMaxThreadCount(4);

    // Set uclamp.min setting on all threads, maybe an overkill but we want
    // to cover important threads like RenderEngine.
    if (SurfaceFlinger::setSchedAttr(true) != NO_ERROR) {
        ALOGW(&quot;Couldn&#39;t set uclamp.min: %s\\n&quot;, strerror(errno));
    }

    // The binder threadpool we start will inherit sched policy and priority
    // of (this) creating thread. We want the binder thread pool to have
    // SCHED_FIFO policy and priority 1 (lowest RT priority)
    // Once the pool is created we reset this thread&#39;s priority back to
    // original.
    int newPriority = 0;
    int origPolicy = sched_getscheduler(0);
    struct sched_param origSchedParam;

    int errorInPriorityModification = sched_getparam(0, &amp;origSchedParam);
    if (errorInPriorityModification == 0) {
        int policy = SCHED_FIFO;
        newPriority = sched_get_priority_min(policy);

        struct sched_param param;
        param.sched_priority = newPriority;

        errorInPriorityModification = sched_setscheduler(0, policy, &amp;param);
    }

    // start the thread pool
    sp&lt;ProcessState&gt; ps(ProcessState::self());
    ps-&gt;startThreadPool();

    // Reset current thread&#39;s policy and priority
    if (errorInPriorityModification == 0) {
        errorInPriorityModification = sched_setscheduler(0, origPolicy, &amp;origSchedParam);
    } else {
        ALOGE(&quot;Failed to set SurfaceFlinger binder threadpool priority to SCHED_FIFO&quot;);
    }

    // instantiate surfaceflinger
    sp&lt;SurfaceFlinger&gt; flinger = surfaceflinger::createSurfaceFlinger();

    // Set the minimum policy of surfaceflinger node to be SCHED_FIFO.
    // So any thread with policy/priority lower than {SCHED_FIFO, 1}, will run
    // at least with SCHED_FIFO policy and priority 1.
    if (errorInPriorityModification == 0) {
        flinger-&gt;setMinSchedulerPolicy(SCHED_FIFO, newPriority);
    }

    setpriority(PRIO_PROCESS, 0, PRIORITY_URGENT_DISPLAY);

    set_sched_policy(0, SP_FOREGROUND);

    // Put most SurfaceFlinger threads in the system-background cpuset
    // Keeps us from unnecessarily using big cores
    // Do this after the binder thread pool init
    if (cpusets_enabled()) set_cpuset_policy(0, SP_SYSTEM);

    // initialize before clients can connect
    flinger-&gt;init();

    // publish surface flinger
    sp&lt;IServiceManager&gt; sm(defaultServiceManager());
    sm-&gt;addService(String16(SurfaceFlinger::getServiceName()), flinger, false,
                   IServiceManager::DUMP_FLAG_PRIORITY_CRITICAL | IServiceManager::DUMP_FLAG_PROTO);

    // publish gui::ISurfaceComposer, the new AIDL interface
    sp&lt;SurfaceComposerAIDL&gt; composerAIDL = new SurfaceComposerAIDL(flinger);
    sm-&gt;addService(String16(&quot;SurfaceFlingerAIDL&quot;), composerAIDL, false,
                   IServiceManager::DUMP_FLAG_PRIORITY_CRITICAL | IServiceManager::DUMP_FLAG_PROTO);

    startDisplayService(); // dependency on SF getting registered above

    if (SurfaceFlinger::setSchedFifo(true) != NO_ERROR) {
        ALOGW(&quot;Couldn&#39;t set to SCHED_FIFO: %s&quot;, strerror(errno));
    }

    // run surface flinger in this thread
    flinger-&gt;run();

    return 0;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="processstate-self" tabindex="-1"><a class="header-anchor" href="#processstate-self" aria-hidden="true">#</a> <code>ProcessState::self()</code></h2><p><code>ProcessState::self()</code> 函数的调用，个人理解是同 binder 驱动建立链接，获取驱动的版本，通知驱动，同时启动线程来处理 Client 的请求，总结如下：</p><ul><li>构建 ProcessState 全局对象 gProcess</li><li>打开 binder 驱动，建立链接</li><li>在驱动内部创建该进程的 binder_proc , binder_thread 结构，保存该进程的进程信息和线程信息，并加入驱动的红黑树队列中。</li><li>获取驱动的版本信息</li><li>把该进程最多可同时启动的线程告诉驱动，并保存到改进程的 binder_proc 结构中</li><li>把设备文件 /dev/binder 映射到内存中</li></ul><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// When SF is launched in its own process, limit the number of
// binder threads to 4.
ProcessState::self()-&gt;setThreadPoolMaxThreadCount(4);
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="设置进程优先级" tabindex="-1"><a class="header-anchor" href="#设置进程优先级" aria-hidden="true">#</a> 设置进程优先级</h2><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>setpriority(PRIO_PROCESS, 0, PRIORITY_URGENT_DISPLAY);

set_sched_policy(0, SP_FOREGROUND);

// Put most SurfaceFlinger threads in the system-background cpuset
// Keeps us from unnecessarily using big cores
// Do this after the binder thread pool init
if (cpusets_enabled()) set_cpuset_policy(0, SP_SYSTEM);
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>关于cpuset的使用，有一些简单的命令如下：</p><p>查看cpuset的所有分组</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>adb shell ls -l /dev/cpuset
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>查看system-background的cpuset的cpu</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>adb shell cat /dev/cpuset/system-background/cpus
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>查看system-background的应用</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>adb shell cat /dev/cpuset/system-background/tasks
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>查看SurfaceFlinger的cpuset</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>adb shell &#39;cat /proc/(pid of surfaceflinger)/cpuset&#39;
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>可以自定义cpuset，就是可以根据各自的需求，动态配置自定义的cpuset，例如SurfaceFlinger的线程默认跑到4个小核上，假如有个需求要把SurfaceFlinger的线程跑到大核上，就可以配置自定义cpuset，在进入某个场景的时候，把SurfaceFlinger进程pid配置到自定义的cpuset的tasks中。</p><h2 id="surfaceflinger-初始化过程" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-初始化过程" aria-hidden="true">#</a> SurfaceFlinger 初始化过程</h2><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// 实例化 SurfaceFlinger
sp&lt;SurfaceFlinger&gt; flinger = surfaceflinger::createSurfaceFlinger();

// 初始化 SurfaceFlinger
flinger-&gt;init();

// 将 SurfaceFlinger添加到 ServiceManager 进程中
sp&lt;IServiceManager&gt; sm(defaultServiceManager());
sm-&gt;addService(String16(SurfaceFlinger::getServiceName()), flinger, false, IServiceManager::DUMP_FLAG_PRIORITY_CRITICAL | IServiceManager::DUMP_FLAG_PROTO);

//启动 DisplayService
startDisplayService();

// 启动 SurfaceFlinger
flinger-&gt;run();
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="surfaceflinger-实例化" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-实例化" aria-hidden="true">#</a> SurfaceFlinger 实例化</h2><p>有个 <code>SurfaceFlingerFactory.cpp</code> ，设计模式中的工厂类，在该头文件中定义了好多创建不同对象的函数。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>/frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp
sp&lt;SurfaceFlinger&gt; createSurfaceFlinger() {
    static DefaultFactory factory;
    return new SurfaceFlinger(factory);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>通过 <code>createSurfaceFlinger()</code> 方法创建了一个 <code>SurfaceFlinger</code> 对象。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>/frameworks/native/services/surfaceflinger/SurfaceFlinger.h
class SurfaceFlinger : public BnSurfaceComposer,
                       public PriorityDumper,
                       private IBinder::DeathRecipient,
                       private HWC2::ComposerCallback,
                       private ICompositor,
                       private scheduler::ISchedulerCallback {
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="bnsurfacecomposer" tabindex="-1"><a class="header-anchor" href="#bnsurfacecomposer" aria-hidden="true">#</a> BnSurfaceComposer</h3><p><code>ISurfaceComposer</code> 是 Client 端对 <code>SurfaceFlinger</code> 进程的 binder 接口调用。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>class BnSurfaceComposer: public BnInterface&lt;ISurfaceComposer&gt; {
    ...
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="icompositor" tabindex="-1"><a class="header-anchor" href="#icompositor" aria-hidden="true">#</a> ICompositor</h3><p>ICompositor是SurfaceFlinger触发合成时的调用。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>struct ICompositor {
    virtual bool commit(nsecs_t frameTime, int64_t vsyncId, nsecs_t expectedVsyncTime) = 0;
    virtual void composite(nsecs_t frameTime, int64_t vsyncId) = 0;
    virtual void sample() = 0;
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="composercallback" tabindex="-1"><a class="header-anchor" href="#composercallback" aria-hidden="true">#</a> ComposerCallback</h3><p><code>ComposerCallback</code> ，这个是HWC模块的回调，这个包含了三个很关键的回调函数， <code>onComposerHotplug</code> 函数表示 显示屏热插拔事件， <code>onComposerHalRefresh</code> 函数表示 Refresh 事件， <code>onComposerHalVsync</code> 表示Vsync信号事件。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>struct ComposerCallback {
    virtual void onComposerHalHotplug(hal::HWDisplayId, hal::Connection) = 0;
    virtual void onComposerHalRefresh(hal::HWDisplayId) = 0;
    virtual void onComposerHalVsync(hal::HWDisplayId, int64_t timestamp,
                                    std::optional&lt;hal::VsyncPeriodNanos&gt;) = 0;
    virtual void onComposerHalVsyncPeriodTimingChanged(hal::HWDisplayId,
                                                       const hal::VsyncPeriodChangeTimeline&amp;) = 0;
    virtual void onComposerHalSeamlessPossible(hal::HWDisplayId) = 0;
    virtual void onComposerHalVsyncIdle(hal::HWDisplayId) = 0;

protected:
    ~ComposerCallback() = default;
};
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="surfaceflinger-构造函数" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-构造函数" aria-hidden="true">#</a> SurfaceFlinger 构造函数</h2><p>在 <code>SurfaceFlinger</code> 中的构造方法中，初始化了很多全局变量，有一些变量会直接影响整个代码的执行流程，而这些变量都可以在开发者模式中去更改它， <code>SurfaceFlinger</code> 作为 binder 的服务端，设置应用中的开发者模式做为 Client 端进行 binder 调用去设置更改，主要是为了调试测试，其中还包含芯片厂商高通的一些辅助功能。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>SurfaceFlinger::SurfaceFlinger(Factory&amp; factory, SkipInitializationTag)
      : mFactory(factory),
        mPid(getpid()),
        mInterceptor(mFactory.createSurfaceInterceptor()),
        mTimeStats(std::make_shared&lt;impl::TimeStats&gt;()),
        mFrameTracer(mFactory.createFrameTracer()),
        mFrameTimeline(mFactory.createFrameTimeline(mTimeStats, mPid)),
        mCompositionEngine(mFactory.createCompositionEngine()),
        mHwcServiceName(base::GetProperty(&quot;debug.sf.hwc_service_name&quot;s, &quot;default&quot;s)),
        mTunnelModeEnabledReporter(new TunnelModeEnabledReporter()),
        mInternalDisplayDensity(getDensityFromProperty(&quot;ro.sf.lcd_density&quot;, true)),
        mEmulatedDisplayDensity(getDensityFromProperty(&quot;qemu.sf.lcd_density&quot;, false)),
        mPowerAdvisor(std::make_unique&lt;Hwc2::impl::PowerAdvisor&gt;(*this)),
        mWindowInfosListenerInvoker(sp&lt;WindowInfosListenerInvoker&gt;::make(*this)) {
    ALOGI(&quot;Using HWComposer service: %s&quot;, mHwcServiceName.c_str());
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="surfaceflinger-初始化" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-初始化" aria-hidden="true">#</a> SurfaceFlinger 初始化</h2><p>实例化 <code>SurfaceFlinger</code> 对象之后，调用 <code>init</code> 方法，这个方法有几个比较重要的代码。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// Do not call property_set on main thread which will be blocked by init
// Use StartPropertySetThread instead.
void SurfaceFlinger::init() {
    ALOGI(  &quot;SurfaceFlinger&#39;s main thread ready to run. &quot;
            &quot;Initializing graphics H/W...&quot;);
    Mutex::Autolock _l(mStateLock);

    // Get a RenderEngine for the given display / config (can&#39;t fail)
    // TODO(b/77156734): We need to stop casting and use HAL types when possible.
    // Sending maxFrameBufferAcquiredBuffers as the cache size is tightly tuned to single-display.
    auto builder = renderengine::RenderEngineCreationArgs::Builder()
                           .setPixelFormat(static_cast&lt;int32_t&gt;(defaultCompositionPixelFormat))
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
    mCompositionEngine-&gt;setRenderEngine(renderengine::RenderEngine::create(builder.build()));
    mMaxRenderTargetSize =
            std::min(getRenderEngine().getMaxTextureSize(), getRenderEngine().getMaxViewportDims());

    // Set SF main policy after initializing RenderEngine which has its own policy.
    if (!SetTaskProfiles(0, {&quot;SFMainPolicy&quot;})) {
        ALOGW(&quot;Failed to set main task profile&quot;);
    }

    mCompositionEngine-&gt;setTimeStats(mTimeStats);
    mCompositionEngine-&gt;setHwComposer(getFactory().createHWComposer(mHwcServiceName));
    mCompositionEngine-&gt;getHwComposer().setCallback(*this);
    ClientCache::getInstance().setRenderEngine(&amp;getRenderEngine());

    enableLatchUnsignaledConfig = getLatchUnsignaledConfig();

    if (base::GetBoolProperty(&quot;debug.sf.enable_hwc_vds&quot;s, false)) {
        enableHalVirtualDisplays(true);
    }

    // Process any initial hotplug and resulting display changes.
    processDisplayHotplugEventsLocked();
    const auto display = getDefaultDisplayDeviceLocked();
    LOG_ALWAYS_FATAL_IF(!display, &quot;Missing primary display after registering composer callback.&quot;);
    const auto displayId = display-&gt;getPhysicalId();
    LOG_ALWAYS_FATAL_IF(!getHwComposer().isConnected(displayId),
                        &quot;Primary display is disconnected.&quot;);

    // initialize our drawing state
    mDrawingState = mCurrentState;

    // set initial conditions (e.g. unblank default device)
    initializeDisplays();

    mPowerAdvisor-&gt;init();

    char primeShaderCache[PROPERTY_VALUE_MAX];
    property_get(&quot;service.sf.prime_shader_cache&quot;, primeShaderCache, &quot;1&quot;);
    if (atoi(primeShaderCache)) {
        if (setSchedFifo(false) != NO_ERROR) {
            ALOGW(&quot;Can&#39;t set SCHED_OTHER for primeCache&quot;);
        }

        mRenderEnginePrimeCacheFuture = getRenderEngine().primeCache();

        if (setSchedFifo(true) != NO_ERROR) {
            ALOGW(&quot;Can&#39;t set SCHED_OTHER for primeCache&quot;);
        }
    }

    onActiveDisplaySizeChanged(display);

    // Inform native graphics APIs whether the present timestamp is supported:

    const bool presentFenceReliable =
            !getHwComposer().hasCapability(Capability::PRESENT_FENCE_IS_NOT_RELIABLE);
    mStartPropertySetThread = getFactory().createStartPropertySetThread(presentFenceReliable);

    if (mStartPropertySetThread-&gt;Start() != NO_ERROR) {
        ALOGE(&quot;Run StartPropertySetThread failed!&quot;);
    }

    ALOGV(&quot;Done initializing&quot;);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="skiarenderengine-渲染引擎初始化" tabindex="-1"><a class="header-anchor" href="#skiarenderengine-渲染引擎初始化" aria-hidden="true">#</a> SkiaRenderEngine 渲染引擎初始化</h3><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// Get a RenderEngine for the given display / config (can&#39;t fail)
// TODO(b/77156734): We need to stop casting and use HAL types when possible.
// Sending maxFrameBufferAcquiredBuffers as the cache size is tightly tuned to single-display.
auto builder = renderengine::RenderEngineCreationArgs::Builder()
                        .setPixelFormat(static_cast&lt;int32_t&gt;(defaultCompositionPixelFormat))
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
mCompositionEngine-&gt;setRenderEngine(renderengine::RenderEngine::create(builder.build()));
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在Android S版本之前，这块的绘制流程都是 OpenGL ES 实现的，在Android S 版本上这块逻辑已经切换到 Skia 库进行绘制， <code>mCompositionEngine</code> 这个类比较重要，主要负责 Layer 的 Client 合成，Client合 成就是 GPU 合成。目前 Layer 的合成方式有两种，一个是 GPU 合成，一个是 HWC 合成，针对 Skia 库的研究有单独的章节进行讲解。</p><h3 id="initscheduler-调度器初始化" tabindex="-1"><a class="header-anchor" href="#initscheduler-调度器初始化" aria-hidden="true">#</a> initScheduler 调度器初始化</h3><p>在 <code>init</code> 方法中，重点看这个函数中调用了 <code>initScheduler</code> 方法。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// start the EventThread
mScheduler = getFactory().createScheduler(*mRefreshRateConfigs, *this);
const auto configs = mVsyncConfiguration-&gt;getCurrentConfigs();
const nsecs_t vsyncPeriod = currRefreshRate.getPeriodNsecs();
mAppConnectionHandle =
        mScheduler-&gt;createConnection(&quot;app&quot;, mFrameTimeline-&gt;getTokenManager(),
                                     /*workDuration=*/configs.late.appWorkDuration,
                                     /*readyDuration=*/configs.late.sfWorkDuration,
                                     impl::EventThread::InterceptVSyncsCallback());
mSfConnectionHandle =
        mScheduler-&gt;createConnection(&quot;appSf&quot;, mFrameTimeline-&gt;getTokenManager(),
                                     /*workDuration=*/std::chrono::nanoseconds(vsyncPeriod),
                                     /*readyDuration=*/configs.late.sfWorkDuration,
                                     [this](nsecs_t timestamp) {
                                         mInterceptor-&gt;saveVSyncEvent(timestamp);
                                     });

mEventQueue-&gt;initVsync(mScheduler-&gt;getVsyncDispatch(), *mFrameTimeline-&gt;getTokenManager(),
                       configs.late.sfWorkDuration);
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>图中是 <code>initScheduler</code> 方法中几个关键的代码，该代码和Vsync研究密切相关，当分析研究 <code>SurfaceFlinger</code> 的合成流程，也就最核心的流程，其触发条件就是由 Vsync 控制的，Vsync 很像一个节拍器， <code>SurfaceFlinger</code> 中每一帧的合成都需要跟随节拍器，太快或者太慢都会导致屏幕显示异常，一般表现为画面卡顿，不流畅，关于Vsync的研究有独立章节进行讲解。</p><p>将 <code>SurfaceFlinger</code> 添加到 <code>ServiceManager</code> 进程中</p><p><code>SurfaceFlinger</code> 模块提供很多 binder 接口，在服务端的 <code>onTransact</code> 函数会根据 Client 端传递的 code 做不同的代码处理</p><h2 id="surfaceflinger-启动" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-启动" aria-hidden="true">#</a> SurfaceFlinger 启动</h2><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>void SurfaceFlinger::run() {
    while (true) {
        mEventQueue-&gt;waitMessage();
    }
}
void SurfaceFlinger::onFirstRef() {
    mEventQueue-&gt;init(this);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在前面介绍的 <code>main</code> 函数， <code>SurfaceFlinger</code> 对象是一个智能指针，sp 强引用指针。该智能指针在第一次引用的时候，会调用 <code>onFirstRef</code> 方法，进一步实例化内部需要的对象，这个方法调用了 <code>mEventQueue</code> 的 <code>init</code> 方法，而这个对象就是线程安全的 <code>MessageQueue</code> 对象。</p><p><code>SurfaceFlinger</code> 中的 <code>MessageQueue</code> 和 Android 应用层开发的 <code>MessageQueue</code> 设计非常相似，只是个别角色做的事情稍微有一点不同。</p><p><code>SurfaceFlinger</code> 的 <code>MessageQueue</code> 机制的角色：</p><p><code>MessageQueue</code> 同样做为消息队列向外暴露接口，不像应用层的 <code>MessageQueue</code> 一样作为 <code>Message</code> 链表的队列缓存，而是提供了相应的发送消息的接口以及等待消息方法。</p><p>native 的 <code>Looper</code> 是整个 <code>MessageQueue</code> 的核心，以 <code>epoll_event</code> <code>为核心，event_fd</code> 为辅助构建一套快速的消息回调机制。</p><p>native 的 <code>Handler</code> 则是实现 <code>handleMessage</code> 方法，当 <code>Looper</code> 回调的时候，将会调用 <code>Handler</code> 中的 <code>handleMessage</code> 方法处理回调函数。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>/frameworks/native/services/surfaceflinger/Scheduler/MessageQueue.cpp

MessageQueue::MessageQueue(ICompositor&amp; compositor)
      : MessageQueue(compositor, sp&lt;Handler&gt;::make(*this)) {}

MessageQueue::MessageQueue(ICompositor&amp; compositor, sp&lt;Handler&gt; handler)
      : mCompositor(compositor),
        mLooper(sp&lt;Looper&gt;::make(kAllowNonCallbacks)),
        mHandler(std::move(handler)) {}

void MessageQueue::Handler::handleMessage(const Message&amp;) {
    mFramePending.store(false);

    const nsecs_t frameTime = systemTime();
    auto&amp; compositor = mQueue.mCompositor;

    if (!compositor.commit(frameTime, mVsyncId, mExpectedVsyncTime)) {
        return;
    }

    compositor.composite(frameTime, mVsyncId);
    compositor.sample();
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>每当我们需要图元刷新的时候，就会通过 <code>mEventQueue</code> 的 <code>post</code> 方法，回调到 <code>SurfaceFlinger</code> 的主线程进行合成刷新。</p>`,67);function b(p,g){const n=r("ExternalLinkIcon");return d(),a("div",null,[o,v,e("p",null,[i("转载自："),e("a",u,[i("https://www.jianshu.com/p/db6f62f70ed1"),l(n)]),i(" ，并结合Perfetto更新了部分内容。")]),m])}const h=s(t,[["render",b],["__file","surfaceflinger-init.html.vue"]]);export{h as default};
