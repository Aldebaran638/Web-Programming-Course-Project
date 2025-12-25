# aldebaran - 教师端前端（示例实现）

该文件夹包含教师端主要页面的前端实现（HTML/CSS/JS），覆盖作业/考试管理、课程资料上传、成绩构成与录入等功能。本实现使用原生 JavaScript，通过项目后端提供的 RESTful API 与服务交互。

主要文件：
- `index.html` - 教师仪表盘（我的授课列表 + 登录）
- `teacher-dashboard.html` - 统一教师工作台（包含课程管理、作业管理、成绩管理、课件管理）
- `course.html` - 课程详情：上传资料、课程配置
- `assignments.html` - 布置作业/查看提交
- `grades.html` - 成绩组成、单个录入、批量导入
- `app.js` - 前端逻辑与 API 封装
- `teacher-dashboard.css` - 统一页面的详细样式
- `styles.css` - 基本样式

运行说明：
1. 启动后端（例如：`uvicorn backend.test:app --reload --port 8000`）。
2. 打开 `aldebaran/index.html`（建议用本地静态服务器，如 `Live Server` 扩展或 `python -m http.server`）。
3. 使用登录按钮登录（当前后端示例支持演示用户 `20210001` / `InitialPassword123`）。

注意事项：
- 后端有部分 GET 列表接口示例中未实现（比如按课程获取 `assignments`、`grade-items` 列表、按课程查询 `enrollments` 及其 `grades`），前端中已标注占位位置，建议在后端补齐对应 GET 接口以实现完整功能：
  - GET /courses/{id}/assignments 或 GET /assignments?course_id={id}
  - GET /courses/{id}/grade-items
  - GET /enrollments?course_id={id}（返回每个 enrollment 里包含 student 与 grades）
- 文件上传使用 `multipart/form-data`，需要后端相应处理上传并返回文件路径。
- 批量导入示例支持 CSV/XLSX 文件上传，后端需解析文件并映射学号到选课记录后写入 `Grades`。