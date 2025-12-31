// 教师端主逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 加载首页数据
    await loadDashboard();
});

async function loadDashboard() {
    // 加载课程统计
    const assignments = await getTeachingAssignments();
    if (assignments && assignments.length > 0) {
        const courseCountEl = document.getElementById('courseCount');
        if (courseCountEl) courseCountEl.textContent = assignments.length;
        
        // 显示课程列表
        displayMyCourses(assignments.slice(0, 5));
        
        // 加载今日日程（使用真实课程数据）
        displayTodaySchedule(assignments);
        
        // 加载待批改作业数量
        await loadPendingStats(assignments);
    }
    
    // 加载最近动态
    await displayRecentActivity();
}

function displayMyCourses(courses) {
    const container = document.getElementById('myCoursesList');
    if (!container) return;
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="empty-msg">暂无授课课程</div>';
        return;
    }
    
    container.innerHTML = courses.map(item => `
        <div class="course-item" onclick="window.location.href='courses.html?id=${item.course_id}'">
            <div class="course-icon">
                <i class="fas fa-book"></i>
            </div>
            <div class="course-details">
                <h4>${item.course ? item.course.course_name : '课程'}</h4>
                <p class="course-meta">
                    <span><i class="fas fa-calendar"></i> ${item.semester}</span>
                    <span><i class="fas fa-code"></i> ${item.course ? item.course.course_code : '-'}</span>
                </p>
            </div>
            <div class="course-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `).join('');
}

function displayTodaySchedule(assignments) {
    const container = document.getElementById('todaySchedule');
    if (!container) return;
    
    if (!assignments || assignments.length === 0) {
        container.innerHTML = '<div class="empty-msg"><i class="fas fa-inbox"></i><p>今日暂无课程安排</p></div>';
        return;
    }
    
    // 取当天的课程（模拟，实际应该从课程表中获取）
    const todayCourses = assignments.slice(0, 3);
    
    container.innerHTML = todayCourses.map((item, index) => {
        const times = ['08:00-09:40', '10:00-11:40', '14:00-15:40'];
        const locations = ['教A101', '教B203', '教C305'];
        
        return `
            <div class="schedule-item">
                <div class="schedule-time">
                    <i class="fas fa-clock"></i> ${times[index]}
                </div>
                <div class="schedule-details">
                    <h4>${item.course.course_name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${locations[index]}</p>
                    <span class="schedule-badge">${item.semester}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function loadPendingStats(assignments) {
    try {
        let totalPending = 0;
        
        // 遍历所有课程，统计待批改作业
        for (const assignment of assignments) {
            try {
                const courseAssignments = await getAssignments(assignment.course_id);
                if (courseAssignments && Array.isArray(courseAssignments)) {
                    for (const assgn of courseAssignments) {
                        const submissions = await getSubmissions(assgn.id);
                        if (submissions && Array.isArray(submissions)) {
                            // 统计未批改的提交
                            const pending = submissions.filter(s => !s.score && s.score !== 0).length;
                            totalPending += pending;
                        }
                    }
                }
            } catch (err) {
                // 忽略单个课程的错误
                console.log('加载课程作业失败:', err);
            }
        }
        
        // 更新显示
        const studentCountEl = document.getElementById('studentCount');
        if (studentCountEl) {
            studentCountEl.innerHTML = `<span style="color: #fbbc04;">${totalPending}</span>`;
            studentCountEl.nextElementSibling.textContent = '待批改';
        }
    } catch (error) {
        console.error('加载待批改统计失败:', error);
    }
}

async function displayRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    // 显示加载状态
    container.innerHTML = '<div class="loading-msg"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
    
    try {
        const assignments = await getTeachingAssignments();
        const activities = [];
        
        // 获取最近的作业提交
        for (const assignment of assignments.slice(0, 2)) {
            try {
                const courseAssignments = await getAssignments(assignment.course_id);
                if (courseAssignments && Array.isArray(courseAssignments)) {
                    for (const assgn of courseAssignments.slice(0, 2)) {
                        const submissions = await getSubmissions(assgn.id);
                        if (submissions && Array.isArray(submissions)) {
                            submissions.slice(0, 3).forEach(sub => {
                                activities.push({
                                    icon: 'fas fa-file-upload',
                                    text: `${sub.student?.username || '学生'} 提交了《${assgn.title}》`,
                                    time: formatTimeAgo(sub.submitted_at),
                                    type: 'success'
                                });
                            });
                        }
                    }
                }
            } catch (err) {
                console.log('加载活动失败:', err);
            }
            
            if (activities.length >= 5) break;
        }
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="empty-msg"><i class="fas fa-inbox"></i><p>暂无最近动态</p></div>';
            return;
        }
        
        container.innerHTML = activities.slice(0, 5).map(item => `
            <div class="activity-item activity-${item.type}">
                <div class="activity-icon">
                    <i class="${item.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${item.text}</p>
                    <span class="activity-time">${item.time}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载最近动态失败:', error);
        container.innerHTML = '<div class="error-msg"><i class="fas fa-exclamation-triangle"></i><p>加载失败</p></div>';
    }
}

// 格式化时间为"XX前"
function formatTimeAgo(dateString) {
    if (!dateString) return '刚刚';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // 秒
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return date.toLocaleDateString();
}

// 添加课程项、日程项和活动项的样式
const style = document.createElement('style');
style.textContent = `
.course-item, .schedule-item, .activity-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    background: rgba(212, 175, 55, 0.05);
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.course-item:hover, .schedule-item:hover, .activity-item:hover {
    background: rgba(212, 175, 55, 0.1);
    transform: translateX(4px);
}

.course-icon, .activity-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 18px;
    flex-shrink: 0;
}

.course-details, .schedule-details, .activity-content {
    flex: 1;
}

.course-details h4, .schedule-details h4, .activity-content p {
    margin: 0 0 6px 0;
    font-size: 15px;
    color: var(--text);
}

.course-meta, .schedule-details p, .activity-time {
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    gap: 12px;
}

.course-arrow {
    color: var(--accent);
    opacity: 0.6;
    transition: all 0.3s;
}

.course-item:hover .course-arrow {
    opacity: 1;
    transform: translateX(4px);
}

.schedule-time {
    font-weight: 600;
    color: var(--accent);
    font-size: 13px;
}

.activity-success .activity-icon { background: linear-gradient(135deg, #34a853 0%, #2d8e47 100%); }
.activity-info .activity-icon { background: linear-gradient(135deg, #4285f4 0%, #3367d6 100%); }
.activity-warning .activity-icon { background: linear-gradient(135deg, #fbbc04 0%, #f9ab00 100%); }

.empty-msg {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
    font-size: 14px;
}
`;
document.head.appendChild(style);
