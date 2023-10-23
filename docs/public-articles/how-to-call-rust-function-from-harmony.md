# 如何在HarmonyNext项目中调用三方Rust Native（so）库

## 主机配置

```
MacBook Pro
2.6 GHz 6-Core Intel Core i7
13.1 (22C65)
```

## 对Rust库进行交叉编译得到可在HarmonyNext平台运行的产物

### 工程目录树

我的Rust工程文件目录树如下：
```text
./
├── .gitignore
├── Cargo.lock
├── Cargo.toml
├── aarch64-unknown-linux-ohos-clang++.sh
├── aarch64-unknown-linux-ohos-clang.sh
├── armv7-unknown-linux-ohos-clang++.sh
├── armv7-unknown-linux-ohos-clang.sh
├── config
├── src
│   └── lib.rs
├── x86_64-unknown-linux-ohos-clang++.sh
└── x86_64-unknown-linux-ohos-clang.sh

```

### 什么是交叉编译

介绍下“交叉编译”的概念 - 所谓"交叉编译（Cross_Compile）"，是指编译源代码的平台和执行源代码编译后程序的平台是两个不同的平台。比如，在Intel x86架构/Linux（Ubuntu）平台下、使用交叉编译工具链生成的可执行文件，在ARM架构/Linux下运行。

### 交叉编译的前置配置工作

想要让Rust库在HarmonyNext平台上运行，那么第一件事便是要交叉编译得到其产物，这块Rust官方已经有了文档了。（https://doc.rust-lang.org/rustc/platform-support/openharmony.html）

在配置好OpenHarmonySDK的路径后，需要按照文档指引找个地方配置如下文件，我是在工程目录下配置的:
`aarch64-unknown-linux-ohos-clang.sh`
```bash
#!/bin/sh
exec /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang \
  -target aarch64-linux-ohos \
  --sysroot=/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot \
  -D__MUSL__ \
  "$@"
```

`aarch64-unknown-linux-ohos-clang++.sh`
```bash
#!/bin/sh
exec /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang++ \
  -target aarch64-linux-ohos \
  --sysroot=/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot \
  -D__MUSL__ \
  "$@"
```

`armv7-unknown-linux-ohos-clang.sh`
```bash
#!/bin/sh
exec /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang \
  -target arm-linux-ohos \
  --sysroot=/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot \
  -D__MUSL__ \
  -march=armv7-a \
  -mfloat-abi=softfp \
  -mtune=generic-armv7-a \
  -mthumb \
  "$@"
```

`armv7-unknown-linux-ohos-clang++.sh`
```bash
#!/bin/sh
exec /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang++ \
  -target arm-linux-ohos \
  --sysroot=/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot \
  -D__MUSL__ \
  -march=armv7-a \
  -mfloat-abi=softfp \
  -mtune=generic-armv7-a \
  -mthumb \
  "$@"
```

`x86_64-unknown-linux-ohos-clang.sh`
```bash
#!/bin/sh
exec /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang \
  -target x86_64-linux-ohos \
  --sysroot=/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot \
  -D__MUSL__ \
  "$@"
```

`x86_64-unknown-linux-ohos-clang++.sh`
```bash
#!/bin/sh
exec /Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/clang++ \
  -target x86_64-linux-ohos \
  --sysroot=/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/sysroot \
  -D__MUSL__ \
  "$@"
```

再讲下面的配置增加到`~/.cargo/config`文件中，如果没有就创建一个：
```bash
[target.aarch64-unknown-linux-ohos]
linker  = "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/aarch64-unknown-linux-ohos-clang.sh"
ar      = "/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/llvm-ar"

[target.armv7-unknown-linux-ohos]
linker  = "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh"
ar      = "/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/llvm-ar"


[target.x86_64-unknown-linux-ohos]
linker  = "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/x86_64-unknown-linux-ohos-clang.sh"
ar      = "/Users/biezhihua/Software/OpenHarmony/Sdk/10/native/llvm/bin/llvm-ar"
```

### 将rustup切换到nightly版本上

由于rust的stable版本不支持OpenHaronmy的预编译产物，所以需要将rustup切换到nightly版本上。

```bash
$ rustup -v
rustup 1.26.0 (5af9b9484 2023-04-05)
The Rust toolchain installer
```

```bash
rustup update stable
rustup default nightly
```

```
$ rustup default nightly
info: using existing install for 'nightly-x86_64-apple-darwin'
info: default toolchain set to 'nightly-x86_64-apple-darwin'

  nightly-x86_64-apple-darwin unchanged - rustc 1.75.0-nightly (49691b1f7 2023-10-16)

```

