---
article: false
---

# Perfetto - 03 - Quickstart: Record traces on Android

Perfetto允许你从各种数据源（例如通过ftrace记录内核调度信息，通过atrace记录用户空间的数据）收集Android设备的系统级性能跟踪数据。

## Starting the tracing services

Perfetto基于Android 9（P）之后可用的平台服务构建，但默认情况下仅在Android 11（R）之后启用。在Android 9（P）和10（Q）上，您需要执行以下操作以确保在开始之前启用跟踪服务：

＃仅在非Pixel手机上的Android 9（P）和10（Q）上需要。
adb shell setprop persist.traced.enable 1

如果您运行的Android版本早于P，则仍然可以使用record_android_trace脚本使用Perfetto捕获跟踪。请参见下面的通过cmdline记录跟踪的说明。

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

### CPU

#### CPU Coarse CPU usage counter 粗略的CPU使用计数器

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

https://perfetto.dev/docs/data-sources/cpu-scheduling

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

### GPU

#### GPU frequency

Records gpu frequency via ftrace

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
            ftrace_events: "power/gpu_frequency"
        }
    }
}
duration_ms: 10000

EOF
```

#### GPU memory

Allows to track per process and global total GPU memory usages. (Available on recent Android 12+ kernels)

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
        name: "android.gpu.memory"
    }
}
data_sources: {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "gpu_mem/gpu_mem_total"
        }
    }
}
duration_ms: 10000

EOF
```

### Power

#### Battery drain & power rails

Polls charge counters and instantaneous power draw from the battery power management IC and the power rails from the PowerStats HAL

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
        name: "android.power"
        android_power_config {
            battery_poll_ms: 1000
            battery_counters: BATTERY_COUNTER_CAPACITY_PERCENT
            battery_counters: BATTERY_COUNTER_CHARGE
            battery_counters: BATTERY_COUNTER_CURRENT
            collect_power_rails: true
        }
    }
}
duration_ms: 10000

EOF
```

#### Board voltages & frequencies
Tracks voltage and frequency changes from board sensors

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
            ftrace_events: "regulator/regulator_set_voltage"
            ftrace_events: "regulator/regulator_set_voltage_complete"
            ftrace_events: "power/clock_enable"
            ftrace_events: "power/clock_disable"
            ftrace_events: "power/clock_set_rate"
            ftrace_events: "power/suspend_resume"
        }
    }
}
duration_ms: 10000

EOF
```

### Memory

#### Native heap profiling
Track native heap allocations & deallocations of an Android process. (Available on Android 10+)

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
        name: "android.heapprofd"
        target_buffer: 0
        heapprofd_config {
            sampling_interval_bytes: 4096
            shmem_size_bytes: 8388608
            block_client: true
        }
    }
}
duration_ms: 10000

EOF
```

#### Java heap dumps
Dump information about the Java object graph of an Android app. (Available on Android 11+)

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
        name: "android.java_hprof"
        target_buffer: 0
        java_hprof_config {
            continuous_dump_config {
                dump_interval_ms: 1000
            }
        }
    }
}
duration_ms: 10000

EOF
```

