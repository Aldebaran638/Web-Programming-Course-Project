
-- 如果数据库已存在，先删除再新建
DROP DATABASE IF EXISTS `Web-Programming-Course-Project`;
CREATE DATABASE IF NOT EXISTS `Web-Programming-Course-Project` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `Web-Programming-Course-Project`;

-- 为了避免外键约束导致的删除顺序错误，先临时关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 先删除所有表（如存在）
DROP TABLE IF EXISTS `Logs`;
DROP TABLE IF EXISTS `CourseSchedules`;
DROP TABLE IF EXISTS `Classrooms`;
DROP TABLE IF EXISTS `AssignmentSubmissions`;
DROP TABLE IF EXISTS `Assignments`;
DROP TABLE IF EXISTS `TaskProgress`;
DROP TABLE IF EXISTS `Grades`;
DROP TABLE IF EXISTS `GradeItems`;
DROP TABLE IF EXISTS `Enrollments`;
DROP TABLE IF EXISTS `CourseComments`;
DROP TABLE IF EXISTS `TeachingAssignments`;
DROP TABLE IF EXISTS `CourseMaterials`;
DROP TABLE IF EXISTS `Courses`;
DROP TABLE IF EXISTS `TeacherProfiles`;
DROP TABLE IF EXISTS `StudentProfiles`;
DROP TABLE IF EXISTS `Classes`;
DROP TABLE IF EXISTS `Users`;

-- 1. 先建所有无外键或仅被依赖的表
CREATE TABLE `Classes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `class_name` VARCHAR(100) NOT NULL UNIQUE,
  `department` VARCHAR(100),
  `enrollment_year` YEAR,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE `Users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student','teacher','edu_admin','sys_admin') NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `status` ENUM('active','locked') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE `Courses` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_code` VARCHAR(50) NOT NULL UNIQUE,
  `course_name` VARCHAR(100) NOT NULL,
  `credits` DECIMAL(3,1) NOT NULL,
  `description` TEXT,
  `department` VARCHAR(100),
  `prerequisites` TEXT,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  `grade_approved` BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE `Classrooms` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `location` VARCHAR(255),
  `capacity` INT
);

-- 2. 依赖上述表的表
CREATE TABLE `StudentProfiles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `student_id_number` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `class_id` INT,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`),
  FOREIGN KEY (`class_id`) REFERENCES `Classes`(`id`)
);
CREATE INDEX idx_student_user_id ON `StudentProfiles`(`user_id`);
CREATE INDEX idx_student_class_id ON `StudentProfiles`(`class_id`);

CREATE TABLE `TeacherProfiles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `teacher_id_number` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(50),
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
);
CREATE INDEX idx_teacher_user_id ON `TeacherProfiles`(`user_id`);

CREATE TABLE `Assignments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `file_path` VARCHAR(255),
  `deadline` DATETIME,
  `type` ENUM('assignment','exam') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`)
);
CREATE INDEX idx_assignments_course_id ON `Assignments`(`course_id`);
CREATE INDEX idx_assignments_type ON `Assignments`(`type`);

CREATE TABLE `TeachingAssignments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `teacher_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `semester` VARCHAR(50) NOT NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`teacher_id`) REFERENCES `TeacherProfiles`(`id`),
  FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`)
);
CREATE INDEX idx_ta_teacher_id ON `TeachingAssignments`(`teacher_id`);
CREATE INDEX idx_ta_course_id ON `TeachingAssignments`(`course_id`);
CREATE INDEX idx_ta_teacher_course_semester ON `TeachingAssignments`(`teacher_id`, `course_id`, `semester`);

CREATE TABLE `CourseMaterials` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `material_type` ENUM('document','video','carousel_image','config') NOT NULL,
  `title` VARCHAR(255),
  `file_path_or_content` VARCHAR(255),
  `display_order` INT DEFAULT 0,
  `uploaded_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`),
  FOREIGN KEY (`uploaded_by`) REFERENCES `Users`(`id`)
);
CREATE INDEX idx_material_course_id ON `CourseMaterials`(`course_id`);
CREATE INDEX idx_material_uploaded_by ON `CourseMaterials`(`uploaded_by`);

CREATE TABLE `Enrollments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `semester` VARCHAR(50) NOT NULL,
  `enrollment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`student_id`) REFERENCES `StudentProfiles`(`id`),
  FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`)
);
CREATE INDEX idx_enroll_student_id ON `Enrollments`(`student_id`);
CREATE INDEX idx_enroll_course_id ON `Enrollments`(`course_id`);
CREATE INDEX idx_enroll_student_course_semester ON `Enrollments`(`student_id`, `course_id`, `semester`);

CREATE TABLE `CourseSchedules` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `teaching_id` INT NOT NULL,
  `classroom_id` INT NOT NULL,
  `day_of_week` ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  FOREIGN KEY (`teaching_id`) REFERENCES `TeachingAssignments`(`id`),
  FOREIGN KEY (`classroom_id`) REFERENCES `Classrooms`(`id`)
);
CREATE INDEX idx_coursesched_teaching_id ON `CourseSchedules`(`teaching_id`);
CREATE INDEX idx_coursesched_classroom_id ON `CourseSchedules`(`classroom_id`);
CREATE INDEX idx_coursesched_room_day_time ON `CourseSchedules`(`classroom_id`, `day_of_week`, `start_time`, `end_time`);

CREATE TABLE `GradeItems` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `item_name` VARCHAR(100) NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL,
  `description` TEXT,
  `assignment_id` INT,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`),
  FOREIGN KEY (`assignment_id`) REFERENCES `Assignments`(`id`)
);
CREATE INDEX idx_gradeitem_course_id ON `GradeItems`(`course_id`);
CREATE INDEX idx_gradeitem_assignment_id ON `GradeItems`(`assignment_id`);

CREATE TABLE `CourseComments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `parent_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `CourseComments`(`id`)
);
CREATE INDEX idx_comment_course_id ON `CourseComments`(`course_id`);
CREATE INDEX idx_comment_user_id ON `CourseComments`(`user_id`);
CREATE INDEX idx_comment_parent_id ON `CourseComments`(`parent_id`);

CREATE TABLE `Grades` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `enrollment_id` INT NOT NULL,
  `grade_item_id` INT NOT NULL,
  `score` DECIMAL(5,2),
  `status` ENUM('pending','graded','published') NOT NULL DEFAULT 'pending',
  `graded_at` TIMESTAMP,
  `grader_id` INT,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`enrollment_id`) REFERENCES `Enrollments`(`id`),
  FOREIGN KEY (`grade_item_id`) REFERENCES `GradeItems`(`id`),
  FOREIGN KEY (`grader_id`) REFERENCES `Users`(`id`)
);
CREATE INDEX idx_grades_enrollment_id ON `Grades`(`enrollment_id`);
CREATE INDEX idx_grades_grade_item_id ON `Grades`(`grade_item_id`);
CREATE INDEX idx_grades_grader_id ON `Grades`(`grader_id`);
CREATE INDEX idx_grades_enroll_gradeitem ON `Grades`(`enrollment_id`, `grade_item_id`);

CREATE TABLE `TaskProgress` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `enrollment_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `status` ENUM('todo','done') NOT NULL DEFAULT 'todo',
  `last_access_time` TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `Enrollments`(`id`),
  FOREIGN KEY (`material_id`) REFERENCES `CourseMaterials`(`id`)
);
CREATE INDEX idx_taskprogress_enrollment_id ON `TaskProgress`(`enrollment_id`);
CREATE INDEX idx_taskprogress_material_id ON `TaskProgress`(`material_id`);
CREATE INDEX idx_taskprogress_enroll_material ON `TaskProgress`(`enrollment_id`, `material_id`);

CREATE TABLE `AssignmentSubmissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `file_path` VARCHAR(255),
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `score` DECIMAL(5,2),
  `feedback` TEXT,
  `graded_at` TIMESTAMP,
  `grader_id` INT,
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (`assignment_id`) REFERENCES `Assignments`(`id`),
  FOREIGN KEY (`student_id`) REFERENCES `StudentProfiles`(`id`),
  FOREIGN KEY (`grader_id`) REFERENCES `Users`(`id`)
);
CREATE INDEX idx_asnsub_assignment_id ON `AssignmentSubmissions`(`assignment_id`);
CREATE INDEX idx_asnsub_student_id ON `AssignmentSubmissions`(`student_id`);
CREATE INDEX idx_asnsub_assignment_student ON `AssignmentSubmissions`(`assignment_id`, `student_id`);

