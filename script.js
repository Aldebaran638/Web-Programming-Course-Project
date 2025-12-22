// 全局状态管理
const state = {
    currentUser: {
        id: 1,
        name: '李老师',
        role: 'teacher',
        department: '计算机科学系'
    },
    currentCourse: null,
    courses: [],
    materials: [],
    assignments: [],
    gradeItems: [],
    students: [],
    grades: {},
    dragItem: null
};

// DOM 元素缓存
const elements = {
    // 导航元素
    navItems: document.querySelectorAll('.nav-menu li'),
    currentTab: document.getElementById('current-tab'),
    courseSelect: document.getElementById('course-select'),
    
    // 仪表板元素
    courseCount: document.getElementById('course-count'),
    studentCount: document.getElementById('student-count'),
    assignmentCount: document.getElementById('assignment-count'),
    pendingCount: document.getElementById('pending-count'),
    
    // 课程管理元素
    coursesList: document.getElementById('courses-list'),
    courseSearch: document.getElementById('course-search'),
    courseFilter: document.getElementById('course-filter'),
    
    // 作业管理元素
    assignmentsContainer: document.getElementById('assignments-container'),
    assignmentTabs: document.querySelectorAll('.tab-btn'),
    
    // 成绩管理元素
    gradeItemsList: document.getElementById('grade-items-list'),
    gradesList: document.getElementById('grades-list'),
    gradeTableHeader: document.getElementById('grade-table-header'),
    
    // 课件管理元素
    materialsContainer: document.getElementById('materials-container'),
    carouselList: document.getElementById('carousel-list'),
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    
    // 模态框容器
    modalContainer: document.getElementById('modal-container')
};

// 初始化函数
function init() {
    setupEventListeners();
    loadInitialData();
    setupDragAndDrop();
}

// 设置事件监听器
function setupEventListeners() {
    // 导航切换
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
            updateBreadcrumb(tab);
        });
    });

    // 快速操作按钮
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // 课程选择
    elements.courseSelect.addEventListener('change', (e) => {
        state.currentCourse = e.target.value ? 
            state.courses.find(c => c.id == e.target.value) : null;
        if (state.currentCourse) {
            loadCourseData(state.currentCourse.id);
        }
    });

    // 搜索功能
    if (elements.courseSearch) {
        elements.courseSearch.addEventListener('input', filterCourses);
    }

    // 文件上传
    if (elements.uploadArea) {
        elements.uploadArea.addEventListener('click', () => {
            elements.fileInput.click();
        });

        elements.fileInput.addEventListener('change', handleFileUpload);
        
        // 拖拽上传
        elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.uploadArea.style.borderColor = '#4A90E2';
            elements.uploadArea.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
        });

        elements.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            elements.uploadArea.style.borderColor = '#E0E0E0';
            elements.uploadArea.style.backgroundColor = '';
        });

        elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.uploadArea.style.borderColor = '#E0E0E0';
            elements.uploadArea.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }

    // 课程配置保存
    const saveConfigBtn = document.getElementById('save-config-btn');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', saveCourseConfig);
    }

    // 添加课程按钮
    const addCourseBtn = document.getElementById('add-course-btn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', showAddCourseModal);
    }

    // 添作业按钮
    const addAssignmentBtn = document.getElementById('add-assignment-btn');
    if (addAssignmentBtn) {
        addAssignmentBtn.addEventListener('click', showAddAssignmentModal);
    }

    // 成绩管理按钮
    const setGradeStructureBtn = document.getElementById('set-grade-structure-btn');
    if (setGradeStructureBtn) {
        setGradeStructureBtn.addEventListener('click', showGradeStructureModal);
    }

    const addGradeItemBtn = document.getElementById('add-grade-item-btn');
    if (addGradeItemBtn) {
        addGradeItemBtn.addEventListener('click', showAddGradeItemModal);
    }

    const importGradesBtn = document.getElementById('import-grades-btn');
    if (importGradesBtn) {
        importGradesBtn.addEventListener('click', () => {
            document.getElementById('grade-file-input').click();
        });
    }

    // 成绩预测
    const predictGradesBtn = document.getElementById('predict-grades-btn');
    if (predictGradesBtn) {
        predictGradesBtn.addEventListener('click', predictGrades);
    }
}

