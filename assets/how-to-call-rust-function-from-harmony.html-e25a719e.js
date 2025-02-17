import{_ as n,Y as s,Z as a,a2 as i}from"./framework-301d0703.js";const e={},l=i(`<h1 id="如何在harmony-native-c-项目中调用rust库代码" tabindex="-1"><a class="header-anchor" href="#如何在harmony-native-c-项目中调用rust库代码" aria-hidden="true">#</a> 如何在Harmony Native C++项目中调用Rust库代码</h1><h2 id="主机配置" tabindex="-1"><a class="header-anchor" href="#主机配置" aria-hidden="true">#</a> 主机配置</h2><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>MacBook Pro
2.6 GHz 6-Core Intel Core i7
13.1 (22C65)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="对rust库进行交叉编译得到可在harmonynext平台运行的产物" tabindex="-1"><a class="header-anchor" href="#对rust库进行交叉编译得到可在harmonynext平台运行的产物" aria-hidden="true">#</a> 对Rust库进行交叉编译得到可在HarmonyNext平台运行的产物</h2><h3 id="工程目录树" tabindex="-1"><a class="header-anchor" href="#工程目录树" aria-hidden="true">#</a> 工程目录树</h3><p>我的Rust工程文件目录树如下：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>./
├── .gitignore
├── Cargo.lock
├── Cargo.toml
├── aarch64-unknown-linux-ohos-clang++.sh
├── aarch64-unknown-linux-ohos-clang.sh
├── armv7-unknown-linux-ohos-clang++.sh
├── armv7-unknown-linux-ohos-clang.sh
├── config
├── src
│   └── lib.rs
├── x86_64-unknown-linux-ohos-clang++.sh
└── x86_64-unknown-linux-ohos-clang.sh

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="什么是交叉编译" tabindex="-1"><a class="header-anchor" href="#什么是交叉编译" aria-hidden="true">#</a> 什么是交叉编译</h3><p>介绍下“交叉编译”的概念 - 所谓&quot;交叉编译（Cross_Compile）&quot;，是指编译源代码的平台和执行源代码编译后程序的平台是两个不同的平台。比如，在Intel x86架构/Linux（Ubuntu）平台下、使用交叉编译工具链生成的可执行文件，在ARM架构/Linux下运行。</p><h3 id="交叉编译的前置配置工作" tabindex="-1"><a class="header-anchor" href="#交叉编译的前置配置工作" aria-hidden="true">#</a> 交叉编译的前置配置工作</h3><p>想要让Rust库在HarmonyNext平台上运行，那么第一件事便是要交叉编译得到其产物，这块Rust官方已经有了文档了。（https://doc.rust-lang.org/rustc/platform-support/openharmony.html）</p><p>在配置好OpenHarmonySDK的路径后，需要按照文档指引找个地方配置如下文件，我是在工程目录下配置的: <code>aarch64-unknown-linux-ohos-clang.sh</code></p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token shebang important">#!/bin/sh</span>
<span class="token builtin class-name">exec</span> /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang <span class="token punctuation">\\</span>
  <span class="token parameter variable">-target</span> aarch64-linux-ohos <span class="token punctuation">\\</span>
  <span class="token parameter variable">--sysroot</span><span class="token operator">=</span>/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot <span class="token punctuation">\\</span>
  <span class="token parameter variable">-D__MUSL__</span> <span class="token punctuation">\\</span>
  <span class="token string">&quot;<span class="token variable">$@</span>&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>aarch64-unknown-linux-ohos-clang++.sh</code></p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token shebang important">#!/bin/sh</span>
<span class="token builtin class-name">exec</span> /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang++ <span class="token punctuation">\\</span>
  <span class="token parameter variable">-target</span> aarch64-linux-ohos <span class="token punctuation">\\</span>
  <span class="token parameter variable">--sysroot</span><span class="token operator">=</span>/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot <span class="token punctuation">\\</span>
  <span class="token parameter variable">-D__MUSL__</span> <span class="token punctuation">\\</span>
  <span class="token string">&quot;<span class="token variable">$@</span>&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>armv7-unknown-linux-ohos-clang.sh</code></p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token shebang important">#!/bin/sh</span>
<span class="token builtin class-name">exec</span> /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang <span class="token punctuation">\\</span>
  <span class="token parameter variable">-target</span> arm-linux-ohos <span class="token punctuation">\\</span>
  <span class="token parameter variable">--sysroot</span><span class="token operator">=</span>/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot <span class="token punctuation">\\</span>
  <span class="token parameter variable">-D__MUSL__</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-march</span><span class="token operator">=</span>armv7-a <span class="token punctuation">\\</span>
  -mfloat-abi<span class="token operator">=</span>softfp <span class="token punctuation">\\</span>
  <span class="token parameter variable">-mtune</span><span class="token operator">=</span>generic-armv7-a <span class="token punctuation">\\</span>
  <span class="token parameter variable">-mthumb</span> <span class="token punctuation">\\</span>
  <span class="token string">&quot;<span class="token variable">$@</span>&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>armv7-unknown-linux-ohos-clang++.sh</code></p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token shebang important">#!/bin/sh</span>
<span class="token builtin class-name">exec</span> /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang++ <span class="token punctuation">\\</span>
  <span class="token parameter variable">-target</span> arm-linux-ohos <span class="token punctuation">\\</span>
  <span class="token parameter variable">--sysroot</span><span class="token operator">=</span>/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot <span class="token punctuation">\\</span>
  <span class="token parameter variable">-D__MUSL__</span> <span class="token punctuation">\\</span>
  <span class="token parameter variable">-march</span><span class="token operator">=</span>armv7-a <span class="token punctuation">\\</span>
  -mfloat-abi<span class="token operator">=</span>softfp <span class="token punctuation">\\</span>
  <span class="token parameter variable">-mtune</span><span class="token operator">=</span>generic-armv7-a <span class="token punctuation">\\</span>
  <span class="token parameter variable">-mthumb</span> <span class="token punctuation">\\</span>
  <span class="token string">&quot;<span class="token variable">$@</span>&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>x86_64-unknown-linux-ohos-clang.sh</code></p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token shebang important">#!/bin/sh</span>
<span class="token builtin class-name">exec</span> /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang <span class="token punctuation">\\</span>
  <span class="token parameter variable">-target</span> x86_64-linux-ohos <span class="token punctuation">\\</span>
  <span class="token parameter variable">--sysroot</span><span class="token operator">=</span>/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot <span class="token punctuation">\\</span>
  <span class="token parameter variable">-D__MUSL__</span> <span class="token punctuation">\\</span>
  <span class="token string">&quot;<span class="token variable">$@</span>&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>x86_64-unknown-linux-ohos-clang++.sh</code></p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token shebang important">#!/bin/sh</span>
<span class="token builtin class-name">exec</span> /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang++ <span class="token punctuation">\\</span>
  <span class="token parameter variable">-target</span> x86_64-linux-ohos <span class="token punctuation">\\</span>
  <span class="token parameter variable">--sysroot</span><span class="token operator">=</span>/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot <span class="token punctuation">\\</span>
  <span class="token parameter variable">-D__MUSL__</span> <span class="token punctuation">\\</span>
  <span class="token string">&quot;<span class="token variable">$@</span>&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再将下面的配置增加到<code>~/.cargo/config</code>文件中，如果文件不存在就创建一个：</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token punctuation">[</span>target.aarch64-unknown-linux-ohos<span class="token punctuation">]</span>
linker  <span class="token operator">=</span> <span class="token string">&quot;/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/aarch64-unknown-linux-ohos-clang.sh&quot;</span>
ar      <span class="token operator">=</span> <span class="token string">&quot;/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/llvm-ar&quot;</span>

<span class="token punctuation">[</span>target.armv7-unknown-linux-ohos<span class="token punctuation">]</span>
linker  <span class="token operator">=</span> <span class="token string">&quot;/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh&quot;</span>
ar      <span class="token operator">=</span> <span class="token string">&quot;/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/llvm-ar&quot;</span>


<span class="token punctuation">[</span>target.x86_64-unknown-linux-ohos<span class="token punctuation">]</span>
linker  <span class="token operator">=</span> <span class="token string">&quot;/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/x86_64-unknown-linux-ohos-clang.sh&quot;</span>
ar      <span class="token operator">=</span> <span class="token string">&quot;/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/llvm-ar&quot;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="将rustup切换到nightly版本上" tabindex="-1"><a class="header-anchor" href="#将rustup切换到nightly版本上" aria-hidden="true">#</a> 将rustup切换到nightly版本上</h3><p>由于rust的stable版本不支持OpenHaronmy的预编译产物，所以需要将rustup切换到nightly版本上。</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>$ rustup <span class="token parameter variable">-v</span>
rustup <span class="token number">1.26</span>.0 <span class="token punctuation">(</span>5af9b9484 <span class="token number">2023</span>-04-05<span class="token punctuation">)</span>
The Rust toolchain installer
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>rustup update stable
rustup default nightly
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>$ rustup default nightly
info: using existing install for &#39;nightly-x86_64-apple-darwin&#39;
info: default toolchain set to &#39;nightly-x86_64-apple-darwin&#39;

  nightly-x86_64-apple-darwin unchanged - rustc 1.75.0-nightly (49691b1f7 2023-10-16)

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>执行一下下面的命令，也会明确的告诉我们不支持目标平台，并且也给了我们提示，让我们利用<code>cargo build -Z build-std</code>进行编译:</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>rustup target <span class="token function">add</span> aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>$ rustup target add aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos

error: toolchain &#39;nightly-x86_64-apple-darwin&#39; does not contain component &#39;rust-std&#39; for target &#39;aarch64-unknown-linux-ohos&#39;
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using \`cargo build -Z build-std\` instead

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在开始交叉编译前，为<code>lib.rs</code>中增加两个简单的方法，需要注意目前仅支持将Rust代码通过FFI特性导出编译为C代码，C++是不支持的：</p><div class="language-rust line-numbers-mode" data-ext="rs"><pre class="language-rust"><code><span class="token attribute attr-name">#[no_mangle]</span>
<span class="token keyword">pub</span> <span class="token keyword">extern</span> <span class="token string">&quot;C&quot;</span> <span class="token keyword">fn</span> <span class="token function-definition function">hello_from_rust</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token macro property">println!</span><span class="token punctuation">(</span><span class="token string">&quot;Hello from Rust!&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token attribute attr-name">#[no_mangle]</span>
<span class="token keyword">pub</span> <span class="token keyword">extern</span> <span class="token string">&quot;C&quot;</span> <span class="token keyword">fn</span> <span class="token function-definition function">hello2_from_rust</span><span class="token punctuation">(</span>a<span class="token punctuation">:</span><span class="token keyword">i32</span><span class="token punctuation">,</span> b<span class="token punctuation">:</span><span class="token keyword">i32</span><span class="token punctuation">)</span><span class="token punctuation">-&gt;</span> <span class="token keyword">i32</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> a <span class="token operator">+</span> b<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>随后，我们在<code>Cargo.toml</code>中增加打包产物配置，下面的配置经过交叉编译会得到<code>libtest.so</code>的文件：</p><div class="language-rust line-numbers-mode" data-ext="rs"><pre class="language-rust"><code><span class="token punctuation">[</span>lib<span class="token punctuation">]</span>
name <span class="token operator">=</span> <span class="token string">&quot;test&quot;</span>
<span class="token keyword">crate</span><span class="token operator">-</span><span class="token keyword">type</span> <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token string">&quot;cdylib&quot;</span><span class="token punctuation">]</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="交叉编译" tabindex="-1"><a class="header-anchor" href="#交叉编译" aria-hidden="true">#</a> 交叉编译</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>$ <span class="token function">cargo</span> +nightly build  <span class="token parameter variable">-Z</span> build-std <span class="token parameter variable">--target</span> x86_64-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core<span class="token punctuation">)</span>
   Compiling libc v0.2.149
   Compiling cc v1.0.79
   Compiling memchr v2.5.0
   Compiling std v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std<span class="token punctuation">)</span>
   Compiling unwind v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind<span class="token punctuation">)</span>
   Compiling rustc-std-workspace-core v1.99.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core<span class="token punctuation">)</span>
   Compiling alloc v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc<span class="token punctuation">)</span>
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc<span class="token punctuation">)</span>
   Compiling panic_unwind v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind<span class="token punctuation">)</span>
   Compiling panic_abort v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort<span class="token punctuation">)</span>
   Compiling gimli v0.28.0
   Compiling miniz_oxide v0.7.1
   Compiling std_detect v0.1.5 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect<span class="token punctuation">)</span>
   Compiling hashbrown v0.14.0
   Compiling object v0.32.0
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro<span class="token punctuation">)</span>
   Compiling harmony v0.1.0 <span class="token punctuation">(</span>/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony<span class="token punctuation">)</span>
    Finished dev <span class="token punctuation">[</span>unoptimized + debuginfo<span class="token punctuation">]</span> target<span class="token punctuation">(</span>s<span class="token punctuation">)</span> <span class="token keyword">in</span> <span class="token number">56</span>.12s

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>$ <span class="token function">cargo</span> +nightly build  <span class="token parameter variable">-Z</span> build-std <span class="token parameter variable">--target</span> armv7-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core<span class="token punctuation">)</span>
   Compiling libc v0.2.149
   Compiling memchr v2.5.0
   Compiling unwind v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind<span class="token punctuation">)</span>
   Compiling std v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std<span class="token punctuation">)</span>
   Compiling rustc-std-workspace-core v1.99.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core<span class="token punctuation">)</span>
   Compiling alloc v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc<span class="token punctuation">)</span>
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc<span class="token punctuation">)</span>
   Compiling panic_abort v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort<span class="token punctuation">)</span>
   Compiling panic_unwind v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind<span class="token punctuation">)</span>
   Compiling gimli v0.28.0
   Compiling std_detect v0.1.5 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect<span class="token punctuation">)</span>
   Compiling object v0.32.0
   Compiling hashbrown v0.14.0
   Compiling miniz_oxide v0.7.1
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro<span class="token punctuation">)</span>
   Compiling harmony v0.1.0 <span class="token punctuation">(</span>/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony<span class="token punctuation">)</span>
    Finished dev <span class="token punctuation">[</span>unoptimized + debuginfo<span class="token punctuation">]</span> target<span class="token punctuation">(</span>s<span class="token punctuation">)</span> <span class="token keyword">in</span> <span class="token number">57</span>.73s
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code>$ <span class="token function">cargo</span> +nightly build  <span class="token parameter variable">-Z</span> build-std <span class="token parameter variable">--target</span> aarch64-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core<span class="token punctuation">)</span>
   Compiling libc v0.2.149
   Compiling rustc-std-workspace-core v1.99.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core<span class="token punctuation">)</span>
   Compiling memchr v2.5.0
   Compiling unwind v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind<span class="token punctuation">)</span>
   Compiling std v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std<span class="token punctuation">)</span>
   Compiling alloc v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc<span class="token punctuation">)</span>
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc<span class="token punctuation">)</span>
   Compiling panic_abort v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort<span class="token punctuation">)</span>
   Compiling panic_unwind v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind<span class="token punctuation">)</span>
   Compiling gimli v0.28.0
   Compiling miniz_oxide v0.7.1
   Compiling std_detect v0.1.5 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect<span class="token punctuation">)</span>
   Compiling object v0.32.0
   Compiling hashbrown v0.14.0
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 <span class="token punctuation">(</span>/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro<span class="token punctuation">)</span>
   Compiling harmony v0.1.0 <span class="token punctuation">(</span>/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony<span class="token punctuation">)</span>
    Finished dev <span class="token punctuation">[</span>unoptimized + debuginfo<span class="token punctuation">]</span> target<span class="token punctuation">(</span>s<span class="token punctuation">)</span> <span class="token keyword">in</span> <span class="token number">45</span>.05s
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>编译成功后，可以在下列路径找到编译产物：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>harmony/target/x86_64-unknown-linux-ohos/debug/libtest.so
harmony/target/armv7-unknown-linux-ohos/debug/libtest.so
harmony/target/aarch64-unknown-linux-ohos/debug/libtest.so
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>目录结构如下:</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>$ tree
.
├── Cargo.lock
├── Cargo.toml
├── aarch64-unknown-linux-ohos-clang++.sh
├── aarch64-unknown-linux-ohos-clang.sh
├── armv7-unknown-linux-ohos-clang++.sh
├── armv7-unknown-linux-ohos-clang.sh
├── config
├── src
│   └── lib.rs
├── target
│   ├── CACHEDIR.TAG
│   ├── aarch64-unknown-linux-ohos
│   │   └── debug
│   │       └── libtest.so
│   ├── armv7-unknown-linux-ohos
│   │   └── debug
│   │       └── libtest.so
│   └── x86_64-unknown-linux-ohos
│       └── debug
│           └── libtest.so
├── x86_64-unknown-linux-ohos-clang++.sh
└── x86_64-unknown-linux-ohos-clang.sh
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="在harmonynextnative工程中引入编译产物并调用" tabindex="-1"><a class="header-anchor" href="#在harmonynextnative工程中引入编译产物并调用" aria-hidden="true">#</a> 在HarmonyNextNative工程中引入编译产物并调用</h2><h3 id="创建native-c-工程并引入交叉编译的产物" tabindex="-1"><a class="header-anchor" href="#创建native-c-工程并引入交叉编译的产物" aria-hidden="true">#</a> 创建Native C++工程并引入交叉编译的产物</h3><p>利用DevEco Studio创建一个Native C++工程，并在<code>libs</code>目录下创建三个子目录<code>arm64-v8a</code>、<code>armeabi-v7a</code>、<code>x86_64</code>，并将交叉编译的产物复制过来，目录结构如下：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>.
├── AppScope
│   ├── app.json5
│   └── resources
│       └── base
│           ├── element
│           │   └── string.json
│           └── media
│               └── app_icon.png
├── build-profile.json5
├── entry
│   ├── build-profile.json5
│   ├── hvigorfile.ts
│   ├── libs
│   │   ├── arm64-v8a
│   │   │   └── libtest.so
│   │   ├── armeabi-v7a
│   │   │   └── libtest.so
│   │   └── x86_64
│   │       └── libtest.so
│   ├── oh-package.json5
│   ├── oh_modules
│   │   └── libentry.so -&gt; ../src/main/cpp/types/libentry
│   └── src
│       ├── main
│       │   ├── cpp
│       │   │   ├── CMakeLists.txt
│       │   │   ├── hello.cpp
│       │   │   └── types
│       │   │       └── libentry
│       │   │           ├── index.d.ts
│       │   │           └── oh-package.json5
│       │   ├── ets
│       │   │   ├── entryability
│       │   │   │   └── EntryAbility.ts
│       │   │   └── pages
│       │   │       └── Index.ets
│       │   ├── module.json5
│       │   └── resources
│       │       ├── base
│       │       │   ├── element
│       │       │   │   ├── color.json
│       │       │   │   └── string.json
│       │       │   ├── media
│       │       │   │   └── icon.png
│       │       │   └── profile
│       │       │       └── main_pages.json
│       │       ├── en_US
│       │       │   └── element
│       │       │       └── string.json
│       │       ├── rawfile
│       │       └── zh_CN
│       │           └── element
│       │               └── string.json
│       └── ohosTest
│           ├── ets
│           │   ├── test
│           │   │   ├── Ability.test.ets
│           │   │   └── List.test.ets
│           │   ├── testability
│           │   │   ├── TestAbility.ets
│           │   │   └── pages
│           │   │       └── Index.ets
│           │   └── testrunner
│           │       └── OpenHarmonyTestRunner.ts
│           ├── module.json5
│           └── resources
│               └── base
│                   ├── element
│                   │   ├── color.json
│                   │   └── string.json
│                   ├── media
│                   │   └── icon.png
│                   └── profile
│                       └── test_pages.json
├── hvigor
│   ├── hvigor-config.json5
│   └── hvigor-wrapper.js
├── hvigorfile.ts
├── hvigorw
├── hvigorw.bat
├── local.properties
├── oh-package-lock.json5
├── oh-package.json5
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="修改工程配置" tabindex="-1"><a class="header-anchor" href="#修改工程配置" aria-hidden="true">#</a> 修改工程配置</h3><p>在模块的entry/build-profile.json5文件中新增<code>napiLibFilterOption</code>和<code>externalNativeOptions</code>配置，防止编译错误和指定支持的abi架构：</p><div class="language-json line-numbers-mode" data-ext="json"><pre class="language-json"><code><span class="token punctuation">{</span>
  <span class="token property">&quot;apiType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;stageMode&quot;</span><span class="token punctuation">,</span>
  <span class="token property">&quot;buildOption&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>
    <span class="token property">&quot;napiLibFilterOption&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>
      <span class="token property">&quot;enableOverride&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token property">&quot;externalNativeOptions&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>
      <span class="token property">&quot;path&quot;</span><span class="token operator">:</span> <span class="token string">&quot;./src/main/cpp/CMakeLists.txt&quot;</span><span class="token punctuation">,</span>
      <span class="token property">&quot;arguments&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
      <span class="token property">&quot;cppFlags&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
      <span class="token property">&quot;abiFilters&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
        <span class="token string">&quot;armeabi-v7a&quot;</span><span class="token punctuation">,</span>
        <span class="token string">&quot;arm64-v8a&quot;</span><span class="token punctuation">,</span>
        <span class="token string">&quot;x86_64&quot;</span>
      <span class="token punctuation">]</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
  ....
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="链接和编译三方库" tabindex="-1"><a class="header-anchor" href="#链接和编译三方库" aria-hidden="true">#</a> 链接和编译三方库</h3><p>在<code>cpp/CMakeLists.txt</code>中将第三方动态so库链接到编译环境中，这样就可以在<code>hello.cpp</code>中编译使用了，注意这里和常规的配置也略有不同，需要在<code>target_link_libraries</code>中直接追加动态库地址，不可以仅写lib库名：</p><p>这个case可以成功运行：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code># the minimum version of CMake.
cmake_minimum_required(VERSION 3.4.1)
project(MyApplication4)

set(NATIVERENDER_ROOT_PATH \${CMAKE_CURRENT_SOURCE_DIR})

include_directories(\${NATIVERENDER_ROOT_PATH}
                    \${NATIVERENDER_ROOT_PATH}/include)

add_library(entry SHARED hello.cpp)
target_link_libraries(entry PUBLIC libace_napi.z.so \${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/\${OHOS_ARCH}/libtest.so)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这个case可以编译运行但是执行c++代码会崩溃：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code># the minimum version of CMake.
cmake_minimum_required(VERSION 3.4.1)
project(MyApplication4)

set(NATIVERENDER_ROOT_PATH \${CMAKE_CURRENT_SOURCE_DIR})

include_directories(\${NATIVERENDER_ROOT_PATH}
                    \${NATIVERENDER_ROOT_PATH}/include)

add_library( libtest SHARED IMPORTED)
set_target_properties(libtest PROPERTIES IMPORTED_LOCATION \${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/\${OHOS_ARCH}/libtest.so )

add_library(entry SHARED hello.cpp)
target_link_libraries(entry PUBLIC libace_napi.z.so libtest)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="在c-代码中引用rust向外暴露的代码并使用" tabindex="-1"><a class="header-anchor" href="#在c-代码中引用rust向外暴露的代码并使用" aria-hidden="true">#</a> 在C++代码中引用rust向外暴露的代码并使用</h3><p>先对要使用的代码进行声明：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>extern &quot;C&quot; void hello_from_rust();
extern &quot;C&quot; int hello2_from_rust(int a, int b);
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><p>调用<code>hello2_from_rust</code>进行两数相加：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>static napi_value Add(napi_env env, napi_callback_info info) {

    int ret = hello2_from_rust(10, 10);

    napi_value ret2;
    napi_create_int32(env, ret, &amp;ret2);

    return ret2;
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>随后，编译运行验证：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>10-23 19:54:01.059  3153-3153    A00000/testTag                 pid-3153                        I  Succeeded in loading the content. Data:
10-23 19:54:13.385  3153-3153    A00000/testTag                 com.bzh.test                    I  Test NAPI 2 + 3 = 20
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="reference" tabindex="-1"><a class="header-anchor" href="#reference" aria-hidden="true">#</a> Reference</h2><ul><li>https://doc.rust-lang.org/rustc/platform-support/openharmony.html</li><li>https://docs.openharmony.cn/pages/v4.0/zh-cn/device-dev/subsystems/subsys-build-bindgen-cxx-guide.md/</li><li>https://docs.rust-embedded.org/embedonomicon/custom-target.html</li><li>https://www.saoniuhuo.com/question/detail-2698649.html</li><li>https://blog.csdn.net/zrufo747/article/details/132296829</li><li>https://blog.csdn.net/pengfei240/article/details/52912833</li><li>https://blog.51cto.com/u_15127605/2763424</li></ul>`,67),t=[l];function r(o,c){return s(),a("div",null,t)}const d=n(e,[["render",r],["__file","how-to-call-rust-function-from-harmony.html.vue"]]);export{d as default};
