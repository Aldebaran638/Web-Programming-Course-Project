-- Web-Programming-Course-Project 数据库建表SQL
-- 创建数据库（如不存在）并切换到该数据库
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
  `is_deleted` BOOLEAN NOT NULL DEFAULT 0
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
  `details` TEXT,
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

-- 示例数据插入完毕。

-- 重新开启外键检查
SET FOREIGN_KEY_CHECKS = 1;
