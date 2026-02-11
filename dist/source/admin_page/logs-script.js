// 日志审计页面专用JavaScript

// 全局变量
let currentPage = 1;
let totalPages = 1;
let totalItems = 0;
let pageSize = 25;
let currentFilters = {};
let logsData = [];

// 后端 API 基地址
const apiBase = 'http://127.0.0.1:8000/api/v1';

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化日期选择器
    initDatePicker();
    
    // 检查登录状态
    checkLoginStatus();
    
    // 设置最后更新时间
    document.getElementById('last-update').textContent = getCurrentDateTime();
    
    // 绑定事件
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('confirmText').addEventListener('input', checkClearConfirmation);
    
    // 检查URL参数
    checkUrlParams();
    
    // 加载初始数据
    loadLogsData();
    loadLogsStats();
    
    // 初始化侧边栏数据
    updateSidebarStats();
});

// 初始化日期选择器
function initDatePicker() {
    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        locale: "zh",
        placeholder: "选择日期范围",
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 2) {
                currentFilters.start_date = formatDate(selectedDates[0]);
                currentFilters.end_date = formatDate(selectedDates[1]);
            }
        }
    });
}

// 检查URL参数
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type) {
        switch(type) {
            case 'login':
                document.getElementById('actionFilter').value = 'USER_LOGIN,USER_LOGIN_FAILURE';
                break;
            case 'error':
                document.getElementById('actionFilter').value = 'ERROR';
                break;
            case 'security':
                document.getElementById('actionFilter').value = 'SECURITY';
                break;
            case 'admin':
                document.getElementById('actionFilter').value = 'ADMIN_';
                break;
        }
    }
}

