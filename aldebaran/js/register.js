(function() {
    const apiDevRegister = 'http://localhost:8000/api/v1/dev/register';

    function showRegisterMessage(msg, isError = false) {
        const el = document.getElementById('register-message');
        if (el) {
            el.textContent = msg;
            el.style.color = isError ? '#c00' : '#2d4373';
        }
    }

    function bindRoleExtraFields() {
        const roleSelect = document.getElementById('reg-role');
        const studentExtra = document.getElementById('student-extra');
        const teacherExtra = document.getElementById('teacher-extra');
        if (!roleSelect) return;

        function updateVisibility() {
            const role = roleSelect.value;
            if (role === 'student') {
                studentExtra.style.display = '';
                teacherExtra.style.display = 'none';
            } else if (role === 'teacher') {
                studentExtra.style.display = 'none';
                teacherExtra.style.display = '';
            } else {
                studentExtra.style.display = 'none';
                teacherExtra.style.display = 'none';
            }
        }

        roleSelect.addEventListener('change', updateVisibility);
        updateVisibility();
    }

    function bindRegisterForm() {
        const form = document.getElementById('dev-register-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showRegisterMessage('');

            const payload = {
                username: document.getElementById('reg-username').value.trim(),
                password: document.getElementById('reg-password').value,
                email: document.getElementById('reg-email').value.trim(),
                role: document.getElementById('reg-role').value,
                full_name: document.getElementById('reg-fullname').value.trim() || null,
                student_id_number: document.getElementById('reg-student-id')?.value.trim() || null,
                class_id: document.getElementById('reg-class-id')?.value ? Number(document.getElementById('reg-class-id').value) : null,
                teacher_id_number: document.getElementById('reg-teacher-id')?.value.trim() || null,
                title: document.getElementById('reg-title')?.value.trim() || null,
            };

            if (!payload.username || !payload.password || !payload.email) {
                showRegisterMessage('用户名、密码和邮箱为必填项', true);
                return;
            }

            fetch(apiDevRegister, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json().then(data => ({ status: res.status, data })))
            .then(({ status, data }) => {
                if (status === 200) {
                    showRegisterMessage(data.message || '注册成功（开发模式）');
                } else {
                    const msg = data?.error?.message || '注册失败，请检查输入信息';
                    showRegisterMessage(msg, true);
                }
            })
            .catch(() => {
                showRegisterMessage('网络错误，请稍后重试', true);
            });
        });
    }

    function bindBackToHome() {
        const btn = document.getElementById('back-to-home-btn');
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

    function initRegisterPage() {
        bindBackToHome();
        bindRoleExtraFields();
        bindRegisterForm();
    }

    window.initRegisterPage = initRegisterPage;
})();
