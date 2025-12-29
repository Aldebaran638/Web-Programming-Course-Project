# API 设计文档：成绩管理教学平台

本文档详细定义了“成绩管理教学平台”项目的功能需求，并为每个功能设计了对应的 RESTful API。

---

## 1. 公共前端与用户中心

### 1.1. 首页与课程浏览

#### 1.1.1. 获取课程列表 (课程信息库)

- **功能描述**: 为游客和学生提供一个公开的课程列表，展示课程的基本信息，并支持搜索、筛选和分页功能。
- **访问权限**: 公开访问 (游客、学生、教师、教学管理员、系统管理员)。
- **API 端点**: `GET /api/v1/courses`

##### 请求

- **查询参数**:
  - `page` (可选, `Integer`, 默认: `1`): 请求的页码。
  - `pageSize` (可选, `Integer`, 默认: `10`): 每页返回的课程数量。
  - `sortBy` (可选, `String`, 默认: `course_code`): 排序字段，可选值为 `course_code`, `course_name`, `credits`, `department`。
  - `order` (可选, `String`, 默认: `asc`): 排序顺序，可选值为 `asc` (升序) 或 `desc` (降序)。
  - `course_code` (可选, `String`): 按课程编号精确搜索。
  - `course_name` (可选, `String`): 按课程名称模糊搜索。
  - `department` (可选, `String`): 按开课院系筛选。
  - `credits` (可选, `Number`): 按学分筛选。

- **示例请求**:
  ```http
  GET /api/v1/courses?page=1&pageSize=5&sortBy=credits&order=desc&department=计算机科学
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 一个包含课程列表和分页信息的 JSON 对象。课程信息会关联 `TeachingAssignments` 和 `TeacherProfiles` 表以获取授课教师姓名。
  - **示例**:
    ```json
    {
      "pagination": {
        "totalItems": 50,
        "totalPages": 10,
        "currentPage": 1,
        "pageSize": 5
      },
      "courses": [
        {
          "id": 101,
          "course_code": "CS101",
          "course_name": "计算机科学导论",
          "credits": 4.0,
          "description": "编程和计算机科学概念的基础课程。",
          "department": "计算机科学",
          "prerequisites": "无",
          "teachers": [
            {
              "id": 1,
              "full_name": "张三"
            }
          ]
        },
        {
          "id": 202,
          "course_code": "MA201",
          "course_name": "高等数学I",
          "credits": 3.0,
          "description": "微积分入门。",
          "department": "数学系",
          "prerequisites": "高中数学",
          "teachers": [
            {
              "id": 2,
              "full_name": "李四"
            }
          ]
        }
      ]
    }
    ```

- **错误响应**:
  - `400 Bad Request`: 请求参数无效。
    ```json
    {
      "error": {
        "code": "INVALID_PARAMETER",
        "message": "无效的排序字段 'invalid_field'。"
      }
    }
    ```

#### 1.1.2. 获取单个课程详情

- **功能描述**: 获取指定 ID 的单个课程的详细信息。
- **访问权限**: 公开访问。
- **API 端点**: `GET /api/v1/courses/{id}`

##### 请求

- **URL 参数**:
  - `id` (必需, `Integer`): 课程的唯一 ID。

- **示例请求**:
  ```http
  GET /api/v1/courses/101
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 包含课程详细信息的 JSON 对象，包括完整的教师信息。
  - **示例**:
    ```json
    {
      "id": 101,
      "course_code": "CS101",
      "course_name": "计算机科学导论",
      "credits": 4.0,
      "description": "编程和计算机科学概念的基础课程。",
      "department": "计算机科学",
      "prerequisites": "无",
      "teachers": [
        {
          "id": 1,
          "full_name": "张三",
          "title": "教授"
        }
      ]
    }
    ```

- **错误响应**:
  - `404 Not Found`: 指定 ID 的课程不存在。
    ```json
    {
      "error": {
        "code": "NOT_FOUND",
        "message": "ID为 101 的课程未找到。"
      }
    }
    ```

### 1.2. 账户与安全

#### 1.2.1. 批量创建学生账号

- **功能描述**: 教学管理员通过上传标准格式的 XLS 或 CSV 文件批量创建学生账号。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**: `POST /api/v1/users/batch-create-students`

