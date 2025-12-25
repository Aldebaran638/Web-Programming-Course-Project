/**
 * 教师工作台 - 完整功能模块
 * 集成课程管理、作业管理、成绩管理、课件管理等教师端功能
 * 与后端 RESTful API 对接
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1'
let currentCourseId = 101
let gradeItems = []
let currentCourseStudents = []

// ======================== 全局 API 辅助函数 ========================
function getToken(){return localStorage.getItem('token')}
function setToken(t){localStorage.setItem('token',t)}
function clearToken(){localStorage.removeItem('token')}

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

function showNotification(msg, type='info'){
  const notif = document.createElement('div')
  notif.className = `notification notification-${type}`
  notif.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i><span>${msg}</span>`
  document.body.appendChild(notif)
  setTimeout(()=>notif.classList.add('show'), 100)
  setTimeout(()=>{ notif.classList.remove('show'); setTimeout(()=>notif.remove(), 300) }, 3000)
}

// ======================== 初始化与登出 ========================
document.addEventListener('DOMContentLoaded', async ()=>{
  // Tab 切换逻辑
  document.querySelectorAll('.nav-menu li').forEach(item=>{
    item.addEventListener('click', ()=>{
      const tab = item.dataset.tab
      if(tab) switchTab(tab)
    })
  })

  // 快速操作按钮
  document.querySelectorAll('.quick-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tab = btn.dataset.tab
      if(tab) switchTab(tab)
    })
  })

  // 登出
  document.getElementById('btn-logout').addEventListener('click', ()=>{
    clearToken()
    location.reload()
  })

  // 课程选择变更
  document.getElementById('course-select').addEventListener('change', async (e)=>{
    currentCourseId = e.target.value
    if(currentCourseId){
      await loadCoursesData(currentCourseId)
      await loadAssignmentsData(currentCourseId)
      await loadGradeItemsData(currentCourseId)
      await loadCourseStudents(currentCourseId)
    }
  })

  // 初始化数据
  await initDashboard()
  await loadTeachingAssignmentsToSelect()
  
  // 初始化其他事件监听器
  initEventListeners()
})

function initEventListeners() {
  // 课程搜索
  document.getElementById('course-search').addEventListener('input', (e)=>{
    const query = e.target.value.toLowerCase()
    const rows = document.querySelectorAll('#courses-list tr')
    rows.forEach(row=>{
      const text = row.textContent.toLowerCase()
      row.style.display = text.includes(query) ? '' : 'none'
    })
  })

  // 作业类型筛选
  document.querySelectorAll('.assignment-tabs .tab-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'))
      e.target.classList.add('active')
      const type = e.target.dataset.type
      filterAssignments(type)
    })
  })

  // 添加课程按钮
  document.getElementById('add-course-btn')?.addEventListener('click', () => {
    showNotification('添加课程功能需要联系管理员分配', 'info')
  })

  // 设置成绩构成按钮
  document.getElementById('set-grade-structure-btn')?.addEventListener('click', () => {
    switchTab('grades')
  })
}

function switchTab(tabName){
  document.querySelectorAll('.content-section').forEach(sec=>sec.classList.remove('active'))
  document.querySelectorAll('.nav-menu li').forEach(li=>li.classList.remove('active'))
  document.getElementById(tabName).classList.add('active')
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
  document.getElementById('current-tab').textContent = ({
    dashboard:'仪表板',
    courses:'课程管理',
    assignments:'作业管理',
    grades:'成绩管理',
    materials:'课件管理'
  }[tabName]||'')
}

// ======================== 仪表板 ========================
async function initDashboard(){
  try{
    const assignments = await apiFetch('/me/teaching-assignments')
    console.log(assignments)
    const courseCount = assignments.length
    document.getElementById('course-count').textContent = courseCount
    
    // 统计学生总数（所有课程的学生数）
    let totalStudents = 0
    for(const ta of assignments){
      try {
        const enrollments = await apiFetch(`/courses/${ta.course.id}/enrollments`)
        console.log(enrollments)
        totalStudents += enrollments.length || 0
      } catch (err) {
        console.error(`获取课程 ${ta.course.id} 的学生数失败`, err)
      }
    }
    document.getElementById('student-count').textContent = totalStudents
    
    // 获取总作业数
    let totalAssignments = 0
    for(const ta of assignments){
      try {
        const assignments = await apiFetch(`/courses/${ta.course.id}/assignments`)
        totalAssignments += assignments.length || 0
      } catch (err) {
        console.error(`获取课程 ${ta.course.id} 的作业数失败`, err)
      }
    }
    document.getElementById('assignment-count').textContent = totalAssignments
    
    // 获取待批改作业数
    let pendingCount = 0
    for(const ta of assignments){
      try {
        const courseAssignments = await apiFetch(`/courses/${ta.course.id}/assignments`)
        for(const assignment of courseAssignments) {
          const submissions = await apiFetch(`/assignments/${assignment.id}/submissions`)
          pendingCount += submissions.filter(s => s.status === 'pending').length
        }
      } catch (err) {
        console.error(`获取待批改作业数失败`, err)
      }
    }
    document.getElementById('pending-count').textContent = pendingCount

    // 通知列表
    const notifList = document.getElementById('notification-list')
    if (pendingCount > 0) {
      notifList.innerHTML = `
        <li><i class="fas fa-exclamation-circle text-warning"></i><span>您有 ${pendingCount} 份作业待批改</span><small>刚刚</small></li>
        <li><i class="fas fa-info-circle text-info"></i><span>系统运行正常</span><small>今天</small></li>
      `
    } else {
      notifList.innerHTML = `
        <li><i class="fas fa-check-circle text-success"></i><span>所有作业已批改完成</span><small>刚刚</small></li>
        <li><i class="fas fa-info-circle text-info"></i><span>系统运行正常</span><small>今天</small></li>
      `
    }
  }catch(err){
    console.error('仪表板加载失败', err)
    showNotification('仪表板加载失败', 'error')
  }
}

async function loadTeachingAssignmentsToSelect(){
  try{
    const assignments = await apiFetch('/me/teaching-assignments')
    const sel = document.getElementById('course-select')
    sel.innerHTML = '<option value="">选择课程...</option>'
    assignments.forEach(ta=>{
      const opt = document.createElement('option')
      opt.value = ta.course.id
      opt.textContent = `${ta.course.course_code} - ${ta.course.course_name} (${ta.semester})`
      sel.appendChild(opt)
    })
  }catch(err){
    console.error('加载授课列表失败', err)
  }
}

// ======================== 课程管理 ========================
async function loadCoursesData(courseId){
  try{
    const course = await apiFetch(`/courses/${courseId}`)
    
    // 填充课程列表表格
    const tbody = document.getElementById('courses-list')
    tbody.innerHTML = `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.credits}</td>
        <td>${course.department || '-'}</td>
        <td>2025-2026-1</td>
        <td id="course-student-count">加载中...</td>
        <td><span class="status-badge status-active">教学中</span></td>
      </tr>
    `

    // 获取课程学生数
    try {
      const enrollments = await apiFetch(`/courses/${courseId}/enrollments`)
      document.getElementById('course-student-count').textContent = enrollments.length
    } catch (err) {
      document.getElementById('course-student-count').textContent = '0'
    }

    // 填充课程配置
    document.getElementById('course-description').value = course.description || ''
    document.getElementById('enable-comments').checked = course.config?.allow_comments !== false
    document.getElementById('enable-notes').checked = course.config?.allow_notes !== false

    // 保存配置按钮
    document.getElementById('save-config-btn').onclick = async ()=>{
      const payload = {
        description: document.getElementById('course-description').value,
        allow_comments: document.getElementById('enable-comments').checked,
        allow_notes: document.getElementById('enable-notes').checked
      }
      try{
        await apiFetch(`/courses/${courseId}/config`, {method:'PATCH', body:payload})
        showNotification('课程配置已保存', 'success')
      }catch(err){
        showNotification('保存失败', 'error')
      }
    }
  }catch(err){
    console.error('加载课程数据失败', err)
  }
}

// ======================== 作业管理 ========================
async function loadAssignmentsData(courseId){
  try{
    // 获取作业列表
    const assignments = await apiFetch(`/courses/${courseId}/assignments`)
    console.log(assignments);
    const container = document.getElementById('assignments-container')
    
    if(assignments.length === 0){
      container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><p>暂无作业/考试</p></div>'
      return
    }
    
    let html = ''
    for(const assignment of assignments){
      // 获取提交情况
      let submissionStats = { total: 0, graded: 0, pending: 0 }
      try {
        const submissions = await apiFetch(`/assignments/${assignment.id}/submissions`)
        submissionStats.total = submissions.length
        submissionStats.graded = submissions.filter(s => s.status === 'graded').length
        submissionStats.pending = submissions.filter(s => s.status === 'pending').length
      } catch (err) {
        console.error(`获取作业 ${assignment.id} 提交情况失败`, err)
      }
      
      const deadline = assignment.deadline ? new Date(assignment.deadline).toLocaleString() : '无'
      const typeText = assignment.type === 'exam' ? '考试' : '作业'
      
      html += `
        <div class="assignment-card" data-type="${assignment.type}">
          <div class="assignment-info">
            <h4>${assignment.title} <span class="assignment-badge assignment-${assignment.type}">${typeText}</span></h4>
            <p>${assignment.description || '无描述'}</p>
            <p class="deadline"><i class="far fa-clock"></i> 截止时间：${deadline}</p>
          </div>
          <div class="assignment-stats">
            <div class="stat"><span class="number">${submissionStats.total}</span><span class="label">提交</span></div>
            <div class="stat"><span class="number">${submissionStats.graded}</span><span class="label">已批改</span></div>
            <div class="stat"><span class="number">${submissionStats.pending}</span><span class="label">待批改</span></div>
          </div>
          <div class="assignment-actions">
            <button class="btn btn-sm btn-primary" onclick="viewAssignmentSubmissions(${assignment.id})">
              <i class="fas fa-eye"></i> 查看提交
            </button>
            <button class="btn btn-sm btn-outline" onclick="deleteAssignment(${assignment.id})">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </div>
      `
    }
    
    container.innerHTML = html
    
    // 添加作业按钮事件
    const addBtn = document.getElementById('add-assignment-btn')
    if(addBtn){
      addBtn.onclick = ()=>showAssignmentModal(courseId)
    }
    
  }catch(err){
    console.error('加载作业数据失败', err)
    const container = document.getElementById('assignments-container')
    container.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>加载失败，请重试</p></div>'
  }
}

function filterAssignments(type){
  const assignmentCards = document.querySelectorAll('.assignment-card')
  
  assignmentCards.forEach(card => {
    if(type === 'all' || card.dataset.type === type){
      card.style.display = 'flex'
    } else if(type === 'ungraded'){
      const pendingText = card.querySelector('.assignment-stats .stat:nth-child(3) .number').textContent
      card.style.display = parseInt(pendingText) > 0 ? 'flex' : 'none'
    } else {
      card.style.display = 'none'
    }
  })
}

function showAssignmentModal(courseId){
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3>布置新作业/考试</h3>
          <button type="button" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="temp-assignment-form">
            <div class="form-group">
              <label>标题</label>
              <input type="text" name="title" required>
            </div>
            <div class="form-group">
              <label>类型</label>
              <select name="type" required>
                <option value="assignment">作业</option>
                <option value="exam">考试</option>
              </select>
            </div>
            <div class="form-group">
              <label>截止时间</label>
              <input type="datetime-local" name="deadline">
            </div>
            <div class="form-group">
              <label>说明</label>
              <textarea name="description" rows="4"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="submitAssignment(${courseId})">创建</button>
          <button class="btn btn-outline" onclick="this.closest('.modal').remove()">取消</button>
        </div>
      </div>
    </div>
  `
  const modal = document.createElement('div')
  modal.innerHTML = html
  document.body.appendChild(modal.firstChild)
}

async function submitAssignment(courseId){
  const form = document.getElementById('temp-assignment-form')
  if(!form) return
  const fd = new FormData(form)
  const payload = {
    title: fd.get('title'),
    type: fd.get('type'),
    deadline: fd.get('deadline') ? new Date(fd.get('deadline')).toISOString() : null,
    description: fd.get('description')
  }
  try{
    await apiFetch(`/courses/${courseId}/assignments`, {method:'POST', body:payload})
    showNotification('作业已创建', 'success')
    document.querySelector('.modal').remove()
    await loadAssignmentsData(courseId)
  }catch(err){
    showNotification('创建失败: ' + (err.data?.detail || '未知错误'), 'error')
  }
}

async function viewAssignmentSubmissions(assignmentId){
  try{
    const submissions = await apiFetch(`/assignments/${assignmentId}/submissions`)
    let html = `
      <div class="modal active">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h3>作业提交情况</h3>
            <button type="button" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>学生</th>
                    <th>提交时间</th>
                    <th>状态</th>
                    <th>分数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
    `
    
    submissions.forEach(sub => {
      const submittedAt = sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '未提交'
      const statusText = sub.status === 'graded' ? '已批改' : '待批改'
      const statusClass = sub.status === 'graded' ? 'status-active' : 'status-pending'
      
      html += `
        <tr>
          <td>${sub.student.full_name}</td>
          <td>${submittedAt}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${sub.score || '-'}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="gradeSubmission(${sub.submission_id})">
              批改
            </button>
          </td>
        </tr>
      `
    })
    
    html += `
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="this.closest('.modal').remove()">关闭</button>
          </div>
        </div>
      </div>
    `
    
    const modal = document.createElement('div')
    modal.innerHTML = html
    document.body.appendChild(modal.firstChild)
    
  }catch(err){
    showNotification('加载提交记录失败', 'error')
  }
}

async function deleteAssignment(assignmentId){
  if(!confirm('确定要删除这个作业吗？此操作不可撤销。')) return
  try{
    await apiFetch(`/assignments/${assignmentId}`, {method:'DELETE'})
    showNotification('作业已删除', 'success')
    await loadAssignmentsData(currentCourseId)
  }catch(err){
    showNotification('删除失败', 'error')
  }
}

// ======================== 成绩管理 ========================
async function loadCourseStudents(courseId){
  try{
    const enrollments = await apiFetch(`/courses/${courseId}/enrollments`)
    currentCourseStudents = enrollments.map(e => ({
      enrollment_id: e.id,
      student_id: e.student.id,
      full_name: e.student.full_name,
      student_id_number: e.student.student_id_number
    }))
  }catch(err){
    console.error('加载学生列表失败', err)
    currentCourseStudents = []
  }
}

async function loadGradeItemsData(courseId){
  currentCourseId = courseId
  try{
    // 获取成绩项列表
    try{
      gradeItems = await apiFetch(`/courses/${courseId}/grade-items`)
    }catch(e){
      gradeItems = []
    }

    // 显示成绩项
    const container = document.getElementById('grade-items-list')
    if(gradeItems.length === 0){
      container.innerHTML = '<p class="small-muted">暂无成绩项，点击下方按钮添加</p>'
    }else{
      container.innerHTML = gradeItems.map(item=>`
        <div class="grade-item" data-item-id="${item.id}">
          <div class="grade-item-info">
            <h4>${item.item_name}</h4>
            <p>${item.description || ''}</p>
          </div>
          <div class="grade-item-weight">${(item.weight * 100).toFixed(0)}%</div>
          <button class="btn btn-sm btn-outline" onclick="deleteGradeItem(${item.id})">删除</button>
        </div>
      `).join('')
    }

    // 成绩项表单
    const addBtn = document.getElementById('add-grade-item-btn')
    if(addBtn){
      addBtn.onclick = ()=>showGradeItemModal(courseId)
    }

    // 批量导入按钮
    const importBtn = document.getElementById('import-grades-btn')
    if(importBtn){
      importBtn.onclick = ()=>showBatchUploadModal()
    }

    // 加载成绩表格
    await loadGradeTable(courseId)
  }catch(err){
    console.error('加载成绩项失败', err)
  }
}

async function loadGradeTable(courseId){
  try{
    // 获取成绩数据
    let gradesData = {}
    try{
      const allGrades = await apiFetch(`/courses/${courseId}/grades`)
      allGrades.forEach(grade => {
        const key = `${grade.student_id}_${grade.grade_item_id}`
        gradesData[key] = grade
      })
    }catch(e){
      console.warn('获取成绩数据失败，使用空数据', e)
    }

    // 构建表格头部
    const header = document.getElementById('grade-table-header')
    if(header){
      header.innerHTML = `
        <th>学号</th>
        <th>姓名</th>
        ${gradeItems.map(item=>`<th>${item.item_name} (${(item.weight*100).toFixed(0)}%)</th>`).join('')}
        <th>总成绩</th>
        <th>操作</th>
      `
    }

    // 构建表格内容
    const tbody = document.getElementById('grades-list')
    if(!tbody) return
    
    let html = ''
    
    for(const student of currentCourseStudents){
      let rowHtml = `
        <tr data-student-id="${student.student_id}">
          <td>${student.student_id_number}</td>
          <td>${student.full_name}</td>
      `
      
      let totalWeightedScore = 0
      let totalWeight = 0
      
      for(const item of gradeItems){
        const key = `${student.student_id}_${item.id}`
        const grade = gradesData[key]
        const score = grade ? grade.score : ''
        const gradeId = grade ? grade.id : null
        
        if(grade && grade.score !== null){
          totalWeightedScore += grade.score * item.weight
          totalWeight += item.weight
        }
        
        rowHtml += `
          <td>
            <input 
              type="number" 
              class="grade-input" 
              value="${score}" 
              step="0.1" 
              min="0" 
              max="100" 
              data-student-id="${student.student_id}"
              data-grade-item-id="${item.id}"
              data-grade-id="${gradeId || ''}"
              onchange="updateGradeCell(this)"
            >
          </td>
        `
      }
      
      // 计算总成绩
      const finalGrade = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(1) : ''
      
      rowHtml += `
        <td><strong>${finalGrade}</strong></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="saveStudentGrades('${student.student_id}')">
            保存
          </button>
        </td>
      </tr>
      `
      
      html += rowHtml
    }
    
    tbody.innerHTML = html
    
  }catch(err){
    console.error('加载成绩表格失败', err)
    const tbody = document.getElementById('grades-list')
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">加载失败</td></tr>'
  }
}

function updateGradeCell(input){
  const studentId = input.dataset.studentId
  const gradeItemId = input.dataset.gradeItemId
  const gradeId = input.dataset.gradeId
  const score = input.value
  
  // 实时更新总成绩
  updateFinalGrade(studentId)
}

function updateFinalGrade(studentId){
  const row = document.querySelector(`tr[data-student-id="${studentId}"]`)
  if(!row) return
  
  const gradeInputs = row.querySelectorAll('.grade-input')
  let totalWeightedScore = 0
  let totalWeight = 0
  
  gradeInputs.forEach(input => {
    const gradeItemId = input.dataset.gradeItemId
    const gradeItem = gradeItems.find(item => item.id == gradeItemId)
    
    if(gradeItem && input.value){
      totalWeightedScore += parseFloat(input.value) * gradeItem.weight
      totalWeight += gradeItem.weight
    }
  })
  
  const finalGradeCell = row.querySelector('td:nth-last-child(2)')
  if(finalGradeCell && totalWeight > 0){
    const finalGrade = (totalWeightedScore / totalWeight).toFixed(1)
    finalGradeCell.innerHTML = `<strong>${finalGrade}</strong>`
  }
}

async function saveStudentGrades(studentId){
  const row = document.querySelector(`tr[data-student-id="${studentId}"]`)
  if(!row) return
  
  const gradeInputs = row.querySelectorAll('.grade-input')
  let hasChanges = false
  
  for(const input of gradeInputs){
    const gradeItemId = input.dataset.gradeItemId
    const gradeId = input.dataset.gradeId
    const score = input.value
    
    if(score === '') continue
    
    try{
      if(gradeId){
        // 更新已有成绩
        await apiFetch(`/grades/${gradeId}`, {
          method: 'PUT',
          body: { score: parseFloat(score) }
        })
        hasChanges = true
      } else {
        // 创建新成绩
        // 需要先获取enrollment_id
        const student = currentCourseStudents.find(s => s.student_id == studentId)
        if(student && student.enrollment_id){
          await apiFetch(`/enrollments/${student.enrollment_id}/grades`, {
            method: 'POST',
            body: {
              grade_item_id: parseInt(gradeItemId),
              score: parseFloat(score)
            }
          })
          hasChanges = true
        }
      }
    }catch(err){
      console.error(`保存成绩失败: student=${studentId}, item=${gradeItemId}`, err)
    }
  }
  
  if(hasChanges){
    showNotification('成绩已保存', 'success')
    await loadGradeItemsData(currentCourseId)
  } else {
    showNotification('没有需要保存的成绩', 'info')
  }
}

function showGradeItemModal(courseId){
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加成绩项</h3>
          <button type="button" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="temp-grade-item-form">
            <div class="form-group">
              <label>项目名称</label>
              <input type="text" name="item_name" required>
            </div>
            <div class="form-group">
              <label>权重（0-1）</label>
              <input type="number" name="weight" step="0.01" min="0" max="1" required>
              <small class="form-text">当前总权重：<span id="current-total-weight">${calculateTotalWeight().toFixed(2)}</span></small>
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea name="description" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="submitGradeItem(${courseId})">添加</button>
          <button class="btn btn-outline" onclick="this.closest('.modal').remove()">取消</button>
        </div>
      </div>
    </div>
  `
  const modal = document.createElement('div')
  modal.innerHTML = html
  document.body.appendChild(modal.firstChild)
  
  // 更新总权重显示
  document.querySelector('input[name="weight"]')?.addEventListener('input', (e)=>{
    const newWeight = parseFloat(e.target.value) || 0
    const currentTotal = calculateTotalWeight()
    const newTotal = currentTotal + newWeight
    const totalWeightElem = document.getElementById('current-total-weight')
    if(totalWeightElem){
      totalWeightElem.textContent = newTotal.toFixed(2)
      totalWeightElem.style.color = newTotal > 1 ? 'red' : ''
    }
  })
}

function calculateTotalWeight(){
  return gradeItems.reduce((sum, item) => sum + item.weight, 0)
}

async function submitGradeItem(courseId){
  const form = document.getElementById('temp-grade-item-form')
  if(!form) return
  
  const fd = new FormData(form)
  const payload = {
    item_name: fd.get('item_name'),
    weight: parseFloat(fd.get('weight')),
    description: fd.get('description')
  }
  
  // 检查权重总和
  const currentTotal = calculateTotalWeight()
  if(currentTotal + payload.weight > 1){
    showNotification('总权重不能超过1', 'error')
    return
  }
  
  try{
    await apiFetch(`/courses/${courseId}/grade-items`, {method:'POST', body:payload})
    showNotification('成绩项已添加', 'success')
    document.querySelector('.modal').remove()
    await loadGradeItemsData(courseId)
  }catch(err){
    const errorMsg = err.data?.detail || '添加失败'
    showNotification('添加失败: ' + errorMsg, 'error')
  }
}

async function deleteGradeItem(itemId){
  if(!confirm('确认删除此成绩项吗？相关的成绩记录也会被删除。')) return
  try{
    await apiFetch(`/grade-items/${itemId}`, {method:'DELETE'})
    showNotification('成绩项已删除', 'success')
    await loadGradeItemsData(currentCourseId)
  }catch(err){
    showNotification('删除失败', 'error')
  }
}

function showBatchUploadModal(){
  if(!currentCourseId){
    showNotification('请先选择课程', 'error')
    return
  }
  
  if(gradeItems.length === 0){
    showNotification('请先添加成绩项', 'error')
    return
  }
  
  const html = `
    <div class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3>批量导入成绩</h3>
          <button type="button" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="batch-upload-form">
            <div class="form-group">
              <label>选择成绩项</label>
              <select name="item_id" required>
                ${gradeItems.map(item=>`<option value="${item.id}">${item.item_name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>选择文件 (CSV/XLS)</label>
              <div class="upload-area" id="batch-upload-area" style="margin-top: 10px;">
                <i class="fas fa-cloud-upload-alt fa-2x"></i>
                <h4>拖拽或点击上传</h4>
                <p>文件格式：学号,分数</p>
                <input type="file" id="batch-file-input" accept=".csv,.xlsx" hidden>
                <button type="button" class="btn btn-outline" onclick="document.getElementById('batch-file-input').click()">选择文件</button>
              </div>
            </div>
          </form>
          <div id="upload-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <p class="text-center">处理中...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="startBatchUpload()" id="start-upload-btn">开始上传</button>
          <button class="btn btn-outline" onclick="this.closest('.modal').remove()">取消</button>
        </div>
      </div>
    </div>
  `
  
  const modal = document.createElement('div')
  modal.innerHTML = html
  document.body.appendChild(modal.firstChild)
  
  // 设置文件上传事件
  const uploadArea = document.getElementById('batch-upload-area')
  const fileInput = document.getElementById('batch-file-input')
  
  uploadArea.addEventListener('dragover', (e)=>{
    e.preventDefault()
    uploadArea.style.borderColor = '#4A90E2'
    uploadArea.style.background = 'rgba(74, 144, 226, 0.05)'
  })
  
  uploadArea.addEventListener('dragleave', ()=>{
    uploadArea.style.borderColor = ''
    uploadArea.style.background = ''
  })
  
  uploadArea.addEventListener('drop', (e)=>{
    e.preventDefault()
    uploadArea.style.borderColor = ''
    uploadArea.style.background = ''
    if(e.dataTransfer.files.length > 0){
      fileInput.files = e.dataTransfer.files
      updateUploadArea(fileInput.files[0])
    }
  })
  
  fileInput.addEventListener('change', ()=>{
    if(fileInput.files.length > 0){
      updateUploadArea(fileInput.files[0])
    }
  })
}

function updateUploadArea(file){
  const uploadArea = document.getElementById('batch-upload-area')
  if(!uploadArea) return
  
  if(file){
    uploadArea.innerHTML = `
      <i class="fas fa-file-alt fa-2x"></i>
      <h4>${file.name}</h4>
      <p>${(file.size / 1024).toFixed(1)} KB</p>
      <button type="button" class="btn btn-outline" onclick="document.getElementById('batch-file-input').click()">更换文件</button>
    `
  }
}

async function startBatchUpload(){
  const fileInput = document.getElementById('batch-file-input')
  if(!fileInput.files.length){
    showNotification('请选择文件', 'error')
    return
  }
  
  const form = document.getElementById('batch-upload-form')
  const fd = new FormData(form)
  const itemId = fd.get('item_id')
  const file = fileInput.files[0]
  
  const uploadFd = new FormData()
  uploadFd.append('file', file)
  
  // 显示进度条
  document.getElementById('upload-progress').style.display = 'block'
  document.getElementById('start-upload-btn').disabled = true
  
  try{
    const res = await fetch(API_BASE + `/grade-items/${itemId}/grades/batch-upload`, {
      method:'POST',
      body:uploadFd,
      headers:{'Authorization':`Bearer ${getToken()}`}
    })
    
    const data = await res.json()
    
    if(res.ok){
      showNotification(`批量导入完成！成功：${data.summary?.updated || 0}，失败：${data.summary?.failed || 0}`, 'success')
      document.querySelector('.modal').remove()
      await loadGradeItemsData(currentCourseId)
    } else {
      throw data
    }
  }catch(err){
    showNotification('导入失败: ' + (err.detail || '未知错误'), 'error')
  } finally {
    document.getElementById('upload-progress').style.display = 'none'
    document.getElementById('start-upload-btn').disabled = false
  }
}

// ======================== 课件管理 ========================
document.addEventListener('DOMContentLoaded', ()=>{
  const uploadArea = document.getElementById('upload-area')
  const fileInput = document.getElementById('file-input')
  const browseBtn = document.getElementById('browse-files-btn')
  const uploadBtn = document.getElementById('upload-material-btn')

  if(browseBtn) browseBtn.addEventListener('click', ()=>fileInput.click())
  if(uploadBtn) uploadBtn.addEventListener('click', ()=>fileInput.click())

  if(uploadArea){
    uploadArea.addEventListener('dragover', (e)=>{
      e.preventDefault()
      uploadArea.style.borderColor = '#4A90E2'
      uploadArea.style.background = 'rgba(74, 144, 226, 0.05)'
    })
    uploadArea.addEventListener('dragleave', ()=>{
      uploadArea.style.borderColor = ''
      uploadArea.style.background = ''
    })
    uploadArea.addEventListener('drop', (e)=>{
      e.preventDefault()
      handleFilesUpload(e.dataTransfer.files)
    })
  }

  if(fileInput){
    fileInput.addEventListener('change', (e)=>{
      handleFilesUpload(e.target.files)
    })
  }
  
  // 初始化轮播图拖拽
  initCarouselDrag()
})

function initCarouselDrag(){
  const carouselList = document.getElementById('carousel-list')
  if(!carouselList) return
  
  let draggedItem = null
  
  carouselList.querySelectorAll('.carousel-item').forEach(item => {
    item.setAttribute('draggable', 'true')
    
    item.addEventListener('dragstart', (e) => {
      draggedItem = item
      setTimeout(() => item.classList.add('dragging'), 0)
    })
    
    item.addEventListener('dragend', () => {
      draggedItem = null
      item.classList.remove('dragging')
    })
  })
  
  carouselList.addEventListener('dragover', (e) => {
    e.preventDefault()
    const afterElement = getDragAfterElement(carouselList, e.clientY)
    const draggable = document.querySelector('.dragging')
    if(afterElement == null) {
      carouselList.appendChild(draggable)
    } else {
      carouselList.insertBefore(draggable, afterElement)
    }
  })
}

function getDragAfterElement(container, y){
  const draggableElements = [...container.querySelectorAll('.carousel-item:not(.dragging)')]
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect()
    const offset = y - box.top - box.height / 2
    
    if(offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child }
    } else {
      return closest
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element
}

async function handleFilesUpload(files){
  if(!currentCourseId){
    showNotification('请先选择课程', 'error')
    return
  }

  for(const file of files){
    const materialType = getMaterialType(file.type)
    const fd = new FormData()
    fd.append('material_type', materialType)
    fd.append('title', file.name)
    fd.append('file', file)
    
    // 如果是图片，默认添加到轮播图
    if(materialType === 'carousel_image'){
      const carouselItems = document.querySelectorAll('#carousel-list .carousel-item').length
      if(carouselItems >= 5){
        showNotification('轮播图最多只能有5张', 'warning')
        continue
      }
      fd.append('display_order', carouselItems)
    }

    try{
      const res = await fetch(API_BASE + `/courses/${currentCourseId}/materials`, {
        method:'POST',
        body:fd,
        headers:{'Authorization':`Bearer ${getToken()}`}
      })
      const data = await res.json()
      showNotification(`${file.name} 上传成功`, 'success')
    }catch(err){
      showNotification(`${file.name} 上传失败`, 'error')
    }
  }

  loadMaterialsList()
}

function getMaterialType(fileType){
  if(fileType.includes('video')) return 'video'
  if(fileType.includes('image')) return 'carousel_image'
  return 'document'
}

async function loadMaterialsList(){
  if(!currentCourseId) return
  
  const container = document.getElementById('materials-container')
  if(!container) return

  try{
    const materials = await apiFetch(`/courses/${currentCourseId}/materials`)
    
    if(materials.length === 0){
      container.innerHTML = '<div class="empty-state"><i class="fas fa-file"></i><p>暂无课件</p></div>'
      return
    }
    
    container.innerHTML = materials.map(material=>`
      <div class="material-card">
        <div class="material-preview">
          ${getMaterialIcon(material.material_type)}
        </div>
        <div class="material-info">
          <h4>${material.title}</h4>
          <p>${getMaterialTypeText(material.material_type)}</p>
          <p class="small-muted">${new Date(material.created_at).toLocaleDateString()}</p>
          <div class="material-actions">
            <button class="btn btn-sm btn-outline" onclick="deleteMaterial(${material.id})">删除</button>
          </div>
        </div>
      </div>
    `).join('')
    
    // 加载轮播图
    await loadCarouselList()
    
  }catch(err){
    console.error('加载课件列表失败', err)
    container.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-triangle"></i><p>加载失败</p></div>'
  }
}

async function loadCarouselList(){
  const carouselList = document.getElementById('carousel-list')
  if(!carouselList) return
  
  try{
    const materials = await apiFetch(`/courses/${currentCourseId}/materials?material_type=carousel_image`)
    
    if(materials.length === 0){
      carouselList.innerHTML = '<p class="small-muted">暂无轮播图</p>'
      return
    }
    
    // 按显示顺序排序
    materials.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    
    carouselList.innerHTML = materials.map(material=>`
      <div class="carousel-item" draggable="true" data-material-id="${material.id}">
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <div class="carousel-preview" style="background-image:url('${API_BASE}/uploads/${material.file_path_or_content}')"></div>
        <span>${material.title}</span>
        <button class="btn btn-sm btn-outline" onclick="removeFromCarousel(${material.id})">移除</button>
      </div>
    `).join('')
    
    initCarouselDrag()
    
  }catch(err){
    console.error('加载轮播图失败', err)
  }
}

function getMaterialIcon(type){
  switch(type){
    case 'video': return '<i class="fas fa-video"></i>'
    case 'carousel_image': return '<i class="fas fa-image"></i>'
    default: return '<i class="fas fa-file-pdf"></i>'
  }
}

function getMaterialTypeText(type){
  switch(type){
    case 'video': return '视频'
    case 'carousel_image': return '轮播图'
    default: return '文档'
  }
}

async function deleteMaterial(materialId){
  if(!confirm('确定要删除这个课件吗？')) return
  try{
    await apiFetch(`/materials/${materialId}`, {method:'DELETE'})
    showNotification('课件已删除', 'success')
    await loadMaterialsList()
  }catch(err){
    showNotification('删除失败', 'error')
  }
}

async function removeFromCarousel(materialId){
  try{
    await apiFetch(`/materials/${materialId}`, {
      method: 'PATCH',
      body: { material_type: 'document' }
    })
    showNotification('已从轮播图移除', 'success')
    await loadCarouselList()
  }catch(err){
    showNotification('操作失败', 'error')
  }
}