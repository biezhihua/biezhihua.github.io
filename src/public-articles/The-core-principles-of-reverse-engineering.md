# 逆向工程核心原理

那么，读者应该如何使用本书学习逆向分析技术呢？对此，我给出如下几点建议，供各位参考。
第一，技术书不是装饰书架的道具，它们是提高各位技术水平的工具。所以阅读时要勾画出重要部分，在书页空白处写下自己的想法与心得等。阅读时，在书页上记录相关技术、注意事项、技术优缺点、与作者的不同见解等，让它成为只属于你的书。读完这样一本逆向分析技术书后，不知不觉间就构建出自己独特的逆向分析世界，最终成为代码逆向分析专家。

第二，拥有积极乐观的心态。逆向分析是一项深奥的技术，会涉及OS底层知识。要学的内容很多，并且大部分内容需要亲自测试并确认才能最终理解。必须用积极乐观的心态对待这一过程，学习逆向技术无关聪明与否，只跟投入时间的多少有关。学习时，不要太急躁，请保持轻松的心态。

第三，不断挑战。逆向分析不尽如人意时，不要停下来，要尝试其他方法，不断挑战。要相信一定会有解决的方法，可能几年前早已有人成功过了。搜索相关资料并不断尝试，不仅能提高自身技术水平，解决问题后，心里还能感受到一种成就感。这样的成功经验一点点积累起来，自信心就会大大增强，自身的逆向分析水平也会得到明显提高。这种从经验中获得的自信会不知不觉地对逆向分析过程产生积极影响，让逆向分析往更好的方向发展。

希望本书能够帮助各位把“心愿表”上的愿望一一实现，也希望各位把本书讲解的知识、技术广泛应用到逆向分析过程中，发挥更大的作用。谢谢。

## 第一部分	代码逆向技术基础

### 第1章 关于逆向工程

1.1 逆向工程

1.2 代码逆向工程


1.2.1 逆向分析法


1.2.2  源代码、十六进制代码、汇编代码


1.2.3  “打补丁”与“破解”

1.3 代码逆向准备
1.3.1 目标
1.3.2 激情
1.3.3 谷歌

1.4  学习逆向分析技术的禁忌
1.4.1 贪心
1.4.2 急躁
1.5 逆向分析技术的乐趣

### 第2章	逆向分析Hello World!程序

2.1 Hello World!程序

2.2 调试HelloWorld. exe程序
2.2.1 调试目标
2.2.2 开始调试
2.2.3 入口点
2.2.4 跟踪40270C函数
2.2.5 跟踪40104F跳转语句
2.2.6 查找main()函数

2.3 进一步熟悉调试器
2.3.1 调试器指令
2.3.2  “大本营”
2.3.3 设置“大本营”的四种方法

2.4 快速查找指定代码的四种方法
2.4.1 代码执行法
2.4.2 字符串检索法
2.4.3 API检索法 (1): 在调用代码中设置断点
2.4.4 API检索法 (2): 在API代码中设置断点

2.5 使用“打补丁”方式修改“HelloWorld!”字符串
2.5.1  “打补丁”
2.5.2 修改字符串的两种方法

2.6 小结


### 第3章 小端序标记法
3.1 字节序
3.1.1 大端序与小端序
3.1.2 在OllyDbg中查看小端序

### 第4章 IA-32寄存器基本讲解
4.1 什么是CPU寄存器
4.2 IA-32寄存器

- 通用寄存器(General Purpose Registers,32位)
  - 各寄存器的名称如下所示。
    - EAX：（针对操作数和结果数据的）累加器
    - EBX:（DS段中的数据指针）基址寄存器
    - ECX：（字符串和循环操作的）计数器
    - EDX:（I/O指针）数据寄存器
    - 此外，ECX与EAX也可以用于特殊用途。循环命令(LOOP)中，ECX用来循环计数(loop count)，每执行一次循环，ECX都会减1.EAX一般用在函数返回值中，所有Win32API函数都会先把返回值保存到EAX再返回。
    - EBP:（SS段中栈内数据指针）扩展基址指针寄存器
    - ESI：（字符串操作源指针）源变址寄存器
    - EDI：（字符串操作目标指针）目的变址寄存器
    - ESP:（SS段中栈指针）栈指针寄存器
    - 以上4个寄存器主要用作保存内存地址的指针。
    - ESP指示栈区域的栈顶地址，某些指令(PUSH、POP、CALL、RET)可以直接用来操作ESP（栈区域管理是程序中相当重要的部分，请不要把ESP用作其他用途）。
    - EBP表示栈区域的基地址，函数被调用时保存ESP的值，函数返回时再把值返回ESP，保证栈不会崩溃（这称为栈帧(StackFrame)技术，它是代码逆向分析技术中的一个重要概念，后面会详细讲解）。
    - ESI和EDI与特定指令(LODS、STOS、REP、MOVS等)一起使用，主要用于内存复制。
