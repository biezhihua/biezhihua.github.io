import{_ as e,Y as r,Z as a,a2 as i}from"./framework-301d0703.js";const s={},t=i('<h1 id="perfetto-28-trace-processor" tabindex="-1"><a class="header-anchor" href="#perfetto-28-trace-processor" aria-hidden="true">#</a> Perfetto - 28 - Trace Processor</h1><p>Trace Processor 是一个 C++ 库（/src/trace_processor），它可以接受以多种格式编码的跟踪，并提供 SQL 接口，以查询包含在一组一致表格中的跟踪事件。它还具有其他功能，包括计算摘要指标，使用用户友好的描述注释跟踪，并从跟踪内容中推导出新事件。</p><h2 id="introduction" tabindex="-1"><a class="header-anchor" href="#introduction" aria-hidden="true">#</a> Introduction</h2><h2 id="concepts" tabindex="-1"><a class="header-anchor" href="#concepts" aria-hidden="true">#</a> Concepts</h2><h3 id="events" tabindex="-1"><a class="header-anchor" href="#events" aria-hidden="true">#</a> Events</h3><p>在最一般的意义上，跟踪只是带有时间戳的“事件”的集合。事件可以具有相关联的元数据和上下文，允许对事件进行解释和分析。</p><p>事件是跟踪处理器的基础，并且分为两种类型：切片和计数器。</p><h4 id="slices" tabindex="-1"><a class="header-anchor" href="#slices" aria-hidden="true">#</a> Slices</h4><p>切片是指具有一些数据描述的时间间隔，描述了该间隔内正在发生的事情。一些切片的例子包括：</p><ul><li>每个 CPU 的调度切片</li><li>Android 上的 Atrace 切片</li><li>来自 Chrome 的用户空间切片</li></ul><h4 id="counters" tabindex="-1"><a class="header-anchor" href="#counters" aria-hidden="true">#</a> Counters</h4><p>计数器是一种随时间变化的连续值。一些计数器的例子包括：</p><ul><li>每个 CPU 核心的 CPU 频率</li><li>来自内核和从 /proc/stats 轮询的 RSS 内存事件</li><li>Android 上的 atrace 计数器事件</li><li>Chrome 计数器事件</li></ul><h3 id="tracks" tabindex="-1"><a class="header-anchor" href="#tracks" aria-hidden="true">#</a> Tracks</h3><p>轨道是具有相同类型和相同关联上下文的事件的命名分区。例如：</p><p>每个 CPU 的调度切片都有一个轨道 每个发出事件的线程都有一个轨道同步用户空间切片 每个链接一组异步事件的“cookie”都有一个轨道</p><p>最直观的理解轨道的方式是想象它们在 UI 中如何绘制；如果所有事件都在同一行中，则它们属于同一轨道。例如，CPU 5 的所有调度事件都在同一个轨道上：</p><p>轨道可以根据它们包含的事件类型和它们关联的上下文类型分为各种类型。例如：</p><ul><li>全局轨道不与任何上下文关联并包含切片</li><li>线程轨道与单个线程关联并包含切片</li><li>计数器轨道不与任何上下文关联并包含计数器</li><li>CPU 计数器轨道与单个 CPU 关联并包含计数器</li></ul><h2 id="thread-and-process-identifiers" tabindex="-1"><a class="header-anchor" href="#thread-and-process-identifiers" aria-hidden="true">#</a> Thread and process identifiers</h2><h2 id="reference" tabindex="-1"><a class="header-anchor" href="#reference" aria-hidden="true">#</a> Reference</h2><ul><li>https://perfetto.dev/docs/analysis/trace-processor</li></ul>',22),c=[t];function d(n,o){return r(),a("div",null,c)}const l=e(s,[["render",d],["__file","perfetto-28-trace-analysis-trace-processor.html.vue"]]);export{l as default};