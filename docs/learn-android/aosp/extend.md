---
tag:
  - android
  - aosp
---

# Android | AOSP | 知识扩展

## td::optional

`std::optional` 是 C++17 中引入的一种容器，用于表示一个可能不存在的对象。其类模板的定义如下：

```c++
template <typename T>
class optional {
public:
    optional(); // 构造函数，创建一个空的 optional 对象
    optional(const T& value); // 构造函数，创建一个存放了 value 值的 optional 对象
    optional& operator=(const T& value); // 赋值运算符，将 value 赋值给 optional 对象
    T& operator*(); // 返回存储在 optional 对象中的值的引用
    const T& operator*() const; // 返回存储在 optional 对象中的值的 const 引用
    T* operator->(); // 返回存储在 optional 对象中的值的指针
    const T* operator->() const; // 返回存储在 optional 对象中的值的 const 指针
    explicit operator bool() const; // 检查 optional 对象是否包含一个值
    T& value(); // 返回存储在 optional 对象中的值的引用，如果对象为空则抛出 std::bad_optional_access 异常
    const T& value() const; // 返回存储在 optional 对象中的值的 const 引用，如果对象为空则抛出 std::bad_optional_access 异常
};
```

`std::optional` 可以用来避免在代码中使用空指针或无效引用，从而降低代码出错的可能性。在某些情况下，我们需要一个变量可能存在或不存在，这时就可以使用 `std::optional` 来表示这种可能性。例如：

```c++
std::optional<int> num; // 创建一个空的 optional 对象
num = 42; // 将 42 赋值给 optional 对象
if (num) { // 检查 optional 对象是否包含一个值
    std::cout << "num is " << *num << std::endl; // 访问存储在 optional 对象中的值
} else {
    std::cout << "num is not set" << std::endl;
}
```

在上面的例子中，我们使用 `std::optional` 来表示一个整数变量可能存在或不存在的情况。如果 optional 对象包含一个值，则通过解引用操作符 `*` 来访问该值。否则，我们可以通过检查对象是否包含值来避免访问未定义的内存。

## std::optional 中 emplace

```c++
template <class... _Args,
            class = enable_if_t
                    <
                        is_constructible_v<value_type, _Args...>
                    >
            >
_LIBCPP_INLINE_VISIBILITY
_Tp &
emplace(_Args&&... __args)
{
    reset();
    this->__construct(_VSTD::forward<_Args>(__args)...);
    return this->__get();
}
```

这段代码是`std::optional`中`emplace`成员函数的模板实现。`emplace`函数的主要作用是在`std::optional`对象中构造一个新的值，使用传入的参数作为构造函数的参数。

```cpp
// 定义emplace成员函数模板
template <class... _Args,
          class = enable_if_t
                  <
                      is_constructible_v<value_type, _Args...>
                  >
         >
// 设置内联可见性，使得编译器可以在编译时优化函数调用
_LIBCPP_INLINE_VISIBILITY
// 定义emplace函数，返回值类型为模板参数_Tp的引用，接受可变数量的模板参数_Args
_Tp &
emplace(_Args&&... __args)
{
    // 调用reset()函数，清除optional对象当前的值，为新值做好准备
    reset();
    // 使用完美转发将传入的参数列表(__args)转发给构造函数
    this->__construct(_VSTD::forward<_Args>(__args)...);
    // 返回新构造值的引用
    return this->__get();
}
```

`emplace`函数首先调用`reset()`方法清除`std::optional`对象中的当前值。接下来，使用完美转发将传入的参数列表(`__args`)转发给`value_type`的构造函数，`value_type`是存储在`std::optional`中的类型。最后，返回新构造值的引用。

- <https://cs.android.com/android/platform/superproject/+/refs/heads/master:external/libcxx/include/optional;drc=7346c436e5a11ce08f6a80dcfeb8ef941ca30176;bpv=0;bpt=1;l=820?hl=zh-cn>

## sys\_nanosleep

`sys_nanosleep`是一个操作系统内核系统调用，它用于暂停当前进程一段指定的时间。在Linux系统中，这个系统调用的原型如下：

```c
#include <time.h>

int sys_nanosleep(const struct timespec *req, struct timespec *rem);
```

第一个参数`req`是一个指向`timespec`结构体的指针，表示要暂停的时间长度。该结构体包含两个成员变量，分别为`tv_sec`和`tv_nsec`，分别表示秒数和纳秒数。第二个参数`rem`是一个指向`timespec`结构体的指针，表示剩余未暂停的时间长度。如果在暂停的过程中被信号打断，那么`rem`将会被设置为剩余未暂停的时间。

