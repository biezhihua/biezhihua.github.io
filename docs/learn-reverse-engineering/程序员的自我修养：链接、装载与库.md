# 程序员的自我修养：链接、装载与库

本书将详细描述现在流行的Windows和Linux操作系统下各自的可执行文件、目标文件格式；普通C/C++程序代码如何被编译成目标文件及程序在目标文件中如何存储；目标文件如何被链接器链接到一起，并且形成可执行文件；目标文件在链接时符号处理、重定位和地址分配如何进行；可执行文件如何被装载并且执行；可执行文件与进程的虚拟空间之间如何映射；什么是动态链接，为什么要进行动态链接；Windows和Linux如何进行动态链接及动态链接时的相关问题；什么是堆，什么是栈；函数调用惯例；运行库，Glibc和MSVC CRT的实现分析；系统调用与API；最后我们自己还实现了一个Mini CRT。

## 第1部分 简介

### 第1章 温故而知新

介绍基本的背景知识，包括硬件、操作系统、线程等。

#### 1.1 从Hello World说起

#### 1.2 万变不离其宗

#### 1.3 站得高，望得远

#### 1.4 操作系统做什么

#### 1.5 内存不够怎么办

#### 1.6 众人拾柴火焰高

- 我们把单指令的操作称为原子的（Atomic），因为无论如何，单条指令的执行是不会被打断的。
- 所谓同步，既是指在一个线程访问数据未结束的时候，其他线程不得对同一个数据进行访问。如此，对数据的访问被原子化了。

- 可重入（Reentrant）与线程安全
一个函数被重入，表示这个函数没有执行完成，由于外部因素或内部调用，又一次进入该函数执行。一个函数要被重入，只有两种情况：
（1）多个线程同时执行这个函数。
（2）函数自身（可能是经过多层调用之后）调用自身。
一个函数被称为可重入的，表明该函数被重入之后不会产生任何不良后果。

- 我们可以使用volatile关键字试图阻止过度优化，volatile基本可以做到两件事情：
（1）阻止编译器为了提高速度将一个变量缓存到寄存器内而不写回。
（2）阻止编译器调整操作volatile变量的指令顺序。

#### 1.7 本章小结

## 第2部分 静态链接

### 第2章 编译和链接

介绍编译和链接的基本概念和步骤。

- 通常将这种编译和链接合并到一起的过程称为构建（Build）

#### 2.1 被隐藏了的过程

```c
#include <stdio.h>

int main()
{
    printf("Hello World\n");
    return 0;
}
```

- GCC编译过程分解, 分别是预处理（Prepressing）、编译（Compilation）、汇编（Assembly）和链接（Linking）
    - 预编译过程主要处理那些源代码文件中的以“#”开始的预编译指令。
    - 编译过程就是把预处理完的文件进行一系列词法分析、语法分析、语义分析及优化后生产相应的汇编代码文件，这个过程往往是我们所说的整个程序构建的核心部分，也是最复杂的部分之一。
    - 汇编器是将汇编代码转变成机器可以执行的指令，每一个汇编语句几乎都对应一条机器指令

#### 2.2 编译器做了什么

- 编译过程一般可以分为6步：扫描、语法分析、语义分析、源代码优化、代码生成和目标代码优化
- 词法分析
- 语法分析
- 语义分析
- 中间语言生成
    - 其实直接在语法树上作优化比较困难，所以源代码优化器往往将整个语法树转换成中间代码（Intermediate Code），它是语法树的顺序表示，其实它已经非常接近目标代码了。但是它一般跟目标机器和运行时环境是无关的，比如它不包含数据的尺寸、变量地址和寄存器的名字等。中间代码有很多种类型，在不同的编译器中有着不同的形式，比较常见的有：三地址码（Three-address Code）和P-代码（P-Code）
    - 中间代码使得编译器可以被分为前端和后端。编译器前端负责产生机器无关的中间代码，编译器后端将中间代码转换成目标机器代码。这样对于一些可以跨平台的编译器而言，它们可以针对不同的平台使用同一个前端和针对不同机器平台的数个后端。
- 目标代码生成与优化
  - 编译器后端主要包括代码生成器（Code Generator）和目标代码优化器（Target Code Optimizer）


事实上，定义其他模块的全局变量和函数在最终运行时的绝对地址都要在最终链接的时候才能确定。所以现代的编译器可以将一个源代码文件编译成一个未链接的目标文件，然后由链接器最终将这些目标文件链接起来形成可执行文件。

#### 2.3 链接器年龄比编译器长

在一个程序被分割成多个模块以后，这些模块之间最后如何组合形成一个单一的程序是须解决的问题。模块之间如何组合的问题可以归结为模块之间如何通信的问题，最常见的属于静态语言的C/C++模块之间通信有两种方式，一种是模块间的函数调用，另外一种是模块间的变量访问。函数访问须知道目标函数的地址，变量访问也须知道目标变量的地址，所以这两种方式都可以归结为一种方式，那就是模块间符号的引用。

#### 2.4 模块拼装——静态链接

一个复杂的软件也如此，人们把每个源代码模块独立地编译，然后按照需要将它们“组装”起来，这个组装模块的过程就是链接（Linking）。链接的主要内容就是把各个模块之间相互引用的部分都处理好，使得各个模块之间能够正确地衔接。

链接过程主要包括了地址和空间分配（Address and Storage Allocation）、符号决议（Symbol Resolution）和重定位（Relocation）等这些步骤。

最常见的库就是运行时库（Runtime Library），它是支持程序运行的基本函数的集合。库其实是一组目标文件的包，就是一些最常用的代码编译成目标文件后打包存放。

这个地址修正的过程也被叫做重定位（Relocation），每个要被修正的地方叫一个重定位入口（Relocation Entry）。重定位所做的就是给程序中每个这样的绝对地址引用的位置“打补丁”，使它们指向正确的地址。


#### 2.5 本章小结

### 第3章 目标文件里有什么

介绍COFF目标文件格式和源代码编译后如何在目标文件中存储。

#### 3.1 目标文件的格式

现在PC平台流行的可执行文件格式（Executable）主要是Windows下的PE（Portable Executable）和Linux的ELF（Executable Linkable Format），它们都是COFF（Common file format）格式的变种。

目标文件就是源代码编译后但未进行链接的那些中间文件（Windows的.obj和Linux下的.o），它跟可执行文件的内容与结构很相似，所以一般跟可执行文件格式一起采用一种格式存储。

不光是可执行文件（Windows的.exe和Linux下的ELF可执行文件）按照可执行文件格式存储。动态链接库（DLL，Dynamic Linking Library）（Windows的.dll和Linux的.so）及静态链接库（Static Linking Library）（Windows的.lib和Linux的.a）文件都按照可执行文件格式存储。它们在Windows下都按照PE-COFF格式存储，Linux下按照ELF格式存储。静态链接库稍有不同，它是把很多目标文件捆绑在一起形成一个文件，再加上一些索引，你可以简单地把它理解为一个包含有很多目标文件的文件包。

#### 3.2 目标文件是什么样的


```
GCC来编译这个文件（参数 -c 表示只编译不链接）
gcc –c SimpleSection.c

gcc –c -g SimpleSection.c

objdump -h SimpleSection.o

size SimpleSection.o

objdump -s -d SimpleSection.o

objdump -x -s -d SimpleSection.o

readelf –h SimpleSection.o

readelf -S SimpleSection.o

nm SimpleSection.o

readelf -s SimpleSection.o
```

#### 3.3 挖掘SimpleSection.o

- .text 代码段
  - objdump -s -d
- .data段保存的是那些已经初始化了的全局静态变量和局部静态变量
- .rodata段存放的是只读数据，一般是程序里面的只读变量（如const修饰的变量）和字符串常量。
- .bss段存放的是未初始化的全局变量和局部静态变量  
- .text：代码段
- .data：已初始化的数据
- .bss：未初始化的数据
- .rodata：只读数据
- .symtab：符号表
- .strtab：字符串表
- .shstrtab: 段名表
- .rel.*：重定位信息
- .dynamic：动态链接信息
- .init和.fini：初始化和终止代码
- .debug：调试信息
- .line
- .plt和.got：动态链接相关
- .comment：注释信息
- .note：系统备注

#### 3.4 ELF文件结构描述

- ELF魔术
- 段表 Section Header Table，段表在ELF文件中的位置由ELF文件头的“e_shoff”成员决定

#### 3.5 链接的接口——符号

链接过程的本质就是要把多个不同的目标文件之间相互“粘”到一起，或者说像玩具积木一样，可以拼装形成一个整体。

在链接中，目标文件之间相互拼合实际上是目标文件之间对地址的引用，即对函数和变量的地址的引用。

每个函数或变量都有自己独特的名字，才能避免链接过程中不同变量和函数之间的混淆。在链接中，我们将函数和变量统称为符号（Symbol），函数名或变量名就是符号名（Symbol Name）。

链接过程中很关键的一部分就是符号的管理，每一个目标文件都会有一个相应的符号表（Symbol Table），这个表里面记录了目标文件中所用到的所有符号。每个定义的符号有一个对应的值，叫做符号值（Symbol Value），对于变量和函数来说，符号值就是它们的地址。

我们将符号表中所有的符号进行分类，它们有可能是下面这些类型中的一种：
- 1. 定义在本目标文件的全局符号，可以被其他目标文件引用。
- 2. 在本目标文件中引用的全局符号，却没有定义在本目标文件，这一般叫做外部符号（External Symbol），也就是我们前面所讲的符号引用。
- 3. 段名，这种符号往往由编译器产生，它的值就是该段的起始地址。
- 4. 局部符号，这类符号只在编译单元内部可见。
- 5. 行号信息，即目标文件指令与源代码中代码行的对应关系，它也是可选的。

3.5.1 ELF符号表结构

```
typedef struct {
    Elf32_Word st_name;
    Elf32_Addr st_value;
    Elf32_Word st_size;
    unsigned char st_info;
    unsigned char st_other;
    Elf32_Half st_shndx;
} Elf32_Sym;
```

```
nm simplesection.o
0000000000000000 T func1
0000000000000000 D global_init_var
0000000000000000 B global_uninit_var
000000000000002b T main
                 U printlf
0000000000000004 d static_var.1
0000000000000004 b static_var2.0

readelf -s ./simplesection.o 
Symbol table '.symtab' contains 13 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
     0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND 
     1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS simplesection.c
     2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1 .text
     3: 0000000000000000     0 SECTION LOCAL  DEFAULT    3 .data
     4: 0000000000000000     0 SECTION LOCAL  DEFAULT    4 .bss
     5: 0000000000000000     0 SECTION LOCAL  DEFAULT    5 .rodata
     6: 0000000000000004     4 OBJECT  LOCAL  DEFAULT    3 static_var.1
     7: 0000000000000004     4 OBJECT  LOCAL  DEFAULT    4 static_var2.0
     8: 0000000000000000     4 OBJECT  GLOBAL DEFAULT    3 global_init_var
     9: 0000000000000000     4 OBJECT  GLOBAL DEFAULT    4 global_uninit_var
    10: 0000000000000000    43 FUNC    GLOBAL DEFAULT    1 func1
    11: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND printlf
    12: 000000000000002b    55 FUNC    GLOBAL DEFAULT    1 main

```

3.5.2 特殊符号

3.5.3 符号修饰与函数签名

C++符号修饰，人们发明了符号修饰（Name Decoration）或符号改编（Name Mangling）的机制。

术语叫做函数签名（Function Signature），函数签名包含了一个函数的信息，包括函数名、它的参数类型、它所在的类和名称空间及其他信息。

在编译器及链接器处理符号时，它们使用某种名称修饰的方法，使得每个函数签名对应一个修饰后名称（Decorated Name）。编译器在将C++源代码编译成目标文件时，会将函数和变量的名字进行修饰，形成符号名，也就是说，C++的源代码编译后的目标文件中所使用的符号名是相应的函数和变量的修饰后名称。C++编译器和链接器都使用符号来识别和处理函数和变量，所以对于不同函数签名的函数，即使函数名相同，编译器和链接器都认为它们是不同的函数。

3.5.4 extern “C”

3.5.5 弱符号与强符号

这种符号的定义可以被称为强符号（Strong Symbol）。有些符号的定义可以被称为弱符号（Weak Symbol）。对于C/C++语言来说，编译器默认函数和初始化了的全局变量为强符号，未初始化的全局变量为弱符号。

针对强弱符号的概念，链接器就会按如下规则处理与选择被多次定义的全局符号：

规则1：不允许强符号被多次定义（即不同的目标文件中不能有同名的强符号）；如果有多个强符号定义，则链接器报符号重复定义错误。

规则2：如果一个符号在某个目标文件中是强符号，在其他文件中都是弱符号，那么选择强符号。

规则3：如果一个符号在所有目标文件中都是弱符号，那么选择其中占用空间最大的一个。比如目标文件A定义全局变量global为int型，占4个字节；目标文件B定义global为double型，占8个字节，那么目标文件A和B链接后，符号global占8个字节（尽量不要使用多个不同类型的弱符号，否则容易导致很难发现的程序错误）。

#### 3.6 调试信息
#### 3.7 本章小结

### 第4章 静态链接

介绍静态链接与静态库链接的过程和步骤。

```shell
ld a.o b.o -e main -o ab
```

编译源码到目标文件时，一定要加“-fno-stack-protector”，不然默认会调函数“__stack_chk_fail”进行栈相关检查，然而是手动裸ld去链接，没有链接到“__stack_chk_fail”所在库文件，所以在链接过程一定会报错: undefined reference to `__stack_chk_fail'。解决办法不是在链接过程中，而是在编译时加此参数，强制gcc不进行栈检查，从而解决。此外，ld 的时候加上参数"-e main"就可以了，意思是将main函数作为程序入口，ld 的默认程序入口为_start。即：gcc -c a.c -fno-stack-protector -o a.old a.o b.o -e main -o ab

- 关于undefined reference to `__stack_chk_fail'踩坑 : https://www.cnblogs.com/chenglixue/p/16848546.html

```shell
objdump -h a.o

a.o:     file format elf64-x86-64

Sections:
Idx Name                Size      VMA               LMA               File off  Algn
  0 .text               00000030  0000000000000000  0000000000000000  00000040  2**0
                        CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
  1 .data               00000000  0000000000000000  0000000000000000  00000070  2**0
                        CONTENTS, ALLOC, LOAD, DATA
  2 .bss                00000000  0000000000000000  0000000000000000  00000070  2**0
                        ALLOC
  3 .comment            0000002c  0000000000000000  0000000000000000  00000070  2**0
                        CONTENTS, READONLY
  4 .note.GNU-stack     00000000  0000000000000000  0000000000000000  0000009c  2**0
                        CONTENTS, READONLY
  5 .note.gnu.property  00000020  0000000000000000  0000000000000000  000000a0  2**3
                        CONTENTS, ALLOC, LOAD, READONLY, DATA
  6 .eh_frame           00000038  0000000000000000  0000000000000000  000000c0  2**3
                        CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA


objdump -h b.o

b.o:     file format elf64-x86-64

Sections:
Idx Name                Size      VMA               LMA               File off  Algn
  0 .text               0000004f  0000000000000000  0000000000000000  00000040  2**0
                        CONTENTS, ALLOC, LOAD, READONLY, CODE
  1 .data               00000004  0000000000000000  0000000000000000  00000090  2**2
                        CONTENTS, ALLOC, LOAD, DATA
  2 .bss                00000000  0000000000000000  0000000000000000  00000094  2**0
                        ALLOC
  3 .comment            0000002c  0000000000000000  0000000000000000  00000094  2**0
                        CONTENTS, READONLY
  4 .note.GNU-stack     00000000  0000000000000000  0000000000000000  000000c0  2**0
                        CONTENTS, READONLY
  5 .note.gnu.property  00000020  0000000000000000  0000000000000000  000000c0  2**3
                        CONTENTS, ALLOC, LOAD, READONLY, DATA
  6 .eh_frame           00000038  0000000000000000  0000000000000000  000000e0  2**3
                        CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA

objdump -h ab  

ab:     file format elf64-x86-64

Sections:
Idx Name                Size      VMA               LMA               File off  Algn
  0 .note.gnu.property  00000020  00000000004001c8  00000000004001c8  000001c8  2**3
                        CONTENTS, ALLOC, LOAD, READONLY, DATA
  1 .text               0000007f  0000000000401000  0000000000401000  00001000  2**0
                        CONTENTS, ALLOC, LOAD, READONLY, CODE
  2 .eh_frame           00000058  0000000000402000  0000000000402000  00002000  2**3
                        CONTENTS, ALLOC, LOAD, READONLY, DATA
  3 .data               00000004  0000000000404000  0000000000404000  00003000  2**2
                        CONTENTS, ALLOC, LOAD, DATA
  4 .comment            0000002b  0000000000000000  0000000000000000  00003004  2**0
                        CONTENTS, READONLY

```

#### 4.1 空间与地址分配

4.1.1 按序叠加

4.1.2 相似段合并

4.1.3 符号地址的确定


#### 4.2 符号解析与重定位


```c

extern int shared;

int main() {
    int a = 100;
    swap(&a, &shared);
    return 0;
}


int shared = 1;

void swap(int* a, int* b) {
    *a ^= *b ^= *a ^= *b; 
}
```

```shell

objdump -d a.o

a.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <main>:
   0:	f3 0f 1e fa          	endbr64 
   4:	55                   	push   %rbp
   5:	48 89 e5             	mov    %rsp,%rbp
   8:	48 83 ec 10          	sub    $0x10,%rsp
   c:	c7 45 fc 64 00 00 00 	movl   $0x64,-0x4(%rbp)
  13:	48 8d 45 fc          	lea    -0x4(%rbp),%rax
  17:	48 8d 15 00 00 00 00 	lea    0x0(%rip),%rdx        # 1e <main+0x1e>
  1e:	48 89 d6             	mov    %rdx,%rsi
  21:	48 89 c7             	mov    %rax,%rdi
  24:	b8 00 00 00 00       	mov    $0x0,%eax
  29:	e8 00 00 00 00       	call   2e <main+0x2e>
  2e:	b8 00 00 00 00       	mov    $0x0,%eax
  33:	c9                   	leave  
  34:	c3                   	ret    

0000000000000000 <main>:
   c:	c7 45 fc 64 00 00 00 	movl   $0x64,-0x4(%rbp)    ; 局部变量 int a = 100（0x64）
  13:	48 8d 45 fc          	lea    -0x4(%rbp),%rax     ; 将a的地址存入rax
  17:	48 8d 15 00 00 00 00 	lea    0x0(%rip),%rdx      ; 加载shared地址（未解析，占位0）
  24:	e8 00 00 00 00       	call   2e <main+0x2e>      ; 调用swap（未解析，占位0）

➜  Documents objdump -d b.o

b.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <swap>:
   0:	f3 0f 1e fa          	endbr64 
   4:	55                   	push   %rbp
   5:	48 89 e5             	mov    %rsp,%rbp
   8:	48 89 7d f8          	mov    %rdi,-0x8(%rbp)
   c:	48 89 75 f0          	mov    %rsi,-0x10(%rbp)
  10:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  14:	8b 10                	mov    (%rax),%edx
  16:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  1a:	8b 00                	mov    (%rax),%eax
  1c:	31 c2                	xor    %eax,%edx
  1e:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  22:	89 10                	mov    %edx,(%rax)
  24:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  28:	8b 10                	mov    (%rax),%edx
  2a:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  2e:	8b 00                	mov    (%rax),%eax
  30:	31 c2                	xor    %eax,%edx
  32:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  36:	89 10                	mov    %edx,(%rax)
  38:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  3c:	8b 10                	mov    (%rax),%edx
  3e:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  42:	8b 00                	mov    (%rax),%eax
  44:	31 c2                	xor    %eax,%edx
  46:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  4a:	89 10                	mov    %edx,(%rax)
  4c:	90                   	nop
  4d:	5d                   	pop    %rbp
  4e:	c3                   	ret    

0000000000000000 <swap>:
  10:	48 8b 45 f8          	mov    -0x8(%rbp),%rax     ; 取第一个参数指针（int *x）
  14:	8b 10                	mov    (%rax),%edx         ; 读取x的值到edx
  16:	48 8b 45 f0          	mov    -0x10(%rbp),%rax    ; 取第二个参数指针（int *y）
  1a:	8b 00                	mov    (%rax),%eax         ; 读取y的值到eax
  1c:	31 c2                	xor    %eax,%edx           ; edx = x ^ y
  22:	89 10                	mov    %edx,(%rax)         ; *x = x ^ y（异或交换法）


➜  Documents objdump -d ab

ab:     file format elf64-x86-64


Disassembly of section .text:

0000000000401000 <main>:
  401000:	f3 0f 1e fa          	endbr64 
  401004:	55                   	push   %rbp
  401005:	48 89 e5             	mov    %rsp,%rbp
  401008:	48 83 ec 10          	sub    $0x10,%rsp
  40100c:	c7 45 fc 64 00 00 00 	movl   $0x64,-0x4(%rbp)
  401013:	48 8d 45 fc          	lea    -0x4(%rbp),%rax
  401017:	48 8d 15 e2 2f 00 00 	lea    0x2fe2(%rip),%rdx        # 404000 <shared>
  40101e:	48 89 d6             	mov    %rdx,%rsi
  401021:	48 89 c7             	mov    %rax,%rdi
  401024:	b8 00 00 00 00       	mov    $0x0,%eax
  401029:	e8 07 00 00 00       	call   401035 <swap>
  40102e:	b8 00 00 00 00       	mov    $0x0,%eax
  401033:	c9                   	leave  
  401034:	c3                   	ret    

0000000000401035 <swap>:
  401035:	f3 0f 1e fa          	endbr64 
  401039:	55                   	push   %rbp
  40103a:	48 89 e5             	mov    %rsp,%rbp
  40103d:	48 89 7d f8          	mov    %rdi,-0x8(%rbp)
  401041:	48 89 75 f0          	mov    %rsi,-0x10(%rbp)
  401045:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  401049:	8b 10                	mov    (%rax),%edx
  40104b:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  40104f:	8b 00                	mov    (%rax),%eax
  401051:	31 c2                	xor    %eax,%edx
  401053:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  401057:	89 10                	mov    %edx,(%rax)
  401059:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  40105d:	8b 10                	mov    (%rax),%edx
  40105f:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  401063:	8b 00                	mov    (%rax),%eax
  401065:	31 c2                	xor    %eax,%edx
  401067:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  40106b:	89 10                	mov    %edx,(%rax)
  40106d:	48 8b 45 f0          	mov    -0x10(%rbp),%rax
  401071:	8b 10                	mov    (%rax),%edx
  401073:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  401077:	8b 00                	mov    (%rax),%eax
  401079:	31 c2                	xor    %eax,%edx
  40107b:	48 8b 45 f8          	mov    -0x8(%rbp),%rax
  40107f:	89 10                	mov    %edx,(%rax)
  401081:	90                   	nop
  401082:	5d                   	pop    %rbp
  401083:	c3                   	ret    

0000000000401000 <main>:
  401017:	48 8d 15 e2 2f 00 00 	lea    0x2fe2(%rip),%rdx   ; shared地址 = rip+0x2fe2 → 0x404000
  401029:	e8 07 00 00 00       	call   401035 <swap>        ; 调用swap（地址已解析）

➜  Documents objdump -r a.o

a.o:     file format elf64-x86-64

RELOCATION RECORDS FOR [.text]:
OFFSET           TYPE              VALUE 
000000000000001a R_X86_64_PC32     shared-0x0000000000000004
000000000000002a R_X86_64_PLT32    swap-0x0000000000000004


RELOCATION RECORDS FOR [.eh_frame]:
OFFSET           TYPE              VALUE 
0000000000000020 R_X86_64_PC32     .text


➜  Documents objdump -r b.o

b.o:     file format elf64-x86-64

RELOCATION RECORDS FOR [.eh_frame]:
OFFSET           TYPE              VALUE 
0000000000000020 R_X86_64_PC32     .text


➜  Documents 
➜  Documents readelf -s a.o

Symbol table '.symtab' contains 6 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
     0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND 
     1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS a.c
     2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1 .text
     3: 0000000000000000    53 FUNC    GLOBAL DEFAULT    1 main
     4: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND shared
     5: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND swap

```

4.2.1 重定位

4.2.2 重定位表

4.2.3 符号解析

4.2.4 指令修正方式

#### 4.3 COMMON块

#### 4.4 C++相关问题

4.4.1 重复代码消除

4.4.2 全局构造与析构

4.4.3 C++与ABI

把符号修饰标准、变量内存布局、函数调用方式等这些跟可执行代码二进制兼容性相关的内容称为ABI（Application Binary Interface）。

#### 4.5 静态库链接

一个静态库可以简单地看成一组目标文件的集合，即很多目标文件经过压缩打包后形成的一个文件。

#### 4.6 链接过程控制

4.6.1 链接控制脚本

一般链接器有如下三种方法。

- 使用命令行来给链接器指定参数，我们前面所使用的ld的-o、-e参数就属于这类。这种方法我们已经在前面使用很多次了。

- 将链接指令存放在目标文件里面，编译器经常会通过这种方法向链接器传递指令。

- 使用链接控制脚本，使用链接控制脚本方法就是本节要介绍的，也是最为灵活、最为强大的链接控制方法。

