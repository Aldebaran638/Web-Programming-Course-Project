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
let courseIdToEnrollmentId = new Map(); // 课程ID到选课记录ID的映射

async function loadCourses() {
    const search = document.getElementById('searchInput')?.value || '';
    
    // 同时获取课程列表和已选课程
    const [coursesResult, myCourses] = await Promise.all([
        getCourses(currentPage, search),
        getMyCourses()
    ]);
    
    // 处理已选课程信息
    if (myCourses && Array.isArray(myCourses)) {
        enrolledCourseIds = new Set(myCourses.map(item => item.course.id));
        courseIdToEnrollmentId = new Map(myCourses.map(item => [item.course.id, item.enrollment_id]));
    } else {
        enrolledCourseIds = new Set();
        courseIdToEnrollmentId = new Map();
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
    
    if (!courses || courses.length === 0) {
        courseList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无已选课程</p></div>';
        return;
    }
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.innerHTML = `
            <div class="course-cover">
                <i class="fas fa-book-open"></i>
            </div>
            <div class="course-info-box">
                <h3>${course.course.course_name}</h3>
                <p class="course-meta">
                    <i class="fas fa-chalkboard-teacher"></i> 
                    ${course.course.teachers && course.course.teachers[0] ? course.course.teachers[0].full_name : '未指定'}
                </p>
                <p class="course-meta">
                    <i class="fas fa-calendar"></i> ${course.semester}
                </p>
            </div>
            <div class="course-actions">
                <button class="btn-primary btn-sm" onclick="viewCourseDetail(${course.enrollment_id})">
                    <i class="fas fa-arrow-right"></i> 进入学习
                </button>
            </div>
        `;
        courseList.appendChild(courseCard);
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
let selectedAction = 'enroll'; // enroll 或 withdraw

function showWithdrawModal(courseId, courseName) {
    selectedCourseId = courseId;
    selectedAction = 'withdraw';
    document.getElementById('modalCourseName').textContent = `确定要取消选修《${courseName}》吗？`;
    document.getElementById('enrollModal').classList.add('show');
}

function showEnrollModal(courseId, courseName) {
    selectedCourseId = courseId;
    selectedAction = 'enroll';
    document.getElementById('modalCourseName').textContent = `确定要选修《${courseName}》吗？`;
    document.getElementById('enrollModal').classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('enrollModal');
    modal.classList.remove('show');
    modal.style.display = ''; // 清除内联样式
}

async function confirmEnroll() {
    try {
        if (selectedAction === 'withdraw') {
            const enrollmentId = courseIdToEnrollmentId.get(selectedCourseId);
            if (!enrollmentId) {
                showMessage('未找到该课程的选课记录，无法退课', 'error');
                return;
            }

            await withdrawEnrollment(enrollmentId);
            showMessage('退课成功！', 'success');
            closeModal();
            loadCourses();
        } else {
            const result = await enrollCourse(selectedCourseId, semester);
            if (result && result.id) {
                showMessage('选课成功！', 'success');
                closeModal();
                loadCourses();
            } else {
                showMessage('选课失败', 'error');
            }
        }
    } catch (error) {
        showMessage('操作失败', 'error');
    }
}

// 我的课程页面功能
async function loadMyCourses() {
    const semesterFilter = document.getElementById('semesterFilter');
    const selectedSemester = semesterFilter ? semesterFilter.value : '';
    
    const courses = await getMyCourses(selectedSemester);
    
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
let currentAssignments = [];
let currentAssignment = null;

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
    loadMaterials();
    loadAssignments();
}

async function loadTasks() {
    if (!currentEnrollmentId) return;
    
    const tasks = await getCourseTasks(currentEnrollmentId);
    if (tasks && Array.isArray(tasks)) {
        currentTasks = tasks;
        filterTasks(currentFilter);
    }
}

// 加载课程资料列表
async function loadMaterials() {
    if (!currentEnrollmentId) return;

    const list = await getEnrollmentMaterials(currentEnrollmentId);
    const container = document.getElementById('materialList');
    if (!container) return;

    container.innerHTML = '';

    if (!list || !Array.isArray(list) || list.length === 0) {
        const p = document.createElement('p');
        p.textContent = '该课程暂未发布资料。';
        container.appendChild(p);
        return;
    }

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'material-item';

        const title = document.createElement('h4');
        title.textContent = item.title || '(未命名资料)';
        card.appendChild(title);

        const meta = document.createElement('p');
        const uploader = item.uploader_name || '教师';
        const createdAt = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '';
        let sizeText = '';
        if (typeof item.file_size === 'number') {
            const kb = item.file_size / 1024;
            if (kb < 1024) {
                sizeText = `${kb.toFixed(1)} KB`;
            } else {
                sizeText = `${(kb / 1024).toFixed(2)} MB`;
            }
        }
        meta.textContent = `上传者：${uploader}  |  上传时间：${createdAt}  |  大小：${sizeText || '未知'}`;
        card.appendChild(meta);

        if (item.file_path_or_content) {
            // 根据文件类型显示预览或下载按钮
            const fileUrl = item.file_path_or_content;
            const fileType = item.material_type || '';
            
            // 创建预览容器
            const previewContainer = document.createElement('div');
            previewContainer.className = 'material-preview';
            
            // 图片预览
            if (fileType.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileUrl)) {
                const img = document.createElement('img');
                img.src = fileUrl;
                img.alt = item.title;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '300px';
                img.style.marginTop = '10px';
                img.style.borderRadius = '4px';
                img.style.cursor = 'pointer';
                img.onclick = () => window.open(fileUrl, '_blank');
                previewContainer.appendChild(img);
            }
            // 视频预览
            else if (fileType.includes('video') || /\.(mp4|webm|ogg|avi|mov)$/i.test(fileUrl)) {
                const video = document.createElement('video');
                video.src = fileUrl;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '300px';
                video.style.marginTop = '10px';
                video.style.borderRadius = '4px';
                previewContainer.appendChild(video);
            }
            // 音频预览
            else if (fileType.includes('audio') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(fileUrl)) {
                const audio = document.createElement('audio');
                audio.src = fileUrl;
                audio.controls = true;
                audio.style.width = '100%';
                audio.style.marginTop = '10px';
                previewContainer.appendChild(audio);
            }
            
            card.appendChild(previewContainer);
            
            // 创建下载按钮
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary';
            downloadBtn.style.marginTop = '10px';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载资料';
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = fileUrl;
                a.download = item.title || 'material';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            card.appendChild(downloadBtn);
        }

        container.appendChild(card);
    });
}