##### 请求

- **请求头**:
  - `Content-Type`: `multipart/form-data`
- **请求体**:
  - `file` (必需, `File`): 包含学生信息的 XLS 或 CSV 文件。文件格式应包含 `student_id_number`, `full_name`, `class_name` 列。

- **示例 (伪代码)**:
  ```
  POST /api/v1/users/batch-create-students
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

  ------WebKitFormBoundary7MA4YWxkTrZu0gW
  Content-Disposition: form-data; name="file"; filename="students.csv"
  Content-Type: text/csv

  student_id_number,full_name,class_name
  20210001,王五,软件工程2101班
  20210002,赵六,软件工程2101班
  ------WebKitFormBoundary7MA4YWxkTrZu0gW--
  ```

##### 响应

- **成功响应 (201 Created)**:
  - **内容**: 报告成功创建、失败或已存在的用户数量。
  - **示例**:
    ```json
    {
      "summary": {
        "total": 2,
        "created": 1,
        "failed": 0,
        "existing": 1
      },
      "details": [
        {
          "student_id_number": "20210002",
          "status": "existing",
          "message": "用户已存在"
        }
      ]
    }
    ```

- **错误响应**:
  - `400 Bad Request`: 文件格式错误或缺少必要列。
  - `401 Unauthorized`: 非教学管理员访问。
  - `403 Forbidden`: 无权限操作。

#### 1.2.2. 用户登录

- **功能描述**: 用户使用用户名和密码登录系统。后端需实现加盐哈希密码验证和连续错误锁定机制。
- **访问权限**: 公开访问。
- **API 端点**: `POST /api/v1/auth/login`

##### 请求

- **请求体 (JSON)**:
  - `username` (必需, `String`): 用户名/学号/工号。
  - `password` (必需, `String`): 密码。

- **示例**:
  ```json
  {
    "username": "20210001",
    "password": "InitialPassword123"
  }
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回认证令牌 (如 JWT) 和用户信息。
  - **示例**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 10,
        "username": "20210001",
        "role": "student",
        "force_password_change": true
      }
    }
    ```

- **错误响应**:
  - `401 Unauthorized`: 用户名或密码错误。
  - `423 Locked`: 账户因多次尝试失败而被锁定。
    ```json
    {
      "error": {
        "code": "ACCOUNT_LOCKED",
        "message": "账户已锁定，请在 5 分钟后重试。"
      }
    }
    ```

#### 1.2.3. 忘记密码 (请求重置)

- **功能描述**: 用户输入邮箱地址，系统向该邮箱发送密码重置链接。
- **访问权限**: 公开访问。
- **API 端点**: `POST /api/v1/auth/forgot-password`

##### 请求

- **请求体 (JSON)**:
  - `email` (必需, `String`): 用户绑定的邮箱地址。

- **示例**:
  ```json
  {
    "email": "student@example.edu"
  }
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 提示用户检查邮箱。
  - **示例**:
    ```json
    {
      "message": "如果邮箱地址存在，密码重置链接已发送至您的邮箱。"
    }
    ```

#### 1.2.4. 重置密码

- **功能描述**: 用户通过邮件中的链接访问重置页面，输入新密码完成重置。
- **访问权限**: 公开访问 (需有效令牌)。
- **API 端点**: `POST /api/v1/auth/reset-password`

##### 请求

- **请求体 (JSON)**:
  - `token` (必需, `String`): 从邮件链接中获取的重置令牌。
  - `new_password` (必需, `String`): 用户设置的新密码。

- **示例**:
  ```json
  {
    "token": "a_very_long_secure_reset_token",
    "new_password": "NewSecurePassword!@#"
  }
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 提示密码已成功重置。
  - **示例**:
    ```json
    {
      "message": "密码已成功重置，您现在可以使用新密码登录。"
    }
    ```

- **错误响应**:
  - `400 Bad Request`: 令牌无效或已过期。

---

## 2. 学生端：课程修读与成绩查询

### 2.1. 课程修读

#### 2.1.1.1 学生选修课程

