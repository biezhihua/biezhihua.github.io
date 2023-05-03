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

## 如何给WLS2-Ubuntu18.0.4 扩充磁盘容量

在 WSL2 (Windows Subsystem for Linux 2) 中，Ubuntu 18.04 默认会将磁盘存储为一个 VHDX 文件。要扩展 WSL2 Ubuntu 18.04 的磁盘容量，请按照以下步骤操作：

**步骤 1**：关闭 WSL2 实例。在 Windows PowerShell 或命令提示符中运行以下命令：

```bash
wsl --shutdown
```

**步骤 2**：找到 VHDX 文件。WSL2 实例的 VHDX 文件通常位于 `C:\Users\<YourUsername>\AppData\Local\Packages\` 目录下。然后进入一个名为 `CanonicalGroupLimited.Ubuntu18.04onWindows_79rhkp1fndgsc`（这个名字可能略有不同）的文件夹。接下来，进入 `LocalState` 文件夹。在此文件夹中，您应该可以找到名为 `ext4.vhdx` 的文件。

**步骤 3**：扩展 VHDX 文件。首先，打开 Windows PowerShell 或命令提示符以管理员身份运行。然后，使用 `Resize-VHD` 命令扩展 VHDX 文件。将 `<YourPath>` 替换为实际的 VHDX 文件路径，并将 `<NewSize>` 替换为您要扩展到的新大小（以 GB 为单位）。

```bash
Resize-VHD -Path <YourPath>\ext4.vhdx -SizeBytes <NewSize>GB
```

例如，如果 VHDX 文件位于 `C:\Users\example\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu18.04onWindows_79rhkp1fndgsc\LocalState\ext4.vhdx`，并且您希望将其扩展到 50GB，则应运行以下命令：

```bash
Resize-VHD -Path "C:\Users\example\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu18.04onWindows_79rhkp1fndgsc\LocalState\ext4.vhdx" -SizeBytes 50GB
```

**步骤 4**：启动 WSL2 实例。在 Windows PowerShell 或命令提示符中运行以下命令：

```bash
wsl
```

**步骤 5**：现在，您需要在 WSL2 Ubuntu 18.04 内部调整文件系统。运行以下命令，将 `<NewSize>` 替换为实际的新大小（以 GB 为单位）：

```bash
sudo resize2fs /dev/sda <NewSize>G
```

例如，如果您将 VHDX 文件扩展到 50GB，则应运行以下命令：

```bash
sudo resize2fs /dev/sda 50G
```

完成这些步骤后，WSL2 Ubuntu 18.04 的磁盘容量应已成功扩展。您可以使用 `df -h` 命令检查新的磁盘空间。

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
- <https://blog.csdn.net/sinat_21011081/article/details/118404717?spm=1001.2101.3001.6661.1&utm_medium=distribute.pc_relevant_t0.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-1-118404717-blog-108939520.235%5Ev32%5Epc_relevant_default_base3&depth_1-utm_source=distribute.pc_relevant_t0.none-task-blog-2%7Edefault%7ECTRLIST%7ERate-1-118404717-blog-108939520.235%5Ev32%5Epc_relevant_default_base3&utm_relevant_index=1>

## run a compiled image to emulator | method1

```bash

#擦除已有的avd数据
D:\Android\sdk\emulator\emulator.exe -avd biezhihua_aosp  -wipe-data

#模拟器重新加载android image
D:\Android\sdk\emulator\emulator.exe -avd biezhihua_aosp  -system "your_android_path\out\target\product\generic_x86_64\system.img" -data "your_android_path\out\target\product\generic_x86_64\userdata.img"

 D:\Android\sdk\emulator\emulator.exe -avd biezhihua_aosp  -system "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\system.img" -data "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\userdata.img"
