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
        return await response.json();
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