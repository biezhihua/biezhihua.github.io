---
tag:
  - android
  - problem
---


# Android | 问题排查 | Native Crash Problems

## 关于Native Crash的类型

一般来说，在Android平台上，将出现在JNI、C++、C中的Crash称为Native Crash。

Google官方将[NativeCrash](https://source.android.com/docs/core/tests/debug/native-crash)分类多种类型，并列举了经常碰到的10种：
- Abort
- Pure null pointer dereference
- Low-address null pointer dereference
- FORTIFY failure
- Stack corruption detected by -fstack-protector
- Seccomp SIGSYS from a disallowed system call
- Execute-only memory violation (Android 10 only)
- Error detected by fdsan
- Investigating crash dumps
- Reading tombstones

其中最为我们所熟知的就是`Pure null pointer dereference`空指针异常，它的Crash堆栈如下：
```shell
pid: 25326, tid: 25326, name: crasher  >>> crasher <<<
signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0
    ....

backtrace:
    ....
```

而`Pure null pointer dereference`类型的空指针异常实际上却是`Low-address null pointer dereference`类型空指针异常的一种特殊类型，它的Crash堆栈如下：
```shell
pid: 25405, tid: 25405, name: crasher  >>> crasher <<<
signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xc
    ....

backtrace:
    ....
```

两者非常类似，仅有fault addr不同，这方面的差异Google文档中有详细说明，可自行查阅。

## 识别错误类型

近期碰到了一例出现在GaiaX内的stretch.so的空指针异常，由于stretch.so是用rust编写和生成的so，与常规该问题的排查流程不太一致，所以这里记录一下本次的排查过程。

这里首先贴一下Crash信息，先做下基本的排查。

```shell
pid: 19586, tid: 19586  >>> com.xxx.xxx <<<
signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 000000000000009f
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
    #00 pc 0xf388 libstretch.so (Java_app_visly_stretch_Node_nSetStyle+12)
    #01 pc 0xa14 base.odex
```

我们可以得出一些基础的信息：
- 第2行，`signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 000000000000009f`
    - 符合第三种错误类型`Low-address null pointer dereference`的描述，简单来说就是个空指针错误。
- 第29行，`#00 pc 0xf388 libstretch.so (Java_app_visly_stretch_Node_nSetStyle+12)`
    - 发生Crash的so名称 - `libstretch.so`。
    - 发生Crash的方法名 - `Java_app_visly_stretch_Node_nSetStyle`。
    - 发生Crash的错误地址(fault address) - `0xf388`。

## 定位错误行数

### addr2line工具介绍

这里要先介绍一款工具 - [addr2line](https://linux.die.net/man/1/addr2line)，它能显示一个地址的源码文件名和行数，可以帮助我们定位Native Crash的错误行数。

它的常用命令为：
```shell
# addr2line - convert addresses into file names and line numbers.
# -i --inlines If the address belongs to a function that was inlined, the source information for all enclosing scopes back to the first  non-inlined function will also be printed.
# -C --demangle[=style] Decode (demangle) low-level symbol names into user-level names.
# -f --functions Display function names as well as file and line number information.
# -e --exe=filename Specify the name of the executable for which addresses should be translated.
./addr2line [-C] [-i] [-f] [-e filename] [addr]
./addr2line -C -i -f -e ./xxx.so 0x0c
```

值得注意的，addr2line工具的目标so需要带有symbol符号信息，才能正确的显示出源码文件和行数。

对没有符号的so使用addr2line，结果示例：
```shell
/aarch64-linux-android-addr2line -i -C -f -e ./libstretch.so  0xf388
Java_app_visly_stretch_Node_nSetStyle
:?
```

对有符号的so使用add2line，结果示例：
```shell
./aarch64-linux-android-addr2line -i -C -f -e ./libstretch.so  0xf388
Java_app_visly_stretch_Node_nSetStyle
./GaiaX/GaiaXStretch/bindings/kotlin/stretch/src/main/rust/src/lib.rs:364
```

### 为stretch.so增加符号信息

根据addr2line的使用条件，需要为stretch.so增加符号信息。由于stretch.so是使用Rust打包出来的，所以为打包命令增加`RUSTFLAGS=-g`的标记，打包命令如下：
```shell
RUSTFLAGS=-g   cargo build --target=aarch64-linux-android --release
```

当然还有其他方法，可以参考[这里](https://stackoverflow.com/questions/38803760/how-to-get-a-release-build-with-debugging-information-when-using-cargo)。

### 定位问题行数

通过使用addr2line和带有symbol的so，可以得到具体的错误行数：
```shell
./aarch64-linux-android-addr2line -i -C -f -e ./libstretch.so  0xf388
Java_app_visly_stretch_Node_nSetStyle
./GaiaX/GaiaXStretch/bindings/kotlin/stretch/src/main/rust/src/lib.rs:364
```

具体错误代码为：
```Rust
352 #[no_mangle]
353 pub unsafe extern "C" fn Java_app_visly_stretch_Node_nSetStyle(
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
```

可以得知在364行为node设置style发生空指针异常，其根源就是*style引用有问题：
```
364     stretch.set_style(*node, *style).unwrap();
```

## 问题修复

通过上下文推断可以知道是`style`的引用传递有问题。反推到Java层，可以得知在`setStyle`函数中未对`style.rustptr`做合法性判断：

错误代码：
```
fun setStyle(style: Style) {
    synchronized(Stretch::class.java) {
        // 未对style.rustptr做合法性判断
        nSetStyle(Stretch.ptr, rustptr, style.rustptr)
        this.style = style
    }
}
```

修复代码：
```
fun safeSetStyle(style: Style): Boolean {
    synchronized(Stretch::class.java) {
        // 对style.rustptr做合法性判断
        if (rustptr != -1L && style.rustptr != -1L) {
            nSetStyle(Stretch.ptr, rustptr, style.rustptr)
            this.style = style
            return true
        } else {
            return false
        }
    }
}
```

## 问题验证

当我们完成代码修复后工作后，别忘记还有最重要的一个步骤，就是问题的验证。 

问题的验证分为多种类型，我们这里选择一劳永逸的方式：**在单元测试中复现错误，验证修复结果，并将单元测试加入到自动化测试中**。

如此一来此问题就再也不会出现在我们的项目中了。

测试用例如下：
```kotlin
@Test
fun node_set_style_null_pointer() {
    Stretch.init()

    val style1 = Style()
    style1.safeInit()
    val node = Node("node", style1)

    val style2 = Style()
    style2.safeInit()
    style2.safeFree()

    // 复现问题场景，设置已经释放的style
    val safeSetStyle = node.safeSetStyle(style2)

    // 验证safeSetStyle是否执行成功
    Assert.assertEquals(false, safeSetStyle)
}
```

当我们使用未修复的代码执行该单元测试时，会在logcat中发现如下错误，它的关键信息和在真实App出现的Crash几乎一模一样，这就代表完美复现了正式环境中的错误：
```
A  Build fingerprint: 'Android/sdk_phone_x86/generic_x86:11/RSR1.210210.001.A1/7193139:userdebug/dev-keys'
A  Revision: '0'
A  ABI: 'x86'
A  Timestamp: 2023-03-09 14:30:34+0800
A  pid: 27566, tid: 27588, name: roidJUnitRunner  >>> com.alibaba.gaiax.test <<<
A  uid: 10127
A  signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0xffffffff
A      eax ffffffff  ebx c6f35f54  ecx 000000d4  edx c7154bb8
A      edi c7154bb8  esi 00000000
A      ebp 00000000  esp c7154b70  eip f5fdf3cb
A  backtrace:
A        #00 pc 000563cb  /apex/com.android.runtime/lib/bionic/libc.so (memmove_generic+219) (BuildId: 6e3a0180fa6637b68c0d181c343e6806)
A        #01 pc 0000d80e  /data/app/~~YUo3uOKA7Gzgqd3nfNHytA==/com.alibaba.gaiax.test-JJGLuWJRiWwhUZw00pvfKg==/lib/x86/libstretch.so (Java_app_visly_stretch_Node_nSetStyle+78)
A        #02 pc 001422b2  /apex/com.android.art/lib/libart.so (art_quick_generic_jni_trampoline+82) (BuildId: bf39832c4acabbc939d5c516b6f1d211)
```

最后，当我们使用修复过的代码执行该单元测试时，它会正常通过。

## 引用
- https://github.com/alibaba/GaiaX/pull/358
- https://stackoverflow.com/questions/38803760/how-to-get-a-release-build-with-debugging-information-when-using-cargo
- https://linux.die.net/man/1/addr2line
- https://source.android.com/docs/core/tests/debug/native-crash
- https://www.cnblogs.com/rocket-ban/p/14717425.html
- https://blog.csdn.net/toyauko/article/details/82416429