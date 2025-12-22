// 简单的页面行为与与 app.js 的联动（仅控制 tab 切换与触发加载函数）
document.addEventListener('DOMContentLoaded', ()=>{
  // tab 切换
  document.querySelectorAll('.nav-menu li, .quick-btn').forEach(el=>{
    el.addEventListener('click',(e)=>{
      const tab = el.dataset.tab || el.dataset.type
      if(!tab) return
      switchTab(tab)
    })
  })

  // top 的课程选择变更
  const sel = document.getElementById('course-select')
  sel.addEventListener('change', async ()=>{
    const id = sel.value
    if(!id) return
    // 调用 app.js 中的加载函数（若后端实现了这些接口）
    if(typeof loadGradeItems === 'function') loadGradeItems(id)
    if(typeof loadAssignments === 'function') loadAssignments(id)
    if(typeof loadEnrollmentGrades === 'function') loadEnrollmentGrades(id)
  })

  // 初始化：加载授课列表到仪表盘与课程选择
  if(typeof loadTeachingAssignments === 'function'){
    loadTeachingAssignments().then(populateCourseSelect).catch(()=>{})
  }

  // 登出
  const logout = document.getElementById('btn-logout')
  if(logout) logout.addEventListener('click', ()=>{ if(typeof clearToken==='function') clearToken(); location.reload() })

  // 快速按钮（例如上传、布置作业）
  document.getElementById('add-assignment-btn')?.addEventListener('click',()=>switchTab('assignments'))
  document.getElementById('upload-material-btn')?.addEventListener('click',()=>switchTab('materials'))
  document.getElementById('set-grade-structure-btn')?.addEventListener('click',()=>switchTab('grades'))

  // 添加成绩项按钮（显示一个快速输入模态）
  document.getElementById('add-grade-item-btn')?.addEventListener('click', async ()=>{
    // const courseId = document.getElementById('course-select').value
    const courseId = 123 // TODO: 测试用，后续改为从下拉获取
    console.log('添加成绩项，课程ID=', courseId)
    const name = prompt('成绩项名称（例如：期末考试）')
    if(!name) return
    const weight = parseFloat(prompt('权重（0.00 - 1.00，例如 0.3）')||'')
    if(isNaN(weight)||weight<0||weight>1){ alert('权重不合法'); return }
    try{ await apiFetch(`/courses/${courseId}/grade-items`,{method:'POST', body:{item_name:name, weight, description:''}}); alert('已添加'); if(typeof loadGradeItems==='function') loadGradeItems(courseId)}catch(e){ console.error(e); alert('添加失败') }
  })
})

function switchTab(tab){
  document.querySelectorAll('.nav-menu li').forEach(it=>it.classList.toggle('active', it.dataset.tab===tab))
  document.querySelectorAll('.content-section').forEach(sec=>sec.classList.toggle('active', sec.id===tab))
  document.getElementById('current-tab').textContent = ({dashboard:'仪表板',courses:'课程管理',assignments:'作业管理',grades:'成绩管理',materials:'课件管理'}[tab]||'')
}

function populateCourseSelect(){
  // 从 /me/teaching-assignments 取得授课列表，填充下拉
  apiFetch('/me/teaching-assignments').then(list=>{
    const sel = document.getElementById('course-select')
    sel.innerHTML = '<option value="">选择课程...</option>'
    list.forEach(item=>{
      const opt = document.createElement('option'); opt.value = item.course.id; opt.textContent = `${item.course.course_code} - ${item.course.course_name} (${item.semester})`; sel.appendChild(opt)
    })
    // 更新统计数
    document.getElementById('course-count').textContent = list.length
  }).catch(err=>{ console.warn('无法加载授课列表', err) })
}