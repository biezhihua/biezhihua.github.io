---
article: false
---

# simpleperf

```shell
python .\app_profiler.py -p simpleperf.example.cpp --ndk_path D:\Android\sdk\ndk\25.2.9519653
```

```bash
python .\report_html.py --add_source_code --source_dirs ..\demo\SimpleperfExampleCpp\ --add_disassembly --ndk_path D:\Android\sdk\ndk\25.2.9519653
```

```
python .\app_profiler.py -p simpleperf.example.cpp --ndk_path D:\Android\sdk\ndk\25.2.9519653 -r "-e task-clock:u -f 1000 --duration 10 -g" -lib ..\demo\SimpleperfExampleCpp\
```

## simpleperf record

```bash
 # adb shell
emu64xa:/ # simpleperf help record
Usage: simpleperf record [options] [--] [command [command-args]]
       Gather sampling information of running [command]. And -a/-p/-t option
       can be used to change target of sampling information.
       The default options are: -e cpu-cycles -f 4000 -o perf.data.
Select monitored threads:
-a     System-wide collection. Use with --exclude-perf to exclude samples for
       simpleperf process.
--app package_name    Profile the process of an Android application.
                      On non-rooted devices, the app must be debuggable,
                      because we use run-as to switch to the app's context.
-p pid1,pid2,...       Record events on existing processes. Mutually exclusive
                       with -a.
-t tid1,tid2,... Record events on existing threads. Mutually exclusive with -a.

Select monitored event types:
-e event1[:modifier1],event2[:modifier2],...
             Select a list of events to record. An event can be:
               1) an event name listed in `simpleperf list`;
               2) a raw PMU event in rN format. N is a hex number.
                  For example, r1b selects event number 0x1b.
               3) a kprobe event added by --kprobe option.
             Modifiers can be added to define how the event should be
             monitored. Possible modifiers are:
                u - monitor user space events only
                k - monitor kernel space events only
--group event1[:modifier],event2[:modifier2],...
             Similar to -e option. But events specified in the same --group
             option are monitored as a group, and scheduled in and out at the
             same time.
--trace-offcpu   Generate samples when threads are scheduled off cpu.
                 Similar to "-c 1 -e sched:sched_switch".
--kprobe kprobe_event1,kprobe_event2,...
             Add kprobe events during recording. The kprobe_event format is in
             Documentation/trace/kprobetrace.rst in the kernel. Examples:
               'p:myprobe do_sys_open $arg2:string'   - add event kprobes:myprobe
               'r:myretprobe do_sys_open $retval:s64' - add event kprobes:myretprobe
--add-counter event1,event2,...     Add additional event counts in record samples. For example,
                                    we can use `-e cpu-cycles --add-counter instructions` to
                                    get samples for cpu-cycles event, while having instructions
                                    event count for each sample.

Select monitoring options:
-f freq      Set event sample frequency. It means recording at most [freq]
             samples every second. For non-tracepoint events, the default
             option is -f 4000. A -f/-c option affects all event types
             following it until meeting another -f/-c option. For example,
             for "-f 1000 cpu-cycles -c 1 -e sched:sched_switch", cpu-cycles
             has sample freq 1000, sched:sched_switch event has sample period 1.
-c count     Set event sample period. It means recording one sample when
             [count] events happen. For tracepoint events, the default option
             is -c 1.
--call-graph fp | dwarf[,<dump_stack_size>]
             Enable call graph recording. Use frame pointer or dwarf debug
             frame as the method to parse call graph in stack.
             Default is dwarf,65528.
-g           Same as '--call-graph dwarf'.
--clockid clock_id      Generate timestamps of samples using selected clock.
                        Possible values are: realtime, monotonic,
                        monotonic_raw, boottime, perf. If supported, default
                        is monotonic, otherwise is perf.
--cpu cpu_item1,cpu_item2,...
             Collect samples only on the selected cpus. cpu_item can be cpu
             number like 1, or cpu range like 0-3.
--duration time_in_sec  Monitor for time_in_sec seconds instead of running
                        [command]. Here time_in_sec may be any positive
                        floating point number.
-j branch_filter1,branch_filter2,...
             Enable taken branch stack sampling. Each sample captures a series
             of consecutive taken branches.
             The following filters are defined:
                any: any type of branch
                any_call: any function call or system call
                any_ret: any function return or system call return
                ind_call: any indirect branch
                u: only when the branch target is at the user level
                k: only when the branch target is in the kernel
             This option requires at least one branch type among any, any_call,
             any_ret, ind_call.
-b           Enable taken branch stack sampling. Same as '-j any'.
-m mmap_pages   Set the size of the buffer used to receiving sample data from
                the kernel. It should be a power of 2. If not set, the max
                possible value <= 1024 will be used.
--aux-buffer-size <buffer_size>  Set aux buffer size, only used in cs-etm event type.
                                 Need to be power of 2 and page size aligned.
                                 Used memory size is (buffer_size * (cpu_count + 1).
                                 Default is 4M.
--no-inherit  Don't record created child threads/processes.
--cpu-percent <percent>  Set the max percent of cpu time used for recording.
                         percent is in range [1-100], default is 25.
--addr-filter filter_str1,filter_str2,...
                Provide address filters for cs-etm instruction tracing.
                filter_str accepts below formats:
                  'filter  <addr-range>'  -- trace instructions in a range
                  'start <addr>'          -- start tracing when ip is <addr>
                  'stop <addr>'           -- stop tracing when ip is <addr>
                <addr-range> accepts below formats:
                  <file_path>                            -- code sections in a binary file
                  <vaddr_start>-<vaddr_end>@<file_path>  -- part of a binary file
                  <kernel_addr_start>-<kernel_addr_end>  -- part of kernel space
                <addr> accepts below formats:
                  <vaddr>@<file_path>      -- virtual addr in a binary file
                  <kernel_addr>            -- a kernel address
                Examples:
                  'filter 0x456-0x480@/system/lib/libc.so'
                  'start 0x456@/system/lib/libc.so,stop 0x480@/system/lib/libc.so'

--tp-filter filter_string    Set filter_string for the previous tracepoint event.
                             Format is in Documentation/trace/events.rst in the kernel.
                             An example: 'prev_comm != "simpleperf" && (prev_pid > 1)'.

Dwarf unwinding options:
--post-unwind=(yes|no) If `--call-graph dwarf` option is used, then the user's
                       stack will be recorded in perf.data and unwound while
                       recording by default. Use --post-unwind=yes to switch
                       to unwind after recording.
--no-unwind   If `--call-graph dwarf` option is used, then the user's stack
              will be unwound by default. Use this option to disable the
              unwinding of the user's stack.
--no-callchain-joiner  If `--call-graph dwarf` option is used, then by default
                       callchain joiner is used to break the 64k stack limit
                       and build more complete call graphs. However, the built
                       call graphs may not be correct in all cases.
--callchain-joiner-min-matching-nodes count
               When callchain joiner is used, set the matched nodes needed to join
               callchains. The count should be >= 1. By default it is 1.
--no-cut-samples   Simpleperf uses a record buffer to cache records received from the kernel.
                   When the available space in the buffer reaches low level, it cuts part of
                   the stack data in samples. When the available space reaches critical level,
                   it drops all samples. This option makes simpleperf not cut samples when the
                   available space reaches low level.
--keep-failed-unwinding-result        Keep reasons for failed unwinding cases
--keep-failed-unwinding-debug-info    Keep debug info for failed unwinding cases

Sample filter options:
--exclude-perf                Exclude samples for simpleperf process.
--exclude-pid pid1,pid2,...   Exclude samples for selected processes.
--exclude-tid tid1,tid2,...   Exclude samples for selected threads.
--exclude-process-name process_name_regex   Exclude samples for processes with name
                                            containing the regular expression.
--exclude-thread-name thread_name_regex     Exclude samples for threads with name containing
                                            the regular expression.
--exclude-uid uid1,uid2,...   Exclude samples for processes belonging to selected uids.
--include-pid pid1,pid2,...   Include samples for selected processes.
--include-tid tid1,tid2,...   Include samples for selected threads.
--include-process-name process_name_regex   Include samples for processes with name
                                            containing the regular expression.
--include-thread-name thread_name_regex     Include samples for threads with name containing
                                            the regular expression.
--include-uid uid1,uid2,...   Include samples for processes belonging to selected uids.

Recording file options:
--no-dump-kernel-symbols  Don't dump kernel symbols in perf.data. By default
                          kernel symbols will be dumped when needed.
--no-dump-symbols       Don't dump symbols in perf.data. By default symbols are
                        dumped in perf.data, to support reporting in another
                        environment.
-o record_file_name    Set record file name, default is perf.data.
--size-limit SIZE[K|M|G]      Stop recording after SIZE bytes of records.
                              Default is unlimited.
--symfs <dir>    Look for files with symbols relative to this directory.
                 This option is used to provide files with symbol table and
                 debug information, which are used for unwinding and dumping symbols.
--add-meta-info key=value     Add extra meta info, which will be stored in the recording file.

Other options:
--exit-with-parent            Stop recording when the thread starting simpleperf dies.
--use-cmd-exit-code           Exit with the same exit code as the monitored cmdline.
--start_profiling_fd fd_no    After starting profiling, write "STARTED" to
                              <fd_no>, then close <fd_no>.
--stdio-controls-profiling    Use stdin/stdout to pause/resume profiling.
--in-app                      We are already running in the app's context.
--tracepoint-events file_name   Read tracepoint events from [file_name] instead of tracefs.
```

