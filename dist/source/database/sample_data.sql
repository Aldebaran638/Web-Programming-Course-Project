-- =========================================
-- 样例数据生成脚本
-- 包含：100个学生、10个教师、20个课程等
-- =========================================

USE course_management;

-- 清空现有测试数据（保留结构）
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Submissions;
TRUNCATE TABLE Grades;
TRUNCATE TABLE GradeItems;
TRUNCATE TABLE Assignments;
TRUNCATE TABLE CourseMaterials;
TRUNCATE TABLE Enrollments;
TRUNCATE TABLE CourseSchedules;
TRUNCATE TABLE TeachingAssignments;
TRUNCATE TABLE Classes;
TRUNCATE TABLE Classrooms;
TRUNCATE TABLE StudentProfiles;
TRUNCATE TABLE TeacherProfiles;
TRUNCATE TABLE Logs;
-- 不清空Users表，因为可能包含管理员账户
DELETE FROM Users WHERE role IN ('student', 'teacher');
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================
-- 1. 插入教师用户 (10个)
-- =========================================
INSERT INTO Users (username, password_hash, full_name, email, role) VALUES
('teacher001', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '张伟教授', 'zhang.wei@university.edu.cn', 'teacher'),
('teacher002', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '李娜副教授', 'li.na@university.edu.cn', 'teacher'),
('teacher003', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '王强讲师', 'wang.qiang@university.edu.cn', 'teacher'),
('teacher004', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '刘芳教授', 'liu.fang@university.edu.cn', 'teacher'),
('teacher005', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '陈明副教授', 'chen.ming@university.edu.cn', 'teacher'),
('teacher006', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '赵丽讲师', 'zhao.li@university.edu.cn', 'teacher'),
('teacher007', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '黄涛教授', 'huang.tao@university.edu.cn', 'teacher'),
('teacher008', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '周静副教授', 'zhou.jing@university.edu.cn', 'teacher'),
('teacher009', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '吴磊讲师', 'wu.lei@university.edu.cn', 'teacher'),
('teacher010', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '孙雪教授', 'sun.xue@university.edu.cn', 'teacher');

-- 插入教师档案
INSERT INTO TeacherProfiles (user_id, teacher_id_number, department, title, research_interests)
SELECT id, CONCAT('T', LPAD(id, 6, '0')), 
       CASE (id % 5)
           WHEN 0 THEN '计算机科学与技术学院'
           WHEN 1 THEN '数学与统计学院'
           WHEN 2 THEN '物理学院'
           WHEN 3 THEN '经济管理学院'
           WHEN 4 THEN '外国语学院'
       END,
       CASE (id % 3)
           WHEN 0 THEN '教授'
           WHEN 1 THEN '副教授'
           WHEN 2 THEN '讲师'
       END,
       CASE (id % 4)
           WHEN 0 THEN '人工智能,机器学习'
           WHEN 1 THEN '数据库系统,分布式计算'
           WHEN 2 THEN '软件工程,系统架构'
           WHEN 3 THEN '网络安全,密码学'
       END
FROM Users WHERE role = 'teacher';

-- =========================================
-- 2. 插入学生用户 (100个)
-- =========================================
INSERT INTO Users (username, password_hash, full_name, email, role) VALUES
('student001', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '张三', 'zhangsan@student.edu.cn', 'student'),
('student002', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '李四', 'lisi@student.edu.cn', 'student'),
('student003', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '王五', 'wangwu@student.edu.cn', 'student'),
('student004', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '赵六', 'zhaoliu@student.edu.cn', 'student'),
('student005', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '孙七', 'sunqi@student.edu.cn', 'student'),
('student006', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '周八', 'zhouba@student.edu.cn', 'student'),
('student007', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '吴九', 'wujiu@student.edu.cn', 'student'),
('student008', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '郑十', 'zhengshi@student.edu.cn', 'student'),
('student009', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '钱一', 'qianyi@student.edu.cn', 'student'),
('student010', 'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1', '孔二', 'konger@student.edu.cn', 'student');