- **功能描述**: 登录的学生可以选修一门特定的课程。
- **访问权限**: 学生 (student)。
- **API 端点**: `POST /api/v1/enrollments`
#### 补充说明
（1）bug：测试发现课程浏览中的退课按钮无响应，无法退课；在退出取消选课的提示窗口时，系统自动添加了相同的选课卡片。
##### 请求

- **请求体 (JSON)**:
  - `course_id` (必需, `Integer`): 要选修的课程 ID。
  - `semester` (必需, `String`): 选课的学期，例如 "2025-2026-1"。

- **示例**:
  ```json
  {
    "course_id": 101,
    "semester": "2025-2026-1"
  }
  ```

##### 响应

- **成功响应 (201 Created)**:
  - **内容**: 返回新创建的选课记录。
  - **示例**:
    ```json
    {
      "id": 55,
      "student_id": 10,
      "course_id": 101,
      "semester": "2025-2026-1",
      "enrollment_date": "2025-09-01T10:00:00Z"
    }
    ```

- **错误响应**:
  - `400 Bad Request`: 课程不存在、不满足选课要求或已选过该课程。
  - `401 Unauthorized`: 用户未登录。
  - `403 Forbidden`: 非学生角色访问。

#### 2.1.1.2 学生取消课程选课

- **功能描述**: 登录的学生可以取消一门特定课程的选课。
- **访问权限**: 学生 (student)。
- **API 端点**: `POST /api/v1/withdraw`

##### 请求

- **请求体 (JSON)**:
  - `course_id` (必需, `Integer`): 要取消的课程 ID。
  - `semester` (必需, `String`): 课程的学期，例如 "2025-2026-1"。

- **示例**:
  ```json
  {
    "course_id": 101,
    "semester": "2025-2026-1"
  }
  ```

##### 响应

- **成功响应 (201 Created)**:
  - **内容**: 返回取消的选课记录。
  - **示例**:
    ```json
    {
      "id": 55,
      "student_id": 10,
      "course_id": 101,
      "semester": "2025-2026-1",
      "enrollment_date": "2025-09-01T10:00:00Z"
    }
    ```

- **错误响应**:
  - `400 Bad Request`: 课程不存在、没有选过该课程。
  - `401 Unauthorized`: 用户未登录。
  - `403 Forbidden`: 非学生角色访问。

#### 2.1.2. 查看“我的课程” (已选修课程)

- **功能描述**: 学生查看自己已选修的所有课程列表。
- **访问权限**: 学生 (student)。
- **API 端点**: `GET /api/v1/me/enrollments`

##### 请求

- **查询参数**:
  - `semester` (可选, `String`): 按学期筛选，例如 "2025-2026-1"。

- **示例请求**:
  ```http
  GET /api/v1/me/enrollments?semester=2025-2026-1
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回一个包含选课记录和课程详细信息的数组。
  - **示例**:
    ```json
    [
      {
        "enrollment_id": 55,
        "semester": "2025-2026-1",
        "course": {
          "id": 101,
          "course_code": "CS101",
          "course_name": "计算机科学导论",
          "credits": 4.0,
          "teachers": [
            {
              "id": 1,
              "full_name": "张三"
            }
          ]
        }
      }
    ]
    ```

#### 2.1.3. 查看课程的学习任务

- **功能描述**: 学生查看某一门已选课程下需要完成的学习任务（如课件、作业）。
- **访问权限**: 学生 (student)。
- **API 端点**: `GET /api/v1/me/enrollments/{enrollment_id}/tasks`
#### 补充说明
（1）测试发现学生端看不到教师布置的任务，需要在教师端发布作业后，学生端能够查看并完成作业和考试，完成途径包括文本框编辑或者上传文件提交，提交后需要有提交成功或者提交失败的提示。最后教师端能够查看学生的作业/考试并且批阅打分。
（2）首页能够查看新创建的课程（要求管理员新建课程后，学生端能看到）
##### 请求

- **URL 参数**:
  - `enrollment_id` (必需, `Integer`): 学生的选课记录 ID。
- **查询参数**:
  - `status` (可选, `String`): 按任务状态筛选 ('todo', 'done')。

- **示例请求**:
  ```http
  GET /api/v1/me/enrollments/55/tasks?status=todo
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回一个任务列表，包含任务详情和学生的完成状态。
  - **示例**:
    ```json
    [
      {
        "task_progress_id": 123,
        "status": "todo",
        "material": {
          "id": 88,
          "material_type": "document",
          "title": "第一章：计算机历史.pdf"
        }
      },
      {
        "task_progress_id": 124,
        "status": "todo",
        "material": {
          "id": 89,
          "material_type": "video",
          "title": "第二章：冯·诺依曼结构.mp4"
        }
      }
    ]
    ```

