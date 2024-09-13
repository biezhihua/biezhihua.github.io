# LR(1) 解析器详解

LR(1) 解析器是一种强大的自底向上语法分析方法，广泛应用于编译器设计中。它能够有效地处理上下文无关文法，并生成语法分析树。本文将详细介绍 LR(1) 解析器的各类概念，包括推导、规约、展望、展望符、文法、终结符、非终结符、产生式、产生式集合、FIRST 集、闭包、GOTO 表、表达式的含义，并阐述它们之间的协作关系。最后，我们将使用 C++11 编写一些示例代码来帮助理解，并且不使用运算符重载。

## 目录

- [LR(1) 解析器详解](#lr1-解析器详解)
  - [目录](#目录)
  - [1. 文法（Grammar）](#1-文法grammar)
  - [2. 终结符和非终结符](#2-终结符和非终结符)
  - [3. 产生式和产生式集合](#3-产生式和产生式集合)
  - [4. 推导和规约](#4-推导和规约)
  - [5. FIRST 集](#5-first-集)
  - [6. 展望和展望符](#6-展望和展望符)
  - [7. 闭包（Closure）](#7-闭包closure)
  - [8. GOTO 函数和 GOTO 表](#8-goto-函数和-goto-表)
  - [9. 表达式的含义](#9-表达式的含义)
  - [10. 各概念的协作关系](#10-各概念的协作关系)
  - [11. C++11 示例代码](#11-c11-示例代码)
    - [11.1 定义数据结构](#111-定义数据结构)
    - [11.2 构建 FIRST 集](#112-构建-first-集)
    - [11.3 构建项目集规范族](#113-构建项目集规范族)
    - [11.4 主函数](#114-主函数)
  - [12. 总结](#12-总结)

---

## 1. 文法（Grammar）

**文法**是描述语言语法结构的规则集合，由以下四部分组成：

- **非终结符集合（N）**：表示语法结构的符号，如表达式、语句等。
- **终结符集合（Σ）**：实际输入的基本符号，如关键字、运算符、标识符等。
- **开始符号（S）**：文法的起始非终结符，表示语法分析的入口。
- **产生式集合（P）**：定义非终结符如何展开为终结符和非终结符的规则。

文法通常表示为四元组 \( G = (N, Σ, P, S) \)。

**示例：**

```
E  → E + T
E  → T
T  → T * F
T  → F
F  → ( E )
F  → id
```

## 2. 终结符和非终结符

- **终结符（Terminal symbols）**：不能再被展开的基本符号，通常对应于词法分析器的输出，例如 `+`、`*`、`(`、`)`、`id` 等。
- **非终结符（Non-terminal symbols）**：可以被展开为其他符号的符号，表示语法结构，例如 `E`、`T`、`F`。

在上述示例中：

- **终结符**：`+`、`*`、`(`、`)`、`id`
- **非终结符**：`E`、`T`、`F`

## 3. 产生式和产生式集合

**产生式（Production）**是描述非终结符如何展开的规则，形式为 \( A \rightarrow \alpha \)，其中 \( A \) 是非终结符，\( \alpha \) 是终结符和非终结符的串。

**产生式集合（P）**是所有产生式的集合，定义了文法的完整规则。

**示例：**

```
P = {
    E  → E + T,
    E  → T,
    T  → T * F,
    T  → F,
    F  → ( E ),
    F  → id
}
```

## 4. 推导和规约

**推导（Derivation）**是根据文法产生式，从开始符号逐步替换非终结符，直到生成终结符串的过程。

**规约（Reduction）**是推导的逆过程，在语法分析中，从输入串逐步将终结符和非终结符替换为对应的非终结符，直到规约为开始符号。

**示例：**

- **推导过程：**

  ```
  E
  ⇒ E + T
  ⇒ T + T
  ⇒ F + T
  ⇒ id + T
  ⇒ id + F
  ⇒ id + id
  ```

- **规约过程：**

  ```
  id + id
  ⇒ F + id
  ⇒ T + id
  ⇒ E + id
  ⇒ E
  ```

## 5. FIRST 集

**FIRST 集**用于确定一个符号串可能首先产生的终结符集合，对于预测分析和构建 LR(1) 项目集至关重要。

**定义：**

- 对于符号串 \( \alpha \)，\( FIRST(\alpha) \) 是所有可能作为 \( \alpha \) 的第一个符号的终结符集合。

**计算方法：**

1. **对于终结符 \( a \)**，\( FIRST(a) = \{ a \} \)。
2. **对于非终结符 \( A \)**，递归计算 \( FIRST(A) \)：
   - 对于每个产生式 \( A \rightarrow \alpha \)，将 \( FIRST(\alpha) \) 加入 \( FIRST(A) \)。
3. **对于符号串 \( \alpha \beta \)**，如果 \( \varepsilon \in FIRST(\alpha) \)，则 \( FIRST(\alpha \beta) = FIRST(\alpha) \cup FIRST(\beta) \)；否则 \( FIRST(\alpha \beta) = FIRST(\alpha) \)。

**示例：**

计算 `FIRST(F)`：

- `F → ( E )`，`FIRST(( E )) = { ( }`
- `F → id`，`FIRST(id) = { id }`
- 因此，`FIRST(F) = { ( , id }`

## 6. 展望和展望符

**展望（Lookahead）**是指在语法分析过程中，解析器查看后续输入符号以决定下一步操作的能力。

**展望符（Lookahead symbol）**是在 LR(1) 项目中使用的符号，用于指导解析器何时进行规约操作。

**定义：**

- 在项目 \( [A \rightarrow \alpha \cdot \beta, a] \) 中，展望符 \( a \) 表示在输入符号为 \( a \) 时，可以考虑对 \( A \rightarrow \alpha \beta \) 进行规约。

**作用：**

- 展望符帮助解析器准确地预测何时应用某个产生式的规约，避免语法分析中的冲突。

**示例：**

- 项目 \( [E \rightarrow E + T \cdot, \$] \) 中的展望符为 `\$`，表示在输入结束符 `\$` 时，可以对 `E → E + T` 进行规约。

## 7. 闭包（Closure）

**闭包**是用于构建 LR(1) 项目集的关键概念。

**项目（Item）**：带有位置标记和展望符的产生式，形式为 \( [A \rightarrow \alpha \cdot \beta, a] \)。

**闭包计算：**

1. 初始化闭包为给定的项目集合。
2. 对于闭包中的每个项目 \( [A \rightarrow \alpha \cdot B \beta, a] \)，如果 `•` 后面是非终结符 `B`，则对于 `B` 的每个产生式 \( B \rightarrow \gamma \)，将项目 \( [B \rightarrow \cdot \gamma, b] \) 加入闭包，其中 `b` 属于 \( FIRST(\beta a) \)。

**示例：**

假设项目 \( [E \rightarrow E \cdot + T, a] \)，`•` 后面是终结符 `+`，则不需扩展。若 `•` 后面是非终结符，则需根据其产生式和展望符扩展闭包。

## 8. GOTO 函数和 GOTO 表

**GOTO 函数**描述了在项目集之间基于某个符号的转移关系。

**定义：**

- 对于项目集 \( I \) 和符号 \( X \)，\( GOTO(I, X) \) 是所有在 \( I \) 中的项目中 `•` 后面是 \( X \) 的项目，`•` 前进一位后得到的项目集合，再对其求闭包。

**GOTO 表**记录了所有状态之间的转移关系，用于解析器在分析过程中的状态跳转。

**示例：**

如果有项目 \( [A \rightarrow \alpha \cdot X \beta, a] \) 在集合 \( I \) 中，那么 \( GOTO(I, X) \) 将包含项目 \( [A \rightarrow \alpha X \cdot \beta, a] \) 的闭包。

## 9. 表达式的含义

在 LR(1) 解析器中，**表达式**通常指代项目，描述了解析器在分析过程中的状态和预期。

**项目表示：**

- \( [A \rightarrow \alpha \cdot \beta, a] \)：表示已经识别了 \( \alpha \)，接下来期望看到 \( \beta \)，并在展望符 \( a \) 下应用规约。

**项目的作用：**

- 指示解析器在当前状态下可能的移动（移入）和规约操作。

## 10. 各概念的协作关系

- **文法**定义了语言的完整语法规则，由**产生式集合**描述。
- **终结符**和**非终结符**是文法的基本组成元素。
- **推导**和**规约**描述了解析器如何生成或还原输入串。
- **FIRST 集**用于预测可能的输入，辅助构建项目集和分析表。
- **展望符**在项目中指示了何时进行规约操作，避免语法分析中的冲突。
- **闭包**和 **GOTO 函数**用于构建 LR(1) 项目集规范族，确定解析器的状态转移。
- **表达式（项目）**表示解析器的当前状态和预期操作。
- **GOTO 表**是在构建项目集规范族后生成的，用于在解析过程中进行状态转移。

它们共同协作，实现了 LR(1) 解析器对输入串的正确解析。

## 11. C++11 示例代码

下面通过一个简单的 C++11 程序，演示如何构建 FIRST 集、项目集规范族和 GOTO 表，重点展示展望符的处理。在代码中，我们将避免使用运算符重载。

### 11.1 定义数据结构

```cpp
#include <iostream>
#include <map>
#include <set>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>

using namespace std;

// 产生式
struct Production {
    string left;                 // 左部
    vector<string> right;        // 右部
};

// 项目
struct Item {
    string left;                 // 左部
    vector<string> right;        // 右部
    int dotPosition;             // 圆点位置
    string lookahead;            // 展望符
};

// 比较器，用于在集合中存储 Item
struct ItemComparator {
    bool operator()(const Item& a, const Item& b) const {
        if (a.left != b.left) return a.left < b.left;
        if (a.right != b.right) return a.right < b.right;
        if (a.dotPosition != b.dotPosition) return a.dotPosition < b.dotPosition;
        return a.lookahead < b.lookahead;
    }
};

// 状态
struct State {
    set<Item, ItemComparator> items;           // 项目集
    map<string, int> transitions;              // 状态转移
};

// 文法
class Grammar {
public:
    set<string> terminals;                     // 终结符集合
    set<string> nonTerminals;                  // 非终结符集合
    vector<Production> productions;            // 产生式集合
    map<string, set<string>> firstSets;        // FIRST 集
    string startSymbol;                        // 开始符号

    // 添加产生式
    void addProduction(const string& left, const vector<string>& right) {
        productions.push_back({left, right});
        nonTerminals.insert(left);
        for (const auto& symbol : right) {
            if (isNonTerminal(symbol)) {
                nonTerminals.insert(symbol);
            } else {
                if (symbol != "ε") {
                    terminals.insert(symbol);
                }
            }
        }
    }

    // 判断是否为非终结符
    bool isNonTerminal(const string& symbol) const {
        return isupper(symbol[0]);
    }

    // 计算 FIRST 集
    void computeFirstSets() {
        // 初始化
        for (const auto& terminal : terminals) {
            firstSets[terminal] = {terminal};
        }
        for (const auto& nonTerminal : nonTerminals) {
            firstSets[nonTerminal] = {};
        }

        bool changed = true;
        while (changed) {
            changed = false;
            for (const auto& prod : productions) {
                const string& A = prod.left;
                size_t before = firstSets[A].size();

                bool nullable = true;
                for (const auto& symbol : prod.right) {
                    const auto& firstSet = firstSets[symbol];
                    firstSets[A].insert(firstSet.begin(), firstSet.end());
                    if (firstSet.find("ε") == firstSet.end()) {
                        nullable = false;
                        break;
                    } else {
                        firstSets[A].erase("ε");
                    }
                }
                if (nullable) {
                    firstSets[A].insert("ε");
                }

                if (firstSets[A].size() > before) {
                    changed = true;
                }
            }
        }
    }

    // 打印 FIRST 集
    void printFirstSets() const {
        for (const auto& pair : firstSets) {
            const auto& symbol = pair.first;
            const auto& firstSet = pair.second;
            cout << "FIRST(" << symbol << ") = { ";
            for (const auto& s : firstSet) {
                cout << s << " ";
            }
            cout << "}\n";
        }
    }
};
```

### 11.2 构建 FIRST 集

```cpp
// 已在上面的代码中实现 computeFirstSets() 和 printFirstSets() 方法
```

### 11.3 构建项目集规范族

```cpp
class LR1Parser {
public:
    Grammar grammar;
    vector<State> states;                        // 状态集
    map<pair<int, string>, int> gotoTable;       // GOTO 表

    LR1Parser(const Grammar& g) : grammar(g) {}

    // 构建项目集规范族
    void buildCanonicalCollection() {
        // 添加拓广文法的开始符号
        string augmentedStart = grammar.startSymbol + "'";
        grammar.nonTerminals.insert(augmentedStart);
        grammar.productions.insert(grammar.productions.begin(), {augmentedStart, {grammar.startSymbol}});

        // 初始项
        Item startItem = {augmentedStart, {grammar.startSymbol}, 0, "$"};
        State startState = closure({startItem});
        states.push_back(startState);

        queue<int> que;
        que.push(0);

        while (!que.empty()) {
            int idx = que.front();
            que.pop();
            State& state = states[idx];

            set<string> symbols;
            for (const auto& item : state.items) {
                if (item.dotPosition < item.right.size()) {
                    symbols.insert(item.right[item.dotPosition]);
                }
            }

            for (const auto& symbol : symbols) {
                State newState = gotoState(state, symbol);
                int existingIndex = findState(newState);
                if (existingIndex == -1) {
                    states.push_back(newState);
                    existingIndex = states.size() - 1;
                    que.push(existingIndex);
                }
                gotoTable[{idx, symbol}] = existingIndex;
            }
        }
    }

    // 闭包操作
    State closure(const set<Item, ItemComparator>& items) {
        State state;
        state.items = items;

        bool changed = true;
        while (changed) {
            changed = false;
            set<Item, ItemComparator> newItems = state.items;

            for (const auto& item : state.items) {
                if (item.dotPosition < item.right.size()) {
                    const string& B = item.right[item.dotPosition];
                    if (grammar.isNonTerminal(B)) {
                        set<string> lookaheads = computeLookaheads(item);
                        for (const auto& prod : grammar.productions) {
                            if (prod.left == B) {
                                for (const auto& la : lookaheads) {
                                    Item newItem = {B, prod.right, 0, la};
                                    if (state.items.find(newItem) == state.items.end()) {
                                        newItems.insert(newItem);
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            state.items = newItems;
        }
        return state;
    }

    // GOTO 操作
    State gotoState(const State& state, const string& symbol) {
        set<Item, ItemComparator> items;
        for (const auto& item : state.items) {
            if (item.dotPosition < item.right.size() && item.right[item.dotPosition] == symbol) {
                Item newItem = item;
                newItem.dotPosition++;
                items.insert(newItem);
            }
        }
        return closure(items);
    }

    // 查找状态是否已存在
    int findState(const State& state) {
        for (size_t i = 0; i < states.size(); ++i) {
            if (stateEqual(states[i], state)) {
                return i;
            }
        }
        return -1;
    }

    // 状态比较函数
    bool stateEqual(const State& a, const State& b) const {
        if (a.items.size() != b.items.size()) return false;
        auto it1 = a.items.begin();
        auto it2 = b.items.begin();
        while (it1 != a.items.end() && it2 != b.items.end()) {
            if (!itemEqual(*it1, *it2)) return false;
            ++it1;
            ++it2;
        }
        return true;
    }

    // 项目比较函数
    bool itemEqual(const Item& a, const Item& b) const {
        return a.left == b.left &&
               a.right == b.right &&
               a.dotPosition == b.dotPosition &&
               a.lookahead == b.lookahead;
    }

    // 计算展望符
    set<string> computeLookaheads(const Item& item) {
        set<string> result;
        vector<string> betaA;

        // 获取 βa
        if (item.dotPosition + 1 < item.right.size()) {
            betaA.insert(betaA.end(), item.right.begin() + item.dotPosition + 1, item.right.end());
        }
        betaA.push_back(item.lookahead);

        set<string> first = computeFirst(betaA);
        result.insert(first.begin(), first.end());
        return result;
    }

    // 计算符号串的 FIRST 集
    set<string> computeFirst(const vector<string>& symbols) {
        set<string> result;
        bool nullable = true;
        for (const auto& symbol : symbols) {
            const auto& firstSet = grammar.firstSets[symbol];
            result.insert(firstSet.begin(), firstSet.end());
            if (firstSet.find("ε") == firstSet.end()) {
                nullable = false;
                break;
            } else {
                result.erase("ε");
            }
        }
        if (nullable) {
            result.insert("ε");
        }
        return result;
    }

    // 打印状态集
    void printStates() const {
        for (size_t i = 0; i < states.size(); ++i) {
            cout << "State " << i << ":\n";
            for (const auto& item : states[i].items) {
                cout << "  [" << item.left << " → ";
                for (size_t j = 0; j < item.right.size(); ++j) {
                    if (j == item.dotPosition) {
                        cout << "• ";
                    }
                    cout << item.right[j] << " ";
                }
                if (item.dotPosition == item.right.size()) {
                    cout << "• ";
                }
                cout << ", " << item.lookahead << "]\n";
            }
            cout << endl;
        }
    }

    // 打印 GOTO 表
    void printGotoTable() const {
        cout << "GOTO Table:\n";
        for (const auto& pair : gotoTable) {
            cout << "  From State " << pair.first.first << " via '" << pair.first.second << "' to State " << pair.second << endl;
        }
    }
};
```

### 11.4 主函数

```cpp
int main() {
    Grammar grammar;
    grammar.startSymbol = "E";

    // 添加产生式
    grammar.addProduction("E", {"E", "+", "T"});
    grammar.addProduction("E", {"T"});
    grammar.addProduction("T", {"T", "*", "F"});
    grammar.addProduction("T", {"F"});
    grammar.addProduction("F", {"(", "E", ")"});
    grammar.addProduction("F", {"id"});

    // 计算 FIRST 集
    grammar.computeFirstSets();
    grammar.printFirstSets();

    // 构建 LR(1) 解析器
    LR1Parser parser(grammar);
    parser.buildCanonicalCollection();
    parser.printStates();
    parser.printGotoTable();

    return 0;
}
```

## 12. 总结

通过上述 C++11 示例代码，我们展示了如何在不使用运算符重载的情况下，构建 LR(1) 解析器的核心部分。理解文法、终结符、非终结符、产生式、推导、规约、FIRST 集、展望符、闭包、GOTO 表和表达式（项目）之间的协作关系，对于掌握编译原理和语法分析器的实现至关重要。希望通过这份详细的解释和代码示例，您能够更深入地理解 LR(1) 解析器的工作原理。

如果您有任何疑问或需要进一步的解释，请随时提问！