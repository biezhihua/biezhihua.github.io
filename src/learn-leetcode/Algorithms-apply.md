# 算法应用

## 最小值和最大值

### 寻找最小值

在下面的程序中，我们假设该集合元素存放在数组A中，且A.length = n：

```
MINIMUM(A)
1. min = A[1]
2. for i = 2 to n
3.     if min > A[i]
4.        min = A[i]
5. return min
```

我们得到结论：为了确定最小值，必须要做n-1次比较。因此，从所执行的比较次数来看，算法MINIMUM是最优的。

### 同时找到最小值和最大值

事实上，我们只需要最多$3\left \lfloor 2/n \right \rfloor$次比较就可以同时找到最小值和最大值。具体的方法是记录已知的最小值和最大值。但我们并不是将每一个输人元素与当前的最小值和最大值进行比较一一这样做的代价是每个元素需要 2 次比较，而是对输元素成对地进行处理。首先，我们将一对输人元素相互进行比较，然后把较小的与当前最小值比较，把较大的与当前最大值进行比较。这样，对每两个元素共需 3 次比较。

如何设定已知的最小值和最大值的初始值依赖于n是奇数还是偶数。如果n是奇数，我们就将最小值和最大值的初值都设为第一个元素的值，然后成对地处理余下的元素。如果n是偶数，就对前两个元素做一次比较，以决定最小值和最大值的初值，然后与n是奇数的情形一样，成对地处理余下的元素。

如果n是奇数，那么总共进行$3\left \lfloor 2/n \right \rfloor$次比较。如果n是偶数，则是先进行一次初始比较，然后进行3(n—2)/2次比较，共3n/2-2次比较。因此，不管是哪一种情况，总的比较次数至多是$3\left \lfloor 2/n \right \rfloor$。

```
MIN-MAX(A)
1  n = A.length
2  if n is odd
3      min = max = A[1]
4  else if A[1] < A[2]
5      min = A[1]
6      max = A[2]
7  else
8      min = A[2]
9      max = A[1]
10 for i = 3 to n-1 step 2
11     if A[i] > A[i+1]
12         if A[i] > max
13             max = A[i]
14         if A[i+1] < min
15             min = A[i+1]
16     else
17         if A[i+1] > max
18             max = A[i+1]
19         if A[i] < min
20             min = A[i]
21 return (min, max)
```

该算法首先判断数组的长度 $n$ 是否为奇数，如果是奇数则将 $min$ 和 $max$ 的初值均设为 $A[1]$。如果是偶数，则将 $A[1]$ 和 $A[2]$ 进行比较，将较小的数赋给 $min$，较大的数赋给 $max$。接着，从下标 $3$ 开始遍历数组，每次取两个数进行比较，更新 $min$ 和 $max$ 的值。在比较两个数的大小时，如果 $A[i] > A[i+1]$，则说明 $A[i]$ 可能是最大值，$A[i+1]$ 可能是最小值；如果 $A[i] < A[i+1]$，则说明 $A[i+1]$ 可能是最大值，$A[i]$ 可能是最小值。最后返回最小值和最大值的元组。

## 最大子数组问题

MAXIMUM SUBARRAY PROBLEM

https://segmentfault.com/a/1190000000733277

https://en.wikipedia.org/wiki/Maximum_subarray_problem

https://zh.wikipedia.org/wiki/%E6%9C%80%E5%A4%A7%E5%AD%90%E6%95%B0%E5%88%97%E9%97%AE%E9%A2%98

### 暴力求解 - 思路

### 分治策略 - 思路

假定我们要寻找子数组$A[low.. high]$的最大子数组。

使用分治策略意味着我们要将子数组划分为两个规模尽量相等的子数组。