- 段寄存器(Segment Registers,16位，6个)
  - CS: Code Segment, 代码段寄存器
  - SS: Stack Segment, 栈段寄存器
  - DS: Data Segment,数据段寄存器
  - ES: Extra(Data) Segment, 附加（数据）段寄存器
  - FS: Data Segment, 数据段寄存器
  - GS: Data Segment, 数据段寄存器
- 程序状态与控制寄存器(Program Status and Control Registers,32位，1个)
  - EFLAGS: Flag Register, 标志寄存器  
  - 学习代码逆向分析技术的初级阶段，只要掌握3个与程序调试相关的标志即可，分别为ZF(ZeroFlag，零标志)、OF (Overflow Flag, 溢出标志)、CF(Carry Flag, 进位标志)。
  - ZF 若运算结果为0, 则其值为1(True), 否则其值为0(False).
  - OF 有符号整数(signed integer) 溢出时, OF值被置为1。此外, MSB(Most Significant Bit,最高有效位)改变时，其值也被设为1.
  - CF 无符号整数(unsigned integer)溢出时，其值也被置为1.
- 指令指针寄存器(Instruction Pointer,32位，1个)
  - EIP: Instruction Pointer, 指令指针寄存器
  - 指令指针寄存器保存着CPU要执行的指令地址，其大小为32位（4个字节），由原16位IP寄存器扩展而来。程序运行时，CPU会读取EIP中一条指令的地址，传送指令到指令缓冲区后，EIP寄存器的值自动增加，增加的大小即是读取指令的字节大小。这样，CPU每次执行完一条指令，就会通过EIP寄存器读取并执行下一条指令。
  - 与通用寄存器不同，我们不能直接修改EIP的值，只能通过其他指令间接修改，这些特定指令包括JMP、Jcc、CALL、RET.此外，我们还可以通过中断或异常来修改EIP的值。

Intel® 64 和 IA-32 架构软件开发人员手册合并卷：1、2A、2B、2C、2D、3A、3B、3C、3D 和 4
- Volume 1: Basic Architecture
  - CHAPTER 3 BASIC EXECUTION ENVIRONMENT
    - 3.4 BASIC PROGRAM EXECUTION REGISTERS
      - 3.4.1 General-Purpose Registers
      - 3.4.2 Segment Registers
      - 3.4.3 EFLAGS Register
        - 3.4.3.1 Status Flags

4.3 小结

### 第5章 栈

5.1 栈

5.1.1 栈的特征

5.1.2 栈操作示例

向栈压入数据时，栈顶指针减小，向低地址移动；从栈中弹出数据时，栈顶指针增加，向高地址移动。

### 第6章 分析abex' crackme#1

6.1 abex' crackme #1
6.1.1 开始调试
6.1.2 分析代码

```shell
PUSH	入栈指令
CALL	调用指定位置的函数
INC	值加1
DEC	值减1
JMP	跳转到指定地址
CMP
比较给定的两个操作数 *与SUB命令类似，但操作数的值不会改变，仅改变EFLAGS寄存器（若2个操作数的值一致,SUB结果为0,ZF被置为1）
JE	条件跳转指令 (Jump if equal) *若ZF为1, 则跳转
```

6.2 破解

6.3 将参数压入栈

6.4 小结

### 第7章	栈帧

7.1 栈帧

栈帧(StackFrame)相关知识，栈帧在程序中用于声明局部变量、调用函数。

