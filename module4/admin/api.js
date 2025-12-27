// 简易前端 API 客户端（用于教学管理端）
// 使用方法：在页面中调用 api.get/post/put/del(path, body)
// 默认基准路径为 /api/v1，可通过 window.API_BASE 覆盖
(function(window){
  const API_BASE = window.API_BASE || 'http://127.0.0.1:8000/api/v1';
  if(window.location.protocol === 'file:'){
    console.warn('当前通过 file:// 打开页面，fetch 跨域请求可能失败。建议通过本地静态服务器访问页面（例如 Live Server 或 python -m http.server）。');
  }
  function authHeader(){
    const t = localStorage.getItem('token');
    return t? { 'Authorization': 'Bearer ' + t } : {};
  }

  async function request(method, path, body){
    const headers = Object.assign({'Content-Type':'application/json'}, authHeader());
    const opts = { method, headers, credentials: 'same-origin' };
    if(body) opts.body = JSON.stringify(body);
    let res;
    try{
      res = await fetch(API_BASE + path, opts);
    }catch(networkErr){
      const err = new Error('网络错误：无法连接到后端。请确认后端已启动并允许跨域。');
      err.cause = networkErr; throw err;
    }
    if(res.status === 204) return null;
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if(contentType.includes('application/json')){
      data = await res.json();
    }else{
      data = await res.text();
    }
    if(!res.ok){ const msg = (data && data.error && data.error.message) ? data.error.message : (data && data.message) ? data.message : (typeof data === 'string' ? data : (res.status + ' ' + res.statusText)); const err = new Error(msg); err.status = res.status; err.body = data; throw err }
    return data;
  }

  window.api = {
    get: (p)=> request('GET', p),
    post: (p,b)=> request('POST', p, b),
    put: (p,b)=> request('PUT', p, b),
    del: (p)=> request('DELETE', p),
    // 便捷资源方法（基于项目 API 设计文档）
    resources: {
      courses: {
        list: (q)=> request('GET', `/courses${q?('?'+q):''}`),
        get: (id)=> request('GET', `/courses/${id}`),
        create: (body)=> request('POST', '/courses', body),
        update: (id, body)=> request('PUT', `/courses/${id}`, body),
        delete: (id)=> request('DELETE', `/courses/${id}`)
      },
      students: {
        list: (q)=> request('GET', `/students${q?('?'+q):''}`),
        get: (id)=> request('GET', `/students/${id}`),
        create: (body)=> request('POST', '/students', body),
        update: (id, body)=> request('PUT', `/students/${id}`, body),
        delete: (id)=> request('DELETE', `/students/${id}`)
      },
      teachers: {
        list: (q)=> request('GET', `/teachers${q?('?'+q):''}`),
        create: (body)=> request('POST', '/teachers', body),
        update: (id, body)=> request('PUT', `/teachers/${id}`, body),
        delete: (id)=> request('DELETE', `/teachers/${id}`)
      },
      classes: {
        list: (q)=> request('GET', `/classes${q?('?'+q):''}`),
        create: (body)=> request('POST', '/classes', body),
        update: (id, body)=> request('PUT', `/classes/${id}`, body),
        delete: (id)=> request('DELETE', `/classes/${id}`)
      },
      classrooms: {
        list: (q)=> request('GET', `/classrooms${q?('?'+q):''}`),
        create: (body)=> request('POST', '/classrooms', body),
        update: (id, body)=> request('PUT', `/classrooms/${id}`, body),
        delete: (id)=> request('DELETE', `/classrooms/${id}`)
      },
      teachingAssignments: {
        list: (q)=> request('GET', `/teaching-assignments${q?('?'+q):''}`),
        create: (body)=> request('POST', '/teaching-assignments', body)
      },
      courseSchedules: {
        list: (q)=> request('GET', `/course-schedules${q?('?'+q):''}`),
        create: (body)=> request('POST', '/course-schedules', body)
      },
      grades: {
        pendingReview: ()=> request('GET', '/grades/pending-review'),
        publish: (body)=> request('POST', '/grades/publish', body)
      }
    },
    // 文件上传：批量创建学生（multipart/form-data）
    upload: {
      batchCreateStudents: async (file) => {
        if(!file) throw new Error('缺少文件');
        const url = API_BASE + '/users/batch-create-students';
        const form = new FormData(); form.append('file', file);
        const headers = authHeader();
        let res;
        try{
          res = await fetch(url, { method: 'POST', headers: headers, body: form, credentials: 'same-origin' });
        }catch(err){ const e = new Error('网络错误：无法上传文件'); e.cause = err; throw e }
        const ct = res.headers.get('content-type') || '';
        let data = null;
        if(ct.includes('application/json')) data = await res.json(); else data = await res.text();
        if(!res.ok){ const msg = (data && data.error && data.error.message) ? data.error.message : (data && data.message) ? data.message : (typeof data === 'string' ? data : (res.status + ' ' + res.statusText)); const err = new Error(msg); err.status = res.status; err.body = data; throw err }
        return data;
      }
    }
  };
})(window);

// 本地变更支持：在后端不持久化时，记录客户端变更并合并到列表显示
(function(window){
  const LS_PREFIX = 'local_changes_';
  function keyFor(resource){ return LS_PREFIX + resource }
  function loadOps(resource){ try{ const s = localStorage.getItem(keyFor(resource)); return s? JSON.parse(s): [] }catch(e){ return [] } }
  function saveOps(resource, ops){ localStorage.setItem(keyFor(resource), JSON.stringify(ops)) }
  // op: 'create'|'update'|'delete'
  function saveLocalChange(resource, op, item){ const ops = loadOps(resource); ops.push({op, item, ts: Date.now()}); saveOps(resource, ops) }
  // 合并服务器items与本地ops，返回新数组
  function mergeLocal(resource, serverItems){ const ops = loadOps(resource); const map = new Map();
    // index by id when possible, otherwise preserve server order
    (Array.isArray(serverItems)? serverItems: []).forEach(it=>{ if(it && it.id!=null) map.set(String(it.id), Object.assign({}, it)) });
    ops.forEach(entry=>{
      const op = entry.op; const it = entry.item || {};
      if(op === 'create'){
        // avoid duplicate id
        if(it && it.id!=null){ if(!map.has(String(it.id))) map.set(String(it.id), it); }
        else {
          // generate temp id key
          const tempId = 't_' + entry.ts;
          map.set(tempId, Object.assign({}, it, { _temp: true, id: tempId }));
        }
      }else if(op === 'update'){
        if(it && it.id!=null && map.has(String(it.id))){ const prev = map.get(String(it.id)); map.set(String(it.id), Object.assign({}, prev, it)); }
      }else if(op === 'delete'){
        if(it && it.id!=null) map.delete(String(it.id));
      }
    });
    return Array.from(map.values());
  }

  window.apiLocal = {
    saveLocalChange,
    mergeLocal,
    loadOps,
    clearLocal: (resource)=>{ localStorage.removeItem(keyFor(resource)) }
  };
})(window);