`sys_nanosleep`的返回值为0表示暂停成功，返回-1表示暂停失败，错误码保存在`errno`中。

## sys\_ioctl

`sys_ioctl`是一个操作系统内核系统调用，用于操作设备文件的I/O控制。在Linux系统中，这个系统调用的原型如下：

```c
#include <sys/ioctl.h>

int sys_ioctl(unsigned int fd, unsigned int cmd, unsigned long arg);
```

第一个参数`fd`是一个整数类型，表示要进行I/O控制的设备文件描述符。第二个参数`cmd`是一个无符号整数类型，表示要进行的I/O操作，通常是一个预定义的常量。第三个参数`arg`是一个无符号长整型，表示I/O操作的参数，可以是一个指针或一个整数。

不同的设备文件可能支持不同的I/O操作，因此`cmd`参数的含义也不同。例如，对于网络设备文件，可能有`SIOCGIFADDR`操作，用于获取设备的IP地址；对于串口设备文件，可能有`TCGETS`操作，用于获取串口的配置信息。

`sys_ioctl`的返回值为0表示I/O操作成功，返回-1表示I/O操作失败，错误码保存在`errno`中。

## Android init 脚本

Android init 脚本是一种 Android 系统启动时用于配置和启动各种服务、设置属性和创建目录等操作的脚本。它们主要用于定义系统的启动流程和配置各种组件。这些脚本通常位于 Android 源码中的各个子项目和设备特定代码中，如 `system/core/rootdir`、`device/<manufacturer>/<device>/rootdir` 等。

Android init 脚本的作用包括：

1. 设置系统属性：用于配置系统行为、开关和设备特性等。
2. 创建目录和文件：用于在启动过程中创建必要的目录结构和文件。
3. 设置权限：用于设定系统目录和文件的访问权限，以确保正确的访问控制。
4. 启动服务：用于配置和启动系统中的各种守护进程和服务。

Android init 脚本使用一种名为 `init` 的简单语言编写，该语言包含一系列命令和关键字，用于表示不同的操作。例如：

- `service`：定义一个服务，包括服务名、可执行文件路径和相关参数。
- `on`：定义在特定事件触发时要执行的操作。
- `setprop`：设置系统属性。
- `mkdir`：创建目录。
- `chmod`：更改文件或目录权限。

要使用 Android init 脚本，您需要：

1. 在 Android 源码中找到相关的 init 脚本，如 `init.rc`、`init.<device>.rc` 或设备特定的 init 脚本。
2. 阅读和理解脚本中的命令和关键字，以及它们在系统启动过程中的作用。
3. 修改或添加 init 脚本中的命令和关键字，以满足您的需求。
4. 编译并刷入新的 Android 系统映像，然后观察更改后的系统行为。

- <https://android.googlesource.com/platform/system/core/+/master/init/README.md>

- <https://cs.android.com/android/platform/superproject/+/master:frameworks/native/services/surfaceflinger/Android.bp?hl=zh-cn>

## Android.bp的作用

`Android.bp` 是 Android 开源项目 (AOSP) 中的一种构建脚本，它使用类似 Makefile 的语法来描述如何构建 Android 应用程序、库和模块。它是 AOSP 中使用的 Soong 构建系统的核心组件之一，是 Android 7.0 及更高版本中用于构建的主要构建系统。

`Android.bp` 文件中描述了一个模块的依赖关系、编译选项、源代码文件列表等信息，构建系统将基于这些信息来生成构建脚本和构建产物。相比于之前使用的 GNU Make 工具链，Soong 构建系统更加灵活、可扩展和高效，能够更好地支持 Android 平台的复杂构建需求。

在 Android 源代码中，每个模块都有一个相应的 `Android.bp` 文件，用于描述该模块的构建规则。这些模块包括 Android 系统本身、应用程序、共享库、静态库、插件等。开发者可以修改这些 `Android.bp` 文件来增加、删除或修改模块的构建规则，以满足自己的需求。

总之，`Android.bp` 文件是 AOSP 中描述如何构建 Android 应用程序、库和模块的核心文件，它是 Soong 构建系统的核心组件之一。

## emplace

<https://en.cppreference.com/w/cpp/utility/optional/emplace>

## emplace_back

<https://en.cppreference.com/w/cpp/container/vector/emplace_back>
