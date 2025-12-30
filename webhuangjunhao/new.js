// 登录状态与角色检查：仅允许教师访问 new.html
try {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    if (!token || !userRaw) {
        // 无登录信息，一律回网关
        window.location.href = '../aldebaran/page.html';
    } else {
        let user = null;
        try { user = JSON.parse(userRaw); } catch (e) { user = null; }
        if (!user) {
            window.location.href = '../aldebaran/page.html';
        } else if (user.role !== 'teacher') {
            // 非教师角色：学生跳回学生端，其它回网关
            if (user.role === 'student') {
                window.location.href = '../Student-Portal/index.html';
            } else {
                window.location.href = '../aldebaran/page.html';
            }
        }
    }
} catch (e) {
    window.location.href = '../aldebaran/page.html';
}

function getAuthHeaders() {
    let token = null;
    try {
        token = localStorage.getItem('token');
    } catch (e) {
        token = null;
    }
    if (!token) {
        // 若在操作过程中 token 丢失，则退回网关
        try {
            window.location.href = '../aldebaran/page.html';
        } catch (e) {}
        return {};
    }
    return { 'Authorization': 'Bearer ' + token };
}

function clearAuth() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch (e) {}
}

// 绑定退出登录按钮（如果存在）
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = function() {
        clearAuth();
        window.location.href = '../aldebaran/page.html';
    };
}