简言之，栈帧就是利用EBP（栈帧指针，请注意不是ESP）寄存器访问栈内局部变量、参数、函数返回地址等的手段。

为什么使用EBP而不是ESP？
程序运行中，ESP寄存器的值随时变化，访问栈中函数的局部变量、参数时，若以ESP值为基准编写程序会十分困难，并且也很难使CPU引用到准确的地址。
所以，调用某函数时，先要把用作基准点（函数起始地址）的ESP值保存到EBP,并维持在函数内部。
这样，无论ESP的值如何变化，以EBP的值为基准(base)能够安全访问到相关函数的局部变量、参数、返回地址，这就是EBP寄存器作为栈帧指针的作用。


栈帧结构
```bash
PUSH EBP	      ；函数开始（使用EBP前先把已有值保存到栈中）
MOV EBP, ESP	  ；保存当前ESP到EBP中
                ；函数体
                ；无论ESP值如何变化，EBP都保持不变，可以安全访问函数的局部变量、参数
MOV ESP, EBP	  ；将函数的起始地址返回到ESP中
POP EBP	        ；函数返回前弹出保存在栈中的EBP值
RETN	          ；函数终止
```

借助栈帧技术管理函数调用时，无论函数调用的深度有多深、多复杂，调用栈都能得到很好的管理与维护。

提示
- 最新的编译器中都带有一个“优化”(Optimization)选项，使用该选项编译简单的函数将不会生成栈帧。
- 在栈中保存函数返回地址是系统安全隐患之一，攻击者使用缓冲区溢出技术能够把保存在栈内存的返回地址更改为其他地址。

7.2 调试示例：stackframe. exe

7.2.1 StackFrame.cpp

```c
#include "stdio.h"

long add(long a, long b) 
{
	long x = a, y = b;
	return (x+y);
}

int main(int argc, char* argv[])
{
	long a = 1, b = 2;
	long c = add(a, b);
	printf("Sum of %ld and %ld is %ld\n", a, b, c);
	return 0;
}
```

7.2.2 开始执行main()函数&生成栈帧

```shell
004D18D0 <stackfram | 55                 | push ebp                                   | StackFrame.c:12
004D18D1            | 8BEC               | mov ebp,esp                                |
004D18D3            | 81EC E4000000      | sub esp,E4                                 | 生成栈空间
004D18D9            | 53                 | push ebx                                   |
004D18DA            | 56                 | push esi                                   | 
004D18DB            | 57                 | push edi                                   |
004D18DC <stackfram | 8D7D DC            | lea edi,dword ptr ss:[ebp-24]              | 初始化局部变量空间
004D18DF            | B9 09000000        | mov ecx,9                                  | 
004D18E4            | B8 CCCCCCCC        | mov eax,CCCCCCCC                           | 
004D18E9            | F3:AB              | rep stosd                                  |
```

7.2.3 设置局部变量

```shell
004D18F6            | C745 F8 01000000   | mov dword ptr ss:[ebp-8],1                 | 把数据1保存到[EBP-8]中，[EBP-8]代表局部变量a
004D18FD            | C745 EC 02000000   | mov dword ptr ss:[ebp-14],2                | 把数据1保存到[EBP-14]中，[EBP-14]代表局部变量b
```

提示
DWORD PTR SS:[EBP-4]语句中, SS是Stack Segment的缩写，表示栈段。由于Windows中使用的是段内存模型(Segment Memory Model), 使用时需要指出相关内存属于哪一个区段。其实，32位的Windows OS中, SS、DS、ES的值皆为0, 所以采用这种方式附上区段并没有什么意义。因EBP与ESP是指向栈的寄存器，所以添加上了SS寄存器。请注意,“DWORD PTR”与“SS:”等字符串可以通过设置OllyDbg的相应选项来隐藏。

7.2.4 add()函数参数传递与调用

```shell
004D1904            | 8B45 EC            | mov eax,dword ptr ss:[ebp-14]              | 
004D1907            | 50                 | push eax                                   | arg2
004D1908            | 8B4D F8            | mov ecx,dword ptr ss:[ebp-8]               | 
004D190B            | 51                 | push ecx                                   | arg1
004D190C            | E8 12F7FFFF        | call stackframe.4D1023                     | call的同时会push下一个指令的地址004D1911，也叫做返回地址
```

