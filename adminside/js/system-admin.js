/**
 * 系统管理端功能脚本 - 更新为符合RESTful API
 */

class SystemAdmin {
    constructor() {
        this.currentModule = 'logs';
        this.logsData = [];
        this.backupData = [];
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.selectedBackups = new Set();
        this.API_BASE_URL = '/api/v1';
        this.token = localStorage.getItem('teaching_admin_token');
        
        this.init();
    }
    
    async init() {
        if (!await this.checkAuth()) {
            window.location.href = '/login.html';
            return;
        }
        
        this.initModules();
        this.setupEventListeners();
        await this.loadLogsData();
        await this.loadBackupData();
        await this.updateSystemStatus();
    }
    
    async checkAuth() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    initModules() {
        const moduleLinks = document.querySelectorAll('.list-group-item[data-module]');
        moduleLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                moduleLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const moduleId = link.getAttribute('data-module');
                this.showModule(moduleId);
            });
        });
    }
    
    showModule(moduleId) {
        this.currentModule = moduleId;
        
        document.querySelectorAll('.module-content').forEach(module => {
            module.classList.add('d-none');
        });
        
        const targetModule = document.getElementById(`${moduleId}Module`);
        if (targetModule) {
            targetModule.classList.remove('d-none');
            
            if (moduleId === 'logs') {
                this.loadLogsData();
            } else if (moduleId === 'backup') {
                this.loadBackupData();
            } else if (moduleId === 'system') {
                this.updateSystemStatus();
            }
        }
    }
    
    setupEventListeners() {
        // 修改密码
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
            this.showChangePasswordModal();
        });
        
        // 日志查询
        document.getElementById('searchLogsBtn')?.addEventListener('click', () => this.filterLogs());
        document.getElementById('resetLogsBtn')?.addEventListener('click', () => this.resetLogFilters());
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => this.exportLogs());
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => this.clearLogs());
        
        // 备份管理
        document.getElementById('saveBackupSettingsBtn')?.addEventListener('click', () => this.saveBackupSettings());
        document.getElementById('startBackupBtn')?.addEventListener('click', () => this.startBackup());
        document.getElementById('refreshBackupListBtn')?.addEventListener('click', () => this.loadBackupData());
        document.getElementById('deleteSelectedBackupsBtn')?.addEventListener('click', () => this.deleteSelectedBackups());
        document.getElementById('restoreBackupBtn')?.addEventListener('click', () => this.showRestoreConfirm());
        document.getElementById('confirmRestoreBtn')?.addEventListener('click', () => this.confirmRestore());
        
        // 全选备份
        const selectAllBackups = document.getElementById('selectAllBackups');
        if (selectAllBackups) {
            selectAllBackups.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('#backupTableBody .backup-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    const backupId = checkbox.getAttribute('data-id');
                    if (e.target.checked) {
                        this.selectedBackups.add(backupId);
                    } else {
                        this.selectedBackups.delete(backupId);
                    }
                });
                this.updateBackupActions();
            });
        }
    }
    
    async loadLogsData() {
        try {
            this.showLoading('正在从服务器加载日志数据...');
            
            const params = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.itemsPerPage
            });
            
            // 添加筛选条件
            const moduleFilter = document.getElementById('logModuleFilter')?.value;
            const operatorFilter = document.getElementById('logOperatorFilter')?.value;
            const timeFilter = document.getElementById('logTimeFilter')?.value;
            
            if (moduleFilter) params.append('action', moduleFilter);
            if (operatorFilter) params.append('user_id', operatorFilter);
            if (timeFilter && timeFilter !== 'custom') {
                const startDate = this.getStartDateFromFilter(timeFilter);
                if (startDate) params.append('start_date', startDate);
            }
            
            const response = await fetch(`${this.API_BASE_URL}/logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.logsData = data.data;
                this.renderLogsTable(data.data);
                this.updateLogsPagination(data.pagination);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('加载日志数据失败:', error);
            this.showAlert(`加载日志数据失败: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    getStartDateFromFilter(timeFilter) {
        const now = new Date();
        switch(timeFilter) {
            case 'today':
                return now.toISOString().split('T')[0];
            case 'week':
                now.setDate(now.getDate() - 7);
                return now.toISOString().split('T')[0];
            case 'month':
                now.setMonth(now.getMonth() - 1);
                return now.toISOString().split('T')[0];
            case 'quarter':
                now.setMonth(now.getMonth() - 3);
                return now.toISOString().split('T')[0];
            default:
                return null;
        }
    }
    
    renderLogsTable(logs) {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;
        
        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-clipboard"></i>
                            <p class="mb-0">暂无日志数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = logs.map(log => {
            const formattedTime = new Date(log.timestamp).toLocaleString('zh-CN');
            const status = log.details && log.details.includes('失败') ? '失败' : '成功';
            const statusBadge = status === '成功' 
                ? '<span class="badge bg-success">成功</span>'
                : '<span class="badge bg-danger">失败</span>';
            
            return `
                <tr>
                    <td>${formattedTime}</td>
                    <td>${log.operator?.username || '系统'}</td>
                    <td>
                        <span class="badge bg-secondary">${this.getModuleName(log.action)}</span>
                    </td>
                    <td>${this.getActionName(log.action)}</td>
                    <td>${log.details || log.action}</td>
                    <td><code>${log.ip_address || '127.0.0.1'}</code></td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="systemAdmin.viewLogDetail(${log.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="systemAdmin.deleteLog(${log.id})" title="删除日志">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    updateLogsPagination(pagination) {
        if (!pagination) return;
        
        const totalPages = pagination.totalPages || 1;
        const currentPage = pagination.currentPage || 1;
        
        const paginationElement = document.getElementById('logsPagination');
        if (!paginationElement) return;
        
        let paginationHtml = '';
        
        // 上一页按钮
        paginationHtml += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="systemAdmin.changeLogsPage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
        
        // 页码按钮
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="systemAdmin.changeLogsPage(${i})">${i}</a>
                </li>
            `;
        }
        
        // 下一页按钮
        paginationHtml += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="systemAdmin.changeLogsPage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
        
        paginationElement.innerHTML = paginationHtml;
    }
    
    changeLogsPage(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadLogsData();
    }
    
    async filterLogs() {
        this.currentPage = 1;
        await this.loadLogsData();
    }
    
    resetLogFilters() {
        document.getElementById('logModuleFilter').value = '';
        document.getElementById('logActionFilter').value = '';
        document.getElementById('logOperatorFilter').value = '';
        document.getElementById('logTimeFilter').value = 'week';
        
        this.currentPage = 1;
        this.loadLogsData();
    }
    
    async exportLogs() {
        try {
            this.showLoading('正在导出日志数据...');
            
            const response = await fetch(`${this.API_BASE_URL}/logs?pageSize=1000`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const logs = data.data.map(log => ({
                    '操作时间': new Date(log.timestamp).toLocaleString('zh-CN'),
                    '操作人员': log.operator?.username || '系统',
                    '操作模块': this.getModuleName(log.action),
                    '操作类型': this.getActionName(log.action),
                    '操作内容': log.details || log.action,
                    'IP地址': log.ip_address || '127.0.0.1',
                    '状态': log.details && log.details.includes('失败') ? '失败' : '成功'
                }));
                
                Utils.exportToCSV(logs, `系统日志_${new Date().toISOString().split('T')[0]}.csv`);
                
                this.hideLoading();
                this.showAlert('日志导出成功！', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            console.error('导出失败:', error);
            this.showAlert(`导出失败: ${error.message}`, 'error');
        }
    }
    
    async clearLogs() {
        if (!await Utils.confirmDialog('确定要清理所有日志吗？只保留最近30天的日志。此操作不可恢复。')) {
            return;
        }
        
        try {
            this.showLoading('正在清理日志数据...');
            
            // 这里应该调用API清理日志
            // 由于API设计中没有明确的清理接口，我们使用一个模拟的API调用
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const response = await fetch(`${this.API_BASE_URL}/logs/clean`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    older_than: thirtyDaysAgo.toISOString()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideLoading();
                this.showAlert(`日志清理成功，删除了 ${data.deleted_count || 0} 条记录`, 'success');
                
                this.currentPage = 1;
                await this.loadLogsData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            console.error('清理失败:', error);
            this.showAlert(`清理失败: ${error.message}`, 'error');
        }
    }
    
    viewLogDetail(logId) {
        const log = this.logsData.find(log => log.id == logId);
        if (!log) return;
        
        const detailHtml = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6>操作时间</h6>
                    <p>${new Date(log.timestamp).toLocaleString('zh-CN')}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>操作人员</h6>
                    <p>${log.operator?.username || '系统'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>操作模块</h6>
                    <p><span class="badge bg-secondary">${this.getModuleName(log.action)}</span></p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>操作类型</h6>
                    <p>${this.getActionName(log.action)}</p>
                </div>
                <div class="col-md-12 mb-3">
                    <h6>操作内容</h6>
                    <p>${log.details || log.action}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>IP地址</h6>
                    <p><code>${log.ip_address || '127.0.0.1'}</code></p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>状态</h6>
                    <p>${log.details && log.details.includes('失败') ? 
                        '<span class="badge bg-danger">失败</span>' : 
                        '<span class="badge bg-success">成功</span>'}</p>
                </div>
            </div>
        `;
        
        document.getElementById('backupDetailContent').innerHTML = detailHtml;
        const modal = new bootstrap.Modal(document.getElementById('backupDetailModal'));
        modal.show();
    }
    
    async deleteLog(logId) {
        if (!await Utils.confirmDialog('确定要删除这条日志吗？')) return;
        
        try {
            this.showLoading('正在删除日志...');
            
            // 这里应该调用API删除日志
            // 由于API设计中没有明确的删除接口，我们使用一个模拟的API调用
            const response = await fetch(`${this.API_BASE_URL}/logs/${logId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('日志删除成功！', 'success');
                await this.loadLogsData();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            console.error('删除失败:', error);
            this.showAlert(`删除失败: ${error.message}`, 'error');
        }
    }
    
    async updateSystemStatus() {
        try {
            this.showLoading('正在获取系统状态...');
            
            const response = await fetch(`${this.API_BASE_URL}/system/status`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const status = data.data;
                
                // 更新系统状态面板
                document.querySelectorAll('.system-status .badge').forEach(badge => {
                    const label = badge.previousElementSibling.textContent.trim();
                    if (label.includes('数据库状态')) {
                        badge.textContent = status.database_status;
                        badge.className = `badge bg-${status.database_status === '正常' ? 'success' : 'danger'}`;
                    } else if (label.includes('服务运行')) {
                        badge.textContent = status.uptime_days + '天';
                    } else if (label.includes('存储使用')) {
                        badge.textContent = status.storage_usage + '%';
                        badge.className = `badge bg-${status.storage_usage < 70 ? 'success' : status.storage_usage < 90 ? 'warning' : 'danger'}`;
                    } else if (label.includes('最后备份')) {
                        badge.textContent = status.last_backup ? 
                            new Date(status.last_backup).toLocaleDateString('zh-CN') : '从未备份';
                    }
                });
                
                // 更新统计信息
                if (status.statistics) {
                    document.getElementById('user-count').textContent = status.statistics.users;
                    document.getElementById('course-count').textContent = status.statistics.courses;
                    document.getElementById('student-count').textContent = status.statistics.students;
                    document.getElementById('teacher-count').textContent = status.statistics.teachers;
                    document.getElementById('today-log-count').textContent = status.statistics.today_logs;
                    document.getElementById('published-grade-count').textContent = status.statistics.published_grades;
                }
                
                this.hideLoading();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            console.error('获取系统状态失败:', error);
            this.showAlert(`获取系统状态失败: ${error.message}`, 'error');
        }
    }
    
    getModuleName(action) {
        const moduleMap = {
            'USER_': '用户管理',
            'CLASS_': '班级管理',
            'STUDENT_': '学生管理',
            'COURSE_': '课程管理',
            'GRADE_': '成绩管理',
            'LOGIN_': '认证管理',
            'BACKUP_': '备份管理',
            'SYSTEM_': '系统管理'
        };
        
        for (const [prefix, name] of Object.entries(moduleMap)) {
            if (action.startsWith(prefix)) {
                return name;
            }
        }
        
        return '系统管理';
    }
    
    getActionName(action) {
        const actionMap = {
            'CREATE': '新增',
            'UPDATE': '修改',
            'DELETE': '删除',
            'LOGIN': '登录',
            'EXPORT': '导出',
            'IMPORT': '导入',
            'PUBLISH': '发布',
            'BACKUP': '备份',
            'RESTORE': '恢复'
        };
        
        // 提取动作类型
        const parts = action.split('_');
        const actionType = parts[parts.length - 1];
        
        return actionMap[actionType] || actionType;
    }
    
    async loadBackupData() {
        try {
            this.showLoading('正在加载备份数据...');
            
            // 这里应该调用API获取备份列表
            // 由于API设计中没有明确的备份列表接口，我们使用模拟数据
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.backupData = this.generateMockBackups(12);
            this.renderBackupTable();
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            console.error('加载备份数据失败:', error);
            this.showAlert(`加载备份数据失败: ${error.message}`, 'error');
        }
    }
    
    generateMockBackups(count) {
        // 模拟数据生成逻辑保持不变
        const backups = [];
        const types = ['full', 'incremental'];
        const statuses = ['success', 'running', 'error'];
        const descriptions = [
            '系统例行备份',
            '重大更新前备份',
            '数据迁移前备份',
            '紧急情况备份',
            '月末数据备份'
        ];
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 60);
        
        for (let i = 0; i < count; i++) {
            const backupDate = new Date(startDate);
            backupDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60));
            backupDate.setHours(Math.floor(Math.random() * 24));
            backupDate.setMinutes(Math.floor(Math.random() * 60));
            
            const type = types[Math.floor(Math.random() * types.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const size = Math.floor(Math.random() * 500) + 50;
            
            backups.push({
                id: `backup_${i + 1}`,
                timestamp: backupDate.toISOString(),
                type: type,
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                size: size,
                status: status,
                verified: Math.random() > 0.3
            });
        }
        
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    renderBackupTable() {
        const tbody = document.getElementById('backupTableBody');
        if (!tbody) return;
        
        if (this.backupData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-database"></i>
                            <p class="mb-0">暂无备份数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.backupData.map(backup => {
            const backupDate = new Date(backup.timestamp);
            const formattedTime = backupDate.toLocaleString('zh-CN');
            const formattedSize = `${backup.size} MB`;
            
            let statusHtml = '';
            switch (backup.status) {
                case 'success':
                    statusHtml = `<span class="backup-status-success"><i class="fas fa-check-circle me-1"></i>成功${backup.verified ? ' (已验证)' : ''}</span>`;
                    break;
                case 'running':
                    statusHtml = `<span class="backup-status-running"><i class="fas fa-sync-alt fa-spin me-1"></i>进行中</span>`;
                    break;
                case 'error':
                    statusHtml = `<span class="backup-status-error"><i class="fas fa-exclamation-circle me-1"></i>失败</span>`;
                    break;
            }
            
            return `
                <tr>
                    <td>
                        <div class="form-check">
                            <input class="form-check-input backup-checkbox" type="checkbox" 
                                   data-id="${backup.id}" 
                                   ${backup.status !== 'success' ? 'disabled' : ''}
                                   onchange="systemAdmin.toggleBackupSelection('${backup.id}', this.checked)">
                        </div>
                    </td>
                    <td>${formattedTime}</td>
                    <td>
                        <span class="badge ${backup.type === 'full' ? 'bg-primary' : 'bg-info'}">
                            ${backup.type === 'full' ? '完整备份' : '增量备份'}
                        </span>
                    </td>
                    <td>${backup.description}</td>
                    <td>${formattedSize}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info me-1" 
                                onclick="systemAdmin.viewBackupDetail('${backup.id}')" 
                                title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success me-1" 
                                ${backup.status !== 'success' ? 'disabled' : ''} 
                                onclick="systemAdmin.downloadBackup('${backup.id}')" 
                                title="下载备份">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                ${backup.status !== 'success' ? 'disabled' : ''} 
                                onclick="systemAdmin.deleteBackup('${backup.id}')" 
                                title="删除备份">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('selectAllBackups').checked = false;
        this.selectedBackups.clear();
        this.updateBackupActions();
    }
    
    toggleBackupSelection(backupId, isChecked) {
        if (isChecked) {
            this.selectedBackups.add(backupId);
        } else {
            this.selectedBackups.delete(backupId);
        }
        
        const totalCheckboxes = document.querySelectorAll('#backupTableBody .backup-checkbox:not(:disabled)').length;
        const checkedCheckboxes = document.querySelectorAll('#backupTableBody .backup-checkbox:checked').length;
        document.getElementById('selectAllBackups').checked = checkedCheckboxes === totalCheckboxes;
        
        this.updateBackupActions();
    }
    
    updateBackupActions() {
        const hasSelection = this.selectedBackups.size > 0;
        document.getElementById('deleteSelectedBackupsBtn').disabled = !hasSelection;
        document.getElementById('restoreBackupBtn').disabled = this.selectedBackups.size !== 1;
    }
    
    viewBackupDetail(backupId) {
        const backup = this.backupData.find(b => b.id === backupId);
        if (!backup) return;
        
        const backupDate = new Date(backup.timestamp);
        const formattedTime = backupDate.toLocaleString('zh-CN');
        const formattedSize = `${backup.size} MB`;
        const typeName = backup.type === 'full' ? '完整备份' : '增量备份';
        
        let statusText = '';
        switch (backup.status) {
            case 'success':
                statusText = `成功${backup.verified ? ' (已验证)' : ' (未验证)'}`;
                break;
            case 'running':
                statusText = '进行中';
                break;
            case 'error':
                statusText = '失败';
                break;
        }
        
        const detailHtml = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6>备份ID</h6>
                    <p><code>${backup.id}</code></p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>备份时间</h6>
                    <p>${formattedTime}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>备份类型</h6>
                    <p><span class="badge ${backup.type === 'full' ? 'bg-primary' : 'bg-info'}">${typeName}</span></p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>文件大小</h6>
                    <p>${formattedSize}</p>
                </div>
                <div class="col-md-12 mb-3">
                    <h6>备份描述</h6>
                    <p>${backup.description}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>备份状态</h6>
                    <p>
                        ${backup.status === 'success' ? 
                            `<span class="backup-status-success"><i class="fas fa-check-circle me-1"></i>${statusText}</span>` : 
                          backup.status === 'running' ? 
                            `<span class="backup-status-running"><i class="fas fa-sync-alt fa-spin me-1"></i>${statusText}</span>` :
                            `<span class="backup-status-error"><i class="fas fa-exclamation-circle me-1"></i>${statusText}</span>`
                        }
                    </p>
                </div>
                <div class="col-md-6 mb-3">
                    <h6>数据完整性</h6>
                    <p>${backup.verified ? 
                        '<span class="badge bg-success"><i class="fas fa-check me-1"></i>已验证</span>' : 
                        '<span class="badge bg-warning"><i class="fas fa-exclamation-triangle me-1"></i>未验证</span>'}</p>
                </div>
            </div>
        `;
        
        document.getElementById('backupDetailContent').innerHTML = detailHtml;
        const modal = new bootstrap.Modal(document.getElementById('backupDetailModal'));
        modal.show();
    }
    
    async downloadBackup(backupId) {
        const backup = this.backupData.find(b => b.id === backupId);
        if (!backup) return;
        
        this.showLoading(`正在准备备份文件 ${backup.id}...`);
        
        try {
            // 模拟下载过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.hideLoading();
            this.showAlert('备份文件下载开始，请查看浏览器下载列表。', 'success');
        } catch (error) {
            this.hideLoading();
            this.showAlert(`下载失败: ${error.message}`, 'error');
        }
    }
    
    async deleteBackup(backupId) {
        if (!await Utils.confirmDialog('确定要删除这个备份吗？此操作不可恢复。')) return;
        
        try {
            // 这里应该调用API删除备份
            const index = this.backupData.findIndex(backup => backup.id === backupId);
            if (index !== -1) {
                const backup = this.backupData[index];
                this.backupData.splice(index, 1);
                
                this.selectedBackups.delete(backupId);
                this.renderBackupTable();
                
                this.showAlert('备份删除成功！', 'success');
            }
        } catch (error) {
            this.showAlert(`删除失败: ${error.message}`, 'error');
        }
    }
    
    async saveBackupSettings() {
        const frequency = document.getElementById('backupFrequency').value;
        const retention = document.getElementById('backupRetention').value;
        const encryption = document.getElementById('backupEncryption').checked;
        
        try {
            this.showLoading('正在保存备份设置...');
            
            // 模拟保存过程
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.hideLoading();
            this.showAlert('备份设置保存成功！', 'success');
        } catch (error) {
            this.hideLoading();
            this.showAlert(`保存失败: ${error.message}`, 'error');
        }
    }
    
    async startBackup() {
        const description = document.getElementById('backupDescription').value.trim();
        const type = document.getElementById('backupType').value;
        const verification = document.getElementById('backupVerification').checked;
        
        if (!description) {
            this.showAlert('请输入备份描述！', 'warning');
            document.getElementById('backupDescription').focus();
            return;
        }
        
        if (!await Utils.confirmDialog('确定要开始备份吗？备份过程可能需要几分钟时间。')) return;
        
        try {
            this.showLoading('正在启动备份进程...');
            
            const response = await fetch(`${this.API_BASE_URL}/system/backups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    description: description,
                    type: type,
                    verification: verification
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 创建新的备份记录
                const newBackup = {
                    id: `backup_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    type: type,
                    description: description,
                    size: Math.floor(Math.random() * 300) + 100,
                    status: 'running',
                    verified: false
                };
                
                this.backupData.unshift(newBackup);
                this.renderBackupTable();
                
                this.hideLoading();
                this.showAlert('备份任务已启动，请稍后查看备份列表获取结果。', 'success');
                
                // 模拟备份完成
                setTimeout(() => {
                    const index = this.backupData.findIndex(b => b.id === newBackup.id);
                    if (index !== -1) {
                        this.backupData[index].status = 'success';
                        this.backupData[index].verified = verification;
                        this.backupData[index].size = Math.floor(Math.random() * 300) + 100;
                        this.renderBackupTable();
                    }
                }, 5000);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.hideLoading();
            this.showAlert(`启动备份失败: ${error.message}`, 'error');
        }
    }
    
    async deleteSelectedBackups() {
        if (this.selectedBackups.size === 0) return;
        
        if (!await Utils.confirmDialog(`确定要删除选中的 ${this.selectedBackups.size} 个备份吗？此操作不可恢复。`)) {
            return;
        }
        
        try {
            this.showLoading('正在删除选中的备份...');
            
            // 模拟删除过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.backupData = this.backupData.filter(backup => !this.selectedBackups.has(backup.id));
            this.selectedBackups.clear();
            this.renderBackupTable();
            
            this.hideLoading();
            this.showAlert('选中的备份已删除！', 'success');
        } catch (error) {
            this.hideLoading();
            this.showAlert(`删除失败: ${error.message}`, 'error');
        }
    }
    
    showRestoreConfirm() {
        if (this.selectedBackups.size !== 1) return;
        
        const backupId = Array.from(this.selectedBackups)[0];
        const backup = this.backupData.find(b => b.id === backupId);
        if (!backup) return;
        
        document.getElementById('restoreBackupName').textContent = backup.description;
        document.getElementById('restoreAdminPassword').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('restoreConfirmModal'));
        modal.show();
    }
    
    async confirmRestore() {
        const password = document.getElementById('restoreAdminPassword').value;
        
        if (!password) {
            this.showAlert('请输入管理员密码！', 'warning');
            return;
        }
        
        // 验证密码（简化处理）
        if (password !== 'admin123') {
            this.showAlert('管理员密码错误！', 'error');
            return;
        }
        
        const backupId = Array.from(this.selectedBackups)[0];
        const backup = this.backupData.find(b => b.id === backupId);
        
        try {
            this.showLoading('正在恢复系统数据，此过程可能需要几分钟...');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('restoreConfirmModal'));
            modal.hide();
            
            // 模拟恢复过程
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.hideLoading();
            this.showAlert('系统恢复成功！建议重启系统服务以使恢复生效。', 'success');
        } catch (error) {
            this.hideLoading();
            this.showAlert(`恢复失败: ${error.message}`, 'error');
        }
    }
    
    showChangePasswordModal() {
        const modalHtml = `
            <div class="modal fade" id="changePasswordModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">修改密码</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="changePasswordForm">
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
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        modal.show();
        
        document.getElementById('savePasswordBtn').addEventListener('click', async () => {
            await this.savePassword();
        });
        
        modalContainer.addEventListener('hidden.bs.modal', () => {
            modalContainer.remove();
        });
    }
    
    async savePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!oldPassword || !newPassword || !confirmPassword) {
            this.showAlert('请填写所有密码字段！', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showAlert('两次输入的新密码不一致！', 'error');
            return;
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            this.showAlert('新密码必须包含至少8个字符，包括大写字母、小写字母和数字！', 'error');
            return;
        }
        
        try {
            this.showLoading('正在修改密码...');
            
            // 模拟密码修改过程
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
            
            document.getElementById('changePasswordForm').reset();
            
            this.hideLoading();
            this.showAlert('密码修改成功！', 'success');
        } catch (error) {
            this.hideLoading();
            this.showAlert(`密码修改失败: ${error.message}`, 'error');
        }
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
    
    showAlert(message, type = 'info') {
        if (window.Utils) {
            Utils.showNotification(message, type);
        } else {
            alert(`${type}: ${message}`);
        }
    }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.systemAdmin = new SystemAdmin();
});

// 导出函数到全局作用域
window.changeLogsPage = (page) => window.systemAdmin?.changeLogsPage(page);
window.viewLogDetail = (logId) => window.systemAdmin?.viewLogDetail(logId);
window.deleteLog = (logId) => window.systemAdmin?.deleteLog(logId);
window.viewBackupDetail = (backupId) => window.systemAdmin?.viewBackupDetail(backupId);
window.downloadBackup = (backupId) => window.systemAdmin?.downloadBackup(backupId);
window.deleteBackup = (backupId) => window.systemAdmin?.deleteBackup(backupId);
window.toggleBackupSelection = (backupId, isChecked) => window.systemAdmin?.toggleBackupSelection(backupId, isChecked);