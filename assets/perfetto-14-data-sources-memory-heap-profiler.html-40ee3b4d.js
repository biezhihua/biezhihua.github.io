import{_ as a,Y as e,Z as r,a2 as i}from"./framework-301d0703.js";const d={},n=i('<h1 id="perfetto-14-heap-profiler" tabindex="-1"><a class="header-anchor" href="#perfetto-14-heap-profiler" aria-hidden="true">#</a> Perfetto - 14 - Heap profiler</h1><h2 id="quickstart" tabindex="-1"><a class="header-anchor" href="#quickstart" aria-hidden="true">#</a> Quickstart</h2><h2 id="ui" tabindex="-1"><a class="header-anchor" href="#ui" aria-hidden="true">#</a> UI</h2><h2 id="sql" tabindex="-1"><a class="header-anchor" href="#sql" aria-hidden="true">#</a> SQL</h2><h2 id="recording" tabindex="-1"><a class="header-anchor" href="#recording" aria-hidden="true">#</a> Recording</h2><h2 id="viewing-the-data" tabindex="-1"><a class="header-anchor" href="#viewing-the-data" aria-hidden="true">#</a> Viewing the data</h2><h2 id="continuous-dumps" tabindex="-1"><a class="header-anchor" href="#continuous-dumps" aria-hidden="true">#</a> Continuous dumps</h2><h2 id="sampling-interval" tabindex="-1"><a class="header-anchor" href="#sampling-interval" aria-hidden="true">#</a> Sampling interval</h2><h2 id="startup-profiling" tabindex="-1"><a class="header-anchor" href="#startup-profiling" aria-hidden="true">#</a> Startup profiling</h2><h2 id="runtime-profiling" tabindex="-1"><a class="header-anchor" href="#runtime-profiling" aria-hidden="true">#</a> Runtime profiling</h2><h2 id="concurrent-profiling-sessions" tabindex="-1"><a class="header-anchor" href="#concurrent-profiling-sessions" aria-hidden="true">#</a> Concurrent profiling sessions</h2><h2 id="target-processes" tabindex="-1"><a class="header-anchor" href="#target-processes" aria-hidden="true">#</a> Target processes</h2><h2 id="java-heap-sampling" tabindex="-1"><a class="header-anchor" href="#java-heap-sampling" aria-hidden="true">#</a> Java heap sampling</h2><h2 id="deduped-frames" tabindex="-1"><a class="header-anchor" href="#deduped-frames" aria-hidden="true">#</a> DEDUPED frames</h2><h2 id="triggering-heap-snapshots-on-demand" tabindex="-1"><a class="header-anchor" href="#triggering-heap-snapshots-on-demand" aria-hidden="true">#</a> Triggering heap snapshots on demand</h2><h2 id="symbolization" tabindex="-1"><a class="header-anchor" href="#symbolization" aria-hidden="true">#</a> Symbolization</h2><h3 id="set-up-llvm-symbolizer" tabindex="-1"><a class="header-anchor" href="#set-up-llvm-symbolizer" aria-hidden="true">#</a> Set up llvm-symbolizer</h3><h3 id="symbolize-your-profile" tabindex="-1"><a class="header-anchor" href="#symbolize-your-profile" aria-hidden="true">#</a> Symbolize your profile</h3><h2 id="deobfuscation" tabindex="-1"><a class="header-anchor" href="#deobfuscation" aria-hidden="true">#</a> Deobfuscation</h2><h2 id="troubleshooting" tabindex="-1"><a class="header-anchor" href="#troubleshooting" aria-hidden="true">#</a> Troubleshooting</h2><h3 id="buffer-overrun" tabindex="-1"><a class="header-anchor" href="#buffer-overrun" aria-hidden="true">#</a> Buffer overrun</h3><h3 id="profile-is-empty" tabindex="-1"><a class="header-anchor" href="#profile-is-empty" aria-hidden="true">#</a> Profile is empty</h3><h3 id="implausible-callstacks" tabindex="-1"><a class="header-anchor" href="#implausible-callstacks" aria-hidden="true">#</a> Implausible callstacks</h3><h3 id="symbolization-could-not-find-library" tabindex="-1"><a class="header-anchor" href="#symbolization-could-not-find-library" aria-hidden="true">#</a> Symbolization: Could not find library</h3><h3 id="only-one-frame-shown" tabindex="-1"><a class="header-anchor" href="#only-one-frame-shown" aria-hidden="true">#</a> Only one frame shown</h3><h2 id="non-android-linux-support" tabindex="-1"><a class="header-anchor" href="#non-android-linux-support" aria-hidden="true">#</a> (non-Android) Linux support</h2><h2 id="known-issues" tabindex="-1"><a class="header-anchor" href="#known-issues" aria-hidden="true">#</a> Known Issues</h2><h3 id="android-13" tabindex="-1"><a class="header-anchor" href="#android-13" aria-hidden="true">#</a> Android 13</h3><h3 id="android-12" tabindex="-1"><a class="header-anchor" href="#android-12" aria-hidden="true">#</a> Android 12</h3><h3 id="android-11" tabindex="-1"><a class="header-anchor" href="#android-11" aria-hidden="true">#</a> Android 11</h3><h3 id="android-10" tabindex="-1"><a class="header-anchor" href="#android-10" aria-hidden="true">#</a> Android 10</h3><h2 id="heapprofd-vs-malloc-info-vs-rss" tabindex="-1"><a class="header-anchor" href="#heapprofd-vs-malloc-info-vs-rss" aria-hidden="true">#</a> Heapprofd vs malloc_info() vs RSS</h2><h2 id="convert-to-pprof" tabindex="-1"><a class="header-anchor" href="#convert-to-pprof" aria-hidden="true">#</a> Convert to pprof</h2><h2 id="example-sql-queries" tabindex="-1"><a class="header-anchor" href="#example-sql-queries" aria-hidden="true">#</a> Example SQL Queries</h2><h2 id="reference" tabindex="-1"><a class="header-anchor" href="#reference" aria-hidden="true">#</a> Reference</h2><ul><li>https://perfetto.dev/docs/data-sources/native-heap-profiler</li><li>https://perfetto.dev/docs/reference/heap_profile-cli</li></ul>',36),h=[n];function o(s,t){return e(),r("div",null,h)}const c=a(d,[["render",o],["__file","perfetto-14-data-sources-memory-heap-profiler.html.vue"]]);export{c as default};