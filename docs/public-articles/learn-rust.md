---
article: true
---

# Learn | Rust

## give me a example for dyn in Rust language.

Certainly! Here's an example of using dynamic dispatch (`dyn`) in Rust:

```rust
trait Animal {
    fn speak(&self);
}

struct Dog {
    name: String,
}

struct Cat {
    name: String,
}

impl Animal for Dog {
    fn speak(&self) {
        println!("{} says: Woof!", self.name);
    }
}

impl Animal for Cat {
    fn speak(&self) {
        println!("{} says: Meow!", self.name);
    }
}

fn main() {
    let dog: Box<dyn Animal> = Box::new(Dog {
        name: String::from("Buddy"),
    });

    let cat: Box<dyn Animal> = Box::new(Cat {
        name: String::from("Whiskers"),
    });

    dog.speak();
    cat.speak();
}
```

In this example, we define a trait called `Animal` with a method `speak()`. We then implement this trait for two different structs, `Dog` and `Cat`. The `speak()` method is implemented differently for each struct.

In the `main()` function, we create two variables `dog` and `cat` of type `Box<dyn Animal>`. This allows us to store objects of different types that implement the `Animal` trait. We can assign a `Dog` or `Cat` instance to these variables, and Rust will perform dynamic dispatch based on the actual type at runtime.

Finally, we call the `speak()` method on both `dog` and `cat`.

## give me a explain to trait in Rust

In Rust, a trait is a way to define a set of methods that can be implemented by multiple types. Traits allow you to define shared behavior and establish a contract that types must adhere to if they implement that trait.

Here's an explanation of traits in Rust:

1. **Defining a Trait**: To define a trait, you use the `trait` keyword followed by the trait name and a set of method signatures. For example:

   ```rust
   trait Animal {
       fn speak(&self);
   }
   ```

   In this example, we define a trait called `Animal` with a single method `speak()`. Traits can also have associated types, associated constants, and additional methods.

2. **Implementing a Trait**: To implement a trait for a particular type, you use the `impl` keyword followed by the trait name and the implementation block. Inside the implementation block, you provide the actual implementations of the methods defined in the trait. For example:

   ```rust
   struct Dog {
       name: String,
   }
   
   impl Animal for Dog {
       fn speak(&self) {
           println!("{} says: Woof!", self.name);
       }
   }
   ```

   In this example, we implement the `Animal` trait for the `Dog` struct. We provide an implementation for the `speak()` method that prints a message with the dog's name.

3. **Using Trait Objects**: Trait objects allow you to store values of different types that implement a particular trait in a generic way. You can use the `dyn` keyword to create a trait object. For example:

   ```rust
   let dog: Box<dyn Animal> = Box::new(Dog {
       name: String::from("Buddy"),
   });
   ```

   Here, we create a `Box<dyn Animal>` to store an object of any type that implements the `Animal` trait. This provides flexibility to work with different types that share the same behavior defined by the trait.

4. **Dynamic Dispatch**: When using trait objects, Rust performs dynamic dispatch to determine which implementation of a trait's method should be called at runtime. This allows the appropriate method to be invoked based on the actual type of the object. Dynamic dispatch is performed when methods are called through a trait object rather than directly on the concrete type.

   ```rust
   dog.speak();
   ```

   In this example, the `speak()` method is called on the `dog` trait object. At runtime, Rust identifies the actual type of the object (`Dog`) and invokes the corresponding implementation of the `speak()` method.

Traits are a powerful feature in Rust that enable code reuse and polymorphism. They provide a way to define shared behavior without knowing the specific types involved, promoting generic and flexible programming patterns.

## 闭包体中的代码定义了稍后在闭包计算时对引用或值如何操作（也就影响了什么会被移 出 闭包，如有）。 帮我解释这段话

这段话的意思是，闭包体中的代码定义了在闭包计算时对引用或值的操作方式，这将决定哪些变量会被移出闭包。

闭包可以通过引用或值来捕获其周围作用域中的变量。当闭包在计算时需要访问这些变量时，它们可以以引用的方式或值的方式被捕获。