``` shell
➜  Documents ld -verbose
GNU ld (GNU Binutils for Ubuntu) 2.38
  Supported emulations:
   elf_x86_64
   elf32_x86_64
   elf_i386
   elf_iamcu
   elf_l1om
   elf_k1om
   i386pep
   i386pe
using internal linker script:
==================================================
/* Script for -z combreloc -z separate-code */
/* Copyright (C) 2014-2022 Free Software Foundation, Inc.
   Copying and distribution of this script, with or without modification,
   are permitted in any medium without royalty provided the copyright
   notice and this notice are preserved.  */
OUTPUT_FORMAT("elf64-x86-64", "elf64-x86-64",
	      "elf64-x86-64")
OUTPUT_ARCH(i386:x86-64)
ENTRY(_start)
SEARCH_DIR("=/usr/local/lib/x86_64-linux-gnu"); SEARCH_DIR("=/lib/x86_64-linux-gnu"); SEARCH_DIR("=/usr/lib/x86_64-linux-gnu"); SEARCH_DIR("=/usr/lib/x86_64-linux-gnu64"); SEARCH_DIR("=/usr/local/lib64"); SEARCH_DIR("=/lib64"); SEARCH_DIR("=/usr/lib64"); SEARCH_DIR("=/usr/local/lib"); SEARCH_DIR("=/lib"); SEARCH_DIR("=/usr/lib"); SEARCH_DIR("=/usr/x86_64-linux-gnu/lib64"); SEARCH_DIR("=/usr/x86_64-linux-gnu/lib");
SECTIONS
{
  PROVIDE (__executable_start = SEGMENT_START("text-segment", 0x400000)); . = SEGMENT_START("text-segment", 0x400000) + SIZEOF_HEADERS;
  .interp         : { *(.interp) }
  .note.gnu.build-id  : { *(.note.gnu.build-id) }
  .hash           : { *(.hash) }
  .gnu.hash       : { *(.gnu.hash) }
  .dynsym         : { *(.dynsym) }
  .dynstr         : { *(.dynstr) }
  .gnu.version    : { *(.gnu.version) }
  .gnu.version_d  : { *(.gnu.version_d) }
  .gnu.version_r  : { *(.gnu.version_r) }
  .rela.dyn       :
    {
      *(.rela.init)
      *(.rela.text .rela.text.* .rela.gnu.linkonce.t.*)
      *(.rela.fini)
      *(.rela.rodata .rela.rodata.* .rela.gnu.linkonce.r.*)
      *(.rela.data .rela.data.* .rela.gnu.linkonce.d.*)
      *(.rela.tdata .rela.tdata.* .rela.gnu.linkonce.td.*)
      *(.rela.tbss .rela.tbss.* .rela.gnu.linkonce.tb.*)
      *(.rela.ctors)
      *(.rela.dtors)
      *(.rela.got)
      *(.rela.bss .rela.bss.* .rela.gnu.linkonce.b.*)
      *(.rela.ldata .rela.ldata.* .rela.gnu.linkonce.l.*)
      *(.rela.lbss .rela.lbss.* .rela.gnu.linkonce.lb.*)
      *(.rela.lrodata .rela.lrodata.* .rela.gnu.linkonce.lr.*)
      *(.rela.ifunc)
    }
  .rela.plt       :
    {
      *(.rela.plt)
      PROVIDE_HIDDEN (__rela_iplt_start = .);
      *(.rela.iplt)
      PROVIDE_HIDDEN (__rela_iplt_end = .);
    }
  .relr.dyn : { *(.relr.dyn) }
  . = ALIGN(CONSTANT (MAXPAGESIZE));
  .init           :
  {
    KEEP (*(SORT_NONE(.init)))
  }
  .plt            : { *(.plt) *(.iplt) }
.plt.got        : { *(.plt.got) }
.plt.sec        : { *(.plt.sec) }
  .text           :
  {
    *(.text.unlikely .text.*_unlikely .text.unlikely.*)
    *(.text.exit .text.exit.*)
    *(.text.startup .text.startup.*)
    *(.text.hot .text.hot.*)
    *(SORT(.text.sorted.*))
    *(.text .stub .text.* .gnu.linkonce.t.*)
    /* .gnu.warning sections are handled specially by elf.em.  */
    *(.gnu.warning)
  }
  .fini           :
  {
    KEEP (*(SORT_NONE(.fini)))
  }
  PROVIDE (__etext = .);
  PROVIDE (_etext = .);
  PROVIDE (etext = .);
  . = ALIGN(CONSTANT (MAXPAGESIZE));
  /* Adjust the address for the rodata segment.  We want to adjust up to
     the same address within the page on the next page up.  */
  . = SEGMENT_START("rodata-segment", ALIGN(CONSTANT (MAXPAGESIZE)) + (. & (CONSTANT (MAXPAGESIZE) - 1)));
  .rodata         : { *(.rodata .rodata.* .gnu.linkonce.r.*) }
  .rodata1        : { *(.rodata1) }
  .eh_frame_hdr   : { *(.eh_frame_hdr) *(.eh_frame_entry .eh_frame_entry.*) }
  .eh_frame       : ONLY_IF_RO { KEEP (*(.eh_frame)) *(.eh_frame.*) }
  .gcc_except_table   : ONLY_IF_RO { *(.gcc_except_table .gcc_except_table.*) }
  .gnu_extab   : ONLY_IF_RO { *(.gnu_extab*) }
  /* These sections are generated by the Sun/Oracle C++ compiler.  */
  .exception_ranges   : ONLY_IF_RO { *(.exception_ranges*) }
  /* Adjust the address for the data segment.  We want to adjust up to
     the same address within the page on the next page up.  */
  . = DATA_SEGMENT_ALIGN (CONSTANT (MAXPAGESIZE), CONSTANT (COMMONPAGESIZE));
  /* Exception handling  */
  .eh_frame       : ONLY_IF_RW { KEEP (*(.eh_frame)) *(.eh_frame.*) }
  .gnu_extab      : ONLY_IF_RW { *(.gnu_extab) }
  .gcc_except_table   : ONLY_IF_RW { *(.gcc_except_table .gcc_except_table.*) }
  .exception_ranges   : ONLY_IF_RW { *(.exception_ranges*) }
  /* Thread Local Storage sections  */
  .tdata	  :
   {
     PROVIDE_HIDDEN (__tdata_start = .);
     *(.tdata .tdata.* .gnu.linkonce.td.*)
   }
  .tbss		  : { *(.tbss .tbss.* .gnu.linkonce.tb.*) *(.tcommon) }
  .preinit_array    :
  {
    PROVIDE_HIDDEN (__preinit_array_start = .);
    KEEP (*(.preinit_array))
    PROVIDE_HIDDEN (__preinit_array_end = .);
  }
  .init_array    :
  {
    PROVIDE_HIDDEN (__init_array_start = .);
    KEEP (*(SORT_BY_INIT_PRIORITY(.init_array.*) SORT_BY_INIT_PRIORITY(.ctors.*)))
    KEEP (*(.init_array EXCLUDE_FILE (*crtbegin.o *crtbegin?.o *crtend.o *crtend?.o ) .ctors))
    PROVIDE_HIDDEN (__init_array_end = .);
  }
  .fini_array    :
  {
    PROVIDE_HIDDEN (__fini_array_start = .);
    KEEP (*(SORT_BY_INIT_PRIORITY(.fini_array.*) SORT_BY_INIT_PRIORITY(.dtors.*)))
    KEEP (*(.fini_array EXCLUDE_FILE (*crtbegin.o *crtbegin?.o *crtend.o *crtend?.o ) .dtors))
    PROVIDE_HIDDEN (__fini_array_end = .);
  }
  .ctors          :
  {
    /* gcc uses crtbegin.o to find the start of
       the constructors, so we make sure it is
       first.  Because this is a wildcard, it
       doesn't matter if the user does not
       actually link against crtbegin.o; the
       linker won't look for a file to match a
       wildcard.  The wildcard also means that it
       doesn't matter which directory crtbegin.o
       is in.  */
    KEEP (*crtbegin.o(.ctors))
    KEEP (*crtbegin?.o(.ctors))
    /* We don't want to include the .ctor section from
       the crtend.o file until after the sorted ctors.
       The .ctor section from the crtend file contains the
       end of ctors marker and it must be last */
    KEEP (*(EXCLUDE_FILE (*crtend.o *crtend?.o ) .ctors))
    KEEP (*(SORT(.ctors.*)))
    KEEP (*(.ctors))
  }
  .dtors          :
  {
    KEEP (*crtbegin.o(.dtors))
    KEEP (*crtbegin?.o(.dtors))
    KEEP (*(EXCLUDE_FILE (*crtend.o *crtend?.o ) .dtors))
    KEEP (*(SORT(.dtors.*)))
    KEEP (*(.dtors))
  }
  .jcr            : { KEEP (*(.jcr)) }
  .data.rel.ro : { *(.data.rel.ro.local* .gnu.linkonce.d.rel.ro.local.*) *(.data.rel.ro .data.rel.ro.* .gnu.linkonce.d.rel.ro.*) }
  .dynamic        : { *(.dynamic) }
  .got            : { *(.got) *(.igot) }
  . = DATA_SEGMENT_RELRO_END (SIZEOF (.got.plt) >= 24 ? 24 : 0, .);
  .got.plt        : { *(.got.plt) *(.igot.plt) }
  .data           :
  {
    *(.data .data.* .gnu.linkonce.d.*)
    SORT(CONSTRUCTORS)
  }
  .data1          : { *(.data1) }
  _edata = .; PROVIDE (edata = .);
  . = .;
  __bss_start = .;
  .bss            :
  {
   *(.dynbss)
   *(.bss .bss.* .gnu.linkonce.b.*)
   *(COMMON)
   /* Align here to ensure that the .bss section occupies space up to
      _end.  Align after .bss to ensure correct alignment even if the
      .bss section disappears because there are no input sections.
      FIXME: Why do we need it? When there is no .bss section, we do not
      pad the .data section.  */
   . = ALIGN(. != 0 ? 64 / 8 : 1);
  }
  .lbss   :
  {
    *(.dynlbss)
    *(.lbss .lbss.* .gnu.linkonce.lb.*)
    *(LARGE_COMMON)
  }
  . = ALIGN(64 / 8);
  . = SEGMENT_START("ldata-segment", .);
  .lrodata   ALIGN(CONSTANT (MAXPAGESIZE)) + (. & (CONSTANT (MAXPAGESIZE) - 1)) :
  {
    *(.lrodata .lrodata.* .gnu.linkonce.lr.*)
  }
  .ldata   ALIGN(CONSTANT (MAXPAGESIZE)) + (. & (CONSTANT (MAXPAGESIZE) - 1)) :
  {
    *(.ldata .ldata.* .gnu.linkonce.l.*)
    . = ALIGN(. != 0 ? 64 / 8 : 1);
  }
  . = ALIGN(64 / 8);
  _end = .; PROVIDE (end = .);
  . = DATA_SEGMENT_END (.);
  /* Stabs debugging sections.  */
  .stab          0 : { *(.stab) }
  .stabstr       0 : { *(.stabstr) }
  .stab.excl     0 : { *(.stab.excl) }
  .stab.exclstr  0 : { *(.stab.exclstr) }
  .stab.index    0 : { *(.stab.index) }
  .stab.indexstr 0 : { *(.stab.indexstr) }
  .comment       0 : { *(.comment) }
  .gnu.build.attributes : { *(.gnu.build.attributes .gnu.build.attributes.*) }
  /* DWARF debug sections.
     Symbols in the DWARF debugging sections are relative to the beginning
     of the section so we begin them at 0.  */
  /* DWARF 1.  */
  .debug          0 : { *(.debug) }
  .line           0 : { *(.line) }
  /* GNU DWARF 1 extensions.  */
  .debug_srcinfo  0 : { *(.debug_srcinfo) }
  .debug_sfnames  0 : { *(.debug_sfnames) }
  /* DWARF 1.1 and DWARF 2.  */
  .debug_aranges  0 : { *(.debug_aranges) }
  .debug_pubnames 0 : { *(.debug_pubnames) }
  /* DWARF 2.  */
  .debug_info     0 : { *(.debug_info .gnu.linkonce.wi.*) }
  .debug_abbrev   0 : { *(.debug_abbrev) }
  .debug_line     0 : { *(.debug_line .debug_line.* .debug_line_end) }
  .debug_frame    0 : { *(.debug_frame) }
  .debug_str      0 : { *(.debug_str) }
  .debug_loc      0 : { *(.debug_loc) }
  .debug_macinfo  0 : { *(.debug_macinfo) }
  /* SGI/MIPS DWARF 2 extensions.  */
  .debug_weaknames 0 : { *(.debug_weaknames) }
  .debug_funcnames 0 : { *(.debug_funcnames) }
  .debug_typenames 0 : { *(.debug_typenames) }
  .debug_varnames  0 : { *(.debug_varnames) }
  /* DWARF 3.  */
  .debug_pubtypes 0 : { *(.debug_pubtypes) }
  .debug_ranges   0 : { *(.debug_ranges) }
  /* DWARF 5.  */
  .debug_addr     0 : { *(.debug_addr) }
  .debug_line_str 0 : { *(.debug_line_str) }
  .debug_loclists 0 : { *(.debug_loclists) }
  .debug_macro    0 : { *(.debug_macro) }
  .debug_names    0 : { *(.debug_names) }
  .debug_rnglists 0 : { *(.debug_rnglists) }
  .debug_str_offsets 0 : { *(.debug_str_offsets) }
  .debug_sup      0 : { *(.debug_sup) }
  .gnu.attributes 0 : { KEEP (*(.gnu.attributes)) }
  /DISCARD/ : { *(.note.GNU-stack) *(.gnu_debuglink) *(.gnu.lto_*) }
}


==================================================

```

4.6.2 最“小”的程序

https://github.com/chunhuajiang/arm-gcc-inline-assembler


4.6.3 使用ld链接脚本

4.6.4 ld链接脚本语法简介

链接脚本由一系列语句组成，语句分两种，一种是命令语句，另外一种是赋值语句。

#### 4.7 BFD库

#### 4.8 本章小结

### 第5章 Windows PE/COFF

介绍Windows平台的目标文件和可执行文件格式。

- https://darkcybe.github.io/posts/Windows_PE_File_Format/
- https://www.openrce.org/reference_library/files/reference/PE%20Format.pdf
- https://learn.microsoft.com/en-us/windows/win32/debug/pe-format

#### 5.1 Windows的二进制文件格式PE/COFF

#### 5.2 PE的前身——COFF

D:\Windows Kits\10\Include\10.0.26100.0\um\winnt.h

```c
//
// Flag (bit) fields
//

typedef BYTE   FCHAR;
typedef WORD   FSHORT;
typedef DWORD  FLONG;


//
// Image Format
//


typedef struct _IMAGE_DOS_HEADER {      // DOS .EXE header
    WORD   e_magic;                     // Magic number
    WORD   e_cblp;                      // Bytes on last page of file
    WORD   e_cp;                        // Pages in file
    WORD   e_crlc;                      // Relocations
    WORD   e_cparhdr;                   // Size of header in paragraphs
    WORD   e_minalloc;                  // Minimum extra paragraphs needed
    WORD   e_maxalloc;                  // Maximum extra paragraphs needed
    WORD   e_ss;                        // Initial (relative) SS value
    WORD   e_sp;                        // Initial SP value
    WORD   e_csum;                      // Checksum
    WORD   e_ip;                        // Initial IP value
    WORD   e_cs;                        // Initial (relative) CS value
    WORD   e_lfarlc;                    // File address of relocation table
    WORD   e_ovno;                      // Overlay number
    WORD   e_res[4];                    // Reserved words
    WORD   e_oemid;                     // OEM identifier (for e_oeminfo)
    WORD   e_oeminfo;                   // OEM information; e_oemid specific
    WORD   e_res2[10];                  // Reserved words
    LONG   e_lfanew;                    // File address of new exe header
  } IMAGE_DOS_HEADER, *PIMAGE_DOS_HEADER;

typedef struct _IMAGE_NT_HEADERS {
    DWORD Signature;
    IMAGE_FILE_HEADER FileHeader;
    IMAGE_OPTIONAL_HEADER32 OptionalHeader;
} IMAGE_NT_HEADERS32, *PIMAGE_NT_HEADERS32;

//
// File header format.
//

typedef struct _IMAGE_FILE_HEADER {
    WORD    Machine;
    WORD    NumberOfSections;
    DWORD   TimeDateStamp;
    DWORD   PointerToSymbolTable;
    DWORD   NumberOfSymbols;
    WORD    SizeOfOptionalHeader;
    WORD    Characteristics;
} IMAGE_FILE_HEADER, *PIMAGE_FILE_HEADER;

// Directory Entries

#define IMAGE_DIRECTORY_ENTRY_EXPORT          0   // Export Directory
#define IMAGE_DIRECTORY_ENTRY_IMPORT          1   // Import Directory
#define IMAGE_DIRECTORY_ENTRY_RESOURCE        2   // Resource Directory
#define IMAGE_DIRECTORY_ENTRY_EXCEPTION       3   // Exception Directory
#define IMAGE_DIRECTORY_ENTRY_SECURITY        4   // Security Directory
#define IMAGE_DIRECTORY_ENTRY_BASERELOC       5   // Base Relocation Table
#define IMAGE_DIRECTORY_ENTRY_DEBUG           6   // Debug Directory
//      IMAGE_DIRECTORY_ENTRY_COPYRIGHT       7   // (X86 usage)
#define IMAGE_DIRECTORY_ENTRY_ARCHITECTURE    7   // Architecture Specific Data
#define IMAGE_DIRECTORY_ENTRY_GLOBALPTR       8   // RVA of GP
#define IMAGE_DIRECTORY_ENTRY_TLS             9   // TLS Directory
#define IMAGE_DIRECTORY_ENTRY_LOAD_CONFIG    10   // Load Configuration Directory
#define IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT   11   // Bound Import Directory in headers
#define IMAGE_DIRECTORY_ENTRY_IAT            12   // Import Address Table
#define IMAGE_DIRECTORY_ENTRY_DELAY_IMPORT   13   // Delay Load Import Descriptors
#define IMAGE_DIRECTORY_ENTRY_COM_DESCRIPTOR 14   // COM Runtime descriptor

//
// Directory format.
//

typedef struct _IMAGE_DATA_DIRECTORY {
    DWORD   VirtualAddress;
    DWORD   Size;
} IMAGE_DATA_DIRECTORY, *PIMAGE_DATA_DIRECTORY;

#define IMAGE_NUMBEROF_DIRECTORY_ENTRIES    16

//
// Optional header format.
//

typedef struct _IMAGE_OPTIONAL_HEADER {
    //
    // Standard fields.
    //

    WORD    Magic;
    BYTE    MajorLinkerVersion;
    BYTE    MinorLinkerVersion;
    DWORD   SizeOfCode;
    DWORD   SizeOfInitializedData;
    DWORD   SizeOfUninitializedData;
    DWORD   AddressOfEntryPoint;
    DWORD   BaseOfCode;
    DWORD   BaseOfData;

    //
    // NT additional fields.
    //

    DWORD   ImageBase;
    DWORD   SectionAlignment;
    DWORD   FileAlignment;
    WORD    MajorOperatingSystemVersion;
    WORD    MinorOperatingSystemVersion;
    WORD    MajorImageVersion;
    WORD    MinorImageVersion;
    WORD    MajorSubsystemVersion;
    WORD    MinorSubsystemVersion;
    DWORD   Win32VersionValue;
    DWORD   SizeOfImage;
    DWORD   SizeOfHeaders;
    DWORD   CheckSum;
    WORD    Subsystem;
    WORD    DllCharacteristics;
    DWORD   SizeOfStackReserve;
    DWORD   SizeOfStackCommit;
    DWORD   SizeOfHeapReserve;
    DWORD   SizeOfHeapCommit;
    DWORD   LoaderFlags;
    DWORD   NumberOfRvaAndSizes;
    IMAGE_DATA_DIRECTORY DataDirectory[IMAGE_NUMBEROF_DIRECTORY_ENTRIES];
} IMAGE_OPTIONAL_HEADER32, *PIMAGE_OPTIONAL_HEADER32;



//
// Section header format.
//

#define IMAGE_SIZEOF_SHORT_NAME              8

typedef struct _IMAGE_SECTION_HEADER {
    BYTE    Name[IMAGE_SIZEOF_SHORT_NAME];
    union {
            DWORD   PhysicalAddress;
            DWORD   VirtualSize;
    } Misc;
    DWORD   VirtualAddress;
    DWORD   SizeOfRawData;
    DWORD   PointerToRawData;
    DWORD   PointerToRelocations;
    DWORD   PointerToLinenumbers;
    WORD    NumberOfRelocations;
    WORD    NumberOfLinenumbers;
    DWORD   Characteristics;
} IMAGE_SECTION_HEADER, *PIMAGE_SECTION_HEADER;
```


```shell
Microsoft (R) COFF/PE Dumper Version 14.42.34436.0
Copyright (C) Microsoft Corporation.  All rights reserved.


Dump of file .\SimpleSection.obj

File Type: COFF OBJECT

FILE HEADER VALUES
            8664 machine (x64)
               8 number of sections
        67B6EE8C time date stamp Thu Feb 20 16:57:48 2025
             322 file pointer to symbol table
              21 number of symbols
               0 size of optional header
               0 characteristics

SECTION HEADER #1
.drectve name
       0 physical address
       0 virtual address
      18 size of raw data
     154 file pointer to raw data (00000154 to 0000016B)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
  100A00 flags
         Info
         Remove
         1 byte align

RAW DATA #1
  00000000: 20 20 20 2F 44 45 46 41 55 4C 54 4C 49 42 3A 22     /DEFAULTLIB:"
  00000010: 4C 49 42 43 4D 54 22 20                          LIBCMT" 

   Linker Directives
   -----------------
   /DEFAULTLIB:LIBCMT

SECTION HEADER #2
.debug$S name
       0 physical address
       0 virtual address
      70 size of raw data
     16C file pointer to raw data (0000016C to 000001DB)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
42100040 flags
         Initialized Data
         Discardable
         1 byte align
         Read Only

RAW DATA #2
  00000000: 04 00 00 00 F1 00 00 00 62 00 00 00 24 00 01 11  ....?..b...$...
  00000010: 00 00 00 00 45 3A 5C 50 72 6F 6A 65 63 74 73 5C  ....E:\Projects\
  00000020: 53 69 6D 70 6C 65 53 65 63 74 69 6F 6E 2E 6F 62  SimpleSection.ob
  00000030: 6A 00 3A 00 3C 11 00 62 00 00 D0 00 13 00 2A 00  j.:.<..b..?..*.
  00000040: 84 86 00 00 13 00 2A 00 84 86 00 00 4D 69 63 72  ......*.....Micr
  00000050: 6F 73 6F 66 74 20 28 52 29 20 4F 70 74 69 6D 69  osoft (R) Optimi
  00000060: 7A 69 6E 67 20 43 6F 6D 70 69 6C 65 72 00 00 00  zing Compiler...

SECTION HEADER #3
   .data name
       0 physical address
       0 virtual address
       C size of raw data
     1DC file pointer to raw data (000001DC to 000001E7)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
C0300040 flags
         Initialized Data
         4 byte align
         Read Write

RAW DATA #3
  00000000: 54 00 00 00 25 64 0A 00 55 00 00 00              T...%d..U...

SECTION HEADER #4
.text$mn name
       0 physical address
       0 virtual address
      64 size of raw data
     1E8 file pointer to raw data (000001E8 to 0000024B)
     24C file pointer to relocation table
       0 file pointer to line numbers
       5 number of relocations
       0 number of line numbers
60500020 flags
         Code
         16 byte align
         Execute Read

RAW DATA #4
  00000000: 89 4C 24 08 48 83 EC 28 8B 54 24 30 48 8D 0D 00  .L$.H.?.T$0H...
  00000010: 00 00 00 E8 00 00 00 00 90 48 83 C4 28 C3 CC CC  ...?....H.?锰?
  00000020: CC CC CC CC CC CC CC CC CC CC CC CC CC CC CC CC  烫烫烫烫烫烫烫烫
  00000030: 48 83 EC 38 C7 44 24 20 01 00 00 00 8B 05 00 00  H.?荄$ ........
  00000040: 00 00 8B 0D 00 00 00 00 03 C8 8B C1 03 44 24 20  .........??D$ 
  00000050: 03 44 24 24 8B C8 E8 00 00 00 00 8B 44 24 20 48  .D$$.辱.....D$ H
  00000060: 83 C4 38 C3                                      .??

RELOCATIONS #4
                                                Symbol    Symbol
 Offset    Type              Applied To         Index     Name
 --------  ----------------  -----------------  --------  ------
 0000000F  REL32                      00000000        1A  $SG7562
 00000014  REL32                      00000000         D  printf
 0000003E  REL32                      00000000        1E  ?static_var2@?1??main@@9@9 (`main'::`2'::static_var2)
 00000044  REL32                      00000000        1B  ?static_var@?1??main@@9@9 (`main'::`2'::static_var)
 00000057  REL32                      00000000         E  func1

SECTION HEADER #5
  .xdata name
       0 physical address
       0 virtual address
      10 size of raw data
     27E file pointer to raw data (0000027E to 0000028D)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
40300040 flags
         Initialized Data
         4 byte align
         Read Only

RAW DATA #5
  00000000: 01 08 01 00 08 42 00 00 01 04 01 00 04 62 00 00  .....B.......b..

SECTION HEADER #6
  .pdata name
       0 physical address
       0 virtual address
      18 size of raw data
     28E file pointer to raw data (0000028E to 000002A5)
     2A6 file pointer to relocation table
       0 file pointer to line numbers
       6 number of relocations
       0 number of line numbers
40300040 flags
         Initialized Data
         4 byte align
         Read Only

RAW DATA #6
  00000000: 00 00 00 00 1E 00 00 00 00 00 00 00 00 00 00 00  ................
  00000010: 34 00 00 00 00 00 00 00                          4.......

Function Table #6 (2)

           Begin     End       Info

  00000000 00000000  0000001E  00000000
  0000000C 00000000  00000034  00000000

RELOCATIONS #6
                                                Symbol    Symbol
 Offset    Type              Applied To         Index     Name
 --------  ----------------  -----------------  --------  ------
 00000000  ADDR32NB                   00000000        10  $LN3
 00000004  ADDR32NB                   0000001E        10  $LN3
 00000008  ADDR32NB                   00000000        14  $unwind$func1
 0000000C  ADDR32NB                   00000000        11  $LN3
 00000010  ADDR32NB                   00000034        11  $LN3
 00000014  ADDR32NB                   00000000        18  $unwind$main

SECTION HEADER #7
    .bss name
       0 physical address
       0 virtual address
       4 size of raw data
       0 file pointer to raw data
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
C0300080 flags
         Uninitialized Data
         4 byte align
         Read Write

SECTION HEADER #8
 .chks64 name
       0 physical address
       0 virtual address
      40 size of raw data
     2E2 file pointer to raw data (000002E2 to 00000321)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
     A00 flags
         Info
         Remove
         (no align specified)

RAW DATA #8
  00000000: 27 88 7E BB A5 BD F8 78 1B 7B AB 80 02 43 07 03  '.~互进x.{?.C..
  00000010: 54 E7 F0 7A A1 2E 3E 48 87 8C 1A 2F D9 BA 52 4D  T琊z?>H.../俸RM
  00000020: D7 CF 0B E0 EB F3 AE B8 26 BC 66 0F E2 F9 78 5D  紫.嚯螽?糵.怡x]
  00000030: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................

COFF SYMBOL TABLE
000 01048684 ABS    notype       Static       | @comp.id
001 80010190 ABS    notype       Static       | @feat.00
002 00000003 ABS    notype       Static       | @vol.md
003 00000000 SECT1  notype       Static       | .drectve
    Section length   18, #relocs    0, #linenums    0, checksum        0
005 00000000 SECT2  notype       Static       | .debug$S
    Section length   70, #relocs    0, #linenums    0, checksum        0
007 00000000 SECT3  notype       Static       | .data
    Section length    C, #relocs    0, #linenums    0, checksum AC5AB941
009 00000000 SECT3  notype       External     | global_init_var
00A 00000004 UNDEF  notype       External     | global_uninit_var
00B 00000000 SECT4  notype       Static       | .text$mn
    Section length   64, #relocs    5, #linenums    0, checksum B955F775
00D 00000000 UNDEF  notype ()    External     | printf
00E 00000000 SECT4  notype ()    External     | func1
00F 00000030 SECT4  notype ()    External     | main
010 00000000 SECT4  notype       Label        | $LN3
011 00000030 SECT4  notype       Label        | $LN3
012 00000000 SECT5  notype       Static       | .xdata
    Section length   10, #relocs    0, #linenums    0, checksum 434E1581
014 00000000 SECT5  notype       Static       | $unwind$func1
015 00000000 SECT6  notype       Static       | .pdata
    Section length   18, #relocs    6, #linenums    0, checksum F8B9BDC5