返回地址
执行CALL命令进入被调用的函数之前，CPU会先把函数的返回地址压入栈，用作函数执行完毕后的返回地址。

```shell
0041FA90      004D1911          return to stackframe.__$EncStackInitEnd+26 from stackframe.__enc$textbss$end+23
0041FA94      00000001          
0041FA98      00000002          
```

7.2.5 开始执行add()函数&生成栈帧

```shell
004D18 | 55                 | push ebp                                                   | StackFrame.c:6
004D18 | 8BEC               | mov ebp,esp                                                |
004D18 | 81EC D8000000      | sub esp,D8                                                 |
```

可以看到，main（）函数使用的EBP值被备份到栈中，然后EBP的值被设置为一个新值。

7.2.6 设置add()函数的局部变量(x,y)

```shell
004D18 | 8B45 08            | mov eax,dword ptr ss:[ebp+8]                               | 取出参数a
004D18 | 8945 F8            | mov dword ptr ss:[ebp-8],eax                               | 设置局部变量值
004D18 | 8B45 0C            | mov eax,dword ptr ss:[ebp+C]                               | 取出参数b
004D18 | 8945 EC            | mov dword ptr ss:[ebp-14],eax                              | 设置局部变量值
```

```shell
0040FCC8          CCCCCCCC     
0040FCCC          00000002     
0040FCD0          CCCCCCCC     
0040FCD4          CCCCCCCC     
0040FCD8          00000001     
0040FCDC          CCCCCCCC     
0040FCE0          0040FDE0     EBP  
0040FCE4          004D1911     return to stackframe.__$EncStackInitEnd+26 from stackframe.__enc$textbss$end+23
0040FCE8          00000001     
0040FCEC          00000002     
```

7.2.7 ADD运算

```shell
004D18A2            | 8B45 F8            | mov eax,dword ptr ss:[ebp-8]               | 使用局部变量计算
004D18A5            | 0345 EC            | add eax,dword ptr ss:[ebp-14]              |
```

7.2.8 删除函数add()的栈帧&函数执行完毕（返回）

```shell
004D18B8  | 8BE5               | mov esp,ebp                                                |
004D18BA  | 5D                 | pop ebp                                                    |
004D18BB  | C3                 | ret                                                        |
```

上面这条命令用于恢复函数add（）开始执行时备份到栈中的EBP值，它与401000地址处的PUSH EBP命令对应。EBP值恢复为12FF40, 它是main（）函数的EBP值。到此, add（）函数的栈帧就被删除了。

```shell
0040FCE4          004D1911     return to stackframe.__$EncStackInitEnd+26 from stackframe.__enc$textbss$end+23
0040FCE8          00000001     
0040FCEC          00000002     
```

7.2.9 从栈中删除函数add()的参数（整理栈）

```shell
004D1904  | 8B45 EC            | mov eax,dword ptr ss:[ebp-14]                              | StackFrame.c:14
004D1907  | 50                 | push eax                                                   |
004D1908  | 8B4D F8            | mov ecx,dword ptr ss:[ebp-8]                               | ecx:_2339CD9D_StackFrame@c
004D190B  | 51                 | push ecx                                                   | ecx:_2339CD9D_StackFrame@c
004D190C  | E8 12F7FFFF        | call stackframe.4D1023                                     |
004D1911  | 83C4 08            | add esp,8                                                  |
```

```shell
0040FCE8          00000001     
0040FCEC          00000002     
0040FCF0 <&EntryP 004D1028     ESP
0040FCF4 <&EntryP 004D1028     stackframe.__enc$textbss$end+28
```

提示
- 被调函数执行完毕后，函数的调用者(Caller)负责清理存储在栈中的参数，这种方式称为cdecl方式；
- 反之，被调用者(Callee)负责清理保存在栈中的参数，这种方式称为stdcall方式。这些函数调用规则统称为调用约定(Calling Convention), 这在程序开发与分析中是一个非常重要的概念，第10章将进一步讲解相关内容。

7.2.10 调用printf()函数

