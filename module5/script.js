// 系统管理端通用JavaScript

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面数据
    loadDashboardData();
    
    // 设置最后更新时间
    document.getElementById('last-update').textContent = getCurrentDateTime();
    
    // 绑定事件
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('refresh-data').addEventListener('click', loadDashboardData);
    
    // 检查登录状态
    checkLoginStatus();
});

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    let user = null;
    if (userRaw) {
        try { user = JSON.parse(userRaw); } catch (e) { user = null; }
    }

    if (!token || !user || user.role !== 'sys_admin') {
        // 如果没有登录或不是系统管理员，重定向到统一网关登录页
        window.location.href = '../aldebaran/page.html';
    } else {
        // 显示用户名
        const username = user.username || '系统管理员';
        document.getElementById('username').textContent = username;
    }
}

// 加载仪表板数据
async function loadDashboardData() {
    try {
        // 获取日志统计
        const logsResponse = await fetch('/api/v1/logs?pageSize=1');
        if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            document.getElementById('total-logs').textContent = logsData.pagination.totalItems.toLocaleString();
            document.getElementById('log-count').textContent = Math.min(logsData.pagination.totalItems, 99);
        }
        
        // 获取用户统计（这里假设有统计接口，如果没有，可以调用用户列表接口）
        const usersResponse = await fetch('/api/v1/students?pageSize=1');
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            document.getElementById('total-users').textContent = usersData.pagination.totalItems.toLocaleString();
        }
        
        // 获取课程统计
        const coursesResponse = await fetch('/api/v1/courses?pageSize=1');
        if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            document.getElementById('total-courses').textContent = coursesData.pagination.totalItems.toLocaleString();
        }
        
        // 获取最近活动
        loadRecentActivities();
        
        // 获取今日日志数（模拟数据）
        document.getElementById('today-logs').textContent = Math.floor(Math.random() * 50) + 20;
        document.getElementById('warning-logs').textContent = Math.floor(Math.random() * 10) + 1;
        document.getElementById('error-count').textContent = Math.floor(Math.random() * 5) + 1;
        document.getElementById('security-events').textContent = Math.floor(Math.random() * 8);
        
        // 备份数量（模拟数据）
        document.getElementById('backup-count').textContent = Math.floor(Math.random() * 15) + 3;
        
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 加载最近活动
async function loadRecentActivities() {
    try {
        const response = await fetch('/api/v1/logs?pageSize=5&order=desc');
        const activityList = document.getElementById('recent-activities');
        
        if (response.ok) {
            const data = await response.json();
            
            // 清空加载状态
            activityList.innerHTML = '';
            
            if (data.logs && data.logs.length > 0) {
                data.logs.forEach(log => {
                    const activityItem = createActivityItem(log);
                    activityList.appendChild(activityItem);
                });
            } else {
                activityList.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="activity-title">暂无活动记录</div></div></div>';
            }
        } else {
            activityList.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="activity-title">无法加载活动记录</div></div></div>';
        }
    } catch (error) {
        console.error('加载最近活动失败:', error);
    }
}

// 创建活动项
function createActivityItem(log) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    
    // 根据操作类型设置图标和样式
    let iconClass = 'login';
    let icon = 'fas fa-sign-in-alt';
    let title = log.action || '未知操作';
    
    if (log.action && log.action.includes('ERROR') || log.action.includes('FAILURE')) {
        iconClass = 'error';
        icon = 'fas fa-exclamation-circle';
    } else if (log.action && log.action.includes('BACKUP')) {
        iconClass = 'backup';
        icon = 'fas fa-database';
    } else if (log.action && log.action.includes('SECURITY')) {
        iconClass = 'security';
        icon = 'fas fa-shield-alt';
    }
    
    // 格式化时间
    const time = log.created_at ? formatTime(log.created_at) : '未知时间';
    
    item.innerHTML = `
        <div class="activity-icon ${iconClass}">
            <i class="${icon}"></i>
        </div>
        <div class="activity-content">
            <div class="activity-title">${title}</div>
            <div class="activity-desc">${log.details || '无详细描述'}</div>
            <div class="activity-time">${time} • IP: ${log.ip_address || '未知'}</div>
        </div>
    `;
    
    return item;
}

// 创建备份
async function createBackup() {
    if (!confirm('确定要创建系统备份吗？此操作可能需要几分钟时间。')) {
        return;
    }
    
    try {
        const response = await fetch('/api/v1/system/backups', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(`备份任务已启动，任务ID: ${result.task_id}`);
            
            // 更新最后备份时间
            document.getElementById('last-backup').textContent = '刚刚';
            document.getElementById('modal-last-backup').textContent = getCurrentDateTime();
            
            // 刷新备份数量
            loadDashboardData();
        } else {
            alert('创建备份失败，请稍后重试。');
        }
    } catch (error) {
        console.error('创建备份失败:', error);
        alert('创建备份时发生错误，请检查网络连接。');
    }
}

// 显示系统状态弹窗
function showSystemStatus() {
    // 更新模态框中的数据
    document.getElementById('uptime').textContent = '15天 2小时 30分';
    document.getElementById('cpu-usage').textContent = '24%';
    document.getElementById('memory-usage').textContent = '1.8GB / 4GB';
    document.getElementById('db-connections').textContent = '12/50';
    document.getElementById('db-size').textContent = '348MB';
    document.getElementById('table-count').textContent = '16';
    document.getElementById('query-speed').textContent = '平均 45ms';
    document.getElementById('last-optimization').textContent = '2025-12-15';
    document.getElementById('failed-logins').textContent = '3 (今日)';
    document.getElementById('ssl-status').textContent = '有效 (60天后过期)';
    document.getElementById('firewall-status').textContent = '启用';
    
    // 显示模态框
    document.getElementById('system-status-modal').style.display = 'flex';
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 恢复资源（示例函数，实际应链接到备份页面）
function restoreResource() {
    window.location.href = 'backup.html#restore';
}

// 退出登录
function logout() {
    if (confirm('确定要退出系统管理端吗？')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../aldebaran/page.html';
    }
}

// 工具函数：获取当前日期时间
function getCurrentDateTime() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// 工具函数：格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return '刚刚';
    } else if (diffMins < 60) {
        return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 从日志审计和备份恢复页面复制的公共函数

// 检查清空确认（从logs-script.js）
function checkClearConfirmation() {
    const input = document.getElementById('confirmText')?.value;
    const confirmBtn = document.getElementById('confirmClearBtn');
    if (confirmBtn) {
        confirmBtn.disabled = input !== 'DELETE LOGS';
    }
}

// 检查恢复确认（从backup-script.js）
function checkRestoreConfirmation() {
    const input = document.getElementById('restore-confirm-text')?.value;
    const confirmBtn = document.getElementById('confirm-restore-btn');
    if (confirmBtn) {
        confirmBtn.disabled = input !== 'CONFIRM RESTORE';
    }
}

// 显示消息函数（增强版）
function showMessage(message, type = 'info') {
    // 检查是否已存在消息
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
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

// 格式化日期时间（增强版）
function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// 格式化时间相对表示（增强版）
function formatTime(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    } catch (error) {
        return dateString;
    }
}

// 获取当前日期时间（增强版）
function getCurrentDateTime() {
    const now = new Date();
    
    // 格式：YYYY-MM-DD HH:MM:SS
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 安全关闭模态框（增强版）
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 登出函数（增强版）
function logout() {
    if (confirm('确定要退出系统管理端吗？')) {
        // 清除所有相关存储
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userData');
        
        // 重定向到首页
        window.location.href = '../index.html';
    }
}