也就是说，找到子数组的中央位置，比如$mid$，然后考虑求解两个子数组$A[low..mid]$和$A[mid+1..high]$，但是仅仅这样还不够，$A[low..high]$的任何连续子数组$A[i..j]$所处的位置必然是以下三种情况之一：
- 完全位于子数组$A[low..mid]$中，$low <= i <= j <= mid$。
- 完全位于子数组$A[mid+1..high]$中，$min < i <= j <= high$。
- 跨越了中点，$low <= i <= mid < j <= high$。

也就是说，$A[low..high]$的一个最大子数组必然是下列三种情况下的子数组中的和的最大者：
- 完全位于$A[low..mid]$中
- 完全位于$A[mid+1..high]$中
- 完全位于跨越中点$A[low， hight]中

我们可以递归地求解$A[low..mid]$和$A[mid+1..high]$的最大子数组，因为这两个子问题仍是最大子数组问题，只是规模更小。

因此，剩下的全部工作就是寻找跨越中点的最大子数组，然后在三种情况中选取和最大者。

我们可以很容易地在线性时间内求出跨越中点的最大子数组。此问题并非原问题规模更小的实例，因为它加入了限制 - 求出的子数组必须跨越中点。

任何跨越中点的子数组都由两个子数组$A[i..mid]$和$A[mid+1..j]$组成，其中$low <= i <= min 且 min < j <= high$。

因此，我们只需找出形如$A[i..mid]$和$A[mid+1..j]$的最大子数组，然后将其合并即可。

过程FIND-MAX-CROSSING-SUBARRAY接收数组$A$和下标$low$、$mid$和$high$为输入，返回一个下标元组划定跨越中点的最大子数组的边界，并返回最大子数组中值的和。

FIND-MAX-CROSSING-SUBARRAY(A，low， mid，high)
```
1 left-sum = -oo 
2 sum = 0 
3 for i = mid downto low 
4       sum = sum+A[i] 
5       if sum > left-sum 
6           left-sum = sum 
7           max-left = i 
8  right-sum = -oo 
9  sum = 0 
10 for j = mid + 1 to high 
11      sum = sum + A[j] 
12      if sum > right-sum 
13          right-sum = sum 
14          max-right = j 
15 return (max-left，max-right，left-sum + right-sum) 
```

此过程的工作方式如下所述：
- 第1~7行求出左半部$A[low..mid]$的最大子数组。
    - 由于此子数组必须包含$A[mid]$，第3~7行的for循环的循环变量i是从mid开始，递减直至达到low，因此，它所考察的每个子数组都具有$A[i..mid]$的形式。
    - 第1~2行初始化变量left-sum和sum，前者保存目前为止找到的最大和，后者保存$A[i..mid]$中所有值的和。
    - 每当第5行找到一个子数组$A[i..mid]$的和大于left-sum时，我们在第6行将left-sum更新为这个子数组的和，并在第7行更新变量max-left来记录当前下标i。
- 第8~14求右半部$A[mid+1..high]$的最大子数组，过程与左半部类似。
    - 此处，第10~14行的for循环的循环变量j是从mid+l开始，递增直至达到high，因此，它所考察的每个子数组都具有$A[mid+1..j]$的形式。
    - 最后，第15行返回下标max-left和max-right，划定跨越中点的最大子数组的边界，并返回子数组$A[max-left. max-right]$的和left-sum+right-sum。

FIND-MAXIMUM-SUBARRAY(A，low，high)
```
1 if high == low // base case， only one element 
2       return (low， high， A[low]) 
3 else mid = ⌊(low+high)⌋ / 2 // recursive case
4       (left-low， left-high， left-sum) = FIND-MAXIMUM-SUBARRAY(A， low， mid) 
5       (right-low， right-high， right-sum) = FIND-MAXIMUM-SUBARRAY(A， mid+l. high) 
6       (cross-low， cross-high， cross-sum) = FIND-MAX-CROSSING-SUBARRAY(A， low， mid， high) 
7       if left-sum >= right-sum and left-sum >= cross-sum 
8           return (left-low， left-high， left-sum) 
9       elseif right-sum >= left-sum and right-sum >= cross-sum 
10          return (right-low， right-high， right-sum) 
11      else return (cross-low， cross-high， cross-sum)
```

