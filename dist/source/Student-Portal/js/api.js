// API配置
const API_BASE_URL = 'http://localhost:8000/api/v1';

// 通用请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // 对于无内容响应（如 204 No Content），直接返回 null，避免 JSON 解析错误
        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }

        // 非 JSON 响应，返回 null，由调用方自行决定是否处理
        return null;
    } catch (error) {
        console.error('API请求错误:', error);
        showMessage('网络错误，请稍后重试', 'error');
    }
}

// 登录相关API
function login(username, password) {
    return apiRequest('/auth/login', 'POST', { username, password });
}

// 课程相关API
function getCourses(page = 1, search = '') {
    let endpoint = `/courses?page=${page}&pageSize=10`;
    if (search) {
        endpoint += `&course_name=${encodeURIComponent(search)}`;
    }
    return apiRequest(endpoint);
}

function getCourseDetail(id) {
    return apiRequest(`/courses/${id}`);
}

function enrollCourse(courseId, semester) {
    return apiRequest('/enrollments', 'POST', {
        course_id: courseId,
        semester: semester
    });
}

// 退课API
function withdrawEnrollment(enrollmentId) {
    return apiRequest(`/enrollments/${enrollmentId}`, 'DELETE');
}

// 我的课程API
function getMyCourses(semester = '') {
    let endpoint = '/me/enrollments';
    if (semester) {
        endpoint += `?semester=${semester}`;
    }
    return apiRequest(endpoint);
}

// 任务相关API
function getCourseTasks(enrollmentId, status = '') {
    let endpoint = `/me/enrollments/${enrollmentId}/tasks`;
    if (status) {
        endpoint += `?status=${status}`;
    }
    return apiRequest(endpoint);
}

// 作业/考试相关API
function getEnrollmentAssignments(enrollmentId) {
    return apiRequest(`/me/enrollments/${enrollmentId}/assignments`);
}

// 课程资料相关API
function getEnrollmentMaterials(enrollmentId) {
    return apiRequest(`/me/enrollments/${enrollmentId}/materials`);
}

async function submitAssignmentRequest(assignmentId, formData) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/submit`, {
            method: 'POST',
            headers,
            body: formData
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('作业提交请求错误:', error);
        showMessage('网络错误，请稍后重试', 'error');
    }
}

// 成绩相关API
function getGradesSummary(semester = '') {
    let endpoint = '/me/grades/summary';
    if (semester) {
        endpoint += `?semester=${semester}`;
    }
    return apiRequest(endpoint);
}

function getCourseGrades(enrollmentId) {
    return apiRequest(`/me/enrollments/${enrollmentId}/grades`);
}