# How to call rust function from Harmony

## Reference

- https://cxx.rs/tutorial.html
- https://doc.rust-lang.org/rustc/platform-support/openharmony.html
- https://docs.openharmony.cn/pages/v4.0/zh-cn/device-dev/subsystems/subsys-build-bindgen-cxx-guide.md/
- https://docs.rust-embedded.org/embedonomicon/custom-target.html
- https://www.saoniuhuo.com/question/detail-2698649.html
- https://blog.csdn.net/zrufo747/article/details/132296829


```
$ rustup
rustup 1.25.1 (bb60b1e89 2022-07-12)
The Rust toolchain installer

USAGE:
    rustup [FLAGS] [+toolchain] <SUBCOMMAND>

FLAGS:
    -v, --verbose    Enable verbose output
    -q, --quiet      Disable progress output
    -h, --help       Prints help information
    -V, --version    Prints version information

ARGS:
    <+toolchain>    release channel (e.g. +stable) or custom toolchain to set override

SUBCOMMANDS:
    show           Show the active and installed toolchains or profiles
    update         Update Rust toolchains and rustup
    check          Check for updates to Rust toolchains and rustup
    default        Set the default toolchain
    toolchain      Modify or query the installed toolchains
    target         Modify a toolchain's supported targets
    component      Modify a toolchain's installed components
    override       Modify directory toolchain overrides
    run            Run a command with an environment configured for a given toolchain
    which          Display which binary will be run for a given command
    doc            Open the documentation for the current toolchain
    man            View the man page for a given command
    self           Modify the rustup installation
    set            Alter rustup settings
    completions    Generate tab-completion scripts for your shell
    help           Prints this message or the help of the given subcommand(s)

DISCUSSION:
    Rustup installs The Rust Programming Language from the official
    release channels, enabling you to easily switch between stable,
    beta, and nightly compilers and keep them updated. It makes
    cross-compiling simpler with binary builds of the standard library
    for common platforms.

    If you are new to Rust consider running `rustup doc --book` to
    learn Rust.

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:24:04] C:1
$ rustc +nightly -Z unstable-options --print target-spec-json

、error: toolchain 'nightly-x86_64-apple-darwin' is not installed

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:31:59] C:1
$ 、rustup default nightly

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:32:26] C:1
$ rustup version
rustup 1.25.1 (bb60b1e89 2022-07-12)
The Rust toolchain installer

USAGE:
    rustup [FLAGS] [+toolchain] <SUBCOMMAND>

FLAGS:
    -v, --verbose    Enable verbose output
    -q, --quiet      Disable progress output
    -h, --help       Prints help information
    -V, --version    Prints version information

ARGS:
    <+toolchain>    release channel (e.g. +stable) or custom toolchain to set override

SUBCOMMANDS:
    show           Show the active and installed toolchains or profiles
    update         Update Rust toolchains and rustup
    check          Check for updates to Rust toolchains and rustup
    default        Set the default toolchain
    toolchain      Modify or query the installed toolchains
    target         Modify a toolchain's supported targets
    component      Modify a toolchain's installed components
    override       Modify directory toolchain overrides
    run            Run a command with an environment configured for a given toolchain
    which          Display which binary will be run for a given command
    doc            Open the documentation for the current toolchain
    man            View the man page for a given command
    self           Modify the rustup installation
    set            Alter rustup settings
    completions    Generate tab-completion scripts for your shell
    help           Prints this message or the help of the given subcommand(s)

DISCUSSION:
    Rustup installs The Rust Programming Language from the official
    release channels, enabling you to easily switch between stable,
    beta, and nightly compilers and keep them updated. It makes
    cross-compiling simpler with binary builds of the standard library
    for common platforms.

    If you are new to Rust consider running `rustup doc --book` to
    learn Rust.

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:32:30] C:1
$ rustup -V
rustup 1.25.1 (bb60b1e89 2022-07-12)
info: This is the version for the rustup toolchain manager, not the rustc compiler.
info: The currently active `rustc` version is `rustc 1.62.1 (e092d0b6b 2022-07-16)`

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:32:35]
$ rustup update stable
info: syncing channel updates for 'stable-x86_64-apple-darwin'
warning: Signature verification failed for 'https://static.rust-lang.org/dist/channel-rust-stable.toml'
info: latest update on 2023-10-05, rust version 1.73.0 (cc66ad468 2023-10-03)
info: downloading component 'rust-std' for 'x86_64-linux-android'
 22.7 MiB /  22.7 MiB (100 %)   6.4 MiB/s in  4s ETA:  0s
info: downloading component 'rust-std' for 'x86_64-apple-ios'
 25.2 MiB /  25.2 MiB (100 %)   7.2 MiB/s in  4s ETA:  0s
info: downloading component 'rust-std' for 'aarch64-apple-ios'
 21.9 MiB /  21.9 MiB (100 %)   4.8 MiB/s in  6s ETA:  0s
info: downloading component 'rust-std' for 'i686-linux-android'
 24.4 MiB /  24.4 MiB (100 %)   4.8 MiB/s in  6s ETA:  0s
info: downloading component 'rust-std' for 'armv7-linux-androideabi'
info: downloading component 'rust-std' for 'aarch64-linux-android'
info: downloading component 'rust-src'
info: downloading component 'cargo'
info: downloading component 'clippy'
info: downloading component 'rust-docs'
info: downloading component 'rust-std'
info: downloading component 'rustc'
info: downloading component 'rustfmt'
info: removing previous version of component 'rust-std' for 'x86_64-linux-android'
info: removing previous version of component 'rust-std' for 'x86_64-apple-ios'
info: removing previous version of component 'rust-std' for 'aarch64-apple-ios'
info: removing previous version of component 'rust-std' for 'i686-linux-android'
info: removing previous version of component 'rust-std' for 'armv7-linux-androideabi'
info: removing previous version of component 'rust-std' for 'aarch64-linux-android'
info: removing previous version of component 'rust-src'
info: removing previous version of component 'cargo'
info: removing previous version of component 'clippy'
info: removing previous version of component 'rust-docs'
info: removing previous version of component 'rust-std'
info: removing previous version of component 'rustc'
info: removing previous version of component 'rustfmt'
info: installing component 'rust-std' for 'x86_64-linux-android'
 22.7 MiB /  22.7 MiB (100 %)  12.3 MiB/s in  3s ETA:  0s
info: installing component 'rust-std' for 'x86_64-apple-ios'
 25.2 MiB /  25.2 MiB (100 %)  12.2 MiB/s in  2s ETA:  0s
info: installing component 'rust-std' for 'aarch64-apple-ios'
 21.9 MiB /  21.9 MiB (100 %)  13.8 MiB/s in  1s ETA:  0s
info: installing component 'rust-std' for 'i686-linux-android'
 24.4 MiB /  24.4 MiB (100 %)  13.9 MiB/s in  1s ETA:  0s
info: installing component 'rust-std' for 'armv7-linux-androideabi'
 21.9 MiB /  21.9 MiB (100 %)  13.8 MiB/s in  1s ETA:  0s
info: installing component 'rust-std' for 'aarch64-linux-android'
 22.3 MiB /  22.3 MiB (100 %)  14.3 MiB/s in  1s ETA:  0s
info: installing component 'rust-src'
info: installing component 'cargo'
info: installing component 'clippy'
info: installing component 'rust-docs'
 13.8 MiB /  13.8 MiB (100 %) 1000.0 KiB/s in 25s ETA:  0s
info: installing component 'rust-std'
 23.3 MiB /  23.3 MiB (100 %)  13.7 MiB/s in  1s ETA:  0s
info: installing component 'rustc'
 56.1 MiB /  56.1 MiB (100 %)  15.2 MiB/s in  3s ETA:  0s
info: installing component 'rustfmt'

  stable-x86_64-apple-darwin updated - rustc 1.73.0 (cc66ad468 2023-10-03) (from rustc 1.62.1 (e092d0b6b 2022-07-16))

info: checking for self-updates
info: downloading self-update

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:34:20]
$ rustup default nightly
info: syncing channel updates for 'nightly-x86_64-apple-darwin'
info: latest update on 2023-10-17, rust version 1.75.0-nightly (49691b1f7 2023-10-16)
info: downloading component 'cargo'
info: downloading component 'clippy'
info: downloading component 'rust-docs'
info: downloading component 'rust-std'
 24.7 MiB /  24.7 MiB (100 %)  23.4 MiB/s in  1s ETA:  0s
info: downloading component 'rustc'
 54.6 MiB /  54.6 MiB (100 %)  14.4 MiB/s in  4s ETA:  0s
info: downloading component 'rustfmt'
info: installing component 'cargo'
info: installing component 'clippy'
info: installing component 'rust-docs'
 14.4 MiB /  14.4 MiB (100 %) 1011.2 KiB/s in 33s ETA:  0s
info: installing component 'rust-std'
 24.7 MiB /  24.7 MiB (100 %)  14.2 MiB/s in  1s ETA:  0s
info: installing component 'rustc'
 54.6 MiB /  54.6 MiB (100 %)  13.2 MiB/s in  4s ETA:  0s
info: installing component 'rustfmt'
info: default toolchain set to 'nightly-x86_64-apple-darwin'

  nightly-x86_64-apple-darwin installed - rustc 1.75.0-nightly (49691b1f7 2023-10-16)


# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:36:18]
$ rustup target add aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos
error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'aarch64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:37:16] C:1
$ rustup target add aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:37:46] C:130
$ rustc +nightly -Z unstable-options --print target-spec-json

{
  "abi-return-struct-as-int": true,
  "arch": "x86_64",
  "archive-format": "darwin",
  "cpu": "penryn",
  "data-layout": "e-m:o-p270:32:32-p271:32:32-p272:64:64-i64:64-f80:128-n8:16:32:64-S128",
  "debuginfo-kind": "dwarf-dsym",
  "dll-suffix": ".dylib",
  "dynamic-linking": true,
  "eh-frame-header": false,
  "emit-debug-gdb-scripts": false,
  "frame-pointer": "always",
  "function-sections": false,
  "has-rpath": true,
  "has-thread-local": true,
  "is-builtin": true,
  "is-like-osx": true,
  "link-env": [
    "ZERO_AR_DATE=1"
  ],
  "link-env-remove": [
    "IPHONEOS_DEPLOYMENT_TARGET",
    "TVOS_DEPLOYMENT_TARGET"
  ],
  "linker-is-gnu": false,
  "lld-flavor": "darwin",
  "llvm-target": "x86_64-apple-macosx10.12.0",
  "max-atomic-width": 128,
  "os": "macos",
  "pre-link-args": {
    "gcc": [
      "-arch",
      "x86_64",
      "-m64"
    ],
    "ld": [
      "-arch",
      "x86_64",
      "-platform_version",
      "macos",
      "10.12",
      "10.12"
    ],
    "ld64.lld": [
      "-arch",
      "x86_64",
      "-platform_version",
      "macos",
      "10.12",
      "10.12"
    ]
  },
  "split-debuginfo": "packed",
  "stack-probes": {
    "kind": "inline-or-call",
    "min-llvm-version-for-inline": [
      16,
      0,
      0
    ]
  },
  "supported-sanitizers": [
    "address",
    "cfi",
    "leak",
    "thread"
  ],
  "supported-split-debuginfo": [
    "packed",
    "unpacked",
    "off"
  ],
  "target-family": [
    "unix"
  ],
  "target-mcount": "\u0001mcount",
  "target-pointer-width": "64",
  "vendor": "apple"
}

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:40:08]
$

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:40:48]
$ rustup target add aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos
error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'aarch64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:40:52] C:1
$ rustc --print target-list
aarch64-apple-darwin
aarch64-apple-ios
aarch64-apple-ios-macabi
aarch64-apple-ios-sim
aarch64-apple-tvos
aarch64-apple-watchos-sim
aarch64-fuchsia
aarch64-kmc-solid_asp3
aarch64-linux-android
aarch64-nintendo-switch-freestanding
aarch64-pc-windows-gnullvm
aarch64-pc-windows-msvc
aarch64-unknown-freebsd
aarch64-unknown-fuchsia
aarch64-unknown-hermit
aarch64-unknown-linux-gnu
aarch64-unknown-linux-gnu_ilp32
aarch64-unknown-linux-musl
aarch64-unknown-linux-ohos
aarch64-unknown-netbsd
aarch64-unknown-none
aarch64-unknown-none-softfloat
aarch64-unknown-nto-qnx710
aarch64-unknown-openbsd
aarch64-unknown-redox
aarch64-unknown-teeos
aarch64-unknown-uefi
aarch64-uwp-windows-msvc
aarch64-wrs-vxworks
aarch64_be-unknown-linux-gnu
aarch64_be-unknown-linux-gnu_ilp32
aarch64_be-unknown-netbsd
arm-linux-androideabi
arm-unknown-linux-gnueabi
arm-unknown-linux-gnueabihf
arm-unknown-linux-musleabi
arm-unknown-linux-musleabihf
arm64_32-apple-watchos
armeb-unknown-linux-gnueabi
armebv7r-none-eabi
armebv7r-none-eabihf
armv4t-none-eabi
armv4t-unknown-linux-gnueabi
armv5te-none-eabi
armv5te-unknown-linux-gnueabi
armv5te-unknown-linux-musleabi
armv5te-unknown-linux-uclibceabi
armv6-unknown-freebsd
armv6-unknown-netbsd-eabihf
armv6k-nintendo-3ds
armv7-linux-androideabi
armv7-sony-vita-newlibeabihf
armv7-unknown-freebsd
armv7-unknown-linux-gnueabi
armv7-unknown-linux-gnueabihf
armv7-unknown-linux-musleabi
armv7-unknown-linux-musleabihf
armv7-unknown-linux-ohos
armv7-unknown-linux-uclibceabi
armv7-unknown-linux-uclibceabihf
armv7-unknown-netbsd-eabihf
armv7-wrs-vxworks-eabihf
armv7a-kmc-solid_asp3-eabi
armv7a-kmc-solid_asp3-eabihf
armv7a-none-eabi
armv7a-none-eabihf
armv7k-apple-watchos
armv7r-none-eabi
armv7r-none-eabihf
armv7s-apple-ios
asmjs-unknown-emscripten
avr-unknown-gnu-atmega328
bpfeb-unknown-none
bpfel-unknown-none
csky-unknown-linux-gnuabiv2
hexagon-unknown-linux-musl
i386-apple-ios
i586-pc-nto-qnx700
i586-pc-windows-msvc
i586-unknown-linux-gnu
i586-unknown-linux-musl
i686-apple-darwin
i686-linux-android
i686-pc-windows-gnu
i686-pc-windows-gnullvm
i686-pc-windows-msvc
i686-unknown-freebsd
i686-unknown-haiku
i686-unknown-hurd-gnu
i686-unknown-linux-gnu
i686-unknown-linux-musl
i686-unknown-netbsd
i686-unknown-openbsd
i686-unknown-uefi
i686-uwp-windows-gnu
i686-uwp-windows-msvc
i686-wrs-vxworks
loongarch64-unknown-linux-gnu
loongarch64-unknown-none
loongarch64-unknown-none-softfloat
m68k-unknown-linux-gnu
mips-unknown-linux-gnu
mips-unknown-linux-musl
mips-unknown-linux-uclibc
mips64-openwrt-linux-musl
mips64-unknown-linux-gnuabi64
mips64-unknown-linux-muslabi64
mips64el-unknown-linux-gnuabi64
mips64el-unknown-linux-muslabi64
mipsel-sony-psp
mipsel-sony-psx
mipsel-unknown-linux-gnu
mipsel-unknown-linux-musl
mipsel-unknown-linux-uclibc
mipsel-unknown-none
mipsisa32r6-unknown-linux-gnu
mipsisa32r6el-unknown-linux-gnu
mipsisa64r6-unknown-linux-gnuabi64
mipsisa64r6el-unknown-linux-gnuabi64
msp430-none-elf
nvptx64-nvidia-cuda
powerpc-unknown-freebsd
powerpc-unknown-linux-gnu
powerpc-unknown-linux-gnuspe
powerpc-unknown-linux-musl
powerpc-unknown-netbsd
powerpc-unknown-openbsd
powerpc-wrs-vxworks
powerpc-wrs-vxworks-spe
powerpc64-ibm-aix
powerpc64-unknown-freebsd
powerpc64-unknown-linux-gnu
powerpc64-unknown-linux-musl
powerpc64-unknown-openbsd
powerpc64-wrs-vxworks
powerpc64le-unknown-freebsd
powerpc64le-unknown-linux-gnu
powerpc64le-unknown-linux-musl
riscv32gc-unknown-linux-gnu
riscv32gc-unknown-linux-musl
riscv32i-unknown-none-elf
riscv32im-unknown-none-elf
riscv32imac-esp-espidf
riscv32imac-unknown-none-elf
riscv32imac-unknown-xous-elf
riscv32imc-esp-espidf
riscv32imc-unknown-none-elf
riscv64-linux-android
riscv64gc-unknown-freebsd
riscv64gc-unknown-fuchsia
riscv64gc-unknown-hermit
riscv64gc-unknown-linux-gnu
riscv64gc-unknown-linux-musl
riscv64gc-unknown-netbsd
riscv64gc-unknown-none-elf
riscv64gc-unknown-openbsd
riscv64imac-unknown-none-elf
s390x-unknown-linux-gnu
s390x-unknown-linux-musl
sparc-unknown-linux-gnu
sparc-unknown-none-elf
sparc64-unknown-linux-gnu
sparc64-unknown-netbsd
sparc64-unknown-openbsd
sparcv9-sun-solaris
thumbv4t-none-eabi
thumbv5te-none-eabi
thumbv6m-none-eabi
thumbv7a-pc-windows-msvc
thumbv7a-uwp-windows-msvc
thumbv7em-none-eabi
thumbv7em-none-eabihf
thumbv7m-none-eabi
thumbv7neon-linux-androideabi
thumbv7neon-unknown-linux-gnueabihf
thumbv7neon-unknown-linux-musleabihf
thumbv8m.base-none-eabi
thumbv8m.main-none-eabi
thumbv8m.main-none-eabihf
wasm32-unknown-emscripten
wasm32-unknown-unknown
wasm32-wasi
wasm32-wasi-preview1-threads
wasm64-unknown-unknown
x86_64-apple-darwin
x86_64-apple-ios
x86_64-apple-ios-macabi
x86_64-apple-tvos
x86_64-apple-watchos-sim
x86_64-fortanix-unknown-sgx
x86_64-fuchsia
x86_64-linux-android
x86_64-pc-nto-qnx710
x86_64-pc-solaris
x86_64-pc-windows-gnu
x86_64-pc-windows-gnullvm
x86_64-pc-windows-msvc
x86_64-sun-solaris
x86_64-unikraft-linux-musl
x86_64-unknown-dragonfly
x86_64-unknown-freebsd
x86_64-unknown-fuchsia
x86_64-unknown-haiku
x86_64-unknown-hermit
x86_64-unknown-illumos
x86_64-unknown-l4re-uclibc
x86_64-unknown-linux-gnu
x86_64-unknown-linux-gnux32
x86_64-unknown-linux-musl
x86_64-unknown-linux-ohos
x86_64-unknown-netbsd
x86_64-unknown-none
x86_64-unknown-openbsd
x86_64-unknown-redox
x86_64-unknown-uefi
x86_64-uwp-windows-gnu
x86_64-uwp-windows-msvc
x86_64-wrs-vxworks
x86_64h-apple-darwin

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:41:56]
$ rustc --print target-list

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:42:21] C:130
$ rustup target add x86_64-unknown-linux-ohos
error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'x86_64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:42:35] C:1
$ cargo build -Z build-std
error: -Zbuild-std requires --target

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:42:45] C:101
$ cargo build -Z build-std --target cargo build -Z build-std

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:42:53] C:101
$ cargo build -Z build-std --target x86_64-unknown-linux-ohos
    Updating crates.io index
  Downloaded cxxbridge-flags v1.0.109
  Downloaded link-cplusplus v1.0.9
  Downloaded proc-macro2 v1.0.69
  Downloaded unicode-width v0.1.11
  Downloaded termcolor v1.3.0
  Downloaded codespan-reporting v0.11.1
  Downloaded once_cell v1.18.0
  Downloaded unicode-ident v1.0.12
  Downloaded quote v1.0.33
  Downloaded cc v1.0.83
  Downloaded cxxbridge-macro v1.0.109
  Downloaded cxx-build v1.0.109
  Downloaded cxx v1.0.109
  Downloaded syn v2.0.38
  Downloaded libc v0.2.149
  Downloaded scratch v1.0.7
  Downloaded 16 crates (1.6 MB) in 2.13s
error: "/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/Cargo.lock" does not exist, unable to build with the standard library, try:
        rustup component add rust-src --toolchain nightly-x86_64-apple-darwin

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:43:08] C:101
$  rustup component add rust-src --toolchain nightly-x86_64-apple-darwin
info: downloading component 'rust-src'
info: installing component 'rust-src'

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:43:22]
$ cargo build -Z build-std --target x86_64-unknown-linux-ohos
    Updating crates.io index
  Downloaded addr2line v0.21.0
  Downloaded getopts v0.2.21
  Downloaded cfg-if v1.0.0
  Downloaded adler v1.0.2
  Downloaded rustc-demangle v0.1.23
  Downloaded cc v1.0.79
  Downloaded unicode-width v0.1.10
  Downloaded miniz_oxide v0.7.1
  Downloaded memchr v2.5.0
  Downloaded allocator-api2 v0.2.15
  Downloaded hashbrown v0.14.0
  Downloaded compiler_builtins v0.1.101
  Downloaded object v0.32.0
  Downloaded gimli v0.28.0
  Downloaded 14 crates (1.2 MB) in 1.24s
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling proc-macro2 v1.0.69
   Compiling unicode-ident v1.0.12
   Compiling cc v1.0.79
   Compiling memchr v2.5.0
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
   Compiling scratch v1.0.7
   Compiling unicode-width v0.1.11
   Compiling cxxbridge-flags v1.0.109
   Compiling termcolor v1.3.0
   Compiling once_cell v1.18.0
   Compiling codespan-reporting v0.11.1
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling quote v1.0.33
   Compiling syn v2.0.38
   Compiling cc v1.0.83
   Compiling link-cplusplus v1.0.9
   Compiling cxx v1.0.109
   Compiling cxx-build v1.0.109
   Compiling cxxbridge-macro v1.0.109
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
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
   Compiling hashbrown v0.14.0
   Compiling object v0.32.0
   Compiling std_detect v0.1.5 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect)
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro)
    Finished dev [unoptimized + debuginfo] target(s) in 28.20s

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:43:54]
$ cargo build -Z build-std --target x86_64-unknown-linux-ohos
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 0.52s

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:44:06]
$ cargo build -Z build-std --target x86_64-unknown-linux-ohos
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 0.49s

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:44:35]
$ cargo build -Z build-std --target aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos
error: unexpected argument 'armv7-unknown-linux-ohos' found

Usage: cargo build [OPTIONS]

For more information, try '--help'.

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:45:00] C:1
$ cargo build -Z build-std --target aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos
error: unexpected argument 'armv7-unknown-linux-ohos' found

Usage: cargo build [OPTIONS]

For more information, try '--help'.

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:45:13] C:1
$ cargo build -Z build-std --target aarch64-unknown-linux-ohos armv7-unknown-linux-ohos x86_64-unknown-linux-ohos

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:45:19] C:130
$  cargo build -Z build-std --target aarch64-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling memchr v2.5.0
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling link-cplusplus v1.0.9
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
   Compiling cxx v1.0.109
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
   Compiling rustc-std-workspace-core v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core)
   Compiling alloc v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc)
   Compiling cfg-if v1.0.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling rustc-std-workspace-alloc v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc)
   Compiling panic_unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind)
   Compiling panic_abort v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort)
   Compiling gimli v0.28.0
   Compiling object v0.32.0
   Compiling miniz_oxide v0.7.1
   Compiling std_detect v0.1.5 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect)
   Compiling hashbrown v0.14.0
   Compiling addr2line v0.21.0
   Compiling proc_macro v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/proc_macro)
    Finished dev [unoptimized + debuginfo] target(s) in 25.69s

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:45:49]
$  cargo build -Z build-std --target armv7-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling memchr v2.5.0
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling link-cplusplus v1.0.9
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
The following warnings were emitted during compilation:

warning: error: unknown target CPU 'armv7-a'
warning: note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

error: failed to run custom build command for `link-cplusplus v1.0.9`

Caused by:
  process didn't exit successfully: `/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/debug/build/link-cplusplus-f461be1e2e1ebbef/build-script-build` (exit status: 1)
  --- stdout
  cargo:rerun-if-changed=build.rs
  TARGET = Some("armv7-unknown-linux-ohos")
  OPT_LEVEL = Some("0")
  HOST = Some("x86_64-apple-darwin")
  cargo:rerun-if-env-changed=CXX_armv7-unknown-linux-ohos
  CXX_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXX_armv7_unknown_linux_ohos
  CXX_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXX
  TARGET_CXX = None
  cargo:rerun-if-env-changed=CXX
  CXX = None
  RUSTC_LINKER = Some("/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh")
  cargo:rerun-if-env-changed=CROSS_COMPILE
  CROSS_COMPILE = None
  cargo:rerun-if-env-changed=CRATE_CC_NO_DEFAULTS
  CRATE_CC_NO_DEFAULTS = None
  DEBUG = Some("true")
  CARGO_CFG_TARGET_FEATURE = Some("aclass,d32,dsp,thumb2,v5te,v6,v6k,v6t2,v7,vfp2,vfp3")
  cargo:rerun-if-env-changed=CXXFLAGS_armv7-unknown-linux-ohos
  CXXFLAGS_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXXFLAGS_armv7_unknown_linux_ohos
  CXXFLAGS_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXXFLAGS
  TARGET_CXXFLAGS = None
  cargo:rerun-if-env-changed=CXXFLAGS
  CXXFLAGS = None
  running: "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc"
  cargo:warning=error: unknown target CPU 'armv7-a'

  cargo:warning=note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

  exit status: 1

  --- stderr


  error occurred: Command "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc" with args "c++" did not execute successfully (status code exit status: 1).


warning: build failed, waiting for other jobs to finish...

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:46:24] C:101
$ rustup target add x86_64-unknown-linux-ohos
error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'x86_64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:47:12] C:1
$ code ~/.cargo

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:57:30]
$ rustup target add x86_64-unknown-linux-ohos
error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'x86_64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:58:24] C:1
$ cargo build -Z build-std --target x86_64-unknown-linux-ohos
warning: Both `/Users/biezhihua/.cargo/config` and `/Users/biezhihua/.cargo/config.toml` exist. Using `/Users/biezhihua/.cargo/config`
warning: Both `/Users/biezhihua/.cargo/config` and `/Users/biezhihua/.cargo/config.toml` exist. Using `/Users/biezhihua/.cargo/config`
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 1.40s

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [10:59:55]
$ cargo build -Z build-std --target x86_64-unknown-linux-ohos && cargo build -Z build-std --target x86_64-unknown-li

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:00:19] C:130
$ cargo build -Z build-std --target aarch64-unknown-linux-ohos
warning: Both `/Users/biezhihua/.cargo/config` and `/Users/biezhihua/.cargo/config.toml` exist. Using `/Users/biezhihua/.cargo/config`
warning: Both `/Users/biezhihua/.cargo/config` and `/Users/biezhihua/.cargo/config.toml` exist. Using `/Users/biezhihua/.cargo/config`
   Compiling harmony v0.1.0 (/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony)
    Finished dev [unoptimized + debuginfo] target(s) in 0.65s

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:00:35]
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
warning: Both `/Users/biezhihua/.cargo/config` and `/Users/biezhihua/.cargo/config.toml` exist. Using `/Users/biezhihua/.cargo/config`
warning: Both `/Users/biezhihua/.cargo/config` and `/Users/biezhihua/.cargo/config.toml` exist. Using `/Users/biezhihua/.cargo/config`
   Compiling rustc-std-workspace-core v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-core)
   Compiling link-cplusplus v1.0.9
   Compiling compiler_builtins v0.1.101
   Compiling libc v0.2.149
The following warnings were emitted during compilation:

warning: error: unknown target CPU 'armv7-a'
warning: note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

error: failed to run custom build command for `link-cplusplus v1.0.9`

Caused by:
  process didn't exit successfully: `/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/debug/build/link-cplusplus-f461be1e2e1ebbef/build-script-build` (exit status: 1)
  --- stdout
  cargo:rerun-if-changed=build.rs
  TARGET = Some("armv7-unknown-linux-ohos")
  OPT_LEVEL = Some("0")
  HOST = Some("x86_64-apple-darwin")
  cargo:rerun-if-env-changed=CXX_armv7-unknown-linux-ohos
  CXX_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXX_armv7_unknown_linux_ohos
  CXX_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXX
  TARGET_CXX = None
  cargo:rerun-if-env-changed=CXX
  CXX = None
  RUSTC_LINKER = Some("/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh")
  cargo:rerun-if-env-changed=CROSS_COMPILE
  CROSS_COMPILE = None
  cargo:rerun-if-env-changed=CRATE_CC_NO_DEFAULTS
  CRATE_CC_NO_DEFAULTS = None
  DEBUG = Some("true")
  CARGO_CFG_TARGET_FEATURE = Some("aclass,d32,dsp,thumb2,v5te,v6,v6k,v6t2,v7,vfp2,vfp3")
  cargo:rerun-if-env-changed=CXXFLAGS_armv7-unknown-linux-ohos
  CXXFLAGS_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXXFLAGS_armv7_unknown_linux_ohos
  CXXFLAGS_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXXFLAGS
  TARGET_CXXFLAGS = None
  cargo:rerun-if-env-changed=CXXFLAGS
  CXXFLAGS = None
  running: "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc"
  cargo:warning=error: unknown target CPU 'armv7-a'

  cargo:warning=note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

  exit status: 1

  --- stderr


  error occurred: Command "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc" with args "c++" did not execute successfully (status code exit status: 1).


warning: build failed, waiting for other jobs to finish...

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:01:11] C:101
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
warning: unused config key `build.profiler` in `/Users/biezhihua/.cargo/config.toml`
warning: unused config key `build.sanitizers` in `/Users/biezhihua/.cargo/config.toml`
error: expected a table, but found a string for `target.armv7-unknown-linux-ohos.ranlib` in /Users/biezhihua/.cargo/config.toml

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:04:23] C:101
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
   Compiling alloc v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/alloc)
   Compiling cfg-if v1.0.0
   Compiling memchr v2.5.0
   Compiling adler v1.0.2
   Compiling rustc-demangle v0.1.23
   Compiling link-cplusplus v1.0.9
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
The following warnings were emitted during compilation:

warning: error: unknown target CPU 'armv7-a'
warning: note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

error: failed to run custom build command for `link-cplusplus v1.0.9`

Caused by:
  process didn't exit successfully: `/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/debug/build/link-cplusplus-f461be1e2e1ebbef/build-script-build` (exit status: 1)
  --- stdout
  cargo:rerun-if-changed=build.rs
  TARGET = Some("armv7-unknown-linux-ohos")
  OPT_LEVEL = Some("0")
  HOST = Some("x86_64-apple-darwin")
  cargo:rerun-if-env-changed=CXX_armv7-unknown-linux-ohos
  CXX_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXX_armv7_unknown_linux_ohos
  CXX_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXX
  TARGET_CXX = None
  cargo:rerun-if-env-changed=CXX
  CXX = None
  RUSTC_LINKER = Some("/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh")
  cargo:rerun-if-env-changed=CROSS_COMPILE
  CROSS_COMPILE = None
  cargo:rerun-if-env-changed=CRATE_CC_NO_DEFAULTS
  CRATE_CC_NO_DEFAULTS = None
  DEBUG = Some("true")
  CARGO_CFG_TARGET_FEATURE = Some("aclass,d32,dsp,thumb2,v5te,v6,v6k,v6t2,v7,vfp2,vfp3")
  cargo:rerun-if-env-changed=CXXFLAGS_armv7-unknown-linux-ohos
  CXXFLAGS_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXXFLAGS_armv7_unknown_linux_ohos
  CXXFLAGS_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXXFLAGS
  TARGET_CXXFLAGS = None
  cargo:rerun-if-env-changed=CXXFLAGS
  CXXFLAGS = None
  running: "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc"
  cargo:warning=error: unknown target CPU 'armv7-a'

  cargo:warning=note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

  exit status: 1

  --- stderr


  error occurred: Command "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc" with args "c++" did not execute successfully (status code exit status: 1).


warning: build failed, waiting for other jobs to finish...

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:05:05] C:101
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
error: expected a table, but found a string for `target.armv7-unknown-linux-ohos.cxx` in /Users/biezhihua/.cargo/config

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:05:16] C:101
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
   Compiling rustc-std-workspace-alloc v1.99.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/rustc-std-workspace-alloc)
   Compiling panic_abort v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_abort)
   Compiling panic_unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/panic_unwind)
   Compiling link-cplusplus v1.0.9
   Compiling gimli v0.28.0
   Compiling object v0.32.0
   Compiling hashbrown v0.14.0
   Compiling std_detect v0.1.5 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/stdarch/crates/std_detect)
   Compiling miniz_oxide v0.7.1
The following warnings were emitted during compilation:

warning: error: unknown target CPU 'armv7-a'
warning: note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

error: failed to run custom build command for `link-cplusplus v1.0.9`

Caused by:
  process didn't exit successfully: `/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/debug/build/link-cplusplus-f461be1e2e1ebbef/build-script-build` (exit status: 1)
  --- stdout
  cargo:rerun-if-changed=build.rs
  TARGET = Some("armv7-unknown-linux-ohos")
  OPT_LEVEL = Some("0")
  HOST = Some("x86_64-apple-darwin")
  cargo:rerun-if-env-changed=CXX_armv7-unknown-linux-ohos
  CXX_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXX_armv7_unknown_linux_ohos
  CXX_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXX
  TARGET_CXX = None
  cargo:rerun-if-env-changed=CXX
  CXX = None
  RUSTC_LINKER = Some("/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh")
  cargo:rerun-if-env-changed=CROSS_COMPILE
  CROSS_COMPILE = None
  cargo:rerun-if-env-changed=CRATE_CC_NO_DEFAULTS
  CRATE_CC_NO_DEFAULTS = None
  DEBUG = Some("true")
  CARGO_CFG_TARGET_FEATURE = Some("aclass,d32,dsp,thumb2,v5te,v6,v6k,v6t2,v7,vfp2,vfp3")
  cargo:rerun-if-env-changed=CXXFLAGS_armv7-unknown-linux-ohos
  CXXFLAGS_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXXFLAGS_armv7_unknown_linux_ohos
  CXXFLAGS_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXXFLAGS
  TARGET_CXXFLAGS = None
  cargo:rerun-if-env-changed=CXXFLAGS
  CXXFLAGS = None
  running: "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc"
  cargo:warning=error: unknown target CPU 'armv7-a'

  cargo:warning=note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

  exit status: 1

  --- stderr


  error occurred: Command "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc" with args "c++" did not execute successfully (status code exit status: 1).


warning: build failed, waiting for other jobs to finish...

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:05:48] C:101
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
   Compiling link-cplusplus v1.0.9
   Compiling addr2line v0.21.0
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
The following warnings were emitted during compilation:

warning: error: unknown target CPU 'armv7-a'
warning: note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

error: failed to run custom build command for `link-cplusplus v1.0.9`

Caused by:
  process didn't exit successfully: `/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/debug/build/link-cplusplus-f461be1e2e1ebbef/build-script-build` (exit status: 1)
  --- stdout
  cargo:rerun-if-changed=build.rs
  TARGET = Some("armv7-unknown-linux-ohos")
  OPT_LEVEL = Some("0")
  HOST = Some("x86_64-apple-darwin")
  cargo:rerun-if-env-changed=CXX_armv7-unknown-linux-ohos
  CXX_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXX_armv7_unknown_linux_ohos
  CXX_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXX
  TARGET_CXX = None
  cargo:rerun-if-env-changed=CXX
  CXX = None
  RUSTC_LINKER = Some("/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh")
  cargo:rerun-if-env-changed=CROSS_COMPILE
  CROSS_COMPILE = None
  cargo:rerun-if-env-changed=CRATE_CC_NO_DEFAULTS
  CRATE_CC_NO_DEFAULTS = None
  DEBUG = Some("true")
  CARGO_CFG_TARGET_FEATURE = Some("aclass,d32,dsp,thumb2,v5te,v6,v6k,v6t2,v7,vfp2,vfp3")
  cargo:rerun-if-env-changed=CXXFLAGS_armv7-unknown-linux-ohos
  CXXFLAGS_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXXFLAGS_armv7_unknown_linux_ohos
  CXXFLAGS_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXXFLAGS
  TARGET_CXXFLAGS = None
  cargo:rerun-if-env-changed=CXXFLAGS
  CXXFLAGS = None
  running: "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc"
  cargo:warning=error: unknown target CPU 'armv7-a'

  cargo:warning=note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

  exit status: 1

  --- stderr


  error occurred: Command "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc" with args "c++" did not execute successfully (status code exit status: 1).


warning: build failed, waiting for other jobs to finish...
^[[A%

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:08:02] C:101
$ cargo build -Z build-std --target armv7-unknown-linux-ohos

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:08:05] C:130
$ cargo init --lib

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:08:14] C:130
$ cargo build  --target x86_64-unknown-linux-ohos
   Compiling libc v0.2.149
   Compiling proc-macro2 v1.0.69
   Compiling unicode-ident v1.0.12
   Compiling scratch v1.0.7
   Compiling unicode-width v0.1.11
   Compiling termcolor v1.3.0
   Compiling cxxbridge-flags v1.0.109
   Compiling once_cell v1.18.0
   Compiling codespan-reporting v0.11.1
   Compiling quote v1.0.33
   Compiling cc v1.0.83
   Compiling syn v2.0.38
   Compiling link-cplusplus v1.0.9
   Compiling cxx v1.0.109
error[E0463]: can't find crate for `core`
  |
  = note: the `x86_64-unknown-linux-ohos` target may not be installed
  = help: consider downloading the target with `rustup target add x86_64-unknown-linux-ohos`
  = help: consider building the standard library from source with `cargo build -Zbuild-std`

error[E0463]: can't find crate for `compiler_builtins`

For more information about this error, try `rustc --explain E0463`.
error: could not compile `link-cplusplus` (lib) due to 2 previous errors
warning: build failed, waiting for other jobs to finish...

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:13:10] C:101
$ rustup target add x86_64-unknown-linux-ohos
error: toolchain 'nightly-x86_64-apple-darwin' does not contain component 'rust-std' for target 'x86_64-unknown-linux-ohos'
note: not all platforms have the standard library pre-compiled: https://doc.rust-lang.org/nightly/rustc/platform-support.html
help: consider using `cargo build -Z build-std` instead

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:13:17] C:1
$ cargo build -Z build-std --target armv7-unknown-linux-ohos
   Compiling compiler_builtins v0.1.101
   Compiling core v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/core)
   Compiling libc v0.2.149
   Compiling cc v1.0.79
   Compiling memchr v2.5.0
   Compiling std v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/std)
   Compiling cxx-build v1.0.109
   Compiling cxxbridge-macro v1.0.109
   Compiling unwind v0.0.0 (/Users/biezhihua/.rustup/toolchains/nightly-x86_64-apple-darwin/lib/rustlib/src/rust/library/unwind)
   Compiling link-cplusplus v1.0.9
The following warnings were emitted during compilation:

warning: error: unknown target CPU 'armv7-a'
warning: note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

error: failed to run custom build command for `link-cplusplus v1.0.9`

Caused by:
  process didn't exit successfully: `/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/debug/build/link-cplusplus-f461be1e2e1ebbef/build-script-build` (exit status: 1)
  --- stdout
  cargo:rerun-if-changed=build.rs
  TARGET = Some("armv7-unknown-linux-ohos")
  OPT_LEVEL = Some("0")
  HOST = Some("x86_64-apple-darwin")
  cargo:rerun-if-env-changed=CXX_armv7-unknown-linux-ohos
  CXX_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXX_armv7_unknown_linux_ohos
  CXX_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXX
  TARGET_CXX = None
  cargo:rerun-if-env-changed=CXX
  CXX = None
  RUSTC_LINKER = Some("/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/armv7-unknown-linux-ohos-clang.sh")
  cargo:rerun-if-env-changed=CROSS_COMPILE
  CROSS_COMPILE = None
  cargo:rerun-if-env-changed=CRATE_CC_NO_DEFAULTS
  CRATE_CC_NO_DEFAULTS = None
  DEBUG = Some("true")
  CARGO_CFG_TARGET_FEATURE = Some("aclass,d32,dsp,thumb2,v5te,v6,v6k,v6t2,v7,vfp2,vfp3")
  cargo:rerun-if-env-changed=CXXFLAGS_armv7-unknown-linux-ohos
  CXXFLAGS_armv7-unknown-linux-ohos = None
  cargo:rerun-if-env-changed=CXXFLAGS_armv7_unknown_linux_ohos
  CXXFLAGS_armv7_unknown_linux_ohos = None
  cargo:rerun-if-env-changed=TARGET_CXXFLAGS
  TARGET_CXXFLAGS = None
  cargo:rerun-if-env-changed=CXXFLAGS
  CXXFLAGS = None
  running: "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc"
  cargo:warning=error: unknown target CPU 'armv7-a'

  cargo:warning=note: valid target CPU values are: nocona, core2, penryn, bonnell, atom, silvermont, slm, goldmont, goldmont-plus, tremont, nehalem, corei7, westmere, sandybridge, corei7-avx, ivybridge, core-avx-i, haswell, core-avx2, broadwell, skylake, skylake-avx512, skx, cascadelake, cooperlake, cannonlake, icelake-client, rocketlake, icelake-server, tigerlake, sapphirerapids, alderlake, knl, knm, k8, athlon64, athlon-fx, opteron, k8-sse3, athlon64-sse3, opteron-sse3, amdfam10, barcelona, btver1, btver2, bdver1, bdver2, bdver3, bdver4, znver1, znver2, znver3, x86-64, x86-64-v2, x86-64-v3, x86-64-v4

  exit status: 1

  --- stderr


  error occurred: Command "c++" "-O0" "-ffunction-sections" "-fdata-sections" "-fPIC" "-gdwarf-4" "-fno-omit-frame-pointer" "-march=armv7-a" "-Wall" "-Wextra" "-o" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/eb71d5c9741d3fd1-dummy.o" "-c" "/Users/biezhihua/WorkSpace/YKGAIAX/GaiaX/harmony/target/armv7-unknown-linux-ohos/debug/build/link-cplusplus-2ffc1d46777ea6ee/out/dummy.cc" with args "c++" did not execute successfully (status code exit status: 1).


warning: build failed, waiting for other jobs to finish...

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:16:27] C:101
$ rustc --print target-list
aarch64-apple-darwin
aarch64-apple-ios
aarch64-apple-ios-macabi
aarch64-apple-ios-sim
aarch64-apple-tvos
aarch64-apple-watchos-sim
aarch64-fuchsia
aarch64-kmc-solid_asp3
aarch64-linux-android
aarch64-nintendo-switch-freestanding
aarch64-pc-windows-gnullvm
aarch64-pc-windows-msvc
aarch64-unknown-freebsd
aarch64-unknown-fuchsia
aarch64-unknown-hermit
aarch64-unknown-linux-gnu
aarch64-unknown-linux-gnu_ilp32
aarch64-unknown-linux-musl
aarch64-unknown-linux-ohos
aarch64-unknown-netbsd
aarch64-unknown-none
aarch64-unknown-none-softfloat
aarch64-unknown-nto-qnx710
aarch64-unknown-openbsd
aarch64-unknown-redox
aarch64-unknown-teeos
aarch64-unknown-uefi
aarch64-uwp-windows-msvc
aarch64-wrs-vxworks
aarch64_be-unknown-linux-gnu
aarch64_be-unknown-linux-gnu_ilp32
aarch64_be-unknown-netbsd
arm-linux-androideabi
arm-unknown-linux-gnueabi
arm-unknown-linux-gnueabihf
arm-unknown-linux-musleabi
arm-unknown-linux-musleabihf
arm64_32-apple-watchos
armeb-unknown-linux-gnueabi
armebv7r-none-eabi
armebv7r-none-eabihf
armv4t-none-eabi
armv4t-unknown-linux-gnueabi
armv5te-none-eabi
armv5te-unknown-linux-gnueabi
armv5te-unknown-linux-musleabi
armv5te-unknown-linux-uclibceabi
armv6-unknown-freebsd
armv6-unknown-netbsd-eabihf
armv6k-nintendo-3ds
armv7-linux-androideabi
armv7-sony-vita-newlibeabihf
armv7-unknown-freebsd
armv7-unknown-linux-gnueabi
armv7-unknown-linux-gnueabihf
armv7-unknown-linux-musleabi
armv7-unknown-linux-musleabihf
armv7-unknown-linux-ohos
armv7-unknown-linux-uclibceabi
armv7-unknown-linux-uclibceabihf
armv7-unknown-netbsd-eabihf
armv7-wrs-vxworks-eabihf
armv7a-kmc-solid_asp3-eabi
armv7a-kmc-solid_asp3-eabihf
armv7a-none-eabi
armv7a-none-eabihf
armv7k-apple-watchos
armv7r-none-eabi
armv7r-none-eabihf
armv7s-apple-ios
asmjs-unknown-emscripten
avr-unknown-gnu-atmega328
bpfeb-unknown-none
bpfel-unknown-none
csky-unknown-linux-gnuabiv2
hexagon-unknown-linux-musl
i386-apple-ios
i586-pc-nto-qnx700
i586-pc-windows-msvc
i586-unknown-linux-gnu
i586-unknown-linux-musl
i686-apple-darwin
i686-linux-android
i686-pc-windows-gnu
i686-pc-windows-gnullvm
i686-pc-windows-msvc
i686-unknown-freebsd
i686-unknown-haiku
i686-unknown-hurd-gnu
i686-unknown-linux-gnu
i686-unknown-linux-musl
i686-unknown-netbsd
i686-unknown-openbsd
i686-unknown-uefi
i686-uwp-windows-gnu
i686-uwp-windows-msvc
i686-wrs-vxworks
loongarch64-unknown-linux-gnu
loongarch64-unknown-none
loongarch64-unknown-none-softfloat
m68k-unknown-linux-gnu
mips-unknown-linux-gnu
mips-unknown-linux-musl
mips-unknown-linux-uclibc
mips64-openwrt-linux-musl
mips64-unknown-linux-gnuabi64
mips64-unknown-linux-muslabi64
mips64el-unknown-linux-gnuabi64
mips64el-unknown-linux-muslabi64
mipsel-sony-psp
mipsel-sony-psx
mipsel-unknown-linux-gnu
mipsel-unknown-linux-musl
mipsel-unknown-linux-uclibc
mipsel-unknown-none
mipsisa32r6-unknown-linux-gnu
mipsisa32r6el-unknown-linux-gnu
mipsisa64r6-unknown-linux-gnuabi64
mipsisa64r6el-unknown-linux-gnuabi64
msp430-none-elf
nvptx64-nvidia-cuda
powerpc-unknown-freebsd
powerpc-unknown-linux-gnu
powerpc-unknown-linux-gnuspe
powerpc-unknown-linux-musl
powerpc-unknown-netbsd
powerpc-unknown-openbsd
powerpc-wrs-vxworks
powerpc-wrs-vxworks-spe
powerpc64-ibm-aix
powerpc64-unknown-freebsd
powerpc64-unknown-linux-gnu
powerpc64-unknown-linux-musl
powerpc64-unknown-openbsd
powerpc64-wrs-vxworks
powerpc64le-unknown-freebsd
powerpc64le-unknown-linux-gnu
powerpc64le-unknown-linux-musl
riscv32gc-unknown-linux-gnu
riscv32gc-unknown-linux-musl
riscv32i-unknown-none-elf
riscv32im-unknown-none-elf
riscv32imac-esp-espidf
riscv32imac-unknown-none-elf
riscv32imac-unknown-xous-elf
riscv32imc-esp-espidf
riscv32imc-unknown-none-elf
riscv64-linux-android
riscv64gc-unknown-freebsd
riscv64gc-unknown-fuchsia
riscv64gc-unknown-hermit
riscv64gc-unknown-linux-gnu
riscv64gc-unknown-linux-musl
riscv64gc-unknown-netbsd
riscv64gc-unknown-none-elf
riscv64gc-unknown-openbsd
riscv64imac-unknown-none-elf
s390x-unknown-linux-gnu
s390x-unknown-linux-musl
sparc-unknown-linux-gnu
sparc-unknown-none-elf
sparc64-unknown-linux-gnu
sparc64-unknown-netbsd
sparc64-unknown-openbsd
sparcv9-sun-solaris
thumbv4t-none-eabi
thumbv5te-none-eabi
thumbv6m-none-eabi
thumbv7a-pc-windows-msvc
thumbv7a-uwp-windows-msvc
thumbv7em-none-eabi
thumbv7em-none-eabihf
thumbv7m-none-eabi
thumbv7neon-linux-androideabi
thumbv7neon-unknown-linux-gnueabihf
thumbv7neon-unknown-linux-musleabihf
thumbv8m.base-none-eabi
thumbv8m.main-none-eabi
thumbv8m.main-none-eabihf
wasm32-unknown-emscripten
wasm32-unknown-unknown
wasm32-wasi
wasm32-wasi-preview1-threads
wasm64-unknown-unknown
x86_64-apple-darwin
x86_64-apple-ios
x86_64-apple-ios-macabi
x86_64-apple-tvos
x86_64-apple-watchos-sim
x86_64-fortanix-unknown-sgx
x86_64-fuchsia
x86_64-linux-android
x86_64-pc-nto-qnx710
x86_64-pc-solaris
x86_64-pc-windows-gnu
x86_64-pc-windows-gnullvm
x86_64-pc-windows-msvc
x86_64-sun-solaris
x86_64-unikraft-linux-musl
x86_64-unknown-dragonfly
x86_64-unknown-freebsd
x86_64-unknown-fuchsia
x86_64-unknown-haiku
x86_64-unknown-hermit
x86_64-unknown-illumos
x86_64-unknown-l4re-uclibc
x86_64-unknown-linux-gnu
x86_64-unknown-linux-gnux32
x86_64-unknown-linux-musl
x86_64-unknown-linux-ohos
x86_64-unknown-netbsd
x86_64-unknown-none
x86_64-unknown-openbsd
x86_64-unknown-redox
x86_64-unknown-uefi
x86_64-uwp-windows-gnu
x86_64-uwp-windows-msvc
x86_64-wrs-vxworks
x86_64h-apple-darwin

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:17:42]
$ rustup target list
aarch64-apple-darwin
aarch64-apple-ios
aarch64-apple-ios-sim
aarch64-linux-android
aarch64-pc-windows-msvc
aarch64-unknown-fuchsia
aarch64-unknown-linux-gnu
aarch64-unknown-linux-musl
aarch64-unknown-none
aarch64-unknown-none-softfloat
aarch64-unknown-uefi
arm-linux-androideabi
arm-unknown-linux-gnueabi
arm-unknown-linux-gnueabihf
arm-unknown-linux-musleabi
arm-unknown-linux-musleabihf
armebv7r-none-eabi
armebv7r-none-eabihf
armv5te-unknown-linux-gnueabi
armv5te-unknown-linux-musleabi
armv7-linux-androideabi
armv7-unknown-linux-gnueabi
armv7-unknown-linux-gnueabihf
armv7-unknown-linux-musleabi
armv7-unknown-linux-musleabihf
armv7a-none-eabi
armv7r-none-eabi
armv7r-none-eabihf
asmjs-unknown-emscripten
i586-pc-windows-msvc
i586-unknown-linux-gnu
i586-unknown-linux-musl
i686-linux-android
i686-pc-windows-gnu
i686-pc-windows-msvc
i686-unknown-freebsd
i686-unknown-linux-gnu
i686-unknown-linux-musl
i686-unknown-uefi
loongarch64-unknown-linux-gnu
loongarch64-unknown-none
loongarch64-unknown-none-softfloat
nvptx64-nvidia-cuda
powerpc-unknown-linux-gnu
powerpc64-unknown-linux-gnu
powerpc64le-unknown-linux-gnu
riscv32i-unknown-none-elf
riscv32imac-unknown-none-elf
riscv32imc-unknown-none-elf
riscv64gc-unknown-linux-gnu
riscv64gc-unknown-none-elf
riscv64imac-unknown-none-elf
s390x-unknown-linux-gnu
sparc64-unknown-linux-gnu
sparcv9-sun-solaris
thumbv6m-none-eabi
thumbv7em-none-eabi
thumbv7em-none-eabihf
thumbv7m-none-eabi
thumbv7neon-linux-androideabi
thumbv7neon-unknown-linux-gnueabihf
thumbv8m.base-none-eabi
thumbv8m.main-none-eabi
thumbv8m.main-none-eabihf
wasm32-unknown-emscripten
wasm32-unknown-unknown
wasm32-wasi
wasm32-wasi-preview1-threads
x86_64-apple-darwin (installed)
x86_64-apple-ios
x86_64-fortanix-unknown-sgx
x86_64-linux-android
x86_64-pc-solaris
x86_64-pc-windows-gnu
x86_64-pc-windows-msvc
x86_64-sun-solaris
x86_64-unknown-freebsd
x86_64-unknown-fuchsia
x86_64-unknown-illumos
x86_64-unknown-linux-gnu
x86_64-unknown-linux-gnux32
x86_64-unknown-linux-musl
x86_64-unknown-netbsd
x86_64-unknown-none
x86_64-unknown-redox
x86_64-unknown-uefi

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:18:15]
$

# biezhihua @ biezhihua-2 in ~/WorkSpace/YKGAIAX/GaiaX/harmony on git:main x [11:27:57] C:130
$
```