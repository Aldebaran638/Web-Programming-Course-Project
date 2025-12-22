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
    if (loginBtn) {
        loginBtn.onclick = function() {
            loadLoginPage();
        };
    }
    if (coursesBtn) {
        coursesBtn.onclick = loadClassInfo;
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

// 顶部导航按钮事件
document.addEventListener('DOMContentLoaded', function() {
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
