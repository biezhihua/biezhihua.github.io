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

## SurfaceFlinger工程理解

### SurfaceFlinger

SurfaceFlinger的启动和消息队列处理机制（四）

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
