// 课程详情页逻辑（依赖 api.js 提供的 getCourse）
(function(){
  const params = new URLSearchParams(location.search); const id = params.get('id');
  const el = document.getElementById('course-detail');
  async function load(){
    el.innerHTML = '<div class="card">加载中...</div>';
    try{
      const c = await getCourse(id);
      el.innerHTML = (
        '<div class="badge">' + c.course_code + '</div>' +
        '<h2 style="margin:8px 0 6px">' + c.course_name + '</h2>' +
        '<div style="color:#6b7280; margin-bottom:12px">' + (c.department || '未设置院系') + ' · ' + c.credits + ' 学分</div>' +
        '<p>' + (c.description || '暂无简介') + '</p>' +
        '<h3>授课教师</h3>' +
        '<div style="display:flex; gap:8px; flex-wrap:wrap">' +
          ((Array.isArray(c.teachers) && c.teachers.length>0) ? c.teachers.map(function(t){
            return '<span class="badge">' + t.full_name + (t.title?('（'+t.title+'）'):'') + '</span>'
          }).join('') : '尚未关联教师') +
        '</div>'
      );
    }catch(err){ el.innerHTML = '<div class="card"><div class="notice">加载失败：' + ((err && err.message) || '服务器错误') + '</div></div>'; }
  }
  load();
})();
