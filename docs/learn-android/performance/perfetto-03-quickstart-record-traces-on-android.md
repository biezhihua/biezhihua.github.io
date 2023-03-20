---
article: false
---

# Quickstart: Record traces on Android

Perfetto允许你从各种数据源(内核调度器通过ftrace，用户空间检测通过atrace和本网站列出的所有其他数据源)收集Android设备的系统范围性能跟踪。

## Starting the tracing services

Perfetto基于平台服务。https://perfetto.dev/docs/concepts/service-model

## Recording a trace

## Recording a trace - Recording a trace through the Perfetto UI

### Default
```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 7168
    fill_policy: DISCARD
}
buffers: {
    size_kb: 1024
    fill_policy: DISCARD
}
duration_ms: 10000
EOF
```

### CPU Coarse CPU usage counter 粗略的CPU使用计数器

Lightweight polling of CPU usage counters via /proc/stat. Allows to periodically monitor CPU usage.

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.sys_stats"
        sys_stats_config {
            stat_period_ms: 1000
            stat_counters: STAT_CPU_TIMES
            stat_counters: STAT_FORK_COUNT
        }
    }
}
duration_ms: 10000

EOF
```

#### Scheduling details

Enables high-detailed tracking of scheduling events

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.process_stats"
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "sched/sched_switch"
            ftrace_events: "power/suspend_resume"
            ftrace_events: "sched/sched_wakeup"
            ftrace_events: "sched/sched_wakeup_new"
            ftrace_events: "sched/sched_waking"
            ftrace_events: "sched/sched_process_exit"
            ftrace_events: "sched/sched_process_free"
            ftrace_events: "task/task_newtask"
            ftrace_events: "task/task_rename"
        }
    }
}
duration_ms: 10000

EOF

```

#### CPU frequency and idle states

Records cpu frequency and idle state changes via ftrace and sysfs

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.sys_stats"
        sys_stats_config {
            cpufreq_period_ms: 1000
        }
    }
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "power/cpu_frequency"
            ftrace_events: "power/cpu_idle"
            ftrace_events: "power/suspend_resume"
        }
    }
}
duration_ms: 10000

EOF
```

#### Syscalls

Tracks the enter and exit of all syscalls. On Android requires a userdebug or eng build.

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "raw_syscalls/sys_enter"
            ftrace_events: "raw_syscalls/sys_exit"
        }
    }
}
duration_ms: 10000

EOF
```

### Android apps & svcs

#### Atrace userspace annotations: Enables C++ / Java codebase annotations (ATRACE_BEGIN() / os.Trace())
```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 7168
    fill_policy: DISCARD
}
buffers: {
    size_kb: 1024
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "ftrace/print"
            atrace_apps: "*"
        }
    }
}
duration_ms: 10000

EOF
```

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 7168
    fill_policy: DISCARD
}
buffers: {
    size_kb: 1024
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "ftrace/print"
            atrace_categories: "am"
            atrace_categories: "adb"
            atrace_categories: "aidl"
            atrace_categories: "dalvik"
            atrace_categories: "audio"
            atrace_categories: "binder_lock"
            atrace_categories: "binder_driver"
            atrace_categories: "bionic"
            atrace_categories: "camera"
            atrace_categories: "database"
            atrace_categories: "gfx"
            atrace_categories: "hal"
            atrace_categories: "input"
            atrace_categories: "network"
            atrace_categories: "nnapi"
            atrace_categories: "pm"
            atrace_categories: "power"
            atrace_categories: "rs"
            atrace_categories: "res"
            atrace_categories: "rro"
            atrace_categories: "sm"
            atrace_categories: "ss"
            atrace_categories: "vibrator"
            atrace_categories: "video"
            atrace_categories: "view"
            atrace_categories: "webview"
            atrace_apps: "*"
        }
    }
}
duration_ms: 10000

EOF
```

#### Event log (logcat)

Streams the event log into the trace. If no buffer filter is specified, all buffers are selected.

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 7168
    fill_policy: DISCARD
}
buffers: {
    size_kb: 1024
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "android.log"
        android_log_config {
            log_ids: LID_EVENTS
            log_ids: LID_CRASH
            log_ids: LID_KERNEL
            log_ids: LID_DEFAULT
            log_ids: LID_RADIO
            log_ids: LID_SECURITY
            log_ids: LID_STATS
            log_ids: LID_SYSTEM
        }
    }
}
duration_ms: 10000

EOF

```

#### Frame timeline

Records expected/actual frame timings from surface_flinger. Requires Android 12 (S) or above.

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "android.surfaceflinger.frametimeline"
    }
}
duration_ms: 10000

EOF
```

#### Game intervention list

List game modes and interventions. Requires Android 13 (T) or above.

```shell
adb shell perfetto \
  -c - --txt \
  -o /data/misc/perfetto-traces/trace \
<<EOF

buffers: {
    size_kb: 63488
    fill_policy: DISCARD
}
buffers: {
    size_kb: 2048
    fill_policy: DISCARD
}
data_sources: {
    config {
        name: "android.game_interventions"
    }
}
duration_ms: 10000

EOF
```

## Recording a trace - Recording a trace through the cmdline



# Reference

- https://perfetto.dev/docs/quickstart/android-tracing
- https://perfetto.dev/docs/concepts/service-model
- https://perfetto.dev/docs/reference/perfetto-cli
- https://developer.android.com/studio/releases/platform-tools