// 课程列表页逻辑（依赖 api.js 提供的 getCourses）
(function(){
  const state = { page:1, pageSize:9, sortBy:'course_code', order:'asc', course_code:'', course_name:'', department:'', credits:'' };
  const elList = document.getElementById('course-list');
  const elPageInfo = document.getElementById('page-info');
  const els = {
    code: document.getElementById('f-course-code'),
    name: document.getElementById('f-course-name'),
    dept: document.getElementById('f-department'),
    credits: document.getElementById('f-credits'),
    sort: document.getElementById('f-sort-by'),
    order: document.getElementById('f-order'),
  };
  document.getElementById('btn-reset').onclick = function(){ Object.assign(state,{ page:1, pageSize:9, sortBy:'course_code', order:'asc', course_code:'', course_name:'', department:'', credits:'' }); Object.values(els).forEach(function(e){ e.value='' }); load(); };
  document.getElementById('btn-search').onclick = function(){
    state.page = 1;
    state.course_code = els.code.value.trim();
    state.course_name = els.name.value.trim();
    state.department = els.dept.value.trim();
    state.credits = els.credits.value.trim();
    state.sortBy = els.sort.value; state.order = els.order.value; load();
  };
  document.getElementById('prev-page').onclick = function(){ if(state.page>1){ state.page--; load() } };
  document.getElementById('next-page').onclick = function(){ state.page++; load() };

  async function load(){
    const params = { page: state.page, pageSize: state.pageSize, sortBy: state.sortBy, order: state.order };
    if(state.course_code) params.course_code = state.course_code;
    if(state.course_name) params.course_name = state.course_name;
    if(state.department) params.department = state.department;
    if(state.credits) params.credits = state.credits;
    elList.innerHTML = '<div class="card">加载中...</div>';
    try {
      const data = await getCourses(params);
      const pagination = data.pagination || { currentPage: state.page, totalPages: 1, totalItems: 0 };
      const courses = data.courses || [];
      elList.innerHTML = courses.map(function(c){ return (
        '<div class="card">' +
          '<div class="badge">' + c.course_code + '</div>' +
          '<h3 style="margin:8px 0 6px">' + c.course_name + '</h3>' +
          '<div style="color:#6b7280; margin-bottom:8px">' + (c.department || '未设置院系') + ' · ' + c.credits + ' 学分</div>' +
          '<p style="min-height:40px">' + ((c.description||'').slice(0,120)) + (((c.description||'').length>120)?'...':'') + '</p>' +
          '<div style="display:flex; gap:8px; align-items:center; margin-top:8px">' +
            (Array.isArray(c.teachers)? c.teachers.map(function(t){ return '<span class="badge">教师：' + t.full_name + '</span>' }).join('') : '') +
            '<a class="btn" href="./course.html?id=' + c.id + '">查看详情</a>' +
          '</div>' +
        '</div>'
      ) }).join('');
      elPageInfo.textContent = '第 ' + pagination.currentPage + ' / ' + pagination.totalPages + ' 页（共 ' + pagination.totalItems + ' 条）';
    } catch(err){
      var msg = (err && err.message) || '服务器错误';
      elList.innerHTML = '<div class="card"><div class="notice">加载失败：' + msg + '</div></div>';
    }
  }
  load();
})();
