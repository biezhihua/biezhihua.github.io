---
tag:
  - android
  - aosp
---

# Android | build aosp and run image to emulator in windows11

## environment

```text
// 宿主系统
Windows11

// 编译aosp系统
WSL2 - Ubuntu-18.04

// aosp分支
android-13.0.0_r41
```

::: danger
注意：AOSP代码必须存放在WLS2内部，否则在Windows上会产生很多未保存文件，影响分支切换，代码更新。
:::

## wsl2 is migrated to another hard disk

可以通过以下步骤将 WSL2 迁移至其他硬盘：

1. 关闭 WSL2

首先需要关闭正在运行的 WSL2，可以在 PowerShell 或 CMD 中输入以下命令：

```bash
wsl --shutdown
```

2. 导出 WSL2 镜像

使用以下命令导出 WSL2 镜像，其中 `<distribution>` 是要导出的发行版的名称，`<file>` 是导出的文件名和路径：

```bash
wsl --export <distribution> <file>
```

3. 删除旧的 WSL2 镜像

在导出镜像之前，需要删除原来的 WSL2 镜像。可以通过以下命令列出已安装的 WSL2 发行版：

```bash
wsl --list --verbose
```

然后通过以下命令删除指定的 WSL2 发行版：

```bash
wsl --unregister <distribution>
```

4. 导入 WSL2 镜像

使用以下命令导入 WSL2 镜像，其中 `<distribution>` 是要导入的发行版的名称，`<file>` 是导出的文件名和路径：

```bash
wsl --import <distribution> <directory> <file>
```

其中 `<directory>` 是新的 WSL2 镜像目录的路径。

5. 启动新的 WSL2

通过以下命令启动新的 WSL2：

```bash
wsl -d <distribution>
```

其中 `<distribution>` 是要启动的发行版的名称。

注意：在进行上述操作时，请确保备份重要数据并了解风险。

- <https://blog.csdn.net/zyb418/article/details/124114683>

## wls2 expand the capacity of ubuntu-18.04

- <https://learn.microsoft.com/zh-cn/windows/wsl/disk-space>
- <https://www.jianshu.com/p/2348dc7e9aef>
- <https://learn.microsoft.com/zh-cn/windows-server/administration/windows-commands/expand-vdisk>

## aosp install repo

```bash
sudo apt update
sudo apt install repo
sudo apt upgrade repo
cd .repo/repo/
git pull
cp /home/biezhihua/projects/aosp/.repo/repo/repo /usr/bin/repo
chmod a+rx /usr/bin/repo
repo sync -c -j8
```

- <https://source.android.com/docs/setup/download>
- <https://gerrit.googlesource.com/git-repo/+/refs/heads/master/README.md>

## aosp simple download and build

要下载AOSP（Android Open Source Project），请按照以下步骤操作：

1. 安装Git：要从AOSP代码仓库中下载源代码，您需要先在计算机上安装Git。您可以从Git官网下载安装程序并按照说明进行安装。

2. 获取AOSP代码：打开终端或命令行窗口，在命令行中输入以下命令，以下载AOSP代码：

```bash
mkdir aosp
cd aosp
repo init -u https://android.googlesource.com/platform/manifest -b <branch>
repo sync
```

其中，`<branch>` 表示您要下载的AOSP版本的分支名称。例如，要下载Android 12（代码名称为S），请使用以下命令：

```bash
repo init -u https://android.googlesource.com/platform/manifest -b android-12.0.0_r1
```

此命令将初始化repo工具，并使用指定的分支从AOSP代码仓库中获取源代码。然后，使用 `repo sync` 命令将所有源代码下载到本地计算机上。

3. 构建AOSP：下载完AOSP源代码后，可以使用以下命令构建AOSP：

```bash
source build/envsetup.sh
lunch
make -j4
```

其中，`source build/envsetup.sh` 命令将设置必要的环境变量，`lunch` 命令将提示您选择要构建的目标设备类型和版本，而 `make -j4` 命令将开始构建过程。请注意，这个过程可能需要一些时间和大量的磁盘空间。

- <https://mirrors.tuna.tsinghua.edu.cn/help/AOSP/>
- <https://juejin.cn/post/7038543675109933070>

## aosp checkout branch

切换分支需要先进入到你本地的AOSP代码目录中，然后使用以下命令：

