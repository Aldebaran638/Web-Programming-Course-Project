// 检查登录状态（仅允许学生角色访问学生端）
function checkLogin() {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    // 没有任何登录凭证：统一回网关
    if (!token || !userRaw) {
        window.location.href = '../aldebaran/page.html';
        return null;
    }

    let user;
    try {
        user = JSON.parse(userRaw);
    } catch (e) {
        // 本地 user 格式损坏，当作未登录处理
        window.location.href = '../aldebaran/page.html';
        return null;
    }

    // 如果角色不是学生，则根据角色强制跳转到对应前端
    if (user.role === 'teacher') {
        window.location.href = '../webhuangjunhao/new.html';
        return null;
    } else if (user.role && user.role !== 'student') {
        // 其他角色暂时统一回网关，由网关按角色再分流
        window.location.href = '../aldebaran/page.html';
        return null;
    }

    return user;
}

// 登录函数
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }
    
    try {
        // 调用api.js中的login函数
        const result = await login(username, password);
        
        if (result && result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            window.location.href = 'index.html';
        }
    } catch (error) {
        showMessage('登录失败，请检查用户名和密码', 'error');
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 退出后跳转回统一登录网关
    window.location.href = '../aldebaran/page.html';
}

// 忘记密码
function forgotPassword() {
    showMessage('请联系管理员重置密码', 'info');
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    const user = checkLogin();
    if (user && document.getElementById('studentName')) {
        document.getElementById('studentName').textContent = "学生" + user.username;
        const idLabel = document.getElementById('studentIdLabel');
        if (idLabel) idLabel.textContent = `ID ${user.id ?? '-'}`;
        const greet = document.getElementById('greetingText');
        if (greet) greet.textContent = `${getGreeting()}, ${user.username}`;
    }
});

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return '早上好';
    if (hour >= 9 && hour < 12) return '上午好';
    if (hour >= 12 && hour < 18) return '下午好';
    return '晚上好';
}