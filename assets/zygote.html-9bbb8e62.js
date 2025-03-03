import{_ as e,C as t,Y as i,Z as p,$ as n,a0 as s,a1 as c,a2 as l}from"./framework-301d0703.js";const o={},u=n("h1",{id:"android-aosp-android-11-进程启动分析-一-zygote进程-转载-加工",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#android-aosp-android-11-进程启动分析-一-zygote进程-转载-加工","aria-hidden":"true"},"#"),s(" Android | AOSP | Android 11 进程启动分析（一）: Zygote进程 | 转载&加工")],-1),r=n("h2",{id:"前言1",tabindex:"-1"},[n("a",{class:"header-anchor",href:"#前言1","aria-hidden":"true"},"#"),s(" 前言1")],-1),d={href:"https://blog.csdn.net/u013028621/article/details/116271537?spm=1001.2014.3001.5502",target:"_blank",rel:"noopener noreferrer"},v=l(`<h2 id="init进程" tabindex="-1"><a class="header-anchor" href="#init进程" aria-hidden="true">#</a> init进程</h2><p>Android 10之后的版本，init进程入口源码在system/core/init/main.cpp，而不在init.cpp。其main函数如下：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>int main(int argc, char** argv) {
#if __has_feature(address_sanitizer)
    __asan_set_error_report_callback(AsanReportCallback);
#endif

    if (!strcmp(basename(argv[0]), &quot;ueventd&quot;)) {
        return ueventd_main(argc, argv);
    }

    if (argc &gt; 1) {
        if (!strcmp(argv[1], &quot;subcontext&quot;)) {
            android::base::InitLogging(argv, &amp;android::base::KernelLogger);
            const BuiltinFunctionMap&amp; function_map = GetBuiltinFunctionMap();

            return SubcontextMain(argc, argv, &amp;function_map);
        }

        if (!strcmp(argv[1], &quot;selinux_setup&quot;)) {
            return SetupSelinux(argv);
        }

        if (!strcmp(argv[1], &quot;second_stage&quot;)) {
            return SecondStageMain(argc, argv);
        }
    }

    return FirstStageMain(argc, argv);
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里不深入init进程只关注zygote进程的创建，启动脚本init.rc中有这么一句：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>import /system/etc/init/hw/init.\${ro.zygote}.rc
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>对应脚本文件为init.zygote32.rc或init.zygote64.rc，内容如下：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>service zygote /system/bin/app_process -Xzygote /system/bin --zygote --start-system-server
    class main
    priority -20
    user root
    group root readproc reserved_disk
    socket zygote stream 660 root system
    socket usap_pool_primary stream 660 root system
    onrestart exec_background - system system -- /system/bin/vdc volume abort_fuse
    onrestart write /sys/power/state on
    onrestart restart audioserver
    onrestart restart cameraserver
    onrestart restart media
    onrestart restart netd
    onrestart restart wificond
    writepid /dev/cpuset/foreground/tasks
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="zygote进程" tabindex="-1"><a class="header-anchor" href="#zygote进程" aria-hidden="true">#</a> zygote进程</h2><p>zygote进程启动后，会执行到frameworks/base/cmds/app_process/app_main.cpp的main函数</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>int main(int argc, char* const argv[])
{
    ...

    AppRuntime runtime(argv[0], computeArgBlockSize(argc, argv));
    
    ... //省略若干行

    // Parse runtime arguments.  Stop at first unrecognized option.
    bool zygote = false;
    bool startSystemServer = false;
    bool application = false;
    String8 niceName;
    String8 className;

    ++i;  // Skip unused &quot;parent dir&quot; argument.
    while (i &lt; argc) {
        const char* arg = argv[i++];
        if (strcmp(arg, &quot;--zygote&quot;) == 0) {
            zygote = true;
            niceName = ZYGOTE_NICE_NAME;
        } else if (strcmp(arg, &quot;--start-system-server&quot;) == 0) {
            startSystemServer = true;
        } else if (strcmp(arg, &quot;--application&quot;) == 0) {
            application = true;
        } else if (strncmp(arg, &quot;--nice-name=&quot;, 12) == 0) {
            niceName.setTo(arg + 12);
        } else if (strncmp(arg, &quot;--&quot;, 2) != 0) {
            className.setTo(arg);
            break;
        } else {
            --i;
            break;
        }
    }

    ... //省略若干行

    if (zygote) {
        runtime.start(&quot;com.android.internal.os.ZygoteInit&quot;, args, zygote);
    } else if (className) {
        runtime.start(&quot;com.android.internal.os.RuntimeInit&quot;, args, zygote);
    } else {
        fprintf(stderr, &quot;Error: no class name or --zygote supplied.\\n&quot;);
        app_usage();
        LOG_ALWAYS_FATAL(&quot;app_process: no class name or --zygote supplied.&quot;);
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>主要是解析各种启动参数，然后启动AppRuntime，显然这里zygote是true，执行的是</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>runtime.start(&quot;com.android.internal.os.ZygoteInit&quot;, args, zygote);
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>AppRuntime是AndroiRuntime的派生类，start函数定义在AndroiRuntime类下</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>void AndroidRuntime::start(const char* className, const Vector&lt;String8&gt;&amp; options, bool zygote)
{
    ... //省略若干行

    /* 启动虚拟机 */
    JniInvocation jni_invocation;
    jni_invocation.Init(NULL);
    JNIEnv* env;
    if (startVm(&amp;mJavaVM, &amp;env, zygote, primary_zygote) != 0) {
        return;
    }
    onVmCreated(env);

    /*
     * Register android functions.
     * 注册Android JNI
     */
    if (startReg(env) &lt; 0) {
        ALOGE(&quot;Unable to register all android natives\\n&quot;);
        return;
    }

    ... //省略若干行

    //找到并执行Java类的main方法
    if (startClass == NULL) {
        ALOGE(&quot;JavaVM unable to locate class &#39;%s&#39;\\n&quot;, slashClassName);
        /* keep going */
    } else {
        jmethodID startMeth = env-&gt;GetStaticMethodID(startClass, &quot;main&quot;,
            &quot;([Ljava/lang/String;)V&quot;);
        if (startMeth == NULL) {
            ALOGE(&quot;JavaVM unable to find main() in &#39;%s&#39;\\n&quot;, className);
            /* keep going */
        } else {
            env-&gt;CallStaticVoidMethod(startClass, startMeth, strArray);
            ... //省略若干行
        }

    ... //省略若干行
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这就进入了Java的世界了。由上可知，Java世界的入口是com.android.internal.os.ZygoteInit的main方法</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span> argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">ZygoteServer</span> zygoteServer <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token class-name">Runnable</span> caller<span class="token punctuation">;</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
        
        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

        <span class="token comment">// 解析参数</span>
        <span class="token keyword">boolean</span> startSystemServer <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
        <span class="token class-name">String</span> zygoteSocketName <span class="token operator">=</span> <span class="token string">&quot;zygote&quot;</span><span class="token punctuation">;</span>
        <span class="token class-name">String</span> abiList <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
        <span class="token keyword">boolean</span> enableLazyPreload <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> argv<span class="token punctuation">.</span>length<span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token string">&quot;start-system-server&quot;</span><span class="token punctuation">.</span><span class="token function">equals</span><span class="token punctuation">(</span>argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                startSystemServer <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token string">&quot;--enable-lazy-preload&quot;</span><span class="token punctuation">.</span><span class="token function">equals</span><span class="token punctuation">(</span>argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                enableLazyPreload <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token constant">ABI_LIST_ARG</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                abiList <span class="token operator">=</span> argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">substring</span><span class="token punctuation">(</span><span class="token constant">ABI_LIST_ARG</span><span class="token punctuation">.</span><span class="token function">length</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token constant">SOCKET_NAME_ARG</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                zygoteSocketName <span class="token operator">=</span> argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">substring</span><span class="token punctuation">(</span><span class="token constant">SOCKET_NAME_ARG</span><span class="token punctuation">.</span><span class="token function">length</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
                <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">RuntimeException</span><span class="token punctuation">(</span><span class="token string">&quot;Unknown command line argument: &quot;</span> <span class="token operator">+</span> argv<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>

        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

        <span class="token keyword">if</span> <span class="token punctuation">(</span>startSystemServer<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token class-name">Runnable</span> r <span class="token operator">=</span> <span class="token function">forkSystemServer</span><span class="token punctuation">(</span>abiList<span class="token punctuation">,</span> zygoteSocketName<span class="token punctuation">,</span> zygoteServer<span class="token punctuation">)</span><span class="token punctuation">;</span>

            <span class="token comment">// {@code r == null} in the parent (zygote) process, and {@code r != null} in the</span>
            <span class="token comment">// child (system_server) process.</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>r <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
                r<span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
                <span class="token keyword">return</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>

        <span class="token class-name">Log</span><span class="token punctuation">.</span><span class="token function">i</span><span class="token punctuation">(</span><span class="token constant">TAG</span><span class="token punctuation">,</span> <span class="token string">&quot;Accepting command socket connections&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// The select loop returns early in the child process after a fork and</span>
        <span class="token comment">// loops forever in the zygote.</span>
        caller <span class="token operator">=</span> zygoteServer<span class="token punctuation">.</span><span class="token function">runSelectLoop</span><span class="token punctuation">(</span>abiList<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Throwable</span> ex<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">Log</span><span class="token punctuation">.</span><span class="token function">e</span><span class="token punctuation">(</span><span class="token constant">TAG</span><span class="token punctuation">,</span> <span class="token string">&quot;System zygote died with exception&quot;</span><span class="token punctuation">,</span> ex<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">throw</span> ex<span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">finally</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>zygoteServer <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            zygoteServer<span class="token punctuation">.</span><span class="token function">closeServerSocket</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token comment">// We&#39;re in the child process and have exited the select loop. Proceed to execute the</span>
    <span class="token comment">// command.</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>caller <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        caller<span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在这里我们主要关心两件事情：</p><ul><li>SystemServer的启动</li><li>其他子进程的启动</li></ul><h2 id="关于fork进程" tabindex="-1"><a class="header-anchor" href="#关于fork进程" aria-hidden="true">#</a> 关于fork进程</h2><p>这里插播一下关于fork进程相关知识。fork函数定义在“unistd.h”里，作用是克隆一个一摸一样的进程。看如下示例：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>#include &lt;iostream&gt;
#include &lt;unistd.h&gt;

using namespace std;

int main() {
    cout &lt;&lt; &quot;fork进程测试&quot; &lt;&lt; endl;

    int var = 10;

    // fork进程
    int pid = fork();
    if(pid == -1) {
        cout &lt;&lt; &quot;fork进程失败&quot; &lt;&lt; endl;
        return -1;
    }

    cout &lt;&lt; &quot;我的子进程id：&quot; &lt;&lt; pid &lt;&lt; endl;

    if (pid) {
        cout &lt;&lt; &quot;我的进程id是：&quot; &lt;&lt; getpid() &lt;&lt; &quot;,变量var是: &quot; &lt;&lt; var &lt;&lt; endl;
        return 0;
    } else {
        cout &lt;&lt; &quot;我的进程id是：&quot; &lt;&lt; getpid() &lt;&lt; &quot;,变量var是: &quot; &lt;&lt; var &lt;&lt; endl;
        return 0;
    }
} 
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>输出结果：

fork进程测试
我的子进程id：13875
我的进程id是：13874,变量var是: 10
我的子进程id：0
我的进程id是：13875,变量var是: 10
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在fork返回的时候已经是两个进程了，父进程中得到的pid是子进程的id，而子进程得到的pid则是0。父进程和子进程就此分道扬镳，沿着不同的分支继续运行。在父进程中pid非0，所以执行的是if分支，而子进程相反，执行的是else分支。</p><h2 id="systemserver的启动" tabindex="-1"><a class="header-anchor" href="#systemserver的启动" aria-hidden="true">#</a> SystemServer的启动</h2><p>SystemServer的启动为：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>if (startSystemServer) {
    Runnable r = forkSystemServer(abiList, zygoteSocketName, zygoteServer);

    // {@code r == null} in the parent (zygote) process, and {@code r != null} in the
    // child (system_server) process.
    if (r != null) {
        r.run();
        return;
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里fork了一个子进程，父进程中返回的Runnable为null，会继续往下运行；而子进程也就是SystemServer的进程则会调用返回的Ruunable的run方法，进入SystemServer的逻辑。 这里我们跟进forkSystemServer方法：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>/**
 * Prepare the arguments and forks for the system server process.
 *
 * @return A {@code Runnable} that provides an entrypoint into system_server code in the child
 * process; {@code null} in the parent.
 */
private static Runnable forkSystemServer(String abiList, String socketName,
        ZygoteServer zygoteServer) {

    ... // 省略若干行

    String args[] = {
            &quot;--setuid=1000&quot;,
            &quot;--setgid=1000&quot;,
            &quot;--setgroups=1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1018,1021,1023,&quot;
                    + &quot;1024,1032,1065,3001,3002,3003,3006,3007,3009,3010,3011&quot;,
            &quot;--capabilities=&quot; + capabilities + &quot;,&quot; + capabilities,
            &quot;--nice-name=system_server&quot;,
            &quot;--runtime-args&quot;,
            &quot;--target-sdk-version=&quot; + VMRuntime.SDK_VERSION_CUR_DEVELOPMENT,
            &quot;com.android.server.SystemServer&quot;,
    };
    ZygoteArguments parsedArgs = null;

    int pid;

    try {
        parsedArgs = new ZygoteArguments(args);

        ... // 省略若干行

        /* Request to fork the system server process */
        pid = Zygote.forkSystemServer(
                parsedArgs.mUid, parsedArgs.mGid,
                parsedArgs.mGids,
                parsedArgs.mRuntimeFlags,
                null,
                parsedArgs.mPermittedCapabilities,
                parsedArgs.mEffectiveCapabilities);
    } catch (IllegalArgumentException ex) {
        throw new RuntimeException(ex);
    }

    /* For child process */
    if (pid == 0) { // 子进程
        if (hasSecondZygote(abiList)) {
            waitForSecondaryZygote(socketName);
        }

        zygoteServer.closeServerSocket();
        return handleSystemServerProcess(parsedArgs);
    }

    return null;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到，父进程中确实返回了null，而子进程返回值由handleSystemServerProcess确定，我们继续跟进：</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>/**
 * Finish remaining work for the newly forked system server process.
 */
private static Runnable handleSystemServerProcess(ZygoteArguments parsedArgs) {

    ... // 省略若干行

    // 上面forkSystemServer方法中定义的启动参数显然没有“--invoke-with”，所以这里执行的是else分支
    if (parsedArgs.mInvokeWith != null) {

        ... // 省略若干行

    } else {
        ClassLoader cl = null;
        if (systemServerClasspath != null) {
            cl = createPathClassLoader(systemServerClasspath, parsedArgs.mTargetSdkVersion);

            Thread.currentThread().setContextClassLoader(cl);
        }

        /*
            * Pass the remaining arguments to SystemServer.
            */
        return ZygoteInit.zygoteInit(parsedArgs.mTargetSdkVersion,
                parsedArgs.mDisabledCompatChanges,
                parsedArgs.mRemainingArgs, cl);
    }

    /* should never reach here */
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>继续跟进ZygoteInit.zygoteInit方法</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>public static final Runnable zygoteInit(int targetSdkVersion, long[] disabledCompatChanges,
        String[] argv, ClassLoader classLoader) {
    if (RuntimeInit.DEBUG) {
        Slog.d(RuntimeInit.TAG, &quot;RuntimeInit: Starting application from zygote&quot;);
    }

    Trace.traceBegin(Trace.TRACE_TAG_ACTIVITY_MANAGER, &quot;ZygoteInit&quot;);
    RuntimeInit.redirectLogStreams();

    RuntimeInit.commonInit();
    ZygoteInit.nativeZygoteInit();
    return RuntimeInit.applicationInit(targetSdkVersion, disabledCompatChanges, argv,
            classLoader);
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里进行了一些初始化，然后又转到了RuntimeInit.applicationInit方法，继续跟进</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>protected static Runnable applicationInit(int targetSdkVersion, long[] disabledCompatChanges,
            String[] argv, ClassLoader classLoader) {
    // If the application calls System.exit(), terminate the process
    // immediately without running any shutdown hooks.  It is not possible to
    // shutdown an Android application gracefully.  Among other things, the
    // Android runtime shutdown hooks close the Binder driver, which can cause
    // leftover running threads to crash before the process actually exits.
    nativeSetExitWithoutCleanup(true);

    VMRuntime.getRuntime().setTargetSdkVersion(targetSdkVersion);
    VMRuntime.getRuntime().setDisabledCompatChanges(disabledCompatChanges);

    final Arguments args = new Arguments(argv);

    // The end of of the RuntimeInit event (see #zygoteInit).
    Trace.traceEnd(Trace.TRACE_TAG_ACTIVITY_MANAGER);

    // Remaining arguments are passed to the start class&#39;s static main
    return findStaticMain(args.startClass, args.startArgs, classLoader);
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里进行了一通的设置之后，转到findStaticMain方法，继续跟进</p><div class="language-c++ line-numbers-mode" data-ext="c++"><pre class="language-c++"><code>protected static Runnable findStaticMain(String className, String[] argv,
            ClassLoader classLoader) {
    Class&lt;?&gt; cl;

    cl = Class.forName(className, true, classLoader);
    

    Method m;
    m = cl.getMethod(&quot;main&quot;, new Class[] { String[].class });


    int modifiers = m.getModifiers();
    if (! (Modifier.isStatic(modifiers) &amp;&amp; Modifier.isPublic(modifiers))) {
        throw new RuntimeException(
                &quot;Main method is not public and static on &quot; + className);
    }

    return new MethodAndArgsCaller(m, argv);
}

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里通过反射找到目标类的静态main方法，然后包装成了MethodAndArgsCaller对象返回。MethodAndArgsCaller实现了Runnable接口，run方法非常简单，就是反射执行了目标类的静态main方法。而这里说的目标类显然是forkSystemServer定义的args参数最后一行的“com.android.server.SystemServer”</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">MethodAndArgsCaller</span> <span class="token keyword">implements</span> <span class="token class-name">Runnable</span> <span class="token punctuation">{</span>
    <span class="token doc-comment comment">/** method to call */</span>
    <span class="token keyword">private</span> <span class="token keyword">final</span> <span class="token class-name">Method</span> mMethod<span class="token punctuation">;</span>

    <span class="token doc-comment comment">/** argument array */</span>
    <span class="token keyword">private</span> <span class="token keyword">final</span> <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> mArgs<span class="token punctuation">;</span>

    <span class="token keyword">public</span> <span class="token class-name">MethodAndArgsCaller</span><span class="token punctuation">(</span><span class="token class-name">Method</span> method<span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mMethod <span class="token operator">=</span> method<span class="token punctuation">;</span>
        mArgs <span class="token operator">=</span> args<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">run</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            mMethod<span class="token punctuation">.</span><span class="token function">invoke</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">Object</span><span class="token punctuation">[</span><span class="token punctuation">]</span> <span class="token punctuation">{</span> mArgs <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>再回过头看ZygoteInit的main方法</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">if</span> <span class="token punctuation">(</span>startSystemServer<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">Runnable</span> r <span class="token operator">=</span> <span class="token function">forkSystemServer</span><span class="token punctuation">(</span>abiList<span class="token punctuation">,</span> zygoteSocketName<span class="token punctuation">,</span> zygoteServer<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>r <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        r<span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>至此SystemServer就正式启动了。</p><h2 id="其他进程的启动" tabindex="-1"><a class="header-anchor" href="#其他进程的启动" aria-hidden="true">#</a> 其他进程的启动</h2><p>再看ZygoteInit的main方法</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span> argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">ZygoteServer</span> zygoteServer <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token class-name">Runnable</span> caller<span class="token punctuation">;</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
        
        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>
        zygoteServer <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ZygoteServer</span><span class="token punctuation">(</span>isPrimaryZygote<span class="token punctuation">)</span><span class="token punctuation">;</span>
        caller <span class="token operator">=</span> zygoteServer<span class="token punctuation">.</span><span class="token function">runSelectLoop</span><span class="token punctuation">(</span>abiList<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
    <span class="token punctuation">}</span>

    <span class="token comment">// We&#39;re in the child process and have exited the select loop. Proceed to execute the</span>
    <span class="token comment">// command.</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>caller <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        caller<span class="token punctuation">.</span><span class="token function">run</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>SystemServer进程启动后，父进程继续往下运行到ZygoteServer的runSelectLoop方法。一般我们看到loop就知道这是一个循环，当需要创建新的进程的消息到来的时候，子进程会退出循环往下执行，而父进程则继续循环。 其中ZygoteServer的构造方法里启动了socket监听</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token class-name">ZygoteServer</span><span class="token punctuation">(</span><span class="token keyword">boolean</span> isPrimaryZygote<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    mUsapPoolEventFD <span class="token operator">=</span> <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">getUsapPoolEventFD</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>isPrimaryZygote<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mZygoteSocket <span class="token operator">=</span> <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">createManagedSocketFromInitSocket</span><span class="token punctuation">(</span><span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token constant">PRIMARY_SOCKET_NAME</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        mUsapPoolSocket <span class="token operator">=</span>
                <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">createManagedSocketFromInitSocket</span><span class="token punctuation">(</span>
                        <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token constant">USAP_POOL_PRIMARY_SOCKET_NAME</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        mZygoteSocket <span class="token operator">=</span> <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">createManagedSocketFromInitSocket</span><span class="token punctuation">(</span><span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token constant">SECONDARY_SOCKET_NAME</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        mUsapPoolSocket <span class="token operator">=</span>
                <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">createManagedSocketFromInitSocket</span><span class="token punctuation">(</span>
                        <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token constant">USAP_POOL_SECONDARY_SOCKET_NAME</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    mUsapPoolSupported <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
    <span class="token function">fetchUsapPoolPolicyProps</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里分享一个小技巧，根据上面的分析，我们知道返回一个非null的Runnable对象则会进入一个新的进程，所以我们在分析runSelectLoop方法的时候只关注返回的地方，其他的我们暂时不过多关注。 跟进runSelectLoop方法</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token class-name">Runnable</span> <span class="token function">runSelectLoop</span><span class="token punctuation">(</span><span class="token class-name">String</span> abiList<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token class-name">ZygoteConnection</span> newPeer <span class="token operator">=</span> <span class="token function">acceptCommandPeer</span><span class="token punctuation">(</span>abiList<span class="token punctuation">)</span><span class="token punctuation">;</span>
                        peers<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>newPeer<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token class-name">ZygoteConnection</span> connection <span class="token operator">=</span> peers<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>pollIndex<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">final</span> <span class="token class-name">Runnable</span> command <span class="token operator">=</span> connection<span class="token punctuation">.</span><span class="token function">processOneCommand</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mIsForkChild<span class="token punctuation">)</span> <span class="token punctuation">{</span>

        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

        <span class="token keyword">return</span> command<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mUsapPoolRefillAction <span class="token operator">!=</span> <span class="token class-name">UsapPoolRefillAction</span><span class="token punctuation">.</span><span class="token constant">NONE</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>

        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

        <span class="token keyword">final</span> <span class="token class-name">Runnable</span> command <span class="token operator">=</span>
                <span class="token function">fillUsapPool</span><span class="token punctuation">(</span>sessionSocketRawFDs<span class="token punctuation">,</span> isPriorityRefill<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">if</span> <span class="token punctuation">(</span>command <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> command<span class="token punctuation">;</span>
        <span class="token punctuation">}</span> 

        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>
    <span class="token punctuation">}</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到有两个地方会返回Runnable，分别是ZygoteConnection#processOneCommand方法和ZygoteServer#fillUsapPool方法。</p><h3 id="processonecommand" tabindex="-1"><a class="header-anchor" href="#processonecommand" aria-hidden="true">#</a> processOneCommand</h3><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token class-name">Runnable</span> <span class="token function">processOneCommand</span><span class="token punctuation">(</span><span class="token class-name">ZygoteServer</span> zygoteServer<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">;</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    args <span class="token operator">=</span> <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">readArgumentList</span><span class="token punctuation">(</span>mSocketReader<span class="token punctuation">)</span><span class="token punctuation">;</span>
    
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    pid <span class="token operator">=</span> <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">forkAndSpecialize</span><span class="token punctuation">(</span>parsedArgs<span class="token punctuation">.</span>mUid<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mGid<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mGids<span class="token punctuation">,</span>
            parsedArgs<span class="token punctuation">.</span>mRuntimeFlags<span class="token punctuation">,</span> rlimits<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mMountExternal<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mSeInfo<span class="token punctuation">,</span>
            parsedArgs<span class="token punctuation">.</span>mNiceName<span class="token punctuation">,</span> fdsToClose<span class="token punctuation">,</span> fdsToIgnore<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mStartChildZygote<span class="token punctuation">,</span>
            parsedArgs<span class="token punctuation">.</span>mInstructionSet<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mAppDataDir<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mIsTopApp<span class="token punctuation">,</span>
            parsedArgs<span class="token punctuation">.</span>mPkgDataInfoList<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mWhitelistedDataInfoList<span class="token punctuation">,</span>
            parsedArgs<span class="token punctuation">.</span>mBindMountAppDataDirs<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mBindMountAppStorageDirs<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>pid <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// in child</span>
        zygoteServer<span class="token punctuation">.</span><span class="token function">setForkChild</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        zygoteServer<span class="token punctuation">.</span><span class="token function">closeServerSocket</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">IoUtils</span><span class="token punctuation">.</span><span class="token function">closeQuietly</span><span class="token punctuation">(</span>serverPipeFd<span class="token punctuation">)</span><span class="token punctuation">;</span>
        serverPipeFd <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

        <span class="token keyword">return</span> <span class="token function">handleChildProc</span><span class="token punctuation">(</span>parsedArgs<span class="token punctuation">,</span> childPipeFd<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mStartChildZygote<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token comment">// In the parent. A pid &lt; 0 indicates a failure and will be handled in</span>
        <span class="token comment">// handleParentProc.</span>
        <span class="token class-name">IoUtils</span><span class="token punctuation">.</span><span class="token function">closeQuietly</span><span class="token punctuation">(</span>childPipeFd<span class="token punctuation">)</span><span class="token punctuation">;</span>
        childPipeFd <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
        <span class="token function">handleParentProc</span><span class="token punctuation">(</span>pid<span class="token punctuation">,</span> serverPipeFd<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>
    
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>可以看到，在通过socker接收一系列参数之后，fork了一个子进程，然后转到了handleChildProc，继续跟进</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">private</span> <span class="token class-name">Runnable</span> <span class="token function">handleChildProc</span><span class="token punctuation">(</span><span class="token class-name">ZygoteArguments</span> parsedArgs<span class="token punctuation">,</span>
            <span class="token class-name">FileDescriptor</span> pipeFd<span class="token punctuation">,</span> <span class="token keyword">boolean</span> isZygote<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>parsedArgs<span class="token punctuation">.</span>mInvokeWith <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">WrapperInit</span><span class="token punctuation">.</span><span class="token function">execApplication</span><span class="token punctuation">(</span>parsedArgs<span class="token punctuation">.</span>mInvokeWith<span class="token punctuation">,</span>
                parsedArgs<span class="token punctuation">.</span>mNiceName<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mTargetSdkVersion<span class="token punctuation">,</span>
                <span class="token class-name">VMRuntime</span><span class="token punctuation">.</span><span class="token function">getCurrentInstructionSet</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                pipeFd<span class="token punctuation">,</span> parsedArgs<span class="token punctuation">.</span>mRemainingArgs<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// Should not get here.</span>
        <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">IllegalStateException</span><span class="token punctuation">(</span><span class="token string">&quot;WrapperInit.execApplication unexpectedly returned&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>isZygote<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">ZygoteInit</span><span class="token punctuation">.</span><span class="token function">zygoteInit</span><span class="token punctuation">(</span>parsedArgs<span class="token punctuation">.</span>mTargetSdkVersion<span class="token punctuation">,</span>
                    parsedArgs<span class="token punctuation">.</span>mDisabledCompatChanges<span class="token punctuation">,</span>
                    parsedArgs<span class="token punctuation">.</span>mRemainingArgs<span class="token punctuation">,</span> <span class="token keyword">null</span> <span class="token comment">/* classLoader */</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">ZygoteInit</span><span class="token punctuation">.</span><span class="token function">childZygoteInit</span><span class="token punctuation">(</span>parsedArgs<span class="token punctuation">.</span>mTargetSdkVersion<span class="token punctuation">,</span>
                    parsedArgs<span class="token punctuation">.</span>mRemainingArgs<span class="token punctuation">,</span> <span class="token keyword">null</span> <span class="token comment">/* classLoader */</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里有3个分支，WrapperInit#execApplication，ZygoteInit#zygoteInit和ZygoteInit#childZygoteInit</p><h4 id="wrapperinit-execapplication" tabindex="-1"><a class="header-anchor" href="#wrapperinit-execapplication" aria-hidden="true">#</a> WrapperInit#execApplication</h4><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token doc-comment comment">/**
 * Executes a runtime application with a wrapper command.
 * This method never returns.
 */</span>
<span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">execApplication</span><span class="token punctuation">(</span><span class="token class-name">String</span> invokeWith<span class="token punctuation">,</span> <span class="token class-name">String</span> niceName<span class="token punctuation">,</span>
        <span class="token keyword">int</span> targetSdkVersion<span class="token punctuation">,</span> <span class="token class-name">String</span> instructionSet<span class="token punctuation">,</span> <span class="token class-name">FileDescriptor</span> pipeFd<span class="token punctuation">,</span>
        <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">StringBuilder</span> command <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">StringBuilder</span><span class="token punctuation">(</span>invokeWith<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">execShell</span><span class="token punctuation">(</span>command<span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这里看起来是执行shell命令，根据注释描述，这个方法永远不会返回</p><h4 id="zygoteinit-zygoteinit" tabindex="-1"><a class="header-anchor" href="#zygoteinit-zygoteinit" aria-hidden="true">#</a> ZygoteInit#zygoteInit</h4><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">Runnable</span> <span class="token function">zygoteInit</span><span class="token punctuation">(</span><span class="token keyword">int</span> targetSdkVersion<span class="token punctuation">,</span> <span class="token keyword">long</span><span class="token punctuation">[</span><span class="token punctuation">]</span> disabledCompatChanges<span class="token punctuation">,</span>
            <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> argv<span class="token punctuation">,</span> <span class="token class-name">ClassLoader</span> classLoader<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token class-name">RuntimeInit</span><span class="token punctuation">.</span><span class="token function">commonInit</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token class-name">ZygoteInit</span><span class="token punctuation">.</span><span class="token function">nativeZygoteInit</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token class-name">RuntimeInit</span><span class="token punctuation">.</span><span class="token function">applicationInit</span><span class="token punctuation">(</span>targetSdkVersion<span class="token punctuation">,</span> disabledCompatChanges<span class="token punctuation">,</span> argv<span class="token punctuation">,</span>
            classLoader<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>到了RuntimeInit#applicationInit，就和SystemServer进程分析后半段一样了。</p><h4 id="zygoteinit-childzygoteinit" tabindex="-1"><a class="header-anchor" href="#zygoteinit-childzygoteinit" aria-hidden="true">#</a> ZygoteInit#childZygoteInit</h4><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token class-name">Runnable</span> <span class="token function">childZygoteInit</span><span class="token punctuation">(</span>
            <span class="token keyword">int</span> targetSdkVersion<span class="token punctuation">,</span> <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> argv<span class="token punctuation">,</span> <span class="token class-name">ClassLoader</span> classLoader<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">RuntimeInit<span class="token punctuation">.</span>Arguments</span> args <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">RuntimeInit<span class="token punctuation">.</span>Arguments</span><span class="token punctuation">(</span>argv<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token class-name">RuntimeInit</span><span class="token punctuation">.</span><span class="token function">findStaticMain</span><span class="token punctuation">(</span>args<span class="token punctuation">.</span>startClass<span class="token punctuation">,</span> args<span class="token punctuation">.</span>startArgs<span class="token punctuation">,</span> classLoader<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>一目了然。</p><h3 id="fillusappool" tabindex="-1"><a class="header-anchor" href="#fillusappool" aria-hidden="true">#</a> fillUsapPool</h3><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token doc-comment comment">/**
 * Refill the USAP Pool to the appropriate level, determined by whether this is a priority
 * refill event or not.
 */</span>

<span class="token class-name">Runnable</span> <span class="token function">fillUsapPool</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">[</span><span class="token punctuation">]</span> sessionSocketRawFDs<span class="token punctuation">,</span> <span class="token keyword">boolean</span> isPriorityRefill<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token operator">--</span>numUsapsToSpawn <span class="token operator">&gt;=</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">Runnable</span> caller <span class="token operator">=</span>
                <span class="token class-name">Zygote</span><span class="token punctuation">.</span><span class="token function">forkUsap</span><span class="token punctuation">(</span>mUsapPoolSocket<span class="token punctuation">,</span> sessionSocketRawFDs<span class="token punctuation">,</span> isPriorityRefill<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">if</span> <span class="token punctuation">(</span>caller <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> caller<span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>一般我们看到pool，就会想到这是缓存、复用或者预加载优化相关，比如ThreadPool、RecycledViewPool等等。这里进行了一个循环，一直fork直至这个Usap进程池填满。 跟进forkUsap</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token doc-comment comment">/**
 * Fork a new unspecialized app process from the zygote
 *
 * <span class="token keyword">@param</span> <span class="token parameter">usapPoolSocket</span>  The server socket the USAP will call accept on
 * <span class="token keyword">@param</span> <span class="token parameter">sessionSocketRawFDs</span>  Anonymous session sockets that are currently open
 * <span class="token keyword">@param</span> <span class="token parameter">isPriorityFork</span>  Value controlling the process priority level until accept is called
 * <span class="token keyword">@return</span> In the Zygote process this function will always return null; in unspecialized app
 *         processes this function will return a Runnable object representing the new
 *         application that is passed up from usapMain.
 */</span>
<span class="token keyword">static</span> <span class="token class-name">Runnable</span> <span class="token function">forkUsap</span><span class="token punctuation">(</span><span class="token class-name">LocalServerSocket</span> usapPoolSocket<span class="token punctuation">,</span>
                            <span class="token keyword">int</span><span class="token punctuation">[</span><span class="token punctuation">]</span> sessionSocketRawFDs<span class="token punctuation">,</span>
                            <span class="token keyword">boolean</span> isPriorityFork<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>

    <span class="token keyword">int</span> pid <span class="token operator">=</span>
            <span class="token function">nativeForkUsap</span><span class="token punctuation">(</span>pipeFDs<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>getInt$<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> pipeFDs<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">.</span>getInt$<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                            sessionSocketRawFDs<span class="token punctuation">,</span> isPriorityFork<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>pid <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">IoUtils</span><span class="token punctuation">.</span><span class="token function">closeQuietly</span><span class="token punctuation">(</span>pipeFDs<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token function">usapMain</span><span class="token punctuation">(</span>usapPoolSocket<span class="token punctuation">,</span> pipeFDs<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> 
    
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span> <span class="token comment">// 省略若干行</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>跟进usapMain</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code> <span class="token doc-comment comment">/**
 * This function is used by unspecialized app processes to wait for specialization requests from
 * the system server.
 *
 * <span class="token keyword">@param</span> <span class="token parameter">writePipe</span>  The write end of the reporting pipe used to communicate with the poll loop
 *                   of the ZygoteServer.
 * <span class="token keyword">@return</span> A runnable oject representing the new application.
 */</span>
<span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token class-name">Runnable</span> <span class="token function">usapMain</span><span class="token punctuation">(</span><span class="token class-name">LocalServerSocket</span> usapPoolSocket<span class="token punctuation">,</span>
                                    <span class="token class-name">FileDescriptor</span> writePipe<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    

    <span class="token class-name">LocalSocket</span> sessionSocket <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token class-name">DataOutputStream</span> usapOutputStream <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token class-name">Credentials</span> peerCredentials <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token class-name">ZygoteArguments</span> args <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>


    <span class="token keyword">while</span> <span class="token punctuation">(</span><span class="token boolean">true</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            sessionSocket <span class="token operator">=</span> usapPoolSocket<span class="token punctuation">.</span><span class="token function">accept</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            <span class="token class-name">BufferedReader</span> usapReader <span class="token operator">=</span>
                    <span class="token keyword">new</span> <span class="token class-name">BufferedReader</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">InputStreamReader</span><span class="token punctuation">(</span>sessionSocket<span class="token punctuation">.</span><span class="token function">getInputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            usapOutputStream <span class="token operator">=</span>
                    <span class="token keyword">new</span> <span class="token class-name">DataOutputStream</span><span class="token punctuation">(</span>sessionSocket<span class="token punctuation">.</span><span class="token function">getOutputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            peerCredentials <span class="token operator">=</span> sessionSocket<span class="token punctuation">.</span><span class="token function">getPeerCredentials</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            <span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> argStrings <span class="token operator">=</span> <span class="token function">readArgumentList</span><span class="token punctuation">(</span>usapReader<span class="token punctuation">)</span><span class="token punctuation">;</span>

            args <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ZygoteArguments</span><span class="token punctuation">(</span>argStrings<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        <span class="token punctuation">}</span>

        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

        <span class="token function">specializeAppProcess</span><span class="token punctuation">(</span>args<span class="token punctuation">.</span>mUid<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mGid<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mGids<span class="token punctuation">,</span>
                                args<span class="token punctuation">.</span>mRuntimeFlags<span class="token punctuation">,</span> rlimits<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mMountExternal<span class="token punctuation">,</span>
                                args<span class="token punctuation">.</span>mSeInfo<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mNiceName<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mStartChildZygote<span class="token punctuation">,</span>
                                args<span class="token punctuation">.</span>mInstructionSet<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mAppDataDir<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mIsTopApp<span class="token punctuation">,</span>
                                args<span class="token punctuation">.</span>mPkgDataInfoList<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mWhitelistedDataInfoList<span class="token punctuation">,</span>
                                args<span class="token punctuation">.</span>mBindMountAppDataDirs<span class="token punctuation">,</span> args<span class="token punctuation">.</span>mBindMountAppStorageDirs<span class="token punctuation">)</span><span class="token punctuation">;</span>



        <span class="token keyword">return</span> <span class="token class-name">ZygoteInit</span><span class="token punctuation">.</span><span class="token function">zygoteInit</span><span class="token punctuation">(</span>args<span class="token punctuation">.</span>mTargetSdkVersion<span class="token punctuation">,</span>
                                            args<span class="token punctuation">.</span>mDisabledCompatChanges<span class="token punctuation">,</span>
                                            args<span class="token punctuation">.</span>mRemainingArgs<span class="token punctuation">,</span>
                                            <span class="token keyword">null</span> <span class="token comment">/* classLoader */</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>根据注释，Usap为“unspecialized app processes”的缩写，应该可以理解为未指定App的进程，运行到这里会循环阻塞，直到通过socket接收到App相关参数，然后使用这个进程启动App。所以这里推测UsapPool进程池为预先创建一定数量的进程，然后等待需要启动App的指令到达，然后使用预先fork的进程启动App而不是每次都走fork流程，加快App启动。</p><p>ZygoteInit#zygoteInit上面已经分析过，这里就不再赘述了。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>init进程为用户空间（相对于内核空间）的第一个进程，根据init.rc启动Zygote进程。</p><p>Zygote进程启动步骤：创建虚拟机、注册JNI、执行ZygoteInit的main方法开始Java之旅。</p><p>Zygote进程启动了SystemServer进程。</p><p>Zygote创建了socket，得到新建进程的指令到来，通过fork新建用户进程。</p><p>Zygote有一个优化进程创建的机制，UsapPool。</p><p>后续将继续探讨SystemServer内部运行机制以及App进程创建流程。本文完。</p>`,78);function k(m,b){const a=t("ExternalLinkIcon");return i(),p("div",null,[u,r,n("p",null,[s("对优秀文章"),n("a",d,[s("《Android 11 进程启动分析（一）: Zygote进程》"),c(a)]),s("的转载")]),v])}const y=e(o,[["render",k],["__file","zygote.html.vue"]]);export{y as default};
