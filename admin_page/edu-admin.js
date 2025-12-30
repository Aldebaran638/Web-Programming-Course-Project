// 教学管理端主程序
class EduAdminApp {
    constructor() {
        this.apiBase = 'http://127.0.0.1:8000/api/v1';
        this.currentPage = 'dashboard';
        this.currentUser = null;
        this.modalQueue = [];
        this.init();
    }
    
    init() {
        // 检查登录状态
        this.checkAuth();
        
        // 初始化事件监听
        this.initEvents();
        
        // 加载仪表板
        this.loadPage('dashboard');
    }
    
    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            // 未登录，跳转到统一网关登录页
            window.location.href = '../aldebaran/page.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(user);
            
            // 检查用户角色是否为教学管理员
            if (this.currentUser.role !== 'edu_admin') {
                this.showError('权限不足，您不是教学管理员');
                setTimeout(() => {
                    // 非教学管理员，回到统一网关首页
                    window.location.href = '../aldebaran/page.html';
                }, 2000);
                return;
            }
            
            // 更新用户名显示
            document.getElementById('username').textContent = this.currentUser.username;
        } catch (error) {
            console.error('解析用户信息失败:', error);
            this.logout();
        }
    }
    
    initEvents() {
        // 导航菜单点击事件
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        // 学期选择变化
        document.getElementById('current-semester')?.addEventListener('change', (e) => {
            this.currentSemester = e.target.value;
            // 重新加载当前页面数据
            this.reloadCurrentPage();
        });
        
        // 点击通知图标
        document.querySelector('.notifications')?.addEventListener('click', () => {
            this.showNotifications();
        });
    }
    
    navigateTo(page) {
        // 更新导航菜单激活状态
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // 更新面包屑导航
        this.updateBreadcrumb(page);
        
        // 加载页面
        this.loadPage(page);
    }
    
    updateBreadcrumb(page) {
        const pageTitles = {
            'dashboard': '仪表板',
            'class-management': '班级管理',
            'student-management': '学生管理',
            'teacher-management': '教师管理',
            'course-management': '课程管理',
            'classroom-management': '教室管理',
            'teaching-schedule': '教学安排',
            'timetable': '课程表',
            'grade-review': '成绩审核',
            'grade-publish': '成绩发布'
        };
        
        document.getElementById('page-title').textContent = pageTitles[page];
        document.getElementById('current-page').textContent = pageTitles[page];
    }
    
    async loadPage(page) {
        this.currentPage = page;
        const contentArea = document.getElementById('content-area');
        
        // 显示加载状态
        console.log('[EduAdminApp] loadPage start', { page });
        contentArea.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        
        try {
            let html = '';
            
            switch (page) {
                case 'dashboard':
                    html = await this.loadDashboard();
                    break;
                case 'class-management':
                    html = await this.loadClassManagement();
                    break;
                case 'student-management':
                    html = await this.loadStudentManagement();
                    break;
                case 'teacher-management':
                    html = await this.loadTeacherManagement();
                    break;
                case 'course-management':
                    html = await this.loadCourseManagement();
                    break;
                case 'classroom-management':
                    html = await this.loadClassroomManagement();
                    break;
                case 'teaching-schedule':
                    html = await this.loadTeachingSchedule();
                    break;
                case 'timetable':
                    html = await this.loadTimetable();
                    break;
                case 'grade-review':
                    html = await this.loadGradeReview();
                    break;
                case 'grade-publish':
                    html = await this.loadGradePublish();
                    break;
                default:
                    html = await this.loadDashboard();
            }
            
            console.log('[EduAdminApp] loadPage html length', { page, length: html?.length });
            contentArea.innerHTML = html;
            console.log('[EduAdminApp] initPageEvents', { page });
            this.initPageEvents(page);
        } catch (error) {
            console.error(`加载页面 ${page} 失败:`, error);
            contentArea.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-circle"></i>
                    加载页面失败: ${error.message}
                </div>
            `;
        }
    }
    
    reloadCurrentPage() {
        this.loadPage(this.currentPage);
    }
    
    // ==================== 页面加载方法 ====================
    
    async loadDashboard() {
        // 获取统计数据
        const stats = await this.fetchDashboardStats();
        
        return `
            <div class="dashboard">
                <div class="stat-card">
                    <div class="stat-icon students">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="stat-details">
                        <h3>${stats.students || '0'}</h3>
                        <p>学生总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon teachers">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div class="stat-details">
                        <h3>${stats.teachers || '0'}</h3>
                        <p>教师总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon classes">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-details">
                        <h3>${stats.classes || '0'}</h3>
                        <p>班级总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon courses">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-details">
                        <h3>${stats.courses || '0'}</h3>
                        <p>课程总数</p>
                    </div>
                </div>
            </div>
            
            <div class="page-card">
                <div class="page-header">
                    <h2>待处理事项</h2>
                </div>
                <div class="table-container">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-check"></i>
                        <h3>暂无待处理事项</h3>
                        <p>所有教学管理任务已完成</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadClassManagement() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>班级管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-class-btn">
                            <i class="fas fa-plus"></i> 新增班级
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-class" placeholder="搜索班级名称...">
                    </div>
                    <div class="filter-group">
                        <select id="filter-department">
                            <option value="">所有院系</option>
                            <option value="计算机系">计算机系</option>
                            <option value="软件工程系">软件工程系</option>
                            <option value="数学系">数学系</option>
                            <option value="物理系">物理系</option>
                        </select>
                        <button class="btn btn-outline" id="reset-filters">
                            <i class="fas fa-redo"></i> 重置
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="data-table" id="class-table">
                            <thead>
                                <tr>
                                    <th>班级名称</th>
                                    <th>所属院系</th>
                                    <th>入学年份</th>
                                    <th>学生人数</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="class-table-body">
                                <!-- 班级数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="loading" id="class-loading">
                        <div class="spinner"></div>
                    </div>
                    
                    <div class="empty-state" id="class-empty" style="display: none;">
                        <i class="fas fa-users"></i>
                        <h3>暂无班级数据</h3>
                        <p>点击"新增班级"按钮创建第一个班级</p>
                    </div>
                    
                    <div class="pagination" id="class-pagination"></div>
                </div>
            </div>
        `;
    }
    
    async loadStudentManagement() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>学生管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-student-btn">
                            <i class="fas fa-plus"></i> 新增学生
                        </button>
                        <button class="btn btn-secondary" id="batch-import-btn">
                            <i class="fas fa-file-import"></i> 批量导入
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-student" placeholder="搜索学号或姓名...">
                    </div>
                    <div class="filter-group">
                        <select id="filter-class">
                            <option value="">所有班级</option>
                            <!-- 班级选项将通过JS动态加载 -->
                        </select>
                        <select id="filter-status">
                            <option value="">所有状态</option>
                            <option value="active">激活</option>
                            <option value="locked">锁定</option>
                        </select>
                        <button class="btn btn-outline" id="reset-student-filters">
                            <i class="fas fa-redo"></i> 重置
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="data-table" id="student-table">
                            <thead>
                                <tr>
                                    <th>学号</th>
                                    <th>姓名</th>
                                    <th>班级</th>
                                    <th>邮箱</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="student-table-body">
                                <!-- 学生数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="loading" id="student-loading">
                        <div class="spinner"></div>
                    </div>
                    
                    <div class="empty-state" id="student-empty" style="display: none;">
                        <i class="fas fa-user-graduate"></i>
                        <h3>暂无学生数据</h3>
                        <p>点击"新增学生"按钮创建学生账号</p>
                    </div>
                    
                    <div class="pagination" id="student-pagination"></div>
                </div>
            </div>
        `;
    }
    
    async loadTeacherManagement() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>教师管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-teacher-btn">
                            <i class="fas fa-plus"></i> 新增教师
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-teacher" placeholder="搜索工号或姓名...">
                    </div>
                    <div class="filter-group">
                        <select id="filter-title">
                            <option value="">所有职称</option>
                            <option value="教授">教授</option>
                            <option value="副教授">副教授</option>
                            <option value="讲师">讲师</option>
                            <option value="助教">助教</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="data-table" id="teacher-table">
                            <thead>
                                <tr>
                                    <th>工号</th>
                                    <th>姓名</th>
                                    <th>职称</th>
                                    <th>邮箱</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="teacher-table-body">
                                <!-- 教师数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="loading" id="teacher-loading">
                        <div class="spinner"></div>
                    </div>
                    
                    <div class="empty-state" id="teacher-empty" style="display: none;">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <h3>暂无教师数据</h3>
                        <p>点击"新增教师"按钮创建教师账号</p>
                    </div>
                    
                    <div class="pagination" id="teacher-pagination"></div>
                </div>
            </div>
        `;
    }
    
    async loadCourseManagement() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>课程管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-course-btn">
                            <i class="fas fa-plus"></i> 新增课程
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-course" placeholder="搜索课程号或课程名...">
                    </div>
                    <div class="filter-group">
                        <select id="filter-course-department">
                            <option value="">所有院系</option>
                            <option value="计算机系">计算机系</option>
                            <option value="软件工程系">软件工程系</option>
                            <option value="数学系">数学系</option>
                            <option value="物理系">物理系</option>
                        </select>
                        <input type="number" id="filter-credits" placeholder="学分" min="0" max="10" step="0.5">
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="data-table" id="course-table">
                            <thead>
                                <tr>
                                    <th>课程编号</th>
                                    <th>课程名称</th>
                                    <th>学分</th>
                                    <th>开课院系</th>
                                    <th>授课教师</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="course-table-body">
                                <!-- 课程数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="loading" id="course-loading">
                        <div class="spinner"></div>
                    </div>
                    
                    <div class="empty-state" id="course-empty" style="display: none;">
                        <i class="fas fa-book"></i>
                        <h3>暂无课程数据</h3>
                        <p>点击"新增课程"按钮创建第一门课程</p>
                    </div>
                    
                    <div class="pagination" id="course-pagination"></div>
                </div>
            </div>
        `;
    }
    
    async loadClassroomManagement() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>教室管理</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-classroom-btn">
                            <i class="fas fa-plus"></i> 新增教室
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-classroom" placeholder="搜索教室名称或位置...">
                    </div>
                    <div class="filter-group">
                        <select id="filter-capacity">
                            <option value="">所有容量</option>
                            <option value="50">50人以下</option>
                            <option value="100">50-100人</option>
                            <option value="200">100人以上</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="data-table" id="classroom-table">
                            <thead>
                                <tr>
                                    <th>教室名称</th>
                                    <th>位置</th>
                                    <th>容量</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="classroom-table-body">
                                <!-- 教室数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="loading" id="classroom-loading">
                        <div class="spinner"></div>
                    </div>
                    
                    <div class="empty-state" id="classroom-empty" style="display: none;">
                        <i class="fas fa-school"></i>
                        <h3>暂无教室数据</h3>
                        <p>点击"新增教室"按钮添加教室资源</p>
                    </div>
                    
                    <div class="pagination" id="classroom-pagination"></div>
                </div>
            </div>
        `;
    }
    
    async loadTeachingSchedule() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>教学安排</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="add-schedule-btn">
                            <i class="fas fa-plus"></i> 安排课程
                        </button>
                        <button class="btn btn-secondary" id="assign-teacher-btn">
                            <i class="fas fa-user-tie"></i> 分配教师
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="filter-group">
                        <select id="semester-select">
                            <option value="2025-2026-1">2025-2026学年 第1学期</option>
                            <option value="2025-2026-2">2025-2026学年 第2学期</option>
                        </select>
                        <select id="teacher-filter">
                            <option value="">所有教师</option>
                            <!-- 教师选项将通过JS动态加载 -->
                        </select>
                    </div>
                </div>
                
                <div class="timetable-container">
                    <div class="timetable-header">
                        <h3>课程安排表</h3>
                        <div class="legend">
                            <span class="legend-item"><span class="legend-color" style="background: #e3f2fd;"></span> 已安排课程</span>
                        </div>
                    </div>
                    
                    <div class="timetable-grid">
                        <table class="timetable" id="schedule-table">
                            <thead>
                                <tr>
                                    <th>时间</th>
                                    <th>周一</th>
                                    <th>周二</th>
                                    <th>周三</th>
                                    <th>周四</th>
                                    <th>周五</th>
                                    <th>周六</th>
                                    <th>周日</th>
                                </tr>
                            </thead>
                            <tbody id="timetable-body">
                                <!-- 时间表数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="table-container" style="margin-top: 30px;">
                    <h3>本学期授课任务</h3>
                    <div class="table-responsive">
                        <table class="data-table" id="teaching-assignments-table">
                            <thead>
                                <tr>
                                    <th>课程</th>
                                    <th>授课教师</th>
                                    <th>学期</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="teaching-assignments-body">
                                <!-- 授课任务数据将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadTimetable() {
        return `
            <div class="page-card">
                <div class="page-header">
                    <h2>课程表查询</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="export-timetable-btn">
                            <i class="fas fa-download"></i> 导出课表
                        </button>
                    </div>
                </div>
                
                <div class="search-filter">
                    <div class="filter-group">
                        <select id="timetable-type">
                            <option value="teacher">教师课表</option>
                            <option value="class">班级课表</option>
                            <option value="room">教室课表</option>
                        </select>
                        <select id="timetable-target" style="min-width: 200px;">
                            <option value="">请选择...</option>
                        </select>
                        <select id="timetable-semester">
                            <option value="2025-2026-1">2025-2026学年 第1学期</option>
                            <option value="2025-2026-2">2025-2026学年 第2学期</option>
                        </select>
                        <button class="btn btn-primary" id="load-timetable-btn">
                            <i class="fas fa-search"></i> 查询
                        </button>
                    </div>
                </div>
                
                <div class="timetable-container" id="timetable-result" style="display: none;">
                    <div class="timetable-header">
                        <h3 id="timetable-title">课程表</h3>
                        <div id="timetable-info"></div>
                    </div>
                    
                    <div class="timetable-grid">
                        <table class="timetable" id="result-timetable">
                            <thead>
                                <tr>
                                    <th>时间</th>
                                    <th>周一</th>
                                    <th>周二</th>
                                    <th>周三</th>
                                    <th>周四</th>
                                    <th>周五</th>
                                    <th>周六</th>
                                    <th>周日</th>
                                </tr>
                            </thead>
                            <tbody id="result-timetable-body">
                                <!-- 查询结果将通过JS动态加载 -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="empty-state" id="timetable-empty">
                    <i class="fas fa-table"></i>
                    <h3>请选择查询条件查看课程表</h3>
                    <p>您可以根据教师、班级或教室查询对应的课程安排</p>
                </div>
            </div>
        `;
    }

    // 成绩审核页面
    async loadGradeReview() {
        console.log('[EduAdminApp] loadGradeReview (class method)');
        return `
    <div class="page-card">
        <div class="page-header">
            <h2>成绩审核</h2>
            <div class="header-actions">
                <button class="btn btn-primary" id="refresh-reviews-btn">
                    <i class="fas fa-sync-alt"></i> 刷新
                </button>
            </div>
        </div>
        
        <div class="search-filter">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-course" placeholder="搜索课程名称或编号...">
            </div>
            <div class="filter-group">
                <select id="filter-semester">
                    <option value="">所有学期</option>
                    <option value="2025-2026-1">2025-2026学年 第1学期</option>
                    <option value="2025-2026-2">2025-2026学年 第2学期</option>
                </select>
                <select id="filter-warning">
                    <option value="">所有状态</option>
                    <option value="has_warning">有异常警告</option>
                    <option value="no_warning">无异常警告</option>
                </select>
                <button class="btn btn-outline" id="reset-grade-filters">
                    <i class="fas fa-redo"></i> 重置
                </button>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-responsive">
                <table class="data-table" id="grade-review-table">
                    <thead>
                        <tr>
                            <th width="50px">
                                <input type="checkbox" id="select-all">
                            </th>
                            <th>课程信息</th>
                            <th>学期</th>
                            <th>成绩状态</th>
                            <th>异常警告</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="grade-review-body">
                        <!-- 成绩审核数据将通过JS动态加载 -->
                    </tbody>
                </table>
            </div>
            
            <div class="loading" id="review-loading">
                <div class="spinner"></div>
            </div>
            
            <div class="empty-state" id="review-empty" style="display: none;">
                <i class="fas fa-clipboard-check"></i>
                <h3>暂无待审核的成绩</h3>
                <p>所有成绩均已审核通过</p>
            </div>
            
            <div class="pagination" id="review-pagination"></div>
            
            <div class="batch-actions" id="batch-actions" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                <h4>批量操作</h4>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn btn-success" id="batch-approve-btn">
                        <i class="fas fa-check-circle"></i> 批量审核通过
                    </button>
                    <button class="btn btn-danger" id="batch-reject-btn">
                        <i class="fas fa-times-circle"></i> 批量退回修改
                    </button>
                    <button class="btn btn-secondary" id="cancel-batch">
                        <i class="fas fa-times"></i> 取消选择
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div id="grade-detail-modal" style="display: none;">
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header">
                    <h3 id="detail-course-title">成绩详情</h3>
                    <button class="close-btn" onclick="gradeReviewManager.closeDetailModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- 详细内容略，沿用原 grade-review.html -->
                </div>
            </div>
        </div>
    </div>
        `;
    }

    // 成绩发布页面（先提供一个简单占位，具体内容由 GradePublishManager 管理）
    async loadGradePublish() {
        console.log('[EduAdminApp] loadGradePublish (class method)');
        return `
        <div class="page-card">
            <div class="page-header">
                <h2>成绩发布</h2>
            </div>
            <div class="table-container">
                <div class="empty-state" id="publish-empty" style="display: none;">
                    <i class="fas fa-paper-plane"></i>
                    <h3>暂无待发布的成绩</h3>
                    <p>请先在成绩审核页面完成审核</p>
                </div>
                <div class="loading" id="publish-loading">
                    <div class="spinner"></div>
                </div>
                <div class="table-responsive">
                    <table class="data-table" id="grade-publish-table">
                        <thead>
                            <tr>
                                <th width="50px">
                                    <input type="checkbox" id="publish-select-all">
                                </th>
                                <th>课程信息</th>
                                <th>学期</th>
                                <th>待发布人数</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="grade-publish-body">
                            <!-- 待发布成绩数据将通过JS动态加载 -->
                        </tbody>
                    </table>
                </div>
                <div class="pagination" id="publish-pagination"></div>
                <div class="batch-actions" id="publish-batch-actions" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                    <h4>批量发布</h4>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn btn-success" id="batch-publish-btn">
                            <i class="fas fa-paper-plane"></i> 批量发布
                        </button>
                        <button class="btn btn-secondary" id="cancel-publish-batch">
                            <i class="fas fa-times"></i> 取消选择
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="publish-confirm-modal" style="display: none;">
            <div class="modal-overlay">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 id="publish-confirm-title">确认发布</h3>
                        <button class="close-btn" onclick="gradePublishManager.closeConfirmModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p id="publish-confirm-text">确认要发布选中的课程成绩吗？</p>
                        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="btn btn-secondary" onclick="gradePublishManager.closeConfirmModal()">取消</button>
                            <button class="btn btn-success" id="publish-confirm-btn">确认发布</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    // ==================== 页面事件初始化 ====================
    
    initPageEvents(page) {
        switch (page) {
            case 'dashboard':
                this.initDashboardEvents();
                break;
            case 'class-management':
                this.initClassManagementEvents();
                break;
            case 'student-management':
                this.initStudentManagementEvents();
                break;
            case 'teacher-management':
                this.initTeacherManagementEvents();
                break;
            case 'course-management':
                this.initCourseManagementEvents();
                break;
            case 'classroom-management':
                this.initClassroomManagementEvents();
                break;
            case 'teaching-schedule':
                this.initTeachingScheduleEvents();
                break;
            case 'timetable':
                this.initTimetableEvents();
                break;
            case 'grade-review':
                this.initGradeReviewEvents();
                break;
            case 'grade-publish':
                this.initGradePublishEvents();
                break;
        }
    }
    
    initDashboardEvents() {
        // 仪表板不需要特殊事件
    }
    
    initClassManagementEvents() {
        // 初始化班级管理
        const classManager = new ClassManager(this);
        classManager.init();
    }
    
    initStudentManagementEvents() {
        // 初始化学生管理
        const studentManager = new StudentManager(this);
        studentManager.init();
    }
    
    initTeacherManagementEvents() {
        // 初始化教师管理
        const teacherManager = new TeacherManager(this);
        teacherManager.init();
    }
    
    initCourseManagementEvents() {
        // 初始化课程管理
        const courseManager = new CourseManager(this);
        courseManager.init();
    }
    
    initClassroomManagementEvents() {
        // 初始化教室管理
        const classroomManager = new ClassroomManager(this);
        classroomManager.init();
    }
    
    initTeachingScheduleEvents() {
        // 初始化教学安排
        const scheduleManager = new ScheduleManager(this);
        scheduleManager.init();
    }
    
    initTimetableEvents() {
        // 初始化课程表查询
        const timetableManager = new TimetableManager(this);
        timetableManager.init();
    }
    
    // ==================== API调用方法 ====================
    
    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(`${this.apiBase}${url}`, mergedOptions);
            
            if (response.status === 401) {
                // 未授权，跳转到登录页
                this.logout();
                throw new Error('会话已过期，请重新登录');
            }
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `请求失败: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }
    
    async fetchDashboardStats() {
        try {
            // 调用后端真实统计接口，避免前端写死假数据
            const data = await this.fetchWithAuth('/edu-admin/dashboard-stats');

            if (data && typeof data.students === 'number') {
                return data;
            }

            console.warn('[EduAdminApp] Unexpected dashboard stats payload', data);
            return {
                students: 0,
                teachers: 0,
                classes: 0,
                courses: 0
            };
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return {
                students: 0,
                teachers: 0,
                classes: 0,
                courses: 0
            };
        }
    }
    
    // ==================== 通用工具方法 ====================
    
    showModal(title, content) {
        const modalId = `modal-${Date.now()}`;
        const modalHtml = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="close-btn" onclick="app.closeModal('${modalId}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modal-container').innerHTML = modalHtml;
        this.modalQueue.push(modalId);
        
        return modalId;
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
            this.modalQueue = this.modalQueue.filter(id => id !== modalId);
        }
    }
    
    closeAllModals() {
        this.modalQueue.forEach(id => this.closeModal(id));
    }
    
    showSuccess(message) {
        this.showAlert(message, 'success');
    }
    
    showError(message) {
        this.showAlert(message, 'error');
    }
    
    showAlert(message, type = 'info') {
        const alertId = `alert-${Date.now()}`;
        const alertHtml = `
            <div class="alert alert-${type}" id="${alertId}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
            </div>
        `;
        
        const contentArea = document.getElementById('content-area');
        contentArea.insertAdjacentHTML('afterbegin', alertHtml);
        
        // 5秒后自动消失
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
    
    showNotifications() {
        // 显示通知列表
        const content = `
            <div class="notifications-list">
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                    </div>
                    <div class="notification-content">
                        <p>有3个课程的成绩待审核</p>
                        <span class="notification-time">5分钟前</span>
                    </div>
                </div>
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="fas fa-info-circle text-info"></i>
                    </div>
                    <div class="notification-content">
                        <p>系统将于今晚24:00进行维护</p>
                        <span class="notification-time">2小时前</span>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('通知', content);
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 退出后返回统一网关登录页
        window.location.href = '../aldebaran/page.html';
    }
}

