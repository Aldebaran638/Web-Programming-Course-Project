// 备份恢复页面专用JavaScript

// 模拟备份数据
let backupHistory = [
    {
        id: 1,
        timestamp: '2025-12-20T02:00:00Z',
        type: 'full',
        size: '350MB',
        status: 'completed',
        note: '自动完整备份'
    },
    {
        id: 2,
        timestamp: '2025-12-19T14:30:00Z',
        type: 'incremental',
        size: '15MB',
        status: 'completed',
        note: '手动增量备份'
    },
    {
        id: 3,
        timestamp: '2025-12-18T02:00:00Z',
        type: 'full',
        size: '345MB',
        status: 'completed',
        note: '自动完整备份'
    },
    {
        id: 4,
        timestamp: '2025-12-17T10:15:00Z',
        type: 'incremental',
        size: '12MB',
        status: 'failed',
        note: '备份失败：存储空间不足'
    },
    {
        id: 5,
        timestamp: '2025-12-16T02:00:00Z',
        type: 'full',
        size: '340MB',
        status: 'completed',
        note: '自动完整备份'
    }
];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();
    
    // 设置最后更新时间
    document.getElementById('last-update').textContent = getCurrentDateTime();
    
    // 绑定事件
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('restore-confirm').addEventListener('change', toggleRestoreButton);
    document.getElementById('restore-confirm-text').addEventListener('input', checkRestoreConfirmation);
    
    // 初始化页面
    loadBackupHistory();
    updateStorageInfo();
    updateBackupTimer();
    setupTabSwitching();
    
    // 更新恢复选项
    toggleRestoreOptions();
    
    // 设置确认复选框监听
    document.getElementById('restore-confirm').addEventListener('change', function() {
        document.getElementById('restore-button').disabled = !this.checked;
    });
});

