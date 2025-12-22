# 数据库表设计

本文档定义了“成绩管理教学平台”项目所需的所有数据库表结构。

数据库名称：Web-Programming-Course-Project

---

### 1. 核心用户与信息表

#### 1.1. 用户表 (Users)
存储所有角色的通用登录信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `username` | VARCHAR(50) | UNIQUE, NN | 用户名/学号/工号 |
| `password_hash` | VARCHAR(255) | NN | 哈希后的密码 |
| `role` | ENUM | NN | 角色 ('student', 'teacher', 'edu_admin', 'sys_admin') |
| `email` | VARCHAR(100) | UNIQUE, NN | 邮箱，用于找回密码 |
| `status` | ENUM | NN, DF('active') | 账户状态 ('active', 'locked') |
| `created_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 创建时间 |
| `updated_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 最后更新时间 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

#### 1.2. 学生信息表 (StudentProfiles)
存储学生的特有信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `user_id` | INT | FK (Users.id) | 关联到用户表 |
| `student_id_number`| VARCHAR(50) | UNIQUE, NN | 学号 |
| `full_name` | VARCHAR(100) | NN | 学生姓名 |
| `class_id` | INT | FK (Classes.id) | 所属班级ID |

索引建议：
- 索引 `user_id`（外键）。
- 索引 `class_id`（外键）。

#### 1.3. 教师信息表 (TeacherProfiles)
存储教师的特有信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `user_id` | INT | FK (Users.id) | 关联到用户表 |
| `teacher_id_number`| VARCHAR(50) | UNIQUE, NN | 教师工号 |
| `full_name` | VARCHAR(100) | NN | 教师姓名 |
| `title` | VARCHAR(50) | | 职称 (如：教授, 副教授) |

索引建议：
- 索引 `user_id`（外键）。

#### 1.4. 班级表 (Classes)
存储班级信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `class_name` | VARCHAR(100) | UNIQUE, NN | 班级名称 (如: "软件工程2101班") |
| `department` | VARCHAR(100) | | 所属院系 |
| `enrollment_year` | YEAR | | 入学年份 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

---

### 2. 课程与教学相关表

#### 2.1. 课程信息表 (Courses)
存储课程的基础信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `course_code` | VARCHAR(50) | UNIQUE, NN | 课程编号 |
| `course_name` | VARCHAR(100) | NN | 课程名称 |
| `credits` | DECIMAL(3, 1) | NN | 学分 |
| `description` | TEXT | | 课程简介 |
| `department` | VARCHAR(100) | | 开课院系 |
| `prerequisites` | TEXT | | 选课要求 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

#### 2.2. 课程资料表 (CourseMaterials)
存储课程关联的各种资料，如课件、轮播图等。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `course_id` | INT | FK (Courses.id) | 关联到课程表 |
| `material_type` | ENUM | NN | 资料类型 ('document(文档)', 'video(视频)', 'carousel_image(轮播图)', 'config课程资料配置(是否开启评论区/笔记区)') |
| `title` | VARCHAR(255) | | 资料标题 |
| `file_path_or_content`| VARCHAR(255) | | 文件路径或配置内容 (如: '{"allow_comment": true}') |
| `display_order` | INT | DF(0) | 用于排序 (如轮播图顺序) |
| `uploaded_by` | INT | FK (Users.id) | 上传者ID |
| `created_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 创建时间 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

索引建议：
- 索引 `course_id`（外键）。
- 索引 `uploaded_by`（外键）。

#### 2.3. 教师授课表 (TeachingAssignments)
教师与课程的授课关系表 (多对多)。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `teacher_id` | INT | FK (TeacherProfiles.id) | 教师ID |
| `course_id` | INT | FK (Courses.id) | 课程ID |
| `semester` | VARCHAR(50) | NN | 开课学期 (如: "2025-2026-1") |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

索引建议：
- 索引 `teacher_id`（外键）。
- 索引 `course_id`（外键）。
- 组合索引 (`teacher_id`, `course_id`, `semester`) 以优化按教师/课程/学期的查询。

#### 2.4. 课程评论表 (CourseComments)
存储课程下的评论与回复。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `course_id` | INT | FK (Courses.id) | 关联课程 |
| `user_id` | INT | FK (Users.id) | 评论作者 |
| `content` | TEXT | NN | 评论内容 |
| `parent_id` | INT | FK (CourseComments.id) | 父评论ID（支持回复/楼中楼）|
| `created_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 评论时间 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

索引建议：
- 索引 `course_id`（外键）。
- 索引 `user_id`（外键）。
- 索引 `parent_id`（外键）。
---

### 3. 学生学习与成绩相关表

#### 3.1. 学生选课表 (Enrollments)
学生与课程的选课关系表 (多对多)。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `student_id` | INT | FK (StudentProfiles.id) | 学生ID |
| `course_id` | INT | FK (Courses.id) | 课程ID |
| `semester` | VARCHAR(50) | NN | 选课学期 |
| `enrollment_date` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 选课时间 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

索引建议：
- 索引 `student_id`（外键）。
- 索引 `course_id`（外键）。
- 组合索引 (`student_id`, `course_id`, `semester`) 以优化按学生/课程/学期的查询。

#### 3.2. 成绩组成项表 (GradeItems)
教师定义的课程成绩构成。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `course_id` | INT | FK (Courses.id) | 关联到课程表 |
| `item_name` | VARCHAR(100) | NN | 成绩项名称 (如: "作业1", "期末考试") |
| `weight` | DECIMAL(5, 2) | NN | 该项成绩占总成绩的权重 (0.00-1.00) |
| `description` | TEXT | | 描述 |
| `assignment_id` | INT | FK (Assignments.id) | 关联到作业/考试表（可选，若为作业/考试项时填写） |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