如果闭包以引用方式捕获变量，则闭包内部对变量的操作将影响原始变量本身。这意味着变量不会被移出闭包，仍然可以在闭包之后继续使用。

如果闭包以值的方式捕获变量，则闭包内部的操作将在闭包计算时复制变量的值。这意味着变量的所有权被移出闭包，只能在闭包内部使用，之后的代码无法再访问这些变量。

具体选择是以引用方式还是值的方式捕获变量，取决于闭包体中对变量的操作需求。如果需要在闭包之后继续使用变量，可以选择以引用方式捕获；如果变量只在闭包内部使用，可以选择以值的方式捕获。

总结来说，闭包体中的代码定义了对变量的操作方式，从而决定了哪些变量会被移出闭包。这样的设计可以在闭包计算时灵活地控制变量的所有权和可用性。

## 在Rust中 trait bound 是什么意思

```rust

在Rust中，Trait Bound（特质限定）指的是在泛型类型参数上使用特定trait的约束条件。Trait Bound用于指定泛型类型参数必须满足的条件，以便在泛型代码中使用特定的trait中定义的方法或功能。

Trait Bound使用where关键字后跟随一个或多个trait约束条件。这些约束条件限定了泛型类型参数必须实现指定的trait。这样可以在泛型代码中使用trait中的方法或者在泛型函数中使用具体的实现类型。

以下是一个示例，展示了Trait Bound的使用：

trait Printable {
    fn print(&self);
}

struct Person {
    name: String,
}

impl Printable for Person {
    fn print(&self) {
        println!("Name: {}", self.name);
    }
}

fn print_object<T: Printable>(obj: T) {
    obj.print();
}

fn main() {
    let person = Person {
        name: String::from("Alice"),
    };
    print_object(person);
}

在上述示例中，定义了一个`trait Printable`，其中包含一个`print`方法。然后，我们创建了一个Person结构体，并为其实现了`Printable trait`。在`print_object`函数中，我们使用了`Trait Bound T: Printable`，表示泛型类型参数T必须实现`Printable trait`。然后，我们传递一个`Person`对象给`print_object`函数，因为`Person`实现了`Printable trait`。

通过在泛型类型参数上使用`Trait Bound`，我们可以在编译时对泛型类型进行约束，以保证它们满足特定的trait约束条件。这样可以在泛型代码中使用trait中定义的方法，提供更加通用和灵活的代码。

```

## 在Rust 中 dyn 关键字的作用

```rust
在Rust中，dyn关键字用于指定trait对象的类型。

在Rust中，trait对象是指对实现了某个trait的类型进行抽象，通过trait对象可以以统一的方式访问不同类型的具体实现。使用trait对象时，通常需要将具体类型转换为trait对象类型，这时就可以使用dyn关键字来标记trait对象的类型。

具体来说，使用dyn关键字时，需要将trait指定为动态分发（dynamic dispatch），而不是静态分发（static dispatch）。动态分发允许在运行时根据具体对象的类型来调用相应的方法，而静态分发在编译时就会确定调用哪个方法。

下面是一个使用dyn关键字的示例：


trait Animal {
    fn make_sound(&self);
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn make_sound(&self) {
        println!("Woof!");
    }
}

impl Animal for Cat {
    fn make_sound(&self) {
        println!("Meow!");
    }
}

fn main() {
    let dog: Box<dyn Animal> = Box::new(Dog);
    let cat: Box<dyn Animal> = Box::new(Cat);

    dog.make_sound(); // 使用trait对象调用动态分发的方法
    cat.make_sound(); // 使用trait对象调用动态分发的方法
}



在上述示例中，定义了一个Animal trait，具有make_sound方法。然后，分别为Dog和Cat类型实现了Animal trait。在main函数中，我们创建了dog和cat作为Box<dyn Animal>类型的trait对象。使用dyn关键字标记了Animal作为动态分发，因此在调用make_sound方法时会进行动态分发，根据具体对象的类型来调用相应的方法。

总结来说，dyn关键字在Rust中用于标记trait对象的类型，指定为动态分发，使得可以在运行时根据具体对象的类型来调用相应的方法。这提供了更大的灵活性，可以在运行时决定调用哪个方法，但也会带来一些性能上的开销。

```

