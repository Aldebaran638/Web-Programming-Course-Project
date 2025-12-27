# 学生端功能测试计划（demo_student）

> 本文档用于手工回归学生端 Student-Portal（课程浏览 / 我的课程 / 学习任务 / 成绩）相关接口。
> 所有用例默认使用账号 **demo_student**，不使用其他学生账号。

---

## 0. 前置条件

- 已使用 [database/BuildDatabase.sql](../database/BuildDatabase.sql) 成功初始化数据库：
  - Users 中存在账号：`demo_student`（role = `student`，初始密码为 `123456` 对应的哈希值）。
  - StudentProfiles 中 demo_student 的学号为 `20250001`，姓名为 `示例学生`。
  - Courses 中存在课程：
    - CS101《程序设计基础》（course_id = 1，credits = 3.0，部门 = 计算机系）。
    - SE201《软件工程导论》（course_id = 2，credits = 2.5，部门 = 软件工程系）。
  - TeachingAssignments 中 demo_teacher 在 2023-2024-1 学期教授 CS101，在 2024-2025-1 学期教授 SE201。
  - Enrollments 中 demo_student 选修：
    - enrollment_id = 1：CS101，semester = `2023-2024-1`；
    - enrollment_id = 2：SE201，semester = `2023-2024-1`。
  - GradeItems / Grades 中：
    - 对于 CS101（course_id = 1）：
      - grade_item_id = 1：作业1，权重 0.2，score = 85.0；
      - grade_item_id = 2：期末考试，权重 0.8，score = 90.0；
      - 预期该课的最终成绩约为 `0.2×85 + 0.8×90 = 89`。
    - 对于 SE201（course_id = 2）：
      - grade_item_id = 3：课堂表现，权重 0.3，score = 88.0；
      - grade_item_id = 4：课程项目，权重 0.7，score = 92.0；
      - 预期该课的最终成绩约为 `0.3×88 + 0.7×92 = 90.8`。
  - CourseMaterials / TaskProgress 中：
    - CS101（course_id = 1）有两条课程资料：
      - material_id = 1：类型 document，标题「第1章课件」；
      - material_id = 2：类型 carousel_image，标题「轮播图1」。
    - TaskProgress 中 demo_student 关于 CS101 的学习任务进度：
      - (enrollment_id = 1, material_id = 1, status = 'todo')；
      - (enrollment_id = 1, material_id = 2, status = 'done')。
- FastAPI 后端已启动，基础 URL 为：`http://localhost:8000/api/v1`。
- 前端已通过 aldebaran 网关接入统一登录：
  - 网关入口为 `aldebaran/page.html`；
  - 学生端首页为 `Student-Portal/index.html`。

---

## 1. 登录与访问控制

### S1：使用 demo_student 正常登录

1. 打开浏览器访问 `aldebaran/page.html`。
2. 在登录页输入：
   - 用户名：`demo_student`
   - 密码：与 BuildDatabase.sql 中的哈希对应的明文（例如统一配置为 `123456`）。
3. 点击「登录」。

**预期结果：**
- 登录成功，后端返回：
  - 一个非空 `token`；
  - `user` 对象中：`username = "demo_student"`，`role = "student"`。
- 前端将 `token` 和 `user` 写入 `localStorage`。
- 网关根据 `user.role === 'student'` 自动跳转到 `Student-Portal/index.html`。

### S2：未登录直接访问学生端页面

1. 清空浏览器 `localStorage` 中的 `token` 和 `user`。
2. 直接在地址栏访问 `Student-Portal/my-courses.html` 或 `Student-Portal/grades.html`。

**预期结果：**
- 前端在初始化时调用 `checkLogin()` 检测到无登录凭证。
- 立即重定向到网关 `aldebaran/page.html`。

### S3：使用教师凭证误入学生端

1. 使用 `demo_teacher` 在网关正常登录，得到教师端 token。
2. 登录成功后，手动在地址栏访问 `Student-Portal/index.html`。

**预期结果：**
- 学生端 `auth.js` 中的 `checkLogin()` 检测到 `user.role === 'teacher'`。
- 自动重定向到教师端 `webhuangjunhao/new.html`，不能停留在学生端页面。

---

## 2. 课程浏览（course-browse.html）

### S4：课程列表展示与已选标记

1. 使用 S1 的登录态（demo_student 已登录学生端）。
2. 在学生端顶部导航中进入「课程浏览」（对应 `course-browse.html`）。
3. 等待页面加载完成。