// 设置标签页切换
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有active类
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // 添加active类
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// 加载备份历史
function loadBackupHistory() {
    const tableBody = document.getElementById('backupHistoryBody');
    
    if (backupHistory.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-database"></i>
                        <p>暂无备份记录</p>
                        <button class="btn btn-primary" onclick="createBackup()">立即创建备份</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    let totalSize = 0;
    let completedCount = 0;
    let latestBackup = null;
    
    backupHistory.forEach(backup => {
        const date = new Date(backup.timestamp);
        const dateStr = date.toLocaleDateString('zh-CN');
        const timeStr = date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
        
        const statusClass = backup.status === 'completed' ? 'success' : 
                           backup.status === 'failed' ? 'failure' : 'pending';
        const statusText = backup.status === 'completed' ? '成功' : 
                          backup.status === 'failed' ? '失败' : '进行中';
        
        const typeText = backup.type === 'full' ? '完整备份' : '增量备份';
        
        // 计算总大小
        const sizeMB = parseInt(backup.size) || 0;
        totalSize += sizeMB;
        
        // 统计成功数
        if (backup.status === 'completed') {
            completedCount++;
        }
        
        // 记录最新备份
        if (!latestBackup || new Date(backup.timestamp) > new Date(latestBackup.timestamp)) {
            latestBackup = backup;
        }
        
        html += `
            <tr>
                <td>${backup.id}</td>
                <td>
                    <div class="timestamp-cell">
                        <div class="date">${dateStr}</div>
                        <div class="time">${timeStr}</div>
                    </div>
                </td>
                <td><span class="type-badge ${backup.type}">${typeText}</span></td>
                <td>${backup.size}</td>
                <td class="backup-note">${backup.note}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="restoreFromBackup(${backup.id})" title="从此备份恢复">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn-icon" onclick="downloadBackup(${backup.id})" title="下载备份">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteBackup(${backup.id})" title="删除备份">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // 更新统计信息
    document.getElementById('total-backups').textContent = backupHistory.length;
    document.getElementById('total-backup-size').textContent = `${totalSize} MB`;
    document.getElementById('latest-backup').textContent = latestBackup ? 
        new Date(latestBackup.timestamp).toLocaleDateString('zh-CN') : '无';
    document.getElementById('backup-success-rate').textContent = 
        backupHistory.length > 0 ? `${Math.round((completedCount / backupHistory.length) * 100)}%` : '0%';
    
    // 填充备份选择下拉框
    const backupSelect = document.getElementById('backup-select');
    let selectHtml = '<option value="">请选择备份文件</option>';
    
    backupHistory.filter(b => b.status === 'completed').forEach(backup => {
        const date = new Date(backup.timestamp);
        selectHtml += `<option value="${backup.id}">备份 #${backup.id} (${date.toLocaleDateString('zh-CN')} ${backup.type === 'full' ? '完整' : '增量'})</option>`;
    });
    
    backupSelect.innerHTML = selectHtml;
}

// 更新存储信息
function updateStorageInfo() {
    // 模拟存储使用情况
    const totalStorage = 3072; // 3GB in MB
    const usedStorage = 1250; // 1.2GB in MB
    const freeStorage = totalStorage - usedStorage;
    const usagePercentage = Math.round((usedStorage / totalStorage) * 100);
    
    document.getElementById('storage-progress-fill').style.width = `${usagePercentage}%`;
    document.getElementById('storage-used').textContent = `${(usedStorage / 1024).toFixed(1)} GB`;
    document.getElementById('storage-free').textContent = `${(freeStorage / 1024).toFixed(1)} GB`;
    document.getElementById('storage-usage').textContent = `${usagePercentage}%`;
}

// 更新备份计时器
function updateBackupTimer() {
    // 模拟下次备份时间（今天午夜）
    const now = new Date();
    const nextBackup = new Date(now);
    nextBackup.setHours(24, 0, 0, 0);
    
    const diffMs = nextBackup - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    document.getElementById('next-backup').textContent = 
        `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}`;
}

// 创建备份
function createBackup() {
    const type = confirm('创建完整备份将备份所有数据，耗时较长。\n\n点击"确定"创建完整备份，点击"取消"创建增量备份。') ? 'full' : 'incremental';
    
    if (type === 'full') {
        createFullBackup();
    } else {
        createIncrementalBackup();
    }
}

// 创建完整备份
function createFullBackup() {
    showBackupProgress('full');
}

// 创建增量备份
function createIncrementalBackup() {
    showBackupProgress('incremental');
}

// 显示备份进度
function showBackupProgress(type) {
    const container = document.getElementById('backup-progress-container');
    const progressFill = document.getElementById('backup-progress-fill');
    const statusText = document.getElementById('backup-status-text');
    const progressText = document.getElementById('backup-progress-text');
    
    container.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = type === 'full' ? '正在准备完整备份...' : '正在准备增量备份...';
    progressText.textContent = '0%';
    
    // 模拟备份过程
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
        
        if (progress < 30) {
            statusText.textContent = '正在备份用户数据...';
        } else if (progress < 60) {
            statusText.textContent = '正在备份课程数据...';
        } else if (progress < 90) {
            statusText.textContent = '正在备份成绩数据...';
        } else {
            statusText.textContent = '正在压缩和保存备份文件...';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            statusText.textContent = '备份完成！';
            
            // 添加新的备份记录
            const newBackup = {
                id: backupHistory.length + 1,
                timestamp: new Date().toISOString(),
                type: type,
                size: type === 'full' ? `${Math.floor(Math.random() * 50) + 320}MB` : `${Math.floor(Math.random() * 20) + 5}MB`,
                status: 'completed',
                note: type === 'full' ? '手动完整备份' : '手动增量备份'
            };
            
            backupHistory.unshift(newBackup);
            loadBackupHistory();
            updateStorageInfo();
            
            // 5秒后隐藏进度条
            setTimeout(() => {
                container.style.display = 'none';
                showMessage(`${type === 'full' ? '完整' : '增量'}备份创建成功！`, 'success');
            }, 5000);
        }
    }, 200);
}

// 切换恢复选项
function toggleRestoreOptions() {
    const restoreType = document.getElementById('restore-type').value;
    const backupSelectGroup = document.getElementById('backup-select-group');
    const resourceTypeGroup = document.getElementById('resource-type-group');
    const resourceIdGroup = document.getElementById('resource-id-group');
    
    // 重置所有选项
    backupSelectGroup.style.display = 'none';
    resourceTypeGroup.style.display = 'none';
    resourceIdGroup.style.display = 'none';
    
    // 显示相关选项
    switch(restoreType) {
        case 'backup':
            backupSelectGroup.style.display = 'block';
            break;
        case 'resource':
            resourceTypeGroup.style.display = 'block';
            resourceIdGroup.style.display = 'block';
            break;
        case 'point':
            // 时间点恢复（简化处理）
            backupSelectGroup.style.display = 'block';
            break;
    }
}

// 切换恢复按钮状态
function toggleRestoreButton() {
    const confirmCheckbox = document.getElementById('restore-confirm');
    const restoreButton = document.getElementById('restore-button');
    restoreButton.disabled = !confirmCheckbox.checked;
}

