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
              <th>课程号</th><th>课程名</th><th>学分</th><th>简介</th><th>授课教师</th><th>选课要求</th>
          </tr></thead><tbody>`;
      for (const c of courses) {
          html += `<tr>
              <td>${c.course_code}</td>
              <td>${c.course_name}</td>
              <td>${c.credits}</td>
              <td>${c.description || ''}</td>
              <td>${(c.teachers||[]).map(t => t.full_name).join('、') || '-'}</td>
              <td>${c.prerequisites || '-'}</td>
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
      });
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
      if (btn) btn.onclick = function() {
          if (window.loadHome) window.loadHome();
      };
  }

  function initClassInfoPage() {
      bindSearchForm();
      bindBackToHome();
      loadCourses({page: 1, pageSize: 10});
  }

  // 供主页面动态加载后调用
  window.initClassInfoPage = initClassInfoPage;
})();
