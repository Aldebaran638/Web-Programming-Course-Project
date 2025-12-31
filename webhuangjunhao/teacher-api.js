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

// 编辑作业
async function updateAssignment(assignmentId, assignmentData) {
    return await apiRequest(`/assignments/${assignmentId}`, 'PATCH', assignmentData);
}

// 删除作业
async function deleteAssignment(assignmentId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.ok;
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

// 创建课程资料
async function createMaterial(courseId, materialData) {
    return await apiRequest(`/courses/${courseId}/materials`, 'POST', materialData);
}

// 编辑课程资料
async function updateMaterial(materialId, materialData) {
    return await apiRequest(`/course-materials/${materialId}`, 'PATCH', materialData);
}

// 删除课程资料
async function deleteMaterial(materialId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/course-materials/${materialId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.ok;
}

// ========== 成绩管理API ==========

// 获取课程成绩项
async function getGradeItems(courseId) {
    return await apiRequest(`/courses/${courseId}/grade-items`);
}

// 创建成绩项
async function createGradeItem(courseId, itemData) {
    return await apiRequest(`/courses/${courseId}/grade-items`, 'POST', itemData);
}

// 更新成绩项
async function updateGradeItem(itemId, itemData) {
    return await apiRequest(`/grade-items/${itemId}`, 'PUT', itemData);
}

// 删除成绩项
async function deleteGradeItem(itemId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/grade-items/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.ok;
}

// 批量设置成绩项
async function batchUpdateGradeItems(courseId, items) {
    return await apiRequest(`/courses/${courseId}/grade-items/batch`, 'POST', { items });
}

// 获取课程所有学生成绩
async function getCourseGrades(courseId) {
    return await apiRequest(`/courses/${courseId}/grades`);
}

// 创建或更新学生成绩
async function createOrUpdateGrade(enrollmentId, gradeData) {
    return await apiRequest(`/enrollments/${enrollmentId}/grades`, 'POST', gradeData);
}

// 更新单个成绩
async function updateGrade(gradeId, gradeData) {
    return await apiRequest(`/grades/${gradeId}`, 'PUT', gradeData);
}