```shell
004D1914            | 8945 E0            | mov dword ptr ss:[ebp-20],eax              |
004D1917            | 8B45 E0            | mov eax,dword ptr ss:[ebp-20]              | StackFrame.c:15
004D191A            | 50                 | push eax                                   |
004D191B            | 8B4D EC            | mov ecx,dword ptr ss:[ebp-14]              |
004D191E            | 51                 | push ecx                                   |
004D191F            | 8B55 F8            | mov edx,dword ptr ss:[ebp-8]               |
004D1922            | 52                 | push edx                                   |
004D1923            | 68 307B4D00        | push stackframe.4D7B30                     | 4D7B30:"Sum of %ld and %ld is %ld\n"
004D1928            | E8 AAF7FFFF        | call stackframe.4D10D7                     |
004D192D            | 83C4 10            | add esp,10                                 |
```

7.2.11 设置返回值

```shell
004D1930            | 33C0               | xor eax,eax                                | StackFrame.c:16
```

XOR命令用来进行Exclusive OR bit（异或）运算，其特点为“2个相同的值进行XOR运算，结果为0”.XOR命令比MOV EAX，0命令执行速度快，常用于寄存器的初始化操作。

7.2.12 删除栈帧& main()函数终止

```shell
004D1942            | 8BE5               | mov esp,ebp                                |
004D1944            | 5D                 | pop ebp                                    |
004D1945            | C3                 | ret                                        |
```

7.3 设置OllyDbg选项
7.3.1 Disasm选项
7.3.2 Analysis1选项

7.4 小结

### 第8章 abex' crackme#2 

8.1 运行abex' crackme#2 

8.2 Visual Basic文件的特征
8.2.1 VB专用引擎 
8.2.2 本地代码和伪代码
8.2.3 事件处理程序
8.2.4 未文档化的结构体

8.3 开始调试 

```shell
00401238  | 68 141E4000        | push abex' crackme #2.401E14                               |
0040123D  | E8 F0FFFFFF        | call <JMP.&ThunRTMain>                                     |
```
8.3.1 间接调用 

8.3.2 RT MainStruct结构体

8.3.3 ThunRTMain()函数

8.4 分析crackme

8.4.1 检索字符串

TEST: 逻辑比较(Logical Compare)
与bit-wise logical`AND'一样（仅改变EFLAGS寄存器而不改变操作数的值）若2个操作数中一个为0，则AND运算结果被置为0 -> ZF = 1 。
JE: 条件转移指令(Jump if equal)
若ZF=1,  则跳转。

8.4.2 查找字符串地址

```shell
00403321  | 8D55 BC            | lea edx,dword ptr ss:[ebp-44]                              |
00403324  | 8D45 CC            | lea eax,dword ptr ss:[ebp-34]                              |
00403327  | 52                 | push edx                                                   |
00403328  | 50                 | push eax                                                   |
00403329  | FF15 58104000      | call dword ptr ds:[<&__vbaVarTstEq>]                       |
0040332F  | 66:85C0            | test ax,ax                                                 |
00403332  | 0F84 D0000000      | je abex' crackme #2.403408                                 |
```

8.4.3 生成Serial的算法

```shell
00402ED0  | 55                 | push ebp                                                   |
00402ED1  | 8BEC               | mov ebp,esp                                                |
```

NOP: No Operation, 不执行任何动作的指令（只消耗CPU时钟）。

8.4.4 预测代码

```shell
00402F8E  | 8D95 78FFFFFF      | lea edx,dword ptr ss:[ebp-88]                              | [ebp-88]:L"BIEZHIHUA"
00402F94  | 52                 | push edx                                                   |
00402F95  | 56                 | push esi                                                   |
00402F96  | 8B0E               | mov ecx,dword ptr ds:[esi]                                 |
00402F98  | FF91 A0000000      | call dword ptr ds:[ecx+A0]                                 |
```

8.4.5 读取Name字符串的代码

8.4.6 加密循环

```shell
00403102  | BB 04000000        | mov ebx,4                                                  |

