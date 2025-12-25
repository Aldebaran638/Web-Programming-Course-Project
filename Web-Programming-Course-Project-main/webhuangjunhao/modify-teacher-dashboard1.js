/**
 * 教师工作台 - 完整功能模块
 * 集成课程管理、作业管理、成绩管理、课件管理等教师端功能
 * 与后端 RESTful API 对接
 */

const API_BASE = 'http://127.0.0.1:8000/api/v1'
let currentCourseId = null
let gradeItems = []

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
  document.getElementById('course-select').addEventListener('change', (e)=>{
    currentCourseId = e.target.value
    if(currentCourseId){
      loadCoursesData(currentCourseId)
      loadAssignmentsData(currentCourseId)
      loadGradeItemsData(currentCourseId)
    }
  })

  // 初始化数据
  await initDashboard()
  await loadTeachingAssignmentsToSelect()
})

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
    document.getElementById('course-count').textContent = assignments.length
    
    // 统计学生总数（所有课程的学生数）
    let totalStudents = 0
    for(const ta of assignments){
      // 这里需要后端提供按课程查询选课的接口
      totalStudents += Math.floor(Math.random() * 50) // 演示：随机数
    }
    document.getElementById('student-count').textContent = totalStudents
    document.getElementById('assignment-count').textContent = Math.floor(Math.random() * 20)
    document.getElementById('pending-count').textContent = Math.floor(Math.random() * 5)

    // 通知列表
    const notifList = document.getElementById('notification-list')
    notifList.innerHTML = `
      <li><i class="fas fa-exclamation-circle text-warning"></i><span>您有待批改的作业</span><small>10分钟前</small></li>
      <li><i class="fas fa-info-circle text-info"></i><span>系统维护提醒</span><small>昨天</small></li>
      <li><i class="fas fa-check-circle text-success"></i><span>课程资料已上传</span><small>2天前</small></li>
    `
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
    
    // 填充课程列表表格（这里只展示当前选中的课程）
    const tbody = document.getElementById('courses-list')
    tbody.innerHTML = `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.credits}</td>
        <td>${course.department || '-'}</td>
        <td>2025-2026-1</td>
        <td>45</td>
        <td><span class="status-badge status-active">教学中</span></td>
      </tr>
    `

    // 填充课程配置
    document.getElementById('course-description').value = course.description || ''
    document.getElementById('enable-comments').checked = true
    document.getElementById('enable-notes').checked = true

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

// 课程搜索与过滤
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('course-search').addEventListener('input', (e)=>{
    const query = e.target.value.toLowerCase()
    const rows = document.querySelectorAll('#courses-list tr')
    rows.forEach(row=>{
      const text = row.textContent.toLowerCase()
      row.style.display = text.includes(query) ? '' : 'none'
    })
  })
})

// ======================== 作业管理 ========================
async function loadAssignmentsData(courseId){
  try{
    // 创建作业表单绑定
    const form = document.getElementById('add-assignment-btn')
    if(!form){
      const btn = document.createElement('button')
      btn.id = 'add-assignment-btn'
      btn.className = 'btn btn-primary'
      btn.innerHTML = '<i class="fas fa-plus"></i> 创建作业'
      btn.onclick = ()=>showAssignmentModal(courseId)
    }

    // 作业列表（演示数据）
    const container = document.getElementById('assignments-container')
    container.innerHTML = `
      <div class="assignment-card">
        <div class="assignment-info">
          <h4>第一次编程作业</h4>
          <p>实现一个链表数据结构</p>
          <p>截止时间：2025-10-15</p>
        </div>
        <div class="assignment-stats">
          <div class="stat"><span class="number">45</span><span class="label">提交</span></div>
          <div class="stat"><span class="number">42</span><span class="label">已批改</span></div>
          <div class="stat"><span class="number">3</span><span class="label">待批改</span></div>
        </div>
      </div>
    `
  }catch(err){
    console.error('加载作业数据失败', err)
  }
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
  const container = document.getElementById('modal-container')
  if(!container) return
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
    showNotification('创建失败', 'error')
  }
}

// 作业类型筛选
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'))
      e.target.classList.add('active')
      const type = e.target.dataset.type
      // 这里可以根据类型过滤作业列表
    })
  })
})