### 2.2. 个人成绩中心

#### 2.2.1. 获取学期成绩总览

- **功能描述**: 学生以学期为维度，查看所有课程的最终成绩、学分和绩点。
- **访问权限**: 学生 (student)。
- **API 端点**: `GET /api/v1/me/grades/summary`

##### 请求

- **查询参数**:
  - `semester` (可选, `String`): 按学期筛选。如果未提供，则返回所有学期的成绩。

- **示例请求**:
  ```http
  GET /api/v1/me/grades/summary?semester=2025-2026-1
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回一个按学期组织的成绩对象，包含课程成绩和学期统计。
  - **示例**:
    ```json
    {
      "2025-2026-1": {
        "courses": [
          {
            "course_name": "计算机科学导论",
            "credits": 4.0,
            "final_score": 92.5,
            "gpa": 4.0
          },
          {
            "course_name": "高等数学I",
            "credits": 3.0,
            "final_score": 85.0,
            "gpa": 3.7
          }
        ],
        "semester_gpa": 3.87,
        "total_credits": 7.0
      }
    }
    ```

#### 2.2.2. 获取课程成绩详情

- **功能描述**: 学生查看某一门课程的详细成绩构成。
- **访问权限**: 学生 (student)。
- **API 端点**: `GET /api/v1/me/enrollments/{enrollment_id}/grades`
#### 补充说明
（1）测试发现查看成绩详情的界面，成绩项信息和上分的栏目不对齐，需要修改一下布局，使其对齐。
##### 请求

- **URL 参数**:
  - `enrollment_id` (必需, `Integer`): 学生的选课记录 ID。

- **示例请求**:
  ```http
  GET /api/v1/me/enrollments/55/grades
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回该课程所有成绩项的列表，包括名称、权重和得分。
  - **示例**:
    ```json
    {
      "course_name": "计算机科学导论",
      "final_score": 92.5,
      "grade_items": [
        {
          "item_name": "作业1",
          "weight": 0.15,
          "score": 90.0
        },
        {
          "item_name": "作业2",
          "weight": 0.15,
          "score": 95.0
        },
        {
          "item_name": "期中考试",
          "weight": 0.30,
          "score": 88.0
        },
        {
          "item_name": "期末考试",
          "weight": 0.40,
          "score": 94.0
        }
      ]
    }
    ```

- **错误响应**:
  - `404 Not Found`: 选课记录不存在或成绩尚未发布。

---

## 3. 教师端：课程与成绩管理

### 3.1. 课程管理

#### 3.1.1. 获取教师的授课列表

- **功能描述**: 获取当前登录教师所负责的所有课程列表。
- **访问权限**: 教师 (teacher)。
- **API 端点**: `GET /api/v1/me/teaching-assignments`

#### 补充说明
（1）教师端暂无创建一门新课程的功能。要求设置课程基本信息（如课程代码、课程名称、学分、学期、先修课、课程描述）。创建新课程后，再次点击“查询授课列表”按钮，即可看到新课程（授课任务ID	学期	课程ID	课程代码	课程名称）。

##### 请求

- **查询参数**:
  - `semester` (可选, `String`): 按学期筛选。