017 00000000 SECT6  notype       Static       | $pdata$func1
018 00000008 SECT5  notype       Static       | $unwind$main
019 0000000C SECT6  notype       Static       | $pdata$main
01A 00000004 SECT3  notype       Static       | $SG7562
01B 00000008 SECT3  notype       Static       | ?static_var@?1??main@@9@9 (`main'::`2'::static_var)
01C 00000000 SECT7  notype       Static       | .bss
    Section length    4, #relocs    0, #linenums    0, checksum        0
01E 00000000 SECT7  notype       Static       | ?static_var2@?1??main@@9@9 (`main'::`2'::static_var2)
01F 00000000 SECT8  notype       Static       | .chks64
    Section length   40, #relocs    0, #linenums    0, checksum        0

String Table Size = 0x8F bytes

  Summary

           4 .bss
          40 .chks64
           C .data
          70 .debug$S
          18 .drectve
          18 .pdata
          64 .text$mn
          10 .xdata
```

#### 5.3 链接指示信息

```shell
SECTION HEADER #1
.drectve name
       0 physical address
       0 virtual address
      18 size of raw data
     154 file pointer to raw data (00000154 to 0000016B)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
  100A00 flags
         Info
         Remove
         1 byte align

RAW DATA #1
  00000000: 20 20 20 2F 44 45 46 41 55 4C 54 4C 49 42 3A 22     /DEFAULTLIB:"
  00000010: 4C 49 42 43 4D 54 22 20                          LIBCMT" 

   Linker Directives
   -----------------
   /DEFAULTLIB:LIBCMT
```

#### 5.4 调试信息

```shell
SECTION HEADER #2
.debug$S name
       0 physical address
       0 virtual address
      70 size of raw data
     16C file pointer to raw data (0000016C to 000001DB)
       0 file pointer to relocation table
       0 file pointer to line numbers
       0 number of relocations
       0 number of line numbers
42100040 flags
         Initialized Data
         Discardable
         1 byte align
         Read Only

RAW DATA #2
  00000000: 04 00 00 00 F1 00 00 00 62 00 00 00 24 00 01 11  ....?..b...$...
  00000010: 00 00 00 00 45 3A 5C 50 72 6F 6A 65 63 74 73 5C  ....E:\Projects\
  00000020: 53 69 6D 70 6C 65 53 65 63 74 69 6F 6E 2E 6F 62  SimpleSection.ob
  00000030: 6A 00 3A 00 3C 11 00 62 00 00 D0 00 13 00 2A 00  j.:.<..b..?..*.
  00000040: 84 86 00 00 13 00 2A 00 84 86 00 00 4D 69 63 72  ......*.....Micr
  00000050: 6F 73 6F 66 74 20 28 52 29 20 4F 70 74 69 6D 69  osoft (R) Optimi
  00000060: 7A 69 6E 67 20 43 6F 6D 70 69 6C 65 72 00 00 00  zing Compiler...
```

.debug$S表示包含的是符号（Symbol）相关的调试信息段；
.debug$P表示包含预编译头文件（Precompiled Header Files）相关的调试信息段；
.debug$T表示包含类型（Type）相关的调试信息段。

在“SimpleSection.obj”中，我们只看到了“.debug$S”段，也就是只有调试时的相关信息。我们可以从该段的文本信息中看到目标文件的原始路径，编译器信息等。

#### 5.5 大家都有符号表

```shell
COFF SYMBOL TABLE
000 01048684 ABS    notype       Static       | @comp.id
001 80010190 ABS    notype       Static       | @feat.00
002 00000003 ABS    notype       Static       | @vol.md
003 00000000 SECT1  notype       Static       | .drectve
    Section length   18, #relocs    0, #linenums    0, checksum        0
005 00000000 SECT2  notype       Static       | .debug$S
    Section length   70, #relocs    0, #linenums    0, checksum        0
007 00000000 SECT3  notype       Static       | .data
    Section length    C, #relocs    0, #linenums    0, checksum AC5AB941
009 00000000 SECT3  notype       External     | global_init_var
00A 00000004 UNDEF  notype       External     | global_uninit_var
00B 00000000 SECT4  notype       Static       | .text$mn
    Section length   64, #relocs    5, #linenums    0, checksum B955F775
00D 00000000 UNDEF  notype ()    External     | printf
00E 00000000 SECT4  notype ()    External     | func1
00F 00000030 SECT4  notype ()    External     | main
010 00000000 SECT4  notype       Label        | $LN3
011 00000030 SECT4  notype       Label        | $LN3
012 00000000 SECT5  notype       Static       | .xdata
    Section length   10, #relocs    0, #linenums    0, checksum 434E1581
014 00000000 SECT5  notype       Static       | $unwind$func1
015 00000000 SECT6  notype       Static       | .pdata
    Section length   18, #relocs    6, #linenums    0, checksum F8B9BDC5
017 00000000 SECT6  notype       Static       | $pdata$func1
018 00000008 SECT5  notype       Static       | $unwind$main
019 0000000C SECT6  notype       Static       | $pdata$main
01A 00000004 SECT3  notype       Static       | $SG7562
01B 00000008 SECT3  notype       Static       | ?static_var@?1??main@@9@9 (`main'::`2'::static_var)
01C 00000000 SECT7  notype       Static       | .bss
    Section length    4, #relocs    0, #linenums    0, checksum        0
01E 00000000 SECT7  notype       Static       | ?static_var2@?1??main@@9@9 (`main'::`2'::static_var2)
01F 00000000 SECT8  notype       Static       | .chks64
    Section length   40, #relocs    0, #linenums    0, checksum        0
```

#### 5.6 Windows下的ELF——PE

“IMAGE_DOS_HEADER”结构也被定义在WinNT.h里面，该结构的大多数成员我们都不关心，唯一值得关心的是“e_lfanew”成员，这个成员表明了PE文件头（IMAGE_NT_HEADERS）在PE文件中的偏移，我们须要使用这个值来定位PE文件头。这个成员在DOS的“MZ”文件格式中它的值永远为0，所以当Windows开始执行一个后缀名为“.exe”的文件时，它会判断“e_lfanew”成员是否为0。如果为0，则该“.exe”文件是一个DOS“MZ”可执行文件，Windows会启动DOS子系统来执行它；如果不为0，那么它就是一个Windows的PE可执行文件，“e_lfanew”的值表示“IMAGE_NT_HEADERS”在文件中的偏移。

#### 5.7 本章小结

## 第3部分 装载与动态链接

### 第6章 可执行文件的装载与进程

介绍进程的概念、进程地址空间的分布和可执行文件映射装载过程。

#### 6.1 进程虚拟地址空间

我们知道每个程序被运行起来以后，它将拥有自己独立的虚拟地址空间（Virtual Address Space），这个虚拟地址空间的大小由计算机的硬件平台决定，具体地说是由CPU的位数决定的。

硬件决定了地址空间的最大理论上限，即硬件的寻址空间大小。
- 32位的硬件平台决定了虚拟地址空间的地址为 0 到 2^32-1，即0x00000000～0xFFFFFFFF，也就是我们常说的4 GB虚拟空间大小
- 64位的硬件平台具有64位寻址能力，它的虚拟地址空间达到了264字节，即0x0000000000000000～0xFFFFFFFFFFFFFFFF，总共17 179 869 184 GB

32位的CPU下，程序使用的空间能不能超过4 GB呢？这个问题其实应该从两个角度来看，首先，问题里面的“空间”如果是指虚拟地址空间，那么答案是“否”。因为32位的CPU只能使用32位的指针，它最大的寻址范围是0 到4 GB；如果问题里面的“空间”指计算机的内存空间，那么答案为“是”。Intel自从1995年的Pentium Pro CPU开始采用了36位的物理地址，也就是可以访问高达64 GB的物理内存。

从硬件层面上来讲，原先的32位地址线只能访问最多4 GB的物理内存。但是自从扩展至36位地址线之后，Intel修改了页映射的方式，使得新的映射方式可以访问到更多的物理内存。Intel 把这个地址扩展方式叫做PAE（Physical Address Extension）。

#### 6.2 装载的方式

程序运行时是有局部性原理的，所以我们可以将程序最常用的部分驻留在内存中，而将一些不太常用的数据存放在磁盘里面，这就是动态装入的基本原理。

覆盖装入（Overlay）和页映射（Paging）是两种很典型的动态装载方法，它们所采用的思想都差不多，原则上都是利用了程序的局部性原理。动态装入的思想是程序用到哪个模块，就将哪个模块装入内存，如果不用就暂时不装入，存放在磁盘中。

页映射是虚拟存储机制的一部分，它随着虚拟存储的发明而诞生。

页映射是将内存和所有磁盘中的数据和指令按照“页（Page）”为单位划分成若干个页，以后所有的装载和操作的单位就是页。

6.2.1 覆盖装入

6.2.2 页映射

#### 6.3 从操作系统角度看可执行文件的装载

本节我们将站在操作系统的角度来阐述一个可执行文件如何被装载，并且同时在进程中执行。

6.3.1 进程的建立

从操作系统的角度来看，一个进程最关键的特征是它拥有独立的虚拟地址空间，这使得它有别于其他进程。

在有虚拟存储的情况下，上述过程最开始只需要做三件事情：
- 创建一个独立的虚拟地址空间。
  - 创建一个虚拟空间实际上并不是创建空间而是创建映射函数所需要的相应的数据结构。
  - 页映射关系函数是虚拟空间到物理内存的映射关系。
- 读取可执行文件头，并且建立虚拟空间与可执行文件的映射关系。
  - 虚拟空间与可执行文件的映射关系。
  - 从某种角度来看，这一步是整个装载过程中最重要的一步，也是传统意义上“装载”的过程。
  - 这种映射关系只是保存在操作系统内部的一个数据结构
  - 在Linux中将进程虚拟空间中的一个段叫做虚拟内存区域（VMA, Virtual Memory Area）。
  - 在Windows中将这个叫做虚拟段（Virtual Section），其实它们都是同一个概念。
- 将CPU的指令寄存器设置成可执行文件的入口地址，启动运行。
  - 操作系统通过设置CPU的指令寄存器将控制权转交给进程，由此进程开始执行。
  - 这一步看似简单，实际上在操作系统层面上比较复杂，它涉及内核堆栈和用户堆栈的切换、CPU运行权限的切换。
  - 不过从进程的角度看这一步可以简单地认为操作系统执行了一条跳转指令，直接跳转到可执行文件的入口地址。还记得ELF文件头中保存有入口地址吗？没错，就是这个地址。

6.3.2 页错误

上面的步骤执行完以后，其实可执行文件的真正指令和数据都没有被装入到内存中。操作系统只是通过可执行文件头部的信息建立起可执行文件和进程虚存之间的映射关系而已。

当CPU开始打算执行这个地址的指令时，发现页面0x08048000～0x08049000是个空页面，于是它就认为这是一个页错误（Page Fault）。CPU将控制权交给操作系统，操作系统有专门的页错误处理例程来处理这种情况。

这时候我们前面提到的装载过程的第二步建立的数据结构起到了很关键的作用，操作系统将查询这个数据结构，然后找到空页面所在的VMA，计算出相应的页面在可执行文件中的偏移，然后在物理内存中分配一个物理页面，将进程中该虚拟页与分配的物理页之间建立映射关系，然后把控制权再还回给进程，进程从刚才页错误的位置重新开始执行。

#### 6.4 进程虚存空间分布

6.4.1 ELF文件链接视图和执行视图

ELF文件中，段的权限往往只有为数不多的几种组合，基本上是三种：
- 以代码段为代表的权限为可读可执行的段。
- 以数据段和BSS段为代表的权限为可读可写的段。
- 以只读数据段为代表的权限为只读的段。

ELF可执行文件引入了一个概念叫做“Segment”，一个“Segment”包含一个或多个属性类似的“Section”。

“Segment”的概念实际上是从装载的角度重新划分了ELF的各个段。在将目标文件链接成可执行文件的时候，链接器会尽量把相同权限属性的段分配在同一空间。

6.4.2 堆和栈

栈一般也叫做堆栈，我们知道每个线程都有属于自己的堆栈，对于单线程的程序来讲，这个VMA堆栈就全都归它使用。


我们小结关于进程虚拟地址空间的概念：
- 操作系统通过给进程空间划分出一个个VMA来管理进程的虚拟空间；
- 基本原则是将相同权限属性的、有相同映像文件的映射成一个VMA；

一个进程基本上可以分为如下几种VMA区域：
- 代码VMA，权限只读、可执行；有映像文件。
- 数据VMA，权限可读写、可执行；有映像文件。
- 堆VMA，权限可读写、可执行；无映像文件，匿名，可向上扩展。
- 栈VMA，权限可读写、不可执行；无映像文件，匿名，可向下扩展。

6.4.3 堆的最大申请数量

那么malloc的最大申请数量会受到哪些因素的影响呢？实际上，具体的数值会受到操作系统版本、程序本身大小、用到的动态/共享库数量、大小、程序栈数量、大小等，甚至有可能每次运行的结果都会不同，因为有些操作系统使用了一种叫做随机地址空间分布的技术（主要是出于安全考虑，防止程序受恶意攻击），使得进程的堆空间变小。

6.4.4 段地址对齐

6.4.5 进程栈初始化

#### 6.5 Linux内核装载ELF过程简介

每种可执行文件的格式的开头几个字节都是很特殊的，特别是开头4个字节，常常被称做魔数（Magic Number），通过对魔数的判断可以确定文件的格式和类型。

https://github.com/torvalds/linux/blob/master/fs/binfmt_elf.c

这里我们只关心ELF可执行文件的装载，load_elf_binary()被定义在fs/Binfmt_elf.c，这个函数的代码比较长，它的主要步骤是：
- （1）检查ELF可执行文件格式的有效性，比如魔数、程序头表中段（Segment）的数量。
- （2）寻找动态链接的“.interp”段，设置动态链接器路径（与动态链接有关，具体请参考第9章）。
- （3）根据ELF可执行文件的程序头表的描述，对ELF文件进行映射，比如代码、数据、只读数据。
- （4）初始化ELF进程环境，比如进程启动时EDX寄存器的地址应该是DT_FINI的地址（参照动态链接）。
- （5）将系统调用的返回地址修改成ELF可执行文件的入口点，这个入口点取决于程序的链接方式，对于静态链接的ELF可执行文件，这个程序入口就是ELF文件的文件头中e_entry所指的地址；对于动态链接的ELF可执行文件，程序入口点是动态链接器。

#### 6.6 Windows PE的装载

#### 6.7 本章小结

### 第7章 动态链接

以Linux下的.so共享库为基础详细分析了动态链接的过程。

#### 7.1 为什么要动态链接

静态链接的诸多缺点也逐步暴露出来，比如浪费内存和磁盘空间、模块更新困难等问题，使得人们不得不寻找一种更好的方式来组织程序的模块。

- 内存和磁盘空间
- 程序开发和发布
- 动态链接
  - 把链接这个过程推迟到了运行时再进行，这就是动态链接（Dynamic Linking）的基本思想。
- 程序可扩展性和兼容性
  - 动态链接也有诸多的问题及令人烦恼和费解的地方。
    - 很常见的一个问题是，当程序所依赖的某个模块更新后，由于新的模块与旧的模块之间接口不兼容，导致了原有的程序无法运行。
- 动态链接的基本实现
  - 动态链接的基本思想是把程序按照模块拆分成各个相对独立部分。
  - 在Linux系统中，ELF动态链接文件被称为动态共享对象（DSO，Dynamic Shared Objects），简称共享对象，它们一般都是以“.so”为扩展名的一些文件；
  - 在Windows系统中，动态链接文件被称为动态链接库（Dynamical Linking Library），它们通常就是我们平时很常见的以“.dll”为扩展名的文件。
  - 从本质上讲，普通可执行程序和动态链接库中都包含指令和数据，这一点没有区别。
  - 当程序被装载的时候，系统的动态链接器会将程序所需要的所有动态链接库（最基本的就是libc.so）装载到进程的地址空间，并且将程序中所有未决议的符号绑定到相应的动态链接库中，并进行重定位工作。
  
#### 7.2 简单的动态链接例子

关于模块（Module）

动态链接程序运行时地址空间分布

#### 7.3 地址无关代码

7.3.1 固定装载地址的困扰

7.3.2 装载时重定位

静态链接中的重定位，这个想法的基本思路就是，在链接时，对所有绝对地址的引用不作重定位，而把这一步推迟到装载时再完成。一旦模块装载地址确定，即目标地址确定，那么系统就对程序中所有的绝对地址引用进行重定位。

我们前面在静态链接时提到过重定位，那时的重定位叫做链接时重定位（Link Time Relocation），而现在这种情况经常被称为装载时重定位（Load Time Relocation），在Windows中，这种装载时重定位又被叫做基址重置（Rebasing）。

装载时重定位的方法并不适合用来解决上面的共享对象中所存在的问题。

- 指令部分：动态链接模块被装载映射至虚拟空间后，指令部分是在多个进程之间共享的，由于装载时重定位的方法需要修改指令，所以没有办法做到同一份指令被多个进程共享，因为指令被重定位后对于每个进程来讲是不同的。
- 数据部分：动态连接库中的可修改数据部分对于不同的进程来说有多个副本，所以它们可以采用装载时重定位的方法来解决。

7.3.3 地址无关代码

装载时重定位是解决动态模块中有绝对地址引用的办法之一，但是它有一个很大的缺点是指令部分无法在多个进程之间共享，这样就失去了动态链接节省内存的一大优势。

我们还需要有一种更好的方法解决共享对象指令中对绝对地址的重定位问题。

我们的目的很简单，希望程序模块中共享的指令部分在装载时不需要因为装载地址的改变而改变，所以实现的基本想法就是把指令中那些需要被修改的部分分离出来，跟数据部分放在一起，这样指令部分就可以保持不变，而数据部分可以在每个进程中拥有一个副本。这种方案就是目前被称为地址无关代码（PIC, Position-independent Code）的技术。

这里我们把共享对象模块中的地址引用按照是否为跨模块分成两类：模块内部引用和模块外部引用；按照不同的引用方式又可以分为指令引用和数据访问。
- 第一种是模块内部的函数调用、跳转等。
- 第二种是模块内部的数据访问，比如模块中定义的全局变量、静态变量。
- 第三种是模块外部的函数调用、跳转等。
  - ELF的做法是在数据段里面建立一个指向这些变量的指针数组，也被称为全局偏移表（Global Offset Table，GOT），当代码需要引用该全局变量时，可以通过GOT中相对应的项间接引用。
- 第四种是模块外部的数据访问，比如其他模块中定义的全局变量。

7.3.4 共享模块的全局变量问题

7.3.5 数据段地址无关性

#### 7.4 延迟绑定（PLT）

延迟绑定实现

#### 7.5 动态链接相关结构

7.5.1 “.interp”段

7.5.2 “.dynamic”段

7.5.3 动态符号表

为了表示动态链接这些模块之间的符号导入导出关系，ELF专门有一个叫做动态符号表（Dynamic Symbol Table）的段用来保存这些信息，这个段的段名通常叫做“.dynsym”（Dynamic Symbol）。

7.5.4 动态链接重定位表

对于使用PIC技术的可执行文件或共享对象来说，虽然它们的代码段不需要重定位（因为地址无关），但是数据段还包含了绝对地址的引用，因为代码段中绝对地址相关的部分被分离了出来，变成了GOT，而GOT实际上是数据段的一部分。

在静态链接中，目标文件里面包含有专门用于表示重定位信息的重定位表，比如“.rel.text”表示是代码段的重定位表，“.rel.data”是数据段的重定位表。

在动态链接中，也有类似的重定位表分别叫做“.rel.dyn”和“.rel.plt”，它们分别相当于 “.rel.text”和“.rel.data”。

“.rel.dyn”实际上是对数据引用的修正，它所修正的位置位于“.got”以及数据段；而“.rel.plt”是对函数引用的修正，它所修正的位置位于“.got.plt”。

7.5.5 动态链接时进程堆栈初始化信息

#### 7.6 动态链接的步骤和实现

动态链接的步骤基本上分为3步：先是启动动态链接器本身，然后装载所有需要的共享对象，最后是重定位和初始化。

7.6.1 动态链接器自举

首先是，动态链接器本身不可以依赖于其他任何共享对象；其次是动态链接器本身所需要的全局和静态变量的重定位工作由它本身完成。对于第一个条件我们可以人为地控制，在编写动态链接器时保证不使用任何系统库、运行库；对于第二个条件，动态链接器必须在启动时有一段非常精巧的代码可以完成这项艰巨的工作而同时又不能用到全局和静态变量。这种具有一定限制条件的启动代码往往被称为自举（Bootstrap）。

7.6.2 装载共享对象

完成基本自举以后，动态链接器将可执行文件和链接器本身的符号表都合并到一个符号表当中，我们可以称它为全局符号表（Global Symbol Table）。

这种一个共享对象里面的全局符号被另一个共享对象的同名全局符号覆盖的现象又被称为共享对象全局符号介入（Global Symbol Interpose）。

关于全局符号介入这个问题，实际上Linux下的动态链接器是这样处理的：它定义了一个规则，那就是当一个符号需要被加入全局符号表时，如果相同的符号名已经存在，则后加入的符号被忽略。

7.6.3 重定位和初始化

7.6.4 Linux动态链接器实现

#### 7.7 显式运行时链接

支持动态链接的系统往往都支持一种更加灵活的模块加载方式，叫做显式运行时链接（Explicit Run-time Linking），有时候也叫做运行时加载。

一般的共享对象不需要进行任何修改就可以进行运行时装载，这种共享对象往往被叫做动态装载库（Dynamic Loading Library），其实本质上它跟一般的共享对象没什么区别，只是程序开发者使用它的角度不同。

在Linux中，从文件本身的格式上来看，动态库实际上跟一般的共享对象没有区别，正如我们前面讨论过的。主要的区别是共享对象是由动态链接器在程序启动之前负责装载和链接的，这一系列步骤都由动态连接器自动完成，对于程序本身是透明的；而动态库的装载则是通过一系列由动态链接器提供的API，具体地讲共有4个函数：打开动态库（dlopen）、查找符号（dlsym）、错误处理（dlerror）以及关闭动态库（dlclose），程序可以通过这几个API对动态库进行操作。

7.7.1 dlopen()

7.7.2 dlsym()

当多个同名符号冲突时，先装入的符号优先，我们把这种优先级方式称为装载序列（Load Ordering）。

7.7.3 dlerror()

7.7.4 dlclose()

7.7.5 运行时装载的演示程序

#### 7.8 本章小结

### 第8章 Linux共享库的组织

介绍Linux下共享库文件的分布和组织。

#### 8.1 共享库版本

8.1.1 共享库兼容性

最简单的情况下，共享库的更新可以被分为两类。
- 兼容更新。所有的更新只是在原有的共享库基础上添加一些内容，所有原有的接口都保持不变。
- 不兼容更新。共享库更新改变了原有的接口，使用该共享库原有接口的程序可能不能运行或运行不正常。

二进制接口，即ABI（Application Binary Interface）。

导致C语言的共享库ABI改变的行为主要有如下4个：
- 导出函数的行为发生改变，也就是说调用这个函数以后产生的结果与以前不一样，不再满足旧版本规定的函数行为准则。
- 导出函数被删除。
- 导出数据的结构发生变化。
- 导出函数的接口发生变化，如函数返回值、参数被更改。
  
如果能够保证上述4种情况不发生，那么绝大部分情况下，C语言的共享库将会保持ABI兼容。

对于Linux来说，如果你要开发一个导出接口为C++的共享库（当然我十分不推荐这么做，使用C的接口会让事情变得简单得多），需要注意以下事项，以防止ABI不兼容（完全遵循以下准则还是不能保证ABI完全兼容）：
- 不要在接口类中使用虚函数，万不得已要使用虚函数时，不要随意删除、添加或在子类中添加新的实现函数，这样会导致类的虚函数表结构发生变化。
- 不要改变类中任何成员变量的位置和类型。
- 不要删除非内嵌的public或protected成员函数。
- 不要将非内嵌的成员函数改变成内嵌成员函数。
- 不要改变成员函数的访问权限。
- 不要在接口中使用模板。
- 最重要的是，不要改变接口的任何部分或干脆不要使用C++作为共享库接口！

8.1.2 共享库版本命名

Linux有一套规则来命名系统中的每一个共享库，它规定共享库的文件名规则必须如下：
- libname.so.x.y.z

8.1.3 SO-NAME

#### 8.2 符号版本

8.2.2 Solaris中的符号版本机制

#### 8.3 共享库系统路径

FHS规定，一个系统中主要有两个存放共享库的位置，它们分别如下：
- /lib，这个位置主要存放系统最关键和基础的共享库，比如动态链接器、C语言运行库、数学库等，这些库主要是那些/bin和/sbin下的程序所需要用到的库，还有系统启动时需要的库。
- /usr/lib，这个目录下主要保存的是一些非系统运行时所需要的关键性的共享库，主要是一些开发时用到的共享库，这些共享库一般不会被用户的程序或shell脚本直接用到。这个目录下面还包含了开发时可能会用到的静态库、目标文件等。
- /usr/local/lib，这个目录用来放置一些跟操作系统本身并不十分相关的库，主要是一些第三方的应用程序的库。比如我们在系统中安装了python语言的解释器，那么与它相关的共享库可能会被放到/usr/local/lib/python，而它的可执行文件可能被放到/usr/local/bin下。GNU的标准推荐第三方的程序应该默认将库安装到/usr/local/lib下。

所以总体来看，/lib和/usr/lib是一些很常用的、成熟的，一般是系统本身所需要的库；而/usr/local/lib是非系统所需的第三方程序的共享库。

#### 8.4 共享库查找过程

#### 8.5 环境变量

#### 8.6 共享库的创建和安装

#### 8.7 本章小结

### 第9章 Windows下的动态链接

介绍Windows系统下DLL动态链接机制。

#### 9.1 DLL 简介

DLL即动态链接库（Dynamic-Link Library）的缩写，它相当于Linux下的共享对象。

9.1.1 进程地址空间和内存管理

9.1.2 基地址和RVA

PE里面有两个很常用的概念就是基地址（Base Address）和相对地址（RVA，Relative Virtual Address）。

9.1.3 DLL共享数据段

9.1.4 DLL的简单例子

9.1.5 创建DLL

9.1.6 使用DLL

程序使用DLL的过程其实是引用DLL中的导出函数和符号的过程，即导入过程。

9.1.7 使用模块定义文件

除了C++程序以外，C语言的符号也有可能被修饰，比如MSVC支持几种函数的调用规范“__cdecl”、“__stdcall”、“__fastcall”（我们在本书的第4章还会详细介绍各种函数调用规范之间的区别），默认情况下MSVC把C语言的函数当作“_cdecl”类型，这种情况下它对该函数不进行任何符号修饰。

9.1.8 DLL显式运行时链接

与ELF类似，DLL也支持运行时链接，即运行时加载。Windows提供了3个API为：
- LoadLibrary（或者LoadLibraryEx），这个函数用来装载一个DLL到进程的地址空间，它的功能跟dlopen类似。
- GetProcAddress，用来查找某个符号的地址，与dlsym类似。
- FreeLibrary，用来卸载某个已加载的模块，与dlclose类似。

#### 9.2 符号导出导入表

9.2.1 导出表

当一个PE需要将一些函数或变量提供给其他PE文件使用时，我们把这种行为叫做符号导出（Symbol Exporting），最典型的情况就是一个DLL将符号导出给EXE文件使用。

9.2.2 EXP文件

9.2.3 导出重定向

9.2.4 导入表

如果我们在某个程序中使用到了来自DLL的函数或者变量，那么我们就把这种行为叫做符号导入（Symbol Importing）。

在ELF中,“.rel.dyn”和“.rel.plt”两个段中分别保存了该模块所需要导入的变量和函数的符号以及所在的模块等信息，而“.got”和“.got.plt”则保存着这些变量和函数的真正地址。
在Windows中也有类似的机制，它的名称更为直接，叫做导入表（Import Table）。

9.2.5 导入函数的调用

#### 9.3 DLL优化

9.3.1 重定基地址（Rebasing）

PE的DLL中的代码段并不是地址无关的，也就是说它在被装载时有一个固定的目标地址，这个地址也就是PE里面所谓的基地址（Base Address）。

默认情况下，PE文件将被装载到这个基地址。一般来说，EXE文件的基地址默认为0x00400000，而DLL文件基地址默认为0x10000000。

DLL中所有涉及到绝对地址的引用该怎么办呢？答案是对于每个绝对地址引用都进行重定位。

事实上，由于DLL内部的地址都是基于基地址的，或者是相对于基地址的RVA。

PE里面把这种特殊的重定位过程又被叫做重定基地址（Rebasing）。

PE文件的重定位信息都放在了“.reloc”段，我们可以从PE文件头中的DataDirectory里面得到重定位段的信息。

9.3.2 序号

9.3.3 导入函数绑定

#### 9.4 C++与动态链接

在Windows平台下（有些意见对Linux/ELF也有效），要尽量遵循以下几个指导意见：
- 所有的接口函数都应该是抽象的。所有的方法都应该是纯虚的。（或者inline的方法也可以）。
- 所有的全局函数都应该使用extern“C”来防止名字修饰的不兼容。并且导出函数的都应该是__stdcall调用规范的（COM的DLL都使用这样的规范）。这样即使用户本身的程序是默认以__cdecl方式编译的，对于DLL的调用也能够正确。
- 不要使用C++标准库STL。
- 不要使用异常。
- 不要使用虚析构函数。可以创建一个destroy()方法并且重载delete操作符并且调用destroy()。
- 不要在DLL里面申请内存，而且在DLL外释放（或者相反）。不同的DLL和可执行文件可能使用不同的堆，在一个堆里面申请内存而在另外一个堆里面释放会导致错误。
- 不要在接口中使用重载方法（Overloaded Methods，一个方法多重参数）。因为不同的编译器对于vtable的安排可能不同。

#### 9.5 DLL HELL

#### 9.6 本章小结

## 第4部分 库与运行库

### 第10章 内存

主要介绍堆与栈，堆的分配算法，函数调用栈分布。

#### 10.1 程序的内存布局

栈：栈用于维护函数调用的上下文，离开了栈函数调用就没法实现。在10.2节中将对栈作详细的介绍。栈通常在用户空间的最高地址处分配，通常有数兆字节的大小。

堆：堆是用来容纳应用程序动态分配的内存区域，当程序使用malloc或new分配内存时，得到的内存来自堆里。
堆通常存在于栈的下方（低地址方向），在某些时候，堆也可能没有固定统一的存储区域。堆一般比栈大很多，可以有几十至数百兆字节的容量。

可执行文件映像：这里存储着可执行文件在内存里的映像，在第6章已经提到过，由装载器在装载时将可执行文件的内存读取或映射到这里。

保留区：保留区并不是一个单一的内存区域，而是对内存中受到保护而禁止访问的内存区域的总称，例如，大多数操作系统里，极小的地址通常都是不允许访问的，如NULL。通常C语言将无效指针赋值为0也是出于这个考虑，因为0地址上正常情况下不可能有有效的可访问数据。

栈向低地址增长，堆向高地址增长。

#### 10.2 栈与调用惯例

10.2.1 什么是栈

在经典的计算机科学中，栈被定义为一个特殊的容器，用户可以将数据压入栈中（入栈，push），也可以将已经压入栈中的数据弹出（出栈，pop），但栈这个容器必须遵守一条规则：先入栈的数据后出栈（First In Last Out, FIFO）。

在计算机系统中，栈则是一个具有以上属性的动态内存区域。程序可以将数据压入栈中，也可以将数据从栈顶弹出。压栈操作使得栈增大，而弹出操作使栈减小。

在经典的操作系统里，栈总是向下增长的。在i386下，栈顶由称为esp的寄存器进行定位。压栈的操作使栈顶的地址减小，弹出的操作使栈顶地址增大。

在栈上压入数据会导致esp减小，弹出数据使得esp增大。相反，直接减小esp的值也等效于在栈上开辟空间，直接增大esp的值等效于在栈上回收空间。

最重要的，栈保存了一个函数调用所需要的维护信息，这常常被称为堆栈帧（Stack Frame）或活动记录（Activate Record）。

堆栈帧一般包括如下几方面内容：
- 函数的返回地址和参数。
- 临时变量：包括函数的非静态局部变量以及编译器自动生成的其他临时变量
- 保存的上下文：包括在函数调用前后需要保持不变的寄存器。

在i386中，一个函数的活动记录用ebp和esp这两个寄存器划定范围。
- esp寄存器始终指向栈的顶部，同时也就指向了当前函数的活动记录的顶部。
- ebp寄存器指向了函数活动记录的一个固定位置，ebp寄存器又被称为帧指针（Frame Pointer）。

之所以会出现“烫”这么一个奇怪的字，就是因为Debug模式在第4步里，将所有的分配出来的栈空间的每一个字节都初始化为0xCC。0xCCCC（即两个连续排列的0xCC）的汉字编码就是烫，所以0xCCCC如果被当作文本就是“烫”。

10.2.2 调用惯例

毫无疑问函数的调用方和被调用方对于函数如何调用须要有一个明确的约定，只有双方都遵守同样的约定，函数才能被正确地调用，这样的约定就称为调用惯例（Calling Convention）。一个调用惯例一般会规定如下几个方面的内容。
- 函数参数的传递顺序和方式
- 栈的维护方式
- 名字修饰（Name-mangling）的策略
  - 在C语言里，存在着多个调用惯例，而默认的调用惯例是cdecl。
  - cdecl
  - stdcall
  - fastcall
  - pascal
  - thiscall

10.2.3 函数返回值传递

#### 10.3 堆与内存管理

10.3.1 什么是堆（Heap）

堆是一块巨大的内存空间，常常占据整个虚拟空间的绝大部分。在这片空间里，程序可以请求一块连续内存，并自由地使用，这块内存在程序主动放弃之前都会一直保持有效。

比较好的做法就是程序向操作系统申请一块适当大小的堆空间，然后由程序自己管理这块空间，而具体来讲，管理着堆空间分配的往往是程序的运行库。

10.3.2 Linux进程堆管理

Linux下的进程堆管理稍微有些复杂，因为它提供了两种堆空间分配的方式，即两个系统调用：一个是brk()系统调用，另外一个是mmap()。

10.3.3 Windows进程堆管理

10.3.4 堆分配算法

空闲链表
位图
对象池

#### 10.4 本章小结


### 第11章 运行库

主要介绍运行库的概念、C/C++运行库、Glibc和MSVC CRT、运行库如何实现C++全局构造和析构及以fread()库函数为例对运行库进行剖析。

#### 11.1 入口函数和程序初始化

##### 11.1.1 程序从main开始吗

一个典型的程序运行步骤大致如下：
- 操作系统在创建进程后，把控制权交到了程序的入口，这个入口往往是运行库中的某个入口函数。
- 入口函数对运行库和程序运行环境进行初始化，包括堆、I/O、线程、全局变量构造，等等。
- 入口函数在完成初始化之后，调用main函数，正式开始执行程序主体部分。
- main函数执行完毕以后，返回到入口函数，入口函数进行清理工作，包括全局变量析构、堆销毁、关闭I/O等，然后进行系统调用结束进程。

##### 11.1.2 入口函数如何实现

本节我们将深入剖析glibc和MSVC的入口函数实现。

GLIBC入口函数

在glibc的代码中，它位于csu/libc-start.c文件里。__libc_start_main的定义如下
https://zhuanlan.zhihu.com/p/658734980

```bash
D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\crt\src\vcruntime\exe_main.cpp
```
```c
//
// exe_main.cpp
//
//      Copyright (c) Microsoft Corporation. All rights reserved.
//
// The mainCRTStartup() entry point, linked into client executables that
// uses main().
//
#define _SCRT_STARTUP_MAIN
#include "exe_common.inl"



extern "C" DWORD mainCRTStartup(LPVOID)
{
    return __scrt_common_main();
}

```

```c

D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\crt\src\vcruntime\exe_main.cpp
extern "C" DWORD mainCRTStartup(LPVOID)
{
    return __scrt_common_main();
}

D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\crt\src\vcruntime\exe_common.inl
// This is the common main implementation to which all of the CRT main functions
// delegate (for executables; DLLs are handled separately).
static __forceinline int __cdecl __scrt_common_main()
{
    // The /GS security cookie must be initialized before any exception handling
    // targeting the current image is registered.  No function using exception
    // handling can be called in the current image until after this call:
    __security_init_cookie();

    return __scrt_common_main_seh();
}
```

##### 11.1.3 运行库与I/O

一个程序的I/O指代了程序与外界的交互，包括文件、管道、网络、命令行、信号等。更广义地讲，I/O指代任何操作系统理解为“文件”的事务。
许多操作系统，包括Linux和Windows，都将各种具有输入和输出概念的实体——包括设备、磁盘文件、命令行等——统称为文件，因此这里所说的文件是一个广义的概念。

在操作系统层面上，文件操作也有类似于FILE的一个概念，在Linux里，这叫做文件描述符（File Descriptor），而在Windows里，叫做句柄（Handle）（以下在没有歧义的时候统称为句柄）。

在Linux中，值为0、1、2的fd分别代表标准输入、标准输出和标准错误输出。
在程序中打开文件得到的fd从3开始增长。fd具体是什么呢？在内核中，每一个进程都有一个私有的“打开文件表”，这个表是一个指针数组，每一个元素都指向一个内核的打开文件对象。而fd，就是这个表的下标。当用户打开一个文件时，内核会在内部生成一个打开文件对象，并在这个表里找到一个空项，让这一项指向生成的打开文件对象，并返回这一项的下标作为fd。由于这个表处于内核，并且用户无法访问到，因此用户即使拥有fd，也无法得到打开文件对象的地址，只能够通过系统提供的函数来操作。

对于Windows中的句柄，与Linux中的fd大同小异，不过Windows的句柄并不是打开文件表的下标，而是其下标经过某种线性变换之后的结果。

在大致了解了I/O为何物之后，我们就能知道I/O初始化的职责是什么了。首先I/O初始化函数需要在用户空间中建立stdin、stdout、stderr及其对应的FILE结构，使得程序进入main之后可以直接使用printf、scanf等函数。

##### 11.1.4 MSVC CRT的入口函数初始化

#### 11.2 C/C++运行库

##### 11.2.1 C语言运行库

任何一个C程序，它的背后都有一套庞大的代码来进行支撑，以使得该程序能够正常运行。这套代码至少包括入口函数，及其所依赖的函数所构成的函数集合。当然，它还理应包括各种标准库函数的实现。

这样的一个代码集合称之为运行时库（Runtime Library）。而C语言的运行库，即被称为C运行库（CRT）。

一个C语言运行库大致包含了如下功能：
- 启动与退出：包括入口函数及入口函数所依赖的其他函数等。
- 标准函数：由C语言标准规定的C语言标准库所拥有的函数实现。
- I/O：I/O功能的封装和实现，参见上一节中I/O初始化部分。
- 堆：堆的封装和实现，参见上一节中堆初始化部分。
- 语言实现：语言中一些特殊功能的实现。
- 调试：实现调试功能的代码。

在这些运行库的组成成分中，C语言标准库占据了主要地位并且大有来头。

##### 11.2.2 C语言标准库

ANSI C的标准库由24个C头文件组成。与许多其他语言（如Java）的标准库不同，C语言的标准库非常轻量，它仅仅包含了数学函数、字符/字符串处理，I/O等基本方面。
- 标准输入输出（stdio.h）。
- 文件操作（stdio.h）。
- 字符操作（ctype.h）。
- 字符串操作（string.h）。
- 数学函数（math.h）。
- 资源管理（stdlib.h）。
- 格式转换（stdlib.h）。
- 时间/日期（time.h）。
- 断言（assert.h）。

##### 11.2.3 glibc与MSVC CRT

运行库是平台相关的，因为它与操作系统结合得非常紧密。C语言的运行库从某种程度上来讲是C语言的程序和不同操作系统平台之间的抽象层，它将不同的操作系统API抽象成相同的库函数。

Linux和Windows平台下的两个主要C语言运行库分别为glibc（GNU C Library）和MSVCRT（Microsoft Visual C Run-time）。

值得注意的是，像线程操作这样的功能并不是标准的C语言运行库的一部分，但是glibc和MSVCRT都包含了线程操作的库函数。比如glibc有一个可选的pthread库中的pthread_create()函数可以用来创建线程；而MSVCRT中可以使用_beginthread()函数来创建线程。所以glibc和MSVCRT事实上是标准C语言运行库的超集，它们各自对C标准库进行了一些扩展。

###### glibc

glibc即GNU C Library，是GNU旗下的C标准库。

https://www.gnu.org/software/libc/

2025-01-30 GLIBC 2.41

POSIX 是 可移植操作系统接口 的缩写，是一个 IEEE 1003.1 标准，定义了应用程序和 UNIX 操作系统之间的语言接口。遵守该标准可以确保 UNIX 程序在不同平台之间的兼容性。 

glibc的发布版本主要由两部分组成，一部分是头文件，比如stdio.h、stdlib.h等，它们往往位于/usr/include；另外一部分则是库的二进制文件部分。二进制部分主要的就是C语言标准库，它有静态和动态两个版本。动态的标准库我们及在本书的前面章节中碰到过了，它位于/lib/libc.so.6；而静态标准库位于/usr/lib/libc.a。

操作系统装载程序之后，首先运行的代码并不是main的第一行，而是某些别的代码，这些代码负责准备好main函数执行所需要的环境，并且负责调用main函数，这时候你才可以在main函数里放心大胆地写各种代码：申请内存、使用系统调用、触发异常、访问I/O。在main返回之后，它会记录main函数的返回值，调用atexit注册的函数，然后结束进程。

运行这些代码的函数称为入口函数或入口点（Entry Point），视平台的不同而有不同的名字。程序的入口点实际上是一个程序的初始化和结束部分，它往往是运行库的一部分。一个典型的程序运行步骤大致如下：

操作系统在创建进程后，把控制权交到了程序的入口，这个入口往往是运行库中的某个入口函数。

入口函数对运行库和程序运行环境进行初始化，包括堆、I/O、线程、全局变量构造，等等。

入口函数在完成初始化之后，调用main函数，正式开始执行程序主体部分。

main函数执行完毕以后，返回到入口函数，入口函数进行清理工作，包括全局变量析构、堆销毁、关闭I/O等，然后进行系统调用结束进程。

```c
E:\Projects\github\glibc\sysdeps\i386\start.S

/* This is the canonical entry point, usually the first thing in the text
   segment.  The SVR4/i386 ABI (pages 3-31, 3-32) says that when the entry
   point runs, most registers' values are unspecified, except for:

   %edx		Contains a function pointer to be registered with `atexit'.
		This is how the dynamic linker arranges to have DT_FINI
		functions called for shared libraries that have been loaded
		before this code runs.

   %esp		The stack contains the arguments and environment:
		0(%esp)			argc
		4(%esp)			argv[0]
		...
		(4*argc)(%esp)		NULL
		(4*(argc+1))(%esp)	envp[0]
		...
					NULL
*/

#include <sysdep.h>

ENTRY (_start)
	/* Clearing frame pointer is insufficient, use CFI.  */
	cfi_undefined (eip)
	/* Clear the frame pointer.  The ABI suggests this be done, to mark
	   the outermost frame obviously.  */
	xorl %ebp, %ebp

	/* Extract the arguments as encoded on the stack and set up
	   the arguments for `main': argc, argv.  envp will be determined
	   later in __libc_start_main.  */
	popl %esi		/* Pop the argument count.  */
	movl %esp, %ecx		/* argv starts just at the current stack top.*/

	/* Before pushing the arguments align the stack to a 16-byte
	(SSE needs 16-byte alignment) boundary to avoid penalties from
	misaligned accesses.  Thanks to Edward Seidl <seidl@janed.com>
	for pointing this out.  */
	andl $0xfffffff0, %esp
	pushl %eax		/* Push garbage because we allocate
				   28 more bytes.  */

	/* Provide the highest stack address to the user code (for stacks
	   which grow downwards).  */
	pushl %esp

	pushl %edx		/* Push address of the shared library
				   termination function.  */

#ifdef PIC
	/* Load PIC register.  */
	call 1f
	addl $_GLOBAL_OFFSET_TABLE_, %ebx

	/* This used to be the addresses of .fini and .init.  */
	pushl $0
	pushl $0

	pushl %ecx		/* Push second argument: argv.  */
	pushl %esi		/* Push first argument: argc.  */

# ifdef SHARED
	pushl main@GOT(%ebx)
# else
	/* Avoid relocation in static PIE since _start is called before
	   it is relocated.  This also avoid rely on linker optimization to
	   transform 'movl main@GOT(%ebx), %eax' to 'leal main@GOTOFF(%ebx)'
	   if main is defined locally.  */
	leal __wrap_main@GOTOFF(%ebx), %eax
	pushl %eax
# endif

	/* Call the user's main function, and exit with its value.
	   But let the libc call main.    */
	call __libc_start_main@PLT
#else
	/* This used to be the addresses of .fini and .init.  */
	pushl $0
	pushl $0

	pushl %ecx		/* Push second argument: argv.  */
	pushl %esi		/* Push first argument: argc.  */

	pushl $main

	/* Call the user's main function, and exit with its value.
	   But let the libc call main.    */
	call __libc_start_main
#endif

	hlt			/* Crash if somehow `exit' does return.  */

#ifdef PIC
1:	movl	(%esp), %ebx
	ret
#endif

#if defined PIC && !defined SHARED
__wrap_main:
	jmp	main@PLT
#endif
END (_start)

/* To fulfill the System V/i386 ABI we need this symbol.  Yuck, it's so
   meaningless since we don't support machines < 80386.  */
	.section .rodata
	.globl _fp_hw
_fp_hw:	.long 3
	.size _fp_hw, 4
	.type _fp_hw,@object

/* Define a symbol for the first piece of initialized data.  */
	.data
	.globl __data_start
__data_start:
	.long 0
	.weak data_start
	data_start = __data_start

```

E:\Projects\github\glibc\sysdeps\x86_64\start.S

```c

ENTRY (_start)
	/* Clearing frame pointer is insufficient, use CFI.  */
	cfi_undefined (rip)
	/* Clear the frame pointer.  The ABI suggests this be done, to mark
	   the outermost frame obviously.  */
	xorl %ebp, %ebp

	/* Extract the arguments as encoded on the stack and set up
	   the arguments for __libc_start_main (int (*main) (int, char **, char **),
		   int argc, char *argv,
		   void (*init) (void), void (*fini) (void),
		   void (*rtld_fini) (void), void *stack_end).
	   The arguments are passed via registers and on the stack:
	main:		%rdi
	argc:		%rsi
	argv:		%rdx
	init:		%rcx
	fini:		%r8
	rtld_fini:	%r9
	stack_end:	stack.	*/

	mov %RDX_LP, %R9_LP	/* Address of the shared library termination
				   function.  */
#ifdef __ILP32__
	mov (%rsp), %esi	/* Simulate popping 4-byte argument count.  */
	add $4, %esp
#else
	popq %rsi		/* Pop the argument count.  */
#endif
	/* argv starts just at the current stack top.  */
	mov %RSP_LP, %RDX_LP
	/* Align the stack to a 16 byte boundary to follow the ABI.  */
	and  $~15, %RSP_LP

	/* Push garbage because we push 8 more bytes.  */
	pushq %rax

	/* Provide the highest stack address to the user code (for stacks
	   which grow downwards).  */
	pushq %rsp

	/* These used to be the addresses of .fini and .init.  */
	xorl %r8d, %r8d
	xorl %ecx, %ecx

#ifdef PIC
	mov main@GOTPCREL(%rip), %RDI_LP
#else
	mov $main, %RDI_LP
#endif

	/* Call the user's main function, and exit with its value.
	   But let the libc call main.  Since __libc_start_main in
	   libc.so is called very early, lazy binding isn't relevant
	   here.  Use indirect branch via GOT to avoid extra branch
	   to PLT slot.  In case of static executable, ld in binutils
	   2.26 or above can convert indirect branch into direct
	   branch.  */
	call *__libc_start_main@GOTPCREL(%rip)

	hlt			/* Crash if somehow `exit' does return.	 */
END (_start)
```

```c
E:\Projects\github\glibc\csu\libc-start.c

#ifdef LIBC_START_MAIN
# ifdef LIBC_START_DISABLE_INLINE
#  define STATIC static
# else
#  define STATIC static inline __attribute__ ((always_inline))
# endif
# define DO_DEFINE_LIBC_START_MAIN_VERSION 0
#else
# define STATIC
# define LIBC_START_MAIN __libc_start_main_impl
# define DO_DEFINE_LIBC_START_MAIN_VERSION 1
#endif
```

```c
E:\Projects\github\glibc\csu\libc-start.c

#include <libc-start.h>

STATIC int LIBC_START_MAIN (int (*main) (int, char **, char **
					 MAIN_AUXVEC_DECL),
			    int argc,
			    char **argv,
#ifdef LIBC_START_MAIN_AUXVEC_ARG
			    ElfW(auxv_t) *auxvec,
#endif
			    __typeof (main) init,
			    void (*fini) (void),
			    void (*rtld_fini) (void),
			    void *stack_end)
     __attribute__ ((noreturn));
```


```C
E:\Projects\github\glibc\sysdeps\generic\libc_start_call_main.h

_Noreturn static __always_inline void
__libc_start_call_main (int (*main) (int, char **, char ** MAIN_AUXVEC_DECL),
                        int argc, char **argv MAIN_AUXVEC_DECL)
{
  exit (main (argc, argv, __environ MAIN_AUXVEC_PARAM));
}

```

###### MSVC CRT

同一个版本的MSVC CRT根据不同的属性提供了多种子版本，以供不同需求的开发者使用。按照静态/动态链接，可以分为静态版和动态版；按照单线程/多线程，可以分为单线程版和多线程版；按照调试/发布，可分为调试版和发布版；按照是否支持C++分为纯C运行库版和支持C++版；按照是否支持托管代码分为支持本地代码/托管代码和纯托管代码版。这

https://learn.microsoft.com/zh-cn/cpp/c-runtime-library/crt-library-features?view=msvc-170



#### 11.3 运行库与多线程

##### 11.3.1 CRT的多线程困扰

线程的访问权限

线程的访问能力非常自由，它可以访问进程内存里的所有数据，甚至包括其他线程的堆栈（如果它知道其他线程的堆栈地址，然而这是很少见的情况），但实际运用中线程也拥有自己的私有存储空间，包括：
- 栈（尽管并非完全无法被其他线程访问，但一般情况下仍然可以认为是私有的数据）。
- 线程局部存储（Thread Local Storage, TLS）。线程局部存储是某些操作系统为线程单独提供的私有空间，但通常只具有很有限的尺寸。
- 寄存器（包括PC寄存器），寄存器是执行流的基本数据，因此为线程私有。

多线程运行库

这里我们所说的“多线程相关”主要有两个方面，
- 一方面是提供那些多线程操作的接口，比如创建线程、退出线程、设置线程优先级等函数接口；
- 另外一方面是C运行库本身要能够在多线程的环境下正确运行。

对于第一方面，主流的CRT都会有相应的功能。比如Windows下，MSVC CRT提供了诸如_beginthread()、_endthread()等函数用于线程的创建和退出；而Linux下，glibc也提供了一个可选的线程库pthread（POSIX Thread），它提供了诸如pthread_create()、pthread_exit()等函数用于线程的创建和退出。很明显，这些函数都不属于标准的运行库，它们都是平台相关的。


11.3.2 CRT改进

使用TLS

加锁

改进函数调用方式

11.3.3 线程局部存储实现

TLS的用法很简单，如果要定义一个全局变量为TLS类型的，只需要在它定义前加上相应的关键字即可。

对于GCC来说，这个关键字就是__thread，比如我们定义一个TLS的全局整型变量： __thread int number;

对于MSVC来说，相应的关键字为__declspec(thread)： __declspec(thread) int number;

#### 11.4 C++全局构造与析构

11.4.1 glibc全局构造与析构

E:\Projects\github\glibc\csu\libc-start.c

E:\Projects\github\gcc\libgcc\crtstuff.c

```c
static void
call_init (int argc, char **argv, char **envp)
{
  /* For static executables, preinit happens right before init.  */
  {
    const size_t size = __preinit_array_end - __preinit_array_start;
    size_t i;
    for (i = 0; i < size; i++)
      (*__preinit_array_start [i]) (argc, argv, envp);
  }

# if ELF_INITFINI
  _init ();
# endif

  const size_t size = __init_array_end - __init_array_start;
  for (size_t i = 0; i < size; i++)
      (*__init_array_start [i]) (argc, argv, envp);
}

/* Likewise for the destructor.  */
static void
call_fini (void *unused)
{
  size_t i = __fini_array_end - __fini_array_start;
  while (i-- > 0)
    (*__fini_array_start [i]) ();

# if ELF_INITFINI
  _fini ();
# endif
}
```

```c
static void __attribute__((used))
__do_global_ctors_aux (void)
{
  func_ptr *p;
  for (p = __CTOR_END__ - 1; *p != (func_ptr) -1; p--)
    (*p) ();
}

void
__do_global_dtors (void)
{
  func_ptr *p, f;
  for (p = __DTOR_LIST__ + 1; (f = *p); p++)
    f ();

#if USE_TM_CLONE_REGISTRY
  deregister_tm_clones ();
#endif /* USE_TM_CLONE_REGISTRY */

#ifdef USE_EH_FRAME_REGISTRY
  if (__deregister_frame_info)
    __deregister_frame_info (__EH_FRAME_BEGIN__);
#endif
}
```


11.4.2 MSVC CRT的全局构造和析构

D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\crt\src\vcruntime\exe_common.inl

```c
D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\crt\src\vcruntime\internal_shared.h

//-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//
// "Special" Data
//
//-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
#ifndef _M_CEE
    typedef void (__cdecl* _PVFV)(void);
    typedef int  (__cdecl* _PIFV)(void);

    extern _CRTALLOC(".CRT$XIA") _PIFV __xi_a[]; // First C Initializer
    extern _CRTALLOC(".CRT$XIZ") _PIFV __xi_z[]; // Last C Initializer
    extern _CRTALLOC(".CRT$XCA") _PVFV __xc_a[]; // First C++ Initializer
    extern _CRTALLOC(".CRT$XCZ") _PVFV __xc_z[]; // Last C++ Initializer
    extern _CRTALLOC(".CRT$XPA") _PVFV __xp_a[]; // First Pre-Terminator
    extern _CRTALLOC(".CRT$XPZ") _PVFV __xp_z[]; // Last Pre-Terminator
    extern _CRTALLOC(".CRT$XTA") _PVFV __xt_a[]; // First Terminator
    extern _CRTALLOC(".CRT$XTZ") _PVFV __xt_z[]; // Last Terminator
#endif


// This is the common main implementation to which all of the CRT main functions
// delegate (for executables; DLLs are handled separately).
static __forceinline int __cdecl __scrt_common_main()
{
    // The /GS security cookie must be initialized before any exception handling
    // targeting the current image is registered.  No function using exception
    // handling can be called in the current image until after this call:
    __security_init_cookie();

    return __scrt_common_main_seh();
}

```

```c
void __clrcall _initterm (
        _PVFV * pfbegin,
        _PVFV * pfend
        )
{
        /*
         * walk the table of function pointers from the bottom up, until
         * the end is encountered.  Do not skip the first entry.  The initial
         * value of pfbegin points to the first valid entry.  Do not try to
         * execute what pfend points to.  Only entries before pfend are valid.
         */
        while ( pfbegin < pfend )
        {
            /*
             * if current table entry is non-NULL, call thru it.
             */
            if ( *pfbegin != NULL )
                (**pfbegin)();
            ++pfbegin;
        }
}

static __declspec(noinline) int __cdecl __scrt_common_main_seh()
{
    

            _initterm(__xc_a, __xc_z);

        
}

```


```c
D:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.43.34808\crt\src\vcruntime\internal_shared.h

//-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//
// Section Attributes
//
//-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
#pragma section(".CRT$XCA",    long, read) // First C++ Initializer
#pragma section(".CRT$XCAA",   long, read) // Startup C++ Initializer
#pragma section(".CRT$XCZ",    long, read) // Last C++ Initializer

#pragma section(".CRT$XDA",    long, read) // First Dynamic TLS Initializer
#pragma section(".CRT$XDZ",    long, read) // Last Dynamic TLS Initializer

#pragma section(".CRT$XIA",    long, read) // First C Initializer
#pragma section(".CRT$XIAA",   long, read) // Startup C Initializer
#pragma section(".CRT$XIAB",   long, read) // PGO C Initializer
#pragma section(".CRT$XIAC",   long, read) // Post-PGO C Initializer
#pragma section(".CRT$XIC",    long, read) // CRT C Initializers
#pragma section(".CRT$XIYA",   long, read) // VCCorLib Threading Model Initializer
#pragma section(".CRT$XIYAA",  long, read) // XAML Designer Threading Model Override Initializer
#pragma section(".CRT$XIYB",   long, read) // VCCorLib Main Initializer
#pragma section(".CRT$XIZ",    long, read) // Last C Initializer

#pragma section(".CRT$XLA",    long, read) // First Loader TLS Callback
#pragma section(".CRT$XLC",    long, read) // CRT TLS Constructor
#pragma section(".CRT$XLD",    long, read) // CRT TLS Terminator
#pragma section(".CRT$XLZ",    long, read) // Last Loader TLS Callback

#pragma section(".CRT$XPA",    long, read) // First Pre-Terminator
#pragma section(".CRT$XPB",    long, read) // CRT ConcRT Pre-Terminator
#pragma section(".CRT$XPX",    long, read) // CRT Pre-Terminators
#pragma section(".CRT$XPXA",   long, read) // CRT stdio Pre-Terminator
#pragma section(".CRT$XPZ",    long, read) // Last Pre-Terminator

#pragma section(".CRT$XTA",    long, read) // First Terminator
#pragma section(".CRT$XTZ",    long, read) // Last Terminator

#pragma section(".CRTMA$XCA",  long, read) // First Managed C++ Initializer
#pragma section(".CRTMA$XCZ",  long, read) // Last Managed C++ Initializer

#pragma section(".CRTVT$XCA",  long, read) // First Managed VTable Initializer
#pragma section(".CRTVT$XCZ",  long, read) // Last Managed VTable Initializer

#pragma section(".rdata$T",    long, read)

#pragma section(".rtc$IAA",    long, read) // First RTC Initializer
#pragma section(".rtc$IZZ",    long, read) // Last RTC Initializer

#pragma section(".rtc$TAA",    long, read) // First RTC Terminator
#pragma section(".rtc$TZZ",    long, read) // Last RTC Terminator

#define _CRTALLOC(x) __declspec(allocate(x))

```


```asm
HelloWorld Hw;
00007FF6397E18B0  push        rbp  
00007FF6397E18B2  push        rdi  
00007FF6397E18B3  sub         rsp,0E8h  
00007FF6397E18BA  lea         rbp,[rsp+20h]  
00007FF6397E18BF  lea         rcx,[__FE69D46F_ConsoleApplication2@cpp (07FF6397F6076h)]  
00007FF6397E18C6  call        __CheckForDebuggerJustMyCode (07FF6397E13EDh)  
00007FF6397E18CB  nop  
00007FF6397E18CC  lea         rcx,[Hw (07FF6397F0204h)]  
00007FF6397E18D3  call        HelloWorld::HelloWorld (07FF6397E12B7h)  
00007FF6397E18D8  nop  
00007FF6397E18D9  lea         rcx,[`dynamic atexit destructor for 'Hw'' (07FF6397EADC0h)]  
00007FF6397E18E0  call        atexit (07FF6397E119Fh)  
00007FF6397E18E5  nop  
00007FF6397E18E6  lea         rsp,[rbp+0C8h]  
00007FF6397E18ED  pop         rdi  
00007FF6397E18EE  pop         rbp  
00007FF6397E18EF  ret  
```

INL文件是什么
INL文件是用于存放内联函数定义的源文件。在C++编程中，内联函数通常在头文件中实现，但当内联函数较多时，头文件可能会变得过长和混乱。为了使头文件更加简洁，可以将内联函数的定义移到一个单独的INL文件中，然后在头文件的末尾使用#include指令将其包含进来

#### 11.5 fread实现

11.5.1 缓冲

11.5.2 fread_s

11.5.4 _read

11.5.5 文本换行

#### 11.6 本章小结

### 第12章 系统调用与API

主要介绍Linux和Windows的系统调用及Windows 的API。

#### 12.1 系统调用介绍

12.1.1 什么是系统调用

为了让应用程序有能力访问系统资源，也为了让程序借助操作系统做一些必须由操作系统支持的行为，每个操作系统都会提供一套接口，以供应用程序使用。这些接口往往通过中断来实现，比如Linux使用0x80号中断作为系统调用的入口，Windows采用0x2E号中断作为系统调用入口。

12.1.2 Linux系统调用

下面让我们来看看Linux系统调用的定义，已有一个比较直观的概念。在x86下，系统调用由0x80中断完成，各个通用寄存器用于传递参数，EAX寄存器用于表示系统调用的接口号，比如EAX = 1表示退出进程（exit）；EAX = 2表示创建进程（fork）；EAX = 3表示读取文件或IO（read）；EAX = 4表示写文件或IO（write）等，每个系统调用都对应于内核源代码中的一个函数，它们都是以“sys_”开头的，比如exit调用对应内核中的sys_exit函数。当系统调用返回时，EAX又作为调用结果的返回值。

12.1.3 系统调用的弊端

事实上，包括Linux，大部分操作系统的系统调用都有两个特点：
- 使用不便。操作系统提供的系统调用接口往往过于原始，程序员须要了解很多与操作系统相关的细节。如果没有进行很好的包装，使用起来不方便。
- 各个操作系统之间系统调用不兼容。首先Windows系统和Linux系统之间的系统调用就基本上完全不同。

“解决计算机的问题可以通过增加层来实现”，于是运行库挺身而出，它作为系统调用与程序之间的一个抽象层可以保持着这样的特点：
- 使用简便。因为运行库本身就是语言级别的，它一般都设计相对比较友好。
- 形式统一。运行库有它的标准，叫做标准库，凡是所有遵循这个标准的运行库理论上都是相互兼容的，不会随着操作系统或编译器的变化而变化。

运行时库将不同的操作系统的系统调用包装为统一固定的接口，使得同样的代码，在不同的操作系统下都可以直接编译，并产生一致的效果。
这就是源代码级上的可移植性。

#### 12.2 系统调用原理

12.2.1 特权级与中断

现代的CPU常常可以在多种截然不同的特权级别下执行指令，在现代操作系统中，通常也据此有两种特权级别，分别为用户模式（User Mode）和内核模式（Kernel Mode），也被称为用户态和内核态。

操作系统一般是通过中断（Interrupt）来从用户态切换到内核态。

什么是中断呢？中断是一个硬件或软件发出的请求，要求CPU暂停当前的工作转手去处理更加重要的事情。

中断一般具有两个属性，一个称为中断号（从0开始），一个称为中断处理程序（Interrupt Service Routine, ISR）。

在内核中，有一个数组称为中断向量表（Interrupt Vector Table），这个数组的第n项包含了指向第n号中断的中断处理程序的指针。

当中断到来时，CPU会暂停当前执行的代码，根据中断的中断号，在中断向量表中找到对应的中断处理程序，并调用它。中断处理程序执行完成之后，CPU会继续执行之前的代码。

通常意义上，中断有两种类型、
- 一种称为硬件中断，这种中断来自于硬件的异常或其他事件的发生，如电源掉电、键盘被按下等。
- 另一种称为软件中断，软件中断通常是一条指令（i386下是int），带有一个参数记录中断号，使用这条指令用户可以手动触发某个中断并执行其中断处理程序。
  - 例如在i386下，int 0x80这条指令会调用第0x80号中断的处理程序。

由于中断号是很有限的，操作系统不会舍得用一个中断号来对应一个系统调用，而更倾向于用一个或少数几个中断号来对应所有的系统调用。

如，i386下Windows里绝大多数系统调用都是由int 0x2e来触发的，而Linux则使用int 0x80来触发所有的系统调用。

以Linux的int 0x80为例，系统调用号是由eax来传入的。用户将系统调用号放入eax，然后使用int 0x80调用中断，中断服务程序就可以从eax里取得系统调用号，进而调用对应的函数。

12.2.2 基于int的Linux的经典系统调用实现

1. 触发中断

```C
#ifndef __NR_fork
#define __NR_fork 2
#endif
```

```C
/*
 * pid_t fork(void);
 */

#ifndef sys_fork
static __attribute__((unused))
pid_t sys_fork(void)
{
#ifdef __NR_clone
	/* note: some archs only have clone() and not fork(). Different archs
	 * have a different API, but most archs have the flags on first arg and
	 * will not use the rest with no other flag.
	 */
	return my_syscall5(__NR_clone, SIGCHLD, 0, 0, 0, 0);
#elif defined(__NR_fork)
	return my_syscall0(__NR_fork);
#else
	return __nolibc_enosys(__func__);
#endif
}
#endif

static __attribute__((unused))
pid_t fork(void)
{
	return __sysret(sys_fork());
}

```

```c
#define my_syscall0(num)                                                      \
({                                                                            \
	long _ret;                                                            \
	register long _num __asm__ ("eax") = (num);                           \
									      \
	__asm__ volatile (                                                    \
		"int $0x80\n"                                                 \
		: "=a" (_ret)                                                 \
		: "0"(_num)                                                   \
		: "memory", "cc"                                              \
	);                                                                    \
	_ret;                                                                 \
})
```

```c
/* Syscall return helper: takes the syscall value in argument and checks for an
 * error in it. This may only be used with signed returns (int or long), but
 * not with pointers. An error is any value < 0. When an error is encountered,
 * -ret is set into errno and -1 is returned. Otherwise the returned value is
 * passed as-is with its type preserved.
 */

#define __sysret(arg)							\
({									\
	__typeof__(arg) __sysret_arg = (arg);				\
	(__sysret_arg < 0)                              /* error ? */	\
		? (({ SET_ERRNO(-__sysret_arg); }), -1) /* ret -1 with errno = -arg */ \
		: __sysret_arg;                         /* return original value */ \
})
```
```c
#ifndef NOLIBC_IGNORE_ERRNO
#define SET_ERRNO(v) do { errno = (v); } while (0)
int errno __attribute__((weak));
#else
#define SET_ERRNO(v) do { } while (0)
#endif
```
   
2. 切换堆栈

当0x80号中断发生的时候，CPU除了切入内核态之外，还会自动完成下列几件事：

（1）找到当前进程的内核栈（每一个进程都有自己的内核栈）。

（2）在内核栈中依次压入用户态的寄存器SS、ESP、EFLAGS、CS、EIP。

而当内核从系统调用中返回的时候，须要调用iret指令来回到用户态，iret指令则会从内核栈里弹出寄存器SS、ESP、EFLAGS、CS、EIP的值，使得栈恢复到用户态的状态。

3. 中断处理程序

12.2.3 Linux的新型系统调用机制

#### 12.3 Windows API

API的全称为Application Programming Interface，即应用程序编程接口。因此API不是一个专门的事物，而是一系列事物的总称。但是我们通常在Windows下提到API时，一般就是指Windows 系统提供给应用程序的接口，即Windows API。

12.3.1 Windows API概览

Windows API是以DLL导出函数的形式暴露给应用程序开发者的。它被包含在诸多的系统DLL内，规模上非常庞大，所有的导出函数大约有数千个（以Windows XP为例）。微软把这些Windows API DLL导出函数的声明的头文件、导出库、相关文件和工具一起提供给开发者，并让它们成为Software Development Kit（SDK）。

12.3.2 为什么要使用Windows API

Windows API以DLL导出函数的形式存在也自然是水到渠成，我们知道DLL作为Windows系统的最基本的模块组织形式，它有着良好的接口定义和灵活的组合方式。DLL基本上是Windows系统上很多高级接口和程序设计方法的基石，包括内核与驱动程序、COM、OLE、ActiveX等都是基于DLL技术的

#### 12.4 本章小结

### 第13章 运行库实现

本章主要实现了一个支持堆、基本文件操作、格式化字符串、基本输入输出、C++ new/delete、C++ string、C++全局构造和析构的Mini CRT。”


## 兼容x86指令集的32位CPU的个人计算机，CPU的核心频率是指什么？

在兼容 x86 指令集的 32 位 CPU 个人计算机中，**CPU 核心频率**（Core Clock Frequency）是衡量 CPU 运算速度的核心物理指标，它直接反映了 CPU 内部时钟信号的周期性振荡速率。以下是分层次的解析：

---

### **一、核心频率的本质**
#### **1. 定义**
- **时钟周期**：CPU 的所有操作（如取指令、执行运算、读写内存）均以 **时钟周期**（Clock Cycle）为基本时间单位进行同步。
- **核心频率**：即 CPU 的时钟信号频率（单位：Hz），表示每秒完成的时钟周期数。例如：
  - **1 GHz** = 每秒 10 亿次时钟周期。
  - 若某指令需 4 个周期完成，则在 3 GHz CPU 上每秒可执行约 7.5 亿次该指令（3×10⁹ / 4）。

#### **2. 硬件实现**
- **晶体振荡器**：CPU 内部或主板上的晶振生成基准时钟信号。
- **倍频技术**：现代 CPU 通过 **倍频器**（Multiplier）将外部总线频率（如 100 MHz）倍增到更高核心频率（如 3 GHz = 100 MHz × 30）。

---

### **二、核心频率的作用**
#### **1. 性能基准**
- **单线程性能**：在相同架构下，频率越高，单位时间内完成的指令越多。
  - 例如：同代 x86 CPU（如 Intel Pentium 4），3.8 GHz 的版本比 3.0 GHz 快约 26%。
- **流水线效率**：高频 CPU 可更快推进流水线阶段（取指、解码、执行等），但需平衡流水线深度与效率。

#### **2. 物理限制**
- **散热与功耗**：频率提升会导致发热量指数级增长（公式：`P ∝ f × V²`），受制于芯片制程和散热能力。
  - 典型例子：早期 Pentium 4（NetBurst 架构）追求高频（>3 GHz），但发热过高导致性能瓶颈。

---

### **三、x86 32 位 CPU 的典型频率**
| CPU 型号             | 核心频率范围      | 技术背景                         |
|----------------------|------------------|----------------------------------|
| **Intel 80386**      | 12–40 MHz        | 初代 32 位 x86 CPU（1985 年）    |
| **Intel Pentium III**| 450 MHz–1.4 GHz  | 末代纯 32 位主流 CPU（1999 年）  |
| **AMD Athlon XP**    | 1.4–2.2 GHz      | 高频竞争时代（2001–2003 年）      |

---

### **四、核心频率的误区**
#### **1. 频率≠实际性能**
- **架构效率**：现代 CPU（如 ARM Cortex-A）可能以 2 GHz 超越旧 x86 的 3 GHz，因指令集和微架构优化。
  - 例如：Intel Pentium 4（3.8 GHz）的实际性能低于 Core 2 Duo（2.4 GHz）。
- **并行化**：多核、超线程（Hyper-Threading）通过并行提升吞吐量，而非依赖单核高频。

#### **2. 超频（Overclocking）**
- **手动提升频率**：通过 BIOS 或软件强制提高倍频/外频，突破厂商设定。
  - 风险：过热、电压不稳导致硬件损坏（如电容爆浆）。
  - 典型场景：游戏玩家将 Core i7 从 3.6 GHz 超至 5.0 GHz。

---

### **五、技术影响**
#### **1. 软件优化**
- **实时系统**：工业控制设备依赖固定频率保证时序确定性。
- **节能调频**：现代 OS（如 Windows）通过动态调频（DVFS）平衡性能与功耗。

#### **2. 硬件设计**
- **制程工艺**：7nm 制程比 14nm 制程可在同频下降低功耗 40% 以上。
- **频率墙**：物理极限（量子隧穿效应）使硅基 CPU 频率难以突破 5-6 GHz。

---

### **六、总结**
- **核心频率是 CPU 的“心跳”**，决定了基础运算节奏，但性能需结合架构、缓存、并行度等综合评估。
- 在 x86 32 位 CPU 时代，高频曾是性能竞争的核心指标，而现代计算更依赖多核、能效比和异构计算（如 GPU 加速）。

理解核心频率的物理意义和局限性，有助于合理选择硬件（如高频 CPU 适合单线程任务，多核 CPU 适合并行负载）并优化软件开发。

## Linux系统架构图和Windows系统架构图

<think>
嗯，用户现在想要Linux和Windows的系统架构图。我需要先回想一下这两个操作系统的架构结构。用户之前已经问过量子隧穿效应，现在转向操作系统架构，可能是学习或工作需要比较两者。

首先，应该考虑用户的需求。他们可能需要架构图来理解两个系统的设计差异，可能是学生、开发者或者IT专业人员。需要确保架构图准确且易于理解，但可能用户也想要一些解释，所以最好在提供架构图的同时，附上关键差异的说明。

接下来，我得回忆Linux和Windows的架构层次。Linux通常是分层结构，从用户空间到内核空间，包含应用层、系统库、内核子系统等。而Windows的架构更模块化，比如分为用户模式和内核模式，有更多的子系统如Win32、POSIX等。

然后，用户可能想要架构图的文字描述，因为直接画图可能无法在此呈现。应该用文字详细描述每一层，并指出它们的不同之处，比如内核类型、权限管理、驱动模型等。

还要注意用户可能的深层需求。比如他们可能在选择操作系统进行开发，或者优化系统性能，所以需要对比两者的优缺点。例如，Linux的模块化与Windows的兼容性，或者安全模型的不同。

需要确保信息准确，避免错误。例如，Linux使用宏内核，而Windows是混合内核。设备驱动方面，Linux内核模块和Windows的驱动程序模型不同。此外，用户可能对文件系统、网络堆栈或安全机制感兴趣，这些也需要在对比中提到。

最后，总结两者的差异，帮助用户更好地理解如何根据需求选择合适的系统。比如，Linux更适合定制和服务器，Windows适合桌面和商业应用。

</think>

以下是 **Linux** 和 **Windows** 系统架构的对比及简化架构图描述。由于无法直接绘制图像，我将通过文字详细说明两者的架构层次和核心差异。

---

### **1. Linux 系统架构图（分层模型）**
```
+-----------------------+
|      用户空间         |
| 应用程序 (Apps)       |   → 用户进程（如浏览器、文本编辑器等）
|-----------------------|
| 系统工具/Shell        |   → Bash、Python脚本等
|-----------------------|
| 系统库 (Glibc, libc)  |   → C库、数学库、线程库等
|-----------------------|
| 系统调用接口 (Syscall) |   → 用户态与内核态的分界线
+-----------------------+
|      内核空间         |
|-----------------------|
| 内核子系统            |  
|   - 进程管理          |   → 进程调度、信号处理
|   - 内存管理          |   → 虚拟内存、分页机制
|   - 文件系统          |   → Ext4、Btrfs、虚拟文件系统（VFS）
|   - 网络堆栈          |   → TCP/IP协议栈、套接字
|   - 设备驱动          |   → 硬件抽象层（HAL）
|-----------------------|
| 硬件抽象层 (HAL)      |   → 直接与硬件交互
+-----------------------+
| 硬件 (CPU、内存、I/O) |
+-----------------------+
```

**关键特性**：
- **单体内核（Monolithic Kernel）**：核心功能（进程、内存、文件系统等）直接运行在内核空间。
- **模块化驱动**：驱动程序可以动态加载/卸载（`.ko` 文件）。
- **权限隔离**：用户进程通过系统调用访问内核功能，受权限控制（如 `root` vs 普通用户）。

---

### **2. Windows 系统架构图（混合模型）**
```
+-----------------------+
|      用户空间         |
| 应用程序              |   → Win32应用、UWP应用、子系统（WSL/POSIX）
|-----------------------|
| 子系统环境            |  
|   - Win32子系统       |   → 传统Windows程序入口
|   - 其他子系统        |   → WSL（Linux兼容层）、Hyper-V等
|-----------------------|
| 系统库 (DLL)          |   → Kernel32.dll、User32.dll、NTDLL.dll等
|-----------------------|
| 系统调用接口 (WinAPI)  |   → 用户态与内核态的分界线
+-----------------------+
|      内核空间         |
|-----------------------|
| 执行体 (Executive)    |  
|   - 对象管理器        |   → 管理内核对象（进程、线程、事件）
|   - 内存管理器        |   → 虚拟内存、分页文件
|   - I/O管理器         |   → 设备驱动、文件系统（NTFS）
|   - 安全监视器        |   → 访问控制（ACL、令牌）
|   - 进程管理器        |   → 进程/线程调度
|-----------------------|
| 微内核 (Kernel)       |   → 核心功能（线程调度、中断处理）
|-----------------------|
| 硬件抽象层 (HAL)      |   → 硬件差异屏蔽层
+-----------------------+
| 硬件 (CPU、内存、I/O) |
+-----------------------+
```

**关键特性**：
- **混合内核（Hybrid Kernel）**：核心功能分为“执行体”和微内核，部分模块化。
- **子系统兼容性**：通过 Win32 子系统支持传统应用，通过 WSL 兼容 Linux。
- **安全模型**：强制完整性控制（MIC）、用户账户控制（UAC）等。

---

### **3. 核心差异对比**
| **特性**          | **Linux**                  | **Windows**                |
|--------------------|----------------------------|----------------------------|
| **内核类型**       | 单体内核                   | 混合内核                   |
| **权限管理**       | 基于用户/组（POSIX）       | 访问控制列表（ACL）        |
| **驱动模型**       | 内核模块动态加载            | 驱动程序需签名认证         |
| **文件系统**       | Ext4/XFS/Btrfs 等          | NTFS/ReFS                  |
| **网络堆栈**       | 开源协议栈（TCP/IP）       | 私有协议栈（NDIS）         |
| **设计哲学**       | 模块化、可定制             | 兼容性、商业生态集成       |

---

### **4. 典型应用场景**
- **Linux**：服务器、嵌入式系统、高性能计算、开发环境。
- **Windows**：桌面办公、企业应用、游戏、商业软件生态。

---

如果需要更具体的细节（例如内核模块交互、子系统工作原理），可以进一步探讨！

## 原因在于早在几十年前，CPU就发展出了动态调度，在执行程序的时候为了提高效率有可能交换指令的顺序。同样，编译器在进行优化的时候，也可能为了效率而交换毫不相干的两条相邻指令（如x=1和r1=y）的执行顺序。


<think>
好的，我现在要仔细分析用户提供的关于CPU动态调度和编译器指令重排的内容。用户引用了一段来自《程序员的自我修养：链接、装载与库》的话，提到CPU和编译器为了优化性能可能会交换指令顺序，并举了例子x=1和r1=y。我需要理解这些概念，并思考用户可能的需求。

首先，我需要确认用户的问题方向。他们可能是在学习并发编程或底层系统知识时遇到了指令重排的问题。用户可能想知道这种现象的原因、影响以及如何应对。例如，多线程环境下，指令重排可能导致意外的结果，比如内存可见性问题或数据竞争。

接下来，我需要回忆CPU动态调度的相关知识。现代CPU使用流水线、乱序执行（Out-of-Order Execution）等技术来提高指令吞吐量。指令重排可能发生在运行时，由处理器的调度机制决定，这可能导致指令的执行顺序与程序代码中的顺序不一致。此外，编译器在优化阶段也可能重新排列指令顺序，以更好地利用CPU资源，比如减少流水线停顿或提高缓存命中率。

然后，例子中的x=1和r1=y两条指令看似没有依赖关系，因此编译器或CPU可能会交换它们的执行顺序。这在单线程环境下不会有问题，但在多线程环境中，如果另一个线程正在读取这些变量，可能会导致不一致的结果。例如，如果另一个线程看到r1被赋值为y的新值，但x还未被写入，这就破坏了预期顺序，引发并发问题。

用户可能想了解如何防止这种重排，这就需要提到内存屏障（Memory Barrier）或原子操作等同步机制。在高级语言中，比如C++或Java，可以使用volatile关键字或原子类型来限制编译器和CPU的优化，保证内存操作的顺序性。此外，在底层编程中，了解CPU的缓存一致性协议（如MESI）和内存模型（如x86的TSO，ARM的弱内存模型）也很重要。

我需要注意用户可能的误区，比如认为代码顺序就是执行顺序，而忽视了硬件和编译器的优化。还需要解释为什么这种优化是有必要的，以及在不同场景下的权衡。例如，性能优化与正确性之间的平衡，特别是在并发编程中的重要性。

另外，用户可能想了解具体的例子或代码案例，说明指令重排如何导致问题，以及如何通过代码或工具检测这些问题。例如，使用内存屏障指令（如mfence在x86）或高级语言中的同步机制来避免重排。此外，工具如调试器、内存模型检查工具或并发分析工具可能对此有帮助。

最后，总结这些内容，确保覆盖用户可能关心的方面，包括原因、影响、解决方案和相关概念，如内存可见性、原子性、顺序一致性等。可能需要分点回答，结构清晰，便于理解。

</think>

你提到的内容涉及计算机体系结构中的两个关键优化技术：**CPU动态指令调度（乱序执行）**和**编译器指令重排序**。这些优化在单线程环境下是安全的，但在多线程并发场景中可能引发内存可见性问题，需要开发者显式处理。以下从原理、影响及解决方案三个维度展开分析：

---

### **一、指令重排序的本质与动机**
#### **1. CPU动态调度（乱序执行）**
- **目标**：最大化利用流水线，减少空闲时钟周期。
- **机制**：
  - **流水线技术**：将指令分解为取指、解码、执行、访存、写回等阶段，并行处理不同阶段。
  - **乱序执行（OoOE）**：当某条指令因数据依赖或资源冲突无法立即执行时，CPU动态调度后续独立指令提前执行。
  - **重排序缓冲区（ROB）**：记录指令间的依赖关系，确保乱序执行的最终结果与程序顺序一致。
- **示例**：
  ```asm
  ; 原始顺序           ; 实际执行顺序（假设LOAD y较慢）
  MOV [x], 1         → MOV R1, [y]
  MOV R1, [y]        → MOV [x], 1
  ```

#### **2. 编译器指令重排**
- **目标**：减少指令级并行（ILP）限制，优化寄存器分配和缓存局部性。
- **机制**：
  - **编译器优化阶段**：在生成机器码前，对中间表示（IR）进行指令重排。
  - **依赖分析**：仅对无数据依赖的指令重排（如`x=1`和`r1=y`若无关则可交换）。
- **示例**：
  ```c
  // 源代码            // 优化后代码
  x = 1;             → r1 = y;
  r1 = y;            → x = 1;
  ```

---

### **二、多线程环境下的风险**
#### **1. 内存可见性问题**
- **现象**：线程A写入变量`x`后读取`y`，线程B可能先观察到`y`的读取结果，后观察到`x`的写入。
- **示例**：
  ```c
  // 线程A            // 线程B
  x = 1;             → if (x == 1) {
  r1 = y;              // 可能看到x=1但r1仍为旧值y
                      }
  ```

#### **2. 违反直觉的执行顺序**
- **案例**：单例模式的双重检查锁定（DCLP）失效：
  ```java
  if (instance == null) {          // 第一次检查
    synchronized (lock) {
      if (instance == null) {      // 第二次检查
        instance = new Singleton(); // 可能因重排序导致其他线程访问到未初始化对象
      }
    }
  }
  ```

---

### **三、解决方案：内存屏障与内存模型**
#### **1. 内存屏障（Memory Barrier）**
- **作用**：禁止特定类型的指令重排，确保内存操作的可见性。
- **类型**：
  - **写屏障（Store Barrier）**：确保屏障前的所有写操作在屏障后的写操作之前完成。
  - **读屏障（Load Barrier）**：确保屏障后的读操作在屏障前的读操作之后执行。
  - **全屏障（Full Barrier）**：同时约束读写操作顺序。

#### **2. 高级语言中的同步机制**
- **C/C++**：
  - **`volatile`关键字**（有限作用，不保证原子性）：
    ```c
    volatile int x; // 禁止编译器重排对x的访问，但CPU仍可能乱序执行
    ```
  - **原子操作与内存序**（C11/C++11）：
    ```cpp
    std::atomic<int> x;
    x.store(1, std::memory_order_release); // 写操作，禁止重排到后续操作之后
    ```
  - **内存屏障指令**（平台相关）：
    ```c
    __asm__ __volatile__("mfence" ::: "memory"); // x86全屏障
    ```

- **Java**：
  - **`volatile`变量**：禁止指令重排，保证可见性。
  - **`synchronized`块**：隐式插入屏障，确保锁内操作的顺序。
  - **`java.util.concurrent`原子类**：基于CAS实现无锁同步。

#### **3. 内存模型（Memory Model）**
- **强顺序模型（如x86 TSO）**：
  - 保证写操作的全局顺序，但仍需屏障处理StoreLoad重排序。
- **弱顺序模型（如ARM/Power）**：
  - 允许更多类型的重排，需显式使用屏障指令。

---

### **四、开发者应对策略**
1. **避免过度优化**：在并发代码中谨慎使用低层级优化。
2. **依赖高级抽象**：优先使用线程安全的数据结构（如`ConcurrentHashMap`）。
3. **理解语言内存模型**：明确不同同步原语的语义（如C++的`memory_order`）。
4. **测试与验证**：通过工具（如TSan、JConsole）检测数据竞争和内存问题。

---

### **五、示例：DCLP问题的修正**
```java
// 修正后的双重检查锁定（Java）
private volatile static Singleton instance;

public static Singleton getInstance() {
    if (instance == null) {
        synchronized (Singleton.class) {
            if (instance == null) {
                instance = new Singleton(); // volatile禁止初始化与对象引用的重排序
            }
        }
    }
    return instance;
}
```

---

### **总结**
指令重排序是计算机系统提升性能的核心手段，但在多线程编程中需通过内存屏障、原子操作和同步机制约束其影响。理解底层原理与高层抽象的结合，是编写高效、正确并发代码的关键。


## 字节序（Byte Order）

在不同的计算机体系结构中，对于数据（比特、字节、字）等的存储和传输机制有所不同，因而引发了计算机领域中一个潜在但是又很重要的问题，即通信双方交流的信息单元应该以什么样的顺序进行传送。如果达不成一致的规则，计算机的通信与存储将会无法进行。目前在各种体系的计算机中通常采用的字节存储机制主要有两种：大端（Big-endian）和小端（Little-endian）。

首先让我们来定义两个概念：

MSB是Most Significant Bit/Byte的首字母缩写，通常译为最重要的位或最重要的字节。它通常用来表明在一个bit序列（如一个byte是8个bit组成的一个序列）或一个byte序列（如word是两个byte组成的一个序列）中对整个序列取值影响最大的那个bit/byte。

LSB是Least Significant Bit/Byte的首字母缩写，通常译为最不重要的位或最不重要的字节。它通常用来表明在一个bit序列（如一个byte是8个bit组成的一个序列）或一个byte序列（如word是两个byte组成的一个序列）中对整个序列取值影响最小的那个bit/byte。


比如一个十六进制的整数0x12345678里面：

0x12就是MSB（Most Significant Byte），0x78就是LSB（Least Significant Byte）。而对于0x78这个字节而言，它的二进制是01111000，那么最左边的那个0就是MSB（Most Significant Bit），最右边的那个0就是LSB（Least Significant）。

Big-endian 和 little-endian的区别就是bit-endian规定MSB在存储时放在低地址，在传输时MSB放在流的开始；LSB存储时放在高地址，在传输时放在流的末尾。little-endian则相反。

Little-Endian主要用于我们现在的PC的CPU中，即Intel的x86系列兼容机；Big-Endian则主要应用在目前的Mac机器中，一般指PowerPC系列处理器。

另外值得一提的是，目前的TCP/IP网络及Java虚拟机的字节序都是Big-endian的。这意味着如果通过网络传输0x12345678这个整形变量，首先被发送的应该是0x12，接着是0x34，然后是0x56，最后是0x78。所以我们的程序在处理网络流的时候，必须注意字节序的问题。

## 字节序

字节序（Byte Order）是指在存储或传输多字节数据时，字节的排列顺序。它决定了数据的高位字节和低位字节在内存中的存放位置。字节序主要分为两种：**大端序（Big-Endian）**和**小端序（Little-Endian）**。以下是它们的区别及实际应用中的区分方法：

---

### **一、字节序的定义**
#### 1. **大端序（Big-Endian）**
- **高位字节在前，低位字节在后**。
- 数据的高位字节（Most Significant Byte, MSB）存储在低地址，低位字节（Least Significant Byte, LSB）存储在高地址。
- **示例**：  
  32 位整数 `0x12345678` 的存储方式（地址从低到高）：  
  `0x12` | `0x34` | `0x56` | `0x78`

#### 2. **小端序（Little-Endian）**
- **低位字节在前，高位字节在后**。
- 数据的低位字节（LSB）存储在低地址，高位字节（MSB）存储在高地址。
- **示例**：  
  32 位整数 `0x12345678` 的存储方式（地址从低到高）：  
  `0x78` | `0x56` | `0x34` | `0x12`

---

### **二、字节序的常见应用场景**
| **场景**               | **常用字节序**       | **说明**                                                                 |
|------------------------|--------------------|--------------------------------------------------------------------------|
| **Intel/AMD x86 CPU**  | 小端序              | 现代个人计算机的主流架构。                                                |
| **网络传输（TCP/IP）** | 大端序（网络字节序） | 统一使用大端序确保跨平台兼容性，需用 `htonl`/`ntohl` 转换。               |
| **ARM CPU**            | 可配置（通常小端序） | 默认小端序，但支持切换为大端序。                                          |
| **Java 虚拟机**        | 大端序              | 数据存储和网络通信均采用大端序。                                          |

---

### **三、如何区分字节序？**
#### **方法 1：编程检测（C 语言示例）**
通过检查多字节数据在内存中的存储顺序：
```c
#include <stdio.h>

int main() {
    int num = 0x12345678;
    unsigned char *byte = (unsigned char *)#
    
    printf("字节序测试（0x%x）：\n", num);
    for (int i = 0; i < sizeof(num); i++) {
        printf("地址 %p: 0x%02x\n", &byte[i], byte[i]);
    }
    
    // 判断逻辑
    if (byte[0] == 0x78) {
        printf("小端序（Little-Endian）\n");
    } else if (byte[0] == 0x12) {
        printf("大端序（Big-Endian）\n");
    }
    
    return 0;
}
```
**输出示例**（小端序系统）：
```
字节序测试（0x12345678）：
地址 0x7ffeefbcd5cc: 0x78
地址 0x7ffeefbcd5cd: 0x56
地址 0x7ffeefbcd5ce: 0x34
地址 0x7ffeefbcd5cf: 0x12
小端序（Little-Endian）
```

#### **方法 2：使用联合体（Union）**
利用联合体共享内存的特性：
```c
#include <stdio.h>

union EndianTest {
    int num;
    char bytes[4];
};

int main() {
    union EndianTest test;
    test.num = 0x12345678;
    
    if (test.bytes[0] == 0x78) {
        printf("小端序\n");
    } else {
        printf("大端序\n");
    }
    
    return 0;
}
```

---

### **四、字节序的实际影响**
1. **文件与网络通信**  
   跨平台传输数据时，需统一字节序（如网络协议使用大端序）。  
   **工具函数**：  
   - `htonl()` / `htons()`：将主机字节序转为网络字节序（大端序）。  
   - `ntohl()` / `ntohs()`：将网络字节序转回主机字节序。

2. **二进制文件解析**  
   读取二进制文件（如图像、音频）时，需按文件的字节序解析数据。

3. **硬件寄存器操作**  
   嵌入式开发中，外设寄存器可能需要特定字节序的读写。

---

### **五、总结**
- **大端序**：人类可读性强（类似书写顺序），多用于网络协议和部分处理器（如 PowerPC）。  
- **小端序**：硬件实现简单，适合逐字节处理（如 Intel/AMD CPU）。  
- **区分方法**：通过编程检查内存布局或使用联合体快速判断。  
- **应对策略**：  
  - 网络通信时强制使用大端序。  
  - 跨平台数据传输时显式声明字节序。  
  - 使用标准库函数（如 `memcpy`）避免直接操作字节。

理解字节序是处理底层数据、网络协议和跨平台兼容性的基础，尤其在逆向工程和嵌入式开发中至关重要。


## 列举ELF文件中的常用段

ELF（Executable and Linkable Format）文件是Unix/Linux系统中可执行文件、共享库和目标代码的标准格式。其核心结构由多个段（Sections）组成，每个段承载特定类型的数据。以下是ELF文件中常用段及其作用的详细分类说明：

---

### **一、代码与数据段**
| 段名         | 存储内容                                | 权限       | 典型场景                     |
|--------------|---------------------------------------|------------|----------------------------|
| **.text**    | 可执行代码（机器指令）                 | `r-x`      | 函数实现、程序逻辑           |
| **.data**    | 已初始化的全局变量/静态变量            | `rw-`      | 全局计数器、配置参数         |
| **.bss**     | **未初始化**的全局变量/静态变量        | `rw-`      | 缓冲区、动态分配前的占位空间 |
| **.rodata**  | 只读数据（常量字符串、const全局变量）  | `r--`      | 错误消息、格式化字符串       |

**示例**：
- `.text`：存放 `main()` 函数的指令序列。
- `.data`：`int initialized_var = 42;`。
- `.bss`：`char buffer[1024];`（未显式初始化）。
- `.rodata`：`const char* GREETING = "Hello";`。

---

### **二、符号与链接信息段**
| 段名           | 作用                                     | 工具依赖       |
|----------------|----------------------------------------|----------------|
| **.symtab**    | 符号表（函数/变量名、地址、类型）        | `readelf -s`   |
| **.strtab**    | 符号名称字符串表（供.symtab使用）        | `objdump -x`   |
| **.dynsym**    | 动态链接符号表（导出/导入符号）          | `ldd`          |
| **.dynamic**   | 动态链接信息（依赖库、PLT/GOT地址）      | `readelf -d`   |
| **.rel.text**  | 代码段重定位信息（地址修正）             | 链接器内部使用 |
| **.rel.data**  | 数据段重定位信息（地址修正）             | 链接器内部使用 |

**示例**：
- `.symtab`：记录 `printf` 的函数地址和类型。
- `.dynamic`：列出依赖的共享库（如 `libc.so.6`）。

---

### **三、动态链接相关段**
| 段名         | 功能描述                                  | 内存映射      |
|--------------|-----------------------------------------|---------------|
| **.plt**     | 过程链接表（Procedure Linkage Table）   | 延迟绑定跳板   |
| **.got**     | 全局偏移表（Global Offset Table）       | 动态地址重定向 |
| **.got.plt** | PLT专用的GOT（存储动态库函数实际地址）   | 配合PLT使用    |

**动态链接流程**：
1. 调用 `printf@plt` → 2. 跳转至 `.got.plt` 中的地址 → 3. 首次调用触发动态解析 → 4. 更新 `.got.plt` 为真实地址。

---

### **四、调试与元信息段**
| 段名           | 用途                                     | 工具示例       |
|----------------|----------------------------------------|----------------|
| **.debug**     | DWARF格式调试信息（行号、变量类型）      | `gdb`          |
| **.line**      | 源码行号与机器码的映射                   | `addr2line`    |
| **.comment**   | 编译器/链接器版本信息                    | `readelf -p`   |
| **.note**      | 系统或工具特定的元数据（如ABI版本）       | 内核加载器使用 |

**示例**：
- `.debug`：允许GDB显示变量值和源码上下文。
- `.comment`：记录 `GCC: (Ubuntu 11.4.0) 11.4.0`。

---

### **五、初始化与终止段**
| 段名         | 执行时机                     | 内容示例                     |
|--------------|----------------------------|----------------------------|
| **.init**    | 程序启动时（main之前）      | 全局构造函数、C++静态初始化 |
| **.fini**    | 程序退出时（main之后）      | 全局析构函数、资源清理       |
| **.ctors**   | C++全局对象构造函数表       | `__attribute__((constructor))` |
| **.dtors**   | C++全局对象析构函数表       | `__attribute__((destructor))`  |

**执行顺序**：
1. `.init` → 2. `main()` → 3. `.fini`。

---

### **六、其他实用段**
| 段名           | 功能                               | 查看命令          |
|----------------|----------------------------------|------------------|
| **.eh_frame**  | 异常处理帧信息（用于栈展开）       | `readelf -wf`    |
| **.interp**    | 动态链接器路径（如 `/lib64/ld-linux-x86-64.so.2`） | `readelf -p .interp` |
| **.hash**      | 符号哈希表（加速符号查找）          | 链接优化          |

---

### **七、工具操作示例**
1. **查看所有段头信息**：
   ```bash
   readelf -S a.out
   ```
2. **提取特定段内容**：
   ```bash
   objcopy --dump-section .text=text.bin a.out
   ```
3. **分析动态链接信息**：
   ```bash
   ldd a.out  # 显示依赖库
   readelf -d a.out | grep NEEDED  # 直接查看.dynamic段
   ```

---

### **总结**
- **核心段**：`.text`（代码）、`.data`（初始化数据）、`.bss`（未初始化数据）构成程序基础。
- **动态链接**：`.plt`、`.got`、`.dynamic` 支撑共享库的高效加载。
- **调试与元数据**：`.debug`、`.symtab` 助力逆向工程和问题排查。

通过理解ELF段结构，可深入掌握程序的内存布局、链接过程及性能优化（如通过 `-ffunction-sections` 减少代码体积）。


## simplesection.o

```
readelf -h simplesection.o      
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00 
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              REL (Relocatable file)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x0
  Start of program headers:          0 (bytes into file)
  Start of section headers:          1048 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           0 (bytes)
  Number of program headers:         0
  Size of section headers:           64 (bytes)
  Number of section headers:         14
  Section header string table index: 13


readelf -S simplesection.o
There are 14 section headers, starting at offset 0x418:

Section Headers:
  [Nr] Name              Type             Address           Offset    Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000  0000000000000000  0000000000000000           0     0     0
  [ 1] .text             PROGBITS         0000000000000000  00000040  0000000000000062  0000000000000000  AX       0     0     1
  [ 2] .rela.text        RELA             0000000000000000  000002f8  0000000000000078  0000000000000018   I      11     1     8
  [ 3] .data             PROGBITS         0000000000000000  000000a4  0000000000000008  0000000000000000  WA       0     0     4
  [ 4] .bss              NOBITS           0000000000000000  000000ac  0000000000000008  0000000000000000  WA       0     0     4
  [ 5] .rodata           PROGBITS         0000000000000000  000000ac  0000000000000004  0000000000000000   A       0     0     1
  [ 6] .comment          PROGBITS         0000000000000000  000000b0  000000000000002c  0000000000000001  MS       0     0     1
  [ 7] .note.GNU-stack   PROGBITS         0000000000000000  000000dc  0000000000000000  0000000000000000           0     0     1
  [ 8] .note.gnu.pr[...] NOTE             0000000000000000  000000e0  0000000000000020  0000000000000000   A       0     0     8
  [ 9] .eh_frame         PROGBITS         0000000000000000  00000100  000000000000058   0000000000000000   A       0     0     8
  [10] .rela.eh_frame    RELA             0000000000000000  00000370  0000000000000030  0000000000000018   I      11     9     8
  [11] .symtab           SYMTAB           0000000000000000  00000158  0000000000000138  0000000000000018          12     8     8
  [12] .strtab           STRTAB           0000000000000000  00000290  0000000000000061  0000000000000000           0     0     1
  [13] .shstrtab         STRTAB           0000000000000000  000003a0  0000000000000074  0000000000000000           0     0     1


objdump -h simplesection.o      

simplesection.o:     file format elf64-x86-64

Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .text         00000062  0000000000000000  0000000000000000  00000040  2**0
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
  1 .data         00000008  0000000000000000  0000000000000000  000000a4  2**2
                  CONTENTS, ALLOC, LOAD, DATA
  2 .bss          00000008  0000000000000000  0000000000000000  000000ac  2**2
                  ALLOC
  3 .rodata       00000004  0000000000000000  0000000000000000  000000ac  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  4 .comment      0000002c  0000000000000000  0000000000000000  000000b0  2**0
                  CONTENTS, READONLY
  5 .note.GNU-stack 00000000  0000000000000000  0000000000000000  000000dc  2**0
                  CONTENTS, READONLY
  6 .note.gnu.property 00000020  0000000000000000  0000000000000000  000000e0  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  7 .eh_frame     00000058  0000000000000000  0000000000000000  00000100  2**3
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA
```


## 上面是ubuntu 64位操作系统的目标文件和链接文件，帮我详细解释里面的汇编命令。

以下是针对你提供的目标文件和可执行文件汇编代码的详细解析，我会从关键指令、内存操作和链接过程三个维度进行分析：

---

### 一、核心代码段分析（`.text`）

#### 1. **a.o (未链接)**
```asm
0000000000000000 <main>:
   c:	c7 45 fc 64 00 00 00 	movl   $0x64,-0x4(%rbp)    ; 局部变量 int a = 100（0x64）
  13:	48 8d 45 fc          	lea    -0x4(%rbp),%rax     ; 将a的地址存入rax
  17:	48 8d 15 00 00 00 00 	lea    0x0(%rip),%rdx      ; 加载shared地址（未解析，占位0）
  24:	e8 00 00 00 00       	call   2e <main+0x2e>      ; 调用swap（未解析，占位0）
```

#### 2. **b.o (未链接)**
```asm
0000000000000000 <swap>:
  10:	48 8b 45 f8          	mov    -0x8(%rbp),%rax     ; 取第一个参数指针（int *x）
  14:	8b 10                	mov    (%rax),%edx         ; 读取x的值到edx
  16:	48 8b 45 f0          	mov    -0x10(%rbp),%rax    ; 取第二个参数指针（int *y）
  1a:	8b 00                	mov    (%rax),%eax         ; 读取y的值到eax
  1c:	31 c2                	xor    %eax,%edx           ; edx = x ^ y
  22:	89 10                	mov    %edx,(%rax)         ; *x = x ^ y（异或交换法）
```

#### 3. **ab (已链接)**
```asm
0000000000401000 <main>:
  401017:	48 8d 15 e2 2f 00 00 	lea    0x2fe2(%rip),%rdx   ; shared地址 = rip+0x2fe2 → 0x404000
  401029:	e8 07 00 00 00       	call   401035 <swap>        ; 调用swap（地址已解析）
```

---

### 二、关键指令详解

#### 1. **栈帧管理**
```asm
push %rbp                ; 保存旧的栈基址
mov %rsp,%rbp            ; 新栈基址 = 当前栈顶
sub $0x10,%rsp           ; 在栈上分配 16 字节空间（局部变量）
leave                    ; 等价于 mov %rbp,%rsp; pop %rbp（清理栈帧）
```

#### 2. **数据存取**
- `movl $0x64,-0x4(%rbp)`  
  将立即数 100 存入 `rbp-4` 地址（4字节，对应局部变量 `int a`）
- `lea -0x4(%rbp),%rax`  
  计算 `rbp-4` 的有效地址（即变量 `a` 的地址），存入 `rax`

#### 3. **函数调用**
- `call 401035 <swap>`  
  跳转到地址 `0x401035`（swap函数入口），同时将返回地址（`0x40102e`）压栈

#### 4. **异或交换算法**
```asm
; 输入：x在edx，y在eax
xor %eax,%edx    ; edx = x ^ y
mov %edx,(%rax)  ; *x = x ^ y（此时 *x 存的是 x^y，*y 仍为原始值）
xor %eax,%edx    ; edx = (x^y) ^ y = x
mov %edx,(%rax)  ; *y = x
xor %eax,%edx    ; edx = x ^ x = 0（此代码块可能有冗余）
```

---

### 三、重定位与符号解析

#### 1. **重定位类型**
- **R_X86_64_PC32**  
  用于 `shared` 变量的引用，计算方式：`目标地址 - 下一条指令地址`
- **R_X86_64_PLT32**  
  用于 `swap` 函数调用，PLT（Procedure Linkage Table）实现延迟绑定

#### 2. **符号表解析**
```plaintext
Symbol table '.symtab' contains 6 entries:
  5: 0000000000000000     0 NOTYPE  GLOBAL DEFAULT  UND swap
```
- `UND` 表示 `swap` 在 a.o 中是未定义符号，需在链接时解析
- 在最终可执行文件 `ab` 中，`swap` 被定位到 `0x401035`

#### 3. **地址计算示例**
```asm
lea 0x2fe2(%rip),%rdx   ; 运行时 rip = 0x40101e → 0x40101e + 0x2fe2 + 7 = 0x404000
```
- `rip` 相对寻址实现位置无关代码（PIC）
- `shared` 变量被分配到数据段地址 `0x404000`

---

### 四、内存布局总结
| 地址范围        | 内容               | 说明                     |
|----------------|--------------------|-------------------------|
| `0x401000`     | main函数代码       | .text 段起始            |
| `0x401035`     | swap函数代码       | 紧接 main 函数          |
| `0x404000`     | shared变量         | .data 或 .bss 段        |

---

### 五、完整执行流程
1. **main函数**
   - 在栈上分配空间 → 初始化局部变量 `a = 100`
   - 获取 `a` 和 `shared` 的地址作为参数
   - 调用 `swap` 函数

2. **swap函数**
   - 通过三次异或操作交换 `*x` 和 `*y` 的值
   - 返回 main 函数

3. **退出**
   - main 返回 0（`mov $0x0,%eax`）
   - 恢复栈帧并退出（`leave; ret`）

---

### 六、调试技巧
1. **查看内存内容**  
   ```bash
   gdb -batch -ex "x/xw 0x404000" ab  # 查看shared变量值
   ```
2. **单步跟踪**  
   ```bash
   gdb ab
   (gdb) break main
   (gdb) run
   (gdb) stepi
   ```
3. **反汇编验证**  
   ```bash
   objdump -d -M intel ab | grep -A20 "<main>:"
   ```

掌握这些细节后，你可以更深入理解编译链接过程、函数调用约定和底层内存操作机制。

## 链接器提供的默认链接规则是指什么？  有什么作用？

好的，我现在需要理解链接器提供的默认链接规则是什么以及它们的作用。首先，链接器是做什么的？链接器的主要任务是将多个目标文件（.o文件）和库文件合并成一个可执行文件或共享库。在链接过程中，链接器需要处理符号解析、地址分配、重定位等任务。

用户的问题是关于“默认链接规则”，也就是链接器在没有用户指定特定指令的情况下，按照哪些规则来链接目标文件。这些规则的作用是什么？

首先，我应该回忆一下链接过程的基本步骤。链接器需要将各个目标文件中的段（如.text、.data、.bss）合并，解析各个目标文件中的符号引用，确定每个符号的最终地址，处理重定位条目，解决符号之间的依赖关系，最终生成可执行文件或共享库。

默认链接规则可能包括如何处理这些段，如何解析未定义的符号，如何处理库文件的链接顺序，如何处理重复符号等等。例如，链接器可能会按照输入文件在命令行中的顺序来处理符号解析，先出现的文件中的符号可能会覆盖后面的？或者可能有一些默认的库搜索路径？

另外，需要考虑不同操作系统和平台下的链接器可能有不同的默认规则。例如，GNU的ld链接器和Windows的链接器可能有所不同。但用户的问题没有特别指定操作系统，可能默认是类Unix系统，比如使用GNU工具链的情况。

默认链接规则的作用可能是为了简化用户的操作，让用户在大多数情况下不需要手动指定复杂的链接选项，链接器能够自动处理常见的链接任务。例如，自动包含标准的C库，自动合并相同类型的段，处理静态库和动态库的依赖关系等。

可能的默认规则包括：

1. 输入文件的顺序影响符号解析：命令行中先出现的库或目标文件中的符号会被优先使用。

2. 自动包含标准库：例如，在链接C程序时，自动链接libc.so。

3. 段合并规则：将各个目标文件的.text段合并到可执行文件的.text段，.data段合并到.data段等。

4. 处理未定义符号：默认情况下，未解析的符号会导致链接错误，除非在共享库或静态库中找到定义。

5. 静态库和共享库的链接顺序：链接器可能会在静态库和共享库之间有不同的处理方式，比如优先使用共享库。

6. 入口点设置：默认入口点可能是_start或main，取决于运行时库。

7. 动态链接信息：生成动态段，以便在运行时加载共享库。

需要验证这些规则是否正确。例如，输入文件的顺序确实会影响符号解析，因为链接器在遇到未解析的符号时，会向后查找后续文件中的定义。如果先链接的目标文件中有未定义的符号，链接器会在之后的目标文件和库中查找。而库通常需要按照依赖顺序排列，被依赖的库放在后面。

另外，默认情况下，GNU链接器会将所有目标文件中的未解析符号进行解析，如果找不到定义则报错。而库文件（.a或.so）中的符号只有在被引用时才会被包含进来，这涉及到链接器如何处理库的链接。

关于段合并，链接器通常会将同名段合并，例如将所有目标文件的.text段合并到输出文件的.text段，并按顺序排列各输入文件的段内容。

默认的库搜索路径也是链接器默认规则的一部分，例如在Linux下，链接器会搜索/usr/lib、/lib等目录中的库文件。

总结来说，链接器的默认链接规则包括如何处理输入文件中的段、符号解析的顺序、库的链接方式、默认包含的库、入口点设置等，这些规则的作用是让链接过程在大多数情况下无需用户过多干预即可正确生成可执行文件，同时保证代码和数据的正确布局和符号解析。

可能的错误点：

- 是否默认包含标准库？例如，使用gcc链接时会自动链接libc，但直接使用ld可能需要用户指定。

- 输入文件顺序的具体影响，比如库和目标文件的顺序是否不同？

- 入口点的默认设置是否由链接器决定，还是由运行时库提供？

需要确认这些细节，以确保回答准确。

---

链接器的默认链接规则是指在未指定详细链接选项时，链接器自动遵循的一组标准处理逻辑，用于合并代码段、解析符号、处理库依赖和生成可执行文件。这些规则的作用是简化开发流程，确保代码和数据的正确布局。以下是其核心规则和作用：

---

### **一、默认链接规则详解**

#### 1. **输入文件顺序影响符号解析**
- **规则**：  
  链接器按命令行中文件的**出现顺序**处理目标文件和库。  
  - **目标文件（.o）**：始终被完整链接到输出文件。  
  - **库文件（.a/.so）**：仅包含被引用符号所在的模块（`.a`为静态库，`.so`为动态库）。  
- **示例**：  
  ```bash
  # 若 main.o 调用 libmath.a 的函数，库需放在 main.o 之后
  ld main.o -lmath -o app    # ✅ 正确
  ld -lmath main.o -o app    # ❌ 错误：libmath 在 main.o 前，无法解析符号
  ```

#### 2. **段（Section）合并规则**
- **同名段合并**：  
  所有输入文件的 `.text`、`.data`、`.bss` 等段按顺序合并到输出文件的对应段。  
  - **静态变量**：不同文件中的同名静态变量不会冲突（因作用域隔离）。  
  - **全局变量/函数**：同名符号会导致重复定义错误（需 `static` 或 `extern` 修饰）。

#### 3. **符号解析规则**
- **强符号优先**：  
  - **强符号**：已初始化的全局变量（如 `int x = 5;`）和函数。  
  - **弱符号**：未初始化的全局变量（如 `int x;`）。  
  强符号覆盖弱符号，多个强符号冲突时报错。  
- **动态库覆盖静态库**：  
  若同时存在静态库（`.a`）和动态库（`.so`），默认优先链接动态库。

#### 4. **默认包含标准库**
- **C 标准库**：  
  使用 `gcc` 链接时自动包含 `libc.so`（动态）或 `libc.a`（静态），无需手动指定。  
  - **直接调用 `ld`**：需显式指定 `-lc` 或路径（如 `/usr/lib/x86_64-linux-gnu/libc.so`）。

#### 5. **入口点（Entry Point）**
- **默认入口**：  
  通常为 `_start`（由运行时库提供，如 `glibc` 的 `crt0.o`），最终调用 `main` 函数。  
  - **自定义入口**：可通过 `-e` 参数指定（如 `-e my_entry`）。

#### 6. **动态链接信息生成**
- **动态段（.dynamic）**：  
  记录依赖的共享库（如 `libc.so.6`）和重定位信息，供加载器在运行时解析。

---

### **二、默认规则的作用**

#### 1. **简化开发流程**
- **自动处理依赖**：无需手动指定所有依赖库（如 `libc` 自动链接）。  
- **段合并透明化**：开发者无需关注代码/数据的内存布局细节。

#### 2. **保证正确性**
- **符号冲突检测**：防止重复定义全局变量或函数。  
- **未定义符号报错**：避免运行时因缺失符号导致的崩溃。

#### 3. **优化输出文件**
- **消除未使用代码**：静态库中未被引用的模块不链接到最终文件，减小体积。  
- **地址空间布局随机化（ASLR）**：动态库加载时随机化基址，增强安全性。

#### 4. **跨平台兼容**
- **ABI 一致性**：默认规则适配目标平台的调用约定（如 x86-64 的 System V ABI）。  
- **库搜索路径**：自动搜索标准目录（如 `/usr/lib`、`/lib`）。

---

### **三、默认规则的覆盖与调试**

#### 1. **自定义链接脚本**
- **修改段布局**：  
  通过编写链接脚本（`.ld` 文件）控制内存地址、段顺序和符号位置。  
  ```bash
  ld -T custom.lds main.o -o app
  ```

#### 2. **显式指定库和符号**
- **强制静态链接**：  
  ```bash
  gcc main.c -static -o app    # 静态链接所有库（包括 libc）
  ```
- **忽略未定义符号**（危险！）：  
  ```bash
  ld --unresolved-symbols=ignore-all main.o -o app
  ```

#### 3. **调试工具**
- **查看链接过程**：  
  ```bash
  gcc -v main.c -o app     # 显示详细的链接命令和库路径
  ```
- **分析符号依赖**：  
  ```bash
  ldd app                  # 查看动态库依赖
  nm app | grep ' main'    # 查看 main 符号状态
  ```

---

### **四、总结**
链接器的默认规则通过标准化处理输入文件、符号和段，平衡了易用性与正确性，使开发者能专注于业务逻辑。理解这些规则有助于解决链接错误（如未定义符号）、优化程序体积（裁剪未用代码）和定制高级内存布局（如嵌入式系统开发）。


## 汇编代码

<think>
好的，我需要解释用户提供的这段汇编代码。首先，我会通读代码，了解整体的结构和功能。这段代码是用C语言和内联汇编编写的，看起来像是一个简单的Linux系统调用程序。

首先，用户定义了一个全局字符串char* str = "Hello world!\n";，然后在print函数中使用内联汇编进行系统调用来打印这个字符串。接着exit函数通过系统调用退出程序，返回状态码42。nomain函数依次调用print和exit，而这里的主函数是nomain，而不是常见的main，这可能涉及到链接器的入口点设置。

接下来，我需要确认每个系统调用的参数是否正确。在Linux中，write系统调用的编号是4，exit是1。print函数中的汇编代码将参数设置到寄存器：edx是字符串长度，ecx是字符串指针，ebx是文件描述符（stdout是0），eax是系统调用号。检查这些值是否正确，尤其是字符串长度是否正确。用户这里用了13，但实际字符串"Hello world!\n"的长度是13个字符（包括换行和空终止符？需要确认是否正确，因为通常strlen会返回12，但可能用户把空字符也算进去了）。

然后，exit函数设置ebx为42，eax为1，触发exit系统调用，这应该会让程序退出并返回状态码42。这部分看起来没问题。

用户可能的问题包括：为什么使用nomain而不是main？需要解释入口点的设置。另外，内联汇编的语法是否正确，尤其是clobber列表和输入操作数的使用。在print函数的汇编代码中，用户使用了输入约束"r"(str)，这会将str的地址放入一个寄存器，然后mov到ecx。clobber列表列出了edx、ecx、ebx，告诉编译器这些寄存器被修改了，这样编译器在生成代码时会保存这些寄存器的值。

此外，检查字符串的长度是否正确。"Hello world!\n"有12个字符，加上结尾的换行是13个字节吗？是的，H-e-l-l-o-空格-w-o-r-l-d-!-\n，共13个字符，所以edx设为13是对的。

最后，用户可能想知道如何编译和运行这段代码，是否需要特殊的编译选项，比如指定入口点，因为主函数是nomain而不是main。通常，GCC的链接器默认入口点是_start，但用户代码中没有定义，但这里可能nomain被作为入口点。需要使用gcc的-e选项指定入口函数，或者修改代码使用main作为函数名。

总结起来，这段代码通过内联汇编直接调用Linux系统调用打印字符串并退出，使用了非标准的入口函数名，可能需要特殊编译指令。需要解释每个部分的作用，系统调用的参数设置，以及编译运行的方法。

</think>

这段代码是一个直接通过Linux系统调用（不使用C标准库）在控制台输出字符串“Hello world!\n”并退出的程序。其核心逻辑通过内联汇编实现，以下是逐部分解析：

---

### **一、代码结构与功能概览**
1. **全局变量定义**：
   ```c
   char* str = "Hello world!\n";  // 定义字符串常量（存储在.rodata只读数据段）
   ```
2. **函数定义**：
   - `print()`：通过`write`系统调用输出字符串。
   - `exit()`：通过`exit`系统调用终止程序，返回状态码`42`。
   - `nomain()`：替代传统`main`函数，作为程序入口调用`print`和`exit`。

---

### **二、内联汇编详解**
#### **1. `print()`函数**
```c
asm( 
    "movl $13,%%edx \n\t"  // 字符串长度：13字节（"Hello world!\n"含换行符和终止符）
    "movl %0,%%ecx  \n\t"  // 字符串地址（通过%0占位符传递str的地址）
    "movl $0,%%ebx  \n\t"  // 文件描述符：0表示标准输出（stdout）
    "movl $4,%%eax  \n\t"  // 系统调用号：4（sys_write）
    "int $0x80      \n\t"  // 触发软中断执行系统调用
    ::"r"(str)             // 输入约束：将str的地址存入任意通用寄存器（如EAX）
    :"edx","ecx","ebax"    // Clobber列表：告知编译器这些寄存器会被修改
);
```
- **系统调用参数**：
  | 寄存器 | 值          | 作用               |
  |--------|-------------|--------------------|
  | `EAX`  | `4`         | 系统调用号（write）|
  | `EBX`  | `0`         | 文件描述符（stdout）|
  | `ECX`  | `str`地址   | 字符串指针         |
  | `EDX`  | `13`        | 字符串长度         |

- **关键细节**：
  - **字符串长度**：`"Hello world!\n"`包含12个可见字符和1个换行符（`\n`），总计13字节。
  - **输入约束`"r"(str)`**：编译器自动选择一个寄存器（如`EAX`）存储`str`的地址，`%0`引用该寄存器。
  - **Clobber列表**：声明`edx`、`ecx`、`ebx`被修改，防止编译器错误优化。

#### **2. `exit()`函数**
```c
asm( 
    "movl $42,%ebx  \n\t"  // 退出状态码：42
    "movl $1,%eax  \n\t"   // 系统调用号：1（sys_exit）
    "int $0x80     \n\t"   // 触发软中断执行系统调用
);
```
- **系统调用参数**：
  | 寄存器 | 值          | 作用               |
  |--------|-------------|--------------------|
  | `EAX`  | `1`         | 系统调用号（exit） |
  | `EBX`  | `42`        | 程序退出状态码     |

---

### **三、入口函数`nomain()`**
```c
void nomain() {  // 替代传统main函数作为入口
    print();
    exit();
}
```
- **入口点问题**：
  - 默认情况下，C程序入口是`main`函数，但此代码使用`nomain`。
  - **解决方法**：需在链接时指定入口点（如`gcc -e nomain`或修改链接脚本）。

---

### **四、编译与运行**
#### **1. 编译命令**
```bash
gcc -nostdlib -e nomain -o hello hello.c
```
- **`-nostdlib`**：禁用标准库（避免链接`libc`的初始化代码）。
- **`-e nomain`**：指定入口函数为`nomain`。

#### **2. 运行结果**
```bash
$ ./hello
Hello world!
$ echo $?  # 查看退出状态码
42
```

---

### **五、潜在问题与改进**
1. **字符串长度硬编码**：
   - 若修改字符串内容需同步调整`movl $13,%%edx`，否则输出错误。
   - **改进**：用`strlen`计算长度（需链接标准库或自行实现）。
2. **可移植性**：
   - 直接使用系统调用和软中断`int $0x80`仅适用于32位Linux。
   - **64位系统适配**：需改用`syscall`指令及64位寄存器（如`RAX`、`RDI`等）。
     ```c
     // 64位write系统调用示例
     asm(
         "mov $1,%%rax \n\t"    // syscall号1（write）
         "mov $1,%%rdi \n\t"    // fd=1（stdout）
         "mov %0,%%rsi \n\t"    // 字符串地址
         "mov $13,%%rdx \n\t"   // 长度
         "syscall      \n\t"
         ::"r"(str):"rax","rdi","rsi","rdx"
     );
     ```
3. **入口点兼容性**：
   - 更规范的做法是使用`_start`作为入口，链接时自动识别。

---

### **六、总结**
- **直接系统调用**：绕过C标准库，减少开销。
- **内联汇编注意事项**：
  - 正确传递参数和约束。
  - 明确声明被修改的寄存器（Clobber List）。
- **入口点定制**：需显式指定链接器行为。
- **适用场景**：嵌入式开发、内核模块、极简程序等对体积或性能敏感的场景。


## Windows11下 WinNT.h 文件在哪里存放？


在 Windows 11 系统中，`WinNT.h` 是 **Windows SDK（软件开发工具包）** 的一部分，通常用于底层系统编程（如驱动开发或系统级 API 调用）。以下是该文件的存放位置及管理方法：

---

### **一、默认存放路径**
`WinNT.h` 的路径取决于你安装的 **Windows SDK 版本**，典型路径如下：
```bash
C:\Program Files (x86)\Windows Kits\10\Include\<SDK版本号>\um\WinNT.h
```
- **示例**：  
  如果安装的 SDK 版本是 `10.0.19041.0`，则完整路径为：
  ```
  C:\Program Files (x86)\Windows Kits\10\Include\10.0.19041.0\um\WinNT.h
  ```

---

### **二、如何确认是否安装了 SDK？**
1. **通过文件资源管理器直接检查**：  
   打开上述路径，确认是否存在 `Windows Kits` 文件夹及子目录。

2. **通过 Visual Studio Installer 查看**：  
   - 打开 **Visual Studio Installer**（开始菜单搜索即可）。  
   - 选择已安装的 Visual Studio 版本 → 点击 **修改**。  
   - 在 **“单个组件”** 选项卡中搜索 `Windows SDK`，确认是否勾选。

3. **通过命令行工具验证**（管理员权限）：  
   ```bash
   dir "C:\Program Files (x86)\Windows Kits\10\Include" /s/b | findstr WinNT.h
   ```

---

### **三、如何安装/修复 Windows SDK？**
#### 1. **通过 Visual Studio Installer 安装**
   - 打开 **Visual Studio Installer** → 选择你的 VS 版本 → **修改**。  
   - 在 **“工作负载”** 选项卡中勾选：  
     - **使用 C++ 的桌面开发**（包含基本 SDK）。  
     - 或 **Windows 10/11 SDK**（根据需要选择版本）。  
   - 点击 **修改** 完成安装。

#### 2. **单独下载 Windows SDK**
   - 访问 [Microsoft Windows SDK 官方页面](https://developer.microsoft.com/zh-cn/windows/downloads/windows-sdk/) → 下载最新版本。  
   - 安装时勾选 **Debugging Tools** 和 **Windows Headers and Libraries**。

---

### **四、开发环境中的路径配置**
如果已安装 SDK 但编译器仍找不到 `WinNT.h`，需检查项目配置：
1. **Visual Studio**：  
   - 右键项目 → **属性** → **VC++ 目录** → **包含目录** → 添加路径：  
     ```
     C:\Program Files (x86)\Windows Kits\10\Include\<SDK版本号>\um
     ```
   - **附加依赖项**：添加 `kernel32.lib`、`user32.lib` 等（在 `\Lib\<SDK版本号>\um\<架构>` 目录下）。

2. **CMake 项目**：  
   在 `CMakeLists.txt` 中指定包含路径：
   ```cmake
   include_directories("C:/Program Files (x86)/Windows Kits/10/Include/10.0.19041.0/um")
   ```

---

### **五、常见问题解决**
#### 1. **“无法打开源文件 WinNT.h”**
   - **原因**：SDK 未安装或路径未正确配置。  
   - **解决**：按上述步骤安装 SDK 并配置包含路径。

#### 2. **版本冲突**
   - **现象**：项目要求特定 SDK 版本，但系统安装了多个版本。  
   - **解决**：在项目属性中指定正确的 SDK 版本号（如 `10.0.19041.0`）。

#### 3. **权限问题**
   - **现象**：访问 SDK 目录时被拒绝。  
   - **解决**：以管理员身份运行 IDE 或调整文件夹权限。

---

### **六、总结**
- `WinNT.h` 是 Windows 系统编程的核心头文件，需通过 **Windows SDK** 安装获取。  
- 开发前务必确认 SDK 版本与项目要求一致，并正确配置编译环境。  
- 若需跨版本兼容，可使用条件编译指令（如 `#if (NTDDI_VERSION >= NTDDI_WIN10_RS2)`）。


## 编译与链接中，未决议的符号是指什么？

在编译与链接过程中，**未决议的符号（Unresolved Symbol）** 是指代码中引用了某个函数、变量或其他标识符（如类名、全局变量等），但链接器在提供的所有目标文件（`.o`、`.obj`）和库文件（`.a`、`.lib`、`.so`、`.dll`）中 **找不到其定义**。这类问题会导致链接失败，生成的可执行文件或库无法构建。

---

### **一、未决议符号的常见表现**
链接器会报错提示未定义的引用（具体错误信息因编译器而异）：
```bash
# 示例（Linux/gcc）
undefined reference to `function_name()`

# 示例（Windows/MSVC）
error LNK2001: unresolved external symbol "void __cdecl function_name(void)" 
```

---

### **二、未决议符号的常见原因**
#### 1. **声明但未定义**
   - **函数声明了但未实现**：
     ```c
     // 声明但未定义
     void my_function();  
     
     int main() {
         my_function();  // 链接时报错：未定义符号
     }
     ```
   - **变量声明为 `extern` 但未定义**：
     ```c
     extern int global_var;  // 声明在别处定义，但实际未定义
     ```

#### 2. **目标文件或库未链接**
   - **未将包含符号定义的文件加入链接过程**：
     ```bash
     # 假设函数定义在 utils.c 中，但未链接
     gcc main.c -o app   # ❌ 报错：未找到 utils.c 中的符号
     ```

#### 3. **库依赖缺失或顺序错误**
   - **静态库链接顺序不当**：  
     链接器按顺序解析符号，若库在被引用前处理，会导致未决议。
     ```bash
     # ❌ 错误顺序（假设 main.o 依赖 libmath.a）
     gcc -lmath main.o -o app  
     
     # ✅ 正确顺序
     gcc main.o -lmath -o app
     ```

#### 4. **名称修饰（Name Mangling）问题（C++特有）**
   - **C 与 C++ 混编时未用 `extern "C"`**：  
     C++ 编译器会修改函数名（如 `func` → `_Z4funcv`），导致 C 代码无法识别。
     ```cpp
     // C++ 文件未正确声明 C 函数
     extern "C" void c_function();  // ✅ 正确方式
     ```

#### 5. **动态库路径或版本问题**
   - **运行时未找到动态库（`.so`/`.dll`）**：  
     编译时指定了库，但运行时环境变量（如 `LD_LIBRARY_PATH`）未包含库路径。

---

### **三、解决未决议符号的方法**
#### 1. **检查代码完整性**
   - 确保所有声明的函数、变量有对应的定义。
   - 检查 `extern` 变量是否在某个源文件中定义（如 `int global_var = 42;`）。

#### 2. **确认链接文件包含符号定义**
   - **添加缺失的目标文件**：
     ```bash
     gcc main.c utils.c -o app   # ✅ 链接 main.c 和 utils.c
     ```
   - **链接所需静态库**：
     ```bash
     gcc main.o -L/path/to/libs -lmath -o app
     ```

#### 3. **调整库链接顺序**
   - 按依赖顺序排列库：被依赖的库放在后面。
     ```bash
     gcc main.o -luser32 -lgdi32 -o app
     ```

#### 4. **处理名称修饰（C++）**
   - 使用 `extern "C"` 包裹 C 函数声明：
     ```cpp
     #ifdef __cplusplus
     extern "C" {
     #endif
     void c_function();
     #ifdef __cplusplus
     }
     #endif
     ```

#### 5. **配置动态库路径**
   - **Linux**：  
     设置 `LD_LIBRARY_PATH` 或修改 `/etc/ld.so.conf`。
     ```bash
     export LD_LIBRARY_PATH=/path/to/libs:$LD_LIBRARY_PATH
     ```
   - **Windows**：  
     将动态库（`.dll`）放在可执行文件目录或系统路径（如 `C:\Windows\System32`）。

---

### **四、调试工具辅助定位**
#### 1. **查看目标文件符号表**
   ```bash
   # Linux (nm 命令)
   nm -C my_object.o | grep my_function

   # Windows (dumpbin 命令)
   dumpbin /SYMBOLS my_object.obj
   ```

#### 2. **检查可执行文件依赖**
   ```bash
   # Linux（查看动态库依赖）
   ldd my_app

   # Windows（Dependency Walker 或 PowerShell）
   (Get-Item my_app.exe).VersionInfo.FileDescription
   ```

#### 3. **静态库内容分析**
   ```bash
   # Linux（ar 命令）
   ar -t libmath.a     # 查看库中包含的目标文件
   nm libmath.a        # 查看库中的符号

   # Windows（lib.exe）
   lib /LIST libmath.lib
   ```

---

### **五、总结**
未决议的符号本质是 **符号声明与定义之间的断链**。解决方法围绕以下核心：
1. **完整性检查**：确保每个被引用的符号都有定义。
2. **链接配置**：正确包含目标文件、静态库，并调整顺序。
3. **环境适配**：处理动态库路径和跨语言符号修饰。

通过系统性的排查和工具辅助，可以高效定位并解决此类问题，确保编译链接流程顺利完成。

## 编译和汇编中， 链接时重定位和装载时重定位有什么区别？ 各自应用场景是什么？

在编译和链接过程中，**链接时重定位**和**装载时重定位**是两种不同阶段的内存地址修正机制，它们的核心区别在于 **地址修正的时机** 和 **灵活性**。以下是两者的详细对比及其应用场景：

---

### **一、链接时重定位（Link-Time Relocation）**
#### **定义**  
在 **链接阶段**（生成可执行文件时），由链接器（如 `ld`）直接修改目标文件中的地址引用，使所有符号的地址指向最终确定的绝对地址。

#### **技术特点**  
- **静态地址分配**：所有符号（函数、全局变量）的地址在链接时确定，写入最终可执行文件。  
- **目标文件依赖**：需要所有目标文件和静态库（`.a`/`.lib`）在链接时提供完整符号定义。  
- **地址固定**：生成的可执行文件中的地址是硬编码的，无法在运行时改变。  

#### **重定位过程示例**  
假设两个目标文件 `main.o` 和 `utils.o`：  
1. `main.o` 中调用 `utils.o` 中的函数 `foo()`，在链接前其地址为占位符（如 `0x00000000`）。  
2. 链接器合并代码段后，确定 `foo()` 的实际地址为 `0x401000`。  
3. 将 `main.o` 中对 `foo()` 的调用地址修正为 `0x401000`，写入最终可执行文件。

#### **应用场景**  
- **静态链接的可执行文件**：直接嵌入所有依赖代码（如 Linux 的静态二进制文件）。  
- **嵌入式开发**：需要确定性的内存布局（如固件程序）。  
- **无动态库依赖的场景**：避免运行时加载外部库的开销。

#### **优缺点**  
| **优点**                     | **缺点**                     |
|------------------------------|------------------------------|
| 运行效率高（无运行时地址解析） | 可执行文件体积大（包含所有代码） |
| 内存布局确定，调试方便         | 无法共享代码（多进程重复占用内存） |
| 无需动态链接器支持             | 更新依赖库需重新编译链接       |

---

### **二、装载时重定位（Load-Time Relocation）**  
#### **定义**  
在 **程序加载到内存时**（由操作系统加载器或动态链接器处理），根据实际加载基址修正代码和数据中的地址引用。  

#### **技术特点**  
- **动态地址分配**：程序加载到内存时的基址可随机化（ASLR），符号地址在加载时计算。  
- **位置无关代码（PIC）**：代码段通过相对偏移（如 `RIP-relative` 寻址）引用数据/函数，避免绝对地址硬编码。  
- **动态库支持**：用于共享库（`.so`/`.dll`），允许多进程共享同一物理内存中的代码段。  

#### **重定位过程示例**  
1. 动态库 `libfoo.so` 被编译为位置无关代码（`-fPIC`），其内部函数地址使用相对偏移。  
2. 程序启动时，动态链接器（如 `ld-linux.so`）将 `libfoo.so` 加载到随机基址（如 `0x7f8a20000000`）。  
3. 修正程序中对 `libfoo.so` 函数的调用地址：原相对偏移 + 动态库基址 → 实际内存地址。

#### **应用场景**  
- **动态链接库（共享库）**：如 Linux 的 `.so` 或 Windows 的 `.dll`。  
- **地址空间布局随机化（ASLR）**：增强安全性，防止攻击者预测内存布局。  
- **热更新**：替换动态库文件后，重启进程即可加载新版本。  

#### **优缺点**  
| **优点**                     | **缺点**                     |
|------------------------------|------------------------------|
| 节省内存（多进程共享代码段）  | 初次加载有解析开销（影响启动速度） |
| 支持灵活的库更新和 ASLR       | 代码需编译为位置无关（可能轻微性能损失） |
| 减少可执行文件体积            | 依赖动态链接器和环境配置       |

---

### **三、核心对比总结**  
| **维度**         | **链接时重定位**                  | **装载时重定位**                  |
|------------------|----------------------------------|----------------------------------|
| **时机**         | 链接阶段（生成可执行文件时）       | 程序加载到内存时                   |
| **地址确定性**   | 绝对地址硬编码                    | 基址 + 相对偏移（动态计算）        |
| **代码要求**     | 无需特殊编译选项                  | 需编译为位置无关代码（`-fPIC`）    |
| **适用对象**     | 静态链接的可执行文件、静态库       | 动态链接库（共享库）               |
| **内存共享**     | 不支持（代码段每进程独立）         | 支持（多进程共享同一物理代码段）    |
| **安全性**       | 低（地址固定易预测）               | 高（支持 ASLR）                   |

---

### **四、实际开发中的选择建议**  
1. **选择链接时重定位**：  
   - 需要极致性能（如高频交易系统）。  
   - 目标环境无动态链接器（如嵌入式设备）。  
   - 依赖库极少变动，且代码体积不敏感。  

2. **选择装载时重定位**：  
   - 开发共享库供多进程使用（如系统 API 库）。  
   - 需要支持安全特性（如 ASLR）。  
   - 频繁更新库但不想重新编译主程序。  

---

### **五、技术演进与混合模式**  
现代操作系统和编译器常结合两种方式：  
- **延迟绑定（Lazy Binding）**：动态库函数在首次调用时解析地址（通过 `.plt`/`.got`），平衡启动速度和灵活性。  
- **部分静态链接**：主程序静态链接核心库，动态链接非关键库（如 `gcc -static-libgcc`）。  

理解这两种重定位机制，有助于优化程序性能、安全性和维护性，尤其在系统级开发和安全性要求高的场景中至关重要。


## 操作系统中的内核空间和用户空间

在操作系统中，**内核空间（Kernel Space）**和**用户空间（User Space）**是两种不同权限级别的内存区域，用于隔离操作系统内核与用户应用程序，确保系统的安全性和稳定性。以下是它们的核心区别、作用及实际影响的详细解析：

---

### **一、内核空间与用户空间的核心区别**
| **维度**         | **内核空间**                                      | **用户空间**                                      |
|------------------|-------------------------------------------------|-------------------------------------------------|
| **权限级别**      | 最高权限（如x86的Ring 0）                        | 低权限（如x86的Ring 3）                          |
| **内存访问**      | 可直接访问所有硬件和物理内存                     | 只能通过虚拟地址访问受限制的内存区域               |
| **运行代码**      | 操作系统内核、驱动程序、中断处理程序              | 普通应用程序（如浏览器、文本编辑器）               |
| **稳定性影响**    | 错误可能导致系统崩溃（如内核恐慌）                | 错误仅影响当前进程，系统可终止进程恢复              |
| **切换代价**      | 用户态→内核态需通过系统调用/中断，伴随上下文切换    | 用户态内执行无额外开销                            |

---

### **二、内存隔离的实现原理**
#### 1. **虚拟内存划分**
- **用户空间**：  
  每个进程拥有独立的虚拟地址空间（如32位系统中0x00000000–0x7FFFFFFF）。  
  - 进程无法直接访问其他进程或内核的内存。  
- **内核空间**：  
  所有进程共享内核的虚拟地址空间（如32位系统中0x80000000–0xFFFFFFFF）。  
  - 仅在CPU处于内核态时可访问。

#### 2. **硬件支持**
- **MMU（内存管理单元）**：  
  通过页表（Page Table）将虚拟地址映射到物理地址，并检查访问权限。  
  - 用户态进程访问内核页表项会触发缺页异常（Page Fault）。

---

### **三、用户空间与内核空间的交互**
#### 1. **系统调用（System Call）**
- **作用**：用户程序请求内核服务的唯一入口（如文件操作、网络通信）。  
- **流程**：  
  1. 用户程序触发软中断（如x86的`int 0x80`或`syscall`指令）。  
  2. CPU切换至内核态，执行中断处理程序。  
  3. 内核验证请求合法性并执行操作。  
  4. 返回结果并切换回用户态。

**示例**：  
```c
// 用户程序调用write()系统调用
ssize_t write(int fd, const void *buf, size_t count);
```
内核执行流程：  
1. 检查`fd`是否有效。  
2. 从用户空间复制`buf`数据到内核缓冲区（安全隔离）。  
3. 调用驱动程序将数据写入设备。  

#### 2. **上下文切换开销**
- **代价**：每次系统调用需保存/恢复寄存器状态，通常消耗数百CPU周期。  
- **优化**：  
  - **vsyscall/vDSO**：将部分频繁调用（如`gettimeofday`）映射到用户空间，避免切换。  
  - **批处理系统调用**：合并多个请求减少切换次数。

---

### **四、内核空间的职责**
#### 1. **硬件抽象与管理**
- **设备驱动**：提供统一接口（如字符设备、块设备）屏蔽硬件差异。  
- **中断处理**：响应硬件事件（如键盘输入、网络包到达）。

#### 2. **资源分配与调度**
- **进程调度**：通过调度算法（如CFS、O(1)）分配CPU时间片。  
- **内存管理**：管理物理内存、虚拟内存和交换空间（Swap）。

#### 3. **安全与隔离**
- **权限检查**：验证系统调用参数，防止越权访问（如修改其他进程内存）。  
- **命名空间**：隔离进程视图（如PID、网络、文件系统）。

---

### **五、用户空间的限制与优势**
#### 1. **限制**
- **无法直接访问硬件**：必须通过系统调用或设备文件（如`/dev/mem`）。  
- **内存隔离**：进程崩溃不会影响系统或其他进程。

#### 2. **优势**
- **开发便捷性**：应用程序无需处理底层硬件细节。  
- **安全性**：恶意程序难以破坏系统核心。

---

### **六、实际场景与影响**
#### 1. **驱动程序开发**
- **内核模块**：需在内核空间实现，直接操作硬件寄存器。  
  - **风险**：代码错误易导致内核崩溃（如空指针解引用）。  
- **用户态驱动**：通过UIO（Userspace I/O）框架减少风险，但性能较低。

#### 2. **性能敏感应用**
- **零拷贝技术**：减少用户态与内核态数据复制（如`sendfile`、`mmap`）。  
- **DPDK/SPDK**：绕过内核网络/存储栈，直接在用户态处理数据包/块设备。

#### 3. **容器与虚拟化**
- **容器**：共享宿主机内核，通过命名空间/Cgroups隔离用户空间资源。  
- **虚拟机**：运行独立内核，通过虚拟化层（如KVM）模拟硬件。

---

### **七、总结**
- **内核空间**是操作系统的核心，拥有最高权限，负责资源管理和硬件交互。  
- **用户空间**为应用程序提供安全的执行环境，通过系统调用与内核协作。  
- **隔离机制**通过硬件和软件结合，确保系统稳定性与安全性，是现代操作系统的基石。  

理解两者的区别与交互机制，有助于开发高效、安全的应用程序，并深入排查系统级问题（如性能瓶颈、权限错误）。


## Microsoft Visual Studio 中的crt0.c文件在哪个目录？

在 Microsoft Visual Studio 中，`crt0.c` 是 C 运行时库（CRT）的初始化代码文件，用于定义程序的入口函数（如 `mainCRTStartup`），负责全局变量初始化、命令行参数解析等任务。其具体位置取决于 Visual Studio 的版本和安装配置。以下是相关信息：

### 1. **默认路径**
`crt0.c` 通常位于 Visual Studio 安装目录的 **`VC\crt\src`** 子目录下。以常见版本为例：
- **Visual Studio 2010**：  
  `C:\Program Files (x86)\Microsoft Visual Studio 10.0\VC\crt\src\crt0.c`  
- **Visual Studio 2015**：  
  `C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\crt\src\crt0.c`  
- **Visual Studio 2017/2019/2022**：  
  路径类似，但需根据具体版本号调整，例如：  
  `C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Tools\MSVC\14.29.30133\crt\src\vcruntime\crt0.c`。

### 2. **注意事项**
- **需要安装 CRT 源码**：默认安装可能不包含 CRT 源代码。需在 Visual Studio 安装时勾选 **“C++ 桌面开发”** 中的 **“MSVC vXXX 的 C++ 工具和 Windows SDK”**（`XXX` 为版本号）。
- **版本差异**：不同版本的 CRT 可能包含多个变体文件（如 `wincrt0.c` 用于 Windows 应用入口、`wcrt0.c` 为宽字符版本）。

### 3. **验证与调试**
若未找到文件，可通过以下方式确认：
- 在 Visual Studio 安装目录下搜索 `crt0.c`。
- 检查是否安装了对应版本的 **Windows SDK** 或 **C++ 开发工具**。

### 4. **相关文件**
除了 `crt0.c`，CRT 的初始化代码还涉及其他文件：
- `wcrt0.c`：宽字符版本的入口。
- `wincrt0.c`：Windows 应用程序的入口函数。
- `wwincrt0.c`：宽字符版的 Windows 入口。

### 总结
`crt0.c` 的路径依赖于 Visual Studio 版本和安装选项，通常位于 **`VC\crt\src`** 目录或其子目录下。如需进一步调试或查看源码，建议通过 Visual Studio 安装器确认是否已包含 CRT 源码组件。


## i386、x32 与 x64 的区别及演化过程

**i386、x32 与 x64 的区别及演化过程**

---

### **一、i386 的定义**
**i386** 是指 **Intel 80386** 处理器，它是 Intel 在 1985 年推出的 **32 位 x86 架构** 的 CPU，标志着 x86 架构从 16 位向 32 位的跨越。  
- **核心特性**：  
  - 支持 32 位寄存器（如 EAX、EBX）和内存寻址（最大 4GB 物理内存）。  
  - 引入保护模式（Protected Mode），支持多任务和虚拟内存。  
- **影响**：  
  - 成为现代 32 位 x86 架构的基础，后续的 32 位 CPU（如 Pentium、Core 系列）均兼容 i386 指令集。  
  - 操作系统（如 Linux、Windows）中常以 `i386` 代指 **32 位 x86 兼容架构**。

---

### **二、x32、x64 与 i386 的区别**
#### 1. **x32（32 位 x86 架构）**  
- **定义**：泛指所有兼容 i386 的 **32 位 x86 架构**（如 i486、Pentium、Core 等）。  
- **特点**：  
  - 寄存器宽度：32 位（EAX、EBX 等）。  
  - 内存寻址：最大 4GB（受限于 32 位地址总线）。  
  - **文件/系统标识**：Linux 中称为 `i386` 或 `x86`，Windows 中称为 `x86`。  

#### 2. **x64（64 位 x86 架构）**  
- **定义**：基于 **x86-64**（AMD64/Intel 64）的 **64 位扩展架构**，由 AMD 在 2003 年率先推出。  
- **特点**：  
  - 寄存器宽度：64 位（RAX、RBX 等），并新增 8 个通用寄存器（R8-R15）。  
  - 内存寻址：理论最大 16EB（2⁶⁴ Bytes），实际受操作系统限制（如 Windows 家庭版限制为 128GB）。  
  - **兼容性**：完全兼容 32 位 x86 指令（可运行 32 位程序）。  
  - **文件/系统标识**：Linux 中称为 `x86_64`，Windows 中称为 `x64`。  

#### 3. **x32 ABI（特殊模式）**  
- **定义**：一种 **在 64 位 CPU 上运行 32 位指针的优化模式**（Linux 特有），旨在减少内存占用同时保留 64 位性能。  
- **特点**：  
  - 使用 32 位指针，但寄存器仍为 64 位。  
  - **应用场景**：对内存敏感但需 64 位指令的程序（如高频计算）。  
  - **限制**：不兼容传统 32 位程序，需专门编译。

---

### **三、架构演化过程**
#### 1. **16 位时代（1978–1985）**  
- **代表 CPU**：Intel 8086、80286。  
- **特点**：  
  - 16 位寄存器（AX、BX 等），段地址+偏移地址的寻址方式。  
  - 最大内存：1MB（实模式）。  

#### 2. **32 位时代（1985–2003）**  
- **里程碑**：i386（1985）首次支持 32 位保护模式。  
- **发展**：  
  - i486（1989）：集成浮点运算单元（FPU）。  
  - Pentium（1993）：超标量架构，支持多指令并行。  
  - Pentium Pro（1995）：引入乱序执行。  

#### 3. **64 位时代（2003 至今）**  
- **里程碑**：AMD 推出 **Opteron**（2003），首次实现 x86-64 架构。  
- **关键事件**：  
  - **Intel 响应**：推出兼容的 EM64T（2004，后改称 Intel 64）。  
  - **操作系统支持**：  
    - Windows XP x64 Edition（2005）。  
    - Linux 内核全面支持（2.6.x 版本后）。  
  - **优势**：  
    - 更大内存支持（突破 4GB 限制）。  
    - 更多寄存器提升性能（尤其科学计算、游戏）。  

---

### **四、总结与对比**
| **架构**    | **位数** | **代表 CPU**       | **内存上限**       | **典型应用场景**       |  
|------------|---------|--------------------|--------------------|-----------------------|  
| **i386**   | 32 位   | Intel 80386        | 4GB                | 老旧系统、嵌入式设备   |  
| **x32**    | 32 位   | Pentium、Core      | 4GB                | 轻量级应用、兼容模式   |  
| **x64**    | 64 位   | AMD Ryzen、Intel i9| 16EB（理论）       | 现代桌面、服务器、高性能计算 |  
| **x32 ABI**| 混合模式| 64 位 CPU + 32 位指针 | 4GB（指针限制） | Linux 专用优化场景     |  

---

### **五、实际应用建议**
1. **开发选择**：  
   - 新项目优先使用 **x64**（性能高、内存支持大）。  
   - 仅维护老旧硬件或依赖 32 位库时选择 **x32**。  
2. **系统安装**：  
   - 现代 PC 和服务器应安装 **x64 系统**（如 Windows 11 x64、Ubuntu x86_64）。  
   - 虚拟机或嵌入式设备可考虑轻量级 x32 系统。  
3. **兼容性**：  
   - x64 系统可运行 x32 程序（Windows 通过 `WoW64`，Linux 通过 `multiarch`）。  
   - x32 系统无法运行 x64 程序。  

通过理解这些架构的差异和演化，可以更好地选择软硬件方案，平衡性能、兼容性与资源占用。


## 在linux环境下GLIBC 2.41运行库是如何运行一个用户编写的main函数的？上面是从书中摘抄的一些描述，但是有些老旧了，更新局最新的linux和glibc版本，为我解释main函数执行的全生命周期过程，并给出关键点的源码摘要。


在 Linux 环境下，用户编写的 `main` 函数的全生命周期由 **GNU C 运行库（GLIBC）** 的入口函数和运行时逻辑控制。以 GLIBC 2.39（截至 2023 年最新稳定版）为例，整个过程分为 **初始化、执行主体、清理退出** 三个阶段，以下是详细流程和关键源码解析。

---

### **一、程序启动的全生命周期**

#### **1. 内核加载程序**
- **内核接管**：  
  当用户通过 `execve` 系统调用启动程序时，内核完成以下操作：
  1. 解析可执行文件格式（ELF）。
  2. 创建虚拟内存映射，加载代码段（`.text`）、数据段（`.data`、`.bss`）。
  3. 设置初始堆栈（包含 `argc`、`argv`、`envp` 等信息）。
  4. 将控制权交给用户态入口点 `_start`（ELF 头中定义的入口地址）。

#### **2. 入口函数 `_start`**
- **汇编入口**：  
  `_start` 是 GLIBC 的初始入口点，用汇编编写，负责调用运行库的初始化逻辑。  
  源码位置：`sysdeps/x86_64/start.S`（x86-64 架构为例）  
  ```asm
  .globl _start
  _start:
      xor   %rbp, %rbp            ; 清空基址指针（标记栈帧结束）
      mov   %rdx, %r9            ; 保存动态链接器析构函数（若有）
      pop   %rsi                 ; argc → rsi
      mov   %rsp, %rcx           ; argv → rcx
      and   $-16, %rsp           ; 对齐栈指针（SSE 要求）
      push  %rax                 ; 栈上填充（对齐用）
      push  %rsp                 ; 栈指针作为参数传递
      lea   __libc_csu_fini(%rip), %r8  ; 全局析构函数
      lea   __libc_csu_init(%rip), %rdi ; 全局构造函数
      lea   main(%rip), %rsi      ; main 函数地址
      call  __libc_start_main     ; 核心初始化逻辑
      hlt                        ; 理论上不会执行至此
  ```

#### **3. 核心初始化函数 `__libc_start_main`**
- **C 语言入口**：  
  源码位置：`csu/libc-start.c`  
  ```c
  STATIC int LIBC_START_MAIN (
      int (*main) (int, char **, char **),  // main 函数指针
      int argc, char **argv,
      __typeof (main) init,                // 全局构造函数（__libc_csu_init）
      void (*fini) (void),                 // 全局析构函数（__libc_csu_fini）
      void (*rtld_fini) (void),            // 动态链接器析构函数
      void *stack_end                      // 栈顶地址
  ) {
      // 关键步骤：
      __pthread_initialize_minimal ();     // 初始化线程局部存储（TLS）
      __cxa_atexit (rtld_fini, NULL, NULL); // 注册动态链接器析构函数
      __libc_init_first (argc, argv, __environ); // 初始化运行库基础设施
      __cxa_atexit (fini, NULL, NULL);     // 注册全局析构函数
      (*init) (argc, argv, __environ);     // 调用全局构造函数（C++ 全局对象构造）
      int result = main (argc, argv, __environ); // 调用用户 main 函数
      exit (result);                       // 清理并退出
  }
  ```

#### **4. 用户 `main` 函数执行**
- **用户代码**：  
  用户编写的 `main` 函数在此阶段执行，可安全使用堆内存、系统调用等。

#### **5. 清理与退出**
- **`exit` 函数链**：  
  无论 `main` 是正常返回还是调用 `exit()`，最终会触发清理逻辑：
  1. 调用通过 `atexit()` 或 `__cxa_atexit()` 注册的函数（逆序执行）。
  2. 执行全局析构函数（如 C++ 全局对象析构）。
  3. 刷新并关闭所有 I/O 流（`stdio` 缓冲区）。
  4. 释放堆内存（通过 `__libc_freeres()`）。
  5. 调用 `_exit` 系统调用终止进程（状态码由 `main` 返回值决定）。

---

### **二、关键源码逻辑解析**

#### **1. 全局构造与析构**
- **C++ 全局对象**：  
  `__libc_csu_init` 和 `__libc_csu_fini` 负责调用全局构造函数（`.ctors` 段）和析构函数（`.dtors` 段）。  
  ```c
  // csu/elf-init.c
  void __libc_csu_init (int argc, char **argv, char **envp) {
      _init ();  // 调用 .init 段代码（编译器生成）
      // 遍历 .ctors 段调用构造函数
      const size_t size = __init_array_end - __init_array_start;
      for (size_t i = 0; i < size; i++)
          (*__init_array_start [i]) (argc, argv, envp);
  }
  ```

#### **2. 线程局部存储（TLS）初始化**
- **`__pthread_initialize_minimal`**：  
  初始化线程本地存储和栈保护（Stack Guard），源码位于 `nptl/csu/libc-tls.c`。

#### **3. 退出处理**
- **`exit` 函数链**：  
  `exit()` 最终调用 `__run_exit_handlers`（`stdlib/exit.c`）：
  ```c
  void exit (int status) {
      __run_exit_handlers (status, &__exit_funcs, true, true);
  }
  static void __run_exit_handlers (int status, struct exit_function_list **listp, bool run_dtors, bool call_fini) {
      // 逆序调用 atexit 注册的函数
      while (*listp != NULL) {
          struct exit_function_list *cur = *listp;
          for (int i = cur->idx; i-- > 0; ) {
              void (*fn) (void) = cur->fns[i].func.cxa.fn;
              fn ();
          }
          *listp = cur->next;
      }
      if (call_fini) 
          _dl_fini ();  // 动态链接器清理
      _exit (status);   // 最终系统调用
  }
  ```

---

### **三、现代 Linux/GLIBC 的变化**
相较于旧版本，GLIBC 2.39 的主要改进：
1. **强化安全性**：
   - 栈溢出保护（SSP）默认启用。
   - 指针完整性检查（如 `-fstack-protector-strong`）。
2. **线程本地存储优化**：
   - 更高效的 TLS 模型（Initial Exec vs. Local Dynamic）。
3. **动态链接器改进**：
   - `ld.so` 支持惰性符号绑定（Lazy Binding）的优化策略。
4. **C11/C17 标准支持**：
   - `quick_exit()`、`at_quick_exit()` 等新函数。

---

### **四、生命周期流程图**
```plaintext
execve → 内核加载 → _start (汇编) → __libc_start_main → 
    ├─ 初始化 TLS、堆、IO
    ├─ 调用全局构造函数（C++ 全局对象）
    ├─ main(argc, argv, envp)
    └─ exit() → 
        ├─ 调用 atexit 函数（逆序）
        ├─ 调用全局析构函数
        ├─ 关闭 IO、释放堆
        └─ _exit 系统调用
```

---

### **总结**
从内核加载到用户 `main` 函数的执行，GLIBC 的入口函数通过精细的初始化和清理逻辑，为程序提供了安全的运行时环境。现代 GLIBC 在兼容性、安全性和性能上的持续改进，使得这一过程在保持稳定的同时，能适应新的硬件特性和编程标准。



## 在Windows环境下MSVC CRT是如何运行一个用户编写的main函数的？为我解释main函数执行的全生命周期过程，并给出关键点的源码摘要

在 Windows 环境下，MSVC（Microsoft Visual C++）的 C 运行时库（CRT）负责管理用户编写的 `main` 函数的全生命周期。这一过程涉及程序初始化、执行主逻辑和清理退出三个阶段。以下以 Visual Studio 2022 的 MSVC CRT 实现（部分源码参考开源代码）为例，详细解析其流程并提供关键源码摘要。

---

### **一、程序启动的全生命周期**

#### **1. 内核加载程序**
- **内核行为**：  
  Windows 内核通过 `CreateProcess` 加载可执行文件（PE 格式），完成以下操作：
  1. 映射 PE 文件到内存，解析导入表（IAT）和重定位表。
  2. 初始化进程环境块（PEB）和线程环境块（TEB）。
  3. 将控制权交给 CRT 的入口函数（如 `mainCRTStartup`）。

#### **2. 入口函数 `mainCRTStartup`**
- **入口点定义**：  
  控制台程序的入口函数为 `mainCRTStartup`，GUI 程序为 `WinMainCRTStartup`。  
  源码位置：`exe_common.inl`（Visual Studio 2022 CRT 源码）  
  ```cpp
  // exe_main.cpp
  extern "C" int mainCRTStartup() {
      return __scrt_common_main();
  }
  ```

#### **3. 核心初始化函数 `__scrt_common_main`**
- **初始化流程**：  
  源码位置：`exe_common.inl`  
  ```cpp
  static __forceinline int __cdecl __scrt_common_main() {
      // 1. 初始化 CRT 和全局安全机制
      if (!__scrt_initialize_crt()) __fastfail(FAST_FAIL_FATAL_APP_EXIT);

      // 2. 初始化 C/C++ 运行时（全局对象构造、线程局部存储等）
      __try {
          if (_initterm_e(__xi_a, __xi_z) != 0) return 255; // 全局 C 初始化
          _initterm(__xc_a, __xc_z);                        // 全局 C++ 构造函数
      } __except (__scrt_exception_filter()) {
          return __scrt_fastfail(GetExceptionCode());
      }

      // 3. 调用用户 main 函数
      int const result = invoke_main();

      // 4. 清理并退出
      __scrt_uninitialize_crt(true /* exit */, true /* return */);
      return result;
  }
  ```

#### **4. 调用用户 `main` 函数**
- **参数处理**：  
  `invoke_main` 解析命令行参数和环境变量，传递给用户的 `main` 函数：  
  ```cpp
  static int __cdecl invoke_main() {
      return main(__argc, __argv, _get_initial_environment());
  }
  ```

#### **5. 清理与退出**
- **退出处理链**：  
  ```cpp
  void __cdecl __scrt_uninitialize_crt(bool const exit, bool const return_to_caller) {
      // 1. 调用 atexit 注册的函数（逆序）
      _execute_onexit_table(&__acrt_atexit_table);

      // 2. 调用全局析构函数（C++ 全局对象）
      _initterm(__xp_a, __xp_z);  // .CRT$XPA 到 .CRT$XPZ 的析构函数指针

      // 3. 释放 CRT 分配的堆内存
      __acrt_cleanup_heap();

      // 4. 调用 ExitProcess 或返回
      if (!return_to_caller && exit)
          ExitProcess(exit_code);
  }
  ```

---

### **二、关键源码逻辑解析**

#### **1. 全局构造与析构**
- **`_initterm` 函数**：  
  遍历函数指针表（`.CRT$XCA` 到 `.CRT$XCZ` 段），调用全局构造函数（C++ 全局对象）：  
  ```cpp
  // crt0dat.c
  void __cdecl _initterm(_PVFV* const begin, _PVFV* const end) {
      for (_PVFV* it = begin; it != end; ++it)
          if (*it != nullptr)
              (**it)();
  }
  ```

#### **2. 安全机制初始化**
- **缓冲区安全检查（/GS）**：  
  CRT 初始化时设置安全 Cookie（防止栈溢出攻击）：  
  ```cpp
  // gs_support.c
  void __cdecl __security_init_cookie() {
      __security_cookie = __security_generate_cookie();
  }
  ```

#### **3. 命令行参数解析**
- **`__p___argv` 实现**：  
  通过 Windows API `GetCommandLineW` 和 `CommandLineToArgvW` 解析命令行参数：  
  ```cpp
  // argv.cpp
  wchar_t** __cdecl __p___wargv() {
      LPWSTR cmd_line = GetCommandLineW();
      int    argc;
      LPWSTR* argv = CommandLineToArgvW(cmd_line, &argc);
      return argv;
  }
  ```

---

### **三、现代 MSVC CRT 的变化**
相较于旧版本（如 VS2010），MSVC 2022 的 CRT 主要改进：
1. **安全性增强**：  
   - 默认启用 Control Flow Guard（CFG）和 Spectre 缓解措施。  
   - 强化异常处理（SEH）和堆完整性检查。  
2. **模块化设计**：  
   - CRT 拆分为更细粒度的 DLL（如 `vcruntime140.dll`、`ucrtbase.dll`）。  
3. **C++20/C17 支持**：  
   - 支持 `std::format`、`<charconv>` 等新特性。  
4. **UTF-8 代码页支持**：  
   - 可通过 `/utf-8` 编译选项启用原生 UTF-8 处理。  

---

### **四、生命周期流程图**
```plaintext
CreateProcess → 内核加载 → mainCRTStartup → __scrt_common_main → 
    ├─ 初始化安全 Cookie、堆、环境变量
    ├─ 调用全局构造函数（C++ 对象）
    ├─ invoke_main → main(argc, argv, envp)
    └─ __scrt_uninitialize_crt → 
        ├─ 调用 atexit 函数（逆序）
        ├─ 调用全局析构函数
        ├─ 释放堆内存、关闭 I/O
        └─ ExitProcess 或返回
```

---

### **总结**
MSVC CRT 通过 `mainCRTStartup` 入口函数完成复杂的初始化工作，确保用户 `main` 函数能在安全、稳定的环境中运行。其生命周期管理涵盖从参数解析、全局对象构造到退出清理的全流程，并与 Windows 系统深度集成（如 SEH 异常处理、安全机制）。开发者无需关心底层细节，即可编写符合标准的 C/C++ 程序。




## 帮我解释windows中的PE结构，每个细节都要有说明和解释，并使用最新的头文件。

Windows 中的 **PE（Portable Executable）结构** 是可执行文件（如 `.exe`、`.dll`、`.sys`）的标准格式，支持 32 位和 64 位程序。它定义了文件如何被加载到内存并执行。以下基于最新 Windows SDK（WinNT.h）的详细解析，涵盖所有核心部分。

---

### **一、PE 结构全景图**
PE 文件由多个层次化的头部和数据块组成，结构如下：
```
┌──────────────────────┐
│      DOS 头部         │
├──────────────────────┤
│      DOS Stub         │
├──────────────────────┤
│   PE 签名 ("PE\0\0")  │
├──────────────────────┤
│    COFF 文件头         │
├──────────────────────┤
│    可选头（32/64）     │
├──────────────────────┤
│      节表（Section表）  │
├──────────────────────┤
│      节数据            │
│      .text, .rdata,    │
│      .data, .rsrc等    │
└──────────────────────┘
```

---

### **二、PE 结构逐层解析**
#### **1. DOS 头部（IMAGE_DOS_HEADER）**
- **作用**：兼容 DOS 系统，提供存根程序（Stub）和指向 PE 头的偏移。
- **源码定义**（WinNT.h）：
  ```c
  typedef struct _IMAGE_DOS_HEADER {
      WORD   e_magic;        // "MZ" 签名（0x5A4D）
      // ... 其他 DOS 字段（略）...
      LONG   e_lfanew;       // PE 头的偏移（关键字段）
  } IMAGE_DOS_HEADER, *PIMAGE_DOS_HEADER;
  ```

#### **2. PE 签名**
- **作用**：标识文件为 PE 格式。
- **内容**：4 字节的 `PE\0\0`（0x50450000）。

#### **3. COFF 文件头（IMAGE_FILE_HEADER）**
- **作用**：描述文件的基本信息。
- **源码定义**：
  ```c
  typedef struct _IMAGE_FILE_HEADER {
      WORD  Machine;              // 目标架构（如 IMAGE_FILE_MACHINE_AMD64）
      WORD  NumberOfSections;     // 节的数量
      DWORD TimeDateStamp;        // 编译时间戳
      DWORD PointerToSymbolTable; // 符号表偏移（调试用）
      DWORD NumberOfSymbols;      // 符号数量
      WORD  SizeOfOptionalHeader; // 可选头大小
      WORD  Characteristics;      // 文件属性（如可执行、DLL）
  } IMAGE_FILE_HEADER;
  ```
- **关键标志**：
  - `IMAGE_FILE_EXECUTABLE_IMAGE`：可执行文件。
  - `IMAGE_FILE_DLL`：动态链接库。

#### **4. 可选头（IMAGE_OPTIONAL_HEADER）**
- **作用**：提供程序加载和执行的关键信息，分为 32 位和 64 位版本。
- **源码定义（64 位）**：
  ```c
  typedef struct _IMAGE_OPTIONAL_HEADER64 {
      WORD  Magic;                        // PE32+（0x20B）
      // ... 通用字段 ...
      DWORD AddressOfEntryPoint;          // 入口点 RVA（如 main 函数）
      DWORD ImageBase;                    // 首选加载基址（64 位为 ULONGLONG）
      DWORD SectionAlignment;             // 内存对齐粒度（通常 0x1000）
      DWORD FileAlignment;                // 文件对齐粒度（通常 0x200）
      // ... 子系统、栈/堆大小 ...
      DWORD NumberOfRvaAndSizes;          // 数据目录数量（固定 16）
      IMAGE_DATA_DIRECTORY DataDirectory[16]; // 数据目录表
  } IMAGE_OPTIONAL_HEADER64;
  ```
- **关键数据目录**：
  | **索引**                           | **用途**                     |
  |-----------------------------------|-----------------------------|
  | `IMAGE_DIRECTORY_ENTRY_EXPORT`    | 导出函数表（.edata）          |
  | `IMAGE_DIRECTORY_ENTRY_IMPORT`    | 导入函数表（.idata）          |
  | `IMAGE_DIRECTORY_ENTRY_RESOURCE`  | 资源数据（.rsrc）            |
  | `IMAGE_DIRECTORY_ENTRY_BASERELOC` | 重定位表（.reloc）           |
  | `IMAGE_DIRECTORY_ENTRY_DEBUG`     | 调试信息（如 PDB 路径）       |
  | `IMAGE_DIRECTORY_ENTRY_TLS`       | TLS（线程局部存储）数据       |
  | `IMAGE_DIRECTORY_ENTRY_SECURITY`  | 数字签名（不在节内）          |

#### **5. 节表（Section Table）**
- **作用**：描述每个节（如代码、数据）在文件和内存中的布局。
- **源码定义**：
  ```c
  typedef struct _IMAGE_SECTION_HEADER {
      BYTE  Name[8];            // 节名称（如 ".text"）
      union {
          DWORD PhysicalAddress;
          DWORD VirtualSize;    // 内存中的实际大小
      } Misc;
      DWORD VirtualAddress;     // 内存中的 RVA（相对虚拟地址）
      DWORD SizeOfRawData;      // 文件中的大小
      DWORD PointerToRawData;   // 文件中的偏移
      DWORD Characteristics;    // 节属性（可读、可写、可执行）
  } IMAGE_SECTION_HEADER;
  ```
- **关键属性**：
  - `IMAGE_SCN_MEM_EXECUTE`：代码节（可执行）。
  - `IMAGE_SCN_MEM_READ`：数据节（可读）。
  - `IMAGE_SCN_MEM_WRITE`：可写数据节（如 .data）。

---

### **三、核心数据目录详解**
#### **1. 导入表（IMAGE_IMPORT_DESCRIPTOR）**
- **作用**：记录程序依赖的 DLL 及其导入函数。
- **结构**：
  ```c
  typedef struct _IMAGE_IMPORT_DESCRIPTOR {
      union {
          DWORD Characteristics;
          DWORD OriginalFirstThunk; // 导入名称表（INT）RVA
      };
      DWORD TimeDateStamp;          // 时间戳（未绑定为0）
      DWORD ForwarderChain;
      DWORD Name;                   // DLL 名称的 RVA
      DWORD FirstThunk;             // 导入地址表（IAT）RVA
  } IMAGE_IMPORT_DESCRIPTOR;
  ```

#### **2. 导出表（IMAGE_EXPORT_DIRECTORY）**
- **作用**：定义 DLL 导出的函数供其他模块调用。
- **结构**：
  ```c
  typedef struct _IMAGE_EXPORT_DIRECTORY {
      DWORD Characteristics;
      DWORD TimeDateStamp;
      WORD  MajorVersion;
      WORD  MinorVersion;
      DWORD Name;             // DLL 名称的 RVA
      DWORD Base;             // 导出函数起始序号
      DWORD NumberOfFunctions;// 导出函数数量
      DWORD NumberOfNames;    // 按名称导出的函数数量
      DWORD AddressOfFunctions;   // 函数地址数组 RVA
      DWORD AddressOfNames;       // 函数名称数组 RVA
      DWORD AddressOfNameOrdinals;// 序号数组 RVA
  } IMAGE_EXPORT_DIRECTORY;
  ```

#### **3. 资源目录（IMAGE_RESOURCE_DIRECTORY）**
- **作用**：管理图标、字符串、版本信息等资源。
- **层次结构**：
  - **资源类型**（如 `RT_ICON`、`RT_VERSION`）。
  - **资源名称或 ID**。
  - **语言 ID**（如 0x0409 表示英语）。
  ```c
  typedef struct _IMAGE_RESOURCE_DIRECTORY {
      DWORD Characteristics;
      DWORD TimeDateStamp;
      WORD  MajorVersion;
      WORD  MinorVersion;
      WORD  NumberOfNamedEntries;
      WORD  NumberOfIdEntries;
  } IMAGE_RESOURCE_DIRECTORY;
  ```

#### **4. 重定位表（IMAGE_BASE_RELOCATION）**
- **作用**：当文件无法加载到 `ImageBase` 时，修正代码中的绝对地址。
- **结构**：
  ```c
  typedef struct _IMAGE_BASE_RELOCATION {
      DWORD VirtualAddress;   // 需重定位的页 RVA
      DWORD SizeOfBlock;      // 当前块的总大小
      // 跟随 WORD 数组，每个 WORD 包含偏移和类型
  } IMAGE_BASE_RELOCATION;
  ```

---

### **四、PE 加载与执行流程**
1. **内存映射**：  
   - 根据 `SectionAlignment` 将各节加载到内存。
   - 初始化 IAT（导入地址表），解析依赖的 DLL 函数地址。
2. **地址重定位**：  
   - 若实际加载地址与 `ImageBase` 不同，应用 `.reloc` 节中的重定位项。
3. **执行入口点**：  
   - 跳转到 `AddressOfEntryPoint` 指定的地址（通常是 CRT 入口函数）。
4. **资源访问**：  
   - 通过 `FindResource`、`LoadResource` API 访问 `.rsrc` 节中的资源。

---

### **五、现代 PE 特性扩展**
- **控制流防护（CFG）**：  
  在 `DllCharacteristics` 中设置 `IMAGE_DLLCHARACTERISTICS_GUARD_CF`，防止代码注入攻击。
- **动态基址（ASLR）**：  
  通过 `DllCharacteristics` 的 `IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE` 启用地址空间随机化。
- **数字签名**：  
  安全目录（`IMAGE_DIRECTORY_ENTRY_SECURITY`）存放 Authenticode 签名，验证文件完整性。

---

### **六、工具与调试**
- **工具**：  
  - PEView：查看 PE 结构。
  - CFF Explorer：编辑 PE 头。
  - WinDbg：调试加载的 PE 文件。
- **调试信息**：  
  `.debug$S` 节存储 CodeView 记录，指向 PDB 文件路径。

---

### **总结**
PE 结构通过精细的头部和节定义，实现了代码、数据、资源的模块化管理，并支持安全特性（如 CFG、ASLR）。理解其细节有助于逆向工程、性能优化和安全分析。结合最新的 Windows SDK 头文件（如 `WinNT.h`），开发者可深入控制程序的行为和内存布局。