### 如何给Android机器设置频点，将频点设置到min freq

要将 Android 设备的 CPU 频率设置为最低频率，请遵循以下步骤：

**注意**：您需要具有 root 权限才能修改 CPU 频率。这些步骤可能对设备产生负面影响。请谨慎操作。

1. 首先，您需要启用设备的 USB 调试功能。转到 "设置" > "关于手机"，然后连续点击 "版本号" 7 次以启用 "开发者选项"。返回 "设置" > "开发者选项"，找到 "USB 调试" 并启用它。

2. 将设备连接到计算机，确保已安装 ADB 工具。您可以从 Android SDK 或单独下载并安装 ADB。在计算机上打开终端或命令提示符，运行 `adb devices` 以确保您的设备已连接并识别。

3. 使用 ADB shell 进入设备，运行以下命令：

    `adb shell`

4. 为了查找当前可用的 CPU 频率，请运行以下命令：

    bash

    ```bash
    cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_frequencies
    ```

    这将为第一个 CPU 核心显示可用的频率。您可以通过更改 `cpu0` 为 `cpu1`、`cpu2` 等来查看其他 CPU 核心的频率。

5. 找到最低频率。通常，最低频率将是 `scaling_available_frequencies` 输出的第一个值。

6. 要将设备的 CPU 频率设置为最低频率，您需要修改每个 CPU 核心的 `scaling_min_freq` 文件。假设最低频率为 `300000`（单位为 KHz），请运行以下命令：

    bash

    ```bash
    for i in `seq 0 3`; do echo 300000 | su -c 'tee /sys/devices/system/cpu/cpu${i}/cpufreq/scaling_min_freq'; done
    ```

    这将设置前四个 CPU 核心的最低频率。如果您的设备有更多核心，请相应地调整 `seq 0 3` 的范围。

