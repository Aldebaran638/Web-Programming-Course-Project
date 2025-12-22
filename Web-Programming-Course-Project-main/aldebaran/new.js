document.getElementById('assignmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseId = document.getElementById('courseId').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const deadline = document.getElementById('deadline').value;
    const type = document.getElementById('type').value;
    const fileInput = document.getElementById('file');
    const resultDiv = document.getElementById('result');

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
            headers: {
                'Content-Type': 'application/json'
            },
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
        const resp = await fetch(`http://127.0.0.1:8000/api/v1/assignments/${assignmentId}/submissions`);
        if (resp.ok) {
            const data = await resp.json();
            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.textContent = '暂无提交记录。';
                resultDiv.className = 'result';
                return;
            }
            resultDiv.textContent = `共 ${data.length} 条提交记录：`;
            resultDiv.className = 'result success';
            // 构建表格
            let html = '<table class="submission-table">';
            html += '<tr><th>提交ID</th><th>学生ID</th><th>学生姓名</th><th>提交时间</th><th>状态</th><th>分数</th></tr>';
            for (const item of data) {
                html += `<tr>` +
                    `<td>${item.submission_id}</td>` +
                    `<td>${item.student?.id ?? ''}</td>` +
                    `<td>${item.student?.full_name ?? ''}</td>` +
                    `<td>${item.submitted_at ? new Date(item.submitted_at).toLocaleString('zh-CN') : ''}</td>` +
                    `<td class="status-${item.status}">${item.status === 'graded' ? '已评分' : '待评分'}</td>` +
                    `<td>${item.score !== undefined && item.score !== null ? item.score : '-'}</td>` +
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
        const resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.textContent = '暂无授课任务。';
                resultDiv.className = 'result';
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
    const courseId = document.getElementById('materialCourseId').value.trim();
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
            body: formData
        });
        if (resp.status === 201) {
            const data = await resp.json();
            resultDiv.textContent = `资料上传成功！ID: ${data.id}, 路径: ${data.file_path_or_content}`;
            resultDiv.className = 'result success';
            document.getElementById('materialUploadForm').reset();
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
            headers: {
                'Content-Type': 'application/json'
            },
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
            headers: {
                'Content-Type': 'application/json'
            },
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
            headers: {
                'Content-Type': 'application/json'
            },
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
