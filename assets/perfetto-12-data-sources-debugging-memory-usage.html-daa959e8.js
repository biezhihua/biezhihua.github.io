import{_ as e,Y as a,Z as i,a2 as r}from"./framework-301d0703.js";const h={},n=r('<h1 id="perfetto-12-debugging-memory-usage-on-android" tabindex="-1"><a class="header-anchor" href="#perfetto-12-debugging-memory-usage-on-android" aria-hidden="true">#</a> Perfetto - 12 - Debugging memory usage on Android</h1><h2 id="prerequisites" tabindex="-1"><a class="header-anchor" href="#prerequisites" aria-hidden="true">#</a> Prerequisites</h2><h2 id="dumpsys-meminfo" tabindex="-1"><a class="header-anchor" href="#dumpsys-meminfo" aria-hidden="true">#</a> dumpsys meminfo</h2><h2 id="linux-memory-management" tabindex="-1"><a class="header-anchor" href="#linux-memory-management" aria-hidden="true">#</a> Linux memory management</h2><p>但是清洁，肮脏，Rss, Pss, Swap到底是什么意思呢?要回答这个问题，我们需要深入研究一下Linux内存管理。</p><p>从内核的角度来看，内存被分割成大小相同的块，称为页面。一般是4KiB。</p><p>页面被组织在称为VMA(虚拟内存区域)的几乎连续的范围内。</p><p>vma是进程通过mmap()系统调用请求新的内存页池时创建的。应用程序很少直接调用mmap()。这些调用通常由分配器、本机进程的malloc()/operator new()或Java应用程序的Android RunTime进行调解。</p><p>vma有两种类型:文件支持的和匿名的。</p><p>文件支持的vma是内存中文件的视图。它们是通过向mmap()传递文件描述符获得的。内核将通过传递的文件在VMA上提供页面错误，因此读取指向VMA的指针就相当于读取文件上的read()。文件支持的vma在执行新进程或动态加载库时被动态链接器(ld)使用，或者在加载新的.dex库或访问APK中的资源时被Android框架使用。</p><p>匿名vma是没有任何文件支持的内存区域。这是分配器从内核请求动态内存的方式。匿名vma调用mmap(…MAP_ANONYMOUS……)。</p><p>只有当应用程序尝试从VMA读取/写入时，才按页粒度分配物理内存。如果你分配了32个MiB的页面，但只使用了一个字节，你的进程的内存使用量只会增加4KiB。这样，进程的虚拟内存增加了32mib，但常驻物理内存增加了4kib。</p><p>当优化程序的内存使用时，我们感兴趣的是减少它们在物理内存中的占用。在现代平台上，高虚拟内存使用通常不是一个值得关注的问题(除非您耗尽了地址空间，这在64位系统上非常困难)。</p><p>我们把驻留在物理内存中的进程内存大小称为RSS(常驻集大小)RSS (Resident Set Size)。不过，并不是所有的常驻内存都是一样的。</p><p>从内存消耗的角度来看，VMA中的各个页面可以有以下状态:</p><ul><li>常驻:映射到物理内存页。常驻页面可以有两种状态: <ul><li>清理(仅适用于文件支持的页面):页面的内容与磁盘上的内容相同。在内存压力大的情况下，内核可以更容易地清除干净的页面。这是因为如果再次需要它们，内核知道它可以通过从底层文件读取它们来重新创建它的内容。</li><li>脏的:页面的内容偏离磁盘，或者(在大多数情况下)，页面没有磁盘备份(即它是匿名的)。不能清除脏页，因为这样做会导致数据丢失。但是，如果存在，它们可以在磁盘或ZRAM上交换。</li></ul></li><li>交换:脏页可以写入磁盘上的交换文件(在大多数Linux桌面发行版上)或压缩(在Android和crs上通过ZRAM)。页面将一直交换，直到在其虚拟地址上发生一个新的页面错误，此时内核将把它带回主内存中。</li><li>不存在:页面上从未发生过页面错误，或者页面是干净的，后来被驱逐。</li></ul><p>通常更重要的是减少脏内存的数量，因为脏内存不能像干净内存一样被回收，而且在Android上，即使在ZRAM中交换，仍然会消耗部分系统内存预算。这就是为什么我们在dumpsys meminfo示例中查看Private Dirty的原因。</p><p>共享内存可以映射到多个进程。这意味着不同进程中的vma指向相同的物理内存。这通常发生在常用库(例如libc)的文件支持内存中。因此，framework.dex)，或者更少见的情况是，当进程fork()和子进程从其父进程继承脏内存时。</p><p>这介绍了PSS(比例集大小)的概念。在PSS中，驻留在多个进程中的内存按比例分配给每个进程。如果我们将一个4KiB的页面映射为四个进程，每个进程的PSS将增加1KiB。</p><p>回顾</p><ul><li>动态分配内存，无论是通过C的malloc()、c++的new()操作符还是Java的new X()分配，总是以匿名和脏的方式开始，除非它从未被使用过。</li><li>如果这个内存在一段时间内没有读/写，或者在内存压力的情况下，它会在ZRAM上被交换出来并被交换。</li><li>匿名内存，无论是常驻内存(因此是脏内存)还是交换内存，总是占用资源，如果没有必要，应该避免使用。</li><li>文件映射内存来自代码(java或本地)、库和资源，几乎总是干净的。干净内存也会消耗系统内存预算，但通常应用程序开发人员对它的控制较少。</li></ul><h2 id="memory-over-time" tabindex="-1"><a class="header-anchor" href="#memory-over-time" aria-hidden="true">#</a> Memory over time</h2><h4 id="rss-high-watermark" tabindex="-1"><a class="header-anchor" href="#rss-high-watermark" aria-hidden="true">#</a> RSS High Watermark</h4><h3 id="memory-tracepoints" tabindex="-1"><a class="header-anchor" href="#memory-tracepoints" aria-hidden="true">#</a> Memory tracepoints</h3><h2 id="which-tool-to-use" tabindex="-1"><a class="header-anchor" href="#which-tool-to-use" aria-hidden="true">#</a> Which tool to use</h2><p>如果您想深入了解由Java代码分配的匿名内存(由dumpsys meminfo标记为Dalvik Heap)，请参阅分析Java堆一节。</p><p>如果您想深入到本机代码分配的匿名内存(由dumpsys meminfo标记为本机堆)，请参阅分析本机堆一节。</p><h2 id="low-memory-kills" tabindex="-1"><a class="header-anchor" href="#low-memory-kills" aria-hidden="true">#</a> Low-memory kills</h2><h2 id="analyzing-the-native-heap" tabindex="-1"><a class="header-anchor" href="#analyzing-the-native-heap" aria-hidden="true">#</a> Analyzing the Native Heap</h2><p>应用程序通常通过malloc或c++的new获取内存，而不是直接从内核获取。分配器确保你的内存被更有效地处理(即没有太多的间隙)，并且请求内核的开销保持在较低的水平。</p><p>我们可以使用heapprofd记录进程的本机分配和释放。生成的概要文件可用于将内存使用情况归因于特定的函数调用栈，支持本机代码和Java代码的混合。概要文件将只显示运行时执行的分配，之前执行的任何分配都不会显示。</p><h3 id="capturing-the-profile" tabindex="-1"><a class="header-anchor" href="#capturing-the-profile" aria-hidden="true">#</a> Capturing the profile</h3><h3 id="viewing-the-data" tabindex="-1"><a class="header-anchor" href="#viewing-the-data" aria-hidden="true">#</a> Viewing the data</h3><h2 id="analyzing-the-java-heap" tabindex="-1"><a class="header-anchor" href="#analyzing-the-java-heap" aria-hidden="true">#</a> Analyzing the Java Heap</h2><h3 id="dumping-the-java-heap" tabindex="-1"><a class="header-anchor" href="#dumping-the-java-heap" aria-hidden="true">#</a> Dumping the java heap</h3><h3 id="viewing-the-data-1" tabindex="-1"><a class="header-anchor" href="#viewing-the-data-1" aria-hidden="true">#</a> Viewing the Data</h3><h2 id="reference" tabindex="-1"><a class="header-anchor" href="#reference" aria-hidden="true">#</a> Reference</h2><ul><li>https://man7.org/linux/man-pages/man2/mmap.2.html</li></ul>',38),t=[n];function d(o,m){return a(),i("div",null,t)}const p=e(h,[["render",d],["__file","perfetto-12-data-sources-debugging-memory-usage.html.vue"]]);export{p as default};