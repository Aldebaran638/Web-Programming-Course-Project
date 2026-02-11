// API接口定义和对接实现
class ApiService {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:8000/api/v1';
        this.token = localStorage.getItem('token');
    }
    
    // ==================== 班级管理API ====================
    
    // 获取班级列表
    async getClasses(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/classes?${queryParams}`);
    }
    
    // 获取单个班级
    async getClass(id) {
        return this.request(`/classes/${id}`);
    }
    
    // 创建班级
    async createClass(data) {
        return this.request('/classes', 'POST', data);
    }
    
    // 更新班级
    async updateClass(id, data) {
        return this.request(`/classes/${id}`, 'PUT', data);
    }
    
    // 删除班级
    async deleteClass(id) {
        return this.request(`/classes/${id}`, 'DELETE');
    }
    
    // ==================== 学生管理API ====================
    
    // 获取学生列表
    async getStudents(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/students?${queryParams}`);
    }
    
    // 获取单个学生
    async getStudent(id) {
        return this.request(`/students/${id}`);
    }
    
    // 创建学生
    async createStudent(data) {
        return this.request('/students', 'POST', data);
    }
    
    // 更新学生
    async updateStudent(id, data) {
        return this.request(`/students/${id}`, 'PUT', data);
    }
    
    // 删除学生
    async deleteStudent(id) {
        return this.request(`/students/${id}`, 'DELETE');
    }
    
    // 批量导入学生
    async batchImportStudents(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.request('/users/batch-create-students', 'POST', formData, false);
    }
    
    // ==================== 教师管理API ====================
    
    // 获取教师列表
    async getTeachers(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/teachers?${queryParams}`);
    }
    
    // 获取单个教师
    async getTeacher(id) {
        return this.request(`/teachers/${id}`);
    }
    
    // 创建教师
    async createTeacher(data) {
        return this.request('/teachers', 'POST', data);
    }
    
    // 更新教师
    async updateTeacher(id, data) {
        return this.request(`/teachers/${id}`, 'PUT', data);
    }
    
    // 删除教师
    async deleteTeacher(id) {
        return this.request(`/teachers/${id}`, 'DELETE');
    }
    
    // ==================== 课程管理API ====================
    
    // 获取课程列表
    async getCourses(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/courses?${queryParams}`);
    }
    
    // 获取单个课程
    async getCourse(id) {
        return this.request(`/courses/${id}`);
    }
    
    // 创建课程（管理员）
    async createCourse(data) {
        return this.request('/courses', 'POST', data);
    }
    
    // 更新课程（管理员）
    async updateCourse(id, data) {
        return this.request(`/courses/${id}`, 'PUT', data);
    }
    
    // 删除课程（管理员）
    async deleteCourse(id) {
        return this.request(`/courses/${id}`, 'DELETE');
    }
    
    // ==================== 教室管理API ====================
    
    // 获取教室列表
    async getClassrooms(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/classrooms?${queryParams}`);
    }
    
    // 获取单个教室
    async getClassroom(id) {
        return this.request(`/classrooms/${id}`);
    }
    
    // 创建教室
    async createClassroom(data) {
        return this.request('/classrooms', 'POST', data);
    }
    
    // 更新教室
    async updateClassroom(id, data) {
        return this.request(`/classrooms/${id}`, 'PUT', data);
    }
    
    // 删除教室
    async deleteClassroom(id) {
        return this.request(`/classrooms/${id}`, 'DELETE');
    }
    
    // ==================== 教学安排API ====================
    
    // 创建授课任务
    async createTeachingAssignment(data) {
        return this.request('/teaching-assignments', 'POST', data);
    }
    
    // 创建课程安排
    async createCourseSchedule(data) {
        return this.request('/course-schedules', 'POST', data);
    }
    
    // ==================== 成绩审核API ====================
    
    // 获取待审核成绩
    async getPendingReview() {
        return this.request('/grades/pending-review');
    }

    // ==================== 成绩审核API ====================

    // 获取待审核成绩列表
    async getPendingGradeReviews(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/grades/pending-review?${queryParams}`);
    }

    // 获取课程成绩详情
    async getCourseGradeDetails(courseId) {
        return this.request(`/courses/${courseId}/grades`);
    }

    // 获取课程异常警告
    async getCourseGradeWarnings(courseId) {
        return this.request(`/courses/${courseId}/warnings`);
    }

    // 审核通过单个课程
    async approveCourseGrades(courseId) {
        return this.request(`/grades/${courseId}/approve`, 'POST');
    }

    // 批量审核通过
    async batchApproveCourseGrades(courseIds) {
        return this.request('/grades/batch-approve', 'POST', { course_ids: courseIds });
    }

    // 退回成绩修改
    async rejectCourseGrades(courseId, reason) {
        return this.request(`/grades/${courseId}/reject`, 'POST', { reason });
    }

    // 批量退回成绩
    async batchRejectCourseGrades(courseIds, reason) {
        return this.request('/grades/batch-reject', 'POST', { 
            course_ids: courseIds,
            reason: reason 
        });
    }

    // 发布成绩
    async publishGrades(courseIds) {
        return this.request('/grades/publish', 'POST', { course_ids: courseIds });
    }

    // 获取可发布成绩列表
    async getPublishableGrades(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/grades/publishable?${queryParams}`);
    }

    // 获取成绩发布历史
    async getGradePublishHistory(courseId) {
        return this.request(`/courses/${courseId}/publish-history`);
    }

    // 撤回已发布的成绩
    async revokePublishedGrades(courseId) {
        return this.request(`/grades/${courseId}/revoke`, 'POST');
    }
    // ==================== 系统管理API ====================
    
    // 查询日志
    async getLogs(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...params
        });
        
        return this.request(`/logs?${queryParams}`);
    }
    
    // ==================== 通用请求方法 ====================
    
    async request(endpoint, method = 'GET', data = null, isJson = true) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        };
        
        if (data) {
            if (isJson) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            } else {
                options.body = data; // FormData
            }
        }
        
        try {
            const response = await fetch(url, options);
            
            if (response.status === 401) {
                // 未授权，清理凭证并跳转到统一网关登录页
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '../aldebaran/page.html';
                throw new Error('会话已过期，请重新登录');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `请求失败: ${response.status}`);
            }
            
            // 对于204 No Content响应，直接返回
            if (response.status === 204) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API请求失败 ${endpoint}:`, error);
            throw error;
        }
    }
    
    // 更新token
    setToken(token) {
        this.token = token;
    }
}

// 全局API服务实例
const apiService = new ApiService();
window.apiService = apiService;