// 通用工具函数

// 显示消息
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-' + type;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 当前学期
let semester = '2025-2026-1';

// 课程浏览页面功能
let currentPage = 1;
let totalPages = 1;
let enrolledCourseIds = new Set(); // 存储已选课程ID

async function loadCourses() {
    const search = document.getElementById('searchInput')?.value || '';
    
    // 同时获取课程列表和已选课程
    const [coursesResult, myCourses] = await Promise.all([
        getCourses(currentPage, search),
        getMyCourses()
    ]);

    myCourses.forEach(x => {
        coursesResult.courses.push(x.course);
    }); 

    // 处理已选课程ID
    if (myCourses && Array.isArray(myCourses)) {
        enrolledCourseIds = new Set(myCourses.map(item => item.course.id));
    }
    
    if (coursesResult && coursesResult.courses) {
        displayCourses(coursesResult.courses);
        updatePagination(coursesResult.pagination);
    }
}

function displayCourses(courses) {
    const courseList = document.getElementById('courseList');
    if (!courseList) return;
    
    courseList.innerHTML = '';
    
    courses.forEach(course => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <h3>${course.course_name}</h3>
            <p class="course-info">课程编号：${course.course_code}</p>
            <p class="course-info">学分：${course.credits}</p>
            <p class="course-info">院系：${course.department || '未指定'}</p>
            <p class="course-info">授课教师：${course.teachers.map(t => t.full_name).join(', ')}</p>
            ${isEnrolled ? 
                `<button class="btn-enrolled" onclick="showWithdrawModal(${course.id}, '${course.course_name}')">已选</button>` :
                `<button class="btn-enroll" onclick="showEnrollModal(${course.id}, '${course.course_name}')">选修</button>`
            }
        `;
        courseList.appendChild(courseCard);
    });
}

function displayMyCourses(courses) {
    const courseList = document.getElementById('myCourseList');
    if (!courseList) return;
    
    courseList.innerHTML = '';
    courses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'my-course-item';
        courseItem.innerHTML = `
            <div>
                <h3>${course.course.course_name}</h3>
                <p class="course-meta">教师：${course.course.teachers[0]?.full_name || '未指定'}</p>
                <p class="course-meta">学期：${course.semester}</p>
            </div>
            <button class="btn-study" onclick="viewCourseDetail(${course.enrollment_id})">
                详情
            </button>
        `;
        courseList.appendChild(courseItem);
    });
}

function updatePagination(pagination) {
    if (pagination) {
        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;
        document.getElementById('pageInfo').textContent = `第${currentPage}页，共${totalPages}页`;
    }
}

function searchCourses() {
    currentPage = 1;
    loadCourses();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadCourses();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadCourses();
    }
}

// 选课功能
let selectedCourseId = null;

function showWithdrawModal(courseId, courseName) {
    selectedCourseId = courseId;
    document.getElementById('modalCourseName').textContent = `确定要取消选修《${courseName}》吗？`;
    document.getElementById('enrollModal').style.display = 'flex';
}

function showEnrollModal(courseId, courseName) {
    selectedCourseId = courseId;
    document.getElementById('modalCourseName').textContent = `确定要选修《${courseName}》吗？`;
    document.getElementById('enrollModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('enrollModal').style.display = 'none';
}

async function confirmEnroll() {
    try {
        const result = await enrollCourse(selectedCourseId, semester);
        if (result && result.id) {
            showMessage('操作成功！', 'success');
            closeModal();
            loadCourses();
        }
    } catch (error) {
        showMessage('操作失败', 'error');
    }
}

// 我的课程页面功能
async function loadMyCourses() {
    const courses = await getMyCourses(semester);
    
    if (courses && Array.isArray(courses)) {
        displayMyCourses(courses);
    }
}

function viewCourseDetail(enrollmentId) {
    localStorage.setItem('currentEnrollmentId', enrollmentId);
    window.location.href = 'course-detail.html';
}

// 课程详情页面功能
let currentEnrollmentId = null;
let currentTasks = [];
let currentFilter = 'all';

async function loadCourseDetail() {
    currentEnrollmentId = localStorage.getItem('currentEnrollmentId');
    if (!currentEnrollmentId) {
        window.location.href = 'my-courses.html';
        return;
    }
    
    // 这里可以根据enrollmentId获取课程详情
    // 目前使用模拟数据
    document.getElementById('courseTitle').textContent = '计算机科学导论';
    document.getElementById('teacherName').textContent = '张三教授';
    document.getElementById('courseSemester').textContent = '2025-2026-1';
    
    loadTasks();
}

async function loadTasks() {
    if (!currentEnrollmentId) return;
    
    const tasks = await getCourseTasks(currentEnrollmentId);
    if (tasks && Array.isArray(tasks)) {
        currentTasks = tasks;
        filterTasks(currentFilter);
    }
}

function filterTasks(status) {
    currentFilter = status;
    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.name === status)
            btn.classList.add('active');
    });
    
    displayTasks(currentTasks.filter(task => {
        if (status === 'all') return true;
        return task.status === status;
    }));
}

function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <div>
                <h4>${task.material.title}</h4>
                <p>类型：${task.material.material_type}</p>
            </div>
            <span class="task-status status-${task.status}">
                ${task.status === 'todo' ? '待完成' : '已完成'}
            </span>
        `;
        taskItem.onclick = () => showTaskModal(task);
        taskList.appendChild(taskItem);
    });
}

