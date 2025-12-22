// 登录 / 忘记 / 重置 密码逻辑（依赖 api.js 提供的 login/forgotPassword/resetPassword）
(function(){
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  if(loginForm){
    loginForm.addEventListener('submit', async function(e){
      e.preventDefault(); loginMsg.textContent = '';
      const fd = new FormData(loginForm);
      const username = fd.get('username'); const password = fd.get('password');
      try{
        const data = await login(String(username), String(password));
        loginMsg.textContent = '登录成功，角色：' + (data.user && data.user.role);
        setTimeout(function(){ location.href = 'index.html' }, 800);
      }catch(err){
        loginMsg.textContent = '登录失败：' + ((err && err.message) || '用户名或密码错误');
      }
    });
  }

  const forgotForm = document.getElementById('forgot-form');
  const forgotMsg = document.getElementById('forgot-msg');
  if(forgotForm){
    forgotForm.addEventListener('submit', async function(e){
      e.preventDefault(); forgotMsg.textContent = '';
      const fd = new FormData(forgotForm); const email = fd.get('email');
      try{
        const data = await forgotPassword(String(email));
        forgotMsg.textContent = data.message || '已发送，请检查邮箱';
      }catch(err){ forgotMsg.textContent = '提交失败：' + ((err && err.message) || '服务器错误'); }
    });
  }

  const resetForm = document.getElementById('reset-form');
  const resetMsg = document.getElementById('reset-msg');
  if(resetForm){
    resetForm.addEventListener('submit', async function(e){
      e.preventDefault(); resetMsg.textContent = '';
      const fd = new FormData(resetForm);
      const token = fd.get('token'); const new_password = fd.get('new_password');
      try{
        const data = await resetPassword(String(token), String(new_password));
        resetMsg.textContent = data.message || '重置成功';
      }catch(err){ resetMsg.textContent = '重置失败：' + ((err && err.message) || '令牌无效或已过期'); }
    });
  }
})();
