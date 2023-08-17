---
article: true
---

# Learn | Web

## 用户登录信息需要存储到cookie中，否则页面重进时无法获取到用户的登录态

### config配置可以使用State来存储

### web开发中的token有什么作用

令牌在 Web 开发中有很多作用。它可以用于：

- 认证用户：令牌可以用于验证用户的身份，以便他们可以访问受保护的资源。
- 授权用户：令牌可以用于授予用户访问特定资源的权限。
- 跟踪用户活动：令牌可以用于跟踪用户在网站或应用程序上的活动。
- 保护用户数据：令牌可以用于保护用户数据免受未经授权的访问。
- 简化 API 调用：令牌可以用于简化 API 调用，因为您不必每次都发送用户名和密码。

令牌是一种非常灵活的工具，可以用于提高 Web 应用程序的安全性和可用性。

### jwt在web开发中有什么作用

JWT 是一种用于在 Web 应用程序中传输安全信息的标准格式。它由三个部分组成：头部、有效负载和签名。头部包含令牌类型和加密算法。有效负载包含有关用户的声明，例如用户名、用户 ID 和过期时间。签名是头部和有效负载的哈希值，使用用于生成令牌的秘密进行加密。

JWT 可用于多种目的，包括：

- 认证：JWT 可用于验证用户的身份，以便他们可以访问受保护的资源。
- 授权：JWT 可用于授予用户访问特定资源的权限。
- 单点登录：JWT 可用于实现单点登录，这意味着用户只需登录一次即可访问多个应用程序。
- 信息交换：JWT 可用于在应用程序之间安全地传输信息。

JWT 是一种安全高效的格式，可用于在 Web 应用程序中传输安全信息。它易于使用，并且可用于各种目的。

以下是一些使用 JWT 的好处：

- 安全：JWT 使用加密来保护信息免受未经授权的访问。
- 高效：JWT 是一种轻量级格式，可以快速传输。
- 易于使用：JWT 易于使用，可以与各种编程语言和框架一起使用。
- 可扩展：JWT 可用于各种目的，并且可以根据需要进行定制。

## http body

The HTTP body is the part of an HTTP message that contains the actual data being transferred. The body is optional, and is not present in all HTTP messages.

The body of an HTTP message is typically used to carry the following types of data:

- **Form data:** This is the data that is submitted in a form. Form data is typically encoded in the application/x-www-form-urlencoded format.
- **File uploads:** This is the data that is uploaded to a server. File uploads are typically encoded in the multipart/form-data format.
- **JSON data:** This is a lightweight data format that is often used to transmit structured data between clients and servers.
- **XML data:** This is a more complex data format that is often used to transmit structured data between clients and servers.

The body of an HTTP message is typically encoded in a binary format, such as UTF-8 or ASCII. The encoding of the body is specified by the Content-Type header.

The size of the body of an HTTP message is limited by the maximum header size and the maximum message size. The maximum header size is typically 8KB, and the maximum message size is typically 1MB.

The body of an HTTP message is typically transmitted after the headers. However, in some cases, the body may be transmitted before the headers. This is known as chunked transfer encoding.

The body of an HTTP message is an important part of the HTTP protocol. It allows clients and servers to transmit data between them.

For more information on HTTP bodies, you can refer to the following resources:

- HTTP Body: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length>
- List of HTTP Header Fields: <https://en.wikipedia.org/wiki/List_of_HTTP_header_fields>
- RFC 7230: <https://tools.ietf.org/html/rfc7230>
- RFC 7231: <https://tools.ietf.org/html/rfc7231>

## labelInValue 有什么作用

"labelInValue" 是一个在前端开发中经常使用的概念，主要用于属性或选项的显示与存储的映射关系。

在一些组件库或框架中，比如 Ant Design 的 Select 组件，可以使用"labelInValue"属性来指定选中项的值和展示文本的格式。一般情况下，该属性接收一个布尔值，当设置为 true 时，选中项的值和展示文本被封装为一个对象，其中包含"label"和"value"两个属性。

这个特性在处理表单提交时很有用，因为它可以让开发人员更方便地获取用户选择的值，并且同时获得对应的展示文本。这样在后续的数据处理或后端传输过程中，可以更容易地使用这些数据。