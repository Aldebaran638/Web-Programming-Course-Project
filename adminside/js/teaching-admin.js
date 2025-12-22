// 教学管理端主模块 - 更新为符合RESTful API
class TeachingAdmin {
    constructor() {
        this.currentUser = null;
        this.API_BASE_URL = '/api/v1';
        this.token = localStorage.getItem('teaching_admin_token');
        
        this.init();
    }

    async init() {
        // 检查登录状态
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            // 跳转到登录页
            window.location.href = '/login.html';
            return;
        }
        
        // 初始化时间显示
        this.initDateTime();
        
        // 初始化所有模块
        this.initModules();
        
        // 绑定全局事件
        this.bindGlobalEvents();
    }

    async checkAuth() {
        if (!this.token) {
            return false;
        }
        
        try {
            // 验证token有效性
            const response = await fetch(`${this.API_BASE_URL}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('认证失败');
            }
            
            const data = await response.json();
            this.currentUser = data.user;
            
            // 更新UI
            this.updateUserInfo();
            
            return true;
        } catch (error) {
            console.error('认证检查失败:', error);
            return false;
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('teaching_admin_token', data.token);
                
                // 如果要求强制修改密码
                if (data.user.force_password_change) {
                    this.showForcePasswordChangeModal();
                }
                
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: '登录请求失败' };
        }
    }

    updateUserInfo() {
        const lastLoginTime = document.getElementById('last-login-time');
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role');
        
        if (this.currentUser) {
            if (lastLoginTime) {
                lastLoginTime.textContent = new Date().toLocaleString('zh-CN');
            }
            
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name || this.currentUser.username;
            }
            
            if (userRoleElement) {
                const roleMap = {
                    'teaching_admin': '教学管理员',
                    'sys_admin': '系统管理员',
                    'teacher': '教师',
                    'student': '学生'
                };
                userRoleElement.textContent = roleMap[this.currentUser.role] || this.currentUser.role;
            }
        }
    }

    initDateTime() {
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
    }

    updateCurrentTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        const timeStr = now.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const timeElements = document.querySelectorAll('.current-time');
        timeElements.forEach(el => {
            el.textContent = `${dateStr} ${timeStr}`;
        });
    }

    initModules() {
        console.log('教学管理端初始化完成');
        
        // 根据用户角色显示相应模块
        this.filterModulesByRole();
        
        // 设置初始标签页
        this.setInitialTab();
    }

    filterModulesByRole() {
        const modules = {
            'classes': 'teaching_admin',
            'students': 'teaching_admin',
            'teachers': 'teaching_admin',
            'courses': 'teaching_admin',
            'semester-plan': 'teaching_admin',
            'classroom': 'teaching_admin',
            'timetable': 'teaching_admin',
            'grade-audit': 'teaching_admin',
            'logs': 'sys_admin',
            'backup': 'sys_admin',
            'system': 'sys_admin'
        };
        
        // 隐藏用户无权访问的模块
        for (const [moduleId, requiredRole] of Object.entries(modules)) {
            const moduleElement = document.querySelector(`[data-tab="${moduleId}"]`);
            if (moduleElement) {
                const hasPermission = this.checkModulePermission(requiredRole);
                moduleElement.style.display = hasPermission ? '' : 'none';
            }
        }
    }

    checkModulePermission(requiredRole) {
        const roleHierarchy = {
            'sys_admin': 5,
            'teaching_admin': 4,
            'teacher': 3,
            'student': 2
        };
        
        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    setInitialTab() {
        const urlParams = new URLSearchParams(window.location.search);
        const initialTab = urlParams.get('tab') || 'classes';
        
        // 检查用户是否有权限访问该标签页
        if (this.checkModulePermission(this.getTabRequiredRole(initialTab))) {
            if (window.baseDataManagement) {
                window.baseDataManagement.switchTab(initialTab);
            }
        }
    }

    getTabRequiredRole(tab) {
        const roleMap = {
            'classes': 'teaching_admin',
            'students': 'teaching_admin',
            'teachers': 'teaching_admin',
            'courses': 'teaching_admin',
            'semester-plan': 'teaching_admin',
            'classroom': 'teaching_admin',
            'timetable': 'teaching_admin',
            'grade-audit': 'teaching_admin',
            'logs': 'sys_admin',
            'backup': 'sys_admin',
            'system': 'sys_admin'
        };
        
        return roleMap[tab] || 'teaching_admin';
    }

    bindGlobalEvents() {
        // 退出登录
        document.querySelector('.logout-btn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // 修改密码
        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            this.showChangePasswordModal();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    async logout() {
        if (await Utils.confirmDialog('确定要退出登录吗？')) {
            // 清除登录状态
            localStorage.removeItem('teaching_admin_token');
            this.token = null;
            this.currentUser = null;
            
            // 跳转到登录页
            window.location.href = '/login.html';
        }
    }

    async showChangePasswordModal() {
        const modalHtml = `
            <div class="modal fade" id="changePasswordModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">修改密码</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="passwordChangeForm">
                                <div class="mb-3">
                                    <label for="oldPassword" class="form-label">原密码</label>
                                    <input type="password" class="form-control" id="oldPassword" required>
                                </div>
                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">新密码</label>
                                    <input type="password" class="form-control" id="newPassword" required>
                                    <div class="form-text">密码必须至少8个字符，包含大小写字母和数字</div>
                                </div>
                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label">确认新密码</label>
                                    <input type="password" class="form-control" id="confirmPassword" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="savePasswordBtn">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加modal到页面
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // 显示modal
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
        
        // 绑定保存事件
        document.getElementById('savePasswordBtn').addEventListener('click', async () => {
            await this.changePassword();
        });
        
        // modal关闭后移除
        modalContainer.addEventListener('hidden.bs.modal', () => {
            modalContainer.remove();
        });
    }

    async changePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // 验证
        if (newPassword !== confirmPassword) {
            Utils.showNotification('两次输入的密码不一致', 'error');
            return;
        }
        
        const passwordValidation = Utils.validatePassword(newPassword, {
            minLength: 8,
            requireUpperCase: true,
            requireLowerCase: true,
            requireNumbers: true
        });
        
        if (!passwordValidation.isValid) {
            Utils.showNotification('密码不符合强度要求', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                Utils.showNotification('密码修改成功', 'success');
                
                // 关闭modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
            } else {
                Utils.showNotification(`密码修改失败: ${data.message}`, 'error');
            }
        } catch (error) {
            Utils.showNotification('密码修改请求失败', 'error');
        }
    }

    showForcePasswordChangeModal() {
        // 显示强制修改密码的modal
        const modalHtml = `
            <div class="modal fade" id="forcePasswordChangeModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">首次登录需修改密码</h5>
                        </div>
                        <div class="modal-body">
                            <p>为安全起见，首次登录必须修改初始密码。</p>
                            <form id="forcePasswordChangeForm">
                                <div class="mb-3">
                                    <label for="forceNewPassword" class="form-label">新密码</label>
                                    <input type="password" class="form-control" id="forceNewPassword" required>
                                    <div class="form-text">密码必须至少8个字符，包含大小写字母和数字</div>
                                </div>
                                <div class="mb-3">
                                    <label for="forceConfirmPassword" class="form-label">确认新密码</label>
                                    <input type="password" class="form-control" id="forceConfirmPassword" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="saveForcePasswordBtn">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('forcePasswordChangeModal'));
        modal.show();
        
        document.getElementById('saveForcePasswordBtn').addEventListener('click', async () => {
            await this.changePassword(true);
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl + S: 保存当前数据
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.saveCurrentData();
        }
        
        // Ctrl + F: 搜索
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            this.focusSearch();
        }
        
        // Ctrl + E: 导出
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            this.exportCurrentData();
        }
        
        // Ctrl + P: 打印
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            this.printCurrentData();
        }
    }

    async saveCurrentData() {
        try {
            // 根据当前激活的标签页调用相应的保存方法
            const activeTab = this.getActiveTab();
            
            switch(activeTab) {
                case 'classes':
                    if (window.baseDataManagement?.saveClass) {
                        await window.baseDataManagement.saveClass();
                    }
                    break;
                case 'students':
                    if (window.baseDataManagement?.saveStudent) {
                        await window.baseDataManagement.saveStudent();
                    }
                    break;
                case 'courses':
                    if (window.baseDataManagement?.saveCourse) {
                        await window.baseDataManagement.saveCourse();
                    }
                    break;
                default:
                    Utils.showNotification('当前页面不支持保存', 'info');
            }
        } catch (error) {
            Utils.showNotification(`保存失败: ${error.message}`, 'error');
        }
    }

    focusSearch() {
        const activeTab = this.getActiveTab();
        let searchInput;
        
        switch(activeTab) {
            case 'classes':
                searchInput = document.getElementById('class-search');
                break;
            case 'students':
                searchInput = document.getElementById('student-name-filter');
                break;
            case 'courses':
                searchInput = document.querySelector('.filter-bar input[type="text"]');
                break;
            case 'logs':
                searchInput = document.getElementById('log-search-input');
                break;
        }
        
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    async exportCurrentData() {
        const activeTab = this.getActiveTab();
        
        switch(activeTab) {
            case 'classes':
                await this.exportClasses();
                break;
            case 'students':
                await this.exportStudents();
                break;
            case 'courses':
                await this.exportCourses();
                break;
            case 'logs':
                await this.exportLogs();
                break;
            default:
                Utils.showNotification('当前页面不支持导出', 'info');
        }
    }

    printCurrentData() {
        const activeTab = this.getActiveTab();
        const contentElement = document.getElementById(activeTab);
        
        if (contentElement) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>打印 - ${document.title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .print-header { text-align: center; margin-bottom: 20px; }
                            .print-title { font-size: 24px; font-weight: bold; }
                            .print-time { color: #666; margin-top: 5px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f8f9fa; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="print-header">
                            <div class="print-title">${document.title}</div>
                            <div class="print-time">打印时间: ${new Date().toLocaleString('zh-CN')}</div>
                        </div>
                        ${contentElement.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    getActiveTab() {
        const activeSection = document.querySelector('.content-section.active');
        return activeSection ? activeSection.id : null;
    }

    async exportClasses() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/classes?pageSize=1000`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const classes = data.data.map(cls => ({
                    '班级ID': cls.id,
                    '班级名称': cls.class_name,
                    '所属院系': cls.department,
                    '入学年份': cls.enrollment_year,
                    '学生人数': cls.student_count,
                    '班主任': cls.head_teacher_name,
                    '创建时间': new Date(cls.created_at).toLocaleDateString('zh-CN')
                }));
                
                Utils.exportToCSV(classes, `班级数据_${new Date().toISOString().split('T')[0]}.csv`);
                Utils.showNotification('班级数据导出成功', 'success');
            } else {
                Utils.showNotification(`导出失败: ${data.message}`, 'error');
            }
        } catch (error) {
            Utils.showNotification(`导出失败: ${error.message}`, 'error');
        }
    }

    async exportStudents() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/students?pageSize=1000`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const students = data.data.map(student => ({
                    '学号': student.student_id_number,
                    '姓名': student.full_name,
                    '性别': student.gender,
                    '班级': student.class_name,
                    '院系': student.department,
                    '邮箱': student.email,
                    '状态': student.status === 'active' ? '在读' : '休学'
                }));
                
                Utils.exportToCSV(students, `学生数据_${new Date().toISOString().split('T')[0]}.csv`);
                Utils.showNotification('学生数据导出成功', 'success');
            } else {
                Utils.showNotification(`导出失败: ${data.message}`, 'error');
            }
        } catch (error) {
            Utils.showNotification(`导出失败: ${error.message}`, 'error');
        }
    }

    async exportLogs() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/logs?pageSize=1000`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const logs = data.data.map(log => ({
                    '时间': new Date(log.timestamp).toLocaleString('zh-CN'),
                    '操作人员': log.operator?.username || '系统',
                    '操作类型': log.action,
                    '操作内容': log.details,
                    'IP地址': log.ip_address
                }));
                
                Utils.exportToCSV(logs, `系统日志_${new Date().toISOString().split('T')[0]}.csv`);
                Utils.showNotification('系统日志导出成功', 'success');
            } else {
                Utils.showNotification(`导出失败: ${data.message}`, 'error');
            }
        } catch (error) {
            Utils.showNotification(`导出失败: ${error.message}`, 'error');
        }
    }

    handleResize() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            document.body.classList.add('mobile-view');
            // 移动端优化
            this.optimizeForMobile();
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    optimizeForMobile() {
        // 移动端优化
        const sidebars = document.querySelectorAll('.sidebar');
        sidebars.forEach(sidebar => {
            sidebar.classList.add('collapsed');
        });
        
        // 添加展开/收起侧边栏的按钮
        if (!document.getElementById('mobile-menu-toggle')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'mobile-menu-toggle';
            toggleBtn.className = 'btn btn-primary mobile-menu-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
            toggleBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            
            toggleBtn.addEventListener('click', () => {
                sidebars.forEach(sidebar => {
                    sidebar.classList.toggle('collapsed');
                });
            });
            
            document.body.appendChild(toggleBtn);
        }
    }

    // API请求包装器
    async apiRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/${endpoint}`, finalOptions);
            
            if (response.status === 401) {
                // Token过期，重新登录
                this.logout();
                return null;
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.teachingAdmin = new TeachingAdmin();
});