执行一下下面的命令，也会明确的告诉我们不支持目标平台，并且也给了我们提示，让我们利用`cargo build -Z build-std`进行编译:
```bash
rustup target add aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos
```

```
$ rustup target add aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos

error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'aarch64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

```

在开始交叉编译前，为`lib.rs`中增加两个简单的方法，需要注意目前仅支持将Rust代码通过FFI特性导出编译为C代码，C++是不支持的：
```rust
#[no_mangle]
pub extern "C" fn hello_from_rust() {
    println!("Hello from Rust!");
}

#[no_mangle]
pub extern "C" fn hello2_from_rust(a:i32, b:i32)-> i32 {
    return a + b;
}
```

随后，我们在`Cargo.toml`中增加打包产物配置，下面的配置经过交叉编译会得到`libtest.so`的文件：
```rust
[lib]
name = "test"
crate-type = ["cdylib"]
```

### 交叉编译

```shell
$ cargo +nightly build  -Z build-std --target x86_64-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling cc v1.0.79
   Compiling memchr v2.5.0
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling rustc-std-workspace-core v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core)
   Compiling alloc v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc)
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc)
   Compiling panic_unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind)
   Compiling panic_abort v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort)
   Compiling gimli v0.28.0
   Compiling miniz_oxide v0.7.1
   Compiling std_detect v0.1.5 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect)
   Compiling hashbrown v0.14.0
   Compiling object v0.32.0
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro)
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 56.12s

```

```bash
$ cargo +nightly build  -Z build-std --target armv7-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling memchr v2.5.0
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
   Compiling rustc-std-workspace-core v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core)
   Compiling alloc v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc)
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc)
   Compiling panic_abort v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort)
   Compiling panic_unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind)
   Compiling gimli v0.28.0
   Compiling std_detect v0.1.5 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect)
   Compiling object v0.32.0
   Compiling hashbrown v0.14.0
   Compiling miniz_oxide v0.7.1
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro)
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 57.73s
```

```bash
$ cargo +nightly build  -Z build-std --target aarch64-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling rustc-std-workspace-core v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core)
   Compiling memchr v2.5.0
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
   Compiling alloc v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc)
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc)
   Compiling panic_abort v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort)
   Compiling panic_unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind)
   Compiling gimli v0.28.0
   Compiling miniz_oxide v0.7.1
   Compiling std_detect v0.1.5 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect)
   Compiling object v0.32.0
   Compiling hashbrown v0.14.0
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro)
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 45.05s
```

编译成功后，可以在下列路径找到编译产物：
```
harmony/target/x86_64-unknown-linux-ohos/debug/libtest.so
harmony/target/armv7-unknown-linux-ohos/debug/libtest.so
harmony/target/aarch64-unknown-linux-ohos/debug/libtest.so
```

目录结构如下:
```
$ tree
.
├── Cargo.lock
├── Cargo.toml
├── aarch64-unknown-linux-ohos-clang++.sh
├── aarch64-unknown-linux-ohos-clang.sh
├── armv7-unknown-linux-ohos-clang++.sh
├── armv7-unknown-linux-ohos-clang.sh
├── config
├── src
│   └── lib.rs
├── target
│   ├── CACHEDIR.TAG
│   ├── aarch64-unknown-linux-ohos
│   │   └── debug
│   │       └── libtest.so
│   ├── armv7-unknown-linux-ohos
│   │   └── debug
│   │       └── libtest.so
│   └── x86_64-unknown-linux-ohos
│       └── debug
│           └── libtest.so
├── x86_64-unknown-linux-ohos-clang++.sh
└── x86_64-unknown-linux-ohos-clang.sh
```

## 在HarmonyNextNative工程中引入编译产物并调用