// 加载初始数据
async function loadInitialData() {
    try {
        // 加载教师课程
        const courses = await apiService.getTeacherCourses(state.currentUser.id);
        state.courses = courses;
        
        // 更新课程选择器
        updateCourseSelector();
        
        // 更新仪表板统计
        updateDashboardStats();
        
        // 加载第一个课程的数据
        if (courses.length > 0) {
            state.currentCourse = courses[0];
            elements.courseSelect.value = courses[0].id;
            await loadCourseData(courses[0].id);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showNotification('加载数据失败，请刷新页面重试', 'error');
    }
}

// 加载课程数据
async function loadCourseData(courseId) {
    try {
        const [materials, assignments, gradeItems, students] = await Promise.all([
            apiService.getCourseMaterials(courseId),
            apiService.getAssignments(courseId),
            apiService.getGradeItems(courseId),
            apiService.getCourseStudents(courseId)
        ]);

        state.materials = materials;
        state.assignments = assignments;
        state.gradeItems = gradeItems;
        state.students = students;

        // 更新UI
        updateMaterialsList();
        updateAssignmentsList();
        updateGradeItemsList();
        updateGradesTable();
    } catch (error) {
        console.error('加载课程数据失败:', error);
    }
}

// 更新课程选择器
function updateCourseSelector() {
    elements.courseSelect.innerHTML = '<option value="">选择课程...</option>';
    
    state.courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.course_code} - ${course.course_name}`;
        elements.courseSelect.appendChild(option);
    });
}

// 更新仪表板统计
function updateDashboardStats() {
    elements.courseCount.textContent = state.courses.length;
    
    // 计算学生总数
    const totalStudents = state.courses.reduce((sum, course) => 
        sum + (course.student_count || 0), 0);
    elements.studentCount.textContent = totalStudents;
    
    // 计算作业/考试总数
    const totalAssignments = state.assignments.length;
    elements.assignmentCount.textContent = totalAssignments;
    
    // 计算待批改数量
    const pendingCount = state.assignments.filter(a => 
        a.submissions && a.submissions.some(s => !s.graded)).length;
    elements.pendingCount.textContent = pendingCount;
}

// 切换标签页
function switchTab(tabName) {
    // 移除所有激活状态
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.classList.remove('active');
    });

    // 激活当前标签页
    const targetSection = document.getElementById(tabName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const targetNav = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
}

// 更新面包屑
function updateBreadcrumb(tabName) {
    const tabNames = {
        'dashboard': '仪表板',
        'courses': '课程管理',
        'assignments': '作业管理',
        'grades': '成绩管理',
        'materials': '课件管理'
    };
    
    elements.currentTab.textContent = tabNames[tabName] || tabName;
}

// 过滤课程
function filterCourses() {
    const searchTerm = elements.courseSearch.value.toLowerCase();
    const filterTerm = elements.courseFilter.value;
    
    const filteredCourses = state.courses.filter(course => {
        const matchesSearch = !searchTerm || 
            course.course_code.toLowerCase().includes(searchTerm) ||
            course.course_name.toLowerCase().includes(searchTerm);
        
        const matchesFilter = !filterTerm || 
            course.semester === filterTerm;
        
        return matchesSearch && matchesFilter;
    });
    
    renderCoursesTable(filteredCourses);
}

// 渲染课程表格
function renderCoursesTable(courses) {
    elements.coursesList.innerHTML = '';
    
    courses.forEach(course => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${course.course_code}</td>
            <td>${course.course_name}</td>
            <td>${course.credits}</td>
            <td>${course.department}</td>
            <td>${course.semester || '2024-2025-1'}</td>
            <td>${course.student_count || 0}</td>
            <td>
                <span class="status-badge status-active">进行中</span>
            </td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="viewCourseDetails(${course.id})">
                    查看
                </button>
                <button class="btn btn-outline btn-sm" onclick="editCourse(${course.id})">
                    编辑
                </button>
            </td>
        `;
        
        elements.coursesList.appendChild(row);
    });
}

// 更新课件列表
function updateMaterialsList() {
    elements.materialsContainer.innerHTML = '';
    
    state.materials.forEach(material => {
        const materialCard = createMaterialCard(material);
        elements.materialsContainer.appendChild(materialCard);
    });
    
    updateCarouselList();
}