调用FIND-MAXIMUM-SUBARRAY(A，1， A. length)会求出$A[1..n]$的最大子数组。
- 第1行测试基本情况，即子数组只有一个元素的情况。在此情况下，子数组只有一个子数组——它自身，因此第2行返回一个下标元组，开始和结束下标均指向唯一的元素，并返回此元素的值作为最大和。
- 第3~11行处理递归情况。
    - 第3行划分子数组，计算中点下标$mid$。我们称子数组$A[low..mid]$为左子数组，$A[mid+1..high]$为右子数组。因为我们知道子数组$A[low..high]$至少包含两个元元素，则左、右两个子数组各至少包含一个元素。
    - 第4行和第5行分别递归地求解左右子数组中的最大子数组。
    - 第6~11行完成合并工作。
        - 第6行，求跨越中点的最大子数组（回忆一下，第6行求解的子问题并非原问题的规模更小的实例，因为我们将其看做合并部分）。
        - 第7行，检测最大和子数组是否在左子数组中，若是，第8行返回此子数组。
        - 第9行，否则，检测最大和子数组是否在右子数组中，若是，第10行返回此子数组。
        - 第11行，如果左、右子数组均不包含最大子数组，则最大子数组必然跨越中点，第11行将其返回。

### 分治策略 - 分析

FIND-MAXIMUM-SUBARRAY运行时间$T(n)$的递归式：
$$
T(n) = \left\{\begin{matrix} \Theta (1) & 若n = 1 \\ 2T(n / 2) + \Theta(n) & 若n >= 1 \\  \end{matrix}\right.
$$

$T(n) = \Theta(nlgn)$

### 线性时间 - 思路

使用如下思想为最大子数组问题设计一个非递归的、线性时间的算法。

从数组的左边界开始，由左至右处理，记录到目前为止已经处理过的最大子数组。

若已知$A[1..j]$的最大子数组，基于如下性质将解扩展为$A[1..j+1]$的最大子数组：
- $A[1..j+1]$的最大子数组要么是$A[1..j]$的最大子数组，要么是某个子数组$A[i..j+1](i <= i <= j)$。

在已知$A[1..j]$的最大子数组的情况下，可以在线性时间内找出形如$A[i..j+1]$的最大子数组。

--- 

Kadane算法扫描一次整个数列的所有数值，在每一个扫描点计算以该点数值为结束点的子数列的最大和（正数和）。

该子数列由两部分组成：以前一个位置为结束点的最大子数列、该位置的数值。

因为该算法用到了“最佳子结构”（以每个位置为终点的最大子数列都是基于其前一位置的最大子数列计算得出），该算法可看成动态规划的一个例子。

--- 

```
int maxsubset(int *a,int l,int r){
    int i = 0
    int temp = 0;
    int summax=INT_MIN;
    for(i=l;i<=r;i++){
        temp+=a[i];
        if(temp > summax) summax=temp;
        if(temp < 0) temp=0;
    }
    return summax;
}
```

如果$A[1..j]$已经得到了其最大子数组，那么$A[1..j+1]$最大子数组只能是两种情况：
- （1）$A[1..j+1]$的最大子数组是$A[1..j]$;
- （2）$A[1..j+1]$的最大子数组是$A[i..j+1]， 1 <= i <= j$;

如何求得所谓的（2）中的$A[i..j+1]$呢？

首先需要承认这样的事实，如果一个数组$A[p..r]$求和得到负值，那么数组$A[p..r+1]$的最大子数组肯定不会是$A[p..r+1]$，因为$A[p..r] + A[r+1] < A[r+1]$。

在以上程序中，我们用temp存储所谓的$A[p..r]$，只要$A[p..r]$的求和是负值，那么从下一个$A[r+1]$值开始，temp重新从零开始求和，只要temp > summax，就更新summax，这样，我们一次遍历后，就能得到最大的summax。