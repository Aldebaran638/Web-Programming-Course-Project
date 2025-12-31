#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试BuildDatabase.sql文件是否能正确执行
"""

import pymysql
import sys
import os

def test_sql_file():
    """测试SQL文件执行"""
    try:
        # 连接数据库（不指定数据库名）
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='123456',  # 请根据实际情况修改密码
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        print("✓ 成功连接到MySQL服务器")
        
        # 读取SQL文件
        sql_file_path = os.path.join(os.path.dirname(__file__), 'BuildDatabase.sql')
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"✓ 成功读取SQL文件: {sql_file_path}")
        
        # 分割SQL语句并执行
        cursor = connection.cursor()
        
        # 按分号分割SQL语句
        statements = []
        current_statement = []
        
        for line in sql_content.split('\n'):
            # 跳过空行和注释行
            stripped = line.strip()
            if not stripped or stripped.startswith('--'):
                continue
            
            current_statement.append(line)
            
            # 如果行以分号结尾，表示一个完整的语句
            if stripped.endswith(';'):
                statements.append('\n'.join(current_statement))
                current_statement = []
        
        # 如果还有未处理的语句
        if current_statement:
            statements.append('\n'.join(current_statement))
        
        print(f"✓ 共解析出 {len(statements)} 条SQL语句")
        
        # 执行所有SQL语句
        success_count = 0
        for i, statement in enumerate(statements, 1):
            try:
                cursor.execute(statement)
                success_count += 1
                if i % 10 == 0:
                    print(f"  已执行 {i}/{len(statements)} 条语句...")
            except Exception as e:
                print(f"\n✗ 第 {i} 条语句执行失败:")
                print(f"  语句: {statement[:100]}...")
                print(f"  错误: {e}")
                raise
        
        connection.commit()
        print(f"✓ 成功执行所有 {success_count} 条SQL语句")
        
        # 验证数据
        cursor.execute("USE `Web-Programming-Course-Project`")
        
        # 检查各表的记录数
        tables = [
            'Users', 'Classes', 'Courses', 'TeacherProfiles', 
            'StudentProfiles', 'TeachingAssignments', 'Enrollments',
            'Assignments', 'GradeItems', 'AssignmentSubmissions', 'Grades'
        ]
        
        print("\n数据验证:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM `{table}`")
            result = cursor.fetchone()
            print(f"  {table:25s} : {result['count']:4d} 条记录")
        
        cursor.close()
        connection.close()
        
        print("\n✓✓✓ SQL文件执行成功！数据库已刷新！ ✓✓✓")
        return True
        
    except Exception as e:
        print(f"\n✗✗✗ 执行失败: {e} ✗✗✗")
        return False

if __name__ == '__main__':
    success = test_sql_file()
    sys.exit(0 if success else 1)