索引建议：
- 索引 `course_id`（外键）。
- 索引 `assignment_id`（外键，可选）。

#### 3.3. 成绩表 (Grades)
记录学生每门课程下每个成绩项的具体得分。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `enrollment_id` | INT | FK (Enrollments.id) | 关联到学生的选课记录 |
| `grade_item_id` | INT | FK (GradeItems.id) | 关联到成绩组成项 |
| `score` | DECIMAL(5, 2) | | 得分 |
| `status` | ENUM | NN, DF('pending') | 成绩状态 ('pending(待批改)', 'graded(已批改)', 'published(已发布.经教学管理端审核后才可发布)') |
| `graded_at` | TIMESTAMP | | 批改时间 |
| `grader_id` | INT | FK (Users.id) | 批改教师ID |
| `is_deleted` | BOOLEAN | NN, DF(0) | 是否被删除（软删除标记） |

索引建议：
- 索引 `enrollment_id`（外键）。
- 索引 `grade_item_id`（外键）。
- 索引 `grader_id`（外键）。
- 组合索引 (`enrollment_id`, `grade_item_id`) 以优化按选课记录与成绩项的查询。

#### 3.4. 学习进度表 (TaskProgress)
记录学生的学习任务完成情况。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `enrollment_id` | INT | FK (Enrollments.id) | 关联到学生的选课记录 |
| `material_id` | INT | FK (CourseMaterials.id) | 关联到课程资料/任务 |
| `status` | ENUM | NN, DF('todo') | 完成状态 ('todo', 'done') |
| `last_access_time`| TIMESTAMP | | 最近访问时间 |

索引建议：
- 索引 `enrollment_id`（外键）。
- 索引 `material_id`（外键）。
- 组合索引 (`enrollment_id`, `material_id`) 以优化按学生课程与任务的查询。

---

存储每门课程布置的作业和考试信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `course_id` | INT | FK (Courses.id) | 关联课程 |
| `title` | VARCHAR(100) | NN | 作业/考试标题 |
| `description` | TEXT | | 说明 |
| `file_path` | VARCHAR(255) | | 附件/文件路径 |
| `deadline` | DATETIME | | 截止时间 |
| `type` | ENUM | NN | 类型('assignment','exam') |
| `created_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 创建时间 |
| `is_deleted` | BOOLEAN | NN, DF(0) | 软删除标记 |

索引建议：
- 索引 `course_id`（外键）。
- 索引 `type`。

---

#### 3.6. 作业/考试提交表 (AssignmentSubmissions)
存储学生针对作业/考试的提交内容。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `assignment_id` | INT | FK (Assignments.id) | 关联作业/考试 |
| `student_id` | INT | FK (StudentProfiles.id) | 提交学生 |
| `file_path` | VARCHAR(255) | | 提交文件路径 |
| `submitted_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 提交时间 |
| `score` | DECIMAL(5,2) | | 得分 |
| `feedback` | TEXT | | 教师评语 |
| `graded_at` | TIMESTAMP | | 批改时间 |
| `grader_id` | INT | FK (Users.id) | 批改教师ID |
| `is_deleted` | BOOLEAN | NN, DF(0) | 软删除标记 |

索引建议：
- 索引 `assignment_id`（外键）。
- 索引 `student_id`（外键）。
- 组合索引 (`assignment_id`, `student_id`) 以优化查重和查询。

---

### 4. 排课与教室管理表

#### 4.1. 教室表 (Classrooms)
存储所有教室信息。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `name` | VARCHAR(100) | UNIQUE, NN | 教室名称 |
| `location` | VARCHAR(255) | | 位置 |
| `capacity` | INT | | 容纳人数 |

索引建议：
- 索引 `name`（唯一）。

#### 4.2. 课程排课表 (CourseSchedules)
每条记录对应一次具体的上课安排。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `teaching_id` | INT | FK (TeachingAssignments.id) | 关联授课关系 |
| `classroom_id` | INT | FK (Classrooms.id) | 上课教室 |
| `day_of_week` | ENUM | NN | 星期几（如'Mon','Tue',...,'Sun') |
| `start_time` | TIME | NN | 上课开始时间 |
| `end_time` | TIME | NN | 上课结束时间 |

索引建议：
- 索引 `teaching_id`（外键）。
- 索引 `classroom_id`（外键）。
- 组合索引 (`classroom_id`, `day_of_week`, `start_time`, `end_time`) 以便冲突检测。

---

### 5. 系统管理表

#### 5.1. 日志表 (Logs)
记录系统关键操作日志。

| 属性名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AI | 唯一标识符 |
| `user_id` | INT | FK (Users.id) | 操作者ID |
| `action` | VARCHAR(255) | NN | 操作类型 (如: "USER_LOGIN(包括登录成功,登录失败(然后被锁定多少多少秒))", "UPDATE_GRADE(包括所有与数据库相关的增删改查操作)") |
| `details` | TEXT | | 操作详情 |
| `ip_address` | VARCHAR(50) | | 操作者IP地址 |
| `created_at` | TIMESTAMP | DF(CURRENT_TIMESTAMP) | 操作时间 |

索引建议：
- 索引 `user_id`（外键）。
- 如需要统计来源，索引 `ip_address`。