7. 要将当前频率设置为最低频率，还需要修改 `scaling_max_freq` 文件，以防止 CPU 超过最低频率：

    bash

    ```bash
    for i in `seq 0 3`; do echo 300000 | su -c 'tee /sys/devices/system/cpu/cpu${i}/cpufreq/scaling_max_freq'; done
    ```

现在，您已将 Android 设备的 CPU 频率设置为最低频率。请注意，这可能会导致设备性能降低。要恢复正常的 CPU 频率设置，您可以重启设备，或者手动将 `scaling_min_freq` 和 `scaling_max_freq` 文件设置回它们的默认值。

```bash
for i in `seq 0 3`; do echo 1 > /sys/devices/system/cpu/cpu${i}/cpufreq/scaling_min_freq; done
for i in `seq 0 3`; do echo 1 > /sys/devices/system/cpu/cpu${i}/cpufreq/scaling_max_freq; done
```

### 请详细介绍cpufreq目录下的文件和作用

`/sys/devices/system/cpu/cpuX/cpufreq/` 目录包含了与 CPU 频率调节相关的一些文件。这些文件通常用于查看或修改 CPU 频率。在此目录中，`X` 表示 CPU 核心的编号（例如：cpu0、cpu1 等）。

以下是 `/sys/devices/system/cpu/cpuX/cpufreq/` 目录下一些主要文件及其作用：

