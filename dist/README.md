## Docker 部署过程中遇到的问题记录

### 问题 1：`docker pull` 成功，但 `docker build` 中的 `FROM` 拉取失败

现象：

- 直接执行 `docker pull ubuntu:24.04` 可以成功拉取镜像；
- 但在使用 `docker build` 构建镜像时，Dockerfile 中包含如下内容：

```Dockerfile
FROM ubuntu:24.04
```

构建过程中却报错，提示无法拉取 `ubuntu:24.04`。

分析与结论（基于实践现象）：

- 实际上 `docker pull` 和 `docker build` 内部拉取镜像时都会访问远程镜像仓库，只是触发时机和网络环境可能不同；
- 在当前网络/代理环境下，直接 `docker pull` 成功，而 `docker build` 过程中拉取失败，表现为“好像走了不一样的网络路径”，但可以理解为：**`docker pull` 先把镜像缓存到本地后，`docker build` 就不再需要再次访问远程仓库了**。

解决方案：

1. 先手动执行：

   ```bash
   docker pull ubuntu:24.04
   ```

2. 等拉取成功后，再执行：

   ```bash
   docker build -t your-image-name -f Dockerfile .
   ```

此时 `FROM ubuntu:24.04` 会直接复用本地已缓存的镜像，从而绕过构建阶段的网络问题。

---

### 问题 2：通过 Nginx 重定向后 HTML 正常返回，但 CSS / JS 加载失败

在当前项目中，访问 `http://localhost:8001/` 时，使用了如下 Nginx 配置（简化示例）：

```conf
  # 设置默认首页文件。当访问目录时，nginx 会尝试返回当前目录的 index.html 文件
  # 如果找不到 index.html，则返回 403 错误（注意不是 404）
  index index.html;

  # "location /"：匹配所有以 / 开头的路径
  location / {
      try_files $uri $uri/ /aldebaran/page.html;
      add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  # 将 404 错误重定向到 /aldebaran/page.html 页面
  error_page 404 =302 /aldebaran/page.html;

  # 将 403 错误重定向到 /aldebaran/page.html 页面
  error_page 403 =302 /aldebaran/page.html;
```

效果是：当根路径 `/` 找不到合适的文件时，请求会被重定向/回退到 `/aldebaran/page.html`，这一点是符合预期的。

`page.html` 中的关键片段如下：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    ...
    <!-- 读取 CSS 文件 -->
    <link rel="stylesheet" href="assets/styles.css" />
  </head>
  <body>
    ...
    <!-- 读取 JS 文件 -->
    <script src="js/main.js"></script>
  </body>
  
</html>
```

实际现象：

- 浏览器最终成功拿到了 `page.html` 的 HTML 内容；
- 但页面上的 CSS 和 JS 资源没有正确加载（在浏览器 Network 面板中可以看到对应请求失败）。

原因分析：

- `page.html` 中使用了相对路径：
  - `assets/styles.css`
  - `js/main.js`
- 浏览器解析这些相对路径时，会以“当前页面的 URL”作为基准 URL。
- 当请求经过 Nginx 的 `try_files` 和 `error_page`（重定向或内部重写）后，**浏览器实际认为的“当前 URL”与 `page.html` 文件真实所在的目录并不总是一致**，导致相对路径被解析成类似：
  - `/assets/styles.css`
  - `/js/main.js`
  而不是预期的：
  - `/aldebaran/assets/styles.css`
  - `/aldebaran/js/main.js`
- 如果这些错误路径下没有对应静态文件，就会出现“HTML 正常、CSS/JS 全部 404”的现象。

解决方案：在 HTML 中显式指定基准 URL

在 `page.html` 的 `<head>` 中增加 `<base>` 标签，强制浏览器以 `/aldebaran/` 作为解析相对路径的基准：

```html
<head>
  ...
  <!-- 强制以 /aldebaran/ 为基准解析相对路径 -->
  <base href="/aldebaran/">

  <link rel="stylesheet" href="assets/styles.css" />
  ...
</head>
```

这样浏览器会统一将相对路径解析为：

- `assets/styles.css` → `/aldebaran/assets/styles.css`
- `js/main.js` → `/aldebaran/js/main.js`

无论是直接访问 `/aldebaran/page.html`，还是通过 Nginx 的重定向/内部跳转到该页面，CSS / JS 等静态资源都能以 `/aldebaran/` 为前缀正确加载。

> 说明：另一种方式是直接在 HTML 中将静态资源写成绝对路径，例如：
> `<link rel="stylesheet" href="/aldebaran/assets/styles.css" />` 与
> `<script src="/aldebaran/js/main.js"></script>`。
> 本质上，两种方式都是为了避免依赖不稳定的“隐含基准 URL”，显式指定静态资源路径前缀。