#### Kernel meminfo
Polling of /proc/meminfo

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
            meminfo_period_ms: 1000
            meminfo_counters: MEMINFO_ACTIVE
            meminfo_counters: MEMINFO_ACTIVE_ANON
            meminfo_counters: MEMINFO_ACTIVE_FILE
            meminfo_counters: MEMINFO_ANON_PAGES
            meminfo_counters: MEMINFO_BUFFERS
            meminfo_counters: MEMINFO_CACHED
            meminfo_counters: MEMINFO_CMA_FREE
            meminfo_counters: MEMINFO_CMA_TOTAL
            meminfo_counters: MEMINFO_COMMIT_LIMIT
            meminfo_counters: MEMINFO_COMMITED_AS
            meminfo_counters: MEMINFO_DIRTY
            meminfo_counters: MEMINFO_INACTIVE
            meminfo_counters: MEMINFO_INACTIVE_ANON
            meminfo_counters: MEMINFO_INACTIVE_FILE
            meminfo_counters: MEMINFO_KERNEL_STACK
            meminfo_counters: MEMINFO_MAPPED
            meminfo_counters: MEMINFO_MEM_AVAILABLE
            meminfo_counters: MEMINFO_MEM_FREE
            meminfo_counters: MEMINFO_MEM_TOTAL
            meminfo_counters: MEMINFO_MLOCKED
            meminfo_counters: MEMINFO_PAGE_TABLES
            meminfo_counters: MEMINFO_SHMEM
            meminfo_counters: MEMINFO_SLAB
            meminfo_counters: MEMINFO_SLAB_RECLAIMABLE
            meminfo_counters: MEMINFO_SLAB_UNRECLAIMABLE
            meminfo_counters: MEMINFO_SWAP_CACHED
            meminfo_counters: MEMINFO_SWAP_FREE
            meminfo_counters: MEMINFO_SWAP_TOTAL
            meminfo_counters: MEMINFO_UNEVICTABLE
            meminfo_counters: MEMINFO_VMALLOC_CHUNK
            meminfo_counters: MEMINFO_VMALLOC_TOTAL
            meminfo_counters: MEMINFO_VMALLOC_USED
            meminfo_counters: MEMINFO_WRITEBACK
        }
    }
}
duration_ms: 10000

EOF
```

#### High-frequency memory events
Allows to track short memory spikes and transitories through ftrace's mm_event, rss_stat and ion events. Available only on recent Android Q+ kernels

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
            ftrace_events: "mm_event/mm_event_record"
            ftrace_events: "kmem/rss_stat"
            ftrace_events: "ion/ion_stat"
            ftrace_events: "dmabuf_heap/dma_heap_stat"
            ftrace_events: "kmem/ion_heap_grow"
            ftrace_events: "kmem/ion_heap_shrink"
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

#### Low memory killer
Record LMK events. Works both with the old in-kernel LMK and the newer userspace lmkd. It also tracks OOM score adjustments.

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
            ftrace_events: "lowmemorykiller/lowmemory_kill"
            ftrace_events: "oom/oom_score_adj_update"
            ftrace_events: "ftrace/print"
            atrace_apps: "lmkd"
        }
    }
}
duration_ms: 10000

EOF
```

#### Per process stats
Periodically samples all processes in the system tracking: their thread list, memory counters (RSS, swap and other /proc/status counters) and oom_score_adj.

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
            proc_stats_poll_ms: 1000
        }
    }
}
duration_ms: 10000