```

- <https://blog.csdn.net/dangelzjj/article/details/109267411>
- <https://blog.csdn.net/dangelzjj/article/details/109267411>
- <https://blog.csdn.net/yongwn/article/details/121009506>
- <https://groups.google.com/g/android-building/c/O9a6Ohnb5hI?pli=1>

## run a compiled image to emulator | method2

拷贝产物到windows镜像目录下；

```bash
cp out/target/product/emulator_x86_64/VerifiedBootParams.textproto /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/
cp out/target/product/emulator_x86_64/advancedFeatures.ini /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/
cp out/target/product/emulator_x86_64/encryptionkey.img /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/
cp out/target/product/emulator_x86_64/kernel-ranchu /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/
cp out/target/product/emulator_x86_64/ramdisk-qemu.img /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/ramdisk.img
cp out/target/product/emulator_x86_64/system-qemu.img /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/system.img
cp out/target/product/emulator_x86_64/userdata.img /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/
cp out/target/product/emulator_x86_64/vendor-qemu.img /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/vendor.img
cp out/target/product/emulator_x86_64/system/build.prop /mnt/d/Android/sdk/system-images/android-33/google_apis/x86_64/

emulator -avd Pixel_3_Edited_API_30 -writable-system -wipe-data -show-kernel -skip-adb-auth -no-cache

```

```bash
emulator.exe -avd biezhihua_aosp  -system "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\system-qemu.img" -data "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\userdata.img" -writable-system -wipe-data -show-kernel -skip-adb-auth -no-cache

emulator.exe -avd biezhihua_aosp  -system "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\system-qemu.img" -data "\\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\userdata.img" -writable-system -show-kernel -skip-adb-auth
```


- <https://sidneyding.cn/posts/c64b5633/>

## 对于AOSP，如何打包单个模块并更新system.img文件，请以framework/native为例

在 AOSP 源代码中，若要仅构建 framework/native 模块并更新 system.img 文件，可按照以下步骤操作：

**步骤 1**：启动一个终端并进入 AOSP 源代码的根目录。

**步骤 2**：启动构建环境，运行以下命令：

bash

```bash
source build/envsetup.sh
```

**步骤 3**：选择要构建的目标设备。例如，如果要为 `sdk_phone_x86_64-eng` 构建模块，请运行：

bash

```bash
lunch sdk_phone_x86_64-eng
```

**步骤 4**：构建 framework/native 模块。`framework/native` 实际上包含许多模块。假设您要构建 `libui` 模块，可以执行以下命令：

bash

```bash
mmm -j$(nproc) frameworks/native/libs/ui
```

这将仅构建 `libui` 模块。要构建整个 `framework/native`，您需要为每个子模块重复此步骤。

**步骤 5**：现在，已经构建了所需的模块，需要将其安装到 system.img 中。为此，请运行以下命令：

bash

```bash
make snod
```

此命令将根据已经生成的各个分区（包括已更新的模块）重新生成 system.img 文件。

完成上述步骤后，您可以在 `out/target/product/<device>/` 目录下找到更新后的 system.img 文件。此时，您可以将更新后的 system.img 刷入设备或模拟器以进行测试。

注意：如果您的目标是将新生成的模块（例如 .so 文件）推送到已运行的设备或模拟器上，那么在步骤 4 之后，您可以直接使用 `adb push` 命令将新生成的模块推送到相应的目录，而无需重新生成整个 system.img。例如：

```bash
adb root
adb remount
adb push out/target/product/<device>/system/lib64/libui.so /system/lib64/
adb shell sync
adb shell reboot
```

请将 `<device>` 替换为实际的设备名称。这将在重新启动设备后立即应用新的模块。

## 对于AOSP，如何打包单个模块并更新system.img文件，请以framework/native/surfaceflinger为例

在 AOSP 源代码中，若要仅构建 framework/native/surfaceflinger 模块并更新 system.img 文件，可按照以下步骤操作：

**步骤 1**：启动一个终端并进入 AOSP 源代码的根目录。

**步骤 2**：启动构建环境，运行以下命令：

```bash
source build/envsetup.sh
```

**步骤 3**：选择要构建的目标设备。例如，如果要为 `sdk_phone_x86_64-eng` 构建模块，请运行：

```bash
lunch sdk_phone_x86_64-eng
```

**步骤 4**：构建 framework/native/surfaceflinger 模块。要构建 SurfaceFlinger 模块，请执行以下命令：

```bash
mmm -j$(nproc) frameworks/native/services/surfaceflinger