function filterTasks(status) {
    currentFilter = status;
    // 更新按钮状态
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelectorAll('.filter-chip').forEach(btn => {
        if (btn.getAttribute('data-filter') === status)
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
    
    document.getElementById('taskModal').classList.add('show');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('show');
}

function markTaskComplete() {
    showMessage('任务标记为完成', 'success');
    closeTaskModal();
    loadTasks();
}

// 作业与考试功能
async function loadAssignments() {
    if (!currentEnrollmentId) return;

    const assignments = await getEnrollmentAssignments(currentEnrollmentId);
    if (assignments && Array.isArray(assignments)) {
        currentAssignments = assignments;
        displayAssignments(assignments);
    }
}

function displayAssignments(assignments) {
    const list = document.getElementById('assignmentList');
    if (!list) return;

    list.innerHTML = '';

    if (!assignments.length) {
        list.innerHTML = '<p>当前课程暂无布置的作业或考试。</p>';
        return;
    }

    assignments.forEach(a => {
        const item = document.createElement('div');
        item.className = 'task-item';

        let statusText = '未提交';
        if (a.status === 'submitted') statusText = '已提交，待评分';
        if (a.status === 'graded') statusText = '已评分';

        item.innerHTML = `
            <div>
                <h4>${a.title}</h4>
                <p>类型：${a.type === 'exam' ? '考试' : '作业'}</p>
                <p>截止时间：${a.deadline ? new Date(a.deadline).toLocaleString('zh-CN') : '无'}</p>
            </div>
            <span class="task-status status-${a.status}">${statusText}</span>
        `;
        item.onclick = () => showAssignmentModal(a);
        list.appendChild(item);
    });
}

function showAssignmentModal(assignment) {
    currentAssignment = assignment;
    document.getElementById('assignmentTitle').textContent = assignment.title;

    let statusText = '未提交';
    if (assignment.status === 'submitted') statusText = '已提交，待评分';
    if (assignment.status === 'graded') statusText = '已评分';

    const infoDiv = document.getElementById('assignmentInfo');
    infoDiv.innerHTML = `
        <p>类型：${assignment.type === 'exam' ? '考试' : '作业'}</p>
        <p>截止时间：${assignment.deadline ? new Date(assignment.deadline).toLocaleString('zh-CN') : '无'}</p>
        <p>当前状态：${statusText}</p>
        <p>成绩：${assignment.score != null ? assignment.score : '-'}</p>
    `;

    // 尝试加载草稿
    loadAssignmentDraft(assignment.assignment_id);

    document.getElementById('assignmentModal').classList.add('show');
}

function closeAssignmentModal() {
    document.getElementById('assignmentModal').classList.remove('show');
}

// 保存作业草稿
function saveDraft() {
    if (!currentAssignment) return;
    
    const text = document.getElementById('assignmentText').value;
    const draft = {
        content: text,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`draft_assignment_${currentAssignment.assignment_id}`, JSON.stringify(draft));
    showMessage('草稿已保存', 'success');
}

// 加载作业草稿
function loadAssignmentDraft(assignmentId) {
    const draftKey = `draft_assignment_${assignmentId}`;
    const draft = localStorage.getItem(draftKey);
    
    if (draft) {
        try {
            const draftData = JSON.parse(draft);
            document.getElementById('assignmentText').value = draftData.content || '';
            
            // 显示草稿提示
            const infoDiv = document.getElementById('assignmentInfo');
            const draftTime = new Date(draftData.timestamp).toLocaleString('zh-CN');
            infoDiv.innerHTML += `
                <p style="color: #f39c12;">
                    <i class="fas fa-info-circle"></i> 
                    已加载草稿（保存于 ${draftTime}）
                    <button onclick="clearAssignmentDraft(${assignmentId})" style="margin-left:10px;font-size:0.9rem;padding:2px 8px;border:none;background:#e74c3c;color:white;border-radius:4px;cursor:pointer;">清除草稿</button>
                </p>
            `;
        } catch (e) {
            console.error('加载草稿失败:', e);
        }
    } else {
        // 清空输入
        document.getElementById('assignmentText').value = '';
        const fileInput = document.getElementById('assignmentFile');
        if (fileInput) fileInput.value = '';
    }
}

// 清除作业草稿
function clearAssignmentDraft(assignmentId) {
    localStorage.removeItem(`draft_assignment_${assignmentId}`);
    document.getElementById('assignmentText').value = '';
    showMessage('草稿已清除', 'info');
    
    // 刷新模态框显示
    if (currentAssignment && currentAssignment.assignment_id === assignmentId) {
        closeAssignmentModal();
        setTimeout(() => showAssignmentModal(currentAssignment), 100);
    }
}

async function submitAssignment() {
    if (!currentAssignment) return;

    const text = document.getElementById('assignmentText').value.trim();
    const fileInput = document.getElementById('assignmentFile');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    if (!text && !file) {
        showMessage('请填写作业内容或选择上传文件', 'error');
        return;
    }

    const formData = new FormData();
    if (text) {
        formData.append('content', text);
    }
    if (file) {
        formData.append('file', file);
    }

    const result = await submitAssignmentRequest(currentAssignment.assignment_id, formData);
    if (result && result.submission_id) {
        showMessage('作业提交成功', 'success');
        // 提交成功后清除草稿
        localStorage.removeItem(`draft_assignment_${currentAssignment.assignment_id}`);
        closeAssignmentModal();
        loadAssignments();
    } else {
        showMessage('作业提交失败，请稍后重试', 'error');
    }
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
        // 设置欢迎语中的学生姓名
        try {
            const userRaw = localStorage.getItem('user');
            if (userRaw) {
                const user = JSON.parse(userRaw);
                if (user && user.username) {
                    const nameSpan = document.getElementById('studentName');
                    if (nameSpan) nameSpan.textContent = user.username;
                }
            }
        } catch (e) {
            // 忽略解析错误
        }

        // 加载首页展示的新课程列表
        loadHomeCourses();
    }
});

// 首页：加载最新课程
async function loadHomeCourses() {
    const list = document.getElementById('homeCourseList');
    if (!list) return;

    const result = await getCourses(1, '');
    list.innerHTML = '';

    if (!result || !Array.isArray(result.courses) || result.courses.length === 0) {
        list.innerHTML = '<p>暂时没有可选课程。</p>';
        return;
    }

    // 只展示前几门课程
    result.courses.slice(0, 4).forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <h3>${course.course_name}</h3>
            <p class="course-info">课程编号：${course.course_code}</p>
            <p class="course-info">学分：${course.credits}</p>
            <p class="course-info">院系：${course.department || '未指定'}</p>
        `;
        list.appendChild(card);
    });
}

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