- **示例请求**:
  ```http
  GET /api/v1/me/teaching-assignments?semester=2025-2026-1
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回一个包含授课任务和课程信息的数组。
  - **示例**:
    ```json
    [
      {
        "teaching_assignment_id": 33,
        "semester": "2025-2026-1",
        "course": {
          "id": 101,
          "course_code": "CS101",
          "course_name": "计算机科学导论"
        }
      }
    ]
    ```

#### 3.1.2. 上传课程资料

- **功能描述**: 教师为指定课程上传资料，如文档、视频、轮播图等。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `POST /api/v1/courses/{course_id}/materials`
#### 补充
（1）上传课程资料（如文档、音视频、课件等）时，前端界面应提供一个课程名称的下拉框让老师勾选需要上传资料的课程（而非选择课程ID）。
（2）上传课程资料（如文档、音视频、课件等）后，前端界面应显示资料上传成功的信息，并在上传课程资料的区域中新建一个卡片，显示资料名称、资料上传者、资料上传时间、资料大小、资料下载链接。
（3）可以对上传的资料卡片进行编辑和撤回操作。

##### 请求

- **URL 参数**:
  - `course_id` (必需, `Integer`): 课程 ID。
- **请求头**:
  - `Content-Type`: `multipart/form-data`
- **表单字段**:
  - `material_type` (必需, `String`): 资料类型 ('document', 'video', 'carousel_image')。
  - `title` (必需, `String`): 资料标题。
  - `file` (必需, `File`): 上传的文件。
  - `display_order` (可选, `Integer`): 显示顺序，用于轮播图等。

##### 响应

- **成功响应 (201 Created)**:
  - **内容**: 返回新创建的课程资料信息。
  - **示例**:
    ```json
    {
      "id": 90,
      "course_id": 101,
      "material_type": "document",
      "title": "第三章：数据结构.pdf",
      "file_path_or_content": "/uploads/courses/101/materials/xyz.pdf",
      "display_order": 0,
      "uploaded_by": 1
    }
    ```

#### 3.1.3. 更新课程配置

- **功能描述**: 教师修改课程的额外配置，如简介、是否开启评论区等。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `PATCH /api/v1/courses/{course_id}/config`
#### 补充说明
（1）前端界面应提供该教师授课列表的下拉框，让教师选择需要修改配置的课程（而非选择课程ID），最好前端界面能同步更新该课程目前的配置情况。
##### 请求

- **URL 参数**:
  - `course_id` (必需, `Integer`): 课程 ID。
- **请求体 (JSON)**:
  - `description` (可选, `String`): 更新课程简介。
  - `allow_comments` (可选, `Boolean`): 是否开启评论区。
  - `allow_notes` (可选, `Boolean`): 是否开启笔记区。

- **示例**:
  ```json
  {
    "description": "本课程将深入探讨高级数据结构与算法。",
    "allow_comments": true
  }
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回更新后的课程配置信息。
  - **示例**:
    ```json
    {
      "course_id": 101,
      "description": "本课程将深入探讨高级数据结构与算法。",
      "config": {
        "allow_comments": true,
        "allow_notes": false
      }
    }
    ```

### 3.2. 作业及考试管理

#### 3.2.1. 布置作业或考试

- **功能描述**: 教师为课程布置新的作业或考试。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `POST /api/v1/courses/{course_id}/assignments`
#### 补充说明
（1）布置作业或考试时，前端界面应提供该教师授课列表的下拉框，让教师选择需要布置作业或考试的课程（而非选择课程ID）。
（2） 布置作业或考试后，前端界面应显示布置成功的信息，并在布置作业或考试的区域中新建一个卡片，显示课程名称、作业/考试标题、截止日期、创建时间、附件下载链接（如果有）。

##### 请求

- **URL 参数**:
  - `course_id` (必需, `Integer`): 课程 ID。
- **请求体 (JSON)**:
  - `title` (必需, `String`): 作业/考试标题。
  - `description` (可选, `String`): 详细说明。
  - `deadline` (可选, `DateTime`): 截止日期。
  - `type` (必需, `String`): 'assignment' 或 'exam'。
  - `file_path` (可选, `String`): 如果有附件，则提供附件路径。

- **示例**:
  ```json
  {
    "title": "第一次编程作业",
    "description": "实现一个链表数据结构。",
    "deadline": "2025-10-15T23:59:59Z",
    "type": "assignment"
  }
  ```

##### 响应

- **成功响应 (201 Created)**:
  - **内容**: 返回新创建的作业/考试信息。
  - **示例**:
    ```json
    {
      "id": 25,
      "course_id": 101,
      "title": "第一次编程作业",
      "type": "assignment",
      "deadline": "2025-10-15T23:59:59Z"
    }
    ```