-- 继续插入更多学生 (student011-student100)
-- 使用存储过程批量插入
DELIMITER //
CREATE PROCEDURE InsertStudents()
BEGIN
    DECLARE i INT DEFAULT 11;
    DECLARE student_name VARCHAR(50);
    DECLARE chinese_surnames VARCHAR(500) DEFAULT '李,王,张,刘,陈,杨,黄,赵,周,吴,徐,孙,马,朱,胡,郭,何,高,林,罗,郑,梁,谢,宋,唐,许,韩,冯,邓,曹,彭,曾,肖,田,董,袁,潘,于,蒋,蔡,余,杜,叶,程,苏,魏,吕,丁,任,沈,姚,卢,姜,崔,钟,谭,陆,汪,范,金,石,廖,贾,夏,韦,付,方,白,邹,孟,熊,秦,邱,江,尹,薛,闫,段,雷,侯,龙,史,陶,黎,贺,顾,毛,郝,龚,邵,万,钱,严,覃,武,戴,莫,孔,向';
    DECLARE chinese_names VARCHAR(1000) DEFAULT '伟,芳,娜,秀英,敏,静,丽,强,磊,军,洋,勇,艳,杰,娟,涛,明,超,秀兰,霞,平,刚,桂英,建华,文,利,清,玉兰,红,波,鑫,斌,玉,燕,辉,华,欣,雪,峰,浩,建,晶,佳,海,婷,新,亮,慧,宇,云,龙,阳,春,健,翔,颖,秀,博,凯,琳,梅,丹,飞,晨,宁,琴,莉,兵,杨,伟,娴,林,蕾,锋,彬,宏,倩,翠,瑜';
    
    WHILE i <= 100 DO
        -- 生成随机中文姓名
        SET student_name = CONCAT(
            SUBSTRING_INDEX(SUBSTRING_INDEX(chinese_surnames, ',', FLOOR(1 + RAND() * 100)), ',', -1),
            SUBSTRING_INDEX(SUBSTRING_INDEX(chinese_names, ',', FLOOR(1 + RAND() * 80)), ',', -1)
        );
        
        INSERT INTO Users (username, password_hash, full_name, email, role) VALUES
        (CONCAT('student', LPAD(i, 3, '0')), 
         'scrypt:32768:8:1$mI9EXqvYGQDLpU8W$d4e8f5b9c3a2e1d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1',
         student_name,
         CONCAT('student', LPAD(i, 3, '0'), '@student.edu.cn'),
         'student');
        
        SET i = i + 1;
    END WHILE;
END//
DELIMITER ;

CALL InsertStudents();
DROP PROCEDURE InsertStudents;

-- 插入学生档案
INSERT INTO StudentProfiles (user_id, student_id_number, major, grade, class_name, enrollment_year)
SELECT id, CONCAT('20220', LPAD(id - (SELECT MIN(id) FROM Users WHERE role='student'), 5, '0')),
       CASE ((id - (SELECT MIN(id) FROM Users WHERE role='student')) % 5)
           WHEN 0 THEN '计算机科学与技术'
           WHEN 1 THEN '软件工程'
           WHEN 2 THEN '数据科学与大数据技术'
           WHEN 3 THEN '信息安全'
           WHEN 4 THEN '人工智能'
       END,
       CASE ((id - (SELECT MIN(id) FROM Users WHERE role='student')) % 4)
           WHEN 0 THEN '大一'
           WHEN 1 THEN '大二'
           WHEN 2 THEN '大三'
           WHEN 3 THEN '大四'
       END,
       CONCAT('2022级', ((id - (SELECT MIN(id) FROM Users WHERE role='student')) % 10 + 1), '班'),
       2022
FROM Users WHERE role = 'student';

