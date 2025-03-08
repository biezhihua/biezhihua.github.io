---
article: false
---

# Perfetto - 41 - Trace configuration

```
python3 record_android_trace -o trace_file.perfetto-trace -t 10s -b 32mb sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory

python3 .\record_android_trace -c .\atrace.cfg -o trace_file.perfetto-trace
```

## TraceConfig
## Buffers
## Dynamic buffer mapping
## PBTX vs binary format
## Streaming long traces
## Data-source specific config
## Multi-process data sources
## Triggers
## Android
## Other resources

## Reference

- https://perfetto.dev/docs/concepts/config
- https://cs.android.com/android/platform/superproject/+/master:external/perfetto/test/configs/
- https://zhuanlan.zhihu.com/p/508526020
- https://cs.android.com/android/platform/superproject/+/master:external/perfetto/protos/perfetto/config/trace_config.proto