// 创建课件卡片
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    const icon = getMaterialIcon(material.material_type);
    const typeText = getMaterialTypeText(material.material_type);
    
    card.innerHTML = `
        <div class="material-preview">
            <i class="${icon}"></i>
        </div>
        <div class="material-info">
            <h4>${material.title}</h4>
            <p>${typeText} • ${formatDate(material.created_at)}</p>
            <div class="material-actions">
                <button class="btn btn-outline btn-sm" onclick="viewMaterial(${material.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline btn-sm" onclick="deleteMaterial(${material.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// 更新轮播图列表
function updateCarouselList() {
    const carouselMaterials = state.materials.filter(m => 
        m.material_type === 'carousel_image');
    
    elements.carouselList.innerHTML = '';
    
    carouselMaterials.forEach((material, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        item.draggable = true;
        item.dataset.id = material.id;
        
        item.innerHTML = `
            <div class="drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="carousel-preview" style="background-image: url('${material.file_path_or_content}')"></div>
            <div class="carousel-info">
                <h4>${material.title}</h4>
                <p>排序: ${index + 1}</p>
            </div>
            <div class="carousel-actions">
                <button class="btn btn-outline btn-sm" onclick="removeFromCarousel(${material.id})">
                    移除
                </button>
            </div>
        `;
        
        setupDragEvents(item);
        elements.carouselList.appendChild(item);
    });
}

// 设置拖拽事件
function setupDragEvents(item) {
    item.addEventListener('dragstart', (e) => {
        state.dragItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        state.dragItem = null;
    });
    
    item.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (state.dragItem && state.dragItem !== item) {
            const carouselItems = Array.from(elements.carouselList.children);
            const dragIndex = carouselItems.indexOf(state.dragItem);
            const dropIndex = carouselItems.indexOf(item);
            
            if (dragIndex < dropIndex) {
                elements.carouselList.insertBefore(state.dragItem, item.nextSibling);
            } else {
                elements.carouselList.insertBefore(state.dragItem, item);
            }
            
            updateCarouselOrder();
        }
    });
}

// 更新轮播图顺序
function updateCarouselOrder() {
    const items = Array.from(elements.carouselList.children);
    const orderedIds = items.map(item => item.dataset.id);
    
    // 发送更新请求到后端
    apiService.updateCarouselOrder(state.currentCourse.id, orderedIds)
        .then(() => {
            showNotification('轮播图顺序已更新', 'success');
        })
        .catch(error => {
            console.error('更新顺序失败:', error);
            showNotification('更新失败', 'error');
        });
}

// 更新作业列表
function updateAssignmentsList() {
    elements.assignmentsContainer.innerHTML = '';
    
    state.assignments.forEach(assignment => {
        const assignmentCard = createAssignmentCard(assignment);
        elements.assignmentsContainer.appendChild(assignmentCard);
    });
}

// 创建作业卡片
function createAssignmentCard(assignment) {
    const card = document.createElement('div');
    card.className = 'assignment-card';
    
    const submittedCount = assignment.submissions ? 
        assignment.submissions.filter(s => s.submitted).length : 0;
    const totalStudents = state.students.length;
    const submissionRate = totalStudents > 0 ? 
        Math.round((submittedCount / totalStudents) * 100) : 0;
    
    card.innerHTML = `
        <div class="assignment-info">
            <h4>${assignment.title}</h4>
            <p>
                <span class="assignment-type ${assignment.type}">
                    ${assignment.type === 'exam' ? '考试' : '作业'}
                </span>
                • 截止时间: ${formatDate(assignment.deadline)}
            </p>
            <p class="assignment-description">${assignment.description}</p>
        </div>
        <div class="assignment-stats">
            <div class="stat">
                <span class="number">${submissionRate}%</span>
                <span class="label">提交率</span>
            </div>
            <div class="stat">
                <span class="number">${submittedCount}</span>
                <span class="label">已提交</span>
            </div>
            <div class="stat">
                <span class="number">${assignment.submissions ? assignment.submissions.filter(s => s.graded).length : 0}</span>
                <span class="label">已批改</span>
            </div>
            <div class="assignment-actions">
                <button class="btn btn-outline btn-sm" onclick="viewSubmissions(${assignment.id})">
                    查看提交
                </button>
                <button class="btn btn-primary btn-sm" onclick="gradeAssignment(${assignment.id})">
                    批改
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// 更新成绩项列表
function updateGradeItemsList() {
    elements.gradeItemsList.innerHTML = '';
    
    let totalWeight = 0;
    
    state.gradeItems.forEach(item => {
        totalWeight += parseFloat(item.weight);
        
        const gradeItem = document.createElement('div');
        gradeItem.className = 'grade-item';
        
        gradeItem.innerHTML = `
            <div class="grade-item-info">
                <h4>${item.item_name}</h4>
                <p>${item.description || '无描述'}</p>
            </div>
            <div class="grade-item-actions">
                <span class="grade-item-weight">${(item.weight * 100).toFixed(1)}%</span>
                <button class="btn btn-outline btn-sm" onclick="editGradeItem(${item.id})">
                    编辑
                </button>
                <button class="btn btn-outline btn-sm" onclick="deleteGradeItem(${item.id})">
                    删除
                </button>
            </div>
        `;
        
        elements.gradeItemsList.appendChild(gradeItem);
    });
    
    // 添加总权重信息
    if (state.gradeItems.length > 0) {
        const totalInfo = document.createElement('div');
        totalInfo.className = 'grade-item';
        totalInfo.innerHTML = `
            <div class="grade-item-info">
                <h4>总权重</h4>
                <p>${state.gradeItems.length}个成绩项</p>
            </div>
            <div class="grade-item-actions">
                <span class="grade-item-weight">${(totalWeight * 100).toFixed(1)}%</span>
            </div>
        `;
        elements.gradeItemsList.appendChild(totalInfo);
    }
}

