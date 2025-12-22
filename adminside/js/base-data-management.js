// 基础数据管理模块 - 更新为符合RESTful API
class BaseDataManagement {
    constructor() {
        this.currentTab = 'classes';
        this.API_BASE_URL = '/api/v1';
        this.token = localStorage.getItem('teaching_admin_token');
        this.currentPage = 1;
        this.pageSize = 10;
        
        this.initEventListeners();
        this.loadInitialData();
    }

    initEventListeners() {
        // 侧边栏导航点击事件
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 班级管理事件
        document.getElementById('add-class-btn')?.addEventListener('click', () => this.showAddClassModal());
        document.getElementById('import-classes-btn')?.addEventListener('click', () => this.importClasses());
        document.getElementById('export-classes-btn')?.addEventListener('click', () => this.exportClasses());
        
        // 学生管理事件
        document.getElementById('add-student-btn')?.addEventListener('click', () => this.showAddStudentModal());
        document.getElementById('import-students-btn')?.addEventListener('click', () => this.importStudents());
        document.getElementById('export-students-btn')?.addEventListener('click', () => this.exportStudents());
        document.getElementById('search-students-btn')?.addEventListener('click', () => this.searchStudents());
        document.getElementById('reset-student-filter')?.addEventListener('click', () => this.resetStudentFilter());
        
        // 教师管理事件
        document.getElementById('add-teacher-btn')?.addEventListener('click', () => this.showAddTeacherModal());
        
        // 课程管理事件
        document.getElementById('add-course-btn')?.addEventListener('click', () => this.showAddCourseModal());
        document.getElementById('search-courses-btn')?.addEventListener('click', () => this.searchCourses());
        
        // 表格操作事件（事件委托）
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-action.edit')) {
                const row = e.target.closest('tr');
                const id = row?.querySelector('td:first-child')?.textContent;
                if (id) this.editItem(id);
            }
            
            if (e.target.closest('.btn-action.delete')) {
                const row = e.target.closest('tr');
                const id = row?.querySelector('td:first-child')?.textContent;
                const type = this.currentTab.slice(0, -1); // 移除复数's'
                if (id) this.deleteItem(id, type);
            }
            