0040318B  | FF15 30104000      | call dword ptr ds:[<&__vbaVarForInit>]                     |
00403191  | 8B1D 4C104000      | mov ebx,dword ptr ds:[<&rtcMidCharVar>]                    |
00403197  | 85C0               | test eax,eax                                               |
00403199  | 0F84 06010000      | je abex' crackme #2.4032A5                                 |

0040329A  | FF15 C0104000      | call dword ptr ds:[<&__vbaVarForNext>]                     |
004032A0  | E9 F2FEFFFF        | jmp abex' crackme #2.403197                                |
004032A5  | 8B45 08            | mov eax,dword ptr ss:[ebp+8]                               |
```

8.4.7 加密方法

8.5 小结

## 第9章 Process Explorer———最优秀的进程管理工具 
9.1 Process Explorer
9.2 具体有哪些优点呢
9.3 sysinternals

### 第10章	函数调用约定

10.1 函数调用约定

函数调用约定(Calling Convention) |

主要的函数调用约定如下。
- cdecl
- stdcall
- fastcall
  
术语说明
- 调用者————调用函数的一方。
- 被调用者————被调用的函数。
- 比如在main()函数中调用printf()函数时，调用者为main(),被调用者为printf().

10.1.1 cdecl

cdecl是主要在C语言中使用的方式，调用者负责处理栈。

```C
int add(int a, int b)
{
	return a + b;
}