**预期结果：**
- 前端调用接口：
  - `GET /api/v1/courses?page=1&pageSize=10`；
  - `GET /api/v1/me/enrollments`（无学期过滤）。
- 页面课程卡片中至少包含以下两门课程：
  - CS101《程序设计基础》；
  - SE201《软件工程导论》。
- 对于 demo_student 已选的课程（CS101 和 SE201），对应卡片右侧按钮显示为「已选」，并点击后弹出取消/确认模态框（即使当前后端未实现真正退课逻辑，按钮和弹窗 UI 应正常工作）。

### S5：课程搜索

1. 保持在「课程浏览」页面。
2. 在搜索框中输入 `程序设计基础`，点击「搜索」。

**预期结果：**
- 前端调用：`GET /api/v1/courses?page=1&pageSize=10&course_name=程序设计基础`。
- 返回课程列表仅包含或优先展示 CS101《程序设计基础》。

---

## 3. 我的课程（my-courses.html）

### S6：按学期查看我的课程

1. 在学生端导航中进入「我的课程」（`my-courses.html`）。
2. 确认当前学期变量 `semester = '2023-2024-1'`（可以在前端代码中看到默认值或通过 UI 选择）。

**预期结果：**
- 前端调用：`GET /api/v1/me/enrollments?semester=2023-2024-1`。
- 返回列表中至少包含两条记录：
  - enrollment_id = 1：CS101，semester = `2023-2024-1`；
  - enrollment_id = 2：SE201，semester = `2023-2024-1`。
- 页面「我的课程」列表中展示：
  - 每行包含课程名称、授课教师姓名（示例教师）、学期信息；
  - 每一行右侧有「详情」按钮，对应存储正确的 `enrollment_id`。

### S7：从“我的课程”进入课程详情

1. 在「我的课程」列表中，点击 CS101 对应的「详情」按钮。

**预期结果：**
- 前端在 `localStorage` 中写入 `currentEnrollmentId = 1`。
- 页面跳转到 `course-detail.html`。

---

## 4. 学习任务与课程资料（course-detail.html）

> 当前前端已接入真实接口：`GET /api/v1/me/enrollments/{enrollment_id}/tasks`，并使用 TaskProgress + CourseMaterials 组合生成任务列表。

### S8：任务列表加载

1. 确保执行完 S7（已在 `localStorage` 中存有 `currentEnrollmentId = 1`）。
2. 打开 `course-detail.html` 页面。

**预期结果：**
- 前端读取 `currentEnrollmentId = 1`，调用：
  - `GET /api/v1/me/enrollments/1/tasks`。
- 返回任务列表中至少包含两条任务，对应于：
  - material_id = 1，title = 「第1章课件」，status = `todo`；
  - material_id = 2，title = 「轮播图1」，status = `done`；
- 页面任务列表中：
  - 「第1章课件」旁边的状态显示为「待完成」；
  - 「轮播图1」旁边的状态显示为「已完成」。

### S9：任务筛选（全部 / 待完成 / 已完成）

1. 保持在 `course-detail.html` 页面，任务列表已经加载完成。
2. 依次点击顶部筛选按钮：
   - 「全部」；
   - 「待完成」；
   - 「已完成」。

**预期结果：**
- 「全部」：列表显示两条任务（todo + done）。
- 「待完成」：仅显示 `status = 'todo'` 的任务（第1章课件）。
- 「已完成」：仅显示 `status = 'done'` 的任务（轮播图1）。

### S10：查看任务详情弹窗

1. 在「全部」或「待完成」筛选状态下，点击其中一条任务卡片。

**预期结果：**
- 弹出任务详情模态框，显示：
  - 任务标题（来自 `material.title`）；
  - 任务类型（来自 `material.material_type`，如 `document` 或 `carousel_image`）；
  - 任务进度状态（待完成 / 已完成）；
  - 显示内部 `task_progress_id` 等调试信息（如前端有展示）。

> 注：当前 `markTaskComplete()` 函数仍为前端示例代码（只在前端提示成功，并重新刷新任务列表），后端是否实现实际更新接口请根据代码确认。测试时可重点验证弹窗展示与调用逻辑是否正常即可。

---

## 5. 成绩汇总与详情（grades.html）

### S11：按学期查看成绩汇总

1. 在学生端导航中进入「我的成绩」（`grades.html`）。
2. 在页面上方的学期选择下拉框中选择 `2023-2024-1`（如果为空默认显示第一个有数据的学期也可以）。

**预期结果：**
- 前端调用接口：
  - `GET /api/v1/me/grades/summary?semester=2023-2024-1`。
