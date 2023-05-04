---
tag:
  - android
  - aosp
---

# Android | C++

## > std::optional

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
