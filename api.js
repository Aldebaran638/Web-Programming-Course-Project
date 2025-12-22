// 模拟 API 服务
const apiService = {
    // 模拟数据
    mockData: {
        courses: [
            {
                id: 1,
                course_code: 'CS101',
                course_name: '数据结构',
                credits: 3.0,
                department: '计算机科学系',
                semester: '2024-2025-1',
                student_count: 45
            },
            {
                id: 2,
                course_code: 'CS102',
                course_name: '算法设计',
                credits: 3.5,
                department: '计算机科学系',
                semester: '2024-2025-1',
                student_count: 40
            },
            {
                id: 3,
                course_code: 'CS201',
                course_name: '数据库系统',
                credits: 4.0,
                department: '计算机科学系',
                semester: '2024-2025-2',
                student_count: 50
            }
        ],
        
        materials: [
            {
                id: 1,
                course_id: 1,
                title: '第一章：线性表',
                material_type: 'document',
                file_path_or_content: 'https://example.com/chapter1.pdf',
                created_at: '2024-09-01T10:00:00Z'
            },
            {
                id: 2,
                course_id: 1,
                title: '数据结构课程介绍',
                material_type: 'carousel_image',
                file_path_or_content: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
                created_at: '2024-09-01T09:00:00Z'
            },
            {
                id: 3,
                course_id: 1,
                title: '算法演示视频',
                material_type: 'video',
                file_path_or_content: 'https://example.com/demo.mp4',
                created_at: '2024-09-02T14:30:00Z'
            }
        ],
        
        assignments: [
            {
                id: 1,
                course_id: 1,
                title: '第一次作业：线性表实现',
                type: 'homework',
                description: '实现顺序表和链表的基本操作',
                deadline: '2024-09-15T23:59:00Z',
                submissions: [
                    { student_id: 1, submitted: true, graded: true, score: 90 },
                    { student_id: 2, submitted: true, graded: false, score: null },
                    { student_id: 3, submitted: false, graded: false, score: null }
                ]
            },
            {
                id: 2,
                course_id: 1,
                title: '期中考试',
                type: 'exam',
                description: '期中考核',
                deadline: '2024-10-20T23:59:00Z',
                submissions: [
                    { student_id: 1, submitted: true, graded: true, score: 85 },
                    { student_id: 2, submitted: true, graded: true, score: 92 },
                    { student_id: 3, submitted: true, graded: false, score: null }
                ]
            }
        ],
        
        gradeItems: [
            {
                id: 1,
                course_id: 1,
                item_name: '平时作业',
                weight: 0.3,
                description: '共5次作业，取平均分'
            },
            {
                id: 2,
                course_id: 1,
                item_name: '期中考试',
                weight: 0.3,
                description: '闭卷考试'
            },
            {
                id: 3,
                course_id: 1,
                item_name: '期末考试',
                weight: 0.4,
                description: '闭卷考试'
            }
        ],
        
        students: [
            {
                id: 1,
                student_id_number: '2024001',
                full_name: '张三',
                class_name: '计算机2101班'
            },
            {
                id: 2,
                student_id_number: '2024002',
                full_name: '李四',
                class_name: '计算机2101班'
            },
            {
                id: 3,
                student_id_number: '2024003',
                full_name: '王五',
                class_name: '计算机2102班'
            },
            {
                id: 4,
                student_id_number: '2024004',
                full_name: '赵六',
                class_name: '计算机2102班'
            },
            {
                id: 5,
                student_id_number: '2024005',
                full_name: '钱七',
                class_name: '计算机2101班'
            }
        ],
        
        grades: {
            1: { 1: { score: 90 }, 2: { score: 85 }, 3: { score: 88 } },
            2: { 1: { score: 85 }, 2: { score: 92 }, 3: { score: 90 } },
            3: { 1: { score: 78 }, 2: { score: 80 }, 3: { score: 75 } },
            4: { 1: { score: 92 }, 2: { score: 95 }, 3: { score: 91 } },
            5: { 1: { score: 65 }, 2: { score: 70 }, 3: { score: 68 } }
        }
    },

    // 模拟 API 延迟
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // 获取教师所授课程
    async getTeacherCourses(teacherId) {
        await this.delay(500);
        return this.mockData.courses;
    },

    // 获取课程课件
    async getCourseMaterials(courseId) {
        await this.delay(300);
        return this.mockData.materials.filter(m => m.course_id == courseId);
    },

    // 获取作业列表
    async getAssignments(courseId) {
        await this.delay(400);
        return this.mockData.assignments.filter(a => a.course_id == courseId);
    },

    // 获取成绩构成
    async getGradeItems(courseId) {
        await this.delay(300);
        return this.mockData.gradeItems.filter(g => g.course_id == courseId);
    },

    // 获取课程学生
    async getCourseStudents(courseId) {
        await this.delay(400);
        // 模拟返回当前课程的学生
        return this.mockData.students.slice(0, 3);
    },

    // 上传课件
    async uploadMaterials(courseId, formData) {
        await this.delay(1000);
        
        // 模拟创建新课件
        const newMaterials = [];
        for (let i = 0; i < 3; i++) { // 假设上传了3个文件
            const newMaterial = {
                id: this.mockData.materials.length + 1 + i,
                course_id: courseId,
                title: `新课件 ${i + 1}`,
                material_type: 'document',
                file_path_or_content: 'https://example.com/new-file.pdf',
                created_at: new Date().toISOString()
            };
            newMaterials.push(newMaterial);
        }
        
        this.mockData.materials.push(...newMaterials);
        return newMaterials;
    },

    // 更新轮播图顺序
    async updateCarouselOrder(courseId, orderedIds) {
        await this.delay(800);
        console.log('更新轮播图顺序:', orderedIds);
        return { success: true };
    },

    // 删除课件
    async deleteMaterial(materialId) {
        await this.delay(600);
        this.mockData.materials = this.mockData.materials.filter(
            m => m.id != materialId
        );
        return { success: true };
    },

    // 从轮播图移除
    async removeFromCarousel(materialId) {
        await this.delay(600);
        const material = this.mockData.materials.find(m => m.id == materialId);
        if (material) {
            material.material_type = 'image';
        }
        return { success: true };
    },

    // 更新课程配置
    async updateCourseConfig(courseId, config) {
        await this.delay(800);
        console.log('更新课程配置:', config);
        return { success: true };
    },

    // 添加课程
    async addCourse(courseData) {
        await this.delay(800);
        const newCourse = {
            id: this.mockData.courses.length + 1,
            ...courseData,
            student_count: 0
        };
        this.mockData.courses.push(newCourse);
        return newCourse;
    },

    // 添加作业
    async addAssignment(assignmentData) {
        await this.delay(800);
        const newAssignment = {
            id: this.mockData.assignments.length + 1,
            ...assignmentData,
            submissions: []
        };
        this.mockData.assignments.push(newAssignment);
        return newAssignment;
    },

    // 设置成绩构成
    async setGradeItems(courseId, items) {
        await this.delay(800);
        // 清空原有项目，添加新项目
        this.mockData.gradeItems = this.mockData.gradeItems.filter(
            g => g.course_id != courseId
        );
        
        items.forEach((item, index) => {
            this.mockData.gradeItems.push({
                id: this.mockData.gradeItems.length + 1,
                course_id: courseId,
                ...item
            });
        });
        
        return { success: true };
    },

    // 更新成绩
    async updateGrade(gradeData) {
        await this.delay(500);
        
        const { student_id, grade_item_id, score } = gradeData;
        
        if (!this.mockData.grades[student_id]) {
            this.mockData.grades[student_id] = {};
        }
        
        this.mockData.grades[student_id][grade_item_id] = { score };
        return { success: true };
    },

    // 成绩预测
    async predictGrades(courseId) {
        await this.delay(1500);
        
        return {
            accuracy: 87.5,
            high_risk_count: 1,
            details: [
                {
                    student_name: '张三',
                    current_average: 87.7,
                    predicted_average: 86.5,
                    risk_level: 'normal'
                },
                {
                    student_name: '李四',
                    current_average: 89.0,
                    predicted_average: 88.2,
                    risk_level: 'normal'
                },
                {
                    student_name: '王五',
                    current_average: 77.7,
                    predicted_average: 75.3,
                    risk_level: 'high'
                }
            ]
        };
    }
};