## 在Rust中字符串字面值是什么意思

```rust

在Rust中，字符串字面值（string literals）是指用双引号括起来的文本字符串。字符串字面值是一种直接写入程序代码中的字符串表示形式，可以在代码中直接使用而不需要额外的定义或分配内存。

Rust中的字符串字面值是不可变的（immutable），即一旦定义，就无法修改其内容。字符串字面值的类型是&str，即对字符串的引用。由于字符串字面值是不可变的，因此可以被多个变量共享引用，而无需复制字符串数据本身。

以下是几个使用字符串字面值的示例：


fn main() {
    let hello = "Hello, world!"; // 定义一个字符串字面值
    let name = "Alice"; // 定义另一个字符串字面值

    println!("{}", hello); // 输出 "Hello, world!"
    println!("My name is {}", name); // 输出 "My name is Alice"
}

在上述示例中，通过双引号括起来的文本字符串被称为字符串字面值。我们可以将字符串字面值赋值给变量，如hello和name。然后，我们可以使用println!宏来打印字符串字面值。注意，打印字符串字面值时，需要使用{}作为占位符来替换字符串内容。

需要注意的是，Rust还提供了String类型，用于动态分配和可变的字符串数据。与字符串字面值不同，String类型的字符串是可变的，可以修改其内容。而字符串字面值是静态分配的，其内容在编译时就被确定下来了。

总结来说，字符串字面值是一种在Rust程序中直接使用的不可变字符串表示形式，类型为&str。字符串字面值是静态分配的，其内容在编译时就被确定下来了，并且可以被多个变量共享引用。
```
## what the different between {} and {:?} in Rust

```rust
In Rust, {} and {:?} are used as placeholders within format strings to print values. The main difference between them lies in how they format and display the values.

{}: This is the default placeholder used for formatting values in Rust. It is often referred to as the "Display" placeholder. It is used to format values that implement the std::fmt::Display trait. This placeholder is suitable for most types and provides a human-readable representation of the value. Example:


fn main() {
    let num = 42;
    let text = "Hello";

    println!("Number: {}", num); // Output: Number: 42
    println!("Text: {}", text); // Output: Text: Hello
}


{:?}: This is a special placeholder used for formatting values in Rust, known as the "Debug" placeholder. It is used to format values that implement the std::fmt::Debug trait. It provides a more verbose and detailed representation of the value, primarily used for debugging purposes. Example:

#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let person = Person {
        name: String::from("Alice"),
        age: 25,
    };

    println!("Person: {:?}", person); // Output: Person: Person { name: "Alice", age: 25 }
}


In the example above, Person struct implements the std::fmt::Debug trait using the derive attribute. When printing the person struct using println! and the {:?} placeholder, it displays a detailed representation of the struct fields.

In summary, the {} placeholder is used for normal display of values, while {:?} is used for a more detailed and debug representation of values. The choice between them depends on the desired output format and the traits implemented by the value being printed.
```

## 在Rust中str是什么？


```rust

在Rust中，str是一种类型，表示字符串的切片（slice）。它是不可变的，由一个字节数组和一个指向该数组的长度组成。str类型可以用于表示任意长度的UTF-8编码字符串。

与String类型不同，str类型是静态分配的，即在编译时就确定了字符串的内容和长度。它通常作为引用（&str）出现，因为字符串切片通常是对字符串的引用，而不是拥有字符串的所有权。

由于str类型是不可变的，无法直接修改其内容。要对str进行操作或修改，通常需要将其转换为可变的String类型，进行修改后再转换回&str类型。

以下是一个使用str类型的示例：

fn main() {
    let greeting: &str = "Hello, world!";
    let name: &str = "Alice";

    println!("Greeting: {}", greeting);
    println!("Name: {}", name);
}


在上述示例中，我们定义了两个&str类型的变量：greeting和name，它们分别表示问候语和名字。然后，我们使用println!宏打印了这两个字符串切片。

需要注意的是，&str类型是一种不可变的引用，可以在Rust中方便地处理和传递文本数据。它被广泛用于函数参数、结构体字段、以及与其他字符串相关的操作和函数中。

总结来说，str是在Rust中表示字符串切片的类型，它是不可变的、静态分配的，并以&str的形式作为引用使用。它适用于表示任意长度的UTF-8编码字符串，并在Rust中广泛用于处理文本数据。

```

