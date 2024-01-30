# PC Platform Arch Info

操作平台的架构信息通常由几个部分组成，包括CPU架构、供应商、操作系统和ABI（应用程序二进制接口）。以 `x86_64-pc-windows-gnu` 为例：

- `x86_64`：CPU架构。这里指的是64位的x86架构（也称为AMD64或Intel 64）。
- `pc`：供应商。在这个上下文中，它通常表示通用个人电脑。
- `windows`：操作系统。
- `gnu`：ABI。这里指的是使用GNU工具链（如GCC编译器）。

这样的架构信息标识符广泛用于交叉编译场景和系统编程中，以区分不同的操作平台和编译目标。下面是一些常见平台的架构信息示例：

### Windows

- `x86_64-pc-windows-msvc`：Windows 上的 64 位 x86 架构，使用 Microsoft Visual C++ (MSVC) 编译器。
- `i686-pc-windows-msvc`：Windows 上的 32 位 x86 架构（也称为 x86 或 i386），使用 MSVC 编译器。
- `i686-pc-windows-gnu`：Windows 上的 32 位 x86 架构，使用 GNU 工具链。

### Linux

- `x86_64-unknown-linux-gnu`：Linux 上的 64 位 x86 架构，使用 GNU 工具链。
- `i686-unknown-linux-gnu`：Linux 上的 32 位 x86 架构，使用 GNU 工具链。
- `arm-unknown-linux-gnueabihf`：Linux 上的 ARM 架构，使用硬浮点 ABI。

### macOS（苹果）

- `x86_64-apple-darwin`：macOS 上的 64 位 x86 架构。
- `aarch64-apple-darwin`：macOS 上的 ARM64 架构（例如，搭载 Apple M1 芯片的设备）。

### 其他

- `aarch64-unknown-linux-gnu`：Linux 上的 ARM64 架构。
- `armv7-unknown-linux-gnueabihf`：Linux 上的 ARMv7 架构，通常用于较旧的 ARM 设备。

每个组件都提供了特定的信息，有助于准确地识别目标平台和所需的编译或运行时配置。在交叉编译或者配置编译目标时，这些信息尤为重要。