-- =========================================
-- 3. 插入课程 (30个)
-- =========================================
INSERT INTO Courses (course_code, course_name, credits, description, department, prerequisites) VALUES
('CS101', '计算机科学导论', 3.0, '介绍计算机科学的基本概念和原理', '计算机科学与技术学院', NULL),
('CS102', '程序设计基础(C语言)', 4.0, '学习C语言程序设计的基本方法', '计算机科学与技术学院', NULL),
('CS201', '数据结构与算法', 4.0, '学习各种常用数据结构及算法设计与分析', '计算机科学与技术学院', 'CS102'),
('CS202', '计算机组成原理', 3.5, '学习计算机硬件系统的组成和工作原理', '计算机科学与技术学院', 'CS101'),
('CS203', '操作系统原理', 4.0, '学习操作系统的基本原理和实现技术', '计算机科学与技术学院', 'CS202'),
('CS204', '计算机网络', 3.5, '学习计算机网络的基本原理和协议', '计算机科学与技术学院', NULL),
('CS301', '数据库系统', 4.0, '学习数据库系统的原理、设计和实现', '计算机科学与技术学院', 'CS201'),
('CS302', '软件工程', 3.0, '学习软件开发的方法、过程和管理', '计算机科学与技术学院', 'CS201'),
('CS303', '编译原理', 4.0, '学习编译器的设计原理和实现技术', '计算机科学与技术学院', 'CS201'),
('CS304', '人工智能导论', 3.5, '介绍人工智能的基本概念和方法', '计算机科学与技术学院', 'CS201'),
('CS305', '机器学习基础', 4.0, '学习机器学习的基本算法和应用', '计算机科学与技术学院', 'CS201'),
('CS306', '深度学习', 4.0, '学习深度神经网络的原理和应用', '计算机科学与技术学院', 'CS305'),
('CS401', 'Web开发技术', 3.5, '学习前端和后端Web开发技术', '计算机科学与技术学院', 'CS204'),
('CS402', '移动应用开发', 3.0, '学习iOS和Android应用开发', '计算机科学与技术学院', 'CS102'),
('CS403', '信息安全', 3.5, '学习信息安全的基本原理和技术', '计算机科学与技术学院', 'CS204'),
('MATH101', '高等数学A(上)', 5.0, '学习微积分的基本理论和方法', '数学与统计学院', NULL),
('MATH102', '高等数学A(下)', 5.0, '学习微积分的高级理论和应用', '数学与统计学院', 'MATH101'),
('MATH201', '线性代数', 3.0, '学习线性代数的基本理论和方法', '数学与统计学院', NULL),
('MATH202', '概率论与数理统计', 4.0, '学习概率论和统计学的基本原理', '数学与统计学院', 'MATH102'),
('MATH301', '离散数学', 3.5, '学习离散数学的基本概念和方法', '数学与统计学院', NULL),
('PHYS101', '大学物理A(上)', 4.0, '学习经典力学和热学的基本原理', '物理学院', 'MATH101'),
('PHYS102', '大学物理A(下)', 4.0, '学习电磁学和光学的基本原理', '物理学院', 'PHYS101'),
('ECON101', '微观经济学', 3.0, '学习微观经济学的基本理论', '经济管理学院', NULL),
('ECON102', '宏观经济学', 3.0, '学习宏观经济学的基本原理', '经济管理学院', 'ECON101'),
('MGMT101', '管理学原理', 3.0, '学习管理的基本理论和方法', '经济管理学院', NULL),
('ENG101', '大学英语(一)', 3.0, '提高英语听说读写综合能力', '外国语学院', NULL),
('ENG102', '大学英语(二)', 3.0, '进一步提高英语应用能力', '外国语学院', 'ENG101'),
('ENG201', '英语口语', 2.0, '提高英语口语交流能力', '外国语学院', 'ENG102'),
('PE101', '体育(一)', 1.0, '发展身体素质，掌握运动技能', '体育学院', NULL),
('PE102', '体育(二)', 1.0, '继续发展身体素质，提高运动水平', '体育学院', 'PE101');

