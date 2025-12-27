// 统一 API helper
const API_BASE = 'http://127.0.0.1:8000/api/v1'

function getToken(){return localStorage.getItem('token')}
function setToken(t){localStorage.setItem('token',t)}
function clearToken(){
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

async function apiFetch(path, options={}){
  options.headers = options.headers || {}
  const token = getToken()
  if(token) options.headers['Authorization'] = `Bearer ${token}`
  if(options.body && !(options.body instanceof FormData)){
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }
  const res = await fetch(API_BASE + path, options)
  const txt = await res.text()
  let data = null
  try{ data = txt ? JSON.parse(txt) : null }catch(e){ data = txt }
  if(!res.ok) throw {status: res.status, data}
  return data
}

// 登录逻辑
document.addEventListener('DOMContentLoaded',()=>{
  // 没有登录凭证时统一跳转到网关登录页
  if(!getToken()){
    window.location.href = '../aldebaran/page.html'
    return
  }
  const loginBtn = document.getElementById('btn-login')
  const logoutBtn = document.getElementById('btn-logout')
  const modal = document.getElementById('login-modal')
  const form = document.getElementById('login-form')
  if(loginBtn) loginBtn.onclick = ()=> modal.classList.remove('hidden')
  if(document.getElementById('login-cancel')) document.getElementById('login-cancel').onclick = ()=> modal.classList.add('hidden')
  if(logoutBtn) logoutBtn.onclick = ()=>{
    clearToken();
    // 退出统一回到网关
    window.location.href = '../aldebaran/page.html'
  }
  if(form) form.onsubmit = async (e)=>{
    e.preventDefault();
    const f = new FormData(form)
    try{
      const payload = {username: f.get('username'), password: f.get('password')}
      const j = await apiFetch('/auth/login',{method:'POST', body: payload})
      if(j && j.token){
        setToken(j.token)
        try{ localStorage.setItem('user', JSON.stringify(j.user)) }catch(e){ console.warn('无法写入 user:', e) }
      }
      modal.classList.add('hidden')
      document.getElementById('btn-login').style.display='none'
      document.getElementById('btn-logout').style.display='inline-block'
      showMessage('登录成功',false)
      if(location.pathname.endsWith('/webhuangjunhao/index.html')) loadTeachingAssignments()
    }catch(err){ showMessage('登录失败：'+ (err?.data?.error?.message || err?.data?.message || err), true) }
  }

  // 页面特定初始化
  if(location.pathname.endsWith('/webhuangjunhao/index.html') || location.pathname.endsWith('/webhuangjunhao/')){
    if(getToken()){ document.getElementById('btn-login').style.display='none'; document.getElementById('btn-logout').style.display='inline-block' }
    loadTeachingAssignments()
  }
  if(location.pathname.endsWith('/webhuangjunhao/course.html')) initCoursePage()
  if(location.pathname.endsWith('/webhuangjunhao/assignments.html')) initAssignmentsPage()
  if(location.pathname.endsWith('/webhuangjunhao/grades.html')) initGradesPage()
})

function showMessage(msg,isError=false){
  const el = document.getElementById('message')
  if(!el) return
  el.textContent = msg
  el.style.borderLeftColor = isError ? '#dc3545' : '#0d6efd'
  el.classList.remove('hidden')
  setTimeout(()=> el.classList.add('hidden'),5000)
}

// ========== 仪表盘 / 我的授课 ==========
async function loadTeachingAssignments(){
  const tbody = document.querySelector('#assignments-table tbody')
  if(!tbody) return
  tbody.innerHTML = '<tr><td colspan="4">加载中...</td></tr>'
  try{
    const data = await apiFetch('/me/teaching-assignments')
    tbody.innerHTML = ''
    data.forEach(item=>{
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${item.course.course_code}</td>
        <td>${item.course.course_name}</td>
        <td>${item.semester}</td>
        <td>
          <a class="link" href="course.html?course_id=${item.course.id}">查看课程</a>
          &nbsp;|&nbsp;
          <a class="link" href="assignments.html?course_id=${item.course.id}">作业管理</a>
          &nbsp;|&nbsp;
          <a class="link" href="grades.html?course_id=${item.course.id}">成绩管理</a>
        </td>
      `
      tbody.appendChild(tr)
    })
    if(data.length===0) tbody.innerHTML='<tr><td colspan="4">暂无授课任务</td></tr>'
  }catch(err){ tbody.innerHTML='<tr><td colspan="4">加载失败</td></tr>'; console.error(err); if(err.status===401) showMessage('请先登录',true) }
}

// ========== 课程详情页 ==========
function getQueryParam(k){ return new URLSearchParams(location.search).get(k) }
async function initCoursePage(){
  const courseId = getQueryParam('course_id')
  if(!courseId){ showMessage('缺少 course_id', true); return }
  await loadCourseDetails(courseId)
  document.getElementById('upload-material-form').onsubmit = async (e)=>{
    e.preventDefault()
    const f = new FormData(e.target)
    try{
      const fd = new FormData()
      fd.append('material_type', f.get('material_type'))
      fd.append('title', f.get('title'))
      fd.append('file', e.target.file.files[0])
      if(e.target.display_order) fd.append('display_order', e.target.display_order.value)
      const res = await fetch(API_BASE + `/courses/${courseId}/materials`,{method:'POST',body:fd, headers: getAuthHeaderForForm()})
      const j = await res.json()
      showMessage('上传成功')
      await loadCourseDetails(courseId)
    }catch(err){ console.error(err); showMessage('上传失败', true) }
  }

  document.getElementById('course-config-form').onsubmit = async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target)
    const payload = { description: fd.get('description'), allow_comments: fd.get('allow_comments')==='on', allow_notes: fd.get('allow_notes')==='on' }
    try{ const j = await apiFetch(`/courses/${courseId}/config`, {method:'PATCH', body:payload}); showMessage('配置已保存'); }catch(err){ console.error(err); showMessage('保存失败', true) }
  }
}

async function loadCourseDetails(courseId){
  try{
    const data = await apiFetch(`/courses/${courseId}`)
    document.getElementById('course-title').textContent = `${data.course_code} - ${data.course_name}`
    const info = document.getElementById('course-info')
    info.innerHTML = `<p><strong>学分：</strong>${data.credits}</p><p><strong>院系：</strong>${data.department || ''}</p><p>${data.description || ''}</p>`
    // materials - 后端没有单独列表接口，使用课程对象中的材料或调用课程材料列表（本后端示例返回上传创建时显示）
    // 这里使用公共端点 GET /api/v1/courses 省略，演示列出 via CourseMaterials 查询逻辑假设
    const materialsDiv = document.getElementById('materials-list')
    materialsDiv.innerHTML = '<p class="small-muted">如需查看或管理资料，请手动刷新或前端扩展 API 接口。</p>'
  }catch(err){ console.error(err); showMessage('载入课程失败', true) }
}

function getAuthHeaderForForm(){ const h={}; const t=getToken(); if(t) h['Authorization']=`Bearer ${t}`; return h }

// ========== 作业与提交 ==========
async function initAssignmentsPage(){
  const courseId = getQueryParam('course_id'); if(!courseId){ showMessage('缺少 course_id', true); return }
  document.getElementById('assignment-form').onsubmit = async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target)
    const payload = { title: fd.get('title'), type: fd.get('type'), deadline: fd.get('deadline') ? new Date(fd.get('deadline')).toISOString() : undefined, description: fd.get('description') }
    try{ const j = await apiFetch(`/courses/${courseId}/assignments`,{method:'POST', body: payload}); showMessage('作业已创建'); await loadAssignments(courseId) }catch(err){ console.error(err); showMessage('创建失败',true) }
  }
  await loadAssignments(courseId)
  // 绑定按作业 ID 查看提交的控件
  const loadBtn = document.getElementById('load-submissions')
  if(loadBtn){
    loadBtn.onclick = async ()=>{
      const aid = document.getElementById('submission-assignment-id').value
      if(!aid){ showMessage('请输入作业 ID', true); return }
      await loadSubmissions(aid)
    }
  }
}
async function loadAssignments(courseId){
  // 后端示例中没有 GET /courses/{id}/assignments 接口，这里伪装：查询所有 assignments 并过滤
  try{
    const res = await fetch(API_BASE + '/courses')
    const j = await res.json()
    // 这里直接请求后端 /assignments 在后端还未实现 GET 全表的接口，实际项目需补充
    // 简易演示：显示占位区域
    document.getElementById('assignments-list').innerHTML = '<p class="small-muted">后端 GET /assignments 未实现，本前端展示创建与查看提交的入口。</p>'
  }catch(err){ console.error(err) }
}

// 查看提交
async function loadSubmissions(assignmentId){
  try{
    const data = await apiFetch(`/assignments/${assignmentId}/submissions`)
    const container = document.getElementById('submissions-list')
    container.innerHTML = '<ul>'+ data.map(s=>`<li>学号：${s.student?.id || '未知'} - ${s.student?.full_name || ''} - ${s.submitted_at} - 分数：${s.score || '-'} - 状态：${s.status}</li>`).join('') + '</ul>'
  }catch(err){ console.error(err); showMessage('加载提交失败', true) }
}

// ========== 成绩项与录入 ==========
async function initGradesPage(){
  const courseId = getQueryParam('course_id'); if(!courseId){ showMessage('缺少 course_id', true); return }
  document.getElementById('grade-item-form').onsubmit = async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target); const payload = { item_name: fd.get('item_name'), weight: parseFloat(fd.get('weight')), description: fd.get('description') }
    try{ const j = await apiFetch(`/courses/${courseId}/grade-items`,{method:'POST', body: payload}); showMessage('成绩项已添加'); await loadGradeItems(courseId) }catch(err){ console.error(err); showMessage('添加失败: '+(err?.data?.error?.message||err), true) }
  }
  document.getElementById('batch-upload-form').onsubmit = async (e)=>{
    e.preventDefault(); const fd = new FormData(e.target); const file = e.target.file.files[0]; const itemId = fd.get('item_id')
    const form = new FormData(); form.append('file', file)
    try{ const res = await fetch(API_BASE + `/grade-items/${itemId}/grades/batch-upload`,{method:'POST', body: form, headers: getAuthHeaderForForm()}); const j = await res.json(); showMessage('批量导入完成'); }catch(err){ console.error(err); showMessage('导入失败', true) }
  }
  await loadGradeItems(courseId)
  await loadEnrollmentGrades(courseId)
}

async function loadGradeItems(courseId){
  const sel = document.querySelector('#batch-upload-form select[name="item_id"]')
  sel.innerHTML = ''
  try{
    // 尝试通过后端 GET 接口获取成绩组成项
    const items = await apiFetch(`/courses/${courseId}/grade-items`)
    if(Array.isArray(items) && items.length){
      document.getElementById('grade-items-list').innerHTML = '<ul>'+items.map(i=>`<li>${i.item_name} （权重：${i.weight}）</li>`).join('') + '</ul>'
      items.forEach(i=>{ const opt = document.createElement('option'); opt.value = i.id; opt.textContent = `${i.item_name} (${i.weight})`; sel.appendChild(opt) })
      return
    }
  }catch(err){ console.warn('GET /grade-items 可能未实现，使用占位显示') }
  // 回退占位
  sel.innerHTML = '<option value="1">示例成绩项(期中)</option>'
  document.getElementById('grade-items-list').innerHTML = '<p class="small-muted">如需展示，请后端补充 GET /courses/{id}/grade-items 接口</p>'
}

async function loadEnrollmentGrades(courseId){
  const container = document.getElementById('enrollment-grades')
  container.innerHTML = ''
  try{
    const enrolls = await apiFetch(`/enrollments?course_id=${courseId}`)
    if(Array.isArray(enrolls) && enrolls.length){
      // enrolls 应包含 student info 与 grades
      let html = '<table><thead><tr><th>学号</th><th>姓名</th><th>成绩项</th><th>分数</th><th>操作</th></tr></thead><tbody>'
      enrolls.forEach(en=>{
        const student = en.student || {}
        // 假设返回字段 en.grades 是数组
        const grades = en.grades || []
        if(grades.length===0){
          html += `<tr><td>${student.student_id_number||''}</td><td>${student.full_name||''}</td><td>-</td><td>-</td><td class="small-muted">尚无成绩</td></tr>`
        }else{
          grades.forEach(g=>{
            html += `<tr><td>${student.student_id_number||''}</td><td>${student.full_name||''}</td><td>${g.item_name||''}</td><td><input data-grade-id="${g.id}" type="number" value="${g.score||''}" step="0.1"></td><td><button onclick="saveGrade(this)">保存</button></td></tr>`
          })
        }
      })
      html += '</tbody></table>'
      container.innerHTML = html
      return
    }
  }catch(err){ console.warn('GET /enrollments?course_id= 可能未实现，使用占位显示') }
  // 占位
  container.innerHTML = '<p class="small-muted">后端未提供按课程查询选课和成绩的 GET 接口，前端展示占位数据。可补充 /enrollments?course_id= 接口以支持完整功能。</p>'
}

async function saveGrade(btn){
  const tr = btn.closest('tr')
  const input = tr.querySelector('input')
  const gradeId = input.dataset.gradeId
  const val = parseFloat(input.value)
  try{ const j = await apiFetch(`/grades/${gradeId}`, {method:'PUT', body: {score: val}}); showMessage('成绩已保存') }catch(err){ console.error(err); showMessage('保存失败', true) }
}

// 导出或其他实用函数可继续添加

// ========== 结束 ==========