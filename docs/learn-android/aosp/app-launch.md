---
tag:
  - android
  - aosp
---

# Android | AOSP | 应用启动全流程分析（源码深度剖析）

## 前言1

对优秀文章[《Android应用启动全流程分析（源码深度剖析）》](https://www.jianshu.com/p/37370c1d17fc)学习的记录

## 前言2

结合Perfetto分析工具，基于最新Android 13 AOSP源码完整的分析一下这个从用户手指触控点击屏幕应用图标到应用界面展示到屏幕上的整个应用启动过程，也是对之前所做所学的一个总结与归纳。

## 大纲

- Android触控事件处理机制
- Zygote进程启动和应用进程创建流程
- Handler消息机制
- AMS的Activity组件管理
- 应用Application和Activity组件创建与初始化
- 应用UI布局与绘制
- RenderThread渲染
- SurfaceFlinger合成显示

## 引用

- <https://www.jianshu.com/p/37370c1d17fc>
