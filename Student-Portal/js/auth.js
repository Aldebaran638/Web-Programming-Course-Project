// 检查登录状态
function checkLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // Student-Portal 下的所有业务页面都需要登录；
    // 如果本地没有凭证，则跳转到统一登录网关 aldebaran/page.html。
    if (!token || !user) {
        window.location.href = '../aldebaran/page.html';
        return null;
    }

    return JSON.parse(user);
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
    }
});