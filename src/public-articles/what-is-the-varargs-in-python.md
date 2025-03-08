---
article: true
---

# What is the varargs in Python

在Python中，可变参数允许函数接收不定数量的参数，无论是位置参数还是关键字参数。这使得函数在面对不确定参数数量时变得更加灵活和通用。以下是对可变参数的详细解释和使用方法：

### 可变位置参数 `*args`

**含义：**
`*args` 是一个用于收集额外位置参数的语法，这些参数以元组 (`tuple`) 的形式存储。这允许函数接受任意数量的位置参数。

**使用方法：**
```python
def function_with_varargs(*args):
    print("Arguments:", args)
    for arg in args:
        print(arg)

# 调用函数
function_with_varargs(1, 2, 3, 'a', 'b')
```
在这个例子中，`*args` 收集所有传入 `function_with_varargs` 的位置参数，并将它们作为一个元组存储在变量 `args` 中。

### 可变关键字参数 `**kwargs`

**含义：**
`**kwargs` 是一个用于收集额外关键字参数的语法，这些参数以字典 (`dict`) 的形式存储。它允许函数接受任意数量的关键字参数。

**使用方法：**
```python
def function_with_kwargs(**kwargs):
    print("Keyword arguments:", kwargs)
    for key, value in kwargs.items():
        print(f"{key} = {value}")

# 调用函数
function_with_kwargs(name='Alice', age=25, country='USA')
```
在这个例子中，`**kwargs` 收集所有传入 `function_with_kwargs` 的关键字参数，并将它们作为一个字典存储在变量 `kwargs` 中。

### 结合使用 `*args` 和 `**kwargs`

你可以在同一个函数中同时使用 `*args` 和 `**kwargs` 来允许接收任意数量的位置参数和关键字参数。

```python
def function_with_both(*args, **kwargs):
    print("Positional arguments:", args)
    print("Keyword arguments:", kwargs)
    
# 调用函数
function_with_both(1, 2, 'a', key1='value1', key2=99)
```
这种方式在编写高度灵活的API或函数时特别有用，例如构造函数、装饰器或调用回调函数等场景。

### 注意事项
- 在函数定义中，`*args` 必须在 `**kwargs` 之前。
- 当你调用函数时，确保位置参数在关键字参数之前。

使用可变参数可以让你的函数接口更加灵活和强大，适应更多不同的调用场景。