### 创建Native C++工程并引入交叉编译的产物
利用DevEco Studio创建一个Native C++工程，并在`libs`目录下创建三个子目录`arm64-v8a`、`armeabi-v7a`、`x86_64`，并将交叉编译的产物复制过来，目录结构如下：
```
.
├── AppScope
│   ├── app.json5
│   └── resources
│       └── base
│           ├── element
│           │   └── string.json
│           └── media
│               └── app_icon.png
├── build-profile.json5
├── entry
│   ├── build
│   │   └── default
│   │       ├── cache
│   │       │   └── default
│   │       │       └── default@CompileArkTS
│   │       │           └── esmodule
│   │       │               └── debug
│   │       │                   ├── compiler.cache.msgpack
│   │       │                   ├── entry
│   │       │                   │   └── src
│   │       │                   │       └── main
│   │       │                   │           └── ets
│   │       │                   │               ├── entryability
│   │       │                   │               │   ├── EntryAbility.js
│   │       │                   │               │   └── EntryAbility.protoBin
│   │       │                   │               └── pages
│   │       │                   │                   ├── Index.js
│   │       │                   │                   └── Index.protoBin
│   │       │                   ├── filesInfo.txt
│   │       │                   ├── modules.cache
│   │       │                   ├── npmEntries.protoBin
│   │       │                   ├── npmEntries.txt
│   │       │                   ├── sourceMaps.json
│   │       │                   └── temporary
│   │       │                       └── ets
│   │       ├── generated
│   │       │   └── r
│   │       │       └── default
│   │       │           └── ResourceTable.h
│   │       ├── intermediates
│   │       │   ├── cmake
│   │       │   │   └── default
│   │       │   │       └── obj
│   │       │   │           ├── arm64-v8a
│   │       │   │           │   ├── libc++_shared.so
│   │       │   │           │   └── libentry.so
│   │       │   │           ├── armeabi-v7a
│   │       │   │           │   ├── libc++_shared.so
│   │       │   │           │   └── libentry.so
│   │       │   │           └── x86_64
│   │       │   │               ├── libc++_shared.so
│   │       │   │               └── libentry.so
│   │       │   ├── default
│   │       │   │   └── temp
│   │       │   ├── hap_metadata
│   │       │   │   └── default
│   │       │   │       └── output_metadata.json
│   │       │   ├── libs
│   │       │   │   └── default
│   │       │   │       ├── arm64-v8a
│   │       │   │       │   ├── libc++_shared.so
│   │       │   │       │   ├── libentry.so
│   │       │   │       │   └── libtest.so
│   │       │   │       ├── armeabi-v7a
│   │       │   │       │   ├── libc++_shared.so
│   │       │   │       │   ├── libentry.so
│   │       │   │       │   └── libtest.so
│   │       │   │       └── x86_64
│   │       │   │           ├── libc++_shared.so
│   │       │   │           ├── libentry.so
│   │       │   │           └── libtest.so
│   │       │   ├── loader
│   │       │   │   └── default
│   │       │   │       └── loader.json
│   │       │   ├── loader_out
│   │       │   │   └── default
│   │       │   │       └── ets
│   │       │   │           ├── modules.abc
│   │       │   │           └── sourceMaps.map
│   │       │   ├── merge_profile
│   │       │   │   └── default
│   │       │   │       └── module.json
│   │       │   ├── process_profile
│   │       │   │   └── default
│   │       │   │       └── module.json
│   │       │   └── res
│   │       │       └── default
│   │       │           ├── ResourceTable.txt
│   │       │           ├── ids_map
│   │       │           ├── module.json
│   │       │           ├── resConfig.json
│   │       │           ├── resources
│   │       │           │   ├── base
│   │       │           │   │   ├── media
│   │       │           │   │   │   ├── app_icon.png
│   │       │           │   │   │   └── icon.png
│   │       │           │   │   └── profile
│   │       │           │   │       └── main_pages.json
│   │       │           │   └── rawfile
│   │       │           └── resources.index
│   │       └── outputs
│   │           └── default
│   │               ├── entry-default-signed.hap
│   │               ├── entry-default-unsigned.hap
│   │               └── pack.info
│   ├── build-profile.json5
│   ├── hvigorfile.ts
│   ├── libs
│   │   ├── arm64-v8a
│   │   │   └── libtest.so
│   │   ├── armeabi-v7a
│   │   │   └── libtest.so
│   │   └── x86_64
│   │       └── libtest.so
│   ├── oh-package.json5
│   ├── oh_modules
│   │   └── libentry.so -> ../src/main/cpp/types/libentry
│   └── src
│       ├── main
│       │   ├── cpp
│       │   │   ├── CMakeLists.txt
│       │   │   ├── hello.cpp
│       │   │   └── types
│       │   │       └── libentry
│       │   │           ├── index.d.ts
│       │   │           └── oh-package.json5
│       │   ├── ets
│       │   │   ├── entryability
│       │   │   │   └── EntryAbility.ts
│       │   │   └── pages
│       │   │       └── Index.ets
│       │   ├── module.json5
│       │   └── resources
│       │       ├── base
│       │       │   ├── element
│       │       │   │   ├── color.json
│       │       │   │   └── string.json
│       │       │   ├── media
│       │       │   │   └── icon.png
│       │       │   └── profile
│       │       │       └── main_pages.json
│       │       ├── en_US
│       │       │   └── element
│       │       │       └── string.json
│       │       ├── rawfile
│       │       └── zh_CN
│       │           └── element
│       │               └── string.json
│       └── ohosTest
│           ├── ets
│           │   ├── test
│           │   │   ├── Ability.test.ets
│           │   │   └── List.test.ets
│           │   ├── testability
│           │   │   ├── TestAbility.ets
│           │   │   └── pages
│           │   │       └── Index.ets
│           │   └── testrunner
│           │       └── OpenHarmonyTestRunner.ts
│           ├── module.json5
│           └── resources
│               └── base
│                   ├── element
│                   │   ├── color.json
│                   │   └── string.json
│                   ├── media
│                   │   └── icon.png
│                   └── profile
│                       └── test_pages.json
├── hvigor
│   ├── hvigor-config.json5
│   └── hvigor-wrapper.js
├── hvigorfile.ts
├── hvigorw
├── hvigorw.bat
├── local.properties
├── oh-package-lock.json5
├── oh-package.json5
```

