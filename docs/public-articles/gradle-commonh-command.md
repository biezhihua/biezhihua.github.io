# Gralde Common Command

在 Gradle 中，用于依赖管理的关键字有几个，主要用于配置项目中库的依赖关系。随着 Gradle 版本的更新，某些术语已经被新的替换或者有了更加明确的用途。以下是一些常用的依赖配置关键字及其作用：

### 1. `compile` (已废弃)
- **用途**：`compile` 是旧版 Gradle 中用来添加库依赖的。被依赖的库会参与到编译、运行时的类路径中。
- **问题**：它不区分编译时和运行时依赖，所有依赖都会被打包进最终构建的 APK 或 JAR 中，可能导致不必要的库膨胀。

### 2. `api` (替代 `compile`)
- **用途**：在 Android Gradle 插件 3.0 以上使用。当你的库在公共 API 中暴露了其他模块的类型时使用。依赖传递给消费者。
- **特点**：对于库模块，如果一个依赖是通过 `api` 配置的，那么这个依赖会出现在库的使用者的编译路径上。

### 3. `implementation` (替代 `compile`)
- **用途**：推荐用来替换 `compile`。它只会将库包含在编译类路径中，不会暴露给消费者。
- **特点**：这意味着使用 `implementation` 声明的依赖不会被传递给依赖项的消费者。这有助于减少模块间的耦合，并可能减少编译时间。

### 4. `compileOnly` (类似于 Maven 的 `provided`)
- **用途**：只在编译时有效，运行时无效。适用于只需要在编译时期参与编译的库，比如注解处理器。
- **特点**：运行时需要保证这些依赖由环境提供，常用于插件或容器提供的 API。

### 5. `providedCompile` (已废弃)
- **用途**：旧版 Gradle 中的用法，类似于 `compileOnly`，用于指定编译时需要，但不打包到最终产物中的依赖。
- **问题**：随着 Gradle 版本的升级，通常被 `compileOnly` 替代。

### 6. `provided` (已废弃)
- **用途**：类似于 `providedCompile`，旧的依赖管理方式，现在通常使用 `compileOnly`。

### 总结：
- 使用 `api` 和 `implementation` 来替代老的 `compile`，具体选择取决于是否想将依赖的库暴露给消费者。
- 使用 `compileOnly` 替代 `providedCompile` 和 `provided`，用于那些仅在编译时需要而运行时由执行环境提供的库。