#### 3.2.2. 查看作业/考试提交情况

- **功能描述**: 教师查看某个作业或考试的所有学生提交列表。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `GET /api/v1/assignments/{assignment_id}/submissions`
#### 补充说明
（1）教师最好可根据学生ID查看该项课程的作业完成情况，并且前端界面应显示作业提交情况，包括学生ID、学生姓名、提交时间、作业状态（已提交、未提交），并且能够为该项作业打分。打分操作可与成绩管理的录入/修改单个成绩的功能联动，将作业当成一项成绩ID为学生打分。
（2）如果可以，前端界面应在3.2.1的作业信息卡片的基础上，额外显示已提交人数/全部人数的信息项。
##### 请求

- **URL 参数**:
  - `assignment_id` (必需, `Integer`): 作业/考试 ID。

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回提交记录列表。
  - **示例**:
    ```json
    [
      {
        "submission_id": 201,
        "student": {
          "id": 10,
          "full_name": "王五"
        },
        "submitted_at": "2025-10-14T20:00:00Z",
        "status": "graded", // or 'pending'
        "score": 90.0
      }
    ]
    ```

### 3.3. 成绩构成与录入

#### 3.3.1. 设置成绩组成项

- **功能描述**: 教师为课程定义成绩的构成部分及其权重。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `POST /api/v1/courses/{course_id}/grade-items`
#### 补充说明
（1）在前端界面可根据教师授课列表的下拉框，让教师选择需要设置成绩组成项的课程（而非选择课程ID）。
（2）前端界面应显示该课程目前的成绩构成，包括成绩项名称、权重、描述。
（3）当新增成绩项的权重和旧成绩项权重累加起来超过1时，前端界面应显示错误信息，并阻止用户提交。需要先对旧成绩项修改权重才能继续新增成绩项。
##### 请求

- **URL 参数**:
  - `course_id` (必需, `Integer`): 课程 ID。
- **请求体 (JSON)**:
  - `item_name` (必需, `String`): 成绩项名称 (如 "期中考试")。
  - `weight` (必需, `Number`): 权重 (0.00-1.00)。
  - `description` (可选, `String`): 描述。

- **示例**:
  ```json
  {
    "item_name": "期中考试",
    "weight": 0.30,
    "description": "占总成绩的30%"
  }
  ```

##### 响应

- **成功响应 (201 Created)**:
  - **内容**: 返回新创建的成绩组成项。
  - **示例**:
    ```json
    {
      "id": 41,
      "course_id": 101,
      "item_name": "期中考试",
      "weight": 0.30
    }
    ```
- **错误响应**:
  - `400 Bad Request`: 所有成绩项权重之和超过1。

#### 3.3.2. 录入/修改单个成绩

- **功能描述**: 教师为某个学生的某个成绩项录入或修改分数。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `PUT /api/v1/grades/{grade_id}`

##### 请求

- **URL 参数**:
  - `grade_id` (必需, `Integer`): 成绩记录的唯一 ID。
- **请求体 (JSON)**:
  - `score` (必需, `Number`): 分数。