EOF
```

#### Virtual memory stats
Periodically polls virtual memory stats from /proc/vmstat. Allows to gather statistics about swap, eviction, compression and pagecache efficiency

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
            vmstat_period_ms: 1000
            vmstat_counters: VMSTAT_ALLOCSTALL
            vmstat_counters: VMSTAT_ALLOCSTALL_DMA
            vmstat_counters: VMSTAT_ALLOCSTALL_MOVABLE
            vmstat_counters: VMSTAT_ALLOCSTALL_NORMAL
            vmstat_counters: VMSTAT_COMPACT_DAEMON_FREE_SCANNED
            vmstat_counters: VMSTAT_COMPACT_DAEMON_MIGRATE_SCANNED
            vmstat_counters: VMSTAT_COMPACT_DAEMON_WAKE
            vmstat_counters: VMSTAT_COMPACT_FAIL
            vmstat_counters: VMSTAT_COMPACT_FREE_SCANNED
            vmstat_counters: VMSTAT_COMPACT_ISOLATED
            vmstat_counters: VMSTAT_COMPACT_MIGRATE_SCANNED
            vmstat_counters: VMSTAT_COMPACT_STALL
            vmstat_counters: VMSTAT_COMPACT_SUCCESS
            vmstat_counters: VMSTAT_DROP_PAGECACHE
            vmstat_counters: VMSTAT_DROP_SLAB
            vmstat_counters: VMSTAT_KSWAPD_HIGH_WMARK_HIT_QUICKLY
            vmstat_counters: VMSTAT_KSWAPD_INODESTEAL
            vmstat_counters: VMSTAT_KSWAPD_LOW_WMARK_HIT_QUICKLY
            vmstat_counters: VMSTAT_NR_ACTIVE_ANON
            vmstat_counters: VMSTAT_NR_ACTIVE_FILE
            vmstat_counters: VMSTAT_NR_ALLOC_BATCH
            vmstat_counters: VMSTAT_NR_ANON_PAGES
            vmstat_counters: VMSTAT_NR_ANON_TRANSPARENT_HUGEPAGES
            vmstat_counters: VMSTAT_NR_BOUNCE
            vmstat_counters: VMSTAT_NR_DIRTIED
            vmstat_counters: VMSTAT_NR_DIRTY
            vmstat_counters: VMSTAT_NR_DIRTY_BACKGROUND_THRESHOLD
            vmstat_counters: VMSTAT_NR_DIRTY_THRESHOLD
            vmstat_counters: VMSTAT_NR_FASTRPC
            vmstat_counters: VMSTAT_NR_FILE_PAGES
            vmstat_counters: VMSTAT_NR_FREE_CMA
            vmstat_counters: VMSTAT_NR_FREE_PAGES
            vmstat_counters: VMSTAT_NR_GPU_HEAP
            vmstat_counters: VMSTAT_NR_INACTIVE_ANON
            vmstat_counters: VMSTAT_NR_INACTIVE_FILE
            vmstat_counters: VMSTAT_NR_INDIRECTLY_RECLAIMABLE
            vmstat_counters: VMSTAT_NR_ION_HEAP
            vmstat_counters: VMSTAT_NR_ION_HEAP_POOL
            vmstat_counters: VMSTAT_NR_ISOLATED_ANON
            vmstat_counters: VMSTAT_NR_ISOLATED_FILE
            vmstat_counters: VMSTAT_NR_KERNEL_MISC_RECLAIMABLE
            vmstat_counters: VMSTAT_NR_KERNEL_STACK
            vmstat_counters: VMSTAT_NR_MAPPED
            vmstat_counters: VMSTAT_NR_MLOCK
            vmstat_counters: VMSTAT_NR_OVERHEAD
            vmstat_counters: VMSTAT_NR_PAGE_TABLE_PAGES
            vmstat_counters: VMSTAT_NR_PAGES_SCANNED
            vmstat_counters: VMSTAT_NR_SHADOW_CALL_STACK_BYTES
            vmstat_counters: VMSTAT_NR_SHMEM
            vmstat_counters: VMSTAT_NR_SHMEM_HUGEPAGES
            vmstat_counters: VMSTAT_NR_SHMEM_PMDMAPPED
            vmstat_counters: VMSTAT_NR_SLAB_RECLAIMABLE
            vmstat_counters: VMSTAT_NR_SLAB_UNRECLAIMABLE
            vmstat_counters: VMSTAT_NR_SWAPCACHE
            vmstat_counters: VMSTAT_NR_UNEVICTABLE
            vmstat_counters: VMSTAT_NR_UNRECLAIMABLE_PAGES
            vmstat_counters: VMSTAT_NR_UNSTABLE
            vmstat_counters: VMSTAT_NR_VMSCAN_IMMEDIATE_RECLAIM
            vmstat_counters: VMSTAT_NR_VMSCAN_WRITE
            vmstat_counters: VMSTAT_NR_WRITEBACK
            vmstat_counters: VMSTAT_NR_WRITEBACK_TEMP
            vmstat_counters: VMSTAT_NR_WRITTEN
            vmstat_counters: VMSTAT_NR_ZONE_ACTIVE_ANON
            vmstat_counters: VMSTAT_NR_ZONE_ACTIVE_FILE
            vmstat_counters: VMSTAT_NR_ZONE_INACTIVE_ANON
            vmstat_counters: VMSTAT_NR_ZONE_INACTIVE_FILE
            vmstat_counters: VMSTAT_NR_ZONE_UNEVICTABLE
            vmstat_counters: VMSTAT_NR_ZONE_WRITE_PENDING
            vmstat_counters: VMSTAT_NR_ZSPAGES
            vmstat_counters: VMSTAT_OOM_KILL
            vmstat_counters: VMSTAT_PAGEOUTRUN
            vmstat_counters: VMSTAT_PGACTIVATE
            vmstat_counters: VMSTAT_PGALLOC_DMA
            vmstat_counters: VMSTAT_PGALLOC_MOVABLE
            vmstat_counters: VMSTAT_PGALLOC_NORMAL
            vmstat_counters: VMSTAT_PGDEACTIVATE
            vmstat_counters: VMSTAT_PGFAULT
            vmstat_counters: VMSTAT_PGFREE
            vmstat_counters: VMSTAT_PGINODESTEAL
            vmstat_counters: VMSTAT_PGLAZYFREE
            vmstat_counters: VMSTAT_PGLAZYFREED
            vmstat_counters: VMSTAT_PGMAJFAULT
            vmstat_counters: VMSTAT_PGMIGRATE_FAIL
            vmstat_counters: VMSTAT_PGMIGRATE_SUCCESS
            vmstat_counters: VMSTAT_PGPGIN
            vmstat_counters: VMSTAT_PGPGOUT
            vmstat_counters: VMSTAT_PGPGOUTCLEAN
            vmstat_counters: VMSTAT_PGREFILL
            vmstat_counters: VMSTAT_PGREFILL_DMA
            vmstat_counters: VMSTAT_PGREFILL_MOVABLE
            vmstat_counters: VMSTAT_PGREFILL_NORMAL
            vmstat_counters: VMSTAT_PGROTATED
            vmstat_counters: VMSTAT_PGSCAN_DIRECT
            vmstat_counters: VMSTAT_PGSCAN_DIRECT_DMA
            vmstat_counters: VMSTAT_PGSCAN_DIRECT_MOVABLE
            vmstat_counters: VMSTAT_PGSCAN_DIRECT_NORMAL
            vmstat_counters: VMSTAT_PGSCAN_DIRECT_THROTTLE
            vmstat_counters: VMSTAT_PGSCAN_KSWAPD
            vmstat_counters: VMSTAT_PGSCAN_KSWAPD_DMA
            vmstat_counters: VMSTAT_PGSCAN_KSWAPD_MOVABLE
            vmstat_counters: VMSTAT_PGSCAN_KSWAPD_NORMAL
            vmstat_counters: VMSTAT_PGSKIP_DMA
            vmstat_counters: VMSTAT_PGSKIP_MOVABLE
            vmstat_counters: VMSTAT_PGSKIP_NORMAL
            vmstat_counters: VMSTAT_PGSTEAL_DIRECT
            vmstat_counters: VMSTAT_PGSTEAL_DIRECT_DMA
            vmstat_counters: VMSTAT_PGSTEAL_DIRECT_MOVABLE
            vmstat_counters: VMSTAT_PGSTEAL_DIRECT_NORMAL
            vmstat_counters: VMSTAT_PGSTEAL_KSWAPD
            vmstat_counters: VMSTAT_PGSTEAL_KSWAPD_DMA
            vmstat_counters: VMSTAT_PGSTEAL_KSWAPD_MOVABLE
            vmstat_counters: VMSTAT_PGSTEAL_KSWAPD_NORMAL
            vmstat_counters: VMSTAT_PSWPIN
            vmstat_counters: VMSTAT_PSWPOUT
            vmstat_counters: VMSTAT_SLABS_SCANNED
            vmstat_counters: VMSTAT_SWAP_RA
            vmstat_counters: VMSTAT_SWAP_RA_HIT
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_CLEARED
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_CULLED
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_MLOCKED
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_MUNLOCKED
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_RESCUED
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_SCANNED
            vmstat_counters: VMSTAT_UNEVICTABLE_PGS_STRANDED
            vmstat_counters: VMSTAT_WORKINGSET_ACTIVATE
            vmstat_counters: VMSTAT_WORKINGSET_NODERECLAIM
            vmstat_counters: VMSTAT_WORKINGSET_REFAULT
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

### Advanced settings

#### Advanced ftrace config
Enable individual events and tune the kernel-tracing (ftrace) module. The events enabled here are in addition to those from enabled by other probes.

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
            ftrace_events: "binder/*"
            ftrace_events: "block/*"
            ftrace_events: "clk/*"
            ftrace_events: "ext4/*"
            ftrace_events: "f2fs/*"
            ftrace_events: "fastrpc/*"
            ftrace_events: "i2c/*"
            ftrace_events: "irq/*"
            ftrace_events: "kmem/*"
            ftrace_events: "memory_bus/*"
            ftrace_events: "mmc/*"
            ftrace_events: "oom/*"
            ftrace_events: "power/*"
            ftrace_events: "regulator/*"
            ftrace_events: "sched/*"
            ftrace_events: "sync/*"
            ftrace_events: "task/*"
            ftrace_events: "vmscan/*"
            ftrace_events: "sched/sched_blocked_reason"
            buffer_size_kb: 512
            drain_period_ms: 100
            symbolize_ksyms: true
        }
    }
}
duration_ms: 10000

EOF
```

