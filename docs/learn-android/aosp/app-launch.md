---
tag:
  - android
  - aosp
---

# Android | AOSP | 应用启动全流程分析 | 转载&加工

## 前言1

对优秀文章[《Android应用启动全流程分析（源码深度剖析）》](https://www.jianshu.com/p/37370c1d17fc)学习的记录

## 前言2

源码版本：android-13.0.0_r41

结合Perfetto分析工具，基于最新Android 13 AOSP源码完整的分析一下这个从用户手指触控点击屏幕应用图标到应用界面展示到屏幕上的整个应用启动过程，也是对之前所做所学的一个总结与归纳。

## 大纲

- Android 触控事件处理机制
- Zygote 进程启动和应用进程创建流程
- Handler 消息机制
- AMS 的Activity 组件管理
- 应用 Application 和 Activity 组件创建与初始化
- 应用 UI 布局与绘制
- RenderThread 渲染
- SurfaceFlinger 合成显示

## 应用 Input 触控事件处理流程

### 系统机制分析

Android 系统是由事件驱动的，而 Input 是最常见的事件之一，用户的点击、滑动、长按等操作，都属于 Input 事件驱动，其中的核心就是 `InputReader` 和 `InputDispatcher`。`InputReader` 和 `InputDispatcher` 是跑在 system_server 进程中的两个 native 循环线程，负责读取和分发 Input 事件。整个处理过程大致流程如下：

- `InputReader` 负责从 `EventHub` 里面把 Input 事件读取出来，然后交给 `InputDispatcher` 进行事件分发；
- `InputDispatcher` 在拿到 `InputReader` 获取的事件之后，对事件进行包装后，寻找并分发到目标窗口;
- `InboundQueue` 队列（“iq”）中放着 `InputDispatcher` 从 `InputReader` 中拿到的 Input 事件；
- `OutboundQueue`（“oq”）队列里面放的是即将要被派发给各个目标窗口 App 的事件；
- `WaitQueue` 队列里面记录的是已经派发给 App（“wq”），但是 App 还在处理没有返回处理成功的事件；
- `PendingInputEventQueue` 队列（“aq”）中记录的是应用需要处理的 Input 事件，这里可以看到 Input 事件已经传递到了应用进程；
- `deliverInputEvent` 标识 App UI Thread 被 Input 事件唤醒；
- `InputResponse` 标识 Input 事件区域，这里可以看到一个 Input_Down 事件 + 若干个 Input_Move 事件 + 一个 Input_Up 事件的处理阶段都被算到了这里；
- App 响应处理Input 事件，内部会在其界面View树中传递处理。

用一张图描述整个过程大致如下：

![](/learn-android/aosp/app-launch-1.png)

### 结合 Perfetto 分析

从桌面点击应用图标启动应用，system_server 的 native 线程 `InputReader` 首先负责从 `EventHub` 中利用 linux 的 epoll 机制监听并从屏幕驱动读取上报的触控事件，然后唤醒另外一条 native 线程 `InputDispatcher` 负责进行进一步事件分发。`InputDispatcher` 中会先将事件放到 `InboundQueue` 也就是“iq”队列中，然后寻找具体处理 Input 事件的目标应用窗口，并将事件放入对应的目标窗口 `OutboundQueue` 也就是“oq”队列中等待通过 `SocketPair` 双工信道发送到应用目标窗口中。最后当事件发送给具体的应用目标窗口后，会将事件移动到 `WaitQueue` 也 就是 “wq” 中等待目标应用处理事件完成，并开启倒计时，如果目标应用窗口在 5S 内没有处理完成此次触控事件，就会向 system_server 报应用 ANR 异常事件。以上整个过程在 Android 系统源码中都加有相应的 trace，如下截图所示：

![](/learn-android/aosp/app-launch-2.png)

接着上面的流程继续往下分析：当 Input 触控事件传递到桌面应用进程后，Input 事件到来后先通过  `enqueueInputEvent` 函数放入 “aq” 本地待处理队列中，并唤醒应用的 UI 线程在 `deliverInputEvent` 的流程中进行 Input 事件的具体分发与处理。

具体会先交给在应用界面 `Window` 创建时的 `ViewRootImpl#setView` 流程中创建的多个不同类型的  `InputStage` 中依次进行处理（比如对输入法处理逻辑的封装 `ImeInputStage` ），整个处理流程是按照责任链的设计模式进行。最后会交给 `ViewPostImeInputStage` 中具体进行处理，这里面会从 View 布局树的根节点 `DecorView` 开始遍历整个 `View` 树上的每一个子 `View` 或 `ViewGroup` 界面进行事件的分发、拦截、处理的逻辑。

最后触控事件处理完成后会调用 `finishInputEvent` 结束应用对触控事件处理逻辑，这里面会通过 JNI 调用到 native 层 `InputConsumer` 的 `sendFinishedSignal` 函数通知 `InputDispatcher` 事件处理完成，从触发从 "wq" 队列中及时移除待处理事件以免报ANR异常。

![](/learn-android/aosp/app-launch-3.png)

![](/learn-android/aosp/app-launch-4.png)

桌面应用界面 `View` 中在连续处理一个 `ACTION_DOWN` 的 `TouchEvent` 触控事件和多个 `ACTION_MOVE`，直到最后出现一个`ACTION_UP` 的 `TouchEvent` 事件后，判断属于 `onClick` 点击事件，然后透过 `ActivityManager` Binder 调用 AMS 的 `startActivity` 服务接口触发启动应用的逻辑。

从Perfetto上看如下图所示：

![](/learn-android/aosp/app-launch-5.png)
![](/learn-android/aosp/app-launch-6.png)

## 应用进程的创建与启动

### Pause 桌面应用

桌面进程收到 Input 触控事件并处理后 binder 调用框架 AMS 的的 `startActivity` 接口启动应用，相关简化代码如下：

```java
frameworks/base/services/core/java/com/android/server/wm/ActivityStarter.java
private int startActivityUnchecked(final ActivityRecord r, ActivityRecord sourceRecord,
              IVoiceInteractionSession voiceSession, IVoiceInteractor voiceInteractor,
              int startFlags, boolean doResume, ActivityOptions options, Task inTask,
              boolean restrictedBgActivity, NeededUriGrants intentGrants) {
      ...
      try {
          ...
          // 添加“startActivityInner”的trace tag
          Trace.traceBegin(Trace.TRACE_TAG_WINDOW_MANAGER, "startActivityInner");
          // 执行startActivityInner启动应用的逻辑
          result = startActivityInner(r, sourceRecord, voiceSession, voiceInteractor,
                  startFlags, doResume, options, inTask, restrictedBgActivity, intentGrants);
      } finally {
          Trace.traceEnd(Trace.TRACE_TAG_WINDOW_MANAGER);
          ...
      }
      ...
  }
```

在执行 `startActivityInner` 启动应用逻辑中，AMS 中的 `Activity` 栈管理的逻辑，检查发现当前处于前台 Resume 状态的  `Activity` 是桌面应用，所以第一步需要通知桌面应用的 `Activity` 进入 `Paused` 状态，相关简化代码逻辑如下：

```java
frameworks/base/services/core/java/com/android/server/wm/TaskFragment.java
void schedulePauseActivity(ActivityRecord prev, boolean userLeaving,
        boolean pauseImmediately, boolean autoEnteringPip, String reason) {
    try {
        mAtmService.getLifecycleManager().scheduleTransaction(prev.app.getThread(),
                prev.token, PauseActivityItem.obtain(prev.finishing, userLeaving,
                        prev.configChangeFlags, pauseImmediately, autoEnteringPip));
    } catch (Exception e) {
    }
}

```

桌面应用进程这边执行收到 pause 消息后执行 `Activity` 的 `onPause` 生命周期，并在执行完成后，会 binder 调用 AMS 的 `activityPaused` 接口通知系统执行完 `Activity` 的 pause 动作，相关代码如下：

```java
frameworks/base/services/core/java/com/android/server/wm/ActivityClientController.java
public void activityPaused(IBinder token) {
    synchronized (mGlobalLock) {
        Trace.traceBegin(TRACE_TAG_WINDOW_MANAGER, "activityPaused");
        final ActivityRecord r = ActivityRecord.forTokenLocked(token);
        if (r != null) {
            r.activityPaused(false);
        }
        Trace.traceEnd(TRACE_TAG_WINDOW_MANAGER);
    }
}

frameworks/base/services/core/java/com/android/server/wm/ActivityRecord.java
void activityPaused(boolean timeout) {
    
    final TaskFragment taskFragment = getTaskFragment();
    if (taskFragment != null) {
        removePauseTimeout();

        final ActivityRecord pausingActivity = taskFragment.getPausingActivity();
        if (pausingActivity == this) {
            mAtmService.deferWindowLayout();
            try {
              taskFragment.completePause(true /* resumeNext */, null /* resumingActivity */);
            } finally {
              ...
            }
            return;
        } else {
            ...
        }
    }
    ...
}
```

在Perfetto中表现为：

![](/learn-android/aosp/app-launch-7.png)

![](/learn-android/aosp/app-launch-13.png)

具体的调用链路如下图所示：

![](/learn-android/aosp/app-launch-8.png)

![](/learn-android/aosp/app-launch-9.png)

AMS 这边收到应用的 `activityPaused` 调用后，继续执行启动应用的逻辑，判断需要启动的应用 `Activity` 所在的进程不存在，所以接下来需要先 `startProcessAsync` 创建应用进程，相关简化代码如下：

```java
frameworks/base/services/core/java/com/android/server/wm/ActivityTaskSupervisor.java
void startSpecificActivity(ActivityRecord r, boolean andResume, boolean checkConfig) {
    // Is this activity's application already running?
    final WindowProcessController wpc =
            mService.getProcessController(r.processName, r.info.applicationInfo.uid);

    boolean knownToBeDead = false;
    if (wpc != null && wpc.hasThread()) {
        try {
            realStartActivityLocked(r, wpc, andResume, checkConfig);
            return;
        } catch (RemoteException e) {
        }
        ...
    }

    ...

    mService.startProcessAsync(r, knownToBeDead, isTop,
            isTop ? HostingRecord.HOSTING_TYPE_TOP_ACTIVITY
                    : HostingRecord.HOSTING_TYPE_ACTIVITY);
}
```

![](/learn-android/aosp/app-launch-10.png)

![](/learn-android/aosp/app-launch-11.png)

![](/learn-android/aosp/app-launch-12.png)

### 创建应用进程

接上一小节的分析可以知道，Android 应用进程的启动是被动式的，在桌面点击图标启动一个应用的组件如 Activity 时，如果 Activity 所在的进程不存在，就会创建并启动进程。Android 系统中一般应用进程的创建都是统一由 zygote 进程 fork 创建的，AMS 在需要创建应用进程时，会通过 socket 连接并通知到到 zygote 进程在开机阶段就创建好的 socket 服务端，然后由 zygote 进程 fork 创建出应用进程。整体架构如下图所示：

![](/learn-android/aosp/app-launch-13.png)
![](/learn-android/aosp/app-launch-14.png)
![](/learn-android/aosp/app-launch-15.png)
![](/learn-android/aosp/app-launch-16.png)
![](/learn-android/aosp/app-launch-17.png)
![](/learn-android/aosp/app-launch-18.png)
![](/learn-android/aosp/app-launch-19.png)

我们接着上节中的分析，继续从 `AMS#startProcessAsync` 创建进程函数入手，继续看一下应用进程创建相关简化流程代码：

#### AMS 发送 socket 请求

```java
frameworks/base/services/core/java/com/android/server/wm/ActivityTaskManagerService.java
void startProcessAsync(ActivityRecord activity, boolean knownToBeDead, boolean isTop,
        String hostingType) {
    try {
        if (Trace.isTagEnabled(TRACE_TAG_WINDOW_MANAGER)) {
            Trace.traceBegin(TRACE_TAG_WINDOW_MANAGER, "dispatchingStartProcess:"
                    + activity.processName);
        }
        // Post message to start process to avoid possible deadlock of calling into AMS with the
        // ATMS lock held.
        final Message m = PooledLambda.obtainMessage(ActivityManagerInternal::startProcess,
                mAmInternal, activity.processName, activity.info.applicationInfo, knownToBeDead,
                isTop, hostingType, activity.intent.getComponent());
        mH.sendMessage(m);
    } finally {
        Trace.traceEnd(TRACE_TAG_WINDOW_MANAGER);
    }
}

frameworks/base/services/core/java/com/android/server/am/ActivityManagerService.java
public void startProcess(String processName, ApplicationInfo info, boolean knownToBeDead,
        boolean isTop, String hostingType, ComponentName hostingName) {
    try {
        if (Trace.isTagEnabled(Trace.TRACE_TAG_ACTIVITY_MANAGER)) {
            Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "startProcess:"
                    + processName);
        }
        synchronized (ActivityManagerService.this) {
            // If the process is known as top app, set a hint so when the process is
            // started, the top priority can be applied immediately to avoid cpu being
            // preempted by other processes before attaching the process of top app.
            startProcessLocked(processName, info, knownToBeDead, 0 /* intentFlags */,
                    new HostingRecord(hostingType, hostingName, isTop),
                    ZYGOTE_POLICY_FLAG_LATENCY_SENSITIVE, false /* allowWhileBooting */,
                    false /* isolated */);
        }
    } finally {
        Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
    }
}

frameworks/base/services/core/java/com/android/server/am/ActivityManagerService.java
final ProcessRecord startProcessLocked(String processName,
        ApplicationInfo info, boolean knownToBeDead, int intentFlags,
        HostingRecord hostingRecord, int zygotePolicyFlags, boolean allowWhileBooting,
        boolean isolated) {
    return mProcessList.startProcessLocked(processName, info, knownToBeDead, intentFlags,
            hostingRecord, zygotePolicyFlags, allowWhileBooting, isolated, 0 /* isolatedUid */,
            false /* isSdkSandbox */, 0 /* sdkSandboxClientAppUid */,
            null /* sdkSandboxClientAppPackage */,
            null /* ABI override */, null /* entryPoint */,
            null /* entryPointArgs */, null /* crashHandler */);
}

frameworks/base/services/core/java/com/android/server/am/ProcessList.java
boolean startProcessLocked(HostingRecord hostingRecord, String entryPoint, ProcessRecord app,
        int uid, int[] gids, int runtimeFlags, int zygotePolicyFlags, int mountExternal,
        String seInfo, String requiredAbi, String instructionSet, String invokeWith,
        long startUptime, long startElapsedTime) {
    ...

    if (mService.mConstants.FLAG_PROCESS_START_ASYNC) {
        if (DEBUG_PROCESSES) Slog.i(TAG_PROCESSES,
                "Posting procStart msg for " + app.toShortString());
        mService.mProcStartHandler.post(() -> handleProcessStart(
                app, entryPoint, gids, runtimeFlags, zygotePolicyFlags, mountExternal,
                requiredAbi, instructionSet, invokeWith, startSeq));
        return true;
    } else {
        try {
            ...
        } catch (RuntimeException e) {
            ...
        }
        return app.getPid() > 0;
    }
}

frameworks/base/services/core/java/com/android/server/am/ProcessList.java
private void handleProcessStart(final ProcessRecord app, final String entryPoint,
        final int[] gids, final int runtimeFlags, int zygotePolicyFlags,
        final int mountExternal, final String requiredAbi, final String instructionSet,
        final String invokeWith, final long startSeq) {
    final Runnable startRunnable = () -> {
        try {
            final Process.ProcessStartResult startResult = startProcess(app.getHostingRecord(),
                    entryPoint, app, app.getStartUid(), gids, runtimeFlags, zygotePolicyFlags,
                    mountExternal, app.getSeInfo(), requiredAbi, instructionSet, invokeWith,
                    app.getStartTime());

            synchronized (mService) {
                handleProcessStartedLocked(app, startResult, startSeq);
            }
        } catch (RuntimeException e) {
           ...
    };
    ...
}

frameworks/base/services/core/java/com/android/server/am/ProcessList.java
private Process.ProcessStartResult startProcess(HostingRecord hostingRecord, String entryPoint,
        ProcessRecord app, int uid, int[] gids, int runtimeFlags, int zygotePolicyFlags,
        int mountExternal, String seInfo, String requiredAbi, String instructionSet,
        String invokeWith, long startTime) {
    try {
        Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "Start proc: " +
                app.processName);

        ...

        final Process.ProcessStartResult startResult;
        boolean regularZygote = false;
        if (hostingRecord.usesWebviewZygote()) {
           ...
        } else if (hostingRecord.usesAppZygote()) {
           ...
        } else {
            regularZygote = true;
            startResult = Process.start(entryPoint,
                    app.processName, uid, uid, gids, runtimeFlags, mountExternal,
                    app.info.targetSdkVersion, seInfo, requiredAbi, instructionSet,
                    app.info.dataDir, invokeWith, app.info.packageName, zygotePolicyFlags,
                    isTopApp, app.getDisabledCompatChanges(), pkgDataInfoMap,
                    allowlistedAppDataInfoMap, bindMountAppsData, bindMountAppStorageDirs,
                    new String[]{PROC_START_SEQ_IDENT + app.getStartSeq()});
        }

        ....

        return startResult;
    } finally {
        Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
    }
}

frameworks/base/core/java/android/os/Process.java
public static ProcessStartResult start(@NonNull final String processClass,
                                        @Nullable final String niceName,
                                        int uid, int gid, @Nullable int[] gids,
                                        int runtimeFlags,
                                        int mountExternal,
                                        int targetSdkVersion,
                                        @Nullable String seInfo,
                                        @NonNull String abi,
                                        @Nullable String instructionSet,
                                        @Nullable String appDataDir,
                                        @Nullable String invokeWith,
                                        @Nullable String packageName,
                                        int zygotePolicyFlags,
                                        boolean isTopApp,
                                        @Nullable long[] disabledCompatChanges,
                                        @Nullable Map<String, Pair<String, Long>>
                                                pkgDataInfoMap,
                                        @Nullable Map<String, Pair<String, Long>>
                                                whitelistedDataInfoMap,
                                        boolean bindMountAppsData,
                                        boolean bindMountAppStorageDirs,
                                        @Nullable String[] zygoteArgs) {
    return ZYGOTE_PROCESS.start(processClass, niceName, uid, gid, gids,
                runtimeFlags, mountExternal, targetSdkVersion, seInfo,
                abi, instructionSet, appDataDir, invokeWith, packageName,
                zygotePolicyFlags, isTopApp, disabledCompatChanges,
                pkgDataInfoMap, whitelistedDataInfoMap, bindMountAppsData,
                bindMountAppStorageDirs, zygoteArgs);
}


frameworks/base/core/java/android/os/ZygoteProcess.java
public final Process.ProcessStartResult start(@NonNull final String processClass,
                                                final String niceName,
                                                int uid, int gid, @Nullable int[] gids,
                                                int runtimeFlags, int mountExternal,
                                                int targetSdkVersion,
                                                @Nullable String seInfo,
                                                @NonNull String abi,
                                                @Nullable String instructionSet,
                                                @Nullable String appDataDir,
                                                @Nullable String invokeWith,
                                                @Nullable String packageName,
                                                int zygotePolicyFlags,
                                                boolean isTopApp,
                                                @Nullable long[] disabledCompatChanges,
                                                @Nullable Map<String, Pair<String, Long>>
                                                        pkgDataInfoMap,
                                                @Nullable Map<String, Pair<String, Long>>
                                                        allowlistedDataInfoList,
                                                boolean bindMountAppsData,
                                                boolean bindMountAppStorageDirs,
                                                @Nullable String[] zygoteArgs) {
    ...

    try {
        return startViaZygote(processClass, niceName, uid, gid, gids,
                runtimeFlags, mountExternal, targetSdkVersion, seInfo,
                abi, instructionSet, appDataDir, invokeWith, /*startChildZygote=*/ false,
                packageName, zygotePolicyFlags, isTopApp, disabledCompatChanges,
                pkgDataInfoMap, allowlistedDataInfoList, bindMountAppsData,
                bindMountAppStorageDirs, zygoteArgs);
    } catch (ZygoteStartFailedEx ex) {
        ...
    }
}

frameworks/base/core/java/android/os/ZygoteProcess.java
private Process.ProcessStartResult startViaZygote(@NonNull final String processClass,
                                                    @Nullable final String niceName,
                                                    final int uid, final int gid,
                                                    @Nullable final int[] gids,
                                                    int runtimeFlags, int mountExternal,
                                                    int targetSdkVersion,
                                                    @Nullable String seInfo,
                                                    @NonNull String abi,
                                                    @Nullable String instructionSet,
                                                    @Nullable String appDataDir,
                                                    @Nullable String invokeWith,
                                                    boolean startChildZygote,
                                                    @Nullable String packageName,
                                                    int zygotePolicyFlags,
                                                    boolean isTopApp,
                                                    @Nullable long[] disabledCompatChanges,
                                                    @Nullable Map<String, Pair<String, Long>>
                                                            pkgDataInfoMap,
                                                    @Nullable Map<String, Pair<String, Long>>
                                                            allowlistedDataInfoList,
                                                    boolean bindMountAppsData,
                                                    boolean bindMountAppStorageDirs,
                                                    @Nullable String[] extraArgs)
                                                    throws ZygoteStartFailedEx {
    ...

    synchronized(mLock) {
        ...
        return zygoteSendArgsAndGetResult(openZygoteSocketIfNeeded(abi),
                                            zygotePolicyFlags,
                                            argsForZygote);
    }
}

private Process.ProcessStartResult zygoteSendArgsAndGetResult(
        ZygoteState zygoteState, int zygotePolicyFlags, @NonNull ArrayList<String> args)
        throws ZygoteStartFailedEx {
    ...

    /*
        * See com.android.internal.os.ZygoteArguments.parseArgs()
        * Presently the wire format to the zygote process is:
        * a) a count of arguments (argc, in essence)
        * b) a number of newline-separated argument strings equal to count
        *
        * After the zygote process reads these it will write the pid of
        * the child or -1 on failure, followed by boolean to
        * indicate whether a wrapper process was used.
        */
    String msgStr = args.size() + "\n" + String.join("\n", args) + "\n";

    if (shouldAttemptUsapLaunch(zygotePolicyFlags, args)) {
        try {
            return attemptUsapSendArgsAndGetResult(zygoteState, msgStr);
        } catch (IOException ex) {
            // If there was an IOException using the USAP pool we will log the error and
            // attempt to start the process through the Zygote.
            Log.e(LOG_TAG, "IO Exception while communicating with USAP pool - "
                    + ex.getMessage());
        }
    }

    return attemptZygoteSendArgsAndGetResult(zygoteState, msgStr);
}

private Process.ProcessStartResult attemptZygoteSendArgsAndGetResult(
        ZygoteState zygoteState, String msgStr) throws ZygoteStartFailedEx {
    try {
        final BufferedWriter zygoteWriter = zygoteState.mZygoteOutputWriter;
        final DataInputStream zygoteInputStream = zygoteState.mZygoteInputStream;

        zygoteWriter.write(msgStr);
        zygoteWriter.flush();

        // Always read the entire result from the input stream to avoid leaving
        // bytes in the stream for future process starts to accidentally stumble
        // upon.
        Process.ProcessStartResult result = new Process.ProcessStartResult();
        result.pid = zygoteInputStream.readInt();
        result.usingWrapper = zygoteInputStream.readBoolean();

        if (result.pid < 0) {
            throw new ZygoteStartFailedEx("fork() failed");
        }

        return result;
    } catch (IOException ex) {
        zygoteState.close();
        Log.e(LOG_TAG, "IO Exception while communicating with Zygote - "
                + ex.toString());
        throw new ZygoteStartFailedEx(ex);
    }
}

```

```text
msgStr:
--runtime-args
--setuid=10116
--setgid=10116
--runtime-flags=16787715
--mount-external-default
--target-sdk-version=33
--setgroups=50116,20116,9997
--nice-name=com.example.myapplication
--seinfo=default:targetSdkVersion=33:complete
--app-data-dir=/data/user/0/com.example.myapplication
--package-name=com.example.myapplication
--is-top-app
--pkg-data-info-map=com.example.myapplication,null,123338
--bind-mount-data-dirs
--disabled-compat-changes=132649864,135634846,135772972,143231523,143539591,161145287,162547999,166236554,168419799,169897160,170233598,174042936,174042980,174043039,174227820,174228127,176926741,176926753,176926771,176926829,177438394,178038272,180326787,180326845,181136395,182811243,184838306,185004937,189229956,189969734,189969744,189969749,189969779,189969782,189970036,189970038,189970040,191513214,196254758,208648326,210856463,218959984,226439802,254631730,263259275
android.app.ActivityThread
seq=54

```

在 `ZygoteProcess#startViaZygote` 中，最后创建应用进程的逻辑：

`openZygoteSocketIfNeeded` 函数中打开本地 socket 客户端连接到 zygote 进程的 socket 服务端；
`zygoteSendArgsAndGetResult` 发送 socket 请求参数，带上了创建的应用进程参数信息；
return 返回的数据结构 `ProcessStartResult` 中会有新创建的进程的pid字段。

### Zygote 处理 socket 请求

其实早在系统开机阶段，zygote 进程创建时，就会在 `ZygoteInit#main` 入口函数中创建服务端 socket，并预加载系统资源和框架类（加速应用进程启动速度），代码如下：

```java
frameworks/base/core/java/com/android/internal/os/ZygoteInit.java
public static void main(String[] argv) {
    ZygoteServer zygoteServer = null;

    try {

        if (!enableLazyPreload) {
            // 1.preload提前加载框架通用类和系统资源到进程，加速进程启动
            preload(bootTimingsTraceLog);
        }

        // 2.创建zygote进程的socket server服务端对象
        zygoteServer = new ZygoteServer(isPrimaryZygote);

        Log.i(TAG, "Accepting command socket connections");

        // 3.进入死循环，等待AMS发请求过来
        caller = zygoteServer.runSelectLoop(abiList);
    } catch (Throwable ex) {
    } finally {
        
    }
}

```

继续往下看 `ZygoteServer#runSelectLoop` 如何监听并处理AMS客户端的请求：

```java
frameworks/base/core/java/com/android/internal/os/ZygoteServer.java
Runnable runSelectLoop(String abiList) {
    // 进入死循环监听
    while (true) {
    while (--pollIndex >= 0) {
        if (pollIndex == 0) {
            ...
        } else if (pollIndex < usapPoolEventFDIndex) {
            // Session socket accepted from the Zygote server socket
            // 得到一个请求连接封装对象ZygoteConnection
            ZygoteConnection connection = peers.get(pollIndex);
            // processCommand函数中处理AMS客户端请求
            final Runnable command = connection.processCommand(this, multipleForksOK);
        }
    }
    }
}

frameworks/base/core/java/com/android/internal/os/ZygoteConnection.java
Runnable processCommand(ZygoteServer zygoteServer, boolean multipleOK) {
        ...
        // 1.fork创建应用子进程
        pid = Zygote.forkAndSpecialize(...);
        try {
            if (pid == 0) {
                ...
                // 2.pid为0，当前处于新创建的子应用进程中，处理请求参数
                return handleChildProc(parsedArgs, childPipeFd, parsedArgs.mStartChildZygote);
            } else {
                ...
                handleParentProc(pid, serverPipeFd);
            }
        } finally {
            ...
        }
}

frameworks/base/core/java/com/android/internal/os/ZygoteConnection.java
private Runnable handleChildProc(ZygoteArguments parsedArgs,
        FileDescriptor pipeFd, boolean isZygote) {
    ...
    // 关闭从父进程zygote继承过来的ZygoteServer服务端地址
    closeSocket();
    ...
    if (parsedArgs.mInvokeWith != null) {
        ...
    } else {
        if (!isZygote) {
            // 继续进入ZygoteInit#zygoteInit继续完成子应用进程的相关初始化工作
            return ZygoteInit.zygoteInit(parsedArgs.mTargetSdkVersion,
                    parsedArgs.mDisabledCompatChanges,
                    parsedArgs.mRemainingArgs, null /* classLoader */);
        } else {
            ...
        }
    }
}
```

### 应用进程初始化

![](/learn-android/aosp/app-launch-20.png)

接上一节中的分析，zygote 进程监听接收 AMS 的请求，fork 创建子应用进程，然后pid为0时进入子进程空间，然后在 `ZygoteInit#zygoteInit` 中完成进程的初始化动作，相关简化代码如下：

```java
/*frameworks/base/core/java/com/android/internal/os/ZygoteInit.java*/
public static Runnable zygoteInit(int targetSdkVersion, long[] disabledCompatChanges,
            String[] argv, ClassLoader classLoader) {
    ...
    // 原生添加名为“ZygoteInit ”的systrace tag以标识进程初始化流程
    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "ZygoteInit");
    RuntimeInit.redirectLogStreams();
    // 1.RuntimeInit#commonInit中设置应用进程默认的java异常处理机制
    RuntimeInit.commonInit();
    // 2.ZygoteInit#nativeZygoteInit函数中JNI调用启动进程的binder线程池
    ZygoteInit.nativeZygoteInit();
    // 3.RuntimeInit#applicationInit中反射创建ActivityThread对象并调用其“main”入口方法
    return RuntimeInit.applicationInit(targetSdkVersion, disabledCompatChanges, argv,
            classLoader);
}
```

应用进程启动后，初始化过程中主要依次完成以下几件事情：

- 应用进程默认的 java 异常处理机制（可以实现监听、拦截应用进程所有的Java crash的逻辑）；
- JNI调用启动进程的 binder 线程池（注意应用进程的binder线程池资源是自己创建的并非从 zygote 父进程继承的）；
- 通过反射创建 `ActivityThread` 对象并调用其 `main` 入口方法。

我们继续看 `RuntimeInit#applicationInit` 简化的代码流程：

```java
frameworks/base/core/java/com/android/internal/os/RuntimeInit.java
protected static Runnable applicationInit(int targetSdkVersion, long[] disabledCompatChanges,
        String[] argv, ClassLoader classLoader) {
    ...
    // 结束“ZygoteInit ”的systrace tag
    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
    // Remaining arguments are passed to the start class's static main
    return findStaticMain(args.startClass, args.startArgs, classLoader);
}

frameworks/base/core/java/com/android/internal/os/RuntimeInit.java
protected static Runnable findStaticMain(String className, String[] argv,
        ClassLoader classLoader) {
    Class<?> cl;
    try {
        // 1.反射加载创建ActivityThread类对象
        cl = Class.forName(className, true, classLoader);
    } catch (ClassNotFoundException ex) {
        ...
    }
    Method m;
    try {
        // 2.反射调用其main方法
        m = cl.getMethod("main", new Class[] { String[].class });
    } catch (NoSuchMethodException ex) {
        ...
    } catch (SecurityException ex) {
        ...
    }
    ...
    // 3.触发执行以上逻辑
    return new MethodAndArgsCaller(m, argv);
}
```

我们继续往下看 `ActivityThread` 的 `main` 函数中又干了什么：

```java
frameworks/base/core/java/android/app/ActivityThread.java
public static void main(String[] args) {
     // 原生添加的标识进程ActivityThread初始化过程的systrace tag，名为“ActivityThreadMain”
     Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "ActivityThreadMain");
     ...
     // 1.创建并启动主线程的loop消息循环
     Looper.prepareMainLooper();
     ...
     // 2.attachApplication注册到系统AMS中
     ActivityThread thread = new ActivityThread();
     thread.attach(false, startSeq);
     ...
     Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
     Looper.loop();
     ...
}

frameworks/base/core/java/android/app/ActivityThread.java
private void attach(boolean system, long startSeq) {
    ...
    if (!system) {
       ...
       final IActivityManager mgr = ActivityManager.getService();
       try {
          // 通过binder调用AMS的attachApplication接口将自己注册到AMS中
          mgr.attachApplication(mAppThread, startSeq);
       } catch (RemoteException ex) {
                throw ex.rethrowFromSystemServer();
       }
    }
}
```

可以看到进程 `ActivityThread#main` 函数初始化的主要逻辑是：

- 创建并启动主线程的loop消息循环；
- 通过 binder 调用 AMS 的 `attachApplication` 接口将自己 attach 注册到 AMS 中。

![](/learn-android/aosp/app-launch-22.png)

![](/learn-android/aosp/app-launch-21.png)

## 应用主线程消息循环机制的建立

接上一节的分析，我们知道应用进程创建后会通过反射创建 `ActivityThread` 对象并执行其 `main` 函数，进行主线程的初始化工作：

```java
frameworks/base/core/java/android/app/ActivityThread.java
public static void main(String[] args) {
     ...
     // 1.创建Looper、MessageQueue
     Looper.prepareMainLooper();
     ...
     // 2.启动loop消息循环，开始准备接收消息
     Looper.loop();
     ...
}

// 3.创建主线程Handler对象
frameworks/base/core/java/android/app/ActivityThread.java
public final class ActivityThread extends ClientTransactionHandler
        implements ActivityThreadInternal {
    ...
    
    final Looper mLooper = Looper.myLooper();

    final H mH = new H();
}

frameworks/base/core/java/android/app/ActivityThread.java
class H extends Handler {
        public static final int BIND_APPLICATION        = 110;
        public static final int EXIT_APPLICATION        = 111;
        public static final int RECEIVER                = 113;
        public static final int CREATE_SERVICE          = 114;
}

frameworks/base/core/java/android/os/Looper.java
public static void prepareMainLooper() {
     
     // 准备主线程的Looper
     prepare(false);

     // 
     synchronized (Looper.class) {
          if (sMainLooper != null) {
              throw new IllegalStateException("The main Looper has already been prepared.");
          }
          sMainLooper = myLooper();
     }
}

frameworks/base/core/java/android/os/Looper.java
private static void prepare(boolean quitAllowed) {
      if (sThreadLocal.get() != null) {
          throw new RuntimeException("Only one Looper may be created per thread");
      }
      // 创建主线程的Looper对象，并通过ThreadLocal机制实现与主线程的一对一绑定
      sThreadLocal.set(new Looper(quitAllowed));
}

frameworks/base/core/java/android/os/Looper.java
private Looper(boolean quitAllowed) {
      // 创建MessageQueue消息队列
      mQueue = new MessageQueue(quitAllowed);
      mThread = Thread.currentThread();
}
```

主线程初始化完成后，主线程就有了完整的 `Looper`、`MessageQueue`、`Handler`，此时 `ActivityThread` 的 `Handler` 就可以开始处理 `Message`，包括 `Application`、`Activity`、`ContentProvider`、`Service`、`Broadcast` 等组件的生命周期函数，都会以 `Message` 的形式，在主线程按照顺序处理，这就是 App 主线程的初始化和运行原理，部分处理的 Message 如下

```java
frameworks/base/core/java/android/app/ActivityThread.java
class H extends Handler {
        public static final int BIND_APPLICATION        = 110;
        public static final int RECEIVER                = 113;
        public static final int CREATE_SERVICE          = 114;
        public static final int BIND_SERVICE            = 121;
        
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case BIND_APPLICATION:
                    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "bindApplication");
                    AppBindData data = (AppBindData)msg.obj;
                    handleBindApplication(data);
                    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
                    break;
                    ...
            }
         }
         ...
}
```

主线程初始化完成后，主线程就进入阻塞状态，等待 `Message`，一旦有 `Message` 发过来，主线程就会被唤醒，处理 `Message`，处理完成之后，如果没有其他的 `Message` 需要处理，那么主线程就会进入休眠阻塞状态继续等待。可以说 Android 系统的运行是受消息机制驱动的，而整个消息机制是由上面所说的四个关键角色相互配合实现的（`Handler`、`Looper`、`MessageQueue`、`Message`），其运行原理如下图所示：

![](/learn-android/aosp/app-launch-23.png)

```java
frameworks/base/core/java/android/os/Looper.java
public static void loop() {
    final Looper me = myLooper();
    
    ...

    for (;;) {
        if (!loopOnce(me, ident, thresholdOverride)) {
            return;
        }
    }
}

/home/biezhihua/projects/aosp/frameworks/base/core/java/android/os/Looper.java
private static boolean loopOnce(final Looper me,
        final long ident, final int thresholdOverride) {

    //
    Message msg = me.mQueue.next(); // might block
    
    ...

    try {
        msg.target.dispatchMessage(msg);
        ...
    } catch (Exception exception) {
    } finally {
    }

    ...

    return true;
}

/home/biezhihua/projects/aosp/frameworks/base/core/java/android/os/MessageQueue.java
Message next() {
    ...

    for (;;) {
        ...

        nativePollOnce(ptr, nextPollTimeoutMillis);

        ...
    }
}

frameworks/base/core/jni/android_os_MessageQueue.cpp
static void android_os_MessageQueue_nativePollOnce(JNIEnv* env, jobject obj,
        jlong ptr, jint timeoutMillis) {
    ...
    nativeMessageQueue->pollOnce(env, obj, timeoutMillis);
}

frameworks/base/core/jni/android_os_MessageQueue.cpp
void NativeMessageQueue::pollOnce(JNIEnv* env, jobject pollObj, int timeoutMillis) {
    ...
    mLooper->pollOnce(timeoutMillis);
    ...
}

 /**
 * Waits for events to be available, with optional timeout in milliseconds.
 * Invokes callbacks for all file descriptors on which an event occurred.
 */
int pollOnce(int timeoutMillis, int* outFd, int* outEvents, void** outData);
inline int pollOnce(int timeoutMillis) {
    return pollOnce(timeoutMillis, nullptr, nullptr, nullptr);
}

// system/core/libutils/Looper.cpp
int Looper::pollOnce(int timeoutMillis, int* outFd, int* outEvents, void** outData) {
    for (;;) {
        
        ...

        result = pollInner(timeoutMillis);
    }
}

// system/core/libutils/Looper.cpp
int Looper::pollInner(int timeoutMillis) {

    ...

    int eventCount = epoll_wait(mEpollFd.get(), eventItems, EPOLL_MAX_EVENTS, timeoutMillis);

    ...
    
    return result;
}

```

- `Handler` : `Handler` 主要是用来处理 `Message`，应用可以在任何线程创建 `Handler`，只要在创建的时候指定对应的 `Looper` 即可，如果不指定，默认是在当前 `Thread` 对应的 `Looper`。
- `Looper`: `Looper` 可以看成是一个循环器，其 `loop` 方法开启后，不断地从 `MessageQueue` 中获取 `Message`，对 `Message` 进行 `Delivery` 和 `Dispatch`，最终发给对应的 `Handler` 去处理。
- `MessageQueue`：`MessageQueue` 就是一个 `Message` 管理器，队列中是 `Message`，在没有 `Message` 的时候，`MessageQueue` 借助 Linux 的 ePoll 机制，阻塞休眠等待，直到有 `Message` 进入队列将其唤醒。
- `Message`：`Message` 是传递消息的对象，其内部包含了要传递的内容，最常用的包括 what、arg、callback 等。

## 应用 Application 和 Activity 组件创建与初始化

### Application 的创建与初始化

应用进程启动初始化执行 ActivityThread#main 函数过程中，在开启主线程loop 消息循环之前，会通过 Binder 调用系统核心服务 AMS 的 attachApplication 接口将自己注册到 AMS 中。下面我们接着这个流程往下看，我们先从Perfetto上看看 AMS 服务的 attachApplication 接口是如何处理应用进程的 attach 注册请求的：

![](/learn-android/aosp/create-app-12.png)

![](/learn-android/aosp/create-app-13.png)

我们继续来看相关代码的简化流程：

```java


// frameworks/base/services/core/java/com/android/server/am/ActivityManagerService.java
public final void attachApplication(IApplicationThread thread, long startSeq) {
    synchronized (this) {
        ...
        attachApplicationLocked(thread, callingPid, callingUid, startSeq);
        ...
    }
}


frameworks/base/services/core/java/com/android/server/am/ActivityManagerService.java
private boolean attachApplicationLocked(@NonNull IApplicationThread thread,
            int pid, int callingUid, long startSeq) {
     ...
     if (app.isolatedEntryPoint != null) {
           ...
     } else if (instr2 != null) {
           ...
     } else {
           thread.bindApplication(...);
     }
     ...
     // See if the top visible activity is waiting to run in this process...
     if (normalMode) {
          try {
            didSomething = mAtmInternal.attachApplication(app.getWindowProcessController());
          } catch (Exception e) {
            ...
          }
      }
}

frameworks/base/core/java/android/app/ActivityThread.java
private class ApplicationThread extends IApplicationThread.Stub {
      @Override
      public final void bindApplication(...) {
            ...
            AppBindData data = new AppBindData();
            data.processName = processName;
            data.appInfo = appInfo;
            ...
            // 向应用进程主线程Handler发送BIND_APPLICATION消息，触发在应用主线程执行handleBindApplication初始化动作
            sendMessage(H.BIND_APPLICATION, data);
      }
      ...
}

frameworks/base/core/java/android/app/ActivityThread.java
class H extends Handler {
      ...
      public void handleMessage(Message msg) {
           switch (msg.what) {
                case BIND_APPLICATION:
                    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "bindApplication");
                    AppBindData data = (AppBindData)msg.obj;
                    // 在应用主线程执行handleBindApplication初始化动作
                    handleBindApplication(data);
                    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
                    break;
                    ...
           }
      }
      ...
}

frameworks/base/core/java/android/app/ActivityThread.java
private void handleBindApplication(AppBindData data) {
    ...
}
```

从上面的代码流程可以看出：AMS 服务在执行应用的 attachApplication 注册请求过程中，会用应用进程ActivityThread#IApplicationThread的 bindApplication 接口，而 bindApplication 接口函数实现中又会通过往应用主线程消息队列 post BIND_APPLICATION 消息触发执行handleBindApplication 初始化函数，从 Perfetto 看如下图所示：

![](/learn-android/aosp/create-app-14.png)

我们继续结合代码看看 handleBindApplication 的简化关键流程：

```java
frameworks/base/core/java/android/app/ActivityThread.java
private void handleBindApplication(AppBindData data) {
    ...
    // 1.创建应用的LoadedApk对象
    data.info = getPackageInfoNoCheck(data.appInfo, data.compatInfo);
    ...
    // 2.创建应用Application的Context、触发Art虚拟机加载应用APK的Dex文件到内存中，并加载应用APK的Resource资源
    final ContextImpl appContext = ContextImpl.createAppContext(this, data.info);
    ...
    // 3.调用LoadedApk的makeApplication函数，实现创建应用的Application对象
    app = data.info.makeApplication(data.restrictedBackupMode, null);
    ...
    // 4.执行应用Application#onCreate生命周期函数
    mInstrumentation.onCreate(data.instrumentationArgs);
    ...
}
```

在 ActivityThread#handleBindApplication 初始化过程中在应用主线程中主要完成如下几件事件**：

- 根据框架传入的 ApplicationInfo 息创建应用 APK 对应的 LoadedApk 对象;
- 创建应用 Application 的 Context 对象；
- 创建类加载器 ClassLoader 对象并触发 Art 虚拟机执行 OpenDexFilesFromOat 动作加载应用 APK 的 Dex 文件；
- 通过 LoadedApk 加载应用 APK 的 Resource 资源；
- 调用 LoadedApk 的 makeApplication 函数，创建应用的 Application 对象;
- 执行应用 Application#onCreate 生命周期函数（APP应用开发者能控制的第一行代码）;

下面我们结合代码重点看看 APK Dex 文件的加载和 Resource 资源的加载流程。

### 应用APK的Dex文件加载

```java
frameworks/base/core/java/android/app/ContextImpl.java
static ContextImpl createAppContext(ActivityThread mainThread, LoadedApk packageInfo,
            String opPackageName) {
    if (packageInfo == null) throw new IllegalArgumentException("packageInfo");
    // 1.创建应用Application的Context对象
    ContextImpl context = new ContextImpl(null, mainThread, packageInfo, null, null, null, null,
                0, null, opPackageName);
    // 2.触发加载APK的DEX文件和Resource资源
    context.setResources(packageInfo.getResources());
    context.mIsSystemOrSystemUiContext = isSystemOrSystemUI(context);
    return context;
}

frameworks/base/core/java/android/app/LoadedApk.java
public Resources getResources() {
     if (mResources == null) {
         ...
         // 加载APK的Resource资源
         mResources = ResourcesManager.getInstance().getResources(null, mResDir,
                    splitPaths, mOverlayDirs, mApplicationInfo.sharedLibraryFiles,
                    Display.DEFAULT_DISPLAY, null, getCompatibilityInfo(),
                    getClassLoader()/*触发加载APK的DEX文件*/, null);
      }
      return mResources;
}

public ClassLoader getClassLoader() {
     synchronized (this) {
         if (mClassLoader == null) {
             createOrUpdateClassLoaderLocked(null /*addedPaths*/);
          }
          return mClassLoader;
     }
}

private void createOrUpdateClassLoaderLocked(List<String> addedPaths) {
     ...
     if (mDefaultClassLoader == null) {
          ...
          // 创建默认的mDefaultClassLoader对象，触发art虚拟机加载dex文件
          mDefaultClassLoader = ApplicationLoaders.getDefault().getClassLoaderWithSharedLibraries(
                    zip, mApplicationInfo.targetSdkVersion, isBundledApp, librarySearchPath,
                    libraryPermittedPath, mBaseClassLoader,
                    mApplicationInfo.classLoaderName, sharedLibraries);
          ...
     }
     ...
     if (mClassLoader == null) {
         // 赋值给mClassLoader对象
         mClassLoader = mAppComponentFactory.instantiateClassLoader(mDefaultClassLoader,
                    new ApplicationInfo(mApplicationInfo));
     }
}

frameworks/base/core/java/android/app/ApplicationLoaders.java
ClassLoader getClassLoaderWithSharedLibraries(...) {
    // For normal usage the cache key used is the same as the zip path.
    return getClassLoader(zip, targetSdkVersion, isBundled, librarySearchPath,
                              libraryPermittedPath, parent, zip, classLoaderName, sharedLibraries);
}

private ClassLoader getClassLoader(String zip, ...) {
        ...
        synchronized (mLoaders) {
            ...
            if (parent == baseParent) {
                ...
                // 1.创建BootClassLoader加载系统框架类，并增加相应的systrace tag
                Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, zip);
                ClassLoader classloader = ClassLoaderFactory.createClassLoader(
                        zip,  librarySearchPath, libraryPermittedPath, parent,
                        targetSdkVersion, isBundled, classLoaderName, sharedLibraries);
                Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
                ...
                return classloader;
            }
            // 2.创建PathClassLoader加载应用APK的Dex类，并增加相应的systrace tag
            Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, zip);
            ClassLoader loader = ClassLoaderFactory.createClassLoader(
                    zip, null, parent, classLoaderName, sharedLibraries);
            Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);
            return loader;
        }
}

frameworks/base/core/java/com/android/internal/os/ClassLoaderFactory.java
public static ClassLoader createClassLoader(...) {
        // 通过new的方式创建ClassLoader对象，最终会触发art虚拟机加载APK的dex文件
        ClassLoader[] arrayOfSharedLibraries = (sharedLibraries == null)
                ? null
                : sharedLibraries.toArray(new ClassLoader[sharedLibraries.size()]);
        if (isPathClassLoaderName(classloaderName)) {
            return new PathClassLoader(dexPath, librarySearchPath, parent, arrayOfSharedLibraries);
        }
        ...
}
```

从以上代码可以看出：在创建Application的Context对象后会立马尝试去加载APK的Resource资源，而在这之前需要通过LoadedApk去创建类加载器ClassLoader对象，而这个过程最终就会触发Art虚拟机加载应用APK的dex文件。

![](/learn-android/aosp/create-app-14.png)

### 应用APK的Resource资源加载

```java
frameworks/base/core/java/android/app/LoadedApk.java
public Resources getResources() {
     if (mResources == null) {
         ...
         // 加载APK的Resource资源
         mResources = ResourcesManager.getInstance().getResources(null, mResDir,
                    splitPaths, mOverlayDirs, mApplicationInfo.sharedLibraryFiles,
                    Display.DEFAULT_DISPLAY, null, getCompatibilityInfo(),
                    getClassLoader()/*触发加载APK的DEX文件*/, null);
      }
      return mResources;
}

frameworks/base/core/java/android/app/ResourcesManager.java
public @Nullable Resources getResources(...) {
      try {
          // 原生Resource资源加载的systrace tag
          Trace.traceBegin(Trace.TRACE_TAG_RESOURCES, "ResourcesManager#getResources");
          ...
          return createResources(activityToken, key, classLoader, assetsSupplier);
      } finally {
          Trace.traceEnd(Trace.TRACE_TAG_RESOURCES);
      }
}

private @Nullable Resources createResources(...) {
      synchronized (this) {
            ...
            // 执行创建Resources资源对象
            ResourcesImpl resourcesImpl = findOrCreateResourcesImplForKeyLocked(key, apkSupplier);
            if (resourcesImpl == null) {
                return null;
            }
            ...
     }
}

private @Nullable ResourcesImpl findOrCreateResourcesImplForKeyLocked(
            @NonNull ResourcesKey key, @Nullable ApkAssetsSupplier apkSupplier) {
      ...
      impl = createResourcesImpl(key, apkSupplier);
      ...
}

private @Nullable ResourcesImpl createResourcesImpl(@NonNull ResourcesKey key,
            @Nullable ApkAssetsSupplier apkSupplier) {
        ...
        // 创建AssetManager对象，真正实现的APK文件加载解析动作
        final AssetManager assets = createAssetManager(key, apkSupplier);
        ...
}

private @Nullable AssetManager createAssetManager(@NonNull final ResourcesKey key,
            @Nullable ApkAssetsSupplier apkSupplier) {
        ...
        for (int i = 0, n = apkKeys.size(); i < n; i++) {
            final ApkKey apkKey = apkKeys.get(i);
            try {
                // 通过loadApkAssets实现应用APK文件的加载
                builder.addApkAssets(
                        (apkSupplier != null) ? apkSupplier.load(apkKey) : loadApkAssets(apkKey));
            } catch (IOException e) {
                ...
            }
        }
        ...   
}

private @NonNull ApkAssets loadApkAssets(@NonNull final ApkKey key) throws IOException {
        ...
        if (key.overlay) {
            ...
        } else {
            // 通过ApkAssets从APK文件所在的路径去加载
            apkAssets = ApkAssets.loadFromPath(key.path,
                    key.sharedLib ? ApkAssets.PROPERTY_DYNAMIC : 0);
        }
        ...
    }

frameworks/base/core/java/android/content/res/ApkAssets.java
public static @NonNull ApkAssets loadFromPath(@NonNull String path, @PropertyFlags int flags)
            throws IOException {
        return new ApkAssets(FORMAT_APK, path, flags, null /* assets */);
}

private ApkAssets(@FormatType int format, @NonNull String path, @PropertyFlags int flags,
            @Nullable AssetsProvider assets) throws IOException {
        ...
        // 通过JNI调用Native层的系统system/lib/libandroidfw.so库中的相关C函数实现对APK文件压缩包的解析与加载
        mNativePtr = nativeLoad(format, path, flags, assets);
        ...
}
```

从以上代码可以看出：系统对于应用APK文件资源的加载过程其实就是创建应用进程中的 Resources 资源对象的过程，其中真正实现 APK 资源文件的I/O解析作，最终是借助于 AssetManager 中通过 JNI 调用系统 Native 层的相关 C 函数实现。整个过程从上 Perfetto 看如下图所示：

![](/learn-android/aosp/create-app-15.png)

## 应用 Activity 的创建与初始化

### Activity Create

看看AMS在收到应用进程的attachApplication注册请求后，先通过应用及进程的IApplicationThread#bindApplication接口，触发应用进程在主线程执行 handleBindApplication 初始化操作，然后继续执行启动应用 Activity 的操作，下面我们来看看系统是如何启动创建应用 Activity 的，简化代码流程如下：

![](/learn-android/aosp/create-app-16.png)

```java
frameworks/base/services/core/java/com/android/server/wm/ActivityTaskManagerService.java
public boolean attachApplication(WindowProcessController wpc) throws RemoteException {
    synchronized (mGlobalLockWithoutBoost) {
        if (Trace.isTagEnabled(TRACE_TAG_WINDOW_MANAGER)) {
            Trace.traceBegin(TRACE_TAG_WINDOW_MANAGER, "attachApplication:" + wpc.mName);
        }
        try {
            return mRootWindowContainer.attachApplication(wpc);
        } finally {
            Trace.traceEnd(TRACE_TAG_WINDOW_MANAGER);
        }
    }
}

frameworks/base/services/core/java/com/android/server/wm/RootWindowContainer.java
boolean attachApplication(WindowProcessController app) throws RemoteException {
    try {
        return mAttachApplicationHelper.process(app);
    } finally {
        mAttachApplicationHelper.reset();
    }
}

frameworks/base/services/core/java/com/android/server/wm/RootWindowContainer.java
boolean process(WindowProcessController app) throws RemoteException {
    mApp = app;
    for (int displayNdx = getChildCount() - 1; displayNdx >= 0; --displayNdx) {
        getChildAt(displayNdx).forAllRootTasks(this);
        if (mRemoteException != null) {
            throw mRemoteException;
        }
    }
    if (!mHasActivityStarted) {
        ensureActivitiesVisible(null /* starting */, 0 /* configChanges */,
                false /* preserveWindows */);
    }
    return mHasActivityStarted;
}

frameworks/base/services/core/java/com/android/server/wm/WindowContainer.java
void forAllRootTasks(Consumer<Task> callback) {
    forAllRootTasks(callback, true /* traverseTopToBottom */);
}
void forAllRootTasks(Consumer<Task> callback, boolean traverseTopToBottom) {
    int count = mChildren.size();
    if (traverseTopToBottom) {
        for (int i = count - 1; i >= 0; --i) {
            mChildren.get(i).forAllRootTasks(callback, traverseTopToBottom);
        }
    } else {
        for (int i = 0; i < count; i++) {
            mChildren.get(i).forAllRootTasks(callback, traverseTopToBottom);
            // Root tasks may be removed from this display. Ensure each task will be processed
            // and the loop will end.
            int newCount = mChildren.size();
            i -= count - newCount;
            count = newCount;
        }
    }
}

frameworks/base/services/core/java/com/android/server/wm/Task.java
void forAllRootTasks(Consumer<Task> callback, boolean traverseTopToBottom) {
    if (isRootTask()) {
        callback.accept(this);
    }
}

@accept:3600, RootWindowContainer$AttachApplicationHelper (com.android.server.wm)
public void accept(Task rootTask) {
    if (mRemoteException != null) {
        return;
    }
    if (rootTask.getVisibility(null /* starting */)
            == TASK_FRAGMENT_VISIBILITY_INVISIBLE) {
        return;
    }
    mTop = rootTask.topRunningActivity();
    rootTask.forAllActivities(this);
}

forAllActivities:1678, WindowContainer (com.android.server.wm)
boolean forAllActivities(Predicate<ActivityRecord> callback) {
    return forAllActivities(callback, true /*traverseTopToBottom*/);
}

forAllActivities:1684, WindowContainer (com.android.server.wm)
boolean forAllActivities(Predicate<ActivityRecord> callback, boolean traverseTopToBottom) {
    if (traverseTopToBottom) {
        for (int i = mChildren.size() - 1; i >= 0; --i) {
            if (mChildren.get(i).forAllActivities(callback, traverseTopToBottom)) return true;
        }
    } else {
        final int count = mChildren.size();
        for (int i = 0; i < count; i++) {
            if (mChildren.get(i).forAllActivities(callback, traverseTopToBottom)) return true;
        }
    }

    return false;
}

forAllActivities:4585, ActivityRecord (com.android.server.wm)
boolean forAllActivities(Predicate<ActivityRecord> callback, boolean traverseTopToBottom) {
    return callback.test(this);
}


test:3612, RootWindowContainer$AttachApplicationHelper (com.android.server.wm)
public boolean test(ActivityRecord r) {
    if (r.finishing || !r.showToCurrentUser() || !r.visibleIgnoringKeyguard
            || r.app != null || mApp.mUid != r.info.applicationInfo.uid
            || !mApp.mName.equals(r.processName)) {
        return false;
    }

    try {
        if (mTaskSupervisor.realStartActivityLocked(r, mApp,
                mTop == r && r.getTask().canBeResumed(r) /* andResume */,
                true /* checkConfig */)) {
            mHasActivityStarted = true;
        }
    } catch (RemoteException e) {
        Slog.w(TAG, "Exception in new application when starting activity " + mTop, e);
        mRemoteException = e;
        return true;
    }
    return false;
}

realStartActivityLocked:769, ActivityTaskSupervisor (com.android.server.wm)
boolean realStartActivityLocked(ActivityRecord r, WindowProcessController proc,
            boolean andResume, boolean checkConfig) throws RemoteException {
         ...
        // 1.先通过LaunchActivityItem封装Binder通知应用进程执行Launch Activity动作       
         clientTransaction.addCallback(LaunchActivityItem.obtain(...);
         // Set desired final state.
         final ActivityLifecycleItem lifecycleItem;
         if (andResume) {
                // 2.再通过ResumeActivityItem封装Binder通知应用进程执行Launch Resume动作        
                lifecycleItem = ResumeActivityItem.obtain(dc.isNextTransitionForward());
         }
         ...
         clientTransaction.setLifecycleStateRequest(lifecycleItem);
         // 执行以上封装的Binder调用
         mService.getLifecycleManager().scheduleTransaction(clientTransaction);
         ...
}
```

从以上代码分析可以看到，框架 system_server 进程最终是通过 ActivityStackSupervisor#realStartActivityLocked 函数中，通过 LaunchActivityItem 和 ResumeActivityItem 两个类的封装，依次实现 binder 调用通知应用进程这边执行 Activity 的 Launch 和 Resume 动作的，我们继续往下看相关代码流程：

```java

core/java/android/app/servertransaction/LaunchActivityItem.java
public void execute(ClientTransactionHandler client, IBinder token,
        PendingTransactionActions pendingActions) {
    Trace.traceBegin(TRACE_TAG_ACTIVITY_MANAGER, "activityStart");
    ActivityClientRecord r = new ActivityClientRecord(token, mIntent, mIdent, mInfo,
            mOverrideConfig, mCompatInfo, mReferrer, mVoiceInteractor, mState, mPersistentState,
            mPendingResults, mPendingNewIntents, mActivityOptions, mIsForward, mProfilerInfo,
            client, mAssistToken, mShareableActivityToken, mLaunchedFromBubble,
            mTaskFragmentToken);
    client.handleLaunchActivity(r, pendingActions, null /* customIntent */);
    Trace.traceEnd(TRACE_TAG_ACTIVITY_MANAGER);
}

/**
 * Extended implementation of activity launch. Used when server requests a launch or relaunch.
 */
core/java/android/app/ActivityThread.java
public Activity handleLaunchActivity(ActivityClientRecord r,
        PendingTransactionActions pendingActions, Intent customIntent) {
    ...

    final Activity a = performLaunchActivity(r, customIntent);

    ...

    return a;
}

    /**  Core implementation of activity launch. */
private Activity performLaunchActivity(ActivityClientRecord r, Intent customIntent) {
        ...
        // 1.创建Activity的Context
        ContextImpl appContext = createBaseContextForActivity(r);
        try {
            //2.反射创建Activity对象
            activity = mInstrumentation.newActivity(
                    cl, component.getClassName(), r.intent);
            ...
        } catch (Exception e) {
            ...
        }
        try {
            ...
            if (activity != null) {
                ...
                // 3.执行Activity的attach动作
                activity.attach(...);
                ...
                // 4.执行应用Activity的onCreate生命周期函数,并在setContentView调用中创建DecorView对象
                mInstrumentation.callActivityOnCreate(activity, r.state);
                ...
            }
            ...
        } catch (SuperNotCalledException e) {
            ...
        }
}

frameworks/base/core/java/android/app/Activity.java
final void attach(...) {
    ...
    // 1.创建表示应用窗口的PhoneWindow对象
    mWindow = new PhoneWindow(this, window, activityConfigCallback);
    ...
    // 2.为PhoneWindow配置WindowManager
    mWindow.setWindowManager(
            (WindowManager)context.getSystemService(Context.WINDOW_SERVICE),
            mToken, mComponent.flattenToString(),
            (info.flags & ActivityInfo.FLAG_HARDWARE_ACCELERATED) != 0);
    ...
}


public void callActivityOnCreate(Activity activity, Bundle icicle) {
    ...

    activity.performCreate(icicle);

    ...
}

core/java/android/app/Activity.java
final void performCreate(Bundle icicle) {
    performCreate(icicle, null);
}

core/java/android/app/Activity.java
final void performCreate(Bundle icicle, PersistableBundle persistentState) {
    if (Trace.isTagEnabled(Trace.TRACE_TAG_WINDOW_MANAGER)) {
        Trace.traceBegin(Trace.TRACE_TAG_WINDOW_MANAGER, "performCreate:"
                + mComponent.getClassName());
    }
    
    ...

    if (persistentState != null) {
        onCreate(icicle, persistentState);
    } else {
        onCreate(icicle);
    }
   
    ...
    
    Trace.traceEnd(Trace.TRACE_TAG_WINDOW_MANAGER);
}
```

从上面代码可以看出，应用进程这边在收到系统 binder 调用后，在主线程中创建 Activity 的流程主要步骤如下：

- 创建Activity的Context；
- 通过反射创建Activity对象；
- 执行Activity的attach动作，其中会创建应用窗口的PhoneWindow对象并设置WindowManage；
- 执行应用Activity的onCreate生命周期函数，并在setContentView中创建窗口的DecorView对象；

![](/learn-android/aosp/create-app-16.png)

### Activity Resume

```java
frameworks/base/core/java/android/app/servertransaction/ResumeActivityItem.java
@Override
public void execute(ClientTransactionHandler client, IBinder token,
            PendingTransactionActions pendingActions) {
   // 原生标识Activity Resume的systrace tag
   Trace.traceBegin(TRACE_TAG_ACTIVITY_MANAGER, "activityResume");
   client.handleResumeActivity(token, true /* finalStateRequest */, mIsForward,
                "RESUME_ACTIVITY");
   Trace.traceEnd(TRACE_TAG_ACTIVITY_MANAGER);
}

frameworks/base/core/java/android/app/ActivityThread.java
 @Override
public void handleResumeActivity(...){
    ...
    // 1.执行performResumeActivity流程,执行应用Activity的onResume生命周期函数
    final ActivityClientRecord r = performResumeActivity(token, finalStateRequest, reason);
    ...
    if (r.window == null && !a.mFinished && willBeVisible) {
            ...
            if (a.mVisibleFromClient) {
                if (!a.mWindowAdded) {
                    ...
                    // 2.执行WindowManager#addView动作开启视图绘制逻辑
                    wm.addView(decor, l);
                } else {
                  ...
                }
            }
     }
    ...
}

core/java/android/app/ActivityThread.java
public boolean performResumeActivity(ActivityClientRecord r, boolean finalStateRequest,
        String reason) {
    ...
    try {
        ...
        r.activity.performResume(r.startsNotResumed, reason);

       ...
    } catch (Exception e) {
        ...
    }
    return true;
}

core/java/android/view/WindowManagerImpl.java
public void addView(@NonNull View view, @NonNull ViewGroup.LayoutParams params) {
    mGlobal.addView(view, params, mContext.getDisplayNoVerify(), mParentWindow,
            mContext.getUserId());
}


frameworks/base/core/java/android/view/WindowManagerGlobal.java
public void addView(View view, ViewGroup.LayoutParams params,
        Display display, Window parentWindow, int userId) {
    ...

    ViewRootImpl root;
    View panelParentView = null;

    synchronized (mLock) {
        ...

        if (windowlessSession == null) {
            root = new ViewRootImpl(view.getContext(), display);
        } else {
            root = new ViewRootImpl(view.getContext(), display,
                    windowlessSession, new WindowlessWindowLayout());
        }

        view.setLayoutParams(wparams);

        mViews.add(view);
        mRoots.add(root);
        mParams.add(wparams);

        // do this last because it fires off messages to start doing things
        try {
            root.setView(view, wparams, panelParentView, userId);
        } catch (RuntimeException e) {
            ...
        }
    }
}

core/java/android/view/ViewRootImpl.java
public void setView(View view, WindowManager.LayoutParams attrs, View panelParentView,
        int userId) {
    synchronized (this) {
        if (mView == null) {
            mView = view;

            ...

            // Schedule the first layout -before- adding to the window
            // manager, to make sure we do the relayout before receiving
            // any other events from the system.
            requestLayout();

            ...

            ...
        }
    }
}
```

从上面代码可以看出，应用进程这边在接收到系统Binder调用请求后，在主线程中 Activity Resume 的流程主要步骤如下：

- 执行应用Activity的onResume生命周期函数;
- 执行WindowManager的addView动作开启视图绘制逻辑;
- 创建Activity的ViewRootImpl对象;
- 执行ViewRootImpl的setView函数开启UI界面绘制动作；

从 Perfetto 上看整个过程如下图所示：

![](/learn-android/aosp/create-app-18.png)

## 应用 layout 与 draw

接上一节的分析，应用主线程中在执行Activity的Resume流程的最后，会创建ViewRootImpl对象并调用其setView函数，从此并开启了应用界面UI布局与绘制的流程。在开始讲解这个过程之前，我们先来整理一下前面代码中讲到的这些概念，如Activity、PhoneWindow、DecorView、ViewRootImpl、WindowManager它们之间的关系与职责，因为这些核心类基本构成了Android系统的GUI显示系统在应用进程侧的核心架构，其整体架构如下图所示：

![](/learn-android/aosp/create-app-19.webp)

- Window是一个抽象类，通过控制DecorView提供了一些标准的UI方案，比如背景、标题、虚拟按键等，而PhoneWindow是Window的唯一实现类，在Activity创建后的attach流程中创建，应用启动显示的内容装载到其内部的mDecor（DecorView）；

- DecorView是整个界面布局View控件树的根节点，通过它可以遍历访问到整个View控件树上的任意节点；

- WindowManager是一个接口，继承自ViewManager接口，提供了View的基本操作方法；WindowManagerImp实现了WindowManager接口，内部通过组合方式持有WindowManagerGlobal，用来操作View；

- WindowManagerGlobal是一个全局单例，内部可以通过ViewRootImpl将View添加至窗口中；

- ViewRootImpl是所有View的Parent，用来总体管理View的绘制以及与系统WMS窗口管理服务的IPC交互从而实现窗口的开辟；ViewRootImpl是应用进程运转的发动机，可以看到ViewRootImpl内部包含mView（就是DecorView）、mSurface、Choregrapher，mView代表整个控件树，mSurfacce代表画布，应用的UI渲染会直接放到mSurface中，Choregorapher使得应用请求vsync信号，接收信号后开始渲染流程；

我们从ViewRootImpl的setView流程继续结合代码往下看：

```java
/*frameworks/base/core/java/android/view/ViewRootImpl.java*/
public void setView(View view, WindowManager.LayoutParams attrs, View panelParentView,
            int userId) {
      synchronized (this) {
         if (mView == null) {
             mView = view;
         }
         ...
         // 开启绘制硬件加速，初始化RenderThread渲染线程运行环境
         enableHardwareAcceleration(attrs);
         ...
         // 1.触发绘制动作
         requestLayout();
         ...
         inputChannel = new InputChannel();
         ...
         // 2.Binder调用访问系统窗口管理服务WMS接口，实现addWindow添加注册应用窗口的操作,并传入inputChannel用于接收触控事件
         res = mWindowSession.addToDisplayAsUser(mWindow, mSeq, mWindowAttributes,
                            getHostVisibility(), mDisplay.getDisplayId(), userId, mTmpFrame,
                            mAttachInfo.mContentInsets, mAttachInfo.mStableInsets,
                            mAttachInfo.mDisplayCutout, inputChannel,
                            mTempInsets, mTempControls);
         ...
         // 3.创建WindowInputEventReceiver对象，实现应用窗口接收触控事件
         mInputEventReceiver = new WindowInputEventReceiver(inputChannel,
                            Looper.myLooper());
         ...
         // 4.设置DecorView的mParent为ViewRootImpl
         view.assignParent(this);
         ...
      }
}
```

从以上代码可以看出ViewRootImpl的setView内部关键流程如下：

- requestLayout()通过一系列调用触发界面绘制（measure、layout、draw）动作，下文会详细展开分析；

- 通过Binder调用访问系统窗口管理服务WMS的addWindow接口，实现添加、注册应用窗口的操作，并传入本地创建inputChannel对象用于后续接收系统的触控事件，这一步执行完我们的View就可以显示到屏幕上了。关于WMS的内部实现流程也非常复杂，由于篇幅有限本文就不详细展开分析了。

- 创建WindowInputEventReceiver对象，封装实现应用窗口接收系统触控事件的逻辑；

- 执行view.assignParent(this)，设置DecorView的mParent为ViewRootImpl。所以，虽然ViewRootImpl不是一个View,但它是所有View的顶层Parent。

我们顺着ViewRootImpl的requestLayout动作继续往下看界面绘制的流程代码:

```java
/*frameworks/base/core/java/android/view/ViewRootImpl.java*/
public void requestLayout() {
    if (!mHandlingLayoutInLayoutRequest) {
         // 检查当前UI绘制操作是否发生在主线程，如果发生在子线程则会抛出异常
         checkThread();
         mLayoutRequested = true;
         // 触发绘制操作
         scheduleTraversals();
    }
}

@UnsupportedAppUsage
void scheduleTraversals() {
    if (!mTraversalScheduled) {
         ...
         // 注意此处会往主线程的MessageQueue消息队列中添加同步栏删，因为系统绘制消息属于异步消息，需要更高优先级的处理
         mTraversalBarrier = mHandler.getLooper().getQueue().postSyncBarrier();
         // 通过Choreographer往主线程消息队列添加CALLBACK_TRAVERSAL绘制类型的待执行消息，用于触发后续UI线程真正实现绘制动作
         mChoreographer.postCallback(
                    Choreographer.CALLBACK_TRAVERSAL, mTraversalRunnable, null);
         ...
     }
}
```

Choreographer 的引入，主要是配合系统Vsync垂直同步机制（Android“黄油计划”中引入的机制之一，协调APP生成UI数据和SurfaceFlinger合成图像，避免Tearing画面撕裂的现象），给上层 App 的渲染提供一个稳定的 Message 处理的时机，也就是 Vsync 到来的时候 ，系统通过对 Vsync 信号周期的调整，来控制每一帧绘制操作的时机。Choreographer 扮演 Android 渲染链路中承上启下的角色：

- 承上：负责接收和处理 App 的各种更新消息和回调，等到 Vsync 到来的时候统一处理。比如集中处理 Input(主要是 Input 事件的处理) 、Animation(动画相关)、Traversal(包括 measure、layout、draw 等操作) ，判断卡顿掉帧情况，记录 CallBack 耗时等；

- 启下：负责请求和接收 Vsync 信号。接收 Vsync 事件回调(通过 FrameDisplayEventReceiver.onVsync )，请求 Vsync(FrameDisplayEventReceiver.scheduleVsync) 。

Choreographer在收到CALLBACK_TRAVERSAL类型的绘制任务后，其内部的工作流程如下图所示：

![](/learn-android/aosp/create-app-20.webp)

![](/learn-android/aosp/create-app-22.png)

![](/learn-android/aosp/create-app-24.png)

从以上流程图可以看出：ViewRootImpl调用Choreographer的postCallback接口放入待执行的绘制消息后，Choreographer会先向系统申请APP 类型的vsync信号，然后等待系统vsync信号到来后，去回调到ViewRootImpl的doTraversal函数中执行真正的绘制动作（measure、layout、draw）。这个绘制过程从 Perfetto 上看如下图所示：

![](/learn-android/aosp/create-app-21.png)

我们接着ViewRootImpl的doTraversal函数的简化代码流程往下看：

```java
frameworks/base/core/java/android/view/ViewRootImpl.java
void doTraversal() {
     if (mTraversalScheduled) {
         mTraversalScheduled = false;
         // 调用removeSyncBarrier及时移除主线程MessageQueue中的Barrier同步栏删，以避免主线程发生“假死”
         mHandler.getLooper().getQueue().removeSyncBarrier(mTraversalBarrier);
         ...
         // 执行具体的绘制任务
         performTraversals();
         ...
    }
}

private void performTraversals() {
     ...
     // 1.从DecorView根节点出发，遍历整个View控件树，完成整个View控件树的measure测量操作
     windowSizeMayChange |= measureHierarchy(...);
     ...
     if (mFirst...) {
    // 2.第一次执行traversals绘制任务时，Binder调用访问系统窗口管理服务WMS的relayoutWindow接口，实现WMS计算应用窗口尺寸并向系统surfaceflinger正式申请Surface“画布”操作
         relayoutResult = relayoutWindow(params, viewVisibility, insetsPending);
     }
     ...
     // 3.从DecorView根节点出发，遍历整个View控件树，完成整个View控件树的layout测量操作
     performLayout(lp, mWidth, mHeight);
     ...
     // 4.从DecorView根节点出发，遍历整个View控件树，完成整个View控件树的draw测量操作
     performDraw();
     ...
}

private int relayoutWindow(WindowManager.LayoutParams params, int viewVisibility,
            boolean insetsPending) throws RemoteException {
        ...
        // 通过Binder IPC访问系统WMS服务的relayout接口，申请Surface“画布”操作
        int relayoutResult = mWindowSession.relayout(mWindow, mSeq, params,
                (int) (mView.getMeasuredWidth() * appScale + 0.5f),
                (int) (mView.getMeasuredHeight() * appScale + 0.5f), viewVisibility,
                insetsPending ? WindowManagerGlobal.RELAYOUT_INSETS_PENDING : 0, frameNumber,
                mTmpFrame, mTmpRect, mTmpRect, mTmpRect, mPendingBackDropFrame,
                mPendingDisplayCutout, mPendingMergedConfiguration, mSurfaceControl, mTempInsets,
                mTempControls, mSurfaceSize, mBlastSurfaceControl);
        if (mSurfaceControl.isValid()) {
            if (!useBLAST()) {
                // 本地Surface对象获取指向远端分配的Surface的引用
                mSurface.copyFrom(mSurfaceControl);
            } else {
               ...
            }
        }
        ...
}

private void performMeasure(int childWidthMeasureSpec, int childHeightMeasureSpec) {
        ...
        // 原生标识View树的measure测量过程的trace tag
        Trace.traceBegin(Trace.TRACE_TAG_VIEW, "measure");
        try {
            // 从mView指向的View控件树的根节点DecorView出发，遍历访问整个View树，并完成整个布局View树的测量工作
            mView.measure(childWidthMeasureSpec, childHeightMeasureSpec);
        } finally {
            Trace.traceEnd(Trace.TRACE_TAG_VIEW);
        }
}

private void performDraw() {
     ...
     boolean canUseAsync = draw(fullRedrawNeeded);
     ...
}

private boolean draw(boolean fullRedrawNeeded) {
    ...
    if (mAttachInfo.mThreadedRenderer != null && mAttachInfo.mThreadedRenderer.isEnabled()) {
        ...
        // 如果开启并支持硬件绘制加速，则走硬件绘制的流程（从Android 4.+开始，默认情况下都是支持跟开启了硬件加速的）
        mAttachInfo.mThreadedRenderer.draw(mView, mAttachInfo, this);
    } else {
        // 否则走drawSoftware软件绘制的流程
        if (!drawSoftware(surface, mAttachInfo, xOffset, yOffset,
                        scalingRequired, dirty, surfaceInsets)) {
                    return false;
         }
    }
}
```

从上面的代码流程可以看出，ViewRootImpl中负责的整个应用界面绘制的主要流程如下：

从界面View控件树的根节点DecorView出发，递归遍历整个View控件树，完成对整个View控件树的measure测量操作，由于篇幅所限，本文就不展开分析这块的详细流程；
界面第一次执行绘制任务时，会通过Binder IPC访问系统窗口管理服务WMS的relayout接口，实现窗口尺寸的计算并向系统申请用于本地绘制渲染的Surface“画布”的操作（具体由SurfaceFlinger负责创建应用界面对应的BufferQueueLayer对象，并通过内存共享的方式通过Binder将地址引用透过WMS回传给应用进程这边），由于篇幅所限，本文就不展开分析这块的详细流程；
从界面View控件树的根节点DecorView出发，递归遍历整个View控件树，完成对整个View控件树的layout测量操作；
从界面View控件树的根节点DecorView出发，递归遍历整个View控件树，完成对整个View控件树的draw测量操作，如果开启并支持硬件绘制加速（从Android 4.X开始谷歌已经默认开启硬件加速），则走GPU硬件绘制的流程，否则走CPU软件绘制的流程；

![](/learn-android/aosp/create-app-22.png)

借用一张图来总结应用UI绘制的流程，如下所示：

![](/learn-android/aosp/create-app-23.webp)

## 应用 RenderThread 渲染

截止到目前，在ViewRootImpl中完成了对界面的measure、layout和draw等绘制流程后，用户依然还是看不到屏幕上显示的应用界面内容，因为整个Android系统的显示流程除了前面讲到的UI线程的绘制外，界面还需要经过RenderThread线程的渲染处理，渲染完成后，还需要通过Binder调用“上帧”交给surfaceflinger进程中进行合成后送显才能最终显示到屏幕上。本小节中，我们将接上一节中ViewRootImpl中最后draw的流程继续往下分析开启硬件加速情况下，RenderThread渲染线程的工作流程。由于目前Android 4.X之后系统默认界面是开启硬件加速的，所以本文我们重点分析硬件加速条件下的界面渲染流程，我们先分析一下简化的代码流程：

```java
void doTraversal() {
    if (mTraversalScheduled) {
        ...

        performTraversals();

        ...
    }
}

private void performTraversals() {
        ...

        if (!isViewVisible) {
            ...
        } else if (cancelAndRedraw) {
            ...
        } else {
            ...

            if (!performDraw() && mSyncBufferCallback != null) {
                mSyncBufferCallback.onBufferReady(null);
            }
        }

        ...
}

private boolean performDraw() {
    ...

    try {
        boolean canUseAsync = draw(fullRedrawNeeded, usingAsyncReport && mSyncBuffer);
        ...
    } finally {
       ...
        Trace.traceEnd(Trace.TRACE_TAG_VIEW);
    }

    ...

    return true;
}

private boolean draw(boolean fullRedrawNeeded, boolean forceDraw) {
    ...

    if (!dirty.isEmpty() || mIsAnimating || accessibilityFocusDirty) {
        if (isHardwareEnabled()) {
            ...

            
            mAttachInfo.mThreadedRenderer.draw(mView, mAttachInfo, this);
        } else {
            ...
        }
    }

    ...
    return useAsyncReport;
}

core/java/android/view/ThreadedRenderer.java
void draw(View view, AttachInfo attachInfo, DrawCallbacks callbacks) {
    attachInfo.mViewRootImpl.mViewFrameInfo.markDrawStart();

    // 1.从DecorView根节点出发，递归遍历View控件树，记录每个View节点的绘制操作命令，完成绘制操作命令树的构建
    updateRootDisplayList(view, callbacks);

    ...
    \
    // 2.JNI调用同步Java层构建的绘制命令树到Native层的RenderThread渲染线程，并唤醒渲染线程利用OpenGL执行渲染任务；
    int syncResult = syncAndDrawFrame(frameInfo);

    ...
}

public int syncAndDrawFrame(@NonNull FrameInfo frameInfo) {
    return nSyncAndDrawFrame(mNativeProxy, frameInfo.frameInfo, frameInfo.frameInfo.length);
}
```

![](/learn-android/aosp/create-app-25.png)

从上面的代码可以看出，硬件加速绘制主要包括两个阶段：

- 从DecorView根节点出发，递归遍历View控件树，记录每个View节点的drawOp绘制操作命令，完成绘制操作命令树的构建；

- JNI调用同步Java层构建的绘制命令树到Native层的RenderThread渲染线程，并唤醒渲染线程利用OpenGL执行渲染任务；

### 构建绘制命令树

我们先来看看第一阶段构建绘制命令树的代码简化流程：

```java
/*frameworks/base/core/java/android/view/ThreadedRenderer.java*/
private void updateRootDisplayList(View view, DrawCallbacks callbacks) {
        // 原生标记构建View绘制操作命令树过程的systrace tag
        Trace.traceBegin(Trace.TRACE_TAG_VIEW, "Record View#draw()");
        // 递归子View的updateDisplayListIfDirty实现构建DisplayListOp
        updateViewTreeDisplayList(view);
        ...
        if (mRootNodeNeedsUpdate || !mRootNode.hasDisplayList()) {
            // 获取根View的SkiaRecordingCanvas
            RecordingCanvas canvas = mRootNode.beginRecording(mSurfaceWidth, mSurfaceHeight);
            try {
                ...
                // 利用canvas缓存DisplayListOp绘制命令
                canvas.drawRenderNode(view.updateDisplayListIfDirty());
                ...
            } finally {
                // 将所有DisplayListOp绘制命令填充到RootRenderNode中
                mRootNode.endRecording();
            }
        }
        Trace.traceEnd(Trace.TRACE_TAG_VIEW);
}

private void updateViewTreeDisplayList(View view) {
        ...
        // 从DecorView根节点出发，开始递归调用每个View树节点的updateDisplayListIfDirty函数
        view.updateDisplayListIfDirty();
        ...
}

/*frameworks/base/core/java/android/view/View.java*/
public RenderNode updateDisplayListIfDirty() {
     ...
     // 1.利用`View`对象构造时创建的`RenderNode`获取一个`SkiaRecordingCanvas`“画布”；
     final RecordingCanvas canvas = renderNode.beginRecording(width, height);
     try {
         ...
         if ((mPrivateFlags & PFLAG_SKIP_DRAW) == PFLAG_SKIP_DRAW) {
              // 如果仅仅是ViewGroup，并且自身不用绘制，直接递归子View
              dispatchDraw(canvas);
              ...
         } else {
              // 2.利用SkiaRecordingCanvas，在每个子View控件的onDraw绘制函数中调用drawLine、drawRect等绘制操作时，创建对应的DisplayListOp绘制命令，并缓存记录到其内部的SkiaDisplayList持有的DisplayListData中；
              draw(canvas);
         }
     } finally {
         // 3.将包含有`DisplayListOp`绘制命令缓存的`SkiaDisplayList`对象设置填充到`RenderNode`中；
         renderNode.endRecording();
         ...
     }
     ...
}

public void draw(Canvas canvas) {
    ...
    // draw the content(View自己实现的onDraw绘制，由应用开发者自己实现)
    onDraw(canvas);
    ...
    // draw the children
    dispatchDraw(canvas);
    ...
}

/*frameworks/base/graphics/java/android/graphics/RenderNode.java*/
public void endRecording() {
        ...
        // 从SkiaRecordingCanvas中获取SkiaDisplayList对象
        long displayList = canvas.finishRecording();
        // 将SkiaDisplayList对象填充到RenderNode中
        nSetDisplayList(mNativeRenderNode, displayList);
        canvas.recycle();
}
```

从以上代码可以看出，构建绘制命令树的过程是从View控件树的根节点DecorView触发，递归调用每个子View节点的updateDisplayListIfDirty函数，最终完成绘制树的创建，简述流程如下：

- 利用View对象构造时创建的RenderNode获取一个SkiaRecordingCanvas“画布”；
- 利用SkiaRecordingCanvas，在每个子View控件的onDraw绘制函数中调用drawLine、drawRect等绘制操作时，创建对应的DisplayListOp绘制命令，并缓存记录到其内部的SkiaDisplayList持有的DisplayListData中；
- 将包含有DisplayListOp绘制命令缓存的SkiaDisplayList对象设置填充到RenderNode中；
- 最后将根View的缓存DisplayListOp设置到RootRenderNode中，完成构建。

![](/learn-android/aosp/create-app-26.png)
![](/learn-android/aosp/create-app-27.webp)

### 执行渲染绘制任务

经过上一小节中的分析，应用在UI线程中从根节点DecorView出发，递归遍历每个子View节点，搜集其drawXXX绘制动作并转换成DisplayListOp命令，将其记录到DisplayListData并填充到RenderNode中，最终完成整个View绘制命令树的构建。从此UI线程的绘制任务就完成了。下一步UI线程将唤醒RenderThread渲染线程，触发其利用OpenGL执行界面的渲染任务，本小节中我们将重点分析这个流程。我们还是先看看这块代码的简化流程：

```java
/*frameworks/base/graphics/java/android/graphics/HardwareRenderer.java*/
public int syncAndDrawFrame(@NonNull FrameInfo frameInfo) {
    // JNI调用native层的相关函数
    return nSyncAndDrawFrame(mNativeProxy, frameInfo.frameInfo, frameInfo.frameInfo.length);
}

/*frameworks/base/libs/hwui/jni/android_graphics_HardwareRenderer.cpp*/
static int android_view_ThreadedRenderer_syncAndDrawFrame(JNIEnv* env, jobject clazz,
        jlong proxyPtr, jlongArray frameInfo, jint frameInfoSize) {
    ...
    RenderProxy* proxy = reinterpret_cast<RenderProxy*>(proxyPtr);
    env->GetLongArrayRegion(frameInfo, 0, frameInfoSize, proxy->frameInfo());
    return proxy->syncAndDrawFrame();
}

/*frameworks/base/libs/hwui/renderthread/RenderProxy.cpp*/
int RenderProxy::syncAndDrawFrame() {
    // 唤醒RenderThread渲染线程，执行DrawFrame绘制任务
    return mDrawFrameTask.drawFrame();
}

/*frameworks/base/libs/hwui/renderthread/DrawFrameTask.cpp*/
int DrawFrameTask::drawFrame() {
    ...
    postAndWait();
    ...
}

void DrawFrameTask::postAndWait() {
    AutoMutex _lock(mLock);
    // 向RenderThread渲染线程的MessageQueue消息队列放入一个待执行任务，以将其唤醒执行run函数
    mRenderThread->queue().post([this]() { run(); });
    // UI线程暂时进入wait等待状态
    mSignal.wait(mLock);
}

void DrawFrameTask::run() {
    // 原生标识一帧渲染绘制任务的systrace tag
    ATRACE_NAME("DrawFrame");
    ...
    {
        TreeInfo info(TreeInfo::MODE_FULL, *mContext);
        //1.将UI线程构建的DisplayListOp绘制命令树同步到RenderThread渲染线程
        canUnblockUiThread = syncFrameState(info);
        ...
    }
    ...
    // 同步完成后则可以唤醒UI线程
    if (canUnblockUiThread) {
        unblockUiThread();
    }
    ...
    if (CC_LIKELY(canDrawThisFrame)) {
        // 2.执行draw渲染绘制动作
        context->draw();
    } else {
        ...
    }
    ...
}

bool DrawFrameTask::syncFrameState(TreeInfo& info) {
    ATRACE_CALL();
    ...
    // 调用CanvasContext的prepareTree函数实现绘制命令树同步的流程
    mContext->prepareTree(info, mFrameInfo, mSyncQueued, mTargetNode);
    ...
}

/*frameworks/base/libs/hwui/renderthread/CanvasContext.cpp*/
void CanvasContext::prepareTree(TreeInfo& info, int64_t* uiFrameInfo, int64_t syncQueued,
                                RenderNode* target) {
     ...
     for (const sp<RenderNode>& node : mRenderNodes) {
        ...
        // 递归调用各个子View对应的RenderNode执行prepareTree动作
        node->prepareTree(info);
        ...
    }
    ...
}

/*frameworks/base/libs/hwui/RenderNode.cpp*/
void RenderNode::prepareTree(TreeInfo& info) {
    ATRACE_CALL();
    ...
    prepareTreeImpl(observer, info, false);
    ...
}

void RenderNode::prepareTreeImpl(TreeObserver& observer, TreeInfo& info, bool functorsNeedLayer) {
    ...
    if (info.mode == TreeInfo::MODE_FULL) {
        // 同步绘制命令树
        pushStagingDisplayListChanges(observer, info);
    }
    if (mDisplayList) {
        // 遍历调用各个子View对应的RenderNode的prepareTreeImpl
        bool isDirty = mDisplayList->prepareListAndChildren(
                observer, info, childFunctorsNeedLayer,
                [](RenderNode* child, TreeObserver& observer, TreeInfo& info,
                   bool functorsNeedLayer) {
                    child->prepareTreeImpl(observer, info, functorsNeedLayer);
                });
        ...
    }
    ...
}

void RenderNode::pushStagingDisplayListChanges(TreeObserver& observer, TreeInfo& info) {
    ...
    syncDisplayList(observer, &info);
    ...
}

void RenderNode::syncDisplayList(TreeObserver& observer, TreeInfo* info) {
    ...
    // 完成赋值同步DisplayList对象
    mDisplayList = mStagingDisplayList;
    mStagingDisplayList = nullptr;
    ...
}

void CanvasContext::draw() {
    ...
    // 1.调用OpenGL库使用GPU，按照构建好的绘制命令完成界面的渲染
    bool drew = mRenderPipeline->draw(frame, windowDirty, dirty, mLightGeometry, &mLayerUpdateQueue,
                                      mContentDrawBounds, mOpaque, mLightInfo, mRenderNodes,
                                      &(profiler()));
    ...
    // 2.将前面已经绘制渲染好的图形缓冲区Binder上帧给SurfaceFlinger合成和显示
    bool didSwap =
            mRenderPipeline->swapBuffers(frame, drew, windowDirty, mCurrentFrameInfo, &requireSwap);
    ...
}
```

从以上代码可以看出：UI线程利用RenderProxy向RenderThread线程发送一个DrawFrameTask任务请求，RenderThread被唤醒，开始渲染，大致流程如下：

- syncFrameState中遍历View树上每一个RenderNode，执行prepareTreeImpl函数，实现同步绘制命令树的操作；

- 调用OpenGL库API使用GPU，按照构建好的绘制命令完成界面的渲染（具体过程，由于本文篇幅所限，暂不展开分析）；

- 将前面已经绘制渲染好的图形缓冲区Binder上帧给SurfaceFlinger合成和显示；

![](/learn-android/aosp/create-app-28.webp)

从 Perfetto 这个过程如下图所示：

![](/learn-android/aosp/create-app-29.png)

## SurfaceFlinger 合成显示

SurfaceFlinger合成显示部分完全属于Android系统GUI中图形显示的内容，逻辑结构也比较复杂，但不属于本文介绍内容的重点。所以本小节中只是总体上介绍一下其工作原理与思想，不再详细分析源码，感兴趣的读者可以关注笔者后续的文章再来详细分析讲解。简单的说SurfaceFlinger作为系统中独立运行的一个Native进程，借用Android官网的描述，其职责就是负责接受来自多个来源的数据缓冲区，对它们进行合成，然后发送到显示设备。如下图所示：

![](/learn-android/aosp/create-app-30.webp)

从上图可以看出，其实SurfaceFlinger在Android系统的整个图形显示系统中是起到一个承上启下的作用：

- 对上：通过Surface与不同的应用进程建立联系，接收它们写入Surface中的绘制缓冲数据，对它们进行统一合成。

- 对下：通过屏幕的后缓存区与屏幕建立联系，发送合成好的数据到屏幕显示设备。

图形的传递是通过Buffer作为载体，Surface是对Buffer的进一步封装，也就是说Surface内部具有多个Buffer供上层使用，如何管理这些Buffer呢？答案就是BufferQueue ，下面我们来看看BufferQueue的工作原理：

### BufferQueue机制

借用一张经典的图来描述BufferQueue的工作原理：

![](/learn-android/aosp/create-app-31.webp)

BufferQueue是一个典型的生产者-消费者模型中的数据结构。在Android应用的渲染流程中，应用扮演的就是“生产者”的角色，而SurfaceFlinger扮演的则是“消费者”的角色，其配合工作的流程如下：

- 应用进程中在开始界面的绘制渲染之前，需要通过Binder调用dequeueBuffer接口从SurfaceFlinger进程中管理的BufferQueue 中申请一张处于free状态的可用Buffer，如果此时没有可用Buffer则阻塞等待；

- 应用进程中拿到这张可用的Buffer之后，选择使用CPU软件绘制渲染或GPU硬件加速绘制渲染，渲染完成后再通过Binder调用queueBuffer接口将缓存数据返回给应用进程对应的BufferQueue（如果是 GPU 渲染的话，这里还有个 GPU处理的过程，所以这个 Buffer 不会马上可用，需要等 GPU 渲染完成的Fence信号），并申请sf类型的Vsync以便唤醒“消费者”SurfaceFlinger进行消费；

- SurfaceFlinger 在收到 Vsync 信号之后，开始准备合成，使用 acquireBuffer获取应用对应的 BufferQueue 中的 Buffer 并进行合成操作；

- 合成结束后，SurfaceFlinger 将通过调用 releaseBuffer将 Buffer 置为可用的free状态，返回到应用对应的 BufferQueue中。

### Vsync同步机制

Vysnc垂直同步是Android在“黄油计划”中引入的一个重要机制，本质上是为了协调BufferQueue的应用生产者生成UI数据动作和SurfaceFlinger消费者的合成消费动作，避免出现画面撕裂的Tearing现象。Vysnc信号分为两种类型：

- app类型的Vsync：app类型的Vysnc信号由上层应用中的Choreographer根据绘制需求进行注册和接收，用于控制应用UI绘制上帧的生产节奏。根据第7小结中的分析：应用在UI线程中调用invalidate刷新界面绘制时，需要先透过Choreographer向系统申请注册app类型的Vsync信号，待Vsync信号到来后，才能往主线程的消息队列放入待绘制任务进行真正UI的绘制动作；

- sf类型的Vsync:sf类型的Vsync是用于控制SurfaceFlinger的合成消费节奏。应用完成界面的绘制渲染后，通过Binder调用queueBuffer接口将缓存数据返还给应用对应的BufferQueue时，会申请sf类型的Vsync，待SurfaceFlinger 在其UI线程中收到 Vsync 信号之后，便开始进行界面的合成操作。

Vsync信号的生成是参考屏幕硬件的刷新周期的，其架构如下图所示：

![](/learn-android/aosp/create-app-32.webp)

本小节所描述的流程，从 Perfetto 上看SurfaceFlinger处理应用上帧工作的流程如下图所示：

## 其他

### Android中的epoll机制

在 Android 中，epoll 是一种事件通知机制，用于处理 I/O 事件的多路复用。它是基于 Linux 的 epoll 概念进行实现的，提供了高效的事件管理和触发机制，常用于网络编程和异步 I/O 操作。

epoll 的工作原理如下：

1. 创建 epoll 实例：首先需要创建一个 epoll 实例，通过调用 `epoll_create` 函数完成。

2. 注册文件描述符：将需要监视的文件描述符注册到 epoll 实例中，可以使用 `epoll_ctl` 函数完成注册操作。注册时需要指定感兴趣的事件类型，如可读事件、可写事件等。

3. 等待事件触发：调用 `epoll_wait` 函数等待事件的发生。当注册的文件描述符中有事件发生时，epoll_wait 函数会返回触发事件的文件描述符列表。

4. 处理事件：根据返回的文件描述符列表，进行相应的事件处理操作。可以通过检查事件的类型来确定具体的操作，如读取数据、发送数据等。

使用 epoll 机制可以有效地监视多个文件描述符的事件，而不需要通过轮询方式不断检查每个文件描述符的状态。这样可以提高系统的性能和效率，尤其在处理大量并发连接的网络应用中表现出色。

在 Android 中，epoll 机制被广泛应用于网络编程、异步 I/O 操作以及事件驱动的框架和库中，如 Android 的网络库、Socket 通信、JNI 开发等场景。

### Perfetto中的 sys_read

`sys_read` 是 Linux 内核中的系统调用之一，用于从文件描述符中读取数据。在 Perfetto 中，它表示读取文件系统的操作，可以用来监测读取文件的行为，包括读取的大小、读取的时间和读取的文件描述符等信息。通过分析这些数据，可以得出一些关于应用程序性能的结论，例如文件读取的频率、文件大小和读取时间等。这些信息对于优化应用程序的磁盘访问行为非常有用。在 Perfetto 中，sys_read 这个事件会被记录在 ftrace 的 event 文件中。

### Perfetto中的 sys_write

在 Perfetto 的追踪记录中，`sys_write` 表示正在进行的写操作。这通常涉及将数据写入文件、管道或其他输出设备。它是 Linux 内核提供的系统调用之一，允许程序向文件描述符写入数据。

在 Perfetto 中，`sys_write` 通常与应用程序和内核的 I/O 操作相关。通过跟踪 `sys_write` 系统调用，可以了解应用程序和内核之间的 I/O 操作，以及它们对系统性能的影响。Perfetto 的追踪记录可以用于分析应用程序性能瓶颈，诊断内核和驱动程序问题，以及确定系统瓶颈的根本原因。

### Perfetto中的 sys_ioctl

在 Linux 中，`ioctl` 是一个系统调用（system call），它可以用来对文件描述符执行各种控制操作。`ioctl` 的参数通常是一个整数（表示要执行的操作），以及一个结构体（用于输入或输出控制信息）。常见的用法包括控制硬件设备（如串口、网卡、声卡等）以及控制虚拟文件系统（如 `/proc`、`/sys` 等）。

在 Perfetto 中，`sys_ioctl` 是一个事件（event），表示执行了一个 `ioctl` 系统调用。通常会记录下 `ioctl` 的参数（如文件描述符、操作码、输入/输出参数等）以及相应的返回值。通过这些信息，可以分析出应用程序或系统内核的行为。例如，可能会分析某个应用程序使用 `ioctl` 控制了硬件设备的哪些参数，或者分析内核对文件系统的控制操作。

### Perfetto中的 sys_epoll_pwait

`sys_epoll_pwait` 是 Linux 内核中的系统调用，主要用于实现异步 I/O 和事件通知。`epoll` 是 Linux 中高效的 I/O 多路复用机制之一，`sys_epoll_pwait` 则是在 `epoll` 机制的基础上提供的等待事件发生的系统调用，可以等待一个或多个文件描述符上的指定事件集合发生，直到事件就绪或者超时为止。当指定的事件发生时，`sys_epoll_pwait` 返回事件相关的文件描述符和事件类型，以便应用程序进行处理。

在 Perfetto 中，`sys_epoll_pwait` 可能会被用于实现异步事件跟踪，通过在 Perfetto 中设置特定的跟踪事件，可以使用 `sys_epoll_pwait` 来等待事件发生并进行处理。例如，可以设置 Perfetto 跟踪网络通信事件，通过 `sys_epoll_pwait` 等待网络事件发生并记录跟踪信息。

### Perfetto中的 sys_recvmsg

`sys_recvmsg` 是一个 Linux 内核系统调用，用于接收一段网络数据。在 Perfetto 中，`sys_recvmsg` 的事件指示在系统中调用此函数的相关信息，包括函数参数和返回值等等。

Perfetto 是一个系统级的跟踪工具，能够收集各种系统事件和指标，并将其导出为跨平台的可视化数据。它可以用于调试和分析各种系统问题，包括性能瓶颈、功耗问题、安全漏洞等等。

### system/core/rootdir/init.rc && system/core/rootdir/init.zygote64.rc

这段代码是 Android 系统 init 进程中的一个服务定义，用于启动 zygote 进程。zygote 进程是 Android 系统中的一个关键进程，用于启动和管理应用程序。以下是代码中各行的分析：

1. `service zygote /system/bin/app_process64 -Xzygote /system/bin --zygote --start-system-server`: 定义一个名为 "zygote" 的服务，使用 `/system/bin/app_process64` 作为可执行文件，其后的参数用于指定启动 zygote 进程及系统服务。
2. `class main`: 将 zygote 服务归类为主要服务。
3. `priority -20`: 为 zygote 服务设置优先级 -20。这表示它具有较高的优先级。
4. `user root`: 以 root 用户身份运行 zygote 服务。
5. `group root readproc reserved_disk`: 为 zygote 服务设置组权限，包括 root、readproc 和 reserved_disk。
6. `socket zygote stream 660 root system`: 创建名为 zygote 的 UNIX 域套接字，用于与其他进程通信。
7. `socket usap_pool_primary stream 660 root system`: 创建名为 usap_pool_primary 的 UNIX 域套接字，用于与其他进程通信。
8. `onrestart ...`: 定义在 zygote 服务重启时要执行的一系列操作，例如重启其他系统服务、恢复系统电源状态等。
9. `task_profiles ProcessCapacityHigh`: 将 zygote 服务的任务配置文件设置为 ProcessCapacityHigh，表示这是一个高容量进程。
10. `critical window=${zygote.critical_window.minute:-off} target=zygote-fatal`: 设置 zygote 服务的关键窗口，若在这个时间内出现关键错误，将触发名为 zygote-fatal 的操作。

总结：这段代码负责启动和配置 Android 系统中的 zygote 服务，它是一个关键服务，用于启动和管理应用程序。代码定义了 zygote 服务的运行参数、通信套接字、重启操作以及优先级等配置。

## 引用

- <https://www.jianshu.com/p/37370c1d17fc>
- <https://blog.csdn.net/u013028621/article/details/116271537>