- **示例**:
  ```json
  {
    "score": 95.5
  }
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回更新后的成绩记录。
  - **示例**:
    ```json
    {
      "id": 301,
      "enrollment_id": 55,
      "grade_item_id": 41,
      "score": 95.5,
      "status": "graded"
    }
    ```

#### 3.3.3. 批量导入成绩

- **功能描述**: 教师通过上传文件批量为整个班级的某个成绩项导入分数。
- **访问权限**: 教师 (teacher, 且必须是该课程的授课教师)。
- **API 端点**: `POST /api/v1/grade-items/{item_id}/grades/batch-upload`

##### 请求

- **URL 参数**:
  - `item_id` (必需, `Integer`): 成绩组成项的 ID。
- **请求头**:
  - `Content-Type`: `multipart/form-data`
- **表单字段**:
  - `file` (必需, `File`): 包含 `student_id_number` 和 `score` 列的 CSV/XLS 文件。

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回导入操作的摘要。
  - **示例**:
    ```json
    {
      "summary": {
        "total": 50,
        "updated": 48,
        "failed": 2
      },
      "details": [
        {
          "student_id_number": "20219999",
          "status": "failed",
          "message": "学生未选修该课程"
        }
      ]
    }
    ```

---

## 4. 教学管理端

### 4.1. 教学基础数据管理

#### 4.1.1. 管理班级信息 (CRUD)

- **功能描述**: 创建、读取、更新和删除班级信息。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**:
  - `POST /api/v1/classes` (创建)
  - `GET /api/v1/classes` (获取列表)
  - `GET /api/v1/classes/{id}` (获取单个)
  - `PUT /api/v1/classes/{id}` (更新)
  - `DELETE /api/v1/classes/{id}` (删除)

  ## 补充说明
  （1）班级管理创建功能正常，但是编辑和删除按键交互无反应

##### 创建 (POST)

- **请求体**:
  ```json
  {
    "class_name": "网络工程2101班",
    "department": "信息科学与技术学院",
    "enrollment_year": 2021
  }
  ```
- **响应 (201 Created)**: 返回新创建的班级对象。

##### 获取列表 (GET)

- **响应 (200 OK)**: 返回班级列表，支持分页。

#### 4.1.2. 管理学生信息 (CRUD)

- **功能描述**: 管理学生档案信息。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**:
  - `POST /api/v1/students` (创建单个学生)
  - `GET /api/v1/students` (获取列表)
  - `GET /api/v1/students/{id}` (获取单个)
  - `PUT /api/v1/students/{id}` (更新)
  - `DELETE /api/v1/students/{id}` (删除)
  ## 补充说明
  （1）搜索功能好像不生效，编辑和删除按键交互不了，切换激活/锁定状态也不行

##### 创建 (POST)

- **请求体**:
  ```json
  {
    "username": "20210003",
    "full_name": "孙七",
    "email": "sunqi@example.edu",
    "class_id": 1
  }
  ```
- **响应 (201 Created)**: 返回新创建的学生及用户对象。

#### 4.1.3. 管理教师信息 (CRUD)

- **功能描述**: 管理教师档案信息。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**:
  - `POST /api/v1/teachers`
  - `GET /api/v1/teachers`
  - `GET /api/v1/teachers/{id}`
  - `PUT /api/v1/teachers/{id}`
  - `DELETE /api/v1/teachers/{id}`
  ## 补充说明
  （1）搜索功能好像不生效，编辑和删除按键交互不了，教师不显示工号

#### 4.1.4. 管理课程信息 (CRUD)

- **功能描述**: 管理课程库中的课程。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**:
  - `POST /api/v1/courses`
  - `GET /api/v1/courses` (已在公共部分定义)
  - `PUT /api/v1/courses/{id}`
  - `DELETE /api/v1/courses/{id}`
  ## 补充说明
  问题同上

##### 创建 (POST)

- **请求体**:
  ```json
  {
    "course_code": "PHY101",
    "course_name": "大学物理",
    "credits": 3.5,
    "department": "物理系"
  }
  ```
- **响应 (201 Created)**: 返回新创建的课程对象。

#### 4.1.5. 管理教室信息 (CRUD)

- **功能描述**: 管理教室资源。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**:
  - `POST /api/v1/classrooms`
  - `GET /api/v1/classrooms`
  - `GET /api/v1/classrooms/{id}`
  - `PUT /api/v1/classrooms/{id}`
  - `DELETE /api/v1/classrooms/{id}`
  ## 补充说明
  问题同上

### 4.2. 学期教学安排

#### 4.2.1. 创建学期开课计划 (分配教师)

- **功能描述**: 为某个学期的某门课程分配授课教师。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**: `POST /api/v1/teaching-assignments`
  

##### 请求

- **请求体**:
  ```json
  {
    "teacher_id": 2,
    "course_id": 101,
    "semester": "2026-2027-1"
  }
  ```

##### 响应

- **成功响应 (201 Created)**: 返回新创建的授课关系。

#### 4.2.2. 安排课程表

- **功能描述**: 为一个授课任务安排具体的上课时间和教室。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**: `POST /api/v1/course-schedules`
  

##### 请求

- **请求体**:
  ```json
  {
    "teaching_id": 33,
    "classroom_id": 5,
    "day_of_week": "Mon",
    "start_time": "10:10:00",
    "end_time": "11:50:00"
  }
  ```

##### 响应

- **成功响应 (201 Created)**: 返回新创建的排课记录。
- **错误响应 (409 Conflict)**: 教室或教师时间冲突。

### 4.3. 成绩审核与发布

#### 4.3.1. 获取待审核的成绩

- **功能描述**: 获取所有已由教师提交但尚未发布的成绩，并标记出异常数据。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**: `GET /api/v1/grades/pending-review`
  ## 补充说明
  问题同上，按键交互不了，搜索无反应
##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回按课程分组的成绩列表，包含异常标记。
  - **示例**:
    ```json
    [
      {
        "course_id": 101,
        "course_name": "计算机科学导论",
        "status": "pending_review",
        "warnings": [
          {
            "type": "HIGH_EXCELLENT_RATE",
            "message": "优秀率 (90分以上) 达到 45%，超过预警阈值 30%。"
          }
        ]
      }
    ]
    ```

#### 4.3.2. 批量发布成绩

- **功能描述**: 教学管理员审核通过后，将指定课程的成绩状态更新为“已发布”。
- **访问权限**: 教学管理员 (edu_admin)。
- **API 端点**: `POST /api/v1/grades/publish`
## 补充说明
  问题同上，按键交互不了，搜索无反应

##### 请求

- **请求体**:
  ```json
  {
    "course_ids": [101, 202]
  }
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回操作摘要。
  - **示例**:
    ```json
    {
      "message": "2 个课程的成绩已成功发布。"
    }
    ```