mmm -j32 frameworks/native/services/surfaceflinger
```

这将仅构建 SurfaceFlinger 模块。

**步骤 5**：现在，已经构建了所需的模块，需要将其安装到 system.img 中。为此，请运行以下命令：

```bash
make snod
```

此命令将根据已经生成的各个分区（包括已更新的模块）重新生成 system.img 文件。

完成上述步骤后，您可以在 `out/target/product/<device>/` 目录下找到更新后的 system.img 文件。此时，您可以将更新后的 system.img 刷入设备或模拟器以进行测试。

注意：如果您的目标是将新生成的模块（例如 .so 文件）推送到已运行的设备或模拟器上，那么在步骤 4 之后，您可以直接使用 `adb push` 命令将新生成的模块推送到相应的目录，而无需重新生成整个 system.img。例如：

```bash
adb root
adb remount
adb push out/target/product/<device>/system/lib64/libsurfaceflinger.so /system/lib64/
adb push \\wsl.localhost\Ubuntu-18.04\home\biezhihua\projects\aosp\out\target\product\emulator_x86_64\system\bin\NativeSFDemo /system/bin/
adb shell sync
adb shell reboot
```

请将 `<device>` 替换为实际的设备名称。这将在重新启动设备后立即应用新的模块。

## ERROR | createRamdiskWithBootconfig: Can't open 'product\\emulator\_x86\_64\\initrd' for writing

这个错误提示的是在创建 ramdisk 时出现问题，无法打开 "product\\emulator\_x86\_64\\initrd" 文件进行写入。这可能是由于以下原因之一导致的：

1. **文件路径错误**：请确保 "product\\emulator\_x86\_64\\initrd" 文件的路径正确。注意在 Windows 系统中，文件路径中的分隔符应为反斜杠（`\`），而在类 Unix 系统（如 Linux 和 macOS）中，文件路径中的分隔符应为正斜杠（`/`）。根据您使用的操作系统，检查文件路径是否正确。

2. **文件或文件夹权限问题**：确保您具有足够的权限访问 "product\\emulator\_x86\_64\\initrd" 文件。在 Unix 类系统中，您可以使用 `chmod` 和 `chown` 命令来更改文件或文件夹的权限。在 Windows 系统中，可以右键单击文件或文件夹，然后选择 "属性"，在 "安全" 选项卡中更改权限。

3. **文件或文件夹不存在**：确保 "product\\emulator\_x86\_64" 文件夹存在，并且其中包含 "initrd" 文件。如果缺少该文件，请尝试重新构建项目以生成正确的文件。

4. **磁盘空间不足**：请确保您的系统上有足够的磁盘空间可供写入 "product\\emulator\_x86\_64\\initrd" 文件。如果磁盘空间不足，请清理一些不需要的文件，以释放足够的空间。

检查以上各项，并根据需要进行相应的修复操作。这应该有助于解决在运行 AOSP 自己编译的镜像时出现的错误。

## AOSP中打印函数调用栈，在surfaceflinger

不可以使用下面的命令构建单个模块，因为无法指定工程构建架构，会产生编译错误：

```bash
mmm frameworks/native/services/surfaceflinger
```

```text
ld.lld: error: undefined symbol: android::CallStack::CallStack()
ld.lld: error: undefined symbol: android::CallStack::update(int, int)
ld.lld: error: undefined symbol: android::CallStack::log(char const*, android_LogPriority, char const*) const
ld.lld: error: undefined symbol: android::CallStack::~CallStack()
```

- https://www.cnblogs.com/roger-yu/p/15596840.html
- https://utzcoz.github.io/2020/04/29/Print-call-stack-in-AOSP-native-code.html
- https://blog.csdn.net/zhaojia92/article/details/97827285

## 过滤调用栈日志

`onComposerHalHotplug`的调用栈：
```text
 # adb logcat | findstr "bzh"
