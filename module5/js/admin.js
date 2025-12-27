// 精简版前端管理脚本：直接使用绝对后端地址，保留基本请求方法
const DEFAULT_API_BASE = (window && window.API_FULL_BACKEND_URL ? window.API_FULL_BACKEND_URL : 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

function getApiBase(){ return DEFAULT_API_BASE; }

const apiClient = (function(){
  const BASE = getApiBase();
  const authHeader = ()=>{ const t = localStorage.getItem('token'); return t? {'Authorization':'Bearer '+t} : {} };

  async function request(path, opts={}){
    const url = path.startsWith('http') ? path : (BASE + path);
    const headers = Object.assign({'Accept':'application/json'}, opts.headers || {}, authHeader());
    const cfg = Object.assign({}, opts, {headers, credentials: 'same-origin'});
    let res;
    try{ res = await fetch(url, cfg); }catch(e){ throw new Error('网络错误：无法连接到后端'); }
    if (!res.ok){ const text = await res.text().catch(()=>null); throw new Error(res.status + (text?(' - '+text):'')); }
    const ct = res.headers.get('content-type')||'';
    if (ct.includes('application/json')) return res.json(); return res.text();
  }

  return {
    get: (p)=> request(p),
    post: (p,b)=> b instanceof FormData ? request(p, {method:'POST', body:b}) : request(p, {method:'POST', body: JSON.stringify(b), headers:{'Content-Type':'application/json'}}),
    put: (p,b)=> request(p, {method:'PUT', body: JSON.stringify(b), headers:{'Content-Type':'application/json'}}),
    del: (p)=> request(p, {method:'DELETE'}),
    upload: (p, form)=> request(p, {method:'POST', body: form})
  };
})();

// 页面初始化入口
document.addEventListener('DOMContentLoaded', ()=>{
  if (location.pathname.endsWith('/logs.html')) initLogs();
  if (location.pathname.endsWith('/backup.html')) initBackup();
});

// 日志页面逻辑（使用 /api/v1/logs）
async function initLogs(){
  const tbody = document.querySelector('#logs-table tbody');
  const btnSearch = document.getElementById('btn-search');
  const btnClear = document.getElementById('btn-clear');
  let page = 1, pageSize = 20;

  const load = async ()=>{
    const user = document.getElementById('filter-user').value.trim();
    const action = document.getElementById('filter-action').value.trim();
    const from = document.getElementById('filter-from').value || '';
    const to = document.getElementById('filter-to').value || '';
    try{
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('pageSize', pageSize);
      if (action) params.set('action', action);
      if (from) params.set('start_date', from);
      if (to) params.set('end_date', to);
      // 如果用户输入纯数字，尝试作为 user_id，否则作为 username（后端可忽略未支持的参数）
      if (user){
        if (/^\d+$/.test(user)) params.set('user_id', user);
        else params.set('username', user);
      }
      let data = null;
      try{
        data = await apiClient.get('/logs?'+params.toString());
      }catch(err){
        // 可能的原因：前端页面通过 file:// 打开，或反向代理未生效，导致相对路径 /api/v1/logs 返回 404
        // 尝试回退到本地后端默认地址（开发环境），或使用全局配置的 API_FULL_BACKEND_URL
        const fallbackBase = (window && window.API_FULL_BACKEND_URL) ? window.API_FULL_BACKEND_URL.replace(/\/$/, '') : 'http://127.0.0.1:8000/api/v1';
        const fallbackUrl = fallbackBase.replace(/\/$/, '') + '/logs?'+params.toString();
        try{
          const headers = localStorage.getItem('token')? {'Authorization':'Bearer '+localStorage.getItem('token')} : {};
          const res = await fetch(fallbackUrl, {method:'GET', headers, credentials: 'same-origin'});
          if (!res.ok) throw new Error('HTTP '+res.status);
          const ct = res.headers.get('content-type')||'';
          if (ct.includes('application/json')) data = await res.json();
          else data = await res.text();
        }catch(err2){
          throw err; // 继续抛出原始错误，交由外层 catch 处理
        }
      }
      tbody.innerHTML='';
      const items = data.logs || data.items || [];
      if (!items.length) tbody.innerHTML = '<tr><td colspan="5">无日志记录</td></tr>';
      items.forEach(r=>{
        const tr = document.createElement('tr');
        const time = r.created_at || r.time || r.timestamp || '';
        const userDisplay = (r.user && (r.user.username || r.user.full_name)) || r.user || '';
        tr.innerHTML = `<td>${time}</td><td>${userDisplay}</td><td>${r.action||''}</td><td>${r.details||r.detail||r.target||''}</td><td>${r.ip_address||''}</td>`;
        tbody.appendChild(tr);
      });
      document.getElementById('page-info').textContent = `${data.pagination?data.pagination.currentPage:page}`;
    }catch(e){
      const msg = (e && e.message) ? e.message : '未知错误';
      tbody.innerHTML = `<tr><td colspan="5">加载失败：${msg}。若页面通过 file:// 打开，请将前端通过 HTTP 服务托管，或在控制台设置 window.API_BASE / window.API_FULL_BACKEND_URL 指向后端。</td></tr>`;
    }
  }

  document.getElementById('prev').addEventListener('click', ()=>{ if (page>1){page--; load();}});
  document.getElementById('next').addEventListener('click', ()=>{page++; load();});
  btnSearch.addEventListener('click', ()=>{page=1; load();});
  btnClear.addEventListener('click', ()=>{document.getElementById('filter-user').value='';document.getElementById('filter-action').value='';document.getElementById('filter-from').value='';document.getElementById('filter-to').value='';page=1; load();});
  load();
}

// 备份页面逻辑（使用 /api/v1/system/backups 等）
async function initBackup(){
  const btnBackup = document.getElementById('btn-backup');
  const btnRestore = document.getElementById('btn-restore');
  const backupResult = document.getElementById('backup-result');
  const restoreResult = document.getElementById('restore-result');

  // 触发全系统备份（不传表参数，后台执行全库备份）
  btnBackup.addEventListener('click', async ()=>{
    try{
      btnBackup.disabled = true;
      backupResult.textContent = '正在触发备份任务...';
      backupResult.style.color = '#333';
      
      let resp = null;
      try{
        resp = await apiClient.post('/system/backups', {});
      }catch(err){
        // 在极少数静态环境下重试绝对后端地址
        const fallbackBase = (window && window.API_FULL_BACKEND_URL) ? window.API_FULL_BACKEND_URL.replace(/\/$/, '') : 'http://127.0.0.1:8000/api/v1';
        const headers = Object.assign(
          {'Content-Type':'application/json'}, 
          (localStorage.getItem('token')? {'Authorization':'Bearer '+localStorage.getItem('token')} : {})
        );
        const r = await fetch(fallbackBase + '/system/backups', {
          method:'POST', 
          body: JSON.stringify({}), 
          headers
        });
        if (!r.ok) throw new Error('HTTP '+r.status);
        resp = await r.json();
      }
      
      if (resp && resp.task_id){
        backupResult.textContent = `备份任务已触发，任务ID: ${resp.task_id}`;
        backupResult.style.color = 'green';
      }else if (resp && resp.message){
        backupResult.textContent = `备份任务: ${resp.message}`;
        backupResult.style.color = 'green';
      }else{
        backupResult.textContent = '备份任务已触发（后台处理）。';
        backupResult.style.color = 'green';
      }
    }catch(e){ 
      backupResult.textContent = '备份失败：'+e.message;
      backupResult.style.color = 'red';
    }
    btnBackup.disabled = false;
  });

  // 软删除恢复功能
  btnRestore.addEventListener('click', async ()=>{
    const resourceType = document.getElementById('resource-type').value.trim();
    const resourceId = document.getElementById('resource-id').value.trim();
    
    if (!resourceType) {
      restoreResult.textContent = '请填写资源类型';
      restoreResult.style.color = 'red';
      return;
    }
    
    if (!resourceId) {
      restoreResult.textContent = '请填写记录ID';
      restoreResult.style.color = 'red';
      return;
    }
    
    // 确认操作
    if (!confirm(`确定要恢复 ${resourceType} ID:${resourceId} 的记录吗？`)) {
      return;
    }
    
    btnRestore.disabled = true;
    restoreResult.textContent = '正在恢复...';
    restoreResult.style.color = '#333';
    
    try{
      let resp = null;
      try{
        resp = await apiClient.post(`/${resourceType}/${resourceId}/restore`);
      }catch(err){
        const msg = err && err.message ? err.message : '';
        // 尝试回退到绝对后端地址
        const fallbackBase = (window && window.API_FULL_BACKEND_URL) ? window.API_FULL_BACKEND_URL.replace(/\/$/, '') : 'http://127.0.0.1:8000/api/v1';
        const headers = Object.assign(
          {'Content-Type':'application/json'}, 
          (localStorage.getItem('token')? {'Authorization':'Bearer '+localStorage.getItem('token')} : {})
        );
        const r = await fetch(fallbackBase + `/${resourceType}/${resourceId}/restore`, {
          method:'POST', 
          headers
        });
        if (!r.ok) throw new Error('HTTP '+r.status);
        resp = await r.json();
      }
      
      if (resp && resp.message) {
        restoreResult.textContent = `恢复成功: ${resp.message}`;
        restoreResult.style.color = 'green';
      } else {
        restoreResult.textContent = '恢复成功';
        restoreResult.style.color = 'green';
      }
      
      // 清空表单
      document.getElementById('resource-type').value = '';
      document.getElementById('resource-id').value = '';
      
    }catch(err){ 
      restoreResult.textContent = '恢复失败：'+err.message;
      restoreResult.style.color = 'red';
    }
    btnRestore.disabled = false;
  });
}