// 教师端认证管理
function checkLogin() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        window.location.href = '../aldebaran/page.html';
        return null;
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'teacher') {
        alert('权限不足！');
        window.location.href = '../aldebaran/page.html';
        return null;
    }
    
    return user;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../aldebaran/page.html';
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return '早上好';
    if (hour >= 9 && hour < 12) return '上午好';
    if (hour >= 12 && hour < 18) return '下午好';
    return '晚上好';
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    const user = checkLogin();
    if (user) {
        const nameEl = document.getElementById('teacherName');
        const idEl = document.getElementById('teacherId');
        const greetEl = document.getElementById('greetingText');
        
        if (nameEl) nameEl.textContent = user.username || '教师';
        if (idEl) idEl.textContent = `ID ${user.id || '-'}`;
        if (greetEl) greetEl.textContent = `${getGreeting()}, ${user.username || '教师'}`;
    }
});