```bash
repo init -b <branch-name>
repo sync
```

其中`<branch-name>`指定你要切换到的分支名，例如切换到Android 13的分支，则可以使用以下命令：

```bash
repo init -b android-13.0.0_r41
repo sync
```

执行完以上命令后，AOSP代码就会被同步到对应的分支。注意，切换分支可能会导致一些代码库的版本变化，需要谨慎操作。

## repo clean all unsaved files

Repo工具是Git工具的扩展，用于管理多个Git代码仓库。与Git类似，Repo也不会在本地仓库中保存未提交的更改。因此，您需要使用文本编辑器或其他适当的工具来保存您的更改。如果您已经对某些文件进行了更改，但还没有提交它们，您可以使用以下方法来清除这些更改：

1. 如果您只想清除单个Git仓库中的文件更改，请使用以下命令：

```bash
repo forall <project> -c "git checkout -- file-name"
```

其中 `<project>` 是您要清除更改的Git仓库的名称，`file-name` 是要清除更改的文件名。该命令将覆盖本地的更改，并还原文件为最后一次提交的状态。

2. 如果您想清除所有Git仓库中的未提交更改，请使用以下命令：

```bash
repo forall -c "git reset --hard"
```

该命令将重置所有Git仓库的本地仓库到最后一次提交的状态，并清除所有未提交的更改。请注意，这将不可逆地删除所有未提交的更改，因此请谨慎使用。

无论您使用哪种方法，都要确保在清除更改之前，将重要的更改保存到其他文件或备份中。

## replace source

如果你之前已经通过某种途径获得了 AOSP 的源码(或者你只是 init 这一步完成后)， 你希望以后通过 TUNA 同步 AOSP 部分的代码，只需要修改 .repo/manifests.git/config，将

```text
url = https://android.googlesource.com/platform/manifest
```

更改为

```text
url = https://mirrors.tuna.tsinghua.edu.cn/git/AOSP/platform/manifest
```

或者可以不修改文件，而执行

```text
git config --global url.https://mirrors.tuna.tsinghua.edu.cn/git/AOSP/.insteadof https://android.googlesource.com
```

- <https://mirrors.tuna.tsinghua.edu.cn/help/AOSP/>

## prepare build environment of wls2 - Ubuntu-18.04

<https://source.android.com/docs/setup/start/initializing#installing-required-packages-ubuntu-1804>

## build aosp

查看CPU核心数量：

```shell
grep 'core id' /proc/cpuinfo | sort -u | wc -l
```

- <https://juejin.cn/post/7043063280704684063>
- <https://blog.csdn.net/nei504293736/article/details/109628378>
- <https://luyaoming.com/2021/06/23/wsl2%E4%B8%8B%E4%B8%8B%E8%BD%BD%E4%B8%8E%E7%BC%96%E8%AF%91AOSP/>

## wls2 set the fixed IP address & set the read and write capability of the SMB directory

```bash
[share]
   comment = share
   path = /home/biezhihua/projects/aosp
   force user = root
   writeable = yes
   browseable = yes
   public = yes
   create mask = 0644
   directory mask = 0755
```

```bash
sudo service smbd restart
```

- <https://zhuanlan.zhihu.com/p/380779630>
- <https://github.com/MicrosoftDocs/WSL/issues/418#issuecomment-648570865>
- <https://blog.csdn.net/weixin_41301508/article/details/108939520>
- <https://unix.stackexchange.com/questions/206309/how-to-create-a-samba-share-that-is-writable-from-windows-without-777-permission>

## run a compiled image to emulator

```bash

#擦除已有的avd数据
D:\Android\sdk\emulator\emulator.exe -avd biezhihua_aosp  -wipe-data

#模拟器重新加载android image
D:\Android\sdk\emulator\emulator.exe -avd biezhihua_aosp  -system "your_android_path\out\target\product\generic_x86_64\system.img" -data "your_android_path\out\target\product\generic_x86_64\userdata.img"

```

- <https://blog.csdn.net/dangelzjj/article/details/109267411>
- <https://blog.csdn.net/dangelzjj/article/details/109267411>
- <https://blog.csdn.net/yongwn/article/details/121009506>
- <https://groups.google.com/g/android-building/c/O9a6Ohnb5hI?pli=1>