// 执行恢复
function executeRestore() {
    const restoreType = document.getElementById('restore-type').value;
    
    // 准备恢复详情
    let restoreTypeDetail = '';
    let restoreTargetDetail = '';
    let restoreTimeDetail = '';
    
    switch(restoreType) {
        case 'backup':
            const backupId = document.getElementById('backup-select').value;
            if (!backupId) {
                showMessage('请选择要恢复的备份', 'error');
                return;
            }
            
            const backup = backupHistory.find(b => b.id == backupId);
            restoreTypeDetail = '从备份恢复';
            restoreTargetDetail = backup ? `备份 #${backup.id} (${backup.type === 'full' ? '完整备份' : '增量备份'})` : '未知备份';
            restoreTimeDetail = '约2-5分钟';
            break;
            
        case 'resource':
            const resourceType = document.getElementById('resource-type').value;
            const resourceId = document.getElementById('resource-id').value;
            
            if (!resourceId) {
                showMessage('请输入资源ID', 'error');
                return;
            }
            
            restoreTypeDetail = '恢复单个资源';
            restoreTargetDetail = `${resourceType} #${resourceId}`;
            restoreTimeDetail = '约30秒';
            break;
            
        case 'point':
            restoreTypeDetail = '时间点恢复';
            restoreTargetDetail = '恢复到指定时间点';
            restoreTimeDetail = '约3-8分钟';
            break;
    }
    
    // 填充确认弹窗
    document.getElementById('restore-type-detail').textContent = restoreTypeDetail;
    document.getElementById('restore-target-detail').textContent = restoreTargetDetail;
    document.getElementById('restore-time-detail').textContent = restoreTimeDetail;
    
    // 显示确认弹窗
    document.getElementById('confirmRestoreModal').style.display = 'flex';
    document.getElementById('restore-confirm-text').value = '';
    document.getElementById('confirm-restore-btn').disabled = true;
}

// 检查恢复确认
function checkRestoreConfirmation() {
    const input = document.getElementById('restore-confirm-text').value;
    const confirmBtn = document.getElementById('confirm-restore-btn');
    confirmBtn.disabled = input !== 'CONFIRM RESTORE';
}