## 字符串字面值就是 slice

```rust
还记得我们讲到过字符串字面值被储存在二进制文件中吗？现在知道 slice 了，我们就可以正确地理解字符串字面值了：


let s = "Hello, world!";


这里 s 的类型是 &str：它是一个指向二进制程序特定位置的 slice。这也就是为什么字符串字面值是不可变的；&str 是一个不可变引用。
```

## 在Rust中生命周期和泛型的关系
```rust

在Rust中，生命周期（lifetimes）和泛型（generics）是密切相关的概念，用于确保引用的有效性和合法性。

泛型允许编写可重用的代码，适用于不同类型的数据而不需要重复编写类似的代码。它可以在函数、结构体和枚举等定义中使用。使用泛型时，可以将类型参数用作占位符，表示实际类型的待定。

生命周期则用于处理引用的有效性和作用域。在Rust中，每个引用都必须有一个对应的生命周期，用于指定引用的有效范围。生命周期表示引用在内存中存在的时间，确保在使用引用时，被引用的值不会提前被释放。

泛型和生命周期的关系在于，当使用泛型的引用类型时，需要指定引用的生命周期，以确保引用的有效性。

以下是一个示例，展示了泛型和生命周期的关系：


fn find_first_occurrence<'a, T>(list: &'a [T], target: &T) -> Option<&'a T>
    where T: PartialEq
{
    for item in list {
        if item == target {
            return Some(item);
        }
    }
    None
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let target = &3;

    let result = find_first_occurrence(&numbers, target);
    match result {
        Some(value) => println!("Found: {}", value),
        None => println!("Not found"),
    }
}


在上述示例中，我们定义了一个find_first_occurrence函数，它接受一个泛型的切片和一个目标值作为参数。函数使用生命周期参数'a来指定切片的生命周期，并返回一个Option类型的引用，指向第一个匹配到的目标值。在函数签名中，我们使用where子句指定了类型参数T必须实现PartialEq trait，以便可以比较值。

在main函数中，我们创建了一个整数向量numbers，并定义了一个目标值target。然后，我们调用find_first_occurrence函数，并以&numbers和&target作为参数。根据返回的结果，我们打印相应的消息。

通过使用生命周期参数'a，我们确保了切片的引用在函数内部的有效性，并与传递的参数具有相同的生命周期。这样可以避免引用悬垂或无效引用的问题。

总结来说，在Rust中，泛型和生命周期密切相关，通过使用生命周期参数，可以确保引用的有效性和合法性，并允许编写可重用的泛型代码。泛型和生命周期的结合使得编写类型安全的高效代码成为可能。
```

## 结合泛型类型参数、trait bounds、生命周期
```rust

让我们简要的看一下在同一函数中指定泛型类型参数、trait bounds 和生命周期的语法！


use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
x: &'a str,
y: &'a str,
ann: T,
) -> &'a str
where
T: Display,
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

这个是示例 10-21 中那个返回两个字符串 slice 中较长者的 longest 函数，不过带有一个额外的参数 ann。ann 的类型是泛型 T，它可以被放入任何实现了 where 从句中指定的 Display trait 的类型。这个额外的参数会使用 {} 打印，这也就是为什么 Display trait bound 是必须的。因为生命周期也是泛型，所以生命周期参数 'a 和泛型类型参数 T 都位于函数名后的同一尖括号列表中。

现在你知道了泛型类型参数、trait 和 trait bounds 以及泛型生命周期类型，你已经准备好编写既不重复又能适用于多种场景的代码了。

- 泛型类型参数意味着代码可以适用于不同的类型。
- trait 和 trait bounds 保证了即使类型是泛型的，这些类型也会拥有所需要的行为。
- 由生命周期注解所指定的引用生命周期之间的关系保证了这些灵活多变的代码不会出现悬垂引用。
  
而所有的这一切发生在编译时所以不会影响运行时效率！
```


