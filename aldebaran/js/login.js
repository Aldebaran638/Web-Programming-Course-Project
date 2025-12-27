    // 返回首页按钮
    function bindBackToHome() {
        const btn = document.getElementById('back-to-home-btn');
        if (btn) {
            btn.onclick = function(e) {
                e.preventDefault();
                // 兼容主页面动态加载
                if (typeof loadHome === 'function') {
                    loadHome();
                } else if (window.location) {
                    window.location.reload();
                }
            };
        }
    }
(function() {
    const apiLogin = 'http://localhost:8000/api/v1/auth/login';
    const apiForgot = 'http://localhost:8000/api/v1/auth/forgot-password';

    function showMessage(msg, isError = false) {
        const el = document.getElementById('login-message');
        if (el) {
            el.textContent = msg;
            el.style.color = isError ? '#c00' : '#2d4373';
        }
    }

    function showForgotMessage(msg, isError = false) {
        const el = document.getElementById('forgot-message');
        if (el) {
            el.textContent = msg;
            el.style.color = isError ? '#c00' : '#2d4373';
        }
    }


    function bindLoginForm() {
        const form = document.getElementById('login-form');
        if (!form) return;
        form.onsubmit = function(e) {
            e.preventDefault();
            showMessage('');
            const username = form.username.value.trim();
            const password = form.password.value;
            fetch(apiLogin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json().then(data => ({ status: res.status, data })))
            .then(({ status, data }) => {
                if (status === 200) {
                    // 登录成功：保存凭证并跳转到学生门户首页
                    if (data && data.token && data.user) {
                        try {
                            localStorage.setItem('token', data.token);
                            localStorage.setItem('user', JSON.stringify(data.user));
                        } catch (e) {
                            console.warn('无法写入本地登录凭证:', e);
                        }
                    }
                    showMessage('登录成功，欢迎 ' + data.user.username + '！');
                    // 跳转到学生端门户主页
                    window.location.href = '../Student-Portal/index.html';
                } else if (status === 401) {
                    showMessage(data.error?.message || '用户名或密码错误', true);
                } else if (status === 423) {
                    showMessage(data.error?.message || '账户被锁定', true);
                } else {
                    showMessage('登录失败，请重试', true);
                }
            })
            .catch(() => showMessage('网络错误，请稍后重试', true));
        };
    }

    function bindForgotPassword() {
        const loginPanel = document.getElementById('login-panel');
        const forgotPanel = document.getElementById('forgot-password-panel');
        const btn = document.getElementById('forgot-password-btn');
        const backBtn = document.getElementById('back-to-login-btn');
        if (btn && loginPanel && forgotPanel) {
            btn.onclick = function() {
                loginPanel.style.display = 'none';
                forgotPanel.style.display = '';
            };
        }
        if (backBtn && loginPanel && forgotPanel) {
            backBtn.onclick = function() {
                forgotPanel.style.display = 'none';
                loginPanel.style.display = '';
            };
        }
        const forgotForm = document.getElementById('forgot-form');
        if (forgotForm) {
            forgotForm.onsubmit = function(e) {
                e.preventDefault();
                showForgotMessage('');
                const email = forgotForm.email.value.trim();
                fetch(apiForgot, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                })
                .then(res => res.json().then(data => ({ status: res.status, data })))
                .then(({ status, data }) => {
                    if (status === 200) {
                        showForgotMessage(data.message || '重置邮件已发送，请查收邮箱');
                    } else {
                        showForgotMessage(data.error?.message || '请求失败', true);
                    }
                })
                .catch(() => showForgotMessage('网络错误，请稍后重试', true));
            };
        }
    }

    function initLoginPage() {
        bindLoginForm();
        bindForgotPassword();
        bindBackToHome();
    }

    window.initLoginPage = initLoginPage;
})();