            if (e.target.closest('.btn-action.view')) {
                const row = e.target.closest('tr');
                const id = row?.querySelector('td:first-child')?.textContent;
                if (id) this.viewItemDetails(id);
            }
        });
        
        // 分页事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pagination-btn')) {
                const action = e.target.closest('.pagination-btn').dataset.action;
                if (action === 'prev') {
                    this.previousPage();
                } else if (action === 'next') {
                    this.nextPage();
                } else if (action === 'first') {
                    this.goToPage(1);
                } else if (action === 'last') {
                    this.goToPage(parseInt(e.target.closest('.pagination-btn').dataset.total));
                }
            }
        });
    }

    switchTab(tab) {
        // 更新侧边栏活动状态
        document.querySelectorAll('.sidebar-nav li').forEach(item => {
            item.classList.remove('active');
        });
        const targetItem = document.querySelector(`[data-tab="${tab}"]`);
        if (targetItem) targetItem.classList.add('active');
        
        // 更新内容区显示
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(tab);
        if (targetSection) targetSection.classList.add('active');
        
        this.currentTab = tab;
        this.currentPage = 1;
        
        // 加载对应数据
        this.loadTabData(tab);
    }

    async loadTabData(tab) {
        try {
            switch(tab) {
                case 'classes':
                    await this.loadClasses();
                    break;
                case 'students':
                    await this.loadStudents();
                    break;
                case 'teachers':
                    await this.loadTeachers();
                    break;
                case 'courses':
                    await this.loadCourses();
                    break;
                case 'semester-plan':
                    await this.loadSemesterPlan();
                    break;
                case 'classroom':
                    await this.loadClassrooms();
                    break;
                case 'timetable':
                    await this.loadTimetableData();
                    break;
                default:
                    console.log(`未处理的标签页: ${tab}`);
            }
        } catch (error) {
            console.error(`加载${tab}数据失败:`, error);
            this.showNotification(`加载数据失败: ${error.message}`, 'error');
        }
    }

    async loadInitialData() {
        // 初始加载班级数据
        await this.loadClasses();
    }

    // 班级管理方法
    async loadClasses() {
        try {
            this.showLoading('正在加载班级数据...');
            
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize
            });
            
            // 添加筛选条件
            const department = document.getElementById('class-department-filter')?.value;
            const grade = document.getElementById('class-grade-filter')?.value;
            const search = document.getElementById('class-search')?.value;
            
            if (department) params.append('department', department);
            if (grade) params.append('enrollment_year', grade);
            if (search) params.append('search', search);
            
            const response = await fetch(`${this.API_BASE_URL}/classes?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderClassTable(data.data);
                this.updatePagination(data.pagination);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('加载班级数据失败:', error);
            this.showNotification(`加载班级数据失败: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderClassTable(classes) {
        const tbody = document.getElementById('class-table-body');
        if (!tbody) return;

        if (classes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-users-class"></i>
                            <p class="mb-0">暂无班级数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = classes.map(cls => `
            <tr>
                <td>${cls.id}</td>
                <td>${cls.class_name}</td>
                <td>${cls.department || '-'}</td>
                <td>${cls.enrollment_year}级</td>
                <td>${cls.student_count || 0}</td>
                <td>${cls.head_teacher_name || '未分配'}</td>
                <td>${new Date(cls.created_at).toLocaleDateString('zh-CN')}</td>
                <td>
                    <button class="btn-action edit" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-action view" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async showAddClassModal() {
        try {
            // 先获取教师列表供选择班主任
            const teachersResponse = await fetch(`${this.API_BASE_URL}/teachers?pageSize=100`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.success ? teachersData.data : [];
            
            const modalHtml = `
                <div class="modal fade" id="addClassModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">添加班级</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="addClassForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="className" class="form-label">班级名称 *</label>
                                            <input type="text" class="form-control" id="className" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="classDepartment" class="form-label">所属院系 *</label>
                                            <input type="text" class="form-control" id="classDepartment" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="enrollmentYear" class="form-label">入学年份 *</label>
                                            <select class="form-control" id="enrollmentYear" required>
                                                <option value="">请选择</option>
                                                ${Array.from({length: 10}, (_, i) => {
                                                    const year = new Date().getFullYear() - i;
                                                    return `<option value="${year}">${year}级</option>`;
                                                }).join('')}
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="headTeacher" class="form-label">班主任</label>
                                            <select class="form-control" id="headTeacher">
                                                <option value="">请选择</option>
                                                ${teachers.map(teacher => `
                                                    <option value="${teacher.id}">${teacher.full_name} (${teacher.department})</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" id="saveClassBtn">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 显示modal
            this.showModal(modalHtml, 'addClassModal');
            
            // 绑定保存事件
            document.getElementById('saveClassBtn').addEventListener('click', async () => {
                await this.saveClass();
            });
        } catch (error) {
            this.showNotification(`加载教师数据失败: ${error.message}`, 'error');
        }
    }

    async saveClass() {
        const form = document.getElementById('addClassForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const classData = {
            class_name: document.getElementById('className').value,
            department: document.getElementById('classDepartment').value,
            enrollment_year: document.getElementById('enrollmentYear').value,
            head_teacher_id: document.getElementById('headTeacher').value || null
        };
        
        try {
            this.showLoading('正在保存班级信息...');
            
            const response = await fetch(`${this.API_BASE_URL}/classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(classData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideLoading();
                this.showNotification('班级创建成功', 'success');
                
                // 关闭modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addClassModal'));
                modal.hide();
                
                // 重新加载数据
                await this.loadClasses();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification(`班级创建失败: ${error.message}`, 'error');
        }
    }

    // 学生管理方法
    async loadStudents() {
        try {
            this.showLoading('正在加载学生数据...');
            
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize
            });
            
            // 添加筛选条件
            const classId = document.getElementById('student-class-filter')?.value;
            const studentId = document.getElementById('student-id-filter')?.value;
            const name = document.getElementById('student-name-filter')?.value;
            
            if (classId) params.append('class_id', classId);
            if (studentId) params.append('student_id_number', studentId);
            if (name) params.append('name', name);
            
            const response = await fetch(`${this.API_BASE_URL}/students?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderStudentTable(data.data);
                this.updatePagination(data.pagination);
                this.updateStudentFilters();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('加载学生数据失败:', error);
            this.showNotification(`加载学生数据失败: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderStudentTable(students) {
        const tbody = document.getElementById('student-table-body');
        if (!tbody) return;

        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-user-graduate"></i>
                            <p class="mb-0">暂无学生数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${student.student_id_number}</td>
                <td>${student.full_name}</td>
                <td>${student.gender}</td>
                <td>${student.class_name || '未分配'}</td>
                <td>${student.department || '-'}</td>
                <td>${student.student_id_number?.substring(0, 4) || '-'}</td>
                <td><span class="status-badge ${student.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${student.status === 'active' ? '在读' : '休学'}
                </span></td>
                <td>
                    <button class="btn-action edit" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-action view" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async updateStudentFilters() {
        const classFilter = document.getElementById('student-class-filter');
        if (!classFilter) return;

        // 加载班级列表
        try {
            const response = await fetch(`${this.API_BASE_URL}/classes?pageSize=100`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                classFilter.innerHTML = '<option value="">全部班级</option>' +
                    data.data.map(cls => `<option value="${cls.id}">${cls.class_name}</option>`).join('');
            }
        } catch (error) {
            console.error('加载班级列表失败:', error);
        }
    }

    async showAddStudentModal() {
        try {
            // 获取班级列表
            const classesResponse = await fetch(`${this.API_BASE_URL}/classes?pageSize=100`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const classesData = await classesResponse.json();
            const classes = classesData.success ? classesData.data : [];
            
            const modalHtml = `
                <div class="modal fade" id="addStudentModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">添加学生</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="addStudentForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="studentId" class="form-label">学号 *</label>
                                            <input type="text" class="form-control" id="studentId" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentName" class="form-label">姓名 *</label>
                                            <input type="text" class="form-control" id="studentName" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentGender" class="form-label">性别</label>
                                            <select class="form-control" id="studentGender">
                                                <option value="男">男</option>
                                                <option value="女">女</option>
                                                <option value="未知">未知</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentEmail" class="form-label">邮箱 *</label>
                                            <input type="email" class="form-control" id="studentEmail" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="studentClass" class="form-label">班级 *</label>
                                            <select class="form-control" id="studentClass" required>
                                                <option value="">请选择班级</option>
                                                ${classes.map(cls => `
                                                    <option value="${cls.id}">${cls.class_name} (${cls.department})</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" id="saveStudentBtn">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.showModal(modalHtml, 'addStudentModal');
            
            document.getElementById('saveStudentBtn').addEventListener('click', async () => {
                await this.saveStudent();
            });
        } catch (error) {
            this.showNotification(`加载班级数据失败: ${error.message}`, 'error');
        }
    }

    async saveStudent() {
        const form = document.getElementById('addStudentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const studentData = {
            student_id_number: document.getElementById('studentId').value,
            full_name: document.getElementById('studentName').value,
            gender: document.getElementById('studentGender').value,
            email: document.getElementById('studentEmail').value,
            class_id: document.getElementById('studentClass').value
        };
        
        try {
            this.showLoading('正在保存学生信息...');
            
            const response = await fetch(`${this.API_BASE_URL}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(studentData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideLoading();
                this.showNotification('学生创建成功', 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
                modal.hide();
                
                await this.loadStudents();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification(`学生创建失败: ${error.message}`, 'error');
        }
    }

    // 课程管理方法
    async loadCourses() {
        try {
            this.showLoading('正在加载课程数据...');
            
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize
            });
            
            // 添加筛选条件
            const department = document.getElementById('course-department-filter')?.value;
            const type = document.getElementById('course-type-filter')?.value;
            const search = document.getElementById('course-search')?.value;
            
            if (department) params.append('department', department);
            if (type) params.append('course_type', type);
            if (search) params.append('search', search);
            
            const response = await fetch(`${this.API_BASE_URL}/courses?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderCourseTable(data.data);
                this.updatePagination(data.pagination);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('加载课程数据失败:', error);
            this.showNotification(`加载课程数据失败: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderCourseTable(courses) {
        const tbody = document.getElementById('course-table-body');
        if (!tbody) return;

        if (courses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-book-open"></i>
                            <p class="mb-0">暂无课程数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = courses.map(course => `
            <tr>
                <td>${course.course_code}</td>
                <td>${course.course_name}</td>
                <td>${course.credits}</td>
                <td>${course.hours || 0}</td>
                <td>${course.course_type || '必修'}</td>
                <td>${course.department || '-'}</td>
                <td>${course.teachers || '未分配'}</td>
                <td>${course.student_count || 0}</td>
                <td><span class="status-badge ${course.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${course.status === 'active' ? '已发布' : '未发布'}
                </span></td>
                <td>
                    <button class="btn-action edit" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-action view" title="查看详情">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async showAddCourseModal() {
        try {
            // 获取教师列表
            const teachersResponse = await fetch(`${this.API_BASE_URL}/teachers?pageSize=100`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const teachersData = await teachersResponse.json();
            const teachers = teachersData.success ? teachersData.data : [];
            
            const modalHtml = `
                <div class="modal fade" id="addCourseModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">添加课程</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="addCourseForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="courseCode" class="form-label">课程代码 *</label>
                                            <input type="text" class="form-control" id="courseCode" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="courseName" class="form-label">课程名称 *</label>
                                            <input type="text" class="form-control" id="courseName" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="courseCredits" class="form-label">学分 *</label>
                                            <input type="number" class="form-control" id="courseCredits" min="0.5" max="10" step="0.5" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="courseHours" class="form-label">学时</label>
                                            <input type="number" class="form-control" id="courseHours" min="0" max="200">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="courseType" class="form-label">课程类型</label>
                                            <select class="form-control" id="courseType">
                                                <option value="必修">必修</option>
                                                <option value="选修">选修</option>
                                                <option value="通识">通识</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="courseDepartment" class="form-label">开课院系 *</label>
                                            <input type="text" class="form-control" id="courseDepartment" required>
                                        </div>
                                        <div class="col-md-12 mb-3">
                                            <label for="courseDescription" class="form-label">课程简介</label>
                                            <textarea class="form-control" id="courseDescription" rows="3"></textarea>
                                        </div>
                                        <div class="col-md-12 mb-3">
                                            <label for="courseTeachers" class="form-label">授课教师</label>
                                            <select class="form-control" id="courseTeachers" multiple>
                                                ${teachers.map(teacher => `
                                                    <option value="${teacher.id}">${teacher.full_name} (${teacher.department})</option>
                                                `).join('')}
                                            </select>
                                            <div class="form-text">按住Ctrl键可选择多个教师</div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" id="saveCourseBtn">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.showModal(modalHtml, 'addCourseModal');
            
            document.getElementById('saveCourseBtn').addEventListener('click', async () => {
                await this.saveCourse();
            });
        } catch (error) {
            this.showNotification(`加载教师数据失败: ${error.message}`, 'error');
        }
    }

    async saveCourse() {
        const form = document.getElementById('addCourseForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const teacherSelect = document.getElementById('courseTeachers');
        const selectedTeachers = Array.from(teacherSelect.selectedOptions).map(option => option.value);
        
        const courseData = {
            course_code: document.getElementById('courseCode').value,
            course_name: document.getElementById('courseName').value,
            credits: parseFloat(document.getElementById('courseCredits').value),
            hours: document.getElementById('courseHours').value ? parseInt(document.getElementById('courseHours').value) : null,
            course_type: document.getElementById('courseType').value,
            department: document.getElementById('courseDepartment').value,
            description: document.getElementById('courseDescription').value,
            teacher_ids: selectedTeachers
        };
        
        try {
            this.showLoading('正在保存课程信息...');
            
            const response = await fetch(`${this.API_BASE_URL}/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(courseData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideLoading();
                this.showNotification('课程创建成功', 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addCourseModal'));
                modal.hide();
                
                await this.loadCourses();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification(`课程创建失败: ${error.message}`, 'error');
        }
    }

    // 通用方法
    async editItem(id) {
        // 根据当前标签页调用相应的编辑方法
        switch(this.currentTab) {
            case 'classes':
                await this.editClass(id);
                break;
            case 'students':
                await this.editStudent(id);
                break;
            case 'courses':
                await this.editCourse(id);
                break;
        }
    }

    async deleteItem(id, type) {
        if (!await Utils.confirmDialog(`确定要删除这个${type === 'class' ? '班级' : type === 'student' ? '学生' : '课程'}吗？`)) {
            return;
        }
        
        try {
            this.showLoading('正在删除...');
            
            const endpoint = `${this.currentTab}/${id}`;
            const response = await fetch(`${this.API_BASE_URL}/${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`${type === 'class' ? '班级' : type === 'student' ? '学生' : '课程'}删除成功`, 'success');
                await this.loadTabData(this.currentTab);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification(`删除失败: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async viewItemDetails(id) {
        try {
            this.showLoading('正在加载详情...');
            
            const response = await fetch(`${this.API_BASE_URL}/${this.currentTab}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showItemDetailModal(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showNotification(`加载详情失败: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    showItemDetailModal(data) {
        let modalTitle = '';
        let modalContent = '';
        
        switch(this.currentTab) {
            case 'classes':
                modalTitle = '班级详情';
                modalContent = `
                    <div class="detail-view">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <span class="detail-label">班级名称:</span>
                                    <span class="detail-value">${data.class_name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">所属院系:</span>
                                    <span class="detail-value">${data.department}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">入学年份:</span>
                                    <span class="detail-value">${data.enrollment_year}级</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <span class="detail-label">学生人数:</span>
                                    <span class="detail-value">${data.student_count || 0}人</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">班主任:</span>
                                    <span class="detail-value">${data.head_teacher_name || '未分配'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">创建时间:</span>
                                    <span class="detail-value">${new Date(data.created_at).toLocaleString('zh-CN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'students':
                modalTitle = '学生详情';
                modalContent = `
                    <div class="detail-view">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <span class="detail-label">学号:</span>
                                    <span class="detail-value">${data.student_id_number}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">姓名:</span>
                                    <span class="detail-value">${data.full_name}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">性别:</span>
                                    <span class="detail-value">${data.gender}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">班级:</span>
                                    <span class="detail-value">${data.class_name}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <span class="detail-label">院系:</span>
                                    <span class="detail-value">${data.department}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">邮箱:</span>
                                    <span class="detail-value">${data.email}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">状态:</span>
                                    <span class="detail-value">${data.status === 'active' ? '在读' : '休学'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }
        
        const modalHtml = `
            <div class="modal fade" id="detailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${modalTitle}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${modalContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHtml, 'detailModal');
    }

    updatePagination(pagination) {
        const paginationElement = document.getElementById(`${this.currentTab}-pagination`);
        if (!paginationElement || !pagination) return;
        
        const totalPages = pagination.totalPages || 1;
        const currentPage = pagination.currentPage || 1;
        
        let paginationHtml = '';
        
        // 第一页按钮
        paginationHtml += `
            <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    data-action="first" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-double-left"></i>
            </button>
        `;
        
        // 上一页按钮
        paginationHtml += `
            <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-angle-left"></i>
            </button>
        `;
        
        // 页码信息
        paginationHtml += `
            <span class="pagination-info">
                第 ${currentPage} 页 / 共 ${totalPages} 页
            </span>
        `;
        
        // 下一页按钮
        paginationHtml += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    data-action="next" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-angle-right"></i>
            </button>
        `;
        
        // 最后一页按钮
        paginationHtml += `
            <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    data-action="last" data-total="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-angle-double-right"></i>
            </button>
        `;
        
        paginationElement.innerHTML = paginationHtml;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadTabData(this.currentTab);
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadTabData(this.currentTab);
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadTabData(this.currentTab);
    }

    searchStudents() {
        this.currentPage = 1;
        this.loadStudents();
    }

    searchCourses() {
        this.currentPage = 1;
        this.loadCourses();
    }

    resetStudentFilter() {
        document.getElementById('student-class-filter').value = '';
        document.getElementById('student-id-filter').value = '';
        document.getElementById('student-name-filter').value = '';
        this.currentPage = 1;
        this.loadStudents();
    }

    showModal(html, modalId) {
        // 移除现有的同名modal
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        
        // 添加新的modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);
        
        // 显示modal
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        
        // modal关闭后移除
        modalContainer.addEventListener('hidden.bs.modal', () => {
            modalContainer.remove();
        });
    }

    showLoading(message = '正在处理，请稍候...') {
        if (window.Utils) {
            Utils.showLoading(message);
        } else {
            console.log(message);
        }
    }

    hideLoading() {
        if (window.Utils) {
            Utils.hideLoading();
        }
    }

    showNotification(message, type = 'info') {
        if (window.Utils) {
            Utils.showNotification(message, type);
        } else {
            alert(`${type}: ${message}`);
        }
    }

    // 其他方法占位（保持原有功能）
    importClasses() {
        this.showNotification('批量导入功能待实现', 'info');
    }

    exportClasses() {
        if (window.teachingAdmin) {
            window.teachingAdmin.exportClasses();
        }
    }

    importStudents() {
        this.showNotification('批量导入学生功能待实现', 'info');
    }

    exportStudents() {
        if (window.teachingAdmin) {
            window.teachingAdmin.exportStudents();
        }
    }

    async editClass(classId) {
        // 实现编辑班级的逻辑
        this.showNotification('编辑班级功能待实现', 'info');
    }

    async editStudent(studentId) {
        // 实现编辑学生的逻辑
        this.showNotification('编辑学生功能待实现', 'info');
    }

    async editCourse(courseId) {
        // 实现编辑课程的逻辑
        this.showNotification('编辑课程功能待实现', 'info');
    }

    // 其他方法占位
    editClass(classId) {
        console.log('编辑班级:', classId);
        this.showNotification('编辑功能待实现', 'info');
    }

    deleteClass(classId) {
        if (confirm(`确定要删除班级 ${classId} 吗？`)) {
            console.log('删除班级:', classId);
            this.showNotification('删除功能待实现', 'info');
        }
    }

    viewClassDetails(classId) {
        console.log('查看班级详情:', classId);
        this.showNotification('详情查看功能待实现', 'info');
    }

    showAddStudentModal() {
        this.showNotification('添加学生功能待实现', 'info');
    }

    importStudents() {
        this.showNotification('批量导入功能待实现', 'info');
    }

    exportStudents() {
        this.showNotification('导出功能待实现', 'info');
    }

    resetStudentFilter() {
        document.getElementById('student-class-filter').value = '';
        document.getElementById('student-id-filter').value = '';
        document.getElementById('student-name-filter').value = '';
        this.loadStudents();
    }

    editStudent(studentId) {
        console.log('编辑学生:', studentId);
    }

    viewStudentDetails(studentId) {
        console.log('查看学生详情:', studentId);
    }

    showAddTeacherModal() {
        this.showNotification('添加教师功能待实现', 'info');
    }

    showAddCourseModal() {
        this.showNotification('添加课程功能待实现', 'info');
    }

    showAddSemesterPlanModal() {
        this.showNotification('制定开课计划功能待实现', 'info');
    }

    copyLastSemesterPlan() {
        this.showNotification('复制上学期计划功能待实现', 'info');
    }

    editCourseInPlan(courseId) {
        console.log('编辑开课计划中的课程:', courseId);
    }

    removeCourseFromPlan(courseId) {
        if (confirm('确定要从开课计划中移除该课程吗？')) {
            console.log('移除课程:', courseId);
            this.showNotification('课程已从计划中移除', 'success');
        }
    }

    updatePlanDetails(plan) {
        const details = document.getElementById('plan-details');
        if (!details) return;

        if (plan.courses.length === 0) {
            details.innerHTML = `
                <div class="empty-plan">
                    <i class="fas fa-calendar-plus"></i>
                    <p>请从左侧选择课程进行安排</p>
                </div>
            `;
        } else {
            details.innerHTML = `
                <div class="plan-details-content">
                    <h4>当前学期开课详情</h4>
                    <div class="details-list">
                        ${plan.courses.map(course => `
                            <div class="detail-card">
                                <h5>${course.name} (${course.id})</h5>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">授课教师:</span>
                                        <span class="detail-value">${course.teacher}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">上课时间:</span>
                                        <span class="detail-value">${course.time}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">上课教室:</span>
                                        <span class="detail-value">${course.classrooms.join(', ')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">选课人数:</span>
                                        <span class="detail-value">${course.students}人</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    showAddClassroomModal() {
        this.showNotification('添加教室功能待实现', 'info');
    }

    autoArrangeClassrooms() {
        this.showNotification('智能排课功能待实现', 'info');
    }

    renderClassroomList(classrooms) {
        const container = document.getElementById('classroom-items');
        if (!container) return;

        container.innerHTML = classrooms.map(room => `
            <div class="classroom-item" data-room-id="${room.id}">
                <div class="classroom-info">
                    <h4>${room.name}</h4>
                    <p>${room.building} - 容量: ${room.capacity}人</p>
                    <p>类型: ${room.type} | 设备: ${room.equipment}</p>
                </div>
                <div class="classroom-status">
                    <span class="status-badge ${room.status === '空闲' ? 'status-active' : 'status-inactive'}">
                        ${room.status}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderClassroomSchedule() {
        const grid = document.getElementById('classroom-schedule-grid');
        if (!grid) return;

        // 生成课表网格
        grid.innerHTML = `
            <div class="schedule-header">
                <div class="time-header"></div>
                <div class="day-header">周一</div>
                <div class="day-header">周二</div>
                <div class="day-header">周三</div>
                <div class="day-header">周四</div>
                <div class="day-header">周五</div>
            </div>
            ${['08:00', '10:00', '14:00', '16:00'].map(time => `
                <div class="schedule-row">
                    <div class="time-cell">${time}</div>
                    <div class="schedule-cell"></div>
                    <div class="schedule-cell"></div>
                    <div class="schedule-cell"></div>
                    <div class="schedule-cell"></div>
                    <div class="schedule-cell"></div>
                </div>
            `).join('')}
        `;
    }

    async fetchTeachers() {
        return [
            {
                id: '001',
                name: '张老师',
                gender: '男',
                title: '教授',
                department: '计算机学院',
                research: '人工智能',
                phone: '13800138000',
                email: 'zhang@university.edu'
            }
        ];
    }

    renderTeacherTable(teachers) {
        const tbody = document.getElementById('teacher-table-body');
        if (!tbody) return;

        tbody.innerHTML = teachers.map(teacher => `
            <tr>
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td>${teacher.gender}</td>
                <td>${teacher.title}</td>
                <td>${teacher.department}</td>
                <td>${teacher.research}</td>
                <td>${teacher.phone}</td>
                <td>${teacher.email}</td>
                <td>
                    <button class="btn-action edit" onclick="baseDataManagement.editTeacher('${teacher.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async fetchCourses() {
        return [
            {
                id: 'CS101',
                name: '计算机基础',
                credit: 3,
                hours: 48,
                type: '必修',
                department: '计算机学院',
                teacher: '张老师',
                studentCount: 90,
                status: '已发布'
            }
        ];
    }

    renderCourseTable(courses) {
        const tbody = document.getElementById('course-table-body');
        if (!tbody) return;

        tbody.innerHTML = courses.map(course => `
            <tr>
                <td>${course.id}</td>
                <td>${course.name}</td>
                <td>${course.credit}</td>
                <td>${course.hours}</td>
                <td>${course.type}</td>
                <td>${course.department}</td>
                <td>${course.teacher}</td>
                <td>${course.studentCount}</td>
                <td><span class="status-badge status-active">${course.status}</span></td>
                <td>
                    <button class="btn-action edit" onclick="baseDataManagement.editCourse('${course.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async fetchClassrooms() {
        return [
            {
                id: 'A101',
                name: 'A101多媒体教室',
                building: '第一教学楼',
                capacity: 100,
                type: '多媒体教室',
                equipment: '投影仪、电脑、音响',
                status: '空闲'
            }
        ];
    }
}

// 创建全局实例
const baseDataManagement = new BaseDataManagement();