# 模块5
web-project/
├── sys-admin/
│   ├── index.html          # 系统管理端主页面
│   ├── logs.html           # 日志审计页面
│   ├── backup.html         # 备份恢复页面
│   ├── style.css           # 样式文件
│   └── script.js           # 通用JavaScript

如何整合到项目
1.在项目根目录创建 sys-admin 文件夹
2.将上述三个文件保存到该文件夹中
3.在项目中创建链接到系统管理端：
<!-- 在登录后的导航栏中添加 -->
<a href="sys-admin/index.html" class="sys-admin-link">
    <i class="fas fa-cogs"></i> 系统管理
</a>

与后端API对接
1.确保后端API运行在 http://localhost:8000
2.登录时需要将token保存到localStorage：

// 登录成功后
localStorage.setItem('adminToken', response.token);
localStorage.setItem('userRole', response.user.role);
localStorage.setItem('username', response.user.username);

3.系统会自动检查登录状态，非管理员会重定向


# 模块4
项目目录/
├── edu-admin.html          # 教学管理端主页面
├── edu-admin.css           # 主样式文件（已更新）
├── edu-admin.js            # 主JavaScript文件（已更新）
├── grade-review.js         # 成绩审核管理类
├── login.html              # 登录页面
├── api-integration.js      # API集成文件（已更新）
├── mock-api.js             # 模拟API数据
├── grade-mock-data.js      # 成绩审核模拟数据
└── README.md               # 使用说明文档