1. **scaling\_cur\_freq**：此文件包含当前 CPU 频率（以 KHz 为单位）。只读文件。

2. **scaling\_available\_frequencies**：此文件列出了 CPU 支持的所有可用频率（以 KHz 为单位）。只读文件。

3. **scaling\_available\_governors**：此文件列出了可用的 CPU 调频策略（频率调节器）。只读文件。

4. **scaling\_governor**：此文件包含当前使用的 CPU 调频策略。您可以修改此文件以更改调频策略。常见的策略有：`performance`、`powersave`、`ondemand`、`conservative` 和 `userspace`。

5. **scaling\_min\_freq**：此文件包含当前设置的最低 CPU 频率（以 KHz 为单位）。您可以修改此文件以更改最低频率。

6. **scaling\_max\_freq**：此文件包含当前设置的最高 CPU 频率（以 KHz 为单位）。您可以修改此文件以更改最高频率。

7. **cpuinfo\_min\_freq**：此文件包含硬件支持的最低 CPU 频率（以 KHz 为单位）。只读文件。

8. **cpuinfo\_max\_freq**：此文件包含硬件支持的最高 CPU 频率（以 KHz 为单位）。只读文件。

9. **affected\_cpus**：此文件包含受当前 CPU 频率调节影响的所有 CPU 核心。只读文件。

10. **related\_cpus**：此文件包含与当前 CPU 核心在同一频率域的其他 CPU 核心。只读文件。

11. **stats/time\_in\_state**：此文件显示 CPU 在每个支持的频率下运行的累积时间（以 ms 为单位）。只读文件。

请注意，不同的设备可能有不同的文件和结构。以上提到的文件适用于大多数设备。有时，某些设备可能会有其他特定文件。

### 转换perf.data为perf.trace

```bash
def collect_profiling_data(self):
        self.adb.check_run_and_return_output(['pull', '/data/local/tmp/perf.data',
                                              self.args.perf_data_path])
        if not self.args.skip_collect_binaries:
            binary_cache_args = [sys.executable,
                                 os.path.join(get_script_dir(), 'binary_cache_builder.py')]
            binary_cache_args += ['-i', self.args.perf_data_path, '--log', self.args.log]
            if self.args.native_lib_dir:
                binary_cache_args += ['-lib', self.args.native_lib_dir]
            if self.args.disable_adb_root:
                binary_cache_args += ['--disable_adb_root']
            if self.args.ndk_path:
                binary_cache_args += ['--ndk_path', self.args.ndk_path]
            subprocess.check_call(binary_cache_args)
```

```bash
simpleperf report-sample --protobuf --show-callchain -i perf.data -o perf.trace
```

```bash
\simpleperf\bin\windows\x86_64
\simpleperf\bin\windows\x86_64\simpleperf.exe report-sample --show-callchain --protobuf -i perf.data -o perf.trace
```

### 转换perf.data为Firefox Profiler

<https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/view_the_profile.md>

```bash
python .\app_profiler.py -np surfaceflinger -r "-g -f 100000 --call-graph dwarf --duration 60"  --ndk_path D:\Android\sdk\ndk\25.2.9519653
```

```bash
python .\gecko_profile_generator.py -i .\perf.data > gecko_profile.json
```

```bash
 gzip .\gecko_profile.json
```

## Reference

- <https://developer.android.google.cn/ndk/guides/simpleperf?hl=zh-cn>
- <https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/README.md>
- <https://android.googlesource.com/platform/system/extras/+/master/simpleperf/>
- <https://community.chocolatey.org/packages/python/3.9.0>
- <https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/android_platform_profiling.md>
- <https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/scripts_reference.md>
- <https://blog.csdn.net/zhenwenxian/article/details/6196943>
- <http://luzexi.com/2020/11/13/%E5%AE%89%E5%8D%93%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96%E5%B7%A5%E5%85%B7Simpleperf%E8%AF%A6%E8%A7%A3>