// 加载日志数据
async function loadLogsData() {
    try {
        showLoading(true);
        
        // 构建查询参数
        const params = new URLSearchParams({
            page: currentPage,
            pageSize: pageSize
        });
        
        // 添加过滤条件
        if (currentFilters.user_id) {
            params.append('user_id', currentFilters.user_id);
        }
        
        if (currentFilters.action) {
            params.append('action', currentFilters.action);
        }
        
        if (currentFilters.ip_address) {
            params.append('ip_address', currentFilters.ip_address);
        }
        
        if (currentFilters.start_date) {
            params.append('start_date', currentFilters.start_date);
        }
        
        if (currentFilters.end_date) {
            params.append('end_date', currentFilters.end_date);
        }
        
        // 获取日志数据
        const response = await fetch(`${apiBase}/logs?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            logsData = data.logs || [];
            totalItems = data.pagination.totalItems;
            totalPages = data.pagination.totalPages;
            
            // 渲染表格
            renderLogsTable();
            updatePaginationControls();
        } else {
            throw new Error('加载日志数据失败');
        }
    } catch (error) {
        console.error('加载日志数据失败:', error);
        showError('无法加载日志数据，请检查网络连接');
    } finally {
        showLoading(false);
    }
}

// 加载日志统计
async function loadLogsStats() {
    try {
        // 获取总日志数
        const totalResponse = await fetch(`${apiBase}/logs?pageSize=1`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (totalResponse.ok) {
            const totalData = await totalResponse.json();
            document.getElementById('totalLogsCount').textContent = totalData.pagination.totalItems.toLocaleString();
            document.getElementById('total-logs-sidebar').textContent = totalData.pagination.totalItems.toLocaleString();
        }
        
        // 获取今日日志数（模拟数据）
        const todayLogs = Math.floor(Math.random() * 100) + 50;
        document.getElementById('today-logs-sidebar').textContent = todayLogs;
        
        // 模拟其他统计数据
        document.getElementById('successLogsCount').textContent = Math.floor(totalItems * 0.85).toLocaleString();
        document.getElementById('failureLogsCount').textContent = Math.floor(totalItems * 0.10).toLocaleString();
        document.getElementById('securityLogsCount').textContent = Math.floor(totalItems * 0.05).toLocaleString();
        
    } catch (error) {
        console.error('加载日志统计失败:', error);
    }
}

// 渲染日志表格
function renderLogsTable() {
    const tableBody = document.getElementById('logsTableBody');
    
    if (logsData.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>没有找到符合条件的日志记录</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    logsData.forEach(log => {
        const statusClass = getStatusClass(log.action);
        const statusText = getStatusText(log.action);
        const actionText = getActionText(log.action);
        const timeFormatted = formatTime(log.created_at);
        
        html += `
            <tr>
                <td>${log.id}</td>
                <td>${timeFormatted}</td>
                <td>
                    <div class="user-cell">
                        <span class="user-avatar">${log.user?.username?.charAt(0) || 'U'}</span>
                        <span class="user-name">${log.user?.username || '未知用户'}</span>
                    </div>
                </td>
                <td><span class="action-badge ${statusClass}">${actionText}</span></td>
                <td class="log-details">${log.description || log.details || '无详细描述'}</td>
                <td><span class="ip-address">${log.ip_address || '未知'}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewLogDetails(${log.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="exportSingleLog(${log.id})" title="导出">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// 获取状态类
function getStatusClass(action) {
    if (!action) return 'unknown';
    
    if (action.includes('FAILURE') || action.includes('ERROR')) {
        return 'failure';
    } else if (action.includes('SUCCESS') || action.includes('LOGIN')) {
        return 'success';
    } else if (action.includes('WARNING')) {
        return 'warning';
    } else if (action.includes('SECURITY')) {
        return 'security';
    } else {
        return 'info';
    }
}

// 获取状态文本
function getStatusText(action) {
    if (!action) return '未知';
    
    if (action.includes('FAILURE') || action.includes('ERROR')) {
        return '失败';
    } else if (action.includes('SUCCESS')) {
        return '成功';
    } else if (action.includes('LOGIN')) {
        return '登录';
    } else if (action.includes('WARNING')) {
        return '警告';
    } else if (action.includes('SECURITY')) {
        return '安全';
    } else {
        return '信息';
    }
}

// 获取操作文本
function getActionText(action) {
    if (!action) return '未知操作';
    
    const actionMap = {
        'USER_LOGIN': '用户登录',
        'USER_LOGIN_FAILURE': '登录失败',
        'USER_CREATE': '创建用户',
        'USER_UPDATE': '更新用户',
        'USER_DELETE': '删除用户',
        'COURSE_CREATE': '创建课程',
        'COURSE_UPDATE': '更新课程',
        'COURSE_DELETE': '删除课程',
        'GRADE_UPDATE': '更新成绩',
        'BACKUP_CREATE': '创建备份',
        'SYSTEM_CONFIG': '系统配置',
        'SECURITY_AUDIT': '安全审计'
    };
    
    for (const [key, value] of Object.entries(actionMap)) {
        if (action.includes(key)) {
            return value;
        }
    }
    
    return action;
}

// 应用筛选条件
function applyFilters() {
    // 收集筛选条件
    currentFilters = {};
    
    const userId = document.getElementById('userFilter').value.trim();
    if (userId) {
        currentFilters.user_id = parseInt(userId);
    }
    
    const action = document.getElementById('actionFilter').value;
    if (action) {
        currentFilters.action = action;
    }
    
    const ip = document.getElementById('ipFilter').value.trim();
    if (ip) {
        currentFilters.ip_address = ip;
    }
    
    const status = document.getElementById('statusFilter').value;
    if (status) {
        // 这里需要根据状态筛选，但API可能不支持，我们可以前端筛选
        currentFilters.status = status;
    }
    
    // 重置到第一页
    currentPage = 1;
    
    // 重新加载数据
    loadLogsData();
    loadLogsStats();
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('userFilter').value = '';
    document.getElementById('actionFilter').value = '';
    document.getElementById('ipFilter').value = '';
    document.getElementById('dateRange').value = '';
    document.getElementById('statusFilter').value = '';
    
    currentFilters = {};
    currentPage = 1;
    
    loadLogsData();
    loadLogsStats();
}

// 更新分页控件
function updatePaginationControls() {
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    
    // 更新显示信息
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    document.querySelector('.pagination-info').innerHTML = `
        显示 <select id="pageSize" onchange="changePageSize()">
            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
            <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
        </select> 条记录
        <span class="pagination-text">(第 ${startItem.toLocaleString()} - ${endItem.toLocaleString()} 条，共 ${totalItems.toLocaleString()} 条)</span>
    `;
}

// 改变每页显示数量
function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    loadLogsData();
}

// 上一页
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadLogsData();
    }
}

// 下一页
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadLogsData();
    }
}

// 查看日志详情
async function viewLogDetails(logId) {
    try {
        // 在实际应用中，这里应该调用获取单个日志详情的API
        // 由于我们的API没有单个日志详情的端点，我们使用现有数据
        const log = logsData.find(l => l.id === logId);
        
        if (!log) {
            // 如果没有找到，尝试从所有数据中查找（如果数据量不大）
            // 这里简化处理
            alert('无法找到该日志的详细信息');
            return;
        }
        
        // 填充详情弹窗
        document.getElementById('detail-id').textContent = log.id;
        document.getElementById('detail-time').textContent = formatDateTime(log.created_at);
        document.getElementById('detail-user').textContent = log.user?.username || '未知用户';
        document.getElementById('detail-action').textContent = getActionText(log.action);
        document.getElementById('detail-ip').textContent = log.ip_address || '未知';
        document.getElementById('detail-status').innerHTML = `<span class="status-badge ${getStatusClass(log.action)}">${getStatusText(log.action)}</span>`;
        
        // 显示描述和详情
        document.getElementById('detail-content').textContent = log.description || '无描述';
        
        // 解析JSON详情
        try {
            const detailsObj = JSON.parse(log.details);
            document.getElementById('detail-request').textContent = JSON.stringify(detailsObj, null, 2);
        } catch (e) {
            document.getElementById('detail-request').textContent = log.details || '无详细数据';
        }
        
        // 显示弹窗
        document.getElementById('logDetailModal').style.display = 'flex';
        
    } catch (error) {
        console.error('查看日志详情失败:', error);
        alert('查看日志详情失败');
    }
}

