// 管理员批量创建学生逻辑（依赖 api.js 提供的 batchCreateStudents）
(function(){
  const form = document.getElementById('batch-form');
  const result = document.getElementById('batch-result');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault(); result.textContent = '';
    const file = form.querySelector('input[type=file]').files[0];
    if(!file){ result.textContent = '请选择文件'; return }
    try{
      const data = await batchCreateStudents(file);
      const summary = data.summary || {}; const details = data.details || [];
      let txt = `总数：${summary.total} \n创建：${summary.created} \n失败：${summary.failed} \n已存在：${summary.existing}\n\n`;
      txt += details.map(d=> `学号：${d.student_id_number} · 状态：${d.status} · ${d.message||''}`).join('\n');
      result.textContent = txt;
    }catch(err){ result.textContent = '导入失败：' + ((err && err.message) || '服务器错误/无权限'); }
  });
})();
