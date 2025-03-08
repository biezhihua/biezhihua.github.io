---
article: true
---

# What the different self and Self in Rust

In Rust, `self` and `Self` have distinct meanings and are used in different contexts:

1. **`self`**: 
    - **Usage**: `self` is used as the first parameter of an instance method of a struct or enum. It represents the instance of the struct or enum on which the method is called. 
    - **Variants**: It has three forms:
        - `self` - Used when the method consumes the struct (takes ownership).
        - `&self` - Used when the method only needs a reference to the struct, without taking ownership.
        - `&mut self` - Used when the method needs a mutable reference to the struct.
    - **Example**: In a method definition like `fn do_something(&self)`, `self` refers to the instance of the struct.

2. **`Self`**:
    - **Usage**: `Self` (note the capital 'S') is an alias for the type of the current trait or impl block.
    - **Context**: It's typically used in trait definitions and their impl blocks. In a trait, `Self` refers to the type that implements the trait. In an impl block, `Self` refers to the type that the block is implementing traits for or adding methods to.
    - **Example**: In a trait definition like `trait Example { fn clone(&self) -> Self; }`, `Self` refers to the type that implements the `Example` trait.

### Example to Illustrate the Difference:

```rust
struct MyStruct;

impl MyStruct {
    // Here, self refers to the instance of MyStruct
    fn instance_method(&self) {
        println!("Called on an instance of MyStruct");
    }

    // Here, Self refers to the MyStruct type itself
    fn new() -> Self {
        MyStruct
    }
}
```

In the above example:
- `&self` in `instance_method` refers to the instance of `MyStruct`.
- `Self` in `new` is used as a type name, referring to `MyStruct`. It's a way to avoid repeating the type name `MyStruct`.