- 返回数据结构中至少包含 key `"2023-2024-1"`，对应的 value 内含字段：
  - `semester_gpa`：一个 > 0 的数值；
  - `total_credits`：应接近 3.0 + 2.5 = 5.5；
  - `courses`：数组长度至少为 2，包含 CS101 和 SE201 两门课：
    - CS101 的 `final_score` 约为 89，`credits = 3.0`；
    - SE201 的 `final_score` 约为 90.8，`credits = 2.5`。
- 页面概览区域：
  - 「学期 GPA」显示为 `semester_gpa`（前端使用 `toFixed(2)` 处理）；
  - 「总学分」显示为 `total_credits`；
  - 「平均分」为所有课程 `final_score` 的平均值（前端通过 JS 计算）。
- 成绩表格中每一行包含：
  - 课程名称；
  - 学分；
  - 最终成绩；
  - GPA；
  - 「查看详情」按钮。

### S12：查看单门课程成绩详情（CS101）

1. 在成绩列表中，找到 CS101 对应的那一行。
2. 点击该行的「查看详情」按钮。

**预期结果：**
- 前端调用接口：`GET /api/v1/me/enrollments/1/grades`（注意 enrollment_id 应为 1，对应 CS101）。
- 返回结果中包含：
  - `course_name = "程序设计基础"`；
  - `final_score` ≈ 89；
  - `grade_items` 数组中至少两条：
    - item_name = "作业1"，weight = 0.2，对应 score = 85.0；
    - item_name = "期末考试"，weight = 0.8，对应 score = 90.0。
- 前端成绩详情弹窗（或详情区域）中：
  - 标题显示为「程序设计基础 - 成绩详情」；
  - 表格中逐行展示每个成绩项的名称、权重（百分比）和分数；
  - 最后一行显示「最终成绩」100% 、分数约为 89。

### S13：查看单门课程成绩详情（SE201）

1. 返回成绩列表。
2. 在成绩列表中找到 SE201 对应的那一行。
3. 点击「查看详情」。

**预期结果：**
- 前端调用接口：`GET /api/v1/me/enrollments/2/grades`（enrollment_id = 2）。
- 返回结果中包含：
  - `course_name = "软件工程导论"`；
  - `final_score` ≈ 90.8；
  - `grade_items` 数组中至少两条：
    - item_name = "课堂表现"，weight = 0.3，score = 88.0；
    - item_name = "课程项目"，weight = 0.7，score = 92.0。
- 前端详情展示逻辑与 S12 一致，只是课程名称和具体分数不同。

---

## 6. 接口健壮性与错误场景（可选）

> 以下用例主要通过接口工具（如 Postman）或在浏览器控制台直接调用 fetch 进行验证，用于保证学生端相关 API 在异常情况下有合理返回。

### S14：缺少 Authorization 头访问学生端接口

1. 在浏览器中清空 `localStorage` 的 `token` 和 `user`，或在 Postman 中不设置 Authorization 头。
2. 直接调用：`GET /api/v1/me/enrollments`、`GET /api/v1/me/grades/summary` 等学生端专用接口。

**预期结果：**
- 后端返回 401/403 相关错误（具体取决于实现），提示未登录或未授权。
- 前端在这种情况下应当（或已经实现为）在界面级别重定向回网关，不应继续展示学生端数据。

### S15：使用教师 token 访问学生端接口

1. 使用 demo_teacher 登录后，复制其 `token`。
2. 在 Postman 或浏览器控制台中设置：`Authorization: Bearer <教师 token>`。
3. 调用：`GET /api/v1/me/enrollments`、`GET /api/v1/me/grades/summary` 等学生端接口。

**预期结果：**
- 后端根据 `current_user.role` 拒绝访问（通常返回 403 Forbidden），或返回明确错误信息。
- 前端在正常页面访问路径下，已经通过 role 检查阻止教师进入学生端，这里仅作为后端接口健壮性补充验证。

---

## 7. 总结

- 本测试计划围绕唯一学生测试账号 **demo_student** 设计，结合 [database/BuildDatabase.sql](../database/BuildDatabase.sql) 中的示例数据，覆盖了学生端的核心功能：
  - 登录与访问控制；
  - 课程浏览与已选状态；
  - 我的课程列表；
  - 学习任务与课程资料；
  - 成绩汇总与成绩详情。
- 如需扩展更多学生端功能（如选课/退课写操作、作业提交等），可以在保持 demo_student 作为唯一测试账号的前提下，在 SQL 中继续增加相应示例数据，并在本文件中追加新的测试用例编号（S16、S17...）。