### 修改工程配置

在模块的entry/build-profile.json5文件中新增`napiLibFilterOption`和`externalNativeOptions`配置，防止编译错误和指定支持的abi架构：
```json
{
  "apiType": "stageMode",
  "buildOption": {
    "napiLibFilterOption": {
      "enableOverride": true
    },
    "externalNativeOptions": {
      "path": "./src/main/cpp/CMakeLists.txt",
      "arguments": "",
      "cppFlags": "",
      "abiFilters": [
        "armeabi-v7a",
        "arm64-v8a",
        "x86_64"
      ]
    }
  }
  ....
}
```

### 链接和编译三方库

在`cpp/CMakeLists.txt`中将第三方动态so库路径引入到编译环境中，这样就可以在`hello.cpp`中编译使用了，注意这里和常规的配置也略有不同，需要在`target_link_libraries`中直接追加动态库地址，不可以仅写lib库名：

这个case可以成功运行：
```
# the minimum version of CMake.
cmake_minimum_required(VERSION 3.4.1)
project(MyApplication4)

set(NATIVERENDER_ROOT_PATH ${CMAKE_CURRENT_SOURCE_DIR})

include_directories(${NATIVERENDER_ROOT_PATH}
                    ${NATIVERENDER_ROOT_PATH}/include)

add_library(entry SHARED hello.cpp)
target_link_libraries(entry PUBLIC libace_napi.z.so ${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/${OHOS_ARCH}/libtest.so)
```

这个case可以编译运行但是执行c++代码会崩溃：
```
# the minimum version of CMake.
cmake_minimum_required(VERSION 3.4.1)
project(MyApplication4)

set(NATIVERENDER_ROOT_PATH ${CMAKE_CURRENT_SOURCE_DIR})

include_directories(${NATIVERENDER_ROOT_PATH}
                    ${NATIVERENDER_ROOT_PATH}/include)

add_library( libtest SHARED IMPORTED)
set_target_properties(libtest PROPERTIES IMPORTED_LOCATION ${CMAKE_CURRENT_SOURCE_DIR}/../../../libs/${OHOS_ARCH}/libtest.so )

add_library(entry SHARED hello.cpp)
target_link_libraries(entry PUBLIC libace_napi.z.so libtest)
```

### 在C++代码中引用rust向外暴露的代码并使用

先对要使用的代码进行声明：
```c++
extern "C" void hello_from_rust();
extern "C" int hello2_from_rust(int a, int b);
```

调用`hello2_from_rust`进行两数相加：
```c++
static napi_value Add(napi_env env, napi_callback_info info) {

    int ret = hello2_from_rust(10, 10);

    napi_value ret2;
    napi_create_int32(env, ret, &ret2);

    return ret2;
}

```

随后，编译运行验证：
```
10-23 19:54:01.059  3153-3153    A00000/testTag                 pid-3153                        I  Succeeded in loading the content. Data:
10-23 19:54:13.385  3153-3153    A00000/testTag                 com.bzh.test                    I  Test NAPI 2 + 3 = 20
```

## Reference

- https://doc.rust-lang.org/rustc/platform-support/openharmony.html
- https://docs.openharmony.cn/pages/v4.0/zh-cn/device-dev/subsystems/subsys-build-bindgen-cxx-guide.md/
- https://docs.rust-embedded.org/embedonomicon/custom-target.html
- https://www.saoniuhuo.com/question/detail-2698649.html
- https://blog.csdn.net/zrufo747/article/details/132296829
- https://blog.csdn.net/pengfei240/article/details/52912833
- https://blog.51cto.com/u_15127605/2763424