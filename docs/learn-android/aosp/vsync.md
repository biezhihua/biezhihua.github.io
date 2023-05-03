---
article: false
---

# VSYNC

## SurfaceFlinger

SurfaceFlinger的启动和消息队列处理机制（四）

- <https://www.cnblogs.com/roger-yu/p/15761646.html>
- <https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/main_surfaceflinger.cpp?hl=zh-cn>
- <https://cs.android.com/android/platform/superproject/+/android-13.0.0_r41:frameworks/native/services/surfaceflinger/SurfaceFlingerFactory.cpp;l=26?q=createSurfaceFlinger&ss=android%2Fplatform%2Fsuperproject&hl=zh-cn>

## surfaceflinger.rc的作用，以及其内容的含义

<https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/surfaceflinger.rc;l=1?q=surfaceflinger.rc&sq=&hl=zh-cn>

`surfaceflinger.rc` 是一个 Android init 脚本，用于定义 SurfaceFlinger 服务的配置。SurfaceFlinger 是 Android 系统的核心组件，负责合成和显示图形。该文件定义了 SurfaceFlinger 服务的启动方式和权限。现在让我们分析文件的每一行内容：

1. `service surfaceflinger /system/bin/surfaceflinger`: 定义一个名为 "surfaceflinger" 的服务，它的可执行文件位于 `/system/bin/surfaceflinger`。

2. `class core animation`: 将 SurfaceFlinger 服务分配到 "core" 和 "animation" 类别。这些类别用于在特定条件下控制服务的启动和关闭。

3. `user system`: 设置 SurfaceFlinger 服务运行在 "system" 用户上下文中。

4. `group graphics drmrpc readproc`: 将 SurfaceFlinger 服务的组设置为 "graphics"、"drmrpc" 和 "readproc"。这些组定义了服务的权限。

5. `capabilities SYS_NICE`: 赋予 SurfaceFlinger 服务 SYS\_NICE 功能。这允许服务更改其调度优先级，以便在需要时获得更多 CPU 时间。

6. `onrestart restart --only-if-running zygote`: 如果 SurfaceFlinger 服务重启，该行命令会尝试重启名为 "zygote" 的服务。`--only-if-running` 参数确保仅在 "zygote" 服务已运行时执行重启操作。

7. `task_profiles HighPerformance`: 为 SurfaceFlinger 服务分配 "HighPerformance" 任务配置文件。这可能会调整服务的性能参数。

8-10. `socket pdx/...`: 这三行定义了 SurfaceFlinger 服务用于与客户端通信的 UNIX 域套接字。套接字的权限、所有者和安全上下文在这些行中定义。

总之，`surfaceflinger.rc` 文件定义了 SurfaceFlinger 服务的启动配置、权限和通信方式。这个文件在 Android 系统启动时被 init 进程读取，用于正确地启动和运行 SurfaceFlinger 服务。

## Android init 脚本是什么？ 有什么作用？怎么使用？

Android init 脚本是一种 Android 系统启动时用于配置和启动各种服务、设置属性和创建目录等操作的脚本。它们主要用于定义系统的启动流程和配置各种组件。这些脚本通常位于 Android 源码中的各个子项目和设备特定代码中，如 `system/core/rootdir`、`device/<manufacturer>/<device>/rootdir` 等。

Android init 脚本的作用包括：

1. 设置系统属性：用于配置系统行为、开关和设备特性等。
2. 创建目录和文件：用于在启动过程中创建必要的目录结构和文件。
3. 设置权限：用于设定系统目录和文件的访问权限，以确保正确的访问控制。
4. 启动服务：用于配置和启动系统中的各种守护进程和服务。

Android init 脚本使用一种名为 `init` 的简单语言编写，该语言包含一系列命令和关键字，用于表示不同的操作。例如：

- `service`：定义一个服务，包括服务名、可执行文件路径和相关参数。
- `on`：定义在特定事件触发时要执行的操作。
- `setprop`：设置系统属性。
- `mkdir`：创建目录。
- `chmod`：更改文件或目录权限。

要使用 Android init 脚本，您需要：

1. 在 Android 源码中找到相关的 init 脚本，如 `init.rc`、`init.<device>.rc` 或设备特定的 init 脚本。
2. 阅读和理解脚本中的命令和关键字，以及它们在系统启动过程中的作用。
3. 修改或添加 init 脚本中的命令和关键字，以满足您的需求。
4. 编译并刷入新的 Android 系统映像，然后观察更改后的系统行为。

- <https://android.googlesource.com/platform/system/core/+/master/init/README.md>

- <https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/Android.bp?hl=zh-cn>

## Android.bp的作用

`Android.bp` 是 Android 开源项目 (AOSP) 中的一种构建脚本，它使用类似 Makefile 的语法来描述如何构建 Android 应用程序、库和模块。它是 AOSP 中使用的 Soong 构建系统的核心组件之一，是 Android 7.0 及更高版本中用于构建的主要构建系统。

`Android.bp` 文件中描述了一个模块的依赖关系、编译选项、源代码文件列表等信息，构建系统将基于这些信息来生成构建脚本和构建产物。相比于之前使用的 GNU Make 工具链，Soong 构建系统更加灵活、可扩展和高效，能够更好地支持 Android 平台的复杂构建需求。

在 Android 源代码中，每个模块都有一个相应的 `Android.bp` 文件，用于描述该模块的构建规则。这些模块包括 Android 系统本身、应用程序、共享库、静态库、插件等。开发者可以修改这些 `Android.bp` 文件来增加、删除或修改模块的构建规则，以满足自己的需求。

总之，`Android.bp` 文件是 AOSP 中描述如何构建 Android 应用程序、库和模块的核心文件，它是 Soong 构建系统的核心组件之一。

## 

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
