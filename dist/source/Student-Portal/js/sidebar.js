// 侧边栏组件 - 所有学生端页面共用
function renderSidebar(activePage) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.username || '学生';
    const userId = user.id || '-';
    
    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <i class="fas fa-graduation-cap"></i>
                    <h2>学生工作台</h2>
                </div>
            </div>
            <div class="user-card">
                <div class="avatar-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="user-meta">
                    <div class="user-name">${userName}</div>
                    <div class="user-id">ID ${userId}</div>
                </div>
            </div>
            <ul class="nav-menu">
                <li class="${activePage === 'home' ? 'active' : ''}">
                    <a href="index.html"><i class="fas fa-home"></i><span>首页</span></a>
                </li>
                <li class="${activePage === 'browse' ? 'active' : ''}">
                    <a href="course-browse.html"><i class="fas fa-book"></i><span>浏览课程</span></a>
                </li>
                <li class="${activePage === 'my-courses' ? 'active' : ''}">
                    <a href="my-courses.html"><i class="fas fa-list-check"></i><span>我的课程</span></a>
                </li>
                <li class="${activePage === 'grades' ? 'active' : ''}">
                    <a href="grades.html"><i class="fas fa-chart-line"></i><span>成绩查询</span></a>
                </li>
            </ul>
            <div class="sidebar-footer">
                <button class="btn-ghost" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> 退出登录
                </button>
            </div>
        </aside>
    `;
}

// 自动渲染并插入侧边栏
function initSidebar(activePage) {
    const appShell = document.querySelector('.app-shell');
    if (appShell && !appShell.querySelector('.sidebar')) {
        appShell.insertAdjacentHTML('afterbegin', renderSidebar(activePage));
    }
}
