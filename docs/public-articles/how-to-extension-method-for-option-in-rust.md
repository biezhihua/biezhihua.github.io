---
article: true
---

# How to extension methods for Option in Rust

```rust
在 Rust 中，你可以为 `Option<T>` 类型扩展自定义方法，这通常通过实现一个特质（trait）来完成。以下是一个简单的示例，演示如何给 `Option<T>` 类型添加一个新的方法：

1. **定义特质（Trait）**：首先定义一个特质，其中包含你想要添加的方法。例如，我们可以定义一个特质 `OptionExtensions`。

2. **为 `Option<T>` 实现特质**：接着，为 `Option<T>` 类型实现这个特质。

下面是一个示例代码，演示了如何实现并使用这种扩展：

```rust
pub(crate) trait OptionExtensions {

    fn is_none_or<F>(&self, f: F) -> bool where F: FnOnce(&Self::Item) -> bool;

    fn is_some_then<F>(&self, f: F) where F: FnOnce(&Self::Item);

    type Item;
}

impl<T> OptionExtensions for Option<T> {

    fn is_none_or<F>(&self, f: F) -> bool where F: FnOnce(&T) -> bool, {
        match self {
            None => true,
            Some(x) => f(x),
        }
    }

    fn is_some_then<F>(&self, f: F) where F: FnOnce(&Self::Item) {
        match self {
            None => {}
            Some(x) => f(x)
        }
    }

    type Item = T;
}

fn main() {
    let maybe_number: Option<i32> = Some(10);

    // 使用扩展的方法
    if maybe_number.is_none_or(|&x| x > 5) {
        println!("The number is either None or greater than 5");
    }
}
```

在这个例子中，我们定义了一个名为 `is_none_or` 的方法，它可以用于 `Option<T>` 类型的实例。这个方法检查 `Option` 要么是 `None`，要么包含的值满足给定的条件。通过这种方式，你可以为 `Option<T>` 或其他任何类型添加更多有用的方法。
```