// 班级管理类
class ClassManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
    }
    
    init() {
        this.loadClasses();
        this.initEvents();
    }
    
    initEvents() {
        // 新增班级按钮
        document.getElementById('add-class-btn')?.addEventListener('click', () => {
            this.showAddClassModal();
        });
        
        // 搜索输入
        document.getElementById('search-class')?.addEventListener('input', (e) => {
            this.currentFilters.class_name = e.target.value || undefined;
            this.currentPage = 1;
            this.loadClasses();
        });
        
        // 院系筛选
        document.getElementById('filter-department')?.addEventListener('change', (e) => {
            this.currentFilters.department = e.target.value || undefined;
            this.currentPage = 1;
            this.loadClasses();
        });
        
        // 重置筛选
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            document.getElementById('search-class').value = '';
            document.getElementById('filter-department').value = '';
            this.currentFilters = {};
            this.currentPage = 1;
            this.loadClasses();
        });
        
        // 分页按钮事件委托
        document.getElementById('class-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadClasses();
                }
            }
        });
    }
    
    async loadClasses() {
        const loading = document.getElementById('class-loading');
        const empty = document.getElementById('class-empty');
        const tableBody = document.getElementById('class-table-body');
        
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        
        try {
            // 构建查询参数
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.currentFilters
            });
            
            const data = await this.app.fetchWithAuth(`/classes?${params}`);
            
            this.totalItems = data.pagination.totalItems;
            this.totalPages = data.pagination.totalPages;
            
            if (data.items.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 渲染表格
            data.items.forEach(cls => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cls.class_name}</td>
                    <td>${cls.department || '-'}</td>
                    <td>${cls.enrollment_year || '-'}</td>
                    <td>${cls.student_count || 0}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="classManager.editClass(${cls.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="classManager.deleteClass(${cls.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            loading.style.display = 'none';
            this.renderPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('class-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    showAddClassModal() {
        const content = `
            <form id="add-class-form">
                <div class="form-group">
                    <label for="class-name">班级名称 *</label>
                    <input type="text" id="class-name" name="class_name" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="class-department">所属院系</label>
                        <select id="class-department" name="department">
                            <option value="">请选择院系</option>
                            <option value="计算机系">计算机系</option>
                            <option value="软件工程系">软件工程系</option>
                            <option value="数学系">数学系</option>
                            <option value="物理系">物理系</option>
                            <option value="外语系">外语系</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="enrollment-year">入学年份</label>
                        <input type="number" id="enrollment-year" name="enrollment_year" 
                               min="2000" max="2030" value="2025">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">保存</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('新增班级', content);
        
        document.getElementById('add-class-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createClass(modalId);
        });
    }
    
    async createClass(modalId) {
        const form = document.getElementById('add-class-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await this.app.fetchWithAuth('/classes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('班级创建成功');
            this.app.closeModal(modalId);
            this.loadClasses();
        } catch (error) {
            this.app.showError('创建失败: ' + error.message);
        }
    }
    
    async editClass(classId) {
        try {
            const cls = await this.app.fetchWithAuth(`/classes/${classId}`);

            const content = `
                <form id="edit-class-form">
                    <div class="form-group">
                        <label for="edit-class-name">班级名称 *</label>
                        <input type="text" id="edit-class-name" name="class_name" value="${cls.class_name || ''}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-class-department">所属院系</label>
                            <select id="edit-class-department" name="department">
                                <option value="">请选择院系</option>
                                <option value="计算机系" ${cls.department === '计算机系' ? 'selected' : ''}>计算机系</option>
                                <option value="软件工程系" ${cls.department === '软件工程系' ? 'selected' : ''}>软件工程系</option>
                                <option value="数学系" ${cls.department === '数学系' ? 'selected' : ''}>数学系</option>
                                <option value="物理系" ${cls.department === '物理系' ? 'selected' : ''}>物理系</option>
                                <option value="外语系" ${cls.department === '外语系' ? 'selected' : ''}>外语系</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-enrollment-year">入学年份</label>
                            <input type="number" id="edit-enrollment-year" name="enrollment_year" min="2000" max="2030" value="${cls.enrollment_year || ''}">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存修改</button>
                        <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                    </div>
                </form>
            `;

            const modalId = this.app.showModal('编辑班级信息', content);

            document.getElementById('edit-class-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateClass(classId, modalId);
            });
        } catch (error) {
            this.app.showError('加载班级信息失败: ' + error.message);
        }
    }

    async updateClass(classId, modalId) {
        const form = document.getElementById('edit-class-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.enrollment_year) {
            data.enrollment_year = parseInt(data.enrollment_year, 10);
        }

        try {
            await this.app.fetchWithAuth(`/classes/${classId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            this.app.showSuccess('班级信息更新成功');
            this.app.closeModal(modalId);
            this.loadClasses();
        } catch (error) {
            this.app.showError('更新失败: ' + error.message);
        }
    }
    
    async deleteClass(classId) {
        if (!confirm('确定要删除这个班级吗？此操作不可撤销。')) {
            return;
        }
        
        try {
            await this.app.fetchWithAuth(`/classes/${classId}`, {
                method: 'DELETE'
            });
            
            this.app.showSuccess('班级删除成功');
            this.loadClasses();
        } catch (error) {
            this.app.showError('删除失败: ' + error.message);
        }
    }
}

// 继续完成学生管理类
class StudentManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
    }
    
    async init() {
        await this.loadClassesForFilter(); // 先加载班级选项
        this.loadStudents();
        this.initEvents();
    }
    
    async loadClassesForFilter() {
        try {
            const data = await this.app.fetchWithAuth(`/classes?pageSize=100`);
            const select = document.getElementById('filter-class');
            if (select) {
                select.innerHTML = '<option value="">所有班级</option>';
                data.items.forEach(cls => {
                    select.innerHTML += `<option value="${cls.id}">${cls.class_name}</option>`;
                });
            }
        } catch (error) {
            console.error('加载班级列表失败:', error);
        }
    }
    
    initEvents() {
        // 新增学生按钮
        document.getElementById('add-student-btn')?.addEventListener('click', () => {
            this.showAddStudentModal();
        });
        
        // 批量导入按钮
        document.getElementById('batch-import-btn')?.addEventListener('click', () => {
            this.showImportModal();
        });
        
        // 搜索输入
        document.getElementById('search-student')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value || undefined;
            this.currentPage = 1;
            this.loadStudents();
        });
        
        // 班级筛选
        document.getElementById('filter-class')?.addEventListener('change', (e) => {
            this.currentFilters.class_id = e.target.value || undefined;
            this.currentPage = 1;
            this.loadStudents();
        });
        
        // 状态筛选
        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value || undefined;
            this.currentPage = 1;
            this.loadStudents();
        });
        
        // 重置筛选
        document.getElementById('reset-student-filters')?.addEventListener('click', () => {
            document.getElementById('search-student').value = '';
            document.getElementById('filter-class').value = '';
            document.getElementById('filter-status').value = '';
            this.currentFilters = {};
            this.currentPage = 1;
            this.loadStudents();
        });
        
        // 分页按钮事件委托
        document.getElementById('student-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadStudents();
                }
            }
        });
    }
    
    async loadStudents() {
        const loading = document.getElementById('student-loading');
        const empty = document.getElementById('student-empty');
        const tableBody = document.getElementById('student-table-body');
        
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        
        try {
            // 构建查询参数
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.currentFilters
            });
            
            const data = await this.app.fetchWithAuth(`/students?${params}`);
            
            this.totalItems = data.pagination.totalItems;
            this.totalPages = data.pagination.totalPages;
            
            if (data.items.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 渲染表格
            data.items.forEach(student => {
                const isActive = student.status === 'active';
                const nextStatus = isActive ? 'locked' : 'active';
                const statusBadge = `
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}" 
                          onclick="studentManager.toggleStatus(${student.id}, '${nextStatus}')">
                        ${isActive ? '激活' : '锁定'}
                    </span>
                `;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.username || '-'}</td>
                    <td>${student.full_name || '-'}</td>
                    <td>${student.class_name || '-'}</td>
                    <td>${student.email || '-'}</td>
                    <td>${statusBadge}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="studentManager.editStudent(${student.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="studentManager.deleteStudent(${student.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            loading.style.display = 'none';
            this.renderPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    async toggleStatus(studentId, newStatus) {
        if (!['active', 'locked'].includes(newStatus)) {
            return;
        }

        const confirmText = newStatus === 'locked'
            ? '确定要锁定该学生账号吗？'
            : '确定要激活该学生账号吗？';
        if (!confirm(confirmText)) {
            return;
        }

        try {
            await this.app.fetchWithAuth(`/students/${studentId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            this.app.showSuccess('学生状态更新成功');
            this.loadStudents();
        } catch (error) {
            this.app.showError('更新状态失败: ' + error.message);
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('student-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    async showAddStudentModal() {
        // 先加载班级选项
        let classesOptions = '<option value="">请选择班级</option>';
        try {
            const classesData = await this.app.fetchWithAuth('/classes?pageSize=100');
            classesData.items.forEach(cls => {
                classesOptions += `<option value="${cls.id}">${cls.class_name}</option>`;
            });
        } catch (error) {
            console.error('加载班级列表失败:', error);
        }
        
        const content = `
            <form id="add-student-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="student-username">学号 *</label>
                        <input type="text" id="student-username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="student-fullname">姓名 *</label>
                        <input type="text" id="student-fullname" name="full_name" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="student-email">邮箱 *</label>
                        <input type="email" id="student-email" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="student-class">班级</label>
                        <select id="student-class" name="class_id">
                            ${classesOptions}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="initial-password">初始密码 *</label>
                    <input type="text" id="initial-password" name="password" value="123456" required>
                    <small style="color: #6c757d; margin-top: 5px; display: block;">
                        学生首次登录需要修改密码
                    </small>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">保存</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('新增学生', content);
        
        document.getElementById('add-student-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createStudent(modalId);
        });
    }
    
    async createStudent(modalId) {
        const form = document.getElementById('add-student-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await this.app.fetchWithAuth('/students', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('学生创建成功');
            this.app.closeModal(modalId);
            this.loadStudents();
        } catch (error) {
            this.app.showError('创建失败: ' + error.message);
        }
    }
    
    async editStudent(studentId) {
        try {
            // 获取学生信息
            const student = await this.app.fetchWithAuth(`/students/${studentId}`);
            
            // 加载班级选项
            let classesOptions = '<option value="">请选择班级</option>';
            const classesData = await this.app.fetchWithAuth('/classes?pageSize=100');
            classesData.items.forEach(cls => {
                const selected = cls.id === student.class_id ? 'selected' : '';
                classesOptions += `<option value="${cls.id}" ${selected}>${cls.class_name}</option>`;
            });
            
            const content = `
                <form id="edit-student-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-student-username">学号</label>
                            <input type="text" id="edit-student-username" name="username" value="${student.username}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-student-fullname">姓名 *</label>
                            <input type="text" id="edit-student-fullname" name="full_name" value="${student.full_name}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-student-email">邮箱 *</label>
                            <input type="email" id="edit-student-email" name="email" value="${student.email}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-student-class">班级</label>
                            <select id="edit-student-class" name="class_id">
                                ${classesOptions}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存修改</button>
                        <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                    </div>
                </form>
            `;
            
            const modalId = this.app.showModal('编辑学生信息', content);
            
            document.getElementById('edit-student-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateStudent(studentId, modalId);
            });
            
        } catch (error) {
            this.app.showError('加载学生信息失败: ' + error.message);
        }
    }
    
    async updateStudent(studentId, modalId) {
        const form = document.getElementById('edit-student-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await this.app.fetchWithAuth(`/students/${studentId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('学生信息更新成功');
            this.app.closeModal(modalId);
            this.loadStudents();
        } catch (error) {
            this.app.showError('更新失败: ' + error.message);
        }
    }
    
    async deleteStudent(studentId) {
        if (!confirm('确定要删除这个学生吗？此操作将删除学生的所有相关信息。')) {
            return;
        }
        
        try {
            await this.app.fetchWithAuth(`/students/${studentId}`, {
                method: 'DELETE'
            });
            
            this.app.showSuccess('学生删除成功');
            this.loadStudents();
        } catch (error) {
            this.app.showError('删除失败: ' + error.message);
        }
    }
    
    showImportModal() {
        const content = `
            <form id="import-student-form">
                <div class="form-group">
                    <label for="import-file">选择文件</label>
                    <input type="file" id="import-file" accept=".csv,.xlsx,.xls" required>
                    <small style="color: #6c757d; margin-top: 5px; display: block;">
                        支持CSV、Excel格式，文件应包含学号、姓名、班级等列
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="import-template">下载模板</label>
                    <div>
                        <button type="button" class="btn btn-outline" onclick="studentManager.downloadTemplate('csv')" style="margin-right: 10px;">
                            <i class="fas fa-download"></i> CSV模板
                        </button>
                        <button type="button" class="btn btn-outline" onclick="studentManager.downloadTemplate('xlsx')">
                            <i class="fas fa-download"></i> Excel模板
                        </button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">导入</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('批量导入学生', content);
        
        document.getElementById('import-student-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.importStudents(modalId);
        });
    }
    
    downloadTemplate(type) {
        const headers = ['student_id_number', 'full_name', 'class_name', 'email'];
        let content;
        
        if (type === 'csv') {
            content = headers.join(',') + '\n';
            content += '20210001,张三,软件工程2101班,zhangsan@example.com\n';
            content += '20210002,李四,计算机2102班,lisi@example.com';
            
            const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '学生信息模板.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // Excel模板需要第三方库，这里简化处理
            alert('Excel模板功能需要xlsx库支持');
        }
    }
    
    async importStudents(modalId) {
        const fileInput = document.getElementById('import-file');
        if (!fileInput.files.length) {
            this.app.showError('请选择文件');
            return;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const result = await this.app.fetchWithAuth('/users/batch-create-students', {
                method: 'POST',
                body: formData
            }, false); // 不设置Content-Type，让浏览器自动设置
            
            this.app.showSuccess(`导入完成: 共${result.summary.total}条，成功${result.summary.created}条`);
            this.app.closeModal(modalId);
            this.loadStudents();
        } catch (error) {
            this.app.showError('导入失败: ' + error.message);
        }
    }
}

// 教师管理类 - 完整实现
class TeacherManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
    }
    
    init() {
        this.loadTeachers();
        this.initEvents();
    }
    
    initEvents() {
        // 新增教师按钮
        document.getElementById('add-teacher-btn')?.addEventListener('click', () => {
            this.showAddTeacherModal();
        });
        
        // 搜索输入
        document.getElementById('search-teacher')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value || undefined;
            this.currentPage = 1;
            this.loadTeachers();
        });
        
        // 职称筛选
        document.getElementById('filter-title')?.addEventListener('change', (e) => {
            this.currentFilters.title = e.target.value || undefined;
            this.currentPage = 1;
            this.loadTeachers();
        });
        
        // 分页按钮事件委托
        document.getElementById('teacher-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadTeachers();
                }
            }
        });
    }
    
    async loadTeachers() {
        const loading = document.getElementById('teacher-loading');
        const empty = document.getElementById('teacher-empty');
        const tableBody = document.getElementById('teacher-table-body');
        
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        
        try {
            // 构建查询参数
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.currentFilters
            });
            
            const data = await this.app.fetchWithAuth(`/teachers?${params}`);
            
            this.totalItems = data.pagination.totalItems;
            this.totalPages = data.pagination.totalPages;
            
            if (data.items.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 渲染表格
            data.items.forEach(teacher => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${teacher.teacher_id_number || '-'}</td>
                    <td>${teacher.full_name || '-'}</td>
                    <td>${teacher.title || '-'}</td>
                    <td>${teacher.email || '-'}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="teacherManager.editTeacher(${teacher.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="teacherManager.deleteTeacher(${teacher.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            loading.style.display = 'none';
            this.renderPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('teacher-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    showAddTeacherModal() {
        const content = `
            <form id="add-teacher-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacher-id">工号 *</label>
                        <input type="text" id="teacher-id" name="teacher_id_number" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="teacher-fullname">姓名 *</label>
                        <input type="text" id="teacher-fullname" name="full_name" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacher-title">职称</label>
                        <select id="teacher-title" name="title">
                            <option value="">请选择职称</option>
                            <option value="教授">教授</option>
                            <option value="副教授">副教授</option>
                            <option value="讲师">讲师</option>
                            <option value="助教">助教</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="teacher-email">邮箱 *</label>
                        <input type="email" id="teacher-email" name="email" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="teacher-password">初始密码 *</label>
                    <input type="text" id="teacher-password" name="password" value="123456" required>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">保存</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('新增教师', content);
        
        document.getElementById('add-teacher-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createTeacher(modalId);
        });
    }
    
    async createTeacher(modalId) {
        const form = document.getElementById('add-teacher-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await this.app.fetchWithAuth('/teachers', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('教师创建成功');
            this.app.closeModal(modalId);
            this.loadTeachers();
        } catch (error) {
            this.app.showError('创建失败: ' + error.message);
        }
    }
    
    async editTeacher(teacherId) {
        try {
            const teacher = await this.app.fetchWithAuth(`/teachers/${teacherId}`);
            
            const content = `
                <form id="edit-teacher-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-teacher-id">工号</label>
                            <input type="text" id="edit-teacher-id" value="${teacher.teacher_id_number || ''}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-teacher-fullname">姓名 *</label>
                            <input type="text" id="edit-teacher-fullname" name="full_name" value="${teacher.full_name}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-teacher-title">职称</label>
                            <select id="edit-teacher-title" name="title">
                                <option value="">请选择职称</option>
                                <option value="教授" ${teacher.title === '教授' ? 'selected' : ''}>教授</option>
                                <option value="副教授" ${teacher.title === '副教授' ? 'selected' : ''}>副教授</option>
                                <option value="讲师" ${teacher.title === '讲师' ? 'selected' : ''}>讲师</option>
                                <option value="助教" ${teacher.title === '助教' ? 'selected' : ''}>助教</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-teacher-email">邮箱 *</label>
                            <input type="email" id="edit-teacher-email" name="email" value="${teacher.email}" required>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存修改</button>
                        <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                    </div>
                </form>
            `;
            
            const modalId = this.app.showModal('编辑教师信息', content);
            
            document.getElementById('edit-teacher-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateTeacher(teacherId, modalId);
            });
            
        } catch (error) {
            this.app.showError('加载教师信息失败: ' + error.message);
        }
    }
    
    async updateTeacher(teacherId, modalId) {
        const form = document.getElementById('edit-teacher-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const result = await this.app.fetchWithAuth(`/teachers/${teacherId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('教师信息更新成功');
            this.app.closeModal(modalId);
            this.loadTeachers();
        } catch (error) {
            this.app.showError('更新失败: ' + error.message);
        }
    }
    
    async deleteTeacher(teacherId) {
        if (!confirm('确定要删除这个教师吗？此操作将删除教师的所有相关信息。')) {
            return;
        }
        
        try {
            await this.app.fetchWithAuth(`/teachers/${teacherId}`, {
                method: 'DELETE'
            });
            
            this.app.showSuccess('教师删除成功');
            this.loadTeachers();
        } catch (error) {
            this.app.showError('删除失败: ' + error.message);
        }
    }
}

// 课程管理类 - 完整实现
class CourseManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
    }
    
    init() {
        this.loadCourses();
        this.initEvents();
    }
    
    initEvents() {
        // 新增课程按钮
        document.getElementById('add-course-btn')?.addEventListener('click', () => {
            this.showAddCourseModal();
        });
        
        // 搜索输入（按课程名称模糊查询）
        document.getElementById('search-course')?.addEventListener('input', (e) => {
            this.currentFilters.course_name = e.target.value || undefined;
            this.currentPage = 1;
            this.loadCourses();
        });
        
        // 院系筛选
        document.getElementById('filter-course-department')?.addEventListener('change', (e) => {
            this.currentFilters.department = e.target.value || undefined;
            this.currentPage = 1;
            this.loadCourses();
        });
        
        // 学分筛选
        document.getElementById('filter-credits')?.addEventListener('change', (e) => {
            this.currentFilters.credits = e.target.value || undefined;
            this.currentPage = 1;
            this.loadCourses();
        });
        
        // 分页按钮事件委托
        document.getElementById('course-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadCourses();
                }
            }
        });
    }
    
    async loadCourses() {
        const loading = document.getElementById('course-loading');
        const empty = document.getElementById('course-empty');
        const tableBody = document.getElementById('course-table-body');
        
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        
        try {
            // 构建查询参数
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.currentFilters
            });
            
            const data = await this.app.fetchWithAuth(`/courses?${params}`);
            
            this.totalItems = data.pagination.totalItems;
            this.totalPages = data.pagination.totalPages;
            
            if (data.courses.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 渲染表格
            data.courses.forEach(course => {
                const teachers = course.teachers.map(t => t.full_name).join(', ') || '未分配';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${course.course_code || '-'}</td>
                    <td>${course.course_name || '-'}</td>
                    <td>${course.credits || '0'}</td>
                    <td>${course.department || '-'}</td>
                    <td>${teachers}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="courseManager.editCourse(${course.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="courseManager.deleteCourse(${course.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            loading.style.display = 'none';
            this.renderPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('course-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    showAddCourseModal() {
        const content = `
            <form id="add-course-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="course-code">课程编号 *</label>
                        <input type="text" id="course-code" name="course_code" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="course-name">课程名称 *</label>
                        <input type="text" id="course-name" name="course_name" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="course-credits">学分 *</label>
                        <input type="number" id="course-credits" name="credits" step="0.5" min="0.5" max="10" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="course-department">开课院系</label>
                        <select id="course-department" name="department">
                            <option value="">请选择院系</option>
                            <option value="计算机系">计算机系</option>
                            <option value="软件工程系">软件工程系</option>
                            <option value="数学系">数学系</option>
                            <option value="物理系">物理系</option>
                            <option value="外语系">外语系</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="course-description">课程简介</label>
                    <textarea id="course-description" name="description" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="course-prerequisites">先修要求</label>
                    <input type="text" id="course-prerequisites" name="prerequisites" placeholder="例如：CS101, MA201">
                </div>

                <div class="form-group">
                    <label>成绩组成项（必填，权重之和需为 1）</label>
                    <div id="grade-items-container"></div>
                    <button type="button" class="btn btn-sm btn-outline" id="add-grade-item-btn">
                        <i class="fas fa-plus"></i> 添加组成项
                    </button>
                    <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                        例如：平时成绩 0.3，期中考试 0.3，期末考试 0.4
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">保存</button>

                // 初始化默认的成绩组成项
                this.initGradeItemsSection();
        
                document.getElementById('add-course-form')?.addEventListener('submit', async (e) => {
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('新增课程', content);
        
        document.getElementById('add-course-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createCourse(modalId);
        });
    }
    
    async createCourse(modalId) {
        const form = document.getElementById('add-course-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 转换学分类型
        if (data.credits) {
            data.credits = parseFloat(data.credits);
        }

        // 收集成绩组成项
        const gradeItems = [];
        document.querySelectorAll('#grade-items-container .grade-item-row').forEach(row => {
            const nameInput = row.querySelector('.grade-item-name');
            const weightInput = row.querySelector('.grade-item-weight');
            const itemName = nameInput.value.trim();
            const weightStr = weightInput.value.trim();
            if (!itemName && !weightStr) {
                return;
            }
            const weight = parseFloat(weightStr);
            if (!itemName || isNaN(weight)) {
                throw new Error('请完整填写每个成绩组成项的名称和权重');
            }
            gradeItems.push({ item_name: itemName, weight: weight });
        });

        if (gradeItems.length === 0) {
            this.app.showError('请至少配置一个成绩组成项');
            return;
        }

        const totalWeight = gradeItems.reduce((sum, item) => sum + item.weight, 0);
        if (Math.abs(totalWeight - 1) > 1e-6) {
            this.app.showError('所有成绩组成项的权重之和必须等于 1');
            return;
        }

        data.grade_items = gradeItems;
        
        try {
            const result = await this.app.fetchWithAuth('/courses', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('课程创建成功');
            this.app.closeModal(modalId);
            this.loadCourses();
        } catch (error) {
            this.app.showError('创建失败: ' + error.message);
        }
    }

    initGradeItemsSection() {
        const container = document.getElementById('grade-items-container');
        if (!container) return;

        const defaultItems = [
            { name: '平时成绩', weight: 0.3 },
            { name: '期中考试', weight: 0.3 },
            { name: '期末考试', weight: 0.4 },
        ];

        defaultItems.forEach(item => this.addGradeItemRow(item.name, item.weight));

        document.getElementById('add-grade-item-btn')?.addEventListener('click', () => {
            this.addGradeItemRow('', '');
        });
    }

    addGradeItemRow(name, weight) {
        const container = document.getElementById('grade-items-container');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'grade-item-row form-row';
        row.innerHTML = `
            <div class="form-group">
                <input type="text" class="grade-item-name" placeholder="组成项名称，如 平时成绩" value="${name}">
            </div>
            <div class="form-group">
                <input type="number" class="grade-item-weight" step="0.01" min="0" max="1" placeholder="权重，例如 0.3" value="${weight}">
            </div>
            <button type="button" class="btn btn-sm btn-outline text-danger remove-grade-item">删除</button>
        `;

        container.appendChild(row);

        row.querySelector('.remove-grade-item')?.addEventListener('click', () => {
            row.remove();
        });
    }
    
    async editCourse(courseId) {
        try {
            const course = await this.app.fetchWithAuth(`/courses/${courseId}`);
            
            const content = `
                <form id="edit-course-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-course-code">课程编号</label>
                            <input type="text" id="edit-course-code" value="${course.course_code}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-course-name">课程名称 *</label>
                            <input type="text" id="edit-course-name" name="course_name" value="${course.course_name}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-course-credits">学分 *</label>
                            <input type="number" id="edit-course-credits" name="credits" value="${course.credits}" step="0.5" min="0.5" max="10" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-course-department">开课院系</label>
                            <select id="edit-course-department" name="department">
                                <option value="">请选择院系</option>
                                <option value="计算机系" ${course.department === '计算机系' ? 'selected' : ''}>计算机系</option>
                                <option value="软件工程系" ${course.department === '软件工程系' ? 'selected' : ''}>软件工程系</option>
                                <option value="数学系" ${course.department === '数学系' ? 'selected' : ''}>数学系</option>
                                <option value="物理系" ${course.department === '物理系' ? 'selected' : ''}>物理系</option>
                                <option value="外语系" ${course.department === '外语系' ? 'selected' : ''}>外语系</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-course-description">课程简介</label>
                        <textarea id="edit-course-description" name="description" rows="3">${course.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-course-prerequisites">先修要求</label>
                        <input type="text" id="edit-course-prerequisites" name="prerequisites" value="${course.prerequisites || ''}">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存修改</button>
                        <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                    </div>
                </form>
            `;
            
            const modalId = this.app.showModal('编辑课程信息', content);
            
            document.getElementById('edit-course-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateCourse(courseId, modalId);
            });
            
        } catch (error) {
            this.app.showError('加载课程信息失败: ' + error.message);
        }
    }
    
    async updateCourse(courseId, modalId) {
        const form = document.getElementById('edit-course-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 转换学分类型
        if (data.credits) {
            data.credits = parseFloat(data.credits);
        }
        
        try {
            const result = await this.app.fetchWithAuth(`/courses/${courseId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('课程信息更新成功');
            this.app.closeModal(modalId);
            this.loadCourses();
        } catch (error) {
            this.app.showError('更新失败: ' + error.message);
        }
    }
    
    async deleteCourse(courseId) {
        if (!confirm('确定要删除这个课程吗？此操作将删除课程的所有相关信息。')) {
            return;
        }
        
        try {
            await this.app.fetchWithAuth(`/courses/${courseId}`, {
                method: 'DELETE'
            });
            
            this.app.showSuccess('课程删除成功');
            this.loadCourses();
        } catch (error) {
            this.app.showError('删除失败: ' + error.message);
        }
    }
}

// 教室管理类 - 完整实现
class ClassroomManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
    }
    
    init() {
        this.loadClassrooms();
        this.initEvents();
    }
    
    initEvents() {
        // 新增教室按钮
        document.getElementById('add-classroom-btn')?.addEventListener('click', () => {
            this.showAddClassroomModal();
        });
        
        // 搜索输入
        document.getElementById('search-classroom')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value || undefined;
            this.currentPage = 1;
            this.loadClassrooms();
        });
        
        // 容量筛选
        document.getElementById('filter-capacity')?.addEventListener('change', (e) => {
            this.currentFilters.capacity = e.target.value || undefined;
            this.currentPage = 1;
            this.loadClassrooms();
        });
        
        // 分页按钮事件委托
        document.getElementById('classroom-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadClassrooms();
                }
            }
        });
    }
    
    async loadClassrooms() {
        const loading = document.getElementById('classroom-loading');
        const empty = document.getElementById('classroom-empty');
        const tableBody = document.getElementById('classroom-table-body');
        
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        
        try {
            // 构建查询参数
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.currentFilters
            });
            
            const data = await this.app.fetchWithAuth(`/classrooms?${params}`);
            
            this.totalItems = data.pagination.totalItems;
            this.totalPages = data.pagination.totalPages;
            
            if (data.items.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 渲染表格
            data.items.forEach(classroom => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${classroom.name || '-'}</td>
                    <td>${classroom.location || '-'}</td>
                    <td>${classroom.capacity || '0'}人</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="classroomManager.editClassroom(${classroom.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="classroomManager.deleteClassroom(${classroom.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            loading.style.display = 'none';
            this.renderPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('classroom-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    showAddClassroomModal() {
        const content = `
            <form id="add-classroom-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="classroom-name">教室名称 *</label>
                        <input type="text" id="classroom-name" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="classroom-capacity">容量 *</label>
                        <input type="number" id="classroom-capacity" name="capacity" min="10" max="500" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="classroom-location">位置</label>
                    <input type="text" id="classroom-location" name="location" placeholder="例如：一号楼3楼">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">保存</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('新增教室', content);
        
        document.getElementById('add-classroom-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createClassroom(modalId);
        });
    }
    
    async createClassroom(modalId) {
        const form = document.getElementById('add-classroom-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 转换容量类型
        if (data.capacity) {
            data.capacity = parseInt(data.capacity);
        }
        
        try {
            const result = await this.app.fetchWithAuth('/classrooms', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('教室创建成功');
            this.app.closeModal(modalId);
            this.loadClassrooms();
        } catch (error) {
            this.app.showError('创建失败: ' + error.message);
        }
    }
    
    async editClassroom(classroomId) {
        try {
            const classroom = await this.app.fetchWithAuth(`/classrooms/${classroomId}`);
            
            const content = `
                <form id="edit-classroom-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-classroom-name">教室名称</label>
                            <input type="text" id="edit-classroom-name" value="${classroom.name}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-classroom-capacity">容量 *</label>
                            <input type="number" id="edit-classroom-capacity" name="capacity" value="${classroom.capacity}" min="10" max="500" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-classroom-location">位置</label>
                        <input type="text" id="edit-classroom-location" name="location" value="${classroom.location || ''}">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存修改</button>
                        <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                    </div>
                </form>
            `;
            
            const modalId = this.app.showModal('编辑教室信息', content);
            
            document.getElementById('edit-classroom-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateClassroom(classroomId, modalId);
            });
            
        } catch (error) {
            this.app.showError('加载教室信息失败: ' + error.message);
        }
    }
    
    async updateClassroom(classroomId, modalId) {
        const form = document.getElementById('edit-classroom-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 转换容量类型
        if (data.capacity) {
            data.capacity = parseInt(data.capacity);
        }
        
        try {
            const result = await this.app.fetchWithAuth(`/classrooms/${classroomId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            this.app.showSuccess('教室信息更新成功');
            this.app.closeModal(modalId);
            this.loadClassrooms();
        } catch (error) {
            this.app.showError('更新失败: ' + error.message);
        }
    }
    
    async deleteClassroom(classroomId) {
        if (!confirm('确定要删除这个教室吗？此操作不可撤销。')) {
            return;
        }
        
        try {
            await this.app.fetchWithAuth(`/classrooms/${classroomId}`, {
                method: 'DELETE'
            });
            
            this.app.showSuccess('教室删除成功');
            this.loadClassrooms();
        } catch (error) {
            this.app.showError('删除失败: ' + error.message);
        }
    }
}

// 教学安排类 - 完整实现
class ScheduleManager {
    constructor(app) {
        this.app = app;
        this.currentSemester = '2025-2026-1';
        this.timeSlots = [
            { start: '08:00', end: '09:40', label: '1-2节' },
            { start: '10:10', end: '11:50', label: '3-4节' },
            { start: '14:00', end: '15:40', label: '5-6节' },
            { start: '16:10', end: '17:50', label: '7-8节' },
            { start: '19:00', end: '20:40', label: '9-10节' }
        ];
    }
    
    async init() {
        await this.loadTeachersForFilter();
        await this.loadTeachingAssignments();
        this.initEvents();
        this.renderTimetable();
    }
    
    async loadTeachersForFilter() {
        try {
            const data = await this.app.fetchWithAuth('/teachers?pageSize=100');
            const select = document.getElementById('teacher-filter');
            if (select) {
                select.innerHTML = '<option value="">所有教师</option>';
                data.items.forEach(teacher => {
                    select.innerHTML += `<option value="${teacher.id}">${teacher.full_name}</option>`;
                });
            }
        } catch (error) {
            console.error('加载教师列表失败:', error);
        }
    }
    
    initEvents() {
        // 安排课程按钮
        document.getElementById('add-schedule-btn')?.addEventListener('click', () => {
            this.showAddScheduleModal();
        });
        
        // 分配教师按钮
        document.getElementById('assign-teacher-btn')?.addEventListener('click', () => {
            this.showAssignTeacherModal();
        });
        
        // 学期选择
        document.getElementById('semester-select')?.addEventListener('change', (e) => {
            this.currentSemester = e.target.value;
            this.loadTeachingAssignments();
            this.renderTimetable();
        });
        
        // 教师筛选
        document.getElementById('teacher-filter')?.addEventListener('change', async (e) => {
            const teacherId = e.target.value;
            if (teacherId) {
                await this.loadTeacherSchedule(teacherId);
            } else {
                this.renderTimetable();
            }
        });
    }
    
    async loadTeachingAssignments() {
        try {
            const data = await this.app.fetchWithAuth(`/teaching-assignments?semester=${this.currentSemester}`);
            const tableBody = document.getElementById('teaching-assignments-body');
            
            if (!data || data.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #6c757d;">
                            <i class="fas fa-info-circle"></i> 本学期暂无授课任务
                        </td>
                    </tr>
                `;
                return;
            }
            
            tableBody.innerHTML = '';
            data.forEach(assignment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${assignment.course?.course_name || '未知课程'}</td>
                    <td>${assignment.teacher?.full_name || '未分配'}</td>
                    <td>${assignment.semester}</td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="scheduleManager.editAssignment(${assignment.id})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('加载授课任务失败:', error);
        }
    }
    
    renderTimetable() {
        const timetableBody = document.getElementById('timetable-body');
        timetableBody.innerHTML = '';
        
        // 创建时间表行
        this.timeSlots.forEach((slot, index) => {
            const row = document.createElement('tr');
            
            // 时间列
            const timeCell = document.createElement('td');
            timeCell.innerHTML = `
                <div style="font-weight: 600;">${slot.label}</div>
                <div style="font-size: 12px; color: #6c757d;">${slot.start} - ${slot.end}</div>
            `;
            row.appendChild(timeCell);
            
            // 星期列
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            days.forEach(day => {
                const cell = document.createElement('td');
                cell.innerHTML = `
                    <div class="timetable-slot" data-day="${day}" data-slot="${index}" onclick="scheduleManager.addScheduleToSlot('${day}', ${index})">
                        <div class="slot-content"></div>
                    </div>
                `;
                row.appendChild(cell);
            });
            
            timetableBody.appendChild(row);
        });
        
        // 加载已有的课程安排
        this.loadExistingSchedules();
    }
    
    async loadExistingSchedules() {
        try {
            const params = new URLSearchParams({ semester: this.currentSemester });
            const schedules = await this.app.fetchWithAuth(`/course-schedules?${params.toString()}`);

            if (!Array.isArray(schedules)) return;

            const dayIndexMap = {
                'Mon': 0,
                'Tue': 1,
                'Wed': 2,
                'Thu': 3,
                'Fri': 4,
                'Sat': 5,
                'Sun': 6
            };

            schedules.forEach(schedule => {
                const day = schedule.day_of_week;
                const start = (schedule.start_time || '').slice(0, 5);
                const end = (schedule.end_time || '').slice(0, 5);
                const slotIndex = this.timeSlots.findIndex(s => s.start === start && s.end === end);
                if (slotIndex === -1 || dayIndexMap[day] === undefined) return;

                const slot = document.querySelector(`[data-day="${day}"][data-slot="${slotIndex}"]`);
                if (slot) {
                    slot.classList.add('booked');
                    const courseName = schedule.course?.course_name || '未命名课程';
                    const teacherName = schedule.teacher?.full_name || '';
                    const roomName = schedule.classroom?.name || '';
                    slot.querySelector('.slot-content').innerHTML = `
                        <div class="slot-course">${courseName}</div>
                        ${teacherName ? `<div class="slot-teacher">${teacherName}</div>` : ''}
                        ${roomName ? `<div class="slot-room">${roomName}</div>` : ''}
                    `;
                }
            });
        } catch (error) {
            console.error('加载课程安排失败:', error);
        }
    }
    
    async loadTeacherSchedule(teacherId) {
        // 先清空当前课表，然后按教师筛选重新渲染
        this.renderTimetable();
        
        try {
            const params = new URLSearchParams({
                semester: this.currentSemester,
                teacher_id: String(teacherId)
            });
            const schedules = await this.app.fetchWithAuth(`/course-schedules?${params.toString()}`);

            if (!Array.isArray(schedules)) return;

            const dayIndexMap = {
                'Mon': 0,
                'Tue': 1,
                'Wed': 2,
                'Thu': 3,
                'Fri': 4,
                'Sat': 5,
                'Sun': 6
            };

            schedules.forEach(schedule => {
                const day = schedule.day_of_week;
                const start = (schedule.start_time || '').slice(0, 5);
                const end = (schedule.end_time || '').slice(0, 5);
                const slotIndex = this.timeSlots.findIndex(s => s.start === start && s.end === end);
                if (slotIndex === -1 || dayIndexMap[day] === undefined) return;

                const slot = document.querySelector(`[data-day="${day}"][data-slot="${slotIndex}"]`);
                if (slot) {
                    slot.classList.add('booked');
                    const courseName = schedule.course?.course_name || '未命名课程';
                    const roomName = schedule.classroom?.name || '';
                    slot.querySelector('.slot-content').innerHTML = `
                        <div class="slot-course">${courseName}</div>
                        ${roomName ? `<div class="slot-room">${roomName}</div>` : ''}
                    `;
                }
            });
        } catch (error) {
            console.error('加载教师课表失败:', error);
        }
    }
    
    async showAddScheduleModal() {
        try {
            // 获取当前学期的授课任务和全部教室
            const [assignments, classroomsData] = await Promise.all([
                this.app.fetchWithAuth(`/teaching-assignments?semester=${this.currentSemester}`),
                this.app.fetchWithAuth('/classrooms?pageSize=100')
            ]);

            let assignmentOptions = '<option value="">请选择课程(含教师)</option>';
            if (Array.isArray(assignments) && assignments.length > 0) {
                assignments.forEach(a => {
                    const courseName = a.course?.course_name || '未命名课程';
                    const teacherName = a.teacher?.full_name || '未分配教师';
                    assignmentOptions += `<option value="${a.id}">${courseName} - ${teacherName}</option>`;
                });
            }

            let classroomsOptions = '<option value="">请选择教室</option>';
            if (classroomsData && Array.isArray(classroomsData.items)) {
                classroomsData.items.forEach(room => {
                    const capacity = room.capacity ? ` (${room.capacity}人)` : '';
                    classroomsOptions += `<option value="${room.id}">${room.name}${capacity}</option>`;
                });
            }
            
            const content = `
                <form id="add-schedule-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="schedule-assignment">课程 *</label>
                            <select id="schedule-assignment" required>
                                ${assignmentOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="schedule-classroom">教室 *</label>
                            <select id="schedule-classroom" required>
                                ${classroomsOptions}
                            </select>
                        </div>
                    </div>
                    
                <div class="form-row">
                    <div class="form-group">
                        <label for="schedule-day">星期 *</label>
                        <select id="schedule-day" required>
                            <option value="Mon">周一</option>
                            <option value="Tue">周二</option>
                            <option value="Wed">周三</option>
                            <option value="Thu">周四</option>
                            <option value="Fri">周五</option>
                            <option value="Sat">周六</option>
                            <option value="Sun">周日</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="schedule-time">时间节次 *</label>
                        <select id="schedule-time" required>
                            <option value="0">1-2节 (08:00-09:40)</option>
                            <option value="1">3-4节 (10:10-11:50)</option>
                            <option value="2">5-6节 (14:00-15:40)</option>
                            <option value="3">7-8节 (16:10-17:50)</option>
                            <option value="4">9-10节 (19:00-20:40)</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="schedule-weeks">上课周次</label>
                    <input type="text" id="schedule-weeks" placeholder="例如：1-16周" value="1-16周">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">安排</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
        const modalId = this.app.showModal('安排课程', content);
        
        document.getElementById('add-schedule-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createSchedule(modalId);
        });
    } catch (error) {
        console.error('加载授课任务或教室列表失败:', error);
        this.app.showError('无法加载授课任务或教室列表');
    }
    }
    
    async createSchedule(modalId) {
        const form = document.getElementById('add-schedule-form');
        const teachingId = document.getElementById('schedule-assignment').value;
        const classroomId = document.getElementById('schedule-classroom').value;
        const day = document.getElementById('schedule-day').value;
        const timeSlot = document.getElementById('schedule-time').value;
        
        if (!teachingId || !classroomId) {
            this.app.showError('请选择课程和教室');
            return;
        }
        
        try {
            // 创建课程安排
            const scheduleData = {
                teaching_id: parseInt(teachingId),
                classroom_id: parseInt(classroomId),
                day_of_week: day,
                start_time: this.timeSlots[timeSlot].start + ':00',
                end_time: this.timeSlots[timeSlot].end + ':00'
            };
            
            const result = await this.app.fetchWithAuth('/course-schedules', {
                method: 'POST',
                body: JSON.stringify(scheduleData)
            });
            
            this.app.showSuccess('课程安排成功');
            this.app.closeModal(modalId);
            this.renderTimetable();
            
        } catch (error) {
            this.app.showError('安排失败: ' + error.message);
        }
    }
    
    addScheduleToSlot(day, slotIndex) {
        // 点击课表格子添加安排
        this.showAddScheduleModal();
    }
    
    async showAssignTeacherModal() {
        try {
            // 从后端加载课程列表和教师列表
            const [coursesData, teachersData] = await Promise.all([
                this.app.fetchWithAuth('/courses?pageSize=100'),
                this.app.fetchWithAuth('/teachers?pageSize=100')
            ]);

            let coursesOptions = '<option value="">请选择课程</option>';
            if (coursesData && Array.isArray(coursesData.courses)) {
                coursesData.courses.forEach(course => {
                    coursesOptions += `<option value="${course.id}">${course.course_code || ''} ${course.course_name}</option>`;
                });
            }

            let teachersOptions = '<option value="">请选择教师</option>';
            if (teachersData && Array.isArray(teachersData.items)) {
                teachersData.items.forEach(teacher => {
                    const title = teacher.title ? ` (${teacher.title})` : '';
                    teachersOptions += `<option value="${teacher.id}">${teacher.full_name}${title}</option>`;
                });
            }
            
            const content = `
                <form id="assign-teacher-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="assign-course">课程 *</label>
                            <select id="assign-course" required>
                                ${coursesOptions}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="assign-teacher">教师 *</label>
                            <select id="assign-teacher" required>
                                ${teachersOptions}
                            </select>
                        </div>
                    </div>
                    
                <div class="form-group">
                    <label for="assign-semester">学期 *</label>
                    <select id="assign-semester" required>
                        <option value="2025-2026-1">2025-2026学年 第1学期</option>
                        <option value="2025-2026-2">2025-2026学年 第2学期</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">分配</button>
                    <button type="button" class="btn btn-outline" onclick="app.closeAllModals()">取消</button>
                </div>
            </form>
        `;
        
            const modalId = this.app.showModal('分配授课教师', content);
            
            document.getElementById('assign-teacher-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.assignTeacher(modalId);
            });
        } catch (error) {
            console.error('加载课程或教师列表失败:', error);
            this.app.showError('无法加载课程或教师列表');
        }
    }
    
    async assignTeacher(modalId) {
        const form = document.getElementById('assign-teacher-form');
        const courseId = document.getElementById('assign-course').value;
        const teacherId = document.getElementById('assign-teacher').value;
        const semester = document.getElementById('assign-semester').value;
        
        if (!courseId || !teacherId) {
            this.app.showError('请选择课程和教师');
            return;
        }
        
        try {
            const assignmentData = {
                teacher_id: parseInt(teacherId),
                course_id: parseInt(courseId),
                semester: semester
            };
            
            const result = await this.app.fetchWithAuth('/teaching-assignments', {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });
            
            this.app.showSuccess('教师分配成功');
            this.app.closeModal(modalId);
            this.loadTeachingAssignments();
            
        } catch (error) {
            this.app.showError('分配失败: ' + error.message);
        }
    }
    
    async editAssignment(assignmentId) {
        // 编辑授课任务
        this.app.showAlert('编辑功能开发中...', 'info');
    }
}

// 课程表查询类 - 完整实现
class TimetableManager {
    constructor(app) {
        this.app = app;
        this.currentType = 'teacher';
    }
    
    async init() {
        await this.loadOptions();
        this.initEvents();
    }
    
    async loadOptions() {
        try {
            // 加载教师选项
            const teachersData = await this.app.fetchWithAuth('/teachers?pageSize=100');
            const teachersSelect = document.getElementById('timetable-target');
            
            if (teachersSelect) {
                teachersSelect.innerHTML = '<option value="">请选择...</option>';
                teachersData.items.forEach(teacher => {
                    teachersSelect.innerHTML += `<option value="teacher_${teacher.id}">${teacher.full_name}</option>`;
                });
            }
            
            // 加载班级选项
            const classesData = await this.app.fetchWithAuth('/classes?pageSize=100');
            classesData.items.forEach(cls => {
                teachersSelect.innerHTML += `<option value="class_${cls.id}">${cls.class_name}</option>`;
            });
            
            // 加载教室选项
            const classroomsData = await this.app.fetchWithAuth('/classrooms?pageSize=100');
            classroomsData.items.forEach(room => {
                teachersSelect.innerHTML += `<option value="room_${room.id}">${room.name}</option>`;
            });
            
        } catch (error) {
            console.error('加载选项失败:', error);
        }
    }
    
    initEvents() {
        // 查询类型变化
        document.getElementById('timetable-type')?.addEventListener('change', (e) => {
            this.currentType = e.target.value;
            this.updatePlaceholder();
        });
        
        // 查询按钮
        document.getElementById('load-timetable-btn')?.addEventListener('click', () => {
            this.loadTimetable();
        });
        
        // 导出按钮
        document.getElementById('export-timetable-btn')?.addEventListener('click', () => {
            this.exportTimetable();
        });
    }
    
    updatePlaceholder() {
        const typeSelect = document.getElementById('timetable-type');
        const targetSelect = document.getElementById('timetable-target');
        
        if (typeSelect && targetSelect) {
            const type = typeSelect.value;
            let placeholder = '请选择...';
            
            if (type === 'teacher') placeholder = '请选择教师...';
            else if (type === 'class') placeholder = '请选择班级...';
            else if (type === 'room') placeholder = '请选择教室...';
            
            // 更新第一个选项的文本
            if (targetSelect.options.length > 0) {
                targetSelect.options[0].text = placeholder;
            }
        }
    }
    
    async loadTimetable() {
        const type = document.getElementById('timetable-type').value;
        const target = document.getElementById('timetable-target').value;
        const semester = document.getElementById('timetable-semester').value;
        
        if (!target) {
            this.app.showError('请选择查询目标');
            return;
        }
        
        const [targetType, targetId] = target.split('_');
        
        // 显示结果区域
        document.getElementById('timetable-result').style.display = 'block';
        document.getElementById('timetable-empty').style.display = 'none';
        
        // 设置标题
        const titleMap = {
            'teacher': '教师课表',
            'class': '班级课表',
            'room': '教室课表'
        };
        document.getElementById('timetable-title').textContent = titleMap[type] || '课程表';
        
        // 渲染课表框架
        this.renderTimetableFrame();
        
        // 加载数据
        await this.loadTimetableData(targetType, targetId, semester);
    }
    
    renderTimetableFrame() {
        const timeSlots = [
            { start: '08:00', end: '09:40', label: '1-2节' },
            { start: '10:10', end: '11:50', label: '3-4节' },
            { start: '14:00', end: '15:40', label: '5-6节' },
            { start: '16:10', end: '17:50', label: '7-8节' },
            { start: '19:00', end: '20:40', label: '9-10节' }
        ];
        
        const timetableBody = document.getElementById('result-timetable-body');
        timetableBody.innerHTML = '';
        
        timeSlots.forEach((slot, index) => {
            const row = document.createElement('tr');
            
            // 时间列
            const timeCell = document.createElement('td');
            timeCell.innerHTML = `
                <div style="font-weight: 600;">${slot.label}</div>
                <div style="font-size: 12px; color: #6c757d;">${slot.start} - ${slot.end}</div>
            `;
            row.appendChild(timeCell);
            
            // 星期列
            for (let i = 0; i < 7; i++) {
                const cell = document.createElement('td');
                cell.innerHTML = `<div class="timetable-slot"></div>`;
                row.appendChild(cell);
            }
            
            timetableBody.appendChild(row);
        });
    }
    
    async loadTimetableData(targetType, targetId, semester) {
        try {
            const params = new URLSearchParams({ semester });

            if (targetType === 'teacher') {
                params.append('teacher_id', String(targetId));
            } else if (targetType === 'class') {
                params.append('class_id', String(targetId));
            } else if (targetType === 'room') {
                params.append('classroom_id', String(targetId));
            }

            const schedules = await this.app.fetchWithAuth(`/course-schedules?${params.toString()}`);
            if (!Array.isArray(schedules)) return;

            const dayIndexMap = {
                Mon: 0,
                Tue: 1,
                Wed: 2,
                Thu: 3,
                Fri: 4,
                Sat: 5,
                Sun: 6
            };

            schedules.forEach(item => {
                const dayIdx = dayIndexMap[item.day_of_week];
                const start = (item.start_time || '').slice(0, 5);
                const end = (item.end_time || '').slice(0, 5);
                const slot = this.getTimeSlotIndex(start, end);
                if (dayIdx === undefined || slot === -1) return;

                const row = document.getElementById('result-timetable-body').children[slot];
                if (!row) return;
                const cell = row.children[dayIdx + 1]; // +1 跳过时间列
                if (!cell) return;

                const wrapper = cell.querySelector('.timetable-slot');
                const courseName = item.course?.course_name || '未命名课程';
                const teacherName = item.teacher?.full_name || '';
                const roomName = item.classroom?.name || '';
                wrapper.classList.add('booked');
                wrapper.innerHTML = `
                    <div class="slot-content">
                        <div class="slot-course">${courseName}</div>
                        ${teacherName ? `<div class="slot-teacher">${teacherName}</div>` : ''}
                        ${roomName ? `<div class="slot-room">${roomName}</div>` : ''}
                    </div>
                `;
            });

            // 使用下拉框当前选中项作为说明文字
            const targetSelect = document.getElementById('timetable-target');
            const selectedText = targetSelect?.selectedOptions?.[0]?.text || '';
            let infoPrefix = '课程表查询结果';
            if (targetType === 'teacher') infoPrefix = `教师：${selectedText}`;
            else if (targetType === 'class') infoPrefix = `班级：${selectedText}`;
            else if (targetType === 'room') infoPrefix = `教室：${selectedText}`;

            document.getElementById('timetable-info').innerHTML = `
                <div style="color: #6c757d; font-size: 14px;">
                    <i class="fas fa-calendar"></i> ${semester} | ${infoPrefix}
                </div>
            `;
        } catch (error) {
            console.error('加载课程表数据失败:', error);
            this.app.showError('加载课程表数据失败');
        }
    }
    
    getTimeSlotIndex(start, end) {
        const slots = [
            { start: '08:00', end: '09:40' },
            { start: '10:10', end: '11:50' },
            { start: '14:00', end: '15:40' },
            { start: '16:10', end: '17:50' },
            { start: '19:00', end: '20:40' }
        ];
        return slots.findIndex(s => s.start === start && s.end === end);
    }
    
    exportTimetable() {
        // 导出课程表为图片或PDF
        this.app.showAlert('导出功能需要集成第三方库', 'info');
    }
}

// 修改页面事件初始化方法
EduAdminApp.prototype.initPageEvents = function(page) {
    switch (page) {
        case 'dashboard':
            this.initDashboardEvents();
            break;
        case 'class-management':
            this.initClassManagementEvents();
            break;
        case 'student-management':
            this.initStudentManagementEvents();
            break;
        case 'teacher-management':
            this.initTeacherManagementEvents();
            break;
        case 'course-management':
            this.initCourseManagementEvents();
            break;
        case 'classroom-management':
            this.initClassroomManagementEvents();
            break;
        case 'teaching-schedule':
            this.initTeachingScheduleEvents();
            break;
        case 'timetable':
            this.initTimetableEvents();
            break;
        case 'grade-review':
            if (typeof this.initGradeReviewEvents === 'function') {
                this.initGradeReviewEvents();
            } else if (window.GradeReviewManager) {
                console.log('[EduAdminApp] fallback init GradeReviewManager');
                this.gradeReviewManager = new window.GradeReviewManager(this);
                this.gradeReviewManager.init();
            }
            break;
        case 'grade-publish':
            if (typeof this.initGradePublishEvents === 'function') {
                this.initGradePublishEvents();
            } else if (window.GradePublishManager) {
                console.log('[EduAdminApp] fallback init GradePublishManager');
                this.gradePublishManager = new window.GradePublishManager(this);
                this.gradePublishManager.init();
            }
            break;
    }
};

// 修改各个页面的初始化方法
EduAdminApp.prototype.initClassManagementEvents = function() {
    this.classManager = new ClassManager(this);
    this.classManager.init();
    // 供表格中内联 onclick 使用
    window.classManager = this.classManager;
};

EduAdminApp.prototype.initStudentManagementEvents = function() {
    this.studentManager = new StudentManager(this);
    this.studentManager.init();
    window.studentManager = this.studentManager;
};

EduAdminApp.prototype.initTeacherManagementEvents = function() {
    this.teacherManager = new TeacherManager(this);
    this.teacherManager.init();
    window.teacherManager = this.teacherManager;
};

EduAdminApp.prototype.initCourseManagementEvents = function() {
    this.courseManager = new CourseManager(this);
    this.courseManager.init();
    window.courseManager = this.courseManager;
};

EduAdminApp.prototype.initClassroomManagementEvents = function() {
    this.classroomManager = new ClassroomManager(this);
    this.classroomManager.init();
    window.classroomManager = this.classroomManager;
};

EduAdminApp.prototype.initTeachingScheduleEvents = function() {
    // 初始化教学安排，并同步到全局，供课表格子 onclick 调用
    this.scheduleManager = new ScheduleManager(this);
    this.scheduleManager.init();
    window.scheduleManager = this.scheduleManager;
};

EduAdminApp.prototype.initTimetableEvents = function() {
    this.timetableManager = new TimetableManager(this);
    this.timetableManager.init();
};

// 添加fetchWithAuth的完整实现
EduAdminApp.prototype.fetchWithAuth = async function(url, options = {}, isJson = true) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            ...(isJson ? { 'Content-Type': 'application/json' } : {})
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${this.apiBase}${url}`, mergedOptions);
        
        if (response.status === 401) {
            // 未授权，跳转到登录页
            this.logout();
            throw new Error('会话已过期，请重新登录');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || `请求失败: ${response.status}` };
            }
            throw new Error(errorData.message || errorData.error?.message || `请求失败: ${response.status}`);
        }
        
        // 对于204 No Content响应，直接返回
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
};

// 使管理器类在全局可用
window.ClassManager = ClassManager;
window.StudentManager = StudentManager;
window.TeacherManager = TeacherManager;
window.CourseManager = CourseManager;
window.ClassroomManager = ClassroomManager;
window.ScheduleManager = ScheduleManager;
window.TimetableManager = TimetableManager;

// 创建全局实例
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EduAdminApp();
    window.app = app;
    window.classManager = app.classManager;
    window.studentManager = app.studentManager;
    window.teacherManager = app.teacherManager;
    window.courseManager = app.courseManager;
    window.classroomManager = app.classroomManager;
    window.scheduleManager = app.scheduleManager;
    window.timetableManager = app.timetableManager;
});