## Recording a trace - Recording a trace through the cmdline

```
curl -O https://raw.githubusercontent.com/google/perfetto/master/tools/record_android_trace
python3 record_android_trace -o trace_file.perfetto-trace -t 10s -b 32mb sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory
```

```shell
 # python3 .\record_android_trace --list
         gfx - Graphics
       input - Input
        view - View System
     webview - WebView
          wm - Window Manager
          am - Activity Manager
          sm - Sync Manager
       audio - Audio
       video - Video
      camera - Camera
         hal - Hardware Modules
         res - Resource Loading
      dalvik - Dalvik VM
          rs - RenderScript
      bionic - Bionic C Library
       power - Power Management
          pm - Package Manager
          ss - System Server
    database - Database
     network - Network
         adb - ADB
    vibrator - Vibrator
        aidl - AIDL calls
       nnapi - NNAPI
         rro - Runtime Resource Overlay
         pdx - PDX services
       sched - CPU Scheduling
         irq - IRQ Events
         i2c - I2C Events
        freq - CPU Frequency
        idle - CPU Idle
        disk - Disk I/O
        sync - Synchronization
       workq - Kernel Workqueues
  memreclaim - Kernel Memory Reclaim
  regulators - Voltage and Current Regulators
  binder_driver - Binder Kernel driver
  binder_lock - Binder global lock trace
   pagecache - Page cache
      memory - Memory
     thermal - Thermal event
         gfx - Graphics (HAL)
         ion - ION allocation (HAL)
```