-- =========================================
-- 4. 插入教室 (20个)
-- =========================================
INSERT INTO Classrooms (name, location, capacity) VALUES
('A101', 'A楼1层', 60),
('A102', 'A楼1层', 60),
('A201', 'A楼2层', 80),
('A202', 'A楼2层', 80),
('A301', 'A楼3层', 100),
('B101', 'B楼1层', 50),
('B102', 'B楼1层', 50),
('B201', 'B楼2层', 70),
('B202', 'B楼2层', 70),
('B301', 'B楼3层', 90),
('C101', 'C楼1层', 120),
('C102', 'C楼1层', 120),
('C201', 'C楼2层', 150),
('D101', 'D楼1层', 40),
('D102', 'D楼1层', 40),
('D201', 'D楼2层', 60),
('E101', 'E楼1层', 200),
('E102', 'E楼1层', 200),
('Lab1', '实验楼1', 30),
('Lab2', '实验楼2', 30);

-- =========================================
-- 5. 插入授课安排 (30个课程分配给10个教师)
-- =========================================
INSERT INTO TeachingAssignments (teacher_id, course_id, semester, classroom_id)
SELECT 
    (SELECT id FROM Users WHERE role='teacher' ORDER BY id LIMIT 1 OFFSET (c.id % 10)),
    c.id,
    '2025-2026-1',
    (SELECT id FROM Classrooms ORDER BY id LIMIT 1 OFFSET (c.id % 20))
FROM Courses c;

-- 为部分课程添加第二学期的授课安排
INSERT INTO TeachingAssignments (teacher_id, course_id, semester, classroom_id)
SELECT 
    (SELECT id FROM Users WHERE role='teacher' ORDER BY id LIMIT 1 OFFSET ((c.id + 5) % 10)),
    c.id,
    '2025-2026-2',
    (SELECT id FROM Classrooms ORDER BY id LIMIT 1 OFFSET ((c.id + 10) % 20))
FROM Courses c
WHERE c.id <= 15;

-- =========================================
-- 6. 插入选课记录 (每个学生选3-6门课)
-- =========================================
DELIMITER //
CREATE PROCEDURE InsertEnrollments()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE student_user_id INT;
    DECLARE course_count INT;
    DECLARE i INT;
    DECLARE random_course_id INT;
    DECLARE cur CURSOR FOR SELECT id FROM Users WHERE role='student';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO student_user_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 每个学生随机选3-6门课
        SET course_count = FLOOR(3 + RAND() * 4);
        SET i = 0;
        
        WHILE i < course_count DO
            -- 随机选择一门课程
            SET random_course_id = (SELECT id FROM Courses ORDER BY RAND() LIMIT 1);
            
            -- 检查是否已选过此课程
            IF NOT EXISTS (
                SELECT 1 FROM Enrollments 
                WHERE student_id = student_user_id AND course_id = random_course_id
            ) THEN
                INSERT INTO Enrollments (student_id, course_id, semester)
                VALUES (student_user_id, random_course_id, '2025-2026-1');
                SET i = i + 1;
            END IF;
        END WHILE;
    END LOOP;
    
    CLOSE cur;
END//
DELIMITER ;

CALL InsertEnrollments();
DROP PROCEDURE InsertEnrollments;

-- =========================================
-- 7. 插入作业 (每门课2-4个作业)
-- =========================================
INSERT INTO Assignments (course_id, title, description, assignment_type, due_date, max_score)
SELECT 
    c.id,
    CONCAT(c.course_name, ' - 作业', seq.n),
    CONCAT('完成', c.course_name, '第', seq.n, '章的练习题'),
    'homework',
    DATE_ADD(NOW(), INTERVAL (seq.n * 7) DAY),
    100