05-03 23:34:47.773   443   443 D bzh     : #00 pc 00000000001ec91c  /system/bin/surfaceflinger (android::SurfaceFlinger::onComposerHalHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+524)
05-03 23:34:47.773   443   443 D bzh     : #01 pc 000000000017bd71  /system/bin/surfaceflinger (android::Hwc2::(anonymous namespace)::ComposerCallbackBridge::onHotplug(unsigned long, android::hardware::graphics::composer::V2_1::IComposerCallback::Connection)+17)
05-03 23:34:47.773   443   443 D bzh     : #02 pc 00000000000293ef  /system/lib64/android.hardware.graphics.composer@2.1.so (android::hardware::graphics::composer::V2_1::BnHwComposerCallback::_hidl_onHotplug(android::hidl::base::V1_0::BnHwBase*, android::hardware::Parcel const&, android::hardware::Parcel*, std::__1::function<void (android::hardware::Parcel&)>)+239)
05-03 23:34:47.773   443   443 D bzh     : #03 pc 000000000003859b  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BnHwComposerCallback::onTransact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+603)
05-03 23:34:47.773   443   443 D bzh     : #04 pc 000000000009ad49  /system/lib64/libhidlbase.so (android::hardware::BHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+137)
05-03 23:34:47.773   443   443 D bzh     : #05 pc 00000000000a035a  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::executeCommand(int)+3770)
05-03 23:34:47.773   443   443 D bzh     : #06 pc 00000000000a11a7  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::waitForResponse(android::hardware::Parcel*, int*)+103)
05-03 23:34:47.774   443   443 D bzh     : #07 pc 00000000000a0ceb  /system/lib64/libhidlbase.so (android::hardware::IPCThreadState::transact(int, unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int)+171)
05-03 23:34:47.774   443   443 D bzh     : #08 pc 000000000009bc95  /system/lib64/libhidlbase.so (android::hardware::BpHwBinder::transact(unsigned int, android::hardware::Parcel const&, android::hardware::Parcel*, unsigned int, std::__1::function<void (android::hardware::Parcel&)>)+69)
05-03 23:34:47.774   443   443 D bzh     : #09 pc 000000000003eb72  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::_hidl_registerCallback_2_4(android::hardware::IInterface*, android::hardware::details::HidlInstrumentor*, android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+514)
05-03 23:34:47.774   443   443 D bzh     : #10 pc 0000000000043298  /system/lib64/android.hardware.graphics.composer@2.4.so (android::hardware::graphics::composer::V2_4::BpHwComposerClient::registerCallback_2_4(android::sp<android::hardware::graphics::composer::V2_4::IComposerCallback> const&)+40)
05-03 23:34:47.774   443   443 D bzh     : #11 pc 0000000000175be5  /system/bin/surfaceflinger (android::Hwc2::HidlComposer::registerCallback(android::HWC2::ComposerCallback&)+229)
05-03 23:34:47.774   443   443 D bzh     : #12 pc 0000000000183c24  /system/bin/surfaceflinger (android::impl::HWComposer::setCallback(android::HWC2::ComposerCallback&)+4004)
05-03 23:34:47.774   443   443 D bzh     : #13 pc 00000000001e4ded  /system/bin/surfaceflinger (android::SurfaceFlinger::init()+877)
05-03 23:34:47.774   443   443 D bzh     : #14 pc 0000000000237994  /system/bin/surfaceflinger (main+1220)
05-03 23:34:47.774   443   443 D bzh     : #15 pc 0000000000050cc9  /apex/com.android.runtime/lib64/bionic/libc.so (__libc_init+89)
```