## 闭包

- https://kaisery.github.io/trpl-zh-cn/ch13-01-closures.html

一旦闭包捕获了定义它的环境中一个值的引用或者所有权（也就影响了什么会被移 进 闭包，如有)，闭包体中的代码定义了稍后在闭包计算时对引用或值如何操作（也就影响了什么会被移 出 闭包，如有）。闭包体可以做以下任何事：将一个捕获的值移出闭包，修改捕获的值，既不移动也不修改值，或者一开始就不从环境中捕获值。

闭包捕获和处理环境中的值的方式影响闭包实现的 trait。Trait 是函数和结构体指定它们能用的闭包的类型的方式。取决于闭包体如何处理值，闭包自动、渐进地实现一个、两个或三个 Fn trait。

- FnOnce 适用于能被调用一次的闭包，所有闭包都至少实现了这个 trait，因为所有闭包都能被调用。一个会将捕获的值移出闭包体的闭包只实现 FnOnce trait，这是因为它只能被调用一次。
- FnMut 适用于不会将捕获的值移出闭包体的闭包，但它可能会修改被捕获的值。这类闭包可以被调用多次。
- Fn 适用于既不将被捕获的值移出闭包体也不修改被捕获的值的闭包，当然也包括不从环境中捕获值的闭包。这类闭包可以被调用多次而不改变它们的环境，这在会多次并发调用闭包的场景中十分重要。

```rust
pub generator_parent_path: Option<Box<dyn FnOnce(&String, &SodaMetaDataBasic) -> String + Send + 'static>>,

error[E0507]: cannot move out of `*fun` which is behind a shared reference
   --> soda_media_tools_lib\src\soda_media\media_context.rs:194:17
    |
194 |                 (fun)(target_directory, dir_metadata);
    |                 ^^^^^--------------------------------
    |                 |
    |                 `*fun` moved due to this call
    |                 move occurs because `*fun` has type `Box<dyn for<'a, 'b> FnOnce(&'a String, &'b SodaMetaDataBasic) -> String + Send>`, which does not implement the `Copy` trait
    |
note: this value implements `FnOnce`, which causes it to be moved when called
   --> soda_media_tools_lib\src\soda_media\media_context.rs:194:17
    |
194 |                 (fun)(target_directory, dir_metadata);
    |                 ^^^^^

```


## get tests directory path in Rust

In Rust, you can use the `std::env::current_dir` function to get the current working directory, and then append the path to your tests directory. Assuming you have a project structure like this:

```
my_project/
  ├── src/
  ├── tests/
  │   └── test_module.rs
  └── Cargo.toml
```

You can get the path to the tests directory from within your test code like this:

```rust
fn main() {
    // Get the current working directory.
    let current_dir = std::env::current_dir().expect("Failed to get current directory");

    // Append the 'tests' directory to the current working directory.
    let tests_dir = current_dir.join("tests");

    println!("Tests directory path: {:?}", tests_dir);
}
```

This code first retrieves the current working directory using `std::env::current_dir()`, and then it appends the "tests" directory to the current working directory using the `join` method. Finally, it prints the path to the tests directory.

Make sure to handle any potential errors when getting the current directory, as shown in the example with `expect`.


## How to overwrite a file in Rust

- https://ddanilov.me/how-to-overwrite-a-file-in-rust

## How to read and write YAML in Rust with Serde

- https://tms-dev-blog.com/how-to-read-and-write-yaml-in-rust-with-serde/