// 执行确认的恢复
function executeConfirmedRestore() {
    // 显示加载状态
    const confirmBtn = document.getElementById('confirm-restore-btn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 恢复中...';
    confirmBtn.disabled = true;
    
    // 模拟恢复过程
    setTimeout(() => {
        closeModal('confirmRestoreModal');
        showMessage('数据恢复成功！系统将在5秒后刷新...', 'success');
        
        // 重置恢复表单
        resetRestoreForm();
        
        // 模拟系统刷新
        setTimeout(() => {
            showMessage('系统已刷新', 'info');
        }, 5000);
        
        // 重置按钮状态
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }, 3000);
}

// 重置恢复表单
function resetRestoreForm() {
    document.getElementById('restore-type').value = 'backup';
    document.getElementById('backup-select').value = '';
    document.getElementById('resource-type').value = 'courses';
    document.getElementById('resource-id').value = '';
    document.getElementById('restore-confirm').checked = false;
    
    toggleRestoreOptions();
    toggleRestoreButton();
}

// 从备份恢复
function restoreFromBackup(backupId) {
    const backup = backupHistory.find(b => b.id === backupId);
    
    if (!backup) {
        showMessage('找不到指定的备份', 'error');
        return;
    }
    
    if (backup.status !== 'completed') {
        showMessage('该备份无法用于恢复（状态非完成）', 'error');
        return;
    }
    
    // 设置表单并执行恢复
    document.getElementById('restore-type').value = 'backup';
    document.getElementById('backup-select').value = backupId;
    document.getElementById('restore-confirm').checked = true;
    
    toggleRestoreOptions();
    toggleRestoreButton();
    
    // 直接执行恢复
    executeRestore();
}

// 下载备份
function downloadBackup(backupId) {
    const backup = backupHistory.find(b => b.id === backupId);
    
    if (!backup) {
        showMessage('找不到指定的备份', 'error');
        return;
    }
    
    // 模拟下载
    showMessage(`正在下载备份 #${backupId}...`, 'info');
    
    setTimeout(() => {
        // 创建模拟文件
        const content = `这是一个模拟的备份文件。\n备份ID: ${backupId}\n类型: ${backup.type}\n时间: ${backup.timestamp}\n大小: ${backup.size}\n备注: ${backup.note}`;
        const blob = new Blob([content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${backupId}-${new Date(backup.timestamp).toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showMessage(`备份 #${backupId} 下载成功`, 'success');
    }, 1500);
}

// 删除备份
function deleteBackup(backupId) {
    if (!confirm(`确定要删除备份 #${backupId} 吗？此操作不可撤销。`)) {
        return;
    }
    
    const index = backupHistory.findIndex(b => b.id === backupId);
    
    if (index === -1) {
        showMessage('找不到指定的备份', 'error');
        return;
    }
    
    backupHistory.splice(index, 1);
    loadBackupHistory();
    updateStorageInfo();
    
    showMessage(`备份 #${backupId} 已删除`, 'success');
}

// 显示备份设置
function showBackupSettings() {
    document.getElementById('backupSettingsModal').style.display = 'flex';
}

// 保存备份设置
function saveAllBackupSettings() {
    // 收集所有设置
    const settings = {
        enableAutoBackup: document.getElementById('enable-auto-backup').checked,
        backupSchedule: document.getElementById('backup-schedule').value,
        backupDay: document.getElementById('backup-day').value,
        backupHour: document.getElementById('backup-hour').value,
        maxBackupSize: document.getElementById('max-backup-size').value,
        retentionPolicy: document.getElementById('retention-policy').value,
        maxBackupCount: document.getElementById('max-backup-count').value,
        backupPath: document.getElementById('backup-path').value,
        notifySuccess: document.getElementById('notify-success').checked,
        notifyFailure: document.getElementById('notify-failure').checked,
        notifyLowSpace: document.getElementById('notify-low-space').checked,
        notificationEmail: document.getElementById('notification-email').value,
        compressBackup: document.getElementById('compress-backup').checked,
        encryptBackup: document.getElementById('encrypt-backup').checked,
        compressionLevel: document.getElementById('compression-level').value,
        backupThreads: document.getElementById('backup-threads').value
    };
    
    // 模拟保存设置
    console.log('保存备份设置:', settings);
    
    // 关闭弹窗
    closeModal('backupSettingsModal');
    
    // 显示成功消息
    showMessage('备份设置已保存', 'success');
}

// 更改备份路径
function changeBackupPath() {
    // 注意：在Web环境中无法直接访问文件系统
    // 这里只是模拟
    const newPath = prompt('请输入新的备份路径:', '/var/backups/grade-system');
    if (newPath) {
        document.getElementById('backup-path').value = newPath;
    }
}

// 清理旧备份
function cleanupOldBackups() {
    if (!confirm('确定要清理30天前的旧备份吗？此操作不可撤销。')) {
        return;
    }
    
    // 模拟清理过程
    showMessage('正在清理旧备份...', 'info');
    
    setTimeout(() => {
        // 模拟删除一些旧备份
        const initialCount = backupHistory.length;
        backupHistory = backupHistory.slice(0, 3); // 保留最近3个
        
        loadBackupHistory();
        updateStorageInfo();
        
        showMessage(`已清理 ${initialCount - backupHistory.length} 个旧备份`, 'success');
    }, 2000);
}

// 导出存储报告
function exportStorageReport() {
    // 生成报告数据
    const report = {
        generatedAt: new Date().toISOString(),
        totalBackups: backupHistory.length,
        totalSize: backupHistory.reduce((sum, b) => sum + (parseInt(b.size) || 0), 0),
        backupList: backupHistory,
        storageUsage: {
            total: 3072,
            used: 1250,
            free: 1822,
            percentage: 41
        }
    };
    
    // 创建JSON文件
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-storage-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    showMessage('存储报告导出成功', 'success');
}

// 保存备份设置（页面内）
function saveBackupSettings() {
    const settings = {
        autoBackup: document.getElementById('auto-backup').checked,
        frequency: document.getElementById('backup-frequency').value,
        time: document.getElementById('backup-time').value,
        retentionDays: document.getElementById('retention-days').value
    };
    
    console.log('保存备份设置:', settings);
    showMessage('自动备份设置已保存', 'success');
}

// 刷新备份列表
function refreshBackupList() {
    // 模拟刷新数据
    showMessage('正在刷新备份列表...', 'info');
    
    setTimeout(() => {
        loadBackupHistory();
        showMessage('备份列表已刷新', 'success');
    }, 1000);
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

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => messageEl.classList.add('show'), 10);
    
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}