document.getElementById('assignmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseId = document.getElementById('courseId').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const deadline = document.getElementById('deadline').value;
    const type = document.getElementById('type').value;
    const fileInput = document.getElementById('file');
    const resultDiv = document.getElementById('assignmentResult');

    if (!courseId || !title || !type) {
        resultDiv.textContent = '请填写所有必填项。';
        resultDiv.className = 'result error';
        return;
    }

    let payload = {
        title,
        type
    };
    if (description) payload.description = description;
    if (deadline) payload.deadline = new Date(deadline).toISOString();

    let filePath = '';
    if (fileInput.files.length > 0) {
        // 先上传附件，假设有单独的上传接口，或略过实现
        // 这里只做前端演示，实际应先上传文件再获取路径
        filePath = fileInput.files[0].name;
        payload.file_path = filePath;
    }

    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/assignments`, {
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify(payload)
        });
        if (resp.status === 201) {
            const data = await resp.json();
            resultDiv.textContent = `作业/考试创建成功！ID: ${data.id}`;
            resultDiv.className = 'result success';
            document.getElementById('assignmentForm').reset();
        } else {
            const err = await resp.json();
            resultDiv.textContent = err.detail?.error?.message || '创建失败，请检查输入或稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 查询作业/考试提交情况
document.getElementById('submissionQueryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const assignmentId = document.getElementById('assignmentId').value.trim();
    const resultDiv = document.getElementById('submissionResult');
    const tableWrapper = document.getElementById('submissionTableWrapper');
    resultDiv.textContent = '';
    tableWrapper.innerHTML = '';
    if (!assignmentId) {
        resultDiv.textContent = '请输入作业/考试ID。';
        resultDiv.className = 'result error';
        return;
    }
    resultDiv.textContent = '查询中...';
    resultDiv.className = 'result';
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/assignments/${assignmentId}/submissions`, {
            headers: getAuthHeaders()
        });
        if (resp.ok) {
            const data = await resp.json();
            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.textContent = '暂无提交记录。';
                resultDiv.className = 'result';
                return;
            }
            resultDiv.textContent = `共 ${data.length} 条提交记录：`;
            resultDiv.className = 'result success';
            // 构建表格：展示提交情况，并提供直接评分入口（只影响作业本身的分数）
            let html = '<table class="submission-table">';
            html += '<tr><th>提交ID</th><th>学生ID</th><th>学生姓名</th><th>提交时间</th><th>状态</th><th>当前分数</th><th>修改分数</th><th>操作</th></tr>';
            for (const item of data) {
                const currentScore = (item.score !== undefined && item.score !== null) ? item.score : '-';
                html += `<tr>` +
                    `<td>${item.submission_id}</td>` +
                    `<td>${item.student?.id ?? ''}</td>` +
                    `<td>${item.student?.full_name ?? ''}</td>` +
                    `<td>${item.submitted_at ? new Date(item.submitted_at).toLocaleString('zh-CN') : ''}</td>` +
                    `<td class="status-${item.status}">${item.status === 'graded' ? '已评分' : '待评分'}</td>` +
                    `<td>${currentScore}</td>` +
                    `<td><input type="number" step="0.1" min="0" max="100" value="${item.score ?? ''}" id="submission-score-${item.submission_id}" class="score-input" /></td>` +
                    `<td><button type="button" onclick="updateSubmissionScore(${item.submission_id})">保存</button></td>` +
                `</tr>`;
            }
            html += '</table>';
            tableWrapper.innerHTML = html;
        } else {
            resultDiv.textContent = '查询失败，请检查ID或稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (err) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 修改单条作业提交的成绩（仅影响 AssignmentSubmissions，不影响课程总评）
async function updateSubmissionScore(submissionId) {
    const resultDiv = document.getElementById('submissionResult');
    const input = document.getElementById(`submission-score-${submissionId}`);
    if (!input) return;

    const val = input.value.trim();
    if (val === '') {
        // 允许清空分数
        var scorePayload = null;
    } else {
        const num = parseFloat(val);
        if (isNaN(num)) {
            resultDiv.textContent = '分数必须为数字。';
            resultDiv.className = 'result error';
            return;
        }
        var scorePayload = num;
    }

    resultDiv.textContent = '保存中...';
    resultDiv.className = 'result';

    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/assignment-submissions/${submissionId}`, {
            method: 'PUT',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify({ score: scorePayload })
        });

        if (resp.ok) {
            const data = await resp.json();
            resultDiv.textContent = `作业成绩已更新，提交ID: ${data.submission_id}，分数: ${data.score ?? '-'}。`;
            resultDiv.className = 'result success';
            // 重新查询列表以刷新状态
            const form = document.getElementById('submissionQueryForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        } else {
            let msg = '保存失败，请稍后重试。';
            try {
                const err = await resp.json();
                if (err && err.detail) msg = typeof err.detail === 'string' ? err.detail : (err.detail.error?.message || msg);
            } catch (e) {}
            resultDiv.textContent = msg;
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
}


// 创建新课程
document.getElementById('createCourseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseCode = document.getElementById('newCourseCode').value.trim();
    const courseName = document.getElementById('newCourseName').value.trim();
    const credits = document.getElementById('newCourseCredits').value.trim();
    const semester = document.getElementById('newCourseSemester').value.trim();
    const prerequisites = document.getElementById('newCoursePrerequisites').value.trim();
    const description = document.getElementById('newCourseDescription').value.trim();
    const resultDiv = document.getElementById('createCourseResult');

    resultDiv.textContent = '';
    resultDiv.className = 'result';

    if (!courseCode || !courseName || !credits || !semester) {
        resultDiv.textContent = '请填写所有必填字段。';
        resultDiv.className = 'result error';
        return;
    }

    const creditsNum = parseFloat(credits);
    if (isNaN(creditsNum)) {
        resultDiv.textContent = '学分必须为数字。';
        resultDiv.className = 'result error';
        return;
    }

    resultDiv.textContent = '创建中...';
    resultDiv.className = 'result';

    const payload = {
        course_code: courseCode,
        course_name: courseName,
        credits: creditsNum,
        semester: semester,
    };
    if (prerequisites) payload.prerequisites = prerequisites;
    if (description) payload.description = description;

    try {
        const resp = await fetch('http://127.0.0.1:8000/api/v1/courses', {
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify(payload)
        });

        if (resp.status === 201) {
            const data = await resp.json();
            const c = data.course;
            const ta = data.teaching_assignment;
            resultDiv.textContent = `课程创建成功！课程ID: ${c.id}, 课程代码: ${c.course_code}, 授课任务ID: ${ta.id}, 学期: ${ta.semester}`;
            resultDiv.className = 'result success';
            document.getElementById('createCourseForm').reset();

            // 将新课程追加到“上传课程资料”的课程下拉框中
            const materialSelect = document.getElementById('materialCourseSelect');
            if (materialSelect) {
                // 如果当前还没有任何课程选项，只保留占位选项
                if (!materialSelect.querySelector(`option[value="${c.id}"]`)) {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = `${c.course_name || ''}（${c.course_code || ''}，${ta.semester}）`;
                    materialSelect.appendChild(opt);
                }
                // 默认选中新课程并加载其资料列表
                materialSelect.value = c.id;
                loadCourseMaterials(c.id);
            }

            // 可选：自动刷新授课列表，便于老师立即看到新课程
            const form = document.getElementById('teachingAssignmentsForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        } else {
            let msg = '创建失败，请检查输入或稍后重试。';
            try {
                const err = await resp.json();
                if (err && err.detail) {
                    msg = typeof err.detail === 'string' ? err.detail : (err.detail.error?.message || msg);
                }
            } catch (e) {}
            resultDiv.textContent = msg;
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 获取教师授课列表
document.getElementById('teachingAssignmentsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const semester = document.getElementById('semester').value.trim();
    const resultDiv = document.getElementById('teachingAssignmentsResult');
    const tableWrapper = document.getElementById('teachingAssignmentsTableWrapper');
    resultDiv.textContent = '';
    tableWrapper.innerHTML = '';
    let url = 'http://127.0.0.1:8000/api/v1/me/teaching-assignments';
    if (semester) {
        url += `?semester=${encodeURIComponent(semester)}`;
    }
    resultDiv.textContent = '查询中...';
    resultDiv.className = 'result';
    try {
        const resp = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (resp.ok) {
            const data = await resp.json();
            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.textContent = '暂无授课任务。';
                resultDiv.className = 'result';
                // 若授课任务为空，清空资料上传下拉框
                const materialSelect = document.getElementById('materialCourseSelect');
                if (materialSelect) {
                    materialSelect.innerHTML = '<option value="">暂无课程</option>';
                }
                return;
            }
            resultDiv.textContent = `共 ${data.length} 门课程：`;
            resultDiv.className = 'result success';
            // 构建表格
            let html = '<table class="teaching-table">';
            html += '<tr><th>授课任务ID</th><th>学期</th><th>课程ID</th><th>课程代码</th><th>课程名称</th></tr>';
            for (const item of data) {
                html += `<tr>` +
                    `<td>${item.teaching_assignment_id}</td>` +
                    `<td>${item.semester}</td>` +
                    `<td>${item.course?.id ?? ''}</td>` +
                    `<td>${item.course?.course_code ?? ''}</td>` +
                    `<td>${item.course?.course_name ?? ''}</td>` +
                `</tr>`;
            }
            html += '</table>';
            tableWrapper.innerHTML = html;

            // 同步更新“上传课程资料”的课程下拉框
            const materialSelect = document.getElementById('materialCourseSelect');
            if (materialSelect) {
                materialSelect.innerHTML = '<option value="">请选择课程</option>';
                for (const item of data) {
                    const c = item.course || {};
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = `${c.course_name || ''}（${c.course_code || ''}，${item.semester}）`;
                    materialSelect.appendChild(opt);
                }
                // 若之前没有选中课程，则默认选中第一门并加载资料
                if (!materialSelect.value && data[0]?.course?.id) {
                    materialSelect.value = data[0].course.id;
                    loadCourseMaterials(data[0].course.id);
                } else if (materialSelect.value) {
                    // 若已有选中课程，则刷新其资料列表
                    loadCourseMaterials(materialSelect.value);
                }
            }
        } else {
            resultDiv.textContent = '查询失败，请稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (err) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 上传课程资料
document.getElementById('materialUploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseSelect = document.getElementById('materialCourseSelect');
    const courseId = courseSelect ? (courseSelect.value || '').trim() : document.getElementById('materialCourseId').value.trim();
    const materialType = document.getElementById('materialType').value;
    const title = document.getElementById('materialTitle').value.trim();
    const fileInput = document.getElementById('materialFile');
    const displayOrder = document.getElementById('displayOrder').value.trim();
    const resultDiv = document.getElementById('materialUploadResult');
    resultDiv.textContent = '';
    if (!courseId || !materialType || !title || fileInput.files.length === 0) {
        resultDiv.textContent = '请填写所有必填项并选择文件。';
        resultDiv.className = 'result error';
        return;
    }
    resultDiv.textContent = '上传中...';
    resultDiv.className = 'result';
    const formData = new FormData();
    formData.append('material_type', materialType);
    formData.append('title', title);
    formData.append('file', fileInput.files[0]);
    if (displayOrder) formData.append('display_order', displayOrder);
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/materials`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        if (resp.status === 201) {
            const data = await resp.json();
            resultDiv.textContent = `资料上传成功！名称: ${data.title}`;
            resultDiv.className = 'result success';
            document.getElementById('materialUploadForm').reset();
            if (courseSelect) {
                // 保持当前课程选择不变
                courseSelect.value = courseId;
            }

            // 刷新资料卡片列表
            if (courseId) {
                loadCourseMaterials(courseId);
            }
        } else {
            const err = await resp.json();
            resultDiv.textContent = err.detail?.error?.message || '上传失败，请检查输入或稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});

// 当课程下拉框变更时，加载对应课程的资料列表
const materialCourseSelectEl = document.getElementById('materialCourseSelect');
if (materialCourseSelectEl) {
    materialCourseSelectEl.addEventListener('change', function() {
        const cid = this.value;
        if (cid) {
            loadCourseMaterials(cid);
        } else {
            const cardsContainer = document.getElementById('materialCards');
            if (cardsContainer) cardsContainer.innerHTML = '';
        }
    });
}


// 加载某课程的资料列表并渲染为卡片
async function loadCourseMaterials(courseId) {
    const cardsContainer = document.getElementById('materialCards');
    const resultDiv = document.getElementById('materialUploadResult');
    if (!cardsContainer) return;
    cardsContainer.innerHTML = '';
    if (!courseId) return;

    resultDiv.textContent = '加载资料列表中...';
    resultDiv.className = 'result';

    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/materials`, {
            headers: getAuthHeaders()
        });
        if (!resp.ok) {
            resultDiv.textContent = '加载资料列表失败，请稍后重试。';
            resultDiv.className = 'result error';
            return;
        }
        const list = await resp.json();
        if (!Array.isArray(list) || list.length === 0) {
            cardsContainer.innerHTML = '<p>当前课程暂无资料。</p>';
            resultDiv.textContent = '';
            resultDiv.className = 'result';
            return;
        }

        const fragments = document.createDocumentFragment();
        for (const item of list) {
            const card = document.createElement('div');
            card.className = 'material-card';

            const title = document.createElement('h4');
            title.textContent = item.title || '(未命名资料)';
            card.appendChild(title);

            const meta = document.createElement('p');
            const uploader = item.uploader_name || '未知上传者';
            const createdAt = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '';
            let sizeText = '';
            if (typeof item.file_size === 'number') {
                const kb = item.file_size / 1024;
                if (kb < 1024) {
                    sizeText = `${kb.toFixed(1)} KB`;
                } else {
                    sizeText = `${(kb / 1024).toFixed(2)} MB`;
                }
            }
            meta.textContent = `上传者：${uploader}  |  上传时间：${createdAt}  |  大小：${sizeText || '未知'}`;
            card.appendChild(meta);

            if (item.file_path_or_content) {
                const link = document.createElement('a');
                link.href = item.file_path_or_content;
                link.textContent = '下载/查看';
                link.target = '_blank';
                card.appendChild(link);
            }

            const actions = document.createElement('div');
            actions.className = 'material-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.textContent = '编辑';
            editBtn.onclick = () => editMaterialTitle(item.id, item.title, courseId);

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.textContent = '撤回';
            deleteBtn.onclick = () => deleteMaterial(item.id, courseId);

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            card.appendChild(actions);

            fragments.appendChild(card);
        }

        cardsContainer.appendChild(fragments);
        resultDiv.textContent = '';
        resultDiv.className = 'result';
    } catch (error) {
        resultDiv.textContent = '加载资料列表失败，请稍后重试。';
        resultDiv.className = 'result error';
    }
}


// 编辑资料标题
async function editMaterialTitle(id, currentTitle, courseId) {
    const newTitle = window.prompt('请输入新的资料标题：', currentTitle || '');
    if (newTitle === null) return; // 取消
    const trimmed = newTitle.trim();
    if (!trimmed) {
        alert('标题不能为空。');
        return;
    }

    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/course-materials/${id}`, {
            method: 'PATCH',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify({ title: trimmed })
        });
        if (resp.ok) {
            loadCourseMaterials(courseId);
        } else {
            let msg = '编辑失败，请稍后重试。';
            try {
                const err = await resp.json();
                if (err && err.detail) msg = typeof err.detail === 'string' ? err.detail : (err.detail.error?.message || msg);
            } catch (e) {}
            alert(msg);
        }
    } catch (error) {
        alert('网络错误，请稍后重试。');
    }
}


// 撤回资料
async function deleteMaterial(id, courseId) {
    if (!window.confirm('确定要撤回该资料吗？撤回后学生将无法再访问。')) return;
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/course-materials/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (resp.ok || resp.status === 204) {
            loadCourseMaterials(courseId);
        } else {
            let msg = '撤回失败，请稍后重试。';
            try {
                const err = await resp.json();
                if (err && err.detail) msg = typeof err.detail === 'string' ? err.detail : (err.detail.error?.message || msg);
            } catch (e) {}
            alert(msg);
        }
    } catch (error) {
        alert('网络错误，请稍后重试。');
    }
}


