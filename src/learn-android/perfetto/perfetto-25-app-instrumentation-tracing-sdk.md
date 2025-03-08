---
article: false
---

# Perfetto - 25 - Tracing SDK

App Instrumentation的翻译是应用程序检测或应用程序检测技术。

Perfetto Tracing SDK 是一个 C++17 库，允许用户空间应用程序发出跟踪事件并向 Perfetto 跟踪添加更多特定于应用程序的上下文。

在使用跟踪 SDK 时，有两个主要方面需要考虑：

- 一是您是否仅对来自自己的应用程序的跟踪事件感兴趣，还是想收集覆盖应用程序跟踪事件与系统跟踪事件（如调度程序跟踪、系统调用或任何其他 Perfetto 数据源）的全栈跟踪。
- 对于特定于应用程序的跟踪，您需要考虑是否需要跟踪简单类型的时间轴事件（例如，切片、计数器）或需要定义具有自定义强类型模式的复杂数据源（例如，将应用程序子系统的状态转储到跟踪中）。

对于仅限于 Android 应用程序检测，建议使用现有的 android.os.Trace（SDK）/ATrace_*（NDK），如果它们对您的用例足够。 Atrace 基础仪器在 Perfetto 中得到了充分支持。有关详细信息，请参见数据源-> Android 系统-> Atrace 仪器。

## Getting started
## Custom data sources vs Track events
### Track events
### Custom data sources
## In-process vs System mode
### In-process mode
### System mode
## Recording traces through the API

## Reference

- https://perfetto.dev/docs/instrumentation/tracing-sdk