-- SQL验证脚本：检查BuildDatabase.sql执行后的数据完整性

-- 切换到目标数据库
USE `Web-Programming-Course-Project`;

-- 1. 检查用户总数（应该有4个demo用户 + 100个学生 + 10个教师 = 114个用户）
SELECT 
    '用户总数' AS 检查项,
    COUNT(*) AS 实际数量,
    114 AS 预期数量,
    CASE WHEN COUNT(*) = 114 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Users`;

-- 2. 检查学生用户数（应该有100个批量学生 + 1个demo学生 = 101个）
SELECT 
    '学生用户数' AS 检查项,
    COUNT(*) AS 实际数量,
    101 AS 预期数量,
    CASE WHEN COUNT(*) = 101 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Users`
WHERE `role` = 'student';

-- 3. 检查教师用户数（应该有10个批量教师 + 1个demo教师 = 11个）
SELECT 
    '教师用户数' AS 检查项,
    COUNT(*) AS 实际数量,
    11 AS 预期数量,
    CASE WHEN COUNT(*) = 11 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Users`
WHERE `role` = 'teacher';

-- 4. 检查学生档案数（应该有10个初始档案 + 90个补充档案 = 100个）
SELECT 
    '学生档案数' AS 检查项,
    COUNT(*) AS 实际数量,
    101 AS 预期数量,
    CASE WHEN COUNT(*) = 101 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `StudentProfiles`;

-- 5. 检查教师档案数（应该有1个demo + 10个批量 = 11个）
SELECT 
    '教师档案数' AS 检查项,
    COUNT(*) AS 实际数量,
    11 AS 预期数量,
    CASE WHEN COUNT(*) = 11 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `TeacherProfiles`;

-- 6. 检查课程数（应该有2个demo课程 + 20个批量课程 = 22个）
SELECT 
    '课程数' AS 检查项,
    COUNT(*) AS 实际数量,
    22 AS 预期数量,
    CASE WHEN COUNT(*) = 22 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Courses`;

-- 7. 检查选课记录数
SELECT 
    '选课记录数' AS 检查项,
    COUNT(*) AS 实际数量,
    '应该 > 200' AS 预期数量,
    CASE WHEN COUNT(*) > 200 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Enrollments`;

-- 8. 检查成绩项数（demo课程4个 + 批量课程每门2个 = 4 + 40 = 44个）
SELECT 
    '成绩项数' AS 检查项,
    COUNT(*) AS 实际数量,
    44 AS 预期数量,
    CASE WHEN COUNT(*) = 44 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `GradeItems`;

-- 9. 检查作业数
SELECT 
    '作业数' AS 检查项,
    COUNT(*) AS 实际数量,
    '应该 > 20' AS 预期数量,
    CASE WHEN COUNT(*) > 20 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Assignments`;

-- 10. 检查成绩记录数
SELECT 
    '成绩记录数' AS 检查项,
    COUNT(*) AS 实际数量,
    '应该 > 100' AS 预期数量,
    CASE WHEN COUNT(*) > 100 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Grades`;

-- 11. 验证外键约束：检查所有TeacherProfiles的user_id是否都存在于Users表
SELECT 
    '教师档案外键' AS 检查项,
    COUNT(*) AS 无效记录数,
    0 AS 预期数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `TeacherProfiles` tp
LEFT JOIN `Users` u ON tp.user_id = u.id
WHERE u.id IS NULL;

-- 12. 验证外键约束：检查所有StudentProfiles的user_id是否都存在于Users表
SELECT 
    '学生档案外键' AS 检查项,
    COUNT(*) AS 无效记录数,
    0 AS 预期数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `StudentProfiles` sp
LEFT JOIN `Users` u ON sp.user_id = u.id
WHERE u.id IS NULL;

-- 13. 验证Grades表的grade_item_id是否都有效
SELECT 
    '成绩外键' AS 检查项,
    COUNT(*) AS 无效记录数,
    0 AS 预期数量,
    CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Grades` g
LEFT JOIN `GradeItems` gi ON g.grade_item_id = gi.id
WHERE gi.id IS NULL;

-- 14. 检查是否有student011的数据
SELECT 
    'student011存在性' AS 检查项,
    COUNT(*) AS 实际数量,
    1 AS 预期数量,
    CASE WHEN COUNT(*) = 1 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Users`
WHERE `username` = 'student011';

-- 15. 检查所有student001-student100是否都存在
SELECT 
    '学生001-100完整性' AS 检查项,
    COUNT(*) AS 实际数量,
    100 AS 预期数量,
    CASE WHEN COUNT(*) = 100 THEN '✓ 通过' ELSE '✗ 失败' END AS 状态
FROM `Users`
WHERE `username` REGEXP '^student[0-9]{3}$';

-- 16. 汇总统计
SELECT '========== 数据汇总统计 ==========' AS '';
SELECT 
    '表名' AS 表名,
    (SELECT COUNT(*) FROM `Users`) AS Users,
    (SELECT COUNT(*) FROM `Classes`) AS Classes,
    (SELECT COUNT(*) FROM `StudentProfiles`) AS StudentProfiles,
    (SELECT COUNT(*) FROM `TeacherProfiles`) AS TeacherProfiles,
    (SELECT COUNT(*) FROM `Courses`) AS Courses,
    (SELECT COUNT(*) FROM `Enrollments`) AS Enrollments,
    (SELECT COUNT(*) FROM `Assignments`) AS Assignments,
    (SELECT COUNT(*) FROM `GradeItems`) AS GradeItems,
    (SELECT COUNT(*) FROM `Grades`) AS Grades,
    (SELECT COUNT(*) FROM `AssignmentSubmissions`) AS Submissions;