int main(int argc, char* argv[])
{
	return add(1, 2);
}
```

```shell
00EF17F2  | 6A 02              | push 2                                                     | cdecl.c:12
00EF17F4  | 6A 01              | push 1                                                     |
00EF17F6  | E8 28F8FFFF        | call cdecl.EF1023                                          |
00EF17FB  | 83C4 08            | add esp,8                                                  |
```

```shell
00EF1F10  | 55                 | push ebp                                                   | exe_common.inl:77
00EF1F11  | 8BEC               | mov ebp,esp                                                |
00EF1F13  | 83EC 0C            | sub esp,C                                                  |
00EF1F16  | E8 83F3FFFF        | call cdecl.EF129E                                          | exe_common.inl:78
00EF1F1B  | 8945 FC            | mov dword ptr ss:[ebp-4],eax                               | [ebp-4]:&"ALLUSERSPROFILE=C:\\ProgramData"
00EF1F1E  | E8 85F3FFFF        | call cdecl.EF12A8                                          |
00EF1F23  | 8B00               | mov eax,dword ptr ds:[eax]                                 |
00EF1F25  | 8945 F8            | mov dword ptr ss:[ebp-8],eax                               | [ebp-8]:&"E:\\Projects\\VisualStudioProjects\\cdecl\\Debug\\cdecl.exe"
00EF1F28  | E8 3CF1FFFF        | call cdecl.EF1069                                          |
00EF1F2D  | 8B08               | mov ecx,dword ptr ds:[eax]                                 | ecx:_E28DA64E_cdecl@c
00EF1F2F  | 894D F4            | mov dword ptr ss:[ebp-C],ecx                               | ecx:_E28DA64E_cdecl@c
00EF1F32  | 8B55 FC            | mov edx,dword ptr ss:[ebp-4]                               | [ebp-4]:&"ALLUSERSPROFILE=C:\\ProgramData"
00EF1F35  | 52                 | push edx                                                   |
00EF1F36  | 8B45 F8            | mov eax,dword ptr ss:[ebp-8]                               | [ebp-8]:&"E:\\Projects\\VisualStudioProjects\\cdecl\\Debug\\cdecl.exe"
00EF1F39  | 50                 | push eax                                                   |
00EF1F3A  | 8B4D F4            | mov ecx,dword ptr ss:[ebp-C]                               | ecx:_E28DA64E_cdecl@c
00EF1F3D  | 51                 | push ecx                                                   | ecx:_E28DA64E_cdecl@c
00EF1F3E  | E8 92F3FFFF        | call cdecl.EF12D5                                          |
00EF1F43  | 83C4 0C            | add esp,C                                                  |
00EF1F46  | 8BE5               | mov esp,ebp                                                | exe_common.inl:79
00EF1F48  | 5D                 | pop ebp                                                    |
00EF1F49  | C3                 | ret                                                        |
```

10.1.2 stdcall


```shell
00F41780  | 55                 | push ebp                                                   | cdecl.c:6
00F41781  | 8BEC               | mov ebp,esp                                                |
00F41783  | 81EC C0000000      | sub esp,C0                                                 |
00F41789  | 53                 | push ebx                                                   |
00F4178A  | 56                 | push esi                                                   | esi:__enc$textbss$end+23
00F4178B  | 57                 | push edi                                                   |
00F4178C  | 8BFD               | mov edi,ebp                                                |
00F4178E  | 33C9               | xor ecx,ecx                                                | ecx:_E28DA64E_cdecl@c
00F41790  | B8 CCCCCCCC        | mov eax,CCCCCCCC                                           | eax:_E28DA64E_cdecl@c
00F41795  | F3:AB              | rep stosd                                                  |
00F41797  | B9 00C0F400        | mov ecx,<cdecl._E28DA64E_cdecl@c>                          | cdecl.c:15732480, ecx:_E28DA64E_cdecl@c
00F4179C  | E8 7FFBFFFF        | call cdecl.F41320                                          |
00F417A1  | 90                 | nop                                                        |
00F417A2  | 8B45 08            | mov eax,dword ptr ss:[ebp+8]                               | cdecl.c:7, eax:_E28DA64E_cdecl@c
00F417A5  | 0345 0C            | add eax,dword ptr ss:[ebp+C]                               | eax:_E28DA64E_cdecl@c, [ebp+C]:&"E:\\Projects\\VisualStudioProjects\\cdecl\\Debug\\cdecl.exe"
00F417A8  | 5F                 | pop edi                                                    | cdecl.c:8
00F417A9  | 5E                 | pop esi                                                    | esi:__enc$textbss$end+23
00F417AA  | 5B                 | pop ebx                                                    |
00F417AB  | 81C4 C0000000      | add esp,C0                                                 |
00F417B1  | 3BEC               | cmp ebp,esp                                                |
00F417B3  | E8 8CFAFFFF        | call cdecl.F41244                                          |
00F417B8  | 8BE5               | mov esp,ebp                                                |
00F417BA  | 5D                 | pop ebp                                                    |
00F417BB  | C2 0800            | ret 8                                                      |
```

10.1.3 fastcall

### 第11章	视频讲座
11.1 运行
11.2 分析 
11.2.1 目标 (1): 去除消息框
11.2.2 打补丁 (1): 去除消息框
11.2.3 目标 (2): 查找注册码
11.3 小结

### 第12章	究竟应当如何学习代码逆向分析
12.1 逆向工程 
12.1.1 任何学习都应当有目标
12.1.2 拥有积极心态
12.1.3 要感受其中的乐趣
12.1.4 让检索成为日常生活的一部分
12.1.5 最重要的是实践
12.1.6 请保持平和的心态

## 第二部分 PE文件格式


## Windows Visual Studio 的常用命令，例如：编译、连接、生成可执行文件等等

在 **Windows Visual Studio** 环境中，常用的命令涉及编译、链接、构建项目等操作。这些命令可以通过 **Visual Studio 命令行工具**（如 `Developer Command Prompt` 或 `Developer PowerShell`）执行，也可以集成到脚本中实现自动化构建。以下是核心命令及其用途和示例：

---

### **一、核心命令行工具**
#### **1. `MSBuild`（项目构建工具）**
- **作用**：用于构建 `.sln` 解决方案文件或 `.vcxproj` 项目文件。
- **常用命令**：
  ```bash
  # 构建整个解决方案（默认配置）
  MSBuild MySolution.sln

  # 指定配置（Debug/Release）和平台（x86/x64）
  MSBuild MySolution.sln /p:Configuration=Release /p:Platform=x64

  # 仅构建指定项目
  MSBuild MyProject.vcxproj /t:Build
  ```

#### **2. `cl.exe`（C/C++ 编译器）**
- **作用**：编译 C/C++ 源文件（`.cpp`、`.c`）生成对象文件（`.obj`）。
- **常用命令**：
  ```bash
  # 编译单个文件（默认生成同名 .obj）
  cl /c main.cpp

  # 指定输出文件名和优化选项
  cl /c /O2 /Fomain.obj main.cpp

  # 多文件编译（生成多个 .obj）
  cl /c file1.cpp file2.cpp
  ```

#### **3. `link.exe`（链接器）**
- **作用**：将对象文件（`.obj`）和库文件（`.lib`）链接为可执行文件（`.exe`）或动态库（`.dll`）。
- **常用命令**：
  ```bash
  # 链接生成可执行文件
  link main.obj utils.obj /OUT:MyApp.exe

  # 链接动态库（生成 .dll）
  link /DLL math.obj /OUT:MathLibrary.dll

  # 指定依赖库（如 Windows API）
  link main.obj user32.lib gdi32.lib /OUT:MyApp.exe
  ```

---

### **二、常用编译和链接参数**
#### **1. 编译器参数（`cl.exe`）**
| **参数**          | **说明**                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `/c`               | 仅编译，不链接（生成 `.obj` 文件）                                      |
| `/O1`, `/O2`, `/Ox`| 优化等级（最小体积、最大速度、全优化）                                   |
| `/I<目录>`         | 添加头文件搜索目录（如 `/I"C:\MyLib\include"`）                         |
| `/D<宏>`           | 定义预处理器宏（如 `/DDEBUG`）                                          |
| `/EHsc`            | 启用 C++ 异常处理（必须用于包含异常的代码）                              |

#### **2. 链接器参数（`link.exe`）**
| **参数**          | **说明**                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `/OUT:<文件名>`    | 指定输出文件名（默认基于第一个输入文件）                                 |
| `/LIBPATH:<目录>`  | 添加库文件搜索目录（如 `/LIBPATH:"C:\MyLib\lib"`）                      |
| `/SUBSYSTEM:CONSOLE` | 控制台应用程序（显示命令行窗口）                                       |
| `/SUBSYSTEM:WINDOWS` | GUI 应用程序（不显示命令行窗口）                                      |
| `/DEBUG`           | 生成调试信息（需与 `/Zi` 编译选项配合）                                 |

---

### **三、完整构建流程示例**
#### **1. 手动编译链接**
```bash
# 编译源文件
cl /c /EHsc /Iinclude /O2 src\main.cpp src\utils.cpp