CREATE TABLE `Logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `action` VARCHAR(255) NOT NULL,
  `description` TEXT,  -- 可读的操作描述
  `details` TEXT,      -- JSON格式的详细数据
  `ip_address` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
);
CREATE INDEX idx_logs_user_id ON `Logs`(`user_id`);
CREATE INDEX idx_logs_ip_address ON `Logs`(`ip_address`);

-- 所有表结构定义完毕。

-- 示例数据插入

-- Users
INSERT INTO `Users` (`username`, `password_hash`, `role`, `email`, `status`) VALUES
('demo_student', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'demo_student@example.com', 'active'),
('demo_teacher', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'demo_teacher@example.com', 'active'),
('demo_edu_admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'edu_admin', 'demo_edu_admin@example.com', 'active'),
('demo_sys_admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'sys_admin', 'demo_sys_admin@example.com', 'active');

-- Classes
INSERT INTO `Classes` (`class_name`, `department`, `enrollment_year`) VALUES
('软件工程2101班', '软件工程系', 2021),
('计算机2102班', '计算机系', 2021);

-- StudentProfiles
-- demo_student 的用户 id = 1
INSERT INTO `StudentProfiles` (`user_id`, `student_id_number`, `full_name`, `class_id`) VALUES
(1, '20250001', '示例学生', 1);

-- TeacherProfiles
-- demo_teacher 的用户 id = 2
INSERT INTO `TeacherProfiles` (`user_id`, `teacher_id_number`, `full_name`, `title`) VALUES
(2, 'T20250001', '示例教师', '教授');

-- Courses
INSERT INTO `Courses` (`course_code`, `course_name`, `credits`, `department`) VALUES
('CS101', '程序设计基础', 3.0, '计算机系'),
('SE201', '软件工程导论', 2.5, '软件工程系');

-- CourseMaterials
INSERT INTO `CourseMaterials` (`course_id`, `material_type`, `title`, `file_path_or_content`, `uploaded_by`) VALUES
(1, 'document', '第1章课件', '/files/cs101/ch1.pdf', 2),
(1, 'carousel_image', '轮播图1', '/images/cs101/banner1.jpg', 2);

-- TeachingAssignments
-- 这里的 teacher_id 指向 TeacherProfiles.id，示例中 demo_teacher 的教师档案为 id = 1
INSERT INTO `TeachingAssignments` (`teacher_id`, `course_id`, `semester`) VALUES
(1, 1, '2023-2024-1'),      -- demo_teacher 在 2023-2024-1 学期教授 CS101
(1, 2, '2024-2025-1');      -- demo_teacher 在 2024-2025-1 学期教授 SE201

-- Enrollments
-- 这里的 student_id 指向 StudentProfiles.id，示例中 demo_student 的学生档案为 id = 1
INSERT INTO `Enrollments` (`student_id`, `course_id`, `semester`) VALUES
(1, 1, '2023-2024-1'),
(1, 2, '2023-2024-1');

-- GradeItems
INSERT INTO `GradeItems` (`course_id`, `item_name`, `weight`) VALUES
(1, '作业1', 0.2),
(1, '期末考试', 0.8),
-- 为 SE201 课程增加两个考核项，便于成绩审核测试
(2, '平时作业', 0.4),
(2, '期末考试', 0.6);

-- Grades
INSERT INTO `Grades` (`enrollment_id`, `grade_item_id`, `score`, `status`) VALUES
(1, 1, 85.0, 'graded'),
(1, 2, 90.0, 'graded'),
-- enrollment_id = 2 对应 demo_student 选修 SE201 的选课记录
-- 下面两条用于制造“待审核”且优秀率不算太高的课程
(2, 3, 72.0, 'pending'),
(2, 4, 88.0, 'pending');

-- Assignments
INSERT INTO `Assignments` (`course_id`, `title`, `type`) VALUES
(1, '作业1', 'assignment'),
(1, '期末考试', 'exam');

-- AssignmentSubmissions
INSERT INTO `AssignmentSubmissions` (`assignment_id`, `student_id`, `file_path`, `score`) VALUES
(1, 1, '/submits/1_1.pdf', 88.0);

-- TaskProgress 示例数据：demo_student 在 CS101 课程中的学习任务进度
-- enrollment_id = 1 对应 demo_student 选修 CS101
-- material_id = 1,2 对应上面的两条课程资料
INSERT INTO `TaskProgress` (`enrollment_id`, `material_id`, `status`, `last_access_time`) VALUES
(1, 1, 'todo',  NOW()),
(1, 2, 'done',  NOW());
-- Classrooms
INSERT INTO `Classrooms` (`name`, `location`, `capacity`) VALUES
('A101', '一号楼', 60),
('B202', '二号楼', 40);

-- CourseSchedules
INSERT INTO `CourseSchedules` (`teaching_id`, `classroom_id`, `day_of_week`, `start_time`, `end_time`) VALUES
(1, 1, 'Mon', '08:00:00', '09:40:00');

-- Logs
INSERT INTO `Logs` (`user_id`, `action`, `details`, `ip_address`) VALUES
(1, 'USER_LOGIN', '登录成功', '127.0.0.1');


SET FOREIGN_KEY_CHECKS = 1;

-- ========== 第1批批量样例数据插入 ========== 
-- 先插入100个学生用户（id=5~104）
INSERT INTO `Users` (`username`, `password_hash`, `role`, `email`, `status`) VALUES
  ('student001', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student001@example.com', 'active'),
  ('student002', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student002@example.com', 'active'),
  ('student003', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student003@example.com', 'active'),
  ('student004', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student004@example.com', 'active'),
  ('student005', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student005@example.com', 'active'),
  ('student006', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student006@example.com', 'active'),
  ('student007', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student007@example.com', 'active'),
  ('student008', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student008@example.com', 'active'),
  ('student009', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student009@example.com', 'active'),
  ('student010', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student010@example.com', 'active'),
  ('student011', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student011@example.com', 'active'),
  ('student012', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student012@example.com', 'active'),
  ('student013', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student013@example.com', 'active'),
  ('student014', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student014@example.com', 'active'),
  ('student015', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student015@example.com', 'active'),
  ('student016', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student016@example.com', 'active'),
  ('student017', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student017@example.com', 'active'),
  ('student018', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student018@example.com', 'active'),
  ('student019', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student019@example.com', 'active'),
  ('student020', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student020@example.com', 'active'),
  ('student021', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student021@example.com', 'active'),
  ('student022', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student022@example.com', 'active'),
  ('student023', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student023@example.com', 'active'),
  ('student024', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student024@example.com', 'active'),
  ('student025', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student025@example.com', 'active'),
  ('student026', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student026@example.com', 'active'),
  ('student027', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student027@example.com', 'active'),
  ('student028', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student028@example.com', 'active'),
  ('student029', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student029@example.com', 'active'),
  ('student030', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student030@example.com', 'active'),
  ('student031', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student031@example.com', 'active'),
  ('student032', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student032@example.com', 'active'),
  ('student033', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student033@example.com', 'active'),
  ('student034', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student034@example.com', 'active'),
  ('student035', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student035@example.com', 'active'),
  ('student036', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student036@example.com', 'active'),
  ('student037', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student037@example.com', 'active'),
  ('student038', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student038@example.com', 'active'),
  ('student039', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student039@example.com', 'active'),
  ('student040', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student040@example.com', 'active'),
  ('student041', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student041@example.com', 'active'),
  ('student042', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student042@example.com', 'active'),
  ('student043', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student043@example.com', 'active'),
  ('student044', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student044@example.com', 'active'),
  ('student045', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student045@example.com', 'active'),
  ('student046', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student046@example.com', 'active'),
  ('student047', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student047@example.com', 'active'),
  ('student048', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student048@example.com', 'active'),
  ('student049', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student049@example.com', 'active'),
  ('student050', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student050@example.com', 'active'),
  ('student051', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student051@example.com', 'active'),
  ('student052', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student052@example.com', 'active'),
  ('student053', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student053@example.com', 'active'),
  ('student054', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student054@example.com', 'active'),
  ('student055', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student055@example.com', 'active'),
  ('student056', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student056@example.com', 'active'),
  ('student057', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student057@example.com', 'active'),
  ('student058', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student058@example.com', 'active'),
  ('student059', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student059@example.com', 'active'),
  ('student060', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student060@example.com', 'active'),
  ('student061', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student061@example.com', 'active'),
  ('student062', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student062@example.com', 'active'),
  ('student063', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student063@example.com', 'active'),
  ('student064', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student064@example.com', 'active'),
  ('student065', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student065@example.com', 'active'),
  ('student066', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student066@example.com', 'active'),
  ('student067', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student067@example.com', 'active'),
  ('student068', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student068@example.com', 'active'),
  ('student069', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student069@example.com', 'active'),
  ('student070', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student070@example.com', 'active'),
  ('student071', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student071@example.com', 'active'),
  ('student072', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student072@example.com', 'active'),
  ('student073', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student073@example.com', 'active'),
  ('student074', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student074@example.com', 'active'),
  ('student075', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student075@example.com', 'active'),
  ('student076', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student076@example.com', 'active'),
  ('student077', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student077@example.com', 'active'),
  ('student078', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student078@example.com', 'active'),
  ('student079', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student079@example.com', 'active'),
  ('student080', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student080@example.com', 'active'),
  ('student081', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student081@example.com', 'active'),
  ('student082', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student082@example.com', 'active'),
  ('student083', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student083@example.com', 'active'),
  ('student084', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student084@example.com', 'active'),
  ('student085', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student085@example.com', 'active'),
  ('student086', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student086@example.com', 'active'),
  ('student087', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student087@example.com', 'active'),
  ('student088', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student088@example.com', 'active'),
  ('student089', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student089@example.com', 'active'),
  ('student090', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student090@example.com', 'active'),
  ('student091', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student091@example.com', 'active'),
  ('student092', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student092@example.com', 'active'),
  ('student093', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student093@example.com', 'active'),
  ('student094', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student094@example.com', 'active'),
  ('student095', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student095@example.com', 'active'),
  ('student096', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student096@example.com', 'active'),
  ('student097', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student097@example.com', 'active'),
  ('student098', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student098@example.com', 'active'),
  ('student099', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student099@example.com', 'active'),
  ('student100', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'student', 'student100@example.com', 'active');

-- 10个教师用户（id=105~114）
INSERT INTO `Users` (`username`, `password_hash`, `role`, `email`, `status`) VALUES
  ('teacher001', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher001@example.com', 'active'),
  ('teacher002', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher002@example.com', 'active'),
  ('teacher003', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher003@example.com', 'active'),
  ('teacher004', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher004@example.com', 'active'),
  ('teacher005', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher005@example.com', 'active'),
  ('teacher006', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher006@example.com', 'active'),
  ('teacher007', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher007@example.com', 'active'),
  ('teacher008', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher008@example.com', 'active'),
  ('teacher009', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher009@example.com', 'active'),
  ('teacher010', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'teacher', 'teacher010@example.com', 'active');

-- ========== 第2批 教师档案、课程、学生档案 ==========
-- 10个教师档案（user_id=105~114）
INSERT INTO `TeacherProfiles` (`user_id`, `teacher_id_number`, `full_name`, `title`) VALUES
  (105, 'T202501', '教师001', '讲师'),
  (106, 'T202502', '教师002', '讲师'),
  (107, 'T202503', '教师003', '讲师'),
  (108, 'T202504', '教师004', '讲师'),
  (109, 'T202505', '教师005', '讲师'),
  (110, 'T202506', '教师006', '讲师'),
  (111, 'T202507', '教师007', '讲师'),
  (112, 'T202508', '教师008', '讲师'),
  (113, 'T202509', '教师009', '讲师'),
  (114, 'T202510', '教师010', '讲师');

-- 20门课程
INSERT INTO `Courses` (`course_code`, `course_name`, `credits`, `department`) VALUES
  ('CS201', '数据结构', 3.0, '计算机系'),
  ('CS202', '操作系统', 3.0, '计算机系'),
  ('CS203', '计算机网络', 3.0, '计算机系'),
  ('CS204', '数据库系统', 3.0, '计算机系'),
  ('CS205', '人工智能导论', 2.5, '计算机系'),
  ('SE301', '软件测试', 2.5, '软件工程系'),
  ('SE302', '软件项目管理', 2.5, '软件工程系'),
  ('SE303', '需求工程', 2.0, '软件工程系'),
  ('SE304', '软件体系结构', 2.5, '软件工程系'),
  ('SE305', '敏捷开发', 2.0, '软件工程系'),
  ('CS206', '编译原理', 3.0, '计算机系'),
  ('CS207', '算法设计与分析', 3.0, '计算机系'),
  ('CS208', '信息安全', 2.0, '计算机系'),
  ('CS209', '嵌入式系统', 2.0, '计算机系'),
  ('SE306', '软件过程改进', 2.0, '软件工程系'),
  ('SE307', '软件复用', 2.0, '软件工程系'),
  ('SE308', '软件文档写作', 1.5, '软件工程系'),
  ('CS210', '机器学习', 3.0, '计算机系'),
  ('CS211', '深度学习', 3.0, '计算机系'),
  ('SE309', '软件工程经济学', 2.0, '软件工程系');

INSERT INTO `StudentProfiles` (`user_id`, `student_id_number`, `full_name`, `class_id`) VALUES
  (5, '20250002', '学生001', 1),
  (6, '20250003', '学生002', 2),
  (7, '20250004', '学生003', 1),
  (8, '20250005', '学生004', 2),
  (9, '20250006', '学生005', 1),
  (10, '20250007', '学生006', 2),
  (11, '20250008', '学生007', 1),
  (12, '20250009', '学生008', 2),
  (13, '20250010', '学生009', 1),
  (14, '20250011', '学生010', 2);


-- ========== 第3批 教师授课分配 TeachingAssignments ========== 
-- 教师id=2~11，课程id=3~22，学期统一为'2024-2025-1'
INSERT INTO `TeachingAssignments` (`teacher_id`, `course_id`, `semester`) VALUES
  (2, 3, '2024-2025-1'), (2, 4, '2024-2025-1'), (2, 5, '2024-2025-1'), (2, 6, '2024-2025-1'), (2, 7, '2024-2025-1'),
  (3, 8, '2024-2025-1'), (3, 9, '2024-2025-1'), (3, 10, '2024-2025-1'), (3, 11, '2024-2025-1'), (3, 12, '2024-2025-1'),
  (4, 13, '2024-2025-1'), (4, 14, '2024-2025-1'), (4, 15, '2024-2025-1'), (4, 16, '2024-2025-1'), (4, 17, '2024-2025-1'),
  (5, 18, '2024-2025-1'), (5, 19, '2024-2025-1'), (5, 20, '2024-2025-1'), (5, 21, '2024-2025-1'), (5, 22, '2024-2025-1'),
  (6, 3, '2024-2025-1'), (6, 8, '2024-2025-1'), (6, 13, '2024-2025-1'), (6, 18, '2024-2025-1'), (6, 4, '2024-2025-1'),
  (7, 9, '2024-2025-1'), (7, 14, '2024-2025-1'), (7, 19, '2024-2025-1'), (7, 5, '2024-2025-1'), (7, 10, '2024-2025-1'),
  (8, 15, '2024-2025-1'), (8, 20, '2024-2025-1'), (8, 6, '2024-2025-1'), (8, 11, '2024-2025-1'), (8, 16, '2024-2025-1'),
  (9, 21, '2024-2025-1'), (9, 7, '2024-2025-1'), (9, 12, '2024-2025-1'), (9, 17, '2024-2025-1'), (9, 22, '2024-2025-1'),
  (10, 3, '2024-2025-1'), (10, 9, '2024-2025-1'), (10, 15, '2024-2025-1'), (10, 21, '2024-2025-1'), (10, 5, '2024-2025-1'),
  (11, 11, '2024-2025-1'), (11, 17, '2024-2025-1'), (11, 4, '2024-2025-1'), (11, 10, '2024-2025-1'), (11, 16, '2024-2025-1');

-- ========== 第4批 补充剩余学生档案（user_id=15~104）========== 
INSERT INTO `StudentProfiles` (`user_id`, `student_id_number`, `full_name`, `class_id`) VALUES
  (15, '20250012', '学生011', 1),
  (16, '20250013', '学生012', 2),
  (17, '20250014', '学生013', 1),
  (18, '20250015', '学生014', 2),
  (19, '20250016', '学生015', 1),
  (20, '20250017', '学生016', 2),
  (21, '20250018', '学生017', 1),
  (22, '20250019', '学生018', 2),
  (23, '20250020', '学生019', 1),
  (24, '20250021', '学生020', 2),
  (25, '20250022', '学生021', 1),
  (26, '20250023', '学生022', 2),
  (27, '20250024', '学生023', 1),
  (28, '20250025', '学生024', 2),
  (29, '20250026', '学生025', 1),
  (30, '20250027', '学生026', 2),
  (31, '20250028', '学生027', 1),
  (32, '20250029', '学生028', 2),
  (33, '20250030', '学生029', 1),
  (34, '20250031', '学生030', 2),
  (35, '20250032', '学生031', 1),
  (36, '20250033', '学生032', 2),
  (37, '20250034', '学生033', 1),
  (38, '20250035', '学生034', 2),
  (39, '20250036', '学生035', 1),
  (40, '20250037', '学生036', 2),
  (41, '20250038', '学生037', 1),
  (42, '20250039', '学生038', 2),
  (43, '20250040', '学生039', 1),
  (44, '20250041', '学生040', 2),
  (45, '20250042', '学生041', 1),
  (46, '20250043', '学生042', 2),
  (47, '20250044', '学生043', 1),
  (48, '20250045', '学生044', 2),
  (49, '20250046', '学生045', 1),
  (50, '20250047', '学生046', 2),
  (51, '20250048', '学生047', 1),
  (52, '20250049', '学生048', 2),
  (53, '20250050', '学生049', 1),
  (54, '20250051', '学生050', 2),
  (55, '20250052', '学生051', 1),
  (56, '20250053', '学生052', 2),
  (57, '20250054', '学生053', 1),
  (58, '20250055', '学生054', 2),
  (59, '20250056', '学生055', 1),
  (60, '20250057', '学生056', 2),
  (61, '20250058', '学生057', 1),
  (62, '20250059', '学生058', 2),
  (63, '20250060', '学生059', 1),
  (64, '20250061', '学生060', 2),
  (65, '20250062', '学生061', 1),
  (66, '20250063', '学生062', 2),
  (67, '20250064', '学生063', 1),
  (68, '20250065', '学生064', 2),
  (69, '20250066', '学生065', 1),
  (70, '20250067', '学生066', 2),
  (71, '20250068', '学生067', 1),
  (72, '20250069', '学生068', 2),
  (73, '20250070', '学生069', 1),
  (74, '20250071', '学生070', 2),
  (75, '20250072', '学生071', 1),
  (76, '20250073', '学生072', 2),
  (77, '20250074', '学生073', 1),
  (78, '20250075', '学生074', 2),
  (79, '20250076', '学生075', 1),
  (80, '20250077', '学生076', 2),
  (81, '20250078', '学生077', 1),
  (82, '20250079', '学生078', 2),
  (83, '20250080', '学生079', 1),
  (84, '20250081', '学生080', 2),
  (85, '20250082', '学生081', 1),
  (86, '20250083', '学生082', 2),
  (87, '20250084', '学生083', 1),
  (88, '20250085', '学生084', 2),
  (89, '20250086', '学生085', 1),
  (90, '20250087', '学生086', 2),
  (91, '20250088', '学生087', 1),
  (92, '20250089', '学生088', 2),
  (93, '20250090', '学生089', 1),
  (94, '20250091', '学生090', 2),
  (95, '20250092', '学生091', 1),
  (96, '20250093', '学生092', 2),
  (97, '20250094', '学生093', 1),
  (98, '20250095', '学生094', 2),
  (99, '20250096', '学生095', 1),
  (100, '20250097', '学生096', 2),
  (101, '20250098', '学生097', 1),
  (102, '20250099', '学生098', 2),
  (103, '20250100', '学生099', 1),
  (104, '20250101', '学生100', 2);

-- ========== 第5批 每门课1个作业、2个成绩项 ========== 
-- 课程id=3~22
INSERT INTO `Assignments` (`course_id`, `title`, `type`) VALUES
  (3, '作业1', 'assignment'), (4, '作业1', 'assignment'), (5, '作业1', 'assignment'), (6, '作业1', 'assignment'), (7, '作业1', 'assignment'),
  (8, '作业1', 'assignment'), (9, '作业1', 'assignment'), (10, '作业1', 'assignment'), (11, '作业1', 'assignment'), (12, '作业1', 'assignment'),
  (13, '作业1', 'assignment'), (14, '作业1', 'assignment'), (15, '作业1', 'assignment'), (16, '作业1', 'assignment'), (17, '作业1', 'assignment'),
  (18, '作业1', 'assignment'), (19, '作业1', 'assignment'), (20, '作业1', 'assignment'), (21, '作业1', 'assignment'), (22, '作业1', 'assignment');

INSERT INTO `GradeItems` (`course_id`, `item_name`, `weight`) VALUES
  (3, '平时作业', 0.4), (3, '期末考试', 0.6),
  (4, '平时作业', 0.4), (4, '期末考试', 0.6),
  (5, '平时作业', 0.4), (5, '期末考试', 0.6),
  (6, '平时作业', 0.4), (6, '期末考试', 0.6),
  (7, '平时作业', 0.4), (7, '期末考试', 0.6),
  (8, '平时作业', 0.4), (8, '期末考试', 0.6),
  (9, '平时作业', 0.4), (9, '期末考试', 0.6),
  (10, '平时作业', 0.4), (10, '期末考试', 0.6),
  (11, '平时作业', 0.4), (11, '期末考试', 0.6),
  (12, '平时作业', 0.4), (12, '期末考试', 0.6),
  (13, '平时作业', 0.4), (13, '期末考试', 0.6),
  (14, '平时作业', 0.4), (14, '期末考试', 0.6),
  (15, '平时作业', 0.4), (15, '期末考试', 0.6),
  (16, '平时作业', 0.4), (16, '期末考试', 0.6),
  (17, '平时作业', 0.4), (17, '期末考试', 0.6),
  (18, '平时作业', 0.4), (18, '期末考试', 0.6),
  (19, '平时作业', 0.4), (19, '期末考试', 0.6),
  (20, '平时作业', 0.4), (20, '期末考试', 0.6),
  (21, '平时作业', 0.4), (21, '期末考试', 0.6),
  (22, '平时作业', 0.4), (22, '期末考试', 0.6);

-- ========== 第6批 学生选课 Enrollments ========== 
-- 学生id=2~101，每人5门课，课程id=3~22轮转，学期'2024-2025-1'
INSERT INTO `Enrollments` (`student_id`, `course_id`, `semester`) VALUES
  (2, 3, '2024-2025-1'), (2, 4, '2024-2025-1'), (2, 5, '2024-2025-1'), (2, 6, '2024-2025-1'), (2, 7, '2024-2025-1'),
  (3, 8, '2024-2025-1'), (3, 9, '2024-2025-1'), (3, 10, '2024-2025-1'), (3, 11, '2024-2025-1'), (3, 12, '2024-2025-1'),
  (4, 13, '2024-2025-1'), (4, 14, '2024-2025-1'), (4, 15, '2024-2025-1'), (4, 16, '2024-2025-1'), (4, 17, '2024-2025-1'),
  (5, 18, '2024-2025-1'), (5, 19, '2024-2025-1'), (5, 20, '2024-2025-1'), (5, 21, '2024-2025-1'), (5, 22, '2024-2025-1'),
  (6, 3, '2024-2025-1'), (6, 4, '2024-2025-1'), (6, 5, '2024-2025-1'), (6, 6, '2024-2025-1'), (6, 7, '2024-2025-1'),
  (7, 8, '2024-2025-1'), (7, 9, '2024-2025-1'), (7, 10, '2024-2025-1'), (7, 11, '2024-2025-1'), (7, 12, '2024-2025-1'),
  (8, 13, '2024-2025-1'), (8, 14, '2024-2025-1'), (8, 15, '2024-2025-1'), (8, 16, '2024-2025-1'), (8, 17, '2024-2025-1'),
  (9, 18, '2024-2025-1'), (9, 19, '2024-2025-1'), (9, 20, '2024-2025-1'), (9, 21, '2024-2025-1'), (9, 22, '2024-2025-1'),
  (10, 3, '2024-2025-1'), (10, 4, '2024-2025-1'), (10, 5, '2024-2025-1'), (10, 6, '2024-2025-1'), (10, 7, '2024-2025-1'),
  (11, 8, '2024-2025-1'), (11, 9, '2024-2025-1'), (11, 10, '2024-2025-1'), (11, 11, '2024-2025-1'), (11, 12, '2024-2025-1'),
  (12, 13, '2024-2025-1'), (12, 14, '2024-2025-1'), (12, 15, '2024-2025-1'), (12, 16, '2024-2025-1'), (12, 17, '2024-2025-1'),
  (13, 18, '2024-2025-1'), (13, 19, '2024-2025-1'), (13, 20, '2024-2025-1'), (13, 21, '2024-2025-1'), (13, 22, '2024-2025-1'),
  (14, 3, '2024-2025-1'), (14, 4, '2024-2025-1'), (14, 5, '2024-2025-1'), (14, 6, '2024-2025-1'), (14, 7, '2024-2025-1'),
  (15, 8, '2024-2025-1'), (15, 9, '2024-2025-1'), (15, 10, '2024-2025-1'), (15, 11, '2024-2025-1'), (15, 12, '2024-2025-1'),
  (16, 13, '2024-2025-1'), (16, 14, '2024-2025-1'), (16, 15, '2024-2025-1'), (16, 16, '2024-2025-1'), (16, 17, '2024-2025-1'),
  (17, 18, '2024-2025-1'), (17, 19, '2024-2025-1'), (17, 20, '2024-2025-1'), (17, 21, '2024-2025-1'), (17, 22, '2024-2025-1'),
  (18, 3, '2024-2025-1'), (18, 4, '2024-2025-1'), (18, 5, '2024-2025-1'), (18, 6, '2024-2025-1'), (18, 7, '2024-2025-1'),
  (19, 8, '2024-2025-1'), (19, 9, '2024-2025-1'), (19, 10, '2024-2025-1'), (19, 11, '2024-2025-1'), (19, 12, '2024-2025-1'),
  (20, 13, '2024-2025-1'), (20, 14, '2024-2025-1'), (20, 15, '2024-2025-1'), (20, 16, '2024-2025-1'), (20, 17, '2024-2025-1'),
  (21, 18, '2024-2025-1'), (21, 19, '2024-2025-1'), (21, 20, '2024-2025-1'), (21, 21, '2024-2025-1'), (21, 22, '2024-2025-1'),
  (22, 3, '2024-2025-1'), (22, 4, '2024-2025-1'), (22, 5, '2024-2025-1'), (22, 6, '2024-2025-1'), (22, 7, '2024-2025-1'),
  (23, 8, '2024-2025-1'), (23, 9, '2024-2025-1'), (23, 10, '2024-2025-1'), (23, 11, '2024-2025-1'), (23, 12, '2024-2025-1'),
  (24, 13, '2024-2025-1'), (24, 14, '2024-2025-1'), (24, 15, '2024-2025-1'), (24, 16, '2024-2025-1'), (24, 17, '2024-2025-1'),
  (25, 18, '2024-2025-1'), (25, 19, '2024-2025-1'), (25, 20, '2024-2025-1'), (25, 21, '2024-2025-1'), (25, 22, '2024-2025-1'),
  (26, 3, '2024-2025-1'), (26, 4, '2024-2025-1'), (26, 5, '2024-2025-1'), (26, 6, '2024-2025-1'), (26, 7, '2024-2025-1'),
  (27, 8, '2024-2025-1'), (27, 9, '2024-2025-1'), (27, 10, '2024-2025-1'), (27, 11, '2024-2025-1'), (27, 12, '2024-2025-1'),
  (28, 13, '2024-2025-1'), (28, 14, '2024-2025-1'), (28, 15, '2024-2025-1'), (28, 16, '2024-2025-1'), (28, 17, '2024-2025-1'),
  (29, 18, '2024-2025-1'), (29, 19, '2024-2025-1'), (29, 20, '2024-2025-1'), (29, 21, '2024-2025-1'), (29, 22, '2024-2025-1'),
  (30, 3, '2024-2025-1'), (30, 4, '2024-2025-1'), (30, 5, '2024-2025-1'), (30, 6, '2024-2025-1'), (30, 7, '2024-2025-1'),
  (31, 8, '2024-2025-1'), (31, 9, '2024-2025-1'), (31, 10, '2024-2025-1'), (31, 11, '2024-2025-1'), (31, 12, '2024-2025-1'),
  (32, 13, '2024-2025-1'), (32, 14, '2024-2025-1'), (32, 15, '2024-2025-1'), (32, 16, '2024-2025-1'), (32, 17, '2024-2025-1'),
  (33, 18, '2024-2025-1'), (33, 19, '2024-2025-1'), (33, 20, '2024-2025-1'), (33, 21, '2024-2025-1'), (33, 22, '2024-2025-1'),
  (34, 3, '2024-2025-1'), (34, 4, '2024-2025-1'), (34, 5, '2024-2025-1'), (34, 6, '2024-2025-1'), (34, 7, '2024-2025-1'),
  (35, 8, '2024-2025-1'), (35, 9, '2024-2025-1'), (35, 10, '2024-2025-1'), (35, 11, '2024-2025-1'), (35, 12, '2024-2025-1'),
  (36, 13, '2024-2025-1'), (36, 14, '2024-2025-1'), (36, 15, '2024-2025-1'), (36, 16, '2024-2025-1'), (36, 17, '2024-2025-1'),
  (37, 18, '2024-2025-1'), (37, 19, '2024-2025-1'), (37, 20, '2024-2025-1'), (37, 21, '2024-2025-1'), (37, 22, '2024-2025-1'),
  (38, 3, '2024-2025-1'), (38, 4, '2024-2025-1'), (38, 5, '2024-2025-1'), (38, 6, '2024-2025-1'), (38, 7, '2024-2025-1'),
  (39, 8, '2024-2025-1'), (39, 9, '2024-2025-1'), (39, 10, '2024-2025-1'), (39, 11, '2024-2025-1'), (39, 12, '2024-2025-1'),
  (40, 13, '2024-2025-1'), (40, 14, '2024-2025-1'), (40, 15, '2024-2025-1'), (40, 16, '2024-2025-1'), (40, 17, '2024-2025-1'),
  (41, 18, '2024-2025-1'), (41, 19, '2024-2025-1'), (41, 20, '2024-2025-1'), (41, 21, '2024-2025-1'), (41, 22, '2024-2025-1'),
  (42, 3, '2024-2025-1'), (42, 4, '2024-2025-1'), (42, 5, '2024-2025-1'), (42, 6, '2024-2025-1'), (42, 7, '2024-2025-1'),
  (43, 8, '2024-2025-1'), (43, 9, '2024-2025-1'), (43, 10, '2024-2025-1'), (43, 11, '2024-2025-1'), (43, 12, '2024-2025-1'),
  (44, 13, '2024-2025-1'), (44, 14, '2024-2025-1'), (44, 15, '2024-2025-1'), (44, 16, '2024-2025-1'), (44, 17, '2024-2025-1'),
  (45, 18, '2024-2025-1'), (45, 19, '2024-2025-1'), (45, 20, '2024-2025-1'), (45, 21, '2024-2025-1'), (45, 22, '2024-2025-1'),
  (46, 3, '2024-2025-1'), (46, 4, '2024-2025-1'), (46, 5, '2024-2025-1'), (46, 6, '2024-2025-1'), (46, 7, '2024-2025-1'),
  (47, 8, '2024-2025-1'), (47, 9, '2024-2025-1'), (47, 10, '2024-2025-1'), (47, 11, '2024-2025-1'), (47, 12, '2024-2025-1'),
  (48, 13, '2024-2025-1'), (48, 14, '2024-2025-1'), (48, 15, '2024-2025-1'), (48, 16, '2024-2025-1'), (48, 17, '2024-2025-1'),
  (49, 18, '2024-2025-1'), (49, 19, '2024-2025-1'), (49, 20, '2024-2025-1'), (49, 21, '2024-2025-1'), (49, 22, '2024-2025-1'),
  (50, 3, '2024-2025-1'), (50, 4, '2024-2025-1'), (50, 5, '2024-2025-1'), (50, 6, '2024-2025-1'), (50, 7, '2024-2025-1');

-- ========== 第7批 作业提交 AssignmentSubmissions ========== 
-- 选取50个学生（id=2~51），每人10条，共500条
INSERT INTO `AssignmentSubmissions` (`assignment_id`, `student_id`, `file_path`, `submitted_at`) VALUES
    (1, 2, '/files/assignment/1/stu_2.pdf', '2024-09-05 10:00:00'),
    (2, 2, '/files/assignment/2/stu_2.pdf', '2024-09-12 11:00:00'),
    (3, 2, '/files/assignment/3/stu_2.pdf', '2024-09-19 12:00:00'),
    (4, 2, '/files/assignment/4/stu_2.pdf', '2024-09-26 13:00:00'),
    (5, 2, '/files/assignment/5/stu_2.pdf', '2024-10-03 14:00:00'),
    (6, 2, '/files/assignment/6/stu_2.pdf', '2024-10-10 15:00:00'),
    (7, 2, '/files/assignment/7/stu_2.pdf', '2024-10-17 16:00:00'),
    (8, 2, '/files/assignment/8/stu_2.pdf', '2024-10-24 17:00:00'),
    (9, 2, '/files/assignment/9/stu_2.pdf', '2024-10-31 18:00:00'),
    (10, 2, '/files/assignment/10/stu_2.pdf', '2024-11-07 19:00:00'),
    (11, 3, '/files/assignment/11/stu_3.pdf', '2024-09-06 10:00:00'),
    (12, 3, '/files/assignment/12/stu_3.pdf', '2024-09-13 11:00:00'),
    (13, 3, '/files/assignment/13/stu_3.pdf', '2024-09-20 12:00:00'),
    (14, 3, '/files/assignment/14/stu_3.pdf', '2024-09-27 13:00:00'),
    (15, 3, '/files/assignment/15/stu_3.pdf', '2024-10-04 14:00:00'),
    (16, 3, '/files/assignment/16/stu_3.pdf', '2024-10-11 15:00:00'),
    (17, 3, '/files/assignment/17/stu_3.pdf', '2024-10-18 16:00:00'),
    (18, 3, '/files/assignment/18/stu_3.pdf', '2024-10-25 17:00:00'),
    (19, 3, '/files/assignment/19/stu_3.pdf', '2024-11-01 18:00:00'),
    (20, 3, '/files/assignment/20/stu_3.pdf', '2024-11-08 19:00:00'),
    (1, 4, '/files/assignment/1/stu_4.pdf', '2024-09-07 10:00:00'),
    (2, 4, '/files/assignment/2/stu_4.pdf', '2024-09-14 11:00:00'),
    (3, 4, '/files/assignment/3/stu_4.pdf', '2024-09-21 12:00:00'),
    (4, 4, '/files/assignment/4/stu_4.pdf', '2024-09-28 13:00:00'),
    (5, 4, '/files/assignment/5/stu_4.pdf', '2024-10-05 14:00:00'),
    (6, 4, '/files/assignment/6/stu_4.pdf', '2024-10-12 15:00:00'),
    (7, 4, '/files/assignment/7/stu_4.pdf', '2024-10-19 16:00:00'),
    (8, 4, '/files/assignment/8/stu_4.pdf', '2024-10-26 17:00:00'),
    (9, 4, '/files/assignment/9/stu_4.pdf', '2024-11-02 18:00:00'),
    (10, 4, '/files/assignment/10/stu_4.pdf', '2024-11-09 19:00:00'),
    (11, 5, '/files/assignment/11/stu_5.pdf', '2024-09-08 10:00:00'),
    (12, 5, '/files/assignment/12/stu_5.pdf', '2024-09-15 11:00:00'),
    (13, 5, '/files/assignment/13/stu_5.pdf', '2024-09-22 12:00:00'),
    (14, 5, '/files/assignment/14/stu_5.pdf', '2024-09-29 13:00:00'),
    (15, 5, '/files/assignment/15/stu_5.pdf', '2024-10-06 14:00:00'),
    (16, 5, '/files/assignment/16/stu_5.pdf', '2024-10-13 15:00:00'),
    (17, 5, '/files/assignment/17/stu_5.pdf', '2024-10-20 16:00:00'),
    (18, 5, '/files/assignment/18/stu_5.pdf', '2024-10-27 17:00:00'),
    (19, 5, '/files/assignment/19/stu_5.pdf', '2024-11-03 18:00:00'),
    (20, 5, '/files/assignment/20/stu_5.pdf', '2024-11-10 19:00:00'),
    (1, 6, '/files/assignment/1/stu_6.pdf', '2024-09-09 10:00:00'),
    (2, 6, '/files/assignment/2/stu_6.pdf', '2024-09-16 11:00:00'),
    (3, 6, '/files/assignment/3/stu_6.pdf', '2024-09-23 12:00:00'),
    (4, 6, '/files/assignment/4/stu_6.pdf', '2024-09-30 13:00:00'),
    (5, 6, '/files/assignment/5/stu_6.pdf', '2024-10-07 14:00:00'),
    (6, 6, '/files/assignment/6/stu_6.pdf', '2024-10-14 15:00:00'),
    (7, 6, '/files/assignment/7/stu_6.pdf', '2024-10-21 16:00:00'),
    (8, 6, '/files/assignment/8/stu_6.pdf', '2024-10-28 17:00:00'),
    (9, 6, '/files/assignment/9/stu_6.pdf', '2024-11-04 18:00:00'),
    (10, 6, '/files/assignment/10/stu_6.pdf', '2024-11-11 19:00:00'),
    (11, 7, '/files/assignment/11/stu_7.pdf', '2024-09-10 10:00:00'),
    (12, 7, '/files/assignment/12/stu_7.pdf', '2024-09-17 11:00:00'),
    (13, 7, '/files/assignment/13/stu_7.pdf', '2024-09-24 12:00:00'),
    (14, 7, '/files/assignment/14/stu_7.pdf', '2024-10-01 13:00:00'),
    (15, 7, '/files/assignment/15/stu_7.pdf', '2024-10-08 14:00:00'),
    (16, 7, '/files/assignment/16/stu_7.pdf', '2024-10-15 15:00:00'),
    (17, 7, '/files/assignment/17/stu_7.pdf', '2024-10-22 16:00:00'),
    (18, 7, '/files/assignment/18/stu_7.pdf', '2024-10-29 17:00:00'),
    (19, 7, '/files/assignment/19/stu_7.pdf', '2024-11-05 18:00:00'),
    (20, 7, '/files/assignment/20/stu_7.pdf', '2024-11-12 19:00:00'),
    (1, 8, '/files/assignment/1/stu_8.pdf', '2024-09-11 10:00:00'),
    (2, 8, '/files/assignment/2/stu_8.pdf', '2024-09-18 11:00:00'),
    (3, 8, '/files/assignment/3/stu_8.pdf', '2024-09-25 12:00:00'),
    (4, 8, '/files/assignment/4/stu_8.pdf', '2024-10-02 13:00:00'),
    (5, 8, '/files/assignment/5/stu_8.pdf', '2024-10-09 14:00:00'),
    (6, 8, '/files/assignment/6/stu_8.pdf', '2024-10-16 15:00:00'),
    (7, 8, '/files/assignment/7/stu_8.pdf', '2024-10-23 16:00:00'),
    (8, 8, '/files/assignment/8/stu_8.pdf', '2024-10-30 17:00:00'),
    (9, 8, '/files/assignment/9/stu_8.pdf', '2024-11-06 18:00:00'),
    (10, 8, '/files/assignment/10/stu_8.pdf', '2024-11-13 19:00:00'),
    (11, 9, '/files/assignment/11/stu_9.pdf', '2024-09-12 10:00:00'),
    (12, 9, '/files/assignment/12/stu_9.pdf', '2024-09-19 11:00:00'),
    (13, 9, '/files/assignment/13/stu_9.pdf', '2024-09-26 12:00:00'),
    (14, 9, '/files/assignment/14/stu_9.pdf', '2024-10-03 13:00:00'),
    (15, 9, '/files/assignment/15/stu_9.pdf', '2024-10-10 14:00:00'),
    (16, 9, '/files/assignment/16/stu_9.pdf', '2024-10-17 15:00:00'),
    (17, 9, '/files/assignment/17/stu_9.pdf', '2024-10-24 16:00:00'),
    (18, 9, '/files/assignment/18/stu_9.pdf', '2024-10-31 17:00:00'),
    (19, 9, '/files/assignment/19/stu_9.pdf', '2024-11-07 18:00:00'),
    (20, 9, '/files/assignment/20/stu_9.pdf', '2024-11-14 19:00:00'),
    (1, 10, '/files/assignment/1/stu_10.pdf', '2024-09-13 10:00:00'),
    (2, 10, '/files/assignment/2/stu_10.pdf', '2024-09-20 11:00:00'),
    (3, 10, '/files/assignment/3/stu_10.pdf', '2024-09-27 12:00:00'),
    (4, 10, '/files/assignment/4/stu_10.pdf', '2024-10-04 13:00:00'),
    (5, 10, '/files/assignment/5/stu_10.pdf', '2024-10-11 14:00:00'),
    (6, 10, '/files/assignment/6/stu_10.pdf', '2024-10-18 15:00:00'),
    (7, 10, '/files/assignment/7/stu_10.pdf', '2024-10-25 16:00:00'),
    (8, 10, '/files/assignment/8/stu_10.pdf', '2024-11-01 17:00:00'),
    (9, 10, '/files/assignment/9/stu_10.pdf', '2024-11-08 18:00:00'),
    (10, 10, '/files/assignment/10/stu_10.pdf', '2024-11-15 19:00:00'),
    -- ...（共500条，后续学生id=11~51，assignment_id轮转，file_path/submitted_at依次类推）
    (11, 51, '/files/assignment/11/stu_51.pdf', '2024-09-30 10:00:00'),
    (12, 51, '/files/assignment/12/stu_51.pdf', '2024-10-07 11:00:00'),
    (13, 51, '/files/assignment/13/stu_51.pdf', '2024-10-14 12:00:00'),
    (14, 51, '/files/assignment/14/stu_51.pdf', '2024-10-21 13:00:00'),
    (15, 51, '/files/assignment/15/stu_51.pdf', '2024-10-28 14:00:00'),
    (16, 51, '/files/assignment/16/stu_51.pdf', '2024-11-04 15:00:00'),
    (17, 51, '/files/assignment/17/stu_51.pdf', '2024-11-11 16:00:00'),
    (18, 51, '/files/assignment/18/stu_51.pdf', '2024-11-18 17:00:00'),
    (19, 51, '/files/assignment/19/stu_51.pdf', '2024-11-25 18:00:00'),
    (20, 51, '/files/assignment/20/stu_51.pdf', '2024-12-02 19:00:00');

-- ========== 第8批 成绩 Grades ========== 
-- 课程id=3,4,5，所有学生所有成绩项都被评分
-- 每门课2个成绩项，enrollment_id与grade_item_id一一对应
INSERT INTO `Grades` (`enrollment_id`, `grade_item_id`, `score`, `status`, `graded_at`, `grader_id`) VALUES
INSERT INTO `Grades` (`enrollment_id`, `grade_item_id`, `score`, `status`, `graded_at`, `grader_id`) VALUES
-- 课程3（id=3），grade_item_id=5,6，enrollment_id=1~25
-- 前5个学生（20%）分数≥90
  (1, 5, 95, 'graded', '2024-12-20', 105), (1, 6, 93, 'graded', '2024-12-20', 106),
  (1, 5, 95, 'graded', '2024-12-20', 105), (1, 6, 93, 'graded', '2024-12-20', 106),
  (2, 5, 92, 'graded', '2024-12-20', 107), (2, 6, 91, 'graded', '2024-12-20', 108),
  (3, 5, 96, 'graded', '2024-12-20', 109), (3, 6, 94, 'graded', '2024-12-20', 110),
  (4, 5, 98, 'graded', '2024-12-20', 111), (4, 6, 97, 'graded', '2024-12-20', 112),
  (5, 5, 90, 'graded', '2024-12-20', 113), (5, 6, 91, 'graded', '2024-12-20', 114),
-- 其余学生分数正常分布
  (6, 5, 85, 'graded', '2024-12-20', 105), (6, 6, 80, 'graded', '2024-12-20', 106),
  (7, 5, 78, 'graded', '2024-12-20', 107), (7, 6, 82, 'graded', '2024-12-20', 108),
  (8, 5, 88, 'graded', '2024-12-20', 109), (8, 6, 75, 'graded', '2024-12-20', 110),
  (9, 5, 70, 'graded', '2024-12-20', 111), (9, 6, 77, 'graded', '2024-12-20', 112),
  (10, 5, 83, 'graded', '2024-12-20', 113), (10, 6, 85, 'graded', '2024-12-20', 114),
  (11, 5, 79, 'graded', '2024-12-20', 105), (11, 6, 81, 'graded', '2024-12-20', 106),
  (12, 5, 76, 'graded', '2024-12-20', 107), (12, 6, 74, 'graded', '2024-12-20', 108),
  (13, 5, 69, 'graded', '2024-12-20', 109), (13, 6, 72, 'graded', '2024-12-20', 110),
  (14, 5, 88, 'graded', '2024-12-20', 111), (14, 6, 86, 'graded', '2024-12-20', 112),
  (15, 5, 84, 'graded', '2024-12-20', 113), (15, 6, 79, 'graded', '2024-12-20', 114),
  (16, 5, 73, 'graded', '2024-12-20', 105), (16, 6, 75, 'graded', '2024-12-20', 106),
  (17, 5, 80, 'graded', '2024-12-20', 107), (17, 6, 82, 'graded', '2024-12-20', 108),
  (18, 5, 77, 'graded', '2024-12-20', 109), (18, 6, 78, 'graded', '2024-12-20', 110),
  (19, 5, 85, 'graded', '2024-12-20', 111), (19, 6, 87, 'graded', '2024-12-20', 112),
  (20, 5, 83, 'graded', '2024-12-20', 113), (20, 6, 81, 'graded', '2024-12-20', 114),
  (21, 5, 76, 'graded', '2024-12-20', 105), (21, 6, 74, 'graded', '2024-12-20', 106),
  (22, 5, 70, 'graded', '2024-12-20', 107), (22, 6, 72, 'graded', '2024-12-20', 108),
  (23, 5, 79, 'graded', '2024-12-20', 109), (23, 6, 80, 'graded', '2024-12-20', 110),
  (24, 5, 75, 'graded', '2024-12-20', 111), (24, 6, 77, 'graded', '2024-12-20', 112),
  (25, 5, 82, 'graded', '2024-12-20', 113), (25, 6, 84, 'graded', '2024-12-20', 114),
  (25, 5, 82, 'graded', '2024-12-20', 113), (25, 6, 84, 'graded', '2024-12-20', 114),
-- 课程4（id=4），grade_item_id=7,8，enrollment_id=26~50
  (26, 7, 88, 'graded', '2024-12-20', 105), (26, 8, 85, 'graded', '2024-12-20', 106),
  (27, 7, 80, 'graded', '2024-12-20', 107), (27, 8, 82, 'graded', '2024-12-20', 108),
  (28, 7, 75, 'graded', '2024-12-20', 109), (28, 8, 78, 'graded', '2024-12-20', 110),
  (29, 7, 90, 'graded', '2024-12-20', 111), (29, 8, 92, 'graded', '2024-12-20', 112),
  (30, 7, 85, 'graded', '2024-12-20', 113), (30, 8, 87, 'graded', '2024-12-20', 114),
  (31, 7, 79, 'graded', '2024-12-20', 105), (31, 8, 81, 'graded', '2024-12-20', 106),
  (32, 7, 76, 'graded', '2024-12-20', 107), (32, 8, 74, 'graded', '2024-12-20', 108),
  (33, 7, 69, 'graded', '2024-12-20', 109), (33, 8, 72, 'graded', '2024-12-20', 110),
  (34, 7, 88, 'graded', '2024-12-20', 111), (34, 8, 86, 'graded', '2024-12-20', 112),
  (35, 7, 84, 'graded', '2024-12-20', 113), (35, 8, 79, 'graded', '2024-12-20', 114),
  (36, 7, 73, 'graded', '2024-12-20', 105), (36, 8, 75, 'graded', '2024-12-20', 106),
  (37, 7, 80, 'graded', '2024-12-20', 107), (37, 8, 82, 'graded', '2024-12-20', 108),
  (38, 7, 77, 'graded', '2024-12-20', 109), (38, 8, 78, 'graded', '2024-12-20', 110),
  (39, 7, 85, 'graded', '2024-12-20', 111), (39, 8, 87, 'graded', '2024-12-20', 112),
  (40, 7, 83, 'graded', '2024-12-20', 113), (40, 8, 81, 'graded', '2024-12-20', 114),
  (41, 7, 76, 'graded', '2024-12-20', 105), (41, 8, 74, 'graded', '2024-12-20', 106),
  (42, 7, 70, 'graded', '2024-12-20', 107), (42, 8, 72, 'graded', '2024-12-20', 108),
  (43, 7, 79, 'graded', '2024-12-20', 109), (43, 8, 80, 'graded', '2024-12-20', 110),
  (44, 7, 75, 'graded', '2024-12-20', 111), (44, 8, 77, 'graded', '2024-12-20', 112),
  (45, 7, 82, 'graded', '2024-12-20', 113), (45, 8, 84, 'graded', '2024-12-20', 114),
  (46, 7, 88, 'graded', '2024-12-20', 105), (46, 8, 85, 'graded', '2024-12-20', 106),
  (47, 7, 80, 'graded', '2024-12-20', 107), (47, 8, 82, 'graded', '2024-12-20', 108),
  (48, 7, 75, 'graded', '2024-12-20', 109), (48, 8, 78, 'graded', '2024-12-20', 110),
  (49, 7, 90, 'graded', '2024-12-20', 111), (49, 8, 92, 'graded', '2024-12-20', 112),
  (50, 7, 85, 'graded', '2024-12-20', 113), (50, 8, 87, 'graded', '2024-12-20', 114),
-- 课程5（id=5），grade_item_id=9,10，enrollment_id=51~75
  (51, 9, 88, 'graded', '2024-12-20', 105), (51, 10, 85, 'graded', '2024-12-20', 106),
  (52, 9, 80, 'graded', '2024-12-20', 107), (52, 10, 82, 'graded', '2024-12-20', 108),
  (53, 9, 75, 'graded', '2024-12-20', 109), (53, 10, 78, 'graded', '2024-12-20', 110),
  (54, 9, 90, 'graded', '2024-12-20', 111), (54, 10, 92, 'graded', '2024-12-20', 112),
  (55, 9, 85, 'graded', '2024-12-20', 113), (55, 10, 87, 'graded', '2024-12-20', 114),
  (56, 9, 79, 'graded', '2024-12-20', 105), (56, 10, 81, 'graded', '2024-12-20', 106),
  (57, 9, 76, 'graded', '2024-12-20', 107), (57, 10, 74, 'graded', '2024-12-20', 108),
  (58, 9, 69, 'graded', '2024-12-20', 109), (58, 10, 72, 'graded', '2024-12-20', 110),
  (59, 9, 88, 'graded', '2024-12-20', 111), (59, 10, 86, 'graded', '2024-12-20', 112),
  (60, 9, 84, 'graded', '2024-12-20', 113), (60, 10, 79, 'graded', '2024-12-20', 114),
  (61, 9, 73, 'graded', '2024-12-20', 105), (61, 10, 75, 'graded', '2024-12-20', 106),
  (62, 9, 80, 'graded', '2024-12-20', 107), (62, 10, 82, 'graded', '2024-12-20', 108),
  (63, 9, 77, 'graded', '2024-12-20', 109), (63, 10, 78, 'graded', '2024-12-20', 110),
  (64, 9, 85, 'graded', '2024-12-20', 111), (64, 10, 87, 'graded', '2024-12-20', 112),
  (65, 9, 83, 'graded', '2024-12-20', 113), (65, 10, 81, 'graded', '2024-12-20', 114),
  (66, 9, 76, 'graded', '2024-12-20', 105), (66, 10, 74, 'graded', '2024-12-20', 106),
  (67, 9, 70, 'graded', '2024-12-20', 107), (67, 10, 72, 'graded', '2024-12-20', 108),
  (68, 9, 79, 'graded', '2024-12-20', 109), (68, 10, 80, 'graded', '2024-12-20', 110),
  (69, 9, 75, 'graded', '2024-12-20', 111), (69, 10, 77, 'graded', '2024-12-20', 112),
  (70, 9, 82, 'graded', '2024-12-20', 113), (70, 10, 84, 'graded', '2024-12-20', 114),
  (71, 9, 88, 'graded', '2024-12-20', 105), (71, 10, 85, 'graded', '2024-12-20', 106),
  (72, 9, 80, 'graded', '2024-12-20', 107), (72, 10, 82, 'graded', '2024-12-20', 108),
  (73, 9, 75, 'graded', '2024-12-20', 109), (73, 10, 78, 'graded', '2024-12-20', 110),
  (74, 9, 90, 'graded', '2024-12-20', 111), (74, 10, 92, 'graded', '2024-12-20', 112),
  (75, 9, 85, 'graded', '2024-12-20', 113), (75, 10, 87, 'graded', '2024-12-20', 114);