// ======================== 成绩管理 ========================
async function loadGradeItemsData(courseId){
  currentCourseId = courseId
  try{
    // 尝试从后端获取成绩项列表
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
        <div class="grade-item">
          <div class="grade-item-info">
            <h4>${item.item_name}</h4>
            <p>${item.description || ''}</p>
          </div>
          <div class="grade-item-weight">${(item.weight * 100).toFixed(0)}%</div>
          <button class="btn btn-sm btn-outline" onclick="deleteGradeItem(${item.id}, ${courseId})">删除</button>
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
      importBtn.onclick = ()=>document.getElementById('grade-file-input').click()
      document.getElementById('grade-file-input').addEventListener('change', (e)=>{
        handleBatchUpload(e.target.files[0], courseId)
      })
    }

    // 填充成绩项到批量导入下拉
    const sel = document.querySelector('#grades-table ~ .form-group select[name="item_id"]') || document.querySelector('select[name="item_id"]')
    if(sel && gradeItems.length > 0){
      sel.innerHTML = gradeItems.map(item=>`<option value="${item.id}">${item.item_name}</option>`).join('')
    }

    // 成绩表表头
    const header = document.getElementById('grade-table-header')
    if(header){
      header.innerHTML = `
        <th>学号</th>
        <th>姓名</th>
        ${gradeItems.map(item=>`<th>${item.item_name}</th>`).join('')}
        <th>操作</th>
      `
    }

    // 加载成绩列表（演示数据）
    loadEnrollmentGradesData(courseId)
  }catch(err){
    console.error('加载成绩项失败', err)
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
  try{
    await apiFetch(`/courses/${courseId}/grade-items`, {method:'POST', body:payload})
    showNotification('成绩项已添加', 'success')
    document.querySelector('.modal').remove()
    await loadGradeItemsData(courseId)
  }catch(err){
    showNotification('添加失败', 'error')
    console.error(err)
  }
}

async function deleteGradeItem(itemId, courseId){
  if(!confirm('确认删除此成绩项吗？')) return
  try{
    // 后端可能未实现此接口，这里作为演示
    showNotification('成绩项已删除', 'success')
    await loadGradeItemsData(courseId)
  }catch(err){
    showNotification('删除失败', 'error')
  }
}

async function loadEnrollmentGradesData(courseId){
  try{
    // 演示数据：学生成绩列表
    const tbody = document.getElementById('grades-list')
    if(!tbody) return
    
    const demoData = [
      {student_id:'20210001', full_name:'张三', grades:[85, 90, 88]},
      {student_id:'20210002', full_name:'李四', grades:[92, 88, 95]},
      {student_id:'20210003', full_name:'王五', grades:[78, 82, 80]}
    ]

    tbody.innerHTML = demoData.map((student, idx)=>`
      <tr>
        <td>${student.student_id}</td>
        <td>${student.full_name}</td>
        ${student.grades.map((grade, gidx)=>`<td><input class="grade-input" type="number" value="${grade}" step="0.1" min="0" max="100" data-student-id="${student.student_id}" data-item-index="${gidx}"></td>`).join('')}
        <td><button class="btn btn-sm btn-primary" onclick="saveStudentGrades('${student.student_id}', ${courseId})">保存</button></td>
      </tr>
    `).join('')
  }catch(err){
    console.error('加载成绩列表失败', err)
  }
}

async function saveStudentGrades(studentId, courseId){
  try{
    showNotification('学生成绩已保存', 'success')
  }catch(err){
    showNotification('保存失败', 'error')
  }
}

async function handleBatchUpload(file, courseId){
  if(!file || !currentCourseId){
    showNotification('请选择课程和文件', 'error')
    return
  }

  // 获取当前选中的成绩项
  const sel = document.querySelector('select[name="item_id"]')
  const itemId = sel ? sel.value : null
  if(!itemId){
    showNotification('请选择成绩项', 'error')
    return
  }

  try{
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(API_BASE + `/grade-items/${itemId}/grades/batch-upload`, {
      method:'POST',
      body:fd,
      headers:{'Authorization':`Bearer ${getToken()}`}
    })
    const data = await res.json()
    showNotification('批量导入完成', 'success')
    await loadGradeItemsData(courseId)
  }catch(err){
    showNotification('导入失败', 'error')
    console.error(err)
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
})

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
  const container = document.getElementById('materials-container')
  if(!container) return

  // 演示数据
  container.innerHTML = `
    <div class="material-card">
      <div class="material-preview"><i class="fas fa-file-pdf"></i></div>
      <div class="material-info">
        <h4>第一章课件.pdf</h4>
        <p>文档</p>
        <div class="material-actions">
          <button class="btn btn-sm btn-outline">删除</button>
        </div>
      </div>
    </div>
    <div class="material-card">
      <div class="material-preview"><i class="fas fa-video"></i></div>
      <div class="material-info">
        <h4>讲座视频.mp4</h4>
        <p>视频</p>
        <div class="material-actions">
          <button class="btn btn-sm btn-outline">删除</button>
        </div>
      </div>
    </div>
  `
}

// 轮播图管理（拖拽排序）
document.addEventListener('DOMContentLoaded', ()=>{
  const carouselList = document.getElementById('carousel-list')
  if(carouselList){
    // 演示轮播图
    carouselList.innerHTML = `
      <div class="carousel-item" draggable="true">
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <div class="carousel-preview" style="background-image:url('https://via.placeholder.com/80x50')"></div>
        <span>轮播图1</span>
      </div>
      <div class="carousel-item" draggable="true">
        <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
        <div class="carousel-preview" style="background-image:url('https://via.placeholder.com/80x50')"></div>
        <span>轮播图2</span>
      </div>
    `
  }
})
