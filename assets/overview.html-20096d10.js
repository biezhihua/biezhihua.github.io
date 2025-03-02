import{_ as l,C as t,Y as r,Z as o,$ as e,a0 as s,a1 as a,a2 as i}from"./framework-301d0703.js";const p={},c=i(`<h1 id="simpleperf" tabindex="-1"><a class="header-anchor" href="#simpleperf" aria-hidden="true">#</a> simpleperf</h1><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>python .<span class="token punctuation">\\</span>app_profiler.py <span class="token parameter variable">-p</span> simpleperf.example.cpp <span class="token parameter variable">--ndk_path</span> D:<span class="token punctuation">\\</span>Android<span class="token punctuation">\\</span>sdk<span class="token punctuation">\\</span>ndk<span class="token punctuation">\\</span><span class="token number">25.2</span>.9519653
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>python .<span class="token punctuation">\\</span>report_html.py <span class="token parameter variable">--add_source_code</span> <span class="token parameter variable">--source_dirs</span> <span class="token punctuation">..</span><span class="token punctuation">\\</span>demo<span class="token punctuation">\\</span>SimpleperfExampleCpp<span class="token punctuation">\\</span> <span class="token parameter variable">--add_disassembly</span> <span class="token parameter variable">--ndk_path</span> D:<span class="token punctuation">\\</span>Android<span class="token punctuation">\\</span>sdk<span class="token punctuation">\\</span>ndk<span class="token punctuation">\\</span><span class="token number">25.2</span>.9519653
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>python .\\app_profiler.py -p simpleperf.example.cpp --ndk_path D:\\Android\\sdk\\ndk\\25.2.9519653 -r &quot;-e task-clock:u -f 1000 --duration 10 -g&quot; -lib ..\\demo\\SimpleperfExampleCpp\\
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="simpleperf-record" tabindex="-1"><a class="header-anchor" href="#simpleperf-record" aria-hidden="true">#</a> simpleperf record</h2><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code> <span class="token comment"># adb shell</span>
emu64xa:/ <span class="token comment"># simpleperf help record</span>
Usage: simpleperf record <span class="token punctuation">[</span>options<span class="token punctuation">]</span> <span class="token punctuation">[</span>--<span class="token punctuation">]</span> <span class="token punctuation">[</span>command <span class="token punctuation">[</span>command-args<span class="token punctuation">]</span><span class="token punctuation">]</span>
       Gather sampling information of running <span class="token punctuation">[</span>command<span class="token punctuation">]</span>. And -a/-p/-t option
       can be used to change target of sampling information.
       The default options are: <span class="token parameter variable">-e</span> cpu-cycles <span class="token parameter variable">-f</span> <span class="token number">4000</span> <span class="token parameter variable">-o</span> perf.data.
Select monitored threads:
<span class="token parameter variable">-a</span>     System-wide collection. Use with --exclude-perf to exclude samples <span class="token keyword">for</span>
       simpleperf process.
<span class="token parameter variable">--app</span> package_name    Profile the process of an Android application.
                      On non-rooted devices, the app must be debuggable,
                      because we use run-as to switch to the app<span class="token string">&#39;s context.
-p pid1,pid2,...       Record events on existing processes. Mutually exclusive
                       with -a.
-t tid1,tid2,... Record events on existing threads. Mutually exclusive with -a.

Select monitored event types:
-e event1[:modifier1],event2[:modifier2],...
             Select a list of events to record. An event can be:
               1) an event name listed in \`simpleperf list\`;
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
                 Similar to &quot;-c 1 -e sched:sched_switch&quot;.
--kprobe kprobe_event1,kprobe_event2,...
             Add kprobe events during recording. The kprobe_event format is in
             Documentation/trace/kprobetrace.rst in the kernel. Examples:
               &#39;</span>p:myprobe do_sys_open <span class="token variable">$arg2</span>:string<span class="token string">&#39;   - add event kprobes:myprobe
               &#39;</span>r:myretprobe do_sys_open <span class="token variable">$retval</span>:s64<span class="token string">&#39; - add event kprobes:myretprobe
--add-counter event1,event2,...     Add additional event counts in record samples. For example,
                                    we can use \`-e cpu-cycles --add-counter instructions\` to
                                    get samples for cpu-cycles event, while having instructions
                                    event count for each sample.

Select monitoring options:
-f freq      Set event sample frequency. It means recording at most [freq]
             samples every second. For non-tracepoint events, the default
             option is -f 4000. A -f/-c option affects all event types
             following it until meeting another -f/-c option. For example,
             for &quot;-f 1000 cpu-cycles -c 1 -e sched:sched_switch&quot;, cpu-cycles
             has sample freq 1000, sched:sched_switch event has sample period 1.
-c count     Set event sample period. It means recording one sample when
             [count] events happen. For tracepoint events, the default option
             is -c 1.
--call-graph fp | dwarf[,&lt;dump_stack_size&gt;]
             Enable call graph recording. Use frame pointer or dwarf debug
             frame as the method to parse call graph in stack.
             Default is dwarf,65528.
-g           Same as &#39;</span>--call-graph dwarf<span class="token string">&#39;.
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
-b           Enable taken branch stack sampling. Same as &#39;</span><span class="token parameter variable">-j</span> any<span class="token string">&#39;.
-m mmap_pages   Set the size of the buffer used to receiving sample data from
                the kernel. It should be a power of 2. If not set, the max
                possible value &lt;= 1024 will be used.
--aux-buffer-size &lt;buffer_size&gt;  Set aux buffer size, only used in cs-etm event type.
                                 Need to be power of 2 and page size aligned.
                                 Used memory size is (buffer_size * (cpu_count + 1).
                                 Default is 4M.
--no-inherit  Don&#39;</span>t record created child threads/processes.
--cpu-percent <span class="token operator">&lt;</span>percent<span class="token operator">&gt;</span>  Set the max percent of cpu <span class="token function">time</span> used <span class="token keyword">for</span> recording.
                         percent is <span class="token keyword">in</span> range <span class="token punctuation">[</span><span class="token number">1</span>-100<span class="token punctuation">]</span>, default is <span class="token number">25</span>.
--addr-filter filter_str1,filter_str2,<span class="token punctuation">..</span>.
                Provide address filters <span class="token keyword">for</span> cs-etm instruction tracing.
                filter_str accepts below formats:
                  <span class="token string">&#39;filter  &lt;addr-range&gt;&#39;</span>  -- trace instructions <span class="token keyword">in</span> a range
                  <span class="token string">&#39;start &lt;addr&gt;&#39;</span>          -- start tracing when <span class="token function">ip</span> is <span class="token operator">&lt;</span>addr<span class="token operator">&gt;</span>
                  <span class="token string">&#39;stop &lt;addr&gt;&#39;</span>           -- stop tracing when <span class="token function">ip</span> is <span class="token operator">&lt;</span>addr<span class="token operator">&gt;</span>
                <span class="token operator">&lt;</span>addr-range<span class="token operator">&gt;</span> accepts below formats:
                  <span class="token operator">&lt;</span>file_path<span class="token operator">&gt;</span>                            -- code sections <span class="token keyword">in</span> a binary <span class="token function">file</span>
                  <span class="token operator">&lt;</span>vaddr_start<span class="token operator">&gt;</span>-<span class="token operator">&lt;</span>vaddr_end<span class="token operator">&gt;</span>@<span class="token operator">&lt;</span>file_path<span class="token operator">&gt;</span>  -- part of a binary <span class="token function">file</span>
                  <span class="token operator">&lt;</span>kernel_addr_start<span class="token operator">&gt;</span>-<span class="token operator">&lt;</span>kernel_addr_end<span class="token operator">&gt;</span>  -- part of kernel space
                <span class="token operator">&lt;</span>addr<span class="token operator">&gt;</span> accepts below formats:
                  <span class="token operator">&lt;</span>vaddr<span class="token operator">&gt;</span>@<span class="token operator">&lt;</span>file_path<span class="token operator">&gt;</span>      -- virtual addr <span class="token keyword">in</span> a binary <span class="token function">file</span>
                  <span class="token operator">&lt;</span>kernel_addr<span class="token operator">&gt;</span>            -- a kernel address
                Examples:
                  <span class="token string">&#39;filter 0x456-0x480@/system/lib/libc.so&#39;</span>
                  <span class="token string">&#39;start 0x456@/system/lib/libc.so,stop 0x480@/system/lib/libc.so&#39;</span>

--tp-filter filter_string    Set filter_string <span class="token keyword">for</span> the previous tracepoint event.
                             Format is <span class="token keyword">in</span> Documentation/trace/events.rst <span class="token keyword">in</span> the kernel.
                             An example: <span class="token string">&#39;prev_comm != &quot;simpleperf&quot; &amp;&amp; (prev_pid &gt; 1)&#39;</span><span class="token builtin class-name">.</span>

Dwarf unwinding options:
--post-unwind<span class="token operator">=</span><span class="token punctuation">(</span>yes<span class="token operator">|</span>no<span class="token punctuation">)</span> If <span class="token variable"><span class="token variable">\`</span>--call-graph dwarf<span class="token variable">\`</span></span> option is used, <span class="token keyword">then</span> the user<span class="token string">&#39;s
                       stack will be recorded in perf.data and unwound while
                       recording by default. Use --post-unwind=yes to switch
                       to unwind after recording.
--no-unwind   If \`--call-graph dwarf\` option is used, then the user&#39;</span>s stack
              will be unwound by default. Use this option to disable the
              unwinding of the user<span class="token string">&#39;s stack.
--no-callchain-joiner  If \`--call-graph dwarf\` option is used, then by default
                       callchain joiner is used to break the 64k stack limit
                       and build more complete call graphs. However, the built
                       call graphs may not be correct in all cases.
--callchain-joiner-min-matching-nodes count
               When callchain joiner is used, set the matched nodes needed to join
               callchains. The count should be &gt;= 1. By default it is 1.
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
--no-dump-kernel-symbols  Don&#39;</span>t dump kernel symbols <span class="token keyword">in</span> perf.data. By default
                          kernel symbols will be dumped when needed.
--no-dump-symbols       Don<span class="token string">&#39;t dump symbols in perf.data. By default symbols are
                        dumped in perf.data, to support reporting in another
                        environment.
-o record_file_name    Set record file name, default is perf.data.
--size-limit SIZE[K|M|G]      Stop recording after SIZE bytes of records.
                              Default is unlimited.
--symfs &lt;dir&gt;    Look for files with symbols relative to this directory.
                 This option is used to provide files with symbol table and
                 debug information, which are used for unwinding and dumping symbols.
--add-meta-info key=value     Add extra meta info, which will be stored in the recording file.

Other options:
--exit-with-parent            Stop recording when the thread starting simpleperf dies.
--use-cmd-exit-code           Exit with the same exit code as the monitored cmdline.
--start_profiling_fd fd_no    After starting profiling, write &quot;STARTED&quot; to
                              &lt;fd_no&gt;, then close &lt;fd_no&gt;.
--stdio-controls-profiling    Use stdin/stdout to pause/resume profiling.
--in-app                      We are already running in the app&#39;</span>s context.
--tracepoint-events file_name   Read tracepoint events from <span class="token punctuation">[</span>file_name<span class="token punctuation">]</span> instead of tracefs.
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="如何给android机器设置频点-将频点设置到min-freq" tabindex="-1"><a class="header-anchor" href="#如何给android机器设置频点-将频点设置到min-freq" aria-hidden="true">#</a> 如何给Android机器设置频点，将频点设置到min freq</h3><p>要将 Android 设备的 CPU 频率设置为最低频率，请遵循以下步骤：</p><p><strong>注意</strong>：您需要具有 root 权限才能修改 CPU 频率。这些步骤可能对设备产生负面影响。请谨慎操作。</p><ol><li><p>首先，您需要启用设备的 USB 调试功能。转到 &quot;设置&quot; &gt; &quot;关于手机&quot;，然后连续点击 &quot;版本号&quot; 7 次以启用 &quot;开发者选项&quot;。返回 &quot;设置&quot; &gt; &quot;开发者选项&quot;，找到 &quot;USB 调试&quot; 并启用它。</p></li><li><p>将设备连接到计算机，确保已安装 ADB 工具。您可以从 Android SDK 或单独下载并安装 ADB。在计算机上打开终端或命令提示符，运行 <code>adb devices</code> 以确保您的设备已连接并识别。</p></li><li><p>使用 ADB shell 进入设备，运行以下命令：</p><p><code>adb shell</code></p></li><li><p>为了查找当前可用的 CPU 频率，请运行以下命令：</p><p>bash</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token function">cat</span> /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_frequencies
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>这将为第一个 CPU 核心显示可用的频率。您可以通过更改 <code>cpu0</code> 为 <code>cpu1</code>、<code>cpu2</code> 等来查看其他 CPU 核心的频率。</p></li><li><p>找到最低频率。通常，最低频率将是 <code>scaling_available_frequencies</code> 输出的第一个值。</p></li><li><p>要将设备的 CPU 频率设置为最低频率，您需要修改每个 CPU 核心的 <code>scaling_min_freq</code> 文件。假设最低频率为 <code>300000</code>（单位为 KHz），请运行以下命令：</p><p>bash</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token keyword">for</span> <span class="token for-or-select variable">i</span> <span class="token keyword">in</span> <span class="token variable"><span class="token variable">\`</span><span class="token function">seq</span> <span class="token number">0</span> <span class="token number">3</span><span class="token variable">\`</span></span><span class="token punctuation">;</span> <span class="token keyword">do</span> <span class="token builtin class-name">echo</span> <span class="token number">300000</span> <span class="token operator">|</span> <span class="token function">su</span> <span class="token parameter variable">-c</span> <span class="token string">&#39;tee /sys/devices/system/cpu/cpu\${i}/cpufreq/scaling_min_freq&#39;</span><span class="token punctuation">;</span> <span class="token keyword">done</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>这将设置前四个 CPU 核心的最低频率。如果您的设备有更多核心，请相应地调整 <code>seq 0 3</code> 的范围。</p></li><li><p>要将当前频率设置为最低频率，还需要修改 <code>scaling_max_freq</code> 文件，以防止 CPU 超过最低频率：</p><p>bash</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token keyword">for</span> <span class="token for-or-select variable">i</span> <span class="token keyword">in</span> <span class="token variable"><span class="token variable">\`</span><span class="token function">seq</span> <span class="token number">0</span> <span class="token number">3</span><span class="token variable">\`</span></span><span class="token punctuation">;</span> <span class="token keyword">do</span> <span class="token builtin class-name">echo</span> <span class="token number">300000</span> <span class="token operator">|</span> <span class="token function">su</span> <span class="token parameter variable">-c</span> <span class="token string">&#39;tee /sys/devices/system/cpu/cpu\${i}/cpufreq/scaling_max_freq&#39;</span><span class="token punctuation">;</span> <span class="token keyword">done</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div></li></ol><p>现在，您已将 Android 设备的 CPU 频率设置为最低频率。请注意，这可能会导致设备性能降低。要恢复正常的 CPU 频率设置，您可以重启设备，或者手动将 <code>scaling_min_freq</code> 和 <code>scaling_max_freq</code> 文件设置回它们的默认值。</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token keyword">for</span> <span class="token for-or-select variable">i</span> <span class="token keyword">in</span> <span class="token variable"><span class="token variable">\`</span><span class="token function">seq</span> <span class="token number">0</span> <span class="token number">3</span><span class="token variable">\`</span></span><span class="token punctuation">;</span> <span class="token keyword">do</span> <span class="token builtin class-name">echo</span> <span class="token number">1</span> <span class="token operator">&gt;</span> /sys/devices/system/cpu/cpu<span class="token variable">\${i}</span>/cpufreq/scaling_min_freq<span class="token punctuation">;</span> <span class="token keyword">done</span>
<span class="token keyword">for</span> <span class="token for-or-select variable">i</span> <span class="token keyword">in</span> <span class="token variable"><span class="token variable">\`</span><span class="token function">seq</span> <span class="token number">0</span> <span class="token number">3</span><span class="token variable">\`</span></span><span class="token punctuation">;</span> <span class="token keyword">do</span> <span class="token builtin class-name">echo</span> <span class="token number">1</span> <span class="token operator">&gt;</span> /sys/devices/system/cpu/cpu<span class="token variable">\${i}</span>/cpufreq/scaling_max_freq<span class="token punctuation">;</span> <span class="token keyword">done</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="请详细介绍cpufreq目录下的文件和作用" tabindex="-1"><a class="header-anchor" href="#请详细介绍cpufreq目录下的文件和作用" aria-hidden="true">#</a> 请详细介绍cpufreq目录下的文件和作用</h3><p><code>/sys/devices/system/cpu/cpuX/cpufreq/</code> 目录包含了与 CPU 频率调节相关的一些文件。这些文件通常用于查看或修改 CPU 频率。在此目录中，<code>X</code> 表示 CPU 核心的编号（例如：cpu0、cpu1 等）。</p><p>以下是 <code>/sys/devices/system/cpu/cpuX/cpufreq/</code> 目录下一些主要文件及其作用：</p><ol><li><p><strong>scaling_cur_freq</strong>：此文件包含当前 CPU 频率（以 KHz 为单位）。只读文件。</p></li><li><p><strong>scaling_available_frequencies</strong>：此文件列出了 CPU 支持的所有可用频率（以 KHz 为单位）。只读文件。</p></li><li><p><strong>scaling_available_governors</strong>：此文件列出了可用的 CPU 调频策略（频率调节器）。只读文件。</p></li><li><p><strong>scaling_governor</strong>：此文件包含当前使用的 CPU 调频策略。您可以修改此文件以更改调频策略。常见的策略有：<code>performance</code>、<code>powersave</code>、<code>ondemand</code>、<code>conservative</code> 和 <code>userspace</code>。</p></li><li><p><strong>scaling_min_freq</strong>：此文件包含当前设置的最低 CPU 频率（以 KHz 为单位）。您可以修改此文件以更改最低频率。</p></li><li><p><strong>scaling_max_freq</strong>：此文件包含当前设置的最高 CPU 频率（以 KHz 为单位）。您可以修改此文件以更改最高频率。</p></li><li><p><strong>cpuinfo_min_freq</strong>：此文件包含硬件支持的最低 CPU 频率（以 KHz 为单位）。只读文件。</p></li><li><p><strong>cpuinfo_max_freq</strong>：此文件包含硬件支持的最高 CPU 频率（以 KHz 为单位）。只读文件。</p></li><li><p><strong>affected_cpus</strong>：此文件包含受当前 CPU 频率调节影响的所有 CPU 核心。只读文件。</p></li><li><p><strong>related_cpus</strong>：此文件包含与当前 CPU 核心在同一频率域的其他 CPU 核心。只读文件。</p></li><li><p><strong>stats/time_in_state</strong>：此文件显示 CPU 在每个支持的频率下运行的累积时间（以 ms 为单位）。只读文件。</p></li></ol><p>请注意，不同的设备可能有不同的文件和结构。以上提到的文件适用于大多数设备。有时，某些设备可能会有其他特定文件。</p><h3 id="转换perf-data为perf-trace" tabindex="-1"><a class="header-anchor" href="#转换perf-data为perf-trace" aria-hidden="true">#</a> 转换perf.data为perf.trace</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>def collect_profiling_data<span class="token punctuation">(</span>self<span class="token punctuation">)</span>:
        self.adb.check_run_and_return_output<span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token string">&#39;pull&#39;</span>, <span class="token string">&#39;/data/local/tmp/perf.data&#39;</span>,
                                              self.args.perf_data_path<span class="token punctuation">]</span><span class="token punctuation">)</span>
        <span class="token keyword">if</span> not self.args.skip_collect_binaries:
            binary_cache_args <span class="token operator">=</span> <span class="token punctuation">[</span>sys.executable,
                                 os.path.join<span class="token punctuation">(</span>get_script_dir<span class="token punctuation">(</span><span class="token punctuation">)</span>, <span class="token string">&#39;binary_cache_builder.py&#39;</span><span class="token punctuation">)</span><span class="token punctuation">]</span>
            binary_cache_args <span class="token operator">+=</span> <span class="token punctuation">[</span><span class="token string">&#39;-i&#39;</span>, self.args.perf_data_path, <span class="token string">&#39;--log&#39;</span>, self.args.log<span class="token punctuation">]</span>
            <span class="token keyword">if</span> self.args.native_lib_dir:
                binary_cache_args <span class="token operator">+=</span> <span class="token punctuation">[</span><span class="token string">&#39;-lib&#39;</span>, self.args.native_lib_dir<span class="token punctuation">]</span>
            <span class="token keyword">if</span> self.args.disable_adb_root:
                binary_cache_args <span class="token operator">+=</span> <span class="token punctuation">[</span><span class="token string">&#39;--disable_adb_root&#39;</span><span class="token punctuation">]</span>
            <span class="token keyword">if</span> self.args.ndk_path:
                binary_cache_args <span class="token operator">+=</span> <span class="token punctuation">[</span><span class="token string">&#39;--ndk_path&#39;</span>, self.args.ndk_path<span class="token punctuation">]</span>
            subprocess.check_call<span class="token punctuation">(</span>binary_cache_args<span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>simpleperf report-sample <span class="token parameter variable">--protobuf</span> --show-callchain <span class="token parameter variable">-i</span> perf.data <span class="token parameter variable">-o</span> perf.trace
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">\\</span>simpleperf<span class="token punctuation">\\</span>bin<span class="token punctuation">\\</span>windows<span class="token punctuation">\\</span>x86_64
<span class="token punctuation">\\</span>simpleperf<span class="token punctuation">\\</span>bin<span class="token punctuation">\\</span>windows<span class="token punctuation">\\</span>x86_64<span class="token punctuation">\\</span>simpleperf.exe report-sample --show-callchain <span class="token parameter variable">--protobuf</span> <span class="token parameter variable">-i</span> perf.data <span class="token parameter variable">-o</span> perf.trace
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="转换perf-data为firefox-profiler" tabindex="-1"><a class="header-anchor" href="#转换perf-data为firefox-profiler" aria-hidden="true">#</a> 转换perf.data为Firefox Profiler</h3>`,22),d={href:"https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/view_the_profile.md",target:"_blank",rel:"noopener noreferrer"},u=i(`<div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>python .<span class="token punctuation">\\</span>app_profiler.py <span class="token parameter variable">-np</span> surfaceflinger <span class="token parameter variable">-r</span> <span class="token string">&quot;-g -f 100000 --call-graph dwarf --duration 60&quot;</span>  <span class="token parameter variable">--ndk_path</span> D:<span class="token punctuation">\\</span>Android<span class="token punctuation">\\</span>sdk<span class="token punctuation">\\</span>ndk<span class="token punctuation">\\</span><span class="token number">25.2</span>.9519653
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>python .<span class="token punctuation">\\</span>gecko_profile_generator.py <span class="token parameter variable">-i</span> .<span class="token punctuation">\\</span>perf.data <span class="token operator">&gt;</span> gecko_profile.json
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code> <span class="token function">gzip</span> .<span class="token punctuation">\\</span>gecko_profile.json
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="reference" tabindex="-1"><a class="header-anchor" href="#reference" aria-hidden="true">#</a> Reference</h2>`,4),m={href:"https://developer.android.google.cn/ndk/guides/simpleperf?hl=zh-cn",target:"_blank",rel:"noopener noreferrer"},v={href:"https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/README.md",target:"_blank",rel:"noopener noreferrer"},b={href:"https://android.googlesource.com/platform/system/extras/+/master/simpleperf/",target:"_blank",rel:"noopener noreferrer"},f={href:"https://community.chocolatey.org/packages/python/3.9.0",target:"_blank",rel:"noopener noreferrer"},k={href:"https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/android_platform_profiling.md",target:"_blank",rel:"noopener noreferrer"},h={href:"https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/scripts_reference.md",target:"_blank",rel:"noopener noreferrer"},g={href:"https://blog.csdn.net/zhenwenxian/article/details/6196943",target:"_blank",rel:"noopener noreferrer"},_={href:"http://luzexi.com/2020/11/13/%E5%AE%89%E5%8D%93%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96%E5%B7%A5%E5%85%B7Simpleperf%E8%AF%A6%E8%A7%A3",target:"_blank",rel:"noopener noreferrer"};function y(w,x){const n=t("ExternalLinkIcon");return r(),o("div",null,[c,e("p",null,[e("a",d,[s("https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/view_the_profile.md"),a(n)])]),u,e("ul",null,[e("li",null,[e("a",m,[s("https://developer.android.google.cn/ndk/guides/simpleperf?hl=zh-cn"),a(n)])]),e("li",null,[e("a",v,[s("https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/README.md"),a(n)])]),e("li",null,[e("a",b,[s("https://android.googlesource.com/platform/system/extras/+/master/simpleperf/"),a(n)])]),e("li",null,[e("a",f,[s("https://community.chocolatey.org/packages/python/3.9.0"),a(n)])]),e("li",null,[e("a",k,[s("https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/android_platform_profiling.md"),a(n)])]),e("li",null,[e("a",h,[s("https://android.googlesource.com/platform/system/extras/+/master/simpleperf/doc/scripts_reference.md"),a(n)])]),e("li",null,[e("a",g,[s("https://blog.csdn.net/zhenwenxian/article/details/6196943"),a(n)])]),e("li",null,[e("a",_,[s("http://luzexi.com/2020/11/13/安卓性能优化工具Simpleperf详解"),a(n)])])])])}const U=l(p,[["render",y],["__file","overview.html.vue"]]);export{U as default};
