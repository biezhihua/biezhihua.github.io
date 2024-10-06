import{_ as l,C as t,Y as d,Z as c,$ as e,a0 as n,a1 as a,a2 as i}from"./framework-301d0703.js";const r={},o=e("h1",{id:"android-问题排查-native-crash-problems",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#android-问题排查-native-crash-problems","aria-hidden":"true"},"#"),n(" Android | 问题排查 | Native Crash Problems")],-1),p=e("h2",{id:"关于native-crash的类型",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#关于native-crash的类型","aria-hidden":"true"},"#"),n(" 关于Native Crash的类型")],-1),u=e("p",null,"一般来说，在Android平台上，将出现在JNI、C++、C中的Crash称为Native Crash。",-1),v={href:"https://source.android.com/docs/core/tests/debug/native-crash",target:"_blank",rel:"noopener noreferrer"},b=i(`<ul><li>Abort</li><li>Pure null pointer dereference</li><li>Low-address null pointer dereference</li><li>FORTIFY failure</li><li>Stack corruption detected by -fstack-protector</li><li>Seccomp SIGSYS from a disallowed system call</li><li>Execute-only memory violation (Android 10 only)</li><li>Error detected by fdsan</li><li>Investigating crash dumps</li><li>Reading tombstones</li></ul><p>其中最为我们所熟知的就是<code>Pure null pointer dereference</code>空指针异常，它的Crash堆栈如下：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>pid: <span class="token number">25326</span>, tid: <span class="token number">25326</span>, name: crasher  <span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> crasher <span class="token operator">&lt;&lt;&lt;</span>
signal <span class="token number">11</span> <span class="token punctuation">(</span>SIGSEGV<span class="token punctuation">)</span>, code <span class="token number">1</span> <span class="token punctuation">(</span>SEGV_MAPERR<span class="token punctuation">)</span>, fault addr 0x0
    <span class="token punctuation">..</span><span class="token punctuation">..</span>

backtrace:
    <span class="token punctuation">..</span><span class="token punctuation">..</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>而<code>Pure null pointer dereference</code>类型的空指针异常实际上却是<code>Low-address null pointer dereference</code>类型空指针异常的一种特殊类型，它的Crash堆栈如下：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>pid: <span class="token number">25405</span>, tid: <span class="token number">25405</span>, name: crasher  <span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> crasher <span class="token operator">&lt;&lt;&lt;</span>
signal <span class="token number">11</span> <span class="token punctuation">(</span>SIGSEGV<span class="token punctuation">)</span>, code <span class="token number">1</span> <span class="token punctuation">(</span>SEGV_MAPERR<span class="token punctuation">)</span>, fault addr 0xc
    <span class="token punctuation">..</span><span class="token punctuation">..</span>

backtrace:
    <span class="token punctuation">..</span><span class="token punctuation">..</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>两者非常类似，仅有fault addr不同，这方面的差异Google文档中有详细说明，可自行查阅。</p><h2 id="识别错误类型" tabindex="-1"><a class="header-anchor" href="#识别错误类型" aria-hidden="true">#</a> 识别错误类型</h2><p>近期碰到了一例出现在GaiaX内的stretch.so的空指针异常，由于stretch.so是用rust编写和生成的so，与常规该问题的排查流程不太一致，所以这里记录一下本次的排查过程。</p><p>这里首先贴一下Crash信息，先做下基本的排查。</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>pid: <span class="token number">19586</span>, tid: <span class="token number">19586</span>  <span class="token operator">&gt;&gt;</span><span class="token operator">&gt;</span> com.xxx.xxx <span class="token operator">&lt;&lt;&lt;</span>
signal <span class="token number">11</span> <span class="token punctuation">(</span>SIGSEGV<span class="token punctuation">)</span>, code <span class="token number">1</span> <span class="token punctuation">(</span>SEGV_MAPERR<span class="token punctuation">)</span>, fault addr 000000000000009f
  x0   b4000071ed95cab0  x1   0000007fdd7b7104  x2   b4000071cd9f2890  x3   b40000713d9ef890
  x4   ffffffffffffffff  x5   00000070c3d53598  x6   0000000000000000  x7   0000000000000000
  x8   c56b08e9bbba74a6  x9   c56b08e9bbba74a6  x10  0000000000430000  x11  000000712d3fe40c
  x12  000000712d3fe454  x13  000000712d3fe49c  x14  000000712d3fe4fc  x15  0000000000000000
  x16  0000006fb694f37c  x17  0000000000000000  x18  00000000000000a0  x19  b40000729d95d7b0
  x20  0000000000000000  x21  b40000729d95d7b0  x22  00000073c4061000  x23  b40000729d95d868
  x24  000000711c779828  x25  00000073c4061000  x26  0000000000003c1d  x27  000000712d92e000
  x28  0000000000000000  x29  0000007fdd7b71e0  x30  00000070c2331a18
  sp   0000007fdd7b6fc0  pc   0000006fb694f388  pstate 0000000060001000
  v0   0000007fdd7b93700000000000000000  v1   00000000000000000000000000000000
  v2   00000000000000000000000000000000  v3   000000000000000000000000429e0000
  v4   00000000000000000000000000000000  v5   00000000000000000000000000000000
  v6   00000000000000000000000000000000  v7   00000000000000000000000000000000
  v8   00000000000000000000000000000000  v9   00000000000000000000000000000000
  v10  00000000000000000000000000000000  v11  00000000000000000000000000000000
  v12  00000000000000000000000000000000  v13  00000000000000000000000000000000
  v14  00000000000000000000000000000000  v15  00000000000000000000000000000000
  v16  000000000000000000000000418bc6a8  v17  00000000000000000000000043070000
  v18  00000000000000000000000000000000  v19  00000000000000000000000000000000
  v20  00000000000000000000000080000000  v21  00000000000000000000000080000000
  v22  00000000000000000000000000000000  v23  00000000000000000000000000000000
  v24  00000000000000000000000000000000  v25  00000000000000000000000000000000
  v26  00000000000000000000000000000000  v27  00000000000000000000000000000000
  v28  00000000000000000000000000000000  v29  00000000000000000000000000000000
  v30  00000000000000000000000000000000  v31  00000000000000000000000000000000
  fpsr 0800001b  fpcr 00000000
    <span class="token comment">#00 pc 0xf388 libstretch.so (Java_app_visly_stretch_Node_nSetStyle+12)</span>
    <span class="token comment">#01 pc 0xa14 base.odex</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>我们可以得出一些基础的信息：</p><ul><li>第2行，<code>signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 000000000000009f</code><ul><li>符合第三种错误类型<code>Low-address null pointer dereference</code>的描述，简单来说就是个空指针错误。</li></ul></li><li>第29行，<code>#00 pc 0xf388 libstretch.so (Java_app_visly_stretch_Node_nSetStyle+12)</code><ul><li>发生Crash的so名称 - <code>libstretch.so</code>。</li><li>发生Crash的方法名 - <code>Java_app_visly_stretch_Node_nSetStyle</code>。</li><li>发生Crash的错误地址(fault address) - <code>0xf388</code>。</li></ul></li></ul><h2 id="定位错误行数" tabindex="-1"><a class="header-anchor" href="#定位错误行数" aria-hidden="true">#</a> 定位错误行数</h2><h3 id="addr2line工具介绍" tabindex="-1"><a class="header-anchor" href="#addr2line工具介绍" aria-hidden="true">#</a> addr2line工具介绍</h3>`,14),m={href:"https://linux.die.net/man/1/addr2line",target:"_blank",rel:"noopener noreferrer"},h=i(`<p>它的常用命令为：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment"># addr2line - convert addresses into file names and line numbers.</span>
<span class="token comment"># -i --inlines If the address belongs to a function that was inlined, the source information for all enclosing scopes back to the first  non-inlined function will also be printed.</span>
<span class="token comment"># -C --demangle[=style] Decode (demangle) low-level symbol names into user-level names.</span>
<span class="token comment"># -f --functions Display function names as well as file and line number information.</span>
<span class="token comment"># -e --exe=filename Specify the name of the executable for which addresses should be translated.</span>
./addr2line <span class="token punctuation">[</span>-C<span class="token punctuation">]</span> <span class="token punctuation">[</span>-i<span class="token punctuation">]</span> <span class="token punctuation">[</span>-f<span class="token punctuation">]</span> <span class="token punctuation">[</span>-e filename<span class="token punctuation">]</span> <span class="token punctuation">[</span>addr<span class="token punctuation">]</span>
./addr2line <span class="token parameter variable">-C</span> <span class="token parameter variable">-i</span> <span class="token parameter variable">-f</span> <span class="token parameter variable">-e</span> ./xxx.so 0x0c
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>值得注意的，addr2line工具的目标so需要带有symbol符号信息，才能正确的显示出源码文件和行数。</p><p>对没有符号的so使用addr2line，结果示例：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>/aarch64-linux-android-addr2line <span class="token parameter variable">-i</span> <span class="token parameter variable">-C</span> <span class="token parameter variable">-f</span> <span class="token parameter variable">-e</span> ./libstretch.so  0xf388
Java_app_visly_stretch_Node_nSetStyle
:?
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>对有符号的so使用add2line，结果示例：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>./aarch64-linux-android-addr2line <span class="token parameter variable">-i</span> <span class="token parameter variable">-C</span> <span class="token parameter variable">-f</span> <span class="token parameter variable">-e</span> ./libstretch.so  0xf388
Java_app_visly_stretch_Node_nSetStyle
./GaiaX/GaiaXStretch/bindings/kotlin/stretch/src/main/rust/src/lib.rs:364
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="为stretch-so增加符号信息" tabindex="-1"><a class="header-anchor" href="#为stretch-so增加符号信息" aria-hidden="true">#</a> 为stretch.so增加符号信息</h3><p>根据addr2line的使用条件，需要为stretch.so增加符号信息。由于stretch.so是使用Rust打包出来的，所以为打包命令增加<code>RUSTFLAGS=-g</code>的标记，打包命令如下：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token assign-left variable">RUSTFLAGS</span><span class="token operator">=</span>-g   <span class="token function">cargo</span> build <span class="token parameter variable">--target</span><span class="token operator">=</span>aarch64-linux-android <span class="token parameter variable">--release</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div>`,10),k={href:"https://stackoverflow.com/questions/38803760/how-to-get-a-release-build-with-debugging-information-when-using-cargo",target:"_blank",rel:"noopener noreferrer"},f=i(`<h3 id="定位问题行数" tabindex="-1"><a class="header-anchor" href="#定位问题行数" aria-hidden="true">#</a> 定位问题行数</h3><p>通过使用addr2line和带有symbol的so，可以得到具体的错误行数：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>./aarch64-linux-android-addr2line <span class="token parameter variable">-i</span> <span class="token parameter variable">-C</span> <span class="token parameter variable">-f</span> <span class="token parameter variable">-e</span> ./libstretch.so  0xf388
Java_app_visly_stretch_Node_nSetStyle
./GaiaX/GaiaXStretch/bindings/kotlin/stretch/src/main/rust/src/lib.rs:364
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>具体错误代码为：</p><div class="language-Rust line-numbers-mode" data-ext="Rust"><pre class="language-Rust"><code>352 #[no_mangle]
353 pub unsafe extern &quot;C&quot; fn Java_app_visly_stretch_Node_nSetStyle(
354     _: JNIEnv,
355     _: JObject,
356     stretch: jlong,
357     node: jlong,
358     style: jlong,
359 ) {
360     let style = Box::from_raw(style as *mut Style);
361     let mut stretch = Box::from_raw(stretch as *mut Stretch);
362     let node = Box::from_raw(node as *mut Node);
363 
364     stretch.set_style(*node, *style).unwrap();
365 
366     Box::leak(style);
367     Box::leak(node);
368     Box::leak(stretch);
369 }
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以得知在364行为node设置style发生空指针异常，其根源就是*style引用有问题：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>364     stretch.set_style(*node, *style).unwrap();
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h2 id="问题修复" tabindex="-1"><a class="header-anchor" href="#问题修复" aria-hidden="true">#</a> 问题修复</h2><p>通过上下文推断可以知道是<code>style</code>的引用传递有问题。反推到Java层，可以得知在<code>setStyle</code>函数中未对<code>style.rustptr</code>做合法性判断：</p><p>错误代码：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>fun setStyle(style: Style) {
    synchronized(Stretch::class.java) {
        // 未对style.rustptr做合法性判断
        nSetStyle(Stretch.ptr, rustptr, style.rustptr)
        this.style = style
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>修复代码：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>fun safeSetStyle(style: Style): Boolean {
    synchronized(Stretch::class.java) {
        // 对style.rustptr做合法性判断
        if (rustptr != -1L &amp;&amp; style.rustptr != -1L) {
            nSetStyle(Stretch.ptr, rustptr, style.rustptr)
            this.style = style
            return true
        } else {
            return false
        }
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="问题验证" tabindex="-1"><a class="header-anchor" href="#问题验证" aria-hidden="true">#</a> 问题验证</h2><p>当我们完成代码修复后工作后，别忘记还有最重要的一个步骤，就是问题的验证。</p><p>问题的验证分为多种类型，我们这里选择一劳永逸的方式：<strong>在单元测试中复现错误，验证修复结果，并将单元测试加入到自动化测试中</strong>。</p><p>如此一来此问题就再也不会出现在我们的项目中了。</p><p>测试用例如下：</p><div class="language-kotlin line-numbers-mode" data-ext="kt"><pre class="language-kotlin"><code><span class="token annotation builtin">@Test</span>
<span class="token keyword">fun</span> <span class="token function">node_set_style_null_pointer</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Stretch<span class="token punctuation">.</span><span class="token function">init</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

    <span class="token keyword">val</span> style1 <span class="token operator">=</span> <span class="token function">Style</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    style1<span class="token punctuation">.</span><span class="token function">safeInit</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">val</span> node <span class="token operator">=</span> <span class="token function">Node</span><span class="token punctuation">(</span><span class="token string-literal singleline"><span class="token string">&quot;node&quot;</span></span><span class="token punctuation">,</span> style1<span class="token punctuation">)</span>

    <span class="token keyword">val</span> style2 <span class="token operator">=</span> <span class="token function">Style</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    style2<span class="token punctuation">.</span><span class="token function">safeInit</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    style2<span class="token punctuation">.</span><span class="token function">safeFree</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

    <span class="token comment">// 复现问题场景，设置已经释放的style</span>
    <span class="token keyword">val</span> safeSetStyle <span class="token operator">=</span> node<span class="token punctuation">.</span><span class="token function">safeSetStyle</span><span class="token punctuation">(</span>style2<span class="token punctuation">)</span>

    <span class="token comment">// 验证safeSetStyle是否执行成功</span>
    Assert<span class="token punctuation">.</span><span class="token function">assertEquals</span><span class="token punctuation">(</span><span class="token boolean">false</span><span class="token punctuation">,</span> safeSetStyle<span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>当我们使用未修复的代码执行该单元测试时，会在logcat中发现如下错误，它的关键信息和在真实App出现的Crash几乎一模一样，这就代表完美复现了正式环境中的错误：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>A  Build fingerprint: &#39;Android/sdk_phone_x86/generic_x86:11/RSR1.210210.001.A1/7193139:userdebug/dev-keys&#39;
A  Revision: &#39;0&#39;
A  ABI: &#39;x86&#39;
A  Timestamp: 2023-03-09 14:30:34+0800
A  pid: 27566, tid: 27588, name: roidJUnitRunner  &gt;&gt;&gt; com.alibaba.gaiax.test &lt;&lt;&lt;
A  uid: 10127
A  signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xffffffff
A      eax ffffffff  ebx c6f35f54  ecx 000000d4  edx c7154bb8
A      edi c7154bb8  esi 00000000
A      ebp 00000000  esp c7154b70  eip f5fdf3cb
A  backtrace:
A        #00 pc 000563cb  /apex/com.android.runtime/lib/bionic/libc.so (memmove_generic+219) (BuildId: 6e3a0180fa6637b68c0d181c343e6806)
A        #01 pc 0000d80e  /data/app/~~YUo3uOKA7Gzgqd3nfNHytA==/com.alibaba.gaiax.test-JJGLuWJRiWwhUZw00pvfKg==/lib/x86/libstretch.so (Java_app_visly_stretch_Node_nSetStyle+78)
A        #02 pc 001422b2  /apex/com.android.art/lib/libart.so (art_quick_generic_jni_trampoline+82) (BuildId: bf39832c4acabbc939d5c516b6f1d211)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>最后，当我们使用修复过的代码执行该单元测试时，它会正常通过。</p><h2 id="引用" tabindex="-1"><a class="header-anchor" href="#引用" aria-hidden="true">#</a> 引用</h2><ul><li>https://github.com/alibaba/GaiaX/pull/358</li><li>https://stackoverflow.com/questions/38803760/how-to-get-a-release-build-with-debugging-information-when-using-cargo</li><li>https://linux.die.net/man/1/addr2line</li><li>https://source.android.com/docs/core/tests/debug/native-crash</li><li>https://www.cnblogs.com/rocket-ban/p/14717425.html</li><li>https://blog.csdn.net/toyauko/article/details/82416429</li></ul>`,24);function g(x,_){const s=t("ExternalLinkIcon");return d(),c("div",null,[o,p,u,e("p",null,[n("Google官方将"),e("a",v,[n("NativeCrash"),a(s)]),n("分类多种类型，并列举了经常碰到的10种：")]),b,e("p",null,[n("这里要先介绍一款工具 - "),e("a",m,[n("addr2line"),a(s)]),n("，它能显示一个地址的源码文件名和行数，可以帮助我们定位Native Crash的错误行数。")]),h,e("p",null,[n("当然还有其他方法，可以参考"),e("a",k,[n("这里"),a(s)]),n("。")]),f])}const S=l(r,[["render",g],["__file","native-crash.html.vue"]]);export{S as default};