// 更新课程配置
document.getElementById('courseConfigForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseId = document.getElementById('configCourseId').value.trim();
    const description = document.getElementById('configDescription').value.trim();
    const allowComments = document.getElementById('allowComments').value === 'true';
    const allowNotes = document.getElementById('allowNotes').value === 'true';
    const resultDiv = document.getElementById('courseConfigResult');
    resultDiv.textContent = '';
    if (!courseId) {
        resultDiv.textContent = '请填写课程ID。';
        resultDiv.className = 'result error';
        return;
    }
    resultDiv.textContent = '更新中...';
    resultDiv.className = 'result';
    let payload = {
        allow_comments: allowComments,
        allow_notes: allowNotes
    };
    if (description) payload.description = description;
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/config`, {
            method: 'PATCH',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify(payload)
        });
        if (resp.ok) {
            const data = await resp.json();
            resultDiv.textContent = `配置更新成功！课程ID: ${data.course_id}`;
            resultDiv.className = 'result success';
            document.getElementById('courseConfigForm').reset();
        } else {
            const err = await resp.json();
            resultDiv.textContent = err.detail?.error?.message || '更新失败，请检查输入或稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 设置成绩组成项
document.getElementById('gradeItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseId = document.getElementById('gradeCourseId').value.trim();
    const itemName = document.getElementById('itemName').value.trim();
    const weight = document.getElementById('weight').value.trim();
    const description = document.getElementById('gradeDescription').value.trim();
    const resultDiv = document.getElementById('gradeItemResult');
    resultDiv.textContent = '';
    if (!courseId || !itemName || !weight) {
        resultDiv.textContent = '请填写所有必填项。';
        resultDiv.className = 'result error';
        return;
    }
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 0 || weightNum > 1) {
        resultDiv.textContent = '权重必须在0.00到1.00之间。';
        resultDiv.className = 'result error';
        return;
    }
    resultDiv.textContent = '提交中...';
    resultDiv.className = 'result';
    let payload = {
        item_name: itemName,
        weight: weightNum
    };
    if (description) payload.description = description;
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/grade-items`, {
            method: 'POST',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify(payload)
        });
        if (resp.status === 201) {
            const data = await resp.json();
            resultDiv.textContent = `成绩项添加成功！ID: ${data.id}, 名称: ${data.item_name}, 权重: ${data.weight}`;
            resultDiv.className = 'result success';
            document.getElementById('gradeItemForm').reset();
        } else {
            const err = await resp.json();
            resultDiv.textContent = err.detail?.error?.message || '添加失败，可能是权重超限或输入有误。';
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 录入/修改单个成绩
document.getElementById('updateGradeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const gradeId = document.getElementById('gradeId').value.trim();
    const score = document.getElementById('score').value.trim();
    const resultDiv = document.getElementById('updateGradeResult');
    resultDiv.textContent = '';
    if (!gradeId || !score) {
        resultDiv.textContent = '请填写所有必填项。';
        resultDiv.className = 'result error';
        return;
    }
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum)) {
        resultDiv.textContent = '分数必须为数字。';
        resultDiv.className = 'result error';
        return;
    }
    resultDiv.textContent = '提交中...';
    resultDiv.className = 'result';
    let payload = { score: scoreNum };
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/grades/${gradeId}`, {
            method: 'PUT',
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, getAuthHeaders()),
            body: JSON.stringify(payload)
        });
        if (resp.ok) {
            const data = await resp.json();
            resultDiv.textContent = `成绩录入/修改成功！成绩ID: ${data.id}, 分数: ${data.score}`;
            resultDiv.className = 'result success';
            document.getElementById('updateGradeForm').reset();
        } else {
            const err = await resp.json();
            resultDiv.textContent = err.detail?.error?.message || '提交失败，请检查输入或稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});


// 批量导入成绩
document.getElementById('batchUploadGradesForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const itemId = document.getElementById('batchGradeItemId').value.trim();
    const fileInput = document.getElementById('batchGradesFile');
    const resultDiv = document.getElementById('batchUploadGradesResult');
    const detailsDiv = document.getElementById('batchUploadGradesDetails');
    resultDiv.textContent = '';
    detailsDiv.innerHTML = '';
    if (!itemId || fileInput.files.length === 0) {
        resultDiv.textContent = '请填写成绩项ID并选择文件。';
        resultDiv.className = 'result error';
        return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    resultDiv.textContent = '上传中...';
    resultDiv.className = 'result';
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/grade-items/${itemId}/grades/batch-upload`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        if (resp.ok) {
            const data = await resp.json();
            const summary = data.summary;
            resultDiv.textContent = `导入完成，总数: ${summary.total}，成功: ${summary.updated}，失败: ${summary.failed}`;
            resultDiv.className = 'result success';
            // 展示详情表格
            if (data.details && data.details.length > 0) {
                let html = '<table class="batch-upload-table"><thead><tr><th>学号</th><th>状态</th><th>说明</th></tr></thead><tbody>';
                for (const d of data.details) {
                    html += `<tr><td>${d.student_id_number}</td><td class="status-${d.status}">${d.status === 'failed' ? '失败' : '成功'}</td><td>${d.message || ''}</td></tr>`;
                }
                html += '</tbody></table>';
                detailsDiv.innerHTML = html;
            } else {
                detailsDiv.innerHTML = '';
            }
            document.getElementById('batchUploadGradesForm').reset();
        } else {
            const err = await resp.json();
            resultDiv.textContent = err.detail?.error?.message || '导入失败，请检查文件格式或稍后重试。';
            resultDiv.className = 'result error';
        }
    } catch (error) {
        resultDiv.textContent = '网络错误，请稍后重试。';
        resultDiv.className = 'result error';
    }
});