# 链接生成可执行文件
link main.obj utils.obj /OUT:MyApp.exe /LIBPATH:lib user32.lib
```

#### **2. 使用 `devenv` 命令（集成 IDE 功能）**
```bash
# 构建解决方案（不打开 IDE）
devenv MySolution.sln /Build "Release|x64"

# 清理项目
devenv MySolution.sln /Clean
```

---

### **四、实用环境配置**
#### **1. 设置环境变量**
- 运行 `Developer Command Prompt` 或 `Developer PowerShell`，它们已自动配置以下路径：
  - **编译器/链接器路径**：如 `C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.30.30705\bin\Hostx64\x64`。
  - **库和头文件路径**：自动包含 Windows SDK 和 CRT 路径。

#### **2. 查看工具版本**
```bash
# 查看 cl.exe 版本
cl /?

# 查看 link.exe 版本
link /?
```

---

### **五、进阶工具与场景**
#### **1. `nmake`（Makefile 构建）**
- **作用**：通过 `Makefile` 文件管理构建流程。
- **示例**：
  ```bash
  # 生成 Makefile（需编写规则）
  nmake /f MyMakefile.mak
  ```

#### **2. `vcpkg`（包管理）**
- **作用**：集成第三方库（如 OpenSSL、Boost）。
- **示例**：
  ```bash
  # 安装库并集成到项目
  vcpkg install zlib:x64-windows
  ```

#### **3. `dumpbin.exe`（查看二进制信息）**
- **作用**：分析可执行文件或库的符号、依赖项。
- **示例**：
  ```bash
  # 查看 DLL 的导出函数
  dumpbin /exports MyLibrary.dll
  ```

---

### **总结**
通过上述命令，可以在 **Visual Studio** 环境中实现高效的项目构建与管理。掌握 `MSBuild`、`cl.exe` 和 `link.exe` 的核心用法，能够灵活应对从简单编译到复杂项目构建的需求，同时结合 `Developer Command Prompt` 的环境配置，确保编译链接过程无缝衔接。