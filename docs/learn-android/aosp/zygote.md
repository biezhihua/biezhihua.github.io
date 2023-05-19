---
tag:
  - android
  - aosp
---

# Android | AOSP | Android 11 进程启动分析（一）: Zygote进程 | 转载&加工

## 前言1

对优秀文章[《Android 11 进程启动分析（一）: Zygote进程》](https://blog.csdn.net/u013028621/article/details/116271537?spm=1001.2014.3001.5502)的转载

## init进程

Android 10之后的版本，init进程入口源码在system/core/init/main.cpp，而不在init.cpp。其main函数如下：

```c++
int main(int argc, char** argv) {
#if __has_feature(address_sanitizer)
    __asan_set_error_report_callback(AsanReportCallback);
#endif

    if (!strcmp(basename(argv[0]), "ueventd")) {
        return ueventd_main(argc, argv);
    }

    if (argc > 1) {
        if (!strcmp(argv[1], "subcontext")) {
            android::base::InitLogging(argv, &android::base::KernelLogger);
            const BuiltinFunctionMap& function_map = GetBuiltinFunctionMap();

            return SubcontextMain(argc, argv, &function_map);
        }

        if (!strcmp(argv[1], "selinux_setup")) {
            return SetupSelinux(argv);
        }

        if (!strcmp(argv[1], "second_stage")) {
            return SecondStageMain(argc, argv);
        }
    }

    return FirstStageMain(argc, argv);
}
```

这里不深入init进程只关注zygote进程的创建，启动脚本init.rc中有这么一句：

```c++
import /system/etc/init/hw/init.${ro.zygote}.rc
```

对应脚本文件为init.zygote32.rc或init.zygote64.rc，内容如下：

```c++
service zygote /system/bin/app_process -Xzygote /system/bin --zygote --start-system-server
    class main
    priority -20
    user root
    group root readproc reserved_disk
    socket zygote stream 660 root system
    socket usap_pool_primary stream 660 root system
    onrestart exec_background - system system -- /system/bin/vdc volume abort_fuse
    onrestart write /sys/power/state on
    onrestart restart audioserver
    onrestart restart cameraserver
    onrestart restart media
    onrestart restart netd
    onrestart restart wificond
    writepid /dev/cpuset/foreground/tasks
```

## zygote进程

zygote进程启动后，会执行到frameworks/base/cmds/app_process/app_main.cpp的main函数

```c++
int main(int argc, char* const argv[])
{
    ...

    AppRuntime runtime(argv[0], computeArgBlockSize(argc, argv));
    
    ... //省略若干行

    // Parse runtime arguments.  Stop at first unrecognized option.
    bool zygote = false;
    bool startSystemServer = false;
    bool application = false;
    String8 niceName;
    String8 className;

    ++i;  // Skip unused "parent dir" argument.
    while (i < argc) {
        const char* arg = argv[i++];
        if (strcmp(arg, "--zygote") == 0) {
            zygote = true;
            niceName = ZYGOTE_NICE_NAME;
        } else if (strcmp(arg, "--start-system-server") == 0) {
            startSystemServer = true;
        } else if (strcmp(arg, "--application") == 0) {
            application = true;
        } else if (strncmp(arg, "--nice-name=", 12) == 0) {
            niceName.setTo(arg + 12);
        } else if (strncmp(arg, "--", 2) != 0) {
            className.setTo(arg);
            break;
        } else {
            --i;
            break;
        }
    }

    ... //省略若干行

    if (zygote) {
        runtime.start("com.android.internal.os.ZygoteInit", args, zygote);
    } else if (className) {
        runtime.start("com.android.internal.os.RuntimeInit", args, zygote);
    } else {
        fprintf(stderr, "Error: no class name or --zygote supplied.\n");
        app_usage();
        LOG_ALWAYS_FATAL("app_process: no class name or --zygote supplied.");
    }
}
```

主要是解析各种启动参数，然后启动AppRuntime，显然这里zygote是true，执行的是

```c++
runtime.start("com.android.internal.os.ZygoteInit", args, zygote);
```

AppRuntime是AndroiRuntime的派生类，start函数定义在AndroiRuntime类下

```c++
void AndroidRuntime::start(const char* className, const Vector<String8>& options, bool zygote)
{
    ... //省略若干行

    /* 启动虚拟机 */
    JniInvocation jni_invocation;
    jni_invocation.Init(NULL);
    JNIEnv* env;
    if (startVm(&mJavaVM, &env, zygote, primary_zygote) != 0) {
        return;
    }
    onVmCreated(env);

    /*
     * Register android functions.
     * 注册Android JNI
     */
    if (startReg(env) < 0) {
        ALOGE("Unable to register all android natives\n");
        return;
    }

    ... //省略若干行

    //找到并执行Java类的main方法
    if (startClass == NULL) {
        ALOGE("JavaVM unable to locate class '%s'\n", slashClassName);
        /* keep going */
    } else {
        jmethodID startMeth = env->GetStaticMethodID(startClass, "main",
            "([Ljava/lang/String;)V");
        if (startMeth == NULL) {
            ALOGE("JavaVM unable to find main() in '%s'\n", className);
            /* keep going */
        } else {
            env->CallStaticVoidMethod(startClass, startMeth, strArray);
            ... //省略若干行
        }

    ... //省略若干行
}
```

这就进入了Java的世界了。由上可知，Java世界的入口是com.android.internal.os.ZygoteInit的main方法

```java
public static void main(String argv[]) {
        ZygoteServer zygoteServer = null;

    ... // 省略若干行

    Runnable caller;
    try {
        
        ... // 省略若干行

        // 解析参数
        boolean startSystemServer = false;
        String zygoteSocketName = "zygote";
        String abiList = null;
        boolean enableLazyPreload = false;
        for (int i = 1; i < argv.length; i++) {
            if ("start-system-server".equals(argv[i])) {
                startSystemServer = true;
            } else if ("--enable-lazy-preload".equals(argv[i])) {
                enableLazyPreload = true;
            } else if (argv[i].startsWith(ABI_LIST_ARG)) {
                abiList = argv[i].substring(ABI_LIST_ARG.length());
            } else if (argv[i].startsWith(SOCKET_NAME_ARG)) {
                zygoteSocketName = argv[i].substring(SOCKET_NAME_ARG.length());
            } else {
                throw new RuntimeException("Unknown command line argument: " + argv[i]);
            }
        }

        ... // 省略若干行

        if (startSystemServer) {
            Runnable r = forkSystemServer(abiList, zygoteSocketName, zygoteServer);

            // {@code r == null} in the parent (zygote) process, and {@code r != null} in the
            // child (system_server) process.
            if (r != null) {
                r.run();
                return;
            }
        }

        Log.i(TAG, "Accepting command socket connections");

        // The select loop returns early in the child process after a fork and
        // loops forever in the zygote.
        caller = zygoteServer.runSelectLoop(abiList);
    } catch (Throwable ex) {
        Log.e(TAG, "System zygote died with exception", ex);
        throw ex;
    } finally {
        if (zygoteServer != null) {
            zygoteServer.closeServerSocket();
        }
    }

    // We're in the child process and have exited the select loop. Proceed to execute the
    // command.
    if (caller != null) {
        caller.run();
    }
}
```

在这里我们主要关心两件事情：

- SystemServer的启动
- 其他子进程的启动

## 关于fork进程

这里插播一下关于fork进程相关知识。fork函数定义在“unistd.h”里，作用是克隆一个一摸一样的进程。看如下示例：

```c++
#include <iostream>
#include <unistd.h>

using namespace std;

int main() {
    cout << "fork进程测试" << endl;

    int var = 10;

    // fork进程
    int pid = fork();
    if(pid == -1) {
        cout << "fork进程失败" << endl;
        return -1;
    }

    cout << "我的子进程id：" << pid << endl;

    if (pid) {
        cout << "我的进程id是：" << getpid() << ",变量var是: " << var << endl;
        return 0;
    } else {
        cout << "我的进程id是：" << getpid() << ",变量var是: " << var << endl;
        return 0;
    }
} 
```

```text
输出结果：

fork进程测试
我的子进程id：13875
我的进程id是：13874,变量var是: 10
我的子进程id：0
我的进程id是：13875,变量var是: 10
```

在fork返回的时候已经是两个进程了，父进程中得到的pid是子进程的id，而子进程得到的pid则是0。父进程和子进程就此分道扬镳，沿着不同的分支继续运行。在父进程中pid非0，所以执行的是if分支，而子进程相反，执行的是else分支。

## SystemServer的启动

SystemServer的启动为：

```c++
if (startSystemServer) {
    Runnable r = forkSystemServer(abiList, zygoteSocketName, zygoteServer);

    // {@code r == null} in the parent (zygote) process, and {@code r != null} in the
    // child (system_server) process.
    if (r != null) {
        r.run();
        return;
    }
}
```

这里fork了一个子进程，父进程中返回的Runnable为null，会继续往下运行；而子进程也就是SystemServer的进程则会调用返回的Ruunable的run方法，进入SystemServer的逻辑。
这里我们跟进forkSystemServer方法：

```c++
/**
 * Prepare the arguments and forks for the system server process.
 *
 * @return A {@code Runnable} that provides an entrypoint into system_server code in the child
 * process; {@code null} in the parent.
 */
private static Runnable forkSystemServer(String abiList, String socketName,
        ZygoteServer zygoteServer) {

    ... // 省略若干行

    String args[] = {
            "--setuid=1000",
            "--setgid=1000",
            "--setgroups=1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1018,1021,1023,"
                    + "1024,1032,1065,3001,3002,3003,3006,3007,3009,3010,3011",
            "--capabilities=" + capabilities + "," + capabilities,
            "--nice-name=system_server",
            "--runtime-args",
            "--target-sdk-version=" + VMRuntime.SDK_VERSION_CUR_DEVELOPMENT,
            "com.android.server.SystemServer",
    };
    ZygoteArguments parsedArgs = null;

    int pid;

    try {
        parsedArgs = new ZygoteArguments(args);

        ... // 省略若干行

        /* Request to fork the system server process */
        pid = Zygote.forkSystemServer(
                parsedArgs.mUid, parsedArgs.mGid,
                parsedArgs.mGids,
                parsedArgs.mRuntimeFlags,
                null,
                parsedArgs.mPermittedCapabilities,
                parsedArgs.mEffectiveCapabilities);
    } catch (IllegalArgumentException ex) {
        throw new RuntimeException(ex);
    }

    /* For child process */
    if (pid == 0) { // 子进程
        if (hasSecondZygote(abiList)) {
            waitForSecondaryZygote(socketName);
        }

        zygoteServer.closeServerSocket();
        return handleSystemServerProcess(parsedArgs);
    }

    return null;
}
```

可以看到，父进程中确实返回了null，而子进程返回值由handleSystemServerProcess确定，我们继续跟进：

```c++
/**
 * Finish remaining work for the newly forked system server process.
 */
private static Runnable handleSystemServerProcess(ZygoteArguments parsedArgs) {

    ... // 省略若干行

    // 上面forkSystemServer方法中定义的启动参数显然没有“--invoke-with”，所以这里执行的是else分支
    if (parsedArgs.mInvokeWith != null) {

        ... // 省略若干行

    } else {
        ClassLoader cl = null;
        if (systemServerClasspath != null) {
            cl = createPathClassLoader(systemServerClasspath, parsedArgs.mTargetSdkVersion);

            Thread.currentThread().setContextClassLoader(cl);
        }

        /*
            * Pass the remaining arguments to SystemServer.
            */
        return ZygoteInit.zygoteInit(parsedArgs.mTargetSdkVersion,
                parsedArgs.mDisabledCompatChanges,
                parsedArgs.mRemainingArgs, cl);
    }

    /* should never reach here */
}
```

继续跟进ZygoteInit.zygoteInit方法

```c++
public static final Runnable zygoteInit(int targetSdkVersion, long[] disabledCompatChanges,
        String[] argv, ClassLoader classLoader) {
    if (RuntimeInit.DEBUG) {
        Slog.d(RuntimeInit.TAG, "RuntimeInit: Starting application from zygote");
    }

    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, "ZygoteInit");
    RuntimeInit.redirectLogStreams();

    RuntimeInit.commonInit();
    ZygoteInit.nativeZygoteInit();
    return RuntimeInit.applicationInit(targetSdkVersion, disabledCompatChanges, argv,
            classLoader);
}

```

这里进行了一些初始化，然后又转到了RuntimeInit.applicationInit方法，继续跟进

```
protected static Runnable applicationInit(int targetSdkVersion, long[] disabledCompatChanges,
            String[] argv, ClassLoader classLoader) {
    // If the application calls System.exit(), terminate the process
    // immediately without running any shutdown hooks.  It is not possible to
    // shutdown an Android application gracefully.  Among other things, the
    // Android runtime shutdown hooks close the Binder driver, which can cause
    // leftover running threads to crash before the process actually exits.
    nativeSetExitWithoutCleanup(true);

    VMRuntime.getRuntime().setTargetSdkVersion(targetSdkVersion);
    VMRuntime.getRuntime().setDisabledCompatChanges(disabledCompatChanges);

    final Arguments args = new Arguments(argv);

    // The end of of the RuntimeInit event (see #zygoteInit).
    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);

    // Remaining arguments are passed to the start class's static main
    return findStaticMain(args.startClass, args.startArgs, classLoader);
}

```

这里进行了一通的设置之后，转到findStaticMain方法，继续跟进

```c++
protected static Runnable findStaticMain(String className, String[] argv,
            ClassLoader classLoader) {
    Class<?> cl;

    cl = Class.forName(className, true, classLoader);
    

    Method m;
    m = cl.getMethod("main", new Class[] { String[].class });


    int modifiers = m.getModifiers();
    if (! (Modifier.isStatic(modifiers) && Modifier.isPublic(modifiers))) {
        throw new RuntimeException(
                "Main method is not public and static on " + className);
    }

    return new MethodAndArgsCaller(m, argv);
}

```

这里通过反射找到目标类的静态main方法，然后包装成了MethodAndArgsCaller对象返回。MethodAndArgsCaller实现了Runnable接口，run方法非常简单，就是反射执行了目标类的静态main方法。而这里说的目标类显然是forkSystemServer定义的args参数最后一行的“com.android.server.SystemServer”

```java
static class MethodAndArgsCaller implements Runnable {
    /** method to call */
    private final Method mMethod;

    /** argument array */
    private final String[] mArgs;

    public MethodAndArgsCaller(Method method, String[] args) {
        mMethod = method;
        mArgs = args;
    }

    public void run() {
        try {
            mMethod.invoke(null, new Object[] { mArgs });
        } catch (...) {
            ...
        }
    }
}
```

再回过头看ZygoteInit的main方法

```java
if (startSystemServer) {
    Runnable r = forkSystemServer(abiList, zygoteSocketName, zygoteServer);
    if (r != null) {
        r.run();
        return;
    }
}
```

至此SystemServer就正式启动了。

## 其他进程的启动

再看ZygoteInit的main方法

```java
public static void main(String argv[]) {
        ZygoteServer zygoteServer = null;

    ... // 省略若干行

    Runnable caller;
    try {
        
        ... // 省略若干行
        zygoteServer = new ZygoteServer(isPrimaryZygote);
        caller = zygoteServer.runSelectLoop(abiList);
    } catch (...) {
        ...
    }

    // We're in the child process and have exited the select loop. Proceed to execute the
    // command.
    if (caller != null) {
        caller.run();
    }
}
```

SystemServer进程启动后，父进程继续往下运行到ZygoteServer的runSelectLoop方法。一般我们看到loop就知道这是一个循环，当需要创建新的进程的消息到来的时候，子进程会退出循环往下执行，而父进程则继续循环。
其中ZygoteServer的构造方法里启动了socket监听

```java
ZygoteServer(boolean isPrimaryZygote) {
    mUsapPoolEventFD = Zygote.getUsapPoolEventFD();

    if (isPrimaryZygote) {
        mZygoteSocket = Zygote.createManagedSocketFromInitSocket(Zygote.PRIMARY_SOCKET_NAME);
        mUsapPoolSocket =
                Zygote.createManagedSocketFromInitSocket(
                        Zygote.USAP_POOL_PRIMARY_SOCKET_NAME);
    } else {
        mZygoteSocket = Zygote.createManagedSocketFromInitSocket(Zygote.SECONDARY_SOCKET_NAME);
        mUsapPoolSocket =
                Zygote.createManagedSocketFromInitSocket(
                        Zygote.USAP_POOL_SECONDARY_SOCKET_NAME);
    }

    mUsapPoolSupported = true;
    fetchUsapPoolPolicyProps();
}
```

这里分享一个小技巧，根据上面的分析，我们知道返回一个非null的Runnable对象则会进入一个新的进程，所以我们在分析runSelectLoop方法的时候只关注返回的地方，其他的我们暂时不过多关注。
跟进runSelectLoop方法

```java
Runnable runSelectLoop(String abiList) {
    
    ... // 省略若干行

    ZygoteConnection newPeer = acceptCommandPeer(abiList);
                        peers.add(newPeer);

    ... // 省略若干行

    ZygoteConnection connection = peers.get(pollIndex);
    final Runnable command = connection.processOneCommand(this);

    if (mIsForkChild) {

        ... // 省略若干行

        return command;
    }

    ... // 省略若干行

    if (mUsapPoolRefillAction != UsapPoolRefillAction.NONE) {

        ... // 省略若干行

        final Runnable command =
                fillUsapPool(sessionSocketRawFDs, isPriorityRefill);

        if (command != null) {
            return command;
        } 

        ... // 省略若干行
    }

    ... // 省略若干行

}
```

可以看到有两个地方会返回Runnable，分别是ZygoteConnection#processOneCommand方法和ZygoteServer#fillUsapPool方法。

### processOneCommand

```java
Runnable processOneCommand(ZygoteServer zygoteServer) {
    String[] args;

    ... // 省略若干行

    args = Zygote.readArgumentList(mSocketReader);
    
    ... // 省略若干行

    pid = Zygote.forkAndSpecialize(parsedArgs.mUid, parsedArgs.mGid, parsedArgs.mGids,
            parsedArgs.mRuntimeFlags, rlimits, parsedArgs.mMountExternal, parsedArgs.mSeInfo,
            parsedArgs.mNiceName, fdsToClose, fdsToIgnore, parsedArgs.mStartChildZygote,
            parsedArgs.mInstructionSet, parsedArgs.mAppDataDir, parsedArgs.mIsTopApp,
            parsedArgs.mPkgDataInfoList, parsedArgs.mWhitelistedDataInfoList,
            parsedArgs.mBindMountAppDataDirs, parsedArgs.mBindMountAppStorageDirs);

    ... // 省略若干行

    if (pid == 0) {
        // in child
        zygoteServer.setForkChild();

        zygoteServer.closeServerSocket();
        IoUtils.closeQuietly(serverPipeFd);
        serverPipeFd = null;

        return handleChildProc(parsedArgs, childPipeFd, parsedArgs.mStartChildZygote);
    } else {
        // In the parent. A pid < 0 indicates a failure and will be handled in
        // handleParentProc.
        IoUtils.closeQuietly(childPipeFd);
        childPipeFd = null;
        handleParentProc(pid, serverPipeFd);
        return null;
    }

    ... // 省略若干行
    
}

```

可以看到，在通过socker接收一系列参数之后，fork了一个子进程，然后转到了handleChildProc，继续跟进

```java
private Runnable handleChildProc(ZygoteArguments parsedArgs,
            FileDescriptor pipeFd, boolean isZygote) {
    
    ... // 省略若干行

    if (parsedArgs.mInvokeWith != null) {
        WrapperInit.execApplication(parsedArgs.mInvokeWith,
                parsedArgs.mNiceName, parsedArgs.mTargetSdkVersion,
                VMRuntime.getCurrentInstructionSet(),
                pipeFd, parsedArgs.mRemainingArgs);

        // Should not get here.
        throw new IllegalStateException("WrapperInit.execApplication unexpectedly returned");
    } else {
        if (!isZygote) {
            return ZygoteInit.zygoteInit(parsedArgs.mTargetSdkVersion,
                    parsedArgs.mDisabledCompatChanges,
                    parsedArgs.mRemainingArgs, null /* classLoader */);
        } else {
            return ZygoteInit.childZygoteInit(parsedArgs.mTargetSdkVersion,
                    parsedArgs.mRemainingArgs, null /* classLoader */);
        }
    }
}
```

这里有3个分支，WrapperInit#execApplication，ZygoteInit#zygoteInit和ZygoteInit#childZygoteInit

#### WrapperInit#execApplication

```java
/**
 * Executes a runtime application with a wrapper command.
 * This method never returns.
 */
public static void execApplication(String invokeWith, String niceName,
        int targetSdkVersion, String instructionSet, FileDescriptor pipeFd,
        String[] args) {
    StringBuilder command = new StringBuilder(invokeWith);

    ... // 省略若干行

    Zygote.execShell(command.toString());
}
```

这里看起来是执行shell命令，根据注释描述，这个方法永远不会返回

#### ZygoteInit#zygoteInit

```java
public static final Runnable zygoteInit(int targetSdkVersion, long[] disabledCompatChanges,
            String[] argv, ClassLoader classLoader) {
    
    ... // 省略若干行

    RuntimeInit.commonInit();
    ZygoteInit.nativeZygoteInit();
    return RuntimeInit.applicationInit(targetSdkVersion, disabledCompatChanges, argv,
            classLoader);
}
```

到了RuntimeInit#applicationInit，就和SystemServer进程分析后半段一样了。

#### ZygoteInit#childZygoteInit

```java
static final Runnable childZygoteInit(
            int targetSdkVersion, String[] argv, ClassLoader classLoader) {
        RuntimeInit.Arguments args = new RuntimeInit.Arguments(argv);
        return RuntimeInit.findStaticMain(args.startClass, args.startArgs, classLoader);
    }
```

一目了然。

### fillUsapPool

```java
/**
 * Refill the USAP Pool to the appropriate level, determined by whether this is a priority
 * refill event or not.
 */

Runnable fillUsapPool(int[] sessionSocketRawFDs, boolean isPriorityRefill) {
    
    ... // 省略若干行

    while (--numUsapsToSpawn >= 0) {
        Runnable caller =
                Zygote.forkUsap(mUsapPoolSocket, sessionSocketRawFDs, isPriorityRefill);

        if (caller != null) {
            return caller;
        }
    }

    ... // 省略若干行

    return null;
}
```

一般我们看到pool，就会想到这是缓存、复用或者预加载优化相关，比如ThreadPool、RecycledViewPool等等。这里进行了一个循环，一直fork直至这个Usap进程池填满。
跟进forkUsap

```java
/**
 * Fork a new unspecialized app process from the zygote
 *
 * @param usapPoolSocket  The server socket the USAP will call accept on
 * @param sessionSocketRawFDs  Anonymous session sockets that are currently open
 * @param isPriorityFork  Value controlling the process priority level until accept is called
 * @return In the Zygote process this function will always return null; in unspecialized app
 *         processes this function will return a Runnable object representing the new
 *         application that is passed up from usapMain.
 */
static Runnable forkUsap(LocalServerSocket usapPoolSocket,
                            int[] sessionSocketRawFDs,
                            boolean isPriorityFork) {
    ... // 省略若干行

    int pid =
            nativeForkUsap(pipeFDs[0].getInt$(), pipeFDs[1].getInt$(),
                            sessionSocketRawFDs, isPriorityFork);

    if (pid == 0) {
        IoUtils.closeQuietly(pipeFDs[0]);
        return usapMain(usapPoolSocket, pipeFDs[1]);
    } 
    
    ... // 省略若干行
}
```

跟进usapMain

```java
 /**
 * This function is used by unspecialized app processes to wait for specialization requests from
 * the system server.
 *
 * @param writePipe  The write end of the reporting pipe used to communicate with the poll loop
 *                   of the ZygoteServer.
 * @return A runnable oject representing the new application.
 */
private static Runnable usapMain(LocalServerSocket usapPoolSocket,
                                    FileDescriptor writePipe) {
    

    LocalSocket sessionSocket = null;
    DataOutputStream usapOutputStream = null;
    Credentials peerCredentials = null;
    ZygoteArguments args = null;


    while (true) {
        try {
            sessionSocket = usapPoolSocket.accept();

            BufferedReader usapReader =
                    new BufferedReader(new InputStreamReader(sessionSocket.getInputStream()));
            usapOutputStream =
                    new DataOutputStream(sessionSocket.getOutputStream());

            peerCredentials = sessionSocket.getPeerCredentials();

            String[] argStrings = readArgumentList(usapReader);

            args = new ZygoteArguments(argStrings);
        } catch (...) {
            ...
        }

        ...

        specializeAppProcess(args.mUid, args.mGid, args.mGids,
                                args.mRuntimeFlags, rlimits, args.mMountExternal,
                                args.mSeInfo, args.mNiceName, args.mStartChildZygote,
                                args.mInstructionSet, args.mAppDataDir, args.mIsTopApp,
                                args.mPkgDataInfoList, args.mWhitelistedDataInfoList,
                                args.mBindMountAppDataDirs, args.mBindMountAppStorageDirs);



        return ZygoteInit.zygoteInit(args.mTargetSdkVersion,
                                            args.mDisabledCompatChanges,
                                            args.mRemainingArgs,
                                            null /* classLoader */);
        }
}

```

根据注释，Usap为“unspecialized app processes”的缩写，应该可以理解为未指定App的进程，运行到这里会循环阻塞，直到通过socket接收到App相关参数，然后使用这个进程启动App。所以这里推测UsapPool进程池为预先创建一定数量的进程，然后等待需要启动App的指令到达，然后使用预先fork的进程启动App而不是每次都走fork流程，加快App启动。

ZygoteInit#zygoteInit上面已经分析过，这里就不再赘述了。

## 总结

init进程为用户空间（相对于内核空间）的第一个进程，根据init.rc启动Zygote进程。

Zygote进程启动步骤：创建虚拟机、注册JNI、执行ZygoteInit的main方法开始Java之旅。

Zygote进程启动了SystemServer进程。

Zygote创建了socket，得到新建进程的指令到来，通过fork新建用户进程。

Zygote有一个优化进程创建的机制，UsapPool。

后续将继续探讨SystemServer内部运行机制以及App进程创建流程。本文完。