```shell
full
python3 record_android_trace -o trace_file.perfetto-trace -t 10s -b 128mb gfx input view webview wm am sm audio video camera hal res dalvik r bionic power pm s database network adb vibrator aidl nnapi rro pdx sched irq i2c freq idle disk sync workq memreclaim regulators binder_driver binder_lock pagecache memory thermal gfx ion
```

```shell
commmon
python3 record_android_trace -o trace_file.perfetto-trace -t 10s -b 32mb sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory
```

```config
buffers {
  size_kb: 102400
  fill_policy: RING_BUFFER
}

data_sources {
  config {
    name: "linux.ftrace"
    ftrace_config {
      # Enables specific system events tags.
      atrace_categories: "am"
      atrace_categories: "pm"

      # Enables events for a specific app.
      atrace_apps: "com.google.android.apps.docs"

      # Enables all events for all apps.
      atrace_apps: "*"
    }
  }
}
```

```shell
./record_android_trace -c config.pbtx -o trace_file.perfetto-trace 
```



# Reference

- https://juejin.cn/post/7119764025210044423
- https://docs.kernel.org/trace/ftrace.html
- https://perfetto.dev/docs/quickstart/android-tracing
- https://perfetto.dev/docs/concepts/service-model
- https://perfetto.dev/docs/reference/perfetto-cli
- https://developer.android.com/studio/releases/platform-tools
- https://perfetto.dev/docs/concepts/config