// 更新成绩表格
function updateGradesTable() {
    // 更新表头
    updateGradeTableHeader();
    
    // 更新表格内容
    elements.gradesList.innerHTML = '';
    
    state.students.forEach(student => {
        const row = createGradeRow(student);
        elements.gradesList.appendChild(row);
    });
}

// 更新成绩表头
function updateGradeTableHeader() {
    elements.gradeTableHeader.innerHTML = `
        <th>学号</th>
        <th>姓名</th>
        <th>班级</th>
    `;
    
    state.gradeItems.forEach(item => {
        const th = document.createElement('th');
        th.innerHTML = `${item.item_name}<br><small>${(item.weight * 100).toFixed(1)}%</small>`;
        elements.gradeTableHeader.appendChild(th);
    });
    
    const totalTh = document.createElement('th');
    totalTh.innerHTML = '总分<br><small>100%</small>';
    elements.gradeTableHeader.appendChild(totalTh);
}

// 创建成绩行
function createGradeRow(student) {
    const row = document.createElement('tr');
    
    // 学生基本信息
    row.innerHTML = `
        <td>${student.student_id_number}</td>
        <td>${student.full_name}</td>
        <td>${student.class_name || '未分班'}</td>
    `;
    
    // 各成绩项输入框
    let totalScore = 0;
    
    state.gradeItems.forEach(item => {
        const grade = state.grades[student.id]?.[item.id] || { score: 0 };
        totalScore += grade.score * item.weight;
        
        const td = document.createElement('td');
        td.innerHTML = `
            <input type="number" 
                   min="0" 
                   max="100" 
                   value="${grade.score || 0}" 
                   data-student="${student.id}" 
                   data-item="${item.id}"
                   class="grade-input"
                   onchange="updateGrade(${student.id}, ${item.id}, this.value)">
        `;
        row.appendChild(td);
    });
    
    // 总分
    const totalTd = document.createElement('td');
    totalTd.innerHTML = `
        <strong>${totalScore.toFixed(1)}</strong>
    `;
    row.appendChild(totalTd);
    
    return row;
}

// 文件上传处理
function handleFileUpload(event) {
    const files = event.target.files;
    handleFiles(files);
}

// 处理文件
async function handleFiles(files) {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 验证文件类型
        if (!isValidFileType(file)) {
            showNotification(`文件 ${file.name} 类型不支持`, 'warning');
            continue;
        }
        
        // 验证文件大小
        if (file.size > 50 * 1024 * 1024) { // 50MB
            showNotification(`文件 ${file.name} 太大，最大支持50MB`, 'warning');
            continue;
        }
        
        formData.append('files', file);
    }
    
    if (formData.has('files')) {
        try {
            showNotification('正在上传文件...', 'info');
            
            const result = await apiService.uploadMaterials(
                state.currentCourse.id, 
                formData
            );
            
            showNotification('文件上传成功', 'success');
            
            // 更新材料列表
            state.materials = [...state.materials, ...result];
            updateMaterialsList();
            
            // 清空文件输入
            elements.fileInput.value = '';
        } catch (error) {
            console.error('上传失败:', error);
            showNotification('文件上传失败', 'error');
        }
    }
}

