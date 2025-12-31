// 教师端API集成
const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok && response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../aldebaran/page.html';
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        return null;
    }
}

// 获取教师授课列表
async function getTeachingAssignments() {
    return await apiRequest('/me/teaching-assignments');
}

// 获取课程详情
async function getCourseDetail(courseId) {
    return await apiRequest(`/courses/${courseId}`);
}

// 创建课程
async function createCourse(courseData) {
    return await apiRequest('/courses', 'POST', courseData);
}

// 创建作业
async function createAssignment(courseId, assignmentData) {
    return await apiRequest(`/courses/${courseId}/assignments`, 'POST', assignmentData);
}

// 获取作业列表
async function getAssignments(courseId) {
    return await apiRequest(`/courses/${courseId}/assignments`);
}

// 获取作业提交情况
async function getSubmissions(assignmentId) {
    return await apiRequest(`/assignments/${assignmentId}/submissions`);
}

// 批改作业
async function gradeSubmission(submissionId, gradeData) {
    return await apiRequest(`/assignment-submissions/${submissionId}`, 'PUT', gradeData);
}

// 获取课程资料
async function getMaterials(courseId) {
    return await apiRequest(`/courses/${courseId}/materials`);
}
