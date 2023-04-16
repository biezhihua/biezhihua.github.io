---
tag:
  - android
  - performance
  - fluency
---

# Android | 性能优化 | 流畅性 - 第08篇 - 从Perfetto角度理解Android系统 - 图形渲染和显示 - VSYNC

- VSYNC信号的作用
- VSYNC信号的产生
- VSYNC信号的分发，DispSync如何分发HW_VSYNC_0并产生VSYNC和SF_VSYNC信号
- VSYNC如何与图形数据流方向结合的，以及各个阶段的作用
- 在Perfetto中分析VSYNC
- VSYNC offset

## 引用

- <https://www.androidperformance.com/2019/12/01/Android-Systrace-Vsync/#/%E4%B8%8D%E4%BD%BF%E7%94%A8HW-VSYNC>
- <https://source.android.google.cn/docs/core/graphics?authuser=0#android-graphics-components>
- <https://source.android.com/docs/core/graphics/implement-vsync?hl=zh-cn>

### 该如何理解：The VSYNC signal synchronizes the display pipeline

VSYNC信号是指垂直同步信号，用于同步显示流水线的各个环节。在Android中，VSYNC信号由SurfaceFlinger和硬件显示控制器之间进行交互，以确保帧缓冲区中的内容在下一次显示更新之前得到更新，从而保证流畅的显示效果。具体来说，当显示控制器准备好下一帧时，它会向SurfaceFlinger发出VSYNC信号。SurfaceFlinger在接收到VSYNC信号后，会通知应用程序准备好新的帧，然后开始将新的帧渲染到帧缓冲区中，最后将帧缓冲区中的内容传递给显示控制器进行显示。这样，VSYNC信号就起到了协调和同步Android系统中各个组件的作用，从而保证了流畅的显示效果。

### 该如何理解：The VSYNC signal synchronizes the display pipeline. The display pipeline consists of app rendering, SurfaceFlinger composition, and the Hardware Composer (HWC) presenting images on the display. VSYNC synchronizes the time apps wake up to start rendering, the time SurfaceFlinger wakes up to composite the screen, and the display refresh cycle

该句话的意思是：VSYNC 信号用于同步显示管线。显示管线包括应用程序渲染、SurfaceFlinger 合成和硬件组合器 (HWC) 在显示器上呈现图像。VSYNC 同步应用程序启动渲染的时间、SurfaceFlinger 启动合成屏幕的时间和显示器刷新周期的时间。简单来说，VSYNC信号协调了整个显示过程，保证了图像的流畅性和同步性。

### 同步显示管线是什么意思？

同步显示管线是指在Android系统中，为了保证图像能够流畅地显示在屏幕上，涉及到的一系列操作需要按照一定的顺序依次进行，且各个部分之间需要相互协调配合，这个过程就被称为同步显示管线。这个管线包括应用程序的渲染、SurfaceFlinger的合成和Hardware Composer的显示等多个部分，它们需要通过VSYNC信号进行同步，以确保在每一帧刷新时，图像能够正确地显示在屏幕上。

### Android中帧显示、帧合并、帧生成的顺序

在 VSYNC 事件中，屏幕开始显示帧 N，而 SurfaceFlinger 开始为帧 N+1 合成窗口。应用处理等待的输入并生成帧 N+2。

### 该如何理解这段话：The result of VSYNC offset is three signals with same period and offset phase

这句话描述了一个场景，其中有三个信号具有相同的周期和相位偏移。让我们逐步解析这句话：

1. 相同周期：周期是指信号重复出现的时间间隔。在这个场景中，三个信号具有相同的周期，意味着它们以相同的频率重复出现。

2. 相位偏移：相位偏移是指两个或多个信号在时间上的差距。在这个场景中，三个信号具有相位偏移，意味着它们在时间轴上有一定的间隔。

将这两个概念结合起来，这句话描述了一个场景，其中有三个具有相同周期和相位偏移的信号。换句话说，这三个信号以相同的频率重复出现，但它们在时间轴上有一定的间隔，形成了一种相位差的关系。

在VSYNC的上下文中，VSYNC（垂直同步）是一个信号，用于指示显示器刷新图像的开始。在某些情况下，可能需要调整VSYNC信号以适应不同的显示需求。在这种情况下，通过引入相位偏移，可以创建具有相同周期的三个VSYNC信号，从而实现更精细的控制和同步。

### 该如何理解这段内容，请详细解释： DispSync has the following qualities: Reference — HW\_VSYNC\_0. Output — VSYNC and SF\_VSYNC. Feedback — Retire fence signal timestamps from Hardware Composer

为了理解这段内容，我们需要先了解一些相关的术语：

1. DispSync：DispSync是一个软件实现的相位锁定环（PLL），用于生成VSYNC和SF\_VSYNC信号。
2. HW\_VSYNC\_0：硬件VSYNC信号，它是显示器刷新图像的开始时的信号。
3. VSYNC：VSYNC（垂直同步）信号用于指示显示器刷新图像的开始。
4. SF\_VSYNC：SF\_VSYNC是SurfaceFlinger使用的一个信号，与VSYNC类似，但它是为SurfaceFlinger服务的。
5. Retire fence signal：Retire fence信号是一种同步机制，用于确保GPU完成渲染操作后再进行下一步操作。
6. Hardware Composer：Hardware Composer是Android系统的一个硬件抽象层（HAL）组件，负责管理显示子系统。

现在我们来解析这段话：

DispSync具有以下特性：

1. 参考（Reference）：HW\_VSYNC\_0。这表示DispSync使用硬件VSYNC信号（HW\_VSYNC\_0）作为参考信号，以便生成其他信号。
2. 输出（Output）：VSYNC和SF\_VSYNC。DispSync基于硬件VSYNC信号（HW\_VSYNC\_0）生成VSYNC和SF\_VSYNC信号，以供Choreographer和SurfaceFlinger使用。
3. 反馈（Feedback）：来自Hardware Composer的Retire fence signal时间戳。这表示DispSync使用Hardware Composer提供的Retire fence signal时间戳作为反馈，来调整生成的VSYNC和SF\_VSYNC信号，以确保它们与硬件VSYNC信号保持同步。

综上所述，DispSync是一个软件实现的相位锁定环，它使用硬件VSYNC信号作为参考，并生成VSYNC和SF\_VSYNC信号。同时，DispSync还利用来自Hardware Composer的Retire fence signal时间戳作为反馈，以确保生成的信号与硬件VSYNC信号保持同步。