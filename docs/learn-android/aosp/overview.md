---
article: false
---

# AOSP

## aosp 切换分支

切换分支需要先进入到你本地的AOSP代码目录中，然后使用以下命令：

bash

```bash
repo init -b <branch-name>
repo sync
```

其中`<branch-name>`指定你要切换到的分支名，例如切换到Android 13的分支，则可以使用以下命令：

bash

```bash
repo init -b android-13.0.0_r41
repo sync
```

执行完以上命令后，AOSP代码就会被同步到对应的分支。注意，切换分支可能会导致一些代码库的版本变化，需要谨慎操作。
