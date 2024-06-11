# 都有哪些epoll方法？ 如何使用？ 原理是什么？ 举例子给我讲述清楚!

在Linux环境中，`epoll` 是一种高效的多路复用I/O事件通知机制，尤其适用于处理大量并发连接的服务器应用。它是对传统的 `select` 和 `poll` 方法的改进，能够更好地扩展到大数目的并发连接，因为它在内部使用更有效的数据结构（红黑树和双向链表）来管理事件。

### epoll 的主要函数

1. **`epoll_create`**:
   - 用于创建一个epoll的文件描述符。
   - 例子：`int epfd = epoll_create(1);`

2. **`epoll_ctl`**:
   - 用于控制某个文件描述符上的事件，可以注册事件，修改事件，删除事件。
   - 例子：`epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &event);`

3. **`epoll_wait`**:
   - 等待事件的发生，类似于 `select()` 或 `poll()`，但效率更高。
   - 例子：`int n = epoll_wait(epfd, events, MAX_EVENTS, -1);`

### 如何使用 epoll

以下是使用 `epoll` 的基本步骤：

1. **创建 epoll 对象**:
   使用 `epoll_create` 创建一个epoll对象。参数通常是预计要监视的文件描述符数量（在Linux较新的版本中，该参数已不再使用，但仍需要一个大于0的数）。

2. **添加需要监听的文件描述符**:
   使用 `epoll_ctl` 并选择 `EPOLL_CTL_ADD`，将需要监听的文件描述符添加到 `epoll` 实例中。你需要指定关心的事件类型，如 `EPOLLIN` (可读)，`EPOLLOUT` (可写)，`EPOLLET` (边缘触发)等。

3. **等待事件发生**:
   调用 `epoll_wait` 等待事件的发生。该函数会阻塞直到有事件发生或者超时。返回值表示有多少文件描述符就绪，其事件信息会填充在传入的事件数组中。

4. **处理事件**:
   根据 `epoll_wait` 返回的结果和事件数组，处理每个就绪的文件描述符的事件。

5. **修改或删除监听的文件描述符**:
   如果需要改变监听的事件或是不再监听某个文件描述符，可以使用 `epoll_ctl` 与 `EPOLL_CTL_MOD` 或 `EPOLL_CTL_DEL`。

### 示例

下面是一个简单的 `epoll` 使用示例，创建一个监听套接字，并使用 `epoll` 接收连接：

```c
#include <sys/epoll.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <netinet/in.h>
#include <string.h>

#define MAX_EVENTS 10

int main() {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(8080);

    bind(sockfd, (struct sockaddr *)&addr, sizeof(addr));
    listen(sockfd, 5);

    int epfd = epoll_create(1);
    struct epoll_event ev, events[MAX_EVENTS];
    ev.events = EPOLLIN;
    ev.data.fd = sockfd;

    epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);

    while (1) {
        int nfds = epoll_wait(epfd, events, MAX_EVENTS, -1);
        for (int i = 0; i < nfds; ++i) {
            if (events[i].data.fd == sockfd) {
                int connfd = accept(sockfd, NULL, NULL);
                printf("Accepted new connection: %d\n", connfd);
                ev.events = EPOLLIN | EPOLLET;
                ev.data.fd = connfd;
                epoll_ctl(epfd, EPOLL_CTL_ADD, connfd, &ev);
            } else {
                char buffer[512];
                ssize_t count = read(events[i].data.fd, buffer, sizeof(buffer));
                if (count == 0) {
                    close(events[i].data.fd);
                    printf("Closed connection: %d\n", events[i].data.fd

);
                } else {
                    write(events[i].data.fd, buffer, count);
                    printf("Echoed back to %d\n", events[i].data.fd);
                }
            }
        }
    }

    close(sockfd);
    close(epfd);
    return 0;
}
```

### 原理

`epoll` 的高效之处在于它使用了一种复杂的内部数据结构来避免频繁地遍历整个被监视的文件描述符集合。这种方式使得 `epoll` 能够在同时监控大量文件描述符时保持效率，因为它仅关注那些真正活动的文件描述符。此外，`epoll` 支持“边缘触发”和“水平触发”两种模式，允许开发者根据具体的应用场景选择最适合的响应方式。