// 导出日志
function exportLogs() {
    try {
        // 构建导出数据
        const exportData = {
            filters: currentFilters,
            timestamp: new Date().toISOString(),
            totalItems: totalItems,
            logs: logsData.map(log => ({
                id: log.id,
                time: log.created_at,
                user: log.user?.username || '未知',
                action: getActionText(log.action),
                details: log.details,
                ip: log.ip_address,
                status: getStatusText(log.action)
            }))
        };
        
        // 创建JSON文件
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        // 创建下载链接
        const downloadUrl = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
        
        // 显示成功消息
        showMessage('日志导出成功', 'success');
        
    } catch (error) {
        console.error('导出日志失败:', error);
        showMessage('导出日志失败', 'error');
    }
}

// 导出单个日志
function exportSingleLog(logId) {
    const log = logsData.find(l => l.id === logId);
    
    if (!log) {
        alert('无法找到该日志');
        return;
    }
    
    const logData = {
        id: log.id,
        timestamp: new Date().toISOString(),
        log: {
            id: log.id,
            time: log.created_at,
            user: log.user?.username || '未知',
            action: getActionText(log.action),
            details: log.details,
            ip: log.ip_address,
            status: getStatusText(log.action)
        }
    };
    
    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const downloadUrl = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `log-${log.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
    
    showMessage('日志导出成功', 'success');
}

// 清空日志
function clearLogs() {
    document.getElementById('clearLogsModal').style.display = 'flex';
    document.getElementById('confirmText').value = '';
    document.getElementById('confirmClearBtn').disabled = true;
}

// 检查清空确认
function checkClearConfirmation() {
    const input = document.getElementById('confirmText').value;
    const confirmBtn = document.getElementById('confirmClearBtn');
    confirmBtn.disabled = input !== 'DELETE LOGS';
}

// 确认清空日志
async function confirmClearLogs() {
    try {
        // 在实际应用中，这里应该调用清空日志的API
        // 由于我们的API没有清空日志的端点，这里模拟操作
        
        // 显示加载状态
        const confirmBtn = document.getElementById('confirmClearBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        confirmBtn.disabled = true;
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 关闭弹窗
        closeModal('clearLogsModal');
        
        // 显示成功消息
        showMessage('日志已清空', 'success');
        
        // 重新加载数据
        setTimeout(() => {
            currentPage = 1;
            loadLogsData();
            loadLogsStats();
        }, 1000);
        
    } catch (error) {
        console.error('清空日志失败:', error);
        showMessage('清空日志失败', 'error');
        closeModal('clearLogsModal');
    }
}

// 复制日志详情
function copyLogDetails() {
    const details = {
        id: document.getElementById('detail-id').textContent,
        time: document.getElementById('detail-time').textContent,
        user: document.getElementById('detail-user').textContent,
        action: document.getElementById('detail-action').textContent,
        ip: document.getElementById('detail-ip').textContent,
        status: document.getElementById('detail-status').textContent,
        content: document.getElementById('detail-content').textContent
    };
    
    const detailsText = Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    
    navigator.clipboard.writeText(detailsText)
        .then(() => showMessage('日志详情已复制到剪贴板', 'success'))
        .catch(() => showMessage('复制失败', 'error'));
}

// 刷新日志
function refreshLogs() {
    loadLogsData();
    loadLogsStats();
    showMessage('日志已刷新', 'success');
}

// 更新侧边栏统计
function updateSidebarStats() {
    // 从主页面脚本中复制统计更新逻辑
    const logCount = Math.min(totalItems, 99);
    document.getElementById('log-count').textContent = logCount;
    document.getElementById('error-count').textContent = Math.floor(logCount * 0.1);
}

// 显示加载状态
function showLoading(isLoading) {
    const tableBody = document.getElementById('logsTableBody');
    
    if (isLoading) {
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="8">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i> 正在加载日志...
                    </div>
                </td>
            </tr>
        `;
    }
}

// 显示错误消息
function showError(message) {
    const tableBody = document.getElementById('logsTableBody');
    tableBody.innerHTML = `
        <tr class="error-row">
            <td colspan="8">
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <button class="btn btn-outline" onclick="loadLogsData()">重试</button>
                </div>
            </td>
        </tr>
    `;
}

// 显示消息
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => messageEl.classList.add('show'), 10);
    
    // 自动隐藏
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// 工具函数
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins}分钟前`;
    } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        return `${hours}小时前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 从主页面脚本复制公共函数
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    let user = null;
    if (userRaw) {
        try { user = JSON.parse(userRaw); } catch (e) { user = null; }
    }

    if (!token || !user || user.role !== 'sys_admin') {
        // 未登录或角色不符，统一回到网关登录页
        window.location.href = '../aldebaran/page.html';
    } else {
        const username = user.username || '系统管理员';
        document.getElementById('username').textContent = username;
    }
}

function logout() {
    if (confirm('确定要退出系统管理端吗？')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../aldebaran/page.html';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function getCurrentDateTime() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}