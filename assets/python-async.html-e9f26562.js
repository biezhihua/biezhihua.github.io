import{_ as a,Y as n,Z as s,a2 as e}from"./framework-301d0703.js";const o={},t=e(`<h1 id="python-async的原理" tabindex="-1"><a class="header-anchor" href="#python-async的原理" aria-hidden="true">#</a> python async的原理</h1><p>Python 的 <code>async</code> 和 <code>await</code> 关键字是用于编写异步代码的语法糖，使得异步编程更直观和可读。要理解它们的原理，需要深入了解以下几个核心概念：</p><ol><li><strong>协程（Coroutine）</strong></li><li><strong>事件循环（Event Loop）</strong></li><li><strong>任务（Task）和 Future 对象</strong></li><li><strong>可等待对象（Awaitable）</strong></li></ol><p>下面将详细解释这些概念及其在 Python 异步编程中的作用。</p><hr><h2 id="一、协程-coroutine" tabindex="-1"><a class="header-anchor" href="#一、协程-coroutine" aria-hidden="true">#</a> 一、协程（Coroutine）</h2><h3 id="_1-1-协程的定义" tabindex="-1"><a class="header-anchor" href="#_1-1-协程的定义" aria-hidden="true">#</a> 1.1 协程的定义</h3><p>协程是一种可以在执行过程中暂停并在未来某个时间恢复的函数。与传统函数不同，协程可以在暂停的地方继续执行，这使得它们非常适合于异步编程。</p><h3 id="_1-2-python-中的协程" tabindex="-1"><a class="header-anchor" href="#_1-2-python-中的协程" aria-hidden="true">#</a> 1.2 Python 中的协程</h3><p>在 Python 中，协程最初是通过生成器（generator）实现的，使用 <code>yield</code> 和 <code>yield from</code>。然而，从 Python 3.5 开始，引入了 <code>async def</code> 和 <code>await</code> 关键字，使得定义和使用协程更加直观。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">async</span> <span class="token keyword">def</span> <span class="token function">my_coroutine</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">await</span> some_async_operation<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><ul><li><strong><code>async def</code></strong>：定义一个协程函数。</li><li><strong><code>await</code></strong>：用于等待一个可等待对象的完成，如协程、<code>Future</code>、<code>Task</code> 等。</li></ul><h3 id="_1-3-协程的工作原理" tabindex="-1"><a class="header-anchor" href="#_1-3-协程的工作原理" aria-hidden="true">#</a> 1.3 协程的工作原理</h3><p>协程本质上是一个特殊的生成器对象，它遵循协程协议，实现了 <code>__await__()</code> 方法。当协程遇到 <code>await</code> 时，会暂停执行，等待被等待的对象完成后再继续。这种机制允许协程在 I/O 操作（如网络请求、文件读写）期间让出控制权，使得事件循环可以调度其他协程。</p><hr><h2 id="二、事件循环-event-loop" tabindex="-1"><a class="header-anchor" href="#二、事件循环-event-loop" aria-hidden="true">#</a> 二、事件循环（Event Loop）</h2><h3 id="_2-1-事件循环的概念" tabindex="-1"><a class="header-anchor" href="#_2-1-事件循环的概念" aria-hidden="true">#</a> 2.1 事件循环的概念</h3><p>事件循环是异步编程的核心，它不断地检查并运行待执行的任务。在 Python 的 <code>asyncio</code> 模块中，事件循环负责调度协程的执行。</p><h3 id="_2-2-事件循环的工作流程" tabindex="-1"><a class="header-anchor" href="#_2-2-事件循环的工作流程" aria-hidden="true">#</a> 2.2 事件循环的工作流程</h3><ol><li><strong>初始化</strong>：事件循环初始化时，维护一个任务队列。</li><li><strong>任务调度</strong>：从任务队列中取出可运行的任务（协程或 Future），并执行它们。</li><li><strong>处理 I/O</strong>：当任务等待 I/O 操作时，事件循环会暂时挂起该任务，切换到其他任务。</li><li><strong>任务完成</strong>：一旦 I/O 操作完成，事件循环会恢复挂起的任务，继续执行。</li></ol><h3 id="_2-3-事件循环的实现" tabindex="-1"><a class="header-anchor" href="#_2-3-事件循环的实现" aria-hidden="true">#</a> 2.3 事件循环的实现</h3><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> asyncio

loop <span class="token operator">=</span> asyncio<span class="token punctuation">.</span>get_event_loop<span class="token punctuation">(</span><span class="token punctuation">)</span>
loop<span class="token punctuation">.</span>run_until_complete<span class="token punctuation">(</span>main_coroutine<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
loop<span class="token punctuation">.</span>close<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li><code>get_event_loop()</code>：获取当前线程的事件循环。</li><li><code>run_until_complete()</code>：运行事件循环，直到指定的协程完成。</li></ul><hr><h2 id="三、任务-task-和-future-对象" tabindex="-1"><a class="header-anchor" href="#三、任务-task-和-future-对象" aria-hidden="true">#</a> 三、任务（Task）和 Future 对象</h2><h3 id="_3-1-future-对象" tabindex="-1"><a class="header-anchor" href="#_3-1-future-对象" aria-hidden="true">#</a> 3.1 Future 对象</h3><p><code>Future</code> 对象代表一个异步操作的最终结果，类似于占位符。协程在等待某个异步操作完成时，会返回一个 <code>Future</code> 对象。</p><h3 id="_3-2-task-对象" tabindex="-1"><a class="header-anchor" href="#_3-2-task-对象" aria-hidden="true">#</a> 3.2 Task 对象</h3><p><code>Task</code> 是 <code>Future</code> 的子类，用于将协程包装成可调度的任务，并将其加入事件循环中。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code>task <span class="token operator">=</span> asyncio<span class="token punctuation">.</span>create_task<span class="token punctuation">(</span>my_coroutine<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><ul><li><code>create_task()</code>：创建一个 <code>Task</code>，将协程包装起来，并安排其在事件循环中执行。</li></ul><h3 id="_3-3-task-的工作原理" tabindex="-1"><a class="header-anchor" href="#_3-3-task-的工作原理" aria-hidden="true">#</a> 3.3 Task 的工作原理</h3><ul><li><strong>调度执行</strong>：当创建一个 <code>Task</code> 时，事件循环会将其加入待执行任务列表。</li><li><strong>状态管理</strong>：<code>Task</code> 会跟踪协程的执行状态，如运行中、已完成、已取消等。</li><li><strong>结果获取</strong>：可以通过 <code>await task</code> 或 <code>task.result()</code> 来获取任务的执行结果。</li></ul><hr><h2 id="四、可等待对象-awaitable-和-await-关键字" tabindex="-1"><a class="header-anchor" href="#四、可等待对象-awaitable-和-await-关键字" aria-hidden="true">#</a> 四、可等待对象（Awaitable）和 <code>await</code> 关键字</h2><h3 id="_4-1-可等待对象" tabindex="-1"><a class="header-anchor" href="#_4-1-可等待对象" aria-hidden="true">#</a> 4.1 可等待对象</h3><p>在 Python 中，可等待对象是指可以在协程中使用 <code>await</code> 进行等待的对象，主要包括：</p><ul><li>协程对象</li><li><code>Task</code> 对象</li><li><code>Future</code> 对象</li></ul><h3 id="_4-2-await-的作用" tabindex="-1"><a class="header-anchor" href="#_4-2-await-的作用" aria-hidden="true">#</a> 4.2 <code>await</code> 的作用</h3><p><code>await</code> 关键字用于暂停协程的执行，等待可等待对象完成并返回结果。当协程遇到 <code>await</code> 时，它会将控制权交还给事件循环，事件循环可以调度其他协程运行。</p><h3 id="_4-3-await-的工作原理" tabindex="-1"><a class="header-anchor" href="#_4-3-await-的工作原理" aria-hidden="true">#</a> 4.3 <code>await</code> 的工作原理</h3><ul><li><strong>暂停协程</strong>：<code>await</code> 会暂停当前协程的执行，直到被等待的对象完成。</li><li><strong>恢复协程</strong>：一旦被等待的对象完成，事件循环会恢复协程的执行，从暂停的地方继续。</li></ul><hr><h2 id="五、协程的调度和执行" tabindex="-1"><a class="header-anchor" href="#五、协程的调度和执行" aria-hidden="true">#</a> 五、协程的调度和执行</h2><h3 id="_5-1-协程的生命周期" tabindex="-1"><a class="header-anchor" href="#_5-1-协程的生命周期" aria-hidden="true">#</a> 5.1 协程的生命周期</h3><ol><li><strong>创建</strong>：定义并创建协程对象。</li><li><strong>调度</strong>：将协程包装成 <code>Task</code>，并加入事件循环。</li><li><strong>执行</strong>：事件循环调度协程执行，协程可能会多次挂起和恢复。</li><li><strong>完成</strong>：协程执行完毕，返回结果或抛出异常。</li></ol><h3 id="_5-2-事件循环如何调度协程" tabindex="-1"><a class="header-anchor" href="#_5-2-事件循环如何调度协程" aria-hidden="true">#</a> 5.2 事件循环如何调度协程</h3><ul><li><strong>任务队列</strong>：事件循环维护一个任务队列，包含待执行的协程。</li><li><strong>I/O 事件</strong>：利用底层操作系统的异步 I/O 能力（如 epoll、kqueue），监听 I/O 事件的完成。</li><li><strong>回调函数</strong>：当 I/O 事件完成时，事件循环会调用相应的回调函数，恢复协程的执行。</li></ul><hr><h2 id="六、python-异步编程的演变" tabindex="-1"><a class="header-anchor" href="#六、python-异步编程的演变" aria-hidden="true">#</a> 六、Python 异步编程的演变</h2><h3 id="_6-1-基于生成器的协程" tabindex="-1"><a class="header-anchor" href="#_6-1-基于生成器的协程" aria-hidden="true">#</a> 6.1 基于生成器的协程</h3><p>在 Python 3.5 之前，异步编程主要使用生成器和装饰器来实现。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token decorator annotation punctuation">@asyncio<span class="token punctuation">.</span>coroutine</span>
<span class="token keyword">def</span> <span class="token function">my_coroutine</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">yield</span> <span class="token keyword">from</span> some_async_operation<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-2-原生协程" tabindex="-1"><a class="header-anchor" href="#_6-2-原生协程" aria-hidden="true">#</a> 6.2 原生协程</h3><p>从 Python 3.5 开始，引入了 <code>async</code> 和 <code>await</code> 关键字，提供了原生协程支持，语法更加简洁。</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">async</span> <span class="token keyword">def</span> <span class="token function">my_coroutine</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">await</span> some_async_operation<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-3-原生协程的优势" tabindex="-1"><a class="header-anchor" href="#_6-3-原生协程的优势" aria-hidden="true">#</a> 6.3 原生协程的优势</h3><ul><li><strong>性能提升</strong>：原生协程的执行速度更快。</li><li><strong>语法简洁</strong>：代码更易读，减少了装饰器和生成器的复杂性。</li><li><strong>类型检查</strong>：更好的类型检查和 IDE 支持。</li></ul><hr><h2 id="七、与多线程和多进程的区别" tabindex="-1"><a class="header-anchor" href="#七、与多线程和多进程的区别" aria-hidden="true">#</a> 七、与多线程和多进程的区别</h2><h3 id="_7-1-多线程" tabindex="-1"><a class="header-anchor" href="#_7-1-多线程" aria-hidden="true">#</a> 7.1 多线程</h3><ul><li><strong>特点</strong>：多个线程共享同一内存空间，可以并发执行，但在 Python 中受限于全局解释器锁（GIL）。</li><li><strong>适用场景</strong>：I/O 密集型任务。</li></ul><h3 id="_7-2-多进程" tabindex="-1"><a class="header-anchor" href="#_7-2-多进程" aria-hidden="true">#</a> 7.2 多进程</h3><ul><li><strong>特点</strong>：每个进程有独立的内存空间，可以真正并行执行。</li><li><strong>适用场景</strong>：CPU 密集型任务。</li></ul><h3 id="_7-3-异步协程" tabindex="-1"><a class="header-anchor" href="#_7-3-异步协程" aria-hidden="true">#</a> 7.3 异步协程</h3><ul><li><strong>特点</strong>：在单线程中通过协程实现并发，依赖于事件循环。</li><li><strong>适用场景</strong>：大量 I/O 操作、高并发连接，如网络服务器。</li></ul><h3 id="_7-4-区别总结" tabindex="-1"><a class="header-anchor" href="#_7-4-区别总结" aria-hidden="true">#</a> 7.4 区别总结</h3><ul><li><strong>资源消耗</strong>：协程比线程和进程更轻量级，创建和切换开销更小。</li><li><strong>执行方式</strong>：协程在用户空间由程序自行调度，线程和进程由操作系统调度。</li><li><strong>并行性</strong>：协程是并发的（单线程），线程和进程可以是并行的（多核）。</li></ul><hr><h2 id="八、示例-一步步解析异步代码的执行过程" tabindex="-1"><a class="header-anchor" href="#八、示例-一步步解析异步代码的执行过程" aria-hidden="true">#</a> 八、示例：一步步解析异步代码的执行过程</h2><h3 id="_8-1-代码示例" tabindex="-1"><a class="header-anchor" href="#_8-1-代码示例" aria-hidden="true">#</a> 8.1 代码示例</h3><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token keyword">import</span> asyncio

<span class="token keyword">async</span> <span class="token keyword">def</span> <span class="token function">fetch_data</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">&quot;开始获取数据&quot;</span><span class="token punctuation">)</span>
    <span class="token keyword">await</span> asyncio<span class="token punctuation">.</span>sleep<span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string">&quot;数据获取完成&quot;</span><span class="token punctuation">)</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span><span class="token string">&#39;data&#39;</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span>

<span class="token keyword">async</span> <span class="token keyword">def</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    data <span class="token operator">=</span> <span class="token keyword">await</span> fetch_data<span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">print</span><span class="token punctuation">(</span><span class="token string-interpolation"><span class="token string">f&quot;获取的数据：</span><span class="token interpolation"><span class="token punctuation">{</span>data<span class="token punctuation">}</span></span><span class="token string">&quot;</span></span><span class="token punctuation">)</span>

asyncio<span class="token punctuation">.</span>run<span class="token punctuation">(</span>main<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_8-2-执行过程解析" tabindex="-1"><a class="header-anchor" href="#_8-2-执行过程解析" aria-hidden="true">#</a> 8.2 执行过程解析</h3><ol><li><strong>创建事件循环</strong>：<code>asyncio.run(main())</code> 创建并运行一个事件循环。</li><li><strong>执行 <code>main</code> 协程</strong>：事件循环调度 <code>main</code> 协程的执行。</li><li><strong>调用 <code>fetch_data</code></strong>：<code>main</code> 协程中的 <code>await fetch_data()</code> 暂停 <code>main</code>，并调度 <code>fetch_data</code>。</li><li><strong>执行 <code>fetch_data</code></strong>： <ul><li>打印 <code>&quot;开始获取数据&quot;</code>。</li><li>遇到 <code>await asyncio.sleep(2)</code>，<code>fetch_data</code> 协程暂停，将控制权交还给事件循环。</li></ul></li><li><strong>等待期间</strong>：事件循环可以执行其他任务（如果有）。</li><li><strong>恢复执行</strong>： <ul><li>2 秒后，<code>asyncio.sleep(2)</code> 完成，<code>fetch_data</code> 协程恢复执行。</li><li>打印 <code>&quot;数据获取完成&quot;</code>，返回数据。</li></ul></li><li><strong>继续 <code>main</code> 协程</strong>： <ul><li><code>main</code> 协程接收到数据，打印 <code>&quot;获取的数据：{&#39;data&#39;: 1}&quot;</code>。</li></ul></li><li><strong>事件循环结束</strong>：所有协程执行完毕，事件循环关闭。</li></ol><hr><h2 id="九、结论" tabindex="-1"><a class="header-anchor" href="#九、结论" aria-hidden="true">#</a> 九、结论</h2><p>Python 的异步编程基于协程、事件循环和可等待对象，通过 <code>async</code> 和 <code>await</code> 关键字，使得异步代码的编写更加直观和高效。其核心原理在于：</p><ul><li><strong>协程</strong>：可以在执行过程中暂停和恢复的函数。</li><li><strong>事件循环</strong>：负责调度和管理协程的执行。</li><li><strong><code>await</code> 关键字</strong>：用于等待可等待对象的完成，协程在此时让出控制权。</li><li><strong>任务和 Future</strong>：用于包装协程，跟踪其执行状态。</li></ul><p>通过理解这些原理，您可以更深入地掌握 Python 异步编程的机制，编写出性能更高、响应更快的异步应用程序。</p>`,79),i=[t];function c(d,r){return n(),s("div",null,i)}const p=a(o,[["render",c],["__file","python-async.html.vue"]]);export{p as default};