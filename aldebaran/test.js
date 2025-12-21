// test.js
// 前端JS：调用后端API，渲染课程列表，处理分页

const apiBase = 'http://127.0.0.1:8000/api/v1/courses'; // 后端API地址

function buildQuery(params) {
    const esc = encodeURIComponent;
    return Object.keys(params)
        .filter(k => params[k] !== '' && params[k] !== null && params[k] !== undefined)
        .map(k => esc(k) + '=' + esc(params[k]))
        .join('&');
}

function renderCourses(data) {
    if (!data || !Array.isArray(data.courses) || data.courses.length === 0) {
        return '<p>未查询到课程信息。</p>';
    }
    let html = '<table class="course-list"><thead><tr>' +
        '<th>课程编号</th><th>课程名称</th><th>学分</th><th>院系</th><th>授课教师</th>' +
        '</tr></thead><tbody>';
    for (const c of data.courses) {
        html += `<tr><td>${c.course_code}</td><td>${c.course_name}</td><td>${c.credits}</td><td>${c.department}</td><td>${c.teacher_name || ''}</td></tr>`;
    }
    html += '</tbody></table>';
    return html;
}

function renderPagination(page, totalPages) {
    if (totalPages <= 1) return '';
    let html = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += '</div>';
    return html;
}

document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    queryCourses(1); // 查询时重置到第1页
});

document.getElementById('result').addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' && e.target.dataset.page) {
        queryCourses(Number(e.target.dataset.page));
    }
});

function queryCourses(page) {
    const form = document.getElementById('searchForm');
    const formData = new FormData(form);
    const params = {
        course_code: formData.get('course_code') || '',
        course_name: formData.get('course_name') || '',
        department: formData.get('department') || '',
        credits: formData.get('credits') || '',
        sort_by: formData.get('sortBy') || 'course_code',
        order: formData.get('order') || 'asc',
        page_size: formData.get('pageSize') || 5,
        page: page || 1
    };
    const url = apiBase + '?' + buildQuery(params);
    document.getElementById('result').innerHTML = '<p>查询中...</p>';
    fetch(url)
        .then(resp => resp.json())
        .then(data => {
            let html = renderCourses(data);
            html += renderPagination(data.page, data.total_pages);
            document.getElementById('result').innerHTML = html;
        })
        .catch(err => {
            document.getElementById('result').innerHTML = '<p style="color:red">查询失败：' + err + '</p>';
        });
}

// 页面加载时自动查询第一页
window.onload = function() {
    queryCourses(1);
};
