import{_ as a}from"./fluency-tools-perfetto-async-app-sf-buffertx-22f4b995.js";import{_ as l,C as c,Y as d,Z as t,$ as e,a0 as n,a1 as r,a2 as s}from"./framework-301d0703.js";const o="/learn-android/performance/fluency-vsync-oncomposerhalvsync-callstack.png",p="/learn-android/performance/fluency-vsync-composer-surfaceflinger.png",v="/learn-android/performance/fluency-vsync-composer-surfaceflinger-client.png",u="/learn-android/performance/fluency-vsync-composer-surfaceflinger-server.png",m={},h=s(`<h1 id="android-性能优化-流畅性-第08篇-从perfetto角度理解android系统-图形渲染和显示-vsync" tabindex="-1"><a class="header-anchor" href="#android-性能优化-流畅性-第08篇-从perfetto角度理解android系统-图形渲染和显示-vsync" aria-hidden="true">#</a> Android | 性能优化 | 流畅性 - 第08篇 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - VSYNC</h1><h2 id="vsync-信号是什么" tabindex="-1"><a class="header-anchor" href="#vsync-信号是什么" aria-hidden="true">#</a> VSYNC 信号是什么</h2><p>在Android中，VSYNC（垂直同步）信号是一个周期性的信号，它用于表示显示器在刷新屏幕时的一个事件。</p><p>VSYNC 信号用于同步屏幕的刷新率和图形渲染的帧率，以确保图像内容在屏幕上平滑地显示，避免出现撕裂或抖动现象。</p><p>VSYNC 信号与屏幕的刷新率密切相关。例如，一个刷新率为60Hz的显示器，每秒会产生60个 VSYNC 信号，也就是 16.67ms 刷新一次。Android 系统会根据这个信号来调度图形渲染任务，确保渲染的帧与显示器的刷新率保持一致。</p><h3 id="vsync-信号-与-hw-vsync-0、vsync、sf-vsync-之间的关系" tabindex="-1"><a class="header-anchor" href="#vsync-信号-与-hw-vsync-0、vsync、sf-vsync-之间的关系" aria-hidden="true">#</a> VSYNC 信号 与 HW_VSYNC_0、VSYNC、SF_VSYNC 之间的关系</h3><p><img src="https://source.android.com/static/docs/core/graphics/images/dispsync.png?hl=zh-cn" alt="dispsync"></p><p>先对 VSYNC 信号有个总体的概念，它包含了三个部分，HW_VSYNC_0、VSYNC、SF_VSYNC，其中：</p><ul><li>HW_VSYNC_0 代表 屏幕开始显示下一帧，被 DispSync 使用转换为 VSYNC 和 SF_VSYNC。</li><li>VSYNC 代表 应用读取输入内容并生成下一帧，也叫做 VSYNC_APP，被 Choreographer 消耗。</li><li>SF_VSYNC 代表 SurfaceFlinger 开始为下一帧进行合成，也叫做 VSYNC_SF，被 SurfaceFlinger 消耗。</li></ul><h2 id="vsync-信号的产生与分发" tabindex="-1"><a class="header-anchor" href="#vsync-信号的产生与分发" aria-hidden="true">#</a> VSYNC 信号的产生与分发</h2><h3 id="vsync-events-source" tabindex="-1"><a class="header-anchor" href="#vsync-events-source" aria-hidden="true">#</a> vsync events source</h3><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>SurfaceFlinger::SurfaceFlinger(Factory&amp; factory, SkipInitializationTag)
      : ...
        mCompositionEngine(mFactory.createCompositionEngine()),
        ...) {
    ALOGI(&quot;Using HWComposer service: %s&quot;, mHwcServiceName.c_str());
}

// https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/CompositionEngine/include/compositionengine/CompositionEngine.h
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>
// Do not call property_set on main thread which will be blocked by init
// Use StartPropertySetThread instead.
void SurfaceFlinger::init() {
    ...
    mCompositionEngine-&gt;setHwComposer(getFactory().createHWComposer(mHwcServiceName));

    mCompositionEngine-&gt;getHwComposer().setCallback(*this);
    ...
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// Implement this interface to receive hardware composer events.
//
// These callback functions will generally be called on a hwbinder thread, but
// when first registering the callback the onComposerHalHotplug() function will
// immediately be called on the thread calling registerCallback().
struct ComposerCallback {
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>void HWComposer::setCallback(HWC2::ComposerCallback&amp; callback) {
    ...

    mComposer-&gt;registerCallback(callback);
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>void SurfaceFlinger::onComposerHalVsync(hal::HWDisplayId hwcDisplayId, int64_t timestamp,
                                        std::optional&lt;hal::VsyncPeriodNanos&gt; vsyncPeriod) {
    ...

    Mutex::Autolock lock(mStateLock);
    const auto displayId = getHwComposer().toPhysicalDisplayId(hwcDisplayId);
    if (displayId) {
        const auto token = getPhysicalDisplayTokenLocked(*displayId);
        const auto display = getDisplayDeviceLocked(token);
        display-&gt;onVsync(timestamp);
    }

    if (!getHwComposer().onVsync(hwcDisplayId, timestamp)) {
        return;
    }

    const bool isActiveDisplay =
            displayId &amp;&amp; getPhysicalDisplayTokenLocked(*displayId) == mActiveDisplayToken;
    if (!isActiveDisplay) {
        // For now, we don&#39;t do anything with non active display vsyncs.
        return;
    }

    bool periodFlushed = false;
    mScheduler-&gt;addResyncSample(timestamp, vsyncPeriod, &amp;periodFlushed);
    if (periodFlushed) {
        modulateVsync(&amp;VsyncModulator::onRefreshRateChangeCompleted);
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><img src="`+o+'" alt=""></p>',17),f={href:"https://utzcoz.github.io/2020/05/02/Analyze-AOSP-vsync-model.html",target:"_blank",rel:"noopener noreferrer"},b={href:"https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp;l=802?q=SurfaceFlinger&hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},g=e("h3",{id:"hwc-中-hw-vsync-0-的产生与回调",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#hwc-中-hw-vsync-0-的产生与回调","aria-hidden":"true"},"#"),n(" HWC 中 HW_VSYNC_0 的产生与回调")],-1),S={href:"https://cs.android.com/android/platform/superproject/+/master:hardware/libhardware/include/hardware/hwcomposer2.h",target:"_blank",rel:"noopener noreferrer"},C=e("code",null,"HWC2_PFN_VSYNC_2_4",-1),_=s(`<ul><li>HWC2_PFN_VSYNC_2_4 方法：HWC2_PFN_VSYNC_2_4 方法是 Hardware Composer 2（HWC2）接口中的一个回调函数，用于向HWC客户端（通常是SurfaceFlinger）报告 VSYNC 事件。HWC2 是 Android 系统中的硬件抽象层（HAL）组件，负责协调不同图形层（Layer）的合成和显示。当显示器的刷新周期到达时，硬件会产生 VSYNC 信号。HWC2 的实现需要捕获这个信号，并通过 HWC2_PFN_VSYNC_2_4 方法将 VSYNC 事件传递给 SurfaceFlinger。</li><li>HW_VSYNC_0 信号：HW_VSYNC_0 信号是 Android 系统中硬件产生的 VSYNC 信号。它表示显示器的垂直同步事件，用于通知系统开始下一帧的渲染。这个信号在Android的图形渲染流程中起到关键作用，可以帮助确保渲染的帧率与显示器的刷新率保持同步，从而实现平滑的动画和图形渲染。</li><li>HWC2_PFN_VSYNC_2_4 方法和 HW_VSYNC_0 信号之间的关系在于，HWC2_PFN_VSYNC_2_4 方法负责捕获 HW_VSYNC_0 信号，并将其转换为 VSYNC 事件，传递给 SurfaceFlinger。这样，SurfaceFlinger 可以根据 HW_VSYNC_0 信号调度图形渲染任务，实现与显示器刷新率同步的渲染。</li></ul><p><strong>HWC2中关于HWC2_PFN_VSYNC_2_4定义</strong>：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// https://cs.android.com/android/platform/superproject/+/master:hardware/libhardware/include/hardware/hwcomposer2.h

/* vsync_2_4(..., display, timestamp, vsyncPeriodNanos)
 * Descriptor: HWC2_CALLBACK_VSYNC_2_4
 * Required for HWC2 devices for composer 2.4
 */
typedef void (*HWC2_PFN_VSYNC_2_4)(hwc2_callback_data_t callbackData,
        hwc2_display_t display, int64_t timestamp, hwc2_vsync_period_t vsyncPeriodNanos);

/* See the &#39;Callbacks&#39; section for more detailed descriptions of what these
 * functions do */
typedef enum {
    ...
    HWC2_CALLBACK_VSYNC_2_4 = 4,
    ...
} hwc2_callback_descriptor_t;
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>HWC2实现类中关于HWC2_CALLBACK_VSYNC_2_4事件的注册和回调逻辑</strong>：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:hardware/interfaces/graphics/composer/2.4/utils/passthrough/include/composer-passthrough/2.4/HwcHal.h

// HwcHalImpl implements V2_*::hal::ComposerHal on top of hwcomposer2
template &lt;typename Hal&gt;
class HwcHalImpl : public V2_3::passthrough::detail::HwcHalImpl&lt;Hal&gt; {
  public:
    void registerEventCallback_2_4(hal::ComposerHal::EventCallback_2_4* callback) override {
       ...
        BaseType2_1::mDispatch.registerCallback(
                mDevice, HWC2_CALLBACK_VSYNC_2_4, this,
                reinterpret_cast&lt;hwc2_function_pointer_t&gt;(vsync_2_4_Hook));
       ...
    }

  protected:

    static void vsync_2_4_Hook(hwc2_callback_data_t callbackData, hwc2_display_t display,
                               int64_t timestamp, hwc2_vsync_period_t vsyncPeriodNanos) {
        auto hal = static_cast&lt;HwcHalImpl*&gt;(callbackData);
        hal-&gt;mEventCallback_2_4-&gt;onVsync_2_4(display, timestamp, vsyncPeriodNanos);
    }
}

// https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:prebuilts/vndk/v30/arm64/include/generated-headers/hardware/interfaces/graphics/composer/2.4/android.hardware.graphics.composer@2.4_genc++_headers/gen/android/hardware/graphics/composer/2.4/IComposerCallback.h

/**
  * Notifies the client that a vsync event has occurred. This callback must
  * only be triggered when vsync is enabled for this display (through
  * setVsyncEnabled).
  */
virtual ::android::hardware::Return&lt;void&gt; onVsync_2_4(uint64_t display, int64_t timestamp, uint32_t vsyncPeriodNanos) = 0;
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>HWC2与SurfaceFlinger的通信逻辑</strong>：</p><p>ComposerClient.h 是一个 Composer HAL 工具库的头文件，用于定义客户端应用程序与 Composer HAL 服务进行通信的接口。</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:hardware/interfaces/graphics/composer/2.4/utils/hal/include/composer-hal/2.4/ComposerClient.h

void onVsync_2_4(Display display, int64_t timestamp, VsyncPeriodNanos vsyncPeriodNanos) override {
    auto ret = mCallback-&gt;onVsync_2_4(display, timestamp, vsyncPeriodNanos);
    ALOGE_IF(!ret.isOk(), &quot;failed to send onVsync_2_4: %s&quot;, ret.description().c_str());
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>SurfaceFlinger中对于onVsync_2_4事件的转发</strong>：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>// https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/DisplayHardware/HidlComposerHal.cpp

Return&lt;void&gt; onVsync_2_4(Display display, int64_t timestamp, VsyncPeriodNanos vsyncPeriodNanos) override {
    if (mVsyncSwitchingSupported) {
        mCallback.onComposerHalVsync(display, timestamp, vsyncPeriodNanos);
    } else {
        ALOGW(&quot;Unexpected onVsync_2_4 callback on composer &lt;= 2.3, ignoring.&quot;);
    }
    return Void();
}

// https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp

void SurfaceFlinger::onComposerHalVsync(hal::HWDisplayId hwcDisplayId, int64_t timestamp,
                                        std::optional&lt;hal::VsyncPeriodNanos&gt; vsyncPeriod) {
    ...

    ATRACE_FORMAT(&quot;onComposerHalVsync%s&quot;, tracePeriod.c_str());

    ...
    const auto displayId = getHwComposer().toPhysicalDisplayId(hwcDisplayId);
    if (displayId) {
        ....
        display-&gt;onVsync(timestamp);
    }

    if (!getHwComposer().onVsync(hwcDisplayId, timestamp)) {
        return;
    }

    ...
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>如何在Perfetto中分析 VSYNC 硬件信号 - HW_VSYNC_0 的传递过程</strong>：</p><p><img src="`+p+'" alt="fluency-vsync-composer-surfaceflinger"></p><p>在 Android 系统中，android.hardware.graphics.composer 进程是负责管理 Hardware Composer（HWC）的进程，VSYNC硬件信号 - HW_VSYNC_0 由该进程处理。 该进程的主要作用为：</p><ul><li><p>提供 HWC 服务：android.hardware.graphics.composer 进程会实现一个 HWC 服务，该服务负责与底层硬件合成器进行通信。HWC 服务会与其他系统组件（例如 SurfaceFlinger）协同工作，以实现图形渲染和合成任务。</p></li><li><p>管理 HWC 设备：android.hardware.graphics.composer 进程负责管理 HWC 设备的生命周期，包括设备的初始化、配置以及释放等。此外，它还负责处理与 HWC 设备相关的事件和回调，例如 VSYNC 事件、错误回调等。</p></li><li><p>实现 HAL 接口：android.hardware.graphics.composer 进程会实现一个硬件抽象层（HAL）接口，以便其他系统组件（如 SurfaceFlinger）能够访问 HWC 设备的功能。HAL 接口提供了一系列的函数，用于处理图形层、设置显示属性、调度合成任务等。</p></li></ul><p>在该进程中，还有两个子线程，composer 线程和 display_0_vsync 线程分别有不同的作用：</p><ul><li><p>composer 线程：这个线程主要负责处理硬件合成器（Hardware Composer, HWC）相关的任务。这些任务包括与 HWC 设备进行通信、管理图形层、调度合成任务等。composer 线程会通过实现 HAL（硬件抽象层）接口与其他系统组件（如 SurfaceFlinger）交互。当系统需要执行图形合成任务时，SurfaceFlinger 会通过 HAL 接口与 composer 线程通信，以便 HWC 设备能够按照预期执行合成操作。</p></li><li><p>display_0_vsync 线程：这个线程负责处理显示设备的 VSYNC 事件。display_0_vsync 线程会监听这些事件，并将它们传递给其他系统组件（如 SurfaceFlinger）。这些组件可以根据 VSYNC 信号来调度 UI 更新、动画以及其他图形渲染任务，从而实现流畅且同步的显示效果。</p></li></ul><p><img src="'+v+'" alt="fluency-vsync-composer-surfaceflinger"></p><p><img src="'+u+'" alt="fluency-vsync-composer-surfaceflinger"></p><p>在 VSYNC 事件传递的过程中，android.hardware.graphics.composer 进程是客户端，surfaceflinger 进程是服务端。</p><p>在 display_0_vsync 线程中通过 ComposerClient.h 中 onVsync_2_4 方法对 VSYNC 事件回调 ，回调给 HAL 的实现类 HidlComposerHal.cpp 的 onVsync_2_4 方法，然后转发给 SurfaceFlinger 的 onComposerHalVsync 方法。</p><h3 id="surfaceflinger-中-vsync-vsync-app-和-sf-vsync-vsync-sf-的产生和分发" tabindex="-1"><a class="header-anchor" href="#surfaceflinger-中-vsync-vsync-app-和-sf-vsync-vsync-sf-的产生和分发" aria-hidden="true">#</a> SurfaceFlinger 中 VSYNC (VSYNC_APP) 和 SF_VSYNC (VSYNC_SF) 的产生和分发</h3><h3 id="yrdy" tabindex="-1"><a class="header-anchor" href="#yrdy" aria-hidden="true">#</a> yrdy</h3><p>在 SurfaceFlinger 中 DispSync 它使用硬件VSYNC信号 - HW_VSYNC_0 作为参考，并生成VSYNC和SF_VSYNC信号。同时，DispSync还利用来自Hardware Composer的Retire fence signal时间戳作为反馈，以确保生成的信号与硬件VSYNC信号保持同步。</p><p>DispSync 是一个软件实现的相位锁定环（PLL），用于生成 VSYNC_APP 和 VSYNC_SF 信号。VSYNC_APP 信号被 Choreographer 使用，VSYNC_SF信号 被 SurfaceFlinger 使用。</p><ol><li>DispSync：DispSync。</li><li>HW_VSYNC_0：硬件VSYNC信号，它是显示器刷新图像的开始时的信号。</li><li>VSYNC：VSYNC（垂直同步）信号用于指示显示器刷新图像的开始。</li><li>SF_VSYNC：SF_VSYNC是SurfaceFlinger使用的一个信号，与VSYNC类似，但它是为SurfaceFlinger服务的。</li><li>Retire fence signal：Retire fence信号是一种同步机制，用于确保GPU完成渲染操作后再进行下一步操作。</li><li>Hardware Composer：Hardware Composer是Android系统的一个硬件抽象层（HAL）组件，负责管理显示子系统。</li></ol><p>现在我们来解析这段话：</p><p>DispSync具有以下特性：</p><ol><li>参考（Reference）：HW_VSYNC_0。这表示DispSync使用硬件VSYNC信号（HW_VSYNC_0）作为参考信号，以便生成其他信号。</li><li>输出（Output）：VSYNC和SF_VSYNC。DispSync基于硬件VSYNC信号（HW_VSYNC_0）生成VSYNC和SF_VSYNC信号，以供Choreographer和SurfaceFlinger使用。</li><li>反馈（Feedback）：来自Hardware Composer的Retire fence signal时间戳。这表示DispSync使用Hardware Composer提供的Retire fence signal时间戳作为反馈，来调整生成的VSYNC和SF_VSYNC信号，以确保它们与硬件VSYNC信号保持同步。</li></ol><p>综上所述，DispSync是一个软件实现的相位锁定环，它使用硬件VSYNC信号作为参考，并生成VSYNC和SF_VSYNC信号。同时，DispSync还利用来自Hardware Composer的Retire fence signal时间戳作为反馈，以确保生成的信号与硬件VSYNC信号保持同步。</p><h2 id="分析过程" tabindex="-1"><a class="header-anchor" href="#分析过程" aria-hidden="true">#</a> 分析过程</h2>',30),y={href:"https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/jni/android_view_DisplayEventReceiver.cpp?q=android_view_DisplayEventReceiver&hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},V={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/base/core/jni/android_view_DisplayEventReceiver.cpp;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;l=215?q=android_view_DisplayEventReceiver&hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},N={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/DisplayEventDispatcher.cpp;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;l=63?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},Y={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/DisplayEventReceiver.cpp;l=35;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},w={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/include/gui/DisplayEventReceiver.h;l=114;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},k={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/include/gui/DisplayEventReceiver.h;l=114;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},H=e("p",null,"/native/libs/gui/DisplayEventReceiver.cpp;l=35;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",-1),F={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp;l=1818;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},D={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp;l=221;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},E={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp;l=290;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},A={href:"https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp;l=397;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},P={href:"https://cs.android.com/android/platform/superproject/+/master:frameworks/native/libs/gui/include/private/gui/BitTube.h;l=38;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176?q=gui::BitTube::DefaultSize&ss=android%2Fplatform%2Fsuperproject&hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},R=s(`<p>frameworks/native/services/surfaceflinger/Scheduler/DispSyncSource.cpp</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>// App初始化VSYNC事件接收器过程
frameworks/base/core/jni/android_view_DisplayEventReceiver.nativeInit
    -&gt; android_view_DisplayEventReceiver.NativeDisplayEventReceiver
        -&gt; frameworks/native/libs/gui/DisplayEventDispatcher::DisplayEventReceiver::mReceiver(vsyncSource, eventRegistration)
            -&gt;  frameworks/native/libs/gui/include/gui/DisplayEventReceiver::DisplayEventReceiver
                -&gt; frameworks/native/libs/gui/DisplayEventReceiver.cpp
                    -&gt; ISurfaceComposer.cpp：case CREATE_DISPLAY_EVENT_CONNECTION:
                        -&gt; SurfaceFlinger::createDisplayEventConnection
                            -&gt; Scheduler::createDisplayEventConnection
                                -&gt; EventThread::createEventConnection
                                    -&gt; EventThreadConnection::EventThreadConnection()
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>发送VSYNC给App层
Bittube::sendObjects
  &lt;-  DisplayEventReceiver::sendEvents
    &lt;-  EventThreadConnection::postEvent
      &lt;-  EventThread::dispatchEvent
        &lt;- EventThread::threadMain
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>mPendingEvents.push_back
  &lt;- EventThread::onVSyncEvent
    &lt;-  DispSyncSource::onVsyncCallback
      &lt;- DispSyncSource::DispSyncSource
        &lt;-  DispSyncSource::CallbackRepeater
          &lt;- CallbackRepeater:: callback
            &lt;-  Scheduler::makePrimaryDispSyncSourc
              &lt;- VsyncSchedule::createDispatch
                &lt;- Scheduler::createConnection
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>SurfaceFlinger初始化逻辑
    SurfaceFlinger::processDisplayAdded
         SurfaceFlinger::initScheduler
             Scheduler::createVsyncSchedule
                VsyncSchedule::VsyncSchedule
                    VsyncSchedule::createTracker
                    VsyncSchedule::createDispatch
                    VsyncSchedule::createController
                         VSyncDispatchTimerQueue::VSyncDispatchTimerQueue
                         VSyncReactor::VSyncReactor 
             Scheduler::createConnection
             MessageQueue::initVsync
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>调度注册逻辑
VSyncDispatchTimerQueue::registerCallback
    VSyncCallbackRegistration::VSyncCallbackRegistration
        CallbackRepeater
            DispSyncSource::DispSyncSource
                Scheduler::makePrimaryDispSyncSource
                    Scheduler::createConnection
        MessageQueue::initVsync

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>调度逻辑：
VSyncDispatchTimerQueue::schedule
     VSyncCallbackRegistration::schedule
        CallbackRepeater::start
        MessageQueue::scheduleFrame
            SurfaceFlinger::scheduleCommit
        VsyncSchedule::schedule

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>DisplayEventReceiver::DisplayEventReceiver(
        ISurfaceComposer::VsyncSource vsyncSource,
        ISurfaceComposer::EventRegistrationFlags eventRegistration) {
    sp&lt;ISurfaceComposer&gt; sf(ComposerService::getComposerService());
    if (sf != nullptr) {
        mEventConnection = sf-&gt;createDisplayEventConnection(vsyncSource, eventRegistration);
        if (mEventConnection != nullptr) {
            mDataChannel = std::make_unique&lt;gui::BitTube&gt;();
            const auto status = mEventConnection-&gt;stealReceiveChannel(mDataChannel.get());
            if (!status.isOk()) {
                ALOGE(&quot;stealReceiveChannel failed: %s&quot;, status.toString8().c_str());
                mInitError = std::make_optional&lt;status_t&gt;(status.transactionError());
                mDataChannel.reset();
                mEventConnection.clear();
            }
        }
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>status_t DisplayEventDispatcher::initialize() {
    status_t result = mReceiver.initCheck();
    if (result) {
        ALOGW(&quot;Failed to initialize display event receiver, status=%d&quot;, result);
        return result;
    }

    if (mLooper != nullptr) {
        int rc = mLooper-&gt;addFd(mReceiver.getFd(), 0, Looper::EVENT_INPUT, this, NULL);
        if (rc &lt; 0) {
            return UNKNOWN_ERROR;
        }
    }

    return OK;
}

void DisplayEventDispatcher::dispose() {
    ALOGV(&quot;dispatcher %p ~ Disposing display event dispatcher.&quot;, this);

    if (!mReceiver.initCheck() &amp;&amp; mLooper != nullptr) {
        mLooper-&gt;removeFd(mReceiver.getFd());
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>EventThreadConnection::EventThreadConnection(
        EventThread* eventThread, uid_t callingUid, ResyncCallback resyncCallback,
        ISurfaceComposer::EventRegistrationFlags eventRegistration)
      : resyncCallback(std::move(resyncCallback)),
        mOwnerUid(callingUid),
        mEventRegistration(eventRegistration),
        mEventThread(eventThread),
        mChannel(gui::BitTube::DefaultSize) {}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>binder::Status EventThreadConnection::stealReceiveChannel(gui::BitTube* outChannel) {
    std::scoped_lock lock(mLock);
    if (mChannel.initCheck() != NO_ERROR) {
        return binder::Status::fromStatusT(NAME_NOT_FOUND);
    }

    outChannel-&gt;setReceiveFd(mChannel.moveReceiveFd());
    outChannel-&gt;setSendFd(base::unique_fd(dup(mChannel.getSendFd())));
    return binder::Status::ok();
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="vsync-如何与图形数据流方向结合的-以及各个阶段的作用" tabindex="-1"><a class="header-anchor" href="#vsync-如何与图形数据流方向结合的-以及各个阶段的作用" aria-hidden="true">#</a> VSYNC 如何与图形数据流方向结合的，以及各个阶段的作用</h2><p>首先我们要大概了解 Android 中的图形数据流的方向，从下面这张图，结合 Android 的图像流，我们大概把从 App 绘制到屏幕显示，分为下面几个阶段</p><p>第一阶段：App 在收到 Vsync-App 的时候，在主线程进行 measure、layout、draw(构建 DisplayList , 里面包含 OpenGL 渲染需要的命令及数据) 。这里对应的 Systrace 中的主线程 doFrame 操作</p><p>第二阶段：CPU 将数据上传（共享或者拷贝）给 GPU,　这里 ARM 设备 内存一般是 GPU 和 CPU 共享内存。这里对应的 Systrace 中的渲染线程的 flush drawing commands 操作</p><p>第三阶段：通知 GPU 渲染，真机一般不会阻塞等待 GPU 渲染结束，CPU 通知结束后就返回继续执行其他任务，使用 Fence 机制辅助 GPU CPU 进行同步操作</p><p>第四 阶段：swapBuffers，并通知 SurfaceFlinger 图层合成。这里对应的 Systrace 中的渲染线程的 eglSwapBuffersWithDamageKHR 操作</p><p>第五阶段：SurfaceFlinger 开始合成图层，如果之前提交的 GPU 渲染任务没结束，则等待 GPU 渲染完成，再合成（Fence 机制），合成依然是依赖 GPU，不过这就是下一个任务了.这里对应的 Systrace 中的 SurfaceFlinger 主线程的 onMessageReceived 操作（包括 handleTransaction、handleMessageInvalidate、handleMessageRefresh）SurfaceFlinger 在合成的时候，会将一些合成工作委托给 Hardware Composer,从而降低来自 OpenGL 和 GPU 的负载，只有 Hardware Composer 无法处理的图层，或者指定用 OpenGL 处理的图层，其他的 图层偶会使用 Hardware Composer 进行合成</p><p>第六阶段 ：最终合成好的数据放到屏幕对应的 Frame Buffer 中，固定刷新的时候就可以看到了</p><h2 id="vsync-的工作原理" tabindex="-1"><a class="header-anchor" href="#vsync-的工作原理" aria-hidden="true">#</a> VSYNC 的工作原理</h2><p>以下是从源码角度分析 Android 系统中 VSYNC 信号的工作原理：</p><ol><li><p>产生 VSYNC 信号：</p><ul><li>VSYNC 信号的产生由显示子系统（通常是 GPU）负责。在 Android 系统中，显示子系统通过 SurfaceFlinger（SF）服务来管理。SurfaceFlinger 位于 <code>frameworks/native/services/surfaceflinger/</code> 目录下。</li></ul></li><li><p>分发 VSYNC 信号：</p><ul><li>SurfaceFlinger 通过 EventThread 类来监听和分发 VSYNC 信号。EventThread 类位于 <code>frameworks/native/services/surfaceflinger/EventThread.cpp</code> 文件中。当 EventThread 收到 VSYNC 信号时，它会将信号发送给已注册的回调（通常是应用程序）。</li></ul></li><li><p>应用程序处理 VSYNC 信号：</p><ul><li>在 Android 应用程序中，VSYNC 信号主要通过 Choreographer 类来处理。Choreographer 类位于 <code>frameworks/base/core/java/android/view/Choreographer.java</code> 文件中。当 Choreographer 收到 VSYNC 信号时，它会执行预设的回调，包括处理输入事件、更新动画、计算布局和绘制界面元素等。</li></ul></li><li><p>提交帧到 SurfaceFlinger：</p><ul><li>当应用程序完成帧的渲染后，它会将帧提交给 SurfaceFlinger。这是通过 Surface 类来完成的，该类位于 <code>frameworks/base/core/java/android/view/Surface.java</code> 文件中。应用程序将新渲染的帧存储在一个名为 BufferQueue 的数据结构中，然后通知 SurfaceFlinger 可以从 BufferQueue 中获取新帧。</li></ul></li><li><p>合成帧：</p><ul><li>SurfaceFlinger 收到新帧后，会进行合成。合成的过程涉及到处理多个层（Layer）以生成最终显示在屏幕上的图像。合成过程在 <code>frameworks/native/services/surfaceflinger/CompositionEngine.cpp</code> 文件中进行。SurfaceFlinger 使用 GLES 或 Vulkan 来进行合成，具体取决于系统配置。</li></ul></li><li><p>发送帧到显示子系统：</p><ul><li>SurfaceFlinger 将合成后的帧发送回显示子系统，通常是 GPU。这样，显示子系统就可以将帧显示在屏幕上。这个过程可以在 <code>frameworks/native/services/surfaceflinger/DispSync.cpp</code> 文件中找到。</li></ul></li><li><p>循环处理：</p><ul><li>当下一个 VSYNC 信号到来时，这个过程会继续重复。</li></ul></li></ol><p>从源码的角度来看，Android 系统中 VSYNC 信号的工作原理涉及到从显示子系统产生信号，通过 SurfaceFlinger 分发信号，应用程序处理信号，合成帧，最后将帧显示在屏幕上。这个过程确保了屏幕刷新和应用程序渲染帧的频率保持同步，从而提供更好的用户体验。</p><h2 id="在perfetto中分析-vsync" tabindex="-1"><a class="header-anchor" href="#在perfetto中分析-vsync" aria-hidden="true">#</a> 在Perfetto中分析 VSYNC</h2><h3 id="vsync-app、vsync-sf-的含义" tabindex="-1"><a class="header-anchor" href="#vsync-app、vsync-sf-的含义" aria-hidden="true">#</a> VSYNC-app、VSYNC-sf 的含义</h3><p>在 Android 系统中，VSYNC-app 和 VSYNC-sf 是与屏幕刷新和帧渲染相关的两个事件。</p><ul><li><p>VSYNC-app：这个事件表示应用程序的 VSYNC 信号。它通知应用程序何时应该开始渲染新的一帧。应用程序在接收到 VSYNC-app 信号后，需要在下一个 VSYNC-app 信号到来之前完成渲染工作，以保证屏幕显示内容的流畅性。VSYNC-app 的触发频率取决于设备的屏幕刷新率（例如，60Hz、90Hz、120Hz 等）。</p></li><li><p>VSYNC-sf：这个事件表示 SurfaceFlinger（Android 的系统级合成器）的 VSYNC 信号。它通知 SurfaceFlinger 何时开始将各个应用程序的缓冲区内容合成并推送到显示器。SurfaceFlinger 在接收到 VSYNC-sf 信号后，需要在下一个 VSYNC-sf 信号到来之前完成合成工作，以确保显示内容的更新与屏幕刷新同步。</p></li></ul><p>VSYNC-app 和 VSYNC-sf 分别代表应用程序和 SurfaceFlinger 的 VSYNC 信号，它们在不同层次上控制和协调帧的渲染和显示过程，以确保屏幕内容的流畅更新。</p><h3 id="vsync-app和vsync-sf由谁触发" tabindex="-1"><a class="header-anchor" href="#vsync-app和vsync-sf由谁触发" aria-hidden="true">#</a> VSYNC-app和VSYNC-sf由谁触发</h3><p>VSYNC-app 和 VSYNC-sf 都是由硬件层的 VSYNC 信号触发的。VSYNC 信号是由显示器的垂直同步信号产生的，用于表明显示器准备好接收新的帧。当接收到 VSYNC 信号时，Android 系统会将其传递给相应的组件，以便它们开始执行相应的操作。</p><ul><li><p>VSYNC-app：当接收到硬件层的 VSYNC 信号时，Android 系统会将该信号传递给应用程序。具体来说，信号会传递给 Choreographer 类（位于 framework/base/core/java/android/view/Choreographer.java），它负责调度应用程序的帧渲染。当 Choreographer 收到 VSYNC 信号时，它会触发对应的帧回调，以便应用程序开始渲染新帧。</p></li><li><p>VSYNC-sf：同样，当接收到硬件层的 VSYNC 信号时，Android 系统会将该信号传递给 SurfaceFlinger。SurfaceFlinger 是 Android 系统的核心组件，负责合成各个应用程序和系统 UI 的图像。在源码层面，VSYNC-sf 信号由 SurfaceFlinger 类（位于 frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp）处理。当 SurfaceFlinger 接收到 VSYNC-sf 信号时，它会开始执行合成任务，将不同图层的图像组合在一起，并将结果发送到显示器。</p></li></ul><p>VSYNC-app 和 VSYNC-sf 都是由硬件层的 VSYNC 信号触发的，只是它们在 Android 系统中的具体实现和目标有所不同。VSYNC-app 针对应用程序的帧渲染，而 VSYNC-sf 针对 SurfaceFlinger 的图像合成和显示更新。</p><h3 id="vsync-app时间线中0和1的变化的含义" tabindex="-1"><a class="header-anchor" href="#vsync-app时间线中0和1的变化的含义" aria-hidden="true">#</a> VSYNC-app时间线中0和1的变化的含义</h3><p>当VSYNC-app值从0变为1时，代表着VSYNC信号的到来。当VSYNC-app值从1变为0时，也代表着VSYNC信号的到来。他们的间隔就是每帧的持续时间，应用程序应该在此时间内绘制完当前帧。</p><p><img src="`+a+'" alt="fluency-tools-perfetto-async-app-sf-buffertx"></p><p>在 Perfetto 工具中，VSYNC-app 时间线展示了 VSYNC-app 信号的触发情况。在这个时间线中，0 和 1 的变化表示 VSYNC-app 信号的状态变化。</p><ul><li><p>当 VSYNC-app 的值从 0 变为 1 时，这表示一个新的 VSYNC-app 信号到达，通知应用程序开始渲染新的一帧。应用程序应该在下一个 VSYNC-app 信号到来之前完成当前帧的渲染。</p></li><li><p>当 VSYNC-app 的值从 1 变为 0 时，这表示一个 VSYNC-app 信号周期结束，即表示从上一个 VSYNC-app 信号到来到当前这个 VSYNC-app 信号之间的时间段。</p></li></ul><p>这种 0 和 1 的变化方式是为了在时间轴上直观地表示 VSYNC-app 信号的到来和周期。通过观察 VSYNC-app 时间线上的 0 和 1，我们可以了解应用程序的帧渲染是否跟随 VSYNC-app 信号保持同步，以及应用程序的渲染性能。</p><h3 id="vsync-sf时间线中0和1的变化的含义" tabindex="-1"><a class="header-anchor" href="#vsync-sf时间线中0和1的变化的含义" aria-hidden="true">#</a> VSYNC-sf时间线中0和1的变化的含义</h3><p>当VSYNC-sf值从0变为1时，代表着VSYNC信号的到来。当VSYNC-sf值从1变为0时，也代表着VSYNC信号的到来。他们的间隔就是Surfaceflinger开始处理合成渲染的新一帧的耗时。</p><p><img src="'+a+`" alt="fluency-tools-perfetto-async-app-sf-buffertx"></p><p>在 Perfetto 工具中，VSYNC-sf 时间线展示了 VSYNC-sf 信号的触发情况。在这个时间线中，0 和 1 的变化表示 VSYNC-sf 信号的状态变化。</p><ul><li><p>当 VSYNC-sf 的值从 0 变为 1 时，这表示一个新的 VSYNC-sf 信号到达，通知 SurfaceFlinger 开始处理合成渲染的新一帧。SurfaceFlinger 应该在下一个 VSYNC-sf 信号到来之前完成当前帧的合成。</p></li><li><p>当 VSYNC-sf 的值从 1 变为 0 时，这表示一个 VSYNC-sf 信号周期结束，即表示从上一个 VSYNC-sf 信号到来到当前这个 VSYNC-sf 信号之间的时间段。</p></li></ul><p>这种 0 和 1 的变化方式是为了在时间轴上直观地表示 VSYNC-sf 信号的到来和周期。通过观察 VSYNC-sf 时间线上的 0 和 1，我们可以了解 SurfaceFlinger 的帧合成是否跟随 VSYNC-sf 信号保持同步，以及 SurfaceFlinger 的合成性能。</p><h3 id="buffertx时间线中数值变化的含义" tabindex="-1"><a class="header-anchor" href="#buffertx时间线中数值变化的含义" aria-hidden="true">#</a> BufferTX时间线中数值变化的含义</h3><p>SurfaceFlinger 的 BufferTX (Buffer Transaction) 事件表示一个缓冲区交换操作。当应用程序完成一帧的渲染并将其放入一个缓冲区时，应用程序会通知 SurfaceFlinger，请求将新渲染的帧与当前显示的帧进行交换。</p><p>从源码的角度解释，BufferTX时间线中数值变化的含义可以从以下注释中理解（这段注释摘自Android源码库的<code>frameworks/native/services/surfaceflinger/BufferStateLayer.h</code>文件）：</p><div class="language-cpp line-numbers-mode" data-ext="cpp"><pre class="language-cpp"><code><span class="token comment">// This integer is incremented every time a buffer arrives at the server for this layer,</span>
<span class="token comment">// and decremented when a buffer is dropped or latched. When changed the integer is exported</span>
<span class="token comment">// to systrace with ATRACE_INT and mBlastTransactionName. This way when debugging perf it is</span>
<span class="token comment">// possible to see when a buffer arrived at the server, and in which frame it latched.</span>
<span class="token comment">//</span>
<span class="token comment">// You can understand the trace this way:</span>
<span class="token comment">//     - If the integer increases, a buffer arrived at the server.</span>
<span class="token comment">//     - If the integer decreases in latchBuffer, that buffer was latched</span>
<span class="token comment">//     - If the integer decreases in setBuffer or doTransaction, a buffer was dropped</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>从这段注释中可以看出，BufferTX时间线的数值代表了以下几种情况：</p><ol><li>数值增加：表示有新的缓冲区（帧）到达服务器。</li><li>数值减少（在<code>latchBuffer</code>中）：表示缓冲区被锁定（用于渲染）。</li><li>数值减少（在<code>setBuffer</code>或<code>doTransaction</code>中）：表示缓冲区（帧）被丢弃。</li></ol><p>这种表示方式有助于分析和调试渲染性能，以确保应用程序的帧率和响应时间达到预期水平。</p><h2 id="vsync-offset" tabindex="-1"><a class="header-anchor" href="#vsync-offset" aria-hidden="true">#</a> VSYNC offset</h2><p>Vsync 信号可以由硬件产生，也可以用软件模拟，不过现在基本上都是硬件产生，负责产生硬件 Vsync 的是 HWC,HWC 可生成 VSYNC 事件并通过回调将事件发送到 SurfaceFlinge , DispSync 将 Vsync 生成由 Choreographer 和 SurfaceFlinger 使用的 VSYNC_APP 和 VSYNC_SF 信号.</p><p>disp_sync_arch</p><p>其中 app 和 sf 相对 hw_vsync_0 都有一个偏移,即 phase-app 和 phase-sf，如下图</p><p>Vsync Offset 我们指的是 VSYNC_APP 和 VSYNC_SF 之间有一个 Offset，即上图中 phase-sf - phase-app 的值，这个 Offset 是厂商可以配置的。如果 Offset 不为 0，那么意味着 App 和 SurfaceFlinger 主进程不是同时收到 Vsync 信号，而是间隔 Offset (通常在 0 - 16.6ms 之间)</p><h2 id="引用" tabindex="-1"><a class="header-anchor" href="#引用" aria-hidden="true">#</a> 引用</h2>`,57),W={href:"https://www.androidperformance.com/2019/12/01/Android-Systrace-Vsync/#/%E4%B8%8D%E4%BD%BF%E7%94%A8HW-VSYNC",target:"_blank",rel:"noopener noreferrer"},x={href:"https://source.android.google.cn/docs/core/graphics?authuser=0#android-graphics-components",target:"_blank",rel:"noopener noreferrer"},T={href:"https://source.android.com/docs/core/graphics/implement-vsync?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},z={href:"https://juejin.cn/post/7081614840606785550",target:"_blank",rel:"noopener noreferrer"},j={href:"https://www.jianshu.com/p/304f56f5d486",target:"_blank",rel:"noopener noreferrer"},I={href:"https://blog.csdn.net/Android062005/article/details/123090139",target:"_blank",rel:"noopener noreferrer"},L={href:"https://android-developers.googleblog.com/2020/04/high-refresh-rate-rendering-on-android.html",target:"_blank",rel:"noopener noreferrer"},B={href:"https://utzcoz.github.io/2020/05/02/Analyze-AOSP-vsync-model.html",target:"_blank",rel:"noopener noreferrer"},O={href:"https://www.cnblogs.com/roger-yu/p/16230337.html",target:"_blank",rel:"noopener noreferrer"},U={href:"https://www.cnblogs.com/roger-yu/p/16162940.html",target:"_blank",rel:"noopener noreferrer"},q={href:"https://www.cnblogs.com/roger-yu/p/16162940.html",target:"_blank",rel:"noopener noreferrer"},G={href:"https://www.cnblogs.com/roger-yu/p/15761646.html",target:"_blank",rel:"noopener noreferrer"},M={href:"https://utzcoz.github.io/2020/04/29/Print-call-stack-in-AOSP-native-code.html",target:"_blank",rel:"noopener noreferrer"};function Q(K,X){const i=c("ExternalLinkIcon");return d(),t("div",null,[h,e("ul",null,[e("li",null,[e("a",f,[n("https://utzcoz.github.io/2020/05/02/Analyze-AOSP-vsync-model.html"),r(i)])]),e("li",null,[e("a",b,[n("https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp;l=802?q=SurfaceFlinger&hl=zh-cn"),r(i)])])]),g,e("p",null,[n("由 Hardware Composer（HWC）生成的硬件信号是 HW_VSYNC_0，它是屏幕刷新图像的开始时的信号。HWC 可将 HW_VSYNC_0 信号通过回调函数（"),e("a",S,[C,r(i)]),n("）作为事件发送到 SurfaceFlinger 中：")]),_,e("ul",null,[e("li",null,[e("p",null,[e("a",y,[n("https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/jni/android_view_DisplayEventReceiver.cpp?q=android_view_DisplayEventReceiver&hl=zh-cn"),r(i)])])]),e("li",null,[e("p",null,[e("a",V,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/base/core/jni/android_view_DisplayEventReceiver.cpp;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;l=215?q=android_view_DisplayEventReceiver&hl=zh-cn"),r(i)])])])]),e("p",null,[e("a",N,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/DisplayEventDispatcher.cpp;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;l=63?hl=zh-cn"),r(i)])]),e("p",null,[e("a",Y,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/DisplayEventReceiver.cpp;l=35;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176?hl=zh-cn"),r(i)])]),e("p",null,[e("a",w,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/include/gui/DisplayEventReceiver.h;l=114;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn"),r(i)])]),e("p",null,[e("a",k,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/libs/gui/include/gui/DisplayEventReceiver.h;l=114;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn"),r(i)])]),H,e("p",null,[e("a",F,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/SurfaceFlinger.cpp;l=1818;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn"),r(i)])]),e("p",null,[e("a",D,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/Scheduler/Scheduler.cpp;l=221;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn"),r(i)])]),e("p",null,[e("a",E,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp;l=290;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn"),r(i)])]),e("p",null,[e("a",A,[n("https://cs.android.com/android/platform/superproject/+/refs/heads/master:frameworks/native/services/surfaceflinger/Scheduler/EventThread.cpp;l=397;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=1;bpt=1?hl=zh-cn"),r(i)])]),e("p",null,[e("a",P,[n("https://cs.android.com/android/platform/superproject/+/master:frameworks/native/libs/gui/include/private/gui/BitTube.h;l=38;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176?q=gui::BitTube::DefaultSize&ss=android%2Fplatform%2Fsuperproject&hl=zh-cn"),r(i)])]),R,e("ul",null,[e("li",null,[e("a",W,[n("https://www.androidperformance.com/2019/12/01/Android-Systrace-Vsync/#/不使用HW-VSYNC"),r(i)])]),e("li",null,[e("a",x,[n("https://source.android.google.cn/docs/core/graphics?authuser=0#android-graphics-components"),r(i)])]),e("li",null,[e("a",T,[n("https://source.android.com/docs/core/graphics/implement-vsync?hl=zh-cn"),r(i)])]),e("li",null,[e("a",z,[n("https://juejin.cn/post/7081614840606785550"),r(i)])]),e("li",null,[e("a",j,[n("https://www.jianshu.com/p/304f56f5d486"),r(i)])]),e("li",null,[e("a",I,[n("https://blog.csdn.net/Android062005/article/details/123090139"),r(i)])]),e("li",null,[e("a",L,[n("https://android-developers.googleblog.com/2020/04/high-refresh-rate-rendering-on-android.html"),r(i)])]),e("li",null,[e("a",B,[n("https://utzcoz.github.io/2020/05/02/Analyze-AOSP-vsync-model.html"),r(i)])]),e("li",null,[e("a",O,[n("https://www.cnblogs.com/roger-yu/p/16230337.html"),r(i)])]),e("li",null,[e("a",U,[n("https://www.cnblogs.com/roger-yu/p/16162940.html"),r(i)])]),e("li",null,[e("a",q,[n("https://www.cnblogs.com/roger-yu/p/16162940.html"),r(i)])]),e("li",null,[e("a",G,[n("https://www.cnblogs.com/roger-yu/p/15761646.html"),r(i)])]),e("li",null,[e("a",M,[n("https://utzcoz.github.io/2020/04/29/Print-call-stack-in-AOSP-native-code.html"),r(i)])])])])}const J=l(m,[["render",Q],["__file","fluency-08-perfetto-android-graphics-vsync.html.vue"]]);export{J as default};