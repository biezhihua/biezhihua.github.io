import{_ as n,Y as s,Z as e,a2 as a}from"./framework-301d0703.js";const i={},l=a(`<h1 id="learn-reverse-engineering" tabindex="-1"><a class="header-anchor" href="#learn-reverse-engineering" aria-hidden="true">#</a> Learn Reverse Engineering</h1><h2 id="基础概念" tabindex="-1"><a class="header-anchor" href="#基础概念" aria-hidden="true">#</a> 基础概念</h2><h3 id="计算机软件中的脱壳是指什么" tabindex="-1"><a class="header-anchor" href="#计算机软件中的脱壳是指什么" aria-hidden="true">#</a> 计算机软件中的脱壳是指什么？</h3><p>在计算机软件领域，&quot;脱壳&quot;（Unpacking）是指去除软件保护层的过程。很多软件开发者为了防止未授权的复制和分发，保护他们的软件不被逆向工程（Reverse Engineering）轻易分析，会使用一种叫做&quot;壳&quot;（Shell）的技术来加密或包装他们的程序。这个&quot;壳&quot;在软件运行时动态地解密原始的程序代码，让它可以正常执行，但是不易被直接分析。</p><p>脱壳是逆向工程中的一个重要步骤，目的是移除这层加密或包装，恢复出接近原始代码的形态，以便进行进一步的分析和理解软件的工作原理。脱壳通常需要专门的工具和深厚的技术知识。它在合法的场景下被用于安全分析，比如病毒分析和漏洞研究，帮助安全研究人员理解恶意软件的行为或找到软件的安全漏洞。</p><p>然而，脱壳技术也可能被用于非法目的，比如破解软件的版权保护、制造和分发盗版软件。这种行为不仅违反了软件的许可协议，也可能违反了相关的版权法律。</p><p>因此，虽然脱壳和逆向工程技术在某些情况下对提高网络安全和软件质量有正面的贡献，但它们的使用需要在遵守法律和道德原则的前提下进行。</p><h3 id="如何识别软件的壳" tabindex="-1"><a class="header-anchor" href="#如何识别软件的壳" aria-hidden="true">#</a> 如何识别软件的壳？</h3><p>识别软件是否使用了壳以及具体使用了哪种壳，对于进行合法的安全分析和逆向工程尤其重要。这里有几种方法可以帮助识别软件的壳：</p><h4 id="_1-使用壳识别工具" tabindex="-1"><a class="header-anchor" href="#_1-使用壳识别工具" aria-hidden="true">#</a> 1. 使用壳识别工具</h4><p>有一些专门的工具和软件可以帮助自动检测和识别常见的壳，例如：</p><ul><li><strong>PEiD</strong>：是最著名的壳识别工具之一，可以识别大量不同的壳和加密包装器。</li><li><strong>Detect It Easy (DiE)</strong>：一个更现代的工具，具有图形用户界面，能够识别许多种类的壳，并且经常更新来支持新的壳类型。</li><li><strong>RDG Packer Detector</strong>：是另一个流行的工具，用于检测软件中的壳和加密包装器。</li></ul><h4 id="_2-手动检查" tabindex="-1"><a class="header-anchor" href="#_2-手动检查" aria-hidden="true">#</a> 2. 手动检查</h4><p>除了自动化工具外，还可以通过一些手动方法来识别壳，比如：</p><ul><li><strong>查看程序的导入表（Import Table）</strong>：许多壳在加壳过程中会修改程序的导入表，引入不寻常或额外的库和函数调用。</li><li><strong>观察程序行为</strong>：运行软件并观察其行为，使用诸如Process Explorer或Process Monitor之类的工具，可以帮助识别出异常行为，这些可能是壳所引起的。</li><li><strong>代码分析</strong>：使用逆向工程工具（如IDA Pro、Ghidra）分析程序的汇编代码，寻找典型的壳特征，比如大量的跳转指令、异常的代码结构或是解密例程。</li></ul><h4 id="_3-查看字符串和资源" tabindex="-1"><a class="header-anchor" href="#_3-查看字符串和资源" aria-hidden="true">#</a> 3. 查看字符串和资源</h4><p>在一些情况下，壳程序会在软件中留下特定的字符串或资源标识，通过查看这些信息也可以发现壳的痕迹。</p><h4 id="_4-注意程序大小和结构" tabindex="-1"><a class="header-anchor" href="#_4-注意程序大小和结构" aria-hidden="true">#</a> 4. 注意程序大小和结构</h4><p>加壳的程序通常会因为壳的加入而在大小上有所不同。此外，壳可能会改变程序的文件结构，例如增加额外的节（Sections）。</p><p>使用这些方法可以帮助你确定一个程序是否使用了壳以及使用了哪种壳。然而，需要注意的是，一些更复杂的壳或是定制的壳可能很难通过自动或手动的方法来识别。在这种情况下，深入的分析和专业的逆向工程技能就显得尤为重要。而且，无论是进行壳的识别还是后续的逆向工程工作，都应确保在合法和道德的范围内进行。</p><h3 id="逆向软件-peid、die64、od" tabindex="-1"><a class="header-anchor" href="#逆向软件-peid、die64、od" aria-hidden="true">#</a> 逆向软件 PEID、DIE64、OD</h3><p>PIED、DIE64查壳工具。</p><h3 id="汇编指令" tabindex="-1"><a class="header-anchor" href="#汇编指令" aria-hidden="true">#</a> 汇编指令</h3><ul><li>https://shell-storm.org/x86doc/</li></ul><p>汇编语言是一种低级编程语言，它与机器代码非常接近，但使用人类可读的文本格式表示。汇编指令通常对应于处理器的机器指令集。下面列出了一些常用的汇编指令，这些指令以x86架构为例，这是最常见的个人计算机处理器架构之一：</p><h4 id="数据传输指令" tabindex="-1"><a class="header-anchor" href="#数据传输指令" aria-hidden="true">#</a> 数据传输指令</h4><ul><li><strong>MOV</strong>：将数据从一个位置移动到另一个位置（例如，<code>MOV AX, BX</code> 将BX寄存器的内容复制到AX寄存器）。</li><li><strong>PUSH</strong>：将一个寄存器或值压入栈中（例如，<code>PUSH AX</code>）。</li><li><strong>POP</strong>：从栈中弹出最顶端的值到一个寄存器（例如，<code>POP AX</code>）。</li></ul><h4 id="算术指令" tabindex="-1"><a class="header-anchor" href="#算术指令" aria-hidden="true">#</a> 算术指令</h4><ul><li><strong>ADD</strong>：加法（例如，<code>ADD AX, BX</code> 将AX和BX的值相加，结果存储在AX中）。</li><li><strong>SUB</strong>：减法（例如，<code>SUB AX, BX</code> 从AX中减去BX的值，结果存储在AX中）。</li><li><strong>MUL</strong>：无符号乘法（例如，<code>MUL BX</code> 用AX寄存器的值乘以BX的值，结果存储在AX或DX:AX中）。</li><li><strong>DIV</strong>：无符号除法（例如，<code>DIV BX</code> 用AX或DX:AX的值除以BX的值）。</li></ul><h4 id="比较和跳转指令" tabindex="-1"><a class="header-anchor" href="#比较和跳转指令" aria-hidden="true">#</a> 比较和跳转指令</h4><ul><li><strong>CMP</strong>：比较两个操作数（例如，<code>CMP AX, BX</code> 比较AX和BX的值）。</li><li><strong>JMP</strong>：无条件跳转到指定的地址或标签（例如，<code>JMP LABEL</code> 跳转到LABEL标签处）。</li><li><strong>JE/JZ</strong>：如果上一次的操作结果为零（即相等），则跳转（例如，<code>JE LABEL</code>）。</li><li><strong>JNE/JNZ</strong>：如果上一次的操作结果不为零（即不相等），则跳转（例如，<code>JNE LABEL</code>）。</li></ul><h4 id="逻辑和位操作指令" tabindex="-1"><a class="header-anchor" href="#逻辑和位操作指令" aria-hidden="true">#</a> 逻辑和位操作指令</h4><ul><li><strong>AND</strong>：逻辑与操作（例如，<code>AND AX, BX</code> 对AX和BX进行AND操作，结果存储在AX中）。</li><li><strong>OR</strong>：逻辑或操作（例如，<code>OR AX, BX</code> 对AX和BX进行OR操作，结果存储在AX中）。</li><li><strong>XOR</strong>：逻辑异或操作（例如，<code>XOR AX, BX</code> 对AX和BX进行XOR操作，结果存储在AX中）。</li><li><strong>NOT</strong>：逻辑非操作，对操作数进行位取反（例如，<code>NOT AX</code> 对AX中的每一位进行取反操作）。</li></ul><h4 id="控制流指令" tabindex="-1"><a class="header-anchor" href="#控制流指令" aria-hidden="true">#</a> 控制流指令</h4><ul><li><strong>CALL</strong>：调用子程序（例如，<code>CALL SUBROUTINE</code> 调用一个名为SUBROUTINE的函数）。</li><li><strong>RET</strong>：从子程序返回。</li></ul><p>这些指令是汇编语言编程的基础，不同的处理器架构可能有自己特定的指令集。学习汇编语言能够帮助程序员更好地理解计算机的工作原理，以及如何优化高级语言编写的程序。</p><h3 id="易语言汇编标识" tabindex="-1"><a class="header-anchor" href="#易语言汇编标识" aria-hidden="true">#</a> 易语言汇编标识</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>00401000   .  33C0          xor eax,eax
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h3 id="do" tabindex="-1"><a class="header-anchor" href="#do" aria-hidden="true">#</a> DO</h3><ul><li>https://www.52pojie.cn/thread-1359616-1-1.html</li></ul><p>第一个是代码区，就是显示汇编代码的地方，我们查看程序执行代码就看这个区，还记得我们改跳转进行爆破都是在这个区实现的吗？</p><p>第二个是信息区，显示我们程序运行每句代码的相关信息，比如跳转的地址和一些数据，很多时候当我们在真假码比较的代码执行的时候，在信息区会出现真码。</p><p>第三个区是数据区，就是显示程序的数据的地方，我们想看某个地址里面的值，就在这个区域里查看。查看某个地址的数据和在代码区查看某个地址的代码的方法是一样的，就是在所在的区的任意位置按CTRL+G，然后输入地址，点确定。</p><p>第四个区是寄存器区，里面会显示寄存器，你看的EAX,ECX,EBX,EDX等八个首字母是E的都叫做寄存器。寄存器的作用和程序的其他内存地址一样，都是用来存放数据的，区别就是寄存器在CPU里面，读取数据的速度比从内存地址里要快，所以我们程序里面的很多运算都是把数据从内存地址里面复制到寄存器里面，然后进行运算，运算结束后，再把运算结果复制到内存地址里面，寄存器就等待着下一次的运算任务。所以你会在程序的汇编代码区看到有很多的数据转移命令，比如MOV ，PUSH等等。其实在汇编代码里面把这些数据转移和数据计算的代码去掉，剩下的代码就很有限了，主要剩的就是跳转指令、判断指令和CALL了，到现在你还看不懂汇编代码吗？另外，在这些寄存器里面，我们特别需要关注的就是EAX，我们以前说过，所有子程序也就是CALL的返回值都存放在EAX里面。</p><p>最后一个区是堆栈区。堆栈也是内存的一部分，它的特殊之处就在于它总是和子程序（CALL）相关联，堆栈里面的地址存放的数据有三种类型，一是存放调用某个CALL下面一行代码的地址。二是存放CALL的参数。三是CALL在运行过程中的变量值。</p><h2 id="hello-world-release" tabindex="-1"><a class="header-anchor" href="#hello-world-release" aria-hidden="true">#</a> hello world release</h2><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&quot;stdafx.h&quot;</span></span>

<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span> <span class="token keyword">char</span><span class="token operator">*</span> argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token punctuation">{</span>
	<span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello World!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这段代码展示了一个较为复杂的程序流程，其中涉及到多个函数调用、异常处理设置、以及对一些系统API的调用。以下是对这两段代码的概要解释：</p><h3 id="第一部分-高级异常处理和系统调用-从-00401041-开始" tabindex="-1"><a class="header-anchor" href="#第一部分-高级异常处理和系统调用-从-00401041-开始" aria-hidden="true">#</a> 第一部分：高级异常处理和系统调用（从 00401041 开始）</h3><ol><li><p><strong>设置异常处理程序：</strong></p><ul><li><strong>00401041-00401050</strong>：通过构造一个结构并推入结构到一个链表来设置异常处理程序。这在Windows程序中是常见的异常处理方式。</li></ul></li><li><p><strong>调用系统API：</strong></p><ul><li><strong>00401067</strong>：调用<code>GetVersion</code>函数获取系统版本信息。</li><li><strong>004010B5</strong>：调用<code>GetCommandLineA</code>获取命令行参数。</li></ul></li><li><p><strong>处理和存储系统信息：</strong></p><ul><li>代码中通过移位和逻辑运算处理了从<code>GetVersion</code>获得的信息，并将处理后的信息存储到特定的内存位置。</li></ul></li><li><p><strong>进一步的函数调用：</strong></p><ul><li>从 <strong>0040109A</strong> 到 <strong>004010FC</strong>，进行了多次函数调用，这可能涉及到程序的初始化流程、配置读取、或者其他前期准备工作。</li></ul></li><li><p><strong>调用自身的递归或循环调用：</strong></p><ul><li><strong>004010F0</strong>：通过调用地址<code>00401000</code>，这可能是一个递归调用或者循环调用自身的方式，用于处理或显示&quot;Hello World!\\n&quot;字符串。</li></ul></li></ol><h3 id="第二部分-简单的字符串处理和函数调用-从-00401000-开始" tabindex="-1"><a class="header-anchor" href="#第二部分-简单的字符串处理和函数调用-从-00401000-开始" aria-hidden="true">#</a> 第二部分：简单的字符串处理和函数调用（从 00401000 开始）</h3><p>这一部分是一个较简单的函数调用流程，显示了字符串处理和调用另一个函数的过程：</p><ul><li><strong>00401000</strong>：将&quot;Hello World!\\n&quot;字符串的地址压栈，准备作为参数。</li><li><strong>00401005</strong>：调用另一个函数（位于00401010），可能用于输出或处理传递的字符串。</li><li><strong>0040100A</strong>：调整堆栈，清除传递给函数的参数。</li><li><strong>0040100D</strong>：清零<code>eax</code>，可能表示函数成功执行。</li><li><strong>0040100F</strong>：返回到调用者。</li></ul><h3 id="综合分析" tabindex="-1"><a class="header-anchor" href="#综合分析" aria-hidden="true">#</a> 综合分析</h3><p>整个代码展示了Windows编程中常见的异常处理设置、系统API调用、以及如何通过堆栈传递参数给函数的基本方法。此外，通过对不同地址空间中数据的操作，展示了程序如何处理和存储重要的运行时信息。最终，通过多个层次的函数调用，展示了程序的执行流程，如何组织代码以实现复杂的功能。</p><h2 id="funs" tabindex="-1"><a class="header-anchor" href="#funs" aria-hidden="true">#</a> funs</h2><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token comment">// VCDemo2.cpp : Defines the entry point for the console application.</span>
<span class="token comment">//</span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&quot;stdafx.h&quot;</span></span>

<span class="token keyword">void</span> <span class="token function">fun1</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello 1!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">void</span> <span class="token function">fun2</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
	<span class="token keyword">int</span> x <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
	<span class="token keyword">if</span> <span class="token punctuation">(</span>x <span class="token operator">==</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
		<span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello 2!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token punctuation">}</span>

<span class="token punctuation">}</span>

<span class="token keyword">void</span> <span class="token function">fun3</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello 3!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span> <span class="token keyword">char</span><span class="token operator">*</span> argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token punctuation">{</span>
	
	<span class="token function">fun1</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token function">fun2</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token function">fun3</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>00401000  /$  68 30704000   push VCDemo2.00407030                                      ;  ASCII &quot;Hello 1!\\n&quot;
00401005  |.  E8 46000000   call VCDemo2.00401050
0040100A  |.  59            pop ecx                                                    ;  VCDemo2.00407048
0040100B  \\.  C3            retn
0040100C      90            nop
0040100D      90            nop
0040100E      90            nop
0040100F      90            nop
00401010  /$  68 3C704000   push VCDemo2.0040703C                                      ;  ASCII &quot;Hello 2!\\n&quot;
00401015  |.  E8 36000000   call VCDemo2.00401050
0040101A  |.  59            pop ecx                                                    ;  VCDemo2.00407048
0040101B  \\.  C3            retn
0040101C      90            nop
0040101D      90            nop
0040101E      90            nop
0040101F      90            nop
00401020  /$  68 48704000   push VCDemo2.00407048                                      ;  ASCII &quot;Hello 3!\\n&quot;
00401025  |.  E8 26000000   call VCDemo2.00401050
0040102A  |.  59            pop ecx                                                    ;  VCDemo2.00407048
0040102B  \\.  C3            retn
0040102C      90            nop
0040102D      90            nop
0040102E      90            nop
0040102F      90            nop
00401030  /$  E8 CBFFFFFF   call VCDemo2.00401000
00401035  |.  E8 D6FFFFFF   call VCDemo2.00401010
0040103A  |.  E8 E1FFFFFF   call VCDemo2.00401020
0040103F  |.  33C0          xor eax,eax
00401041  \\.  C3            retn
00401042      90            nop
00401043      90            nop
00401044      90            nop
00401045      90            nop
00401046      90            nop
00401047      90            nop
00401048      90            nop
00401049      90            nop
0040104A      90            nop
0040104B      90            nop
0040104C      90            nop
0040104D      90            nop
0040104E      90            nop
0040104F      90            nop
00401050  /$  53            push ebx
00401051  |.  56            push esi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
00401052  |.  BE 88704000   mov esi,VCDemo2.00407088
00401057  |.  57            push edi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
00401058  |.  56            push esi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
00401059  |.  E8 4B010000   call VCDemo2.004011A9
0040105E  |.  8BF8          mov edi,eax
00401060  |.  8D4424 18     lea eax,dword ptr ss:[esp+0x18]
00401064  |.  50            push eax
00401065  |.  FF7424 18     push dword ptr ss:[esp+0x18]
00401069  |.  56            push esi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
0040106A  |.  E8 04020000   call VCDemo2.00401273
0040106F  |.  56            push esi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
00401070  |.  57            push edi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
00401071  |.  8BD8          mov ebx,eax
00401073  |.  E8 BE010000   call VCDemo2.00401236
00401078  |.  83C4 18       add esp,0x18
0040107B  |.  8BC3          mov eax,ebx
0040107D  |.  5F            pop edi                                                    ;  VCDemo2.&lt;ModuleEntryPoint&gt;
0040107E  |.  5E            pop esi                                                    ;  VCDemo2.&lt;ModuleEntryPoint&gt;
0040107F  |.  5B            pop ebx
00401080  \\.  C3            retn
00401081 &gt;/$  55            push ebp
00401082  |.  8BEC          mov ebp,esp
00401084  |.  6A FF         push -0x1
00401086  |.  68 B0604000   push VCDemo2.004060B0
0040108B  |.  68 C8264000   push VCDemo2.004026C8                                      ;  SE 处理程序安装
00401090  |.  64:A1 0000000&gt;mov eax,dword ptr fs:[0]
00401096  |.  50            push eax
00401097  |.  64:8925 00000&gt;mov dword ptr fs:[0],esp
0040109E  |.  83EC 10       sub esp,0x10
004010A1  |.  53            push ebx
004010A2  |.  56            push esi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
004010A3  |.  57            push edi                                                   ;  VCDemo2.&lt;ModuleEntryPoint&gt;
004010A4  |.  8965 E8       mov [local.6],esp
004010A7  |.  FF15 04604000 call dword ptr ds:[&lt;&amp;KERNEL32.GetVersion&gt;]                 ;  kernel32.GetVersion
004010AD  |.  33D2          xor edx,edx
004010AF  |.  8AD4          mov dl,ah
004010B1  |.  8915 28994000 mov dword ptr ds:[0x409928],edx
004010B7  |.  8BC8          mov ecx,eax
004010B9  |.  81E1 FF000000 and ecx,0xFF
004010BF  |.  890D 24994000 mov dword ptr ds:[0x409924],ecx                            ;  VCDemo2.00407048
004010C5  |.  C1E1 08       shl ecx,0x8
004010C8  |.  03CA          add ecx,edx
004010CA  |.  890D 20994000 mov dword ptr ds:[0x409920],ecx                            ;  VCDemo2.00407048
004010D0  |.  C1E8 10       shr eax,0x10
004010D3  |.  A3 1C994000   mov dword ptr ds:[0x40991C],eax
004010D8  |.  6A 00         push 0x0
004010DA  |.  E8 92140000   call VCDemo2.00402571
004010DF  |.  59            pop ecx                                                    ;  VCDemo2.00407048
004010E0  |.  85C0          test eax,eax
004010E2  |.  75 08         jnz short VCDemo2.004010EC
004010E4  |.  6A 1C         push 0x1C
004010E6  |.  E8 9A000000   call VCDemo2.00401185
004010EB  |.  59            pop ecx                                                    ;  VCDemo2.00407048
004010EC  |&gt;  8365 FC 00    and [local.1],0x0
004010F0  |.  E8 5C110000   call VCDemo2.00402251
004010F5  |.  FF15 00604000 call dword ptr ds:[&lt;&amp;KERNEL32.GetCommandLineA&gt;]            ; [GetCommandLineA
004010FB  |.  A3 24AE4000   mov dword ptr ds:[0x40AE24],eax
00401100  |.  E8 1A100000   call VCDemo2.0040211F
00401105  |.  A3 F8984000   mov dword ptr ds:[0x4098F8],eax
0040110A  |.  E8 C30D0000   call VCDemo2.00401ED2
0040110F  |.  E8 050D0000   call VCDemo2.00401E19
00401114  |.  E8 7A0A0000   call VCDemo2.00401B93
00401119  |.  A1 38994000   mov eax,dword ptr ds:[0x409938]
0040111E  |.  A3 3C994000   mov dword ptr ds:[0x40993C],eax
00401123  |.  50            push eax
00401124  |.  FF35 30994000 push dword ptr ds:[0x409930]
0040112A  |.  FF35 2C994000 push dword ptr ds:[0x40992C]
00401130  |.  E8 FBFEFFFF   call VCDemo2.00401030
00401135  |.  83C4 0C       add esp,0xC
00401138  |.  8945 E4       mov [local.7],eax
0040113B  |.  50            push eax
0040113C  |.  E8 7F0A0000   call VCDemo2.00401BC0
00401141  |.  8B45 EC       mov eax,[local.5]
00401144  |.  8B08          mov ecx,dword ptr ds:[eax]
00401146  |.  8B09          mov ecx,dword ptr ds:[ecx]
00401148  |.  894D E0       mov [local.8],ecx                                          ;  VCDemo2.00407048
0040114B  |.  50            push eax
0040114C  |.  51            push ecx                                                   ;  VCDemo2.00407048
0040114D  |.  E8 430B0000   call VCDemo2.00401C95
00401152  |.  59            pop ecx                                                    ;  VCDemo2.00407048
00401153  |.  59            pop ecx                                                    ;  VCDemo2.00407048
00401154  \\.  C3            retn


</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="cmp" tabindex="-1"><a class="header-anchor" href="#cmp" aria-hidden="true">#</a> cmp</h2><div class="language-c line-numbers-mode" data-ext="c"><pre class="language-c"><code><span class="token comment">// VCDemo2.cpp : Defines the entry point for the console application.</span>
<span class="token comment">//</span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&quot;stdafx.h&quot;</span></span>

<span class="token keyword">void</span> <span class="token function">fun1</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello 1!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">void</span> <span class="token function">fun2</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token operator">*</span> x<span class="token punctuation">)</span> <span class="token punctuation">{</span>

	<span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">*</span>x <span class="token operator">==</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
		<span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello 2!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token punctuation">}</span>

<span class="token punctuation">}</span>

<span class="token keyword">void</span> <span class="token function">fun3</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">&quot;Hello 3!\\n&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span> <span class="token keyword">char</span><span class="token operator">*</span> argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token punctuation">{</span>
	<span class="token keyword">int</span> x <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
	<span class="token function">fun1</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token function">fun2</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>x<span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token function">fun3</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
	<span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>00401010  /$  8B4424 04     mov eax,dword ptr ss:[esp+0x4]
00401014  |?  8338 01       cmp dword ptr ds:[eax],0x1
00401017  |?  75 0B         jnz short VCDemo2.00401024
00401019  |?  68 3C704000   push VCDemo2.0040703C                                      ;  ASCII &quot;Hello 2!\\n&quot;
0040101E      E8 4D000000   call VCDemo2.00401070
00401023  |?  59            pop ecx                                                    ;  VCDemo2.00401058
00401024  |?  C3            retn
00401025  |.  90            nop
00401026  |?  90            nop
00401027  |?  90            nop
00401028  |?  90            nop
00401029  |?  90            nop
0040102A  |.  90            nop
0040102B  \\.  90            nop
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>这段代码展示了一个简单的条件判断和函数调用流程。下面是对这段代码的逐行解释：</p><ol><li><p><strong>00401010</strong>：<code>mov eax, dword ptr ss:[esp+0x4]</code></p><ul><li>这行代码从栈上获取第一个参数（通常在调用函数时，参数是压入栈中的）并将其移动到 <code>eax</code> 寄存器中。<code>esp</code> 寄存器指向栈顶，<code>esp+0x4</code> 通常是函数的第一个参数的位置，因为 <code>esp</code> 本身的位置是返回地址。</li></ul></li><li><p><strong>00401014</strong>：<code>cmp dword ptr ds:[eax], 0x1</code></p><ul><li>比较 <code>eax</code> 寄存器指向的内存位置的值是否等于 <code>1</code>。这里假设 <code>eax</code> 指向的是一个地址，而该地址处存储的值被用于条件判断。</li></ul></li><li><p><strong>00401017</strong>：<code>jnz short VCDemo2.00401024</code></p><ul><li>如果上一条 <code>cmp</code> 指令的结果不是零（意味着 <code>eax</code> 指向的值不等于 <code>1</code>），则跳转到地址 <code>00401024</code>，即直接返回，不执行接下来的指令。</li></ul></li><li><p><strong>00401019</strong>：<code>push VCDemo2.0040703C</code></p><ul><li>如果条件判断通过（即 <code>eax</code> 指向的值等于 <code>1</code>），这条指令将字符串 &quot;Hello 2!\\n&quot; 的地址压入栈中，准备作为参数调用另一个函数。</li></ul></li><li><p><strong>0040101E</strong>：<code>call VCDemo2.00401070</code></p><ul><li>调用位于 <code>00401070</code> 的函数，这个函数可能是打印字符串或进行其他处理。</li></ul></li><li><p><strong>00401023</strong>：<code>pop ecx</code></p><ul><li>函数调用返回后，这条指令从栈上弹出之前压入的参数，以清理栈空间。这是因为 <code>call</code> 指令后，参数仍然留在栈上，需要手动移除。</li></ul></li><li><p><strong>00401024</strong>：<code>retn</code></p><ul><li>返回指令，结束函数执行，将控制权返回给调用者。</li></ul></li><li><p><strong>00401025 - 0040102B</strong>：<code>nop</code></p><ul><li>这些是空操作指令（No Operation），不执行任何操作。它们可能用于占位，以保持代码的对齐或为将来的修改预留空间。</li></ul></li></ol><p>总结来说，这段代码在根据某个条件（<code>eax</code> 指向的值是否为 <code>1</code>）来决定是否调用另一个函数执行某些操作，例如打印一个字符串。这种模式在编程中很常见，用于基于条件执行不同的代码路径。</p><h2 id="相关入门课程" tabindex="-1"><a class="header-anchor" href="#相关入门课程" aria-hidden="true">#</a> 相关入门课程</h2><ul><li>https://www.52pojie.cn/thread-1358649-1-1.html</li></ul>`,66),o=[l];function d(t,c){return s(),e("div",null,o)}const r=n(i,[["render",d],["__file","Learn-Reverse-Engineering.html.vue"]]);export{r as default};