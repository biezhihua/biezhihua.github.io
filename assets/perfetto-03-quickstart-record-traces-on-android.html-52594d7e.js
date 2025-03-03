import{_ as n,Y as e,Z as s,a2 as i}from"./framework-301d0703.js";const a={},l=i(`<h1 id="perfetto-03-quickstart-record-traces-on-android" tabindex="-1"><a class="header-anchor" href="#perfetto-03-quickstart-record-traces-on-android" aria-hidden="true">#</a> Perfetto - 03 - Quickstart: Record traces on Android</h1><p>Perfetto允许你从各种数据源（例如通过ftrace记录内核调度信息，通过atrace记录用户空间的数据）收集Android设备的系统级性能跟踪数据。</p><h2 id="starting-the-tracing-services" tabindex="-1"><a class="header-anchor" href="#starting-the-tracing-services" aria-hidden="true">#</a> Starting the tracing services</h2><p>Perfetto基于Android 9（P）之后可用的平台服务构建，但默认情况下仅在Android 11（R）之后启用。在Android 9（P）和10（Q）上，您需要执行以下操作以确保在开始之前启用跟踪服务：</p><p>＃仅在非Pixel手机上的Android 9（P）和10（Q）上需要。 adb shell setprop persist.traced.enable 1</p><p>如果您运行的Android版本早于P，则仍然可以使用record_android_trace脚本使用Perfetto捕获跟踪。请参见下面的通过cmdline记录跟踪的说明。</p><h2 id="recording-a-trace" tabindex="-1"><a class="header-anchor" href="#recording-a-trace" aria-hidden="true">#</a> Recording a trace</h2><h2 id="recording-a-trace-recording-a-trace-through-the-perfetto-ui" tabindex="-1"><a class="header-anchor" href="#recording-a-trace-recording-a-trace-through-the-perfetto-ui" aria-hidden="true">#</a> Recording a trace - Recording a trace through the Perfetto UI</h2><h3 id="default" tabindex="-1"><a class="header-anchor" href="#default" aria-hidden="true">#</a> Default</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

buffers: {
    size_kb: 7168
    fill_policy: DISCARD
}
buffers: {
    size_kb: 1024
    fill_policy: DISCARD
}
duration_ms: 10000
EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="cpu" tabindex="-1"><a class="header-anchor" href="#cpu" aria-hidden="true">#</a> CPU</h3><h4 id="cpu-coarse-cpu-usage-counter-粗略的cpu使用计数器" tabindex="-1"><a class="header-anchor" href="#cpu-coarse-cpu-usage-counter-粗略的cpu使用计数器" aria-hidden="true">#</a> CPU Coarse CPU usage counter 粗略的CPU使用计数器</h4><p>Lightweight polling of CPU usage counters via /proc/stat. Allows to periodically monitor CPU usage.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.sys_stats&quot;
        sys_stats_config {
            stat_period_ms: 1000
            stat_counters: STAT_CPU_TIMES
            stat_counters: STAT_FORK_COUNT
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="scheduling-details" tabindex="-1"><a class="header-anchor" href="#scheduling-details" aria-hidden="true">#</a> Scheduling details</h4><p>https://perfetto.dev/docs/data-sources/cpu-scheduling</p><p>Enables high-detailed tracking of scheduling events</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.process_stats&quot;
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;sched/sched_switch&quot;
            ftrace_events: &quot;power/suspend_resume&quot;
            ftrace_events: &quot;sched/sched_wakeup&quot;
            ftrace_events: &quot;sched/sched_wakeup_new&quot;
            ftrace_events: &quot;sched/sched_waking&quot;
            ftrace_events: &quot;sched/sched_process_exit&quot;
            ftrace_events: &quot;sched/sched_process_free&quot;
            ftrace_events: &quot;task/task_newtask&quot;
            ftrace_events: &quot;task/task_rename&quot;
        }
    }
}
duration_ms: 10000

EOF</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="cpu-frequency-and-idle-states" tabindex="-1"><a class="header-anchor" href="#cpu-frequency-and-idle-states" aria-hidden="true">#</a> CPU frequency and idle states</h4><p>Records cpu frequency and idle state changes via ftrace and sysfs</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.sys_stats&quot;
        sys_stats_config {
            cpufreq_period_ms: 1000
        }
    }
}
data_sources: {
    config {
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;power/cpu_frequency&quot;
            ftrace_events: &quot;power/cpu_idle&quot;
            ftrace_events: &quot;power/suspend_resume&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="syscalls" tabindex="-1"><a class="header-anchor" href="#syscalls" aria-hidden="true">#</a> Syscalls</h4><p>Tracks the enter and exit of all syscalls. On Android requires a userdebug or eng build.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;raw_syscalls/sys_enter&quot;
            ftrace_events: &quot;raw_syscalls/sys_exit&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="gpu" tabindex="-1"><a class="header-anchor" href="#gpu" aria-hidden="true">#</a> GPU</h3><h4 id="gpu-frequency" tabindex="-1"><a class="header-anchor" href="#gpu-frequency" aria-hidden="true">#</a> GPU frequency</h4><p>Records gpu frequency via ftrace</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;power/gpu_frequency&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="gpu-memory" tabindex="-1"><a class="header-anchor" href="#gpu-memory" aria-hidden="true">#</a> GPU memory</h4><p>Allows to track per process and global total GPU memory usages. (Available on recent Android 12+ kernels)</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.gpu.memory&quot;
    }
}
data_sources: {
    config {
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;gpu_mem/gpu_mem_total&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="power" tabindex="-1"><a class="header-anchor" href="#power" aria-hidden="true">#</a> Power</h3><h4 id="battery-drain-power-rails" tabindex="-1"><a class="header-anchor" href="#battery-drain-power-rails" aria-hidden="true">#</a> Battery drain &amp; power rails</h4><p>Polls charge counters and instantaneous power draw from the battery power management IC and the power rails from the PowerStats HAL</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.power&quot;
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

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="board-voltages-frequencies" tabindex="-1"><a class="header-anchor" href="#board-voltages-frequencies" aria-hidden="true">#</a> Board voltages &amp; frequencies</h4><p>Tracks voltage and frequency changes from board sensors</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;regulator/regulator_set_voltage&quot;
            ftrace_events: &quot;regulator/regulator_set_voltage_complete&quot;
            ftrace_events: &quot;power/clock_enable&quot;
            ftrace_events: &quot;power/clock_disable&quot;
            ftrace_events: &quot;power/clock_set_rate&quot;
            ftrace_events: &quot;power/suspend_resume&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="memory" tabindex="-1"><a class="header-anchor" href="#memory" aria-hidden="true">#</a> Memory</h3><h4 id="native-heap-profiling" tabindex="-1"><a class="header-anchor" href="#native-heap-profiling" aria-hidden="true">#</a> Native heap profiling</h4><p>Track native heap allocations &amp; deallocations of an Android process. (Available on Android 10+)</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.heapprofd&quot;
        target_buffer: 0
        heapprofd_config {
            sampling_interval_bytes: 4096
            shmem_size_bytes: 8388608
            block_client: true
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="java-heap-dumps" tabindex="-1"><a class="header-anchor" href="#java-heap-dumps" aria-hidden="true">#</a> Java heap dumps</h4><p>Dump information about the Java object graph of an Android app. (Available on Android 11+)</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.java_hprof&quot;
        target_buffer: 0
        java_hprof_config {
            continuous_dump_config {
                dump_interval_ms: 1000
            }
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="kernel-meminfo" tabindex="-1"><a class="header-anchor" href="#kernel-meminfo" aria-hidden="true">#</a> Kernel meminfo</h4><p>Polling of /proc/meminfo</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.sys_stats&quot;
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

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="high-frequency-memory-events" tabindex="-1"><a class="header-anchor" href="#high-frequency-memory-events" aria-hidden="true">#</a> High-frequency memory events</h4><p>Allows to track short memory spikes and transitories through ftrace&#39;s mm_event, rss_stat and ion events. Available only on recent Android Q+ kernels</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.process_stats&quot;
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;mm_event/mm_event_record&quot;
            ftrace_events: &quot;kmem/rss_stat&quot;
            ftrace_events: &quot;ion/ion_stat&quot;
            ftrace_events: &quot;dmabuf_heap/dma_heap_stat&quot;
            ftrace_events: &quot;kmem/ion_heap_grow&quot;
            ftrace_events: &quot;kmem/ion_heap_shrink&quot;
            ftrace_events: &quot;sched/sched_process_exit&quot;
            ftrace_events: &quot;sched/sched_process_free&quot;
            ftrace_events: &quot;task/task_newtask&quot;
            ftrace_events: &quot;task/task_rename&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="low-memory-killer" tabindex="-1"><a class="header-anchor" href="#low-memory-killer" aria-hidden="true">#</a> Low memory killer</h4><p>Record LMK events. Works both with the old in-kernel LMK and the newer userspace lmkd. It also tracks OOM score adjustments.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.process_stats&quot;
        target_buffer: 1
        process_stats_config {
            scan_all_processes_on_start: true
        }
    }
}
data_sources: {
    config {
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;lowmemorykiller/lowmemory_kill&quot;
            ftrace_events: &quot;oom/oom_score_adj_update&quot;
            ftrace_events: &quot;ftrace/print&quot;
            atrace_apps: &quot;lmkd&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="per-process-stats" tabindex="-1"><a class="header-anchor" href="#per-process-stats" aria-hidden="true">#</a> Per process stats</h4><p>Periodically samples all processes in the system tracking: their thread list, memory counters (RSS, swap and other /proc/status counters) and oom_score_adj.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.process_stats&quot;
        target_buffer: 1
        process_stats_config {
            proc_stats_poll_ms: 1000
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="virtual-memory-stats" tabindex="-1"><a class="header-anchor" href="#virtual-memory-stats" aria-hidden="true">#</a> Virtual memory stats</h4><p>Periodically polls virtual memory stats from /proc/vmstat. Allows to gather statistics about swap, eviction, compression and pagecache efficiency</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.sys_stats&quot;
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

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="android-apps-svcs" tabindex="-1"><a class="header-anchor" href="#android-apps-svcs" aria-hidden="true">#</a> Android apps &amp; svcs</h3><h4 id="atrace-userspace-annotations-enables-c-java-codebase-annotations-atrace-begin-os-trace" tabindex="-1"><a class="header-anchor" href="#atrace-userspace-annotations-enables-c-java-codebase-annotations-atrace-begin-os-trace" aria-hidden="true">#</a> Atrace userspace annotations: Enables C++ / Java codebase annotations (ATRACE_BEGIN() / os.Trace())</h4><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;ftrace/print&quot;
            atrace_apps: &quot;*&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;ftrace/print&quot;
            atrace_categories: &quot;am&quot;
            atrace_categories: &quot;adb&quot;
            atrace_categories: &quot;aidl&quot;
            atrace_categories: &quot;dalvik&quot;
            atrace_categories: &quot;audio&quot;
            atrace_categories: &quot;binder_lock&quot;
            atrace_categories: &quot;binder_driver&quot;
            atrace_categories: &quot;bionic&quot;
            atrace_categories: &quot;camera&quot;
            atrace_categories: &quot;database&quot;
            atrace_categories: &quot;gfx&quot;
            atrace_categories: &quot;hal&quot;
            atrace_categories: &quot;input&quot;
            atrace_categories: &quot;network&quot;
            atrace_categories: &quot;nnapi&quot;
            atrace_categories: &quot;pm&quot;
            atrace_categories: &quot;power&quot;
            atrace_categories: &quot;rs&quot;
            atrace_categories: &quot;res&quot;
            atrace_categories: &quot;rro&quot;
            atrace_categories: &quot;sm&quot;
            atrace_categories: &quot;ss&quot;
            atrace_categories: &quot;vibrator&quot;
            atrace_categories: &quot;video&quot;
            atrace_categories: &quot;view&quot;
            atrace_categories: &quot;webview&quot;
            atrace_apps: &quot;*&quot;
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="event-log-logcat" tabindex="-1"><a class="header-anchor" href="#event-log-logcat" aria-hidden="true">#</a> Event log (logcat)</h4><p>Streams the event log into the trace. If no buffer filter is specified, all buffers are selected.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.log&quot;
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

EOF</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="frame-timeline" tabindex="-1"><a class="header-anchor" href="#frame-timeline" aria-hidden="true">#</a> Frame timeline</h4><p>Records expected/actual frame timings from surface_flinger. Requires Android 12 (S) or above.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.surfaceflinger.frametimeline&quot;
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="game-intervention-list" tabindex="-1"><a class="header-anchor" href="#game-intervention-list" aria-hidden="true">#</a> Game intervention list</h4><p>List game modes and interventions. Requires Android 13 (T) or above.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;android.game_interventions&quot;
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="advanced-settings" tabindex="-1"><a class="header-anchor" href="#advanced-settings" aria-hidden="true">#</a> Advanced settings</h3><h4 id="advanced-ftrace-config" tabindex="-1"><a class="header-anchor" href="#advanced-ftrace-config" aria-hidden="true">#</a> Advanced ftrace config</h4><p>Enable individual events and tune the kernel-tracing (ftrace) module. The events enabled here are in addition to those from enabled by other probes.</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>adb shell perfetto <span class="token punctuation">\\</span>
  <span class="token parameter variable">-c</span> - <span class="token parameter variable">--txt</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-o</span> /data/misc/perfetto-traces/trace <span class="token punctuation">\\</span>
<span class="token operator">&lt;&lt;</span><span class="token string">EOF

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
        name: &quot;linux.ftrace&quot;
        ftrace_config {
            ftrace_events: &quot;binder/*&quot;
            ftrace_events: &quot;block/*&quot;
            ftrace_events: &quot;clk/*&quot;
            ftrace_events: &quot;ext4/*&quot;
            ftrace_events: &quot;f2fs/*&quot;
            ftrace_events: &quot;fastrpc/*&quot;
            ftrace_events: &quot;i2c/*&quot;
            ftrace_events: &quot;irq/*&quot;
            ftrace_events: &quot;kmem/*&quot;
            ftrace_events: &quot;memory_bus/*&quot;
            ftrace_events: &quot;mmc/*&quot;
            ftrace_events: &quot;oom/*&quot;
            ftrace_events: &quot;power/*&quot;
            ftrace_events: &quot;regulator/*&quot;
            ftrace_events: &quot;sched/*&quot;
            ftrace_events: &quot;sync/*&quot;
            ftrace_events: &quot;task/*&quot;
            ftrace_events: &quot;vmscan/*&quot;
            ftrace_events: &quot;sched/sched_blocked_reason&quot;
            buffer_size_kb: 512
            drain_period_ms: 100
            symbolize_ksyms: true
        }
    }
}
duration_ms: 10000

EOF</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="recording-a-trace-recording-a-trace-through-the-cmdline" tabindex="-1"><a class="header-anchor" href="#recording-a-trace-recording-a-trace-through-the-cmdline" aria-hidden="true">#</a> Recording a trace - Recording a trace through the cmdline</h2><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>curl -O https://raw.githubusercontent.com/google/perfetto/master/tools/record_android_trace
python3 record_android_trace -o trace_file.perfetto-trace -t 10s -b 32mb sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code> <span class="token comment"># python3 .\\record_android_trace --list</span>
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
        <span class="token function">sync</span> - Synchronization
       workq - Kernel Workqueues
  memreclaim - Kernel Memory Reclaim
  regulators - Voltage and Current Regulators
  binder_driver - Binder Kernel driver
  binder_lock - Binder global lock trace
   pagecache - Page cache
      memory - Memory
     thermal - Thermal event
         gfx - Graphics <span class="token punctuation">(</span>HAL<span class="token punctuation">)</span>
         ion - ION allocation <span class="token punctuation">(</span>HAL<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>full
python3 record_android_trace <span class="token parameter variable">-o</span> trace_file.perfetto-trace <span class="token parameter variable">-t</span> 10s <span class="token parameter variable">-b</span> 128mb gfx input view webview wm am sm audio video camera hal res dalvik r bionic power pm s database network adb vibrator aidl nnapi rro pdx sched irq i2c freq idle disk <span class="token function">sync</span> workq memreclaim regulators binder_driver binder_lock pagecache memory thermal gfx ion
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>commmon
python3 record_android_trace <span class="token parameter variable">-o</span> trace_file.perfetto-trace <span class="token parameter variable">-t</span> 10s <span class="token parameter variable">-b</span> 32mb sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-config line-numbers-mode" data-ext="config"><pre class="language-config"><code>buffers {
  size_kb: 102400
  fill_policy: RING_BUFFER
}

data_sources {
  config {
    name: &quot;linux.ftrace&quot;
    ftrace_config {
      # Enables specific system events tags.
      atrace_categories: &quot;am&quot;
      atrace_categories: &quot;pm&quot;

      # Enables events for a specific app.
      atrace_apps: &quot;com.google.android.apps.docs&quot;

      # Enables all events for all apps.
      atrace_apps: &quot;*&quot;
    }
  }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>./record_android_trace <span class="token parameter variable">-c</span> config.pbtx <span class="token parameter variable">-o</span> trace_file.perfetto-trace 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h1 id="reference" tabindex="-1"><a class="header-anchor" href="#reference" aria-hidden="true">#</a> Reference</h1><ul><li>https://juejin.cn/post/7119764025210044423</li><li>https://docs.kernel.org/trace/ftrace.html</li><li>https://perfetto.dev/docs/quickstart/android-tracing</li><li>https://perfetto.dev/docs/concepts/service-model</li><li>https://perfetto.dev/docs/reference/perfetto-cli</li><li>https://developer.android.com/studio/releases/platform-tools</li><li>https://perfetto.dev/docs/concepts/config</li></ul>`,86),d=[l];function r(t,c){return e(),s("div",null,d)}const u=n(a,[["render",r],["__file","perfetto-03-quickstart-record-traces-on-android.html.vue"]]);export{u as default};