// 验证文件类型
function isValidFileType(file) {
    const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'audio/mpeg'
    ];
    
    return validTypes.includes(file.type);
}

// 保存课程配置
async function saveCourseConfig() {
    const config = {
        allow_comments: document.getElementById('enable-comments').checked,
        allow_notes: document.getElementById('enable-notes').checked,
        description: document.getElementById('course-description').value
    };
    
    try {
        await apiService.updateCourseConfig(state.currentCourse.id, config);
        showNotification('课程配置已保存', 'success');
    } catch (error) {
        console.error('保存配置失败:', error);
        showNotification('保存失败', 'error');
    }
}

// 显示添加课程模态框
function showAddCourseModal() {
    const modal = createModal('添加课程', `
        <form id="add-course-form">
            <div class="form-group">
                <label for="course-code">课程编号 *</label>
                <input type="text" id="course-code" required>
            </div>
            <div class="form-group">
                <label for="course-name">课程名称 *</label>
                <input type="text" id="course-name" required>
            </div>
            <div class="form-group">
                <label for="course-credits">学分 *</label>
                <input type="number" id="course-credits" step="0.5" min="0" required>
            </div>
            <div class="form-group">
                <label for="course-department">开课院系</label>
                <input type="text" id="course-department">
            </div>
            <div class="form-group">
                <label for="course-semester">学期</label>
                <select id="course-semester">
                    <option value="2024-2025-1">2024-2025第一学期</option>
                    <option value="2024-2025-2">2024-2025第二学期</option>
                </select>
            </div>
        </form>
    `);
    
    modal.querySelector('.modal-footer').innerHTML = `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="addCourse()">添加</button>
    `;
    
    showModal(modal);
}

// 添加课程
async function addCourse() {
    const form = document.getElementById('add-course-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const courseData = {
        course_code: document.getElementById('course-code').value,
        course_name: document.getElementById('course-name').value,
        credits: parseFloat(document.getElementById('course-credits').value),
        department: document.getElementById('course-department').value,
        semester: document.getElementById('course-semester').value
    };
    
    try {
        const newCourse = await apiService.addCourse(courseData);
        state.courses.push(newCourse);
        
        updateCourseSelector();
        renderCoursesTable(state.courses);
        
        closeModal();
        showNotification('课程添加成功', 'success');
    } catch (error) {
        console.error('添加课程失败:', error);
        showNotification('添加失败', 'error');
    }
}

// 显示添加作业模态框
function showAddAssignmentModal() {
    if (!state.currentCourse) {
        showNotification('请先选择课程', 'warning');
        return;
    }
    
    const modal = createModal('布置作业/考试', `
        <form id="add-assignment-form">
            <div class="form-group">
                <label for="assignment-title">标题 *</label>
                <input type="text" id="assignment-title" required>
            </div>
            <div class="form-group">
                <label for="assignment-type">类型 *</label>
                <select id="assignment-type" required>
                    <option value="homework">作业</option>
                    <option value="exam">考试</option>
                </select>
            </div>
            <div class="form-group">
                <label for="assignment-deadline">截止时间 *</label>
                <input type="datetime-local" id="assignment-deadline" required>
            </div>
            <div class="form-group">
                <label for="assignment-description">描述</label>
                <textarea id="assignment-description" rows="4"></textarea>
            </div>
        </form>
    `);
    
    modal.querySelector('.modal-footer').innerHTML = `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="addAssignment()">发布</button>
    `;
    
    // 设置默认截止时间为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('assignment-deadline').value = 
        tomorrow.toISOString().slice(0, 16);
    
    showModal(modal);
}

// 添加作业
async function addAssignment() {
    const form = document.getElementById('add-assignment-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const assignmentData = {
        title: document.getElementById('assignment-title').value,
        type: document.getElementById('assignment-type').value,
        deadline: document.getElementById('assignment-deadline').value,
        description: document.getElementById('assignment-description').value,
        course_id: state.currentCourse.id
    };
    
    try {
        const newAssignment = await apiService.addAssignment(assignmentData);
        state.assignments.push(newAssignment);
        
        updateAssignmentsList();
        updateDashboardStats();
        
        closeModal();
        showNotification('作业发布成功', 'success');
    } catch (error) {
        console.error('发布作业失败:', error);
        showNotification('发布失败', 'error');
    }
}

