// 成绩审核管理类
class GradeReviewManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
        this.selectedCourses = new Set();
        this.currentCourseDetail = null;
    }
    
    init() {
        console.log('[GradeReviewManager] init called');
        this.loadGradeReviews();
        this.initEvents();
    }
    
    initEvents() {
        // 刷新按钮
        document.getElementById('refresh-reviews-btn')?.addEventListener('click', () => {
            this.loadGradeReviews();
        });
        
        // 搜索输入
        document.getElementById('search-course')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value || undefined;
            this.currentPage = 1;
            this.loadGradeReviews();
        });
        
        // 学期筛选
        document.getElementById('filter-semester')?.addEventListener('change', (e) => {
            this.currentFilters.semester = e.target.value || undefined;
            this.currentPage = 1;
            this.loadGradeReviews();
        });
        
        // 警告筛选
        document.getElementById('filter-warning')?.addEventListener('change', (e) => {
            this.currentFilters.warning = e.target.value || undefined;
            this.currentPage = 1;
            this.loadGradeReviews();
        });
        
        // 重置筛选
        document.getElementById('reset-grade-filters')?.addEventListener('click', () => {
            document.getElementById('search-course').value = '';
            document.getElementById('filter-semester').value = '';
            document.getElementById('filter-warning').value = '';
            this.currentFilters = {};
            this.currentPage = 1;
            this.loadGradeReviews();
        });
        
        // 全选复选框
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const checkboxes = document.querySelectorAll('.course-checkbox');
            
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const courseId = cb.value;
                if (isChecked) {
                    this.selectedCourses.add(courseId);
                } else {
                    this.selectedCourses.delete(courseId);
                }
            });
            
            this.toggleBatchActions();
        });
        
        // 批量审核通过
        document.getElementById('batch-approve-btn')?.addEventListener('click', () => {
            this.batchApprove();
        });
        
        // 批量退回修改
        document.getElementById('batch-reject-btn')?.addEventListener('click', () => {
            this.batchReject();
        });
        
        // 取消批量选择
        document.getElementById('cancel-batch')?.addEventListener('click', () => {
            this.clearSelection();
        });
        
        // 分页按钮事件委托
        document.getElementById('review-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadGradeReviews();
                }
            }
        });
    }
    
    async loadGradeReviews() {
        console.log('[GradeReviewManager] loadGradeReviews start');
        const loading = document.getElementById('review-loading');
        const empty = document.getElementById('review-empty');
        const tableBody = document.getElementById('grade-review-body');

        if (!loading || !empty || !tableBody) {
            console.warn('[GradeReviewManager] required DOM elements missing', {
                hasLoading: !!loading,
                hasEmpty: !!empty,
                hasTableBody: !!tableBody
            });
            return;
        }
        
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        this.selectedCourses.clear();
        this.toggleBatchActions();
        
        try {
            // 后端返回所有有成绩的课程及其审核/完成度状态
            console.log('[GradeReviewManager] fetching pending review');
            const data = await this.app.fetchWithAuth(`/grades/pending-review`);
            console.log('[GradeReviewManager] pending review response', data);

            // 前端根据搜索和预警筛选
            let filtered = Array.isArray(data) ? data.slice() : [];
            const search = (this.currentFilters.search || '').toLowerCase();
            const warningFilter = this.currentFilters.warning || '';

            if (search) {
                filtered = filtered.filter(item => {
                    const name = (item.course_name || '').toLowerCase();
                    const code = (item.course_code || '').toLowerCase();
                    return name.includes(search) || code.includes(search);
                });
            }

            if (warningFilter === 'has_warning') {
                filtered = filtered.filter(item => Array.isArray(item.warnings) && item.warnings.length > 0);
            } else if (warningFilter === 'no_warning') {
                filtered = filtered.filter(item => !item.warnings || item.warnings.length === 0);
            }

            this.totalItems = filtered.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

            if (!filtered || filtered.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 当前页切片
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

            // 渲染表格
            pageItems.forEach((review) => {
                const canReview = review.status === 'pending_review';
                const warningCount = review.warnings?.length || 0;
                const warningBadges = this.renderWarningBadges(review.warnings);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="course-checkbox" value="${review.course_id}" ${canReview ? '' : 'disabled'}>
                    </td>
                    <td>
                        <div style="font-weight: 600;">${review.course_name || '未知课程'}</div>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 3px;">
                            课程编号: ${review.course_code || 'N/A'}
                        </div>
                    </td>
                    <td>${review.semester || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${this.getStatusClass(review.status)}">
                            ${this.getStatusText(review.status)}
                        </span>
                    </td>
                    <td>
                        ${warningCount > 0 ? `
                            <div class="warning-indicator">
                                <span class="warning-count">${warningCount} 个异常</span>
                                ${warningBadges}
                            </div>
                        ` : '<span style="color: #28a745;">正常</span>'}
                    </td>
                    <td class="actions-cell">
                        <button class="btn btn-sm btn-outline" onclick="gradeReviewManager.viewDetails(${review.course_id})">
                            <i class="fas fa-eye"></i> 查看详情
                        </button>
                        <button class="btn btn-sm btn-success" onclick="gradeReviewManager.approveCourse(${review.course_id})" ${canReview ? '' : 'disabled'}>
                            <i class="fas fa-check"></i> 审核通过
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // 绑定复选框事件
            document.querySelectorAll('.course-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const courseId = e.target.value;
                    if (e.target.checked) {
                        this.selectedCourses.add(courseId);
                    } else {
                        this.selectedCourses.delete(courseId);
                    }
                    this.updateSelectAllCheckbox();
                    this.toggleBatchActions();
                });
            });
            
            loading.style.display = 'none';
            this.renderPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    renderWarningBadges(warnings) {
        if (!warnings || warnings.length === 0) return '';
        
        const warningTypes = {
            'HIGH_EXCELLENT_RATE': { label: '优秀率过高', color: '#ffc107' },
            'LOW_PASS_RATE': { label: '及格率过低', color: '#dc3545' },
            'GRADE_DISTRIBUTION_ABNORMAL': { label: '分布异常', color: '#fd7e14' },
            'SINGLE_STUDENT_ANOMALY': { label: '学生异常', color: '#6f42c1' },
            'MULTIPLE_STUDENTS_ANOMALY': { label: '多生异常', color: '#e83e8c' }
        };
        
        let badges = '';
        warnings.forEach(warning => {
            const type = warning.type || warning.warning_type;
            const warningInfo = warningTypes[type] || { label: type, color: '#6c757d' };
            badges += `
                <span class="warning-badge" style="background: ${warningInfo.color}20; color: ${warningInfo.color}; border: 1px solid ${warningInfo.color}40;">
                    ${warningInfo.label}
                </span>
            `;
        });
        
        return `<div class="warning-badges" style="display: flex; gap: 5px; margin-top: 5px;">${badges}</div>`;
    }
    
    getStatusClass(status) {
        switch(status) {
            case 'pending_review': return 'status-warning';
            case 'approved': return 'status-success';
            case 'rejected': return 'status-danger';
            case 'not_ready': return 'status-secondary';
            default: return 'status-secondary';
        }
    }
    
    getStatusText(status) {
        switch(status) {
            case 'pending_review': return '待审核';
            case 'approved': return '已审核';
            case 'rejected': return '已退回';
            case 'not_ready': return '成绩未录满';
            default: return status;
        }
    }
    
    renderPagination() {
        const pagination = document.getElementById('review-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页，共 ${this.totalItems} 条记录
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    updateSelectAllCheckbox() {
        const selectAll = document.getElementById('select-all');
        if (!selectAll) return;
        
        const checkboxes = document.querySelectorAll('.course-checkbox');
        const checkedCount = document.querySelectorAll('.course-checkbox:checked').length;
        
        selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }
    
    toggleBatchActions() {
        const batchActions = document.getElementById('batch-actions');
        if (!batchActions) return;
        
        if (this.selectedCourses.size > 0) {
            batchActions.style.display = 'block';
        } else {
            batchActions.style.display = 'none';
        }
    }
    
    clearSelection() {
        this.selectedCourses.clear();
        document.querySelectorAll('.course-checkbox').forEach(cb => {
            cb.checked = false;
        });
        document.getElementById('select-all').checked = false;
        document.getElementById('select-all').indeterminate = false;
        this.toggleBatchActions();
    }
    
    async viewDetails(courseId) {
        try {
            // 加载课程详情
            const courseDetail = await this.app.fetchWithAuth(`/courses/${courseId}`);
            
            // 加载成绩统计数据
            const gradeStats = await this.loadGradeStats(courseId);
            
            // 加载学生成绩列表
            const studentGrades = await this.loadStudentGrades(courseId);
            
            // 加载警告信息
            const warnings = await this.loadCourseWarnings(courseId);
            
            this.currentCourseDetail = {
                courseId,
                ...courseDetail,
                gradeStats,
                studentGrades,
                warnings
            };
            
            this.showDetailModal();
            
        } catch (error) {
            this.app.showError('加载成绩详情失败: ' + error.message);
        }
    }
    
    async loadGradeStats(courseId) {
        // 这里应该调用API获取成绩统计数据
        // 暂时返回模拟数据
        return {
            average: 78.5,
            passRate: 92.3,
            excellentRate: 18.7,
            warningCount: 3,
            totalStudents: 45,
            gradeDistribution: {
                '90-100': 8,
                '80-89': 15,
                '60-79': 18,
                '0-59': 4
            }
        };
    }
    
    async loadStudentGrades(courseId) {
        // 这里应该调用API获取学生成绩列表
        // 暂时返回模拟数据
        return [
            { studentId: '20210001', name: '张三', regular: 85, midterm: 88, final: 92, total: 88.5, grade: 'B+', status: '正常' },
            { studentId: '20210002', name: '李四', regular: 92, midterm: 95, final: 98, total: 95.2, grade: 'A', status: '优秀' },
            { studentId: '20210003', name: '王五', regular: 45, midterm: 50, final: 55, total: 50.5, grade: 'F', status: '不及格' },
            { studentId: '20210004', name: '赵六', regular: 78, midterm: 82, final: 85, total: 82.3, grade: 'B', status: '正常' }
        ];
    }
    
    async loadCourseWarnings(courseId) {
        // 这里应该调用API获取课程警告信息
        // 暂时返回模拟数据
        return [
            { type: 'HIGH_EXCELLENT_RATE', message: '优秀率 (90分以上) 达到 45%，超过预警阈值 30%。' },
            { type: 'GRADE_DISTRIBUTION_ABNORMAL', message: '成绩分布呈现双峰，可能存在评分标准不一致。' },
            { type: 'SINGLE_STUDENT_ANOMALY', message: '学生 20210005 的成绩从上次的65分提升到95分，提升幅度异常。' }
        ];
    }
    
    showDetailModal() {
        const detail = this.currentCourseDetail;
        if (!detail) return;
        
        // 更新模态框内容
        document.getElementById('detail-course-title').textContent = `成绩详情 - ${detail.course_name}`;
        document.getElementById('detail-course-name').textContent = `${detail.course_code} ${detail.course_name}`;
        document.getElementById('detail-semester').textContent = '2025-2026-1';
        document.getElementById('detail-teacher').textContent = detail.teachers?.[0]?.full_name || '未分配';
        document.getElementById('detail-student-count').textContent = detail.gradeStats.totalStudents || 0;
        
        // 更新统计数据
        document.getElementById('stat-average').textContent = detail.gradeStats.average?.toFixed(1) || '0';
        document.getElementById('stat-pass-rate').textContent = `${detail.gradeStats.passRate?.toFixed(1) || '0'}%`;
        document.getElementById('stat-excellent-rate').textContent = `${detail.gradeStats.excellentRate?.toFixed(1) || '0'}%`;
        document.getElementById('stat-warnings').textContent = detail.gradeStats.warningCount || 0;
        
        // 更新警告信息
        this.renderWarningAlerts(detail.warnings);
        
        // 更新学生成绩列表
        this.renderStudentGrades(detail.studentGrades);
        
        // 绑定审核按钮事件
        document.getElementById('approve-grade-btn').onclick = () => this.approveCourse(detail.courseId);
        document.getElementById('reject-grade-btn').onclick = () => this.rejectCourse(detail.courseId);
        
        // 显示模态框
        document.getElementById('grade-detail-modal').style.display = 'block';
        
        // 绑定搜索和筛选事件
        this.initDetailModalEvents();
    }
    
    renderWarningAlerts(warnings) {
        const container = document.getElementById('warning-alerts');
        if (!warnings || warnings.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    无异常警告，成绩分布正常。
                </div>
            `;
            return;
        }
        
        let alerts = '';
        warnings.forEach(warning => {
            const type = warning.type || warning.warning_type;
            let alertClass = 'alert-warning';
            let icon = 'fa-exclamation-triangle';
            
            if (type.includes('HIGH') || type.includes('ANOMALY')) {
                alertClass = 'alert-danger';
                icon = 'fa-exclamation-circle';
            }
            
            alerts += `
                <div class="alert ${alertClass}">
                    <i class="fas ${icon}"></i>
                    ${warning.message}
                </div>
            `;
        });
        
        container.innerHTML = alerts;
    }
    
    renderStudentGrades(grades) {
        const tableBody = document.getElementById('student-grades-body');
        const loading = document.getElementById('grades-loading');
        const empty = document.getElementById('grades-empty');
        
        if (!grades || grades.length === 0) {
            loading.style.display = 'none';
            empty.style.display = 'block';
            tableBody.innerHTML = '';
            return;
        }
        
        let rows = '';
        grades.forEach(grade => {
            const gradeClass = this.getGradeClass(grade.total);
            
            rows += `
                <tr>
                    <td>${grade.studentId}</td>
                    <td>${grade.name}</td>
                    <td>${grade.regular}</td>
                    <td>${grade.midterm}</td>
                    <td>${grade.final}</td>
                    <td><strong style="color: ${gradeClass};">${grade.total}</strong></td>
                    <td><span class="grade-badge ${gradeClass}">${grade.grade}</span></td>
                    <td>${grade.status}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = rows;
        loading.style.display = 'none';
        empty.style.display = 'none';
    }
    
    getGradeClass(score) {
        if (score >= 90) return 'grade-a';
        if (score >= 80) return 'grade-b';
        if (score >= 70) return 'grade-c';
        if (score >= 60) return 'grade-d';
        return 'grade-f';
    }
    
    initDetailModalEvents() {
        // 学生搜索
        document.getElementById('search-student-grade')?.addEventListener('input', (e) => {
            this.filterStudentGrades(e.target.value);
        });
        
        // 分数范围筛选
        document.getElementById('filter-grade-range')?.addEventListener('change', (e) => {
            this.filterByGradeRange(e.target.value);
        });
    }
    
    filterStudentGrades(searchTerm) {
        const rows = document.querySelectorAll('#student-grades-body tr');
        searchTerm = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const studentId = row.cells[0].textContent.toLowerCase();
            const studentName = row.cells[1].textContent.toLowerCase();
            
            if (studentId.includes(searchTerm) || studentName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    filterByGradeRange(range) {
        const rows = document.querySelectorAll('#student-grades-body tr');
        
        rows.forEach(row => {
            const score = parseFloat(row.cells[5].textContent);
            let shouldShow = true;
            
            switch(range) {
                case '90-100':
                    shouldShow = score >= 90;
                    break;
                case '80-89':
                    shouldShow = score >= 80 && score < 90;
                    break;
                case '60-79':
                    shouldShow = score >= 60 && score < 80;
                    break;
                case '0-59':
                    shouldShow = score < 60;
                    break;
            }
            
            row.style.display = shouldShow ? '' : 'none';
        });
    }
    
    closeDetailModal() {
        document.getElementById('grade-detail-modal').style.display = 'none';
        this.currentCourseDetail = null;
    }
    
    async approveCourse(courseId) {
        if (!confirm(`确定要审核通过课程 ${courseId} 的成绩吗？`)) {
            return;
        }
        
        try {
            await this.app.fetchWithAuth(`/grades/approve`, {
                method: 'POST',
                body: JSON.stringify({ course_id: courseId })
            });
            
            this.app.showSuccess('成绩审核通过');
            this.closeDetailModal();
            this.loadGradeReviews();
            
        } catch (error) {
            this.app.showError('审核失败: ' + error.message);
        }
    }
    
    async rejectCourse(courseId) {
        const reason = prompt('请输入退回修改的理由：');
        if (!reason) return;
        
        try {
            await this.app.fetchWithAuth(`/grades/reject`, {
                method: 'POST',
                body: JSON.stringify({ 
                    course_id: courseId,
                    reason: reason 
                })
            });
            
            this.app.showSuccess('成绩已退回修改');
            this.closeDetailModal();
            this.loadGradeReviews();
            
        } catch (error) {
            this.app.showError('退回失败: ' + error.message);
        }
    }
    
    async batchApprove() {
        if (this.selectedCourses.size === 0) {
            this.app.showError('请先选择要审核的课程');
            return;
        }
        
        if (!confirm(`确定要批量审核通过 ${this.selectedCourses.size} 个课程的成绩吗？`)) {
            return;
        }
        
        try {
            const courseIds = Array.from(this.selectedCourses);
            await this.app.fetchWithAuth(`/grades/batch-approve`, {
                method: 'POST',
                body: JSON.stringify({ course_ids: courseIds })
            });
            
            this.app.showSuccess(`已成功审核通过 ${courseIds.length} 个课程的成绩`);
            this.clearSelection();
            this.loadGradeReviews();
            
        } catch (error) {
            this.app.showError('批量审核失败: ' + error.message);
        }
    }
    
    async batchReject() {
        if (this.selectedCourses.size === 0) {
            this.app.showError('请先选择要退回的课程');
            return;
        }
        
        const reason = prompt('请输入退回修改的理由（将应用于所有选中的课程）：');
        if (!reason) return;
        
        if (!confirm(`确定要批量退回 ${this.selectedCourses.size} 个课程的成绩吗？`)) {
            return;
        }
        
        try {
            const courseIds = Array.from(this.selectedCourses);
            await this.app.fetchWithAuth(`/grades/batch-reject`, {
                method: 'POST',
                body: JSON.stringify({ 
                    course_ids: courseIds,
                    reason: reason 
                })
            });
            
            this.app.showSuccess(`已成功退回 ${courseIds.length} 个课程的成绩`);
            this.clearSelection();
            this.loadGradeReviews();
            
        } catch (error) {
            this.app.showError('批量退回失败: ' + error.message);
        }
    }
}

// 成绩发布管理类
class GradePublishManager {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 0;
        this.totalPages = 0;
        this.currentFilters = {};
        this.selectedCourses = new Set();
        this.pendingPublish = null;
    }
    
    init() {
        console.log('[GradePublishManager] init called');
        this.loadPublishList();
        this.initEvents();
    }
    
    initEvents() {
        // 刷新按钮
        document.getElementById('refresh-publish-btn')?.addEventListener('click', () => {
            this.loadPublishList();
        });
        
        // 搜索输入
        document.getElementById('search-publish-course')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value || undefined;
            this.currentPage = 1;
            this.loadPublishList();
        });
        
        // 学期筛选
        document.getElementById('filter-publish-semester')?.addEventListener('change', (e) => {
            this.currentFilters.semester = e.target.value || undefined;
            this.currentPage = 1;
            this.loadPublishList();
        });
        
        // 状态筛选
        document.getElementById('filter-publish-status')?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value || undefined;
            this.currentPage = 1;
            this.loadPublishList();
        });
        
        // 全选复选框
        document.getElementById('select-all-publish')?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const checkboxes = document.querySelectorAll('.publish-checkbox');
            
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const courseId = cb.value;
                if (isChecked) {
                    this.selectedCourses.add(courseId);
                } else {
                    this.selectedCourses.delete(courseId);
                }
            });
            
            this.togglePublishBatchActions();
        });
        
        // 批量发布按钮
        document.getElementById('batch-publish-btn')?.addEventListener('click', () => {
            this.showBatchPublishConfirm();
        });
        
        // 取消批量选择
        document.getElementById('cancel-publish-batch')?.addEventListener('click', () => {
            this.clearPublishSelection();
        });
        
        // 确认发布按钮
        document.getElementById('confirm-publish-btn')?.addEventListener('click', () => {
            this.confirmPublish();
        });
        
        // 分页按钮事件委托
        document.getElementById('publish-pagination')?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'BUTTON') {
                const page = parseInt(target.dataset.page);
                if (!isNaN(page) && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadPublishList();
                }
            }
        });
    }
    
    async loadPublishList() {
        const loading = document.getElementById('publish-loading');
        const empty = document.getElementById('publish-empty');
        const tableBody = document.getElementById('grade-publish-body');
        
        if (!loading || !empty || !tableBody) {
            console.warn('[GradePublishManager] required DOM elements missing', {
                hasLoading: !!loading,
                hasEmpty: !!empty,
                hasTableBody: !!tableBody
            });
            return;
        }

        console.log('[GradePublishManager] loadPublishList start');
        loading.style.display = 'flex';
        empty.style.display = 'none';
        tableBody.innerHTML = '';
        this.selectedCourses.clear();
        this.togglePublishBatchActions();
        
        try {
            // 从后端获取所有已通过审核的课程成绩（可能已发布也可能未发布）
            const data = await this.app.fetchWithAuth('/grades/publish-list');

            let filtered = Array.isArray(data) ? data.slice() : [];
            const search = (this.currentFilters.search || '').toLowerCase();
            const semester = this.currentFilters.semester || '';
            const status = this.currentFilters.status || '';

            if (search) {
                filtered = filtered.filter(item => {
                    const name = (item.course_name || '').toLowerCase();
                    const code = (item.course_code || '').toLowerCase();
                    return name.includes(search) || code.includes(search);
                });
            }

            if (semester) {
                filtered = filtered.filter(item => item.semester === semester);
            }

            if (status) {
                filtered = filtered.filter(item => item.status === status);
            }

            this.totalItems = filtered.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;

            if (!filtered || filtered.length === 0) {
                loading.style.display = 'none';
                empty.style.display = 'block';
                return;
            }
            
            // 当前页切片
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

            // 渲染表格
            pageItems.forEach((item) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="publish-checkbox" value="${item.course_id}" 
                               ${item.status !== 'approved' ? 'disabled' : ''}>
                    </td>
                    <td>
                        <div style="font-weight: 600;">${item.course_name}</div>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 3px;">
                            课程编号: ${item.course_code}
                        </div>
                    </td>
                    <td>${item.semester}</td>
                    <td>
                        <span class="status-badge ${this.getPublishStatusClass(item.status)}">
                            ${this.getPublishStatusText(item.status)}
                        </span>
                    </td>
                    <td>${item.reviewed_at || '未审核'}</td>
                    <td class="actions-cell">
                        ${item.status === 'approved' ? `
                            <button class="btn btn-sm btn-primary" onclick="gradePublishManager.publishSingle(${item.course_id})">
                                <i class="fas fa-paper-plane"></i> 发布
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline" disabled>
                                <i class="fas fa-clock"></i> 等待审核
                            </button>
                        `}
                        <button class="btn btn-sm btn-outline" onclick="gradePublishManager.viewPublishDetails(${item.course_id})">
                            <i class="fas fa-eye"></i> 查看
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // 绑定复选框事件
            document.querySelectorAll('.publish-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const courseId = e.target.value;
                    if (e.target.checked) {
                        this.selectedCourses.add(courseId);
                    } else {
                        this.selectedCourses.delete(courseId);
                    }
                    this.updatePublishSelectAllCheckbox();
                    this.togglePublishBatchActions();
                });
            });
            
            loading.style.display = 'none';
            this.renderPublishPagination();
            
        } catch (error) {
            loading.style.display = 'none';
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> 加载失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
    
    // 之前的 getMockPublishData 已废弃，改为从后端获取真实数据
    
    getPublishStatusClass(status) {
        switch(status) {
            case 'pending_review': return 'status-warning';
            case 'approved': return 'status-success';
            case 'published': return 'status-primary';
            case 'rejected': return 'status-danger';
            default: return 'status-secondary';
        }
    }
    
    getPublishStatusText(status) {
        switch(status) {
            case 'pending_review': return '待审核';
            case 'approved': return '已审核';
            case 'published': return '已发布';
            case 'rejected': return '已退回';
            default: return status;
        }
    }
    
    renderPublishPagination() {
        const pagination = document.getElementById('publish-pagination');
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一页按钮
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // 页码按钮
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }
        
        // 下一页按钮
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // 页面信息
        html += `
            <div class="page-info">
                第 ${this.currentPage} 页，共 ${this.totalPages} 页，共 ${this.totalItems} 条记录
            </div>
        `;
        
        pagination.innerHTML = html;
    }
    
    updatePublishSelectAllCheckbox() {
        const selectAll = document.getElementById('select-all-publish');
        if (!selectAll) return;
        
        const checkboxes = document.querySelectorAll('.publish-checkbox:not(:disabled)');
        const checkedCount = document.querySelectorAll('.publish-checkbox:checked').length;
        
        selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
        selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }
    
    togglePublishBatchActions() {
        const batchActions = document.getElementById('publish-batch-actions');
        if (!batchActions) return;
        
        if (this.selectedCourses.size > 0) {
            batchActions.style.display = 'block';
        } else {
            batchActions.style.display = 'none';
        }
    }
    
    clearPublishSelection() {
        this.selectedCourses.clear();
        document.querySelectorAll('.publish-checkbox').forEach(cb => {
            cb.checked = false;
        });
        const selectAll = document.getElementById('select-all-publish');
        if (selectAll) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        }
        this.togglePublishBatchActions();
    }
    
    async publishSingle(courseId) {
        this.pendingPublish = { type: 'single', courseIds: [courseId] };
        this.showConfirmModal();
    }
    
    showBatchPublishConfirm() {
        if (this.selectedCourses.size === 0) {
            this.app.showError('请先选择要发布的课程');
            return;
        }
        
        this.pendingPublish = { 
            type: 'batch', 
            courseIds: Array.from(this.selectedCourses) 
        };
        this.showConfirmModal();
    }
    
    showConfirmModal() {
        const modal = document.getElementById('publish-confirm-modal');
        const title = document.getElementById('confirm-title');
        const text = document.getElementById('confirm-text');

        if (!modal || !title || !text || !this.pendingPublish) {
            return;
        }
        
        if (this.pendingPublish.type === 'single') {
            title.textContent = '发布单个课程成绩';
            text.textContent = `确定要发布课程 ${this.pendingPublish.courseIds[0]} 的成绩吗？`;
        } else {
            title.textContent = '批量发布课程成绩';
            text.textContent = `确定要发布 ${this.pendingPublish.courseIds.length} 个课程的成绩吗？`;
        }

        modal.style.display = 'block';
    }
    
    closeConfirmModal() {
        document.getElementById('publish-confirm-modal').style.display = 'none';
        this.pendingPublish = null;
    }
    async confirmPublish() {
        if (!this.pendingPublish) return;
        
        try {
            const result = await this.app.fetchWithAuth('/grades/publish', {
                method: 'POST',
                body: JSON.stringify({ 
                    course_ids: this.pendingPublish.courseIds 
                })
            });
            
            const message = this.pendingPublish.type === 'single' 
                ? '成绩发布成功' 
                : `已成功发布 ${this.pendingPublish.courseIds.length} 个课程的成绩`;
            
            this.app.showSuccess(message);
            this.closeConfirmModal();
            this.clearPublishSelection();
            this.loadPublishList();
            
        } catch (error) {
            this.app.showError('发布失败: ' + error.message);
        }
    }
    
    async viewPublishDetails(courseId) {
        // 查看发布详情
        this.app.showAlert('查看详情功能开发中...', 'info');
    }
}

// 添加页面事件初始化
EduAdminApp.prototype.initGradeReviewEvents = function() {
    this.gradeReviewManager = new GradeReviewManager(this);
    this.gradeReviewManager.init();
    // 供成绩审核页面中的内联 onclick 使用
    window.gradeReviewManager = this.gradeReviewManager;
};

EduAdminApp.prototype.initGradePublishEvents = function() {
    this.gradePublishManager = new GradePublishManager(this);
    this.gradePublishManager.init();
    // 供成绩发布页面中的内联 onclick 使用
    window.gradePublishManager = this.gradePublishManager;
};

// 添加到全局
window.GradeReviewManager = GradeReviewManager;
window.GradePublishManager = GradePublishManager;