// 教师工作台主逻辑 - 移除登录功能版本
class TeacherDashboard {
    constructor() {
        this.currentCourseId = null;
        this.currentTab = 'dashboard';
        this.initialize();
    }

    initialize() {
        // 直接初始化，不再检查登录状态
        this.bindEvents();
        this.initPage();
        
        // 加载演示数据
        this.loadDemoData();
    }

    loadDemoData() {
        // 设置演示用户信息
        document.getElementById('teacher-name').textContent = '张老师';
        document.getElementById('teacher-info').textContent = '教授 | 计算机科学系';
        
        // 加载仪表盘数据
        this.loadDashboardData();
    }

    bindEvents() {
        // 移除登录相关事件绑定
        // document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        // document.querySelector('.close-btn')?.addEventListener('click', () => this.closeLoginModal());
        
        // 导航切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // 快速操作
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });
        
        // 课程选择器
        document.getElementById('course-select')?.addEventListener('change', (e) => this.onCourseSelect(e));
        
        // 修改退出登录按钮为刷新按钮
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // 轮播图上传
        document.getElementById('upload-carousel-btn')?.addEventListener('click', () => {
            document.getElementById('carousel-file-input').click();
        });
        
        // 课件上传
        document.getElementById('browse-material-btn')?.addEventListener('click', () => {
            document.getElementById('material-file-input').click();
        });
        
        // 文件上传处理
        document.getElementById('carousel-file-input')?.addEventListener('change', (e) => this.handleCarouselUpload(e));
        document.getElementById('material-file-input')?.addEventListener('change', (e) => this.handleMaterialUpload(e));
        
        // 拖拽上传
        this.initDragAndDrop();
        
        // 绑定其他按钮事件
        this.bindOtherEvents();
    }

    bindOtherEvents() {
        // 创建课程按钮
        document.getElementById('create-course-btn')?.addEventListener('click', () => {
            this.showCreateCourseModal();
        });
        
        // 创建作业按钮
        document.getElementById('create-assignment-btn')?.addEventListener('click', () => {
            this.showCreateAssignmentModal();
        });
        
        // 保存课程配置
        document.getElementById('save-course-config-btn')?.addEventListener('click', () => {
            this.saveCourseConfig();
        });
        
        // 发布课程
        document.getElementById('publish-course-btn')?.addEventListener('click', () => {
            this.publishCourse();
        });
        
        // 添加成绩项
        document.getElementById('add-grade-item-btn')?.addEventListener('click', () => {
            this.showAddGradeItemModal();
        });
        
        // 成绩预测
        document.getElementById('predict-grades-btn')?.addEventListener('click', () => {
            this.predictGrades();
        });
    }

    // 移除登录相关方法
    // handleLogin(e) { ... }
    // closeLoginModal() { ... }
    // checkLoginStatus() { ... }

    // 修改登出为刷新数据
    refreshData() {
        this.showMessage('正在刷新数据...', 'info');
        setTimeout(() => {
            this.loadDashboardData();
            this.loadTabData(this.currentTab);
            this.showMessage('数据已刷新', 'success');
        }, 1000);
    }

    async loadDashboardData() {
        try {
            // 使用演示数据
            const demoStats = {
                courses: 3,
                students: 85,
                assignments: 7,
                pending: 12
            };
            
            // 更新统计卡片
            document.getElementById('course-count').textContent = demoStats.courses;
            document.getElementById('student-count').textContent = demoStats.students;
            document.getElementById('assignment-count').textContent = demoStats.assignments;
            document.getElementById('pending-count').textContent = demoStats.pending;
            
            // 加载演示通知
            this.loadDemoNotifications();
            
            // 加载演示课程选择器
            this.loadDemoCourseSelector();
        } catch (error) {
            console.error('加载演示数据失败:', error);
            // 使用默认值
            document.getElementById('course-count').textContent = 0;
            document.getElementById('student-count').textContent = 0;
            document.getElementById('assignment-count').textContent = 0;
            document.getElementById('pending-count').textContent = 0;
        }
    }

    loadDemoNotifications() {
        const demoNotifications = [
            {
                title: '新作业提交',
                message: '数据结构课程有5名学生提交了新作业',
                created_at: new Date().toISOString()
            },
            {
                title: '课程提醒',
                message: '下周将开始数据库原理课程',
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                title: '系统通知',
                message: '系统将于本周末进行维护',
                created_at: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        
        const container = document.getElementById('notification-list');
        container.innerHTML = demoNotifications.map(notif => `
            <li>
                <div>
                    <strong>${notif.title}</strong>
                    <p>${notif.message}</p>
                </div>
                <span class="notification-time">${this.formatTime(notif.created_at)}</span>
            </li>
        `).join('');
        
        // 更新通知数量
        document.getElementById('notification-count').textContent = demoNotifications.length;
    }

    loadDemoCourseSelector() {
        const demoCourses = [
            { id: 1, course_code: 'CS101', course_name: '数据结构' },
            { id: 2, course_code: 'CS201', course_name: '数据库原理' },
            { id: 3, course_code: 'CS301', course_name: '操作系统' }
        ];
        
        const select = document.getElementById('course-select');
        if (select) {
            // 清空现有选项，保留第一个提示选项
            select.innerHTML = '<option value="">选择课程...</option>';
            
            demoCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.course_code} - ${course.course_name}`;
                select.appendChild(option);
            });
            
            // 也更新其他页面的课程选择器
            ['material', 'assignment', 'grade'].forEach(type => {
                const otherSelect = document.getElementById(`${type}-course-select`);
                if (otherSelect) {
                    otherSelect.innerHTML = '<option value="">请先选择课程</option>';
                    demoCourses.forEach(course => {
                        const option = document.createElement('option');
                        option.value = course.id;
                        option.textContent = `${course.course_code} - ${course.course_name}`;
                        otherSelect.appendChild(option);
                    });
                }
            });
        }
    }

    async loadCourses() {
        try {
            // 使用演示课程数据
            const demoCourses = [
                {
                    id: 1,
                    course_code: 'CS101',
                    course_name: '数据结构',
                    credits: 4,
                    semester: '2024春季学期',
                    status: 'published',
                    student_count: 35
                },
                {
                    id: 2,
                    course_code: 'CS201',
                    course_name: '数据库原理',
                    credits: 3,
                    semester: '2024春季学期',
                    status: 'draft',
                    student_count: 28
                },
                {
                    id: 3,
                    course_code: 'CS301',
                    course_name: '操作系统',
                    credits: 4,
                    semester: '2024秋季学期',
                    status: 'published',
                    student_count: 22
                }
            ];
            
            const tbody = document.getElementById('courses-table-body');
            tbody.innerHTML = demoCourses.map(course => `
                <tr>
                    <td>${course.course_code}</td>
                    <td><strong>${course.course_name}</strong></td>
                    <td>${course.credits}</td>
                    <td>${course.semester}</td>
                    <td><span class="status-badge status-${course.status}">${this.getStatusText(course.status)}</span></td>
                    <td>${course.student_count}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="dashboard.viewCourse(${course.id})">查看</button>
                        <button class="btn btn-sm btn-primary" onclick="dashboard.editCourse(${course.id})">编辑</button>
                        ${course.status === 'published' ? 
                            '<button class="btn btn-sm btn-danger" onclick="dashboard.unpublishCourse(' + course.id + ')">撤回</button>' : 
                            '<button class="btn btn-sm btn-success" onclick="dashboard.publishCourse(' + course.id + ')">发布</button>'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('加载课程失败:', error);
            const tbody = document.getElementById('courses-table-body');
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">加载失败</td></tr>';
        }
    }

    // 添加更多演示数据方法...

    async loadMaterials() {
        if (!this.currentCourseId) {
            this.showMessage('请先选择课程', 'info');
            return;
        }
        
        try {
            // 使用演示课件数据
            const demoMaterials = [
                {
                    id: 1,
                    title: '数据结构第一章课件',
                    material_type: 'document',
                    file_size: 2.5 * 1024 * 1024, // 2.5MB
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 2,
                    title: '树和图的讲解视频',
                    material_type: 'video',
                    file_size: 150 * 1024 * 1024, // 150MB
                    created_at: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: 3,
                    title: '算法流程图',
                    material_type: 'image',
                    file_size: 500 * 1024, // 500KB
                    created_at: new Date(Date.now() - 259200000).toISOString()
                }
            ];
            
            const container = document.getElementById('materials-grid');
            container.innerHTML = demoMaterials.map(material => `
                <div class="material-item">
                    <div class="material-icon">
                        <i class="${this.getMaterialIcon(material.material_type)}"></i>
                    </div>
                    <div class="material-name">${material.title}</div>
                    <div class="material-meta">
                        <span>${this.formatFileSize(material.file_size)}</span>
                        <span>${this.formatTime(material.created_at)}</span>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('file-count').textContent = `${demoMaterials.length}个文件`;
        } catch (error) {
            console.error('加载课件失败:', error);
            const container = document.getElementById('materials-grid');
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-folder-open fa-3x"></i>
                    <p>加载失败</p>
                </div>
            `;
        }
    }

    async loadAssignments() {
        if (!this.currentCourseId) {
            this.showMessage('请先选择课程', 'info');
            return;
        }
        
        try {
            // 使用演示作业数据
            const demoAssignments = [
                {
                    id: 1,
                    title: '第一章课后作业',
                    type: 'assignment',
                    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
                    description: '完成第一章的所有练习题',
                    submission_count: 28
                },
                {
                    id: 2,
                    title: '期中考试',
                    type: 'exam',
                    deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
                    description: '覆盖前六章内容',
                    submission_count: 35
                },
                {
                    id: 3,
                    title: '数据结构大作业',
                    type: 'assignment',
                    deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
                    description: '实现一个简单的数据库系统',
                    submission_count: 12
                }
            ];
            
            const container = document.getElementById('assignments-list');
            container.innerHTML = demoAssignments.map(assignment => `
                <div class="assignment-card">
                    <div class="assignment-info">
                        <h4>${assignment.title}</h4>
                        <div>
                            <span class="assignment-type ${assignment.type}">
                                ${assignment.type === 'exam' ? '考试' : '作业'}
                            </span>
                            <span>截止时间: ${this.formatDateTime(assignment.deadline)}</span>
                        </div>
                        <p>${assignment.description}</p>
                    </div>
                    <div class="assignment-actions">
                        <button class="btn btn-sm btn-outline" onclick="dashboard.viewSubmissions(${assignment.id})">
                            查看提交 (${assignment.submission_count})
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="dashboard.gradeAssignment(${assignment.id})">
                            批改
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('加载作业失败:', error);
            const container = document.getElementById('assignments-list');
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clipboard-list fa-3x"></i>
                    <p>加载失败</p>
                </div>
            `;
        }
    }

    // 其他方法保持不变...
    // formatTime, formatDateTime, formatFileSize, getMaterialIcon, getStatusText, showMessage等

    switchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // 更新标签内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');
        
        // 更新面包屑
        document.getElementById('current-tab').textContent = 
            e.currentTarget.querySelector('span').textContent;
        
        this.currentTab = tab;
        
        // 加载对应标签的数据
        this.loadTabData(tab);
    }

    onCourseSelect(e) {
        this.currentCourseId = e.target.value;
        
        // 更新其他页面的课程选择器
        ['material', 'assignment', 'grade'].forEach(type => {
            const select = document.getElementById(`${type}-course-select`);
            if (select) {
                select.value = this.currentCourseId;
            }
        });
        
        // 重新加载当前标签数据
        this.loadTabData(this.currentTab);
    }

    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 3000);
    }

    // 初始化页面
    initPage() {
        // 初始化拖拽排序（如果需要）
        // this.initSortable();
        
        // 加载第一个标签的数据
        this.loadTabData('dashboard');
    }

    // 模拟一些操作
    publishCourse() {
        this.showMessage('课程已发布（演示功能）', 'success');
    }

    saveCourseConfig() {
        this.showMessage('课程配置已保存（演示功能）', 'success');
    }

    showCreateCourseModal() {
        this.showMessage('创建课程功能（演示）', 'info');
    }

    showCreateAssignmentModal() {
        this.showMessage('布置作业功能（演示）', 'info');
    }

    showAddGradeItemModal() {
        this.showMessage('添加成绩项功能（演示）', 'info');
    }

    predictGrades() {
        this.showMessage('成绩预测功能（演示）', 'info');
    }

    // 移除登录检查
    // checkLoginStatus() { ... }
    
    // 移除API相关方法，使用演示数据
    async apiFetch(endpoint, options = {}) {
        // 演示版本，直接返回空数据或模拟数据
        console.log('模拟API请求:', endpoint);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({});
            }, 500);
        });
    }
}

// 初始化应用
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new TeacherDashboard();
});

// 全局API函数（演示版本）
async function apiFetch(path, options = {}) {
    return dashboard.apiFetch(path, options);
}