// 显示成绩构成模态框
function showGradeStructureModal() {
    if (!state.currentCourse) {
        showNotification('请先选择课程', 'warning');
        return;
    }
    
    const modal = createModal('设置成绩构成', `
        <div class="grade-structure-info">
            <p>总权重必须等于100%，当前已设置的成绩项：</p>
            <div id="current-grade-items"></div>
            <div class="total-weight">
                总权重: <span id="total-weight">0</span>%
            </div>
        </div>
        <form id="add-grade-item-form">
            <div class="form-group">
                <label for="item-name">成绩项名称 *</label>
                <input type="text" id="item-name" required>
            </div>
            <div class="form-group">
                <label for="item-weight">权重 (0-100) *</label>
                <input type="number" id="item-weight" min="0" max="100" step="0.1" required>
                <small>以百分比表示，如：30 表示 30%</small>
            </div>
            <div class="form-group">
                <label for="item-description">描述</label>
                <textarea id="item-description" rows="2"></textarea>
            </div>
        </form>
    `);
    
    modal.querySelector('.modal-footer').innerHTML = `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="addGradeItem()">添加</button>
        <button class="btn btn-success" onclick="saveGradeStructure()">保存设置</button>
    `;
    
    showCurrentGradeItems();
    showModal(modal);
}

// 显示当前成绩项
function showCurrentGradeItems() {
    const container = document.getElementById('current-grade-items');
    container.innerHTML = '';
    
    let totalWeight = 0;
    
    state.gradeItems.forEach(item => {
        totalWeight += parseFloat(item.weight) * 100;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'current-grade-item';
        itemDiv.innerHTML = `
            <span>${item.item_name}</span>
            <span>${(item.weight * 100).toFixed(1)}%</span>
            <button class="btn btn-outline btn-sm" onclick="removeGradeItemFromList(${item.id})">
                删除
            </button>
        `;
        container.appendChild(itemDiv);
    });
    
    document.getElementById('total-weight').textContent = totalWeight.toFixed(1);
}

