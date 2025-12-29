// 动态加载首页内容
function loadHome() {
    fetch('htmls/home.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            bindHomeEntryEvents();
        });
}

// 绑定首页入口按钮事件
function bindHomeEntryEvents() {
    const loginBtn = document.getElementById('entry-login');
    const coursesBtn = document.getElementById('entry-courses');
    const devRegisterLink = document.getElementById('entry-dev-register');
    if (loginBtn) {
        loginBtn.onclick = function() {
            loadLoginPage();
        };
    }
    if (coursesBtn) {
        coursesBtn.onclick = loadClassInfo;
    }
    if (devRegisterLink) {
        devRegisterLink.onclick = function() {
            loadRegisterPage();
        };
    }
}
// 动态加载登录页面
function loadLoginPage() {
    fetch('htmls/login.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            loadScript('js/login.js', function() {
                if (window.initLoginPage) window.initLoginPage();
            });
        });
}

// 动态加载开发用注册页面
function loadRegisterPage() {
    fetch('htmls/register.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            loadScript('js/register.js', function() {
                if (window.initRegisterPage) window.initRegisterPage();
            });
        });
}

// 顶部导航按钮事件
document.addEventListener('DOMContentLoaded', function() {
    // 如果已经有登录凭证，按角色自动跳转到对应前端
    try {
        const token = localStorage.getItem('token');
        const userRaw = localStorage.getItem('user');
        if (token && userRaw) {
            let user = null;
            try { user = JSON.parse(userRaw); } catch (e) { user = null; }
            if (user && user.role === 'teacher') {
                // 教师登录：跳转到教师端前端（new.html 为主体页面）
                window.location.href = '../webhuangjunhao/new.html';
                return;
            } else if (user && user.role === 'student') {
                // 学生登录：跳转到学生端门户
                window.location.href = '../Student-Portal/index.html';
                return;
            } else if (user && user.role === 'edu_admin') {
                // 教学管理员：跳转到教学管理端
                window.location.href = '../admin_page/edu-admin.html';
                return;
            } else if (user && user.role === 'sys_admin') {
                // 系统管理员：跳转到系统管理端
                window.location.href = '../admin_page/index.html';
                return;
            }
        }
    } catch (e) {
        console.warn('检测登录状态失败:', e);
    }

    loadHome();
    var btnLogin = document.getElementById('btn-login');
    var btnCourses = document.getElementById('btn-courses');
    if (btnLogin) btnLogin.onclick = loadHome;
    if (btnCourses) btnCourses.onclick = loadClassInfo;
});

// 动态加载课程信息库页面
function loadClassInfo() {
    fetch('htmls/classInfo.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('main-content').innerHTML = html;
            // 动态加载 classInfo.js
            loadScript('js/classInfo.js', function() {
                if (window.initClassInfoPage) window.initClassInfoPage();
            });
        });
}

// 动态加载js脚本
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.body.appendChild(script);
}