function showTaskModal(task) {
    document.getElementById('taskTitle').textContent = task.material.title;
    document.getElementById('taskContent').innerHTML = `
        <p>任务ID：${task.task_progress_id}</p>
        <p>类型：${task.material.material_type}</p>
        <p>状态：${task.status === 'todo' ? '待完成' : '已完成'}</p>
    `;
    
    const completeBtn = document.getElementById('completeBtn');
    if (task.status === 'done') {
        completeBtn.style.display = 'none';
    } else {
        completeBtn.style.display = 'block';
    }
    
    document.getElementById('taskModal').style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
}

function markTaskComplete() {
    showMessage('任务标记为完成', 'success');
    closeTaskModal();
    loadTasks();
}

// 成绩页面功能
async function loadGrades() {
    const semester = document.getElementById('semesterFilter')?.value || '';
    const result = await getGradesSummary(semester);
    
    if (result) {
        displayGrades(result, semester);
    }
}

function displayGrades(data, selectedSemester) {
    // 获取当前学期数据
    let semesterData;
    if (selectedSemester && data[selectedSemester]) {
        semesterData = data[selectedSemester];
    } else {
        // 如果没有指定学期，显示第一个学期
        const firstKey = Object.keys(data)[0];
        semesterData = data[firstKey];
    }
    
    if (!semesterData) return;
    
    // 更新概览数据
    document.getElementById('gpaValue').textContent = semesterData.semester_gpa.toFixed(2);
    document.getElementById('totalCredits').textContent = semesterData.total_credits;
    
    // 计算平均分
    const averageScore = semesterData.courses.reduce((sum, course) => 
        sum + course.final_score, 0) / semesterData.courses.length;
    document.getElementById('averageScore').textContent = averageScore.toFixed(1);
    
    // 显示成绩表格
    const tableBody = document.getElementById('gradeTableBody');
    tableBody.innerHTML = '';
    
    semesterData.courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.course_name}</td>
            <td>${course.credits}</td>
            <td>${course.final_score}</td>
            <td>${course.gpa}</td>
            <td><button class="btn-view-detail" onclick="showGradeDetail(${course.enrollment_id})">查看详情</button></td>
        `;
        tableBody.appendChild(row);
    });
}

let currentGradeDetail = null;

async function showGradeDetail(enrollmentId) {
    // 调用后端接口获取真实成绩详情
    const detail = await getCourseGrades(enrollmentId);
    if (!detail) return;
    currentGradeDetail = detail;
    displayGradeDetail();
}

function displayGradeDetail() {
    if (!currentGradeDetail) return;

    document.getElementById('detailCourseName').textContent = `${currentGradeDetail.course_name} - 成绩详情`;
    
    const detailBody = document.getElementById('gradeDetailBody');
    detailBody.innerHTML = '';
    
    (currentGradeDetail.grade_items || []).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.item_name}</td>
            <td>${(item.weight * 100)}%</td>
            <td>${item.score != null ? item.score : '-'}</td>
        `;
        detailBody.appendChild(row);
    });
    
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td><strong>最终成绩</strong></td>
        <td><strong>100%</strong></td>
        <td><strong>${currentGradeDetail.final_score}</strong></td>
    `;
    detailBody.appendChild(totalRow);
    
    document.getElementById('gradeDetail').style.display = 'block';
    document.getElementById('gradeTable').style.display = 'none';
}

function hideGradeDetail() {
    document.getElementById('gradeDetail').style.display = 'none';
    document.getElementById('gradeTable').style.display = 'table';
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // 根据当前页面初始化相应功能
    const path = window.location.pathname;
    
    if (path.includes('course-browse.html')) {
        loadCourses();
    } else if (path.includes('my-courses.html')) {
        loadMyCourses();
    } else if (path.includes('course-detail.html')) {
        loadCourseDetail();
    } else if (path.includes('grades.html')) {
        loadGrades();
    } else if (path.includes('index.html')) {
        // 加载待完成任务
        // 这里可以添加加载待完成任务的代码
    }
});

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    .message-info {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    .message-success {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    .message-error {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);