// 添加成绩项到列表
async function addGradeItem() {
    const form = document.getElementById('add-grade-item-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const itemName = document.getElementById('item-name').value;
    const weight = parseFloat(document.getElementById('item-weight').value) / 100;
    
    // 检查总权重是否超过100%
    const currentTotal = state.gradeItems.reduce((sum, item) => 
        sum + parseFloat(item.weight), 0);
    
    if (currentTotal + weight > 1) {
        showNotification('总权重不能超过100%', 'warning');
        return;
    }
    
    const gradeItem = {
        item_name: itemName,
        weight: weight,
        description: document.getElementById('item-description').value
    };
    
    state.gradeItems.push(gradeItem);
    showCurrentGradeItems();
    
    // 清空表单
    form.reset();
}

// 保存成绩构成
async function saveGradeStructure() {
    const totalWeight = state.gradeItems.reduce((sum, item) => 
        sum + parseFloat(item.weight), 0);
    
    if (Math.abs(totalWeight - 1) > 0.001) {
        showNotification('总权重必须等于100%', 'warning');
        return;
    }
    
    try {
        await apiService.setGradeItems(state.currentCourse.id, state.gradeItems);
        
        updateGradeItemsList();
        updateGradesTable();
        
        closeModal();
        showNotification('成绩构成设置成功', 'success');
    } catch (error) {
        console.error('设置失败:', error);
        showNotification('设置失败', 'error');
    }
}

// 成绩预测
async function predictGrades() {
    if (!state.currentCourse) {
        showNotification('请先选择课程', 'warning');
        return;
    }
    
    try {
        showNotification('正在分析数据...', 'info');
        
        const prediction = await apiService.predictGrades(state.currentCourse.id);
        
        const modal = createModal('成绩预测结果', `
            <div class="prediction-result">
                <div class="prediction-stats">
                    <div class="stat">
                        <h3>${prediction.accuracy}%</h3>
                        <p>预测准确率</p>
                    </div>
                    <div class="stat">
                        <h3>${prediction.high_risk_count}</h3>
                        <p>高风险学生</p>
                    </div>
                </div>
                
                <h4>预测详情：</h4>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>学生</th>
                                <th>当前均分</th>
                                <th>预测均分</th>
                                <th>风险等级</th>
                            </tr>
                        </thead>
                        <tbody id="prediction-details"></tbody>
                    </table>
                </div>
            </div>
        `);
        
        const detailsBody = modal.querySelector('#prediction-details');
        prediction.details.forEach(detail => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${detail.student_name}</td>
                <td>${detail.current_average.toFixed(1)}</td>
                <td>${detail.predicted_average.toFixed(1)}</td>
                <td>
                    <span class="status-badge ${detail.risk_level === 'high' ? 'status-pending' : 'status-active'}">
                        ${detail.risk_level === 'high' ? '高风险' : '正常'}
                    </span>
                </td>
            `;
            detailsBody.appendChild(row);
        });
        
        modal.querySelector('.modal-footer').innerHTML = `
            <button class="btn btn-primary" onclick="closeModal()">确定</button>
        `;
        
        showModal(modal);
    } catch (error) {
        console.error('预测失败:', error);
        showNotification('预测失败', 'error');
    }
}

// 工具函数
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="btn btn-outline btn-sm" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer"></div>
        </div>
    `;
    
    return modal;
}

function showModal(modal) {
    elements.modalContainer.innerHTML = '';
    elements.modalContainer.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function closeModal() {
    const modal = elements.modalContainer.querySelector('.modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            elements.modalContainer.innerHTML = '';
        }, 300);
    }
}

function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function getMaterialIcon(type) {
    const icons = {
        'document': 'fas fa-file-pdf',
        'video': 'fas fa-video',
        'image': 'fas fa-image',
        'carousel_image': 'fas fa-images',
        'config': 'fas fa-cog'
    };
    
    return icons[type] || 'fas fa-file';
}

function getMaterialTypeText(type) {
    const texts = {
        'document': '文档',
        'video': '视频',
        'image': '图片',
        'carousel_image': '轮播图',
        'config': '配置'
    };
    
    return texts[type] || '文件';
}

function formatDate(dateString) {
    if (!dateString) return '未知';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 其他操作函数
function viewCourseDetails(courseId) {
    const course = state.courses.find(c => c.id == courseId);
    showNotification(`查看课程: ${course.course_name}`, 'info');
}

function editCourse(courseId) {
    showNotification('编辑课程功能开发中', 'info');
}

function viewMaterial(materialId) {
    const material = state.materials.find(m => m.id == materialId);
    if (material.file_path_or_content) {
        window.open(material.file_path_or_content, '_blank');
    }
}

function deleteMaterial(materialId) {
    if (confirm('确定要删除这个课件吗？')) {
        apiService.deleteMaterial(materialId)
            .then(() => {
                state.materials = state.materials.filter(m => m.id != materialId);
                updateMaterialsList();
                showNotification('课件删除成功', 'success');
            })
            .catch(error => {
                console.error('删除失败:', error);
                showNotification('删除失败', 'error');
            });
    }
}

function removeFromCarousel(materialId) {
    apiService.removeFromCarousel(materialId)
        .then(() => {
            const material = state.materials.find(m => m.id == materialId);
            if (material) {
                material.material_type = 'image';
            }
            updateMaterialsList();
            showNotification('已从轮播图移除', 'success');
        })
        .catch(error => {
            console.error('移除失败:', error);
            showNotification('移除失败', 'error');
        });
}

function viewSubmissions(assignmentId) {
    showNotification('查看提交功能开发中', 'info');
}

function gradeAssignment(assignmentId) {
    showNotification('批改作业功能开发中', 'info');
}

function editGradeItem(itemId) {
    showNotification('编辑成绩项功能开发中', 'info');
}

function deleteGradeItem(itemId) {
    if (confirm('确定要删除这个成绩项吗？')) {
        state.gradeItems = state.gradeItems.filter(item => item.id != itemId);
        updateGradeItemsList();
        updateGradesTable();
        showNotification('成绩项已删除', 'success');
    }
}

function updateGrade(studentId, itemId, score) {
    const grade = {
        student_id: studentId,
        grade_item_id: itemId,
        score: parseFloat(score)
    };
    
    apiService.updateGrade(grade)
        .then(() => {
            if (!state.grades[studentId]) {
                state.grades[studentId] = {};
            }
            state.grades[studentId][itemId] = { score: grade.score };
            updateGradesTable();
            showNotification('成绩已更新', 'success');
        })
        .catch(error => {
            console.error('更新失败:', error);
            showNotification('更新失败', 'error');
        });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', init);