FROM Courses c
CROSS JOIN (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3) seq
WHERE c.id <= 20;

-- 插入期中/期末考试
INSERT INTO Assignments (course_id, title, description, assignment_type, due_date, max_score)
SELECT 
    id,
    CONCAT(course_name, ' - 期中考试'),
    CONCAT(course_name, '期中考试'),
    'exam',
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    100
FROM Courses
WHERE id <= 15;

INSERT INTO Assignments (course_id, title, description, assignment_type, due_date, max_score)
SELECT 
    id,
    CONCAT(course_name, ' - 期末考试'),
    CONCAT(course_name, '期末考试'),
    'exam',
    DATE_ADD(NOW(), INTERVAL 90 DAY),
    100
FROM Courses
WHERE id <= 15;

-- =========================================
-- 8. 插入部分作业提交记录 (30%的作业已提交)
-- =========================================
INSERT INTO Submissions (assignment_id, student_id, content, submitted_at)
SELECT 
    a.id,
    e.student_id,
    CONCAT('这是我对《', c.course_name, '》作业的回答...'),
    DATE_SUB(a.due_date, INTERVAL FLOOR(RAND() * 5) DAY)
FROM Assignments a
JOIN Courses c ON a.course_id = c.id
JOIN Enrollments e ON e.course_id = c.id
WHERE RAND() < 0.3 AND a.assignment_type = 'homework'
LIMIT 500;

-- =========================================
-- 9. 插入课程资料 (包含轮播图)
-- =========================================
INSERT INTO CourseMaterials (course_id, material_type, title, file_path_or_content, display_order, uploaded_by)
SELECT 
    c.id,
    'document',
    CONCAT(c.course_name, ' - 课程大纲'),
    CONCAT('/materials/syllabus_', c.course_code, '.pdf'),
    1,
    (SELECT teacher_id FROM TeachingAssignments WHERE course_id = c.id LIMIT 1)
FROM Courses c;

-- 为部分课程添加轮播图
INSERT INTO CourseMaterials (course_id, material_type, title, file_path_or_content, display_order, uploaded_by)
SELECT 
    c.id,
    'carousel_image',
    CONCAT(c.course_name, ' - 封面图'),
    CONCAT('/images/course_', c.id, '_banner.jpg'),
    0,
    (SELECT teacher_id FROM TeachingAssignments WHERE course_id = c.id LIMIT 1)
FROM Courses c
WHERE c.id <= 15;

-- =========================================
-- 10. 插入成绩项目和成绩
-- =========================================
INSERT INTO GradeItems (course_id, item_name, weight)
SELECT id, '平时成绩', 0.20 FROM Courses WHERE id <= 15
UNION ALL
SELECT id, '期中考试', 0.30 FROM Courses WHERE id <= 15
UNION ALL
SELECT id, '期末考试', 0.50 FROM Courses WHERE id <= 15;

-- 为已提交作业的学生打分
UPDATE Submissions 
SET score = FLOOR(60 + RAND() * 40),
    feedback = '完成得不错，继续努力！',
    graded_at = DATE_ADD(submitted_at, INTERVAL FLOOR(RAND() * 3) DAY)
WHERE RAND() < 0.5;

-- =========================================
-- 完成
-- =========================================
SELECT '样例数据生成完成！' AS message;
SELECT CONCAT('教师数量: ', COUNT(*)) AS info FROM Users WHERE role='teacher'
UNION ALL
SELECT CONCAT('学生数量: ', COUNT(*)) FROM Users WHERE role='student'
UNION ALL
SELECT CONCAT('课程数量: ', COUNT(*)) FROM Courses
UNION ALL
SELECT CONCAT('选课记录: ', COUNT(*)) FROM Enrollments
UNION ALL
SELECT CONCAT('作业数量: ', COUNT(*)) FROM Assignments
UNION ALL
SELECT CONCAT('作业提交: ', COUNT(*)) FROM Submissions;
