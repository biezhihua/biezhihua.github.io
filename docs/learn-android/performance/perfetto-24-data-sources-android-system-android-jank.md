---
article: false
---

# Android Jank detection with FrameTimeline

如果一个帧在屏幕上显示的时间与调度器给出的预测当前时间不匹配，则该帧被称为janky。

jank会导致:
- 帧速率不稳定
- 增加了延迟

## UI

对于屏幕上至少有一帧的每个应用程序，都会添加两个新轨道。

每个切片代表了应用程序渲染帧的时间。为了避免系统中的janks，应用程序预计将在这个时间框架内完成。

这些切片表示应用程序完成帧(包括GPU工作)并将其发送给SurfaceFlinger进行合成的实际时间。注意:FrameTimeline还不知道应用程序的实际帧开始时间。改为使用预期开始时间。这里切片的结束时间表示max(gpu time, post time)。发布时间是应用程序的帧被发布到SurfaceFlinger的时间。

## SQL
## TraceConfig

## Reference

- https://perfetto.dev/docs/data-sources/frametimeline