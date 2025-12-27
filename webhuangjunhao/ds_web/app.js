// 教师工作台 - API接口封装
const API_BASE = 'http://127.0.0.1:8000/api/v1';

// 获取认证token
function getToken() {
    return localStorage.getItem('teacher_token');
}

function setToken(token) {
    localStorage.setItem('teacher_token', token);
}

function clearToken() {
    localStorage.removeItem('teacher_token');
}

// 统一的API请求函数
async function apiFetch(path, options = {}) {
    const token = getToken();
    
    // 设置默认headers
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 处理请求体
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(`${API_BASE}${path}`, options);
        
        // 处理响应
        const data = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                data: data
            };
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 文件上传API
async function apiUpload(path, formData) {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                data: data
            };
        }
        
        return data;
    } catch (error) {
        console.error('文件上传失败:', error);
        throw error;
    }
}

// 用户认证相关
class AuthService {
    static async login(username, password) {
        return apiFetch('/auth/login', {
            method: 'POST',
            body: { username, password }
        });
    }
    
    static async getProfile() {
        return apiFetch('/me');
    }
    
    static logout() {
        clearToken();
    }
}

// 课程管理
class CourseService {
    static async getCourses() {
        return apiFetch('/courses');
    }
    
    static async getCourse(id) {
        return apiFetch(`/courses/${id}`);
    }
    
    static async createCourse(data) {
        return apiFetch('/courses', {
            method: 'POST',
            body: data
        });
    }
    
    static async updateCourse(id, data) {
        return apiFetch(`/courses/${id}`, {
            method: 'PUT',
            body: data
        });
    }
    
    static async updateCourseConfig(id, config) {
        return apiFetch(`/courses/${id}/config`, {
            method: 'PATCH',
            body: config
        });
    }
    
    static async publishCourse(id) {
        return apiFetch(`/courses/${id}/publish`, {
            method: 'POST'
        });
    }
    
    static async unpublishCourse(id) {
        return apiFetch(`/courses/${id}/unpublish`, {
            method: 'POST'
        });
    }
    
    static async deleteCourse(id) {
        return apiFetch(`/courses/${id}`, {
            method: 'DELETE'
        });
    }
}

// 课件管理
class MaterialService {
    static async getMaterials(courseId) {
        return apiFetch(`/courses/${courseId}/materials`);
    }
    
    static async uploadMaterial(courseId, formData) {
        return apiUpload(`/courses/${courseId}/materials`, formData);
    }
    
    static async deleteMaterial(materialId) {
        return apiFetch(`/materials/${materialId}`, {
            method: 'DELETE'
        });
    }
    
    static async updateCarouselOrder(courseId, order) {
        return apiFetch(`/courses/${courseId}/carousel-order`, {
            method: 'PUT',
            body: { order }
        });
    }
}

// 作业管理
class AssignmentService {
    static async getAssignments(courseId) {
        return apiFetch(`/courses/${courseId}/assignments`);
    }
    
    static async createAssignment(courseId, data) {
        return apiFetch(`/courses/${courseId}/assignments`, {
            method: 'POST',
            body: data
        });
    }
    
    static async getSubmissions(assignmentId) {
        return apiFetch(`/assignments/${assignmentId}/submissions`);
    }
    
    static async gradeSubmission(submissionId, grade) {
        return apiFetch(`/submissions/${submissionId}/grade`, {
            method: 'POST',
            body: { grade }
        });
    }
    
    static async batchGrade(assignmentId, grades) {
        return apiFetch(`/assignments/${assignmentId}/batch-grade`, {
            method: 'POST',
            body: { grades }
        });
    }
}

// 成绩管理
class GradeService {
    static async getGradeItems(courseId) {
        return apiFetch(`/courses/${courseId}/grade-items`);
    }
    
    static async createGradeItem(courseId, data) {
        return apiFetch(`/courses/${courseId}/grade-items`, {
            method: 'POST',
            body: data
        });
    }
    
    static async updateGradeItem(itemId, data) {
        return apiFetch(`/grade-items/${itemId}`, {
            method: 'PUT',
            body: data
        });
    }
    
    static async deleteGradeItem(itemId) {
        return apiFetch(`/grade-items/${itemId}`, {
            method: 'DELETE'
        });
    }
    
    static async getGrades(courseId) {
        return apiFetch(`/courses/${courseId}/grades`);
    }
    
    static async updateGrade(gradeId, score) {
        return apiFetch(`/grades/${gradeId}`, {
            method: 'PUT',
            body: { score }
        });
    }
    
    static async batchUpload(itemId, formData) {
        return apiUpload(`/grade-items/${itemId}/grades/batch-upload`, formData);
    }
    
    static async predictGrades(courseId) {
        return apiFetch(`/courses/${courseId}/predict-grades`);
    }
}

// 通知服务
class NotificationService {
    static async getNotifications() {
        return apiFetch('/notifications');
    }
    
    static async markAsRead(notificationId) {
        return apiFetch(`/notifications/${notificationId}/read`, {
            method: 'POST'
        });
    }
}

// 仪表盘统计
class DashboardService {
    static async getStats() {
        return apiFetch('/dashboard/stats');
    }
}

// 表单数据临时存储
class FormDataManager {
    static save(key, data) {
        const allData = JSON.parse(localStorage.getItem('temp_form_data') || '{}');
        allData[key] = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem('temp_form_data', JSON.stringify(allData));
    }
    
    static load(key) {
        const allData = JSON.parse(localStorage.getItem('temp_form_data') || '{}');
        return allData[key]?.data || null;
    }
    
    static clear(key) {
        const allData = JSON.parse(localStorage.getItem('temp_form_data') || '{}');
        delete allData[key];
        localStorage.setItem('temp_form_data', JSON.stringify(allData));
    }
    
    static clearAll() {
        localStorage.removeItem('temp_form_data');
    }
}

// 导出服务
window.API = {
    AuthService,
    CourseService,
    MaterialService,
    AssignmentService,
    GradeService,
    NotificationService,
    DashboardService,
    FormDataManager,
    apiFetch,
    apiUpload,
    getToken,
    setToken,
    clearToken
};