---

## 5. 系统管理端

### 5.1. 日志审计

#### 5.1.1. 查询操作日志

- **功能描述**: 系统管理员查询系统的关键操作日志。
- **访问权限**: 系统管理员 (sys_admin)。
- **API 端点**: `GET /api/v1/logs`
  ## 补充说明
  （1）功能点已完善，样式方面，侧边栏“系统管理”和“其他”二字换个显眼的颜色会更好
##### 请求

- **查询参数**:
  - `user_id` (可选, `Integer`): 按操作用户ID筛选。
  - `action` (可选, `String`): 按操作类型筛选 (如 "USER_LOGIN")。
  - `start_date` (可选, `DateTime`): 起始时间。
  - `end_date` (可选, `DateTime`): 结束时间。
  - `page`, `pageSize`... (支持分页和排序)

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 返回日志列表。
  - **示例**:
    ```json
    {
      "pagination": { ... },
      "logs": [
        {
          "id": 1001,
          "user": { "id": 1, "username": "admin" },
          "action": "USER_LOGIN_FAILURE",
          "details": "用户 'test' 尝试登录失败",
          "ip_address": "192.168.1.100",
          "created_at": "2025-12-20T10:00:00Z"
        }
      ]
    }
    ```

### 5.2. 数据备份与恢复

#### 5.2.1. 创建数据备份

- **功能描述**: 系统管理员触发一次全系统的数据备份。
- **访问权限**: 系统管理员 (sys_admin)。
- **API 端点**: `POST /api/v1/system/backups`

##### 响应

- **成功响应 (202 Accepted)**:
  - **内容**: 表示备份任务已开始。
  - **示例**:
    ```json
    {
      "message": "数据备份任务已启动。",
      "task_id": "backup-20251221103000"
    }
    ```

#### 5.2.2. 软删除恢复 (通用)

- **功能描述**: 恢复一个被软删除的记录。这是一个通用的设计模式，可以应用于所有包含 `is_deleted` 字段的表。
- **访问权限**: 通常为管理员角色。
- **API 端点**: `POST /api/v1/{resource_type}/{id}/restore`

##### 请求

- **URL 参数**:
  - `resource_type`: 资源类型，如 `courses`, `users`, `classes`。
  - `id`: 资源 ID。

- **示例**:
  ```http
  POST /api/v1/courses/105/restore
  ```

##### 响应

- **成功响应 (200 OK)**:
  - **内容**: 提示恢复成功。
  - **示例**:
    ```json
    {
      "message": "资源已成功恢复。"
    }
    ```
