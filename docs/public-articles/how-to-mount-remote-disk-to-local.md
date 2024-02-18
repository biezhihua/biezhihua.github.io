---
article: true
---

# 在ubuntu中挂载远程文件系统到本地

在Ubuntu中挂载远程文件系统到本地通常涉及使用网络文件系统（NFS）、Samba共享或SSH文件系统（SSHFS）。每种方法都适用于不同的场景。下面是如何使用这些方法中的每一种来挂载远程文件系统的步骤。

### 使用SSHFS挂载

SSHFS（SSH Filesystem）允许你通过SSH协议安全地挂载远程文件系统。这是一种安全且相对简单的方法，特别适用于已经设置了SSH访问的情况。

1. **安装SSHFS**:
   ```bash
   sudo apt-get update
   sudo apt-get install sshfs
   ```

2. **创建本地挂载点**:
   ```bash
   mkdir ~/remoteDir
   ```

3. **挂载远程文件系统**:
   ```bash
   sshfs user@hostname:/remote/directory/path ~/remoteDir
   ```
   其中，`user`是远程系统上的用户名，`hostname`是远程系统的主机名或IP地址，`/remote/directory/path`是远程系统上你想要挂载的目录的路径，`~/remoteDir`是本地挂载点。

4. **卸载远程文件系统**:
   当不再需要时，可以使用以下命令来卸载远程文件系统：
   ```bash
   fusermount -u ~/remoteDir
   ```

### 使用NFS挂载

NFS（网络文件系统）是另一种广泛使用的方法，特别适用于Linux或UNIX系统之间的文件共享。

1. **确保NFS客户端已安装**:
   ```bash
   sudo apt-get update
   sudo apt-get install nfs-common
   ```

2. **创建本地挂载点**:
   ```bash
   mkdir ~/nfsMount
   ```

3. **挂载NFS共享**:
   ```bash
   sudo mount -t nfs hostname:/exported/path ~/nfsMount
   ```
   其中，`hostname`是NFS服务器的主机名或IP地址，`/exported/path`是NFS服务器上已导出的目录的路径，`~/nfsMount`是本地挂载点。

### 使用Samba挂载

Samba是在Windows和Linux/UNIX系统之间共享文件和打印服务的标准。

1. **安装cifs-utils**:
   ```bash
   sudo apt-get update
   sudo apt-get install cifs-utils
   ```

2. **创建本地挂载点**:
   ```bash
   mkdir ~/sambaShare
   ```

3. **挂载Samba共享**:
   ```bash
   sudo mount -t cifs -o username=sambaUser,password=sambaPassword //hostname/sharename ~/sambaShare
   ```
   其中，`username`和`password`是访问Samba共享所需的凭据，`hostname`是Samba服务器的主机名或IP地址，`sharename`是共享的名称，`~/sambaShare`是本地挂载点。

在使用任何挂载方法之前，请确保你有权访问远程文件系统，并且远程系统已正确配置以允许远程访问。对于NFS和Samba，这可能涉及到在服务器端进行特定的配置。对于SSHFS，你只需要在远程系统上有一个有效的SSH账户。