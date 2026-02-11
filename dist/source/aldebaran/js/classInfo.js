// 课程信息库页面逻辑

(function() {
  const apiBase = 'http://localhost:8000/api/v1/courses';

  function fetchCourses(params = {}) {
      const url = new URL(apiBase);
      Object.entries(params).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) url.searchParams.append(k, v);
      });
      return fetch(url).then(res => res.json());
  }

  function renderCoursesTable(courses) {
      if (!courses.length) return '<div class="no-data">暂无课程信息</div>';
      let html = `<table class="courses-table">
          <thead><tr>
              <th>课程号</th><th>课程名</th><th>学分</th><th>简介</th><th>授课教师</th><th>选课要求</th><th>操作</th>
          </tr></thead><tbody>`;
      for (const c of courses) {
          html += `<tr>
              <td>${c.course_code}</td>
              <td>${c.course_name}</td>
              <td>${c.credits}</td>
              <td>${c.description || ''}</td>
              <td>${(c.teachers||[]).map(t => t.full_name).join('、') || '-'}</td>
              <td>${c.prerequisites || '-'}</td>
              <td><button class="detail-btn" data-id="${c.id}">查看详情</button></td>
          </tr>`;
      }
      html += '</tbody></table>';
      return html;
  }

  function renderPagination(pagination) {
      if (!pagination || pagination.totalPages <= 1) return '';
      let html = '';
      for (let i = 1; i <= pagination.totalPages; i++) {
          html += `<button class="page-btn${i === pagination.currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
      }
      return html;
  }

  function loadCourses(params = {}) {
      fetchCourses(params).then(data => {
          document.getElementById('courses-table-container').innerHTML = renderCoursesTable(data.courses || []);
          document.getElementById('pagination-block').innerHTML = renderPagination(data.pagination);
          bindPaginationEvents(params, data.pagination);
                    bindDetailButtons();
      });
  }

    // 绑定详情按钮事件
    function bindDetailButtons() {
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.onclick = function() {
                const courseId = this.dataset.id;
                showCourseDetail(courseId);
            };
        });
    }

    // 拉取并展示课程详情
    function showCourseDetail(courseId) {
        fetch(`${apiBase}/${courseId}`, {
            headers: getAuthHeader()
        })
        .then(res => res.json())
        .then(data => {
            // 组装详情内容
            let html = `<h3>${data.course_name}（${data.course_code}）</h3>`;
            html += `<p><b>学分：</b>${data.credits} &nbsp; <b>授课教师：</b>${(data.teachers||[]).map(t=>t.full_name).join('、')||'-'}</p>`;
            html += `<p><b>简介：</b>${data.description||'无'}</p>`;
            html += `<p><b>选课要求：</b>${data.prerequisites||'无'}</p>`;
            if (data.materials && data.materials.length) {
                html += `<h4>课程资料</h4><ul>`;
                for (const m of data.materials) {
                    if (m.material_type==='document') {
                        html += `<li>📄 <a href="${m.file_path_or_content}" target="_blank">${m.title||'文档'}</a></li>`;
                    } else if (m.material_type==='video') {
                        html += `<li>🎬 <a href="${m.file_path_or_content}" target="_blank">${m.title||'视频课件'}</a></li>`;
                    } else if (m.material_type==='audio') {
                        html += `<li>🎵 <a href="${m.file_path_or_content}" target="_blank">${m.title||'音频课件'}</a></li>`;
                    }
                }
                html += `</ul>`;
            }
            document.getElementById('course-detail-body').innerHTML = html;
            document.getElementById('course-detail-modal').style.display = 'block';
            document.getElementById('close-course-detail').onclick = function() {
                document.getElementById('course-detail-modal').style.display = 'none';
            };

            // 判断是否为授课教师，显示编辑按钮
            let canEdit = false;
            try {
                const user = getCurrentUser();
                if (user && user.role === 'teacher' && data.teachers && data.teachers.some(t => t.full_name === user.full_name)) {
                    canEdit = true;
                }
            } catch(e) {}
            const editBtnBlock = document.getElementById('edit-course-btn-block');
            if (canEdit) {
                editBtnBlock.style.display = '';
                document.getElementById('edit-course-btn').onclick = function() {
                    showEditCourseModal(data);
                };
            } else {
                editBtnBlock.style.display = 'none';
            }
        });
    }

    // 获取当前登录用户信息（假设已存储在 localStorage.userInfo）
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('userInfo')||'null');
        } catch(e) { return null; }
    }
    // 获取认证头
    function getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }

    // 弹出编辑课程弹窗并填充数据
    function showEditCourseModal(course) {
        const modal = document.getElementById('edit-course-modal');
        const form = document.getElementById('edit-course-form');
        form.course_name.value = course.course_name || '';
        form.credits.value = course.credits || '';
        form.description.value = course.description || '';
        form.department.value = course.department || '';
        form.prerequisites.value = course.prerequisites || '';
        document.getElementById('edit-course-msg').textContent = '';
        modal.style.display = 'block';
        document.getElementById('close-edit-course').onclick = function() {
            modal.style.display = 'none';
        };
        form.onsubmit = function(e) {
            e.preventDefault();
            const payload = {
                course_name: form.course_name.value.trim(),
                credits: form.credits.value,
                description: form.description.value.trim(),
                department: form.department.value.trim(),
                prerequisites: form.prerequisites.value.trim()
            };
            fetch(`${apiBase}/${course.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(resp => {
                if (resp.id) {
                    modal.style.display = 'none';
                    document.getElementById('course-detail-modal').style.display = 'none';
                    showCourseDetail(course.id); // 刷新详情
                } else {
                    document.getElementById('edit-course-msg').textContent = resp.detail || '保存失败';
                }
            })
            .catch(()=>{
                document.getElementById('edit-course-msg').textContent = '网络错误';
            });
        };
    }

  function bindPaginationEvents(params, pagination) {
      if (!pagination) return;
      document.querySelectorAll('.page-btn').forEach(btn => {
          btn.onclick = function() {
              loadCourses({...params, page: parseInt(this.dataset.page)});
          };
      });
  }

  function bindSearchForm() {
      const form = document.getElementById('course-search-form');
      form.onsubmit = function(e) {
          e.preventDefault();
          const formData = new FormData(form);
          const params = {};
          for (const [k, v] of formData.entries()) {
              params[k] = v;
          }
          params.page = 1;
          params.pageSize = 10;
          loadCourses(params);
      };
  }

  function bindBackToHome() {
      const btn = document.getElementById('back-to-home');
      if (btn) {
          btn.onclick = function(e) {
              e.preventDefault();
              if (typeof loadHome === 'function') {
                  loadHome();
              } else if (window.location) {
                  window.location.reload();
              }
          };
      }
  }

  function initClassInfoPage() {
      bindSearchForm();
      bindBackToHome();
      loadCourses({page: 1, pageSize: 10});
            // ESC关闭弹窗
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('course-detail-modal');
                    if (modal && modal.style.display === 'block') modal.style.display = 'none';
                }
            });
  }

  // 供主页面动态加载后调用
  window.initClassInfoPage = initClassInfoPage;
})();
